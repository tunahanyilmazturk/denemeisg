import { useEffect } from 'react';
import { useStore, ColorAccent, FontSize } from '../store/useStore';

// Color accent mapping to HSL values for Tailwind-compatible CSS variables
const ACCENT_COLORS: Record<ColorAccent, { h: number; s: number; l: number }> = {
  indigo:  { h: 239, s: 84, l: 67 },
  blue:    { h: 217, s: 91, l: 60 },
  emerald: { h: 160, s: 84, l: 39 },
  rose:    { h: 350, s: 89, l: 60 },
  amber:   { h: 38,  s: 92, l: 50 },
  violet:  { h: 258, s: 90, l: 66 },
  cyan:    { h: 188, s: 94, l: 43 },
  orange:  { h: 25,  s: 95, l: 53 },
};

const FONT_SIZES: Record<FontSize, string> = {
  small: '13px',
  medium: '14px',
  large: '16px',
};

export const useAppearance = () => {
  const { appearanceSettings } = useStore();

  useEffect(() => {
    const root = document.documentElement;
    const accent = ACCENT_COLORS[appearanceSettings.colorAccent];

    // ─── Accent Color ───
    // Set CSS custom properties for the accent color
    root.style.setProperty('--accent-h', String(accent.h));
    root.style.setProperty('--accent-s', `${accent.s}%`);
    root.style.setProperty('--accent-l', `${accent.l}%`);

    // ─── Font Size ───
    root.style.setProperty('--base-font-size', FONT_SIZES[appearanceSettings.fontSize]);

  }, [appearanceSettings]);
};
