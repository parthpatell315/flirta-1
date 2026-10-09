// GarbaJodi Group Circles Component

const Groups = {
  groups: [],

  async render() {
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
          <div>
            <h1 style="font-size: 1.9rem; margin-bottom: 6px;">Garba Groups</h1>
            <p style="color: var(--color-text-secondary); font-size: 0.95rem;">
              Join a dance team, coordinate group attire, and conquer the mega Garba grounds together.
            </p>
          </div>
          <button class="btn btn-primary" onclick="Groups.openCreateModal()">
            + Create Group
          </button>
        </div>

        <div id="groups-list-container" class="events-grid">
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--color-gold-light);">
            Loading groups...
          </div>
        </div>
      </div>
    `;

    await this.loadGroups();
  },

  async loadGroups() {
    const listContainer = document.getElementById('groups-list-container');
    try {
      const res = await API.get('/api/groups');
      this.groups = res.groups || [];
      this.renderGroupsList();
    } catch (err) {
      listContainer.innerHTML = `
        <div class="card" style="grid-column: 1 / -1; text-align: center; color: var(--color-danger); padding: 30px;">
          Failed to load groups: ${err.message}
        </div>
      `;
    }
  },

  renderGroupsList() {
    const listContainer = document.getElementById('groups-list-container');
    if (!listContainer) return;

    if (this.groups.length === 0) {
      listContainer.innerHTML = `
        <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 50px 20px;">
          <h3 style="margin-bottom: 8px;">No Public Groups Yet</h3>
          <p style="color: var(--color-text-secondary); max-width: 420px; margin: 0 auto 20px;">
            Be the first to create a dance group!
          </p>
          <button class="btn btn-primary btn-sm" onclick="Groups.openCreateModal()">Create First Group</button>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = this.groups.map(g => {
      const membership = g.user_membership;
      const isMember = membership && membership.status === 'active';
      const isPending = membership && membership.status === 'pending';

      return `
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px;">
              <span class="partner-badge">${g.active_members_count} / ${g.max_members} Members</span>
              <span style="font-size: 0.8rem; color: var(--color-text-muted);">By ${g.creator_name}</span>
            </div>

            <h3 style="font-size: 1.25rem; margin-bottom: 8px;">${g.name}</h3>
            <p style="color: var(--color-text-secondary); font-size: 0.92rem; line-height: 1.5; margin-bottom: 14px;">
              ${g.description || 'Navratri group for passionate dancers.'}
            </p>

            ${g.event_name ? `
              <div style="font-size: 0.82rem; color: var(--color-gold-light); margin-bottom: 14px; background: rgba(245,158,11,0.1); padding: 6px 12px; border-radius: 6px;">
                Event: <strong>${g.event_name}</strong> (${g.event_city})
              </div>
            ` : ''}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08);">
            <button class="btn btn-secondary btn-sm" onclick="Groups.viewDetails(${g.id})">
              View Members
            </button>

            ${isMember ? `
              <button class="btn btn-secondary btn-sm" onclick="Groups.leaveGroup(${g.id})">Leave Group</button>
            ` : isPending ? `
              <button class="btn btn-secondary btn-sm" disabled>Pending Approval</button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="Groups.joinGroup(${g.id})">Join Group</button>
            `}
          </div>
        </div>
      `;
    }).join('');
  },

  async openCreateModal() {
    if (!State.isAuthenticated()) {
      openAuthModal('login');
      return;
    }

    let events = [];
    try {
      const evRes = await API.get('/api/events');
      events = evRes.events || [];
    } catch {}

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h3>Create a Garba Group</h3>
          <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <form onsubmit="Groups.handleCreate(event)">
          <div class="form-group">
            <label class="form-label">Circle Name</label>
            <input type="text" id="group-name" class="form-control" placeholder="e.g. Vadodara Dodhiya Champions" required>
          </div>
          <div class="form-group">
            <label class="form-label">Description & Dance Style</label>
            <textarea id="group-desc" class="form-control" rows="3" placeholder="Tell members about required steps, practice sessions, or venue plans..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Associated Garba Venue (Optional)</label>
            <select id="group-event-id" class="form-control">
              <option value="">General / Multiple Venues</option>
              ${events.map(e => `<option value="${e.id}">${e.name} (${e.city})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Maximum Members (2 - 30)</label>
            <input type="number" id="group-max" class="form-control" value="12" min="2" max="30">
          </div>
          <button type="submit" class="btn btn-primary btn-block">Create Circle</button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async handleCreate(e) {
    e.preventDefault();
    const name = document.getElementById('group-name').value;
    const description = document.getElementById('group-desc').value;
    const eventId = document.getElementById('group-event-id').value;
    const maxMembers = document.getElementById('group-max').value;

    try {
      await API.post('/api/groups', { name, description, eventId, maxMembers, isPublic: true });
      showToast('Garba circle created successfully!', 'success');
      document.querySelector('.modal-overlay.open').remove();
      await this.loadGroups();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async joinGroup(groupId) {
    if (!State.isAuthenticated()) {
      openAuthModal('login');
      return;
    }

    try {
      const res = await API.post(`/api/groups/${groupId}/join`);
      showToast(res.message, 'success');
      await this.loadGroups();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async leaveGroup(groupId) {
    if (!confirm('Are you sure you want to leave this circle?')) return;
    try {
      await API.post(`/api/groups/${groupId}/leave`);
      showToast('Left circle.', 'info');
      await this.loadGroups();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async viewDetails(groupId) {
    try {
      const res = await API.get(`/api/groups/${groupId}`);
      const g = res.group;
      const members = res.members || [];

      const modal = document.createElement('div');
      modal.className = 'modal-overlay open';
      modal.innerHTML = `
        <div class="modal-box">
          <div class="modal-header">
            <h3>${g.name}</h3>
            <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
          </div>
          <p style="color: var(--color-text-secondary); font-size: 0.92rem; margin-bottom: 16px;">
            ${g.description || 'No description.'}
          </p>
          <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-gold-light); text-transform: uppercase; margin-bottom: 10px;">
            Members (${members.length} / ${g.max_members})
          </div>
          <div style="max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
            ${members.map(m => {
              const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.display_name)}&background=FF6B00&color=fff&size=128`;
              const avatar = m.primary_photo || defaultAvatar;

              return `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255,255,255,0.06); border-radius: 8px;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${avatar}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;" onerror="this.src='${defaultAvatar}'">
                    <div>
                      <span style="font-weight: 600; font-size: 0.9rem;">${m.display_name}</span>
                      <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">${m.city}</span>
                    </div>
                  </div>
                  <span class="partner-badge" style="font-size: 0.7rem;">${m.role}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};

window.Groups = Groups;
