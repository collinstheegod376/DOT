'use client';

import React from 'react';

interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

/**
 * Authentic SVG icons for Solana ecosystem tokens and major cryptocurrencies
 */
export function SolanaIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="solana-g1" x1="16.5" y1="17" x2="108.5" y2="35.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
        <linearGradient id="solana-g2" x1="16.5" y1="52.5" x2="108.5" y2="71" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
        <linearGradient id="solana-g3" x1="16.5" y1="88" x2="108.5" y2="106.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
      <path
        d="M23.5 19C24.3 17.5 25.8 16.5 27.5 16.5H116.5C118.6 16.5 119.8 18.8 118.6 20.6L104.5 39C103.7 40.5 102.2 41.5 100.5 41.5H11.5C9.4 41.5 8.2 39.2 9.4 37.4L23.5 19Z"
        fill="url(#solana-g1)"
      />
      <path
        d="M104.5 54.5C103.7 53 102.2 52 100.5 52H11.5C9.4 52 8.2 54.3 9.4 56.1L23.5 74.5C24.3 76 25.8 77 27.5 77H116.5C118.6 77 119.8 74.7 118.6 72.9L104.5 54.5Z"
        fill="url(#solana-g2)"
      />
      <path
        d="M23.5 90C24.3 88.5 25.8 87.5 27.5 87.5H116.5C118.6 87.5 119.8 89.8 118.6 91.6L104.5 110C103.7 111.5 102.2 112.5 100.5 112.5H11.5C9.4 112.5 8.2 110.2 9.4 108.4L23.5 90Z"
        fill="url(#solana-g3)"
      />
    </svg>
  );
}

export function BitcoinIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="16" fill="#F7931A" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22.8 13.5C23.2 11.2 21.6 9.8 19.1 9.1L19.8 6.2L18 5.8L17.3 8.6C16.8 8.5 16.3 8.4 15.9 8.3L16.6 5.4L14.8 5L14.1 7.9C13.7 7.8 13.3 7.7 12.9 7.6L12.9 7.5L10.5 6.9L10 8.9C10 8.9 11.3 9.2 11.2 9.2C11.9 9.4 12.1 9.8 12 10.3L10.5 16.2C10.6 16.2 10.7 16.3 10.8 16.3C10.7 16.3 10.6 16.2 10.5 16.2L8.4 24.6C8.3 24.9 8 25.2 7.4 25C7.5 25.1 6.2 24.8 6.2 24.8L5.3 27L7.6 27.6C8 27.7 8.5 27.8 8.9 27.9L8.2 30.8L10 31.2L10.7 28.4C11.2 28.5 11.7 28.6 12.1 28.7L11.4 31.6L13.2 32L13.9 29.2C17 29.8 19.3 29.4 20.6 26.8C21.6 24.7 21 23.4 19.5 22.6C20.6 22 21.3 20.8 21.6 19.1C21.9 17 21 15.6 19.3 14.8C20.6 14.4 22.5 14.7 22.8 13.5ZM17.4 21.4C16.9 23.6 13.3 22.5 12.2 22.2L13.1 18.5C14.2 18.8 18 19.2 17.4 21.4ZM18.2 15C17.7 16.9 14.6 16 13.6 15.7L14.4 12.5C15.4 12.7 18.7 13.2 18.2 15Z"
        fill="white"
      />
    </svg>
  );
}

export function UsdcIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="16" fill="#2775CA" />
      <circle cx="16" cy="16" r="12.5" stroke="white" strokeWidth="1.2" strokeOpacity="0.4" />
      <path
        d="M17.8 19.6C16.2 19.6 15.2 18.9 15.1 17.6H13C13.1 19.9 14.6 21.1 16.6 21.3V23H18.2V21.3C20.4 21 21.8 19.5 21.8 17.2C21.8 14.5 19.7 13.8 17.2 13.3C15.4 12.9 14.5 12.4 14.5 11.4C14.5 10.4 15.3 9.7 16.6 9.7C17.9 9.7 18.8 10.3 19 11.4H21C20.9 9.6 19.6 8.5 17.9 8.2V6.5H16.3V8.2C14.2 8.5 12.9 9.9 12.9 11.8C12.9 14.3 15 15.1 17.5 15.6C19.4 16 20.3 16.5 20.3 17.7C20.3 18.8 19.3 19.6 17.8 19.6Z"
        fill="white"
      />
    </svg>
  );
}

export function UsdtIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="16" fill="#26A17B" />
      <path
        d="M17.9 17.4C17.7 17.4 17.4 17.4 17.1 17.4C14.9 17.4 13.1 16.9 13.1 16.3C13.1 15.8 14.9 15.3 17.1 15.3C19.3 15.3 21.1 15.8 21.1 16.3C21.1 16.9 19.3 17.4 17.1 17.4M24.7 13.6C24.7 12.4 21.3 11.4 17.1 11.4C12.9 11.4 9.5 12.4 9.5 13.6C9.5 14.6 11.9 15.5 15.2 15.8V23.5H19V15.8C22.3 15.5 24.7 14.6 24.7 13.6Z"
        fill="white"
      />
      <path
        d="M17.1 9H11.5V11.2H15.8V11.3C12.4 11.4 9.8 12.4 9.8 13.5C9.8 14.6 12.4 15.5 15.8 15.7V22H18.4V15.7C21.8 15.5 24.4 14.6 24.4 13.5C24.4 12.4 21.8 11.4 18.4 11.3V11.2H22.7V9H17.1Z"
        fill="white"
        fillOpacity="0.3"
      />
    </svg>
  );
}

export function JupIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="16" fill="#141E28" />
      <defs>
        <linearGradient id="jup-grad" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F97316" />
          <stop offset="0.5" stopColor="#EAB308" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="12" fill="url(#jup-grad)" />
      <path
        d="M16 8C11.6 8 8 11.6 8 16C8 20.4 11.6 24 16 24C20.4 24 24 20.4 24 16C24 11.6 20.4 8 16 8ZM19.2 16.8C18.8 18.4 17.5 19.5 16 19.5C14.5 19.5 13.2 18.4 12.8 16.8C12.6 16.1 12.5 15.3 12.5 14.5H19.5C19.5 15.3 19.4 16.1 19.2 16.8Z"
        fill="#090E17"
      />
      <circle cx="14" cy="13" r="1.2" fill="#F8FAFC" />
      <circle cx="18" cy="13" r="1.2" fill="#F8FAFC" />
    </svg>
  );
}

export function RayIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="16" fill="#1A1C29" />
      <defs>
        <linearGradient id="ray-grad" x1="8" y1="8" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5E6BE4" />
          <stop offset="1" stopColor="#00F0FF" />
        </linearGradient>
      </defs>
      <path
        d="M16 6L24.5 14.5L16 23L7.5 14.5L16 6Z"
        stroke="url(#ray-grad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="14.5" r="3.5" fill="url(#ray-grad)" />
      <path d="M16 23V27M12 26L16 27L20 26" stroke="#5E6BE4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function BonkIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="16" fill="#F08E2D" />
      <path
        d="M9 13C8 10 10 8 11.5 9L13.5 11.5C14.3 11.2 15.1 11 16 11C16.9 11 17.7 11.2 18.5 11.5L20.5 9C22 8 24 10 23 13C23.8 14.2 24.2 15.6 24 17C23.6 21 20.2 24 16 24C11.8 24 8.4 21 8 17C7.8 15.6 8.2 14.2 9 13Z"
        fill="#FFE194"
      />
      <circle cx="13" cy="15" r="1.5" fill="#4A2800" />
      <circle cx="19" cy="15" r="1.5" fill="#4A2800" />
      <polygon points="16,17.5 14.5,19.5 17.5,19.5" fill="#E11D48" />
    </svg>
  );
}

export function EthIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="16" fill="#627EEA" />
      <path d="M16 4V13.87L22.66 16.87L16 4Z" fill="white" fillOpacity="0.6" />
      <path d="M16 4L9.33 16.87L16 13.87V4Z" fill="white" />
      <path d="M16 21.67V28L22.67 18.74L16 21.67Z" fill="white" fillOpacity="0.6" />
      <path d="M16 28V21.67L9.33 18.74L16 28Z" fill="white" />
      <path d="M16 20.27L22.66 16.87L16 13.87V20.27Z" fill="white" fillOpacity="0.2" />
      <path d="M9.33 16.87L16 20.27V13.87L9.33 16.87Z" fill="white" fillOpacity="0.6" />
    </svg>
  );
}

/**
 * Universal Token Icon component that selects the authentic SVG logo
 */
export function TokenIcon({ symbol, size = 24, className = '' }: TokenIconProps) {
  const s = symbol.toUpperCase();
  switch (s) {
    case 'SOL':
      return <SolanaIcon size={size} className={className} />;
    case 'BTC':
      return <BitcoinIcon size={size} className={className} />;
    case 'ETH':
      return <EthIcon size={size} className={className} />;
    case 'USDC':
      return <UsdcIcon size={size} className={className} />;
    case 'USDT':
      return <UsdtIcon size={size} className={className} />;
    case 'JUP':
      return <JupIcon size={size} className={className} />;
    case 'RAY':
      return <RayIcon size={size} className={className} />;
    case 'BONK':
      return <BonkIcon size={size} className={className} />;
    default:
      return (
        <div
          className={`rounded-full flex items-center justify-center font-bold text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0 ${className}`}
          style={{ width: size, height: size }}
        >
          {s.slice(0, 3)}
        </div>
      );
  }
}
