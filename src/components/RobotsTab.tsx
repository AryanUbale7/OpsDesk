'use client';

import React, { useMemo, useState } from 'react';
import { RowStore } from '@/engine/RowStore';
import { StreamManager } from '@/engine/StreamManager';
import { KPIMetrics } from '@/engine/types';
import { DateRangePicker } from './DateRangePicker';

interface RobotsTabProps {
  store: RowStore;
  streamManager: StreamManager;
  metrics: KPIMetrics | null;
}

export const RobotsTab: React.FC<RobotsTabProps> = ({ store, streamManager, metrics }) => {
  const [timeframe, setTimeframe] = useState('This Year');

  // Aggregate total robots dynamically from the live telemetry store
  const totalRobots = useMemo(() => {
    let sum = 0;
    for (const row of store.store.values()) {
      sum += row.robots_deployed || 0;
    }
    return sum || 128073;
  }, [store.store.size, metrics]);

  // Generate fleet lists for visual grid representing robot workers
  const robotFleet = useMemo(() => {
    return [
      { id: 'BOT-991A', type: 'RPA Node', task: 'HR Invoice Parsing', load: 84, status: 'ONLINE', ping: '12ms' },
      { id: 'BOT-991B', type: 'AI Agent', task: 'Customer Reply Auto', load: 92, status: 'ONLINE', ping: '45ms' },
      { id: 'BOT-991C', type: 'NLP Node', task: 'Claims Extraction', load: 12, status: 'IDLE', ping: '18ms' },
      { id: 'BOT-992A', type: 'RPA Node', task: 'Database Syncing', load: 76, status: 'ONLINE', ping: '24ms' },
      { id: 'BOT-992B', type: 'OCR Node', task: 'Document Scanning', load: 0, status: 'OFFLINE', ping: '--' },
      { id: 'BOT-992C', type: 'AI Agent', task: 'Decision Support', load: 58, status: 'ONLINE', ping: '64ms' },
      { id: 'BOT-993A', type: 'RPA Node', task: 'Compliance Audits', load: 0, status: 'OFFLINE', ping: '--' },
      { id: 'BOT-993B', type: 'NLP Node', task: 'Email Classification', load: 45, status: 'ONLINE', ping: '32ms' },
    ];
  }, [store.store.size]);

  // Dynamic helper for CPU load progress bar colors
  const getLoadColor = (load: number) => {
    if (load >= 90) return 'bg-rose-500';
    if (load >= 70) return 'bg-amber-500';
    return 'bg-[#014D3E]';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ONLINE') return 'bg-emerald-50 text-emerald-700 border-emerald-100/60';
    if (status === 'IDLE') return 'bg-slate-50 text-slate-500 border-slate-200/60';
    return 'bg-rose-50 text-rose-700 border-rose-100/60';
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-8 py-6 space-y-6 min-w-0 bg-[#F6F6F6] font-sans selection:bg-[#ADFF41] selection:text-[#014D3E] text-slate-800">
      
      {/* Header with DateRangePicker */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-[26px] font-black text-[#014D3E] tracking-tight leading-none">Robots Fleet</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1.5">
            Real-time hardware & software robot fleet monitoring and health matrix
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <DateRangePicker value={timeframe} onChange={setTimeframe} />
          <button className="flex items-center px-4 py-2 bg-[#014D3E] hover:bg-[#013D31] text-white rounded-xl text-xs font-bold shadow-sm transition-colors border border-transparent cursor-pointer">
            <span className="mr-1.5 text-sm font-light">↺</span> Restart Fleet
          </button>
        </div>
      </div>

      {/* Fleet KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Robots */}
        <div className="bg-white border border-slate-200/40 p-5 rounded-[22px] shadow-sm flex items-center justify-between h-[105px]">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest leading-none">Total Active Robots</span>
            <span className="text-xl font-black font-mono text-[#014D3E] mt-2.5 leading-none">
              {totalRobots.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold text-slate-400 mt-2.5 leading-none">Live node pool capacity</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50/50 text-blue-500 flex items-center justify-center border border-blue-100/50 flex-shrink-0">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4M8 16h.01M16 16h.01" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 2: Fleet In Flight */}
        <div className="bg-white border border-slate-200/40 p-5 rounded-[22px] shadow-sm flex items-center justify-between h-[105px]">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest leading-none">Tasks In Flight</span>
            <span className="text-xl font-black font-mono text-[#014D3E] mt-2.5 leading-none">
              56 / 128
            </span>
            <span className="text-[9px] font-bold text-[#014D3E] mt-2.5 leading-none">Active running workloads</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50/50 text-purple-650 flex items-center justify-center border border-purple-100/50 flex-shrink-0">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
        </div>

        {/* Card 3: Online Rate */}
        <div className="bg-white border border-slate-200/40 p-5 rounded-[22px] shadow-sm flex items-center justify-between h-[105px]">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest leading-none">Fleet Health Rate</span>
            <span className="text-xl font-black font-mono text-emerald-600 mt-2.5 leading-none">
              98.2%
            </span>
            <span className="text-[9px] font-bold text-emerald-600 mt-2.5 leading-none">Excellent system health</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50/50 text-emerald-600 flex items-center justify-center border border-emerald-100/50 flex-shrink-0">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        </div>

        {/* Card 4: Disconnects */}
        <div className="bg-white border border-slate-200/40 p-5 rounded-[22px] shadow-sm flex items-center justify-between h-[105px]">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest leading-none">Offline Robots</span>
            <span className="text-xl font-black font-mono text-rose-600 mt-2.5 leading-none">
              3 Nodes
            </span>
            <span className="text-[9px] font-bold text-rose-600 mt-2.5 leading-none">Requires manual reboot</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50/50 text-rose-600 flex items-center justify-center border border-rose-100/50 flex-shrink-0">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
        </div>

      </div>

      {/* Fleet Monitoring Node Grid */}
      <div className="bg-white p-6 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between">
        <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
          <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Active Fleet Nodes</span>
          <span className="text-[9px] font-bold text-slate-400 font-mono">POOL CAPACITY: 128 NODES</span>
        </div>

        {/* Node cards layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {robotFleet.map((bot, i) => (
            <div 
              key={i} 
              className="border border-slate-200/60 bg-slate-50/30 p-4 rounded-2xl flex flex-col justify-between space-y-3.5 hover:border-slate-350 hover:shadow-md hover:bg-white transition-all duration-300 cursor-default"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black text-[#014D3E]">{bot.id}</span>
                <span className={`inline-flex items-center text-[8.5px] font-black px-2 py-0.5 rounded-full border ${getStatusBadge(bot.status)}`}>
                  {bot.status === 'ONLINE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 blink-indicator" />}
                  {bot.status === 'IDLE' && <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />}
                  {bot.status === 'OFFLINE' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />}
                  {bot.status}
                </span>
              </div>
              
              <div className="flex flex-col space-y-1 min-h-[50px]">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Active Workload</span>
                <span className="text-xs font-bold text-slate-700 truncate">{bot.task}</span>
                <span className="text-[9.5px] font-semibold text-slate-400 mt-0.5">{bot.type}</span>
              </div>

              {/* CPU load bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[8.5px] font-black text-slate-450">
                  <span>CPU LOAD</span>
                  <span className="font-mono">{bot.load}%</span>
                </div>
                <div className="h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${getLoadColor(bot.load)}`} style={{ width: `${bot.load}%` }} />
                </div>
              </div>

              <div className="text-[9px] font-mono font-bold text-slate-450 border-t border-slate-100 pt-3 flex justify-between">
                <span>LATENCY</span>
                <span className="text-slate-600 font-bold">{bot.ping}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
