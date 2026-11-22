// Renders the Facebook Page profile picture and cover photo in the site's
// newsprint style. Run: node brand/make-page-images.ts  (writes PNGs next to this file)

import { ImageResponse } from 'next/dist/compiled/@vercel/og/index.node.js'; // next/og's Node build
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const fonts = join(root, 'node_modules/@fontsource');
const serif = await readFile(join(fonts, 'newsreader/files/newsreader-latin-600-normal.woff'));
const sans = await readFile(join(fonts, 'geist-sans/files/geist-sans-latin-500-normal.woff'));
const sansBold = await readFile(join(fonts, 'geist-sans/files/geist-sans-latin-600-normal.woff'));

const PAPER = '#171a24'; // dark mode: deep ink background
const INK = '#f1ede4'; // warm newsprint white
const MUTED = '#b3ada2';
const BLUE = '#8db3ec'; // the site's dark-mode blue
const GOLD = '#e7b93f';
const GOLD_SOFT = '#3a3220';
const GOLD_INK = '#e7b93f';

type El = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: (El | string)[]): El => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.length === 1 ? children[0] : children },
});

const fontOptions = [
  { name: 'Newsreader', data: serif, style: 'normal' as const, weight: 600 as const },
  { name: 'Geist', data: sans, style: 'normal' as const, weight: 500 as const },
  { name: 'Geist', data: sansBold, style: 'normal' as const, weight: 600 as const },
];

async function render(el: El, width: number, height: number, file: string) {
  // ImageResponse takes a React element; plain {type, props} objects are what JSX compiles to.
  const res = new ImageResponse(el as never, { width, height, fonts: fontOptions });
  await writeFile(join(root, 'brand', file), Buffer.from(await res.arrayBuffer()));
  console.log(`wrote brand/${file} (${width}x${height})`);
}

const wordmark = (size: number) =>
  h(
    'div',
    { fontFamily: 'Newsreader', fontSize: size, fontWeight: 600, color: INK, letterSpacing: '-0.02em', lineHeight: 1 },
    'Buod',
    h('span', { color: BLUE }, '.'),
  );

const outletPill = (label: string, bars: number, scale = 1) =>
  h(
    'div',
    {
      alignItems: 'center',
      gap: 14 * scale,
      background: GOLD_SOFT,
      borderRadius: 999,
      padding: `${12 * scale}px ${26 * scale}px`,
      fontFamily: 'Geist',
      fontWeight: 600,
      fontSize: 28 * scale,
      color: INK,
    },
    h(
      'div',
      { gap: 5 * scale },
      ...Array.from({ length: bars }, () =>
        h('div', { width: 6 * scale, height: 26 * scale, borderRadius: 3 * scale, background: GOLD_INK }),
      ),
    ),
    label,
  );

// Profile picture: Facebook crops it to a circle and shows it as small as 40px,
// so it is just the wordmark, large and centred, with a gold rule under it.
const profile = h(
  'div',
  { width: '100%', height: '100%', background: PAPER, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 34 },
  wordmark(300),
  h('div', { width: 300, height: 22, borderRadius: 11, background: GOLD }),
);

// Cover photo: 1640x624. Facebook shows the full width on desktop but crops the
// sides on phones, and the profile picture overlaps the bottom-left on desktop,
// so everything important sits in the centre.
const cover = h(
  'div',
  { width: '100%', height: '100%', background: PAPER, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  h('div', { position: 'absolute', top: 0, left: 0, right: 0, height: 14, background: GOLD }),
  h(
    'div',
    { flexDirection: 'column', alignItems: 'center', gap: 22 },
    wordmark(150),
    h(
      'div',
      { fontFamily: 'Newsreader', fontSize: 52, fontWeight: 600, color: INK, letterSpacing: '-0.01em' },
      'Balita, buod na.',
    ),
    h('div', { fontFamily: 'Geist', fontWeight: 500, fontSize: 30, color: MUTED }, 'Philippine news, summarized. Sa Filipino at English.'),
    h(
      'div',
      { marginTop: 14, alignItems: 'center', gap: 22 },
      outletPill('Iniulat ng 3+ outlet', 3, 0.95),
      h('div', { fontFamily: 'Geist', fontWeight: 500, fontSize: 27, color: MUTED }, 'May link sa bawat orihinal na ulat'),
    ),
  ),
);

await render(profile, 1080, 1080, 'facebook-profile.png');
await render(cover, 1640, 624, 'facebook-cover.png');
