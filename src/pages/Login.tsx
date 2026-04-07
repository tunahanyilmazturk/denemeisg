// ==========================================
// Login Page
// ==========================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, Lock, Eye, EyeOff, AlertTriangle,
  Shield, CheckCircle, Loader2, LogIn, AlertCircle, CheckCircle2, Sparkles, Users, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useStore } from '../store/useStore';
import { validateEmail } from '../utils/helpers';
import { cn } from '../components/ui/Button';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, isAuthenticated, error } = useAuthStore();
  const { isDarkMode } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

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
      setLoginSuccess(true);
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

  const features = [
    { icon: Shield, text: 'Gelişmiş güvenlik ve rol tabanlı erişim', color: 'from-blue-500 to-blue-600' },
    { icon: CheckCircle2, text: 'Gerçek zamanlı risk analizi', color: 'from-emerald-500 to-emerald-600' },
    { icon: AlertTriangle, text: 'Otomatik olay bildirim sistemi', color: 'from-amber-500 to-amber-600' },
  ];

  const stats = [
    { value: '500+', label: 'Aktif Firma', icon: Users },
    { value: '10K+', label: 'Personel', icon: TrendingUp },
    { value: '%99.9', label: 'Uptime', icon: Sparkles },
  ];

  return (
    <div
      className="min-h-screen flex relative overflow-hidden"
      style={{
        backgroundImage: 'url(/bg/bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-800/60 to-slate-900/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-slate-900/30" />

      {/* Decorative orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-amber-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Animated particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-white/30"
          style={{
            top: `${15 + i * 15}%`,
            left: `${8 + i * 12}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.4,
          }}
        />
      ))}

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="relative z-10 max-w-lg w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="flex items-center gap-5 mb-14"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full scale-150" />
              <img
                src="/logo/logodark.png"
                alt="HanTech Logo"
                className="relative w-20 h-20 object-contain mix-blend-screen drop-shadow-[0_0_20px_rgba(96,165,250,0.5)]"
              />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">HanTech</h1>
              <p className="text-sm font-semibold text-blue-300 tracking-[0.2em] uppercase mt-0.5">AI İSG Yönetim Sistemi</p>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            className="mb-10"
          >
            <h2 className="text-4xl font-bold text-white leading-tight drop-shadow-lg mb-4">
              İş Sağlığı ve<br />Güvenliğinde
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-amber-400">
                Akıllı Çözümler
              </span>
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed max-w-sm">
              Yapay zeka destekli platformla iş güvenliğinizi en üst seviyeye taşıyın.
            </p>
          </motion.div>

          {/* Feature list */}
          <div className="space-y-4 mb-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.35 + index * 0.12, ease: 'easeOut' }}
                className="flex items-center gap-4 group"
              >
                <div className={cn(
                  "p-2.5 rounded-xl bg-gradient-to-br shadow-lg",
                  feature.color,
                  "shadow-current/30 group-hover:scale-110 transition-transform duration-200"
                )}>
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 py-3 px-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200">
                  <span className="text-slate-100 font-medium text-sm">{feature.text}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="grid grid-cols-3 gap-4 pt-8 border-t border-white/15"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                    <stat.icon className="h-4 w-4 text-blue-300" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex lg:hidden items-center gap-3 mb-8 justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/40 blur-xl rounded-full scale-150" />
              <div className="relative w-14 h-14 rounded-2xl shadow-xl shadow-blue-500/30 overflow-hidden bg-white/10 backdrop-blur-sm border border-white/25">
                <img
                  src={isDarkMode ? '/logo/logodark.png' : '/logo/logo.png'}
                  alt="HanTech Logo"
                  className="w-full h-full object-contain p-2"
                />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-lg">HanTech</h1>
              <p className="text-xs text-blue-300 font-semibold tracking-wider">AI İSG Yönetim Sistemi</p>
            </div>
          </motion.div>

          {/* Card */}
          <div className="relative">
            {/* Card glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 via-cyan-500/20 to-blue-600/30 rounded-[2rem] blur-xl opacity-60" />

            <div className="relative bg-white/97 dark:bg-slate-900/97 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/30 border border-white/30 dark:border-slate-700/40 p-8 sm:p-10">

              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="relative inline-block mb-4"
                >
                  <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-2xl blur-md scale-110" />
                  <img
                    src="/logo/logo.png"
                    alt="HanTech Logo"
                    className="relative w-20 h-20 object-contain mx-auto dark:mix-blend-screen"
                  />
                </motion.div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Hoş Geldiniz</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">Hesabınıza giriş yaparak devam edin</p>
              </div>

              {/* Lock Banner */}
              <AnimatePresence>
                {isLocked && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-800/50 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/50 shrink-0">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-red-700 dark:text-red-400">Hesap geçici olarak kilitlendi</p>
                        <p className="text-xs text-red-500 dark:text-red-500 mt-0.5">{lockTimer} saniye sonra tekrar deneyin</p>
                      </div>
                      <div className="ml-auto">
                        <div className="w-10 h-10 rounded-full border-2 border-red-300 dark:border-red-700 flex items-center justify-center">
                          <span className="text-sm font-bold text-red-600 dark:text-red-400">{lockTimer}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Banner from auth store */}
              <AnimatePresence>
                {error && !isLocked && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3.5 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200/80 dark:border-red-800/40 flex items-center gap-2.5">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 ml-0.5">
                    Email Adresi
                  </label>
                  <div className="relative">
                    <motion.div
                      animate={{
                        scale: emailFocused ? 1 : 1,
                      }}
                      className="relative"
                    >
                      <div className={cn(
                        "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-200",
                      )}>
                        <div className={cn(
                          "p-1.5 rounded-lg transition-all duration-200",
                          emailFocused && !errors.email
                            ? "bg-blue-100 dark:bg-blue-900/40"
                            : errors.email
                            ? "bg-red-100 dark:bg-red-900/30"
                            : "bg-slate-100 dark:bg-slate-700/60"
                        )}>
                          <Mail className={cn(
                            "h-3.5 w-3.5 transition-colors duration-200",
                            emailFocused && !errors.email
                              ? "text-blue-500"
                              : errors.email
                              ? "text-red-400"
                              : "text-slate-400"
                          )} />
                        </div>
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        placeholder="ornek@email.com"
                        className={cn(
                          "w-full h-12 pl-12 pr-10 rounded-xl border-2 text-sm font-medium transition-all duration-200",
                          "bg-slate-50/80 dark:bg-slate-800/60",
                          "placeholder:text-slate-300 dark:placeholder:text-slate-600",
                          "text-slate-900 dark:text-slate-100",
                          "focus:outline-none focus:ring-0",
                          errors.email
                            ? "border-red-300 dark:border-red-700 focus:border-red-400 bg-red-50/50 dark:bg-red-950/20"
                            : emailFocused
                            ? "border-blue-400 dark:border-blue-500 shadow-md shadow-blue-500/10 bg-white dark:bg-slate-800"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        )}
                        disabled={isLocked}
                        autoComplete="email"
                      />
                      {/* Valid indicator */}
                      {email && !errors.email && validateEmail(email) && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none"
                        >
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="flex items-center gap-1.5 ml-0.5 overflow-hidden"
                      >
                        <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />
                        <p className="text-xs text-red-500 font-medium">{errors.email}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 ml-0.5">
                      Şifre
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors hover:underline"
                    >
                      Şifremi Unuttum?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className={cn(
                      "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-200",
                    )}>
                      <div className={cn(
                        "p-1.5 rounded-lg transition-all duration-200",
                        passwordFocused && !errors.password
                          ? "bg-blue-100 dark:bg-blue-900/40"
                          : errors.password
                          ? "bg-red-100 dark:bg-red-900/30"
                          : "bg-slate-100 dark:bg-slate-700/60"
                      )}>
                        <Lock className={cn(
                          "h-3.5 w-3.5 transition-colors duration-200",
                          passwordFocused && !errors.password
                            ? "text-blue-500"
                            : errors.password
                            ? "text-red-400"
                            : "text-slate-400"
                        )} />
                      </div>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder="••••••••"
                      className={cn(
                        "w-full h-12 pl-12 pr-12 rounded-xl border-2 text-sm font-medium transition-all duration-200",
                        "bg-slate-50/80 dark:bg-slate-800/60",
                        "placeholder:text-slate-300 dark:placeholder:text-slate-600",
                        "text-slate-900 dark:text-slate-100",
                        "focus:outline-none focus:ring-0",
                        errors.password
                          ? "border-red-300 dark:border-red-700 focus:border-red-400 bg-red-50/50 dark:bg-red-950/20"
                          : passwordFocused
                          ? "border-blue-400 dark:border-blue-500 shadow-md shadow-blue-500/10 bg-white dark:bg-slate-800"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      )}
                      disabled={isLocked}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-150 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="flex items-center gap-1.5 ml-0.5 overflow-hidden"
                      >
                        <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />
                        <p className="text-xs text-red-500 font-medium">{errors.password}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer group select-none">
                    <div className="relative" onClick={() => setRememberMe(!rememberMe)}>
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <motion.div
                        animate={{
                          backgroundColor: rememberMe ? '#2563eb' : 'transparent',
                          borderColor: rememberMe ? '#2563eb' : '#cbd5e1',
                          scale: rememberMe ? [1, 0.9, 1] : 1,
                        }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center",
                          "group-hover:border-blue-400 transition-colors"
                        )}
                      >
                        {rememberMe && (
                          <motion.svg
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </motion.svg>
                        )}
                      </motion.div>
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
                    "relative w-full h-13 py-3 rounded-xl font-bold text-white transition-all duration-300 overflow-hidden",
                    "flex items-center justify-center gap-2.5 text-sm",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    isLocked
                      ? "bg-slate-400 dark:bg-slate-600"
                      : "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/35 hover:shadow-xl hover:shadow-blue-500/45"
                  )}
                  style={{ backgroundSize: '200% 100%' }}
                >
                  {/* Shine effect */}
                  {!isLoading && !isLocked && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                    />
                  )}
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Giriş yapılıyor...</span>
                    </>
                  ) : isLocked ? (
                    <>
                      <Lock className="h-5 w-5" />
                      <span>Hesap Kilitli ({lockTimer}s)</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5" />
                      <span>Giriş Yap</span>
                    </>
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="relative my-7">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700/70" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Hızlı Giriş
                  </span>
                </div>
              </div>

              {/* Demo Credentials */}
              <div className="space-y-2.5">
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center font-medium">Demo hesaplarla sistemi keşfedin</p>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    type="button"
                    onClick={() => fillDemoCredentials('admin')}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md hover:shadow-blue-500/10"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                        <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">Admin</span>
                    </div>
                    <span className="relative text-xs text-slate-400 dark:text-slate-500">Yönetici Hesabı</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => fillDemoCredentials('uzman')}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-200 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md hover:shadow-amber-500/10"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/50 transition-colors">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">Uzman</span>
                    </div>
                    <span className="relative text-xs text-slate-400 dark:text-slate-500">İSG Uzmanı</span>
                  </motion.button>
                </div>
              </div>

              {/* Support Info */}
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-center text-xs text-slate-500 dark:text-slate-500">
                  Hesabınız yok mu?{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Sistem yöneticinizle iletişime geçin.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-6 text-xs text-slate-400/80 font-medium"
          >
            © 2026 HanTech Teknoloji A.Ş. · Tüm hakları saklıdır.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};
