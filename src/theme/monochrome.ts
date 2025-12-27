import { PERSONAL_FINANCE_CATEGORIES, PersonalFinanceCategory } from '../constants/personalFinanceCategories';
import { ThemePalette } from './types';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const hexToRgb = (hex: string) => {
  const s = hex.replace('#', '');
  const b = s.length === 3 ? s.split('').map(c => c + c).join('') : s;
  const num = parseInt(b, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const bl = num & 255;
  return { r, g, b: bl };
};

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (n: number) => {
    const s = clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
    return s;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToRgb = (h: number, s: number, l: number) => {
  h /= 360;
  s /= 100;
  l /= 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number;
  let g: number;
  let b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: r * 255, g: g * 255, b: b * 255 };
};

const hslToHex = (h: number, s: number, l: number) => {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
};

export const createMonochromePalette = (baseHex: string): ThemePalette => {
  const { r, g, b } = hexToRgb(baseHex);
  const base = rgbToHsl(r, g, b);
  const h = base.h;
  const s = clamp(base.s, 20, 80);
  const l = clamp(base.l, 30, 70);
  const light = clamp(l + 15, 0, 100);
  const dark = clamp(l - 15, 0, 100);
  const warnS = clamp(s + 10, 0, 100);
  const neutralS = 10;
  const neutralL = 60;
  const semantic = {
    good: hslToHex(h, s, light),
    bad: hslToHex(h, s, dark),
    warn: hslToHex(h, warnS, l),
    neutral: hslToHex(h, neutralS, neutralL),
  };
  const progress = {
    low: hslToHex(h, s, clamp(l + 10, 0, 100)),
    mid: hslToHex(h, s, l),
    high: hslToHex(h, s, clamp(l - 10, 0, 100)),
    over: semantic.bad,
  };
  const categories: Record<PersonalFinanceCategory, string> = {} as any;
  const steps = PERSONAL_FINANCE_CATEGORIES.length;
  const start = clamp(l - 20, 0, 100);
  const end = clamp(l + 20, 0, 100);
  const inc = steps > 1 ? (end - start) / (steps - 1) : 0;
  PERSONAL_FINANCE_CATEGORIES.forEach((cat, idx) => {
    const li = clamp(start + inc * idx, 0, 100);
    const sat = clamp(s + ((idx % 3) - 1) * 5, 0, 100);
    categories[cat] = hslToHex(h, sat, li);
  });
  return { semantic, progress, categories };
};

