import { useState, useEffect, useCallback } from 'react';
import { browser, waitForBrowser } from '../utils/browserApi';
import type { Permissions } from 'webextension-polyfill';

export const useHostPermission = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  // Check if we already have host permissions
  const checkPermission = useCallback(async () => {
    try {
      const browser = await waitForBrowser();
      const result = await browser.permissions.contains({
        origins: ['https://*/*', 'http://*/*']
      });
      setHasPermission(result);
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
      const browser = await waitForBrowser();
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
    const handleAdded = (permissions: Permissions.Permissions) => {
      if (permissions.origins?.some(origin =>
        origin === 'https://*/*' || origin === 'http://*/*' || origin === '<all_urls>'
      )) {
        setHasPermission(true);
      }
    };

    const handleRemoved = (permissions: Permissions.Permissions) => {
      if (permissions.origins?.some(origin =>
        origin === 'https://*/*' || origin === 'http://*/*' || origin === '<all_urls>'
      )) {
        checkPermission();
      }
    };

    browser.permissions.onAdded.addListener(handleAdded);
    browser.permissions.onRemoved.addListener(handleRemoved);

    return () => {
      browser.permissions.onAdded.removeListener(handleAdded);
      browser.permissions.onRemoved.removeListener(handleRemoved);
    };
  }, [checkPermission]);

  return {
    hasPermission,
    isRequesting,
    requestPermission,
    checkPermission
  };
};
