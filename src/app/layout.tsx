import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { OfflineProvider } from '../components/offline/OfflineProvider';
import { ThemeProvider } from '../context/ThemeContext';

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
  themeColor: '#0B0B0F',
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full`} suppressHydrationWarning>
      <body className="crypto-grid min-h-full flex flex-col antialiased selection:bg-[#14F195]/20 selection:text-[#14F195]">
        <ThemeProvider>
          <OfflineProvider>
            {children}
          </OfflineProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
