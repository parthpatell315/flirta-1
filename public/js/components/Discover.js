// GarbaJodi Discover Partners Component

const Discover = {
  profiles: [],
  currentIndex: 0,
  filters: {
    city: '',
    experience: '',
    connection_type: '',
    min_age: '',
    max_age: ''
  },

  async render() {
    if (!State.isAuthenticated()) {
      openAuthModal('login');
      return;
    }

    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="container discovery-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h1 style="font-size: 1.8rem;">Discover Garba Partners 🪘</h1>
          <button class="btn btn-secondary btn-sm" onclick="Discover.toggleFilterPanel()">
            🔍 Filters
          </button>
        </div>

        <!-- Filter Bar -->
        <div id="filter-panel" class="filter-bar" style="display: flex;">
          <select id="filter-city" onchange="Discover.applyFilters()">
            <option value="">All Cities</option>
            <option value="Ahmedabad" ${this.filters.city === 'Ahmedabad' ? 'selected' : ''}>Ahmedabad</option>
            <option value="Vadodara" ${this.filters.city === 'Vadodara' ? 'selected' : ''}>Vadodara</option>
            <option value="Surat" ${this.filters.city === 'Surat' ? 'selected' : ''}>Surat</option>
            <option value="Mumbai" ${this.filters.city === 'Mumbai' ? 'selected' : ''}>Mumbai</option>
            <option value="Rajkot" ${this.filters.city === 'Rajkot' ? 'selected' : ''}>Rajkot</option>
          </select>

          <select id="filter-experience" onchange="Discover.applyFilters()">
            <option value="">All Experience</option>
            <option value="beginner" ${this.filters.experience === 'beginner' ? 'selected' : ''}>Beginner</option>
            <option value="intermediate" ${this.filters.experience === 'intermediate' ? 'selected' : ''}>Intermediate</option>
            <option value="advanced" ${this.filters.experience === 'advanced' ? 'selected' : ''}>Advanced</option>
          </select>

          <select id="filter-connection" onchange="Discover.applyFilters()">
            <option value="">All Connection Types</option>
            <option value="partner" ${this.filters.connection_type === 'partner' ? 'selected' : ''}>Garba Partner</option>
            <option value="friendship" ${this.filters.connection_type === 'friendship' ? 'selected' : ''}>Friendship</option>
            <option value="group" ${this.filters.connection_type === 'group' ? 'selected' : ''}>Group Circle</option>
            <option value="dating" ${this.filters.connection_type === 'dating' ? 'selected' : ''}>Open to Dating</option>
          </select>
        </div>

        <!-- Card Deck View -->
        <div id="discover-card-area">
          <div style="text-align: center; padding: 60px 20px;">
            <p style="color: var(--color-gold-light);">Loading dancers...</p>
          </div>
        </div>
      </div>
    `;

    await this.loadProfiles();
  },

  toggleFilterPanel() {
    const panel = document.getElementById('filter-panel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    }
  },

  applyFilters() {
    this.filters.city = document.getElementById('filter-city').value;
    this.filters.experience = document.getElementById('filter-experience').value;
    this.filters.connection_type = document.getElementById('filter-connection').value;
    this.currentIndex = 0;
    this.loadProfiles();
  },

  async loadProfiles() {
    const cardArea = document.getElementById('discover-card-area');
    try {
      const queryParams = new URLSearchParams();
      if (this.filters.city) queryParams.set('city', this.filters.city);
      if (this.filters.experience) queryParams.set('experience', this.filters.experience);
      if (this.filters.connection_type) queryParams.set('connection_type', this.filters.connection_type);

      const res = await API.get(`/api/discovery?${queryParams.toString()}`);
      this.profiles = res.profiles || [];
      this.currentIndex = 0;
      this.renderCurrentCard();
    } catch (err) {
      cardArea.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px;">
          <p style="color: var(--color-danger); margin-bottom: 12px;">Failed to load profiles: ${err.message}</p>
          <button class="btn btn-secondary btn-sm" onclick="Discover.loadProfiles()">Retry</button>
        </div>
      `;
    }
  },

  renderCurrentCard() {
    const cardArea = document.getElementById('discover-card-area');
    if (!cardArea) return;

    if (this.currentIndex >= this.profiles.length) {
      cardArea.innerHTML = `
        <div class="card" style="text-align: center; padding: 50px 20px;">
          <div style="font-size: 3.5rem; margin-bottom: 16px;">🪔</div>
          <h2 style="font-size: 1.6rem; margin-bottom: 12px;">You've Caught Up!</h2>
          <p style="color: var(--color-text-secondary); max-width: 440px; margin: 0 auto 24px;">
            You have reviewed all available Garba profiles matching your current filters. Adjust your filters or explore upcoming events to meet more dancers!
          </p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button class="btn btn-secondary" onclick="Discover.resetFilters()">Clear Filters</button>
            <button class="btn btn-primary" onclick="Router.navigate('/events')">Browse Events</button>
          </div>
        </div>
      `;
      return;
    }

    const p = this.profiles[this.currentIndex];
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.display_name)}&background=FF6B00&color=fff&size=512`;
    const photoUrl = p.primary_photo || defaultAvatar;

    cardArea.innerHTML = `
      <div class="partner-card">
        <div class="partner-card-media">
          <img src="${photoUrl}" alt="${p.display_name}" class="partner-card-img" onerror="this.src='${defaultAvatar}'">
          <div class="partner-card-overlay">
            <div>
              <div class="partner-card-name">${p.display_name}, ${p.age}</div>
              <div class="partner-card-meta">
                <span>📍 ${p.city}</span>
                <span>·</span>
                <span style="text-transform: capitalize;">${p.garba_experience} Dancer</span>
              </div>
            </div>
            <span class="partner-badge">Navratri 2026</span>
          </div>
        </div>

        <div class="partner-card-body">
          <p class="partner-bio">${p.bio || 'Excited for vibrant Raas and traditional Garba nights!'}</p>

          <div style="margin-bottom: 12px;">
            <strong style="font-size: 0.84rem; color: var(--color-gold-light); text-transform: uppercase; letter-spacing: 0.5px;">Seeking:</strong>
            <div class="pill-list" style="margin-top: 6px;">
              ${(p.connection_types || []).map(ct => `
                <span class="pill pill-accent">✨ ${ct === 'partner' ? 'Garba Partner' : ct === 'dating' ? 'Open to Dating' : ct}</span>
              `).join('')}
            </div>
          </div>

          ${p.dance_style ? `
            <div style="margin-bottom: 12px;">
              <strong style="font-size: 0.84rem; color: var(--color-gold-light); text-transform: uppercase; letter-spacing: 0.5px;">Styles & Steps:</strong>
              <div class="pill-list" style="margin-top: 6px;">
                <span class="pill">💃 ${p.dance_style}</span>
                ${p.preferred_language ? `<span class="pill">🗣️ ${p.preferred_language}</span>` : ''}
              </div>
            </div>
          ` : ''}

          ${p.attending_events && p.attending_events.length > 0 ? `
            <div>
              <strong style="font-size: 0.84rem; color: var(--color-gold-light); text-transform: uppercase; letter-spacing: 0.5px;">Attending Venues:</strong>
              <div style="margin-top: 6px; display: flex; flex-direction: column; gap: 6px;">
                ${p.attending_events.map(ev => `
                  <div style="font-size: 0.85rem; color: var(--color-cream-muted); background: rgba(255,255,255,0.05); padding: 6px 12px; border-radius: 6px;">
                    🎪 <strong>${ev.name}</strong> (${ev.event_date})
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Swipe Action Bar -->
        <div class="swipe-actions">
          <button class="action-circle-btn btn-flag" title="Report or Block" onclick="Discover.openOptions(${p.user_id}, '${p.display_name.replace(/'/g, "\\'")}')">
            ⚠️
          </button>
          
          <button class="action-circle-btn btn-pass" title="Pass" onclick="Discover.handleAction(${p.user_id}, 'pass')">
            ✕
          </button>

          <button class="action-circle-btn btn-like" title="Like / Send Interest" onclick="Discover.handleAction(${p.user_id}, 'like')">
            🪘
          </button>
        </div>
      </div>
    `;
  },

  resetFilters() {
    this.filters = { city: '', experience: '', connection_type: '', min_age: '', max_age: '' };
    this.currentIndex = 0;
    this.loadProfiles();
  },

  async handleAction(receiverId, action) {
    try {
      const res = await API.post('/api/match/like', { receiverId, action });
      
      if (res.isMatch) {
        this.showMatchCelebration(res.matchId, this.profiles[this.currentIndex]);
      } else if (action === 'like') {
        showToast('Interest sent! If they like you back, you will match.', 'info');
      }

      this.currentIndex++;
      this.renderCurrentCard();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  openOptions(userId, name) {
    const choice = prompt(`Options for ${name}:\nType 'report' to report this profile\nType 'block' to block this user\nOr click Cancel.`);
    if (choice === 'report') {
      openReportModal('user', userId, name);
    } else if (choice === 'block') {
      promptBlockUser(userId, name);
    }
  },

  showMatchCelebration(matchId, profile) {
    const celebrationOverlay = document.createElement('div');
    celebrationOverlay.className = 'modal-overlay open';
    celebrationOverlay.innerHTML = `
      <div class="modal-box" style="text-align: center; border: 2px solid var(--color-primary); background: #FFFFFF; box-shadow: var(--shadow-lg);">
        <div style="font-size: 3.5rem; animation: bounce 1s infinite;">🎉 🪘 🎉</div>
        <h2 style="font-size: 2rem; color: var(--color-primary); margin: 12px 0;">It's a Garba Jodi Match!</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: 24px; font-size: 1rem;">
          You and <strong>${profile.display_name}</strong> both liked each other! You can now coordinate your Garba nights and chat.
        </p>
        <div style="display: flex; gap: 14px; justify-content: center;">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Keep Browsing</button>
          <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove(); Router.navigate('/matches')">Open Chat 💬</button>
        </div>
      </div>
    `;
    document.body.appendChild(celebrationOverlay);
  }
};

window.Discover = Discover;
