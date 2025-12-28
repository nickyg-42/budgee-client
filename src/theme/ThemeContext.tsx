import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeId, ThemePalette } from './types';
import { getStaticPalette } from './palettes';
import { createMonochromePalette } from './monochrome';
import { PersonalFinanceCategory } from '../constants/personalFinanceCategories';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

type Persisted = string;

interface ThemeContextValue {
  themeId: ThemeId;
  baseColor?: string | null;
  palette: ThemePalette;
  applyTheme: (id: ThemeId, opts?: { baseColor?: string }) => Promise<void>;
  getCategoryColor: (cat: string) => string;
  semantic: ThemePalette['semantic'];
  progress: ThemePalette['progress'];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const parsePersisted = (s: Persisted): { id: ThemeId; baseColor?: string | null } => {
  if (!s) return { id: 'default', baseColor: null };
  if (s.startsWith('monochrome:')) {
    const hex = s.split(':')[1] || '';
    return { id: 'monochrome', baseColor: hex || null };
  }
  if (s === 'default' || s === 'earth' || s === 'pastel' || s === 'slate' || s === 'aurora') return { id: s as any, baseColor: null };
  return { id: 'default', baseColor: null };
};

const serializePersisted = (id: ThemeId, baseColor?: string | null): Persisted => {
  if (id === 'monochrome') return `monochrome:${String(baseColor || '').trim()}`;
  return id;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const initialPersisted = typeof localStorage !== 'undefined' ? (localStorage.getItem('colorTheme') || '') : '';
  const initialParsed = parsePersisted(initialPersisted);
  const [themeId, setThemeId] = useState<ThemeId>(initialParsed.id);
  const [baseColor, setBaseColor] = useState<string | null>(initialParsed.baseColor || null);

  const palette: ThemePalette = useMemo(() => {
    if (themeId === 'monochrome') {
      const hex = baseColor || '#4b5563';
      return createMonochromePalette(hex);
    }
    return getStaticPalette(themeId as any);
  }, [themeId, baseColor]);

  useEffect(() => {
    const persisted = serializePersisted(themeId, baseColor);
    try {
      localStorage.setItem('colorTheme', persisted);
    } catch {}
  }, [themeId, baseColor]);

  useEffect(() => {
    const s = String((user as any)?.theme || '');
    if (s) {
      const p = parsePersisted(s);
      setThemeId(p.id);
      setBaseColor(p.baseColor || null);
      try {
        localStorage.setItem('colorTheme', s);
      } catch {}
    }
  }, [user]);

  const applyTheme = async (id: ThemeId, opts?: { baseColor?: string }) => {
    const nextBase = opts?.baseColor || null;
    setThemeId(id);
    setBaseColor(nextBase);
    const persisted = serializePersisted(id, nextBase);
    try {
      localStorage.setItem('colorTheme', persisted);
    } catch {}
    try {
      const uid = (user as any)?.id;
      if (uid && uid > 0) {
        await apiService.updateUser({ theme: persisted });
      }
    } catch {}
  };

  const getCategoryColor = (cat: string) => {
    const key = String(cat || 'OTHER') as PersonalFinanceCategory;
    return palette.categories[key] || palette.semantic.neutral;
  };

  const value: ThemeContextValue = {
    themeId,
    baseColor,
    palette,
    applyTheme,
    getCategoryColor,
    semantic: palette.semantic,
    progress: palette.progress,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};
