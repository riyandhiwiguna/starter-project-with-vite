import { fetchStories, addStory, fetchStoryDetail } from '../../data/api.js';

const StoryModel = {
  async getAllStories() {
    return await fetchStories();
  },

  async getStoryDetail(id) {
    return await fetchStoryDetail(id);
  },

  async saveUserStory(formData) {
    return await addStory(formData);
  },
};

export default StoryModel;
