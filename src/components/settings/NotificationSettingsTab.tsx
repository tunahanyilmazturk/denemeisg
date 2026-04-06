import React from 'react';
import { useStore, NotificationSettings } from '../../store/useStore';
import { Bell, Mail, AlertTriangle, GraduationCap, HardHat, ShieldAlert, Clock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface NotificationCategory {
  id: keyof NotificationSettings;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const notificationCategories: NotificationCategory[] = [
  {
    id: 'emailNotifications',
    label: 'E-posta Bildirimleri',
    description: 'Tüm sistem bildirimlerini e-posta ile al',
    icon: Mail,
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'incidentAlerts',
    label: 'Olay/Kaza Bildirimleri',
    description: 'Yeni olay veya kaza kaydı oluşturulduğunda anında bildirim al',
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
  },
  {
    id: 'trainingReminders',
    label: 'Eğitim Hatırlatmaları',
    description: 'Yaklaşan eğitimler için önceden hatırlatma al',
    icon: GraduationCap,
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'ppeExpiryAlerts',
    label: 'KKD Sona Erme Uyarıları',
    description: 'KKD zimmet süreleri dolmak üzereyken bildirim al',
    icon: HardHat,
    color: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'riskUpdates',
    label: 'Risk Güncellemeleri',
    description: 'Risk seviyesi değişikliklerinde ve yeni risk eklendiğinde bildir',
    icon: ShieldAlert,
    color: 'text-orange-600 dark:text-orange-400',
  },
  {
    id: 'dailySummary',
    label: 'Günlük Özet',
    description: 'Her gün sonu sistem aktivitelerinin özetini e-posta ile al',
    icon: Clock,
    color: 'text-indigo-600 dark:text-indigo-400',
  },
];

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600" />
    </label>
  );
}

export const NotificationSettingsTab: React.FC = () => {
  const { notificationSettings, updateNotificationSettings } = useStore();

  const handleToggle = (key: keyof NotificationSettings, value: boolean) => {
    updateNotificationSettings({ [key]: value });
    toast.success(value ? 'Bildirim açıldı' : 'Bildirim kapatıldı', {
      icon: value ? '🔔' : '🔕',
      duration: 2000,
    });
  };

  const enabledCount = Object.values(notificationSettings).filter(Boolean).length;
  const totalCount = notificationCategories.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-500" />
            Bildirim Tercihleri
          </h2>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {enabledCount}/{totalCount} Aktif
            </span>
          </div>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Hangi durumlarda bildirim almak istediğinizi seçin. Değişiklikler anında uygulanır.
        </p>
      </div>

      {/* Master Email Toggle - Highlighted */}
      <div className="p-5 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-900/10 dark:to-blue-900/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                E-posta Bildirimleri
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Tüm bildirimler e-posta ile gönderilir. Kapalıysa sadece uygulama içi bildirimler aktif olur.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-indigo-200 dark:border-indigo-700">
                <div className={`w-2 h-2 rounded-full ${notificationSettings.emailNotifications ? 'bg-emerald-500' : 'bg-slate-400'} animate-pulse`} />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {notificationSettings.emailNotifications ? 'E-posta aktif' : 'E-posta kapalı'}
                </span>
              </div>
            </div>
          </div>
          <ToggleSwitch
            checked={notificationSettings.emailNotifications}
            onChange={(checked) => handleToggle('emailNotifications', checked)}
          />
        </div>
      </div>

      {/* Notification Categories Grid */}
      <div className="grid grid-cols-1 gap-4">
        {notificationCategories.slice(1).map((category) => {
          const Icon = category.icon;
          const isEnabled = notificationSettings[category.id];

          return (
            <div
              key={category.id}
              className={`p-4 rounded-xl border transition-all ${
                isEnabled
                  ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-900/10'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/30'
              } hover:shadow-sm`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`p-2 rounded-lg flex-shrink-0 ${
                      isEnabled
                        ? 'bg-white dark:bg-slate-800 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-700'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isEnabled ? category.color : 'text-slate-400'}`} />
                  </div>
                  <div className="min-w-0">
                    <h3
                      className={`font-medium mb-0.5 ${
                        isEnabled
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {category.label}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={isEnabled}
                  onChange={(checked) => handleToggle(category.id, checked)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <p className="font-medium">Bildirim nasıl çalışır?</p>
            <ul className="space-y-1 text-xs list-disc list-inside">
              <li>Bildirİmler belirlediğiniz e-posta adresine anında gönderilir</li>
              <li>E-posta kapalıyken bile uygulama içi bildirimler aktif kalır</li>
              <li>Günlük özet sabah 09:00'da gönderilir</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
