import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, AlertTriangle, GraduationCap, ShieldAlert } from 'lucide-react';
import { cn } from '../ui/Button';
import { useAuthStore } from '../../store/useAuthStore';

export const MobileNav = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const navItems = [
    { icon: LayoutDashboard, label: 'Ana Sayfa', path: '/', show: true },
    { icon: Building2, label: 'Firmalar', path: '/companies', show: true },
    { icon: AlertTriangle, label: 'Olaylar', path: '/incidents', show: true },
    { icon: GraduationCap, label: 'Eğitimler', path: '/trainings', show: true },
    { icon: ShieldAlert, label: 'Riskler', path: '/risks', show: true },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-lg">
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {navItems.filter(item => item.show).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
              isActive
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
