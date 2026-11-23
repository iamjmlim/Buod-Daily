import type { MetadataRoute } from 'next';

// Lets phones "Add to Home screen" with the Buod Daily name and icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Buod Daily: Philippine news, summarized',
    short_name: 'Buod Daily',
    description: 'Balita, buod na. The best-sourced Philippine news, summarized in Filipino and English, with links to every original report.',
    start_url: '/',
    display: 'standalone',
    background_color: '#171a24',
    theme_color: '#171a24',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
