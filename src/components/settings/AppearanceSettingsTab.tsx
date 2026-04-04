import React, { useState } from 'react';
import { useStore, AppearanceSettings, FontSize, CardStyle, ColorAccent, SidebarStyle, TableDensity } from '../../store/useStore';
import { Button } from '../ui/Button';
import { Save, Type, Palette, Layout, Table, Sparkles, Eye, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── OPTION DEFINITIONS ──────────────────────────────────────────────────────

const fontSizeOptions: { value: FontSize; label: string; desc: string }[] = [
  { value: 'small', label: 'Küçük', desc: '13px temel boyut' },
  { value: 'medium', label: 'Orta', desc: '14px temel boyut (varsayılan)' },
  { value: 'large', label: 'Büyük', desc: '16px temel boyut' },
];

const cardStyleOptions: { value: CardStyle; label: string; desc: string; preview: string }[] = [
  { value: 'rounded', label: 'Yuvarlatılmış', desc: 'Yumuşak kenarlar (varsayılan)', preview: 'rounded-xl' },
  { value: 'sharp', label: 'Keskin', desc: 'Düz köşeler', preview: 'rounded-none' },
  { value: 'pill', label: 'Kapsül', desc: 'Tam yuvarlatılmış', preview: 'rounded-2xl' },
];

const colorAccentOptions: { value: ColorAccent; label: string; color: string; ring: string }[] = [
  { value: 'indigo', label: 'İndigo', color: 'bg-indigo-500', ring: 'ring-indigo-500' },
  { value: 'blue', label: 'Mavi', color: 'bg-blue-500', ring: 'ring-blue-500' },
  { value: 'emerald', label: 'Yeşil', color: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { value: 'rose', label: 'Pembe', color: 'bg-rose-500', ring: 'ring-rose-500' },
  { value: 'amber', label: 'Amber', color: 'bg-amber-500', ring: 'ring-amber-500' },
  { value: 'violet', label: 'Mor', color: 'bg-violet-500', ring: 'ring-violet-500' },
  { value: 'cyan', label: 'Cam Göbeği', color: 'bg-cyan-500', ring: 'ring-cyan-500' },
  { value: 'orange', label: 'Turuncu', color: 'bg-orange-500', ring: 'ring-orange-500' },
];

const sidebarStyleOptions: { value: SidebarStyle; label: string; desc: string }[] = [
  { value: 'full', label: 'Tam Genişlik', desc: 'Menü ikon + yazı gösterir' },
  { value: 'compact', label: 'Kompakt', desc: 'Daha dar menü, kısa etiketler' },
  { value: 'icons', label: 'Sadece İkon', desc: 'Sadece ikonlar (hover ile açılır)' },
];

const tableDensityOptions: { value: TableDensity; label: string; desc: string }[] = [
  { value: 'comfortable', label: 'Rahat', desc: 'Satır arası geniş boşluk (varsayılan)' },
  { value: 'compact', label: 'Sıkışık', desc: 'Minimum boşluk, daha çok veri' },
  { value: 'spacious', label: 'Ferah', desc: 'Geniş satır aralığı' },
];

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export const AppearanceSettingsTab: React.FC = () => {
  const { appearanceSettings, updateAppearanceSettings } = useStore();
  const [form, setForm] = useState<AppearanceSettings>({ ...appearanceSettings });

  const handleSave = () => {
    updateAppearanceSettings(form);
    toast.success('Görünüm ayarları kaydedildi.');
  };

  const handleReset = () => {
    const defaults: AppearanceSettings = {
      fontSize: 'medium',
      cardStyle: 'rounded',
      colorAccent: 'indigo',
      sidebarStyle: 'full',
      tableDensity: 'comfortable',
      animationsEnabled: true,
      showBreadcrumbs: true,
      transparentSidebar: false,
      compactHeader: false,
      showStatsCards: true,
    };
    setForm(defaults);
    updateAppearanceSettings(defaults);
    toast.success('Görünüm ayarları varsayılana sıfırlandı.');
  };

  const ToggleSwitch = ({
    checked,
    onChange,
    label,
    description,
  }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description?: string;
  }) => (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
      <div>
        <p className="font-medium text-slate-900 dark:text-white text-sm">{label}</p>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600" />
      </label>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="h-5 w-5 text-indigo-500" />
            Görünüm Ayarları
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Uygulamanın görsel tercihlerini ve arayüz düzenini özelleştirin.
          </p>
        </div>
        <Button type="button" variant="ghost" onClick={handleReset} className="gap-2 text-sm">
          <RotateCcw className="h-4 w-4" />
          Sıfırla
        </Button>
      </div>

      {/* ─── ACCENT COLOR ─── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Vurgu Rengi</h3>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {colorAccentOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm((p) => ({ ...p, colorAccent: opt.value }))}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                form.colorAccent === opt.value
                  ? `border-slate-900 dark:border-white shadow-lg scale-105`
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-full ${opt.color} shadow-md ${form.colorAccent === opt.value ? 'ring-2 ring-offset-2 ' + opt.ring : ''}`} />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <hr className="border-slate-200/60 dark:border-slate-800/60" />

      {/* ─── FONT SIZE ─── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Yazı Boyutu</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {fontSizeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm((p) => ({ ...p, fontSize: opt.value }))}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all ${
                form.fontSize === opt.value
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <span
                className={`font-bold ${
                  opt.value === 'small' ? 'text-xs' : opt.value === 'medium' ? 'text-sm' : 'text-base'
                } ${form.fontSize === opt.value ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}
              >
                Aa
              </span>
              <span className={`text-xs font-medium ${form.fontSize === opt.value ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                {opt.label}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-500">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <hr className="border-slate-200/60 dark:border-slate-800/60" />

      {/* ─── CARD STYLE ─── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layout className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Kart Stili</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {cardStyleOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm((p) => ({ ...p, cardStyle: opt.value }))}
              className={`flex flex-col items-center gap-2 p-4 border-2 transition-all ${opt.preview} ${
                form.cardStyle === opt.value
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {/* Mini preview card */}
              <div className={`w-full h-10 bg-slate-200 dark:bg-slate-700 ${opt.preview} flex items-center px-3`}>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
                  <div className="w-6 h-2 rounded bg-slate-400 dark:bg-slate-500" />
                </div>
              </div>
              <span className={`text-xs font-medium ${form.cardStyle === opt.value ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                {opt.label}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-500">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <hr className="border-slate-200/60 dark:border-slate-800/60" />

      {/* ─── SIDEBAR STYLE ─── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layout className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Kenar Menü Stili</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {sidebarStyleOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm((p) => ({ ...p, sidebarStyle: opt.value }))}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                form.sidebarStyle === opt.value
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {/* Mini sidebar preview */}
              <div className="w-full h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex overflow-hidden">
                <div
                  className={`bg-slate-300 dark:bg-slate-600 flex flex-col items-center justify-center gap-1 p-1 ${
                    opt.value === 'full' ? 'w-1/3' : opt.value === 'compact' ? 'w-1/4' : 'w-[14%]'
                  }`}
                >
                  <div className="w-2 h-2 rounded-sm bg-slate-400 dark:bg-slate-500" />
                  {opt.value !== 'icons' && <div className="w-4 h-1 rounded bg-slate-400 dark:bg-slate-500" />}
                </div>
                <div className="flex-1 p-1.5">
                  <div className="w-full h-2 rounded bg-slate-200 dark:bg-slate-700 mb-1" />
                  <div className="w-2/3 h-2 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
              <span className={`text-xs font-medium ${form.sidebarStyle === opt.value ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                {opt.label}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-500">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <hr className="border-slate-200/60 dark:border-slate-800/60" />

      {/* ─── TABLE DENSITY ─── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Table className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Tablo Yoğunluğu</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {tableDensityOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm((p) => ({ ...p, tableDensity: opt.value }))}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                form.tableDensity === opt.value
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {/* Mini table preview */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                {[1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className={`flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 last:border-0 px-2 ${
                      opt.value === 'compact' ? 'py-0.5' : opt.value === 'spacious' ? 'py-2' : 'py-1'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <div className="flex-1 h-1.5 rounded bg-slate-300 dark:bg-slate-600" />
                    <div className="w-4 h-1.5 rounded bg-slate-300 dark:bg-slate-600" />
                  </div>
                ))}
              </div>
              <span className={`text-xs font-medium ${form.tableDensity === opt.value ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                {opt.label}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-500">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <hr className="border-slate-200/60 dark:border-slate-800/60" />

      {/* ─── TOGGLES ─── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Ek Seçenekler</h3>
        </div>
        <div className="space-y-2">
          <ToggleSwitch
            label="Animasyonlar"
            description="Sayfa geçişleri ve etkileşim animasyonlarını aç/kapat"
            checked={form.animationsEnabled}
            onChange={(checked) => setForm((p) => ({ ...p, animationsEnabled: checked }))}
          />
          <ToggleSwitch
            label="Breadcrumb Navigasyon"
            description="Sayfa üstünde konum izini göster"
            checked={form.showBreadcrumbs}
            onChange={(checked) => setForm((p) => ({ ...p, showBreadcrumbs: checked }))}
          />
          <ToggleSwitch
            label="Şeffaf Kenar Menü"
            description="Kenar menüde cam efekti (blur) uygula"
            checked={form.transparentSidebar}
            onChange={(checked) => setForm((p) => ({ ...p, transparentSidebar: checked }))}
          />
          <ToggleSwitch
            label="Kompakt Başlık"
            description="Sayfa başlık alanını daha küçük göster"
            checked={form.compactHeader}
            onChange={(checked) => setForm((p) => ({ ...p, compactHeader: checked }))}
          />
          <ToggleSwitch
            label="İstatistik Kartları"
            description="Dashboard ve liste sayfalarında özet kartlarını göster"
            checked={form.showStatsCards}
            onChange={(checked) => setForm((p) => ({ ...p, showStatsCards: checked }))}
          />
        </div>
      </div>

      {/* ─── PREVIEW ─── */}
      <div className="p-5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Eye className="h-3.5 w-3.5" />
          Önizleme
        </h4>
        <div className="flex gap-4">
          {/* Mini preview card */}
          <div
            className={`flex-1 p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm ${
              form.cardStyle === 'sharp' ? 'rounded-none' : form.cardStyle === 'pill' ? 'rounded-2xl' : 'rounded-xl'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${colorAccentOptions.find((c) => c.value === form.colorAccent)?.color || 'bg-indigo-500'}`} />
              <span
                className={`font-semibold text-slate-900 dark:text-white ${
                  form.fontSize === 'small' ? 'text-xs' : form.fontSize === 'large' ? 'text-base' : 'text-sm'
                }`}
              >
                Örnek Kart Başlığı
              </span>
            </div>
            <p
              className={`text-slate-500 dark:text-slate-400 ${
                form.fontSize === 'small' ? 'text-[10px]' : form.fontSize === 'large' ? 'text-sm' : 'text-xs'
              }`}
            >
              Bu, seçtiğiniz ayarlara göre görünümün nasıl değişeceğini gösteren bir önizlemedir.
            </p>
          </div>
          {/* Mini stats card */}
          {form.showStatsCards && (
            <div
              className={`w-32 p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center justify-center ${
                form.cardStyle === 'sharp' ? 'rounded-none' : form.cardStyle === 'pill' ? 'rounded-2xl' : 'rounded-xl'
              }`}
            >
              <span className={`text-2xl font-bold ${form.colorAccent === 'indigo' ? 'text-indigo-600' : form.colorAccent === 'blue' ? 'text-blue-600' : form.colorAccent === 'emerald' ? 'text-emerald-600' : form.colorAccent === 'rose' ? 'text-rose-600' : form.colorAccent === 'amber' ? 'text-amber-600' : form.colorAccent === 'violet' ? 'text-violet-600' : form.colorAccent === 'cyan' ? 'text-cyan-600' : 'text-orange-600'}`}>
                42
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Toplam Kayıt</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── SAVE BUTTON ─── */}
      <div className="pt-4 flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Varsayılana Dön
        </Button>
        <Button type="button" onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Görünüm Ayarlarını Kaydet
        </Button>
      </div>
    </div>
  );
};
