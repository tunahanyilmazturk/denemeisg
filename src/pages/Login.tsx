// ==========================================
// Login Page
// ==========================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, Lock, Eye, EyeOff, AlertTriangle, ArrowRight, 
  Shield, CheckCircle, Loader2, LogIn
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { validateEmail } from '../utils/passwordStrength';
import { cn } from '../components/ui/Button';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, isAuthenticated, error } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Lock timer countdown
  useEffect(() => {
    if (lockTimer > 0) {
      const timer = setTimeout(() => setLockTimer(lockTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (lockTimer === 0 && isLocked) {
      setIsLocked(false);
      setLoginAttempts(0);
    }
  }, [lockTimer, isLocked]);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email adresi gerekli';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Geçerli bir email adresi girin';
    }

    if (!password) {
      newErrors.password = 'Şifre gerekli';
    } else if (password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) return;
    if (!validate()) return;

    try {
      await login({ email, password, rememberMe });
    } catch (err) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      // Lock after 5 failed attempts
      if (newAttempts >= 5) {
        setIsLocked(true);
        setLockTimer(30); // 30 seconds lock
      }
    }
  };

  const fillDemoCredentials = (type: 'admin' | 'uzman') => {
    if (type === 'admin') {
      setEmail('admin@hantech.com');
      setPassword('Admin123!');
    } else {
      setEmail('uzman@hantech.com');
      setPassword('Uzman123!');
    }
    setErrors({});
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-indigo-500/10 via-blue-500/5 to-transparent rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="relative z-10 max-w-lg">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4 mb-12"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
              <div className="relative p-4 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-2xl shadow-xl shadow-indigo-500/30">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">HanTech</h1>
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 tracking-wider">AI İSG Yönetim Sistemi</p>
            </div>
          </motion.div>

          {/* Feature list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              İş Sağlığı ve Güvenliğinde<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Yeni Nesil Teknoloji</span>
            </h2>
            
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
              Yapay zeka destekli İSG yönetim platformu ile iş güvenliğinizi en üst seviyeye taşıyın.
            </p>

            <div className="space-y-4 mt-8">
              {[
                { icon: Shield, text: 'Gelişmiş güvenlik ve rol tabanlı erişim' },
                { icon: CheckCircle, text: 'Gerçek zamanlı risk analizi' },
                { icon: AlertTriangle, text: 'Otomatik olay bildirim sistemi' },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/10">
                    <feature.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex gap-8 mt-12 pt-8 border-t border-slate-200 dark:border-slate-800"
          >
            {[
              { value: '500+', label: 'Aktif Firma' },
              { value: '10K+', label: 'Personel' },
              { value: '%99.9', label: 'Uptime' },
            ].map((stat, index) => (
              <div key={index}>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="relative p-3 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-xl shadow-lg shadow-indigo-500/30">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">HanTech AI</h1>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Giriş Yap</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Hesabınıza giriş yaparak devam edin</p>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
              {isLocked && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/50"
                >
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <Lock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Hesap geçici olarak kilitlendi. {lockTimer}s sonra tekrar deneyin.
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                  Email Adresi
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                    placeholder="ornek@email.com"
                    className={cn(
                      "w-full h-12 pl-11 pr-4 rounded-xl border text-sm bg-slate-50/50 dark:bg-slate-800/50 transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500",
                      errors.email
                        ? "border-red-300 dark:border-red-800 focus:ring-red-500/30 focus:border-red-500"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    )}
                    disabled={isLocked}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-500 ml-1"
                  >{errors.email}</motion.p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                    Şifre
                  </label>
                  <Link 
                    to="/forgot-password" 
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                  >
                    Şifremi Unuttum
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                    placeholder="••••••••"
                    className={cn(
                      "w-full h-12 pl-11 pr-12 rounded-xl border text-sm bg-slate-50/50 dark:bg-slate-800/50 transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500",
                      errors.password
                        ? "border-red-300 dark:border-red-800 focus:ring-red-500/30 focus:border-red-500"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    )}
                    disabled={isLocked}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-500 ml-1"
                  >{errors.password}</motion.p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center",
                      rememberMe
                        ? "bg-indigo-600 border-indigo-600"
                        : "bg-transparent border-slate-300 dark:border-slate-600 group-hover:border-indigo-400"
                    )}>
                      {rememberMe && (
                        <motion.svg
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </motion.svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    Beni Hatırla
                  </span>
                </label>
              </div>

              {/* Login Button */}
              <motion.button
                type="submit"
                disabled={isLoading || isLocked}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full h-12 rounded-xl font-semibold text-white transition-all duration-200",
                  "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600",
                  "shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30",
                  "flex items-center justify-center gap-2",
                  "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Giriş Yap
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white dark:bg-slate-900 text-slate-500">veya</span>
              </div>
            </div>

            {/* Demo Credentials */}
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">Demo Hesaplar</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('admin')}
                  className="flex items-center justify-center gap-2 h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Shield className="h-4 w-4 text-indigo-500" />
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('uzman')}
                  className="flex items-center justify-center gap-2 h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <AlertTriangle className="h-4 w-4 text-emerald-500" />
                  İSG Uzmanı
                </button>
              </div>
            </div>

            {/* Support Info */}
            <p className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
              Hesabınız yok mu? Lütfen sistem yöneticinizle iletişime geçin.
            </p>
          </div>

          {/* Footer */}
          <p className="text-center mt-6 text-xs text-slate-400 dark:text-slate-500">
            © 2024 HanTech Teknoloji A.Ş. Tüm hakları saklıdır.
          </p>
        </motion.div>
      </div>
    </div>
  );
};
