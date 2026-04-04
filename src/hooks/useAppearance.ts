import { useEffect } from 'react';
import { useStore, ColorAccent, FontSize, CardStyle, TableDensity, SidebarStyle } from '../store/useStore';

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

const CARD_RADIUS: Record<CardStyle, string> = {
  rounded: '0.75rem',
  sharp: '0.125rem',
  pill: '1rem',
};

const TABLE_PADDING: Record<TableDensity, string> = {
  comfortable: '0.75rem',
  compact: '0.375rem',
  spacious: '1rem',
};

const SIDEBAR_WIDTH: Record<SidebarStyle, string> = {
  full: '16rem',
  compact: '12rem',
  icons: '4.5rem',
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

    // ─── Card Style ───
    root.style.setProperty('--card-radius', CARD_RADIUS[appearanceSettings.cardStyle]);

    // ─── Table Density ───
    root.style.setProperty('--table-padding', TABLE_PADDING[appearanceSettings.tableDensity]);

    // ─── Sidebar Style ───
    root.style.setProperty('--sidebar-width', SIDEBAR_WIDTH[appearanceSettings.sidebarStyle]);

    // ─── Animations ───
    if (appearanceSettings.animationsEnabled) {
      root.classList.remove('reduce-motion');
    } else {
      root.classList.add('reduce-motion');
    }

    // ─── Transparent Sidebar ───
    if (appearanceSettings.transparentSidebar) {
      root.classList.add('transparent-sidebar');
    } else {
      root.classList.remove('transparent-sidebar');
    }

    // ─── Compact Header ───
    if (appearanceSettings.compactHeader) {
      root.classList.add('compact-header');
    } else {
      root.classList.remove('compact-header');
    }

    // ─── Hide Stats Cards ───
    if (appearanceSettings.showStatsCards) {
      root.classList.remove('hide-stats');
    } else {
      root.classList.add('hide-stats');
    }

    // ─── Hide Breadcrumbs ───
    if (appearanceSettings.showBreadcrumbs) {
      root.classList.remove('hide-breadcrumbs');
    } else {
      root.classList.add('hide-breadcrumbs');
    }

    // ─── Sidebar icons mode ───
    if (appearanceSettings.sidebarStyle === 'icons') {
      root.classList.add('sidebar-icons-only');
    } else {
      root.classList.remove('sidebar-icons-only');
    }

    // ─── Sidebar compact mode ───
    if (appearanceSettings.sidebarStyle === 'compact') {
      root.classList.add('sidebar-compact');
    } else {
      root.classList.remove('sidebar-compact');
    }

  }, [appearanceSettings]);
};
