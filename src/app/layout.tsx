import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { OfflineProvider } from '../components/offline/OfflineProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DOT — Sovereign Cryptographic Vault',
  description: 'Dot holds no keys and runs no servers. Your funds, your device, your call.',
  manifest: '/manifest.json',
  icons: {
    icon: '/pwa-icon.png',
    apple: '/pwa-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DOT Vault',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full`}>
      <body className="crypto-grid min-h-full flex flex-col bg-[#0A0A0C] text-[#EDEDED] antialiased selection:bg-[#05F292]/20 selection:text-[#05F292]">
        <OfflineProvider>
          {children}
        </OfflineProvider>
      </body>
    </html>
  );
}
