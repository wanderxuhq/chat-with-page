import { useEffect } from 'react';
import type { ThemeColors } from './useTheme';

export const useGlobalStyles = (colors: ThemeColors) => {
  useEffect(() => {
    // 创建style元素
    const style = document.createElement('style');
    style.id = 'global-theme-styles';
    style.textContent = `
      /* 隐藏侧边栏全局滚动条 */
      body {
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        background-color: ${colors.bgPrimary} !important;
        color: ${colors.textPrimary} !important;
        transition: background-color 0.2s, color 0.2s;
      }
      /* 自定义对话记录区域滚动条 */
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

    // 移除旧的样式元素（如果存在）
    const existingStyle = document.getElementById('global-theme-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    // 添加到head
    document.head.appendChild(style);

    // 直接设置body样式
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.backgroundColor = colors.bgPrimary;
    document.body.style.color = colors.textPrimary;

    // 清理函数
    return () => {
      const styleEl = document.getElementById('global-theme-styles');
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, [colors]);
};
