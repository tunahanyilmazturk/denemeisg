import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout = () => {
  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-[#09090b] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200 relative">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/50 dark:from-indigo-900/10 dark:via-transparent dark:to-purple-900/10 pointer-events-none" />
      
      <div className="z-10 flex h-full w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
            <div className="mx-auto max-w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
