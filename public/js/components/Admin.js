// GarbaJodi Administrative & Moderation Portal Component

const Admin = {
  metrics: null,
  reports: [],
  events: [],

  async render() {
    if (!State.isAdmin()) {
      const container = document.getElementById('main-content');
      container.innerHTML = `
        <div class="container" style="text-align: center; padding: 60px 20px;">
          <h2 style="color: var(--color-danger); margin-bottom: 12px;">Admin Access Required</h2>
          <p style="color: var(--color-text-secondary); margin-bottom: 20px;">
            You must be logged into an administrator account (e.g. <code>admin@garbajodi.com</code>) to view the moderation console.
          </p>
          <button class="btn btn-primary" onclick="openAuthModal('login')">Admin Log In</button>
        </div>
      `;
      return;
    }

    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h1 style="font-size: 1.9rem; margin-bottom: 4px;">Platform Admin & Moderation Console 🛡️</h1>
            <p style="color: var(--color-text-muted); font-size: 0.9rem;">
              Navratri 2026 Live Metrics, Safety Review, and Venue Management.
            </p>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="Admin.loadData()">🔄 Refresh Data</button>
        </div>

        <div id="admin-view-content">
          <div style="text-align: center; padding: 40px; color: var(--color-gold-light);">
            Loading platform telemetry and moderation queue...
          </div>
        </div>
      </div>
    `;

    await this.loadData();
  },

  async loadData() {
    try {
      const [metricsRes, reportsRes, eventsRes] = await Promise.all([
        API.get('/api/admin/metrics'),
        API.get('/api/admin/reports'),
        API.get('/api/admin/events')
      ]);

      this.metrics = metricsRes.metrics;
      this.auditLog = metricsRes.auditLog || [];
      this.reports = reportsRes.reports || [];
      this.events = eventsRes.events || [];

      this.renderDashboard();
    } catch (err) {
      document.getElementById('admin-view-content').innerHTML = `
        <div class="card" style="text-align: center; color: var(--color-danger); padding: 30px;">
          Admin error: ${err.message}
        </div>
      `;
    }
  },

  renderDashboard() {
    const area = document.getElementById('admin-view-content');
    if (!area) return;

    const m = this.metrics;

    area.innerHTML = `
      <!-- Telemetry Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 16px; margin-bottom: 30px;">
        <div class="card" style="padding: 16px; text-align: center;">
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--color-gold-light);">${m.users.total}</div>
          <div style="font-size: 0.8rem; color: var(--color-text-muted); text-transform: uppercase;">Total Dancers</div>
        </div>
        <div class="card" style="padding: 16px; text-align: center;">
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--color-success);">${m.users.active}</div>
          <div style="font-size: 0.8rem; color: var(--color-text-muted); text-transform: uppercase;">Active Accounts</div>
        </div>
        <div class="card" style="padding: 16px; text-align: center;">
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--color-saffron);">${m.matching.matches}</div>
          <div style="font-size: 0.8rem; color: var(--color-text-muted); text-transform: uppercase;">Mutual Matches</div>
        </div>
        <div class="card" style="padding: 16px; text-align: center;">
          <div style="font-size: 1.8rem; font-weight: 800; color: #60A5FA;">${m.matching.messages}</div>
          <div style="font-size: 0.8rem; color: var(--color-text-muted); text-transform: uppercase;">Messages Exchanged</div>
        </div>
        <div class="card" style="padding: 16px; text-align: center;">
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--color-gold);">${m.events.published}</div>
          <div style="font-size: 0.8rem; color: var(--color-text-muted); text-transform: uppercase;">Verified Venues</div>
        </div>
        <div class="card" style="padding: 16px; text-align: center;">
          <div style="font-size: 1.8rem; font-weight: 800; color: ${m.community.pendingReports > 0 ? 'var(--color-danger)' : 'var(--color-cream)'};">${m.community.pendingReports}</div>
          <div style="font-size: 0.8rem; color: var(--color-text-muted); text-transform: uppercase;">Pending Reports</div>
        </div>
      </div>

      <!-- Moderation Queue -->
      <div class="card" style="margin-bottom: 30px;">
        <h3 style="font-size: 1.3rem; margin-bottom: 16px;">Moderation Queue (${this.reports.length})</h3>

        ${this.reports.length === 0 ? `
          <p style="color: var(--color-text-muted); text-align: center; padding: 20px;">No moderation reports submitted. All clear!</p>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${this.reports.map(rep => `
              <div style="padding: 14px; background: rgba(20,5,36,0.6); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
                  <strong style="color: var(--color-gold-light);">Report #${rep.id} · Target: ${rep.target_type.toUpperCase()} #${rep.target_id}</strong>
                  <span class="partner-badge" style="background: ${rep.status === 'pending' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}; border-color: ${rep.status === 'pending' ? 'var(--color-danger)' : 'var(--color-success)'};">
                    ${rep.status.toUpperCase()}
                  </span>
                </div>
                <div style="font-size: 0.88rem; color: var(--color-cream); margin-bottom: 6px;">
                  <strong>Reason:</strong> ${escapeHtml(rep.reason)} ${rep.details ? `— <em>${escapeHtml(rep.details)}</em>` : ''}
                </div>
                <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 10px;">
                  Reported by: ${rep.reporter_name} (${rep.reporter_email}) on ${new Date(rep.created_at).toLocaleString()}
                </div>

                ${rep.target_preview ? `
                  <div style="font-size: 0.84rem; background: rgba(255,255,255,0.04); padding: 8px 12px; border-radius: 6px; margin-bottom: 12px;">
                    <strong>Target Preview:</strong>
                    ${rep.target_type === 'user' ? `User: ${rep.target_preview.display_name} (${rep.target_preview.email}) · Status: ${rep.target_preview.status}` : ''}
                    ${rep.target_type === 'message' ? `Content: "${escapeHtml(rep.target_preview.content)}" from ${rep.target_preview.sender_name}` : ''}
                    ${rep.target_type === 'group' ? `Group: "${escapeHtml(rep.target_preview.name)}" by ${rep.target_preview.creator_name}` : ''}
                  </div>
                ` : ''}

                ${rep.status === 'pending' ? `
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="btn btn-secondary btn-sm" onclick="Admin.resolveReport(${rep.id}, 'resolved', 'Warned user')">
                      ✓ Mark Resolved
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="Admin.resolveReport(${rep.id}, 'dismissed', 'False report')">
                      Dismiss
                    </button>
                    ${rep.target_type === 'user' ? `
                      <button class="btn btn-danger btn-sm" onclick="Admin.suspendUser(${rep.target_id})">
                        Suspend User
                      </button>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Add New Event Section -->
      <div class="card" style="margin-bottom: 30px;">
        <h3 style="font-size: 1.3rem; margin-bottom: 16px;">Publish New Verified Navratri Event</h3>
        <form onsubmit="Admin.handleCreateEvent(event)" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px;">
          <div class="form-group">
            <label class="form-label">Event Name</label>
            <input type="text" id="adm-ev-name" class="form-control" placeholder="e.g. Navratri Dandiya Mahotsav 2026" required>
          </div>
          <div class="form-group">
            <label class="form-label">Verified Organizer</label>
            <input type="text" id="adm-ev-org" class="form-control" placeholder="e.g. Cultural Trust Vadodara" required>
          </div>
          <div class="form-group">
            <label class="form-label">Venue Name</label>
            <input type="text" id="adm-ev-venue" class="form-control" placeholder="e.g. GMDC Ground" required>
          </div>
          <div class="form-group">
            <label class="form-label">Venue Address</label>
            <input type="text" id="adm-ev-addr" class="form-control" placeholder="e.g. 132 Feet Ring Rd, Ahmedabad" required>
          </div>
          <div class="form-group">
            <label class="form-label">City</label>
            <select id="adm-ev-city" class="form-control">
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Vadodara">Vadodara</option>
              <option value="Surat">Surat</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Rajkot">Rajkot</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Event Date</label>
            <input type="date" id="adm-ev-date" class="form-control" value="2026-10-12" required>
          </div>
          <div class="form-group">
            <label class="form-label">Start Time</label>
            <input type="time" id="adm-ev-start" class="form-control" value="20:00" required>
          </div>
          <div class="form-group">
            <label class="form-label">End Time</label>
            <input type="time" id="adm-ev-end" class="form-control" value="01:30" required>
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label">Description</label>
            <textarea id="adm-ev-desc" class="form-control" rows="2" placeholder="Venue highlights, passes, musical artists..."></textarea>
          </div>
          <div style="grid-column: 1 / -1;">
            <button type="submit" class="btn btn-primary">Publish Event to Platform</button>
          </div>
        </form>
      </div>

      <!-- Audit History -->
      <div class="card">
        <h3 style="font-size: 1.3rem; margin-bottom: 14px;">Administrative Audit Log</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${this.auditLog.length === 0 ? `
            <p style="color: var(--color-text-muted); font-size: 0.88rem;">No administrative actions recorded yet.</p>
          ` : this.auditLog.map(a => `
            <div style="padding: 8px 12px; background: rgba(255,255,255,0.04); border-radius: 6px; font-size: 0.85rem; display: flex; justify-content: space-between;">
              <span><strong>${escapeHtml(a.action_taken)}</strong> (${escapeHtml(a.notes || 'No notes')})</span>
              <span style="color: var(--color-text-muted);">${new Date(a.created_at).toLocaleString()}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  async resolveReport(reportId, status, actionTaken) {
    const notes = prompt(`Resolution notes for report #${reportId}:`, actionTaken);
    if (notes === null) return;

    try {
      await API.patch(`/api/admin/reports/${reportId}`, {
        status,
        actionTaken: actionTaken || `Resolved as ${status}`,
        notes
      });
      showToast(`Report marked as ${status}.`, 'success');
      await this.loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async suspendUser(userId) {
    const reason = prompt(`Enter reason for suspending user #${userId}:`, 'Violated community guidelines');
    if (!reason) return;

    try {
      await API.patch(`/api/admin/users/${userId}/suspend`, { status: 'suspended', reason });
      showToast(`User #${userId} has been suspended.`, 'info');
      await this.loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async handleCreateEvent(e) {
    e.preventDefault();
    const name = document.getElementById('adm-ev-name').value;
    const organizer = document.getElementById('adm-ev-org').value;
    const venueName = document.getElementById('adm-ev-venue').value;
    const address = document.getElementById('adm-ev-addr').value;
    const city = document.getElementById('adm-ev-city').value;
    const eventDate = document.getElementById('adm-ev-date').value;
    const startTime = document.getElementById('adm-ev-start').value;
    const endTime = document.getElementById('adm-ev-end').value;
    const description = document.getElementById('adm-ev-desc').value;

    try {
      await API.post('/api/admin/events', {
        name, organizer, venueName, address, city, eventDate,
        startTime, endTime, description, isPublished: 1
      });
      showToast('New Garba event published successfully!', 'success');
      await this.loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};

window.Admin = Admin;
