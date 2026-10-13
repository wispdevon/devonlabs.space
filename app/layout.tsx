import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const bodyFont = localFont({
  src: [{ path: '../public/fonts/inter-roman.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-workshop',
  display: 'swap'
});

const displayFont = localFont({
  src: '../public/fonts/space-grotesk-latin.woff2',
  variable: '--font-display',
  display: 'swap',
  weight: '300 700',
});

const siteUrl = process.env.SITE_URL || 'https://devonlabs.space';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Devon Labs — Wisp’s software, photography & experiments',
  description: 'Independent developer based in Thailand. Thoughtful software for photographs, self-hosted workflows, and the web.',
  applicationName: 'Devon Labs',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Devon Labs — Wisp’s software, photography & experiments',
    description: 'Photography tools, self-hosted workflows, and small things that make work easier.',
    url: siteUrl,
    siteName: 'Devon Labs',
    images: [{ url: '/developer/immichinko.webp', width: 1200, height: 750, alt: 'Immichinko by Devon Labs' }],
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Devon Labs',
    description: 'Independent software, photography tools, and self-hosted workflows by Wisp.'
  }
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f1eb' },
    { media: '(prefers-color-scheme: dark)', color: '#171421' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html suppressHydrationWarning lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: `(function(){var p;try{p=localStorage.getItem('devon-portfolio-theme')}catch(e){}document.documentElement.dataset.theme=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'})()` }} /></head>
      <body>{children}</body>
    </html>
  );
}
