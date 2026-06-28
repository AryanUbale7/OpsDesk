'use client';

import React, { useMemo, useState } from 'react';
import { RowStore } from '@/engine/RowStore';
import { StreamManager } from '@/engine/StreamManager';
import { Row } from '@/engine/types';

interface AutomationsTabProps {
  store: RowStore;
  streamManager: StreamManager;
}

export const AutomationsTab: React.FC<AutomationsTabProps> = ({ store, streamManager }) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedInfra, setSelectedInfra] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

  const showToast = (msg: string) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message: msg }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleExportCSV = () => {
    const headers = [
      'Workflow ID',
      'Name/Initiative',
      'Automation Type',
      'Deployed Bots',
      'AI Engine',
      'Infrastructure',
      'Status',
      'Last Run'
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

    for (let i = 0; i < automationsList.length; i++) {
      const item = automationsList[i];
      const workflowId = item.project_id.replace('PRJ-', 'AUT-');
      const infra = item.cloud_deployment ? 'Cloud' : 'On-Premise';
      const status = item.project_status;
      const lastRun = item._lastUpdatedAt ? new Date(item._lastUpdatedAt).toLocaleString() : 'N/A';

      const rowValues = [
        escapeCSVCell(workflowId),
        escapeCSVCell(item.project_name),
        escapeCSVCell(item.automation_type),
        escapeCSVCell(item.robots_deployed || 0),
        escapeCSVCell(item.ai_enabled ? 'Yes' : 'No'),
        escapeCSVCell(infra),
        escapeCSVCell(status),
        escapeCSVCell(lastRun)
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
    const filename = `opsdesk-automations-snapshot-${year}-${month}-${day}-${hours}-${minutes}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Successfully exported ${automationsList.length} automations to CSV`);
  };

  // Dynamically map project rows into styled system automations
  const automationsList = useMemo(() => {
    const list: Row[] = Array.from(store.store.values());
    
    // Filtering based on search query and selections
    return list.filter(row => {
      const matchesSearch = row.project_name.toLowerCase().includes(search.toLowerCase()) ||
                            row.project_id.toLowerCase().includes(search.toLowerCase()) ||
                            row.department.toLowerCase().includes(search.toLowerCase());
      
      const matchesType = selectedType === 'All' || 
                          row.automation_type.toLowerCase() === selectedType.toLowerCase();
      
      const matchesInfra = selectedInfra === 'All' || 
                           (selectedInfra === 'Cloud' && row.cloud_deployment) ||
                           (selectedInfra === 'On-Premise' && !row.cloud_deployment);
      
      return matchesSearch && matchesType && matchesInfra;
    });
  }, [store.store.size, search, selectedType, selectedInfra]);

  const totalPages = Math.ceil(automationsList.length / pageSize) || 1;
  const activePage = Math.min(currentPage, totalPages);

  const paginatedList = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return automationsList.slice(start, start + pageSize);
  }, [automationsList, activePage, pageSize]);

  const totalRobots = useMemo(() => {
    return automationsList.reduce((acc, row) => acc + (row.robots_deployed || 0), 0);
  }, [automationsList]);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-8 py-6 space-y-6 min-w-0 bg-[#F6F6F6] font-sans selection:bg-[#ADFF41] selection:text-[#014D3E] text-slate-800">
      
      {/* Header Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-[26px] font-black text-[#014D3E] tracking-tight leading-none">Automations Console</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1.5">
            Manage, monitor, and configure active software workflow bots
          </p>
        </div>

        {/* Deploy Automation Button */}
        <button className="flex items-center px-4 py-2 bg-[#014D3E] hover:bg-[#013D31] text-white rounded-xl text-xs font-bold shadow-sm transition-colors border border-transparent">
          <span className="mr-1.5 text-sm font-light">+</span> Deploy Automation
        </button>
      </div>

      {/* Top Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Active Workflows */}
        <div className="bg-white border border-slate-200/40 p-5 rounded-[22px] shadow-sm flex items-center space-x-4 h-[105px]">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50 flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.68-.34-1.12-1-1.12-1.74V9.75c0-.74.44-1.4 1.12-1.74l4.24-2.12c.68-.34 1.12-1 1.12-1.74V3h2.25v1.25" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Active Workflows</span>
            <span className="text-xl font-black font-mono text-[#014D3E] mt-1.5 leading-none">
              {automationsList.length} Bots
            </span>
            <span className="text-[9px] font-bold text-blue-500 mt-1.5 leading-none">98.9% success execution rate</span>
          </div>
        </div>

        {/* Card 2: Total Hours Saved */}
        <div className="bg-white border border-slate-200/40 p-5 rounded-[22px] shadow-sm flex items-center space-x-4 h-[105px]">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50 flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Robots Deployed</span>
            <span className="text-xl font-black font-mono text-[#014D3E] mt-1.5 leading-none">{totalRobots} Agents</span>
            <span className="text-[9px] font-bold text-emerald-650 mt-1.5 leading-none">↑ 14% vs last quarter</span>
          </div>
        </div>

        {/* Card 3: Execution Load */}
        <div className="bg-white border border-slate-200/40 p-5 rounded-[22px] shadow-sm flex items-center space-x-4 h-[105px]">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100/50 flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Execution Load</span>
            <span className="text-xl font-black font-mono text-[#014D3E] mt-1.5 leading-none">1,842 / min</span>
            <span className="text-[9px] font-bold text-amber-605 mt-1.5 leading-none">Live processed transactions</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white p-6 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between">
        
        {/* Card Top: Title, Search, Filters */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">All Deployed Automations</span>
          
          <div className="flex items-center space-x-3.5">
            {/* Search workflow input */}
            <input 
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search workflows..."
              className="bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none w-44"
            />

            {/* Automation Type filter dropdown */}
            <select 
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-1.5 text-[10.5px] font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="RPA">RPA</option>
              <option value="NLP">NLP</option>
              <option value="OCR">OCR</option>
              <option value="Chatbot">Chatbot</option>
            </select>

            {/* Infrastructure filter dropdown */}
            <select 
              value={selectedInfra}
              onChange={(e) => {
                setSelectedInfra(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-55 border border-slate-200/60 rounded-xl px-3 py-1.5 text-[10.5px] font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Infrastructure</option>
              <option value="Cloud">Cloud</option>
              <option value="On-Premise">On-Premise</option>
            </select>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 text-[10.5px] font-bold text-slate-700 flex items-center shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 mr-1.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="w-full overflow-x-auto select-none">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="text-[9.5px] font-black uppercase text-slate-400 border-b border-slate-100 pb-2">
                <th className="py-2.5">WORKFLOW ID</th>
                <th className="py-2.5">NAME / INITIATIVE</th>
                <th className="py-2.5">AUTOMATION TYPE</th>
                <th className="py-2.5 text-center w-24">DEPLOYED BOTS</th>
                <th className="py-2.5 text-center">AI ENGINE</th>
                <th className="py-2.5 text-center">INFRASTRUCTURE</th>
                <th className="py-2.5 text-center">STATUS</th>
                <th className="py-2.5 text-right">LAST RUN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedList.map((item, idx) => {
                // Workflow ID mapping
                const workflowId = item.project_id.replace('PRJ-', 'AUT-');
                
                // Color mapping for Automation Type
                let typeClass = 'bg-slate-50 text-slate-600 border-slate-200';
                if (item.automation_type.toUpperCase() === 'RPA') {
                  typeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100/60';
                } else if (item.automation_type.toUpperCase() === 'NLP') {
                  typeClass = 'bg-purple-50 text-purple-700 border-purple-100/60';
                } else if (item.automation_type.toUpperCase() === 'OCR') {
                  typeClass = 'bg-blue-50 text-blue-700 border-blue-100/60';
                } else if (item.automation_type.toUpperCase() === 'CHATBOT') {
                  typeClass = 'bg-amber-50 text-amber-700 border-amber-100/60';
                }

                // AI Engine tag
                const aiBadge = item.ai_enabled ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8.5px] font-black bg-purple-50 text-purple-700 border border-purple-100/60">
                    <span className="text-purple-650 mr-1">✦</span> GenAI Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8.5px] font-bold bg-slate-50 text-slate-500 border border-slate-200/50">
                    Standard Rule
                  </span>
                );

                // Infrastructure Type
                const infraTag = item.cloud_deployment ? (
                  <span className="inline-flex items-center text-slate-600">
                    <svg className="w-3.5 h-3.5 mr-1.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 00.332-7.482 3.5 3.5 0 00-6.682-1.018 3 3 0 00-4.65 3.224A3 3 0 002.25 15z" />
                    </svg>
                    Cloud
                  </span>
                ) : (
                  <span className="inline-flex items-center text-slate-505">
                    <svg className="w-3.5 h-3.5 mr-1.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 3h13.5m-13.5-6h13.5m-13.5-3h13.5m-13.5-3h13.5" />
                    </svg>
                    On-Premise
                  </span>
                );

                // Status pillar
                let statusBadge = 'bg-slate-100 text-slate-600 border-slate-200';
                let statusIcon = '';
                const lowerStatus = item.project_status.toLowerCase();
                if (lowerStatus === 'completed' || lowerStatus === 'success') {
                  statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-100/60';
                  statusIcon = `<span class="w-1 h-1 rounded-full bg-emerald-500 mr-1.5 flex-shrink-0"></span>`;
                } else if (lowerStatus === 'active' || lowerStatus === 'in progress') {
                  statusBadge = 'bg-blue-50 text-blue-700 border-blue-100/60';
                  statusIcon = `<span class="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 flex-shrink-0 blink-indicator"></span>`;
                } else if (lowerStatus === 'failed' || lowerStatus === 'critical' || lowerStatus === 'error') {
                  statusBadge = 'bg-rose-50 text-rose-700 border-rose-100/60';
                  statusIcon = `<span class="w-1 h-1 rounded-full bg-rose-500 mr-1.5 flex-shrink-0"></span>`;
                } else {
                  statusBadge = 'bg-amber-50 text-amber-700 border-amber-100/60';
                  statusIcon = `<span class="w-1 h-1 rounded-full bg-amber-500 mr-1.5 flex-shrink-0"></span>`;
                }

                // Render dynamic relative time
                const relativeTime = item._lastUpdatedAt
                  ? new Date(item._lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '03:10 PM';

                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-4 font-mono font-bold text-slate-800 text-xs">{workflowId}</td>
                    <td className="py-4">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-850 truncate">{item.project_name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-none">{item.department}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${typeClass}`}>
                        {item.automation_type}
                      </span>
                    </td>
                    <td className="py-4 text-center font-mono text-xs text-slate-800 font-bold">{item.robots_deployed}</td>
                    <td className="py-4 text-center">{aiBadge}</td>
                    <td className="py-4 text-center">{infraTag}</td>
                    <td className="py-4">
                      <div className="flex justify-center">
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8.5px] font-bold border ${statusBadge}`}>
                          <span dangerouslySetInnerHTML={{ __html: statusIcon }} />
                          <span className="uppercase tracking-wider">{item.project_status}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right font-mono text-slate-450 text-[10px]">{relativeTime}</td>
                  </tr>
                );
              })}
              {automationsList.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-450 font-mono text-xs">
                    No matching deployed automations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls footer */}
        <div className="flex items-center justify-between text-[12px] text-slate-500 pt-4 mt-4 border-t border-slate-100 select-none">
          {/* Left side: Row Count Summary */}
          <div className="font-medium text-slate-500">
            Showing {automationsList.length > 0 ? (activePage - 1) * pageSize + 1 : 0} to {Math.min(activePage * pageSize, automationsList.length)} of <span className="font-bold text-slate-700">{automationsList.length.toLocaleString()}</span> automations
          </div>

          {/* Center: Page numbers */}
          <div className="flex items-center space-x-1">
            <button 
              disabled={activePage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="w-8 h-8 flex items-center justify-center border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white rounded-lg text-[11px] font-medium text-slate-650 cursor-pointer"
            >
              &lt;
            </button>
            <span className="text-[11px] font-bold text-slate-700 px-2">
              Page {activePage} of {totalPages}
            </span>
            <button 
              disabled={activePage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="w-8 h-8 flex items-center justify-center border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white rounded-lg text-[11px] font-medium text-slate-650 cursor-pointer"
            >
              &gt;
            </button>
          </div>

          {/* Right side: Page size select */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400 font-medium">Rows per page:</span>
            <select 
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

      </div>

      {/* Toast notifications portal container */}
      <div className="fixed bottom-5 right-5 z-[999] flex flex-col space-y-2 pointer-events-none select-none">
        {toasts.map((t) => (
          <div key={t.id} className="bg-slate-900 border border-slate-800 text-white rounded-xl px-4.5 py-3 text-[11px] font-bold shadow-lg animate-fade-in pointer-events-auto flex items-center space-x-2">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
};
