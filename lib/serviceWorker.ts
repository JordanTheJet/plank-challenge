/**
 * Service Worker Registration
 * Handles registration and lifecycle of service worker
 */

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

/**
 * Register service worker
 */
export function registerServiceWorker(config?: ServiceWorkerConfig): void {
  // Only register in production and if service workers are supported
  if (process.env.NODE_ENV !== 'production') {
    console.log('[SW] Service worker disabled in development');
    return;
  }

  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported');
    return;
  }

  // Register on page load
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      console.log('[SW] Service worker registered:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New service worker available
              console.log('[SW] New service worker available');
              config?.onUpdate?.(registration);
            } else {
              // Service worker installed for the first time
              console.log('[SW] Service worker installed');
              config?.onSuccess?.(registration);
            }
          }
        });
      });
    } catch (error) {
      console.error('[SW] Service worker registration failed:', error);
      config?.onError?.(error as Error);
    }
  });

  // Handle service worker messages
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('[SW] Message from service worker:', event.data);
  });
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (registration) {
      const success = await registration.unregister();
      console.log('[SW] Service worker unregistered:', success);
      return success;
    }

    return false;
  } catch (error) {
    console.error('[SW] Failed to unregister service worker:', error);
    return false;
  }
}

/**
 * Check if service worker is active
 */
export function isServiceWorkerActive(): boolean {
  return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
}

/**
 * Update service worker
 */
export async function updateServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (registration) {
      await registration.update();
      console.log('[SW] Service worker update triggered');
    }
  } catch (error) {
    console.error('[SW] Failed to update service worker:', error);
  }
}

/**
 * Clear all caches
 */
export async function clearCaches(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error);
  }
}

/**
 * Send message to service worker
 */
export function sendMessageToServiceWorker(message: any): void {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    return;
  }

  navigator.serviceWorker.controller.postMessage(message);
}
