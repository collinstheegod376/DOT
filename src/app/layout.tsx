import type { Metadata, Viewport } from 'next';
import { DM_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { OfflineProvider } from '../components/offline/OfflineProvider';
import { ThemeProvider } from '../context/ThemeContext';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-dm-sans',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-mono',
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
    <html lang="en" className={`${dmSans.variable} ${ibmPlexMono.variable} dark h-full`} suppressHydrationWarning>
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
