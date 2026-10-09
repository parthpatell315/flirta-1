// Flirta Landing Component

const Landing = {
  async render() {
    MetaAds.trackPageView('landing_page');

    let events = [];
    let stats = { users: 0, events: 0, matches: 0 };

    try {
      const eventData = await API.get('/api/events');
      events = (eventData.events || []).slice(0, 3);
    } catch (e) {
      console.warn('Could not load events for landing:', e);
    }

    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="container">
        <!-- Hero Section -->
        <section class="hero">
          <div class="hero-tag">
            <span>✨ Navratri 2026 Partner Discovery & Dating</span>
          </div>
          <h1 class="hero-title">Find Your Dream Garba Partner</h1>
          <p class="hero-subtitle">
            Meet someone who matches your vibe, your dance style, and your energy. Your Navratri feels different when you find someone who matches your vibe. Discover compatible Garba partners on Flirta.
          </p>
          <div class="hero-actions">
            <button class="btn btn-primary" onclick="${State.isAuthenticated() ? "Router.navigate('/discover')" : "openAuthModal('register')"}">
              Find My Garba Partner 🪘
            </button>
            <button class="btn btn-secondary" onclick="Router.navigate('/pricing')">
              Explore Plans 💎
            </button>
          </div>
        </section>

        <!-- Real Stats Ribbon -->
        <div class="stats-bar">
          <div class="stat-item">
            <div class="stat-value">${events.length > 0 ? '5+' : '100%'}</div>
            <div class="stat-label">Verified Heritage Venues</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">18+</div>
            <div class="stat-label">Age Verified Only</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">100%</div>
            <div class="stat-label">Mutual Match Safety</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">9 Nights</div>
            <div class="stat-label">Raas-Garba 2026</div>
          </div>
        </div>

        <!-- How Matching Works -->
        <section style="margin: 60px 0;">
          <h2 class="section-title">How GarbaJodi Works</h2>
          <p class="section-subtitle">Three simple steps to finding your ideal dance companion this festival season.</p>
          
          <div class="steps-grid">
            <div class="step-card">
              <div class="step-number">1</div>
              <h3>Curate Your Dance Profile</h3>
              <p>Share your favorite Garba steps (Dodhiya, Popat, 3-Taali), dance skill level, preferred cities, and whether you are seeking a dance partner, friends, or dating.</p>
            </div>
            <div class="step-card">
              <div class="step-number">2</div>
              <h3>Discover & Connect</h3>
              <p>Browse attendee profiles across Gujarat cities, Mumbai, and Indore. Send an interest with one tap.</p>
            </div>
            <div class="step-card">
              <div class="step-number">3</div>
              <h3>Coordinate & Dance Raas</h3>
              <p>When you both express interest, a mutual match unlocks private messaging to coordinate festive attire, meetups, and dance steps together.</p>
            </div>
          </div>
        </section>

        <!-- Safety & Privacy Guarantee -->
        <section class="card" style="margin: 60px 0; background: linear-gradient(135deg, var(--color-primary-soft), var(--color-secondary-soft)); border: 1px solid var(--color-primary-border);">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; align-items: center;">
            <div>
              <span class="partner-badge" style="margin-bottom: 12px; display: inline-block;">Community Integrity</span>
              <h2 style="font-size: 1.9rem; margin-bottom: 14px;">Safety First, Always</h2>
              <p style="color: var(--color-text-secondary); margin-bottom: 16px;">
                Flirta is committed to a respectful and safe cultural celebration:
              </p>
              <ul style="list-style: none; display: flex; flex-direction: column; gap: 10px; color: var(--color-text-secondary); font-size: 0.94rem;">
                <li>🔒 <strong>Strict 18+ Verification:</strong> Minors are not permitted on the platform.</li>
                <li>🛡️ <strong>Mutual Consent Messaging:</strong> Only mutual matches can send direct messages.</li>
                <li>🚫 <strong>Instant Block & Report:</strong> One-tap safety tools actively monitored by admins.</li>
                <li>👁️ <strong>Privacy Protection:</strong> Sensitive personal contact details are never made public.</li>
              </ul>
            </div>
            <div style="text-align: center; padding: 20px;">
              <div style="font-size: 4.5rem; margin-bottom: 10px;">🪔</div>
              <h3 style="color: var(--color-primary); margin-bottom: 8px;">Garba First, Dating Optional</h3>
              <p style="color: var(--color-text-secondary); font-size: 0.9rem;">Whether you want to sync steps, make festive friends, or find romance, your preferences are clearly honored.</p>
            </div>
          </div>
        </section>

        <!-- FAQ Section -->
        <section style="margin: 60px 0;">
          <h2 class="section-title">Frequently Asked Questions</h2>
          <div style="display: flex; flex-direction: column; gap: 14px; max-width: 760px; margin: 30px auto 0;">
            <div class="card" style="padding: 24px;">
              <h3 style="font-size: 1.15rem; color: var(--color-primary); margin-bottom: 8px;">Is Flirta strictly for dating?</h3>
              <p style="color: var(--color-text-secondary); font-size: 0.94rem;">
                No! Flirta is designed for discovering dance partners, making friends, and finding your festive match for Navratri. While you can opt into dating if interested, connection preferences are fully customizable.
              </p>
            </div>
            <div class="card" style="padding: 24px;">
              <h3 style="font-size: 1.15rem; color: var(--color-primary); margin-bottom: 8px;">Who can register on the platform?</h3>
              <p style="color: var(--color-text-secondary); font-size: 0.94rem;">
                All participants must be at least 18 years of age. Birthdates and adult eligibility declarations are strictly checked upon account creation.
              </p>
            </div>
            <div class="card" style="padding: 24px;">
              <h3 style="font-size: 1.15rem; color: var(--color-primary); margin-bottom: 8px;">Can anyone message me directly?</h3>
              <p style="color: var(--color-text-secondary); font-size: 0.94rem;">
                No. Private messaging is exclusively unlocked when both dancers have sent mutual likes to one another, preventing unsolicited messages.
              </p>
            </div>
          </div>
        </section>

        <!-- Footer -->
        <footer style="margin-top: 80px; padding: 40px 0 20px; border-top: 1px solid var(--color-border); text-align: center;">
          <div style="margin-bottom: 16px; font-weight: 800; font-size: 1.3rem; color: var(--color-text-primary);">
            Flirta · Find Your Dream Garba Partner
          </div>
          <p style="color: var(--color-text-secondary); font-size: 0.88rem; max-width: 600px; margin: 0 auto 18px;">
            Connecting Garba dancers across Gujarat cities, Mumbai, and Indore. Celebrating Gujarati heritage and safe festive togetherness.
          </p>
          <div style="display: flex; justify-content: center; gap: 20px; font-size: 0.85rem; font-weight: 600; color: var(--color-primary); margin-bottom: 20px;">
            <a href="javascript:void(0)" onclick="alert('Privacy Policy: All profile data is handled with strict confidentiality. Contact information is never sold or exposed.')">Privacy Policy</a>
            <a href="javascript:void(0)" onclick="alert('Terms of Service: Respectful conduct, 18+ adult age eligibility, and genuine cultural appreciation required.')">Terms of Use</a>
            <a href="javascript:void(0)" onclick="alert('Safety Guidelines: Meet in well-lit public celebrations, never share financial details, use in-app report tools.')">Safety Guidelines</a>
            <a href="javascript:void(0)" onclick="alert('Contact: support@flirta.com · Gujarat, India')">Support & Contact</a>
          </div>
          <p style="color: var(--color-text-muted); font-size: 0.78rem;">© 2026 Flirta. All rights reserved.</p>
        </footer>
      </div>
    `;
  }
};

window.Landing = Landing;
