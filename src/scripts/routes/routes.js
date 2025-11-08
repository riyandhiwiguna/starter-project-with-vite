import HomePage from '../pages/home/home-page.js';
import AboutPage from '../pages/about/about-page.js';
import AddPage from '../pages/add/add-page.js';
import LoginPage from '../pages/login/login-page.js';
import RegisterPage from '../pages/register/register-page.js';
import FavoritesPage from '../pages/favorites/favorites-page.js';

const routes = {
  '/': HomePage,
  '/about': AboutPage,
  '/add': AddPage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/favorites': FavoritesPage,
};

export default routes;