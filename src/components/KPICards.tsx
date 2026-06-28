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

  const renderSavingsChart = (values: number[]) => {
    // Ensure we have at least 7 values to match Jan-Jul. If not, pad with baseline trend.
    const baselinePoints = [1.4e9, 1.78e9, 1.25e9, 0.95e9, 0.78e9, 0.68e9, metrics.totalSavingsUSD];
    const data = values.length >= 7 ? values.slice(-7) : baselinePoints;

    const width = 500;
    const height = 150;
    const paddingLeft = 45;
    const paddingRight = 20;
    const plotWidth = width - paddingLeft - paddingRight; // 435
    const plotHeight = 100; // From y=20 to y=120
    
    const maxVal = 2e9; // 2.0B
    
    const pts = data.map((val, index) => {
      const x = paddingLeft + (index / (data.length - 1)) * plotWidth;
      const y = 120 - (val / maxVal) * plotHeight;
      return { x, y };
    });

    const linePath = getSmoothBezierPath(pts);
    const areaPath = `${linePath} L ${pts[pts.length - 1].x} 120 L ${pts[0].x} 120 Z`;

    return (
      <svg className="w-full h-full overflow-visible select-none text-[8px] font-bold text-slate-400" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="savingsAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Dashed Grid Lines */}
        <line x1={paddingLeft} y1="20" x2={width - paddingRight} y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={paddingLeft} y1="45" x2={width - paddingRight} y2="45" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={paddingLeft} y1="70" x2={width - paddingRight} y2="70" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={paddingLeft} y1="95" x2={width - paddingRight} y2="95" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={paddingLeft} y1="120" x2={width - paddingRight} y2="120" stroke="#E2E8F0" strokeWidth="1" />

        {/* Y-Axis Labels */}
        <text x={paddingLeft - 10} y="23" textAnchor="end" className="fill-slate-400">$2.0B</text>
        <text x={paddingLeft - 10} y="48" textAnchor="end" className="fill-slate-400">$1.5B</text>
        <text x={paddingLeft - 10} y="73" textAnchor="end" className="fill-slate-400">$1.0B</text>
        <text x={paddingLeft - 10} y="98" textAnchor="end" className="fill-slate-400">$0.5B</text>
        <text x={paddingLeft - 10} y="123" textAnchor="end" className="fill-slate-400">$0</text>

        {/* Filled Area */}
        <path d={areaPath} fill="url(#savingsAreaGradient)" />

        {/* Curve Line */}
        <path
          fill="none"
          stroke="#10B981"
          strokeWidth="1.8"
          d={linePath}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Indicator Dot on Last Element */}
        {pts.length > 0 && (
          <circle
            cx={pts[pts.length - 1].x}
            cy={pts[pts.length - 1].y}
            r="3.5"
            fill="#10B981"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        )}

        {/* X-Axis Labels */}
        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((m, idx) => {
          const x = paddingLeft + (idx / 6) * plotWidth;
          return (
            <text key={m} x={x} y="142" textAnchor="middle" className="fill-slate-400">
              {m}
            </text>
          );
        })}
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
    <div className="flex flex-col space-y-5 px-6 py-5 bg-[#F6F6F6] font-sans select-none w-full flex-shrink-0">
      
      {/* Top Row: Hero Card (60% width) + Grid (40% width) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Tier 1: Hero Savings Card (Spans 2 columns on lg screens) */}
        <div className="lg:col-span-2 flex flex-col justify-between bg-white border border-slate-200/50 rounded-[24px] p-6 relative overflow-hidden transition-all hover:shadow-sm hover:border-slate-300 group min-h-[300px]">
          <div className="flex items-start justify-between z-10">
            {/* Left: Icon, Title, and Value */}
            <div className="flex-1 flex flex-col justify-between h-full min-h-[120px]">
              {/* Header: Icon + Title */}
              <div className="flex items-center space-x-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50 flex-shrink-0">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">PRIMARY FINANCIAL SAVINGS</span>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 leading-none">Total Annual Savings</span>
                </div>
              </div>

              {/* Main value display */}
              <div className="mt-6">
                <span className="text-4xl font-black text-slate-900 tracking-tight font-mono leading-none">
                  {formatUSD(metrics.totalSavingsUSD)}
                </span>
                <div className="flex items-center space-x-2 mt-2.5 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-500 font-bold text-[9px]">
                    ↓ 2.0%
                  </span>
                  <span className="text-rose-500 font-bold">vs baseline</span>
                  <span className="text-slate-400 font-medium">vs baseline projection</span>
                </div>
              </div>
            </div>

            {/* Right: Projected Baseline Box & Status Pill */}
            <div className="flex flex-col items-end space-y-3 z-10 flex-shrink-0 pl-4">
              {/* Live telemetry pill */}
              <div className="flex items-center px-2 py-0.5 bg-emerald-50 border border-emerald-100/60 rounded-full text-[9px] font-bold text-emerald-605">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 blink-indicator" />
                Live
              </div>

              {/* Projected Box */}
              <div className="border border-slate-200/50 bg-slate-50/50 rounded-xl p-3.5 flex flex-col justify-between w-36 h-20 shadow-2xs">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider leading-none">Projected (Baseline)</span>
                <span className="text-[12px] font-black text-slate-900 leading-none font-mono mt-1.5">$1.58B</span>
                <div className="flex items-center justify-between text-[9px] font-bold mt-2">
                  <span className="text-slate-400 font-medium">Variance</span>
                  <span className="text-rose-500 font-mono">↓ 2.0%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Large custom savings timeline chart */}
          <div className="absolute inset-x-0 bottom-0 h-36 z-0">
            {renderSavingsChart(savingsHistory)}
          </div>
        </div>

        {/* Right Pane: 2x2 grid of Tier 2 & Tier 3 metrics */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Card A: Average ROI (Tier 2 - Purple Accent - Speedometer Gauge) */}
          <div className="flex flex-col justify-between bg-white border border-slate-200/60 rounded-[20px] p-5 relative overflow-hidden transition-all hover:shadow-xs hover:border-slate-300">
            <div className="flex items-start justify-between w-full">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest leading-none">AVERAGE ROI</span>
                <span className="text-[9px] font-bold text-slate-400 mt-1 leading-none">Performance scale</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/50 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-2.5">
              <div className="flex flex-col">
                <span className="text-xl font-black text-slate-900 font-mono tracking-tight leading-none">
                  {metrics.averageROI.toFixed(1)}%
                </span>
                <div className="text-[8.5px] mt-1.5 text-slate-400 font-bold leading-none">
                  <span className={roiDelta.colorClass}>{roiDelta.text}</span>
                </div>
              </div>
              <div className="flex items-center justify-center flex-shrink-0 relative">
                {renderROIGauge(metrics.averageROI)}
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-purple-650 font-mono">
                  {metrics.averageROI.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Active Projects (Tier 3 - Blue Accent - Progress Donut) */}
          <div className="flex flex-col justify-between bg-white border border-slate-200/60 rounded-[20px] p-5 relative overflow-hidden transition-all hover:shadow-xs hover:border-slate-300">
            <div className="flex items-start justify-between w-full">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none">ACTIVE PROJECTS</span>
                <span className="text-[9px] font-bold text-slate-400 mt-1 leading-none">Filter coverage</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-650 flex items-center justify-center border border-blue-100/50 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12a2.25 2.25 0 0 1 2.25-2.25h15A2.25 2.25 0 0 1 21.75 12v.75m-18 0v8.25A2.25 2.25 0 0 0 6 23.25h12A2.25 2.25 0 0 0 20.25 21v-8.25m-18 0h18" />
                </svg>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-2.5">
              <div className="flex flex-col">
                <div className="flex items-baseline leading-none">
                  <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
                    {visibleCount.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 ml-1">/ {metrics.totalProjects.toLocaleString()}</span>
                </div>
                <div className="text-[8.5px] mt-1.5 text-slate-400 font-bold leading-none">
                  <span className={projectsDelta.colorClass}>{projectsDelta.text}</span>
                </div>
              </div>
              <div className="flex items-center justify-center flex-shrink-0 relative">
                {renderProjectsDonut(visibleCount, metrics.totalProjects)}
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-blue-600 font-mono">
                  {((visibleCount / (metrics.totalProjects || 1)) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          {/* Card C: Robots Deployed (Tier 3 - Emerald Accent - Segment Status Grid) */}
          <div className="flex flex-col justify-between bg-white border border-slate-200/60 rounded-[20px] p-5 relative overflow-hidden transition-all hover:shadow-xs hover:border-slate-300">
            <div className="flex items-start justify-between w-full">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-emerald-605 uppercase tracking-widest leading-none">ROBOTS STATUS</span>
                <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider mt-1.5 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 blink-indicator" />
                  Telemetry Live
                </span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <rect x="3" y="6" width="18" height="12" rx="2" />
                  <path d="M8 12h.01M16 12h.01M9 16h6" strokeLinecap="round" />
                  <path d="M12 6V3m0 0h-2m2 0h2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            
            <div className="mt-2.5">
              <span className="text-xl font-black text-slate-900 font-mono tracking-tight leading-none">
                {metrics.totalRobots.toLocaleString()}
              </span>
              <span className="text-[9px] font-bold text-slate-400 ml-1">Deployed</span>
              <div className="text-[8.5px] mt-1.5 font-bold leading-none text-slate-400">
                <span className={robotsDelta.colorClass}>{robotsDelta.text}</span>
              </div>
            </div>
            
            {/* Segmented operational status micro indicators */}
            <div className="h-6 w-full mt-3 overflow-hidden select-none">
              {renderHeroBars(robotsHistory.length > 0 ? robotsHistory : [12, 15, 8, 14, 18, 10, 16, 20, 22, 17, 19, 21, 14, 18, 20, 24, 28, 25, 23, 26, 28])}
            </div>
          </div>

          {/* Card D: Hours Saved (Tier 3 - Indigo/Blue Accent) */}
          <div className="flex flex-col justify-between bg-white border border-slate-200/60 rounded-[20px] p-5 relative overflow-hidden transition-all hover:shadow-xs hover:border-slate-300">
            <div className="flex items-start justify-between w-full">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none">HOURS SAVED</span>
                <span className="text-[9px] font-bold text-slate-400 mt-1 leading-none">Clock indicator</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-650 flex items-center justify-center border border-indigo-100/50 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <div className="mt-2.5 mb-2">
              <span className="text-xl font-black text-slate-900 font-mono tracking-tight leading-none">
                {formatHours(metrics.totalHoursSaved)}
              </span>
              <div className="text-[8.5px] mt-1.5 text-slate-400 font-bold leading-none">
                <span className={hoursDelta.colorClass}>{hoursDelta.text}</span>
              </div>
            </div>
            <div className="h-6 w-full select-none overflow-hidden mt-1">
              {renderSparkline(hoursHistory, '#6366F1')}
            </div>
          </div>

        </div>

      </div>

      {/* Row 2: Secondary stats (AI Core Ratio, Cloud Base, System Incidents) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 5: AI Core Ratio */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4.5 flex flex-col justify-between hover:border-slate-300 transition-all select-none">
          <div className="flex items-center w-full">
            {/* Brain icon rounded box */}
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/50 mr-3.5 flex-shrink-0">
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75-3.75h7.5M12 15.75a3 3 0 0 1-3-3v-.75m3 3.75a3 3 0 0 0 3-3v-.75" />
              </svg>
            </div>
            
            {/* Title and Value details */}
            <div className="flex-grow min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider leading-none">AI CORE RATIO</span>
                <span className={`text-[9px] font-bold ${aiDelta.colorClass}`}>{aiDelta.text}</span>
              </div>
              <div className="text-base font-black text-slate-800 font-mono mt-1 leading-none">{aiPercent.toFixed(1)}%</div>
            </div>
          </div>
          
          {/* Linear Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3.5 overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${aiPercent}%` }} />
          </div>
        </div>

        {/* Card 6: Cloud Base Ratio */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4.5 flex flex-col justify-between hover:border-slate-300 transition-all select-none">
          <div className="flex items-center w-full">
            {/* Cloud icon rounded box */}
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-650 flex items-center justify-center border border-blue-100/50 mr-3.5 flex-shrink-0">
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 00.332-7.482 3.5 3.5 0 00-6.682-1.018 3 3 0 00-4.65 3.224A3 3 0 002.25 15z" />
              </svg>
            </div>
            
            {/* Title and Value details */}
            <div className="flex-grow min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider leading-none">CLOUD BASE RATIO</span>
                <span className={`text-[9px] font-bold ${cloudDelta.colorClass}`}>{cloudDelta.text}</span>
              </div>
              <div className="text-base font-black text-slate-800 font-mono mt-1 leading-none">{cloudPercent.toFixed(1)}%</div>
            </div>
          </div>
          
          {/* Linear Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3.5 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${cloudPercent}%` }} />
          </div>
        </div>

        {/* Card 7: System Incidents */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4.5 flex flex-col justify-between hover:border-slate-300 transition-all select-none">
          <div className="flex items-center w-full">
            {/* Shield icon rounded box */}
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100/50 mr-3.5 flex-shrink-0">
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751A11.956 11.956 0 0 1 12 5.714z" />
              </svg>
            </div>
            
            {/* Title and Value details */}
            <div className="flex-grow min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider leading-none">SYSTEM INCIDENTS</span>
                <span className={`text-[9px] font-bold ${anomalyDelta.colorClass}`}>{anomalyDelta.text}</span>
              </div>
              <div className="text-base font-black text-slate-800 font-mono mt-1 leading-none">{metrics.anomalyCount}</div>
            </div>
          </div>
          
          {/* Dashed orange line */}
          <div className="w-full h-1.5 mt-3.5">
            <svg className="w-full h-full" viewBox="0 0 100 2" preserveAspectRatio="none">
              <line x1="0" y1="1" x2="100" y2="1" stroke="#F97316" strokeWidth="1" strokeDasharray="3 3" />
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
});

KPICards.displayName = 'KPICards';
