// Flirta Subscription & Pricing Component

const Pricing = {
  plans: [],
  selectedPlan: null,

  async render() {
    MetaAds.trackPricingViewed();

    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="container" style="max-width: 1100px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <div class="hero-tag" style="margin-bottom: 14px;">
            <span>✨ Flirta Premium Passes</span>
          </div>
          <h1 style="font-size: 2.8rem; margin-bottom: 14px; letter-spacing: -0.02em;">
            Unlock Your Dream Garba Partner
          </h1>
          <p style="color: var(--color-text-secondary); max-width: 620px; margin: 0 auto 20px; font-size: 1.1rem;">
            Supercharge your Navratri 2026 discovery with higher daily likes, instant reveal of who liked you, and peak-night profile boosts.
          </p>
          <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.88rem; color: var(--color-primary); background: var(--color-primary-soft); padding: 6px 16px; border-radius: var(--radius-full); font-weight: 700; border: 1px solid var(--color-primary-border);">
            🔒 Transparent Pricing · 30-Day Festival Pass · No Automatic Traps
          </div>
        </div>

        <div id="pricing-plans-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 50px;">
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--color-primary);">
            Loading available plans...
          </div>
        </div>

        <!-- Trust & Consumer Protection Notes -->
        <div class="card" style="margin-bottom: 60px; background: #FFFFFF; border: 1px solid var(--color-border); padding: 30px;">
          <h3 style="font-size: 1.25rem; margin-bottom: 14px; color: var(--color-text-primary);">
            Our Honest Subscription Commitment
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; font-size: 0.92rem; color: var(--color-text-secondary);">
            <div>
              <strong style="color: var(--color-text-primary); display: block; margin-bottom: 4px;">🎯 Real Match Disclosures:</strong>
              Subscriptions grant discovery allowances, boost priority, and visibility tools. Matches are created strictly through genuine mutual interest. We never guarantee a response or match.
            </div>
            <div>
              <strong style="color: var(--color-text-primary); display: block; margin-bottom: 4px;">🛡️ Safety Always Included Free:</strong>
              Reporting, blocking, adult age verification, and personal contact privacy are 100% free for all registered users.
            </div>
            <div>
              <strong style="color: var(--color-text-primary); display: block; margin-bottom: 4px;">💳 Secure Transaction Processing:</strong>
              All transactions are encrypted with 256-bit SSL. Supported via UPI, RuPay, Visa, Mastercard, and NetBanking.
            </div>
          </div>
        </div>
      </div>
    `;

    await this.loadPlans();
  },

  async loadPlans() {
    const grid = document.getElementById('pricing-plans-grid');
    try {
      const res = await API.get('/api/subscriptions/plans');
      this.plans = res.plans || [];
      this.renderPlanCards();
    } catch (err) {
      grid.innerHTML = `
        <div class="card" style="grid-column: 1 / -1; text-align: center; color: var(--color-danger); padding: 30px;">
          Error loading plans: ${err.message}
        </div>
      `;
    }
  },

  renderPlanCards() {
    const grid = document.getElementById('pricing-plans-grid');
    if (!grid) return;

    grid.innerHTML = this.plans.map(p => {
      const isPopular = p.is_popular === 1;

      return `
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; position: relative; border: 2px solid ${isPopular ? 'var(--color-primary)' : 'var(--color-border)'}; ${isPopular ? 'box-shadow: var(--shadow-glow); transform: scale(1.02);' : ''}">
          ${isPopular ? `
            <div style="position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: var(--color-primary); color: #FFF; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 16px; border-radius: var(--radius-full); box-shadow: 0 4px 12px rgba(236,29,36,0.3);">
              Most Popular 🔥
            </div>
          ` : ''}

          <div>
            <div style="margin-bottom: 16px;">
              <h3 style="font-size: 1.4rem; margin-bottom: 4px;">${p.name}</h3>
              <p style="color: var(--color-text-muted); font-size: 0.85rem;">30-Day Navratri Pass</p>
            </div>

            <div style="margin-bottom: 24px; padding-bottom: 18px; border-bottom: 1px solid var(--color-border);">
              <span style="font-size: 2.6rem; font-weight: 800; color: var(--color-text-primary);">₹${p.price_inr}</span>
              <span style="color: var(--color-text-muted); font-size: 0.88rem;">/ festival pass</span>
            </div>

            <div style="margin-bottom: 18px; background: var(--color-bg); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 0.86rem;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Daily Likes:</span>
                <strong style="color: var(--color-primary);">${p.daily_likes_limit === -1 ? 'Unlimited' : p.daily_likes_limit + ' / day'}</strong>
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

            <ul style="list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; font-size: 0.88rem; color: var(--color-text-secondary);">
              ${(p.features || []).map(f => `
                <li style="display: flex; align-items: flex-start; gap: 8px;">
                  <span style="color: var(--color-success); font-weight: 800;">✓</span>
                  <span>${f}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <div>
            <button class="btn ${isPopular ? 'btn-primary' : 'btn-secondary'} btn-block" onclick="Pricing.openCheckoutModal(${p.id})">
              Choose ${p.name} (₹${p.price_inr})
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  openCheckoutModal(planId) {
    if (!State.isAuthenticated()) {
      openAuthModal('login');
      return;
    }

    const plan = this.plans.find(p => p.id === planId);
    if (!plan) return;

    this.selectedPlan = plan;
    MetaAds.trackCheckoutStarted(plan.code, plan.price_inr);

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'checkout-modal';
    modal.innerHTML = `
      <div class="modal-box" style="max-width: 480px;">
        <div class="modal-header">
          <h3>Confirm Flirta Subscription</h3>
          <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>

        <div style="background: var(--color-bg); padding: 18px; border-radius: var(--radius-md); margin-bottom: 20px; border: 1px solid var(--color-border);">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
            <strong style="font-size: 1.2rem; color: var(--color-text-primary);">${plan.name} Pass</strong>
            <strong style="font-size: 1.5rem; color: var(--color-primary);">₹${plan.price_inr}</strong>
          </div>
          <div style="font-size: 0.85rem; color: var(--color-text-secondary); line-height: 1.4;">
            Includes 30 days active access · ${plan.daily_likes_limit === -1 ? 'Unlimited' : plan.daily_likes_limit} daily interest allowances · ${plan.can_see_likes ? 'Who Liked You unlocked' : 'Basic partner discovery'} · ${plan.boost_credits} profile boosts.
          </div>
        </div>

        <form onsubmit="Pricing.processPayment(event)">
          <div class="form-group">
            <label class="form-label">Payment Method</label>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
              <label style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 1px solid var(--color-border); border-radius: 8px; cursor: pointer;">
                <input type="radio" name="pay-method" value="UPI (GPay / PhonePe / Paytm)" checked accent-color="var(--color-primary)">
                <span>📱 UPI (Google Pay, PhonePe, Paytm, BHIM)</span>
              </label>
              <label style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 1px solid var(--color-border); border-radius: 8px; cursor: pointer;">
                <input type="radio" name="pay-method" value="Credit / Debit Card" accent-color="var(--color-primary)">
                <span>💳 Debit / Credit Card (Visa, RuPay, Mastercard)</span>
              </label>
              <label style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 1px solid var(--color-border); border-radius: 8px; cursor: pointer;">
                <input type="radio" name="pay-method" value="NetBanking" accent-color="var(--color-primary)">
                <span>🏦 NetBanking (HDFC, ICICI, SBI, Axis)</span>
              </label>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; margin-bottom: 18px; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); font-size: 0.95rem;">
            <span>Total Payable Amount:</span>
            <strong style="font-size: 1.3rem; color: var(--color-text-primary);">₹${plan.price_inr}</strong>
          </div>

          <button type="submit" id="pay-submit-btn" class="btn btn-primary btn-block">
            Pay ₹${plan.price_inr} & Activate Pass 🪘
          </button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async processPayment(e) {
    e.preventDefault();
    const btn = document.getElementById('pay-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Verifying Transaction...';

    const selectedMethod = document.querySelector('input[name="pay-method"]:checked').value;
    const plan = this.selectedPlan;

    try {
      // 1. Create Order
      const orderRes = await API.post('/api/subscriptions/create-order', { planId: plan.id });
      const orderId = orderRes.orderId;

      // 2. Verify Payment & Activate
      const verifyRes = await API.post('/api/subscriptions/verify-payment', {
        orderId,
        paymentMethod: selectedMethod
      });

      // 3. Track Meta Ads Purchase Event
      MetaAds.trackPurchase(orderId, plan.code, plan.price_inr);

      showToast(verifyRes.message || 'Subscription Activated!', 'success');
      const modal = document.getElementById('checkout-modal');
      if (modal) modal.remove();

      // Refresh state & navigate to discover
      Router.navigate('/discover');
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = `Pay ₹${plan.price_inr} & Activate Pass 🪘`;
    }
  }
};

window.Pricing = Pricing;
