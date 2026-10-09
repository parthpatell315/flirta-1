// GarbaJodi Profile & Photo Management Component

const Profile = {
  profileData: null,
  photos: [],

  async render() {
    if (!State.isAuthenticated()) {
      openAuthModal('login');
      return;
    }

    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="container" style="max-width: 720px;">
        <h1 style="font-size: 1.9rem; margin-bottom: 24px;">Your Festive Profile 🪔</h1>

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
      const res = await API.get('/api/profile');
      this.profileData = res;
      this.photos = res.photos || [];
      this.renderProfileForm();
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
    const area = document.getElementById('profile-content-area');
    if (!area) return;

    const connectionTypes = p.connection_types || ['partner'];

    area.innerHTML = `
      <!-- Photo Gallery Card -->
      <div class="card" style="margin-bottom: 24px;">
        <h3 style="font-size: 1.2rem; margin-bottom: 14px;">Profile Photos</h3>
        <p style="color: var(--color-text-secondary); font-size: 0.88rem; margin-bottom: 16px;">
          Upload clear photos showing your festive Garba attire. Max 5MB per photo (JPEG, PNG, WebP).
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
            <span style="font-size: 1.8rem;">📷</span>
            <span style="font-size: 0.82rem; margin-top: 4px;">+ Add Photo</span>
            <input type="file" id="photo-upload-input" accept="image/jpeg,image/png,image/webp" style="display: none;" onchange="Profile.handlePhotoUpload(event)">
          </label>
        </div>
      </div>

      <!-- Main Profile Form -->
      <form class="card" onsubmit="Profile.handleSave(event)">
        <h3 style="font-size: 1.2rem; margin-bottom: 18px;">Personal & Dance Details</h3>

        <div class="form-group">
          <label class="form-label">Display Name</label>
          <input type="text" id="prof-name" class="form-control" value="${escapeHtml(p.display_name || '')}" required>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div class="form-group">
            <label class="form-label">City</label>
            <select id="prof-city" class="form-control">
              <option value="Ahmedabad" ${p.city === 'Ahmedabad' ? 'selected' : ''}>Ahmedabad</option>
              <option value="Vadodara" ${p.city === 'Vadodara' ? 'selected' : ''}>Vadodara</option>
              <option value="Surat" ${p.city === 'Surat' ? 'selected' : ''}>Surat</option>
              <option value="Mumbai" ${p.city === 'Mumbai' ? 'selected' : ''}>Mumbai</option>
              <option value="Rajkot" ${p.city === 'Rajkot' ? 'selected' : ''}>Rajkot</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Garba Skill Level</label>
            <select id="prof-experience" class="form-control">
              <option value="beginner" ${p.garba_experience === 'beginner' ? 'selected' : ''}>Beginner (Learning Steps)</option>
              <option value="intermediate" ${p.garba_experience === 'intermediate' ? 'selected' : ''}>Intermediate (Grooving easily)</option>
              <option value="advanced" ${p.garba_experience === 'advanced' ? 'selected' : ''}>Advanced (Raas Enthusiast)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Short Bio</label>
          <textarea id="prof-bio" class="form-control" rows="3" placeholder="Tell other dancers about your festive enthusiasm, preferred venues, and music taste...">${escapeHtml(p.bio || '')}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Favorite Dance Steps / Styles</label>
          <input type="text" id="prof-dance-style" class="form-control" placeholder="e.g. Dodhiya, Popat, 3-Taali, Heech, Free Style" value="${escapeHtml(p.dance_style || '')}">
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
              <span>🪘 Garba Dance Partner</span>
            </label>
            <label class="form-checkbox">
              <input type="checkbox" id="conn-friendship" ${connectionTypes.includes('friendship') ? 'checked' : ''}>
              <span>🤝 Festive Friendship</span>
            </label>
            <label class="form-checkbox">
              <input type="checkbox" id="conn-group" ${connectionTypes.includes('group') ? 'checked' : ''}>
              <span>👥 Group Participation</span>
            </label>
            <label class="form-checkbox">
              <input type="checkbox" id="conn-dating" ${connectionTypes.includes('dating') ? 'checked' : ''}>
              <span>✨ Open to Dating</span>
            </label>
          </div>
        </div>

        <!-- Discoverability Toggle -->
        <div class="form-group" style="padding: 14px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-top: 20px;">
          <label class="form-checkbox">
            <input type="checkbox" id="prof-discoverable" ${p.is_discoverable === 1 ? 'checked' : ''}>
            <div>
              <strong style="color: #FFF;">Visible in Partner Discovery</strong>
              <div style="font-size: 0.8rem; color: var(--color-text-muted);">
                When turned off, other dancers will not be able to discover or swipe on your profile. Existing matches remain active.
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
          <span style="font-size: 0.82rem; color: var(--color-text-muted);">Registered as 18+ verified adult dancer.</span>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary btn-sm" onclick="Profile.logout()">Log Out</button>
          <button class="btn btn-danger btn-sm" onclick="Profile.deleteAccount()">Delete Account</button>
        </div>
      </div>
    `;
  },

  async handleSave(e) {
    e.preventDefault();
    const displayName = document.getElementById('prof-name').value;
    const city = document.getElementById('prof-city').value;
    const garbaExperience = document.getElementById('prof-experience').value;
    const bio = document.getElementById('prof-bio').value;
    const danceStyle = document.getElementById('prof-dance-style').value;
    const preferredLanguage = document.getElementById('prof-lang').value;
    const hobbies = document.getElementById('prof-hobbies').value;
    const isDiscoverable = document.getElementById('prof-discoverable').checked ? 1 : 0;

    const connectionTypes = [];
    if (document.getElementById('conn-partner').checked) connectionTypes.push('partner');
    if (document.getElementById('conn-friendship').checked) connectionTypes.push('friendship');
    if (document.getElementById('conn-group').checked) connectionTypes.push('group');
    if (document.getElementById('conn-dating').checked) connectionTypes.push('dating');

    try {
      const res = await API.put('/api/profile', {
        displayName,
        city,
        garbaExperience,
        bio,
        danceStyle,
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

  logout() {
    API.setToken(null);
    State.setUser(null, null, []);
    showToast('Logged out.', 'info');
    Router.navigate('/garba-partner');
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
      Router.navigate('/garba-partner');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};

window.Profile = Profile;
