'use client';

import React, { useMemo } from 'react';
import { RowStore } from '@/engine/RowStore';
import { StreamManager } from '@/engine/StreamManager';
import { KPIMetrics } from '@/engine/types';

interface RobotsTabProps {
  store: RowStore;
  streamManager: StreamManager;
  metrics: KPIMetrics | null;
}

export const RobotsTab: React.FC<RobotsTabProps> = ({ store, streamManager, metrics }) => {
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
    const items = [
      { id: 'BOT-991A', type: 'RPA Node', task: 'HR Invoice Parsing', load: 84, status: 'ONLINE', ping: '12ms' },
      { id: 'BOT-991B', type: 'AI Agent', task: 'Customer Reply Auto', load: 92, status: 'ONLINE', ping: '45ms' },
      { id: 'BOT-991C', type: 'NLP Node', task: 'Claims Extraction', load: 0, status: 'IDLE', ping: '18ms' },
      { id: 'BOT-992A', type: 'RPA Node', task: 'Database Syncing', load: 76, status: 'ONLINE', ping: '24ms' },
      { id: 'BOT-992B', type: 'OCR Node', task: 'Document Scanning', load: 0, status: 'OFFLINE', ping: '--' },
      { id: 'BOT-992C', type: 'AI Agent', task: 'Decision Support', load: 58, status: 'ONLINE', ping: '64ms' },
      { id: 'BOT-993A', type: 'RPA Node', task: 'Compliance Audits', load: 0, status: 'OFFLINE', ping: '--' },
      { id: 'BOT-993B', type: 'NLP Node', task: 'Email Classification', load: 45, status: 'ONLINE', ping: '32ms' },
    ];
    return items;
  }, [store.store.size]);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-6 py-5 space-y-6 min-w-0 bg-slate-50/50 dark:bg-slate-950/20 font-sans">
      
      {/* Header */}
      <div className="flex flex-col">
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Robots Fleet</h1>
        <p className="text-xs text-slate-500 font-semibold dark:text-slate-455 mt-0.5">
          Real-time hardware & software robot monitoring
        </p>
      </div>

      {/* Fleet KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Robots */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900/60 p-4 rounded-xl shadow-sm flex items-center justify-between h-20">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest">Total Active Robots</span>
            <span className="text-lg font-black font-mono text-slate-900 dark:text-slate-100 mt-1 leading-none">
              {totalRobots.toLocaleString()}
            </span>
          </div>
          <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-650 flex items-center justify-center font-bold text-xs">🤖</div>
        </div>

        {/* Card 2: Fleet In Flight */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900/60 p-4 rounded-xl shadow-sm flex items-center justify-between h-20">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-455 uppercase tracking-widest">Tasks In Flight</span>
            <span className="text-lg font-black font-mono text-slate-900 dark:text-slate-100 mt-1 leading-none">
              56 in flight
            </span>
          </div>
          <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">⚡</div>
        </div>

        {/* Card 3: Online Rate */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900/60 p-4 rounded-xl shadow-sm flex items-center justify-between h-20">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-455 uppercase tracking-widest">Fleet Health Rate</span>
            <span className="text-lg font-black font-mono text-emerald-650 mt-1 leading-none">
              98.2%
            </span>
          </div>
          <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">✓</div>
        </div>

        {/* Card 4: Disconnects */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900/60 p-4 rounded-xl shadow-sm flex items-center justify-between h-20">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-455 uppercase tracking-widest">Offline Robots</span>
            <span className="text-lg font-black font-mono text-rose-600 mt-1 leading-none">
              3 offline
            </span>
          </div>
          <div className="w-8 h-8 rounded bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">⚠️</div>
        </div>

      </div>

      {/* Fleet Monitoring Node Grid */}
      <div className="bg-white dark:bg-slate-950 p-5 border border-slate-200/80 dark:border-slate-900/60 rounded-xl shadow-sm flex flex-col justify-between">
        <div className="border-b border-slate-100 dark:border-slate-900 pb-3 mb-4 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Active Fleet Nodes</span>
          <span className="text-[9px] font-bold text-slate-400 font-mono">POOL CAPACITY: 128 NODES</span>
        </div>

        {/* Node cards layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {robotFleet.map((bot, i) => (
            <div key={i} className="border border-slate-200/80 dark:border-slate-850 bg-slate-50/50 p-3 rounded-lg flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-slate-900 dark:text-slate-100">{bot.id}</span>
                <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded ${
                  bot.status === 'ONLINE' 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : bot.status === 'IDLE'
                      ? 'bg-slate-150 text-slate-500'
                      : 'bg-rose-50 text-rose-600'
                }`}>
                  {bot.status}
                </span>
              </div>
              
              <div className="flex flex-col space-y-1">
                <span className="text-[8px] font-bold text-slate-400 uppercase">ACTIVE WORKLOAD</span>
                <span className="text-[10.5px] font-bold text-slate-700 truncate">{bot.task}</span>
                <span className="text-[9px] font-semibold text-slate-400">{bot.type}</span>
              </div>

              {/* CPU load bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[8px] font-bold text-slate-400">
                  <span>LOAD</span>
                  <span className="font-mono">{bot.load}%</span>
                </div>
                <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-900 rounded-full" style={{ width: `${bot.load}%` }} />
                </div>
              </div>

              <div className="text-[8.5px] font-mono text-slate-450 border-t border-slate-200/60 pt-2.5 flex justify-between">
                <span>LATENCY</span>
                <span>{bot.ping}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
