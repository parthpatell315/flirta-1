// GarbaJodi Events and Attendance Discovery Component

const Events = {
  events: [],
  filters: { city: '', q: '' },

  async render() {
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
          <div>
            <h1 style="font-size: 1.9rem; margin-bottom: 6px;">Navratri 2026 Garba Nights</h1>
            <p style="color: var(--color-text-secondary); font-size: 0.95rem;">
              Verified venues across Gujarat, Mumbai & Indore. Mark attendance to coordinate with partners.
            </p>
          </div>
          ${State.isAdmin() ? `
            <button class="btn btn-primary btn-sm" onclick="Router.navigate('/admin')">
              + Admin Event Manager
            </button>
          ` : ''}
        </div>

        <!-- Filter Bar -->
        <div class="filter-bar" style="margin-bottom: 28px;">
          <select id="event-city-filter" onchange="Events.applyFilters()">
            <option value="">All Cities</option>
            <option value="Ahmedabad" ${this.filters.city === 'Ahmedabad' ? 'selected' : ''}>Ahmedabad</option>
            <option value="Surat" ${this.filters.city === 'Surat' ? 'selected' : ''}>Surat</option>
            <option value="Vadodara" ${this.filters.city === 'Vadodara' ? 'selected' : ''}>Vadodara</option>
            <option value="Rajkot" ${this.filters.city === 'Rajkot' ? 'selected' : ''}>Rajkot</option>
            <option value="Mumbai" ${this.filters.city === 'Mumbai' ? 'selected' : ''}>Mumbai</option>
            <option value="Indore" ${this.filters.city === 'Indore' ? 'selected' : ''}>Indore</option>
          </select>

          <input type="text" id="event-search-input" placeholder="Search venue or organizer..." value="${this.filters.q}" oninput="Events.applyFilters()">
        </div>

        <!-- Events List -->
        <div id="events-list-container" class="events-grid">
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--color-gold-light);">
            Loading published events...
          </div>
        </div>
      </div>
    `;

    await this.loadEvents();
  },

  applyFilters() {
    this.filters.city = document.getElementById('event-city-filter').value;
    this.filters.q = document.getElementById('event-search-input').value;
    this.loadEvents();
  },

  async loadEvents() {
    const listContainer = document.getElementById('events-list-container');
    try {
      const params = new URLSearchParams();
      if (this.filters.city) params.set('city', this.filters.city);
      if (this.filters.q) params.set('q', this.filters.q);

      const res = await API.get(`/api/events?${params.toString()}`);
      this.events = res.events || [];
      this.renderEventsList();
    } catch (err) {
      listContainer.innerHTML = `
        <div class="card" style="grid-column: 1 / -1; text-align: center; color: var(--color-danger); padding: 30px;">
          Error loading events: ${err.message}
        </div>
      `;
    }
  },

  renderEventsList() {
    const listContainer = document.getElementById('events-list-container');
    if (!listContainer) return;

    if (this.events.length === 0) {
      listContainer.innerHTML = `
        <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 50px 20px;">
          <h3 style="margin-bottom: 8px;">No Events Found</h3>
          <p style="color: var(--color-text-secondary); max-width: 400px; margin: 0 auto;">
            Try clearing filters or check back as more official 2026 Navratri venues publish schedules.
          </p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = this.events.map(ev => {
      const isAttending = ev.user_status === 'attending';
      const isInterested = ev.user_status === 'interested';

      return `
        <div class="event-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span class="event-date-badge">${ev.event_date}</span>
              <span style="font-size: 0.8rem; color: var(--color-text-secondary); font-weight: 600;">${ev.start_time} - ${ev.end_time}</span>
            </div>

            <h3 style="font-size: 1.28rem; margin-bottom: 6px;">${ev.name}</h3>
            <p style="color: var(--color-text-secondary); font-size: 0.86rem; font-weight: 600; margin-bottom: 6px;">
              Organizer: ${ev.organizer}
            </p>
            <p style="color: var(--color-text-muted); font-size: 0.88rem; margin-bottom: 14px;">
              ${ev.venue_name}, ${ev.city}
              <br><span style="font-size: 0.8rem; opacity: 0.8;">${ev.address}</span>
            </p>
            <p style="color: var(--color-text-secondary); font-size: 0.92rem; line-height: 1.5; margin-bottom: 18px;">
              ${ev.description}
            </p>
          </div>

          <div style="padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <span style="font-size: 0.85rem; color: var(--color-text-muted);">
                <strong>${ev.attending_count || 0}</strong> attending · <strong>${ev.interested_count || 0}</strong> interested
              </span>
              <button class="btn btn-secondary btn-sm" onclick="Events.viewAttendees(${ev.id}, '${ev.name.replace(/'/g, "\\'")}')">
                Find Your Match
              </button>
            </div>

            <div style="display: flex; gap: 8px;">
              <button class="btn ${isAttending ? 'btn-primary' : 'btn-secondary'} btn-sm" style="flex: 1;" onclick="Events.toggleAttendance(${ev.id}, 'attending')">
                ${isAttending ? 'Attending' : 'Attend'}
              </button>
              <button class="btn ${isInterested ? 'btn-primary' : 'btn-secondary'} btn-sm" style="flex: 1;" onclick="Events.toggleAttendance(${ev.id}, 'interested')">
                ${isInterested ? 'Interested' : 'Interested'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  async toggleAttendance(eventId, status) {
    if (!State.isAuthenticated()) {
      openAuthModal('login');
      return;
    }

    try {
      const currentEv = this.events.find(e => e.id === eventId);
      if (currentEv && currentEv.user_status === status) {
        // Toggle off
        await API.delete(`/api/events/${eventId}/attend`);
        showToast('Attendance status removed.', 'info');
      } else {
        await API.post(`/api/events/${eventId}/attend`, { status });
        showToast(`Marked as ${status}!`, 'success');
      }
      await this.loadEvents();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async viewAttendees(eventId, eventName) {
    try {
      const res = await API.get(`/api/events/${eventId}`);
      const attendees = res.attendees || [];

      const modal = document.createElement('div');
      modal.className = 'modal-overlay open';
      modal.innerHTML = `
        <div class="modal-box">
          <div class="modal-header">
            <h3>Matches at ${eventName}</h3>
            <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
          </div>
          <p style="font-size: 0.86rem; color: var(--color-text-muted); margin-bottom: 16px;">
            Showing public attendees who have consented to discovery.
          </p>
          <div style="max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
            ${attendees.length === 0 ? `
              <p style="text-align: center; color: var(--color-text-muted); padding: 20px;">No public attendees listed yet. Be the first to attend!</p>
            ` : attendees.map(a => {
              const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(a.display_name)}&background=FF6B00&color=fff&size=128`;
              const avatar = a.primary_photo || defaultAvatar;

              return `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(255,255,255,0.06); border-radius: 8px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="${avatar}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;" onerror="this.src='${defaultAvatar}'">
                    <div>
                      <div style="font-weight: 700;">${a.display_name}, ${a.age}</div>
                      <div style="font-size: 0.8rem; color: var(--color-text-secondary);">${a.city} · ${a.garba_experience}</div>
                    </div>
                  </div>
                  <span class="partner-badge" style="font-size: 0.7rem;">${a.attendance_status}</span>
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

window.Events = Events;
