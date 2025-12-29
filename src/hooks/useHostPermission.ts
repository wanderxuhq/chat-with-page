import { useState, useEffect, useCallback } from 'react';

export const useHostPermission = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  // Check if we already have host permissions
  const checkPermission = useCallback(async () => {
    try {
      const result = await chrome.permissions.contains({
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
      const granted = await chrome.permissions.request({
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
    const handleAdded = (permissions: chrome.permissions.Permissions) => {
      if (permissions.origins?.some(origin =>
        origin === 'https://*/*' || origin === 'http://*/*' || origin === '<all_urls>'
      )) {
        setHasPermission(true);
      }
    };

    const handleRemoved = (permissions: chrome.permissions.Permissions) => {
      if (permissions.origins?.some(origin =>
        origin === 'https://*/*' || origin === 'http://*/*' || origin === '<all_urls>'
      )) {
        checkPermission();
      }
    };

    chrome.permissions.onAdded.addListener(handleAdded);
    chrome.permissions.onRemoved.addListener(handleRemoved);

    return () => {
      chrome.permissions.onAdded.removeListener(handleAdded);
      chrome.permissions.onRemoved.removeListener(handleRemoved);
    };
  }, [checkPermission]);

  return {
    hasPermission,
    isRequesting,
    requestPermission,
    checkPermission
  };
};
