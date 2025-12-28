import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // 背景色
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgHover: string;
  bgInput: string;
  bgMessage: string;
  bgUserMessage: string;
  bgCode: string;
  bgCodeBlock: string;
  bgModelList: string;
  bgSelected: string;
  bgConfirm: string;
  bgConfirmBorder: string;

  // 文本色
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textUserMessage: string;
  textConfirm: string;

  // 边框色
  borderPrimary: string;
  borderSecondary: string;
  borderInput: string;
  borderFocus: string;

  // 主题色
  primary: string;
  primaryHover: string;
  primaryLight: string;

  // 功能色
  danger: string;
  dangerHover: string;
  dangerLight: string;
  dangerBorder: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoHover: string;
  infoLight: string;

  // 滚动条
  scrollbarTrack: string;
  scrollbarThumb: string;
  scrollbarThumbHover: string;

  // 阴影
  shadowLight: string;
  shadowMedium: string;
}

const lightTheme: ThemeColors = {
  // 背景色
  bgPrimary: '#ffffff',
  bgSecondary: '#f9fafb',
  bgTertiary: '#f3f4f6',
  bgHover: '#e5e7eb',
  bgInput: '#ffffff',
  bgMessage: '#f3f4f6',
  bgUserMessage: '#4CAF50',
  bgCode: 'rgba(0,0,0,0.1)',
  bgCodeBlock: '#1f2937',
  bgModelList: '#ffffff',
  bgSelected: '#ecfdf5',
  bgConfirm: '#fef2f2',
  bgConfirmBorder: '#fecaca',

  // 文本色
  textPrimary: '#1f2937',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textDisabled: '#9ca3af',
  textUserMessage: '#ffffff',
  textConfirm: '#dc2626',

  // 边框色
  borderPrimary: '#d1d5db',
  borderSecondary: '#e5e7eb',
  borderInput: '#d1d5db',
  borderFocus: '#4CAF50',

  // 主题色
  primary: '#4CAF50',
  primaryHover: '#45a049',
  primaryLight: 'rgba(76, 175, 80, 0.1)',

  // 功能色
  danger: '#ef4444',
  dangerHover: '#dc2626',
  dangerLight: '#fef2f2',
  dangerBorder: '#fecaca',
  success: '#10b981',
  successLight: '#ecfdf5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  info: '#2563eb',
  infoHover: '#1d4ed8',
  infoLight: '#dbeafe',

  // 滚动条
  scrollbarTrack: '#f1f1f1',
  scrollbarThumb: '#888',
  scrollbarThumbHover: '#555',

  // 阴影
  shadowLight: 'rgba(0, 0, 0, 0.1)',
  shadowMedium: 'rgba(0, 0, 0, 0.15)',
};

const darkTheme: ThemeColors = {
  // 背景色
  bgPrimary: '#1a1a1a',
  bgSecondary: '#242424',
  bgTertiary: '#2d2d2d',
  bgHover: '#3d3d3d',
  bgInput: '#2d2d2d',
  bgMessage: '#2d2d2d',
  bgUserMessage: '#3d8b40',
  bgCode: 'rgba(255,255,255,0.1)',
  bgCodeBlock: '#0d0d0d',
  bgModelList: '#242424',
  bgSelected: '#1a3d1c',
  bgConfirm: '#2d1a1a',
  bgConfirmBorder: '#5c2626',

  // 文本色
  textPrimary: '#f3f4f6',
  textSecondary: '#d1d5db',
  textMuted: '#9ca3af',
  textDisabled: '#6b7280',
  textUserMessage: '#ffffff',
  textConfirm: '#f87171',

  // 边框色
  borderPrimary: '#4b5563',
  borderSecondary: '#374151',
  borderInput: '#4b5563',
  borderFocus: '#4CAF50',

  // 主题色
  primary: '#4CAF50',
  primaryHover: '#5cbf60',
  primaryLight: 'rgba(76, 175, 80, 0.2)',

  // 功能色
  danger: '#f87171',
  dangerHover: '#ef4444',
  dangerLight: '#2d1a1a',
  dangerBorder: '#5c2626',
  success: '#34d399',
  successLight: '#1a3d1c',
  warning: '#fbbf24',
  warningLight: '#3d3520',
  info: '#60a5fa',
  infoHover: '#3b82f6',
  infoLight: '#1a2d4d',

  // 滚动条
  scrollbarTrack: '#2d2d2d',
  scrollbarThumb: '#555',
  scrollbarThumbHover: '#777',

  // 阴影
  shadowLight: 'rgba(0, 0, 0, 0.3)',
  shadowMedium: 'rgba(0, 0, 0, 0.4)',
};

const THEME_STORAGE_KEY = 'chat-with-page-theme';

export const useTheme = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(false);

  // 获取系统主题偏好
  const getSystemPreference = useCallback((): boolean => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, []);

  // 根据主题模式计算实际是否为深色
  const computeIsDark = useCallback((mode: ThemeMode): boolean => {
    if (mode === 'system') {
      return getSystemPreference();
    }
    return mode === 'dark';
  }, [getSystemPreference]);

  // 初始化主题
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // 优先从 chrome.storage 加载
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          const result = await chrome.storage.local.get(THEME_STORAGE_KEY);
          if (result[THEME_STORAGE_KEY]) {
            const savedMode = result[THEME_STORAGE_KEY] as ThemeMode;
            setThemeMode(savedMode);
            setIsDark(computeIsDark(savedMode));
            return;
          }
        }
        // 备用：从 localStorage 加载
        const savedMode = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeMode(savedMode);
          setIsDark(computeIsDark(savedMode));
        } else {
          // 默认自动检测
          setIsDark(getSystemPreference());
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        setIsDark(getSystemPreference());
      }
    };
    loadTheme();
  }, [computeIsDark, getSystemPreference]);

  // 监听系统主题变化
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (themeMode === 'system') {
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // 保存并设置主题
  const saveTheme = useCallback(async (mode: ThemeMode) => {
    setThemeMode(mode);
    setIsDark(computeIsDark(mode));

    try {
      // 保存到 chrome.storage
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.set({ [THEME_STORAGE_KEY]: mode });
      }
      // 同时保存到 localStorage 作为备用
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, [computeIsDark]);

  // 获取当前主题颜色
  const colors: ThemeColors = isDark ? darkTheme : lightTheme;

  return {
    themeMode,
    setThemeMode: saveTheme,
    isDark,
    colors,
  };
};

export type { ThemeColors as Theme };
