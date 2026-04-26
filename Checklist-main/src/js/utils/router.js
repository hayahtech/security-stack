// ═══════════════════════════════════════════════════════════════
// CheckFlow Pro — SPA Router
// Hash-based routing for single-page application
// ═══════════════════════════════════════════════════════════════

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.beforeEach = null;
  }

  addRoute(path, handler) {
    this.routes[path] = handler;
  }

  navigate(path) {
    window.location.hash = path;
  }

  start() {
    window.addEventListener('hashchange', () => this._handleRoute());
    window.addEventListener('load', () => this._handleRoute());
  }

  _handleRoute() {
    const hash = window.location.hash.slice(1) || '/dashboard';
    const [path, ...params] = hash.split('/').filter(Boolean);
    const routeKey = '/' + path;

    // Check auth before routing
    if (this.beforeEach) {
      const canProceed = this.beforeEach(routeKey);
      if (!canProceed) return;
    }

    const invoke = (handler, args) => {
      const result = handler(args);
      if (result && typeof result.catch === 'function') {
        result.catch(err => console.error('[Router] Async route error:', err));
      }
    };

    if (this.routes[routeKey]) {
      this.currentRoute = routeKey;
      invoke(this.routes[routeKey], params);
      this._updateActiveNav(routeKey);
      return;
    }

    // Fallback to dashboard
    this.navigate('/dashboard');
  }

  _updateActiveNav(path) {
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.route === path) {
        item.classList.add('active');
      }
    });
  }
}

const router = new Router();
