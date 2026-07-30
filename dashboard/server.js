require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const config = require('../config/config');
const logger = require('../utils/logger');
const { connect } = require('../utils/jsondb');
const { requireAuth, requireOwner, requireGuildAccess } = require('./middleware/auth');

// ---- Global safety nets so nothing can crash the whole dashboard process ----
process.on('unhandledRejection', (err) => logger.error('[dashboard] Unhandled promise rejection', err));
process.on('uncaughtException', (err) => logger.error('[dashboard] Uncaught exception', err));

const app = express();

// Almost every real host (a VPS behind nginx/Caddy, Railway, Render, etc.) terminates
// HTTPS at a reverse proxy — trust it so req.protocol etc. reflect the real client connection.
app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (config.dashboard.sessionSecret === 'dev-insecure-secret-change-me') {
  logger.warn('[dashboard] SESSION_SECRET is not set — using an insecure default. Set SESSION_SECRET in your environment before going live.');
}
if (!config.oauth.clientSecret) {
  logger.warn('[dashboard] CLIENT_SECRET is not set — Discord login will not work until it is.');
}

app.use(session({
  secret: config.dashboard.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
}));

app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('index', { error: req.query.error || null });
});

app.use('/auth', require('./routes/auth'));
app.use('/', requireAuth, require('./routes/dashboard'));
app.use('/api', requireAuth, require('./routes/api'));
app.use('/admin', requireOwner, require('./routes/admin'));

app.use((req, res) => res.status(404).render('404'));

connect()
  .then(() => {
    logger.success('[dashboard] Connected to MongoDB.');
    app.listen(config.dashboard.port, () => {
      logger.success(`Dashboard running at ${config.dashboard.url} (MongoDB storage, Discord OAuth2 login).`);
    });
  })
  .catch((err) => {
    logger.error('[dashboard] Failed to connect to MongoDB. Check MONGODB_URI in .env', err);
    process.exit(1);
  });

module.exports = app;
