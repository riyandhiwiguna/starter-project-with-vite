import CONFIG from '../utils/config.js';

export function movieCardHtml(movie) {
  const image = movie.photoUrl || '/public/images/logo.png';
  const tanggal = movie.createdAt ? new Date(movie.createdAt).toLocaleDateString('id-ID') : '-';

  return `
    <article class="movie-card" tabindex="0" data-id="${movie.id}">
      <img src="${image}" alt="Foto ${movie.name}" loading="lazy" width="140" height="210" />
      <div class="card-body">
        <h3>${movie.name}</h3>
        <p>${movie.description}</p>
        <p><small>🕒 ${tanggal}</small></p>
      </div>
    </article>
  `;
}
