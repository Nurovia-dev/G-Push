import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { themeInitScript } from '@/components/theme-toggle';

export const metadata: Metadata = {
  title: 'G-Push — ship code to GitHub in one shot',
  description:
    'Open-source web app for publishing projects to GitHub. Auth, file staging, secret scanning, license picking, README generation, and push — all in a guided wizard.',
  metadataBase: new URL('http://localhost:3000'),
  applicationName: 'G-Push',
  keywords: [
    'github',
    'git push',
    'code publishing',
    'open source',
    'wizard',
    'g-push',
    'nurovia',
  ],
  authors: [{ name: 'Nurovia', url: 'https://nurovia.io' }],
  creator: 'Nurovia',
  publisher: 'Nurovia',
  openGraph: {
    title: 'G-Push — ship code to GitHub in one shot',
    description: 'Ship code to GitHub in one shot. Open-source web app by Nurovia.',
    type: 'website',
    siteName: 'G-Push',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'G-Push — ship code to GitHub in one shot',
    description: 'Ship code to GitHub in one shot. Open-source web app by Nurovia.',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-64.png', sizes: '64x64', type: 'image/png' },
      { url: '/favicon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1117' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set theme class before React hydrates to prevent flash-of-wrong-theme */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen flex flex-col">
        {children}
        <Toaster theme="system" position="bottom-right" richColors />
      </body>
    </html>
  );
}