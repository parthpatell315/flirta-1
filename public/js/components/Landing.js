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
            <span>Navratri 2026 Partner Discovery & Dating</span>
          </div>
          <h1 class="hero-title">Find Your Dream Garba Partner</h1>
          <p class="hero-subtitle">
            Meet someone who matches your vibe, your dance style, and your energy. Your Navratri feels different when you find someone who matches your vibe. Discover compatible Garba partners on Flirta.
          </p>
          <div class="hero-actions">
            <button class="btn btn-primary" onclick="${State.isAuthenticated() ? "Router.navigate('/discover')" : "openAuthModal('register')"}">
              Find My Garba Partner
            </button>
            <button class="btn btn-secondary" onclick="Router.navigate('/pricing')">
              Explore Plans
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
        <section class="landing-section">
          <h2 class="section-title">How Flirta Works</h2>
          <p class="section-subtitle">Three simple steps to finding your ideal dance companion this festival season.</p>
          
          <div class="steps-grid">
            <div class="step-card">
              <div class="step-number">1</div>
              <div>
                <h3>Curate Your Dance Profile</h3>
                <p>Share your favorite Garba steps (Dodhiya, Popat, 3-Taali), dance skill level, preferred cities, and whether you are seeking a dance partner, friends, or dating.</p>
              </div>
            </div>
            <div class="step-card">
              <div class="step-number">2</div>
              <div>
                <h3>Discover & Connect</h3>
                <p>Browse attendee profiles across Gujarat cities, Mumbai, and Indore. Send an interest with one tap.</p>
              </div>
            </div>
            <div class="step-card">
              <div class="step-number">3</div>
              <div>
                <h3>Coordinate & Dance Raas</h3>
                <p>When you both express interest, a mutual match unlocks private messaging to coordinate festive attire, meetups, and dance steps together.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Find Garba Partners City-Wise -->
        <section class="landing-section">
          <h2 class="section-title">Explore Partners by City</h2>
          <p class="section-subtitle">Find your ideal Garba match, coordinate attire, and enjoy 9 nights of Raas across Gujarat, Mumbai & Indore.</p>
          <div class="city-cards-grid">
            <div class="card city-nav-card" onclick="Router.navigate('/discover?city=Ahmedabad')">
              <h3 style="color: var(--color-primary);">Ahmedabad</h3>
              <p>Heritage Garba & Mega Venues</p>
              <span class="btn btn-secondary btn-sm">Find Your Match →</span>
            </div>
            <div class="card city-nav-card" onclick="Router.navigate('/discover?city=Surat')">
              <h3 style="color: var(--color-primary);">Surat</h3>
              <p>High Energy & Vibrant Beats</p>
              <span class="btn btn-secondary btn-sm">Find Your Match →</span>
            </div>
            <div class="card city-nav-card" onclick="Router.navigate('/discover?city=Vadodara')">
              <h3 style="color: var(--color-primary);">Vadodara</h3>
              <p>Cultural Capital & United Way</p>
              <span class="btn btn-secondary btn-sm">Find Your Match →</span>
            </div>
            <div class="card city-nav-card" onclick="Router.navigate('/discover?city=Rajkot')">
              <h3 style="color: var(--color-primary);">Rajkot</h3>
              <p>Kathiyawadi Heech & Dhol</p>
              <span class="btn btn-secondary btn-sm">Find Your Match →</span>
            </div>
            <div class="card city-nav-card" onclick="Router.navigate('/discover?city=Mumbai')">
              <h3 style="color: var(--color-primary);">Mumbai</h3>
              <p>Dandiya Raas & Dome Nights</p>
              <span class="btn btn-secondary btn-sm">Find Your Match →</span>
            </div>
            <div class="card city-nav-card" onclick="Router.navigate('/discover?city=Indore')">
              <h3 style="color: var(--color-primary);">Indore</h3>
              <p>Sarafa Food & Festive Garba</p>
              <span class="btn btn-secondary btn-sm">Find Your Match →</span>
            </div>
          </div>
        </section>

        <!-- Safety & Privacy Guarantee -->
        <section class="card landing-section safety-card-section" style="background: linear-gradient(135deg, var(--color-primary-soft), var(--color-secondary-soft)); border: 1px solid var(--color-primary-border);">
          <div class="safety-grid">
            <div>
              <span class="partner-badge" style="margin-bottom: 12px; display: inline-block;">Community Integrity</span>
              <h2 style="font-size: clamp(1.4rem, 4vw, 1.9rem); margin-bottom: 12px;">Safety First, Always</h2>
              <p style="color: var(--color-text-secondary); margin-bottom: 14px;">
                Flirta is committed to a respectful and safe cultural celebration:
              </p>
              <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px; color: var(--color-text-secondary); font-size: 0.92rem; padding: 0;">
                <li><strong>Strict 18+ Verification:</strong> Minors are not permitted on the platform.</li>
                <li><strong>Mutual Consent Messaging:</strong> Only mutual matches can send direct messages.</li>
                <li><strong>Instant Block & Report:</strong> One-tap safety tools actively monitored by admins.</li>
                <li><strong>Privacy Protection:</strong> Sensitive personal contact details are never made public.</li>
              </ul>
            </div>
            <div style="text-align: center; padding: 14px; background: rgba(255,255,255,0.7); border-radius: var(--radius-md);">
              <h3 style="color: var(--color-primary); margin-bottom: 8px; font-size: 1.15rem;">Garba First, Dating Optional</h3>
              <p style="color: var(--color-text-secondary); font-size: 0.88rem; margin: 0;">Whether you want to sync steps, make festive friends, or find romance, your preferences are clearly honored.</p>
            </div>
          </div>
        </section>

        <!-- FAQ Section -->
        <section class="landing-section">
          <h2 class="section-title">Frequently Asked Questions</h2>
          <div class="faq-list">
            <div class="card faq-card">
              <h3 style="font-size: 1.1rem; color: var(--color-primary); margin-bottom: 6px;">Is Flirta strictly for dating?</h3>
              <p style="color: var(--color-text-secondary); font-size: 0.92rem; margin: 0;">
                No! Flirta is designed for discovering dance partners, making friends, and finding your festive match for Navratri. While you can opt into dating if interested, connection preferences are fully customizable.
              </p>
            </div>
            <div class="card faq-card">
              <h3 style="font-size: 1.1rem; color: var(--color-primary); margin-bottom: 6px;">Who can register on the platform?</h3>
              <p style="color: var(--color-text-secondary); font-size: 0.92rem; margin: 0;">
                All participants must be at least 18 years of age. Birthdates and adult eligibility declarations are strictly checked upon account creation.
              </p>
            </div>
            <div class="card faq-card">
              <h3 style="font-size: 1.1rem; color: var(--color-primary); margin-bottom: 6px;">Can anyone message me directly?</h3>
              <p style="color: var(--color-text-secondary); font-size: 0.92rem; margin: 0;">
                No. Private messaging is exclusively unlocked when you and your match have sent mutual likes to one another, preventing unsolicited messages.
              </p>
            </div>
          </div>
        </section>

        <!-- Footer -->
        <footer class="landing-footer">
          <div style="margin-bottom: 16px; display: flex; justify-content: center; align-items: center;">
            <a href="/garba-partner" onclick="event.preventDefault(); Router.navigate('/garba-partner');" style="display: inline-flex; align-items: center; text-decoration: none;">
              <img src="/images/logo.png" alt="Flirta" class="footer-logo-img">
            </a>
          </div>
          <p style="color: var(--color-text-secondary); font-size: 0.88rem; max-width: 620px; margin: 0 auto 18px; line-height: 1.5;">
            Connecting you with your match across Ahmedabad, Vadodara, Surat, Rajkot, Mumbai, and Indore. Celebrating Gujarati heritage with verified, respectful connections.
          </p>
          <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 14px 20px; font-size: 0.82rem; font-weight: 600; color: var(--color-primary); margin-bottom: 18px;">
            <a href="/terms" data-link>Terms of Service</a>
            <a href="/privacy" data-link>Privacy Policy</a>
            <a href="/anti-escort-policy" data-link>Anti-Escort Policy</a>
            <a href="/safety" data-link>Safety Guidelines</a>
            <a href="/refund-policy" data-link>Refund Policy</a>
            <a href="/contact" data-link>Contact Us</a>
            <a href="/grievance" data-link>Grievance Officer (IT Rules)</a>
          </div>
          <p style="color: var(--color-text-muted); font-size: 0.76rem; margin: 0;">© 2026 Flirta. All rights reserved. Intermediary safe harbour under Section 79 IT Act 2000. DPDP Act 2023 compliant.</p>
        </footer>
      </div>
    `;
  }
};

window.Landing = Landing;
