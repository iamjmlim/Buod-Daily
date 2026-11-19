// One interface for every AI provider, so switching is a settings change.
//   AI_PROVIDER=gemini   (default) needs GEMINI_API_KEY
//   AI_PROVIDER=github   uses GitHub Models with GITHUB_TOKEN (free, low limits)
// AI_FALLBACK_PROVIDER is tried when the main one is rate-limited or down.

export type ProviderName = 'gemini' | 'github';

export class AiError extends Error {
  readonly status: number | null;
  constructor(message: string, status: number | null = null) {
    super(message);
    this.status = status;
  }
  get isRateLimit() {
    return this.status === 429;
  }
  // Missing key (status 0), bad key, unknown model: retrying other stories won't help.
  get isConfigError() {
    return this.status !== null && [0, 400, 401, 403, 404].includes(this.status);
  }
}

export type AiRequest = { system: string; user: string };
export type AiResponse = { text: string; model: string; provider: ProviderName };

const TIMEOUT_MS = 60_000;

// Tried in order; the next model is used when one is overloaded, rate-limited or slow.
// "-latest" aliases follow Google's current models, so retirements don't break us.
function geminiModels(): string[] {
  const list = process.env.GEMINI_MODELS || 'gemini-flash-lite-latest,gemini-flash-latest';
  return list.split(',').map((m) => m.trim()).filter(Boolean);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Free-tier models are often briefly overloaded (HTTP 503), so we go through
// the model list twice with a short pause before giving up.
async function callGemini(req: AiRequest): Promise<AiResponse> {
  let lastError: AiError | null = null;
  for (let pass = 1; pass <= 2; pass++) {
    if (pass === 2) await sleep(8_000);
    for (const model of geminiModels()) {
      try {
        return await callGeminiModel(model, req);
      } catch (err) {
        const e = err instanceof AiError ? err : new AiError((err as Error).message);
        // Bad key or bad request: other models won't help either.
        if (e.status !== null && [0, 400, 401, 403].includes(e.status)) throw e;
        lastError = e;
        console.warn(`   gemini ${model} unavailable: ${e.message.replace(/\s+/g, ' ').slice(0, 100)}`);
      }
    }
  }
  throw lastError ?? new AiError('No Gemini models configured', 0);
}

async function callGeminiModel(model: string, req: AiRequest): Promise<AiResponse> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AiError('GEMINI_API_KEY is not set', 0);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: 'user', parts: [{ text: req.user }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  if (!res.ok) throw new AiError(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`, res.status);

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text) throw new AiError(`Gemini returned no text (finishReason: ${data.candidates?.[0]?.finishReason ?? 'none'})`);
  return { text, model, provider: 'gemini' };
}

async function callGithubModels(req: AiRequest): Promise<AiResponse> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new AiError('GITHUB_TOKEN is not set', 0);
  const model = process.env.GITHUB_MODEL || 'openai/gpt-4.1-mini';

  const res = await fetch('https://models.github.ai/inference/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: req.system },
        { role: 'user', content: req.user },
      ],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new AiError(`GitHub Models HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`, res.status);

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content ?? '';
  if (!text) throw new AiError('GitHub Models returned no text');
  return { text, model, provider: 'github' };
}

const CALLERS: Record<ProviderName, (req: AiRequest) => Promise<AiResponse>> = {
  gemini: callGemini,
  github: callGithubModels,
};

function parseProvider(value: string | undefined): ProviderName | null {
  return value === 'gemini' || value === 'github' ? value : null;
}

export function configuredProviders(): ProviderName[] {
  const main = parseProvider(process.env.AI_PROVIDER) ?? 'gemini';
  const fallback = parseProvider(process.env.AI_FALLBACK_PROVIDER);
  return fallback && fallback !== main ? [main, fallback] : [main];
}

export function callProvider(name: ProviderName, req: AiRequest): Promise<AiResponse> {
  return CALLERS[name](req);
}
