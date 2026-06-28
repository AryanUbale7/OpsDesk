'use client';

import React from 'react';
import { KPIMetrics } from '@/engine/types';

interface KPICardsProps {
  metrics: KPIMetrics | null;
  visibleCount: number;
  history: KPIMetrics[];
}

export const KPICards: React.FC<KPICardsProps> = React.memo(({ metrics, visibleCount, history }) => {
  if (!metrics) {
    return (
      <div className="flex flex-col space-y-4 px-6 py-4 border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 font-sans select-none">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-50 dark:bg-slate-900 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const formatUSD = (val: number) => {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    return `$${val.toLocaleString()}`;
  };

  const formatHours = (val: number) => {
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    return val.toLocaleString();
  };

  const aiPercent = metrics.totalProjects > 0 ? (metrics.aiEnabledCount / metrics.totalProjects) * 100 : 0;
  const cloudPercent = metrics.totalProjects > 0 ? (metrics.cloudDeploymentCount / metrics.totalProjects) * 100 : 0;

  // Helper to extract metric values from history
  const getHistoryValues = (key: keyof KPIMetrics | string) => {
    if (history.length === 0) return [];
    return history.map((m) => {
      if (key === 'aiPercent') return (m.aiEnabledCount / (m.totalProjects || 1)) * 100;
      if (key === 'cloudPercent') return (m.cloudDeploymentCount / (m.totalProjects || 1)) * 100;
      return m[key as keyof KPIMetrics] as number;
    });
  };

  const getSmoothBezierPath = (pts: {x: number, y: number}[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

    let d = `M ${pts[0].x} ${pts[0].y}`;
    
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      
      const pPrevious = pts[i - 1] || p0;
      const pNext = pts[i + 2] || p1;
      
      const cp1x = p0.x + (p1.x - pPrevious.x) * 0.16;
      const cp1y = p0.y + (p1.y - pPrevious.y) * 0.16;
      
      const cp2x = p1.x - (pNext.x - p0.x) * 0.16;
      const cp2y = p1.y - (pNext.y - p0.y) * 0.16;
      
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  // Helper to render inline sparkline SVG
  const renderSparkline = (values: number[], strokeColor: string) => {
    if (values.length < 2) {
      return (
        <svg className="w-full h-5 overflow-visible" viewBox="0 0 100 16" preserveAspectRatio="none">
          <line x1="0" y1="8" x2="100" y2="8" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.3" />
        </svg>
      );
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    const pts = values.map((val, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = range === 0 ? 8 : 14 - ((val - min) / range) * 12;
      return { x, y };
    });

    const linePath = getSmoothBezierPath(pts);

    return (
      <svg className="w-full h-5 overflow-visible" viewBox="0 0 100 16" preserveAspectRatio="none">
        <path
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          d={linePath}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const renderHeroSparkline = (values: number[], strokeColor: string) => {
    if (values.length < 2) {
      return (
        <svg className="w-full h-full" viewBox="0 0 100 32" preserveAspectRatio="none">
          <line x1="0" y1="16" x2="100" y2="16" stroke="#10B981" strokeWidth="1" strokeOpacity="0.15" />
        </svg>
      );
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    const pts = values.map((val, index) => {
      const x = (index / (values.length - 1)) * 100; // Full container width stretch
      const y = range === 0 ? 16 : 30 - ((val - min) / range) * 28; // Taller wave bounds (2 to 30)
      return { x, y };
    });

    const linePath = getSmoothBezierPath(pts);
    const areaPath = `${linePath} L 100 32 L 0 32 Z`;

    return (
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 32" preserveAspectRatio="none">
        <defs>
          <linearGradient id="heroSavingsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* 1. Filled area under the curve */}
        <path d={areaPath} fill="url(#heroSavingsGradient)" />

        {/* 2. Primary Actual Telemetry Wave line (emerald green) */}
        <path
          fill="none"
          stroke="#10B981"
          strokeWidth="1.6"
          vectorEffect="non-scaling-stroke"
          d={linePath}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const renderHeroBars = (values: number[]) => {
    if (values.length < 2) {
      return (
        <svg className="w-full h-full" viewBox="0 0 100 32" preserveAspectRatio="none">
          <line x1="0" y1="16" x2="100" y2="16" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.1" />
        </svg>
      );
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    const maxBars = 28;
    const sampledValues: number[] = [];
    if (values.length <= maxBars) {
      sampledValues.push(...values);
    } else {
      for (let i = 0; i < maxBars; i++) {
        const idx = Math.floor((i / (maxBars - 1)) * (values.length - 1));
        sampledValues.push(values[idx]);
      }
    }

    const barWidth = 1.6;
    const totalBars = sampledValues.length;

    return (
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 32" preserveAspectRatio="none">
        {sampledValues.map((val, index) => {
          const x = (index / (totalBars - 1)) * 94 + 3; // Keep 3% padding left/right
          const height = range === 0 ? 10 : ((val - min) / range) * 20 + 4; // height between 4 and 24
          const y = 32 - height;
          
          return (
            <rect
              key={index}
              x={x - barWidth / 2}
              y={y}
              width={barWidth}
              height={height}
              rx="0.8" // Rounded corners
              fill="#10B981"
              fillOpacity={0.12 + (index / totalBars) * 0.58} // Fade-in opacity from left to right
              className="transition-all duration-300 hover:fill-[#ADFF41] hover:fill-opacity-100"
            />
          );
        })}
      </svg>
    );
  };

  const renderHeroGrid = (values: number[]) => {
    if (values.length < 2) {
      return (
        <svg className="w-full h-full" viewBox="0 0 100 32" preserveAspectRatio="none">
          <line x1="0" y1="16" x2="100" y2="16" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.1" />
        </svg>
      );
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    const cols = 20;
    const rows = 4;
    
    const colValues: number[] = [];
    for (let c = 0; c < cols; c++) {
      const idx = Math.floor((c / (cols - 1)) * (values.length - 1));
      colValues.push(values[idx]);
    }

    const blockSize = 3.5;
    const gap = 1;

    return (
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 32" preserveAspectRatio="none">
        {Array.from({ length: cols }).map((_, c) => {
          const val = colValues[c];
          const ratio = range === 0 ? 0.5 : (val - min) / range;
          const filledRows = Math.round(ratio * rows);

          return Array.from({ length: rows }).map((_, r) => {
            const isFilled = (rows - 1 - r) < filledRows;
            const x = c * (blockSize + gap) + 4;
            const y = r * (blockSize + gap) + 6;

            return (
              <rect
                key={`${c}-${r}`}
                x={x}
                y={y}
                width={blockSize}
                height={blockSize}
                rx="0.6"
                fill={isFilled ? "#10B981" : "#F1F5F9"}
                fillOpacity={isFilled ? 0.15 + (c / cols) * 0.65 : 1}
                className="transition-all duration-300 hover:fill-[#ADFF41]"
              />
            );
          });
        })}
      </svg>
    );
  };

  const renderROIGauge = (roi: number) => {
    const radius = 18;
    const strokeWidth = 3.5;
    const circumference = 2 * Math.PI * radius; // 113.1
    const maxROI = 200; // Cap ROI percentage mapping
    const percentage = Math.min(100, (roi / maxROI) * 100);
    const strokeDashoffset = circumference - (circumference * percentage) / 100;

    return (
      <svg className="w-14 h-14 transform -rotate-90 overflow-visible" viewBox="0 0 40 40">
        {/* Background track */}
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="#F3E8FF"
          strokeWidth={strokeWidth}
        />
        {/* Active gauge ring */}
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="#8B5CF6"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
    );
  };

  const renderProjectsDonut = (visible: number, total: number) => {
    const radius = 18;
    const strokeWidth = 3.5;
    const circumference = 2 * Math.PI * radius; // 113.1
    const ratio = total > 0 ? visible / total : 0;
    const strokeDashoffset = circumference - (circumference * ratio);

    return (
      <svg className="w-14 h-14 transform -rotate-90 overflow-visible" viewBox="0 0 40 40">
        {/* Background track */}
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="#DBEAFE"
          strokeWidth={strokeWidth}
        />
        {/* Active progress */}
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
    );
  };

  // Helper to calculate delta labels
  const getDelta = (values: number[], key: string, defaultText: string) => {
    if (values.length < 2) return { text: defaultText, colorClass: 'text-slate-400 dark:text-slate-500' };
    const first = values[0];
    const last = values[values.length - 1];

    if (key === 'anomalyCount') {
      if (last === 0) return { text: 'Nominal', colorClass: 'text-emerald-500 font-semibold' };
      return { text: `+${last} active`, colorClass: 'text-rose-500 font-semibold animate-pulse' };
    }

    const diff = last - first;
    if (diff === 0) return { text: defaultText, colorClass: 'text-slate-400 dark:text-slate-500' };

    const percent = first === 0 ? 0 : (diff / first) * 100;
    const sign = diff > 0 ? '↑' : '↓';
    const color = diff > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold';

    return {
      text: `${sign} ${Math.abs(percent).toFixed(1)}% vs baseline`,
      colorClass: color
    };
  };

  // Sparkline data sets
  const projectsHistory = getHistoryValues('totalProjects');
  const robotsHistory = getHistoryValues('totalRobots');
  const savingsHistory = getHistoryValues('totalSavingsUSD');
  const roiHistory = getHistoryValues('averageROI');
  const hoursHistory = getHistoryValues('totalHoursSaved');
  const aiHistory = getHistoryValues('aiPercent');
  const cloudHistory = getHistoryValues('cloudPercent');
  const anomalyHistory = getHistoryValues('anomalyCount');

  // Delta states
  const projectsDelta = getDelta(projectsHistory, 'totalProjects', '↑ 37.1% vs last month');
  const robotsDelta = getDelta(robotsHistory, 'totalRobots', '↑ 28.4% vs last month');
  const savingsDelta = getDelta(savingsHistory, 'totalSavingsUSD', '↑ 18.6% vs last month');
  const roiDelta = getDelta(roiHistory, 'averageROI', '↑ 12.4% vs last month');
  const hoursDelta = getDelta(hoursHistory, 'totalHoursSaved', '↑ 22.7% vs last month');
  const aiDelta = getDelta(aiHistory, 'aiPercent', '↑ 8.7% vs last month');
  const cloudDelta = getDelta(cloudHistory, 'cloudPercent', '↑ 9.3% vs last month');
  const anomalyDelta = getDelta(anomalyHistory, 'anomalyCount', 'Nominal');

  return (
    <div className="flex flex-col space-y-5 px-6 py-5 border-b border-slate-200/80 bg-[#F6F6F6] font-sans select-none w-full flex-shrink-0">
      
      {/* Top Row: Hero Card (60% width) + Grid (40% width) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Tier 1: Hero Savings Card (Spans 2 columns on lg screens) */}
        <div className="lg:col-span-2 flex flex-col justify-between bg-white border border-slate-250/70 rounded-[24px] p-6.5 relative overflow-hidden transition-all hover:shadow-sm hover:border-slate-350 group">
          <div className="flex items-start justify-between z-10">
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ADFF41]" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">PRIMARY FINANCIAL SAVINGS</span>
              </div>
              <h2 className="text-[10px] font-bold text-slate-500">Total Annual Savings</h2>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#014D3E] flex items-center justify-center text-[#ADFF41] border border-[#014D3E]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.214.128c.31.187.665.3 1.036.3 1.13 0 2.05-.917 2.05-2.05s-.92-2.05-2.05-2.05H11.5a2.05 2.05 0 00-2.05 2.05c0 1.133.92 2.05 2.05 2.05h.086m-.086 0H12m0-8.818l.214-.128c.31-.187.665-.3 1.036-.3 1.13 0 2.05.917 2.05 2.05s-.92 2.05-2.05 2.05H12.5a2.05 2.05 0 01-2.05-2.05c0-1.133.92-2.05 2.05-2.05h.086m-.086 0H12" />
              </svg>
            </div>
          </div>

          <div className="mt-6 mb-8 z-10">
            <span className="text-4xl font-black text-slate-900 tracking-tight font-mono leading-none">
              {formatUSD(metrics.totalSavingsUSD)}
            </span>
            <div className="flex items-center space-x-2 mt-2.5 text-[10px]">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${savingsDelta.colorClass.includes('emerald') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {savingsDelta.text}
              </span>
              <span className="text-slate-400 font-medium">vs baseline projection</span>
            </div>
          </div>

          {/* Large custom hero double-wave */}
          <div className="absolute inset-x-0 bottom-0 h-16 z-0">
            {renderHeroSparkline(savingsHistory, '#10B981')}
          </div>
        </div>

        {/* Right Pane: 2x2 grid of Tier 2 & Tier 3 metrics */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Card A: Average ROI (Tier 2 - Purple Accent - Speedometer Gauge) */}
          <div className="flex bg-white border border-slate-200/85 rounded-[20px] p-5 relative overflow-hidden transition-all hover:shadow-xs hover:border-slate-350 items-center justify-between">
            <div className="flex flex-col justify-between h-full">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-purple-450 uppercase tracking-widest leading-none">AVERAGE ROI</span>
                <span className="text-[9px] font-bold text-slate-400 mt-1 leading-none">Performance scale</span>
              </div>
              <div className="mt-4">
                <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
                  {metrics.averageROI.toFixed(1)}%
                </span>
                <div className="text-[8.5px] mt-1 text-slate-400 font-bold leading-none">
                  <span className={roiDelta.colorClass}>{roiDelta.text}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center flex-shrink-0 ml-4 relative">
              {renderROIGauge(metrics.averageROI)}
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-purple-650 font-mono">
                {metrics.averageROI.toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Card B: Active Projects (Tier 3 - Blue Accent - Progress Donut) */}
          <div className="flex bg-white border border-slate-200/85 rounded-[20px] p-5 relative overflow-hidden transition-all hover:shadow-xs hover:border-slate-355 items-center justify-between">
            <div className="flex flex-col justify-between h-full">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-blue-450 uppercase tracking-widest leading-none">ACTIVE PROJECTS</span>
                <span className="text-[9px] font-bold text-slate-400 mt-1 leading-none">Filter coverage</span>
              </div>
              <div className="mt-4">
                <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
                  {visibleCount.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-slate-400 ml-1">/ {metrics.totalProjects.toLocaleString()}</span>
                <div className="text-[8.5px] mt-1 text-slate-400 font-bold leading-none">
                  <span className={projectsDelta.colorClass}>{projectsDelta.text}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center flex-shrink-0 ml-4 relative">
              {renderProjectsDonut(visibleCount, metrics.totalProjects)}
              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-blue-600 font-mono">
                {((visibleCount / (metrics.totalProjects || 1)) * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Card C: Robots Deployed (Tier 3 - Emerald Accent - Segment Status Grid) */}
          <div className="flex flex-col justify-between bg-white border border-slate-200/85 rounded-[20px] p-5 relative overflow-hidden transition-all hover:shadow-xs hover:border-slate-350">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">ROBOTS STATUS</span>
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider">Telemetry Live</span>
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
                {metrics.totalRobots.toLocaleString()}
              </span>
              <span className="text-[9px] font-bold text-slate-400 ml-1">Deployed</span>
              <div className="text-[8.5px] mt-1 font-bold leading-none text-slate-400">
                <span className={robotsDelta.colorClass}>{robotsDelta.text}</span>
              </div>
            </div>
            {/* Segmented operational status micro indicators */}
            <div className="flex space-x-1 items-center h-2 mt-4 select-none">
              <span className="h-1 flex-1 rounded bg-emerald-500 animate-pulse" style={{ animationDelay: '100ms' }} />
              <span className="h-1 flex-1 rounded bg-emerald-500 animate-pulse" style={{ animationDelay: '200ms' }} />
              <span className="h-1 flex-1 rounded bg-emerald-500 animate-pulse" style={{ animationDelay: '300ms' }} />
              <span className="h-1 flex-1 rounded bg-emerald-500 animate-pulse" style={{ animationDelay: '400ms' }} />
              <span className="h-1 flex-1 rounded bg-emerald-500 animate-pulse" style={{ animationDelay: '500ms' }} />
              <span className="h-1 flex-1 rounded bg-emerald-500 animate-pulse" style={{ animationDelay: '600ms' }} />
              <span className="h-1 flex-1 rounded bg-emerald-500 animate-pulse" style={{ animationDelay: '700ms' }} />
              <span className="h-1 flex-1 rounded bg-emerald-500 animate-pulse" style={{ animationDelay: '800ms' }} />
              <span className="h-1 flex-1 rounded bg-emerald-500 animate-pulse" style={{ animationDelay: '900ms' }} />
              <span className={`h-1 flex-1 rounded ${metrics.anomalyCount > 0 ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} style={{ animationDelay: '1000ms' }} />
            </div>
          </div>

          {/* Card D: Hours Saved (Tier 3 - Indigo/Blue Accent) */}
          <div className="flex flex-col justify-between bg-white border border-slate-200/80 rounded-[20px] p-5 relative overflow-hidden transition-all hover:shadow-xs hover:border-slate-350">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">HOURS SAVED</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-650 border border-indigo-100/50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0" />
                </svg>
              </div>
            </div>
            <div className="mt-4 mb-5">
              <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
                {formatHours(metrics.totalHoursSaved)}
              </span>
              <div className="text-[8.5px] mt-1 text-slate-400 font-bold">
                <span className={hoursDelta.colorClass}>{hoursDelta.text}</span>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-5">
              {renderSparkline(hoursHistory, '#6366F1')}
            </div>
          </div>

        </div>

      </div>

      {/* Row 2: Secondary stats (AI Core Ratio, Cloud Base, System Incidents) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 5: AI Core Ratio */}
        <div className="flex items-center justify-between bg-white border border-slate-200/60 rounded-xl px-4.5 py-3.5 transition-all hover:border-slate-350">
          <div className="flex flex-col space-y-0.5">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">AI Core Ratio</span>
            <span className="text-sm font-black text-slate-800 font-mono">{aiPercent.toFixed(1)}%</span>
          </div>
          <span className={`text-[8.5px] font-bold ${aiDelta.colorClass}`}>{aiDelta.text}</span>
        </div>

        {/* Card 6: Cloud Base Ratio */}
        <div className="flex items-center justify-between bg-white border border-slate-200/60 rounded-xl px-4.5 py-3.5 transition-all hover:border-slate-350">
          <div className="flex flex-col space-y-0.5">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Cloud Base Ratio</span>
            <span className="text-sm font-black text-slate-800 font-mono">{cloudPercent.toFixed(1)}%</span>
          </div>
          <span className={`text-[8.5px] font-bold ${cloudDelta.colorClass}`}>{cloudDelta.text}</span>
        </div>

        {/* Card 7: System Incidents */}
        <div className={`flex items-center justify-between border rounded-xl px-4.5 py-3.5 transition-all ${
          metrics.anomalyCount > 0 
            ? 'bg-rose-50/50 border-rose-200/60 hover:border-rose-350' 
            : 'bg-white border-slate-200/60 hover:border-slate-300'
        }`}>
          <div className="flex items-center space-x-2">
            {metrics.anomalyCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
            <div className="flex flex-col space-y-0.5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">System Incidents</span>
              <span className={`text-sm font-black font-mono ${metrics.anomalyCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{metrics.anomalyCount}</span>
            </div>
          </div>
          <span className={`text-[8.5px] font-bold ${anomalyDelta.colorClass}`}>{anomalyDelta.text}</span>
        </div>

      </div>
    </div>
  );
});

KPICards.displayName = 'KPICards';
