import model from '../model/movieModel.js';

class MoviePresenter {
  constructor(view) {
    this.view = view;
    this.page = 1;
  }

  async init() {
    await this.loadMovies();
    this.view.bindLoadMore(this.loadMore.bind(this));
    this.view.bindCardInteractions(this.onCardSelected.bind(this));
  }

  async loadMovies() {
    const movies = await model.getPopular(this.page);
    this.view.renderMovies(movies);

    for (const m of movies) {
      try {
        const detail = await model.getDetail(m.id);
        this.view.placeMarkerForMovie(m, detail);
      } catch (err) {

        console.warn('detail fail', m.id, err);
      }
    }
  }

  async loadMore() {
    this.page++;
    await this.loadMovies();
  }

  onCardSelected(movieId) {
    this.view.openMarkerPopup(movieId);
  }
}

export default MoviePresenter;
