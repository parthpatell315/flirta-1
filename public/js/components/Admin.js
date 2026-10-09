// Flirta Administrative, Monetization & Moderation Portal Component

const Admin = {
  metrics: null,
  reports: [],
  events: [],
  plans: [],
  transactions: [],
  activeTab: 'finance', // 'finance', 'moderation', 'events', 'audit'

  async render() {
    if (!State.isAdmin()) {
      const container = document.getElementById('main-content');
      container.innerHTML = `
        <div class="container" style="text-align: center; padding: 60px 20px;">
          <h2 style="color: var(--color-danger); margin-bottom: 12px;">Admin Access Required</h2>
          <p style="color: var(--color-text-secondary); margin-bottom: 20px;">
            You must be logged into an administrator account (e.g. <code>admin@garbajodi.com</code>) to view the Flirta administrative console.
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
            <h1 style="font-size: 1.9rem; margin-bottom: 4px;">Flirta Monetization & Admin Console 🛡️</h1>
            <p style="color: var(--color-text-secondary); font-size: 0.9rem;">
              Subscription revenue, conversion rate optimization, plan configuration, and user safety.
            </p>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="Admin.loadData()">🔄 Refresh Telemetry</button>
        </div>

        <!-- Navigation Tabs -->
        <div style="display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid var(--color-border); padding-bottom: 12px; overflow-x: auto;">
          <button class="btn btn-sm ${this.activeTab === 'finance' ? 'btn-primary' : 'btn-secondary'}" onclick="Admin.switchTab('finance')">
            💰 Subscriptions & Revenue
          </button>
          <button class="btn btn-sm ${this.activeTab === 'moderation' ? 'btn-primary' : 'btn-secondary'}" onclick="Admin.switchTab('moderation')">
            🛡️ Moderation Queue (<span id="tab-report-count">0</span>)
          </button>
          <button class="btn btn-sm ${this.activeTab === 'events' ? 'btn-primary' : 'btn-secondary'}" onclick="Admin.switchTab('events')">
            🎪 Venues & Events
          </button>
        </div>

        <div id="admin-view-content">
          <div style="text-align: center; padding: 40px; color: var(--color-primary);">
            Loading platform telemetry...
          </div>
        </div>
      </div>
    `;

    await this.loadData();
  },

  switchTab(tab) {
    this.activeTab = tab;
    this.render();
  },

  async loadData() {
    try {
      const [metricsRes, reportsRes, eventsRes, plansRes, txRes] = await Promise.all([
        API.get('/api/admin/metrics'),
        API.get('/api/admin/reports'),
        API.get('/api/admin/events'),
        API.get('/api/admin/plans'),
        API.get('/api/admin/transactions')
      ]);

      this.metrics = metricsRes.metrics;
      this.auditLog = metricsRes.auditLog || [];
      this.reports = reportsRes.reports || [];
      this.events = eventsRes.events || [];
      this.plans = plansRes.plans || [];
      this.transactions = txRes.transactions || [];

      const countEl = document.getElementById('tab-report-count');
      if (countEl) countEl.textContent = this.reports.filter(r => r.status === 'pending').length;

      this.renderCurrentTab();
    } catch (err) {
      document.getElementById('admin-view-content').innerHTML = `
        <div class="card" style="text-align: center; color: var(--color-danger); padding: 30px;">
          Admin telemetry error: ${err.message}
        </div>
      `;
    }
  },

  renderCurrentTab() {
    const area = document.getElementById('admin-view-content');
    if (!area) return;

    if (this.activeTab === 'finance') {
      this.renderFinanceTab(area);
    } else if (this.activeTab === 'moderation') {
      this.renderModerationTab(area);
    } else {
      this.renderEventsTab(area);
    }
  },

  renderFinanceTab(area) {
    const m = this.metrics;
    const rev = m.revenue || {};

    area.innerHTML = `
      <!-- Financial Metric Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 30px;">
        <div class="card" style="padding: 18px; text-align: center;">
          <div style="font-size: 2rem; font-weight: 800; color: var(--color-primary);">₹${rev.totalRevenueInr || 0}</div>
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase;">Gross Revenue</div>
        </div>
        <div class="card" style="padding: 18px; text-align: center;">
          <div style="font-size: 2rem; font-weight: 800; color: var(--color-success);">${rev.payingSubscribers || 0}</div>
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase;">Paying Subscribers</div>
        </div>
        <div class="card" style="padding: 18px; text-align: center;">
          <div style="font-size: 2rem; font-weight: 800; color: var(--color-secondary);">${rev.conversionRate || 0}%</div>
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase;">Paid Conversion Rate</div>
        </div>
        <div class="card" style="padding: 18px; text-align: center;">
          <div style="font-size: 2rem; font-weight: 800; color: #3B82F6;">₹${rev.arpu || 0}</div>
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase;">ARPU (Rev / Sub)</div>
        </div>
        <div class="card" style="padding: 18px; text-align: center;">
          <div style="font-size: 2rem; font-weight: 800; color: var(--color-text-primary);">${m.users.total}</div>
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase;">Total Registrations</div>
        </div>
      </div>

      <!-- Plan Pricing Configuration Table -->
      <div class="card" style="margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 1.3rem;">Subscription Plans & Price Controls</h3>
            <p style="font-size: 0.86rem; color: var(--color-text-muted);">Adjust pricing and daily interest allowances dynamically without downtime.</p>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.92rem; text-align: left;">
            <thead>
              <tr style="border-bottom: 2px solid var(--color-border); color: var(--color-text-secondary);">
                <th style="padding: 10px;">Plan</th>
                <th style="padding: 10px;">Price (INR)</th>
                <th style="padding: 10px;">Daily Likes</th>
                <th style="padding: 10px;">Who Liked Me</th>
                <th style="padding: 10px;">Boost Credits</th>
                <th style="padding: 10px;">Status</th>
                <th style="padding: 10px;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${this.plans.map(p => `
                <tr style="border-bottom: 1px solid var(--color-border);">
                  <td style="padding: 12px 10px; font-weight: 800;">
                    ${p.name} ${p.is_popular ? '⭐' : ''}
                    <div style="font-size: 0.75rem; color: var(--color-text-muted); font-weight: 400;">code: ${p.code}</div>
                  </td>
                  <td style="padding: 12px 10px; font-weight: 800; color: var(--color-primary);">₹${p.price_inr}</td>
                  <td style="padding: 12px 10px;">${p.daily_likes_limit === -1 ? 'Unlimited' : p.daily_likes_limit + ' / day'}</td>
                  <td style="padding: 12px 10px; color: ${p.can_see_likes ? 'var(--color-success)' : 'var(--color-text-muted)'}; font-weight: 700;">
                    ${p.can_see_likes ? '✓ Unlocked' : '✕ Locked'}
                  </td>
                  <td style="padding: 12px 10px;">${p.boost_credits}</td>
                  <td style="padding: 12px 10px;">
                    <span class="partner-badge" style="background: ${p.is_active ? 'var(--color-success-soft)' : 'var(--color-danger-soft)'}; color: ${p.is_active ? 'var(--color-success)' : 'var(--color-danger)'};">
                      ${p.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style="padding: 12px 10px;">
                    <button class="btn btn-secondary btn-sm" onclick="Admin.editPlanPrice(${p.id}, '${p.name}', ${p.price_inr}, ${p.daily_likes_limit})">
                      Edit
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Payment Transactions Log -->
      <div class="card">
        <h3 style="font-size: 1.3rem; margin-bottom: 14px;">Recent Payment Transactions</h3>
        ${this.transactions.length === 0 ? `
          <p style="color: var(--color-text-muted); padding: 20px; text-align: center;">No payment transactions recorded yet.</p>
        ` : `
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem; text-align: left;">
              <thead>
                <tr style="border-bottom: 2px solid var(--color-border); color: var(--color-text-secondary);">
                  <th style="padding: 8px;">Order ID</th>
                  <th style="padding: 8px;">Subscriber</th>
                  <th style="padding: 8px;">Plan</th>
                  <th style="padding: 8px;">Amount</th>
                  <th style="padding: 8px;">Status</th>
                  <th style="padding: 8px;">Date</th>
                  <th style="padding: 8px;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${this.transactions.map(tx => `
                  <tr style="border-bottom: 1px solid var(--color-border);">
                    <td style="padding: 10px 8px; font-family: monospace; font-size: 0.8rem;">${tx.order_id}</td>
                    <td style="padding: 10px 8px;">
                      <strong>${tx.user_name}</strong>
                      <div style="font-size: 0.76rem; color: var(--color-text-muted);">${tx.user_email}</div>
                    </td>
                    <td style="padding: 10px 8px; font-weight: 700;">${tx.plan_name}</td>
                    <td style="padding: 10px 8px; font-weight: 800; color: var(--color-primary);">₹${tx.amount_inr}</td>
                    <td style="padding: 10px 8px;">
                      <span class="partner-badge" style="background: ${tx.status === 'captured' ? 'var(--color-success-soft)' : tx.status === 'refunded' ? '#FEF2F2' : 'var(--color-secondary-soft)'}; color: ${tx.status === 'captured' ? 'var(--color-success)' : tx.status === 'refunded' ? 'var(--color-danger)' : 'var(--color-secondary)'};">
                        ${tx.status.toUpperCase()}
                      </span>
                    </td>
                    <td style="padding: 10px 8px; color: var(--color-text-muted); font-size: 0.78rem;">
                      ${new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td style="padding: 10px 8px;">
                      ${tx.status === 'captured' ? `
                        <button class="btn btn-danger btn-sm" onclick="Admin.refundTx(${tx.id}, '${tx.order_id}')">
                          Refund
                        </button>
                      ` : `
                        <span style="color: var(--color-text-muted); font-size: 0.75rem;">None</span>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  },

  async editPlanPrice(planId, planName, currentPrice, currentLimit) {
    const newPriceStr = prompt(`Set new price in INR for ${planName}:`, currentPrice);
    if (newPriceStr === null) return;
    const newPrice = parseInt(newPriceStr, 10);
    if (isNaN(newPrice) || newPrice < 0) {
      showToast('Please enter a valid price.', 'error');
      return;
    }

    const newLimitStr = prompt(`Set daily likes allowance for ${planName} (-1 for unlimited):`, currentLimit);
    if (newLimitStr === null) return;
    const newLimit = parseInt(newLimitStr, 10);

    try {
      await API.put(`/api/admin/plans/${planId}`, {
        priceInr: newPrice,
        dailyLikesLimit: isNaN(newLimit) ? currentLimit : newLimit
      });
      showToast(`Plan ${planName} updated to ₹${newPrice}!`, 'success');
      await this.loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async refundTx(transactionId, orderId) {
    const reason = prompt(`Reason for refunding transaction ${orderId}:`, 'Customer requested cancellation');
    if (!reason) return;

    try {
      await API.post(`/api/admin/transactions/${transactionId}/refund`, { reason });
      showToast(`Transaction ${orderId} refunded and subscription cancelled.`, 'info');
      await this.loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  renderModerationTab(area) {
    area.innerHTML = `
      <div class="card">
        <h3 style="font-size: 1.3rem; margin-bottom: 16px;">Moderation Queue (${this.reports.length})</h3>
        ${this.reports.length === 0 ? `
          <p style="color: var(--color-text-muted); text-align: center; padding: 20px;">No moderation reports submitted. All clear!</p>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${this.reports.map(rep => `
              <div style="padding: 16px; background: #F9FAFB; border-radius: 12px; border: 1px solid var(--color-border);">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                  <strong style="color: var(--color-primary); font-size: 0.95rem;">Report #${rep.id} · Target: ${rep.target_type.toUpperCase()} #${rep.target_id}</strong>
                  <span class="partner-badge" style="background: ${rep.status === 'pending' ? 'var(--color-danger-soft)' : 'var(--color-success-soft)'}; color: ${rep.status === 'pending' ? 'var(--color-danger)' : 'var(--color-success)'}; border-color: ${rep.status === 'pending' ? 'var(--color-primary-border)' : 'var(--color-success)'};">
                    ${rep.status.toUpperCase()}
                  </span>
                </div>
                <div style="font-size: 0.92rem; color: var(--color-text-primary); margin-bottom: 6px;">
                  <strong>Reason:</strong> ${escapeHtml(rep.reason)} ${rep.details ? `— <span style="color: var(--color-text-secondary);">${escapeHtml(rep.details)}</span>` : ''}
                </div>
                <div style="font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 12px;">
                  Reported by: ${rep.reporter_name} (${rep.reporter_email}) on ${new Date(rep.created_at).toLocaleString()}
                </div>

                ${rep.target_preview ? `
                  <div style="font-size: 0.86rem; background: #FFFFFF; border: 1px solid var(--color-border); padding: 10px 14px; border-radius: 8px; margin-bottom: 14px;">
                    <strong style="color: var(--color-text-primary);">Target Preview:</strong>
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
    `;
  },

  renderEventsTab(area) {
    area.innerHTML = `
      <!-- Add New Event Section -->
      <div class="card" style="margin-bottom: 30px;">
        <h3 style="font-size: 1.3rem; margin-bottom: 16px;">Publish New Verified Navratri Venue</h3>
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
            <button type="submit" class="btn btn-primary">Publish Venue to Platform</button>
          </div>
        </form>
      </div>
    `;
  },

  async resolveReport(reportId, status, actionTaken) {
    const notes = prompt(`Resolution notes for report #${reportId}:`, actionTaken);
    if (notes === null) return;
    try {
      await API.patch(`/api/admin/reports/${reportId}`, { status, actionTaken, notes });
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
      showToast('New Garba venue published successfully!', 'success');
      await this.loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};

window.Admin = Admin;
