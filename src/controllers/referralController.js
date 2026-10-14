const { getDb } = require('../db/database');
const { RULES } = require('../constants/copy');
const { ensureReferralCode, ensureCredits } = require('../services/accounts');

exports.getMine = (req, res) => {
  try {
    const db = getDb();
    const code = ensureReferralCode(db, req.user.id);
    const credits = ensureCredits(db, req.user.id);
    const rewards = db.prepare(`
      SELECT rr.*, p.display_name AS referred_name
      FROM referral_rewards rr
      LEFT JOIN profiles p ON p.user_id = rr.referred_user_id
      WHERE rr.referrer_id = ?
      ORDER BY rr.id DESC
    `).all(req.user.id);

    const totals = db.prepare(`
      SELECT
        COUNT(*) AS rewards,
        COALESCE(SUM(premium_days), 0) AS premium_days,
        COALESCE(SUM(wallet_inr), 0) AS wallet_inr
      FROM referral_rewards
      WHERE referrer_id = ?
    `).get(req.user.id);

    return res.json({
      code,
      rules: RULES.referral,
      rewards,
      totals,
      walletInr: credits.wallet_inr
    });
  } catch (err) {
    console.error('get referrals error:', err);
    return res.status(500).json({ error: 'Could not load referral records.' });
  }
};
