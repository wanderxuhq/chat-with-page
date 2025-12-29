import { useEffect } from 'react';
import type { ThemeColors } from './useTheme';

export const useGlobalStyles = (colors: ThemeColors) => {
  useEffect(() => {
    // Create style element
    const style = document.createElement('style');
    style.id = 'global-theme-styles';
    style.textContent = `
      /* Hide sidebar global scrollbar */
      body {
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        background-color: ${colors.bgPrimary} !important;
        color: ${colors.textPrimary} !important;
        transition: background-color 0.2s, color 0.2s;
      }
      /* Custom chat history scrollbar */
      div::-webkit-scrollbar {
        width: 6px;
      }
      div::-webkit-scrollbar-track {
        background: ${colors.scrollbarTrack};
        border-radius: 3px;
      }
      div::-webkit-scrollbar-thumb {
        background: ${colors.scrollbarThumb};
        border-radius: 3px;
      }
      div::-webkit-scrollbar-thumb:hover {
        background: ${colors.scrollbarThumbHover};
      }
    `;

    // Remove old style element if exists
    const existingStyle = document.getElementById('global-theme-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Add to head
    document.head.appendChild(style);

    // Set body styles directly
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.backgroundColor = colors.bgPrimary;
    document.body.style.color = colors.textPrimary;

    // Cleanup function
    return () => {
      const styleEl = document.getElementById('global-theme-styles');
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, [colors]);
};
