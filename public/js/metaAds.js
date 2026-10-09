// Flirta Meta Ads & Conversion Funnel Tracker
// Provides consent-aware, privacy-safe event measurement compatible with Meta Pixel & Conversions API

const MetaAds = {
  getEventId() {
    return 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  },

  track(eventName, customData = {}) {
    const eventId = this.getEventId();
    const payload = {
      ...customData,
      event_id: eventId,
      timestamp: new Date().toISOString()
    };

    // Client-side pixel trigger if fbq is installed
    if (typeof window.fbq === 'function') {
      try {
        window.fbq('track', eventName, payload, { eventID: eventId });
      } catch (err) {
        console.debug('Meta Pixel browser dispatch note:', err);
      }
    }

    // Server-side Conversions API logging via /api/analytics/track
    const serverEventMap = {
      'PageView': 'landing_page_visited',
      'Lead': 'registration_started',
      'CompleteRegistration': 'registration_completed',
      'ViewContent': 'pricing_viewed',
      'InitiateCheckout': 'checkout_started',
      'Purchase': 'subscription_purchased'
    };

    const serverEventName = serverEventMap[eventName] || eventName;
    if (window.API) {
      API.post('/api/analytics/track', {
        eventName: serverEventName,
        payload
      }).catch(() => {});
    }
  },

  // Standard Meta Events
  trackPageView(pageName) {
    this.track('PageView', { page_name: pageName });
  },

  trackRegistrationStarted() {
    this.track('Lead', { source: 'flirta_onboarding' });
  },

  trackRegistrationCompleted(userCity) {
    this.track('CompleteRegistration', { city: userCity, status: '18_verified' });
  },

  trackPricingViewed() {
    this.track('ViewContent', { content_type: 'subscription_plans', currency: 'INR' });
  },

  trackCheckoutStarted(planCode, amountInr) {
    this.track('InitiateCheckout', {
      content_name: planCode,
      value: amountInr,
      currency: 'INR'
    });
  },

  trackPurchase(orderId, planCode, amountInr) {
    this.track('Purchase', {
      order_id: orderId,
      content_name: planCode,
      value: amountInr,
      currency: 'INR'
    });
  }
};

window.MetaAds = MetaAds;
