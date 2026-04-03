import React from 'react';
import { useStore } from '../store/useStore';
import { Building2, Users, AlertTriangle, CheckCircle, GraduationCap, HardHat, ShieldAlert, TrendingUp, TrendingDown, Calendar, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { PageTransition } from '../components/layout/PageTransition';
import { motion } from 'motion/react';

const StatCard = ({ label, value, icon: Icon, color, trend, index }: { label: string, value: number, icon: React.ElementType, color: string, trend?: 'up' | 'down', index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="group relative bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-6 hover:shadow-xl hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all duration-300 overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 ${color.replace('text-', 'bg-')} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full blur-3xl`} />
    <div className="relative flex items-center gap-5">
      <div className={`p-4 rounded-2xl ${color.replace('text-', 'bg-')}/20 ${color} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
        <Icon className="h-7 w-7" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          {trend && (
            <span className={`flex items-center text-xs ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            </span>
          )}
        </div>
        <p className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
      </div>
    </div>
  </motion.div>
);

export const Dashboard = () => {
  const { companies, personnel, incidents, trainings, ppes, risks, isDarkMode } = useStore();

  const openIncidents = incidents.filter(i => i.status !== 'Kapalı').length;
  const activePPEs = ppes.filter(p => p.status === 'Aktif').length;
  const openRisks = risks.filter(r => r.status !== 'Giderildi').length;
  const completedTrainings = trainings.filter(t => t.status === 'Tamamlandı').length;

const stats: Array<{ label: string; value: number; icon: React.ElementType; color: string; trend?: 'up' | 'down' }> = [
    { label: 'Toplam Personel', value: personnel.length, icon: Users, color: 'text-indigo-600 dark:text-indigo-400', trend: 'up' as const },
    { label: 'Açık Kazalar/Olaylar', value: openIncidents, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', trend: openIncidents > 0 ? 'down' as const : undefined },
    { label: 'Aktif KKD Zimmeti', value: activePPEs, icon: HardHat, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Açık Riskler', value: openRisks, icon: ShieldAlert, color: 'text-orange-600 dark:text-orange-400' },
  ];

  // Prepare data for charts
  const severityData = [
    { name: 'Düşük', value: incidents.filter(i => i.severity === 'Düşük').length, color: '#10b981' },
    { name: 'Orta', value: incidents.filter(i => i.severity === 'Orta').length, color: '#f59e0b' },
    { name: 'Yüksek', value: incidents.filter(i => i.severity === 'Yüksek').length, color: '#f97316' },
    { name: 'Kritik', value: incidents.filter(i => i.severity === 'Kritik').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const statusData = [
    { name: 'Açık', value: incidents.filter(i => i.status === 'Açık').length },
    { name: 'İnceleniyor', value: incidents.filter(i => i.status === 'İnceleniyor').length },
    { name: 'Kapalı', value: incidents.filter(i => i.status === 'Kapalı').length },
  ];

  const chartTextColor = isDarkMode ? '#9ca3af' : '#4b5563';

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-lg">Sistem genel bakış ve özet istatistikler.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <StatCard 
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              trend={stat.trend}
              index={idx}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-6 hover:shadow-md transition-all duration-300">
            <h2 className="text-xl font-display font-semibold mb-6 text-slate-900 dark:text-white">Olay Şiddet Dağılımı</h2>
            <div className="h-[300px] w-full">
              {incidents.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
                        borderColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                        borderRadius: '0.75rem',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
                      }}
                      itemStyle={{ color: chartTextColor }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <p>Yeterli veri bulunmuyor</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-6 hover:shadow-md transition-all duration-300">
            <h2 className="text-xl font-display font-semibold mb-6 text-slate-900 dark:text-white">Olay Durumları</h2>
            <div className="h-[300px] w-full">
              {incidents.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} vertical={false} />
                    <XAxis dataKey="name" stroke={chartTextColor} tick={{ fill: chartTextColor }} axisLine={false} tickLine={false} />
                    <YAxis stroke={chartTextColor} tick={{ fill: chartTextColor }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: isDarkMode ? '#1e293b' : '#f1f5f9' }}
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
                        borderColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                        borderRadius: '0.75rem',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <p>Yeterli veri bulunmuyor</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-6 hover:shadow-md transition-all duration-300">
            <h2 className="text-xl font-display font-semibold mb-6 text-slate-900 dark:text-white">Yaklaşan Eğitimler</h2>
            <div className="space-y-4">
              {trainings
                .filter(t => t.status === 'Planlandı')
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 3)
                .map(training => (
                <div key={training.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{training.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{training.trainer} • {training.participants.length} Katılımcı</p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-full">
                    {new Date(training.date).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              ))}
              {trainings.filter(t => t.status === 'Planlandı').length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">Planlanmış eğitim bulunmuyor.</p>
              )}
            </div>
          </div>

          <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-6 hover:shadow-md transition-all duration-300">
            <h2 className="text-xl font-display font-semibold mb-6 text-slate-900 dark:text-white">Son Olay Bildirimleri</h2>
            <div className="space-y-4">
              {incidents.slice(-3).reverse().map(incident => (
                <div key={incident.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{incident.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{incident.severity} Öncelik</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    incident.status === 'Açık' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                    incident.status === 'İnceleniyor' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                  }`}>
                    {incident.status}
                  </span>
                </div>
              ))}
              {incidents.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Henüz olay bildirimi yok.</p>}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
