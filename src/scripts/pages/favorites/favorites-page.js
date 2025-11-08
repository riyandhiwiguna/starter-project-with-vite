import IDBHelper from '../../utils/idb-helper.js';

export default class FavoritesPage {
  constructor() {
    this.favorites = [];
    this.currentSort = 'newest';
    this.searchQuery = '';
  }

  async render() {
    return `
      <section class="container">
        <h1>📚 Cerita Favorit Saya</h1>
        <p class="subtitle">Cerita yang disimpan secara offline di perangkat Anda</p>

        <div class="favorites-controls">
          <div class="search-box">
            <input 
              type="text" 
              id="searchFavorites" 
              placeholder="🔍 Cari cerita favorit..." 
              aria-label="Cari cerita favorit"
            />
          </div>

          <div class="filter-box">
            <label for="sortFavorites">Urutkan:</label>
            <select id="sortFavorites" aria-label="Urutkan cerita favorit">
              <option value="newest">Terbaru Ditambahkan</option>
              <option value="oldest">Terlama Ditambahkan</option>
              <option value="name-asc">Nama A-Z</option>
              <option value="name-desc">Nama Z-A</option>
            </select>
          </div>

          <button id="clearAllFavorites" class="btn-danger" aria-label="Hapus semua favorit">
            🗑️ Hapus Semua
          </button>
        </div>

        <div id="favorites-stats" class="stats-box" role="status" aria-live="polite"></div>

        <div id="favorites-list" class="story-list" aria-live="polite" role="list"></div>
      </section>
    `;
  }

  async afterRender() {
    await this.loadFavorites();
    this.bindEvents();
  }

  async loadFavorites() {
    try {
      this.favorites = await IDBHelper.getAllFavorites();
      this.applyFiltersAndSort();
    } catch (error) {
      console.error('Failed to load favorites:', error);
      this.showError('❌ Gagal memuat favorit. Coba refresh halaman.');
    }
  }

  async applyFiltersAndSort() {
    let filtered = this.favorites;

    if (this.searchQuery) {
      filtered = await IDBHelper.searchFavorites(this.searchQuery);
    }

    const sorted = await this.sortStories(filtered, this.currentSort);

    this.renderFavorites(sorted);
    this.updateStats(filtered.length, this.favorites.length);
  }

  async sortStories(stories, sortBy) {
    const sorted = [...stories];
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => 
          new Date(b.favoritedAt) - new Date(a.favoritedAt)
        );
      case 'oldest':
        return sorted.sort((a, b) => 
          new Date(a.favoritedAt) - new Date(b.favoritedAt)
        );
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return sorted;
    }
  }

  renderFavorites(stories) {
    const container = document.getElementById('favorites-list');

    if (!stories || stories.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>📭 ${this.searchQuery ? 'Tidak ada hasil pencarian.' : 'Belum ada cerita favorit.'}</p>
          <p>Tambahkan cerita ke favorit dari halaman beranda!</p>
          <a href="#/" class="btn-primary">Ke Beranda</a>
        </div>
      `;
      return;
    }

    const html = stories.map(story => `
      <article class="story-card favorite-card" role="listitem" tabindex="0" data-id="${story.id}">
        <button 
          class="remove-favorite-btn" 
          data-id="${story.id}" 
          aria-label="Hapus ${story.name} dari favorit"
          title="Hapus dari favorit"
        >
          ❌
        </button>
        <img src="${story.photoUrl}" alt="Foto ${story.name}" loading="lazy" width="140" height="210" />
        <div class="card-body">
          <h3>${story.name}</h3>
          <p>${story.description}</p>
          <p class="date">📅 Dibuat: ${new Date(story.createdAt).toLocaleDateString('id-ID')}</p>
          <p class="date">⭐ Difavoritkan: ${new Date(story.favoritedAt).toLocaleDateString('id-ID')}</p>
          ${story.lat && story.lon ? `
            <p class="location">📍 ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}</p>
          ` : ''}
        </div>
      </article>
    `).join('');

    container.innerHTML = html;

    container.querySelectorAll('.remove-favorite-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        await this.removeFavorite(id);
      });
    });
  }

  updateStats(displayedCount, totalCount) {
    const statsBox = document.getElementById('favorites-stats');
    const searchInfo = this.searchQuery ? ` (dari pencarian "${this.searchQuery}")` : '';
    
    statsBox.innerHTML = `
      <p>
        📊 Menampilkan <strong>${displayedCount}</strong> dari <strong>${totalCount}</strong> cerita favorit${searchInfo}
      </p>
    `;
  }

  bindEvents() {

    const searchInput = document.getElementById('searchFavorites');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.searchQuery = e.target.value.trim();
        this.applyFiltersAndSort();
      }, 300);
    });

    const sortSelect = document.getElementById('sortFavorites');
    sortSelect.addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.applyFiltersAndSort();
    });

    const clearAllBtn = document.getElementById('clearAllFavorites');
    clearAllBtn.addEventListener('click', async () => {
      if (this.favorites.length === 0) {
        alert('Tidak ada favorit untuk dihapus.');
        return;
      }

      const confirmed = confirm(`Hapus semua ${this.favorites.length} cerita favorit?`);
      if (confirmed) {
        await this.clearAllFavorites();
      }
    });
  }

  async removeFavorite(id) {
    try {
      await IDBHelper.removeFavorite(id);

      this.showToast('✅ Dihapus dari favorit');
      
      await this.loadFavorites();
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      this.showToast('❌ Gagal menghapus favorit');
    }
  }

  async clearAllFavorites() {
    try {
      await IDBHelper.clearAllFavorites();
      this.showToast('✅ Semua favorit telah dihapus');
      await this.loadFavorites();
    } catch (error) {
      console.error('Failed to clear favorites:', error);
      this.showToast('❌ Gagal menghapus favorit');
    }
  }

  showError(message) {
    const container = document.getElementById('favorites-list');
    container.innerHTML = `<p class="error">${message}</p>`;
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