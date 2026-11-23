// Renders the Buod Daily app icons: a "B." monogram (newsprint-white B, blue period)
// on the brand's deep ink, with the gold rule under it at larger sizes.
// Run: node brand/make-icons.ts
//
// Writes:
//   app/icon.png          512x512  site icon (Next adds <link rel="icon">)
//   app/apple-icon.png    180x180  iPhone/iPad home screen
//   app/favicon.ico       16/32/48 classic favicon (PNG-in-ICO)
//   public/icon-192.png, public/icon-512.png       for the web app manifest
//   public/icon-maskable-512.png                    Android adaptive icon (extra padding)
//   brand/icon-preview.png                          all sizes side by side, for review

import { ImageResponse } from 'next/dist/compiled/@vercel/og/index.node.js';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const serif = await readFile(join(root, 'node_modules/@fontsource/newsreader/files/newsreader-latin-600-normal.woff'));

const BG = '#171a24'; // deep ink (same as the Facebook images)
const INK = '#f1ede4'; // warm newsprint white
const BLUE = '#8db3ec';
const GOLD = '#e7b93f';

type El = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: (El | string)[]): El => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.length === 1 ? children[0] : children },
});

/** size: canvas px; scale: letter size relative to the canvas; radius: corner rounding (0 = square). */
function icon(size: number, scale: number, radius: number): El {
  const fs = Math.round(size * scale);
  const withRule = size >= 64; // the gold rule disappears into noise at favicon sizes
  return h(
    'div',
    { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: BG, borderRadius: radius },
    h(
      'div',
      { fontFamily: 'Newsreader', fontWeight: 600, fontSize: fs, lineHeight: 1, marginTop: withRule ? 0 : Math.round(fs * 0.08), color: INK },
      'B',
      h('span', { color: BLUE }, '.'),
    ),
    ...(withRule ? [h('div', { width: Math.round(fs * 0.62), height: Math.max(2, Math.round(fs * 0.07)), borderRadius: 99, background: GOLD, marginTop: Math.round(fs * 0.06) })] : []),
  );
}

async function png(el: El, size: number): Promise<Buffer> {
  const res = new ImageResponse(el as never, {
    width: size,
    height: size,
    fonts: [{ name: 'Newsreader', data: serif, style: 'normal', weight: 600 }],
  });
  return Buffer.from(await res.arrayBuffer());
}

async function save(path: string, data: Buffer) {
  await writeFile(join(root, path), data);
  console.log(`wrote ${path} (${data.length} bytes)`);
}

// ICO file holding PNG images (supported by every current browser).
function ico(images: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries: Buffer[] = [];
  let offset = 6 + 16 * images.length;
  for (const img of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(img.size >= 256 ? 0 : img.size, 0);
    e.writeUInt8(img.size >= 256 ? 0 : img.size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(img.data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += img.data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

await save('app/icon.png', await png(icon(512, 0.56, 112), 512));
await save('app/apple-icon.png', await png(icon(180, 0.56, 0), 180));
await save('public/icon-192.png', await png(icon(192, 0.56, 0), 192));
await save('public/icon-512.png', await png(icon(512, 0.56, 0), 512));
// Maskable: Android may crop to a circle, so the monogram stays inside the central 60%.
await save('public/icon-maskable-512.png', await png(icon(512, 0.4, 0), 512));

const small = await Promise.all([16, 32, 48].map(async (s) => ({ size: s, data: await png(icon(s, 0.72, Math.round(s * 0.2)), s) })));
await save('app/favicon.ico', ico(small));

const sizes = [16, 32, 48, 64, 128, 180];
const preview = h(
  'div',
  { width: '100%', height: '100%', background: '#f4f4f0', alignItems: 'center', justifyContent: 'center', gap: 36, padding: 40 },
  ...sizes.map((s) => h('div', { width: s, height: s }, icon(s, s <= 48 ? 0.72 : 0.56, Math.round(s * 0.22)))),
);
await save('brand/icon-preview.png', await png(preview, 760));
