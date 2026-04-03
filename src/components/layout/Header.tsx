import React, { useState } from 'react';
import { Moon, Sun, Bell, User, AlertTriangle, CheckCircle, Search, Menu } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../ui/Button';

export const Header = () => {
  const { isDarkMode, toggleDarkMode, incidents, companies } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const recentIncidents = incidents.slice(-3).reverse();
  const unreadCount = recentIncidents.length;

  return (
    <header className="h-16 bg-white/40 dark:bg-[#09090b]/40 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-6 transition-all duration-200 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md flex-1 hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={toggleDarkMode}
          className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 transition-all duration-200 relative overflow-hidden"
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
        
        <div className="relative">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 transition-all duration-200 relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-[#09090b]"
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
                  className="absolute right-0 mt-2 w-80 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-2xl rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-800/60 z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Bildirimler</h3>
                    <span className="text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 px-2.5 py-1 rounded-full">
                      {unreadCount} Yeni
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {recentIncidents.length > 0 ? (
                      <div className="divide-y divide-slate-100/60 dark:divide-slate-800/60">
                        {recentIncidents.map(incident => (
                          <Link 
                            key={incident.id} 
                            to="/incidents"
                            onClick={() => setShowNotifications(false)}
                            className="flex items-start gap-3 p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <div className={`p-2 rounded-xl shrink-0 ${
                              incident.severity === 'Kritik' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' :
                              incident.severity === 'Yüksek' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' :
                              'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
                            }`}>
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">{incident.title}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(incident.date).toLocaleDateString('tr-TR')} - {incident.location}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
                        <CheckCircle className="h-8 w-8 mb-2 text-emerald-500 opacity-50" />
                        <p className="text-sm">Yeni bildirim yok</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-200/60 dark:border-slate-800/60 text-center">
                    <Link 
                      to="/incidents" 
                      onClick={() => setShowNotifications(false)}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Tümünü Gör
                    </Link>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white ml-2 shadow-lg shadow-indigo-500/20 cursor-pointer hover:shadow-xl hover:scale-105 transition-all">
          <User className="h-5 w-5" />
        </div>
      </div>
    </header>
  );
};
