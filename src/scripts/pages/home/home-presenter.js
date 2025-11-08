import StoryModel from '../model/movieModel.js';

class HomePresenter {
  constructor(view) {
    this.view = view;
    this.stories = [];
    this.activeMarkerId = null;
  }

  async init() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.view.showError('⚠️ Silakan login terlebih dahulu untuk melihat daftar cerita.');
      return;
    }

    try {
      this.stories = await StoryModel.getAllStories();
      this.view.renderStories(this.stories);
      this.view.renderMarkers(this.stories);
      this.view.bindCardInteractions(this.handleCardClick.bind(this));
      this.view.bindLoadMore(this.handleLoadMore.bind(this));
    } catch (error) {
      console.error(error);
      this.view.showError('❌ Gagal memuat story. Coba lagi nanti.');
    }
  }

  handleCardClick(storyId) {
    const story = this.stories.find(s => s.id === storyId);
    if (!story || !story.lat || !story.lon) return;

    if (this.activeMarkerId) {
      this.view.resetMarker(this.activeMarkerId);
    }

    this.view.highlightMarker(storyId);
    this.view.panToMarker(story.lat, story.lon);
    this.view.openMarkerPopup(storyId);
    
    this.activeMarkerId = storyId;
  }

  async handleLoadMore() {
    this.view.setLoadingState(true);
    try {
      const newStories = await StoryModel.getAllStories();
      this.stories = newStories;
      this.view.renderStories(newStories);
      this.view.renderMarkers(newStories);
      this.view.bindCardInteractions(this.handleCardClick.bind(this));
      this.view.setLoadingState(false);
    } catch (error) {
      console.error(error);
      this.view.setLoadingState(false, true);
    }
  }
}

export default HomePresenter;