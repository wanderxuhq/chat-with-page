import { useEffect } from 'react';

export const useGlobalStyles = () => {
  useEffect(() => {
    // 创建style元素
    const style = document.createElement('style');
    style.textContent = `
      /* 隐藏侧边栏全局滚动条 */
      body {
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      /* 自定义对话记录区域滚动条 */
      div::-webkit-scrollbar {
        width: 6px;
      }
      div::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }
      div::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 3px;
      }
      div::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    `;
    // 添加到head
    document.head.appendChild(style);

    // 直接设置body样式
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    // 清理函数
    return () => {
      document.head.removeChild(style);
    };
  }, []);
};
