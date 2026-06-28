'use client';

import React, { useState, useEffect } from 'react';
import { RowStore } from '@/engine/RowStore';
import { StreamManager } from '@/engine/StreamManager';
import { KPIMetrics } from '@/engine/types';

interface SettingsTabProps {
  store: RowStore;
  streamManager: StreamManager;
  metrics: KPIMetrics | null;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ store, streamManager, metrics }) => {
  const [isPaused, setIsPaused] = useState(streamManager.getPauseState());

  useEffect(() => {
    return streamManager.subscribePause((paused) => {
      setIsPaused(paused);
    });
  }, [streamManager]);

  const handlePauseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    streamManager.setPauseState(e.target.checked);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-6 py-5 space-y-6 min-w-0 bg-slate-50/50 dark:bg-slate-950/20 font-sans">
      
      {/* Header */}
      <div className="flex flex-col">
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Configuration</h1>
        <p className="text-xs text-slate-500 font-semibold dark:text-slate-455 mt-0.5">
          Configure platform rules, telemetry rate, and layout settings
        </p>
      </div>

      <div className="max-w-3xl bg-white dark:bg-slate-950 p-6 border border-slate-200/80 dark:border-slate-900/60 rounded-xl shadow-sm space-y-6">
        
        {/* Section 1: Telemetry Rate & Simulation */}
        <div className="space-y-4">
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block border-b border-slate-100 dark:border-slate-900 pb-2">
            Telemetry Feed Control
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10.5px]">
            <div className="flex items-center justify-between p-3 border border-slate-200/60 rounded-lg bg-slate-50/50">
              <div className="flex flex-col">
                <span className="font-bold text-slate-700">Pause Ingestion Stream</span>
                <span className="text-[8.5px] text-slate-450 mt-0.5">Buffering incoming project events in memory</span>
              </div>
              <input
                type="checkbox"
                checked={isPaused}
                onChange={handlePauseChange}
                className="h-4 w-4 accent-indigo-650 cursor-pointer"
              />
            </div>
            
            <div className="flex flex-col space-y-1.5 justify-center">
              <div className="flex justify-between text-[8px] font-bold text-slate-400">
                <span>SIMULATION FEED SPEED</span>
                <span>Normal Rate</span>
              </div>
              <div className="flex items-center space-x-1.5 font-mono text-[9px]">
                <button className="px-2.5 py-1 border border-indigo-200 bg-indigo-50 text-indigo-650 rounded font-bold">1.0x</button>
                <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 rounded">2.0x</button>
                <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 rounded">0.5x</button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Display & Layout Settings */}
        <div className="space-y-4 pt-2">
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block border-b border-slate-100 dark:border-slate-900 pb-2">
            Display & Layout Settings
          </span>
          
          <div className="space-y-3.5 text-[10.5px]">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <div className="flex flex-col">
                <span className="font-bold text-slate-700">Locked Theme Variant</span>
                <span className="text-[8.5px] text-slate-450 mt-0.5">This platform runs exclusively in light mode by project requirements</span>
              </div>
              <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                Forced Light Mode
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <div className="flex flex-col">
                <span className="font-bold text-slate-700">Grid Overscan Row Buffer</span>
                <span className="text-[8.5px] text-slate-450 mt-0.5">Extra rows pre-allocated beyond active viewport boundaries</span>
              </div>
              <span className="font-mono text-slate-800 font-bold px-2 py-0.5 border border-slate-200 rounded bg-slate-50">
                8 rows
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Data Store Optimization */}
        <div className="space-y-4 pt-2">
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block border-b border-slate-100 dark:border-slate-900 pb-2">
            Data Store Management
          </span>
          
          <div className="flex items-center justify-between text-[10.5px]">
            <div className="flex flex-col">
              <span className="font-bold text-slate-700">Reset Local Memory Store</span>
              <span className="text-[8.5px] text-slate-450 mt-0.5">Wipes all cached statistics and triggers full baseline re-index</span>
            </div>
            <button className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 rounded-lg font-bold text-[9.5px] transition-colors">
              Reset Memory Store
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
