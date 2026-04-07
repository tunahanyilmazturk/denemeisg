import React, { useState, useEffect } from 'react';
import {
  Moon, Sun, Bell, User, AlertTriangle, CheckCircle, Search, Menu,
  Shield, TrendingUp, Activity, LogOut, Settings as SettingsIcon,
  Command, Clock, Zap, Award, Key, X
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../ui/Button';
import { ROLE_LABELS } from '../../types/auth';

export const Header = () => {
  const { isDarkMode, toggleDarkMode, incidents, trainings, risks, personnel, toggleMobileSidebar } = useStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const location = useLocation();

  const recentIncidents = incidents.slice(-5).reverse();
  const unreadCount = incidents.filter(i => i.status !== 'Kapalı').length;
  
  // Quick stats for user menu
  const openIncidents = incidents.filter(i => i.status !== 'Kapalı').length;
  const highRisks = risks.filter(r => r.status !== 'Giderildi' && r.score > 12).length;
  const upcomingTrainings = trainings.filter(t => t.status === 'Planlandı').length;
  const activePersonnel = personnel.filter(p => p.status === 'Aktif' || !p.status).length;

  // Calculate system health score
  const healthScore = React.useMemo(() => {
    let score = 100;
    score -= Math.min(openIncidents * 5, 30);
    score -= Math.min(highRisks * 8, 25);
    if (trainings.length > 0) {
      const completedRate = trainings.filter(t => t.status === 'Tamamlandı').length / trainings.length;
      score -= Math.round((1 - completedRate) * 20);
    }
    return Math.max(0, Math.min(100, score));
  }, [openIncidents, highRisks, trainings]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowNotifications(false);
      setShowUserMenu(false);
    };

    if (showNotifications || showUserMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showNotifications, showUserMenu]);

  // Get page title from route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/companies')) return 'Firmalar';
    if (path.startsWith('/personnel')) return 'Personeller';
    if (path.startsWith('/incidents')) return 'Kaza ve Olay Bildirimleri';
    if (path.startsWith('/trainings')) return 'Eğitimler';
    if (path.startsWith('/risks')) return 'Risk Değerlendirme';
    if (path.startsWith('/ppe')) return 'KKD Takibi';
    if (path.startsWith('/reports')) return 'Analizler ve Raporlar';
    if (path.startsWith('/settings')) return 'Ayarlar';
    return 'İSG Yönetim Sistemi';
  };

  return (
    <header className="h-14 sm:h-16 bg-white/40 dark:bg-[#09090b]/40 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-3 sm:px-6 transition-all duration-200 sticky top-0 z-30">
      {/* Left Section - Mobile Menu + Logo + Page Title & Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1">
        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 -ml-1 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 transition-colors touch-manipulation"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo - Desktop */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="relative w-8 h-8">
            <img
              src={isDarkMode ? '/logo/logodark.png' : '/logo/logo.png'}
              alt="HanTech Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Page Title - Hidden on mobile */}
        <div className="hidden lg:block">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{getPageTitle()}</h2>
        </div>

        {/* Mobile Page Title */}
        <div className="lg:hidden">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white truncate max-w-[140px] sm:max-w-[200px]">{getPageTitle()}</h2>
        </div>

        {/* Search Bar - Desktop */}
        <div className="relative max-w-md flex-1 hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="global-search"
            type="text"
            placeholder="Ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            className="w-full h-10 pl-10 pr-20 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>
      </div>
      
      {/* Right Section - Actions & User */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Mobile Search Button */}
        <button
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 transition-colors touch-manipulation"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* System Health Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
          <div className={`w-2 h-2 rounded-full ${getHealthBgColor(healthScore)} animate-pulse`} />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Sistem: <span className={`font-semibold ${getHealthColor(healthScore)}`}>{healthScore}</span>
          </span>
        </div>

        {/* Dark Mode Toggle */}
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={toggleDarkMode}
          className="p-2 sm:p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 transition-all duration-200 relative overflow-hidden touch-manipulation"
          aria-label="Toggle Dark Mode"
        >
          <motion.div
            initial={false}
            animate={{ rotate: isDarkMode ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </motion.div>
        </motion.button>
        
        {/* Notifications Dropdown */}
        <div className="relative">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="p-2 sm:p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 transition-all duration-200 relative touch-manipulation"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-[#09090b]"
              />
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-96 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800/60 z-50 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Bildirimler
                    </h3>
                    <span className="text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2.5 py-1 rounded-full">
                      {unreadCount} Açık
                    </span>
                  </div>
                  <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                    {recentIncidents.length > 0 ? (
                      <div className="divide-y divide-slate-100/60 dark:divide-slate-800/60">
                        {recentIncidents.map(incident => (
                          <Link 
                            key={incident.id} 
                            to="/incidents"
                            onClick={() => setShowNotifications(false)}
                            className="flex items-start gap-3 p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group active:bg-slate-100 dark:active:bg-slate-800"
                          >
                            <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${
                              incident.severity === 'Kritik' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                              incident.severity === 'Yüksek' ? 'bg-gradient-to-br from-orange-500 to-red-600' :
                              incident.severity === 'Orta' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                              'bg-gradient-to-br from-indigo-500 to-purple-600'
                            } text-white shadow-sm`}>
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {incident.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  incident.severity === 'Kritik' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                                  incident.severity === 'Yüksek' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' :
                                  incident.severity === 'Orta' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                  'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400'
                                }`}>
                                  {incident.severity}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {new Date(incident.date).toLocaleDateString('tr-TR')}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">
                                {incident.location}
                              </p>
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 hidden sm:block ${
                              incident.status === 'Açık' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                              incident.status === 'İnceleniyor' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                              'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                            }`}>
                              {incident.status}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
                        <CheckCircle className="h-10 w-10 mb-2 text-emerald-500 opacity-50" />
                        <p className="text-sm font-medium">Yeni bildirim yok</p>
                        <p className="text-xs mt-1">Tüm olaylar takip ediliyor</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
                    <Link 
                      to="/incidents" 
                      onClick={() => setShowNotifications(false)}
                      className="block text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 py-1"
                    >
                      Tüm Olayları Görüntüle →
                    </Link>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        
        {/* User Menu Dropdown */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white ml-1 sm:ml-2 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:scale-105 transition-all relative touch-manipulation"
          >
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
          </motion.button>

          <AnimatePresence>
            {showUserMenu && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-80 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800/60 z-50 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* User Info Header */}
                  <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center text-white font-semibold text-base sm:text-lg">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-white/70 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <div className="mt-3 px-2 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <Key className="h-3.5 w-3.5 text-white/80" />
                        <span className="text-xs text-white/90 font-medium">
                          {user && ROLE_LABELS[user.role]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="p-3 sm:p-4 border-b border-slate-200/60 dark:border-slate-800/60">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 sm:mb-3">Hızlı Durum</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 sm:p-3 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl border border-red-100 dark:border-red-800/30">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                          <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">Açık Olay</span>
                        </div>
                        <p className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">{openIncidents}</p>
                      </div>
                      <div className="p-2 sm:p-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">Yüksek Risk</span>
                        </div>
                        <p className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">{highRisks}</p>
                      </div>
                      <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">Eğitim</span>
                        </div>
                        <p className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">{upcomingTrainings}</p>
                      </div>
                      <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">Personel</span>
                        </div>
                        <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">{activePersonnel}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 active:bg-slate-200 dark:active:bg-slate-700 transition-colors group touch-manipulation"
                    >
                      <User className="h-4 w-4 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                        Profilim
                      </span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 active:bg-slate-200 dark:active:bg-slate-700 transition-colors group touch-manipulation"
                    >
                      <SettingsIcon className="h-4 w-4 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                        Ayarlar
                      </span>
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 transition-colors group touch-manipulation"
                    >
                      <LogOut className="h-4 w-4 text-slate-500 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400">
                        Çıkış Yap
                      </span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 md:hidden shadow-lg"
          >
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={() => setMobileSearchOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-manipulation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
