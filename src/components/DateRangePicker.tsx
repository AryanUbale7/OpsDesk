'use client';

import React, { useState, useRef, useEffect } from 'react';

interface DateRangePickerProps {
  value: string;
  onChange: (val: string) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Custom range date states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // Calendar view states
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const presets = [
    { label: 'Today', value: 'Today' },
    { label: 'Yesterday', value: 'Yesterday' },
    { label: 'Last 7 Days', value: 'Last 7 Days' },
    { label: 'Last 30 Days', value: 'Last 30 Days' },
    { label: 'This Month', value: 'This Month' },
    { label: 'This Year', value: 'This Year' }
  ];

  // Calendar Helpers
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    
    if (!startDate || (startDate && endDate)) {
      setStartDate(clickedDate);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (clickedDate < startDate) {
        setStartDate(clickedDate);
      } else {
        setEndDate(clickedDate);
      }
    }
  };

  const handleApplyCustomRange = () => {
    if (startDate && endDate) {
      const formatOption: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      const startStr = startDate.toLocaleDateString('en-US', formatOption);
      const endStr = endDate.toLocaleDateString('en-US', formatOption);
      onChange(`${startStr} - ${endStr}`);
      setIsOpen(false);
      setShowCalendar(false);
    }
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const gridCells = [...blanks, ...days];

  const isSelected = (day: number) => {
    if (!day) return false;
    const date = new Date(currentYear, currentMonth, day);
    if (startDate && date.getTime() === startDate.getTime()) return true;
    if (endDate && date.getTime() === endDate.getTime()) return true;
    return false;
  };

  const isInRange = (day: number) => {
    if (!day || !startDate || !endDate) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date > startDate && date < endDate;
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border border-slate-200/80 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 flex items-center shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <svg className="w-3.5 h-3.5 mr-2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0121 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <span className="truncate">{value}</span>
        <svg className="w-2.5 h-2.5 ml-1.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown Overlay */}
      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white border border-slate-200 rounded-[20px] shadow-xl z-[99] flex overflow-hidden min-w-[200px] animate-fade-in">
          {/* Presets List */}
          <div className="p-2 border-r border-slate-100 flex flex-col space-y-0.5 w-[160px] flex-shrink-0">
            <span className="px-3 py-1.5 text-[9px] font-black text-slate-400 tracking-widest uppercase">Presets</span>
            {presets.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  onChange(p.value);
                  setIsOpen(false);
                  setShowCalendar(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  value === p.value 
                    ? 'bg-[#014D3E] text-white' 
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setShowCalendar(true)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                showCalendar 
                  ? 'bg-[#014D3E] text-white' 
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Custom Range</span>
              <span className="text-[10px]">→</span>
            </button>
          </div>

          {/* Calendar Pane */}
          {showCalendar && (
            <div className="p-4 w-[280px] flex flex-col justify-between">
              <div>
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-3.5">
                  <button 
                    onClick={handlePrevMonth}
                    className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50 text-slate-650 cursor-pointer text-xs font-bold"
                  >
                    &lt;
                  </button>
                  <span className="text-xs font-black text-[#014D3E] uppercase tracking-wider text-center flex-1">
                    {monthNames[currentMonth]} {currentYear}
                  </span>
                  <button 
                    onClick={handleNextMonth}
                    className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50 text-slate-650 cursor-pointer text-xs font-bold"
                  >
                    &gt;
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 text-center text-[9px] font-black text-slate-400 uppercase mb-1">
                  <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-y-0.5 text-center">
                  {gridCells.map((day, idx) => {
                    if (day === null) {
                      return <div key={`empty-${idx}`} className="h-7 w-7" />;
                    }
                    
                    const selected = isSelected(day);
                    const range = isInRange(day);

                    return (
                      <button
                        key={`day-${day}`}
                        onClick={() => handleDateClick(day)}
                        className={`h-7 w-7 rounded-lg text-[10.5px] font-bold flex items-center justify-center transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#014D3E] text-white'
                            : range
                            ? 'bg-emerald-50 text-[#014D3E]'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Apply Bar */}
              <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between">
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Selected</span>
                  <span className="text-[9px] font-bold text-slate-700 truncate leading-none mt-1 min-h-[10px]">
                    {startDate ? `${startDate.getDate()} ${monthNames[currentMonth].slice(0, 3)}` : 'Select Start'}
                    {endDate ? ` - ${endDate.getDate()} ${monthNames[currentMonth].slice(0, 3)}` : ''}
                  </span>
                </div>
                <button
                  disabled={!startDate || !endDate}
                  onClick={handleApplyCustomRange}
                  className="bg-[#014D3E] hover:bg-[#013D31] disabled:opacity-40 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
