'use client';

import React from 'react';

export interface TokenIconProps {
  size?: number;
  className?: string;
}

/**
 * Authentic Solana (SOL) Gradient Logo
 * Signature triple slanted rounded bars with Emerald -> Purple neon gradient
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
        <linearGradient id="sol-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FFA3" />
          <stop offset="100%" stopColor="#DC1FFF" />
        </linearGradient>
        <linearGradient id="sol-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00FFA3" />
          <stop offset="100%" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
      <path
        d="M24.8 95.7c1.3-1.4 3.1-2.1 5-2.1h73.7c3.1 0 4.7 3.8 2.5 6l-14 14.1c-1.3 1.3-3.1 2.1-5 2.1H13.3c-3.1 0-4.7-3.8-2.5-6l14-14.1z"
        fill="url(#sol-grad-1)"
      />
      <path
        d="M24.8 12.2c1.3-1.3 3.1-2.1 5-2.1h73.7c3.1 0 4.7 3.8 2.5 6l-14 14.1c-1.3 1.3-3.1 2.1-5 2.1H13.3c-3.1 0-4.7-3.8-2.5-6l14-14.1z"
        fill="url(#sol-grad-1)"
      />
      <path
        d="M103.2 54.1c-1.3-1.3-3.1-2.1-5-2.1H24.5c-3.1 0-4.7 3.8-2.5 6l14 14.1c1.3 1.3 3.1 2.1 5 2.1h73.7c3.1 0 4.7-3.8 2.5-6l-14-14.1z"
        fill="url(#sol-grad-2)"
      />
    </svg>
  );
}

/**
 * Authentic USD Coin (USDC) Logo
 * Circular vibrant blue with dual inward arc brackets & central dollar mark
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
      <path
        d="M64 24C41.9 24 24 41.9 24 64s17.9 40 40 40c4.4 0 8.6-.7 12.5-2-1.2-2.1-1.9-4.5-1.9-7.1 0-4.4 2-8.3 5.1-10.9-4.4 1.8-9.3 2.8-14.5 2.8-19.3 0-35-15.7-35-35s15.7-35 35-35 35 15.7 35 35c0 5.2-1.1 10.1-2.9 14.5 2.6-3.1 6.5-5.1 10.9-5.1 2.6 0 5 .7 7.1 1.9 1.3-3.9 2-8.1 2-12.5 0-22.1-17.9-40-40-40z"
        fill="white"
        fillOpacity="0.4"
      />
      <path
        d="M65.7 42.4c-8.9 0-14.2 4.4-14.2 11.3 0 6.6 4.3 9.4 12.2 11.7l3 .9c5.6 1.7 8.3 3.5 8.3 6.9 0 4.1-3.6 6.7-9.3 6.7-6.2 0-9.8-2.6-11.2-7.4h-6.2c1.4 7.6 7.2 12.2 15.8 12.7V91h4.2v-5.7c8.5-.6 14.6-5.1 14.6-12.2 0-7.2-4.8-10.1-12.7-12.3l-3.3-.9c-5.2-1.5-7.5-3.3-7.5-6.3 0-3.6 3.1-5.9 8.1-5.9 5.3 0 8.4 2.2 9.6 6.3h6.2c-1.3-6.9-6.3-11.1-14.9-11.6V37h-4.2v5.4z"
        fill="white"
      />
    </svg>
  );
}

/**
 * Authentic Tether USD (USDT) Logo
 * Circular green with iconic Tether '₮' ring & crossbars
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
 * Authentic Jupiter (JUP) Logo
 * Radiant cosmic orbital discs with multi-stop solar sunset & neon emerald gradient
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
          <stop offset="0%" stopColor="#13141F" />
          <stop offset="100%" stopColor="#0B0D13" />
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
      {/* Outer orbit path */}
      <path
        d="M106 58c-2.4-18.8-18.5-33.3-38.3-33.3-21.5 0-39 17.5-39 39 0 7.8 2.3 15.1 6.3 21.2-1.9 1.5-3.1 3.8-3.1 6.4 0 4.6 3.7 8.3 8.3 8.3 2.1 0 4-.8 5.5-2.1 6.3 3.6 13.6 5.6 21.4 5.6 20.3 0 37-15.5 38.8-35.4 3.4-1.3 5.8-4.6 5.8-8.5 0-3.6-2-6.7-5-8.2z"
        fill="none"
        stroke="url(#jup-orbit-1)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Inner swirling planetary sphere */}
      <circle cx="64" cy="64" r="26" fill="url(#jup-orbit-2)" />
      {/* Dynamic planetary shadow band */}
      <path
        d="M40.5 58c4.2-9.6 13.7-16.3 24.8-16.3 14 0 25.5 10.6 26.8 24.3-5.2 6.8-15.4 11.2-27.1 11.2-10.5 0-19.8-3.6-25-9.3.1-3.4.2-6.7.5-9.9z"
        fill="#13141F"
        fillOpacity="0.45"
      />
    </svg>
  );
}

/**
 * Authentic Raydium (RAY) Logo
 * Diamond prism crystal star with neon turquoise & cyan facets
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
          <stop offset="0%" stopColor="#0B1322" />
          <stop offset="100%" stopColor="#060911" />
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
      {/* Raydium Prism Star Shape */}
      <path
        d="M64 18L77.5 50.5L110 64L77.5 77.5L64 110L50.5 77.5L18 64L50.5 50.5L64 18Z"
        fill="url(#ray-cyan-grad)"
      />
      {/* Inner geometric facet accent */}
      <path
        d="M64 36L72.5 55.5L92 64L72.5 72.5L64 92L55.5 72.5L36 64L55.5 55.5L64 36Z"
        fill="white"
        fillOpacity="0.88"
      />
      {/* Center pinpoint */}
      <circle cx="64" cy="64" r="7" fill="url(#ray-purple-grad)" />
    </svg>
  );
}

/**
 * Authentic Bonk (BONK) Logo
 * Solana's beloved Shiba Inu dog badge in warm golden amber & coral orange
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
      {/* Gold coin background */}
      <circle cx="64" cy="64" r="64" fill="url(#bonk-gold)" />
      <circle cx="64" cy="64" r="58" fill="#F7941D" />
      <circle cx="64" cy="64" r="54" fill="#FFA500" stroke="#FFD700" strokeWidth="2" />

      {/* Shiba Ears */}
      <path d="M38 32L54 52H28L38 32Z" fill="#D35400" />
      <path d="M40 37L51 51H32L40 37Z" fill="#FAD7A0" />
      <path d="M90 32L100 52H74L90 32Z" fill="#D35400" />
      <path d="M88 37L96 51H77L88 37Z" fill="#FAD7A0" />

      {/* Shiba Head & Cheeks */}
      <ellipse cx="64" cy="68" rx="36" ry="32" fill="url(#bonk-fur)" />

      {/* White Muzzle & Mask */}
      <path
        d="M64 58C53 58 46 68 44 79C43 85 48 93 64 93C80 93 85 85 84 79C82 68 75 58 64 58Z"
        fill="#FFFDF0"
      />

      {/* Eyes */}
      <ellipse cx="50" cy="63" rx="3.5" ry="5.5" fill="#2C3E50" />
      <circle cx="49" cy="61" r="1.5" fill="white" />
      <ellipse cx="78" cy="63" rx="3.5" ry="5.5" fill="#2C3E50" />
      <circle cx="77" cy="61" r="1.5" fill="white" />

      {/* Nose and Smile */}
      <polygon points="61,72 67,72 64,76" fill="#2C3E50" />
      <path
        d="M58 80C61 83 67 83 70 80"
        stroke="#2C3E50"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Tongue */}
      <path
        d="M61 81C61 85 64 88 67 85C67 83 67 81 61 81Z"
        fill="#FF6B6B"
      />
    </svg>
  );
}

/**
 * Authentic Pyth Network (PYTH) Logo
 * Signature cryptographic purple prism network polygon
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
      {/* Pyth Triangular Isometric Nodes & Links */}
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
 * Generic Fallback Token Icon for arbitrary symbols
 */
export function GenericTokenIcon({
  symbol,
  size = 24,
  className = '',
}: TokenIconProps & { symbol?: string }) {
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
      return <JupiterIcon size={size} className={className} />;
    case 'RAY':
      return <RaydiumIcon size={size} className={className} />;
    case 'BONK':
      return <BonkIcon size={size} className={className} />;
    case 'PYTH':
      return <PythIcon size={size} className={className} />;
    default:
      return <GenericTokenIcon symbol={normalized} size={size} className={className} />;
  }
}
