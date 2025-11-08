import RegisterPresenter from './register-presenter.js';

const RegisterPage = {
  presenter: null,

  async render() {
    return `
      <section class="register-page">
        <h2>Buat Akun Baru Dicoding Story</h2>
        <form id="register-form">
          <label for="name">Nama Lengkap <span aria-hidden="true">*</span></label><br />
          <input type="text" id="name" name="name" required aria-required="true" /><br /><br />

          <label for="email">Email <span aria-hidden="true">*</span></label><br />
          <input type="email" id="email" name="email" required aria-required="true" /><br /><br />

          <label for="password">Password (min. 8 karakter) <span aria-hidden="true">*</span></label><br />
          <input type="password" id="password" name="password" required minlength="8" aria-required="true" /><br /><br />

          <button type="submit" id="registerBtn">Daftar</button>
        </form>

        <p id="register-message" role="status" aria-live="polite" style="margin-top:10px;"></p>
        <p>Sudah punya akun? <a href="#/login">Masuk di sini</a></p>
      </section>
    `;
  },

  async afterRender() {
    this.presenter = new RegisterPresenter(this);

    const form = document.querySelector('#register-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = document.querySelector('#name').value.trim();
      const email = document.querySelector('#email').value.trim();
      const password = document.querySelector('#password').value;
      await this.presenter.handleRegister(name, email, password);
    });
  },

  showMessage(message, type = 'error') {
    const messageElement = document.querySelector('#register-message');
    messageElement.textContent = message;
    
    const colors = {
      error: 'red',
      success: 'green',
      info: 'blue'
    };
    
    messageElement.style.color = colors[type] || 'red';
  },

  setLoadingState(isLoading) {
    const btn = document.querySelector('#registerBtn');
    const nameInput = document.querySelector('#name');
    const emailInput = document.querySelector('#email');
    const passwordInput = document.querySelector('#password');
    
    btn.disabled = isLoading;
    nameInput.disabled = isLoading;
    emailInput.disabled = isLoading;
    passwordInput.disabled = isLoading;
    
    btn.textContent = isLoading ? 'Memproses...' : 'Daftar';
  }
};

export default RegisterPage;