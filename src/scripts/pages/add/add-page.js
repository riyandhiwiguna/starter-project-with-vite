import presenter from '../presenter/add-presenter.js';
import SyncManager from '../../utils/sync-manager.js';

export default class AddPage {
  async render() {
    return `
      <section class="container">
        <h1>Tambah Cerita Dicoding</h1>
        <form id="addForm" aria-label="Form tambah cerita">
          <label for="title">Judul / Deskripsi Singkat <span aria-hidden="true">*</span></label>
          <input id="title" name="title" required />
          
          <label for="overview">Deskripsi Lengkap</label>
          <textarea id="overview" name="overview" rows="4"></textarea>
          
          <label for="poster">Upload Foto</label>
          <input id="poster" name="poster" type="file" accept="image/*" />
          
          <div class="camera-controls">
            <button type="button" id="openCamera">Buka Kamera</button>
            <div id="cameraModal" class="camera-modal" hidden>
              <video id="videoPreview" autoplay playsinline></video>
              <div>
                <button type="button" id="captureBtn">Ambil Foto</button>
                <button type="button" id="closeCamera">Tutup</button>
              </div>
            </div>
            <div id="cameraPreview" aria-live="polite"></div>
          </div>
          
          <fieldset>
            <legend>Pilih Lokasi Cerita (klik peta) <span aria-hidden="true">*</span></legend>
            <div id="mapAdd" style="height:280px"></div>
            <label for="lat">Latitude</label>
            <input id="lat" name="lat" readonly />
            <label for="lon">Longitude</label>
            <input id="lon" name="lon" readonly />
          </fieldset>
          
          <div id="formMsg" role="status" aria-live="polite"></div>
          <button type="submit">Kirim</button>
        </form>
      </section>
    `;
  }

  async afterRender() {
    const L = window.L;
    const map = L.map('mapAdd').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    let tempMarker = null;
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      document.getElementById('lat').value = lat.toFixed(6);
      document.getElementById('lon').value = lng.toFixed(6);
      if (tempMarker) tempMarker.setLatLng(e.latlng);
      else tempMarker = L.marker(e.latlng).addTo(map);
    });

    let stream = null;
    const openCamera = document.getElementById('openCamera');
    const cameraModal = document.getElementById('cameraModal');
    const video = document.getElementById('videoPreview');
    const captureBtn = document.getElementById('captureBtn');
    const closeCamera = document.getElementById('closeCamera');
    const cameraPreview = document.getElementById('cameraPreview');

    openCamera.addEventListener('click', async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        video.srcObject = stream;
        cameraModal.hidden = false;
      } catch (err) {
        alert('Tidak dapat membuka kamera: ' + err.message);
      }
    });

    captureBtn.addEventListener('click', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        window._capturedBlob = blob;
        cameraPreview.innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="Preview foto" width="160">`;
      }, 'image/jpeg', 0.85);
      
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      cameraModal.hidden = true;
    });

    closeCamera.addEventListener('click', () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      cameraModal.hidden = true;
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !cameraModal.hidden) {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        cameraModal.hidden = true;
      }
    });

    const form = document.getElementById('addForm');
    const msg = document.getElementById('formMsg');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.textContent = '';
      msg.style.color = 'black';

      const title = form.title.value.trim();
      const lat = form.lat.value;
      const lon = form.lon.value;
      const inputFile = form.poster.files[0];

      if (!title) {
        msg.textContent = '❌ Judul wajib diisi!';
        msg.style.color = 'red';
        return;
      }
      if (!lat || !lon) {
        msg.textContent = '❌ Silakan pilih lokasi di peta!';
        msg.style.color = 'red';
        return;
      }

      const hasPhoto = inputFile || window._capturedBlob;
      if (!hasPhoto) {
        msg.textContent = '❌ Silakan upload atau ambil foto!';
        msg.style.color = 'red';
        return;
      }

      msg.textContent = '⏳ Mengirim data...';
      msg.style.color = 'blue';

      const fd = new FormData();
      fd.append('description', form.overview.value || title);
      fd.append('lat', lat);
      fd.append('lon', lon);
      if (inputFile) fd.append('photo', inputFile);
      else if (window._capturedBlob) fd.append('photo', window._capturedBlob, 'capture.jpg');

      try {
        if (navigator.onLine) {
          const result = await presenter.submitStory(fd);
          if (result.success) {
            msg.textContent = '✅ Cerita berhasil ditambahkan!';
            msg.style.color = 'green';
            form.reset();
            cameraPreview.innerHTML = '';
            if (tempMarker) map.removeLayer(tempMarker);
            window._capturedBlob = null;
            setTimeout(() => (window.location.hash = '/'), 1500);
          } else {
            msg.textContent = '❌ Gagal: ' + (result.message || 'Terjadi kesalahan.');
            msg.style.color = 'red';
          }
        } else {
          throw new Error('Offline mode aktif');
        }
      } catch (err) {
        console.warn('⚠️ Tidak bisa mengirim langsung, simpan offline:', err.message);
        const offlineData = {
          description: form.overview.value || title,
          lat,
          lon,
          photo: inputFile || window._capturedBlob,
          token: localStorage.getItem('token') || '',
        };
        await SyncManager.addPending(offlineData);
        msg.textContent = '📦 Anda offline. Cerita disimpan dan akan dikirim otomatis saat online.';
        msg.style.color = 'orange';
        form.reset();
        cameraPreview.innerHTML = '';
        if (tempMarker) map.removeLayer(tempMarker);
      }
    });
  }
}
