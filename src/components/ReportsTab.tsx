'use client';

import React, { useState } from 'react';
import { RowStore } from '@/engine/RowStore';
import { StreamManager } from '@/engine/StreamManager';
import { KPIMetrics } from '@/engine/types';

interface ReportsTabProps {
  store: RowStore;
  streamManager: StreamManager;
  metrics: KPIMetrics | null;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ store, streamManager, metrics }) => {
  const [dataset, setDataset] = useState('All Projects Ingested');
  const [format, setFormat] = useState('PDF');
  const [timeframe, setTimeframe] = useState('Last 30 Days');

  const activeReports = [
    { title: 'Executive Savings Summary', frequency: 'Weekly', format: 'PDF', status: 'Active', run: '2026-06-25 08:00' },
    { title: 'Fleet Workload & Health Logs', frequency: 'Daily', format: 'CSV', status: 'Active', run: '2026-06-28 00:00' },
    { title: 'ROI Optimization Recommendations', frequency: 'Monthly', format: 'PDF', status: 'Scheduled', run: '2026-06-01 12:00' },
    { title: 'Anomaly & Incident Audit Logs', frequency: 'Daily', format: 'JSON', status: 'Paused', run: '2026-06-27 15:30' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-8 py-6 space-y-6 min-w-0 bg-[#F6F6F6] font-sans selection:bg-[#ADFF41] selection:text-[#014D3E] text-slate-800">
      
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <h1 className="text-[26px] font-black text-[#014D3E] tracking-tight leading-none">Reporting Center</h1>
            <span className="text-[#014D3E] text-lg">✦</span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-1.5">
            Generate, schedule, and export operational audits
          </p>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center space-x-3">
          <button className="bg-white border border-slate-200/80 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 flex items-center shadow-sm hover:bg-slate-5 transition-colors">
            <svg className="w-3.5 h-3.5 mr-2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55" />
            </svg>
            Export Settings
          </button>
          <button className="flex items-center px-4 py-2 bg-[#014D3E] hover:bg-[#013D31] text-white rounded-xl text-xs font-bold shadow-sm transition-colors border border-transparent">
            <span className="mr-1 text-sm font-light">+</span> Schedule Report
          </button>
        </div>
      </div>

      {/* Row of 3 metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1 */}
        <div className="bg-white border border-slate-200/40 p-5 rounded-[22px] shadow-sm flex items-center space-x-4 h-[105px]">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100/50 flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-purple-650" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Active Pipelines</span>
            <span className="text-xl font-black font-mono text-[#014D3E] mt-1.5 leading-none">4 Pipelines</span>
            <span className="text-[9px] font-bold text-purple-600 mt-1.5 leading-none">Weekly / Daily / Monthly</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200/40 p-5 rounded-[22px] shadow-sm flex items-center space-x-4 h-[105px]">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50 flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-blue-555" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Compiled</span>
            <span className="text-xl font-black font-mono text-[#014D3E] mt-1.5 leading-none">1,284 Runs</span>
            <span className="text-[9px] font-bold text-blue-500 mt-1.5 leading-none">24,529 kb overall size</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200/40 p-5 rounded-[22px] shadow-sm flex items-center space-x-4 h-[105px]">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50 flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Delivery Rate</span>
            <span className="text-xl font-black font-mono text-[#014D3E] mt-1.5 leading-none">99.9%</span>
            <span className="text-[9px] font-bold text-emerald-650 mt-1.5 leading-none">0 delays or failed builds</span>
          </div>
        </div>
      </div>

      {/* Split section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        
        {/* Card Left: Instant Export Configuration (35% width) */}
        <div className="lg:col-span-2 bg-white p-6 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between min-h-[340px]">
          <div>
            <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-100">
              <svg className="w-4.5 h-4.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87" />
              </svg>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">INSTANT REPORT BUILDER</span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mb-4">
              Select target parameters and export format to compile executive reports immediately.
            </p>

            <div className="space-y-4">
              {/* Dropdown 1 */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Dataset Target</label>
                <select 
                  value={dataset} 
                  onChange={(e) => setDataset(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option>All Projects Ingested</option>
                  <option>High ROI (&gt;200%) Projects</option>
                  <option>Active Critical Anomalies</option>
                </select>
              </div>

              {/* Dropdown 2 */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">File Format</label>
                <select 
                  value={format} 
                  onChange={(e) => setFormat(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="PDF">Portable Document Format (PDF)</option>
                  <option value="XLSX">Excel Spreadsheet (XLSX)</option>
                  <option value="CSV">Comma-Separated Values (CSV)</option>
                </select>
              </div>

              {/* Dropdown 3 */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Timeframe Period</label>
                <select 
                  value={timeframe} 
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option>Last 30 Days</option>
                  <option>Last 7 Days</option>
                  <option>Q3 Year-to-Date</option>
                </select>
              </div>
            </div>
          </div>

          <button className="w-full py-2.5 bg-[#014D3E] hover:bg-[#013D31] text-white rounded-xl font-bold text-xs shadow-sm transition-colors mt-6">
            Generate & Download Report
          </button>
        </div>

        {/* Card Right: Scheduled Automations Pipeline Table (65% width) */}
        <div className="lg:col-span-3 bg-white p-6 border border-slate-200/40 rounded-[22px] shadow-sm flex flex-col justify-between min-h-[340px]">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <svg className="w-4.5 h-4.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">AUTOMATED REPORTS PIPELINE</h2>
              </div>
            </div>

            <div className="w-full overflow-x-auto select-none">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="text-[9.5px] font-black uppercase text-slate-400 border-b border-slate-100 pb-2">
                    <th className="py-2.5">REPORT TITLE</th>
                    <th className="py-2.5">FREQUENCY</th>
                    <th className="py-2.5 text-center">FORMAT</th>
                    <th className="py-2.5 text-center">STATUS</th>
                    <th className="py-2.5">LAST RUN</th>
                    <th className="py-2.5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {activeReports.map((r, i) => {
                    let statusClass = 'bg-slate-100 text-slate-600 border-slate-200/50';
                    let statusIcon = '';
                    if (r.status === 'Active') {
                      statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-100/60';
                      statusIcon = `<span class="w-1 h-1 rounded-full bg-emerald-500 mr-1.5 flex-shrink-0"></span>`;
                    } else if (r.status === 'Scheduled') {
                      statusClass = 'bg-blue-50 text-blue-700 border-blue-100/60';
                      statusIcon = `<span class="w-1 h-1 rounded-full bg-blue-500 mr-1.5 flex-shrink-0"></span>`;
                    } else if (r.status === 'Paused') {
                      statusClass = 'bg-slate-50 text-slate-500 border-slate-200/60';
                      statusIcon = `<span class="w-1 h-1 rounded-full bg-slate-400 mr-1.5 flex-shrink-0"></span>`;
                    }

                    return (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-4 font-bold text-slate-800">{r.title}</td>
                        <td className="py-4 text-slate-500 font-semibold">{r.frequency}</td>
                        <td className="py-4 text-center font-mono text-[10px] font-black text-purple-650">{r.format}</td>
                        <td className="py-4">
                          <div className="flex justify-center">
                            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8.5px] font-bold border ${statusClass}`}>
                              <span dangerouslySetInnerHTML={{ __html: statusIcon }} />
                              <span className="uppercase tracking-wider">{r.status}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 font-mono text-slate-450 font-bold text-[10px]">{r.run}</td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end space-x-2.5 text-[10.5px]">
                            <button className="text-[#014D3E] hover:text-[#013D31] font-black bg-transparent border-0 p-0 cursor-pointer">Run Now</button>
                            <span className="text-slate-200">|</span>
                            <button className="text-slate-450 hover:text-slate-750 font-black bg-transparent border-0 p-0 cursor-pointer">Edit</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
