const crypto = require('node:crypto');
const { RULES } = require('../constants/copy');

function ensureCredits(db, userId) {
  db.prepare(`
    INSERT INTO user_credits (user_id, super_likes, boost_credits, wallet_inr)
    VALUES (?, 0, 0, 0)
    ON CONFLICT(user_id) DO NOTHING
  `).run(userId);
  return db.prepare('SELECT * FROM user_credits WHERE user_id = ?').get(userId);
}

function ensureReferralCode(db, userId) {
  const row = db.prepare('SELECT referral_code FROM users WHERE id = ?').get(userId);
  if (row && row.referral_code) return row.referral_code;
  const code = crypto.randomBytes(4).toString('hex');
  db.prepare('UPDATE users SET referral_code = ? WHERE id = ?').run(code, userId);
  return code;
}

function applyReferralCode(db, userId, rawCode) {
  if (!rawCode || !String(rawCode).trim()) return;
  const code = String(rawCode).trim().toLowerCase();
  const referrer = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(code);
  if (!referrer || referrer.id === userId) return;
  db.prepare(`
    UPDATE users
    SET referred_by_user_id = ?
    WHERE id = ? AND referred_by_user_id IS NULL
  `).run(referrer.id, userId);
}

function extendPremiumDays(db, userId, days) {
  const active = db.prepare(`
    SELECT us.id
    FROM user_subscriptions us
    WHERE us.user_id = ? AND us.status = 'active' AND us.end_date > CURRENT_TIMESTAMP
    ORDER BY us.end_date DESC
    LIMIT 1
  `).get(userId);

  if (active) {
    db.prepare(`
      UPDATE user_subscriptions
      SET end_date = datetime(end_date, '+' || ? || ' days'),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(days, active.id);
    return;
  }

  const plan = db.prepare(`
    SELECT id FROM subscription_plans
    WHERE is_active = 1 AND can_see_likes = 1
    ORDER BY price_inr ASC
    LIMIT 1
  `).get();
  if (!plan) return;

  db.prepare(`
    INSERT INTO user_subscriptions (user_id, plan_id, status, start_date, end_date, remaining_boosts)
    VALUES (?, ?, 'active', CURRENT_TIMESTAMP, datetime('now', '+' || ? || ' days'), 0)
  `).run(userId, plan.id, days);
}

function grantReferralReward(db, referredUserId) {
  const referred = db.prepare('SELECT referred_by_user_id FROM users WHERE id = ?').get(referredUserId);
  if (!referred || !referred.referred_by_user_id) return null;

  const referrerId = referred.referred_by_user_id;
  const already = db.prepare('SELECT id FROM referral_rewards WHERE referred_user_id = ?').get(referredUserId);
  if (already) return null;

  const count = db.prepare('SELECT COUNT(*) AS c FROM referral_rewards WHERE referrer_id = ?').get(referrerId).c;
  if (count >= RULES.referral.maxRewards) return null;

  const daysGranted = db.prepare(`
    SELECT COALESCE(SUM(premium_days), 0) AS d FROM referral_rewards WHERE referrer_id = ?
  `).get(referrerId).d;

  let rewardType = 'wallet_credit';
  let premiumDays = 0;
  let walletInr = 0;

  if (daysGranted + RULES.referral.premiumDays <= RULES.referral.maxPremiumDays) {
    rewardType = 'premium_days';
    premiumDays = RULES.referral.premiumDays;
    extendPremiumDays(db, referrerId, premiumDays);
  } else {
    walletInr = RULES.referral.walletCreditInr;
    ensureCredits(db, referrerId);
    db.prepare('UPDATE user_credits SET wallet_inr = wallet_inr + ? WHERE user_id = ?').run(walletInr, referrerId);
  }

  const result = db.prepare(`
    INSERT INTO referral_rewards (referrer_id, referred_user_id, reward_type, premium_days, wallet_inr)
    VALUES (?, ?, ?, ?, ?)
  `).run(referrerId, referredUserId, rewardType, premiumDays, walletInr);

  return {
    id: Number(result.lastInsertRowid),
    referrerId,
    rewardType,
    premiumDays,
    walletInr
  };
}

module.exports = {
  ensureCredits,
  ensureReferralCode,
  applyReferralCode,
  extendPremiumDays,
  grantReferralReward
};
