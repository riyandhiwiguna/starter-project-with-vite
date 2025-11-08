import LoginPresenter from './login-presenter.js';

const LoginPage = {
  presenter: null,

  async render() {
    return `
      <section class="login-page">
        <h2>Masuk ke Akun Dicoding Story</h2>
        <form id="login-form">
          <label for="email">Email <span aria-hidden="true">*</span></label><br />
          <input type="email" id="email" name="email" required aria-required="true" /><br /><br />

          <label for="password">Password <span aria-hidden="true">*</span></label><br />
          <input type="password" id="password" name="password" required aria-required="true" /><br /><br />

          <button type="submit" id="loginBtn">Login</button>
        </form>

        <p id="login-message" role="status" aria-live="polite" style="margin-top:10px;"></p>
        <p>Belum punya akun? <a href="#/register">Daftar di sini</a></p>
      </section>
    `;
  },

  async afterRender() {
    this.presenter = new LoginPresenter(this);

    const form = document.querySelector('#login-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.querySelector('#email').value.trim();
      const password = document.querySelector('#password').value;
      await this.presenter.handleLogin(email, password);
    });
  },

  showMessage(message, type = 'error') {
    const messageElement = document.querySelector('#login-message');
    messageElement.textContent = message;
    
    const colors = {
      error: 'red',
      success: 'green',
      info: 'blue'
    };
    
    messageElement.style.color = colors[type] || 'red';
  },

  setLoadingState(isLoading) {
    const btn = document.querySelector('#loginBtn');
    const emailInput = document.querySelector('#email');
    const passwordInput = document.querySelector('#password');
    
    btn.disabled = isLoading;
    emailInput.disabled = isLoading;
    passwordInput.disabled = isLoading;
    
    btn.textContent = isLoading ? 'Memproses...' : 'Login';
  }
};

export default LoginPage;