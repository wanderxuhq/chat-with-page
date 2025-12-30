import { useState, useEffect, useCallback } from 'react';
import { waitForBrowser } from '../utils/browserApi';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Background colors
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

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textUserMessage: string;
  textConfirm: string;

  // Border colors
  borderPrimary: string;
  borderSecondary: string;
  borderInput: string;
  borderFocus: string;

  // Theme colors
  primary: string;
  primaryHover: string;
  primaryLight: string;

  // Functional colors
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

  // Scrollbar
  scrollbarTrack: string;
  scrollbarThumb: string;
  scrollbarThumbHover: string;

  // Shadow
  shadowLight: string;
  shadowMedium: string;
}

const lightTheme: ThemeColors = {
  // Background colors
  bgPrimary: '#ffffff',
  bgSecondary: '#f9fafb',
  bgTertiary: '#f3f4f6',
  bgHover: '#e5e7eb',
  bgInput: '#ffffff',
  bgMessage: '#f3f4f6',
  bgUserMessage: '#9333ea',
  bgCode: 'rgba(0,0,0,0.1)',
  bgCodeBlock: '#1f2937',
  bgModelList: '#ffffff',
  bgSelected: '#f3e8ff',
  bgConfirm: '#fef2f2',
  bgConfirmBorder: '#fecaca',

  // Text colors
  textPrimary: '#1f2937',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textDisabled: '#9ca3af',
  textUserMessage: '#ffffff',
  textConfirm: '#dc2626',

  // Border colors
  borderPrimary: '#d1d5db',
  borderSecondary: '#e5e7eb',
  borderInput: '#d1d5db',
  borderFocus: '#9333ea',

  // Theme colors - Purple
  primary: '#9333ea',
  primaryHover: '#7c3aed',
  primaryLight: 'rgba(147, 51, 234, 0.1)',

  // Functional colors
  danger: '#ef4444',
  dangerHover: '#dc2626',
  dangerLight: '#fef2f2',
  dangerBorder: '#fecaca',
  success: '#10b981',
  successLight: '#ecfdf5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  info: '#7c3aed',
  infoHover: '#6d28d9',
  infoLight: '#ede9fe',

  // Scrollbar
  scrollbarTrack: '#f1f1f1',
  scrollbarThumb: '#888',
  scrollbarThumbHover: '#555',

  // Shadow
  shadowLight: 'rgba(0, 0, 0, 0.1)',
  shadowMedium: 'rgba(0, 0, 0, 0.15)',
};

const darkTheme: ThemeColors = {
  // Background colors
  bgPrimary: '#1a1a1a',
  bgSecondary: '#242424',
  bgTertiary: '#2d2d2d',
  bgHover: '#3d3d3d',
  bgInput: '#2d2d2d',
  bgMessage: '#2d2d2d',
  bgUserMessage: '#7c3aed',
  bgCode: 'rgba(255,255,255,0.1)',
  bgCodeBlock: '#0d0d0d',
  bgModelList: '#242424',
  bgSelected: '#2d1f3d',
  bgConfirm: '#2d1a1a',
  bgConfirmBorder: '#5c2626',

  // Text colors
  textPrimary: '#f3f4f6',
  textSecondary: '#d1d5db',
  textMuted: '#9ca3af',
  textDisabled: '#6b7280',
  textUserMessage: '#ffffff',
  textConfirm: '#f87171',

  // Border colors
  borderPrimary: '#4b5563',
  borderSecondary: '#374151',
  borderInput: '#4b5563',
  borderFocus: '#a855f7',

  // Theme colors - Purple
  primary: '#a855f7',
  primaryHover: '#c084fc',
  primaryLight: 'rgba(168, 85, 247, 0.2)',

  // Functional colors
  danger: '#f87171',
  dangerHover: '#ef4444',
  dangerLight: '#2d1a1a',
  dangerBorder: '#5c2626',
  success: '#34d399',
  successLight: '#1a3d2d',
  warning: '#fbbf24',
  warningLight: '#3d3520',
  info: '#c4b5fd',
  infoHover: '#a78bfa',
  infoLight: '#2d1f3d',

  // Scrollbar
  scrollbarTrack: '#2d2d2d',
  scrollbarThumb: '#555',
  scrollbarThumbHover: '#777',

  // Shadow
  shadowLight: 'rgba(0, 0, 0, 0.3)',
  shadowMedium: 'rgba(0, 0, 0, 0.4)',
};

const THEME_STORAGE_KEY = 'chat-with-page-theme';

export const useTheme = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(false);

  // Get system theme preference
  const getSystemPreference = useCallback((): boolean => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, []);

  // Calculate actual dark mode based on theme mode
  const computeIsDark = useCallback((mode: ThemeMode): boolean => {
    if (mode === 'system') {
      return getSystemPreference();
    }
    return mode === 'dark';
  }, [getSystemPreference]);

  // Initialize theme
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Load from browser.storage.local
        const browser = await waitForBrowser();
        const result = await browser.storage.local.get(THEME_STORAGE_KEY);
        if (result[THEME_STORAGE_KEY]) {
          const savedMode = result[THEME_STORAGE_KEY] as ThemeMode;
          if (['light', 'dark', 'system'].includes(savedMode)) {
            setThemeMode(savedMode);
            setIsDark(computeIsDark(savedMode));
            return;
          }
        }
        // Default: auto-detect
        setIsDark(getSystemPreference());
      } catch (error) {
        console.error('Error loading theme:', error);
        setIsDark(getSystemPreference());
      }
    };
    loadTheme();
  }, [computeIsDark, getSystemPreference]);

  // Listen for system theme changes
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

  // Save and set theme
  const saveTheme = useCallback(async (mode: ThemeMode) => {
    setThemeMode(mode);
    setIsDark(computeIsDark(mode));

    try {
      // Save to browser.storage.local
      const browser = await waitForBrowser();
      await browser.storage.local.set({ [THEME_STORAGE_KEY]: mode });
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, [computeIsDark]);

  // Get current theme colors
  const colors: ThemeColors = isDark ? darkTheme : lightTheme;

  return {
    themeMode,
    setThemeMode: saveTheme,
    isDark,
    colors,
  };
};

export type { ThemeColors as Theme };
