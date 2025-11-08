const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
const API_BASE_URL = 'https://story-api.dicoding.dev/v1';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPushNotification(registration) {
  try {

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      console.log('✅ Subscribed to push notifications');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('User not logged in');
    }

    const response = await fetch(`${API_BASE_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: arrayBufferToBase64(subscription.getKey('auth'))
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to subscribe on server');
    }

    const result = await response.json();
    console.log('✅ Subscription saved to server:', result);

    localStorage.setItem('push-enabled', 'true');
    
    return { success: true, subscription };
  } catch (error) {
    console.error('❌ Push subscription failed:', error);
    return { success: false, error: error.message };
  }
}

export async function unsubscribeFromPushNotification(registration) {
  try {
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log('No active subscription');
      return { success: true };
    }

    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/notifications/subscribe`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        });
        console.log('✅ Unsubscribed from server');
      } catch (err) {
        console.warn('Failed to unsubscribe from server:', err);
      }
    }

    await subscription.unsubscribe();
    console.log('✅ Unsubscribed from push notifications');

    localStorage.removeItem('push-enabled');

    return { success: true };
  } catch (error) {
    console.error('❌ Unsubscribe failed:', error);
    return { success: false, error: error.message };
  }
}

export async function checkPushPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestPushPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  
  const permission = await Notification.requestPermission();
  return permission;
}

export function isPushEnabled() {
  return localStorage.getItem('push-enabled') === 'true';
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export async function testPushNotification() {
  if (!('Notification' in window)) {
    alert('Browser tidak mendukung notifikasi');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification('Test Notifikasi', {
      body: 'Ini adalah notifikasi test dari Dicoding Story!',
      icon: '/public/images/logo.png',
      vibrate: [200, 100, 200]
    });
  } else {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification('Test Notifikasi', {
        body: 'Notifikasi berhasil diaktifkan!',
        icon: '/public/images/logo.png'
      });
    }
  }
}