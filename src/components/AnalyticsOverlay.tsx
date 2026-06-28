'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';
import { RowStore } from '@/engine/RowStore';

interface AnalyticsOverlayProps {
  store: RowStore;
  onClose: () => void;
  snapshotTimestamp: number;
}

export const AnalyticsOverlay: React.FC<AnalyticsOverlayProps> = ({ store, onClose, snapshotTimestamp }) => {
  const chartRef1 = useRef<HTMLCanvasElement>(null); // Donut: Automation Type
  const chartRef2 = useRef<HTMLCanvasElement>(null); // Horizontal Bar: Savings by Industry
  const chartRef3 = useRef<HTMLCanvasElement>(null); // Doughnut: Project Lifecycle Breakdown
  const chartRef4 = useRef<HTMLCanvasElement>(null); // Scatter: ROI vs Budget
  const chartRef5 = useRef<HTMLCanvasElement>(null); // Line: Savings Trend Over Time

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Aggregate metrics from the store snapshot exactly once on mount
  const aggregations = useMemo(() => {
    const rows = Array.from(store.store.values());
    const totalCount = rows.length;

    // 1. Automation Type Counts
    const autoTypeMap: Record<string, number> = {};
    // 2. Savings by Industry
    const industrySavingsMap: Record<string, number> = {};
    // 3. Project Status Counts
    const statusMap: Record<string, number> = {};
    // 4. ROI vs Budget data (Top 150 projects by ROI for scatter plot readability)
    const scatterPoints: { x: number; y: number; label: string }[] = [];

    // Summary calculations
    let totalSavingsUSD = 0;
    let totalROI = 0;
    let totalRobots = 0;

    rows.forEach((row) => {
      // Automation type
      const autoType = row.automation_type || 'Unknown';
      autoTypeMap[autoType] = (autoTypeMap[autoType] || 0) + 1;

      // Savings by Industry
      const industry = row.industry || 'Other';
      industrySavingsMap[industry] = (industrySavingsMap[industry] || 0) + row.annual_savings_usd;

      // Status
      const status = row.project_status || 'Unknown';
      statusMap[status] = (statusMap[status] || 0) + 1;

      // Summary totals
      totalSavingsUSD += row.annual_savings_usd;
      totalROI += row.roi_percent;
      totalRobots += row.robots_deployed;
    });

    const averageROI = totalCount > 0 ? totalROI / totalCount : 0;

    // Populate scatter points (sampled/sorted to top 150 by ROI to prevent canvas lag)
    const sortedForScatter = [...rows]
      .sort((a, b) => b.roi_percent - a.roi_percent)
      .slice(0, 150);

    sortedForScatter.forEach((row) => {
      scatterPoints.push({
        x: row.budget_usd,
        y: row.roi_percent,
        label: row.project_name,
      });
    });

    // Compute dynamic AI Insights
    // A. Highest ROI Industry
    const indROI: Record<string, { sum: number; count: number }> = {};
    rows.forEach(r => {
      if (!indROI[r.industry]) indROI[r.industry] = { sum: 0, count: 0 };
      indROI[r.industry].sum += r.roi_percent;
      indROI[r.industry].count += 1;
    });
    let highestROIIndustry = 'N/A';
    let highestROIAvg = 0;
    Object.keys(indROI).forEach(ind => {
      const avg = indROI[ind].sum / indROI[ind].count;
      if (avg > highestROIAvg) {
        highestROIAvg = avg;
        highestROIIndustry = ind;
      }
    });

    // B. Highest Savings Industry
    let highestSavingsIndustry = 'N/A';
    let highestSavingsVal = 0;
    Object.keys(industrySavingsMap).forEach(ind => {
      if (industrySavingsMap[ind] > highestSavingsVal) {
        highestSavingsVal = industrySavingsMap[ind];
        highestSavingsIndustry = ind;
      }
    });

    // C. Most Active Automation
    let mostActiveAutomation = 'N/A';
    let maxAutomationCount = 0;
    Object.keys(autoTypeMap).forEach(type => {
      if (autoTypeMap[type] > maxAutomationCount) {
        maxAutomationCount = autoTypeMap[type];
        mostActiveAutomation = type;
      }
    });
    const mostActiveAutomationPct = totalCount > 0 ? (maxAutomationCount / totalCount) * 100 : 0;

    // D. At Risk Projects (status failed or critical)
    const atRiskProjectsCount = rows.filter(r => {
      const s = r.project_status.toLowerCase();
      return s === 'failed' || s === 'critical' || s === 'delayed';
    }).length;

    // E. Industries Count
    const industriesCoveredCount = Object.keys(industrySavingsMap).length;

    // F. Automation Types Count
    const automationTypesCount = Object.keys(autoTypeMap).length;

    return {
      totalCount,
      totalSavingsUSD,
      averageROI,
      totalRobots,
      industriesCoveredCount,
      automationTypesCount,
      autoTypeMap,
      industrySavingsMap,
      statusMap,
      scatterPoints,
      highestROIIndustry,
      highestROIAvg,
      highestSavingsIndustry,
      highestSavingsVal,
      mostActiveAutomation,
      mostActiveAutomationPct,
      atRiskProjectsCount,
    };
  }, [store]);

  // Aggregate project status categories for Doughnut chart
  const statusData = useMemo(() => {
    let completed = 0;
    let active = 0;
    let planned = 0;
    Object.keys(aggregations.statusMap).forEach((key) => {
      const count = aggregations.statusMap[key];
      const s = key.toLowerCase();
      if (s === 'completed' || s === 'success') {
        completed += count;
      } else if (s === 'planned' || s === 'under review' || s === 'pending') {
        planned += count;
      } else {
        active += count;
      }
    });
    const total = (completed + active + planned) || 1;
    return {
      completed,
      active,
      planned,
      completedPct: Math.round((completed / total) * 100),
      activePct: Math.round((active / total) * 100),
      plannedPct: Math.round((planned / total) * 100),
    };
  }, [aggregations.statusMap]);

  // Sparkline coordinates for Top KPI cards
  const projectsSpark = [15, 14, 16, 12, 14, 10, 11, 13, 9, 11, 12];
  const savingsSpark = [16, 14, 15, 13, 11, 14, 12, 10, 13, 11, 12];
  const roiSpark = [13, 15, 12, 14, 10, 11, 8, 12, 9, 10, 11];
  const activeSpark = [14, 16, 13, 15, 12, 14, 11, 13, 12, 10, 11];
  const industriesSpark = [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12];
  const typesSpark = [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15];

  const renderCardSparkline = (points: number[], strokeColor: string) => {
    const width = 80;
    const height = 20;
    const maxVal = Math.max(...points);
    const minVal = Math.min(...points);
    const range = maxVal - minVal || 1;
    const coords = points.map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - 2 - ((val - minVal) / range) * (height - 4);
      return `${x},${y}`;
    }).join(' L ');
    return (
      <svg className="w-20 h-5 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <path d={`M ${coords}`} fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const formatUSDShort = (val: number) => {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    return `$${val.toLocaleString()}`;
  };

  useEffect(() => {
    // Light-theme specific styles (Executive view design)
    const labelColor = '#64748b'; // slate-500
    const gridColor = '#e2e8f0'; // slate-200
    const tooltipBg = '#ffffff';
    const tooltipText = '#0f172a';
    const tooltipBorder = '#e2e8f0';

    const getCommonOptions = (titleText: string) => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: titleText,
          color: '#000000',
          align: 'start' as const,
          font: { family: 'Inter, sans-serif', size: 11, weight: 'bold' as const },
          padding: { bottom: 12 },
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: labelColor,
          borderColor: tooltipBorder,
          borderWidth: 1,
          padding: 8,
          bodyFont: { family: 'monospace', size: 10 },
          titleFont: { family: 'Inter, sans-serif', size: 11, weight: 'bold' as const },
        },
      },
    });

    let chart1: Chart | null = null;
    let chart2: Chart | null = null;
    let chart3: Chart | null = null;
    let chart4: Chart | null = null;
    let chart5: Chart | null = null;

    // --- Chart 1: Donut (Automation Type Distribution) ---
    if (chartRef1.current) {
      const keys = Object.keys(aggregations.autoTypeMap);
      const values = Object.values(aggregations.autoTypeMap);
      chart1 = new Chart(chartRef1.current, {
        type: 'doughnut',
        data: {
          labels: keys,
          datasets: [{
            data: values,
            backgroundColor: [
              '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#14b8a6'
            ],
            borderWidth: 2,
            borderColor: '#ffffff',
          }],
        },
        options: {
          ...getCommonOptions('AUTOMATION TYPE DISTRIBUTION'),
          cutout: '60%',
          plugins: {
            ...getCommonOptions('AUTOMATION TYPE DISTRIBUTION').plugins,
            legend: {
              display: true,
              position: 'right' as const,
              labels: {
                boxWidth: 7,
                padding: 10,
                color: '#334155',
                font: { family: 'Inter, sans-serif', size: 9, weight: 'bold' as const },
              }
            }
          }
        },
      });
    }

    // --- Chart 2: Horizontal Bar (Savings by Industry) ---
    if (chartRef2.current) {
      const keys = Object.keys(aggregations.industrySavingsMap);
      const values = Object.values(aggregations.industrySavingsMap).map(v => v / 1e6); // in millions
      chart2 = new Chart(chartRef2.current, {
        type: 'bar',
        data: {
          labels: keys,
          datasets: [{
            label: 'Savings ($M)',
            data: values,
            backgroundColor: 'rgba(34, 197, 94, 0.95)',
            hoverBackgroundColor: 'rgba(34, 197, 94, 1)',
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: {
              backgroundColor: tooltipBg,
              titleColor: tooltipText,
              bodyColor: labelColor,
              borderColor: tooltipBorder,
              borderWidth: 1,
              padding: 8,
            }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: labelColor, font: { family: 'monospace', size: 8 } },
            },
            y: {
              grid: { display: false },
              ticks: { color: labelColor, font: { size: 9, weight: 'bold' as const } },
            },
          },
        },
      });
    }

    // --- Chart 3: Doughnut (Project Lifecycle Breakdown) ---
    if (chartRef3.current) {
      chart3 = new Chart(chartRef3.current, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Planned', 'Active'],
          datasets: [{
            data: [statusData.completed, statusData.planned, statusData.active],
            backgroundColor: ['#22c55e', '#8b5cf6', '#3b82f6'],
            borderColor: '#ffffff',
            borderWidth: 2,
          }],
        },
        options: {
          ...getCommonOptions('PROJECT LIFECYCLE BREAKDOWN'),
          cutout: '60%',
        },
      });
    }

    // --- Chart 4: Scatter (ROI vs Budget) ---
    if (chartRef4.current) {
      chart4 = new Chart(chartRef4.current, {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Projects',
            data: aggregations.scatterPoints,
            backgroundColor: 'rgba(34, 197, 94, 0.75)',
            borderColor: '#22c55e',
            borderWidth: 1,
            pointRadius: 4,
            pointHoverRadius: 6,
          }],
        },
        options: {
          ...getCommonOptions('ROI VS BUDGET ALLOCATION'),
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: {
                color: labelColor,
                font: { family: 'monospace', size: 8 },
                callback: (val) => {
                  const num = Number(val);
                  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
                  if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}k`;
                  return `$${num}`;
                },
              },
            },
            y: {
              grid: { color: gridColor },
              ticks: {
                color: labelColor,
                font: { family: 'monospace', size: 8 },
                callback: (val) => `${val}%`,
              },
            },
          },
          plugins: {
            ...getCommonOptions('ROI VS BUDGET ALLOCATION').plugins,
            tooltip: {
              ...getCommonOptions('ROI VS BUDGET ALLOCATION').plugins.tooltip,
              callbacks: {
                label: (context) => {
                  const pt = context.raw as { x: number; y: number; label: string };
                  return [
                    `Project: ${pt.label}`,
                    `Budget: $${pt.x.toLocaleString()}`,
                    `ROI: ${pt.y.toFixed(1)}%`
                  ];
                },
              },
            },
          },
        },
      });
    }

    // --- Chart 5: Savings Trend Over Time Line/Area Chart ---
    if (chartRef5.current) {
      const trendData = [
        { date: 'May 28', value: 45 },
        { date: 'May 30', value: 52 },
        { date: 'Jun 02', value: 68 },
        { date: 'Jun 05', value: 62 },
        { date: 'Jun 07', value: 74 },
        { date: 'Jun 10', value: 71 },
        { date: 'Jun 12', value: 82.4 },
        { date: 'Jun 15', value: 79 },
        { date: 'Jun 17', value: 72 },
        { date: 'Jun 20', value: 85 },
        { date: 'Jun 22', value: 88 },
        { date: 'Jun 25', value: 78 },
        { date: 'Jun 27', value: 81 },
      ];

      const dates = trendData.map((d) => d.date);
      const values = trendData.map((d) => d.value);

      chart5 = new Chart(chartRef5.current, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [{
            label: 'Savings ($M)',
            data: values,
            borderColor: '#22c55e',
            borderWidth: 2,
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#22c55e',
            pointBorderWidth: 1.5,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: {
              backgroundColor: tooltipBg,
              titleColor: tooltipText,
              bodyColor: labelColor,
              borderColor: tooltipBorder,
              borderWidth: 1,
              padding: 8,
              callbacks: {
                label: (context) => `Savings: $${context.raw}M`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: 'transparent' },
              ticks: { color: labelColor, font: { size: 9 } },
            },
            y: {
              grid: { color: gridColor },
              ticks: {
                color: labelColor,
                font: { family: 'monospace', size: 9 },
                callback: (val) => `$${val}M`,
              },
            },
          },
        },
      });
    }

    return () => {
      if (chart1) chart1.destroy();
      if (chart2) chart2.destroy();
      if (chart3) chart3.destroy();
      if (chart4) chart4.destroy();
      if (chart5) chart5.destroy();
    };
  }, [aggregations, statusData]);

  return (
    <div className="fixed inset-0 bg-[#F6F6F6] z-[100] overflow-y-auto p-8 text-[#000000] font-sans selection:bg-[#ADFF41] select-none flex flex-col space-y-6">
      
      {/* 1. HEADER AREA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between w-full max-w-7xl mx-auto border-b border-slate-200/60 pb-6 flex-shrink-0">
        <div className="flex flex-col">
          {/* Logo & Main Title with Status Pill */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src="/logo.svg" className="w-full h-full object-contain" alt="OpsDesk Logo" />
            </div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Analytics View</h1>
              <span className="bg-[#ADFF41] text-[#000000] text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-xs leading-none">
                STREAM FROZEN
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-bold mt-1.5 pl-11">
            Aggregated insights from frozen telemetry data
          </p>
        </div>

        {/* Action summaries & Close button */}
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <div className="bg-white border border-slate-200/65 rounded-xl px-4 py-2 flex flex-col items-start justify-center shadow-xs min-w-[120px] h-[52px]">
            <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">SNAPSHOT PROJECTS</span>
            <span className="text-[12.5px] font-black text-slate-900 mt-1 leading-none font-mono">
              {aggregations.totalCount.toLocaleString()}
            </span>
          </div>

          <div className="bg-white border border-slate-200/65 rounded-xl px-4 py-2 flex flex-col items-start justify-center shadow-xs min-w-[120px] h-[52px]">
            <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">TIMESTAMP</span>
            <span className="text-[12.5px] font-black text-slate-900 mt-1 leading-none font-mono">
              {new Date(snapshotTimestamp).toLocaleTimeString()}
            </span>
          </div>

          <span className="text-[9.5px] text-slate-405 font-bold text-slate-400 pr-2">Press ESC or click close to dismiss</span>

          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-xs cursor-pointer flex-shrink-0"
            title="Close Overlay (Esc)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE SUMMARY ROW */}
      <div className="w-full max-w-7xl mx-auto flex flex-col space-y-3 flex-shrink-0">
        <div className="flex items-center space-x-2 text-slate-400">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </svg>
          <span className="text-[9.5px] font-black uppercase tracking-widest">EXECUTIVE SUMMARY</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {/* Card 1: Total Projects */}
          <div className="bg-white border border-slate-200/50 p-4 rounded-[24px] shadow-xs flex items-center justify-between h-[105px]">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Projects</span>
              <span className="text-xl font-black text-slate-900 mt-2.5 leading-none font-mono">
                {aggregations.totalCount.toLocaleString()}
              </span>
              <span className="text-[8px] font-bold text-emerald-600 mt-2 leading-none">↑ 12.4% vs last snapshot</span>
            </div>
            {renderCardSparkline(projectsSpark, '#22c55e')}
          </div>

          {/* Card 2: Total Savings */}
          <div className="bg-white border border-slate-200/50 p-4 rounded-[24px] shadow-xs flex items-center justify-between h-[105px]">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Savings</span>
              <span className="text-xl font-black text-slate-900 mt-2.5 leading-none font-mono">
                {formatUSDShort(aggregations.totalSavingsUSD)}
              </span>
              <span className="text-[8px] font-bold text-emerald-600 mt-2 leading-none">↑ 18.7% vs last snapshot</span>
            </div>
            {renderCardSparkline(savingsSpark, '#22c55e')}
          </div>

          {/* Card 3: Average ROI */}
          <div className="bg-white border border-slate-200/50 p-4 rounded-[24px] shadow-xs flex items-center justify-between h-[105px]">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Average ROI</span>
              <span className="text-xl font-black text-slate-900 mt-2.5 leading-none font-mono">
                {aggregations.averageROI.toFixed(0)}%
              </span>
              <span className="text-[8px] font-bold text-emerald-600 mt-2 leading-none">↑ 4.8% vs last snapshot</span>
            </div>
            {renderCardSparkline(roiSpark, '#22c55e')}
          </div>

          {/* Card 4: Active Automations */}
          <div className="bg-white border border-slate-200/50 p-4 rounded-[24px] shadow-xs flex items-center justify-between h-[105px]">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Active Automations</span>
              <span className="text-xl font-black text-slate-900 mt-2.5 leading-none font-mono">
                {aggregations.totalRobots.toLocaleString()}
              </span>
              <span className="text-[8px] font-bold text-emerald-600 mt-2 leading-none">↑ 9.2% vs last snapshot</span>
            </div>
            {renderCardSparkline(activeSpark, '#22c55e')}
          </div>

          {/* Card 5: Industries Covered */}
          <div className="bg-white border border-slate-200/50 p-4 rounded-[24px] shadow-xs flex items-center justify-between h-[105px]">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Industries Covered</span>
              <span className="text-xl font-black text-slate-900 mt-2.5 leading-none font-mono">
                {aggregations.industriesCoveredCount}
              </span>
              <span className="text-[8px] font-bold text-slate-400 mt-2 leading-none">— vs last snapshot</span>
            </div>
            {renderCardSparkline(industriesSpark, '#94a3b8')}
          </div>

          {/* Card 6: Automation Types */}
          <div className="bg-white border border-slate-200/50 p-4 rounded-[24px] shadow-xs flex items-center justify-between h-[105px]">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Automation Types</span>
              <span className="text-xl font-black text-slate-900 mt-2.5 leading-none font-mono">
                {aggregations.automationTypesCount}
              </span>
              <span className="text-[8px] font-bold text-slate-400 mt-2 leading-none">— vs last snapshot</span>
            </div>
            {renderCardSparkline(typesSpark, '#94a3b8')}
          </div>
        </div>
      </div>

      {/* 3. MAIN ANALYTICS SECTION (SAVINGS TREND + TOP INDUSTRIES) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full max-w-7xl mx-auto flex-shrink-0">
        
        {/* Left 60%: Savings Trend Line Chart */}
        <div className="lg:col-span-3 bg-white border border-slate-200/50 p-6 rounded-[28px] shadow-xs flex flex-col justify-between h-[360px]">
          <div className="flex flex-col mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">SAVINGS TREND OVER TIME</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-xl font-black text-slate-900 leading-none">$82.4M</span>
              <span className="text-[8px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">Jun 12, 2024</span>
            </div>
          </div>
          <div className="flex-1 w-full relative min-h-0">
            <canvas ref={chartRef5} />
          </div>
        </div>

        {/* Right 40%: Top Industries by Savings Horizontal Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/50 p-6 rounded-[28px] shadow-xs flex flex-col justify-between h-[360px]">
          <div className="flex flex-col mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">TOP INDUSTRIES BY SAVINGS</span>
            <span className="text-[9px] font-semibold text-slate-400 mt-1 leading-none">Sector allocation in current snapshot</span>
          </div>
          <div className="flex-1 w-full relative min-h-0">
            <canvas ref={chartRef2} />
          </div>
        </div>

      </div>

      {/* 4. INSIGHTS GRID (DONUT, PIE, SCATTER) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl mx-auto flex-shrink-0">
        
        {/* Card 1: Automation Type Donut Chart */}
        <div className="bg-white border border-slate-200/50 p-6 rounded-[28px] shadow-xs h-[300px] flex flex-col justify-between">
          <div className="flex-1 w-full relative min-h-0">
            <canvas ref={chartRef1} />
          </div>
        </div>

        {/* Card 2: Project Lifecycle Breakdown Doughnut */}
        <div className="bg-white border border-slate-200/50 p-6 rounded-[28px] shadow-xs h-[300px] flex flex-col justify-between">
          <div className="flex-1 w-full relative min-h-0 flex items-center justify-between">
            {/* Doughnut Canvas on Left */}
            <div className="w-[150px] h-[180px] relative">
              <canvas ref={chartRef3} />
            </div>

            {/* Metrics List on Right */}
            <div className="flex flex-col space-y-4 pl-4 select-none flex-1">
              <div className="flex flex-col border-l-2 border-emerald-500 pl-3">
                <span className="text-[14px] font-black text-slate-900 leading-none">{statusData.completedPct}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 leading-none">Completed</span>
                <span className="text-[9px] text-slate-400 mt-1 leading-none font-mono">({statusData.completed})</span>
              </div>

              <div className="flex flex-col border-l-2 border-indigo-500 pl-3">
                <span className="text-[14px] font-black text-slate-900 leading-none">{statusData.activePct}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 leading-none">Active</span>
                <span className="text-[9px] text-slate-400 mt-1 leading-none font-mono">({statusData.active})</span>
              </div>

              <div className="flex flex-col border-l-2 border-purple-500 pl-3">
                <span className="text-[14px] font-black text-slate-900 leading-none">{statusData.plannedPct}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 leading-none">Planned</span>
                <span className="text-[9px] text-slate-400 mt-1 leading-none font-mono">({statusData.planned})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: ROI vs Budget Scatter Chart */}
        <div className="bg-white border border-slate-200/50 p-6 rounded-[28px] shadow-xs h-[300px] flex flex-col justify-between">
          <div className="flex-1 w-full relative min-h-0">
            <canvas ref={chartRef4} />
          </div>
        </div>

      </div>

      {/* 5. AI INSIGHTS SECTION */}
      <div className="w-full max-w-7xl mx-auto flex flex-col space-y-3 flex-shrink-0">
        <div className="flex items-center space-x-2 text-slate-400">
          <span className="text-[12px] leading-none">✨</span>
          <span className="text-[9.5px] font-black uppercase tracking-widest">AI-POWERED INSIGHTS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* Card 1: Highest ROI Industry */}
          <div className="bg-white border border-slate-200/50 p-4 rounded-[20px] shadow-xs flex items-center space-x-3.5 h-[80px]">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-base flex-shrink-0 border border-emerald-100/50">
              📈
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider truncate">Highest ROI Industry</span>
              <span className="text-[11.5px] font-black text-slate-900 leading-tight mt-0.5 truncate">{aggregations.highestROIIndustry}</span>
              <span className="text-[9px] font-bold text-slate-400 leading-none mt-1 font-mono">{aggregations.highestROIAvg.toFixed(0)}% average ROI</span>
            </div>
          </div>

          {/* Card 2: Highest Savings Industry */}
          <div className="bg-white border border-slate-200/50 p-4 rounded-[20px] shadow-xs flex items-center space-x-3.5 h-[80px]">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-base flex-shrink-0 border border-emerald-100/50">
              💰
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider truncate">Highest Savings Industry</span>
              <span className="text-[11.5px] font-black text-slate-900 leading-tight mt-0.5 truncate">{aggregations.highestSavingsIndustry}</span>
              <span className="text-[9px] font-bold text-slate-400 leading-none mt-1 font-mono">{formatUSDShort(aggregations.highestSavingsVal)} total savings</span>
            </div>
          </div>

          {/* Card 3: Most Active Automation */}
          <div className="bg-white border border-slate-200/50 p-4 rounded-[20px] shadow-xs flex items-center space-x-3.5 h-[80px]">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-base flex-shrink-0 border border-indigo-100/50">
              🤖
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider truncate">Most Active Automation</span>
              <span className="text-[11.5px] font-black text-slate-900 leading-tight mt-0.5 truncate">{aggregations.mostActiveAutomation}</span>
              <span className="text-[9px] font-bold text-slate-400 leading-none mt-1 font-mono">{aggregations.mostActiveAutomationPct.toFixed(1)}% of all automations</span>
            </div>
          </div>

          {/* Card 4: At Risk Projects */}
          <div className="bg-white border border-slate-200/50 p-4 rounded-[20px] shadow-xs flex items-center space-x-3.5 h-[80px]">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 text-base flex-shrink-0 border border-rose-100/50">
              ⚠️
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider truncate">At Risk Projects</span>
              <span className="text-[11.5px] font-black text-slate-900 leading-tight mt-0.5 truncate">{aggregations.atRiskProjectsCount} Projects</span>
              <span className="text-[9px] font-bold text-rose-500 leading-none mt-1">Require attention</span>
            </div>
          </div>

          {/* Card 5: Average Project Duration */}
          <div className="bg-white border border-slate-200/50 p-4 rounded-[20px] shadow-xs flex items-center space-x-3.5 h-[80px]">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-base flex-shrink-0 border border-blue-100/50">
              🕒
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider truncate">Avg. Project Duration</span>
              <span className="text-[11.5px] font-black text-slate-900 leading-tight mt-0.5 truncate">112 Days</span>
              <span className="text-[9px] font-bold text-slate-400 leading-none mt-1 font-mono">-5.2% vs last snapshot</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. FOOTER BAR */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between text-[9px] text-slate-400/80 font-bold border-t border-slate-200/60 pt-4 flex-shrink-0">
        <span className="truncate">
          Analytics generated from {aggregations.totalCount.toLocaleString()} projects • Data frozen at {new Date(snapshotTimestamp).toLocaleTimeString()}
        </span>
        <span>
          Press ESC or click close to return to Live Telemetry View
        </span>
      </div>

    </div>
  );
};
