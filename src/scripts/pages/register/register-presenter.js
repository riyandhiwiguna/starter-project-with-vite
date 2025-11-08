import { registerUser } from '../../data/api.js';

class RegisterPresenter {
  constructor(view) {
    this.view = view;
  }

  async handleRegister(name, email, password) {

    if (!name || !email || !password) {
      this.view.showMessage('❌ Semua field wajib diisi!', 'error');
      return;
    }

    if (name.length < 3) {
      this.view.showMessage('❌ Nama minimal 3 karakter!', 'error');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.view.showMessage('❌ Format email tidak valid!', 'error');
      return;
    }

    if (password.length < 8) {
      this.view.showMessage('❌ Password minimal 8 karakter!', 'error');
      return;
    }

    this.view.showMessage('⏳ Mendaftarkan akun...', 'info');
    this.view.setLoadingState(true);

    try {
      const result = await registerUser(name, email, password);
      
      if (result && !result.error) {
        this.view.showMessage('✅ Registrasi berhasil! Mengalihkan ke login...', 'success');
        setTimeout(() => {
          window.location.hash = '/login';
        }, 1500);
      } else {
        this.view.showMessage('❌ Registrasi gagal: ' + (result.message || 'Terjadi kesalahan'), 'error');
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

export default RegisterPresenter;