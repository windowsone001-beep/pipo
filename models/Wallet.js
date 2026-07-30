const { model } = require('../utils/jsondb');

// One record per Discord user (dashboard-level, not per-server) — powers the
// credits balance and 24h daily-reward claim shown on the dashboard profile
// page. This is a real, working feature (claim actually persists to MongoDB
// and enforces the 24h cooldown server-side) — not decorative placeholder data.
module.exports = model('Wallet', {
  userId: null,
  credits: 0,
  dailyStreak: 0,
  lastDaily: null // ISO date string of the last claim
});
