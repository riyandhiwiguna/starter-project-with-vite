import { loginUser } from '../../data/api.js';

class LoginPresenter {
  constructor(view) {
    this.view = view;
  }

  async handleLogin(email, password) {

    if (!email || !password) {
      this.view.showMessage('❌ Email dan password wajib diisi!', 'error');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.view.showMessage('❌ Format email tidak valid!', 'error');
      return;
    }

    this.view.showMessage('⏳ Sedang login...', 'info');
    this.view.setLoadingState(true);

    try {
      const result = await loginUser(email, password);
      
      if (result && result.loginResult && result.loginResult.token) {
        this.view.showMessage('✅ Login berhasil! Mengalihkan...', 'success');
        setTimeout(() => {
          window.location.hash = '/';
        }, 1000);
      } else {
        this.view.showMessage('❌ Login gagal. Silakan coba lagi.', 'error');
        this.view.setLoadingState(false);
      }
    } catch (error) {
      this.view.showMessage('❌ ' + error.message, 'error');
      this.view.setLoadingState(false);
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default LoginPresenter;