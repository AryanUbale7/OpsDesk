'use client';

import React, { useEffect, useRef, useState } from 'react';
import { RowStore } from '@/engine/RowStore';
import { StreamManager } from '@/engine/StreamManager';

interface RealTimeChartProps {
  store: RowStore;
  streamManager: StreamManager;
}

interface Segment {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f97316', // Orange
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
];

export const RealTimeChart: React.FC<RealTimeChartProps> = React.memo(({ store, streamManager }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [segments, setSegments] = useState<Segment[]>([]);

  useEffect(() => {
    const drawChart = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const size = 96;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.scale(dpr, dpr);

      // Aggregate department data from store
      const deptSavings: { [dept: string]: number } = {};
      let totalSavings = 0;

      for (const row of store.store.values()) {
        const dept = row.department || 'Unknown';
        const val = row.annual_savings_usd;
        deptSavings[dept] = (deptSavings[dept] || 0) + val;
        totalSavings += val;
      }

      const sortedDepts = Object.keys(deptSavings)
        .map((name) => ({ name, value: deptSavings[name] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // top 5

      // Map to segments
      const mappedSegments = sortedDepts.map((item, idx) => ({
        name: item.name,
        value: item.value,
        percentage: totalSavings > 0 ? (item.value / totalSavings) * 100 : 0,
        color: COLORS[idx % COLORS.length],
      }));

      // Render React State
      setSegments(mappedSegments);

      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Draw Donut segments
      let startAngle = -Math.PI / 2;
      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 6;
      const innerRadius = radius - 8;

      for (const seg of mappedSegments) {
        const angle = (seg.value / (totalSavings || 1)) * Math.PI * 2;
        if (angle <= 0) continue;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, startAngle + angle);
        ctx.arc(cx, cy, innerRadius, startAngle + angle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();

        startAngle += angle;
      }

      // Draw empty track if totalSavings is 0
      if (totalSavings === 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.arc(cx, cy, innerRadius, Math.PI * 2, 0, true);
        ctx.closePath();
        ctx.fillStyle = '#e2e8f0';
        ctx.fill();
      }

      // Draw center label
      ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SAVINGS', cx, cy);
    };

    drawChart();

    const unsubscribe = streamManager.subscribeMetrics(() => {
      if (!streamManager.getPauseState()) {
        drawChart();
      }
    });

    window.addEventListener('resize', drawChart);
    return () => {
      unsubscribe();
      window.removeEventListener('resize', drawChart);
    };
  }, [store, streamManager]);

  const formatUSD = (val: number) => {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className="flex items-center space-x-4 bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-900 w-full h-full font-sans select-none">
      {/* Left side: Canvas Donut */}
      <div className="w-24 h-24 flex-shrink-0 relative">
        <canvas ref={canvasRef} className="block" />
      </div>

      {/* Right side: Compact Legend Table */}
      <div className="flex-1 min-w-0">
        <table className="w-full text-[9px] font-medium text-slate-500 dark:text-slate-400">
          <tbody>
            {segments.map((seg) => (
              <tr key={seg.name} className="border-b border-slate-100 dark:border-slate-900/40 last:border-0">
                {/* Color Dot Swatch */}
                <td className="py-1 pr-1.5 w-3">
                  <span
                    className="w-1.5 h-1.5 rounded-full block"
                    style={{ backgroundColor: seg.color }}
                  />
                </td>
                {/* Label */}
                <td className="py-1 text-slate-700 dark:text-slate-300 truncate max-w-[85px] text-left">
                  {seg.name}
                </td>
                {/* Percentage */}
                <td className="py-1 text-right text-slate-400 dark:text-slate-500 pr-2 font-mono">
                  {seg.percentage.toFixed(1)}%
                </td>
                {/* Absolute Savings Value */}
                <td className="py-1 text-right text-slate-800 dark:text-slate-100 font-bold font-mono">
                  {formatUSD(seg.value)}
                </td>
              </tr>
            ))}
            {segments.length === 0 && (
              <tr>
                <td className="text-center py-4 text-slate-400" colSpan={4}>
                  Calculating segments...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

RealTimeChart.displayName = 'RealTimeChart';
