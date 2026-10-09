// GarbaJodi Matches and Messaging Component

const Matches = {
  matches: [],
  activeConversationId: null,
  activeMatch: null,
  pollingInterval: null,

  async render() {
    if (!State.isAuthenticated()) {
      openAuthModal('login');
      return;
    }

    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="container">
        <h1 style="font-size: 1.8rem; margin-bottom: 20px;">Your Garba Matches</h1>

        <div class="matches-view">
          <!-- Sidebar: Match List -->
          <div class="matches-sidebar" id="matches-list-sidebar">
            <div style="text-align: center; padding: 30px; color: var(--color-gold-light);">
              Loading matches...
            </div>
          </div>

          <!-- Main: Active Chat Window -->
          <div class="chat-window" id="active-chat-area">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 400px; color: var(--color-text-muted); text-align: center; padding: 20px;">
              <h3 style="color: var(--color-cream); margin-bottom: 8px;">Select a Match</h3>
              <p style="font-size: 0.92rem; max-width: 320px;">Choose a dance partner from the list to discuss festive plans, attire, and Garba night meetups.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    await this.loadMatches();
  },

  async loadMatches() {
    try {
      const res = await API.get('/api/match');
      this.matches = res.matches || [];
      State.setCounts(this.matches.length, State.unreadMessagesCount);
      this.renderMatchesList();

      if (this.matches.length > 0 && !this.activeConversationId && window.innerWidth > 768) {
        this.openConversation(this.matches[0]);
      }
    } catch (err) {
      document.getElementById('matches-list-sidebar').innerHTML = `
        <p style="color: var(--color-danger); text-align: center;">Error: ${err.message}</p>
      `;
    }
  },

  backToList() {
    this.activeConversationId = null;
    this.activeMatch = null;
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    const view = document.querySelector('.matches-view');
    if (view) view.classList.remove('has-active-chat');
    this.renderMatchesList();
  },

  renderMatchesList() {
    const sidebar = document.getElementById('matches-list-sidebar');
    if (!sidebar) return;

    if (this.matches.length === 0) {
      sidebar.innerHTML = `
        <div style="text-align: center; padding: 40px 10px;">
          <h4 style="margin-bottom: 8px;">No Mutual Matches Yet</h4>
          <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 16px;">
            Keep discovering profiles to connect with more dancers.
          </p>
          <button class="btn btn-primary btn-sm" onclick="Router.navigate('/discover')">Discover Partners</button>
        </div>
      `;
      return;
    }

    sidebar.innerHTML = `
      <div style="font-size: 0.82rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 12px; padding-left: 6px;">
        Mutual Matches (${this.matches.length})
      </div>
      ${this.matches.map(m => {
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.display_name)}&background=FF6B00&color=fff&size=128`;
        const avatar = m.primary_photo || defaultAvatar;
        const isActive = this.activeConversationId === m.conversation_id;

        return `
          <div class="match-item ${isActive ? 'active' : ''}" onclick="Matches.openConversationById(${m.conversation_id})">
            <img src="${avatar}" alt="${m.display_name}" class="match-avatar" onerror="this.src='${defaultAvatar}'">
            <div class="match-info">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span class="match-name">${m.display_name}</span>
                ${m.unread_count > 0 ? `<span class="nav-badge">${m.unread_count}</span>` : ''}
              </div>
              <div class="match-snippet">
                ${m.last_message || `Matched · ${m.city}`}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    `;
  },

  openConversationById(convId) {
    const match = this.matches.find(m => m.conversation_id === convId);
    if (match) this.openConversation(match);
  },

  async openConversation(match) {
    this.activeMatch = match;
    this.activeConversationId = match.conversation_id;
    this.renderMatchesList();

    const view = document.querySelector('.matches-view');
    if (view) view.classList.add('has-active-chat');

    const chatArea = document.getElementById('active-chat-area');
    if (!chatArea) return;

    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(match.display_name)}&background=FF6B00&color=fff&size=128`;
    const avatar = match.primary_photo || defaultAvatar;

    chatArea.innerHTML = `
      <div class="chat-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <button class="btn btn-secondary btn-sm mobile-back-btn" onclick="Matches.backToList()" aria-label="Back to matches list">
            ←
          </button>
          <img src="${avatar}" class="match-avatar" style="width: 42px; height: 42px;" onerror="this.src='${defaultAvatar}'">
          <div>
            <h3 style="font-size: 1.05rem;">${match.display_name}</h3>
            <span style="font-size: 0.8rem; color: var(--color-text-secondary);">${match.city} · ${match.garba_experience} dancer</span>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" onclick="Matches.promptUnmatch(${match.match_id}, '${match.display_name.replace(/'/g, "\\'")}')">
            Unmatch
          </button>
          <button class="btn btn-secondary btn-sm" onclick="openReportModal('user', ${match.matched_user_id}, '${match.display_name.replace(/'/g, "\\'")}')">
            Report
          </button>
        </div>
      </div>

      <!-- Mandatory Safety & Legal Protection Advisory in Chat -->
      <div style="margin: 8px 12px; padding: 10px 14px; background: rgba(0,0,0,0.03); border: 1px dashed var(--color-border); border-radius: 8px; font-size: 0.78rem; line-height: 1.4; color: #666666; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <div>
          <strong style="color: #444444;">Safety Advisory:</strong> Meet strictly at public Navratri venues. Never send money, cash, or UPI payments. Commercial solicitations or escort requests are strictly unlawful.
        </div>
        <a href="javascript:void(0)" onclick="Legal.open('safety')" style="color: var(--color-primary); font-weight: 700; text-decoration: underline; white-space: nowrap; font-size: 0.76rem;">Safety Rules</a>
      </div>

      <div class="chat-messages" id="chat-messages-container">
        <div style="text-align: center; color: var(--color-text-muted); font-size: 0.88rem; padding: 20px;">
          End-to-end match messaging enabled. Plan your Navratri 2026 celebrations!
        </div>
      </div>

      <form class="chat-input-bar" onsubmit="Matches.sendMessage(event)">
        <input type="text" id="chat-message-input" class="chat-input" placeholder="Say Kem Chho, plan steps, coordinate timing..." autocomplete="off">
        <button type="submit" class="btn btn-primary btn-sm" style="padding: 10px 20px;">Send</button>
      </form>
    `;

    await this.fetchMessages();

    // Start polling every 3.5 seconds
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.pollingInterval = setInterval(() => {
      if (this.activeConversationId) {
        this.fetchMessages(true);
      }
    }, 3500);
  },

  async fetchMessages(isPolling = false) {
    if (!this.activeConversationId) return;
    try {
      const res = await API.get(`/api/messages/conversations/${this.activeConversationId}/messages`);
      const container = document.getElementById('chat-messages-container');
      if (!container) return;

      const currentScroll = container.scrollTop;
      const isAtBottom = container.scrollHeight - container.clientHeight <= currentScroll + 50;

      container.innerHTML = res.messages.map(msg => {
        const isMine = msg.sender_id === State.user.id;
        const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
          <div class="message-bubble ${isMine ? 'mine' : 'theirs'}">
            <div>${escapeHtml(msg.content)}</div>
            <div class="message-time">${time} ${isMine ? (msg.is_read ? '✓✓' : '✓') : ''}</div>
          </div>
        `;
      }).join('');

      if (!isPolling || isAtBottom) {
        container.scrollTop = container.scrollHeight;
      }
    } catch (err) {
      console.warn('Error fetching messages:', err);
    }
  },

  async sendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chat-message-input');
    const content = input.value.trim();
    if (!content || !this.activeConversationId) return;

    input.value = '';

    try {
      await API.post(`/api/messages/conversations/${this.activeConversationId}/messages`, { content });
      await this.fetchMessages();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async promptUnmatch(matchId, name) {
    if (!confirm(`Are you sure you want to unmatch with ${name}? Your conversation will be closed and removed.`)) {
      return;
    }

    try {
      await API.post(`/api/match/${matchId}/unmatch`);
      showToast(`Unmatched with ${name}.`, 'info');
      if (this.pollingInterval) clearInterval(this.pollingInterval);
      this.activeConversationId = null;
      await this.loadMatches();
      const chatArea = document.getElementById('active-chat-area');
      if (chatArea) {
        chatArea.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 400px; color: var(--color-text-muted); text-align: center; padding: 20px;">
            <p>Match severed.</p>
          </div>
        `;
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  cleanup() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
};

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

window.Matches = Matches;
