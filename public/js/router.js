// Flirta Client-Side SPA Router

const Router = {
  routes: {
    '/garba-partner': Landing,
    '/': Landing,
    '/discover': Discover,
    '/pricing': Pricing,
    '/likes-received': LikesReceived,
    '/matches': Matches,
    '/events': Events,
    '/groups': Groups,
    '/profile': Profile,
    '/admin': Admin,
    '/terms': LegalPages,
    '/privacy': LegalPages,
    '/anti-escort-policy': LegalPages,
    '/safety': LegalPages,
    '/refund-policy': LegalPages,
    '/contact': LegalPages,
    '/grievance': LegalPages
  },

  init() {
    window.addEventListener('popstate', () => {
      this.renderPath(window.location.pathname);
    });

    // Capture click on links with data-link
    document.body.addEventListener('click', e => {
      const link = e.target.closest('[data-link]');
      if (link) {
        e.preventDefault();
        this.navigate(link.getAttribute('href'));
      }
    });

    const initialPath = window.location.pathname || '/garba-partner';
    this.renderPath(initialPath);
  },

  navigate(path) {
    window.history.pushState({}, '', path);
    this.renderPath(path);
  },

  renderCurrentRoute() {
    this.renderPath(window.location.pathname);
  },

  renderPath(path) {
    // Normalize path
    let matchedPath = '/garba-partner';
    if (path.startsWith('/discover')) matchedPath = '/discover';
    else if (path.startsWith('/pricing')) matchedPath = '/pricing';
    else if (path.startsWith('/likes-received')) matchedPath = '/likes-received';
    else if (path.startsWith('/matches')) matchedPath = '/matches';
    else if (path.startsWith('/events') || path.startsWith('/groups')) matchedPath = '/discover';
    else if (path.startsWith('/profile')) matchedPath = '/profile';
    else if (path.startsWith('/admin')) matchedPath = '/admin';
    else if (path.startsWith('/terms')) matchedPath = '/terms';
    else if (path.startsWith('/privacy')) matchedPath = '/privacy';
    else if (path.startsWith('/anti-escort-policy') || path.startsWith('/anti-escort')) matchedPath = '/anti-escort-policy';
    else if (path.startsWith('/safety')) matchedPath = '/safety';
    else if (path.startsWith('/refund-policy') || path.startsWith('/refund')) matchedPath = '/refund-policy';
    else if (path.startsWith('/contact')) matchedPath = '/contact';
    else if (path.startsWith('/grievance')) matchedPath = '/grievance';

    // Cleanup previous polling in Matches if moving away
    if (matchedPath !== '/matches' && window.Matches && window.Matches.cleanup) {
      window.Matches.cleanup();
    }

    State.setRoute(matchedPath);
    this.updateActiveNavs(matchedPath);

    const component = this.routes[matchedPath] || Landing;
    component.render();
    window.scrollTo(0, 0);
  },

  updateActiveNavs(activePath) {
    document.querySelectorAll('.nav-btn, .mobile-nav-item').forEach(el => {
      const route = el.getAttribute('data-route');
      if (route === activePath) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }
};

window.Router = Router;
