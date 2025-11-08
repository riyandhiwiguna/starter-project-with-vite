import routes from '../routes/routes.js';
import { getActiveRoute } from '../routes/url-parser.js';
import { initNotificationButton } from '../utils/notification-toggle.js'; // ✅ tambahkan ini

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#setupDrawer();
    this.#setupKeyboardSupport();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      const open = this.#navigationDrawer.classList.toggle('open');
      this.#drawerButton.setAttribute('aria-expanded', String(open));
    });
  }

  #setupKeyboardSupport() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.#navigationDrawer.classList.contains('open')) {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
        this.#drawerButton.focus();
      }
    });

    document.addEventListener('click', (e) => {
      const isClickInsideDrawer = this.#navigationDrawer.contains(e.target);
      const isClickOnButton = this.#drawerButton.contains(e.target);

      if (!isClickInsideDrawer && !isClickOnButton && this.#navigationDrawer.classList.contains('open')) {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  async renderPage() {
    const url = getActiveRoute();
    const Page = routes[url] || routes['/'];
    const pageInstance = typeof Page === 'function' ? new Page() : Page;

    if (document.startViewTransition) {
      document.startViewTransition(async () => {
        await this._renderWithTransition(pageInstance);
      });
    } else {
      await this._renderWithTransition(pageInstance);
    }
  }

  async _renderWithTransition(pageInstance) {
    const main = this.#content;
    main.classList.add('view-exit');
    await new Promise((r) => setTimeout(r, 150));

    main.innerHTML = await pageInstance.render();
    main.classList.remove('view-exit');
    main.classList.add('view-enter');

    if (typeof pageInstance.afterRender === 'function') {
      await pageInstance.afterRender();
    }

    setTimeout(() => {
      try {
        initNotificationButton();
      } catch (e) {
        console.warn('⚠️ Gagal inisialisasi notifikasi:', e);
      }
    }, 200);

    setTimeout(() => main.classList.remove('view-enter'), 350);
  }
}

export default App;
