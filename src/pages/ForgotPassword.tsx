// ==========================================
// Forgot Password Page
// ==========================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { validateEmail } from '../utils/passwordStrength';
import { cn } from '../components/ui/Button';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { requestPasswordReset, isLoading, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email adresi gerekli');
      return;
    }
    if (!validateEmail(email)) {
      setError('Geçerli bir email adresi girin');
      return;
    }

    try {
      await requestPasswordReset({ email });
      setIsSuccess(true);
    } catch (err) {
      // Error handled in store
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-purple-500/10 to-transparent rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
      </div>

      <div className="w-full flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="relative p-3 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-xl shadow-lg shadow-indigo-500/30">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">HanTech AI</h1>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 p-8 sm:p-10">
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
                      <Mail className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Şifremi Unuttum</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                      Email adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                        Email Adresi
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setError(''); }}
                          placeholder="ornek@email.com"
                          className={cn(
                            "w-full h-12 pl-11 pr-4 rounded-xl border text-sm bg-slate-50/50 dark:bg-slate-800/50 transition-all duration-200",
                            "focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500",
                            error
                              ? "border-red-300 dark:border-red-800 focus:ring-red-500/30 focus:border-red-500"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                          )}
                          autoFocus
                        />
                      </div>
                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-500 ml-1"
                        >{error}</motion.p>
                      )}
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileTap={{ scale: 0.98 }}
                      className="w-full h-12 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Gönderiliyor...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Sıfırlama Bağlantısı Gönder
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Email Gönderildi</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">
                    Eğer <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span> adresi kayıtlıysa, şifre sıfırlama bağlantısı gönderilmiştir.
                  </p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mb-8">
                    Spam klasörünü de kontrol etmeyi unutmayın.
                  </p>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full h-12 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all duration-200"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Giriş Sayfasına Dön
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {!isSuccess && (
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Giriş sayfasına dön
                </Link>
              </div>
            )}
          </div>

          <p className="text-center mt-6 text-xs text-slate-400 dark:text-slate-500">
            © 2024 HanTech Teknoloji A.Ş. Tüm hakları saklıdır.
          </p>
        </motion.div>
      </div>
    </div>
  );
};
