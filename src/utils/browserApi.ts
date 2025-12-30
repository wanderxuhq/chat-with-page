// Browser API utility for cross-browser compatibility (Chrome/Firefox)
// Uses webextension-polyfill to provide a unified API

import * as browserPolyfill from 'webextension-polyfill';

// Wait for browser API to be ready
export const waitForBrowser = (): Promise<typeof browserPolyfill> => {
  return new Promise((resolve) => {
    const checkAPI = () => {
      if (browserPolyfill && browserPolyfill.runtime) {
        resolve(browserPolyfill);
      } else {
        setTimeout(checkAPI, 10);
      }
    };
    checkAPI();
  });
};

// Export the browser object directly for synchronous access
// Note: For critical initialization code, use waitForBrowser() instead
export const browser = browserPolyfill;

export default browser;
