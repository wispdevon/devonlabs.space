import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const bodyFont = localFont({
  src: [{ path: '../public/fonts/inter-roman.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-workshop',
  display: 'swap'
});

const siteUrl = process.env.SITE_URL || 'https://devonlabs.space';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Devon Labs — Wisp’s software, photography & experiments',
  description: 'Explore Wisp’s world of software, photography, films, and hardware. An independent creative workshop in Thailand.',
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
  themeColor: '#ffffff'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={bodyFont.variable}>
      <body>{children}</body>
    </html>
  );
}
