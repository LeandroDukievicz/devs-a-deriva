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

const themePalettes: Record<ThemeKey, {
  bg: [number, number, number];
  star: [number, number, number];
  accent: [number, number, number];
  text: [number, number, number];
}> = {
  'orbita-baixa': {
    bg: [2, 11, 24],
    star: [0, 212, 232],
    accent: [232, 0, 212],
    text: [232, 244, 248],
  },
  'espaco-profundo': {
    bg: [0, 0, 0],
    star: [0, 122, 143],
    accent: [148, 0, 184],
    text: [232, 244, 248],
  },
  'limbo': {
    bg: [255, 255, 255],
    star: [0, 0, 0],
    accent: [0, 0, 0],
    text: [0, 0, 0],
  },
};

const starAlphaVars = [5, 8, 10, 16, 18, 22, 25, 40, 45, 70, 90] as const;
const accentAlphaVars = [6, 8, 14, 16, 18, 20, 40, 60] as const;
const bgAlphaVars = [70, 88, 90, 95] as const;

function rgb([r, g, b]: [number, number, number], alpha?: number): string {
  return alpha === undefined ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${alpha})`;
}

function mix(
  [r, g, b]: [number, number, number],
  [mr, mg, mb]: [number, number, number],
  amount: number,
): string {
  const inverse = 1 - amount;
  return rgb([
    Math.round(r * amount + mr * inverse),
    Math.round(g * amount + mg * inverse),
    Math.round(b * amount + mb * inverse),
  ]);
}

function setThemeVariables(key: ThemeKey): void {
  const palette = themePalettes[key];
  const root = document.documentElement;

  root.style.setProperty('--color-bg', rgb(palette.bg));
  root.style.setProperty('--color-star', rgb(palette.star));
  root.style.setProperty('--color-accent', rgb(palette.accent));
  root.style.setProperty('--color-text', rgb(palette.text));
  root.style.setProperty('--color-star-light', mix(palette.star, [255, 255, 255], 0.7));
  root.style.setProperty('--color-star-dark', mix(palette.star, [0, 0, 0], 0.7));

  starAlphaVars.forEach((value) => {
    root.style.setProperty(`--color-star-${String(value).padStart(2, '0')}`, rgb(palette.star, value / 100));
  });

  accentAlphaVars.forEach((value) => {
    root.style.setProperty(`--color-accent-${String(value).padStart(2, '0')}`, rgb(palette.accent, value / 100));
  });

  bgAlphaVars.forEach((value) => {
    root.style.setProperty(`--color-bg-${value}`, rgb(palette.bg, value / 100));
  });
}

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
  setThemeVariables(key);
  (window as Record<string, unknown>)['__bgColor'] = config.bg;
  sessionStorage.setItem(THEME_STORAGE_KEY, key);
}

/**
 * Read the persisted theme from localStorage, falling back to the default.
 *
 * Must only be called in a browser context.
 */
export function getSavedTheme(): ThemeKey {
  try {
    const saved = sessionStorage.getItem(THEME_STORAGE_KEY) as ThemeKey | null;
    if (saved && Object.prototype.hasOwnProperty.call(themes, saved)) return saved;
  } catch {
    // localStorage unavailable (e.g. private mode restrictions)
  }
  return DEFAULT_THEME;
}
