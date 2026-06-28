'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RowStore } from '@/engine/RowStore';
import { StreamManager } from '@/engine/StreamManager';
import { KPIMetrics, SortCriterion, Row } from '@/engine/types';
import { ControlBar } from './ControlBar';
import { SidebarFilters } from './SidebarFilters';
import { OverviewTab } from './OverviewTab';
import { ProjectsTab } from './ProjectsTab';
import { AutomationsTab } from './AutomationsTab';
import { IncidentsTab } from './IncidentsTab';
import { AnalyticsTab } from './AnalyticsTab';
import { RobotsTab } from './RobotsTab';
import { DepartmentsTab } from './DepartmentsTab';
import { ReportsTab } from './ReportsTab';
import { SettingsTab } from './SettingsTab';
import { AnalyticsOverlay } from './AnalyticsOverlay';

interface DashboardSettings {
  layout: {
    sidebarOpen: boolean;
    panelOpen: boolean;
  };
  filters: any;
  searchQuery: string;
  sortCriteria: SortCriterion[];
}

const DEFAULT_SETTINGS: DashboardSettings = {
  layout: { sidebarOpen: true, panelOpen: false },
  filters: {
    project_status: 'all',
    automation_type: 'all',
    department: 'all',
    industry: 'all',
    country: 'all',
    ai_enabled: 'all',
    cloud_deployment: 'all',
  },
  searchQuery: '',
  sortCriteria: [{ field: 'roi_percent', direction: 'desc' }]
};

function validateSettings(data: any): DashboardSettings {
  const defaults = DEFAULT_SETTINGS;
  if (!data || typeof data !== 'object') {
    return defaults;
  }

  // 1. Validate Layout Panel Visibility
  const layout = { ...defaults.layout };
  if (data.layout && typeof data.layout === 'object') {
    if (typeof data.layout.sidebarOpen === 'boolean') {
      layout.sidebarOpen = data.layout.sidebarOpen;
    }
    if (typeof data.layout.panelOpen === 'boolean') {
      layout.panelOpen = data.layout.panelOpen;
    }
  }

  // 2. Validate Search Query
  let searchQuery = defaults.searchQuery;
  if (typeof data.searchQuery === 'string') {
    searchQuery = data.searchQuery;
  }

  // 3. Validate Filter Selections
  const filters = { ...defaults.filters };
  if (data.filters && typeof data.filters === 'object') {
    const validKeys = [
      'project_status', 'automation_type', 'department', 
      'industry', 'country', 'ai_enabled', 'cloud_deployment'
    ];
    for (const key of validKeys) {
      const val = data.filters[key];
      if (typeof val === 'string') {
        if (key === 'ai_enabled' || key === 'cloud_deployment') {
          if (val === 'all' || val === 'true' || val === 'false') {
            filters[key] = val;
          }
        } else {
          filters[key] = val;
        }
      }
    }
  }

  // 4. Validate Multi-Sort Configuration
  let sortCriteria = [...defaults.sortCriteria];
  if (Array.isArray(data.sortCriteria)) {
    const validFields = new Set([
      'project_id', 'company_id', 'project_name', 'project_status',
      'automation_type', 'robots_deployed', 'annual_savings_usd',
      'roi_percent', 'department', 'industry', 'country',
      'employee_hours_saved', 'ai_enabled', 'cloud_deployment'
    ]);
    const parsedSort: SortCriterion[] = [];
    for (const item of data.sortCriteria) {
      if (item && typeof item === 'object') {
        const field = item.field;
        const direction = item.direction;
        if (validFields.has(field) && (direction === 'asc' || direction === 'desc')) {
          parsedSort.push({ field, direction });
        }
      }
    }
    if (parsedSort.length > 0) {
      sortCriteria = parsedSort;
    }
  }

  return { layout, searchQuery, filters, sortCriteria };
}

function loadInitialSettings(): DashboardSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem('r2_dashboard_settings');
    if (!saved) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(saved);
    return validateSettings(parsed);
  } catch (err) {
    console.warn('Failed to load dashboard settings from localStorage, falling back to defaults:', err);
    return DEFAULT_SETTINGS;
  }
}

const initialSettings = loadInitialSettings();

interface DashboardShellProps {
  store: RowStore;
  streamManager: StreamManager;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ store, streamManager }) => {
  // Initialize layout states using parsed, validated initial preferences
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(initialSettings.layout.sidebarOpen);
  const [panelOpen, setPanelOpen] = useState<boolean>(initialSettings.layout.panelOpen);
  const [activeTab, setActiveTab] = useState<string>('Overview');

  // Restore filters, search query, and sorting configuration into the RowStore in a single atomic pass
  useEffect(() => {
    store.restoreSettings(
      initialSettings.filters,
      initialSettings.searchQuery,
      initialSettings.sortCriteria
    );
  }, [store]);

  // KPI Metrics React-shell state (updated at a throttled 1-second cadence)
  const [metrics, setMetrics] = useState<KPIMetrics | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);

  // Tracking store configuration updates for the debounced write path
  const [storeChangeCounter, setStoreChangeCounter] = useState(0);
  const writeTimeoutRef = useRef<any>(null);

  useEffect(() => {
    return store.subscribeConfigChange(() => {
      setStoreChangeCounter((prev) => prev + 1);
    });
  }, [store]);

  // Debounced, batched single-key write path
  useEffect(() => {
    if (writeTimeoutRef.current) clearTimeout(writeTimeoutRef.current);
    writeTimeoutRef.current = setTimeout(() => {
      try {
        const payload = {
          layout: { sidebarOpen, panelOpen },
          filters: store.filterSettings,
          searchQuery: store.searchQueryString,
          sortCriteria: store.sortCriteria,
        };
        localStorage.setItem('r2_dashboard_settings', JSON.stringify(payload));
      } catch (err) {
        console.warn('Failed to save dashboard settings to localStorage:', err);
      }
    }, 400);

    return () => {
      if (writeTimeoutRef.current) clearTimeout(writeTimeoutRef.current);
    };
  }, [sidebarOpen, panelOpen, storeChangeCounter, store]);

  const [isPaused, setIsPaused] = useState(false);
  const [recentAnomalies, setRecentAnomalies] = useState<Row[]>([]);
  const [recentEvents, setRecentEvents] = useState<{ project_id: string; timestamp: number; desc: string }[]>([]);
  const [metricsHistory, setMetricsHistory] = useState<KPIMetrics[]>([]);

  // Subscribe to StreamManager metrics updates
  useEffect(() => {
    return streamManager.subscribeMetrics((newMetrics, count) => {
      setRecentAnomalies([...store.recentAnomalies]);
      setRecentEvents([...store.recentEvents]);

      setMetricsHistory((prev) => {
        const next = [...prev, newMetrics];
        if (next.length > 20) {
          next.shift();
        }
        return next;
      });

      if (!streamManager.getPauseState()) {
        setMetrics(newMetrics);
        setVisibleCount(count);
      } else {
        setMetrics((prev) => {
          if (!prev) return newMetrics;
          return {
            ...prev,
            queuedCount: newMetrics.queuedCount,
            ingestionRate: newMetrics.ingestionRate,
          };
        });
      }
    });
  }, [streamManager, store]);

  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [snapshotTimestamp, setSnapshotTimestamp] = useState(() => Date.now());

  // Subscribe to StreamManager pause state
  useEffect(() => {
    return streamManager.subscribePause((paused) => {
      setIsPaused(paused);
      if (paused) {
        setSnapshotTimestamp(Date.now());
      } else {
        setIsAnalyticsOpen(false);
      }
    });
  }, [streamManager]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="flex h-screen w-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden select-none">
      {/* Left Sidebar Navigation */}
      <SidebarFilters
        store={store}
        streamManager={streamManager}
        isOpen={sidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        toggleSidebar={toggleSidebar}
      />

      {/* Right Column Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Control Bar */}
        <ControlBar
          store={store}
          streamManager={streamManager}
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          onAnalyticsClick={() => setIsAnalyticsOpen(true)}
        />

        {/* Main Workspace Body */}
        <div className="flex-grow w-full relative">
          
          {activeTab === 'Overview' && (
            <div className="absolute inset-0 flex flex-col">
              <OverviewTab
                store={store}
                streamManager={streamManager}
                metrics={metrics}
                visibleCount={visibleCount}
                history={metricsHistory}
              />
            </div>
          )}

          {activeTab === 'Projects' && (
            <div className="absolute inset-0 flex flex-col">
              <ProjectsTab
                store={store}
                streamManager={streamManager}
                onAnalyticsClick={() => setIsAnalyticsOpen(true)}
              />
            </div>
          )}

          {activeTab === 'Automations' && (
            <div className="absolute inset-0 flex flex-col">
              <AutomationsTab
                store={store}
                streamManager={streamManager}
              />
            </div>
          )}

          {activeTab === 'Incidents' && (
            <div className="absolute inset-0 flex flex-col">
              <IncidentsTab
                store={store}
                streamManager={streamManager}
                metrics={metrics}
              />
            </div>
          )}

          {activeTab === 'Analytics' && (
            <div className="absolute inset-0 flex flex-col">
              <AnalyticsTab
                store={store}
                streamManager={streamManager}
                metrics={metrics}
              />
            </div>
          )}

          {activeTab === 'Robots' && (
            <div className="absolute inset-0 flex flex-col">
              <RobotsTab
                store={store}
                streamManager={streamManager}
                metrics={metrics}
              />
            </div>
          )}

          {activeTab === 'Departments' && (
            <div className="absolute inset-0 flex flex-col">
              <DepartmentsTab
                store={store}
                streamManager={streamManager}
                metrics={metrics}
              />
            </div>
          )}

          {activeTab === 'Reports' && (
            <div className="absolute inset-0 flex flex-col">
              <ReportsTab
                store={store}
                streamManager={streamManager}
                metrics={metrics}
              />
            </div>
          )}

          {activeTab === 'Settings' && (
            <div className="absolute inset-0 flex flex-col">
              <SettingsTab
                store={store}
                streamManager={streamManager}
                metrics={metrics}
              />
            </div>
          )}

        </div>

      {/* 5. Full-width bottom activity feed */}
      <div className="w-full bg-white border-t border-slate-200/80 px-6 py-2.5 flex items-center justify-between text-[11px] font-sans select-none z-10 flex-shrink-0">
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <svg className="w-4 h-4 text-[#014D3E]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          <span className="font-bold text-[#014D3E] uppercase tracking-widest text-[10px]">Live Activity Feed</span>
          <span className="flex items-center space-x-1 text-[10px] font-medium text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 blink-indicator" />
            <span>Live</span>
          </span>
        </div>

        {/* Horizontally flexed items */}
        <div className="flex-1 flex items-center justify-start px-6 space-x-6 overflow-hidden">
          {recentEvents.length === 0 ? (
            <span className="text-slate-400 italic text-[11px]">Waiting for platform operations to spin up telemetry ticks...</span>
          ) : (
            recentEvents.map((evt, idx) => {
              const timeStr = new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
              return (
                <div key={idx} className="flex items-center space-x-2 border-l border-slate-200 pl-4 first:border-0 first:pl-0 truncate">
                  <span className="font-mono text-slate-400 font-medium text-[10px]">{timeStr}</span>
                  <span className="text-slate-600 font-medium truncate text-[10px]">{evt.desc}</span>
                  <span className="font-mono text-[#014D3E] font-bold text-[10px]">{evt.project_id}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Dynamic last updated indicator */}
        <div className="flex items-center space-x-1.5 text-slate-400 font-medium flex-shrink-0 pl-4 border-l border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 blink-indicator" />
          <span className="text-[10px] font-mono">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
          <svg className="w-3.5 h-3.5 text-slate-300 ml-1 cursor-pointer hover:text-slate-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
        </div>
      </div>
    </div>
      {isAnalyticsOpen && (
        <AnalyticsOverlay
          store={store}
          onClose={() => setIsAnalyticsOpen(false)}
          snapshotTimestamp={snapshotTimestamp}
        />
      )}
  </div>
  );
};
