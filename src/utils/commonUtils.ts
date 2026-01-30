// Common utility functions shared across the application

/**
 * Generate a hash for the page URL to avoid special characters in storage keys
 */
export const getPageHash = (url: string): string => {
  return `page_${url.split('://').join('_').split('.').join('_').split('/').join('_').split('?').join('_').split('&').join('_').split('#').join('_')}`;
};

/**
 * Get display title for URL (domain + path)
 */
export const getUrlDisplayTitle = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname === '/' ? '' : urlObj.pathname;
    return `${urlObj.hostname}${path}`.substring(0, 50);
  } catch {
    return url.substring(0, 50);
  }
};
