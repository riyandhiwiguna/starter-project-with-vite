import {
  subscribeToPushNotification,
  unsubscribeFromPushNotification,
  requestPushPermission,
  isPushEnabled,
  testPushNotification,
} from '../utils/push-notification.js';

const NotificationToggle = {
  async init(registration) {
    this.registration = registration;
    this.render();
  },

  render() {
    const container = document.querySelector('#notification-toggle-container');
    if (!container) return;

    const enabled = isPushEnabled();
    container.innerHTML = `
      <button id="notification-toggle-btn" 
        aria-label="Toggle Push Notification"
        class="toggle-btn"
        style="
          padding:10px 16px;
          border:none;
          border-radius:8px;
          cursor:pointer;
          background-color:${enabled ? '#e74c3c' : '#2ecc71'};
          color:white;
          font-weight:bold;
        ">
        ${enabled ? '🔕 Nonaktifkan Notifikasi' : '🔔 Aktifkan Notifikasi'}
      </button>
      <button id="test-push-btn" style="margin-left:8px;padding:10px 16px;border:none;border-radius:8px;background:#3498db;color:white;cursor:pointer;">
        🧪 Tes Notifikasi
      </button>
    `;

    document
      .getElementById('notification-toggle-btn')
      .addEventListener('click', () => this.toggle());

    document
      .getElementById('test-push-btn')
      .addEventListener('click', () => testPushNotification());
  },

  async toggle() {
    const btn = document.getElementById('notification-toggle-btn');
    const enabled = isPushEnabled();

    if (enabled) {
      await unsubscribeFromPushNotification(this.registration);
      btn.textContent = '🔔 Aktifkan Notifikasi';
      btn.style.backgroundColor = '#2ecc71';
    } else {
      const permission = await requestPushPermission();
      if (permission === 'granted') {
        await subscribeToPushNotification(this.registration);
        btn.textContent = '🔕 Nonaktifkan Notifikasi';
        btn.style.backgroundColor = '#e74c3c';
      } else {
        alert('Anda menolak izin notifikasi');
      }
    }
  },
};

export default NotificationToggle;
