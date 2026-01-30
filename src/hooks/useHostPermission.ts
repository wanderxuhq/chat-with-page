import { useState, useEffect, useCallback } from 'react';

// Permissions type for compatibility
interface Permissions {
  origins?: string[];
  permissions?: string[];
};

export const useHostPermission = () => {
  const [loaded, setLoaded] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  // Check if we already have host permissions
  const checkPermission = useCallback(async () => {
    try {
      const result = await browser.permissions.contains({
        origins: ['https://*/*', 'http://*/*']
      });
      setHasPermission(result);

      setLoaded(true);
      return result;
    } catch (error) {
      console.error('Error checking permission:', error);
      setHasPermission(false);
      return false;
    }
  }, []);

  // Request host permissions
  const requestPermission = useCallback(async () => {
    setIsRequesting(true);
    try {
      const granted = await browser.permissions.request({
        origins: ['https://*/*', 'http://*/*']
      });
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    } finally {
      setIsRequesting(false);
    }
  }, []);

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Listen for permission changes
  useEffect(() => {
    const handleAdded = (permissions: Permissions) => {
      if (permissions.origins?.some(origin =>
        origin === 'https://*/*' || origin === 'http://*/*' || origin === '<all_urls>'
      )) {
        setHasPermission(true);
      }
    };

    const handleRemoved = (permissions: Permissions) => {
      if (permissions.origins?.some(origin =>
        origin === 'https://*/*' || origin === 'http://*/*' || origin === '<all_urls>'
      )) {
        checkPermission();
      }
    };

    // Check if permissions API is available
    if (browser.permissions && browser.permissions.onAdded && browser.permissions.onRemoved) {
      browser.permissions.onAdded.addListener(handleAdded);
      browser.permissions.onRemoved.addListener(handleRemoved);

      return () => {
        browser.permissions.onAdded.removeListener(handleAdded);
        browser.permissions.onRemoved.removeListener(handleRemoved);
      };
    }

    return () => {};
  }, [checkPermission]);

  return {
    loaded,
    hasPermission,
    isRequesting,
    requestPermission,
    checkPermission
  };
};
