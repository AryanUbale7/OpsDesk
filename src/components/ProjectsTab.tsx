'use client';

import React from 'react';
import { RowStore } from '@/engine/RowStore';
import { StreamManager } from '@/engine/StreamManager';
import { GridViewport } from './GridViewport';

interface ProjectsTabProps {
  store: RowStore;
  streamManager: StreamManager;
  onAnalyticsClick?: () => void;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({ store, streamManager, onAnalyticsClick }) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden px-8 py-6 space-y-5 min-w-0 bg-[#F6F6F6] font-sans">
      {/* Tab Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-[#014D3E] tracking-tight">Projects Explorer</h1>
          <div className="flex items-center mt-1.5 text-[13px] text-slate-500 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 flex-shrink-0"></span>
            <span>{store.store.size.toLocaleString()} active automations</span>
          </div>
        </div>

        {/* Right Side Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button className="flex items-center px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <svg className="w-3.5 h-3.5 mr-2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            Filter
            <span className="ml-2 bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">2</span>
          </button>
          <button className="flex items-center px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <svg className="w-3.5 h-3.5 mr-2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
            Columns
          </button>
          <button className="flex items-center px-4 py-2 bg-[#014D3E] hover:bg-[#013D31] text-white rounded-lg text-xs font-bold shadow-sm transition-all">
            <span className="mr-1.5 text-base font-light">+</span> New Project
          </button>
        </div>
      </div>

      {/* Grid container wrapper — the clean white card */}
      <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
        <GridViewport store={store} streamManager={streamManager} onAnalyticsClick={onAnalyticsClick} />
      </div>
    </div>
  );
};
