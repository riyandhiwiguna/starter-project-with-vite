export default class AboutPage {
  async render() {
    return `
      <section class="container">
        <h1>Tentang Aplikasi</h1>
        <p>Aplikasi ini merupakan proyek submission Dicoding untuk menampilkan daftar cerita berbasis API dan peta digital.</p>
      </section>
    `;
  }

  async afterRender() {}
}
