import localFont from 'next/font/local';

/**
 * Self-hosted Cairo (AR) and Inter (EN).
 *
 * The .woff2 files must be downloaded into /public/fonts/* before `next build`.
 * See README.md > "Fonts" for the one-line download script.
 *
 * We use `next/font/local` (not `next/font/google`) because some MENA networks
 * unreliably serve Google Fonts. Self-hosting also avoids CLS on first paint.
 */
export const cairo = localFont({
  src: [
    { path: '../public/fonts/cairo/Cairo-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/cairo/Cairo-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/cairo/Cairo-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/cairo/Cairo-ExtraBold.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-cairo',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

export const inter = localFont({
  src: [
    { path: '../public/fonts/inter/Inter-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/inter/Inter-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/inter/Inter-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/inter/Inter-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});
