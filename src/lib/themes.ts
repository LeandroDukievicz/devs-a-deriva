/**
 * Central theme registry.
 *
 * To add a new theme:
 *   1. Add an entry here.
 *   2. Add the matching CSS vars block in ThemeProvider.astro.
 *   3. Add the <button data-theme="key"> in Navbar.astro.
 */

export const THEME_STORAGE_KEY = 'dda-theme';

export type ThemeKey = 'orbita-baixa' | 'espaco-profundo' | 'limbo';

export interface ThemeConfig {
  /** Background color — also drives --color-bg CSS var. */
  bg: string;
  /** Display name shown in the UI. */
  label: string;
  /** Shows a confirmation modal before applying. */
  dangerous?: true;
}

export const themes: Record<ThemeKey, ThemeConfig> = {
  'orbita-baixa':    { bg: '#020b18', label: 'Órbita Baixa' },
  'espaco-profundo': { bg: '#000000', label: 'Espaço Profundo' },
  'limbo':           { bg: '#ffffff', label: 'Limbo', dangerous: true },
};

export const DEFAULT_THEME: ThemeKey = 'orbita-baixa';

/**
 * Apply a theme: sets data-theme on <html>, persists to localStorage,
 * and keeps window.__bgColor in sync for any legacy consumers.
 *
 * Must only be called in a browser context.
 */
export function applyTheme(key: ThemeKey): void {
  const config = themes[key];
  if (!config) return;
  document.documentElement.dataset.theme = key;
  (window as Record<string, unknown>)['__bgColor'] = config.bg;
  localStorage.setItem(THEME_STORAGE_KEY, key);
}

/**
 * Read the persisted theme from localStorage, falling back to the default.
 *
 * Must only be called in a browser context.
 */
export function getSavedTheme(): ThemeKey {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeKey | null;
    if (saved && Object.prototype.hasOwnProperty.call(themes, saved)) return saved;
  } catch {
    // localStorage unavailable (e.g. private mode restrictions)
  }
  return DEFAULT_THEME;
}
