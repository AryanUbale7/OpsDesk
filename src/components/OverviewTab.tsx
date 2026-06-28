'use client';

import React, { useMemo, useState } from 'react';
import { RowStore } from '@/engine/RowStore';
import { StreamManager } from '@/engine/StreamManager';
import { KPIMetrics } from '@/engine/types';
import { KPICards } from './KPICards';

interface OverviewTabProps {
  store: RowStore;
  streamManager: StreamManager;
  metrics: KPIMetrics | null;
  visibleCount: number;
  history?: KPIMetrics[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ store, streamManager, metrics, visibleCount, history }) => {
  const [timeframe, setTimeframe] = useState('This Year');

  // Sparkline coordinates for top KPI cards
  const savingsSpark = [15, 14, 16, 12, 14, 10, 11, 13, 9, 11, 12];
  const roiSpark = [16, 14, 15, 13, 11, 14, 12, 10, 13, 11, 12];
  const activeSpark = [13, 15, 12, 14, 10, 11, 8, 12, 9, 10, 11];
  const robotsSpark = [14, 16, 13, 15, 12, 14, 11, 13, 12, 10, 11];

  const renderCardSparkline = (points: number[], color: string) => {
    const width = 180;
    const height = 15;
    const n = points.length;
    const pathCoords = points.map((y, i) => `${(i / (n - 1)) * width},${y}`).join(' L ');

    return (
      <svg className="w-full h-4 overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <path d={`M ${pathCoords}`} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-8 py-6 space-y-6 min-w-0 bg-[#F6F6F6] font-sans selection:bg-[#ADFF41] selection:text-[#014D3E] text-slate-800">
      
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <h1 className="text-[26px] font-black text-[#014D3E] tracking-tight leading-none">Overview</h1>
            <span className="text-[#014D3E] text-lg">✦</span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-1.5">
            Executive command center — monitoring 5,000 autonomous agents
          </p>
        </div>

        {/* Date Selector Button */}
        <button className="bg-white border border-slate-200/80 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 flex items-center shadow-sm hover:bg-slate-50 transition-colors">
          <svg className="w-4 h-4 mr-2 text-slate-450" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-18 0h18" />
          </svg>
          Jun 28, 2025
          <svg className="w-3 h-3 ml-2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* Row 1: KPI Cards */}
      <KPICards
        metrics={metrics}
        visibleCount={visibleCount}
        history={history || []}
      />

      {/* Middle Row Section: Operations Health & Incident Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Card Left: Operations Health */}
        <div className="bg-white p-5 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between min-h-[260px]">
          <div className="flex items-center space-x-2.5 pb-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751A11.956 11.956 0 0 1 12 5.714z" />
            </svg>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider leading-none">Operations Health</span>
              <span className="text-[9px] font-semibold text-slate-400 mt-0.5 leading-none">Real-time status of autonomous operations</span>
            </div>
          </div>

          {/* Health details layout */}
          <div className="flex items-center justify-between my-2">
            {/* Left Circular Gauge */}
            <div className="w-28 h-28 relative flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E6F4EA" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10B981" strokeWidth="3.2" strokeDasharray="100 0" strokeDashoffset="0" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                {/* Heartbeat pulse icon */}
                <svg className="w-4 h-4 text-emerald-500 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.75l-1.425-1.3C5.4 15.65 2 12.4 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3c3.08 0 5.5 2.42 5.5 5.5 0 3.9-3.4 7.15-8.57 11.96L12 21.75z" />
                </svg>
                <span className="text-base font-black text-[#014D3E] font-mono leading-none">5,000</span>
                <span className="text-[7px] text-slate-400 font-black uppercase tracking-widest mt-0.5 leading-none">TOTAL</span>
              </div>
            </div>

            {/* Right status grids */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 pr-6 flex-1 pl-10 select-none">
              <div className="flex flex-col">
                <span className="flex items-center text-[9px] font-bold text-slate-400 uppercase"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />Active</span>
                <span className="text-base font-black font-mono text-slate-800 leading-none mt-1 pl-3">1,470</span>
              </div>
              <div className="flex flex-col">
                <span className="flex items-center text-[9px] font-bold text-slate-400 uppercase"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />Completed</span>
                <span className="text-base font-black font-mono text-slate-800 leading-none mt-1 pl-3">2,770</span>
              </div>
              <div className="flex flex-col">
                <span className="flex items-center text-[9px] font-bold text-slate-400 uppercase"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5" />Planned</span>
                <span className="text-base font-black font-mono text-slate-800 leading-none mt-1 pl-3">760</span>
              </div>
              <div className="flex flex-col">
                <span className="flex items-center text-[9px] font-bold text-slate-400 uppercase"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />Failed</span>
                <span className="text-base font-black font-mono text-slate-800 leading-none mt-1 pl-3">0</span>
              </div>
            </div>
          </div>

          {/* Bottom health bar */}
          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-500">Health Score <span className="text-emerald-600 font-mono pl-1.5">100.0 / 100</span></span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[9px] tracking-wide">✓ Excellent</span>
          </div>
        </div>

        {/* Card Right: Incident Summary */}
        <div className="bg-white p-5 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between min-h-[260px]">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center space-x-2.5">
              <svg className="w-5 h-5 text-rose-550" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75A11.956 11.956 0 0 1 12 5.714zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider leading-none">Incident Summary</span>
                <span className="text-[9px] font-semibold text-slate-400 mt-0.5 leading-none">Overview of system incidents</span>
              </div>
            </div>
            <button className="text-[10px] font-black text-[#014D3E] hover:underline bg-transparent border-0 p-0">View All</button>
          </div>

          {/* Incident layout detail */}
          <div className="flex items-center justify-between my-2">
            {/* Left donut circular indicator */}
            <div className="w-20 h-20 relative flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F6F6F6" strokeWidth="3.2" />
                {/* 2 Critical, 3 High, 7 Low => total 12 */}
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="17 83" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="25 75" strokeDashoffset="83" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="58 42" strokeDashoffset="58" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-base font-black text-[#014D3E] font-mono leading-none">12</span>
                <span className="text-[6px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 leading-none">TOTAL</span>
              </div>
            </div>

            {/* Middle severity boxes */}
            <div className="flex flex-col space-y-1.5 pl-4 flex-shrink-0 select-none">
              <div className="flex items-center space-x-2.5">
                <span className="w-6 py-0.5 rounded text-center bg-rose-50 text-rose-700 text-[10px] font-black font-mono">2</span>
                <span className="text-[9.5px] font-bold text-slate-500">Critical</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="w-6 py-0.5 rounded text-center bg-amber-50 text-amber-700 text-[10px] font-black font-mono">3</span>
                <span className="text-[9.5px] font-bold text-slate-500">High</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="w-6 py-0.5 rounded text-center bg-blue-50 text-blue-700 text-[10px] font-black font-mono">7</span>
                <span className="text-[9.5px] font-bold text-slate-500">Low</span>
              </div>
            </div>

            {/* Right incident lists */}
            <div className="flex flex-col space-y-2.5 pl-6 border-l border-slate-100 flex-grow text-[9.5px] font-semibold text-slate-550 select-none min-w-0 pr-1">
              <div className="flex items-center justify-between space-x-1.5">
                <span className="flex items-center truncate text-slate-800 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2 flex-shrink-0" />Database latency spike in EU-West</span>
                <span className="font-mono text-[9px] text-slate-400 flex-shrink-0">2m ago</span>
              </div>
              <div className="flex items-center justify-between space-x-1.5">
                <span className="flex items-center truncate text-slate-800 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2 flex-shrink-0" />Bot #402 offline: Connection lost</span>
                <span className="font-mono text-[9px] text-slate-400 flex-shrink-0">15m ago</span>
              </div>
              <div className="flex items-center justify-between space-x-1.5">
                <span className="flex items-center truncate text-slate-800 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 flex-shrink-0" />API Rate limit warning: Vendor X</span>
                <span className="font-mono text-[9px] text-slate-400 flex-shrink-0">1h ago</span>
              </div>
            </div>
          </div>

          {/* Bottom navigation link button */}
          <div className="border-t border-slate-105 pt-2 mt-1">
            <button className="w-full py-1.5 bg-white border border-slate-200 rounded-xl text-[10.5px] font-bold text-emerald-600 flex items-center justify-center hover:bg-slate-5 shadow-sm transition-all">
              View All Incidents &rarr;
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Grid Section: Savings Trend, Department performance, System Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Savings Trend Panel (Line Chart) */}
        <div className="bg-white p-5 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between h-[280px]">
          <div className="flex items-center justify-between pb-1 border-b border-slate-50">
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider leading-none">Savings Trend</span>
              <span className="text-[9.5px] font-semibold text-slate-400 mt-1 leading-none">Yearly savings performance</span>
            </div>
            <button className="bg-[#F6F6F6] hover:bg-slate-100 border border-slate-200/80 rounded-xl px-2.5 py-1 text-[9.5px] text-slate-650 font-bold tracking-wide flex items-center shadow-sm">
              This Year
              <svg className="w-3 h-3 ml-1.5 text-slate-450" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>

          {/* Wavy Sparkline Area chart with filled green opacity */}
          <div className="flex-1 w-full relative min-h-0 mt-3 select-none">
            <svg className="w-full h-[145px] overflow-visible" viewBox="0 0 260 110" preserveAspectRatio="none">
              <defs>
                <linearGradient id="savingsTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Guidelines Y-axis */}
              <line x1="25" y1="20" x2="250" y2="20" stroke="#F6F6F6" strokeWidth="1" />
              <line x1="25" y1="50" x2="250" y2="50" stroke="#F6F6F6" strokeWidth="1" />
              <line x1="25" y1="80" x2="250" y2="80" stroke="#F6F6F6" strokeWidth="1" />

              {/* Y Axis labels */}
              <text x="20" y="23" textAnchor="end" className="fill-slate-400 text-[7px] font-mono font-bold">$1.8B</text>
              <text x="20" y="53" textAnchor="end" className="fill-slate-400 text-[7px] font-mono font-bold">$1.2B</text>
              <text x="20" y="83" textAnchor="end" className="fill-slate-400 text-[7px] font-mono font-bold">$600M</text>
              <text x="20" y="103" textAnchor="end" className="fill-slate-400 text-[7px] font-mono font-bold">$0</text>

              {/* Area filled path */}
              <path d="M 25 90 Q 70 80 110 75 T 180 65 T 250 50 L 250 100 L 25 100 Z" fill="url(#savingsTrendGrad)" />
              {/* Main stroke line */}
              <path d="M 25 90 Q 70 80 110 75 T 180 65 T 250 50" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
              <circle cx="250" cy="50" r="3.5" fill="#10b981" stroke="#FFFFFF" strokeWidth="1.5" />

              {/* X Axis month labels */}
              <text x="25" y="112" textAnchor="middle" className="fill-slate-400 text-[8px] font-bold">Jan</text>
              <text x="70" y="112" textAnchor="middle" className="fill-slate-400 text-[8px] font-bold">Feb</text>
              <text x="115" y="112" textAnchor="middle" className="fill-slate-400 text-[8px] font-bold">Mar</text>
              <text x="160" y="112" textAnchor="middle" className="fill-slate-400 text-[8px] font-bold">Apr</text>
              <text x="205" y="112" textAnchor="middle" className="fill-slate-400 text-[8px] font-bold">May</text>
              <text x="250" y="112" textAnchor="middle" className="fill-slate-400 text-[8px] font-bold">Jun</text>
            </svg>
          </div>
        </div>

        {/* Top Performing Departments */}
        <div className="bg-white p-5 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between h-[280px]">
          <div className="flex items-center justify-between pb-1 border-b border-slate-50">
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider leading-none">Top Performing Departments</span>
              <span className="text-[9.5px] font-semibold text-slate-400 mt-1 leading-none">By ROI contribution</span>
            </div>
            <button className="text-[10px] font-black text-[#014D3E] hover:underline bg-transparent border-0 p-0">View All</button>
          </div>

          {/* Department performance ranks */}
          <div className="flex-1 space-y-3.5 mt-3 select-none text-[10.5px]">
            {/* 01 */}
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-mono text-slate-350 font-bold w-4 text-center">01</span>
              <span className="font-bold flex-grow pl-2 w-28 truncate">Payroll</span>
              <div className="flex-grow max-w-[90px] h-1.5 bg-[#F6F6F6] rounded-full overflow-hidden mx-3">
                <div className="h-full rounded-full bg-[#014D3E]" style={{ width: '85%' }}></div>
              </div>
              <span className="font-mono font-bold text-slate-705 w-10 text-right">188%</span>
            </div>
            {/* 02 */}
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-mono text-slate-350 font-bold w-4 text-center">02</span>
              <span className="font-bold flex-grow pl-2 w-28 truncate">Audit</span>
              <div className="flex-grow max-w-[90px] h-1.5 bg-[#F6F6F6] rounded-full overflow-hidden mx-3">
                <div className="h-full rounded-full bg-blue-500" style={{ width: '75%' }}></div>
              </div>
              <span className="font-mono font-bold text-slate-705 w-10 text-right">176%</span>
            </div>
            {/* 03 */}
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-mono text-slate-350 font-bold w-4 text-center">03</span>
              <span className="font-bold flex-grow pl-2 w-28 truncate">Claims Processing</span>
              <div className="flex-grow max-w-[90px] h-1.5 bg-[#F6F6F6] rounded-full overflow-hidden mx-3">
                <div className="h-full rounded-full bg-purple-500" style={{ width: '80%' }}></div>
              </div>
              <span className="font-mono font-bold text-slate-705 w-10 text-right">181%</span>
            </div>
            {/* 04 */}
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-mono text-slate-350 font-bold w-4 text-center">04</span>
              <span className="font-bold flex-grow pl-2 w-28 truncate">Healthcare Admin</span>
              <div className="flex-grow max-w-[90px] h-1.5 bg-[#F6F6F6] rounded-full overflow-hidden mx-3">
                <div className="h-full rounded-full bg-amber-500" style={{ width: '70%' }}></div>
              </div>
              <span className="font-mono font-bold text-slate-705 w-10 text-right">171%</span>
            </div>
            {/* 05 */}
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-mono text-slate-350 font-bold w-4 text-center">05</span>
              <span className="font-bold flex-grow pl-2 w-28 truncate">Sales & Marketing</span>
              <div className="flex-grow max-w-[90px] h-1.5 bg-[#F6F6F6] rounded-full overflow-hidden mx-3">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: '78%' }}></div>
              </div>
              <span className="font-mono font-bold text-slate-705 w-10 text-right">177%</span>
            </div>
          </div>
        </div>

        {/* System Alerts Feed */}
        <div className="bg-white p-5 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between h-[280px]">
          <div className="flex items-center justify-between pb-1 border-b border-slate-50">
            <div className="flex items-center space-x-2.5">
              <svg className="w-5 h-5 text-rose-550" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75v-.7V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider leading-none">System Alerts</span>
                <span className="text-[9.5px] font-semibold text-slate-400 mt-1 leading-none">Important system notifications</span>
              </div>
            </div>
            <button className="text-[10px] font-black text-[#014D3E] hover:underline bg-transparent border-0 p-0">View All</button>
          </div>

          {/* System alerts timeline list */}
          <div className="flex-1 space-y-3.5 mt-3 select-none text-[10px]">
            {/* Item 1 */}
            <div className="bg-amber-50/40 border border-amber-100/40 px-3.5 py-2.5 rounded-xl flex items-start justify-between space-x-2">
              <svg className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div className="flex-grow pl-1.5 flex flex-col">
                <span className="font-bold text-slate-800 leading-tight">High memory usage on worker node 7</span>
              </div>
              <span className="font-mono text-[8.5px] text-slate-400 whitespace-nowrap pl-2">10m ago</span>
            </div>

            {/* Item 2 */}
            <div className="bg-emerald-50/40 border border-emerald-100/40 px-3.5 py-2.5 rounded-xl flex items-start justify-between space-x-2">
              <svg className="w-3.5 h-3.5 text-emerald-605 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <div className="flex-grow pl-1.5 flex flex-col">
                <span className="font-bold text-slate-800 leading-tight">All systems operational</span>
              </div>
              <span className="font-mono text-[8.5px] text-slate-400 whitespace-nowrap pl-2">25m ago</span>
            </div>

            {/* Item 3 */}
            <div className="bg-blue-50/40 border border-blue-100/40 px-3.5 py-2.5 rounded-xl flex items-start justify-between space-x-2">
              <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12v-.008z" />
              </svg>
              <div className="flex-grow pl-1.5 flex flex-col">
                <span className="font-bold text-slate-800 leading-tight">Scheduled maintenance on July 2, 2025</span>
              </div>
              <span className="font-mono text-[8.5px] text-slate-400 whitespace-nowrap pl-2">1h ago</span>
            </div>
          </div>
        </div>

      </div>

      {/* System Health Status Footer Card */}
      <div className="bg-[#EBF5FF]/40 border border-[#DBEAFE] rounded-[20px] p-4 flex items-center justify-between select-none">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-650 flex items-center justify-center border border-emerald-100/50 mr-3.5 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.913-6.241C19.789 13.681 21 12 21 10.125V9a1 1 0 00-1-1h-6.812l.813-5.096L5.087 9.141A4 4 0 003 12.375V13.5a1 1 0 001 1h6.812z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-slate-800 leading-none">Command Center Healthy</span>
            <span className="text-[10px] text-slate-500 font-semibold mt-1.5">All systems operational and performing within normal parameters.</span>
          </div>
        </div>
        <button className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2 text-[10.5px] font-bold text-blue-600 flex items-center shadow-sm transition-all hover:border-slate-300">
          View System Health
          <svg className="w-3.5 h-3.5 ml-1.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>

    </div>
  );
};
