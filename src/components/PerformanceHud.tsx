'use client';

import React, { useState, useEffect } from 'react';
import { RowStore } from '@/engine/RowStore';
import { StreamManager } from '@/engine/StreamManager';

interface PerformanceHudProps {
  store: RowStore;
  streamManager: StreamManager;
}

export const PerformanceHud: React.FC<PerformanceHudProps> = React.memo(({ store, streamManager }) => {
  const [metrics, setMetrics] = useState({
    fps: 60,
    ingestionRate: 0,
    datasetSize: 0,
    visibleCount: 0,
    poolSize: 0,
    pendingQueueSize: 0,
    memory: 'N/A',
    virtualizationStatus: 'ACTIVE',
  });

  const [isCollapsed, setIsCollapsed] = useState(false);

  // FPS (Tier 1) - Decoupled rAF loop with zero allocation running average
  useEffect(() => {
    let active = true;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsValue = 60;

    const tick = () => {
      if (!active) return;
      frameCount++;
      const now = performance.now();
      const elapsed = now - lastTime;

      // Sample every 500ms
      if (elapsed >= 500) {
        fpsValue = Math.round((frameCount * 1000) / elapsed);
        frameCount = 0;
        lastTime = now;

        setMetrics((prev) => {
          if (prev.fps === fpsValue) return prev;
          return { ...prev, fps: fpsValue };
        });
      }
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    return () => {
      active = false;
    };
  }, []);

  // Metrics (Tier 2) - Low-frequency polling (every 600ms)
  useEffect(() => {
    const poll = () => {
      const datasetSize = store.store.size;
      const visibleCount = store.visibleIds.length;
      const poolSize = streamManager.getPoolSize();
      const pendingQueueSize = streamManager.getQueuedCount();
      const ingestionRate = streamManager.getIngestionRate();

      // Feature-detect usedJSHeapSize for Chromium browsers
      let memory = 'N/A';
      const perf = typeof window !== 'undefined' ? (window.performance as any) : null;
      if (perf && perf.memory && typeof perf.memory.usedJSHeapSize === 'number') {
        memory = `${(perf.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1)} MB`;
      }

      const virtualizationStatus = poolSize > 0 ? 'ACTIVE' : 'INITIALIZING';

      setMetrics((prev) => {
        if (
          prev.datasetSize === datasetSize &&
          prev.visibleCount === visibleCount &&
          prev.poolSize === poolSize &&
          prev.pendingQueueSize === pendingQueueSize &&
          prev.ingestionRate === ingestionRate &&
          prev.memory === memory &&
          prev.virtualizationStatus === virtualizationStatus
        ) {
          return prev;
        }
        return {
          ...prev,
          ingestionRate,
          datasetSize,
          visibleCount,
          poolSize,
          pendingQueueSize,
          memory,
          virtualizationStatus,
        };
      });
    };

    poll();
    const intervalId = setInterval(poll, 600);
    return () => clearInterval(intervalId);
  }, [store, streamManager]);

  return (
    <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-900 w-full font-sans select-none">
      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-2 mb-2">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center">
          <svg className="w-3.5 h-3.5 mr-1.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.89" />
          </svg>
          System Diagnostic HUD
        </span>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-[9px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase font-bold tracking-tight"
        >
          {isCollapsed ? 'Show' : 'Hide'}
        </button>
      </div>

      {/* Collapsible Body Grid */}
      {!isCollapsed && (
        <div className="grid grid-cols-3 gap-x-2 gap-y-3 pt-1">
          {/* Engine FPS */}
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">ENGINE FPS</span>
            <span className={`text-[10px] font-bold mt-1 font-mono leading-none ${metrics.fps >= 55 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
              {metrics.fps} FPS
            </span>
          </div>

          {/* Ingest Rate */}
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">INGEST RATE</span>
            <span className="text-[10px] font-bold mt-1 font-mono leading-none text-slate-800 dark:text-slate-200">
              {metrics.ingestionRate} tx/s
            </span>
          </div>

          {/* Store Size */}
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">STORE SIZE</span>
            <span className="text-[10px] font-bold mt-1 font-mono leading-none text-slate-800 dark:text-slate-200">
              {metrics.datasetSize.toLocaleString()} rows
            </span>
          </div>

          {/* Visible Rows */}
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">VISIBLE ROWS</span>
            <span className="text-[10px] font-bold mt-1 font-mono leading-none text-slate-800 dark:text-slate-200">
              {metrics.visibleCount} rows
            </span>
          </div>

          {/* DOM Recycler Pool Size */}
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">DOM POOL SIZE</span>
            <span className="text-[10px] font-bold mt-1 font-mono leading-none text-slate-800 dark:text-slate-200">
              {metrics.poolSize} nodes
            </span>
          </div>

          {/* Pending Queue */}
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">PENDING QUEUE</span>
            <span className="text-[10px] font-bold mt-1 font-mono leading-none text-slate-800 dark:text-slate-200">
              {metrics.pendingQueueSize} items
            </span>
          </div>

          {/* V8 Heap Memory */}
          <div className="flex flex-col col-span-2">
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">V8 HEAP (APPROX)</span>
            <span className="text-[10px] font-bold mt-1 font-mono leading-none text-slate-855 text-slate-800 dark:text-slate-200">
              {metrics.memory}
            </span>
          </div>

          {/* Virtualization engine status */}
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">VIRTUAL ENGINE</span>
            <span className={`text-[10px] font-black mt-1 font-mono leading-none ${metrics.virtualizationStatus === 'ACTIVE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
              {metrics.virtualizationStatus}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

PerformanceHud.displayName = 'PerformanceHud';
