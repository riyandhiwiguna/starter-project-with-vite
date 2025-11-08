import model from '../model/movieModel.js';

class AddPresenter {
  async submitStory(formData) {
    try {
      await model.saveUserStory(formData);
      return { success: true, message: '✅ Cerita berhasil dikirim!' };
    } catch (err) {
      return { success: false, message: '❌ Gagal mengirim: ' + err.message };
    }
  }
}

export default new AddPresenter();
