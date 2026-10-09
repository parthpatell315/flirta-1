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
          🪘 Discover
        </button>
      </li>
      <li>
        <button class="nav-btn" data-route="/likes-received" onclick="Router.navigate('/likes-received')">
          ❤️ Liked You
          ${state.likesReceivedCount > 0 ? `<span class="nav-badge">${state.likesReceivedCount}</span>` : ''}
        </button>
      </li>
      <li>
        <button class="nav-btn" data-route="/matches" onclick="Router.navigate('/matches')">
          💬 Matches
          ${state.matchesCount > 0 ? `<span class="nav-badge">${state.matchesCount}</span>` : ''}
        </button>
      </li>
      <li>
        <button class="nav-btn" data-route="/pricing" onclick="Router.navigate('/pricing')">
          💎 Plans
        </button>
      </li>
      ${state.isAdmin() ? `
        <li>
          <button class="nav-btn" data-route="/admin" onclick="Router.navigate('/admin')">
            🛡️ Admin
          </button>
        </li>
      ` : ''}
      <li>
        <button class="btn btn-secondary btn-sm" data-route="/profile" onclick="Router.navigate('/profile')">
          👤 ${state.profile ? state.profile.display_name.split(' ')[0] : 'Profile'}
        </button>
      </li>
    `;

    mobileNav.innerHTML = `
      <button class="mobile-nav-item" data-route="/discover" onclick="Router.navigate('/discover')">
        <span class="mobile-nav-icon">🪘</span>
        <span>Discover</span>
      </button>
      <button class="mobile-nav-item" data-route="/likes-received" onclick="Router.navigate('/likes-received')">
        <span class="mobile-nav-icon">❤️</span>
        <span>Likes</span>
        ${state.likesReceivedCount > 0 ? `<span class="nav-badge" style="position: absolute; top: 0; right: 8px;">${state.likesReceivedCount}</span>` : ''}
      </button>
      <button class="mobile-nav-item" data-route="/matches" onclick="Router.navigate('/matches')">
        <span class="mobile-nav-icon">💬</span>
        <span>Matches</span>
        ${state.matchesCount > 0 ? `<span class="nav-badge" style="position: absolute; top: 0; right: 8px;">${state.matchesCount}</span>` : ''}
      </button>
      <button class="mobile-nav-item" data-route="/pricing" onclick="Router.navigate('/pricing')">
        <span class="mobile-nav-icon">💎</span>
        <span>Plans</span>
      </button>
      <button class="mobile-nav-item" data-route="/profile" onclick="Router.navigate('/profile')">
        <span class="mobile-nav-icon">👤</span>
        <span>Profile</span>
      </button>
    `;
  } else {
    desktopNav.innerHTML = `
      <li>
        <button class="nav-btn" data-route="/garba-partner" onclick="Router.navigate('/garba-partner')">
          Home
        </button>
      </li>
      <li>
        <button class="nav-btn" data-route="/pricing" onclick="Router.navigate('/pricing')">
          💎 Plans
        </button>
      </li>
      <li>
        <button class="nav-btn" onclick="openAuthModal('login')">
          Sign In
        </button>
      </li>
      <li>
        <button class="btn btn-primary btn-sm" onclick="openAuthModal('register')">
          Join 18+ 🪘
        </button>
      </li>
    `;

    mobileNav.innerHTML = `
      <button class="mobile-nav-item active" data-route="/garba-partner" onclick="Router.navigate('/garba-partner')">
        <span class="mobile-nav-icon">🏠</span>
        <span>Home</span>
      </button>
      <button class="mobile-nav-item" data-route="/pricing" onclick="Router.navigate('/pricing')">
        <span class="mobile-nav-icon">💎</span>
        <span>Plans</span>
      </button>
      <button class="mobile-nav-item" onclick="openAuthModal('login')">
        <span class="mobile-nav-icon">🔑</span>
        <span>Sign In</span>
      </button>
    `;
  }

  Router.updateActiveNavs(state.currentRoute);
}

// When DOM is loaded, start app
document.addEventListener('DOMContentLoaded', initApp);
