'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { RowStore } from '@/engine/RowStore';
import { StreamManager } from '@/engine/StreamManager';
import { Row } from '@/engine/types';
import { DashboardShell } from '@/components/DashboardShell';

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [loadStatus, setLoadStatus] = useState('BOOTING ENGINE...');

  // Initialize RowStore and StreamManager once (persistent across renders)
  const { store, streamManager } = useMemo(() => {
    const s = new RowStore(5000); // Max 5,000 rows cap
    const m = new StreamManager(s);
    return { store: s, streamManager: m };
  }, []);

  // Hydrate client state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Connect baseline CSV loading and the data stream
  useEffect(() => {
    if (!mounted) return;

    const loadBaselineAndStartStream = async () => {
      try {
        setLoadStatus('FETCHING DATABASE BASELINE (50,000 ROWS)...');
        await new Promise(r => setTimeout(r, 600)); // Reduced artificial delay

        const response = await fetch('/automation_projects.csv');
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }

        setLoadStatus('PARSING DATAFRAME IN-MEMORY...');
        await new Promise(r => setTimeout(r, 400)); // Reduced artificial delay
        const csvText = await response.text();
        
        // Highly optimized simple comma split matching dataStream parser
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const initialBatch: (Partial<Row> & { project_id: string })[] = [];

        // Load all lines - the RowStore evictOldestRow logic will naturally cap it at 5,000 active rows!
        // To speed up initial layout rendering and avoid locking the main thread,
        // we parse and feed them in a single batch.
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(',');
          if (values.length === headers.length) {
            const rowObject: any = {};
            headers.forEach((header, index) => {
              rowObject[header] = values[index].trim();
            });
            initialBatch.push(rowObject);
          }
        }

        setLoadStatus('HYDRATING ROW STORE MAP...');
        streamManager.ingestBatch(initialBatch);
        console.log(`✅ [Pipeline] Successfully hydrated baseline. Store size: ${store.store.size} active rows.`);

        setLoadStatus('CONNECTING LIVE STREAM FIREHOSE...');
        
        // Hook up window.initializeRpaStream from public/dataStream.js
        if (typeof window !== 'undefined' && (window as any).initializeRpaStream) {
          (window as any).initializeRpaStream((incomingBatch: any[]) => {
            // Receive updates from the stream, process in StreamManager
            streamManager.ingestBatch(incomingBatch);
          }, '/automation_projects.csv');
        } else {
          console.warn('⚠️ [Pipeline Warning] window.initializeRpaStream is not found on window scope.');
        }

        setLoadStatus('CONNECTED');
      } catch (e: any) {
        console.error('❌ [Pipeline Error] Hydration failed:', e);
        setLoadStatus(`ERROR: ${e.message}`);
      }
    };

    loadBaselineAndStartStream();
  }, [mounted, store, streamManager]);

  if (!mounted || loadStatus !== 'CONNECTED') {
    return (
      <div className="h-screen w-screen bg-white flex flex-col items-center justify-center font-sans selection:bg-[#ADFF41] selection:text-[#014D3E] select-none relative overflow-hidden">
        <style>{`
          @keyframes indeterminate {
            0% { transform: translateX(-100%); width: 50%; }
            100% { transform: translateX(200%); width: 50%; }
          }
          .animate-indeterminate {
            animation: indeterminate 1.5s infinite linear;
          }
          @keyframes spin-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          .animate-spin-reverse {
            animation: spin-reverse 1.5s linear infinite;
          }
        `}</style>
        {/* Background ambient light overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(1,77,62,0.03)_0%,transparent_70%)] pointer-events-none" />

        <div className="flex flex-col items-center max-w-sm w-full px-8 z-10 text-center">
          {/* Animated Logo Wrapper */}
          <div className="w-28 h-28 flex items-center justify-center mb-8 relative">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#014D3E] border-t-transparent animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-4 border-[#ADFF41] border-b-transparent animate-spin-reverse"></div>
            <img src="/logo.svg" className="w-14 h-14 object-contain animate-pulse" alt="OpsDesk Logo" />
          </div>

          {/* Core Title */}
          <h2 className="text-[#014D3E] text-[18px] font-black tracking-wider uppercase mb-1">
            OpsDesk Command Center
          </h2>
          <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mb-8">
            Initializing Live Telemetry Pipeline
          </p>

          {/* Premium Progress Bar */}
          <div className="w-full h-[4px] bg-slate-100 rounded-full overflow-hidden mb-4 relative">
             <div className="absolute top-0 left-0 h-full bg-[#014D3E] rounded-full animate-indeterminate" />
          </div>

          {/* Status Message */}
          <div className="flex items-center justify-center space-x-2 font-mono text-[10px] text-slate-500 tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#014D3E] blink-indicator" />
            <span className="uppercase text-[#014D3E] font-bold">{loadStatus}</span>
          </div>
        </div>
      </div>
    );
  }

  return <DashboardShell store={store} streamManager={streamManager} />;
}
