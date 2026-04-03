import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, AlertTriangle, Settings, GraduationCap, HardHat, ShieldAlert } from 'lucide-react';
import { cn } from '../ui/Button';
import { motion } from 'motion/react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Building2, label: 'Firmalar', path: '/companies' },
  { icon: Users, label: 'Personeller', path: '/personnel' },
  { icon: AlertTriangle, label: 'Kaza/Olay Bildirimi', path: '/incidents' },
  { icon: GraduationCap, label: 'Eğitimler', path: '/trainings' },
  { icon: ShieldAlert, label: 'Risk Değerlendirmesi', path: '/risks' },
  { icon: HardHat, label: 'KKD Takibi', path: '/ppe' },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-white/40 dark:bg-[#09090b]/40 backdrop-blur-3xl border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col h-full transition-all duration-300 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative h-16 flex items-center px-6 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
            <div className="relative p-2 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-xl shadow-lg shadow-indigo-500/30">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <span className="text-lg font-display font-bold tracking-tight text-slate-900 dark:text-white block leading-tight">HanTech</span>
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 tracking-wider">AI</span>
          </div>
        </div>
      </div>
      
      <nav className="relative flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300",
              isActive 
                ? "text-indigo-700 dark:text-indigo-300" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-indigo-600/5 dark:from-indigo-500/20 dark:to-indigo-600/10 rounded-xl border border-indigo-500/20 dark:border-indigo-500/30"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={cn(
                  "relative z-10 p-2 rounded-lg transition-all duration-300",
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" 
                    : "bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-500 group-hover:bg-indigo-500/10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                )}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="relative z-10 text-sm">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="relative p-3 border-t border-slate-200/50 dark:border-slate-800/50">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            "group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300",
            isActive 
              ? "text-indigo-700 dark:text-indigo-300" 
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          )}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="activeNavSettings"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-indigo-600/5 dark:from-indigo-500/20 dark:to-indigo-600/10 rounded-xl border border-indigo-500/20 dark:border-indigo-500/30"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className={cn(
                "relative z-10 p-2 rounded-lg transition-all duration-300",
                isActive 
                  ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" 
                  : "bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-500 group-hover:bg-indigo-500/10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
              )}>
                <Settings className="h-5 w-5" />
              </div>
              <span className="relative z-10 text-sm">Sistem Ayarları</span>
            </>
          )}
        </NavLink>
      </div>
    </aside>
  );
};
