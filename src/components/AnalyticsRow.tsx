'use client';

import React, { useEffect, useRef, useState } from 'react';
import { RowStore } from '@/engine/RowStore';
import { KPIMetrics } from '@/engine/types';

interface AnalyticsRowProps {
  store: RowStore;
  metrics: KPIMetrics | null;
}

export const AnalyticsRow: React.FC<AnalyticsRowProps> = React.memo(({ store, metrics }) => {
  // --- 1. State/Computations for Operations Health (Donut) ---
  const [healthData, setHealthData] = useState({
    active: 0,
    completed: 0,
    planned: 0,
    onHold: 0,
    failed: 0,
    total: 0,
    healthScore: 100,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Extract status counts
    let active = 0;
    let completed = 0;
    let planned = 0;
    let onHold = 0;
    let failed = 0;

    for (const row of store.store.values()) {
      const s = row.project_status.toLowerCase();
      if (s === 'active') active++;
      else if (s === 'completed') completed++;
      else if (s === 'planned' || s === 'under review') planned++;
      else if (s === 'on hold' || s === 'delayed') onHold++;
      else if (s === 'failed' || s === 'critical') failed++;
    }

    const total = store.store.size || 1;
    const healthScore = Math.max(0, Math.min(100, 100 - (failed / total) * 100));

    setHealthData({ active, completed, planned, onHold, failed, total: store.store.size, healthScore });

    // Draw Donut on Canvas
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

    ctx.clearRect(0, 0, size, size);

    const segments = [
      { count: active, color: '#3b82f6' }, // Active - Blue
      { count: completed, color: '#10b981' }, // Completed - Green
      { count: planned, color: '#8b5cf6' }, // Planned - Purple
      { count: onHold, color: '#f59e0b' }, // On Hold - Amber
      { count: failed, color: '#ef4444' }, // Failed - Red
    ];

    const segmentTotal = segments.reduce((sum, s) => sum + s.count, 0) || 1;
    let startAngle = -Math.PI / 2;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 5;
    const innerRadius = radius - 8;

    for (const seg of segments) {
      const angle = (seg.count / segmentTotal) * Math.PI * 2;
      if (angle <= 0) continue;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, startAngle + angle);
      ctx.arc(cx, cy, innerRadius, startAngle + angle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();

      startAngle += angle;
    }

    // Draw center total count text
    ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(store.store.size.toLocaleString(), cx, cy - 4);
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('PROJECTS', cx, cy + 6);

  }, [store.store.size, metrics]);

  // --- 2. State/Computations for Savings & ROI Trend ---
  // Seed stable 12-month telemetry progression scaling dynamically with current total savings & ROI
  const getTrendData = () => {
    const totalSavings = metrics?.totalSavingsUSD || 1.64e9;
    const avgROI = metrics?.averageROI || 178.0;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Smooth growth curve factors
    const curve = [0.25, 0.31, 0.38, 0.44, 0.51, 0.58, 0.64, 0.71, 0.78, 0.86, 0.93, 1.0];
    
    return curve.map((factor, index) => {
      const savingsVal = totalSavings * factor;
      // Slight fluctuation around average ROI
      const roiVal = avgROI * (0.85 + (index % 3) * 0.05 + index * 0.01);
      return {
        month: months[index],
        savings: savingsVal,
        roi: roiVal,
      };
    });
  };

  const trendPoints = getTrendData();
  const formatUSDShort = (val: number) => {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    return `$${val.toLocaleString()}`;
  };

  // SVG dimensions for trend chart
  const chartWidth = 320;
  const chartHeight = 85;
  const paddingX = 30;
  const paddingY = 12;

  // Compute SVG line points
  const getSVGPoints = (data: typeof trendPoints) => {
    const minS = 0;
    const maxS = metrics?.totalSavingsUSD || 1.64e9;
    const minR = 0;
    const maxR = 240;

    const savingsPoints = data.map((d, i) => {
      const x = paddingX + (i / (data.length - 1)) * (chartWidth - paddingX * 2);
      const y = chartHeight - paddingY - ((d.savings - minS) / (maxS - minS || 1)) * (chartHeight - paddingY * 2);
      return { x, y };
    });

    const roiPoints = data.map((d, i) => {
      const x = paddingX + (i / (data.length - 1)) * (chartWidth - paddingX * 2);
      const y = chartHeight - paddingY - ((d.roi - minR) / (maxR - minR || 1)) * (chartHeight - paddingY * 2);
      return { x, y };
    });

    const savingsPath = savingsPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const roiPath = roiPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    // Fill path for Savings under-line glow gradient
    const fillPath = savingsPoints.length > 0 
      ? `${savingsPath} L ${savingsPoints[savingsPoints.length - 1].x} ${chartHeight - paddingY} L ${savingsPoints[0].x} ${chartHeight - paddingY} Z`
      : '';

    return { savingsPath, roiPath, fillPath, savingsPoints, roiPoints };
  };

  const { savingsPath, roiPath, fillPath } = getSVGPoints(trendPoints);

  // --- 3. State/Computations for Top Performing Departments ---
  const [topDepts, setTopDepts] = useState<{ name: string; value: number; pct: number }[]>([]);

  useEffect(() => {
    const deptSavings: { [dept: string]: number } = {};
    let totalSavings = 0;

    for (const row of store.store.values()) {
      const dept = row.department || 'Unknown';
      const val = row.annual_savings_usd;
      deptSavings[dept] = (deptSavings[dept] || 0) + val;
      totalSavings += val;
    }

    const sorted = Object.keys(deptSavings)
      .map((name) => ({ name, value: deptSavings[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const mapped = sorted.map((d) => ({
      name: d.name,
      value: d.value,
      pct: totalSavings > 0 ? (d.value / totalSavings) * 100 : 0,
    }));

    setTopDepts(mapped);
  }, [store.store.size, metrics]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-shrink-0 select-none font-sans w-full">
      
      {/* PANEL 1: OPERATIONS HEALTH */}
      <div className="bg-white dark:bg-slate-950 p-3.5 border border-slate-200 dark:border-slate-900 rounded-xl flex flex-col justify-between h-[155px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">OPERATIONS HEALTH</span>
        </div>

        {/* Mid Donut section */}
        <div className="flex items-center justify-between my-1">
          {/* Canvas Donut */}
          <div className="w-24 h-24 flex-shrink-0 relative">
            <canvas ref={canvasRef} className="block" />
          </div>

          {/* Right Legend list */}
          <div className="flex-1 pl-4">
            <table className="w-full text-[9px] font-semibold text-slate-500 dark:text-slate-400">
              <tbody>
                <tr>
                  <td className="py-0.5 pr-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] block" /></td>
                  <td className="py-0.5 text-slate-700 dark:text-slate-300">Active</td>
                  <td className="py-0.5 text-right font-mono text-slate-400">{(healthData.total > 0 ? (healthData.active / healthData.total) * 100 : 0).toFixed(1)}%</td>
                  <td className="py-0.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{healthData.active.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-0.5 pr-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#10b981] block" /></td>
                  <td className="py-0.5 text-slate-700 dark:text-slate-300">Completed</td>
                  <td className="py-0.5 text-right font-mono text-slate-400">{(healthData.total > 0 ? (healthData.completed / healthData.total) * 100 : 0).toFixed(1)}%</td>
                  <td className="py-0.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{healthData.completed.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-0.5 pr-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] block" /></td>
                  <td className="py-0.5 text-slate-700 dark:text-slate-300">Planned</td>
                  <td className="py-0.5 text-right font-mono text-slate-400">{(healthData.total > 0 ? (healthData.planned / healthData.total) * 100 : 0).toFixed(1)}%</td>
                  <td className="py-0.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{healthData.planned.toLocaleString()}</td>
                </tr>
                <tr className="opacity-60">
                  <td className="py-0.5 pr-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] block" /></td>
                  <td className="py-0.5 text-slate-700 dark:text-slate-300">Failed</td>
                  <td className="py-0.5 text-right font-mono text-slate-400">{(healthData.total > 0 ? (healthData.failed / healthData.total) * 100 : 0).toFixed(1)}%</td>
                  <td className="py-0.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{healthData.failed.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Health Score */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-900 pt-1.5">
          <div className="flex items-center space-x-2">
            <span className="text-[8.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Health Score</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">{healthData.healthScore.toFixed(1)} / 100</span>
            <span className="text-[8.5px] text-slate-400 dark:text-slate-550 font-bold">Excellent</span>
          </div>
          {/* Mini Sparkline indicator */}
          <div className="w-16 h-3.5">
            <svg className="w-full h-full" viewBox="0 0 50 16">
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                points="0,8 10,6 20,9 30,5 40,3 50,4"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* PANEL 2: SAVINGS & ROI TREND */}
      <div className="bg-white dark:bg-slate-950 p-3.5 border border-slate-200 dark:border-slate-900 rounded-xl flex flex-col justify-between h-[155px] relative">
        {/* Header with period dropdown */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">SAVINGS & ROI TREND</span>
          <select className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1 py-0.5 text-[8.5px] text-slate-500 focus:outline-none font-bold">
            <option>This Year</option>
            <option>All Time</option>
          </select>
        </div>

        {/* Top Summary Values */}
        <div className="flex items-center space-x-4 my-1 flex-shrink-0">
          <div className="flex flex-col">
            <span className="text-[7.5px] font-bold text-slate-450 uppercase tracking-wider">CUMULATIVE SAVINGS</span>
            <span className="text-[11px] font-black font-mono text-slate-800 dark:text-slate-200 tracking-tight leading-none mt-0.5">
              {formatUSDShort(metrics?.totalSavingsUSD || 1.64e9)}
              <span className="text-[8.5px] font-bold text-emerald-500 ml-1">↑ 18.6%</span>
            </span>
          </div>
          <div className="h-5 w-px bg-slate-100 dark:bg-slate-850" />
          <div className="flex flex-col">
            <span className="text-[7.5px] font-bold text-slate-450 uppercase tracking-wider">AVERAGE ROI</span>
            <span className="text-[11px] font-black font-mono text-slate-800 dark:text-slate-200 tracking-tight leading-none mt-0.5">
              {(metrics?.averageROI || 178.0).toFixed(1)}%
              <span className="text-[8.5px] font-bold text-emerald-500 ml-1">↑ 12.4%</span>
            </span>
          </div>
        </div>

        {/* Dual Axis Hand-Rolled SVG Line Chart */}
        <div className="flex-1 w-full relative">
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            {/* Gradients */}
            <defs>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#e2e8f0" strokeDasharray="2 2" className="dark:stroke-slate-900" strokeWidth="0.8" />
            <line x1={paddingX} y1={(chartHeight) / 2} x2={chartWidth - paddingX} y2={(chartHeight) / 2} stroke="#e2e8f0" strokeDasharray="2 2" className="dark:stroke-slate-900" strokeWidth="0.8" />
            <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#cbd5e1" className="dark:stroke-slate-800" strokeWidth="1" />

            {/* Area Fill for Savings */}
            {fillPath && <path d={fillPath} fill="url(#savingsGrad)" />}

            {/* Lines */}
            <path d={savingsPath} fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d={roiPath} fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="1 1" strokeLinecap="round" strokeLinejoin="round" />

            {/* Axis labels */}
            <text x={paddingX - 4} y={paddingY + 3} textAnchor="end" className="fill-slate-400 text-[6.5px] font-mono font-bold">$2.0B</text>
            <text x={paddingX - 4} y={chartHeight - paddingY + 2} textAnchor="end" className="fill-slate-400 text-[6.5px] font-mono font-bold">$0</text>

            <text x={chartWidth - paddingX + 4} y={paddingY + 3} textAnchor="start" className="fill-slate-400 text-[6.5px] font-mono font-bold">240%</text>
            <text x={chartWidth - paddingX + 4} y={chartHeight - paddingY + 2} textAnchor="start" className="fill-slate-400 text-[6.5px] font-mono font-bold">0%</text>

            {/* Months labels */}
            {trendPoints.map((pt, i) => {
              if (i % 2 !== 0) return null; // Draw every alternate month label
              const x = paddingX + (i / (trendPoints.length - 1)) * (chartWidth - paddingX * 2);
              return (
                <text key={i} x={x} y={chartHeight - 2} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500 text-[6.5px] font-bold uppercase tracking-wider">{pt.month}</text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* PANEL 3: TOP PERFORMING DEPARTMENTS */}
      <div className="bg-white dark:bg-slate-950 p-3.5 border border-slate-200 dark:border-slate-900 rounded-xl flex flex-col justify-between h-[155px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">TOP DEPARTMENTS</span>
        </div>

        {/* Departments ranking leaderboard */}
        <div className="flex-1 space-y-1.5 overflow-hidden">
          {topDepts.map((d, index) => (
            <div key={d.name} className="flex flex-col space-y-0.5">
              <div className="flex items-center justify-between text-[9px] font-semibold text-slate-500 dark:text-slate-450">
                <div className="flex items-center space-x-1.5">
                  <span className="font-mono text-slate-400 dark:text-slate-500 font-bold">{index + 1}</span>
                  <span className="text-slate-700 dark:text-slate-200 font-bold truncate max-w-[120px]">{d.name}</span>
                </div>
                <div className="flex items-center space-x-2 font-mono">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatUSDShort(d.value)}</span>
                  <span className="text-slate-400 dark:text-slate-500">{d.pct.toFixed(1)}%</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-emerald-500' : index === 2 ? 'bg-indigo-500' : 'bg-slate-400'
                  }`} 
                  style={{ width: `${d.pct * 3}%` }} 
                />
              </div>
            </div>
          ))}
          {topDepts.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-[9px] font-medium">No department allocations found.</div>
          )}
        </div>
      </div>

    </div>
  );
});

AnalyticsRow.displayName = 'AnalyticsRow';
