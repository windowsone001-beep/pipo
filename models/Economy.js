const { model } = require('../utils/jsondb');

// One record per user per guild — tracks XP, level, and credits (the bot's currency).
module.exports = model('Economy', {
  guildId: null,
  userId: null,
  xp: 0,
  level: 0,
  credits: 0,
  lastDaily: null,    // ISO date string of the last /daily claim
  dailyStreak: 0       // consecutive days claimed without missing one
});
