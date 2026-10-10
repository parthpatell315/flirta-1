// GarbaJodi Discover Partners Component

const Discover = {
  profiles: [],
  currentIndex: 0,
  currentPhotoIndex: 0,
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

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('city')) {
      this.filters.city = urlParams.get('city');
    }

    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="container discovery-container">
        <!-- Top Status & Action Bar -->
        <div class="discover-top-bar">
          <div class="discover-title-wrap">
            <h1 class="discover-title">Discover</h1>
            <div id="daily-likes-status" class="discover-status">
              Loading daily allowance...
            </div>
          </div>
          <div class="discover-actions">
            <button id="boost-profile-btn" class="btn btn-secondary btn-sm" onclick="Discover.promptBoost()" style="border-color: var(--color-secondary);">
              Boost Profile
            </button>
            <button id="toggle-filter-btn" class="btn btn-secondary btn-sm" onclick="Discover.toggleFilterPanel()">
              Filters
            </button>
          </div>
        </div>

        <!-- Horizontal City-Wise Selector Chips -->
        <div class="city-selector-bar" id="city-selector-strip">
          <button class="city-chip ${!this.filters.city ? 'active' : ''}" data-city="" onclick="Discover.selectQuickCity('')">All Cities</button>
          <button class="city-chip ${this.filters.city === 'Ahmedabad' ? 'active' : ''}" data-city="Ahmedabad" onclick="Discover.selectQuickCity('Ahmedabad')">Ahmedabad</button>
          <button class="city-chip ${this.filters.city === 'Surat' ? 'active' : ''}" data-city="Surat" onclick="Discover.selectQuickCity('Surat')">Surat</button>
          <button class="city-chip ${this.filters.city === 'Vadodara' ? 'active' : ''}" data-city="Vadodara" onclick="Discover.selectQuickCity('Vadodara')">Vadodara</button>
          <button class="city-chip ${this.filters.city === 'Rajkot' ? 'active' : ''}" data-city="Rajkot" onclick="Discover.selectQuickCity('Rajkot')">Rajkot</button>
          <button class="city-chip ${this.filters.city === 'Gandhinagar' ? 'active' : ''}" data-city="Gandhinagar" onclick="Discover.selectQuickCity('Gandhinagar')">Gandhinagar</button>
          <button class="city-chip ${this.filters.city === 'Bhavnagar' ? 'active' : ''}" data-city="Bhavnagar" onclick="Discover.selectQuickCity('Bhavnagar')">Bhavnagar</button>
          <button class="city-chip ${this.filters.city === 'Jamnagar' ? 'active' : ''}" data-city="Jamnagar" onclick="Discover.selectQuickCity('Jamnagar')">Jamnagar</button>
          <button class="city-chip ${this.filters.city === 'Mumbai' ? 'active' : ''}" data-city="Mumbai" onclick="Discover.selectQuickCity('Mumbai')">Mumbai</button>
          <button class="city-chip ${this.filters.city === 'Indore' ? 'active' : ''}" data-city="Indore" onclick="Discover.selectQuickCity('Indore')">Indore</button>
        </div>

        <!-- Filter Bar (Collapsed by default for clean mobile discovery) -->
        <div id="filter-panel" class="filter-bar" style="display: none;">
          <div class="filter-header-mobile">
            <span>Filter Partners</span>
            <button class="btn btn-sm btn-secondary" onclick="Discover.toggleFilterPanel()" style="padding: 2px 10px; font-size: 0.78rem;">Done</button>
          </div>
          <select id="filter-city" onchange="Discover.applyFilters()">
            <option value="">All Cities (Gujarat, Mumbai & Indore)</option>
            <option value="Ahmedabad" ${this.filters.city === 'Ahmedabad' ? 'selected' : ''}>Ahmedabad</option>
            <option value="Surat" ${this.filters.city === 'Surat' ? 'selected' : ''}>Surat</option>
            <option value="Vadodara" ${this.filters.city === 'Vadodara' ? 'selected' : ''}>Vadodara</option>
            <option value="Rajkot" ${this.filters.city === 'Rajkot' ? 'selected' : ''}>Rajkot</option>
            <option value="Gandhinagar" ${this.filters.city === 'Gandhinagar' ? 'selected' : ''}>Gandhinagar</option>
            <option value="Bhavnagar" ${this.filters.city === 'Bhavnagar' ? 'selected' : ''}>Bhavnagar</option>
            <option value="Jamnagar" ${this.filters.city === 'Jamnagar' ? 'selected' : ''}>Jamnagar</option>
            <option value="Junagadh" ${this.filters.city === 'Junagadh' ? 'selected' : ''}>Junagadh</option>
            <option value="Anand" ${this.filters.city === 'Anand' ? 'selected' : ''}>Anand</option>
            <option value="Navsari" ${this.filters.city === 'Navsari' ? 'selected' : ''}>Navsari</option>
            <option value="Morbi" ${this.filters.city === 'Morbi' ? 'selected' : ''}>Morbi</option>
            <option value="Bharuch" ${this.filters.city === 'Bharuch' ? 'selected' : ''}>Bharuch</option>
            <option value="Mehsana" ${this.filters.city === 'Mehsana' ? 'selected' : ''}>Mehsana</option>
            <option value="Bhuj" ${this.filters.city === 'Bhuj' ? 'selected' : ''}>Bhuj</option>
            <option value="Porbandar" ${this.filters.city === 'Porbandar' ? 'selected' : ''}>Porbandar</option>
            <option value="Valsad" ${this.filters.city === 'Valsad' ? 'selected' : ''}>Valsad</option>
            <option value="Vapi" ${this.filters.city === 'Vapi' ? 'selected' : ''}>Vapi</option>
            <option value="Mumbai" ${this.filters.city === 'Mumbai' ? 'selected' : ''}>Mumbai</option>
            <option value="Indore" ${this.filters.city === 'Indore' ? 'selected' : ''}>Indore</option>
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
            <option value="friendship" ${this.filters.connection_type === 'friendship' ? 'selected' : ''}>Festive Friendship</option>
            <option value="dating" ${this.filters.connection_type === 'dating' ? 'selected' : ''}>Open to Dating</option>
          </select>
        </div>

        <!-- Card Deck View -->
        <div id="discover-card-area">
          <div style="text-align: center; padding: 60px 20px;">
            <p style="color: var(--color-primary);">Loading dancers...</p>
          </div>
        </div>
      </div>
    `;

    this.updateFilterButtonBadge();
    await this.updateAllowanceUI();
    await this.loadProfiles();
  },

  async updateAllowanceUI() {
    try {
      const res = await API.get('/api/subscriptions/me');
      const statusEl = document.getElementById('daily-likes-status');
      const boostBtn = document.getElementById('boost-profile-btn');

      if (statusEl && res.usage) {
        const u = res.usage;
        const sub = res.subscription;
        const planName = sub ? sub.planName : 'Free';
        const limitStr = u.dailyLimit === 'unlimited' ? 'Unlimited' : `${u.remainingLikesToday} / ${u.dailyLimit}`;

        statusEl.innerHTML = `
          <span>Plan: <strong style="color: var(--color-primary);">${planName}</strong> · Daily Likes: <strong>${limitStr}</strong></span>
          ${u.remainingLikesToday === 0 ? ` · <a href="javascript:void(0)" onclick="Router.navigate('/pricing')" style="color: var(--color-primary); text-decoration: underline;">Upgrade</a>` : ''}
        `;
      }

      if (boostBtn) {
        if (res.usage && res.usage.isBoosted) {
          boostBtn.innerHTML = 'Boost Active';
          boostBtn.className = 'btn btn-primary btn-sm';
        } else if (res.subscription && res.subscription.remainingBoosts > 0) {
          boostBtn.innerHTML = `Boost (${res.subscription.remainingBoosts})`;
        } else {
          boostBtn.innerHTML = 'Boost';
        }
      }
    } catch (e) {
      console.debug('Allowance check error:', e);
    }
  },

  async promptBoost() {
    try {
      const res = await API.get('/api/subscriptions/me');
      if (!res.subscription || res.subscription.remainingBoosts <= 0) {
        if (confirm('You have 0 profile boost credits. Would you like to view Flirta plans (Attraction & Dream Match include boost credits)?')) {
          Router.navigate('/pricing');
        }
        return;
      }

      if (!confirm(`Activate 1 Profile Boost Credit? Your profile will be prioritized at the top of partner discovery for 24 hours.`)) {
        return;
      }

      const boostRes = await API.post('/api/subscriptions/boost');
      showToast(boostRes.message, 'success');
      await this.updateAllowanceUI();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  toggleFilterPanel() {
    const panel = document.getElementById('filter-panel');
    const btn = document.getElementById('toggle-filter-btn');
    if (panel) {
      const isClosed = panel.style.display === 'none' || !panel.style.display;
      panel.style.display = isClosed ? 'flex' : 'none';
      if (btn) {
        btn.classList.toggle('active', isClosed);
      }
    }
  },

  updateFilterButtonBadge() {
    const btn = document.getElementById('toggle-filter-btn');
    if (!btn) return;
    const activeCount = [this.filters.city, this.filters.experience, this.filters.connection_type].filter(Boolean).length;
    btn.textContent = activeCount > 0 ? `Filters (${activeCount})` : 'Filters';
    if (activeCount > 0) {
      btn.style.borderColor = 'var(--color-primary)';
      btn.style.color = 'var(--color-primary)';
      btn.style.fontWeight = '700';
    } else {
      btn.style.borderColor = '';
      btn.style.color = '';
      btn.style.fontWeight = '';
    }
  },

  selectQuickCity(city) {
    this.filters.city = city;
    const cityEl = document.getElementById('filter-city');
    if (cityEl) cityEl.value = city;
    this.updateCityChipsUI();
    this.updateFilterButtonBadge();
    this.currentIndex = 0;
    this.loadProfiles();
  },

  updateCityChipsUI() {
    const chips = document.querySelectorAll('.city-chip');
    chips.forEach(chip => {
      const chipCity = chip.getAttribute('data-city') || '';
      chip.classList.toggle('active', chipCity.toLowerCase() === (this.filters.city || '').toLowerCase());
    });
  },

  applyFilters() {
    const cityEl = document.getElementById('filter-city');
    const expEl = document.getElementById('filter-experience');
    const connEl = document.getElementById('filter-connection');
    this.filters.city = cityEl ? cityEl.value : '';
    this.filters.experience = expEl ? expEl.value : '';
    this.filters.connection_type = connEl ? connEl.value : '';
    this.updateCityChipsUI();
    this.updateFilterButtonBadge();
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
          <h2 style="font-size: 1.6rem; margin-bottom: 12px;">You've Caught Up!</h2>
          <p style="color: var(--color-text-secondary); max-width: 440px; margin: 0 auto 24px;">
            You have reviewed all available Garba profiles matching your current filters. Adjust your filters to meet more dancers!
          </p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button class="btn btn-secondary" onclick="Discover.resetFilters()">Clear Filters</button>
          </div>
        </div>
      `;
      return;
    }

    const p = this.profiles[this.currentIndex];
    this.currentPhotoIndex = 0;
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.display_name)}&background=111827&color=fff&size=512`;
    const photosList = (p.photos && p.photos.length > 0) ? p.photos : (p.primary_photo ? [p.primary_photo] : []);
    const photoUrl = photosList[0] || p.primary_photo || defaultAvatar;
    const isPhotoLocked = !!p.photo_locked;

    cardArea.innerHTML = `
      <div class="partner-card">
        <div class="partner-card-media" id="partner-media-container">
          ${isPhotoLocked ? `
            <img src="${defaultAvatar}" alt="${p.display_name}" class="partner-card-img" style="filter: blur(14px) brightness(0.65); transform: scale(1.08);">
            <div class="photo-locked-overlay" onclick="Router.navigate('/pricing')">
              <div class="photo-lock-icon-badge">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span>Photo Protected</span>
              </div>
              <p style="font-size: 0.88rem; color: #FFFFFF; font-weight: 700; margin: 8px 0 12px; text-shadow: 0 1px 4px rgba(0,0,0,0.8); line-height: 1.35; max-width: 250px;">
                Buy Spark Plan (₹249) to unlock profile photo
              </p>
              <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); Router.navigate('/pricing');" style="box-shadow: 0 4px 14px rgba(236,29,36,0.5); font-weight: 800;">
                Unlock Photo (₹249)
              </button>
            </div>
          ` : `
            <img id="partner-active-img" src="${photoUrl}" alt="${p.display_name}" class="partner-card-img" onerror="this.src='${defaultAvatar}'">

            ${p.can_see_all_photos && photosList.length > 1 ? `
              <div class="story-bars-container">
                ${photosList.map((_, idx) => `
                  <div class="story-bar-segment ${idx === 0 ? 'active' : ''}"></div>
                `).join('')}
              </div>
              <div class="photo-nav-tap tap-left" onclick="Discover.prevPhoto()" aria-label="Previous photo"></div>
              <div class="photo-nav-tap tap-right" onclick="Discover.nextPhoto()" aria-label="Next photo"></div>
              <div class="photo-count-badge">
                1 / ${photosList.length} Photos
              </div>
            ` : p.explore_photos_locked ? `
              <div class="photo-explore-locked-badge" onclick="Discover.promptExploreAllPhotos('${p.display_name.replace(/'/g, "\\'")}', ${p.total_photos_count})">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span>1 of ${p.total_photos_count} Photos • Explore All (₹549)</span>
              </div>
            ` : ''}
          `}

          <div class="partner-card-overlay">
            <div>
              <div class="partner-card-name">${p.display_name}, ${p.age}</div>
              <div class="partner-card-meta">
                <span>${p.city}</span>
                <span>·</span>
                <span style="text-transform: capitalize;">${p.garba_experience} Dancer</span>
              </div>
            </div>
            <span class="partner-badge">Navratri 2026</span>
          </div>
        </div>

        <div class="partner-card-body">
          <p class="partner-bio">${p.bio || 'Excited for vibrant Raas and traditional Garba nights!'}</p>

          <div class="partner-seeking-wrap" style="margin-bottom: 8px;">
            <strong style="font-size: 0.8rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Seeking:</strong>
            <div class="pill-list" style="margin-top: 4px;">
              ${(p.connection_types || []).map(ct => `
                <span class="pill pill-accent">${ct === 'partner' ? 'Garba Partner' : ct === 'dating' ? 'Open to Dating' : ct}</span>
              `).join('')}
            </div>
          </div>

          ${p.dance_style ? `
            <div class="partner-styles-wrap" style="margin-bottom: 8px;">
              <strong style="font-size: 0.8rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Styles:</strong>
              <div class="pill-list" style="margin-top: 4px;">
                <span class="pill">${p.dance_style}</span>
                ${p.preferred_language ? `<span class="pill">${p.preferred_language}</span>` : ''}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Swipe Action Bar -->
        <div class="swipe-actions">
          <button class="action-circle-btn btn-flag" title="Report or Block" onclick="Discover.openOptions(${p.user_id}, '${p.display_name.replace(/'/g, "\\'")}')" style="font-size: 0.82rem; font-weight: 700;">
            Report
          </button>
          
          <button class="action-circle-btn btn-pass" title="Pass" onclick="Discover.handleAction(${p.user_id}, 'pass')" style="font-size: 0.95rem; font-weight: 700;">
            Pass
          </button>

          <button class="action-circle-btn btn-like" title="Like / Send Interest" onclick="Discover.handleAction(${p.user_id}, 'like')" style="font-size: 0.95rem; font-weight: 700;">
            Like
          </button>
        </div>
      </div>
    `;

    const cardEl = cardArea.querySelector('.partner-card');
    if (cardEl) {
      this.attachSwipeGestures(cardEl, p.user_id);
    }
  },

  attachSwipeGestures(cardEl, userId) {
    if (!cardEl) return;
    let startX = 0, startY = 0, currentX = 0;
    let isDragging = false;

    cardEl.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      currentX = startX;
      isDragging = true;
      cardEl.style.transition = 'none';
    }, { passive: true });

    cardEl.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      currentX = e.touches[0].clientX;
      const diffX = currentX - startX;
      const diffY = e.touches[0].clientY - startY;

      if (Math.abs(diffX) > Math.abs(diffY)) {
        const rotation = diffX * 0.05;
        cardEl.style.transform = `translateX(${diffX}px) rotate(${rotation}deg)`;
        cardEl.style.opacity = Math.max(0.65, 1 - Math.abs(diffX) / 500);
      }
    }, { passive: true });

    cardEl.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      const diffX = currentX - startX;
      cardEl.style.transition = 'transform 0.28s ease, opacity 0.28s ease';

      if (diffX > 80) {
        cardEl.style.transform = 'translateX(100vw) rotate(16deg)';
        setTimeout(() => this.handleAction(userId, 'like'), 140);
      } else if (diffX < -80) {
        cardEl.style.transform = 'translateX(-100vw) rotate(-16deg)';
        setTimeout(() => this.handleAction(userId, 'pass'), 140);
      } else {
        cardEl.style.transform = 'translateX(0) rotate(0)';
        cardEl.style.opacity = '1';
      }
    });
  },

  resetFilters() {
    this.filters = { city: '', experience: '', connection_type: '', min_age: '', max_age: '' };
    const cityEl = document.getElementById('filter-city');
    const expEl = document.getElementById('filter-experience');
    const connEl = document.getElementById('filter-connection');
    if (cityEl) cityEl.value = '';
    if (expEl) expEl.value = '';
    if (connEl) connEl.value = '';
    this.updateCityChipsUI();
    this.updateFilterButtonBadge();
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

      await this.updateAllowanceUI();
      this.currentIndex++;
      this.currentPhotoIndex = 0;
      this.renderCurrentCard();
    } catch (err) {
      if (err.message && err.message.includes('daily interest allowance')) {
        if (confirm(`${err.message}\n\nWould you like to upgrade your Flirta plan to send more interest expressions?`)) {
          Router.navigate('/pricing');
        }
      } else {
        showToast(err.message, 'error');
      }
    }
  },

  nextPhoto() {
    const p = this.profiles[this.currentIndex];
    if (!p || !p.photos || p.photos.length <= 1) return;
    this.currentPhotoIndex = (this.currentPhotoIndex + 1) % p.photos.length;
    this.updateActivePhotoUI(p);
  },

  prevPhoto() {
    const p = this.profiles[this.currentIndex];
    if (!p || !p.photos || p.photos.length <= 1) return;
    this.currentPhotoIndex = (this.currentPhotoIndex - 1 + p.photos.length) % p.photos.length;
    this.updateActivePhotoUI(p);
  },

  updateActivePhotoUI(p) {
    const imgEl = document.getElementById('partner-active-img');
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.display_name)}&background=111827&color=fff&size=512`;
    if (imgEl && p.photos) {
      imgEl.src = p.photos[this.currentPhotoIndex] || defaultAvatar;
    }
    const countEl = document.querySelector('.photo-count-badge');
    if (countEl && p.photos) {
      countEl.textContent = `${this.currentPhotoIndex + 1} / ${p.photos.length} Photos`;
    }
    const segments = document.querySelectorAll('.story-bar-segment');
    segments.forEach((seg, idx) => {
      seg.classList.toggle('active', idx === this.currentPhotoIndex);
    });
  },

  promptExploreAllPhotos(name, count) {
    if (confirm(`Want to explore all ${count} photos of ${name}?\n\nUpgrade to the Chemistry Plan (₹549) to unlock the full dancer photo gallery and see who liked you!`)) {
      Router.navigate('/pricing');
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
        <h2 style="font-size: 2rem; color: var(--color-primary); margin: 12px 0;">It's a Mutual Match!</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: 24px; font-size: 1rem;">
          You and <strong>${profile.display_name}</strong> both expressed interest in each other! You can now coordinate your Garba nights and chat.
        </p>
        <div style="display: flex; gap: 14px; justify-content: center;">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Keep Browsing</button>
          <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove(); Router.navigate('/matches')">Open Chat</button>
        </div>
      </div>
    `;
    document.body.appendChild(celebrationOverlay);
  }
};

window.Discover = Discover;
