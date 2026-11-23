import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getDictionary, isLocale } from '@/lib/i18n';

// Default share card for every page without its own (home, sections, about…).
// Story pages keep their own card with the headline.

export const alt = 'Buod Daily: Philippine news, summarized';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const fontDir = join(process.cwd(), 'node_modules/@fontsource');
const serif = readFile(join(fontDir, 'newsreader/files/newsreader-latin-600-normal.woff'));
const sans = readFile(join(fontDir, 'geist-sans/files/geist-sans-latin-600-normal.woff'));

const PAPER = '#faf7f0';
const INK = '#1d2230';
const MUTED = '#5c6070';
const BLUE = '#2f5bb7';
const GOLD = '#e7b93f';

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = getDictionary(isLocale(lang) ? lang : 'en');
  const blurb =
    lang === 'fil'
      ? 'Pinakamahalagang balita ng Pilipinas, binuod sa Filipino at English. May link sa bawat orihinal na ulat.'
      : 'The best-sourced Philippine news, summarized in Filipino and English, with links to every original report.';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: PAPER,
          padding: '64px 88px',
          fontFamily: 'Geist',
          color: INK,
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 12, background: GOLD, display: 'flex' }} />
        <div style={{ display: 'flex', fontFamily: 'Newsreader', fontSize: 150, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}>
          Buod<span style={{ color: BLUE }}>.</span>
        </div>
        <div style={{ display: 'flex', marginTop: 18, fontFamily: 'Newsreader', fontSize: 56, fontWeight: 600 }}>{t.tagline}</div>
        <div style={{ display: 'flex', marginTop: 26, fontSize: 30, color: MUTED, lineHeight: 1.35, maxWidth: 960 }}>{blurb}</div>
        <div style={{ display: 'flex', marginTop: 30, width: 220, height: 12, borderRadius: 6, background: GOLD }} />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Newsreader', data: await serif, style: 'normal', weight: 600 },
        { name: 'Geist', data: await sans, style: 'normal', weight: 600 },
      ],
    },
  );
}
