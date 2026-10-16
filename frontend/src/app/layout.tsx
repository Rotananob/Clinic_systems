import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '../components/layout/AppShell';

export const metadata: Metadata = {
  title: 'ពេទ្យ ហួន វណ្ណៈ - ប្រព័ន្ធគ្រប់គ្រងគ្លីនិក (Houn Vannak Clinic)',
  description: 'Enterprise Clinic Management with Real-time KHQR Bridge and Local-First Offline Sync',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/icon-192.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ពេទ្យ ហួន វណ្ណៈ',
  },
};

export const viewport: Viewport = {
  themeColor: '#031c19',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans" suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
