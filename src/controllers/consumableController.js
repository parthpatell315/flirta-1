const crypto = require('node:crypto');
const { getDb } = require('../db/database');
const { RULES } = require('../constants/copy');
const { ensureCredits } = require('../services/accounts');

exports.createOrder = (req, res) => {
  try {
    const sku = String(req.body.sku || '');
    const product = RULES.skus[sku];
    if (!product) return res.status(400).json({ error: 'Unknown product.' });

    const db = getDb();
    const orderId = `cons_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    db.prepare(`
      INSERT INTO consumable_orders (user_id, sku, order_id, amount_inr, status)
      VALUES (?, ?, ?, ?, 'created')
    `).run(req.user.id, sku, orderId, product.amountInr);

    return res.status(201).json({
      orderId,
      sku,
      amountInr: product.amountInr,
      label: product.label
    });
  } catch (err) {
    console.error('consumable order error:', err);
    return res.status(500).json({ error: 'Could not create order.' });
  }
};

exports.verifyOrder = (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Order ID is required.' });
    const db = getDb();
    const order = db.prepare(`
      SELECT * FROM consumable_orders WHERE order_id = ? AND user_id = ?
    `).get(orderId, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    const product = RULES.skus[order.sku];
    if (!product) return res.status(400).json({ error: 'Unknown product on this order.' });

    if (order.status !== 'captured') {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (secret && req.body.signature) {
        const expected = crypto.createHmac('sha256', secret)
          .update(`${orderId}|${req.body.paymentId || ''}`)
          .digest('hex');
        if (expected !== req.body.signature) {
          db.prepare(`UPDATE consumable_orders SET status = 'failed' WHERE id = ?`).run(order.id);
          return res.status(400).json({ error: 'Payment signature verification failed.' });
        }
      } else if (process.env.NODE_ENV === 'production' && secret) {
        return res.status(400).json({ error: 'Payment signature is required.' });
      }

      ensureCredits(db, req.user.id);
      db.prepare(`
        UPDATE user_credits
        SET super_likes = super_likes + ?, boost_credits = boost_credits + ?
        WHERE user_id = ?
      `).run(product.superLikes, product.boosts, req.user.id);
      db.prepare(`UPDATE consumable_orders SET status = 'captured' WHERE id = ?`).run(order.id);
    }

    const credits = db.prepare('SELECT * FROM user_credits WHERE user_id = ?').get(req.user.id);
    return res.json({ success: true, credits, sku: order.sku });
  } catch (err) {
    console.error('consumable verify error:', err);
    return res.status(500).json({ error: 'Could not verify order.' });
  }
};
