import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard, Building2, Users, AlertTriangle, Settings, GraduationCap, HardHat,
  ShieldAlert, ChevronLeft, ChevronRight, FileText, LogOut, Bell, ChevronDown,
  BarChart3
} from 'lucide-react';
import { cn } from '../ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ROLE_LABELS } from '../../types/auth';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const getNavSections = (userRole?: string): NavSection[] => {
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  
  const sections: NavSection[] = [
    {
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
      ]
    },
  ];

  // Admin-only Personnel management
  if (isAdmin) {
    sections.push({
      title: 'Yönetim',
      items: [
        { icon: Building2, label: 'Firmalar', path: '/companies' },
        { icon: Users, label: 'Personeller', path: '/personnel' },
      ]
    });
  } else {
    sections.push({
      title: 'Yönetim',
      items: [
        { icon: Building2, label: 'Firmalar', path: '/companies' },
      ]
    });
  }

  sections.push(
    {
      title: 'İSG Operasyonları',
      items: [
        { icon: AlertTriangle, label: 'Kaza/Olay', path: '/incidents' },
        { icon: GraduationCap, label: 'Eğitimler', path: '/trainings' },
        { icon: ShieldAlert, label: 'Risk Değerlendirme', path: '/risks' },
        { icon: HardHat, label: 'KKD Takibi', path: '/ppe' },
      ]
    },
    {
      title: 'Raporlar',
      items: [
        { icon: BarChart3, label: 'Analizler', path: '/reports' },
      ]
    }
  );

  return sections;
};

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  show: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, show }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const childRef = React.useRef<HTMLDivElement>(null);
  
  if (!show) return <>{children}</>;
  
  const handleMouseEnter = () => {
    if (childRef.current) {
      const rect = childRef.current.getBoundingClientRect();
      setPosition({ x: rect.right + 12, y: rect.top + rect.height / 2 });
    }
    setIsVisible(true);
  };
  
  return (
    <>
      <div 
        ref={childRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="fixed px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm rounded-lg whitespace-nowrap shadow-lg pointer-events-none"
          style={{ 
            left: position.x, 
            top: position.y,
            transform: 'translateY(-50%)',
            zIndex: 99999
          }}
        >
          {content}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-900 dark:bg-white rotate-45" />
        </motion.div>,
        document.body
      )}
    </>
  );
};

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar, incidents, trainings } = useStore();
  const { user, logout } = useAuthStore();
  
  // Dynamic navigation based on role
  const navSections = getNavSections(user?.role);
  
  // Calculate badges
  const pendingIncidents = incidents.filter(i => i.status === 'İnceleniyor').length;
  const upcomingTrainings = trainings.filter(t => t.status === 'Planlandı').length;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };
  return (
    <aside 
      className={cn(
        "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full transition-all duration-300 relative overflow-hidden",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Header with Logo */}
      <div className={cn(
        "relative flex items-center border-b border-slate-200 dark:border-slate-800 transition-all duration-300",
        sidebarCollapsed ? "h-16 justify-center px-2" : "h-16 px-6"
      )}>
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
            <div className="relative p-2 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-xl shadow-lg shadow-indigo-500/30">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
          </div>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="overflow-hidden"
            >
              <span className="text-lg font-display font-bold tracking-tight text-slate-900 dark:text-white block leading-tight whitespace-nowrap">HanTech</span>
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 tracking-wider">AI</span>
            </motion.div>
          )}
        </div>
        
        {/* Collapse Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "absolute p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm border border-slate-200 dark:border-slate-700",
            sidebarCollapsed ? "right-2 top-1/2 -translate-y-1/2" : "right-4 top-1/2 -translate-y-1/2"
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="relative flex-1 py-4 overflow-y-auto scrollbar-hide">
        {navSections.map((section, sectionIdx) => (
          <div key={section.title || sectionIdx} className={cn("mb-4", sectionIdx > 0 && !sidebarCollapsed && "mt-6")}>
            {!sidebarCollapsed && section.title && (
              <div className="px-6 mb-2">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {section.title}
                </span>
              </div>
            )}
            <div className={cn("space-y-1", sidebarCollapsed ? "px-2" : "px-3")}>
              {section.items.map((item) => {
                const active = isActive(item.path);
                const badge = item.path === '/incidents' ? pendingIncidents : 
                             item.path === '/trainings' ? upcomingTrainings : undefined;
                
                return (
                  <Tooltip key={item.path} content={item.label} show={sidebarCollapsed}>
                    <NavLink
                      to={item.path}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl font-medium transition-all duration-300",
                        sidebarCollapsed ? "justify-center px-2 py-3" : "px-4 py-3",
                        active 
                          ? "text-indigo-700 dark:text-indigo-300" 
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId={`activeNav-${sectionIdx}`}
                          className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-indigo-600/5 dark:from-indigo-500/20 dark:to-indigo-600/10 rounded-xl border border-indigo-500/20 dark:border-indigo-500/30"
                          initial={false}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <div className={cn(
                        "relative z-10 p-2 rounded-lg transition-all duration-300 flex-shrink-0",
                        active 
                          ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-500/10 dark:group-hover:text-indigo-400"
                      )}>
                        <item.icon className="h-5 w-5" />
                        {badge !== undefined && badge > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                            {badge > 9 ? '9+' : badge}
                          </span>
                        )}
                      </div>
                      {!sidebarCollapsed && (
                        <span className="relative z-10 text-sm whitespace-nowrap">{item.label}</span>
                      )}
                    </NavLink>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      
      {/* User Profile Card */}
      <div className={cn(
        "relative border-t border-slate-200 dark:border-slate-800 transition-all duration-300",
        sidebarCollapsed ? "p-3" : "p-4"
      )}>
        <Tooltip content={`${user?.firstName} ${user?.lastName} - ${user ? ROLE_LABELS[user.role] : ''}`} show={sidebarCollapsed}>
          <div className={cn(
            "flex items-center gap-3 rounded-xl bg-slate-100 dark:bg-slate-800 p-2",
            sidebarCollapsed ? "justify-center" : ""
          )}>
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-indigo-500/25">
                {user?.firstName?.charAt(0).toUpperCase()}{user?.lastName?.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full" />
            </div>
            
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user && ROLE_LABELS[user.role]}
                </p>
              </motion.div>
            )}
            
            {!sidebarCollapsed && (
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Çıkış Yap"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </Tooltip>
      </div>
      
      {/* Settings Link (Only in collapsed mode) */}
      {sidebarCollapsed && (
        <div className="p-2 border-t border-slate-200 dark:border-slate-800">
          <Tooltip content="Ayarlar" show={true}>
            <NavLink
              to="/settings"
              className={({ isActive }) => cn(
                "group relative flex items-center justify-center gap-3 p-3 rounded-xl font-medium transition-all duration-300",
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
                      className="absolute inset-0 bg-indigo-100 dark:from-indigo-500/20 dark:to-indigo-600/10 rounded-xl border border-indigo-200 dark:border-indigo-500/30"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <div className={cn(
                    "relative z-10 p-2 rounded-lg transition-all duration-300",
                    isActive 
                      ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-500/10 dark:group-hover:text-indigo-400"
                  )}>
                    <Settings className="h-5 w-5" />
                  </div>
                </>
              )}
            </NavLink>
          </Tooltip>
        </div>
      )}
    </aside>
  );
};
