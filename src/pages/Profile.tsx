import React, { useState, useEffect } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Save, Upload, Stamp, X, Info, Check, User, Shield, Key, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

type ProfileTab = 'info' | 'stamp' | 'security';

const profileTabs: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
  { id: 'info', label: 'Profil Bilgileri', icon: User },
  { id: 'stamp', label: 'Kaşe / İmza', icon: Stamp },
  { id: 'security', label: 'Güvenlik', icon: Shield },
];

export const ProfilePage = () => {
  const { user, updateUser, changePassword: authChangePassword } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');

  // Profile form - initialize from auth store user
  const [profileForm, setProfileForm] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user ? (user.role.charAt(0).toUpperCase() + user.role.slice(1).replace(/_/g, ' ')) : '',
    stampImage: undefined as string | undefined,
    stampTitle: undefined as string | undefined,
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        role: user.role.charAt(0).toUpperCase() + user.role.slice(1).replace(/_/g, ' '),
        stampImage: undefined,
        stampTitle: undefined,
      });
    }
  }, [user]);

  // Security form
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Update auth store user
    updateUser({
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      email: profileForm.email,
      phone: profileForm.phone,
    });
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error('Kaşe/imza dosyası 500KB\'dan küçük olmalıdır.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setProfileForm({ ...profileForm, stampImage: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor.');
      return;
    }
    if (securityForm.newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    try {
      await authChangePassword(securityForm.currentPassword, securityForm.newPassword);
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <PageTransition>
      <div className="space-y-4 max-w-full mx-0">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg flex-shrink-0">
              {profileForm.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Profilim</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Content with sidebar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex flex-col lg:flex-row min-h-[500px]">
            {/* Profile Sidebar */}
            <div className="w-full lg:w-64 bg-slate-50 dark:bg-slate-800/50 p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700">
              <nav className="space-y-2">
                {profileTabs.map((tab) => (
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
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6 lg:p-8">
              <AnimatePresence mode="wait">
                {/* Profile Info Tab */}
                {activeTab === 'info' && (
                  <motion.div
                    key="info"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                      <div>
                        <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white mb-2">Profil Bilgileri</h2>
                        <p className="text-slate-500 dark:text-slate-400">Kişisel bilgilerinizi güncelleyin.</p>
                      </div>

                      {/* Avatar */}
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0">
                          {profileForm.firstName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{profileForm.firstName} {profileForm.lastName}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{profileForm.role}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ad</label>
                          <Input
                            value={profileForm.firstName}
                            onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Soyad</label>
                          <Input
                            value={profileForm.lastName}
                            onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
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
                        <div className="space-y-2 sm:col-span-2">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Görev/Ünvan</label>
                          <Input
                            value={profileForm.role}
                            disabled
                            className="bg-slate-50 dark:bg-slate-800 cursor-not-allowed"
                          />
                          <p className="text-xs text-slate-400">Rol değişikliği için yöneticinizle iletişime geçin.</p>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <Button type="submit" className="gap-2">
                          <Save className="h-4 w-4" />
                          Kaydet
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Stamp / Signature Tab */}
                {activeTab === 'stamp' && (
                  <motion.div
                    key="stamp"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <Stamp className="h-5 w-5 text-indigo-500" />
                        Kaşe / İmza
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400">Sertifikalarda kullanılacak kişisel kaşe veya imza görselinizi yükleyin.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kaşe Ünvanı</label>
                      <Input
                        placeholder="Örn: İSG Uzmanı, İşyeri Hekimi"
                        value={profileForm.stampTitle || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, stampTitle: e.target.value })}
                      />
                      <p className="text-xs text-slate-400">Sertifika üzerindeki imza altında gösterilir.</p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kaşe / İmza Görseli</label>

                      {profileForm.stampImage ? (
                        <div className="flex items-start gap-4">
                          <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-xl p-4 bg-indigo-50/50 dark:bg-indigo-900/10">
                            <img
                              src={profileForm.stampImage}
                              alt="Kaşe"
                              className="max-h-24 object-contain"
                            />
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Check className="h-3 w-3" /> Kaşe yüklendi
                            </p>
                            <div className="flex gap-2">
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleStampUpload}
                                  className="hidden"
                                />
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all cursor-pointer">
                                  <Upload className="h-3 w-3" /> Değiştir
                                </span>
                              </label>
                              <button
                                type="button"
                                onClick={() => setProfileForm({ ...profileForm, stampImage: undefined })}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
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
                            onChange={handleStampUpload}
                            className="hidden"
                          />
                          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all cursor-pointer">
                            <Stamp className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Kaşe veya imza yükle</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">PNG veya JPG, max 500KB. Şeffaf arkaplan önerilir.</p>
                          </div>
                        </label>
                      )}
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        Yüklediğiniz kaşe/imza görseli sertifika oluşturma sırasında otomatik olarak kullanılır. Her kullanıcı kendi kaşesini yönetir.
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button onClick={handleSaveProfile} className="gap-2">
                        <Save className="h-4 w-4" />
                        Kaydet
                      </Button>
                    </div>
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
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Yeni Şifre</label>
                          <Input
                            type="password"
                            value={securityForm.newPassword}
                            onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Yeni Şifre (Tekrar)</label>
                          <Input
                            type="password"
                            value={securityForm.confirmPassword}
                            onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                            required
                          />
                        </div>
                        <Button type="submit" variant="secondary" className="gap-2">
                          <Key className="h-4 w-4" />
                          Şifreyi Değiştir
                        </Button>
                      </form>
                    </div>

                    <hr className="border-slate-200/60 dark:border-slate-800/60" />

                    {/* Active Sessions Info */}
                    <div>
                      <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white mb-2">Oturum Bilgileri</h2>
                      <p className="text-slate-500 dark:text-slate-400 mb-4">Mevcut oturumunuzun bilgileri.</p>
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-2 max-w-md">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500 dark:text-slate-400">E-posta</span>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{user?.email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Rol</span>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{user?.role}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Durum</span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Aktif
                          </span>
                        </div>
                      </div>
                    </div>
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
