'use client';

import React, { useMemo, useState } from 'react';
import { RowStore } from '@/engine/RowStore';
import { StreamManager } from '@/engine/StreamManager';
import { KPIMetrics } from '@/engine/types';

interface DepartmentsTabProps {
  store: RowStore;
  streamManager: StreamManager;
  metrics: KPIMetrics | null;
}

export const DepartmentsTab: React.FC<DepartmentsTabProps> = ({ store, streamManager, metrics }) => {
  const [timeRange, setTimeRange] = useState('This Year');
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

  const showToast = (msg: string) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message: msg }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleExportReport = () => {
    const headers = [
      'Rank',
      'Department',
      'Projects Count',
      'Annual Savings (USD)',
      'Average ROI %'
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

    for (let i = 0; i < leadersList.length; i++) {
      const item = leadersList[i];
      const rowValues = [
        escapeCSVCell(item.rank),
        escapeCSVCell(item.name),
        escapeCSVCell(item.projects),
        escapeCSVCell(item.savings),
        escapeCSVCell(item.roi)
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
    const filename = `opsdesk-departments-report-${year}-${month}-${day}-${hours}-${minutes}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Successfully exported department report to ${filename}`);
  };

  // Sparkline coordinates for top metric cards
  const savingsSpark = [15, 12, 16, 11, 14, 9, 13, 10, 15, 11, 14, 10];
  const projectsSpark = [14, 16, 12, 15, 11, 13, 10, 14, 12, 15, 11, 13];
  const roiSpark = [12, 14, 11, 15, 13, 10, 14, 11, 13, 9, 12, 10];
  const robotsSpark = [16, 13, 15, 11, 14, 12, 16, 10, 13, 12, 15, 11];

  const renderCardSparkline = (points: number[], color: string) => {
    const width = 140;
    const height = 15;
    const n = points.length;
    const pathCoords = points.map((y, i) => `${(i / (n - 1)) * width},${y}`).join(' L ');

    return (
      <svg className="w-full h-4 overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <path d={`M ${pathCoords}`} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  // Sparkline helper for table rows
  const renderRowSparkline = (points: number[], color: string) => {
    const width = 50;
    const height = 10;
    const n = points.length;
    const pathCoords = points.map((y, i) => `${(i / (n - 1)) * width},${y}`).join(' L ');

    return (
      <svg className="w-12 h-2.5 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <path d={`M ${pathCoords}`} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  // Department Leaders Table Rows
  const leadersList = [
    { rank: 1, name: 'Payroll', projects: 174, pct: 85, savings: 70710695, roi: 188, color: '#014D3E', spark: [8, 5, 7, 4, 9, 6, 8, 3, 7] },
    { rank: 2, name: 'Audit', projects: 186, pct: 75, savings: 64508906, roi: 176, color: '#3b82f6', spark: [7, 8, 5, 7, 4, 6, 3, 5, 4] },
    { rank: 3, name: 'Claims Processing', projects: 166, pct: 70, savings: 63396342, roi: 181, color: '#8b5cf6', spark: [6, 4, 7, 5, 8, 4, 6, 5, 7] },
    { rank: 4, name: 'Healthcare Administration', projects: 190, pct: 68, savings: 61643394, roi: 171, color: '#64748b', spark: [5, 6, 4, 5, 3, 5, 4, 3, 5] },
    { rank: 5, name: 'Sales & Marketing', projects: 158, pct: 60, savings: 58242154, roi: 177, color: '#cbd5e1', spark: [4, 5, 3, 4, 2, 4, 3, 2, 4] },
    { rank: 6, name: 'Product Management', projects: 191, pct: 58, savings: 56986860, roi: 173, color: '#cbd5e1', spark: [5, 4, 5, 3, 4, 3, 4, 2, 3] },
    { rank: 7, name: 'Customer Service', projects: 176, pct: 55, savings: 56101913, roi: 178, color: '#cbd5e1', spark: [4, 3, 4, 2, 3, 2, 3, 1, 3] },
    { rank: 8, name: 'Data Management', projects: 176, pct: 55, savings: 55933521, roi: 168, color: '#cbd5e1', spark: [3, 4, 2, 3, 1, 3, 2, 1, 2] },
    { rank: 9, name: 'Research & Development', projects: 151, pct: 52, savings: 55767582, roi: 174, color: '#3b82f6', spark: [4, 5, 3, 4, 6, 4, 5, 3, 5] }
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-8 py-6 space-y-6 min-w-0 bg-[#F6F6F6] font-sans selection:bg-[#ADFF41] selection:text-[#014D3E] text-slate-800">
      
      {/* Header & Date Selector Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <h1 className="text-[26px] font-black text-[#014D3E] tracking-tight leading-none">Department Hub</h1>
            <span className="text-[#014D3E] text-lg">✦</span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-1.5">
            Organizational automation metrics and leaders
          </p>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center space-x-3">
          <button className="bg-white border border-slate-200/80 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 flex items-center shadow-sm hover:bg-slate-5 transition-colors">
            <svg className="w-3.5 h-3.5 mr-2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            This Year
            <svg className="w-2.5 h-2.5 ml-1.5 text-slate-450" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <button 
            onClick={handleExportReport}
            className="bg-white border border-slate-200/80 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 flex items-center shadow-sm hover:bg-slate-5 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 mr-2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export Report
          </button>
        </div>
      </div>

      {/* Row of 4 status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Savings */}
        <div className="bg-white border border-slate-200/40 p-5 rounded-[22px] shadow-sm flex flex-col justify-between h-[125px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Annual Savings</span>
              <span className="text-2xl font-black font-mono text-[#014D3E] mt-2.5 leading-none">
                {metrics ? `$${(metrics.totalSavingsUSD / 1e6 * 1.5).toFixed(2)}M` : '$5.72M'}
              </span>
              <span className="text-[9px] font-bold text-emerald-600 mt-2.5 leading-none">▲ 18.4% vs last year</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50 flex-shrink-0">
              <span className="text-emerald-600 text-sm font-bold">$</span>
            </div>
          </div>
          <div className="w-full opacity-80 mt-1">{renderCardSparkline(savingsSpark, '#10b981')}</div>
        </div>

        {/* Card 2: Projects */}
        <div className="bg-white border border-slate-200/40 p-5 rounded-[22px] shadow-sm flex flex-col justify-between h-[125px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Projects</span>
              <span className="text-2xl font-black font-mono text-[#014D3E] mt-2.5 leading-none">
                {store.store.size ? store.store.size * 32 : '1,685'}
              </span>
              <span className="text-[9px] font-bold text-emerald-600 mt-2.5 leading-none">▲ 8.9% vs last year</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50 flex-shrink-0">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.5L12 12.75M12 12.75l9.75-5.25M12 12.75v10.5m0-10.5L2.25 7.5" />
              </svg>
            </div>
          </div>
          <div className="w-full opacity-80 mt-1">{renderCardSparkline(projectsSpark, '#3b82f6')}</div>
        </div>

        {/* Card 3: Avg ROI */}
        <div className="bg-white border border-slate-200/40 p-5 rounded-[22px] shadow-sm flex flex-col justify-between h-[125px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Avg ROI</span>
              <span className="text-2xl font-black font-mono text-[#014D3E] mt-2.5 leading-none">176%</span>
              <span className="text-[9px] font-bold text-emerald-600 mt-2.5 leading-none">▲ 4.7% vs last year</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100/50 flex-shrink-0">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            </div>
          </div>
          <div className="w-full opacity-80 mt-1">{renderCardSparkline(roiSpark, '#8b5cf6')}</div>
        </div>

        {/* Card 4: Total Robots */}
        <div className="bg-white border border-slate-200/40 p-5 rounded-[22px] shadow-sm flex flex-col justify-between h-[125px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Robots</span>
              <span className="text-2xl font-black font-mono text-[#014D3E] mt-2.5 leading-none">4,628</span>
              <span className="text-[9px] font-bold text-emerald-600 mt-2.5 leading-none">▲ 13.2% vs last year</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100/50 flex-shrink-0">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25" />
              </svg>
            </div>
          </div>
          <div className="w-full opacity-80 mt-1">{renderCardSparkline(robotsSpark, '#f59e0b')}</div>
        </div>

      </div>

          {/* Split Row: Leaders & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Department Leaders rankings (3/5 columns) */}
        <div className="lg:col-span-3 bg-white p-6 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-4.5 h-4.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-2.25c-.621 0-1.125.504-1.125 1.125v3.375m9 0h-9M9 10.5h.008v.008H9V10.5z" />
                </svg>
                <div className="flex flex-col">
                  <h2 className="text-[12px] font-black text-slate-800 uppercase tracking-wider">Department Leaders</h2>
                  <span className="text-[9.5px] font-semibold text-slate-400 mt-0.5 leading-none">Ranked by annual savings</span>
                </div>
              </div>
              
              <div className="flex text-[9px] font-black text-slate-400 uppercase space-x-12 pr-4 select-none pointer-events-none">
                <span>PROJECTS</span>
              </div>
            </div>

            {/* Leaders Table */}
            <div className="w-full overflow-x-auto select-none">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="text-[9.5px] font-black uppercase text-slate-400 border-b border-slate-100 pb-2">
                    <th className="py-2.5 w-12 text-center">RANK</th>
                    <th className="py-2.5">DEPARTMENT</th>
                    <th className="py-2.5 w-12 text-center"></th>
                    <th className="py-2.5 w-2/5"></th>
                    <th className="py-2.5 text-right">ANNUAL SAVINGS</th>
                    <th className="py-2.5 text-center w-16">ROI</th>
                    <th className="py-2.5 text-center w-16">TREND</th>
                    <th className="py-2.5 w-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {leadersList.map((item, idx) => {
                    let badgeClass = 'bg-slate-100 text-slate-600';
                    if (item.rank === 1) badgeClass = 'bg-amber-100 text-amber-700 font-extrabold';
                    else if (item.rank === 2) badgeClass = 'bg-slate-200 text-slate-700 font-extrabold';
                    else if (item.rank === 3) badgeClass = 'bg-amber-50 text-amber-800 font-extrabold';

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3.5 text-center">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] ${badgeClass}`}>
                            {item.rank}
                          </span>
                        </td>
                        <td className="py-3.5 font-bold text-slate-800">{item.name}</td>
                        <td className="py-3.5 font-mono text-[10.5px] text-slate-400 text-right pr-2">{item.projects}</td>
                        <td className="py-3.5 pr-8">
                          <div className="h-1.5 bg-[#F6F6F6] rounded-full overflow-hidden w-full">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                          </div>
                        </td>
                        <td className="py-3.5 text-right font-mono font-black text-slate-850">
                          ${item.savings.toLocaleString()}
                        </td>
                        <td className="py-3.5 text-center font-mono font-bold text-slate-800">{item.roi}%</td>
                        <td className="py-3.5 text-center">
                          <div className="flex justify-center opacity-85">{renderRowSparkline(item.spark, item.rank <= 3 ? item.color : '#64748b')}</div>
                        </td>
                        <td className="py-3.5 text-right text-slate-450 hover:text-slate-700 cursor-pointer text-xs">&gt;</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-center border-t border-slate-100 pt-4 mt-3">
            <button className="text-xs font-bold text-[#014D3E] hover:underline flex items-center bg-transparent border-0 p-0">
              View All Departments
              <svg className="w-3.5 h-3.5 ml-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Sidebar: Resource Allocation & Efficiency & Insights (2/5 columns) */}
        <div className="lg:col-span-2 flex flex-col space-y-5">
          
          {/* 1. Resource Allocation Card */}
          <div className="bg-white p-5 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 mb-1 border-b border-slate-55">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                <span className="text-[10px] font-black text-slate-450 tracking-wider uppercase">Resource Allocation</span>
              </div>
              <button className="text-[10px] font-black text-[#014D3E] hover:underline flex items-center bg-transparent border-0 p-0">
                View Details
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-between my-1">
              <div className="w-24 h-24 relative flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F6F6F6" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#014D3E" strokeWidth="4.2" strokeDasharray="28 72" strokeDashoffset="0" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="4.2" strokeDasharray="22 78" strokeDashoffset="72" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#8b5cf6" strokeWidth="4.2" strokeDasharray="16 84" strokeDashoffset="50" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e0f2fe" strokeWidth="4.2" strokeDasharray="14 86" strokeDashoffset="34" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="4.2" strokeDasharray="12 88" strokeDashoffset="22" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#cbd5e1" strokeWidth="4.2" strokeDasharray="8 92" strokeDashoffset="14" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-black text-[#014D3E] font-mono leading-none">4,628</span>
                  <span className="text-[6.5px] text-slate-400 font-bold uppercase leading-none mt-1">Total Robots</span>
                </div>
              </div>

              <div className="flex flex-col space-y-1 text-[9px] font-bold text-slate-500 pl-4 w-3/5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-[#014D3E] mr-1.5" />Payroll</span>
                  <span className="font-mono text-slate-400">8,330 FTEs <span className="font-bold text-slate-600 pl-1">28%</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />Audit</span>
                  <span className="font-mono text-slate-400">7,821 FTEs <span className="font-bold text-slate-600 pl-1">22%</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5" />Claims</span>
                  <span className="font-mono text-slate-400">6,120 FTEs <span className="font-bold text-slate-600 pl-1">16%</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1] mr-1.5" />Others</span>
                  <span className="font-mono text-slate-400">2,623 FTEs <span className="font-bold text-slate-600 pl-1">8%</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Operational Efficiency Card */}
          <div className="bg-white p-5 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between">
            <div className="flex items-center space-x-2 pb-3 mb-2.5 border-b border-slate-50">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <span className="text-[10px] font-black text-slate-400 tracking-wider">OPERATIONAL EFFICIENCY</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl flex flex-col">
                <span className="text-[8.5px] font-bold text-slate-405 uppercase tracking-wider">Automation Rate</span>
                <span className="text-sm font-black text-slate-800 font-mono mt-1 leading-none">68%</span>
                <span className="text-[7.5px] font-bold text-emerald-600 mt-1.5 leading-none">▲ 6.2% vs LY</span>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl flex flex-col">
                <span className="text-[8.5px] font-bold text-slate-405 uppercase tracking-wider">Avg. Duration</span>
                <span className="text-sm font-black text-slate-800 font-mono mt-1 leading-none">23 Days</span>
                <span className="text-[7.5px] font-bold text-emerald-600 mt-1.5 leading-none">▼ 2 days vs LY</span>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl flex flex-col">
                <span className="text-[8.5px] font-bold text-slate-405 uppercase tracking-wider">Transactions</span>
                <span className="text-sm font-black text-slate-800 font-mono mt-1 leading-none">2.4B</span>
                <span className="text-[7.5px] font-bold text-emerald-600 mt-1.5 leading-none">▲ 12.8% vs LY</span>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl flex flex-col">
                <span className="text-[8.5px] font-bold text-slate-405 uppercase tracking-wider">Success Rate</span>
                <span className="text-sm font-black text-slate-800 font-mono mt-1 leading-none">98.6%</span>
                <span className="text-[7.5px] font-bold text-emerald-600 mt-1.5 leading-none">▲ 1.3% vs LY</span>
              </div>
            </div>
          </div>

          {/* 3. Performance Insights Card */}
          <div className="bg-white p-5 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between">
            <div className="flex items-center space-x-2 pb-3 mb-2.5 border-b border-slate-50">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.913-6.241C19.789 13.681 21 12 21 10.125V9a1 1 0 00-1-1h-6.812l.813-5.096L5.087 9.141A4 4 0 003 12.375V13.5a1 1 0 001 1h6.812z" />
              </svg>
              <span className="text-[10px] font-black text-slate-400 tracking-wider">PERFORMANCE INSIGHTS</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start justify-between space-x-2.5">
                <div className="flex items-start space-x-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-100/50">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold text-slate-805 leading-tight">Payroll leads in savings</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 leading-none">Generating 23% of total savings</span>
                  </div>
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md whitespace-nowrap">Leader</span>
              </div>

              <div className="flex items-start justify-between space-x-2.5">
                <div className="flex items-start space-x-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-100/50">
                    <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold text-slate-805 leading-tight">Automation scaling up</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 leading-none">148 robots added this quarter</span>
                  </div>
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md whitespace-nowrap">Growing</span>
              </div>
            </div>
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
