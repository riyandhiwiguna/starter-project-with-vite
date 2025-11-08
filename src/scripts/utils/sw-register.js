export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });

    console.log('✅ Service Worker registered:', registration.scope);

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('🔄 New Service Worker installing...');
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('✨ New Service Worker available! Refresh to update.');
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
}

export function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return Promise.resolve();
  }

  return navigator.serviceWorker.getRegistrations().then((registrations) => {
    return Promise.all(
      registrations.map((registration) => registration.unregister())
    );
  });
}