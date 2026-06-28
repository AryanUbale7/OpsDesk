'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { RowStore } from '@/engine/RowStore';
import { StreamManager } from '@/engine/StreamManager';
import { DOMRenderer } from '@/engine/DOMRenderer';
import { SortCriterion, SortDirection } from '@/engine/types';

interface GridViewportProps {
  store: RowStore;
  streamManager: StreamManager;
  onAnalyticsClick?: () => void;
}

export const GridViewport: React.FC<GridViewportProps> = React.memo(({ store, streamManager, onAnalyticsClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([
    { field: 'roi_percent', direction: 'desc' },
  ]);
  const [rendererInstance, setRendererInstance] = useState<DOMRenderer | null>(null);
  const [projectStatusFilter, setProjectStatusFilter] = useState(() => store.filterSettings.project_status);
  const [visibleCount, setVisibleCount] = useState(() => store.visibleIds.length);
  const [failedCount, setFailedCount] = useState(() => store.runningFailedCount);

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

  // Keep a mutable ref for onRowClick to prevent stale closures while keeping DOMRenderer instance stable
  const rowClickRef = useRef<(rowId: string) => void>(null);

  // Initialize the DOM recycler engine
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create the DOMRenderer. It will append spacer and gridBody into the container
    const renderer = new DOMRenderer(container, store);

    // Bind row click handler to dispatch to the ref
    renderer.onRowClick = (rowId) => {
      if (rowClickRef.current) {
        rowClickRef.current(rowId);
      }
    };

    setRendererInstance(renderer);
    streamManager.setRenderer(renderer);

    return () => {
      renderer.destroy();
    };
  }, [store, streamManager]);

  const showToast = useCallback((msg: string) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message: msg }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const handleExportCSV = useCallback(() => {
    const visibleIds = store.visibleIds;
    const totalCount = visibleIds.length;

    const headers = [
      'Project ID',
      'Project Name',
      'Department',
      'Status',
      'Robots Deployed',
      'Annual Savings (USD)',
      'ROI %',
      'AI Enabled',
      'Cloud Deployment'
    ];

    const escapeCSVCell = (val: any) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        str = str.replace(/"/g, '""');
        return `"${str}"`;
      }
      return str;
    };

    const csvRows = [headers.join(',')];

    for (let i = 0; i < totalCount; i++) {
      const id = visibleIds[i];
      const row = store.store.get(id);
      if (!row) continue;

      const rowValues = [
        escapeCSVCell(row.project_id),
        escapeCSVCell(row.project_name),
        escapeCSVCell(row.department),
        escapeCSVCell(row.project_status),
        escapeCSVCell(row.robots_deployed),
        escapeCSVCell(row.annual_savings_usd),
        escapeCSVCell(row.roi_percent),
        escapeCSVCell(row.ai_enabled ? 'True' : 'False'),
        escapeCSVCell(row.cloud_deployment ? 'True' : 'False')
      ];
      csvRows.push(rowValues.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const filename = `opsdesk-snapshot-${year}-${month}-${day}-${hours}-${minutes}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Successfully exported ${totalCount.toLocaleString()} rows to ${filename}`);
  }, [store, showToast]);

  // Sync click handler callback closure with fresh states
  useEffect(() => {
    rowClickRef.current = (rowId) => {
      if (isPaused) {
        setSelectedRowId(rowId);
      } else {
        showToast("Pause the stream to inspect project details.");
      }
    };
  }, [isPaused, showToast]);

  // Subscribe to pause state from stream manager
  useEffect(() => {
    return streamManager.subscribePause((paused) => {
      setIsPaused(paused);
      if (!paused) {
        setSelectedRowId(null);
      }
    });
  }, [streamManager]);

  // Fetch full row object for selected project
  const selectedRow = useMemo(() => {
    if (!selectedRowId) return null;
    return store.store.get(selectedRowId) || null;
  }, [selectedRowId, store.store.size]);

  // Synchronize selection state to DOMRenderer for dynamic highlights
  useEffect(() => {
    if (rendererInstance) {
      rendererInstance.selectedRowId = selectedRowId;
      rendererInstance.render(true);
    }
  }, [selectedRowId, rendererInstance]);

  const [opsExpanded, setOpsExpanded] = useState(true);
  const [finExpanded, setFinExpanded] = useState(false);
  const [metaExpanded, setMetaExpanded] = useState(false);

  const [tableSearch, setTableSearch] = useState(() => store.searchQueryString);

  // Subscribe to config changes to sync tab status and search query
  useEffect(() => {
    return store.subscribeConfigChange(() => {
      setProjectStatusFilter(store.filterSettings.project_status);
      setSortCriteria([...store.sortCriteria]);
      setTableSearch(store.searchQueryString);
      setFailedCount(store.runningFailedCount);
    });
  }, [store]);

  // Trigger DOMRenderer full re-render when filters, sorting, or search changes
  useEffect(() => {
    if (rendererInstance) {
      rendererInstance.render(true);
    }
  }, [rendererInstance, projectStatusFilter, sortCriteria, tableSearch]);

  // Subscribe to metrics updates to sync visible count
  useEffect(() => {
    return streamManager.subscribeMetrics((_, count) => {
      setVisibleCount(count);
      setFailedCount(store.runningFailedCount);
    });
  }, [streamManager, store]);

  // Handle tab click for status filter
  const handleTabClick = (status: string) => {
    store.setFilters({ project_status: status });
    streamManager.ingestBatch([]); // request re-index and render
  };

  // Handle click on column header for sorting (Single or Multi-Column)
  const handleHeaderClick = (field: string, event: React.MouseEvent) => {
    const isShiftPressed = event.shiftKey;
    const key = field as any;

    let newCriteria: SortCriterion[] = [];

    if (isShiftPressed) {
      // Multi-column sorting
      const existingIdx = sortCriteria.findIndex((c) => c.field === key);
      if (existingIdx !== -1) {
        const current = sortCriteria[existingIdx];
        if (current.direction === 'desc') {
          // Remove from sort criteria if toggled past desc
          newCriteria = sortCriteria.filter((c) => c.field !== key);
        } else {
          // Toggle direction: asc -> desc
          newCriteria = [...sortCriteria];
          newCriteria[existingIdx] = { field: key, direction: 'desc' };
        }
      } else {
        // Append new column sort
        newCriteria = [...sortCriteria, { field: key, direction: 'asc' }];
      }
    } else {
      // Single column sorting
      const isCurrentlySorted = sortCriteria.length === 1 && sortCriteria[0].field === key;
      if (isCurrentlySorted) {
        const direction: SortDirection = sortCriteria[0].direction === 'asc' ? 'desc' : 'asc';
        newCriteria = [{ field: key, direction }];
      } else {
        newCriteria = [{ field: key, direction: 'asc' }];
      }
    }

    setSortCriteria(newCriteria);
    store.setSortCriteria(newCriteria);
    
    if (rendererInstance) {
      rendererInstance.forceRender();
    }
  };

  // Helper to render sort badge/indicator icon
  const renderSortIndicator = (field: string) => {
    const isSortable = !['selected', 'actions', 'trend_24h'].includes(field);
    if (!isSortable) return null;

    const criterionIdx = sortCriteria.findIndex((c) => c.field === field);
    if (criterionIdx === -1) {
      return (
        <span className="ml-1 text-[9px] text-slate-300 font-bold select-none">
          ⇅
        </span>
      );
    }

    const c = sortCriteria[criterionIdx];
    return (
      <div className="ml-1 flex items-center select-none">
        <span className="text-[10px] text-[#014D3E] font-bold">
          {c.direction === 'asc' ? '▲' : '▼'}
        </span>
        {sortCriteria.length > 1 && (
          <span className="ml-0.5 text-[7px] bg-emerald-50 text-[#014D3E] font-extrabold px-1 rounded-sm">
            {criterionIdx + 1}
          </span>
        )}
      </div>
    );
  };



  const columns = rendererInstance ? rendererInstance.columns : [];

  return (
    <div className="flex-1 flex flex-row overflow-hidden w-full h-full relative font-sans">
      
      {/* Left side: Main Grid view container */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 h-full">
      
      {/* Top Row: Saved Views + Tabs + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-0 flex-shrink-0 w-full">
        {/* Saved Views Dropdown & Export */}
        <div className="flex items-center w-full md:w-auto justify-between md:justify-start">
          <button className="hidden md:flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-sm">
            <svg className="w-3.5 h-3.5 mr-1.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
            Saved Views
            <svg className="w-3.5 h-3.5 ml-1.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          <button 
            onClick={handleExportCSV}
            className="md:ml-2 flex flex-1 md:flex-none justify-center items-center px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-sm"
          >
            <svg className="w-3.5 h-3.5 mr-1.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Right Side Search */}
        <div className="flex items-center w-full md:w-auto">
          <div className="relative w-full md:w-auto">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                store.setSearchQuery(e.target.value);
                streamManager.ingestBatch([]); // trigger recomputation/render
              }}
              placeholder="Search projects (Cmd+K)"
              className="pl-8 pr-3 py-1.5 w-full md:w-56 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#014D3E]/40 transition-colors shadow-sm inset-y-0"
            />
          </div>
        </div>
      </div>

      {/* Sub-Tabs Row */}
      <div className="flex items-center px-5 pt-3 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => handleTabClick('all')}
            className={`text-[12px] font-semibold pb-3 border-b-2 transition-all ${
              projectStatusFilter === 'all'
                ? 'text-[#014D3E] border-[#014D3E]'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            All Projects
          </button>
          <button
            onClick={() => handleTabClick('Active')}
            className={`text-[12px] font-semibold pb-3 border-b-2 transition-all ${
              projectStatusFilter === 'Active'
                ? 'text-[#014D3E] border-[#014D3E]'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => handleTabClick('Completed')}
            className={`text-[12px] font-semibold pb-3 border-b-2 transition-all ${
              projectStatusFilter === 'Completed'
                ? 'text-[#014D3E] border-[#014D3E]'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => handleTabClick('Failed')}
            className={`text-[12px] font-semibold pb-3 border-b-2 transition-all flex items-center ${
              projectStatusFilter === 'Failed'
                ? 'text-[#014D3E] border-[#014D3E]'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            Failed
            <span className="ml-1.5 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full select-none">
              {failedCount}
            </span>
          </button>
          <button
            onClick={() => handleTabClick('Paused')}
            className={`text-[12px] font-semibold pb-3 border-b-2 transition-all ${
              projectStatusFilter === 'Paused'
                ? 'text-[#014D3E] border-[#014D3E]'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            At-Risk Accounts
          </button>
        </div>
      </div>

      {/* Paused Stream Notification Banner */}
      {isPaused && (
        <div className="bg-amber-50 border-b border-amber-100 px-5 py-2.5 flex items-center justify-between text-xs text-amber-800 font-medium select-none flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Telemetry stream is frozen. You can now inspect rows or view the aggregated analytics.</span>
          </div>
          <button 
            onClick={onAnalyticsClick}
            className="text-xs font-semibold uppercase tracking-wider border border-amber-200 bg-white px-3 py-1.5 rounded-md text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer shadow-sm flex items-center"
          >
            <svg className="w-3.5 h-3.5 mr-1.5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
            </svg>
            Analytics View
          </button>
        </div>
      )}

      {/* Grid container */}
      <div className="flex-1 overflow-auto bg-white relative" ref={containerRef}>
        {/* Sticky Headers (React-owned shell) */}
        <div className="sticky top-0 z-20 flex bg-white border-b border-slate-100 w-max min-w-full">
          {columns.map((col) => {
            const isSortable = !['actions', 'trend_24h'].includes(col.key);
            const isNarrow = ['actions', 'trend_24h'].includes(col.key);
            return (
              <div
                key={col.key}
                onClick={(e) => {
                  if (isSortable) {
                    handleHeaderClick(col.key, e);
                  }
                }}
                className={`${
                  isNarrow ? 'px-2' : 'px-4'
                } py-3 flex items-center text-left text-[11px] font-semibold text-slate-400 ${
                  isSortable ? 'cursor-pointer hover:text-slate-600' : 'cursor-default'
                } transition-colors select-none`}
                style={{
                  width: `${col.width}px`,
                  flexShrink: 0,
                  flexGrow: col.key === 'project_name' ? 1 : 0,
                  justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
                }}
              >
                <span>{col.label}</span>
                {renderSortIndicator(col.key)}
              </div>
            );
          })}
        </div>
        {/* Empty State */}
        {visibleCount === 0 && (
          <div className="absolute inset-0 top-[40px] z-10 flex flex-col items-center justify-center bg-white">
            <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-sm font-bold text-slate-700 mb-1">No projects found</h3>
            <p className="text-xs text-slate-500 mb-4 text-center max-w-xs">
              We couldn't find any projects matching your current filters or search query.
            </p>
            <button
              onClick={() => {
                store.setFilters({ project_status: 'all' });
                store.setSearchQuery('');
                setTableSearch('');
                streamManager.ingestBatch([]); // Force re-render
              }}
              className="px-4 py-2 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
        {/* DOM Recycler nodes will be appended here by DOMRenderer */}
      </div>

      {/* Pagination controls footer */}
      <div className="flex items-center justify-between text-[12px] text-slate-500 px-5 py-3 border-t border-slate-100 select-none flex-shrink-0">
        {/* Left side: Row Count Summary */}
        <div className="flex items-center space-x-4">
          <div className="font-medium text-slate-500">
            Showing 1 to {Math.min(10, visibleCount)} of <span className="font-bold text-slate-700">{visibleCount.toLocaleString()}</span> projects
          </div>
        </div>

        {/* Center: Page numbers */}
        <div className="flex items-center space-x-1">
          <button className="w-8 h-8 flex items-center justify-center border border-[#014D3E] bg-[#014D3E] text-white rounded-lg text-[11px] font-bold">1</button>
          <button className="w-8 h-8 flex items-center justify-center border border-slate-200 hover:bg-slate-50 rounded-lg text-[11px] font-medium text-slate-600">2</button>
          <button className="w-8 h-8 flex items-center justify-center border border-slate-200 hover:bg-slate-50 rounded-lg text-[11px] font-medium text-slate-600">3</button>
          <span className="w-8 h-8 flex items-center justify-center text-slate-400 text-[11px]">···</span>
          <button className="w-8 h-8 flex items-center justify-center border border-slate-200 hover:bg-slate-50 rounded-lg text-[11px] font-medium text-slate-600">{Math.max(1, Math.ceil(visibleCount / 10))}</button>
          <button className="w-8 h-8 flex items-center justify-center border border-slate-200 hover:bg-slate-50 rounded-lg text-[11px] font-medium text-slate-600">&gt;</button>
        </div>

        {/* Right side: Page size dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400 font-medium">Rows per page:</span>
          <select className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-600 focus:outline-none">
            <option>10</option>
            <option>25</option>
            <option>50</option>
          </select>
        </div>
      </div> {/* Close Pagination controls footer */}
    </div> {/* Close Left Side Grid View Container */}

      {/* Side Inspector Split Pane */}
      {selectedRow && (
        <>
          {/* Mobile backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden animate-fade-in" 
            onClick={() => setSelectedRowId(null)} 
          />
          <div className="fixed inset-y-0 right-0 w-full sm:w-[380px] lg:static lg:w-[340px] border-l border-slate-200/70 bg-white flex flex-col h-full flex-shrink-0 z-50 lg:z-30 select-text font-sans shadow-2xl lg:shadow-sm">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#014D3E]" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Project Detail Inspector</span>
              </div>
              <span className="font-mono text-xs font-black text-[#014D3E] mt-2 leading-none">
                {selectedRow.project_id}
              </span>
            </div>
            <button
              onClick={() => setSelectedRowId(null)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-150 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors shadow-sm cursor-pointer"
              title="Close Inspector"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body container */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* Project Name Card */}
            <div className="flex flex-col space-y-1 pb-4 border-b border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">PROJECT NAME</span>
              <h3 className="text-[13px] font-black text-slate-900 leading-snug">{selectedRow.project_name}</h3>
            </div>

            {/* 1. INITIAL HIGH-VALUE INFORMATION PANEL */}
            <div className="space-y-4">
              <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest">KEY METRICS</span>
              
              <div className="grid grid-cols-2 gap-3">
                {/* KPI 1: ROI */}
                <div className="bg-slate-50/50 border border-slate-150 p-3.5 rounded-[16px] flex flex-col justify-between h-[68px]">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">ROI</span>
                  <span className={`text-[15px] font-black font-mono mt-1.5 leading-none ${selectedRow.roi_percent > 100 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {selectedRow.roi_percent.toFixed(0)}%
                  </span>
                </div>

                {/* KPI 2: Annual Savings */}
                <div className="bg-slate-50/50 border border-slate-150 p-3.5 rounded-[16px] flex flex-col justify-between h-[68px]">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Annual Savings</span>
                  <span className="text-[15px] font-black font-mono text-slate-900 mt-1.5 leading-none">
                    ${selectedRow.annual_savings_usd >= 1e6 
                      ? `${(selectedRow.annual_savings_usd / 1e6).toFixed(1)}M` 
                      : selectedRow.annual_savings_usd.toLocaleString()}
                  </span>
                </div>

                {/* KPI 3: Robots Deployed */}
                <div className="bg-slate-50/50 border border-slate-150 p-3.5 rounded-[16px] flex flex-col justify-between h-[68px]">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Robots</span>
                  <span className="text-[15px] font-black font-mono text-slate-900 mt-1.5 leading-none">
                    {selectedRow.robots_deployed.toLocaleString()}
                  </span>
                </div>

                {/* KPI 4: Hours Saved */}
                <div className="bg-slate-50/50 border border-slate-150 p-3.5 rounded-[16px] flex flex-col justify-between h-[68px]">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Hours Saved</span>
                  <span className="text-[15px] font-black font-mono text-slate-900 mt-1.5 leading-none">
                    {selectedRow.employee_hours_saved.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Quick status rows */}
              <div className="flex flex-col space-y-2 pt-2 border-t border-slate-100/60">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-bold">Project Status</span>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    selectedRow.project_status.toLowerCase() === 'completed'
                      ? 'bg-emerald-50 text-emerald-600'
                      : selectedRow.project_status.toLowerCase() === 'failed' || selectedRow.project_status.toLowerCase() === 'critical'
                        ? 'bg-rose-50 text-rose-600'
                        : selectedRow.project_status.toLowerCase() === 'active'
                          ? 'bg-[#ADFF41]/20 text-[#014D3E]'
                          : 'bg-slate-100 text-slate-500'
                  }`}>
                    {selectedRow.project_status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-bold">AI Core Integration</span>
                  <span className={`text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    selectedRow.ai_enabled
                      ? 'bg-[#ADFF41]/15 text-[#014D3E] border border-[#ADFF41]/30'
                      : 'bg-slate-50 text-slate-450 border border-slate-100'
                  }`}>
                    {selectedRow.ai_enabled ? '✦ AI Enabled' : 'Standard'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-bold">Cloud Deployment</span>
                  <span className={`text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center ${
                    selectedRow.cloud_deployment
                      ? 'bg-blue-50 text-blue-600 border border-blue-100/50'
                      : 'bg-amber-50 text-amber-600 border border-amber-100/50'
                  }`}>
                    {selectedRow.cloud_deployment ? (
                      <>
                        <svg className="w-3 h-3 mr-1 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 00.332-7.482 3.5 3.5 0 00-6.682-1.018 3 3 0 00-4.65 3.224A3 3 0 002.25 15z" />
                        </svg>
                        Cloud-Hosted
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 mr-1 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21h10.5" />
                        </svg>
                        On-Premises
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. COLLAPSIBLE SECTIONS */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              
              {/* Accordion 1: Operations */}
              <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm bg-white">
                <button
                  type="button"
                  onClick={() => setOpsExpanded(!opsExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 hover:bg-slate-50 text-[10.5px] font-black text-slate-700 tracking-wider uppercase focus:outline-none cursor-pointer"
                >
                  <span className="flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.214-1.28z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Operations
                  </span>
                  <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${opsExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {opsExpanded && (
                  <div className="p-4 space-y-3 text-[11px] border-t border-slate-150 animate-fade-in select-text">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-400 uppercase text-[8px]">Implementation Partner</span>
                      <span className="font-bold text-slate-800 mt-1 truncate">{selectedRow.implementation_partner || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-400 uppercase text-[8px]">Automation Type</span>
                      <span className="font-bold text-slate-800 mt-1">{selectedRow.automation_type}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 2: Financials */}
              <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm bg-white">
                <button
                  type="button"
                  onClick={() => setFinExpanded(!finExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 hover:bg-slate-50 text-[10.5px] font-black text-slate-700 tracking-wider uppercase focus:outline-none cursor-pointer"
                >
                  <span className="flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.214.128c.31.187.665.3 1.036.3 1.13 0 2.05-.917 2.05-2.05s-.92-2.05-2.05-2.05H11.5a2.05 2.05 0 00-2.05 2.05c0 1.133.92 2.05 2.05 2.05h.086m-.086 0H12m0-8.818l.214-.128c.31-.187.665-.3 1.036-.3 1.13 0 2.05.917 2.05 2.05s-.92 2.05-2.05 2.05H12.5a2.05 2.05 0 01-2.05-2.05c0-1.133.92-2.05 2.05-2.05h.086m-.086 0H12" />
                    </svg>
                    Financials
                  </span>
                  <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${finExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {finExpanded && (
                  <div className="p-4 space-y-3 text-[11px] border-t border-slate-150 animate-fade-in select-text">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-400 uppercase text-[8px]">Project Budget</span>
                      <span className="font-bold text-slate-800 font-mono mt-1">
                        ${selectedRow.budget_usd.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-400 uppercase text-[8px]">Annual Savings</span>
                      <span className="font-bold text-slate-800 font-mono mt-1">
                        ${selectedRow.annual_savings_usd.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 3: Deployment & Metadata */}
              <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm bg-white">
                <button
                  type="button"
                  onClick={() => setMetaExpanded(!metaExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 hover:bg-slate-50 text-[10.5px] font-black text-slate-700 tracking-wider uppercase focus:outline-none cursor-pointer"
                >
                  <span className="flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
                    </svg>
                    Deployment &amp; Metadata
                  </span>
                  <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${metaExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {metaExpanded && (
                  <div className="p-4 space-y-3 text-[11px] border-t border-slate-150 animate-fade-in select-text">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-400 uppercase text-[8px]">Country</span>
                        <span className="font-bold text-slate-800 mt-1">{selectedRow.country}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-400 uppercase text-[8px]">Department</span>
                        <span className="font-bold text-slate-800 mt-1 truncate">{selectedRow.department}</span>
                      </div>
                      <div className="flex flex-col col-span-2">
                        <span className="font-bold text-slate-400 uppercase text-[8px]">Company ID</span>
                        <span className="font-bold text-slate-800 font-mono text-[10px] mt-1 truncate">{selectedRow.company_id}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-400 uppercase text-[8px]">Start Date</span>
                        <span className="font-bold text-slate-800 font-mono mt-1">{selectedRow.start_date}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-400 uppercase text-[8px]">Completion Date</span>
                        <span className="font-bold text-slate-800 font-mono mt-1">{selectedRow.completion_date || '--'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-150 flex flex-col items-center justify-center flex-shrink-0 bg-slate-50 space-y-1">
            <div className="flex items-center space-x-1.5 text-[8.5px] font-bold text-rose-500 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Telemetry Ingestion Paused</span>
            </div>
            <span className="text-[8px] font-semibold text-slate-400 font-mono">
              Last Telemetry: {selectedRow._lastUpdatedAt ? new Date(selectedRow._lastUpdatedAt).toLocaleTimeString() : '12:00:00 AM'}
            </span>
          </div>

        </div>
      )}

      {/* Floating Notifications */}
      <div className="absolute top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center space-x-2 px-3.5 py-2 bg-[#014D3E] text-white rounded-lg shadow-lg text-[10.5px] font-bold border border-[#014D3E] animate-slide-left pointer-events-auto"
          >
            <svg className="w-3.5 h-3.5 text-[#ADFF41] animate-bounce" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
});

GridViewport.displayName = 'GridViewport';
