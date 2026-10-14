const path = require('node:path');
const express = require('express');
const cookieParser = require('cookie-parser');
const config = require('./config/config');
const { generalLimiter } = require('./middleware/rateLimiter');
const { csrfProtection } = require('./middleware/csrf');

// Routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const eventRoutes = require('./routes/eventRoutes');
const discoveryRoutes = require('./routes/discoveryRoutes');
const matchRoutes = require('./routes/matchRoutes');
const messageRoutes = require('./routes/messageRoutes');
const groupRoutes = require('./routes/groupRoutes');
const safetyRoutes = require('./routes/safetyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const referralRoutes = require('./routes/referralRoutes');
const hostRoutes = require('./routes/hostRoutes');
const { COPY, RULES } = require('./constants/copy');

const app = express();
app.set('trust proxy', 1);

// Body & Cookie parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Apply global rate limiting to all API endpoints in production/testing
app.use('/api', generalLimiter);
app.use('/api', csrfProtection);

app.get('/js/copy.js', (req, res) => {
  res.type('application/javascript');
  res.set('Cache-Control', 'no-store');
  res.send(`window.COPY = ${JSON.stringify(COPY)};\nwindow.RULES = ${JSON.stringify(RULES)};\n`);
});

// Serve static assets (CSS, JS, Uploaded Photos)
app.use('/uploads', express.static(config.UPLOAD_DIR));
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/hosts', hostRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Flirta', timestamp: new Date().toISOString() });
});

// Single Page Application fallback for frontend routes
app.use((req, res, next) => {
  if ((req.method === 'GET' || req.method === 'HEAD') && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    return res.sendFile(path.join(__dirname, '../public/index.html'));
  }
  next();
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled Server Error:', err);
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  return res.status(err.status || 500).json({
    error: err.message || 'An unexpected server error occurred.'
  });
});

module.exports = app;
