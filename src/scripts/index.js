import '../styles/styles.css';
import App from './pages/app.js';
import { registerServiceWorker } from './utils/sw-register.js';
import NotificationToggle from './components/notification-toggle.js';
import IDBHelper from './utils/idb-helper.js';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });

  await app.renderPage();

  const registration = await registerServiceWorker();
  if (registration) {
    console.log('✅ Service Worker registered successfully');

    await NotificationToggle.init(registration);
  }

  window.addEventListener('hashchange', async () => {
    await app.renderPage();

    setTimeout(() => {
      try {
        NotificationToggle.render();
        console.log('🔄 NotificationToggle re-rendered after route change');
      } catch (err) {
        console.warn('⚠️ Gagal re-render toggle:', err);
      }
    }, 600);
  });

  await initializePWA(registration);
  await initializeIDB();
  setupInstallPrompt();
  updateAuthLink();
});

async function initializePWA(registration) {
  try {
    console.log('🚀 Initializing PWA...');

    if (!registration) {
      registration = await registerServiceWorker();
    }

    if (registration) {
      const hasAskedPermission = localStorage.getItem('notification-permission-asked');
      if (!hasAskedPermission && 'Notification' in window) {
        setTimeout(async () => {
          if (Notification.permission === 'default') {
            const askPermission = confirm(
              'Aktifkan notifikasi push untuk mendapat update cerita terbaru?'
            );
            if (askPermission) {
              await Notification.requestPermission();
            }
            localStorage.setItem('notification-permission-asked', 'true');
          }
        }, 3000);
      }
    }
  } catch (error) {
    console.error('❌ PWA initialization failed:', error);
  }
}

async function initializeIDB() {
  try {
    await IDBHelper.openDatabase();
    console.log('✅ IndexedDB initialized');
  } catch (error) {
    console.error('❌ IndexedDB initialization failed:', error);
  }
}

function setupInstallPrompt() {
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💾 Install prompt available');
    e.preventDefault();
    deferredPrompt = e;

    showInstallButton(deferredPrompt);
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installed successfully');
    deferredPrompt = null;
    hideInstallButton();

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Aplikasi Terinstal!', {
        body: 'Katalog Cerita berhasil diinstal di perangkat Anda.',
        icon: '/public/images/icon-192x192.png'
      });
    }
  });
}

function showInstallButton(deferredPrompt) {
  let installBtn = document.getElementById('install-app-btn');

  if (!installBtn) {
    const nav = document.querySelector('.nav-list');
    if (!nav) return;

    const li = document.createElement('li');
    li.innerHTML = `
      <button id="install-app-btn" class="install-btn" aria-label="Install aplikasi">
        📲 Install Aplikasi
      </button>
    `;
    nav.appendChild(li);

    installBtn = document.getElementById('install-app-btn');
  }

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);

    if (outcome === 'accepted') {
      console.log('✅ User accepted install prompt');
    } else {
      console.log('❌ User dismissed install prompt');
    }

    deferredPrompt = null;
  });
}

function hideInstallButton() {
  const installBtn = document.getElementById('install-app-btn');
  if (installBtn) {
    installBtn.parentElement.remove();
  }
}

function updateAuthLink() {
  const token = localStorage.getItem('token');
  const authLink = document.getElementById('authLink');

  if (token) {
    authLink.textContent = 'Logout';
    authLink.href = '#/';
    authLink.setAttribute('aria-label', 'Keluar dari akun');
    authLink.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      localStorage.removeItem('push-enabled');
      alert('Anda telah logout!');
      window.location.hash = '/login';
    });
  } else {
    authLink.textContent = 'Login';
    authLink.href = '#/login';
    authLink.setAttribute('aria-label', 'Masuk ke akun');
  }
}

window.addEventListener('online', () => {
  console.log('🟢 Back online');
  showConnectionStatus('🟢 Koneksi kembali!');

  if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
    navigator.serviceWorker.ready.then((registration) => {
      return registration.sync.register('sync-favorites');
    }).catch((err) => {
      console.error('Background sync failed:', err);
    });
  }
});

window.addEventListener('offline', () => {
  console.log('🔴 Offline');
  showConnectionStatus('🔴 Mode offline - Data akan disimpan lokal');
});

function showConnectionStatus(message) {
  const toast = document.createElement('div');
  toast.className = 'toast connection-toast';
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

window.addEventListener('online', async () => {
  console.log('🌐 Online kembali, mencoba sinkronisasi cerita offline...');
  await SyncManager.syncPendingStories();
});