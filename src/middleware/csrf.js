const config = require('../config/config');

/**
 * CSRF Protection Middleware for SPAs
 * Follows OWASP recommendations for cookie/token hybrid APIs:
 * 1. Checks Origin/Referer on state-modifying requests (POST, PUT, PATCH, DELETE)
 * 2. Checks custom request header (X-Requested-With or X-CSRF-Protection)
 * Exempts Webhooks (PayU / Razorpay) which are verified by crypto signatures.
 */
function csrfProtection(req, res, next) {
  // Allow safe idempotent methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Exempt payment callbacks and webhooks (they use cryptographic SHA-512 / HMAC signatures)
  if (req.path.startsWith('/api/subscriptions/payu/callback') ||
      req.path.startsWith('/api/subscriptions/webhook')) {
    return next();
  }

  // If request uses Authorization: Bearer, standard CSRF is mitigated (browsers do not attach Bearer automatically)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }

  // In test environment, allow test requests
  if (config.NODE_ENV === 'test') {
    return next();
  }

  // Verify custom header present on API calls
  const customHeader = req.headers['x-requested-with'] || req.headers['x-csrf-token'];
  if (customHeader) {
    return next();
  }

  // Verify Origin / Referer if no Bearer token
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (origin) {
    try {
      const originUrl = new URL(origin);
      const configuredUrl = new URL(config.BASE_URL);
      if (originUrl.hostname === configuredUrl.hostname || originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') {
        return next();
      }
    } catch {}
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const configuredUrl = new URL(config.BASE_URL);
      if (refererUrl.hostname === configuredUrl.hostname || refererUrl.hostname === 'localhost' || refererUrl.hostname === '127.0.0.1') {
        return next();
      }
    } catch {}
  }

  // Block suspicious cross-origin request
  return res.status(403).json({ error: 'Cross-site request forgery protection triggered. Request blocked.' });
}

module.exports = {
  csrfProtection
};
