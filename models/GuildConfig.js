const { model } = require('../utils/jsondb');

// One JSON record per Discord server. Everything the dashboard edits lives here,
// so the bot and the website always read/write the same source of truth.
// This mirrors the exact shape the old mongoose schema had, so no other file needs to change.
const defaults = {
  guildId: null,
  prefix: '/',
  modLogChannel: null,
  ticketLogChannel: null,
  securityLogChannel: null,
  giveawayLogChannel: null,
  applicationLogChannel: null,
  messageLogChannel: null,
  voiceLogChannel: null,
  joinLeaveLogChannel: null,

  welcome: {
    enabled: false,
    channel: null,
    message: 'Welcome {user} to **{server}**! You are member #{memberCount}.',
    dmEnabled: false,
    dmMessage: 'Welcome to {server}!',
    bannerEnabled: false,
    embedColor: '#5865F2'
  },
  goodbye: {
    enabled: false,
    channel: null,
    message: '{user} has left **{server}**. We now have {memberCount} members.'
  },

  autoRole: { enabled: false, roles: [], botRoles: [] },

  verification: { enabled: false, channel: null, verifiedRole: null, type: 'button', messageId: null },

  security: {
    antiSpam: { enabled: true, messages: 5, interval: 5000, punishment: 'timeout', duration: '10m' },
    antiLink: { enabled: false, whitelist: [] },
    antiInvite: { enabled: false },
    antiEveryone: { enabled: true },
    antiBot: { enabled: false },
    antiWebhook: { enabled: true },
    antiRaid: { enabled: true, joins: 10, interval: 10000 },
    antiChannelDeleteCreate: { enabled: true, threshold: 3 },
    antiRoleDeleteCreate: { enabled: true, threshold: 3 },
    antiServerUpdate: { enabled: false },
    whitelistedUsers: []
  },

  tickets: { enabled: true, transcriptChannel: null, supportRoles: [], panels: [] },
  selfRoles: [],
  applications: [],
  voice247: { enabled: false, channelId: null },

  minecraft: { ip: null, port: 25565 }, // per-server Minecraft status, set via /server

  autoReplies: [], // { id, trigger, response, matchType: 'exact'|'contains', caseSensitive, enabled }

  updatedAt: null
};

const GuildConfig = model('GuildConfig', defaults);

// Preserve the mongoose-style `.save()` auto-touch on updatedAt for parity with old behavior.
const originalCreate = GuildConfig.create.bind(GuildConfig);
GuildConfig.create = async (data) => {
  const doc = await originalCreate(data);
  doc.updatedAt = new Date().toISOString();
  await doc.save();
  return doc;
};

module.exports = GuildConfig;
