// GarbaJodi Profile & Photo Management Component

const Profile = {
  profileData: null,
  photos: [],
  subData: null,

  async render() {
    if (!State.isAuthenticated()) {
      openAuthModal('login');
      return;
    }

    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="container" style="max-width: 720px;">
        <h1 style="font-size: 1.9rem; margin-bottom: 24px;">Your profile</h1>

        <div id="profile-content-area">
          <div style="text-align: center; padding: 40px; color: var(--color-gold-light);">
            Loading profile...
          </div>
        </div>
      </div>
    `;

    await this.loadProfile();
  },

  async loadProfile() {
    try {
      const [res, sub] = await Promise.all([
        API.get('/api/profile'),
        API.get('/api/subscriptions/me').catch(() => null)
      ]);
      this.profileData = res;
      this.photos = res.photos || [];
      this.subData = sub;
      this.renderProfileForm();
      this.loadTrustPanels();
    } catch (err) {
      document.getElementById('profile-content-area').innerHTML = `
        <div class="card" style="text-align: center; color: var(--color-danger); padding: 30px;">
          Failed to load profile: ${err.message}
        </div>
      `;
    }
  },

  renderProfileForm() {
    const p = this.profileData;
    const sub = this.subData;
    const area = document.getElementById('profile-content-area');
    if (!area) return;

    const connectionTypes = p.connection_types || ['partner'];
    const planName = sub && sub.subscription ? sub.subscription.planName : 'Free';
    const hasActiveSub = sub && sub.hasActiveSubscription;
    const expiryStr = sub && sub.subscription ? new Date(sub.subscription.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

    area.innerHTML = `
      <!-- Flirta Subscription & Status Card -->
      <div class="card" style="margin-bottom: 24px; border: 1.5px solid ${hasActiveSub ? 'var(--color-primary)' : 'var(--color-border)'}; background: ${hasActiveSub ? 'linear-gradient(135deg, rgba(236,29,36,0.04) 0%, rgba(245,166,35,0.06) 100%)' : '#FFF'};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 14px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.78rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.08em; color: var(--color-primary);">Flirta Pass</span>
              ${hasActiveSub ? `<span class="badge" style="background: rgba(16,185,129,0.15); color: #059669; font-weight: 700;">Active</span>` : `<span class="badge" style="background: #F3F4F6; color: #6B7280;">Basic Free</span>`}
            </div>
            <h3 style="font-size: 1.35rem; margin: 4px 0 2px 0;">${planName}</h3>
            ${expiryStr ? `<p style="font-size: 0.82rem; color: var(--color-text-secondary); margin: 0;">Valid until: <strong>${expiryStr}</strong></p>` : `<p style="font-size: 0.82rem; color: var(--color-text-secondary); margin: 0;">Unlock "Who Liked You", profile boosts & higher daily limits.</p>`}
          </div>

          <a href="#/pricing" class="btn ${hasActiveSub ? 'btn-secondary' : 'btn-primary'} btn-sm">
            ${hasActiveSub ? 'Change Plan' : 'Upgrade to Flirta Pass'}
          </a>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; padding-top: 14px; border-top: 1px solid var(--color-border);">
          <div style="padding: 10px; background: rgba(0,0,0,0.02); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Daily Likes</div>
            <div style="font-weight: 700; font-size: 1.1rem; color: var(--color-text-primary); margin-top: 2px;">
              ${sub && sub.usage ? `${sub.usage.likesToday} / ${sub.usage.dailyLimit}` : '0 / 5'}
            </div>
          </div>

          <div style="padding: 10px; background: rgba(0,0,0,0.02); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Boost Credits</div>
            <div style="font-weight: 700; font-size: 1.1rem; color: var(--color-text-primary); margin-top: 2px;">
              ${sub && sub.subscription ? sub.subscription.remainingBoosts : 0} on plan
            </div>
          </div>

          <div style="padding: 10px; background: rgba(0,0,0,0.02); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Visibility</div>
            <div style="font-weight: 700; font-size: 0.95rem; color: ${sub && sub.is_boosted ? 'var(--color-primary)' : 'var(--color-text-primary)'}; margin-top: 2px;">
              ${sub && sub.usage && sub.usage.isBoosted ? 'Boosted' : 'Standard'}
            </div>
          </div>
        </div>
      </div>

      <div id="trust-panels"></div>

      <!-- Photo Gallery Card -->
      <div class="card" style="margin-bottom: 24px;">
        <h3 style="font-size: 1.2rem; margin-bottom: 14px;">Profile Photos</h3>
        <p style="color: var(--color-text-secondary); font-size: 0.88rem; margin-bottom: 16px;">
          Add photos of yourself. JPEG, PNG, or WebP. Max 5MB each.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 14px; margin-bottom: 18px;">
          ${this.photos.map(ph => `
            <div style="position: relative; border-radius: 12px; overflow: hidden; height: 160px; border: 2px solid ${ph.is_primary ? 'var(--color-gold)' : 'transparent'};">
              <img src="${ph.photo_url}" style="width: 100%; height: 100%; object-fit: cover;">
              ${ph.is_primary ? `
                <span style="position: absolute; top: 6px; left: 6px; background: var(--color-gold); color: #000; font-size: 0.65rem; font-weight: 800; padding: 2px 6px; border-radius: 4px;">
                  PRIMARY
                </span>
              ` : `
                <button type="button" onclick="Profile.setPrimaryPhoto(${ph.id})" style="position: absolute; top: 6px; left: 6px; background: rgba(0,0,0,0.7); color: #FFF; border: none; font-size: 0.7rem; padding: 3px 6px; border-radius: 4px; cursor: pointer;">
                  Set Primary
                </button>
              `}
              <button type="button" onclick="Profile.deletePhoto(${ph.id})" style="position: absolute; top: 6px; right: 6px; background: rgba(239,68,68,0.85); color: #FFF; border: none; font-size: 0.75rem; width: 22px; height: 22px; border-radius: 50%; cursor: pointer;">
                ✕
              </button>
            </div>
          `).join('')}

          <!-- Upload Box -->
          <label style="border: 2px dashed var(--color-plum-border); border-radius: 12px; height: 160px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-muted); transition: var(--transition);">
            <span style="font-size: 0.88rem; font-weight: 700;">+ Add Photo</span>
            <input type="file" id="photo-upload-input" accept="image/jpeg,image/png,image/webp" style="display: none;" onchange="Profile.handlePhotoUpload(event)">
          </label>
        </div>
      </div>

      <!-- Main Profile Form -->
      <form class="card" onsubmit="Profile.handleSave(event)">
        <h3 style="font-size: 1.2rem; margin-bottom: 18px;">Profile details</h3>

        <div class="form-group">
          <label class="form-label">Display Name</label>
          <input type="text" id="prof-name" class="form-control" value="${escapeHtml(p.display_name || '')}" required>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
          <div class="form-group">
            <label class="form-label">City</label>
            <select id="prof-city" class="form-control">
              <option value="Ahmedabad" ${p.city === 'Ahmedabad' ? 'selected' : ''}>Ahmedabad (Gujarat)</option>
              <option value="Surat" ${p.city === 'Surat' ? 'selected' : ''}>Surat (Gujarat)</option>
              <option value="Vadodara" ${p.city === 'Vadodara' ? 'selected' : ''}>Vadodara (Gujarat)</option>
              <option value="Rajkot" ${p.city === 'Rajkot' ? 'selected' : ''}>Rajkot (Gujarat)</option>
              <option value="Gandhinagar" ${p.city === 'Gandhinagar' ? 'selected' : ''}>Gandhinagar (Gujarat)</option>
              <option value="Bhavnagar" ${p.city === 'Bhavnagar' ? 'selected' : ''}>Bhavnagar (Gujarat)</option>
              <option value="Jamnagar" ${p.city === 'Jamnagar' ? 'selected' : ''}>Jamnagar (Gujarat)</option>
              <option value="Junagadh" ${p.city === 'Junagadh' ? 'selected' : ''}>Junagadh (Gujarat)</option>
              <option value="Anand" ${p.city === 'Anand' ? 'selected' : ''}>Anand (Gujarat)</option>
              <option value="Navsari" ${p.city === 'Navsari' ? 'selected' : ''}>Navsari (Gujarat)</option>
              <option value="Morbi" ${p.city === 'Morbi' ? 'selected' : ''}>Morbi (Gujarat)</option>
              <option value="Bharuch" ${p.city === 'Bharuch' ? 'selected' : ''}>Bharuch (Gujarat)</option>
              <option value="Mehsana" ${p.city === 'Mehsana' ? 'selected' : ''}>Mehsana (Gujarat)</option>
              <option value="Bhuj" ${p.city === 'Bhuj' ? 'selected' : ''}>Bhuj (Gujarat)</option>
              <option value="Porbandar" ${p.city === 'Porbandar' ? 'selected' : ''}>Porbandar (Gujarat)</option>
              <option value="Valsad" ${p.city === 'Valsad' ? 'selected' : ''}>Valsad (Gujarat)</option>
              <option value="Vapi" ${p.city === 'Vapi' ? 'selected' : ''}>Vapi (Gujarat)</option>
              <option value="Mumbai" ${p.city === 'Mumbai' ? 'selected' : ''}>Mumbai</option>
              <option value="Indore" ${p.city === 'Indore' ? 'selected' : ''}>Indore</option>
            </select>
          </div>

        </div>

        <div class="form-group">
          <label class="form-label">Bio</label>
          <textarea id="prof-bio" class="form-control" rows="3" maxlength="500" placeholder="A short bio">${escapeHtml(p.bio || '')}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Interests</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${(window.RULES ? RULES.interests : []).map(interest => `
              <label class="form-checkbox">
                <input type="checkbox" class="interest-box" value="${interest}" ${(Array.isArray(p.interests) ? p.interests : []).includes(interest) ? 'checked' : ''}>
                <span>${interest}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Preferred Languages</label>
          <input type="text" id="prof-lang" class="form-control" placeholder="e.g. Gujarati, Hindi, English" value="${escapeHtml(p.preferred_language || '')}">
        </div>

        <div class="form-group">
          <label class="form-label">Interests & Hobbies</label>
          <input type="text" id="prof-hobbies" class="form-control" placeholder="e.g. Traditional Costumes, Photography, Live Folk Music" value="${escapeHtml(p.hobbies || '')}">
        </div>

        <!-- Connection Types -->
        <div class="form-group">
          <label class="form-label">What are you looking for? (Select all that apply)</label>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 8px;">
            <label class="form-checkbox">
              <input type="checkbox" id="conn-partner" ${connectionTypes.includes('partner') ? 'checked' : ''}>
              <span>Dating</span>
            </label>
            <label class="form-checkbox">
              <input type="checkbox" id="conn-friendship" ${connectionTypes.includes('friendship') ? 'checked' : ''}>
              <span>Friendship</span>
            </label>
            <label class="form-checkbox">
              <input type="checkbox" id="conn-dating" ${connectionTypes.includes('dating') ? 'checked' : ''}>
              <span>Open to Dating</span>
            </label>
          </div>
        </div>

        <!-- Discoverability Toggle -->
        <div class="form-group" style="padding: 16px; background: #F9FAFB; border: 1px solid var(--color-border); border-radius: 12px; margin-top: 20px;">
          <label class="form-checkbox">
            <input type="checkbox" id="prof-discoverable" ${p.is_discoverable === 1 ? 'checked' : ''}>
            <div>
              <strong style="color: var(--color-text-primary);">Visible in Partner Discovery</strong>
              <div style="font-size: 0.82rem; color: var(--color-text-secondary); margin-top: 2px;">
                When turned off, potential matches will not be able to discover or swipe on your profile. Existing matches remain active.
              </div>
            </div>
          </label>
        </div>

        <button type="submit" class="btn btn-primary btn-block" style="margin-top: 24px;">
          Save Profile Changes
        </button>
      </form>

      <!-- Account Actions -->
      <div class="card" style="margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h4 style="color: var(--color-danger); margin-bottom: 4px;">Account Settings</h4>
          <span style="font-size: 0.82rem; color: var(--color-text-muted);">Registered as 18+ verified adult member. DPDP Act Right to Erasure enabled.</span>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary btn-sm" onclick="Profile.logout()">Log Out</button>
          <button class="btn btn-danger btn-sm" onclick="Profile.deleteAccount()">Delete Account</button>
        </div>
      </div>

      <!-- Legal, Privacy & Grievance Access in Profile -->
      <div class="card" style="margin-top: 16px; background: #FAFAFA; border: 1px solid var(--color-border); padding: 18px;">
        <div style="font-size: 0.78rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.08em; color: var(--color-text-muted); margin-bottom: 8px;">
          Trust, Safety & Legal Governance
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 14px; font-size: 0.85rem; font-weight: 600;">
          <a href="/terms" data-link style="color: var(--color-primary);">Terms of Service</a>
          <a href="/privacy" data-link style="color: var(--color-primary);">Privacy Policy (DPDP Act)</a>
          <a href="/anti-escort-policy" data-link style="color: var(--color-primary);">Anti-Escort Code</a>
          <a href="/safety" data-link style="color: var(--color-primary);">Offline Safety Guidelines</a>
          <a href="/refund-policy" data-link style="color: var(--color-primary);">Refund Policy</a>
          <a href="/contact" data-link style="color: var(--color-primary);">Contact Support</a>
          <a href="/grievance" data-link style="color: var(--color-primary);">File Statutory Grievance</a>
        </div>
      </div>
    `;
  },

  async handleSave(e) {
    e.preventDefault();
    const displayName = document.getElementById('prof-name').value;
    const city = document.getElementById('prof-city').value;
    const bio = document.getElementById('prof-bio').value;
    const preferredLanguage = document.getElementById('prof-lang').value;
    const hobbies = document.getElementById('prof-hobbies').value;
    const interests = Array.from(document.querySelectorAll('.interest-box:checked')).map(el => el.value);
    const isDiscoverable = document.getElementById('prof-discoverable').checked ? 1 : 0;

    const connectionTypes = [];
    if (document.getElementById('conn-partner').checked) connectionTypes.push('partner');
    if (document.getElementById('conn-friendship').checked) connectionTypes.push('friendship');
    if (document.getElementById('conn-dating').checked) connectionTypes.push('dating');

    try {
      const res = await API.put('/api/profile', {
        displayName,
        city,
        bio,
        interests,
        preferredLanguage,
        hobbies,
        connectionTypes,
        isDiscoverable
      });

      this.profileData = res.profile;
      State.setUser(State.user, res.profile, this.photos);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      showToast('Uploading photo...', 'info');
      const res = await API.upload('/api/profile/photos', formData);
      showToast('Photo uploaded successfully!', 'success');
      this.photos.push(res.photo);
      this.renderProfileForm();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async setPrimaryPhoto(photoId) {
    try {
      await API.patch(`/api/profile/photos/${photoId}/primary`);
      showToast('Primary photo updated.', 'success');
      this.photos.forEach(p => p.is_primary = (p.id === photoId ? 1 : 0));
      this.renderProfileForm();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async deletePhoto(photoId) {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    try {
      await API.delete(`/api/profile/photos/${photoId}`);
      showToast('Photo deleted.', 'info');
      this.photos = this.photos.filter(p => p.id !== photoId);
      this.renderProfileForm();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async loadTrustPanels() {
    const mount = document.getElementById('trust-panels');
    if (!mount) return;
    mount.innerHTML = '<p>Loading account tools…</p>';
    try {
      const [verification, referral, host] = await Promise.all([
        API.get('/api/profile/verification'),
        API.get('/api/referrals/me'),
        API.get('/api/hosts/me/earnings').catch(() => ({ missing: true }))
      ]);
      const rules = referral.rules || {};
      const hostRules = host.rules || (window.RULES && window.RULES.host) || {};
      const captured = host.captured || { earned_inr: 0, fees_inr: 0 };
      const capturedRows = (host.transactions || []).filter(t => t.status === 'captured');
      mount.innerHTML = `
        <div class="card" style="margin-bottom: 16px;">
          <h3>Photo verification</h3>
          <p>${verification.isPhotoVerified ? 'Photo verified badge is on your profile.' : 'Upload a selfie. A moderator reviews it before the badge is shown.'}</p>
          <form onsubmit="Profile.submitSelfie(event)">
            <input id="selfie-file" type="file" accept="image/jpeg,image/png,image/webp" required>
            <button class="btn btn-secondary btn-sm" type="submit">Submit selfie</button>
          </form>
          <p id="selfie-status" style="font-size: 0.85rem;"></p>
        </div>
        <div class="card" style="margin-bottom: 16px;">
          <h3>Referral rewards</h3>
          <p>Your code: <strong>${referral.code}</strong></p>
          <p>${rules.trigger || ''}</p>
          <p>${rules.order || ''}</p>
          <p>Recorded rewards: ${referral.totals.rewards}. Premium days recorded: ${referral.totals.premium_days}. Wallet credits recorded: ₹${referral.totals.wallet_inr}. Wallet balance: ₹${referral.walletInr}.</p>
          ${referral.rewards.length ? `<ul>${referral.rewards.map(r => `<li>${r.reward_type}: ${r.premium_days ? r.premium_days + ' days' : '₹' + r.wallet_inr}</li>`).join('')}</ul>` : '<p>No referral rewards recorded yet.</p>'}
        </div>
        <div class="card" style="margin-bottom: 16px;">
          <h3>Host ledger</h3>
          <p>${hostRules.explanation || ''}</p>
          ${host.missing ? `<form onsubmit="Profile.applyHost(event)"><textarea id="host-pitch" class="form-control" maxlength="300" placeholder="What do you host?"></textarea><button class="btn btn-secondary btn-sm" type="submit">Apply as host</button></form>` : `
            <p>Status: ${host.hostStatus}. Captured host earnings: ₹${captured.earned_inr}. Fees on those rows: ₹${captured.fees_inr}. Available: ₹${host.availableInr}.</p>
            ${capturedRows.length ? `<ul>${capturedRows.map(t => `<li>${t.kind} ₹${t.host_earning_inr} earned, fee ₹${t.platform_fee_inr}</li>`).join('')}</ul>` : '<p>No captured host transactions.</p>'}
            ${host.hostStatus === 'verified' ? '<button class="btn btn-secondary btn-sm" type="button" onclick="Profile.requestPayout()">Request payout</button>' : ''}
          `}
        </div>
      `;
    } catch (err) {
      mount.innerHTML = `<div class="card"><p>Could not load account tools: ${err.message}</p></div>`;
    }
  },

  async submitSelfie(e) {
    e.preventDefault();
    const file = document.getElementById('selfie-file').files[0];
    const status = document.getElementById('selfie-status');
    const body = new FormData();
    body.append('selfie', file);
    try {
      const res = await API.upload('/api/profile/verification', body);
      if (status) status.textContent = res.message;
    } catch (err) {
      if (status) status.textContent = err.message;
    }
  },

  async applyHost(e) {
    e.preventDefault();
    try {
      const res = await API.post('/api/hosts/apply', { pitch: document.getElementById('host-pitch').value.trim() });
      showToast(res.message, 'success');
      this.loadTrustPanels();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async requestPayout() {
    try {
      const res = await API.post('/api/hosts/payouts', {});
      showToast(`Payout requested for ₹${res.payout.amount_inr}.`, 'success');
      this.loadTrustPanels();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  logout() {
    API.setToken(null);
    State.setUser(null, null, []);
    showToast('Logged out.', 'info');
    Router.navigate('/');
  },

  async deleteAccount() {
    if (!confirm('CAUTION: Are you sure you want to permanently delete your account? All matches, photos, and messages will be removed permanently.')) {
      return;
    }

    try {
      await API.delete('/api/auth/account');
      API.setToken(null);
      State.setUser(null, null, []);
      showToast('Account permanently deleted.', 'info');
      Router.navigate('/');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },
};

window.Profile = Profile;
