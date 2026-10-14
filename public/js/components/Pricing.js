// Flirta Subscription & Pricing Component

const Pricing = {
  plans: [],
  selectedPlan: null,
  selectedPlanId: 2, // Default: Chemistry Pass
  durationMode: 'festival', // 'festival' (9 nights) or 'single' (1 night)
  paymentMethod: 'payu', // 'payu' or 'simulator'
  pendingPlanId: null,

  async render() {
    MetaAds.trackPricingViewed();

    // Check for PayU return parameters in query or hash
    const searchParams = new URLSearchParams(window.location.search);
    let payuStatus = searchParams.get('payu_status');
    let txnid = searchParams.get('txnid');
    let errorMsg = searchParams.get('msg');

    if (!payuStatus && window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.split('?')[1];
      const hashParams = new URLSearchParams(hashQuery);
      payuStatus = hashParams.get('payu_status');
      txnid = hashParams.get('txnid');
      errorMsg = hashParams.get('msg');
    }

    let statusBannerHtml = '';
    if (payuStatus === 'success') {
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Purchase', {
          transaction_id: txnid,
          currency: 'INR'
        });
      }
      if (window.MetaAds && typeof window.MetaAds.trackPurchase === 'function') {
        window.MetaAds.trackPurchase(txnid || 'txn_success', 'navratri_pass', 0);
      }
      statusBannerHtml = `
        <div class="card" style="background: rgba(16, 185, 129, 0.08); border: 1.5px solid var(--color-success); padding: 20px 24px; margin-bottom: 30px; border-radius: var(--radius-md); text-align: center;">
          <div style="font-weight: 700; color: var(--color-success); font-size: 1.15rem; margin-bottom: 6px;">
            Payment Successful via PayU
          </div>
          <p style="color: var(--color-text-secondary); margin: 0 0 12px; font-size: 0.92rem;">
            Your plan is active. Transaction ID: <code>${txnid || 'N/A'}</code>
          </p>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button class="btn btn-primary btn-sm" onclick="Router.navigate('/discover')">Start Exploring Partners</button>
            <button class="btn btn-secondary btn-sm" onclick="window.history.replaceState({}, document.title, window.location.pathname + '#/pricing'); Pricing.render();">Dismiss</button>
          </div>
        </div>
      `;
      // Refresh current user info if authenticated
      if (State.isAuthenticated()) {
        API.get('/api/users/profile').then(res => {
          if (res && res.profile) State.setUser(State.user, res.profile, State.photos);
        }).catch(() => {});
      }
    } else if (payuStatus === 'failed') {
      statusBannerHtml = `
        <div class="card" style="background: rgba(239, 68, 68, 0.08); border: 1.5px solid var(--color-danger); padding: 20px 24px; margin-bottom: 30px; border-radius: var(--radius-md); text-align: center;">
          <div style="font-weight: 700; color: var(--color-danger); font-size: 1.15rem; margin-bottom: 6px;">
            PayU Payment Incomplete or Declined
          </div>
          <p style="color: var(--color-text-secondary); margin: 0 0 12px; font-size: 0.92rem;">
            ${errorMsg || 'The transaction was cancelled or declined by your bank/UPI app. You may retry anytime.'}
          </p>
          <button class="btn btn-secondary btn-sm" onclick="window.history.replaceState({}, document.title, window.location.pathname + '#/pricing'); Pricing.render();">Dismiss</button>
        </div>
      `;
    }

    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="container" style="max-width: 1100px;">
        ${statusBannerHtml}
        <div class="pricing-header" style="text-align: center; margin-bottom: 36px;">
          <div class="hero-tag" style="margin-bottom: 12px;">
            <span>Flirta Premium Passes</span>
          </div>
          <h1 style="font-size: clamp(1.75rem, 5vw, 2.7rem); margin-bottom: 12px; letter-spacing: -0.02em;">
            Choose a plan
          </h1>
          <p style="color: var(--color-text-secondary); max-width: 600px; margin: 0 auto 16px; font-size: clamp(0.92rem, 2.2vw, 1.05rem); line-height: 1.5;">
            Free accounts get limited daily likes. Chemistry and above include unlimited likes, who liked you, and advanced filters. Boosts and Super Likes are separate purchases.
          </p>

          <div style="display: inline-flex; align-items: center; justify-content: center; text-align: center; gap: 8px; font-size: 0.82rem; color: var(--color-primary); background: var(--color-primary-soft); padding: 6px 14px; border-radius: var(--radius-full); font-weight: 700; border: 1px solid var(--color-primary-border); line-height: 1.4; max-width: 100%; margin-bottom: 24px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Prices below are the amounts charged. Plans do not renew unless you buy again.
          </div>

          <!-- Interactive Duration Toggle Switch -->
          <div class="pricing-duration-toggle-wrapper" style="margin: 0 auto;">
            <div class="pricing-duration-toggle" role="tablist" aria-label="Pass duration toggle">
              <button type="button" id="btn-toggle-festival" class="pricing-duration-btn ${this.durationMode === 'festival' ? 'active' : ''}" onclick="Pricing.setDurationMode('festival')" role="tab" aria-selected="${this.durationMode === 'festival'}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                9-Night Festival Pass
              </button>
              <button type="button" id="btn-toggle-single" class="pricing-duration-btn ${this.durationMode === 'single' ? 'active' : ''}" onclick="Pricing.setDurationMode('single')" role="tab" aria-selected="${this.durationMode === 'single'}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                1-Night Pass
              </button>
            </div>
          </div>
        </div>

        <div id="pricing-plans-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 20px; margin-bottom: 36px; align-items: stretch;">
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--color-primary);">
            Loading available plans...
          </div>
        </div>

        <!-- Mandatory Safety Footer Disclaimers -->
        <div class="pricing-disclaimer-box">
          <div style="font-weight: 700; color: #444444; margin-bottom: 8px; font-size: 0.86rem; letter-spacing: 0.2px;">
            Legal Disclaimer & Safety Terms:
          </div>
          <ol style="margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px;">
            <li>This platform functions strictly as a peer-to-peer social discovery and matchmaking service for cultural dance networking. We do not offer or facilitate paid, rented, or commercial companion services.</li>
            <li>All user profiles require mandatory mobile OTP and identity verification before interaction is enabled.</li>
            <li>Subscription fees are strictly for digital matching features and profile filters; we do not guarantee offline meetings or partner availability.</li>
            <li>To report suspicious profiles or fraud, please visit our <a href="javascript:void(0)" onclick="Legal.open('grievance')" style="color: var(--color-primary); text-decoration: underline; font-weight: 600;">Grievance Redressal page</a> or email our designated Grievance Officer at <a href="mailto:compliance@flirta.in" style="color: var(--color-primary); text-decoration: underline;">compliance@flirta.in</a>.</li>
          </ol>
        </div>

        <!-- Trust & Consumer Protection Notes -->
        <div class="card pricing-trust-card">
          <h3 style="font-size: 1.25rem; margin-bottom: 14px; color: var(--color-text-primary);">
            Our Honest Subscription Commitment
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; font-size: 0.92rem; color: var(--color-text-secondary);">
            <div>
              <strong style="color: var(--color-text-primary); display: block; margin-bottom: 4px;">Real Match Disclosures:</strong>
              Subscriptions grant discovery allowances, boost priority, and visibility tools. Matches are created strictly through genuine mutual interest. We never guarantee a response or match.
            </div>
            <div>
              <strong style="color: var(--color-text-primary); display: block; margin-bottom: 4px;">Safety Always Included Free:</strong>
              Reporting, blocking, adult age verification, and personal contact privacy are 100% free for all registered users.
            </div>
            <div>
              <strong style="color: var(--color-text-primary); display: block; margin-bottom: 4px;">Secure PayU Gateway Integration:</strong>
              All transactions are encrypted with 256-bit SSL via PayU India. Supported payment options include UPI, Google Pay, PhonePe, Paytm, RuPay, Visa, Mastercard, and NetBanking.
            </div>
          </div>
        </div>
      </div>
    `;

    await this.loadPlans();
  },

  setDurationMode(mode) {
    this.durationMode = mode;
    const btnFestival = document.getElementById('btn-toggle-festival');
    const btnSingle = document.getElementById('btn-toggle-single');
    if (btnFestival) btnFestival.classList.toggle('active', mode === 'festival');
    if (btnSingle) btnSingle.classList.toggle('active', mode === 'single');
    this.renderPlanCards();
  },

  async loadPlans() {
    const grid = document.getElementById('pricing-plans-grid');
    try {
      const res = await API.get('/api/subscriptions/plans');
      this.plans = res.plans || [];
      if (this.plans.length > 0 && !this.selectedPlanId) {
        const popular = this.plans.find(p => p.is_popular === 1);
        this.selectedPlanId = popular ? popular.id : this.plans[0].id;
      }
      this.renderPlanCards();
    } catch (err) {
      if (grid) {
        grid.innerHTML = `
          <div class="card" style="grid-column: 1 / -1; text-align: center; color: var(--color-danger); padding: 30px;">
            Error loading plans: ${err.message}
          </div>
        `;
      }
    }
  },

  selectPlan(planId) {
    this.selectedPlanId = Number(planId) || planId;
    this.renderPlanCards();
    this.openCheckoutModal(planId);
  },

  renderPlanCards() {
    const grid = document.getElementById('pricing-plans-grid');
    if (!grid || !this.plans.length) return;

    // Render cards
    grid.innerHTML = this.plans.map(p => {
      const isPopular = p.is_popular === 1;
      const isSelected = p.id === this.selectedPlanId;
      const displayPrice = this.durationMode === 'single'
        ? Math.round(p.price_inr / 3.5)
        : p.price_inr;
      const durationLabel = this.durationMode === 'single'
        ? '1-Night Festival Entry'
        : '9-Night Festival Access';
      const periodLabel = this.durationMode === 'single'
        ? '/ single night'
        : '/ festival pass';

      let topPillHtml = '';
      if (isPopular && isSelected) {
        topPillHtml = `<div class="plan-card-top-pill popular">★ Most Popular · Selected</div>`;
      } else if (isPopular) {
        topPillHtml = `<div class="plan-card-top-pill popular">Most Popular</div>`;
      } else if (isSelected) {
        topPillHtml = `<div class="plan-card-top-pill selected">✓ Selected Pass</div>`;
      }

      return `
        <div class="plan-card ${isPopular ? 'is-popular' : ''} ${isSelected ? 'selected' : ''}" onclick="Pricing.selectPlan(${p.id})">
          ${topPillHtml}

          <div>
            <div style="margin-bottom: 12px; text-align: left;">
              <h3 style="font-size: 1.35rem; font-weight: 800; margin: 0 0 4px; color: var(--color-text-primary);">${p.name}</h3>
              <p style="color: var(--color-text-muted); font-size: 0.82rem; margin: 0;">${durationLabel}</p>
            </div>

            <div style="margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid var(--color-border); display: flex; align-items: baseline; gap: 4px;">
              <span style="font-size: 2.3rem; font-weight: 800; color: var(--color-text-primary); line-height: 1;">₹${displayPrice}</span>
              <span style="color: var(--color-text-muted); font-size: 0.82rem;">${periodLabel}</span>
            </div>

            <div style="margin-bottom: 16px; background: var(--color-bg); padding: 10px 12px; border-radius: 8px; font-size: 0.82rem; line-height: 1.5;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Daily Likes:</span>
                <strong style="color: var(--color-primary);">${p.daily_likes_limit === -1 ? 'Unlimited' : p.daily_likes_limit + ' / day'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Profile Photos:</span>
                <strong style="color: ${p.price_inr >= 549 ? 'var(--color-success)' : p.price_inr >= 249 ? 'var(--color-primary)' : 'var(--color-text-muted)'};">
                  ${p.price_inr >= 549 ? 'All Photos Unlocked' : p.price_inr >= 249 ? '1 Photo Unlocked' : '✕ Locked'}
                </strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Who Liked Me:</span>
                <strong style="color: ${p.can_see_likes ? 'var(--color-success)' : 'var(--color-text-muted)'};">${p.can_see_likes ? '✓ Unlocked' : '✕ Locked'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Boost Credits:</span>
                <strong style="color: var(--color-secondary);">${p.boost_credits > 0 ? p.boost_credits + ' Credits' : 'None'}</strong>
              </div>
            </div>

            <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; font-size: 0.84rem; color: var(--color-text-secondary); padding: 0;">
              ${(p.features || []).map(f => `
                <li style="display: flex; align-items: flex-start; gap: 8px; line-height: 1.35;">
                  <span style="color: var(--color-success); font-weight: 800; font-size: 0.85rem; line-height: 1.35;">✓</span>
                  <span>${f}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <div style="margin-top: auto;">
            <button class="btn ${isSelected || isPopular ? 'btn-primary' : 'btn-secondary'} btn-block" style="padding: 10px 14px; font-weight: 700; font-size: 0.88rem;" onclick="event.stopPropagation(); Pricing.openCheckoutModal(${p.id})">
              ${isSelected ? 'Selected — Proceed (₹' + displayPrice + ')' : 'Choose ' + p.name + ' (₹' + displayPrice + ')'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  setPaymentMethod(method) {
    this.paymentMethod = method;
    const cards = document.querySelectorAll('.payment-method-card');
    cards.forEach(c => {
      const isCurrent = c.getAttribute('data-method') === method;
      c.classList.toggle('active', isCurrent);
      const radio = c.querySelector('input[type="radio"]');
      if (radio) radio.checked = isCurrent;
    });
  },

  openCheckoutModal(planId) {
    // Remove any existing checkout modal
    const existing = document.getElementById('checkout-modal');
    if (existing) existing.remove();

    const plan = this.plans.find(p => p.id == planId || p.code === planId) || this.plans[0];
    if (!plan) return;

    this.selectedPlan = plan;
    this.selectedPlanId = plan.id;
    this.pendingPlanId = plan.id;
    try {
      sessionStorage.setItem('flirta_pending_plan_id', String(plan.id));
    } catch {}

    const displayPrice = this.durationMode === 'single'
      ? Math.round(plan.price_inr / 3.5)
      : plan.price_inr;
    const durationLabel = this.durationMode === 'single'
      ? '1-Night Festival Entry Pass'
      : '9-Night Complete Navratri Festival Pass';

    MetaAds.trackCheckoutStarted(plan.code, displayPrice);

    const isAuthed = State.isAuthenticated();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'checkout-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = `
      <div class="modal-box" style="max-width: 500px;" onclick="event.stopPropagation()">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; background: var(--color-primary); color: #fff; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem;">F</div>
            <h3 style="margin: 0; font-size: 1.25rem;">Confirm Festival Pass</h3>
          </div>
          <button type="button" class="close-btn" onclick="document.getElementById('checkout-modal')?.remove()" aria-label="Close checkout">×</button>
        </div>

        <!-- Plan Summary Banner -->
        <div style="background: var(--color-bg); padding: 18px; border-radius: var(--radius-md); margin-bottom: 20px; border: 1.5px solid var(--color-border);">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
            <strong style="font-size: 1.2rem; color: var(--color-text-primary);">${plan.name} Pass</strong>
            <strong style="font-size: 1.6rem; color: var(--color-primary);">₹${displayPrice}</strong>
          </div>
          <div style="font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 8px;">
            ${durationLabel}
          </div>
          <div style="font-size: 0.84rem; color: var(--color-text-secondary); line-height: 1.45;">
            Includes ${this.durationMode === 'single' ? '1 night' : '9 nights'} active festival access · ${plan.price_inr >= 549 ? 'Explore all photos of your match' : '1 clear profile photo unlocked'} · ${plan.daily_likes_limit === -1 ? 'Unlimited' : plan.daily_likes_limit} daily interest allowances · ${plan.can_see_likes ? 'Who Liked You unlocked' : 'Basic discovery'} · ${plan.boost_credits} profile boosts.
          </div>
        </div>

        ${!isAuthed ? `
          <!-- Guest Account Notice & Instant Login -->
          <div style="background: #FFF8F0; border: 1px solid #FFE0B2; padding: 14px 16px; border-radius: 10px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: #D97706; margin-bottom: 4px; font-size: 0.9rem;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              Account Required to Link Pass
            </div>
            <p style="font-size: 0.82rem; color: var(--color-text-secondary); margin: 0 0 10px; line-height: 1.4;">
              Sign in or create a 18+ verified account to connect your ${plan.name} pass.
            </p>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" class="btn btn-primary btn-sm" onclick="Pricing.goToAuth('login')">Sign In & Continue</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="Pricing.goToAuth('register')">Join (18+)</button>
            </div>
          </div>
        ` : `
          <!-- Verified User Badge -->
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid var(--color-success); padding: 10px 14px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 0.86rem;">
            <span>Account: <strong>${State.user.email}</strong></span>
            <span style="color: var(--color-success); font-weight: 700; font-size: 0.8rem;">✓ 18+ Verified</span>
          </div>
        `}

        <form onsubmit="Pricing.processPayment(event)">
          <div class="form-group">
            <label class="form-label" style="font-weight: 700; font-size: 0.88rem;">Payment Method</label>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 8px;">
              <div class="payment-method-card active" data-method="payu">
                <input type="hidden" name="pay-method" value="payu">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <strong style="color: var(--color-text-primary); font-size: 0.95rem;">PayU India Gateway</strong>
                      <span style="background: var(--color-primary); color: #fff; font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 4px;">OFFICIAL</span>
                    </div>
                    <span style="color: var(--color-success); font-weight: 700; font-size: 0.8rem;">256-Bit SSL</span>
                  </div>
                  <div style="font-size: 0.82rem; color: var(--color-text-secondary); line-height: 1.4;">
                    UPI (Google Pay, PhonePe, Paytm, BHIM), NetBanking, Credit & Debit Cards
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; margin-bottom: 20px; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); font-size: 0.95rem;">
            <span>Total Payable:</span>
            <strong style="font-size: 1.4rem; color: var(--color-text-primary);">₹${displayPrice}</strong>
          </div>

          <button type="submit" id="pay-submit-btn" class="btn btn-primary btn-block">
            Proceed to Secure Payment (₹${displayPrice})
          </button>
        </form>
      </div>
    `;

    // Backdrop click dismiss
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
  },

  goToAuth(mode) {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.remove();
    if (typeof openAuthModal === 'function') {
      openAuthModal(mode);
    }
  },

  async processPayment(e) {
    e.preventDefault();

    if (!State.isAuthenticated()) {
      showToast('Please sign in or create an account to proceed.', 'info');
      this.goToAuth('login');
      return;
    }

    const btn = document.getElementById('pay-submit-btn');
    if (btn) btn.disabled = true;

    const selectedGateway = document.querySelector('input[name="pay-method"]:checked')?.value || this.paymentMethod;
    const plan = this.selectedPlan;
    const displayPrice = this.durationMode === 'single'
      ? Math.round(plan.price_inr / 3.5)
      : plan.price_inr;

    if (btn) btn.textContent = 'Connecting to PayU Secure Gateway...';
    try {
      const payuRes = await API.post('/api/subscriptions/payu/initiate', { planId: plan.id });
      if (!payuRes.success || !payuRes.actionUrl) {
        throw new Error(payuRes.message || 'Could not initiate PayU checkout.');
      }

      // Build HTML form and submit to PayU
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = payuRes.actionUrl;
      form.style.display = 'none';

      for (const [key, val] of Object.entries(payuRes.params)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = val !== undefined && val !== null ? val : '';
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      showToast(err.message, 'error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = `Proceed to Secure Payment (₹${displayPrice})`;
      }
    }
  }
};

window.Pricing = Pricing;
