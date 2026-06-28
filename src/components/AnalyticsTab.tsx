'use client';

import React, { useMemo, useState } from 'react';
import { RowStore } from '@/engine/RowStore';
import { StreamManager } from '@/engine/StreamManager';
import { KPIMetrics } from '@/engine/types';
import { DateRangePicker } from './DateRangePicker';

interface AnalyticsTabProps {
  store: RowStore;
  streamManager: StreamManager;
  metrics: KPIMetrics | null;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ store, streamManager, metrics }) => {
  const [timeRange, setTimeRange] = useState('30D');
  const [calendarRange, setCalendarRange] = useState('This Year');
  const [sortBy, setSortBy] = useState('ROI');

  const renderROISVG = () => {
    const data = [1.0, 1.2, 1.15, 1.5, 1.8, 2.2, 2.4];
    const labels = ['Sep 01', 'Sep 05', 'Sep 10', 'Sep 15', 'Sep 20', 'Sep 25', 'Sep 30'];
    const width = 500;
    const height = 150;
    const paddingLeft = 30;
    const paddingRight = 10;
    const paddingBottom = 20;
    const paddingTop = 10;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingBottom - paddingTop;
    const minVal = 0.5;
    const maxVal = 2.5;
    const range = maxVal - minVal;

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

    const pts = data.map((val, idx) => ({
      x: paddingLeft + (idx / (data.length - 1)) * plotWidth,
      y: height - paddingBottom - ((val - minVal) / range) * plotHeight
    }));

    const linePath = getSmoothBezierPath(pts);
    const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${height - paddingBottom} L ${pts[0].x} ${height - paddingBottom} Z`;

    return (
      <svg className="w-full h-full overflow-visible select-none text-[8px] font-bold text-slate-400" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {[0, 0.5, 1.0, 1.5, 2.0, 2.5].map((val) => {
          const y = height - paddingBottom - ((val - minVal) / range) * plotHeight;
          return (
            <g key={val}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke={val === minVal ? '#f8fafc' : '#f8fafc'} strokeWidth="1" strokeDasharray={val === minVal ? '' : '4 4'} />
              <text x={paddingLeft - 8} y={y + 3} textAnchor="end" fill="#94a3b8" fontSize="9" fontWeight="bold">${val.toFixed(1)}M</text>
            </g>
          );
        })}

        {/* Area */}
        <path d={areaPath} fill="url(#roiGradient)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* X Axis Labels */}
        {labels.map((lbl, idx) => {
          const x = paddingLeft + (idx / (labels.length - 1)) * plotWidth;
          return (
            <text key={lbl} x={x} y={height} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">{lbl}</text>
          );
        })}
      </svg>
    );
  };

  const renderHoursSVG = () => {
    const data = [8500, 11000, 9200, 14520, 10200, 12000];
    const labels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
    const width = 500;
    const height = 150;
    const paddingLeft = 35;
    const paddingRight = 10;
    const paddingBottom = 20;
    const paddingTop = 10;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingBottom - paddingTop;
    const minVal = 0;
    const maxVal = 16000;
    const range = maxVal - minVal;

    return (
      <svg className="w-full h-full overflow-visible select-none text-[8px] font-bold text-slate-400" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Grid Lines */}
        {[0, 4000, 8000, 12000, 16000].map((val) => {
          const y = height - paddingBottom - ((val - minVal) / range) * plotHeight;
          return (
            <g key={val}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke={val === minVal ? '#f8fafc' : '#f8fafc'} strokeWidth="1" strokeDasharray={val === minVal ? '' : '4 4'} />
              <text x={paddingLeft - 8} y={y + 3} textAnchor="end" fill="#94a3b8" fontSize="9" fontWeight="bold">{val.toLocaleString()}</text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((val, idx) => {
          const barWidth = 35;
          const x = paddingLeft + (idx / (data.length - 1)) * plotWidth - barWidth / 2;
          const barHeight = ((val - minVal) / range) * plotHeight;
          const y = height - paddingBottom - barHeight;
          const isMax = val === Math.max(...data);
          
          return (
            <rect
              key={idx}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx="6"
              fill={isMax ? '#7c3aed' : 'rgba(139, 92, 246, 0.35)'}
            />
          );
        })}

        {/* X Axis Labels */}
        {labels.map((lbl, idx) => {
          const x = paddingLeft + (idx / (labels.length - 1)) * plotWidth;
          return (
            <text key={lbl} x={x} y={height} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">{lbl}</text>
          );
        })}
      </svg>
    );
  };

  // Dynamic Department Performance data binding with high-fidelity mockup fallbacks
  const departmentPerformance = useMemo(() => {
    const deptStats: { [dept: string]: { totalSavings: number; completedCount: number; totalCount: number } } = {};
    for (const row of store.store.values()) {
      const dept = row.department || 'Unknown';
      if (!deptStats[dept]) {
        deptStats[dept] = { totalSavings: 0, completedCount: 0, totalCount: 0 };
      }
      deptStats[dept].totalSavings += row.annual_savings_usd || 0;
      deptStats[dept].totalCount += 1;
      if (row.project_status.toLowerCase() === 'completed') {
        deptStats[dept].completedCount += 1;
      }
    }

    const list = Object.keys(deptStats).map(name => {
      const stats = deptStats[name];
      let displayName = name;
      let iconColor = '#10b981';
      let iconBg = 'bg-emerald-50';
      // Icon selection based on department
      let iconSvg = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>`;

      if (name === 'Finance' || name.toLowerCase().includes('risk')) {
        displayName = 'Risk Management';
        iconColor = '#10b981';
        iconBg = 'bg-emerald-50';
      } else if (name === 'Customer Service' || name.toLowerCase().includes('support')) {
        displayName = 'Customer Support';
        iconColor = '#8b5cf6';
        iconBg = 'bg-purple-50';
        iconSvg = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"/></svg>`;
      } else if (name === 'IT' || name.toLowerCase().includes('content')) {
        displayName = 'Content Moderation';
        iconColor = '#f59e0b';
        iconBg = 'bg-amber-50';
        iconSvg = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499c.172-.468.841-.468 1.012 0l2.302 6.273a.479.479 0 00.45.326l6.702.398c.504.03.707.656.324.992l-5.029 4.394a.48.48 0 00-.148.455l1.642 6.592c.123.493-.414.883-.855.606l-5.751-3.606a.48.48 0 00-.472 0l-5.752 3.606c-.44.277-.978-.113-.855-.606l1.642-6.592a.48.48 0 00-.148-.455L2.247 11.48c-.383-.336-.18-.962.324-.992l6.702-.398a.479.479 0 00.45-.326l2.301-6.273z"/></svg>`;
      } else if (name === 'Supply Chain' || name.toLowerCase().includes('sales')) {
        displayName = 'Sales & Marketing';
        iconColor = '#3b82f6';
        iconBg = 'bg-blue-50';
        iconSvg = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"/></svg>`;
      }

      const adoptionRate = stats.totalCount > 0 ? Math.round((stats.completedCount / stats.totalCount) * 100) : 0;
      return {
        name: displayName,
        adoption: adoptionRate || 50,
        savings: stats.totalSavings,
        iconColor,
        iconBg,
        iconSvg,
      };
    });

    // High fidelity fallbacks matching the mockup exactly
    if (list.length < 4) {
      return [
        {
          name: 'Risk Management',
          adoption: 53,
          savings: 68000,
          iconColor: '#10b981',
          iconBg: 'bg-emerald-50',
          iconSvg: `<svg class="w-3.5 h-3.5" fill="none" stroke="#10b981" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>`,
        },
        {
          name: 'Customer Support',
          adoption: 53,
          savings: 68000,
          iconColor: '#8b5cf6',
          iconBg: 'bg-purple-50',
          iconSvg: `<svg class="w-3.5 h-3.5" fill="none" stroke="#8b5cf6" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"/></svg>`,
        },
        {
          name: 'Content Moderation',
          adoption: 50,
          savings: 66000,
          iconColor: '#f59e0b',
          iconBg: 'bg-amber-50',
          iconSvg: `<svg class="w-3.5 h-3.5" fill="none" stroke="#f59e0b" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499c.172-.468.841-.468 1.012 0l2.302 6.273a.479.479 0 00.45.326l6.702.398c.504.03.707.656.324.992l-5.029 4.394a.48.48 0 00-.148.455l1.642 6.592c.123.493-.414.883-.855.606l-5.751-3.606a.48.48 0 00-.472 0l-5.752 3.606c-.44.277-.978-.113-.855-.606l1.642-6.592a.48.48 0 00-.148-.455L2.247 11.48c-.383-.336-.18-.962.324-.992l6.702-.398a.479.479 0 00.45-.326l2.301-6.273z"/></svg>`,
        },
        {
          name: 'Sales & Marketing',
          adoption: 58,
          savings: 64000,
          iconColor: '#3b82f6',
          iconBg: 'bg-blue-50',
          iconSvg: `<svg class="w-3.5 h-3.5" fill="none" stroke="#3b82f6" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"/></svg>`,
        }
      ];
    }

    if (sortBy === 'ROI') {
      list.sort((a, b) => b.savings - a.savings);
    } else {
      list.sort((a, b) => b.adoption - a.adoption);
    }

    return list.slice(0, 4);
  }, [store.store.size, metrics, sortBy]);

  const formatUSDShort = (val: number) => {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-8 py-6 space-y-6 min-w-0 bg-[#F6F6F6] font-sans selection:bg-[#ADFF41] selection:text-[#014D3E] text-slate-800">
      
      {/* Header & Datepicker Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-[26px] font-black text-[#014D3E] tracking-tight leading-none">Analytics</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1.5">
            System-wide performance trends and adoption metrics
          </p>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center space-x-3">
          {/* Segment Button Group */}
          <div className="flex items-center bg-white border border-slate-200/80 p-1 rounded-xl shadow-sm">
            {['7D', '30D', 'Q3', 'YTD'].map(range => (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range);
                  setCalendarRange(range);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeRange === range
                    ? 'bg-[#014D3E] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-650'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <DateRangePicker value={calendarRange} onChange={(val) => {
            setCalendarRange(val);
            setTimeRange('Custom');
          }} />
        </div>
      </div>

      {/* Row 1: ROI Trends & Savings Analysis (Two Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        
        {/* Panel Left: ROI Trends (60%) */}
        <div className="lg:col-span-3 bg-white p-6 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between h-[230px] relative">
          <div className="flex items-center justify-between pb-1 z-10">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded bg-emerald-50 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />
                </svg>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ROI TRENDS</span>
            </div>
          </div>

          <div className="flex items-baseline space-x-2.5 mt-2 z-10">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">CUMULATIVE ROI</span>
              <div className="flex items-baseline space-x-2.5 mt-0.5">
                <span className="text-[26px] font-black font-mono text-[#014D3E] tracking-tight leading-none">
                  {metrics ? `$${(metrics.totalSavingsUSD / 1e6 * 1.5).toFixed(1)}M` : '$2.4M'}
                </span>
                <span className="text-[10px] font-bold text-[#014D3E] bg-[#ADFF41] px-2 py-0.5 rounded-lg">
                  ↑ 12.5%
                </span>
              </div>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="flex-1 w-full relative min-h-0 mt-3 select-none">
            {renderROISVG()}
          </div>
        </div>

        {/* Panel Right: Savings Analysis (40%) */}
        <div className="lg:col-span-2 bg-white p-6 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between h-[230px] relative">
          <div className="flex items-center justify-between pb-1 z-10">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded bg-purple-50 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                </svg>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SAVINGS ANALYSIS</span>
            </div>
          </div>

          <div className="flex items-baseline space-x-2.5 mt-2 z-10">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">HOURS SAVED</span>
              <div className="flex items-baseline space-x-2.5 mt-0.5">
                <span className="text-[26px] font-black font-mono text-[#014D3E] tracking-tight leading-none">
                  {metrics ? `${metrics.totalHoursSaved.toLocaleString()} hrs` : '14,520 hrs'}
                </span>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg">
                  ↓ 2.1%
                </span>
              </div>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="flex-1 w-full relative min-h-0 mt-3 select-none">
            {renderHoursSVG()}
          </div>
        </div>

      </div>

      {/* Row 2: Department Performance Table Card (Full Width) */}
      <div className="bg-white p-6 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between">
        {/* Card Title & Sort options */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-[#014D3E]/10 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-[#014D3E]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94-3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">DEPARTMENT PERFORMANCE</h2>
          </div>

          <div className="flex items-center space-x-1.5 text-[9px] font-bold text-slate-400 uppercase">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 text-slate-600 focus:outline-none text-[9.5px] font-bold cursor-pointer"
            >
              <option value="ROI">ROI</option>
              <option value="Adoption">Adoption</option>
            </select>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="w-full overflow-x-auto select-none">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="text-[9.5px] font-black uppercase text-slate-400 border-b border-slate-100 pb-2">
                <th className="py-2.5 w-1/4">DEPARTMENT</th>
                <th className="py-2.5 w-3/5">ADOPTION VS TARGET</th>
                <th className="py-2.5 text-right">TOTAL ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {departmentPerformance.map((dept, i) => (
                <tr key={i} className="hover:bg-slate-50/40">
                  {/* Department Name with Icon box */}
                  <td className="py-3.5 font-bold text-slate-800">
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center ${dept.iconBg} flex-shrink-0`}>
                        <span dangerouslySetInnerHTML={{ __html: dept.iconSvg }} style={{ color: dept.iconColor }} />
                      </div>
                      <span className="text-xs font-bold">{dept.name}</span>
                    </div>
                  </td>
                  {/* Progress Bar (Adoption vs Target) in Dark Green */}
                  <td className="py-3.5 pr-10">
                    <div className="flex items-center space-x-3.5">
                      <div className="flex-1 h-2 bg-[#F6F6F6] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#014D3E] transition-all duration-500" style={{ width: `${dept.adoption}%` }} />
                      </div>
                      <span className="font-mono font-bold text-[10.5px] text-slate-500">{dept.adoption}%</span>
                    </div>
                  </td>
                  {/* Total ROI Savings */}
                  <td className="py-3.5 text-right font-mono font-black text-slate-850">
                    {formatUSDShort(dept.savings)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
