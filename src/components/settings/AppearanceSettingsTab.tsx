import React from 'react';
import { useStore, AppearanceSettings, FontSize, ColorAccent } from '../../store/useStore';
import { Button } from '../ui/Button';
import { Sun, Moon, Monitor, Type, Palette, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── TYPES ──────────────────────────────────────────────────────────────────

type Theme = 'light' | 'dark' | 'system';

interface SelectOption<T> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ElementType;
  preview?: React.ReactNode;
}

// ─── OPTION DEFINITIONS ──────────────────────────────────────────────────────

const themeOptions: SelectOption<Theme>[] = [
  { value: 'light', label: 'Açık', icon: Sun, description: 'Açık tema' },
  { value: 'dark', label: 'Koyu', icon: Moon, description: 'Koyu tema' },
  { value: 'system', label: 'Sistem', icon: Monitor, description: 'Sistem tercihini takip et' },
];

const colorAccentOptions: { value: ColorAccent; label: string; tw: string }[] = [
  { value: 'indigo', label: 'İndigo', tw: 'bg-indigo-500' },
  { value: 'blue', label: 'Mavi', tw: 'bg-blue-500' },
  { value: 'emerald', label: 'Yeşil', tw: 'bg-emerald-500' },
  { value: 'rose', label: 'Pembe', tw: 'bg-rose-500' },
  { value: 'amber', label: 'Amber', tw: 'bg-amber-500' },
  { value: 'violet', label: 'Mor', tw: 'bg-violet-500' },
  { value: 'cyan', label: 'Cam Göbeği', tw: 'bg-cyan-500' },
  { value: 'orange', label: 'Turuncu', tw: 'bg-orange-500' },
];

const fontSizeOptions: SelectOption<FontSize>[] = [
  { value: 'small', label: 'Küçük', description: '13px' },
  { value: 'medium', label: 'Orta', description: '14px' },
  { value: 'large', label: 'Büyük', description: '16px' },
];


// ─── HELPER: Apply Theme ─────────────────────────────────────────────────────

function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

// ─── REUSABLE COMPONENTS ─────────────────────────────────────────────────────

function SettingSection({ icon: Icon, title, children }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export const AppearanceSettingsTab: React.FC = () => {
  const { appearanceSettings, updateAppearanceSettings, systemSettings, updateSystemSettings, isDarkMode, toggleDarkMode } = useStore();

  // Helper to update a single field immediately (no local form state needed)
  const update = (partial: Partial<AppearanceSettings>) => {
    updateAppearanceSettings(partial);
  };

  // Determine current effective theme
  const currentTheme: Theme = systemSettings.theme || 'system';

  const handleThemeChange = (theme: Theme) => {
    updateSystemSettings({ theme });
    applyTheme(theme);
    // Sync isDarkMode state
    if (theme === 'dark' && !isDarkMode) {
      toggleDarkMode();
    } else if (theme === 'light' && isDarkMode) {
      toggleDarkMode();
    } else if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark && !isDarkMode) toggleDarkMode();
      if (!prefersDark && isDarkMode) toggleDarkMode();
    }
  };

  const handleReset = () => {
    const defaults: AppearanceSettings = {
      fontSize: 'medium',
      colorAccent: 'indigo',
    };
    updateAppearanceSettings(defaults);
    updateSystemSettings({ theme: 'system' });
    applyTheme('system');
    toast.success('Görünüm ayarları varsayılana sıfırlandı.');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white">Görünüm Ayarları</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tema, renk ve arayüz tercihlerini özelleştirin. Değişiklikler anında uygulanır.</p>
        </div>
        <Button type="button" variant="ghost" onClick={handleReset} className="gap-2 text-sm">
          <RotateCcw className="h-4 w-4" />
          Sıfırla
        </Button>
      </div>

      {/* ─── THEME ─── */}
      <SettingSection icon={Sun} title="Tema">
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((opt) => {
            const Icon = opt.icon!;
            const isSelected = currentTheme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleThemeChange(opt.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Icon className={`h-6 w-6 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span className={`text-sm font-medium ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </SettingSection>

      <hr className="border-slate-200/60 dark:border-slate-800/60" />

      {/* ─── ACCENT COLOR ─── */}
      <SettingSection icon={Palette} title="Vurgu Rengi">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {colorAccentOptions.map((opt) => {
            const isSelected = appearanceSettings.colorAccent === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ colorAccent: opt.value })}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-slate-900 dark:border-white shadow-lg scale-105'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className={`w-8 h-8 rounded-full shadow-md ${opt.tw} ${isSelected ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`} />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </SettingSection>

      <hr className="border-slate-200/60 dark:border-slate-800/60" />

      {/* ─── FONT SIZE ─── */}
      <SettingSection icon={Type} title="Yazı Boyutu">
        <div className="grid grid-cols-3 gap-3">
          {fontSizeOptions.map((opt) => {
            const isSelected = appearanceSettings.fontSize === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ fontSize: opt.value })}
                className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <span className={`font-bold ${
                  opt.value === 'small' ? 'text-xs' : opt.value === 'medium' ? 'text-sm' : 'text-base'
                } ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  Aa
                </span>
                <span className={`text-xs font-medium ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {opt.label}
                </span>
                <span className="text-[10px] text-slate-400">{opt.description}</span>
              </button>
            );
          })}
        </div>
      </SettingSection>

    </div>
  );
};
