'use client';

import React from 'react';
import { RowStore } from '@/engine/RowStore';
import { StreamManager } from '@/engine/StreamManager';

interface SidebarFiltersProps {
  store: RowStore;
  streamManager: StreamManager;
  isOpen: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleSidebar?: () => void;
}

export const SidebarFilters: React.FC<SidebarFiltersProps> = React.memo(({
  isOpen,
  activeTab,
  setActiveTab,
  toggleSidebar,
}) => {

  const mainNavItems = [
    {
      name: 'Overview',
      icon: (
        <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    },
    {
      name: 'Projects',
      icon: (
        <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25c.59 0 1.15.23 1.56.64l1.5 1.5h6.44A2.25 2.25 0 0120 8.25v9.5A2.25 2.25 0 0117.75 20H6A2.25 2.25 0 013.75 17.75V6z" />
        </svg>
      )
    },
    {
      name: 'Analytics',
      icon: (
        <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
        </svg>
      )
    },
    {
      name: 'Incidents',
      icon: (
        <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      )
    },
    {
      name: 'Automations',
      icon: (
        <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M8 12h.01M16 12h.01M9 16h6" strokeLinecap="round" />
          <path d="M12 6V3m0 0h-2m2 0h2" strokeLinecap="round" />
        </svg>
      )
    },
    {
      name: 'Robots',
      icon: (
        <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
        </svg>
      )
    },
    {
      name: 'Departments',
      icon: (
        <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      )
    },
    {
      name: 'Reports',
      icon: (
        <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    },
  ];

  return (
    <>
      {/* Mobile/Tablet Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden cursor-pointer"
          onClick={toggleSidebar}
        />
      )}
      <div 
        className={`fixed inset-y-0 left-0 w-[200px] flex flex-col bg-white border-r border-slate-200/80 h-full font-sans select-none z-50
          transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:z-auto lg:shadow-none shadow-2xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}
        `}
      >
      
      {/* Logo + Brand */}
      <div className="flex items-center px-4 py-3 border-b border-slate-100">
        <div className="w-full h-12 flex items-center justify-center overflow-hidden">
          <img src="/logo.svg" className="w-full h-full object-contain" alt="OpsDesk Logo" />
        </div>
      </div>

      {/* Section label */}
      <div className="px-4 pt-4 pb-1">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Main Menu</span>
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 flex flex-col px-2 space-y-0.5 pt-1 overflow-y-auto">
        {mainNavItems.map((item) => {
          const isActive = activeTab === item.name;
          return (
            <button
              type="button"
              key={item.name}
              onClick={() => {
                setActiveTab(item.name);
                if (typeof window !== 'undefined' && window.innerWidth < 1024 && toggleSidebar) {
                  toggleSidebar();
                }
              }}
              className={`flex items-center w-full px-3 py-2.5 rounded-xl text-left transition-all duration-150 group border border-transparent focus:outline-none ${
                isActive
                  ? 'bg-[#014D3E] text-white shadow-sm'
                  : 'bg-transparent text-slate-650 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <span className={isActive ? 'text-[#ADFF41]' : 'text-slate-400 group-hover:text-slate-600'}>
                {item.icon}
              </span>
              <span className={`ml-3 text-[12.5px] font-semibold truncate ${isActive ? 'text-white' : 'text-slate-700 group-hover:text-slate-900'}`}>
                {item.name}
              </span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#ADFF41] flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col px-2 pb-4 space-y-0.5 border-t border-slate-100 pt-3">
        {/* Settings */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('Settings');
            if (typeof window !== 'undefined' && window.innerWidth < 1024 && toggleSidebar) {
              toggleSidebar();
            }
          }}
          className={`flex items-center w-full px-3 py-2.5 rounded-xl text-left transition-all duration-150 group border border-transparent focus:outline-none ${
            activeTab === 'Settings'
              ? 'bg-[#014D3E] text-white shadow-sm'
              : 'bg-transparent text-slate-650 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          <span className={activeTab === 'Settings' ? 'text-[#ADFF41]' : 'text-slate-400 group-hover:text-slate-600 flex-shrink-0'}>
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          <span className={`ml-3 text-[12.5px] font-semibold ${activeTab === 'Settings' ? 'text-white' : 'text-slate-700 group-hover:text-slate-900'}`}>Settings</span>
        </button>

        {/* Help */}
        <button
          type="button"
          className="flex items-center w-full px-3 py-2.5 rounded-xl text-left transition-all duration-150 text-slate-650 bg-transparent border border-transparent focus:outline-none hover:bg-slate-100 hover:text-slate-800 group"
        >
          <span className="text-slate-400 group-hover:text-slate-600 flex-shrink-0">
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </span>
          <span className="ml-3 text-[12.5px] font-semibold text-slate-700 group-hover:text-slate-900">Help</span>
        </button>

        {/* Divider + User Avatar */}
        <div className="flex items-center px-3 py-2.5 mt-1 rounded-xl bg-slate-50 border border-slate-200/60">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
            alt="User"
            className="w-7 h-7 rounded-full object-cover border border-slate-200 flex-shrink-0"
          />
          <div className="ml-2.5 flex flex-col leading-none flex-grow min-w-0">
            <span className="text-[11px] font-bold text-slate-700 truncate">Aryan R.</span>
            <span className="text-[9px] font-medium text-slate-400 mt-0.5 truncate">Admin</span>
          </div>
          <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </div>
      </div>

    </div>
    </>
  );
});

SidebarFilters.displayName = 'SidebarFilters';
