import React, { useState } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Save, Bell, Shield, Building, User, Moon, Sun, Monitor, Globe, Mail, Key, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore, Theme, Language } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';

type SettingsTab = 'general' | 'notifications' | 'security' | 'profile';

const tabs = [
  { id: 'general' as SettingsTab, label: 'Genel Ayarlar', icon: Building },
  { id: 'notifications' as SettingsTab, label: 'Bildirimler', icon: Bell },
  { id: 'security' as SettingsTab, label: 'Güvenlik', icon: Shield },
  { id: 'profile' as SettingsTab, label: 'Profil', icon: User },
];

const themeOptions: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: 'light', label: 'Açık', icon: Sun },
  { value: 'dark', label: 'Koyu', icon: Moon },
  { value: 'system', label: 'Sistem', icon: Monitor },
];

const languageOptions: { value: Language; label: string; flag: string }[] = [
  { value: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
];

export const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const { 
    systemSettings, 
    notificationSettings, 
    userProfile,
    updateSystemSettings, 
    updateNotificationSettings, 
    updateUserProfile 
  } = useStore();

  // Local form states
  const [generalForm, setGeneralForm] = useState(systemSettings);
  const [notificationForm, setNotificationForm] = useState(notificationSettings);
  const [profileForm, setProfileForm] = useState(userProfile);
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [apiKey, setApiKey] = useState('ht_live_' + Math.random().toString(36).substring(2, 15));

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings(generalForm);
    toast.success('Genel ayarlar kaydedildi.');
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    updateNotificationSettings(notificationForm);
    toast.success('Bildirim ayarları kaydedildi.');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(profileForm);
    toast.success('Profil bilgileri güncellendi.');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor.');
      return;
    }
    if (securityForm.newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    toast.success('Şifre başarıyla değiştirildi.');
    setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const regenerateApiKey = () => {
    const newKey = 'ht_live_' + Math.random().toString(36).substring(2, 15);
    setApiKey(newKey);
    toast.success('API anahtarı yenilendi.');
  };

  const ToggleSwitch = ({ 
    checked, 
    onChange, 
    label, 
    description 
  }: { 
    checked: boolean; 
    onChange: (checked: boolean) => void; 
    label: string; 
    description?: string;
  }) => (
    <div className="flex items-center justify-between p-5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30">
      <div>
        <p className="font-medium text-slate-900 dark:text-white">{label}</p>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
      </label>
    </div>
  );

  return (
    <PageTransition>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Sistem Ayarları</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-lg">Uygulama tercihlerinizi ve sistem yapılandırmasını yönetin.</p>
        </div>

        <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Settings Sidebar */}
            <div className="w-full lg:w-72 bg-slate-50/50 dark:bg-slate-800/30 p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-slate-200/60 dark:border-slate-800/60">
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

              <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
                <div className="px-4 py-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/50">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Sistem Bilgisi</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">Versiyon: 1.0.0</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
            </div>

            {/* Settings Content */}
            <div className="flex-1 p-6 lg:p-8">
              <AnimatePresence mode="wait">
                {/* General Settings Tab */}
                {activeTab === 'general' && (
                  <motion.div
                    key="general"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <form onSubmit={handleSaveGeneral} className="space-y-8">
                      <div className="space-y-5">
                        <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white">Firma Bilgileri</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sistem Adı</label>
                            <Input 
                              value={generalForm.systemName}
                              onChange={(e) => setGeneralForm({ ...generalForm, systemName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ana Firma Ünvanı</label>
                            <Input 
                              value={generalForm.companyName}
                              onChange={(e) => setGeneralForm({ ...generalForm, companyName: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">İletişim E-posta</label>
                          <Input 
                            type="email"
                            value={generalForm.contactEmail}
                            onChange={(e) => setGeneralForm({ ...generalForm, contactEmail: e.target.value })}
                          />
                        </div>
                      </div>

                      <hr className="border-slate-200/60 dark:border-slate-800/60" />

                      <div className="space-y-5">
                        <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white">Görünüm</h2>
                        
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tema</label>
                          <div className="grid grid-cols-3 gap-3">
                            {themeOptions.map((theme) => (
                              <button
                                key={theme.value}
                                type="button"
                                onClick={() => setGeneralForm({ ...generalForm, theme: theme.value })}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                  generalForm.theme === theme.value
                                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                              >
                                <theme.icon className={`h-6 w-6 ${
                                  generalForm.theme === theme.value ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                                }`} />
                                <span className={`text-sm font-medium ${
                                  generalForm.theme === theme.value ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
                                }`}>{theme.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Dil</label>
                          <div className="flex gap-3">
                            {languageOptions.map((lang) => (
                              <button
                                key={lang.value}
                                type="button"
                                onClick={() => setGeneralForm({ ...generalForm, language: lang.value })}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                                  generalForm.language === lang.value
                                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <span className="text-lg">{lang.flag}</span>
                                <span className="font-medium">{lang.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <hr className="border-slate-200/60 dark:border-slate-800/60" />

                      <ToggleSwitch
                        label="Otomatik Yedekleme"
                        description="Sistem verilerini her gece otomatik yedekle"
                        checked={generalForm.autoBackup}
                        onChange={(checked) => setGeneralForm({ ...generalForm, autoBackup: checked })}
                      />

                      <div className="pt-6 flex justify-end">
                        <Button type="submit" className="gap-2">
                          <Save className="h-4 w-4" />
                          Ayarları Kaydet
                        </Button>
                      </div>
                    </form>
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
                    <form onSubmit={handleSaveNotifications} className="space-y-6">
                      <div>
                        <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white mb-2">Bildirim Tercihleri</h2>
                        <p className="text-slate-500 dark:text-slate-400">Hangi durumlarda bildirim almak istediğinizi seçin.</p>
                      </div>

                      <div className="space-y-4">
                        <ToggleSwitch
                          label="E-posta Bildirimleri"
                          description="Tüm bildirimleri e-posta olarak al"
                          checked={notificationForm.emailNotifications}
                          onChange={(checked) => setNotificationForm({ ...notificationForm, emailNotifications: checked })}
                        />

                        <ToggleSwitch
                          label="Olay/Kaza Bildirimleri"
                          description="Yeni olay eklendiğinde bildir"
                          checked={notificationForm.incidentAlerts}
                          onChange={(checked) => setNotificationForm({ ...notificationForm, incidentAlerts: checked })}
                        />

                        <ToggleSwitch
                          label="Eğitim Hatırlatmaları"
                          description="Yaklaşan eğitimler için hatırlat"
                          checked={notificationForm.trainingReminders}
                          onChange={(checked) => setNotificationForm({ ...notificationForm, trainingReminders: checked })}
                        />

                        <ToggleSwitch
                          label="KKD Sona Erme Uyarıları"
                          description="KKD zimmetlerinin durumu değiştiğinde bildir"
                          checked={notificationForm.ppeExpiryAlerts}
                          onChange={(checked) => setNotificationForm({ ...notificationForm, ppeExpiryAlerts: checked })}
                        />

                        <ToggleSwitch
                          label="Risk Güncellemeleri"
                          description="Risk durumları değiştiğinde bildir"
                          checked={notificationForm.riskUpdates}
                          onChange={(checked) => setNotificationForm({ ...notificationForm, riskUpdates: checked })}
                        />

                        <ToggleSwitch
                          label="Günlük Özet"
                          description="Her gün sistem aktivitelerinin özetini al"
                          checked={notificationForm.dailySummary}
                          onChange={(checked) => setNotificationForm({ ...notificationForm, dailySummary: checked })}
                        />
                      </div>

                      <div className="pt-6 flex justify-end">
                        <Button type="submit" className="gap-2">
                          <Save className="h-4 w-4" />
                          Bildirim Ayarlarını Kaydet
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    {/* Change Password */}
                    <div>
                      <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white mb-2">Şifre Değiştir</h2>
                      <p className="text-slate-500 dark:text-slate-400 mb-5">Hesabınızın güvenliği için düzenli olarak şifre değiştirin.</p>
                      
                      <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mevcut Şifre</label>
                          <Input 
                            type="password"
                            value={securityForm.currentPassword}
                            onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Yeni Şifre</label>
                          <Input 
                            type="password"
                            value={securityForm.newPassword}
                            onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Yeni Şifre (Tekrar)</label>
                          <Input 
                            type="password"
                            value={securityForm.confirmPassword}
                            onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                          />
                        </div>
                        <Button type="submit" variant="secondary" className="gap-2">
                          <Key className="h-4 w-4" />
                          Şifreyi Değiştir
                        </Button>
                      </form>
                    </div>

                    <hr className="border-slate-200/60 dark:border-slate-800/60" />

                    {/* API Key */}
                    <div>
                      <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white mb-2">API Anahtarı</h2>
                      <p className="text-slate-500 dark:text-slate-400 mb-5">Harici uygulamalarla entegrasyon için API anahtarınız.</p>
                      
                      <div className="flex items-center gap-3 max-w-lg">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            readOnly
                            value={apiKey}
                            className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-600 dark:text-slate-400"
                          />
                        </div>
                        <Button variant="ghost" onClick={() => {
                          navigator.clipboard.writeText(apiKey);
                          toast.success('API anahtarı kopyalandı');
                        }}>
                          Kopyala
                        </Button>
                        <Button variant="secondary" onClick={regenerateApiKey}>
                          Yenile
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        API anahtarını yenilediğinizde eski anahtarlar geçersiz olur.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <form onSubmit={handleSaveProfile} className="space-y-8">
                      <div>
                        <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white mb-2">Profil Bilgileri</h2>
                        <p className="text-slate-500 dark:text-slate-400">Kişisel bilgilerinizi güncelleyin.</p>
                      </div>

                      {/* Avatar */}
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                          {profileForm.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Button variant="secondary" className="gap-2 mb-2">
                            <Upload className="h-4 w-4" />
                            Fotoğraf Yükle
                          </Button>
                          <p className="text-xs text-slate-500 dark:text-slate-400">JPG, PNG. Maksimum 2MB.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ad Soyad</label>
                          <Input 
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">E-posta</label>
                          <Input 
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefon</label>
                          <Input 
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Görev/Ünvan</label>
                          <Input 
                            value={profileForm.role}
                            onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="pt-6 flex justify-end">
                        <Button type="submit" className="gap-2">
                          <Save className="h-4 w-4" />
                          Profili Güncelle
                        </Button>
                      </div>
                    </form>
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
