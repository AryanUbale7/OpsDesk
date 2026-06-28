'use client';

import React, { useMemo, useState } from 'react';
import { RowStore } from '@/engine/RowStore';
import { StreamManager } from '@/engine/StreamManager';
import { KPIMetrics } from '@/engine/types';

interface IncidentsTabProps {
  store: RowStore;
  streamManager: StreamManager;
  metrics: KPIMetrics | null;
}

export const IncidentsTab: React.FC<IncidentsTabProps> = ({ store, streamManager, metrics }) => {
  const [timelineSearch, setTimelineSearch] = useState('');

  // Sparkline Coordinates for Top Cards
  const criticalSpark = [15, 12, 16, 11, 14, 9, 13, 10, 15, 11, 14, 10];
  const warningSpark = [14, 16, 12, 15, 11, 13, 10, 14, 12, 15, 11, 13];
  const infoSpark = [12, 14, 11, 15, 13, 10, 14, 11, 13, 9, 12, 10];
  const resolvedSpark = [16, 13, 15, 11, 14, 12, 16, 10, 13, 12, 15, 11];

  const renderCardSparkline = (points: number[], color: string) => {
    const width = 140;
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
      
      {/* Header & Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-[26px] font-black text-[#014D3E] tracking-tight leading-none">Incidents</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1.5">
            Critical system alerts and resolution tracking
          </p>
        </div>

        {/* Action buttons + search bar */}
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              className="pl-9 pr-3.5 py-2 w-64 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none placeholder-slate-400 shadow-sm"
              placeholder="Search incidents, projects, or IDs..."
            />
          </div>
          <button className="flex items-center px-4 py-2 bg-white border border-slate-200/85 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-5 transition-colors shadow-sm">
            <svg className="w-3.5 h-3.5 mr-2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-1.2 0-2.4.4-3.4 1.2M9 15c.6 1.8 2.2 3 4 3s3.4-1.2 4-3" />
            </svg>
            Filter
          </button>
          <button className="flex items-center px-4 py-2 bg-[#014D3E] hover:bg-[#013D31] text-white rounded-xl text-xs font-bold shadow-sm transition-colors border border-transparent">
            <span className="mr-1 text-sm font-light">+</span> New Incident
          </button>
        </div>
      </div>

      {/* Row of 4 status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Critical */}
        <div className="bg-white border border-slate-200/40 p-5 rounded-[22px] shadow-sm flex flex-col justify-between h-[125px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-rose-550 uppercase tracking-widest leading-none">CRITICAL</span>
              <span className="text-2xl font-black font-mono text-[#014D3E] mt-2.5 leading-none">12</span>
              <span className="text-[9px] font-bold text-rose-550 mt-2.5 leading-none">↑ 3 since last hour</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100/50 flex-shrink-0">
              <svg className="w-4 h-4 text-rose-550" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="w-full opacity-80 mt-1">{renderCardSparkline(criticalSpark, '#ef4444')}</div>
        </div>

        {/* Card 2: Warning */}
        <div className="bg-white border border-slate-200/40 p-5 rounded-[22px] shadow-sm flex flex-col justify-between h-[125px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-amber-605 uppercase tracking-widest leading-none">WARNING</span>
              <span className="text-2xl font-black font-mono text-[#014D3E] mt-2.5 leading-none">34</span>
              <span className="text-[9px] font-bold text-amber-605 mt-2.5 leading-none">Stable</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100/50 flex-shrink-0">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
              </svg>
            </div>
          </div>
          <div className="w-full opacity-80 mt-1">{renderCardSparkline(warningSpark, '#f59e0b')}</div>
        </div>

        {/* Card 3: Info */}
        <div className="bg-white border border-slate-200/40 p-5 rounded-[22px] shadow-sm flex flex-col justify-between h-[125px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-blue-450 uppercase tracking-widest leading-none">INFO</span>
              <span className="text-2xl font-black font-mono text-[#014D3E] mt-2.5 leading-none">1,479</span>
              <span className="text-[9px] font-bold text-blue-455 mt-2.5 leading-none">System logs & minor flags</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50 flex-shrink-0">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </div>
          </div>
          <div className="w-full opacity-80 mt-1">{renderCardSparkline(infoSpark, '#3b82f6')}</div>
        </div>

        {/* Card 4: Resolved Today */}
        <div className="bg-white border border-slate-200/40 p-5 rounded-[22px] shadow-sm flex flex-col justify-between h-[125px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">RESOLVED TODAY</span>
              <span className="text-2xl font-black font-mono text-[#014D3E] mt-2.5 leading-none">2,778</span>
              <span className="text-[9px] font-bold text-emerald-600 mt-2.5 leading-none">↑ 12% vs yesterday</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50 flex-shrink-0">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068" />
              </svg>
            </div>
          </div>
          <div className="w-full opacity-80 mt-1">{renderCardSparkline(resolvedSpark, '#10b981')}</div>
        </div>

      </div>

      {/* Middle Grid: Active Incident Overview, Live Feed, severity Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        
        {/* Card Left: Active Incident Overview (40%) */}
        <div className="lg:col-span-2 bg-white p-5 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between min-h-[260px]">
          <div className="pb-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ACTIVE INCIDENT OVERVIEW</span>
          </div>

          {/* Incident Overview Grid */}
          <div className="grid grid-cols-4 gap-2 text-center my-1 select-none">
            <div className="flex flex-col items-center">
              <span className="w-2 h-2 rounded-full bg-rose-500 mb-2"></span>
              <span className="text-lg font-black text-[#014D3E] font-mono leading-none">12</span>
              <span className="text-[9px] font-bold text-slate-400 mt-1">Critical</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="w-2 h-2 rounded-full bg-amber-500 mb-2"></span>
              <span className="text-lg font-black text-[#014D3E] font-mono leading-none">34</span>
              <span className="text-[9px] font-bold text-slate-400 mt-1">Warning</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mb-2"></span>
              <span className="text-lg font-black text-[#014D3E] font-mono leading-none">147</span>
              <span className="text-[9px] font-bold text-slate-400 mt-1">Info</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mb-2"></span>
              <span className="text-lg font-black text-[#014D3E] font-mono leading-none">98</span>
              <span className="text-[9px] font-bold text-slate-400 mt-1">Resolved</span>
            </div>
          </div>

          <div className="border-t border-slate-100 my-2"></div>

          {/* MTTR & Incident Load charts */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* MTTR */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wide">MTTR (Mean Time To Resolve)</span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-sm font-black text-slate-800 font-mono">2h 34m</span>
                  <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">&darr; 8% vs yesterday</span>
                </div>
              </div>
              {/* small wavy line */}
              <div className="h-6 mt-1.5">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M 0 18 Q 20 15 40 16 T 80 8 T 100 12" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Incident Load */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wide">Incident Load</span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-sm font-black text-slate-800 font-mono">128 tx/s</span>
                </div>
                <span className="text-[7.5px] text-slate-400 font-semibold block leading-none">Live processing rate</span>
              </div>
              {/* small bar sparkline */}
              <div className="h-6 flex items-end space-x-1 justify-end mt-1.5 pr-2">
                <div className="w-1 bg-[#10b981] h-3 rounded-sm"></div>
                <div className="w-1 bg-[#10b981] h-4 rounded-sm"></div>
                <div className="w-1 bg-[#10b981] h-2.5 rounded-sm"></div>
                <div className="w-1 bg-[#10b981] h-5 rounded-sm"></div>
                <div className="w-1 bg-[#10b981] h-4.5 rounded-sm"></div>
                <div className="w-1 bg-[#10b981] h-3 rounded-sm"></div>
                <div className="w-1 bg-[#10b981] h-3.5 rounded-sm"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Middle: Live Incident Feed (40%) */}
        <div className="lg:col-span-2 bg-white p-5 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between min-h-[260px]">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LIVE INCIDENT FEED</span>
            <button className="text-[10px] font-black text-[#014D3E] hover:underline bg-transparent border-0 p-0">View All</button>
          </div>

          {/* Connected Feed Timeline List */}
          <div className="flex-1 space-y-3.5 mt-3 relative pr-1 overflow-y-auto max-h-[175px]">
            {/* Item 1 */}
            <div className="flex items-start space-x-3 relative">
              <span className="absolute top-5 left-3 bottom-[-18px] w-0.5 bg-slate-100" />
              <div className="w-6.5 h-6.5 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0 border border-rose-100 z-10">
                <span className="text-rose-500 text-[10px]">⚠</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-800 truncate">Database latency spike in EU-West</span>
                  <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap pl-2">02:55 PM</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[9px] font-mono text-slate-400">PRJ021157 &bull; Database Service</span>
                  <span className="text-[7.5px] font-bold bg-rose-50 text-rose-600 border border-rose-100 px-1 py-0.5 rounded uppercase">CRITICAL</span>
                </div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-start space-x-3 relative">
              <span className="absolute top-5 left-3 bottom-[-18px] w-0.5 bg-slate-100" />
              <div className="w-6.5 h-6.5 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-100 z-10">
                <span className="text-amber-600 text-[10px]">⚠</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-800 truncate">Bot #402 offline: Connection lost</span>
                  <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap pl-2">02:20 PM</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[9px] font-mono text-slate-400">PRJ021104 &bull; AI Service</span>
                  <span className="text-[7.5px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-1 py-0.5 rounded uppercase">WARNING</span>
                </div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-start space-x-3 relative">
              <span className="absolute top-5 left-3 bottom-[-18px] w-0.5 bg-slate-100" />
              <div className="w-6.5 h-6.5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100 z-10">
                <span className="text-blue-500 text-[10px]">i</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-800 truncate">API Rate limit warning: Vendor X</span>
                  <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap pl-2">01:48 PM</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[9px] font-mono text-slate-400">PRJ020998 &bull; Payment Gateway</span>
                  <span className="text-[7.5px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-1 py-0.5 rounded uppercase">INFO</span>
                </div>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex items-start space-x-3">
              <div className="w-6.5 h-6.5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100 z-10">
                <span className="text-emerald-600 text-[10px]">✓</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-800 truncate">Cache memory optimized</span>
                  <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap pl-2">01:15 PM</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[9px] font-mono text-slate-400">PRJ020873 &bull; Cache Service</span>
                  <span className="text-[7.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-1 py-0.5 rounded uppercase">RESOLVED</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Right: Severity Distribution (20%) */}
        <div className="lg:col-span-1 bg-white p-5 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between min-h-[260px]">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SEVERITY DISTRIBUTION</span>

          {/* Circular Donut Chart */}
          <div className="flex items-center justify-between my-2.5">
            <div className="w-16 h-16 relative flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F6F6F6" strokeWidth="3" />
                {/* Info segment - 97% */}
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="4.2" strokeDasharray="97 3" strokeDashoffset="0" />
                {/* Warning segment - 2% */}
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="4.2" strokeDasharray="2 98" strokeDashoffset="97" />
                {/* Critical segment - 1% */}
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ef4444" strokeWidth="4.2" strokeDasharray="1 99" strokeDashoffset="99" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-black text-[#014D3E] font-mono leading-none">1,525</span>
                <span className="text-[6.5px] text-slate-400 font-bold uppercase leading-none mt-0.5">Active</span>
              </div>
            </div>

            {/* Severity Legend */}
            <div className="flex flex-col space-y-1.5 text-[9.5px] font-bold text-slate-500">
              <div className="flex items-center justify-between space-x-2">
                <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1" />Critical</span>
                <span className="font-mono text-[9px] text-slate-400">1%</span>
              </div>
              <div className="flex items-center justify-between space-x-2">
                <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1" />Warning</span>
                <span className="font-mono text-[9px] text-slate-400">2%</span>
              </div>
              <div className="flex items-center justify-between space-x-2">
                <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1" />Info</span>
                <span className="font-mono text-[9px] text-slate-400">97%</span>
              </div>
            </div>
          </div>

          {/* Green Health Box Indicator with Bold top line and grey bottom line */}
          <div className="bg-emerald-50/50 border border-emerald-100/60 p-3 rounded-xl flex items-start space-x-2.5">
            <svg className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-emerald-800 leading-tight">97% of incidents are informational.</span>
              <span className="text-[8.5px] font-medium text-emerald-600/70 mt-1 leading-none">System health is stable.</span>
            </div>
          </div>
        </div>

      </div>

      {/* Row 3: Recently Active Incidents & AI Insight Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        
        {/* Recently Active Incidents (65% width) */}
        <div className="lg:col-span-3 bg-white p-6 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between">
          <div className="pb-3.5">
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">RECENTLY ACTIVE INCIDENTS</span>
          </div>

          <div className="w-full overflow-x-auto select-none">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="text-[9.5px] font-black uppercase text-slate-400 border-b border-slate-100 pb-2">
                  <th className="py-2.5">PRIORITY</th>
                  <th className="py-2.5">INCIDENT</th>
                  <th className="py-2.5">PROJECT / SERVICE</th>
                  <th className="py-2.5">DETECTED</th>
                  <th className="py-2.5">STATUS</th>
                  <th className="py-2.5">ASSIGNED TO</th>
                  <th className="py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* Row 1 */}
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3.5">
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold border bg-rose-50 text-rose-700 border-rose-100/60 uppercase">CRITICAL</span>
                  </td>
                  <td className="py-3.5 text-slate-800 font-bold truncate max-w-[140px]">Database latency spike in EU-West</td>
                  <td className="py-3.5 font-mono text-[10px] text-slate-500">PRJ021157 &bull; Database Service</td>
                  <td className="py-3.5 text-slate-500">02:55 PM</td>
                  <td className="py-3.5">
                    <span className="flex items-center text-[10px] font-bold text-slate-655"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />Active</span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex -space-x-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#014D3E] text-white flex items-center justify-center text-[8px] font-black">AM</span>
                      <span className="w-5 h-5 rounded-full bg-indigo-650 text-white flex items-center justify-center text-[8px] font-black">SK</span>
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[8px] font-bold">+2</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-right text-slate-400 font-bold hover:text-slate-700 cursor-pointer">...</td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3.5">
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold border bg-amber-50 text-amber-700 border-amber-100/60 uppercase">WARNING</span>
                  </td>
                  <td className="py-3.5 text-slate-800 font-bold truncate max-w-[140px]">Bot #402 offline: Connection lost</td>
                  <td className="py-3.5 font-mono text-[10px] text-slate-500">PRJ021104 &bull; AI Service</td>
                  <td className="py-3.5 text-slate-500">02:20 PM</td>
                  <td className="py-3.5">
                    <span className="flex items-center text-[10px] font-bold text-slate-655"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />Active</span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex -space-x-1.5">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[8px] font-black">TR</span>
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[8px] font-bold">+1</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-right text-slate-400 font-bold hover:text-slate-700 cursor-pointer">...</td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3.5">
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold border bg-blue-50 text-blue-700 border-blue-100/60 uppercase">INFO</span>
                  </td>
                  <td className="py-3.5 text-slate-800 font-bold truncate max-w-[140px]">API Rate limit warning: Vendor X</td>
                  <td className="py-3.5 font-mono text-[10px] text-slate-500">PRJ020998 &bull; Payment Gateway</td>
                  <td className="py-3.5 text-slate-500">01:48 PM</td>
                  <td className="py-3.5">
                    <span className="flex items-center text-[10px] font-bold text-slate-655"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />Active</span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex -space-x-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-black">AM</span>
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px] font-black">JD</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-right text-slate-400 font-bold hover:text-slate-700 cursor-pointer">...</td>
                </tr>

                {/* Row 4 */}
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3.5">
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold border bg-blue-50 text-blue-700 border-blue-100/60 uppercase">INFO</span>
                  </td>
                  <td className="py-3.5 text-slate-800 font-bold truncate max-w-[140px]">High memory usage on worker node 7</td>
                  <td className="py-3.5 font-mono text-[10px] text-slate-500">PRJ021221 &bull; Compute Service</td>
                  <td className="py-3.5 text-slate-500">01:30 PM</td>
                  <td className="py-3.5">
                    <span className="flex items-center text-[10px] font-bold text-slate-655"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />Active</span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex -space-x-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] font-black">RK</span>
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[8px] font-bold">+3</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-right text-slate-400 font-bold hover:text-slate-700 cursor-pointer">...</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Centered link at the bottom */}
          <div className="flex justify-center border-t border-slate-100 pt-4 mt-3">
            <button className="text-xs font-bold text-[#014D3E] hover:underline flex items-center bg-transparent border-0 p-0">
              View All Incidents
              <svg className="w-3.5 h-3.5 ml-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Sidebar: AI Insights + Quick Actions (35% width) */}
        <div className="lg:col-span-2 flex flex-col justify-between space-y-5">
          {/* AI Insight Box */}
          <div className="bg-white p-5 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between flex-1">
            <div className="flex items-center space-x-2 pb-1.5">
              <span className="text-purple-600 text-base">✦</span>
              <span className="text-[10px] font-black text-slate-400 tracking-wider">AI INSIGHT</span>
            </div>
            <p className="text-xs font-semibold text-slate-700 leading-relaxed my-2">
              Database latency spike in EU-West is impacting response time. Suggested fix available.
            </p>
            <div className="flex justify-end pt-1">
              <button className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-5 shadow-sm">
                View Recommendation &rarr;
              </button>
            </div>
          </div>

          {/* Quick Actions List Grid */}
          <div className="bg-white p-5 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase mb-3.5 block">QUICK ACTIONS</span>
            
            <div className="grid grid-cols-2 gap-3.5">
              <button className="flex items-center px-3.5 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-5 shadow-sm">
                <span className="w-2.5 h-2.5 mr-2 text-emerald-500 font-extrabold flex items-center justify-center text-sm">+</span>
                Create Incident
              </button>
              <button className="flex items-center px-3.5 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-5 shadow-sm">
                <svg className="w-3.5 h-3.5 mr-2 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125" />
                </svg>
                Incidents Report
              </button>
              <button className="flex items-center px-3.5 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-5 shadow-sm">
                <svg className="w-3.5 h-3.5 mr-2 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856" />
                </svg>
                Escalation Rules
              </button>
              <button className="flex items-center px-3.5 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-5 shadow-sm">
                <svg className="w-3.5 h-3.5 mr-2 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.187 9.222l-1.5-1.5a.75.75 0 00-1.061 1.06l1.5 1.5a.75.75 0 001.06-1.06zM9.769 11.64l-1.5-1.5a.75.75 0 10-1.06 1.06l1.5 1.5a.75.75 0 101.06-1.06z" />
                </svg>
                Integrations
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
