/**
 * Service Worker Registration & Offline Readiness Helper
 */

export interface SWRegistrationStatus {
  isRegistered: boolean;
  isOfflineReady: boolean;
  hasUpdate: boolean;
  error?: string;
}

export function registerServiceWorker(onUpdate?: () => void): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }

  // Only register in production or when explicitly enabled
  return navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      console.log('[DOT SW] Service Worker registered successfully:', registration.scope);

      // Check for updates
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('[DOT SW] New content is available; please refresh.');
              onUpdate?.();
            } else {
              console.log('[DOT SW] Content is cached for offline use.');
            }
          }
        };
      };

      return registration;
    })
    .catch((error) => {
      console.warn('[DOT SW] Service Worker registration failed:', error);
      return null;
    });
}

export function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(false);
  }

  return navigator.serviceWorker.ready.then((registration) => {
    return registration.unregister();
  });
}
