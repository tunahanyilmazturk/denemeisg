import React, { useState, useCallback, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard, Building2, Users, AlertTriangle, Settings, GraduationCap, HardHat,
  ShieldAlert, ChevronLeft, ChevronRight, LogOut, BarChart3, X, Award,
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
      ],
    },
  ];

  if (isAdmin) {
    sections.push({
      title: 'Yönetim',
      items: [
        { icon: Building2, label: 'Firmalar', path: '/companies' },
        { icon: Users, label: 'Personeller', path: '/personnel' },
      ],
    });
  } else {
    sections.push({
      title: 'Yönetim',
      items: [
        { icon: Building2, label: 'Firmalar', path: '/companies' },
      ],
    });
  }

  sections.push(
    {
      title: 'İSG Operasyonları',
      items: [
        { icon: AlertTriangle, label: 'Kaza/Olay', path: '/incidents' },
        { icon: GraduationCap, label: 'Eğitimler', path: '/trainings' },
        { icon: Award, label: 'Sertifikalar', path: '/certificates' },
        { icon: ShieldAlert, label: 'Risk Değerlendirme', path: '/risks' },
        { icon: HardHat, label: 'KKD Takibi', path: '/ppe' },
      ],
    },
    {
      title: 'Raporlar',
      items: [
        { icon: BarChart3, label: 'Analizler', path: '/reports' },
      ],
    },
    {
      title: 'Genel',
      items: [
        { icon: Settings, label: 'Ayarlar', path: '/settings' },
      ],
    },
  );

  return sections;
};

/* ─── Tooltip ─────────────────────────────────────────────── */
interface TooltipProps {
  children: React.ReactNode;
  content: string;
  show: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, show }) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  if (!show) return <>{children}</>;

  return (
    <>
      <div
        ref={ref}
        onMouseEnter={() => {
          if (ref.current) {
            const r = ref.current.getBoundingClientRect();
            setPos({ x: r.right + 10, y: r.top + r.height / 2 });
          }
          setVisible(true);
        }}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
      </div>
      {visible &&
        createPortal(
          <motion.div
            initial={{ opacity: 0, x: -8, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.15 }}
            className="fixed pointer-events-none z-[99999]"
            style={{ left: pos.x, top: pos.y, transform: 'translateY(-50%)' }}
          >
            <div className="relative px-2.5 py-1.5 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 text-xs font-medium rounded-lg shadow-xl whitespace-nowrap">
              {content}
              <span className="absolute right-full top-1/2 -translate-y-1/2 mr-[-1px] border-4 border-transparent border-r-slate-900 dark:border-r-slate-50" />
            </div>
          </motion.div>,
          document.body,
        )}
    </>
  );
};

/* ─── Sidebar ─────────────────────────────────────────────── */
export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar, incidents, trainings, setMobileSidebarOpen, isDarkMode } = useStore();
  const { user, logout } = useAuthStore();

  const navSections = getNavSections(user?.role);
  const pendingIncidents = incidents.filter(i => i.status === 'İnceleniyor').length;
  const upcomingTrainings = trainings.filter(t => t.status === 'Planlandı').length;

  /* touch-to-close */
  const sidebarRef = useRef<HTMLElement>(null);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  }, []);
  const handleTouchEnd = useCallback(() => {
    if (touchDeltaX.current < -80) setMobileSidebarOpen(false);
  }, [setMobileSidebarOpen]);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const initials = `${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}`.toUpperCase();

  return (
    <aside
      ref={sidebarRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'sidebar-root relative flex flex-col h-full transition-[width] duration-300 ease-in-out overflow-hidden',
        'bg-white dark:bg-slate-900',
        'border-r border-slate-200 dark:border-slate-800',
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      {/* decorative top tint */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-50/70 to-transparent dark:from-indigo-950/25 dark:to-transparent" />

      {/* ── Brand Header ──────────────────────────────────── */}
      <div
        className={cn(
          'relative z-10 flex items-center h-16 flex-shrink-0',
          'border-b border-slate-200 dark:border-slate-800',
          sidebarCollapsed ? 'justify-center px-2' : 'px-5',
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img
              src={isDarkMode ? '/logo/logodark.png' : '/logo/logo.png'}
              alt="Logo"
              className={cn(
                'object-contain transition-all duration-300',
                sidebarCollapsed ? 'w-9 h-9' : 'w-10 h-10',
              )}
            />
          </div>

          {/* Brand text */}
          <AnimatePresence initial={false}>
            {!sidebarCollapsed && (
              <motion.div
                key="brand-text"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden min-w-0"
              >
                <p className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight whitespace-nowrap">
                  HanTech
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                  İSG Platform
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile close */}
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className={cn(
            'lg:hidden absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg',
            'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800',
            'transition-colors',
            sidebarCollapsed && 'hidden',
          )}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Desktop collapse toggle */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Genişlet' : 'Daralt'}
          className={cn(
            'hidden lg:flex items-center justify-center absolute top-1/2 -translate-y-1/2',
            'w-5 h-5 rounded-full text-slate-400 transition-all duration-200',
            'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
            'hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-700',
            'shadow-sm hover:shadow-indigo-100 dark:hover:shadow-indigo-900/30',
            sidebarCollapsed ? 'right-auto left-1/2 -translate-x-1/2' : 'right-4',
          )}
        >
          {sidebarCollapsed
            ? <ChevronRight className="h-3 w-3" />
            : <ChevronLeft className="h-3 w-3" />}
        </motion.button>
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <nav className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-hide">
        {navSections.map((section, sectionIdx) => (
          <div key={section.title ?? sectionIdx}>
            {/* Section separator / title */}
            {sectionIdx > 0 && (
              sidebarCollapsed
                ? <div className="mx-3 my-2 h-px bg-slate-200 dark:bg-slate-800" />
                : section.title && (
                  <div className="flex items-center gap-2.5 px-5 pt-5 pb-1.5">
                    <span className="text-[9.5px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600 whitespace-nowrap select-none">
                      {section.title}
                    </span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  </div>
                )
            )}

            {/* Items */}
            <div className={cn('space-y-px mt-1', sidebarCollapsed ? 'px-2' : 'px-3')}>
              {section.items.map((item) => {
                const active = isActive(item.path);
                const badge =
                  item.path === '/incidents' ? pendingIncidents :
                  item.path === '/trainings' ? upcomingTrainings :
                  undefined;

                return (
                  <Tooltip key={item.path} content={item.label} show={sidebarCollapsed}>
                    <NavLink
                      to={item.path}
                      className={cn(
                        'sidebar-nav-item group relative flex items-center gap-3 rounded-xl transition-colors duration-150 touch-manipulation',
                        sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
                        active
                          ? 'text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
                      )}
                    >
                      {/* active background — shared layoutId for cross-item slide */}
                      {active && (
                        <motion.div
                          layoutId="sidebar-active-bg"
                          className="absolute inset-0 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/15"
                          initial={false}
                          transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                        />
                      )}

                      {/* left accent bar */}
                      {active && !sidebarCollapsed && (
                        <span className="sidebar-accent-bar absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[20px] rounded-r-full bg-indigo-600 dark:bg-indigo-400" />
                      )}

                      {/* Icon */}
                      <span
                        className={cn(
                          'relative z-10 flex-shrink-0 transition-colors duration-150',
                          active
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300',
                        )}
                      >
                        <item.icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                        {badge !== undefined && badge > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-[3px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                            {badge > 9 ? '9+' : badge}
                          </span>
                        )}
                      </span>

                      {/* Label */}
                      {!sidebarCollapsed && (
                        <span className="relative z-10 text-[13px] font-medium whitespace-nowrap">
                          {item.label}
                        </span>
                      )}
                    </NavLink>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User Profile Footer ────────────────────────────── */}
      <div
        className={cn(
          'relative z-10 flex-shrink-0 border-t border-slate-200 dark:border-slate-800',
          sidebarCollapsed ? 'p-2.5' : 'p-3',
        )}
      >
        <Tooltip
          content={`${user?.firstName} ${user?.lastName} · ${user ? ROLE_LABELS[user.role] : ''}`}
          show={sidebarCollapsed}
        >
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl transition-colors duration-150',
              sidebarCollapsed ? 'justify-center p-2' : 'px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60',
            )}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-500/20 select-none">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-[2.5px] border-white dark:border-slate-900 shadow-sm" />
            </div>

            {/* Name + role */}
            <AnimatePresence initial={false}>
              {!sidebarCollapsed && (
                <motion.div
                  key="user-info"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate leading-snug">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5 leading-snug">
                    {user && ROLE_LABELS[user.role]}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Logout */}
            <AnimatePresence initial={false}>
              {!sidebarCollapsed && (
                <motion.button
                  key="logout-btn"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => { logout(); navigate('/login'); }}
                  title="Çıkış Yap"
                  className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors touch-manipulation"
                >
                  <LogOut className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </Tooltip>
      </div>
    </aside>
  );
};
