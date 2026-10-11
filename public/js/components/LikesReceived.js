// Flirta "Who Liked You" Premium Entitlement Component

const LikesReceived = {
  data: null,

  async render() {
    if (!State.isAuthenticated()) {
      openAuthModal('login');
      return;
    }

    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="container" style="max-width: 800px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h1 style="font-size: 1.9rem; margin-bottom: 6px;">Who Liked You</h1>
            <p style="color: var(--color-text-secondary); font-size: 0.95rem;">
              Profiles waiting to be your match this Navratri 2026.
            </p>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/pricing')">
            Upgrade Plan
          </button>
        </div>

        <div id="likes-received-container">
          <div style="text-align: center; padding: 40px; color: var(--color-primary);">
            Loading your admirers...
          </div>
        </div>
      </div>
    `;

    await this.loadData();
  },

  async loadData() {
    const container = document.getElementById('likes-received-container');
    try {
      const res = await API.get('/api/subscriptions/likes-received');
      this.data = res;
      this.renderView();
    } catch (err) {
      container.innerHTML = `
        <div class="card" style="text-align: center; color: var(--color-danger); padding: 30px;">
          Failed to load incoming likes: ${err.message}
        </div>
      `;
    }
  },

  renderView() {
    const container = document.getElementById('likes-received-container');
    if (!container || !this.data) return;

    const { canSeeLikes, totalCount, likers } = this.data;

    // 1. Locked Teaser State (Free or Spark Plan)
    if (!canSeeLikes) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 50px 24px; border: 2px dashed var(--color-primary-border); background: var(--color-primary-soft);">
          <h2 style="font-size: 1.8rem; margin-bottom: 12px; color: var(--color-text-primary);">
            ${totalCount > 0 ? `${totalCount} Potential Matches Expressed Interest in You!` : 'Unlock Who Liked You'}
          </h2>
          <p style="color: var(--color-text-secondary); max-width: 480px; margin: 0 auto 24px; font-size: 1rem; line-height: 1.5;">
            ${totalCount > 0
              ? `There are ${totalCount} potential matches waiting to connect with you. Upgrade to the Chemistry plan to reveal their profiles and match back instantly!`
              : `When someone likes your profile, you can instantly see your match and connect without having to swipe through the deck.`}
          </p>

          <!-- Blurred Card Teaser Mockups -->
          <div style="display: flex; justify-content: center; gap: 14px; margin-bottom: 30px; filter: blur(5px); opacity: 0.7; pointer-events: none;">
            <div style="width: 120px; height: 160px; background: #E5E7EB; border-radius: 12px;"></div>
            <div style="width: 120px; height: 160px; background: #D1D5DB; border-radius: 12px;"></div>
            <div style="width: 120px; height: 160px; background: #E5E7EB; border-radius: 12px;"></div>
          </div>

          <button class="btn btn-primary" onclick="Router.navigate('/pricing')">
            Unlock for ₹549 (Chemistry Plan)
          </button>
        </div>
      `;
      return;
    }

    // 2. Empty State
    if (!likers || likers.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 60px 20px;">
          <h3 style="margin-bottom: 8px;">No Pending Likes Right Now</h3>
          <p style="color: var(--color-text-secondary); max-width: 400px; margin: 0 auto 20px;">
            You have reviewed all potential matches who sent you interest. Activate a Profile Boost to be seen by more people!
          </p>
          <button class="btn btn-primary btn-sm" onclick="Router.navigate('/discover')">Browse Discovery Deck</button>
        </div>
      `;
      return;
    }

    // 3. Unlocked Active List
    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
        ${likers.map(l => {
          const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(l.display_name)}&background=EC1D24&color=fff&size=256`;
          const avatar = l.primary_photo || defaultAvatar;

          return `
            <div class="card" style="padding: 18px; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="position: relative; height: 220px; border-radius: 14px; overflow: hidden; margin-bottom: 14px; background: #111;">
                  <img src="${avatar}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='${defaultAvatar}'">
                    <div style="font-weight: 800; font-size: 1.05rem; display: flex; align-items: center; gap: 4px;">
                      <span>${l.display_name}, ${l.age}</span>
                      ${(l.auth_provider === 'google' || l.is_phone_verified) ? `<span class="badge" style="background:#10B981; color:#fff; font-size:0.65rem; padding:1px 6px; border-radius:10px;">✓ Verified</span>` : ''}
                    </div>
                    <div style="font-size: 0.78rem; color: var(--color-secondary);">${l.city} · ${l.garba_experience}</div>
                  </div>
                </div>

                <p style="font-size: 0.88rem; color: var(--color-text-secondary); line-height: 1.4; margin-bottom: 14px;">
                  ${l.bio || 'Excited for Navratri 2026!'}
                </p>
              </div>

              <div style="padding-top: 12px; border-top: 1px solid var(--color-border);">
                <button class="btn btn-primary btn-sm btn-block" onclick="LikesReceived.matchBack(${l.user_id}, '${l.display_name.replace(/'/g, "\\'")}')">
                  Match Back & Chat
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  async matchBack(userId, name) {
    try {
      const res = await API.post('/api/match/like', { receiverId: userId, action: 'like' });
      if (res.isMatch) {
        showToast(`It's a Garba Jodi match with ${name}! Opening conversation...`, 'success');
        setTimeout(() => Router.navigate('/matches'), 800);
      } else {
        showToast('Interest sent!', 'info');
        await this.loadData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};

window.LikesReceived = LikesReceived;
