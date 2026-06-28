'use client';

import React, { useState, useEffect } from 'react';
import { RowStore } from '@/engine/RowStore';
import { StreamManager } from '@/engine/StreamManager';

interface ControlBarProps {
  store: RowStore;
  streamManager: StreamManager;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  onAnalyticsClick?: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = React.memo(({
  store,
  streamManager,
  sidebarOpen,
  toggleSidebar,
  onAnalyticsClick,
}) => {
  const [searchVal, setSearchVal] = useState(() => store.searchQueryString);
  const [isPaused, setIsPaused] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const [ingestionRate, setIngestionRate] = useState(0);
  const [anomalyCount, setAnomalyCount] = useState(0);

  // Sync pause state from engine subscriptions
  useEffect(() => {
    return streamManager.subscribePause((paused) => {
      setIsPaused(paused);
    });
  }, [streamManager]);

  // Sync queued count, ingestion rate, and anomalyCount from metrics subscriptions
  useEffect(() => {
    return streamManager.subscribeMetrics((metrics) => {
      setQueuedCount(metrics.queuedCount);
      setIngestionRate(metrics.ingestionRate);
      setAnomalyCount(metrics.anomalyCount);
    });
  }, [streamManager]);

  // Debounced search trigger
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      store.setSearchQuery(searchVal);
      streamManager.ingestBatch([]); // request recomputation/render
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [searchVal, store, streamManager]);

  // Force light mode on mount
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const handlePauseToggle = () => {
    streamManager.setPauseState(!isPaused);
  };

  return (
    <div className="flex items-center justify-between px-6 h-[56px] bg-white border-b border-slate-200/80 z-10 font-sans flex-shrink-0 select-none">
      
      {/* Left: Global Fuzzy Search */}
      <div className="flex-1 max-w-md relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          className="w-full pl-10 pr-14 py-2 bg-[#F6F6F6] border border-slate-200/60 rounded-xl text-[12.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#014D3E]/40 focus:bg-white transition-all"
          placeholder="Search anything..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
        />
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span className="text-[10px] font-medium text-slate-400 bg-white border border-slate-200 rounded-md px-1.5 py-0.5 select-none">⌘ K</span>
        </span>
        {searchVal && (
          <button
            onClick={() => setSearchVal('')}
            className="absolute inset-y-0 right-14 flex items-center pr-2 text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        )}
      </div>

      {/* Right: Control cluster */}
      <div className="flex items-center space-x-2.5 ml-6">

        {/* Date Range Pill */}
        <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-600 transition-all shadow-sm">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-18 0h18" />
          </svg>
          <span>Jan 1, 2025 – Feb 1, 2025</span>
        </button>

        {/* Last 30 days selector */}
        <button className="flex items-center px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-600 shadow-sm transition-all">
          Last 30 days
          <svg className="w-3 h-3 ml-1.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200" />

        {/* Active Issues Badge */}
        {anomalyCount > 0 && (
          <div className="flex items-center px-2 py-1 rounded-full font-mono text-[10px] font-bold bg-rose-50 border border-rose-100 text-rose-600 shadow-sm flex-shrink-0">
            <svg className="w-3 h-3 mr-1 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {anomalyCount} {anomalyCount === 1 ? 'Issue' : 'Issues'}
          </div>
        )}

        {/* Stream Status Pill */}
        <div className={`flex items-center px-2.5 py-1.5 rounded-full text-[10px] font-bold border transition-colors flex-shrink-0 ${
          isPaused 
            ? 'bg-[#014D3E] border-[#014D3E] text-white' 
            : 'bg-emerald-50 border-emerald-100 text-emerald-600'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isPaused ? 'bg-[#ADFF41]' : 'bg-emerald-500 blink-indicator'}`} />
          <span className="uppercase tracking-wider font-mono">
            {isPaused 
              ? `${queuedCount.toLocaleString()} buffered` 
              : `LIVE · ${ingestionRate} tx/s`}
          </span>
        </div>

        {/* Settings cog icon */}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Notification Bell */}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all shadow-sm relative">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75v-.7V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          {anomalyCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full border border-white text-[7px] font-black text-white flex items-center justify-center">{Math.min(9, anomalyCount)}</span>
          )}
        </button>

        {/* Analytics View Button */}
        {isPaused && (
          <button
            onClick={onAnalyticsClick}
            className="flex items-center px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider transition-all border border-indigo-600 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            </svg>
            Analytics View
          </button>
        )}

        {/* Pause/Resume Button */}
        <button
          onClick={handlePauseToggle}
          className={`flex items-center px-3.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wider transition-all border shadow-sm ${
            isPaused
              ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500 hover:border-rose-600'
              : 'bg-[#014D3E] hover:bg-[#013D31] text-white border-[#014D3E] hover:border-[#013D31]'
          }`}
        >
          {isPaused ? (
            <>
              <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Resume
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Pause
            </>
          )}
        </button>

        {/* User profile avatar */}
        <div className="flex items-center space-x-1.5 cursor-pointer ml-1 pl-1 border-l border-slate-200">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
            alt="User profile"
            className="w-7 h-7 rounded-full object-cover border-2 border-slate-100 shadow-sm"
          />
        </div>
      </div>
    </div>
  );
});

ControlBar.displayName = 'ControlBar';
