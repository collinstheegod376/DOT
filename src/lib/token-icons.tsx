'use client';

import React from 'react';

export interface TokenIconProps {
  size?: number;
  className?: string;
  symbol?: string;
}

/**
 * Authentic Solana (SOL) Logo with Crisp 1:1 Circular Badge Geometry
 */
export function SolanaIcon({ size = 24, className = '' }: TokenIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Solana (SOL)"
    >
      <defs>
        <linearGradient id="sol-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14151E" />
          <stop offset="100%" stopColor="#0B0C12" />
        </linearGradient>
        <linearGradient id="sol-g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FFA3" />
          <stop offset="100%" stopColor="#DC1FFF" />
        </linearGradient>
        <linearGradient id="sol-g2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00FFA3" />
          <stop offset="100%" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="64" fill="url(#sol-bg)" />
      <circle cx="64" cy="64" r="63.5" stroke="#2B2D3F" strokeWidth="1" />
      {/* Top Bar */}
      <path
        d="M32 30c1.2-1.3 2.9-2 4.7-2h57.6c2.8 0 4.2 3.4 2.2 5.4l-12.5 12.6c-1.2 1.2-2.9 1.9-4.7 1.9H21.7c-2.8 0-4.2-3.4-2.2-5.4L32 30z"
        fill="url(#sol-g1)"
      />
      {/* Middle Bar */}
      <path
        d="M96 54.5c-1.2-1.3-2.9-2-4.7-2H33.7c-2.8 0-4.2 3.4-2.2 5.4l12.5 12.6c1.2 1.2 2.9 1.9 4.7 1.9h57.6c2.8 0 4.2-3.4 2.2-5.4L96 54.5z"
        fill="url(#sol-g2)"
      />
      {/* Bottom Bar */}
      <path
        d="M32 79c1.2-1.3 2.9-2 4.7-2h57.6c2.8 0 4.2 3.4 2.2 5.4l-12.5 12.6c-1.2 1.2-2.9 1.9-4.7 1.9H21.7c-2.8 0-4.2-3.4-2.2-5.4L32 79z"
        fill="url(#sol-g1)"
      />
    </svg>
  );
}

/**
 * Authentic USD Coin (USDC) Logo with Crisp 1:1 Circular Badge Geometry
 */
export function UsdcIcon({ size = 24, className = '' }: TokenIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="USD Coin (USDC)"
    >
      <circle cx="64" cy="64" r="64" fill="#2775CA" />
      <circle cx="64" cy="64" r="50" stroke="white" strokeWidth="5" strokeOpacity="0.35" />
      <path
        d="M66 38c-10.5 0-16.8 5.2-16.8 13.4 0 7.8 5.1 11.1 14.4 13.8l3.6 1.1c6.6 2 9.8 4.1 9.8 8.2 0 4.9-4.3 7.9-11 7.9-7.3 0-11.6-3.1-13.3-8.8h-7.3c1.7 9 8.5 14.4 18.7 15v6.4h5v-6.7c10-.7 17.3-6 17.3-14.4 0-8.5-5.7-12-15-14.5l-3.9-1.1c-6.1-1.8-8.9-3.9-8.9-7.5 0-4.3 3.7-7 9.6-7 6.3 0 9.9 2.6 11.4 7.5h7.3c-1.5-8.2-7.5-13.2-17.6-13.8V32h-5v6h1.7z"
        fill="white"
      />
    </svg>
  );
}

/**
 * Authentic Tether USD (USDT) Logo with Crisp 1:1 Circular Badge Geometry
 */
export function UsdtIcon({ size = 24, className = '' }: TokenIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Tether (USDT)"
    >
      <circle cx="64" cy="64" r="64" fill="#26A17B" />
      <path
        d="M74.8 54.3v-9.6h25.4v-15H27.8v15h25.4v9.6c-21.7 1-38 6.4-38 12.8s16.3 11.8 38 12.8v28.8h21.6V87.1c21.6-1 37.9-6.4 37.9-12.8s-16.3-11.8-37.9-12.8zm0 18.9c-1.3.1-6.7.4-10.8.4-4.8 0-9.7-.3-10.8-.4-15.8-.8-27.4-4.3-27.4-8.5s11.6-7.7 27.4-8.5v11.9c1.3.1 6.2.4 10.8.4 4.3 0 9.3-.3 10.8-.4V57.3c15.8.8 27.3 4.3 27.3 8.5s-11.5 7.6-27.3 8.4z"
        fill="white"
      />
    </svg>
  );
}

/**
 * Authentic Jupiter (JUP) Logo with Crisp 1:1 Circular Badge Geometry
 */
export function JupiterIcon({ size = 24, className = '' }: TokenIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Jupiter (JUP)"
    >
      <defs>
        <linearGradient id="jup-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#141E28" />
          <stop offset="100%" stopColor="#0B1017" />
        </linearGradient>
        <linearGradient id="jup-orbit-1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFA642" />
          <stop offset="50%" stopColor="#F95454" />
          <stop offset="100%" stopColor="#00E599" />
        </linearGradient>
        <linearGradient id="jup-orbit-2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF7A30" />
          <stop offset="60%" stopColor="#FFD338" />
          <stop offset="100%" stopColor="#2AE5A5" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="64" fill="url(#jup-bg)" />
      <path
        d="M106 58c-2.4-18.8-18.5-33.3-38.3-33.3-21.5 0-39 17.5-39 39 0 7.8 2.3 15.1 6.3 21.2-1.9 1.5-3.1 3.8-3.1 6.4 0 4.6 3.7 8.3 8.3 8.3 2.1 0 4-.8 5.5-2.1 6.3 3.6 13.6 5.6 21.4 5.6 20.3 0 37-15.5 38.8-35.4 3.4-1.3 5.8-4.6 5.8-8.5 0-3.6-2-6.7-5-8.2z"
        fill="none"
        stroke="url(#jup-orbit-1)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="64" cy="64" r="26" fill="url(#jup-orbit-2)" />
      <path
        d="M40.5 58c4.2-9.6 13.7-16.3 24.8-16.3 14 0 25.5 10.6 26.8 24.3-5.2 6.8-15.4 11.2-27.1 11.2-10.5 0-19.8-3.6-25-9.3.1-3.4.2-6.7.5-9.9z"
        fill="#13141F"
        fillOpacity="0.45"
      />
    </svg>
  );
}

/**
 * Authentic Raydium (RAY) Logo with Crisp 1:1 Circular Badge Geometry
 */
export function RaydiumIcon({ size = 24, className = '' }: TokenIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Raydium (RAY)"
    >
      <defs>
        <linearGradient id="ray-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0E1324" />
          <stop offset="100%" stopColor="#080B14" />
        </linearGradient>
        <linearGradient id="ray-cyan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
        <linearGradient id="ray-purple-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="64" fill="url(#ray-bg)" />
      <path
        d="M64 18L77.5 50.5L110 64L77.5 77.5L64 110L50.5 77.5L18 64L50.5 50.5L64 18Z"
        fill="url(#ray-cyan-grad)"
      />
      <path
        d="M64 36L72.5 55.5L92 64L72.5 72.5L64 92L55.5 72.5L36 64L55.5 55.5L64 36Z"
        fill="white"
        fillOpacity="0.88"
      />
      <circle cx="64" cy="64" r="7" fill="url(#ray-purple-grad)" />
    </svg>
  );
}

/**
 * Authentic Bonk (BONK) Logo with Crisp 1:1 Circular Badge Geometry
 */
export function BonkIcon({ size = 24, className = '' }: TokenIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Bonk (BONK)"
    >
      <defs>
        <linearGradient id="bonk-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFAA00" />
          <stop offset="100%" stopColor="#F57C00" />
        </linearGradient>
        <linearGradient id="bonk-fur" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFB347" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="64" fill="url(#bonk-gold)" />
      <circle cx="64" cy="64" r="58" fill="#F7941D" />
      <circle cx="64" cy="64" r="54" fill="#FFA500" stroke="#FFD700" strokeWidth="2" />
      <path d="M38 32L54 52H28L38 32Z" fill="#D35400" />
      <path d="M40 37L51 51H32L40 37Z" fill="#FAD7A0" />
      <path d="M90 32L100 52H74L90 32Z" fill="#D35400" />
      <path d="M88 37L96 51H77L88 37Z" fill="#FAD7A0" />
      <ellipse cx="64" cy="68" rx="36" ry="32" fill="url(#bonk-fur)" />
      <path
        d="M64 58C53 58 46 68 44 79C43 85 48 93 64 93C80 93 85 85 84 79C82 68 75 58 64 58Z"
        fill="#FFFDF0"
      />
      <ellipse cx="50" cy="63" rx="3.5" ry="5.5" fill="#2C3E50" />
      <circle cx="49" cy="61" r="1.5" fill="white" />
      <ellipse cx="78" cy="63" rx="3.5" ry="5.5" fill="#2C3E50" />
      <circle cx="77" cy="61" r="1.5" fill="white" />
      <polygon points="61,72 67,72 64,76" fill="#2C3E50" />
      <path
        d="M58 80C61 83 67 83 70 80"
        stroke="#2C3E50"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M61 81C61 85 64 88 67 85C67 83 67 81 61 81Z" fill="#FF6B6B" />
    </svg>
  );
}

/**
 * Authentic Bitcoin (BTC) Logo with Crisp 1:1 Circular Badge Geometry
 */
export function BitcoinIcon({ size = 24, className = '' }: TokenIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Bitcoin (BTC)"
    >
      <circle cx="64" cy="64" r="64" fill="#F7931A" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M91.2 54c1.6-9.2-4.8-14.8-14.8-17.6l2.8-11.6-7.2-1.6-2.8 11.2c-2-.4-4-.8-5.6-1.2l2.8-11.6-7.2-1.6-2.8 11.6c-1.6-.4-3.2-.8-4.8-1.2l-.1-.4-9.6-2.4-2 8c0 0 5.2 1.2 4.8 1.2 2.8.8 3.6 2.4 3.2 4.4L64 77.2c.4 0 .8.4 1.2.4-.4 0-.8-.4-1.2-.4L55.6 110.8c-.4 1.2-1.6 2.4-4 1.6.4.4-4.8-1.2-4.8-1.2l-3.6 8.8 9.2 2.4c1.6.4 3.6.8 5.2 1.2l-2.8 11.6 7.2 1.6 2.8-11.2c2 .4 4 .8 5.6 1.2l-2.8 11.6 7.2 1.6 2.8-11.2c12.4 2.4 21.6.8 26.8-9.6 4-8.4 1.6-13.6-4.4-16.8 4.4-2.4 7.2-7.2 8.4-14 1.2-8.4-2.4-14-9.2-17.2 5.2-1.6 12.8-.4 14-5.2zm-21.6 31.6c-2 8.8-16.4 4.4-20.8 3.2l3.6-14.8c4.4 1.2 19.6 2.8 17.2 11.6zm3.2-25.6c-2 7.6-14.4 4-18.4 2.8l3.2-12.8c4 1 17.2 2.8 15.2 10z"
        fill="white"
      />
    </svg>
  );
}

/**
 * Authentic Ethereum (ETH) Logo with Crisp 1:1 Circular Badge Geometry
 */
export function EthIcon({ size = 24, className = '' }: TokenIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Ethereum (ETH)"
    >
      <circle cx="64" cy="64" r="64" fill="#627EEA" />
      <path d="M64 16v39.48l26.64 12L64 16z" fill="white" fillOpacity="0.65" />
      <path d="M64 16L37.33 67.48 64 55.48V16z" fill="white" />
      <path d="M64 86.68v25.32l26.68-37.04L64 86.68z" fill="white" fillOpacity="0.65" />
      <path d="M64 112V86.68L37.33 74.96 64 112z" fill="white" />
      <path d="M64 81.08l26.64-13.6L64 55.48v25.6z" fill="white" fillOpacity="0.25" />
      <path d="M37.33 67.48L64 81.08V55.48l-26.67 12z" fill="white" fillOpacity="0.75" />
    </svg>
  );
}

/**
 * Authentic Pyth Network (PYTH) Logo with Crisp 1:1 Circular Badge Geometry
 */
export function PythIcon({ size = 24, className = '' }: TokenIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Pyth Network (PYTH)"
    >
      <defs>
        <linearGradient id="pyth-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E0E3D" />
          <stop offset="100%" stopColor="#0E051D" />
        </linearGradient>
        <linearGradient id="pyth-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E6DAFE" />
          <stop offset="50%" stopColor="#B388FF" />
          <stop offset="100%" stopColor="#7C4DFF" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="64" fill="url(#pyth-bg)" />
      <path
        d="M64 24L102 88H26L64 24Z"
        stroke="url(#pyth-grad)"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <circle cx="64" cy="24" r="7" fill="#E6DAFE" />
      <circle cx="102" cy="88" r="7" fill="#B388FF" />
      <circle cx="26" cy="88" r="7" fill="#7C4DFF" />
      <circle cx="64" cy="67" r="9" fill="#FFFFFF" />
      <path
        d="M64 31V60M32 84L58 71M96 84L70 71"
        stroke="url(#pyth-grad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Generic Fallback Token Icon with Crisp 1:1 Circular Badge Geometry
 */
export function GenericTokenIcon({
  symbol,
  size = 24,
  className = '',
}: TokenIconProps) {
  const display = (symbol || 'TKN').slice(0, 3).toUpperCase();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={symbol || 'Token'}
    >
      <circle cx="64" cy="64" r="64" fill="#1E2230" />
      <circle cx="64" cy="64" r="60" stroke="#333A4E" strokeWidth="4" />
      <text
        x="64"
        y="73"
        textAnchor="middle"
        fontSize="36"
        fontWeight="bold"
        fontFamily="monospace"
        fill="#94A3B8"
      >
        {display}
      </text>
    </svg>
  );
}

// Aliases for comprehensive cross-file compatibility
export { SolanaIcon as SolIcon };
export { BitcoinIcon as BtcIcon };
export { JupiterIcon as JupIcon };
export { RaydiumIcon as RayIcon };
export { EthIcon as EthereumIcon };

/**
 * Unified Helper to obtain the authentic vector SVG logo for a given token symbol
 */
export function getTokenIcon(symbol: string, size: number = 24, className: string = ''): React.ReactNode {
  const normalized = (symbol || '').trim().toUpperCase();

  switch (normalized) {
    case 'SOL':
    case 'WSOL':
      return <SolanaIcon size={size} className={className} />;
    case 'USDC':
      return <UsdcIcon size={size} className={className} />;
    case 'USDT':
      return <UsdtIcon size={size} className={className} />;
    case 'JUP':
    case 'JUPITER':
      return <JupiterIcon size={size} className={className} />;
    case 'RAY':
    case 'RAYDIUM':
      return <RaydiumIcon size={size} className={className} />;
    case 'BONK':
      return <BonkIcon size={size} className={className} />;
    case 'BTC':
    case 'BITCOIN':
    case 'WBTC':
      return <BitcoinIcon size={size} className={className} />;
    case 'ETH':
    case 'ETHEREUM':
    case 'WETH':
      return <EthIcon size={size} className={className} />;
    case 'PYTH':
      return <PythIcon size={size} className={className} />;
    default:
      return <GenericTokenIcon symbol={normalized} size={size} className={className} />;
  }
}

/**
 * Universal Token Icon component that selects the authentic SVG logo
 */
export function TokenIcon({
  symbol = 'SOL',
  size = 24,
  className = '',
}: TokenIconProps) {
  return <>{getTokenIcon(symbol, size, className)}</>;
}
