import HomePresenter from './home-presenter.js';
import IDBHelper from '../../utils/idb-helper.js';
import NotificationToggle from '../components/notification-toggle.js';

export default class HomePage {
  constructor() {
    this.markerMap = {};
    this.map = null;
    this.presenter = new HomePresenter(this);
    this.defaultIcon = null;
    this.highlightIcon = null;
  }

  async render() {
    return `
      <section class="container">
        <h1>Daftar Story Dicoding</h1>

        <div id="map" class="map" style="height:400px;" role="application" aria-label="Peta lokasi story"></div>

        <!-- Tombol sejajar -->
        <div id="controls" 
          style="
            margin-top: 16px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          ">
          
          <button id="loadMoreBtn" aria-label="Muat lebih banyak story">Muat lebih banyak</button>
          <div id="notification-toggle-container"></div>
        </div>

        <h2>Semua Cerita</h2>
        <div id="story-list" class="story-list" tabindex="0" aria-live="polite" role="list"></div>
      </section>
    `;
  }

  async afterRender() {
    const L = window.L;
    this.map = L.map('map', { keyboard: true }).setView([-2.5, 118], 4);

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    });
    const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenTopoMap',
    });

    osm.addTo(this.map);
    L.control.layers({ 'OSM': osm, 'Topo': topo }).addTo(this.map);

    this.defaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    this.highlightIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [35, 57],
      iconAnchor: [17, 57],
      popupAnchor: [1, -44],
      shadowSize: [41, 41],
    });

    // Inisialisasi presenter
    await this.presenter.init();

    // Inisialisasi tombol notifikasi
    if (window.swRegistration) {
      await NotificationToggle.init(window.swRegistration);
    }
  }

  showError(message) {
    const storyList = document.getElementById('story-list');
    storyList.innerHTML = `<p class="error">${message}</p>`;
  }

  async renderStories(stories) {
    const list = document.getElementById('story-list');
    list.innerHTML = '';

    if (!stories || stories.length === 0) {
      list.innerHTML = `<p>Tidak ada story yang tersedia.</p>`;
      return;
    }

    const favoritesStatus = {};
    for (const story of stories) {
      favoritesStatus[story.id] = await IDBHelper.isFavorite(story.id);
    }

    const html = stories.map(story => `
      <article class="story-card" role="listitem" tabindex="0" data-id="${story.id}">
        <button 
          class="favorite-toggle-btn ${favoritesStatus[story.id] ? 'favorited' : ''}" 
          data-id="${story.id}"
          aria-label="${favoritesStatus[story.id] ? 'Hapus dari favorit' : 'Tambah ke favorit'}"
          title="${favoritesStatus[story.id] ? 'Hapus dari favorit' : 'Tambah ke favorit'}"
        >
          ${favoritesStatus[story.id] ? '❤️' : '🤍'}
        </button>
        <img src="${story.photoUrl}" alt="Foto ${story.name}" loading="lazy" width="140" height="210" />
        <div class="card-body">
          <h3>${story.name}</h3>
          <p>${story.description}</p>
          <p class="date">📅 ${new Date(story.createdAt).toLocaleDateString('id-ID')}</p>
        </div>
      </article>
    `).join('');

    list.insertAdjacentHTML('beforeend', html);

    list.querySelectorAll('.favorite-toggle-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const storyId = btn.dataset.id;
        const story = stories.find(s => s.id === storyId);
        await this.toggleFavorite(story, btn);
      });
    });
  }

  async toggleFavorite(story, button) {
    try {
      const isFav = await IDBHelper.isFavorite(story.id);
      
      if (isFav) {
        await IDBHelper.removeFavorite(story.id);
        button.textContent = '🤍';
        button.classList.remove('favorited');
        button.setAttribute('aria-label', 'Tambah ke favorit');
        this.showToast('❌ Dihapus dari favorit');
      } else {
        await IDBHelper.addFavorite(story);
        button.textContent = '❤️';
        button.classList.add('favorited');
        button.setAttribute('aria-label', 'Hapus dari favorit');
        this.showToast('✅ Ditambahkan ke favorit');
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      this.showToast('❌ Gagal memproses favorit');
    }
  }

  renderMarkers(stories) {
    Object.values(this.markerMap).forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.markerMap = {};

    stories.forEach((story) => {
      if (story.lat && story.lon) {
        const marker = window.L.marker([story.lat, story.lon], { icon: this.defaultIcon })
          .addTo(this.map)
          .bindPopup(`<strong>${story.name}</strong><br>${story.description}`);
        this.markerMap[story.id] = marker;
      }
    });
  }

  bindCardInteractions(handler) {
    const cards = document.querySelectorAll('.story-card');
    cards.forEach(card => {
      const storyId = card.dataset.id;

      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('favorite-toggle-btn')) return;
        handler(storyId);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handler(storyId);
        }
      });
    });
  }

  bindLoadMore(handler) {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    loadMoreBtn.addEventListener('click', handler);
  }

  highlightMarker(storyId) {
    const marker = this.markerMap[storyId];
    if (marker) {
      marker.setIcon(this.highlightIcon);
    }
  }

  resetMarker(storyId) {
    const marker = this.markerMap[storyId];
    if (marker) {
      marker.setIcon(this.defaultIcon);
    }
  }

  panToMarker(lat, lon) {
    this.map.setView([lat, lon], 12, { animate: true });
  }

  openMarkerPopup(storyId) {
    const marker = this.markerMap[storyId];
    if (marker) {
      marker.openPopup();
    }
  }

  setLoadingState(isLoading, hasError = false) {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (isLoading) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'Memuat...';
    } else if (hasError) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Gagal memuat';
    } else {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Muat lebih banyak';
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
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
}
