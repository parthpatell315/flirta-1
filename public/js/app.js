// Flirta Main Client Bootstrap

async function initApp() {
  // Check existing session
  const token = API.getToken();
  if (token) {
    try {
      const res = await API.get('/api/auth/me');
      State.setUser(res.user, res.profile, res.photos);
      State.setCounts(res.matchesCount || 0, res.unreadMessagesCount || 0);

      // Fetch pending likes received count for badge
      try {
        const likesRes = await API.get('/api/subscriptions/likes-received');
        State.likesReceivedCount = likesRes.totalCount || 0;
      } catch {}
    } catch (e) {
      console.warn('Session expired or invalid, continuing as guest.');
      API.setToken(null);
      State.setUser(null, null, []);
    }
  }

  // Subscribe navigation bar updates to state changes
  State.subscribe(updateNavigationUI);

  // Initial navigation render
  updateNavigationUI(State);

  // Start Router
  Router.init();
}

function updateNavigationUI(state) {
  const desktopNav = document.getElementById('navbar-links');
  const mobileNav = document.getElementById('mobile-bottom-nav');

  if (state.isAuthenticated()) {
    desktopNav.innerHTML = `
      <li>
        <button class="nav-btn" data-route="/discover" onclick="Router.navigate('/discover')">
          Discover
        </button>
      </li>
      <li>
        <button class="nav-btn" data-route="/likes-received" onclick="Router.navigate('/likes-received')">
          Liked You
          ${state.likesReceivedCount > 0 ? `<span class="nav-badge">${state.likesReceivedCount}</span>` : ''}
        </button>
      </li>
      <li>
        <button class="nav-btn" data-route="/matches" onclick="Router.navigate('/matches')">
          Matches
          ${state.matchesCount > 0 ? `<span class="nav-badge">${state.matchesCount}</span>` : ''}
        </button>
      </li>
      <li>
        <button class="nav-btn" data-route="/pricing" onclick="Router.navigate('/pricing')">
          Plans
        </button>
      </li>
      ${state.isAdmin() ? `
        <li>
          <button class="nav-btn" data-route="/admin" onclick="Router.navigate('/admin')">
            Admin
          </button>
        </li>
      ` : ''}
      <li>
        <button class="btn btn-secondary btn-sm" data-route="/profile" onclick="Router.navigate('/profile')">
          ${state.profile ? state.profile.display_name.split(' ')[0] : 'Profile'}
        </button>
      </li>
    `;

    mobileNav.innerHTML = `
      <button class="mobile-nav-item" data-route="/discover" onclick="Router.navigate('/discover')">
        <svg class="mobile-nav-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
        <span>Discover</span>
      </button>
      <button class="mobile-nav-item" data-route="/likes-received" onclick="Router.navigate('/likes-received')">
        <svg class="mobile-nav-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        <span>Likes</span>
        ${state.likesReceivedCount > 0 ? `<span class="nav-badge" style="position: absolute; top: 2px; right: 12px; font-size: 0.65rem; min-width: 16px; height: 16px;">${state.likesReceivedCount}</span>` : ''}
      </button>
      <button class="mobile-nav-item" data-route="/matches" onclick="Router.navigate('/matches')">
        <svg class="mobile-nav-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        <span>Matches</span>
        ${state.matchesCount > 0 ? `<span class="nav-badge" style="position: absolute; top: 2px; right: 12px; font-size: 0.65rem; min-width: 16px; height: 16px;">${state.matchesCount}</span>` : ''}
      </button>
      <button class="mobile-nav-item" data-route="/pricing" onclick="Router.navigate('/pricing')">
        <svg class="mobile-nav-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        <span>Plans</span>
      </button>
      <button class="mobile-nav-item" data-route="/profile" onclick="Router.navigate('/profile')">
        <svg class="mobile-nav-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        <span>Profile</span>
      </button>
    `;
  } else {
    desktopNav.innerHTML = `
      <li>
        <button class="nav-btn" data-route="/" onclick="Router.navigate('/')">
          Home
        </button>
      </li>
      <li>
        <button class="nav-btn" data-route="/pricing" onclick="Router.navigate('/pricing')">
          Plans
        </button>
      </li>
      <li>
        <button class="nav-btn" onclick="openAuthModal('login')">
          Sign In
        </button>
      </li>
      <li>
        <button class="btn btn-primary btn-sm" onclick="openAuthModal('register')">
          Join 18+
        </button>
      </li>
    `;

    mobileNav.innerHTML = `
      <button class="mobile-nav-item active" data-route="/" onclick="Router.navigate('/')">
        <svg class="mobile-nav-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        <span>Home</span>
      </button>
      <button class="mobile-nav-item" data-route="/pricing" onclick="Router.navigate('/pricing')">
        <svg class="mobile-nav-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        <span>Plans</span>
      </button>
      <button class="mobile-nav-item" onclick="openAuthModal('login')">
        <svg class="mobile-nav-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
        <span>Sign In</span>
      </button>
    `;
  }

  Router.updateActiveNavs(state.currentRoute);
}

// When DOM is loaded, start app
document.addEventListener('DOMContentLoaded', initApp);
