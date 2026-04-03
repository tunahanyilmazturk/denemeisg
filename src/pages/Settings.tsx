import React from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Save, Bell, Shield, Building, User } from 'lucide-react';
import toast from 'react-hot-toast';

export const Settings = () => {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Ayarlar başarıyla kaydedildi.');
  };

  return (
    <PageTransition>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Sistem Ayarları</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-lg">Uygulama tercihlerinizi ve sistem yapılandırmasını yönetin.</p>
        </div>

        <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Settings Sidebar */}
            <div className="w-full md:w-64 bg-slate-50/50 dark:bg-slate-800/30 p-5 border-r border-slate-200/60 dark:border-slate-800/60">
              <nav className="space-y-1.5">
                <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 transition-colors">
                  <Building className="h-5 w-5" />
                  Genel Ayarlar
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
                  <Bell className="h-5 w-5" />
                  Bildirimler
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
                  <Shield className="h-5 w-5" />
                  Güvenlik
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
                  <User className="h-5 w-5" />
                  Profil
                </a>
              </nav>
            </div>

            {/* Settings Content */}
            <div className="flex-1 p-6 md:p-8">
              <form onSubmit={handleSave} className="space-y-8">
                <div className="space-y-5">
                  <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white">Firma Bilgileri</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sistem Adı</label>
                      <Input defaultValue="HanTech AI" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ana Firma Ünvanı</label>
                      <Input defaultValue="HanTech Teknoloji A.Ş." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">İletişim E-posta</label>
                    <Input type="email" defaultValue="info@hantech.com" />
                  </div>
                </div>

                <hr className="border-slate-200/60 dark:border-slate-800/60" />

                <div className="space-y-5">
                  <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white">Uygulama Tercihleri</h2>
                  
                  <div className="flex items-center justify-between p-5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">E-posta Bildirimleri</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Yeni kaza/olay eklendiğinde e-posta al.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Otomatik Yedekleme</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Sistem verilerini her gece otomatik yedekle.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <Button type="submit" className="gap-2">
                    <Save className="h-4 w-4" />
                    Ayarları Kaydet
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
