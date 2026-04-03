import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout = () => {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 relative">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-transparent to-purple-50/30 dark:from-indigo-950/20 dark:via-transparent dark:to-purple-950/20 pointer-events-none" />
      
      <div className="z-10 flex h-full w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
            <div className="mx-auto max-w-full h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
