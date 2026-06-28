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
        const response = await fetch('/automation_projects.csv');
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }

        setLoadStatus('PARSING DATAFRAME IN-MEMORY...');
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
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center font-mono text-slate-500 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 blink-indicator" />
          <span className="tracking-widest uppercase">{loadStatus}</span>
        </div>
      </div>
    );
  }

  return <DashboardShell store={store} streamManager={streamManager} />;
}
