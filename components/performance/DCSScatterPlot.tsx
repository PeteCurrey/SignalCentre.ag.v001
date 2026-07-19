"use client";

import React from "react";
import type { DCSBucket } from "@/lib/performance-client";

interface DCSScatterPlotProps {
  buckets: DCSBucket[];
}

export function DCSScatterPlot({ buckets }: DCSScatterPlotProps) {
  // SVG dimensions
  const width = 600;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Scales
  const getX = (val: number) => padding.left + (val / 100) * innerWidth;
  const getY = (val: number) => padding.top + innerHeight - (val / 100) * innerHeight;

  // Generate some scatter points for visual texture based on buckets
  const points = React.useMemo(() => {
    const pts: Array<{ x: number; y: number; win: boolean }> = [];
    buckets.forEach((b) => {
      for (let i = 0; i < b.count; i++) {
        // Randomize x within the bucket range (e.g., 60-69)
        const xVal = b.floor + Math.random() * 9;
        // Distribute y loosely around the win rate for wins, and lower for losses
        // We'll just scatter them randomly across 0-100 for visual effect,
        // but colour them based on win/loss ratio.
        const isWin = i < b.wins;
        // Simple visual hack: Wins cluster high, losses cluster low.
        const yVal = isWin ? 50 + Math.random() * 50 : Math.random() * 50;

        pts.push({
          x: getX(xVal),
          y: getY(yVal),
          win: isWin,
        });
      }
    });
    return pts;
  }, [buckets, innerWidth, innerHeight, padding]);

  // Line path for win rate trend
  const linePath = buckets
    .filter((b) => b.count > 0)
    .map((b, i) => {
      const x = getX(b.floor + 5); // Center of bucket
      const y = getY(b.win_rate);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ minWidth: 600, display: "block", backgroundColor: "var(--bg-base)" }}
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={`grid-y-${tick}`}>
            <line
              x1={padding.left}
              y1={getY(tick)}
              x2={width - padding.right}
              y2={getY(tick)}
              stroke="var(--border)"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 8}
              y={getY(tick) + 4}
              fontSize="10"
              fill="var(--text-muted)"
              textAnchor="end"
              fontFamily="var(--font-mono)"
            >
              {tick}%
            </text>
          </g>
        ))}

        {[20, 40, 60, 80].map((tick) => (
          <g key={`grid-x-${tick}`}>
            <line
              x1={getX(tick)}
              y1={padding.top}
              x2={getX(tick)}
              y2={height - padding.bottom}
              stroke="var(--bg-stone)"
            />
            <text
              x={getX(tick)}
              y={height - padding.bottom + 20}
              fontSize="10"
              fill="var(--text-muted)"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
            >
              {tick}
            </text>
          </g>
        ))}
        
        {/* Axis labels */}
        <text
            x={width / 2}
            y={height - 5}
            fontSize="10"
            fill="var(--text-secondary)"
            textAnchor="middle"
            fontWeight="bold"
            letterSpacing="0.05em"
        >
            DCS SCORE
        </text>

        {/* Scatter points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2.5"
            fill={p.win ? "var(--green)" : "var(--burgundy)"}
            opacity="0.4"
          />
        ))}

        {/* Trend line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="var(--navy)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        
        {/* Trend points */}
        {buckets.filter(b => b.count > 0).map((b, i) => (
            <circle
                key={`trend-${i}`}
                cx={getX(b.floor + 5)}
                cy={getY(b.win_rate)}
                r="4"
                fill="var(--bg-base)"
                stroke="var(--navy)"
                strokeWidth="2"
            />
        ))}
      </svg>
    </div>
  );
}
