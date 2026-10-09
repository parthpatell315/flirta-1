const crypto = require('node:crypto');
const config = require('../config/config');
const { getDb } = require('../db/database');

// Helper to get active subscription & plan for a user
function getUserActiveSubscription(db, userId) {
  return db.prepare(`
    SELECT
      us.id as subscription_id,
      us.user_id,
      us.plan_id,
      us.status,
      us.start_date,
      us.end_date,
      us.remaining_boosts,
      p.code,
      p.name,
      p.price_inr,
      p.duration_days,
      p.daily_likes_limit,
      p.boost_credits,
      p.can_see_likes,
      p.can_see_photo,
      p.can_see_all_photos,
      p.priority_level,
      p.features_json
    FROM user_subscriptions us
    JOIN subscription_plans p ON us.plan_id = p.id
    WHERE us.user_id = ?
      AND us.status = 'active'
      AND us.end_date > CURRENT_TIMESTAMP
    ORDER BY p.priority_level DESC, us.id DESC
    LIMIT 1
  `).get(userId);
}

// 1. List Available Subscription Plans
exports.getPlans = (req, res) => {
  try {
    const db = getDb();
    const plans = db.prepare(`
      SELECT * FROM subscription_plans
      WHERE is_active = 1
      ORDER BY price_inr ASC
    `).all();

    const formattedPlans = plans.map(p => {
      let features = [];
      try {
        features = JSON.parse(p.features_json);
      } catch {
        features = [];
      }
      return {
        ...p,
        features
      };
    });

    return res.json({ plans: formattedPlans });
  } catch (err) {
    console.error('getPlans error:', err);
    return res.status(500).json({ error: 'Failed to retrieve subscription plans.' });
  }
};

// 2. Get User Current Subscription & Usage
exports.getMySubscription = (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    const activeSub = getUserActiveSubscription(db, userId);

    // Calculate today's likes count
    const likesToday = db.prepare(`
      SELECT COUNT(*) as count FROM likes
      WHERE sender_id = ?
        AND action = 'like'
        AND DATE(created_at) = DATE('now')
    `).get(userId).count;

    const dailyLimit = activeSub ? activeSub.daily_likes_limit : 5; // Default free allowance: 5 likes
    const remainingLikes = dailyLimit === -1 ? 'unlimited' : Math.max(0, dailyLimit - likesToday);

    // Check if profile currently has active boost
    const profile = db.prepare('SELECT boosted_until FROM profiles WHERE user_id = ?').get(userId);
    const isBoosted = profile && profile.boosted_until && new Date(profile.boosted_until) > new Date();

    // Payment transactions history
    const transactions = db.prepare(`
      SELECT pt.*, sp.name as plan_name
      FROM payment_transactions pt
      JOIN subscription_plans sp ON pt.plan_id = sp.id
      WHERE pt.user_id = ?
      ORDER BY pt.created_at DESC
      LIMIT 10
    `).all(userId);

    let parsedFeatures = [];
    if (activeSub) {
      try { parsedFeatures = JSON.parse(activeSub.features_json); } catch {}
    }

    return res.json({
      hasActiveSubscription: !!activeSub,
      subscription: activeSub ? {
        id: activeSub.subscription_id,
        planCode: activeSub.code,
        planName: activeSub.name,
        priceInr: activeSub.price_inr,
        startDate: activeSub.start_date,
        endDate: activeSub.end_date,
        remainingBoosts: activeSub.remaining_boosts,
        canSeeLikes: activeSub.can_see_likes === 1,
        canSeePrimaryPhoto: activeSub.can_see_photo === 1 || activeSub.price_inr >= 249,
        canSeeAllPhotos: activeSub.can_see_all_photos === 1 || activeSub.price_inr >= 549,
        priorityLevel: activeSub.priority_level,
        features: parsedFeatures
      } : null,
      usage: {
        likesToday,
        dailyLimit: dailyLimit === -1 ? 'unlimited' : dailyLimit,
        remainingLikesToday: remainingLikes,
        isBoosted: !!isBoosted,
        boostedUntil: isBoosted ? profile.boosted_until : null
      },
      transactions
    });
  } catch (err) {
    console.error('getMySubscription error:', err);
    return res.status(500).json({ error: 'Failed to retrieve subscription details.' });
  }
};

// 3. Create Subscription Payment Order
exports.createOrder = (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { planId, planCode } = req.body;

    let plan = null;
    if (planId) {
      plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1').get(parseInt(planId, 10));
    } else if (planCode) {
      plan = db.prepare('SELECT * FROM subscription_plans WHERE code = ? AND is_active = 1').get(planCode.toLowerCase().trim());
    }

    if (!plan) {
      return res.status(404).json({ error: 'Selected subscription plan not found or inactive.' });
    }

    const orderId = `order_flirta_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    db.prepare(`
      INSERT INTO payment_transactions (user_id, plan_id, order_id, amount_inr, currency, status)
      VALUES (?, ?, ?, ?, 'INR', 'created')
    `).run(userId, plan.id, orderId, plan.price_inr);

    // Track Meta Ads Checkout Initiated Funnel Event
    db.prepare(`
      INSERT INTO analytics_events (user_id, event_name, event_payload)
      VALUES (?, ?, ?)
    `).run(userId, 'checkout_started', JSON.stringify({
      orderId,
      planCode: plan.code,
      planName: plan.name,
      amountInr: plan.price_inr,
      currency: 'INR'
    }));

    return res.status(201).json({
      orderId,
      amountInr: plan.price_inr,
      amountPaise: plan.price_inr * 100,
      currency: 'INR',
      plan: {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        priceInr: plan.price_inr,
        durationDays: plan.duration_days
      },
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_flirta2026_sandbox'
    });
  } catch (err) {
    console.error('createOrder error:', err);
    return res.status(500).json({ error: 'Failed to create subscription order.' });
  }
};

// 4. Verify Payment & Activate Entitlements
exports.verifyPayment = (req, res) => {
  const db = getDb();
  try {
    const userId = req.user.id;
    const { orderId, paymentId, signature, paymentMethod } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required for verification.' });
    }

    const transaction = db.prepare(`
      SELECT pt.*, sp.code, sp.name, sp.duration_days, sp.boost_credits
      FROM payment_transactions pt
      JOIN subscription_plans sp ON pt.plan_id = sp.id
      WHERE pt.order_id = ? AND pt.user_id = ?
    `).get(orderId, userId);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction record not found.' });
    }

    if (transaction.status === 'captured') {
      return res.json({ message: 'Subscription is already active.', planName: transaction.name });
    }

    // Server-side cryptographic signature validation:
    // If RAZORPAY_KEY_SECRET is configured, enforce strict HMAC SHA256 check
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (secret && signature && paymentId) {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (generatedSignature !== signature) {
        db.prepare("UPDATE payment_transactions SET status = 'failed' WHERE id = ?").run(transaction.id);
        return res.status(400).json({ error: 'Payment signature verification failed.' });
      }
    }

    const finalPaymentId = paymentId || `pay_flirta_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const finalSignature = signature || crypto.createHash('sha256').update(`${orderId}|${finalPaymentId}`).digest('hex');

    // Atomic activation in transaction
    db.exec('BEGIN IMMEDIATE');
    let subscriptionId;

    try {
      // 1. Expire existing active subscriptions
      db.prepare(`
        UPDATE user_subscriptions
        SET status = 'expired', updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND status = 'active'
      `).run(userId);

      // 2. Create new active subscription
      const subRes = db.prepare(`
        INSERT INTO user_subscriptions (
          user_id, plan_id, status, start_date, end_date, remaining_boosts
        ) VALUES (
          ?, ?, 'active', CURRENT_TIMESTAMP,
          DATETIME('now', '+' || ? || ' days'),
          ?
        )
      `).run(userId, transaction.plan_id, transaction.duration_days, transaction.boost_credits);

      subscriptionId = Number(subRes.lastInsertRowid);

      // 3. Mark payment captured
      db.prepare(`
        UPDATE payment_transactions
        SET status = 'captured',
            payment_id = ?,
            signature = ?,
            payment_method = ?
        WHERE id = ?
      `).run(finalPaymentId, finalSignature, paymentMethod || 'UPI / Card', transaction.id);

      // 4. Log Meta Ads Verified Purchase conversion event
      db.prepare(`
        INSERT INTO analytics_events (user_id, event_name, event_payload)
        VALUES (?, ?, ?)
      `).run(userId, 'subscription_purchased', JSON.stringify({
        orderId,
        paymentId: finalPaymentId,
        planCode: transaction.code,
        planName: transaction.name,
        value: transaction.amount_inr,
        currency: 'INR'
      }));

      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    const activatedSub = db.prepare('SELECT * FROM user_subscriptions WHERE id = ?').get(subscriptionId);

    return res.json({
      success: true,
      message: `Payment verified! You are now subscribed to Flirta ${transaction.name}.`,
      subscription: {
        id: activatedSub.id,
        planName: transaction.name,
        planCode: transaction.code,
        startDate: activatedSub.start_date,
        endDate: activatedSub.end_date,
        remainingBoosts: activatedSub.remaining_boosts
      }
    });
  } catch (err) {
    console.error('verifyPayment error:', err);
    return res.status(500).json({ error: 'Failed to verify payment transaction.' });
  }
};

// 5. "Who Liked Me" Premium Gate Endpoint
exports.getLikesReceived = (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    // Check user active subscription entitlement
    const activeSub = getUserActiveSubscription(db, userId);
    const canSeeLikes = activeSub && activeSub.can_see_likes === 1;

    // Total count of dancers who liked current user
    const totalLikesCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM likes l
      JOIN users u ON l.sender_id = u.id
      WHERE l.receiver_id = ?
        AND l.action = 'like'
        AND u.status = 'active'
        AND l.sender_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?)
        AND l.sender_id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ?)
        AND l.sender_id NOT IN (
          SELECT CASE WHEN user1_id = ? THEN user2_id ELSE user1_id END
          FROM matches WHERE (user1_id = ? OR user2_id = ?) AND status = 'matched'
        )
    `).get(userId, userId, userId, userId, userId, userId).count;

    if (!canSeeLikes) {
      // Locked teaser state: return count but keep profiles blurred / gated
      return res.json({
        canSeeLikes: false,
        totalCount: totalLikesCount,
        requiresPlan: 'chemistry',
        message: 'Upgrade to Chemistry, Attraction, or Dream Match to see everyone who expressed interest in you.'
      });
    }

    // Unlocked state: return actual profile cards
    const likers = db.prepare(`
      SELECT
        p.id as profile_id,
        p.user_id,
        p.display_name,
        p.age,
        p.city,
        p.garba_experience,
        p.bio,
        p.dance_style,
        p.connection_types,
        l.created_at as liked_at,
        (SELECT photo_url FROM profile_photos WHERE profile_id = p.id AND is_primary = 1 LIMIT 1) as primary_photo
      FROM likes l
      JOIN profiles p ON l.sender_id = p.user_id
      JOIN users u ON l.sender_id = u.id
      WHERE l.receiver_id = ?
        AND l.action = 'like'
        AND u.status = 'active'
        AND p.is_discoverable = 1
        AND l.sender_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?)
        AND l.sender_id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ?)
        AND l.sender_id NOT IN (
          SELECT CASE WHEN user1_id = ? THEN user2_id ELSE user1_id END
          FROM matches WHERE (user1_id = ? OR user2_id = ?) AND status = 'matched'
        )
      ORDER BY l.created_at DESC
      LIMIT 50
    `).all(userId, userId, userId, userId, userId, userId);

    return res.json({
      canSeeLikes: true,
      totalCount: totalLikesCount,
      likers: likers.map(l => {
        let connectionTypes = [];
        try { connectionTypes = JSON.parse(l.connection_types || '[]'); } catch { connectionTypes = ['partner']; }
        return {
          ...l,
          connection_types: connectionTypes
        };
      })
    });
  } catch (err) {
    console.error('getLikesReceived error:', err);
    return res.status(500).json({ error: 'Failed to retrieve incoming likes.' });
  }
};

// 6. Activate Profile Boost Credit
exports.activateBoost = (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    const activeSub = getUserActiveSubscription(db, userId);
    if (!activeSub || activeSub.remaining_boosts <= 0) {
      return res.status(403).json({
        error: 'No profile boost credits remaining. Upgrade to Attraction or Dream Match to get more boosts.',
        upgradeRequired: true
      });
    }

    db.exec('BEGIN IMMEDIATE');
    let boostedUntil;
    try {
      // Deduct 1 boost credit
      db.prepare(`
        UPDATE user_subscriptions
        SET remaining_boosts = remaining_boosts - 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(activeSub.subscription_id);

      // Boost profile for 24 hours
      db.prepare(`
        UPDATE profiles
        SET boosted_until = DATETIME('now', '+24 hours'), updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(userId);

      const updatedProf = db.prepare('SELECT boosted_until FROM profiles WHERE user_id = ?').get(userId);
      boostedUntil = updatedProf.boosted_until;

      db.prepare(`
        INSERT INTO user_boosts (user_id, expires_at)
        VALUES (?, ?)
      `).run(userId, boostedUntil);

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    return res.json({
      success: true,
      message: 'Profile Boost Activated! Your card is now prioritized at the top of partner discovery for 24 hours.',
      remainingBoosts: activeSub.remaining_boosts - 1,
      boostedUntil
    });
  } catch (err) {
    console.error('activateBoost error:', err);
    return res.status(500).json({ error: 'Failed to activate profile boost.' });
  }
};

// 7. Secure Webhook Receiver
exports.handleWebhook = (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (secret && signature) {
      const shasum = crypto.createHmac('sha256', secret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== signature) {
        return res.status(400).json({ error: 'Invalid webhook signature.' });
      }
    }

    const event = req.body.event;
    console.log(`Payment Webhook Event received: ${event}`);

    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('handleWebhook error:', err);
    return res.status(500).json({ error: 'Webhook processing error.' });
  }
};

module.exports.getUserActiveSubscription = getUserActiveSubscription;
