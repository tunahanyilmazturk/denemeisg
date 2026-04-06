import React, { useState } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Save, Bell, Upload, Settings as SettingsIcon, X, Building2, Image, Info, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore, OSGBCompanySettings } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'motion/react';
import { AdvancedDefinitionsTab } from '../components/settings/AdvancedDefinitionsTab';
import { AppearanceSettingsTab } from '../components/settings/AppearanceSettingsTab';
import { NotificationSettingsTab } from '../components/settings/NotificationSettingsTab';

type SettingsTab = 'appearance' | 'notifications' | 'company' | 'advanced';

const getTabsForRole = (role?: string): { id: SettingsTab; label: string; icon: React.ElementType }[] => {
  const baseTabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'appearance', label: 'Görünüm', icon: SettingsIcon },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
  ];

  // Company tab only for admin/superadmin
  if (role === 'admin' || role === 'superadmin') {
    baseTabs.push({ id: 'company', label: 'OSGB Firma', icon: Building2 });
  }

  baseTabs.push({ id: 'advanced', label: 'Gelişmiş Tanımlar', icon: SettingsIcon });

  return baseTabs;
};

export const Settings = () => {
  const { user } = useAuthStore();
  const tabs = getTabsForRole(user?.role);
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const {
    osgbCompanySettings,
    updateOSGBCompanySettings,
  } = useStore();

  // Local form states
  const [osgbForm, setOsgbForm] = useState<OSGBCompanySettings>(osgbCompanySettings);

  const handleSaveOSGB = (e: React.FormEvent) => {
    e.preventDefault();
    updateOSGBCompanySettings(osgbForm);
    toast.success('OSGB firma bilgileri kaydedildi.');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error('Logo dosyası 1MB\'dan küçük olmalıdır.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setOsgbForm({ ...osgbForm, logo: base64 });
    };
    reader.readAsDataURL(file);
  };


  return (
    <PageTransition>
      <div className="space-y-4 max-w-full mx-0">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Sistem Ayarları</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-lg">Uygulama tercihlerinizi ve sistem yapılandırmasını yönetin.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Settings Sidebar */}
            <div className="w-full lg:w-72 bg-slate-50 dark:bg-slate-800/50 p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Sistem Bilgisi</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">Versiyon: 1.0.0</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
            </div>

            {/* Settings Content */}
            <div className="flex-1 p-6 lg:p-8">
              <AnimatePresence mode="wait">
                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                  <motion.div
                    key="appearance"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AppearanceSettingsTab />
                  </motion.div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <NotificationSettingsTab />
                  </motion.div>
                )}


                {/* OSGB Company Tab (Admin Only) */}
                {activeTab === 'company' && (
                  <motion.div
                    key="company"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <form onSubmit={handleSaveOSGB} className="space-y-8">
                      <div>
                        <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-indigo-500" />
                          OSGB Firma Bilgileri
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400">OSGB firmanızın bilgilerini ve logosunu yönetin. Bu bilgiler sertifikalarda kullanılır.</p>
                      </div>

                      {/* Logo */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Firma Logosu</label>
                        {osgbForm.logo ? (
                          <div className="flex items-start gap-4">
                            <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-xl p-4 bg-white dark:bg-slate-800">
                              <img
                                src={osgbForm.logo}
                                alt="Logo"
                                className="max-h-20 object-contain"
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Check className="h-3 w-3" /> Logo yüklendi
                              </p>
                              <div className="flex gap-2">
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                  />
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 cursor-pointer">
                                    <Upload className="h-3 w-3" /> Değiştir
                                  </span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setOsgbForm({ ...osgbForm, logo: undefined })}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100"
                                >
                                  <X className="h-3 w-3" /> Kaldır
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer max-w-sm">
                              <Image className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Logo yükle</p>
                              <p className="text-xs text-slate-400">PNG veya JPG, max 1MB</p>
                            </div>
                          </label>
                        )}
                      </div>

                      <hr className="border-slate-200/60 dark:border-slate-800/60" />

                      {/* Firma Bilgileri */}
                      <div className="space-y-5">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Temel Bilgiler</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Firma Adı</label>
                            <Input
                              placeholder="Örn: ABC OSGB Hizmetleri"
                              value={osgbForm.companyName}
                              onChange={(e) => setOsgbForm({ ...osgbForm, companyName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ticari Ünvan</label>
                            <Input
                              placeholder="Örn: ABC İSG Danışmanlık Ltd. Şti."
                              value={osgbForm.companyTitle}
                              onChange={(e) => setOsgbForm({ ...osgbForm, companyTitle: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">OSGB Tescil No</label>
                            <Input
                              placeholder="Örn: 12345678"
                              value={osgbForm.registrationNumber || ''}
                              onChange={(e) => setOsgbForm({ ...osgbForm, registrationNumber: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Vergi Numarası</label>
                            <Input
                              placeholder="Örn: 1234567890"
                              value={osgbForm.taxNumber || ''}
                              onChange={(e) => setOsgbForm({ ...osgbForm, taxNumber: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <hr className="border-slate-200/60 dark:border-slate-800/60" />

                      {/* İletişim Bilgileri */}
                      <div className="space-y-5">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">İletişim Bilgileri</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefon</label>
                            <Input
                              placeholder="Örn: 0212 123 45 67"
                              value={osgbForm.phone || ''}
                              onChange={(e) => setOsgbForm({ ...osgbForm, phone: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">E-posta</label>
                            <Input
                              type="email"
                              placeholder="Örn: info@abcosgb.com"
                              value={osgbForm.email || ''}
                              onChange={(e) => setOsgbForm({ ...osgbForm, email: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Web Sitesi</label>
                            <Input
                              placeholder="Örn: www.abcosgb.com"
                              value={osgbForm.website || ''}
                              onChange={(e) => setOsgbForm({ ...osgbForm, website: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Adres</label>
                          <textarea
                            rows={3}
                            className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 resize-none transition-all"
                            placeholder="Firma adresi..."
                            value={osgbForm.address || ''}
                            onChange={(e) => setOsgbForm({ ...osgbForm, address: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                          Bu bilgiler sertifika antetli kağıdında ve belge üzerindeki firma bölümünde kullanılır. Logo, sertifikanın üst kısmında gösterilir.
                        </div>
                      </div>

                      <div className="pt-6 flex justify-end">
                        <Button type="submit" className="gap-2">
                          <Save className="h-4 w-4" />
                          Firma Bilgilerini Kaydet
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Advanced Definitions Tab */}
                {activeTab === 'advanced' && (
                  <motion.div
                    key="advanced"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AdvancedDefinitionsTab />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
