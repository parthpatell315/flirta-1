const Landing = {
  async render() {
    if (window.MetaAds && MetaAds.trackPageView) MetaAds.trackPageView('landing_page');
    const copy = window.COPY || {};
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="container">
        <section class="hero">
          <div class="hero-tag"><span>18+ dating</span></div>
          <h1 class="hero-title">${copy.homeTitle || 'Meet someone nearby'}</h1>
          <p class="hero-subtitle">${copy.homeSubtitle || ''}</p>
          <div class="hero-actions">
            <button class="btn btn-primary" onclick="${State.isAuthenticated() ? "Router.navigate('/discover')" : "openAuthModal('register')"}">
              ${State.isAuthenticated() ? 'Browse people' : 'Create a profile'}
            </button>
            <button class="btn btn-secondary" onclick="Router.navigate('/pricing')">See plans</button>
          </div>
        </section>
        <section class="landing-section">
          <h2 class="section-title">How it works</h2>
          <div class="steps-grid">
            <div class="step-card"><div class="step-number">1</div><div><h3>Sign up</h3><p>Use email or a phone OTP. You must be 18 or older.</p></div></div>
            <div class="step-card"><div class="step-number">2</div><div><h3>Add your profile</h3><p>Photos, bio, age, city, and interests.</p></div></div>
            <div class="step-card"><div class="step-number">3</div><div><h3>Match and chat</h3><p>Like or pass. Chat opens when the like is mutual.</p></div></div>
          </div>
        </section>
        <section class="landing-section">
          <h2 class="section-title">Plans</h2>
          <p class="section-subtitle">${(window.RULES && RULES.plans.free) || ''}</p>
          <p class="section-subtitle">${(window.RULES && RULES.plans.premium) || ''}</p>
          <p><a href="/terms" data-link>Terms</a> · <a href="/privacy" data-link>Privacy</a> · <a href="/safety" data-link>Safety</a></p>
        </section>
      </div>
    `;
  }
};

window.Landing = Landing;
