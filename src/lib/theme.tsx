import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, ThemeSettings, UserTheme } from './supabase';
import { useAuth } from './auth';

type ThemeContextValue = {
  globalTheme: ThemeSettings | null;
  userTheme: UserTheme | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updateGlobalTheme: (settings: Partial<ThemeSettings>) => Promise<void>;
};

const DEFAULT_GLOBAL_THEME: ThemeSettings = {
  id: 1,
  site_name: 'Smart Academy',
  primary_color: '#4f46e5',
  accent_color: '#06b6d4',
  board_bg: '#030712',
  board_text: '#f8fafc',
};

const THEME_STORAGE_KEY = 'smart_academy_global_theme_v2';

const ThemeContext = createContext<ThemeContextValue>({
  globalTheme: DEFAULT_GLOBAL_THEME,
  userTheme: null,
  loading: true,
  refresh: async () => {},
  updateGlobalTheme: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [globalTheme, setGlobalTheme] = useState<ThemeSettings | null>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return DEFAULT_GLOBAL_THEME;
  });
  const [userTheme, setUserTheme] = useState<UserTheme | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await supabase.from('theme_settings').select('*').eq('id', 1).maybeSingle();
      if (data) {
        setGlobalTheme(data as ThemeSettings);
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(data));
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const loadUser = async (u: typeof user) => {
    if (!u) {
      setUserTheme(null);
      return;
    }
    try {
      const { data } = await supabase.from('user_themes').select('*').eq('user_id', u.id).maybeSingle();
      setUserTheme(data as UserTheme | null);
    } catch {
      /* ignore */
    }
  };

  const updateGlobalTheme = async (settings: Partial<ThemeSettings>) => {
    const updated: ThemeSettings = {
      ...(globalTheme || DEFAULT_GLOBAL_THEME),
      ...settings,
      id: 1,
    };
    setGlobalTheme(updated);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(updated));

    try {
      await supabase.from('theme_settings').upsert(updated, { onConflict: 'id' });
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadUser(user);
  }, [user, profile?.id]);

  const effective = userTheme ?? globalTheme;
  useEffect(() => {
    if (!effective) return;
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', effective.primary_color ?? '#4f46e5');
    root.style.setProperty('--theme-accent', effective.accent_color ?? '#06b6d4');
    root.style.setProperty('--board-bg', effective.board_bg ?? '#030712');
    root.style.setProperty('--board-text', effective.board_text ?? '#f8fafc');
    if (globalTheme?.site_name) {
      document.title = `${globalTheme.site_name} – Zamonaviy Ta'lim & IT Dasturlash Akademiyasi`;
    }
  }, [effective, userTheme, globalTheme]);

  return (
    <ThemeContext.Provider
      value={{
        globalTheme: globalTheme || DEFAULT_GLOBAL_THEME,
        userTheme,
        loading,
        refresh: load,
        updateGlobalTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
