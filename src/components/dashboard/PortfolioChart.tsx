'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useTheme } from '@/context/ThemeContext';
import { TrendingUp, TrendingDown, ArrowUpRight, Sparkles } from 'lucide-react';

export type ChartTimeframe = 'Day' | 'Week' | 'Month' | 'Year' | 'All';

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  dateLabel: string;
  tooltipTime: string;
}

interface PortfolioChartProps {
  initialBalance?: number;
  className?: string;
}

const TIMEFRAMES: ChartTimeframe[] = ['Day', 'Week', 'Month', 'Year', 'All'];

// Cubic Bezier curve path generator
function getCubicBezierPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return d;
}

export function PortfolioChart({ initialBalance, className = '' }: PortfolioChartProps) {
  const { totalFiatBalance } = useWallet();
  const { isDark } = useTheme();
  const [selectedTimeframe, setSelectedTimeframe] = useState<ChartTimeframe>('Week');
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const activeBalance = initialBalance ?? totalFiatBalance ?? 0;
  const isZeroBalance = activeBalance <= 0;

  // Chart dimensions in virtual coordinates
  const VIEW_WIDTH = 800;
  const VIEW_HEIGHT = 260;
  const PADDING_TOP = 20;
  const PADDING_BOTTOM = 35;
  const PADDING_LEFT = 20;
  const PADDING_RIGHT = 70; // Room for right-aligned price labels

  const chartWidth = VIEW_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const chartHeight = VIEW_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  // Generate deterministic points based on timeframe and current balance
  const { points, minVal, maxVal, priceChange, percentChange, timeLabels } = useMemo(() => {
    let numPoints = 24;
    let labelInterval = 4;
    let baseTimeLabels: string[] = [];

    const now = new Date(2026, 9, 20, 19, 30); // Oct 20, 2026

    switch (selectedTimeframe) {
      case 'Day':
        numPoints = 24;
        labelInterval = 4;
        baseTimeLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
        break;
      case 'Week':
        numPoints = 7;
        labelInterval = 1;
        baseTimeLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        break;
      case 'Month':
        numPoints = 30;
        labelInterval = 6;
        baseTimeLabels = ['Oct 1', 'Oct 6', 'Oct 11', 'Oct 16', 'Oct 21', 'Oct 26'];
        break;
      case 'Year':
        numPoints = 12;
        labelInterval = 2;
        baseTimeLabels = ['Nov', 'Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'];
        break;
      case 'All':
      default:
        numPoints = 24;
        labelInterval = 4;
        baseTimeLabels = ['2024', '2025 Q1', '2025 Q3', '2026 Q1', '2026 Q3'];
        break;
    }

    // Normalized fluctuation curve templates
    const wavePatterns: Record<ChartTimeframe, number[]> = {
      Day: [0.94, 0.93, 0.95, 0.92, 0.93, 0.96, 0.98, 0.97, 0.99, 1.01, 1.00, 0.99, 1.02, 1.03, 1.01, 1.04, 1.05, 1.03, 1.04, 1.06, 1.05, 1.07, 1.06, 1.08],
      Week: [0.88, 0.91, 0.89, 0.94, 0.96, 0.95, 1.00],
      Month: [0.82, 0.84, 0.83, 0.86, 0.85, 0.88, 0.87, 0.90, 0.89, 0.92, 0.91, 0.93, 0.90, 0.94, 0.96, 0.95, 0.97, 0.96, 0.98, 0.97, 0.99, 0.98, 1.01, 1.00, 1.02, 1.01, 1.03, 1.02, 1.04, 1.05],
      Year: [0.65, 0.70, 0.68, 0.75, 0.82, 0.78, 0.85, 0.89, 0.92, 0.95, 0.98, 1.00],
      All: [0.40, 0.45, 0.42, 0.52, 0.58, 0.54, 0.62, 0.68, 0.72, 0.78, 0.75, 0.82, 0.86, 0.84, 0.89, 0.92, 0.90, 0.95, 0.97, 0.94, 0.98, 1.01, 0.99, 1.05],
    };

    const pattern = wavePatterns[selectedTimeframe];
    const lastMultiplier = pattern[pattern.length - 1];

    // Effective baseline values
    const effectiveBalance = isZeroBalance ? 1000 : activeBalance;

    const rawValues: number[] = pattern.map((m) => {
      if (isZeroBalance) {
        // Zero balance: baseline gently oscillates around 0
        return 0;
      }
      const val = (effectiveBalance / lastMultiplier) * m;
      return Number(val.toFixed(2));
    });

    const startVal = rawValues[0];
    const endVal = rawValues[rawValues.length - 1];
    const priceDiff = endVal - startVal;
    const pctDiff = startVal > 0 ? (priceDiff / startVal) * 100 : 0;

    let computedMin = Math.min(...rawValues);
    let computedMax = Math.max(...rawValues);

    if (isZeroBalance) {
      computedMin = 0;
      computedMax = 5000;
    } else if (computedMin === computedMax) {
      computedMin = computedMin * 0.9;
      computedMax = computedMax * 1.1;
    } else {
      const padding = (computedMax - computedMin) * 0.12;
      computedMin = Math.max(0, computedMin - padding);
      computedMax = computedMax + padding;
    }

    const range = computedMax - computedMin || 1;

    const computedPoints: ChartPoint[] = rawValues.map((val, idx) => {
      const fracX = idx / (rawValues.length - 1);
      const fracY = (val - computedMin) / range;

      const px = PADDING_LEFT + fracX * chartWidth;
      // In SVG, y=0 is top, so invert
      const py = PADDING_TOP + (1 - fracY) * chartHeight;

      // Construct realistic date label for tooltip
      let dateString = '';
      if (selectedTimeframe === 'Day') {
        const hour = Math.floor((idx / (rawValues.length - 1)) * 24);
        dateString = `Today • ${String(hour).padStart(2, '0')}:00`;
      } else if (selectedTimeframe === 'Week') {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        dateString = `${days[idx % 7]} • Oct ${14 + idx}`;
      } else if (selectedTimeframe === 'Month') {
        dateString = `Oct ${idx + 1}, 2026`;
      } else {
        dateString = `2026 • Point ${idx + 1}`;
      }

      return {
        x: px,
        y: isZeroBalance ? PADDING_TOP + chartHeight * 0.75 : py,
        value: isZeroBalance ? 0 : val,
        dateLabel: dateString,
        tooltipTime: dateString,
      };
    });

    return {
      points: computedPoints,
      minVal: computedMin,
      maxVal: computedMax,
      priceChange: priceDiff,
      percentChange: pctDiff,
      timeLabels: baseTimeLabels,
    };
  }, [selectedTimeframe, activeBalance, isZeroBalance, chartWidth, chartHeight]);

  // Compute SVG paths
  const linePath = useMemo(() => getCubicBezierPath(points), [points]);

  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    const bottomY = PADDING_TOP + chartHeight;
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, points, chartHeight]);

  // Right-aligned Price Axis Ticks (4 levels)
  const priceTicks = useMemo(() => {
    if (isZeroBalance) {
      return [
        { label: '$3,000', y: PADDING_TOP + chartHeight * 0.2 },
        { label: '$2,000', y: PADDING_TOP + chartHeight * 0.45 },
        { label: '$1,000', y: PADDING_TOP + chartHeight * 0.7 },
        { label: '$0.00', y: PADDING_TOP + chartHeight },
      ];
    }

    const ticks = [0.95, 0.65, 0.35, 0.05];
    return ticks.map((frac) => {
      const val = minVal + frac * (maxVal - minVal);
      const py = PADDING_TOP + (1 - frac) * chartHeight;
      const formatted =
        val >= 1000
          ? `$${(val / 1000).toFixed(1)}k`
          : `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
      return { label: formatted, y: py };
    });
  }, [isZeroBalance, minVal, maxVal, chartHeight]);

  // Handle pointer interactions (mouse & touch)
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!svgRef.current || points.length === 0) return;

      const rect = svgRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const scaleX = VIEW_WIDTH / rect.width;
      const virtualX = clientX * scaleX;

      // Find closest point by X coordinate
      let closest = points[0];
      let minDiff = Math.abs(points[0].x - virtualX);

      for (let i = 1; i < points.length; i++) {
        const diff = Math.abs(points[i].x - virtualX);
        if (diff < minDiff) {
          minDiff = diff;
          closest = points[i];
        }
      }

      setHoveredPoint(closest);
    },
    [points]
  );

  const handlePointerLeave = useCallback(() => {
    setHoveredPoint(null);
  }, []);

  const isPositive = percentChange >= 0;

  // Active hover point or default display point
  const displayPoint = hoveredPoint || (points.length > 0 ? points[points.length - 1] : null);
  const displayVal = displayPoint ? displayPoint.value : activeBalance;

  return (
    <div
      ref={containerRef}
      className={`crypto-panel rounded-3xl p-5 sm:p-7 relative transition-all duration-300 ${className}`}
    >
      {/* Top Header: Title, Value, Timeframe selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              Portfolio Performance
            </span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time</span>
            </div>
          </div>

          {/* Large dynamic price readout */}
          <div className="flex items-baseline gap-3 mt-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-mono tracking-tight">
              ${displayVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>

            {!isZeroBalance && (
              <div
                className={`flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded-lg ${
                  isPositive
                    ? 'text-emerald-500 bg-emerald-500/10'
                    : 'text-rose-500 bg-rose-500/10'
                }`}
              >
                {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                <span>
                  {isPositive ? '+' : ''}
                  {percentChange.toFixed(2)}%
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal hidden md:inline">
                  ({selectedTimeframe})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Date pills: "Day", "Week", "Month", "Year", "All" */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--input-bg)] border border-[var(--panel-border)] self-start sm:self-auto shadow-inner">
          {TIMEFRAMES.map((tf) => {
            const isActive = selectedTimeframe === tf;
            return (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm font-semibold border border-[var(--card-border)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--panel-hover)]'
                }`}
              >
                {tf}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Interactive Area Chart Container */}
      <div className="relative w-full select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="w-full h-48 sm:h-64 overflow-visible cursor-crosshair touch-none"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <defs>
            {/* Smooth linear gradient fill under the curve */}
            <linearGradient id="portfolio-area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={isDark ? '#14F195' : '#2563EB'}
                stopOpacity={isDark ? 0.28 : 0.20}
              />
              <stop
                offset="75%"
                stopColor={isDark ? '#14F195' : '#2563EB'}
                stopOpacity={isDark ? 0.05 : 0.03}
              />
              <stop
                offset="100%"
                stopColor={isDark ? '#14F195' : '#2563EB'}
                stopOpacity="0.00"
              />
            </linearGradient>

            {/* Neon stroke gradient */}
            <linearGradient id="portfolio-stroke-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={isDark ? '#00FFA3' : '#3B82F6'} />
              <stop offset="50%" stopColor={isDark ? '#14F195' : '#2563EB'} />
              <stop offset="100%" stopColor={isDark ? '#10B981' : '#1D4ED8'} />
            </linearGradient>

            {/* Glow filter */}
            <filter id="chart-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Horizontal Grid Lines & Right Price Axis Labels */}
          {priceTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={PADDING_LEFT}
                y1={tick.y}
                x2={VIEW_WIDTH - PADDING_RIGHT}
                y2={tick.y}
                stroke={isDark ? '#1F2230' : '#E2E8F0'}
                strokeWidth="1"
                strokeDasharray="4 4"
                strokeOpacity={0.8}
              />
              <text
                x={VIEW_WIDTH - 10}
                y={tick.y + 4}
                textAnchor="end"
                className="font-mono text-[11px] select-none"
                fill={isDark ? '#64748B' : '#94A3B8'}
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Area Fill */}
          <path
            d={areaPath}
            fill="url(#portfolio-area-gradient)"
            className="transition-all duration-300"
          />

          {/* Smooth Cubic Bezier Stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#portfolio-stroke-gradient)"
            strokeWidth={isDark ? 2.75 : 2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
            filter={isDark ? 'url(#chart-glow)' : undefined}
          />

          {/* Bottom X-Axis Time Labels */}
          {timeLabels.map((label, idx) => {
            const frac = idx / (timeLabels.length - 1);
            const lx = PADDING_LEFT + frac * chartWidth;
            return (
              <text
                key={idx}
                x={lx}
                y={VIEW_HEIGHT - 6}
                textAnchor={idx === 0 ? 'start' : idx === timeLabels.length - 1 ? 'end' : 'middle'}
                className="font-mono text-[10px] select-none"
                fill={isDark ? '#64748B' : '#94A3B8'}
              >
                {label}
              </text>
            );
          })}

          {/* Interactive Cursor / Hover Elements */}
          {hoveredPoint && (
            <g className="pointer-events-none">
              {/* Vertical Dashed Guideline */}
              <line
                x1={hoveredPoint.x}
                y1={PADDING_TOP}
                x2={hoveredPoint.x}
                y2={PADDING_TOP + chartHeight}
                stroke={isDark ? '#14F195' : '#2563EB'}
                strokeWidth="1.5"
                strokeDasharray="3 3"
                strokeOpacity="0.75"
              />

              {/* Glowing Indicator Target Halo */}
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="10"
                fill={isDark ? '#14F195' : '#2563EB'}
                fillOpacity="0.2"
                className="animate-ping"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="6"
                fill={isDark ? '#0B0B0F' : '#FFFFFF'}
                stroke={isDark ? '#14F195' : '#2563EB'}
                strokeWidth="3"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip Pill */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none -translate-x-1/2 transition-transform duration-75 ease-out shadow-2xl"
            style={{
              left: `${(hoveredPoint.x / VIEW_WIDTH) * 100}%`,
              top: `${Math.max(10, (hoveredPoint.y / VIEW_HEIGHT) * 100 - 24)}%`,
            }}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#090A0E]/95 dark:bg-[#14141C]/95 text-white border border-emerald-500/40 backdrop-blur-md text-xs font-mono shadow-[0_4px_20px_rgba(0,0,0,0.6)] whitespace-nowrap">
              <span className="text-zinc-400 font-sans">{hoveredPoint.tooltipTime}</span>
              <span className="text-zinc-500">•</span>
              <span className="font-bold text-[#14F195]">
                ${hoveredPoint.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* Zero-Balance Baseline Overlay Message */}
        {isZeroBalance && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
            <div className="max-w-md p-4 rounded-2xl bg-[var(--card-bg)]/85 border border-[var(--card-border)] backdrop-blur-md shadow-lg flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Sparkles size={18} className="text-emerald-500" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[var(--text-primary)]">
                  Live Performance Engine Ready
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                  Deposit SOL or SPL tokens to start tracking live performance.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
