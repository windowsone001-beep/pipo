/**
 * config/config.js
 * Central static configuration. Per-guild overrides live in MongoDB (models/GuildConfig.js).
 */
require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  guildId: process.env.GUILD_ID,
  ownerIds: (process.env.OWNER_IDS || '').split(',').map(id => id.trim()).filter(Boolean),

  colors: {
    primary: 0x5865f2,
    success: 0x57f287,
    danger: 0xed4245,
    warning: 0xfee75c,
    info: 0x5865f2
  },

  emojis: {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    loading: '⏳',
    ticket: '🎫',
    lock: '🔒',
    unlock: '🔓'
  },

  bot: {
    name: 'Vaylex Manager',
    activity: 'Vaylex World',
    activityType: 'Watching' // Playing | Watching | Listening | Competing
  },

  security: {
    // default thresholds, overridable per-guild in DB
    antiSpam: { messages: 5, interval: 5000, punishment: 'timeout', duration: '10m' },
    antiRaid: { joins: 10, interval: 10000, action: 'lockdown' },
    antiLink: { whitelist: ['discord.gg/minecore'] }
  },

  dashboard: {
    port: process.env.PORT || process.env.DASHBOARD_PORT || 3000, // most hosts (Railway, Render, Heroku-style) inject PORT
    url: process.env.DASHBOARD_URL || 'http://localhost:3000',
    sessionSecret: process.env.SESSION_SECRET || 'dev-insecure-secret-change-me'
  },

  oauth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackUrl: process.env.DISCORD_CALLBACK_URL || `${process.env.DASHBOARD_URL || 'http://localhost:3000'}/auth/callback`,
    scope: 'identify guilds'
  }
};
