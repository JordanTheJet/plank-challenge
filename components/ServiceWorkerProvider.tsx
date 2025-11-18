'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/serviceWorker';

/**
 * Service Worker Provider
 * Registers and manages service worker lifecycle
 */
export default function ServiceWorkerProvider() {
  useEffect(() => {
    // Register service worker on mount
    registerServiceWorker({
      onSuccess: () => {
        console.log('Service worker registered successfully');
      },
      onUpdate: () => {
        console.log('Service worker updated - new version available');
        // Optionally show notification to user about update
      },
      onError: (error) => {
        console.error('Service worker registration failed:', error);
      },
    });
  }, []);

  // This component doesn't render anything
  return null;
}
