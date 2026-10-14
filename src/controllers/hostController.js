const crypto = require('node:crypto');
const { getDb } = require('../db/database');
const { RULES } = require('../constants/copy');

function splitAmount(gross) {
  const fee = Math.round(gross * RULES.host.platformFeePercent / 100);
  const host = gross - fee;
  return { fee, host };
}

function availableBalance(db, hostUserId) {
  const earned = db.prepare(`
    SELECT COALESCE(SUM(host_earning_inr), 0) AS total
    FROM host_ledger
    WHERE host_user_id = ? AND status = 'captured'
  `).get(hostUserId).total;
  const reserved = db.prepare(`
    SELECT COALESCE(SUM(amount_inr), 0) AS total
    FROM host_payouts
    WHERE host_user_id = ? AND status IN ('requested', 'paid')
  `).get(hostUserId).total;
  return earned - reserved;
}

exports.apply = (req, res) => {
  try {
    const pitch = String(req.body.pitch || '').trim();
    if (pitch.length < 10 || pitch.length > 300) {
      return res.status(400).json({ error: 'Describe the sessions you host in 10 to 300 characters.' });
    }
    const db = getDb();
    const existing = db.prepare('SELECT status FROM hosts WHERE user_id = ?').get(req.user.id);
    if (existing && existing.status === 'verified') {
      return res.status(400).json({ error: 'This account is already a verified host.' });
    }
    db.prepare(`
      INSERT INTO hosts (user_id, status, pitch)
      VALUES (?, 'pending', ?)
      ON CONFLICT(user_id) DO UPDATE SET status = 'pending', pitch = excluded.pitch, reviewed_at = NULL
    `).run(req.user.id, pitch);
    return res.status(201).json({ message: 'Host application submitted for review.', status: 'pending' });
  } catch (err) {
    console.error('host apply error:', err);
    return res.status(500).json({ error: 'Could not submit host application.' });
  }
};

exports.createOrder = (req, res) => {
  try {
    const hostUserId = parseInt(req.params.hostUserId, 10);
    const kind = req.params.kind === 'sessions' ? 'session' : 'gift';
    const amount = parseInt(req.body.amountInr, 10);
    if (!Number.isInteger(amount) || amount < RULES.host.minGiftInr || amount > RULES.host.maxGiftInr) {
      return res.status(400).json({
        error: `Amount must be a whole number of rupees between ${RULES.host.minGiftInr} and ${RULES.host.maxGiftInr}.`
      });
    }
    if (hostUserId === req.user.id) {
      return res.status(400).json({ error: 'You cannot pay yourself.' });
    }

    const db = getDb();
    const host = db.prepare('SELECT status FROM hosts WHERE user_id = ?').get(hostUserId);
    if (!host || host.status !== 'verified') {
      return res.status(404).json({ error: 'Verified host not found.' });
    }

    const orderId = `host_${kind}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const parts = splitAmount(amount);
    db.prepare(`
      INSERT INTO host_ledger (
        host_user_id, payer_user_id, kind, gross_inr, platform_fee_inr, host_earning_inr, status, order_id
      ) VALUES (?, ?, ?, ?, ?, ?, 'created', ?)
    `).run(hostUserId, req.user.id, kind, amount, parts.fee, parts.host, orderId);

    return res.status(201).json({
      orderId,
      amountInr: amount,
      platformFeeInr: parts.fee,
      hostEarningInr: parts.host,
      kind
    });
  } catch (err) {
    console.error('host order error:', err);
    return res.status(500).json({ error: 'Could not create host payment.' });
  }
};

exports.verifyOrder = (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Order ID is required.' });
    const db = getDb();
    const row = db.prepare(`
      SELECT * FROM host_ledger WHERE order_id = ? AND payer_user_id = ?
    `).get(orderId, req.user.id);
    if (!row) return res.status(404).json({ error: 'Host payment not found.' });
    if (row.status === 'captured') {
      return res.json({ success: true, ledger: row });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (secret && req.body.signature) {
      const crypto = require('node:crypto');
      const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${req.body.paymentId || ''}`).digest('hex');
      if (expected !== req.body.signature) {
        db.prepare(`UPDATE host_ledger SET status = 'failed' WHERE id = ?`).run(row.id);
        return res.status(400).json({ error: 'Payment signature verification failed.' });
      }
    } else if (process.env.NODE_ENV === 'production' && secret) {
      return res.status(400).json({ error: 'Payment signature is required.' });
    }

    db.prepare(`UPDATE host_ledger SET status = 'captured' WHERE id = ?`).run(row.id);
    const ledger = db.prepare('SELECT * FROM host_ledger WHERE id = ?').get(row.id);
    return res.json({ success: true, ledger });
  } catch (err) {
    console.error('host verify error:', err);
    return res.status(500).json({ error: 'Could not verify host payment.' });
  }
};

exports.earnings = (req, res) => {
  try {
    const db = getDb();
    const host = db.prepare('SELECT * FROM hosts WHERE user_id = ?').get(req.user.id);
    if (!host) return res.status(404).json({ error: 'No host application on this account.' });

    const transactions = db.prepare(`
      SELECT id, kind, gross_inr, platform_fee_inr, host_earning_inr, status, order_id, created_at, payer_user_id
      FROM host_ledger
      WHERE host_user_id = ?
      ORDER BY id DESC
      LIMIT 100
    `).all(req.user.id);

    const captured = db.prepare(`
      SELECT
        COALESCE(SUM(gross_inr), 0) AS gross_inr,
        COALESCE(SUM(platform_fee_inr), 0) AS fees_inr,
        COALESCE(SUM(host_earning_inr), 0) AS earned_inr
      FROM host_ledger
      WHERE host_user_id = ? AND status = 'captured'
    `).get(req.user.id);

    const payouts = db.prepare(`
      SELECT id, amount_inr, fee_inr, status, created_at
      FROM host_payouts
      WHERE host_user_id = ?
      ORDER BY id DESC
    `).all(req.user.id);

    return res.json({
      hostStatus: host.status,
      rules: RULES.host,
      captured,
      availableInr: availableBalance(db, req.user.id),
      transactions,
      payouts
    });
  } catch (err) {
    console.error('host earnings error:', err);
    return res.status(500).json({ error: 'Could not load host ledger.' });
  }
};

exports.requestPayout = (req, res) => {
  try {
    const db = getDb();
    const host = db.prepare('SELECT status FROM hosts WHERE user_id = ?').get(req.user.id);
    if (!host || host.status !== 'verified') {
      return res.status(403).json({ error: 'Only verified hosts can request a payout.' });
    }
    const available = availableBalance(db, req.user.id);
    if (available < RULES.host.payoutThresholdInr) {
      return res.status(400).json({
        error: `Captured balance is ₹${available}. Payouts start at ₹${RULES.host.payoutThresholdInr}.`,
        availableInr: available,
        thresholdInr: RULES.host.payoutThresholdInr
      });
    }
    const result = db.prepare(`
      INSERT INTO host_payouts (host_user_id, amount_inr, fee_inr, status)
      VALUES (?, ?, ?, 'requested')
    `).run(req.user.id, available, RULES.host.payoutFeeInr);
    const payout = db.prepare('SELECT * FROM host_payouts WHERE id = ?').get(Number(result.lastInsertRowid));
    return res.status(201).json({ payout, availableInr: 0 });
  } catch (err) {
    console.error('payout error:', err);
    return res.status(500).json({ error: 'Could not request payout.' });
  }
};

exports.adminList = (req, res) => {
  try {
    const db = getDb();
    const hosts = db.prepare(`
      SELECT h.*, p.display_name, p.city, u.email
      FROM hosts h
      JOIN users u ON u.id = h.user_id
      JOIN profiles p ON p.user_id = h.user_id
      ORDER BY h.created_at DESC
    `).all();
    return res.json({ hosts });
  } catch (err) {
    console.error('admin hosts error:', err);
    return res.status(500).json({ error: 'Could not list hosts.' });
  }
};

exports.adminReview = (req, res) => {
  try {
    const status = req.body.status;
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'verified' or 'rejected'." });
    }
    const db = getDb();
    const userId = parseInt(req.params.userId, 10);
    const host = db.prepare('SELECT user_id FROM hosts WHERE user_id = ?').get(userId);
    if (!host) return res.status(404).json({ error: 'Host application not found.' });
    db.prepare(`
      UPDATE hosts SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE user_id = ?
    `).run(status, userId);
    return res.json({ message: `Host marked ${status}.`, status });
  } catch (err) {
    console.error('admin host review error:', err);
    return res.status(500).json({ error: 'Could not review host.' });
  }
};
