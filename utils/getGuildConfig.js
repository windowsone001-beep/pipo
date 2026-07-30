const GuildConfig = require('../models/GuildConfig');

// Simple in-memory cache (60s TTL) so hot paths like messageCreate anti-spam
// don't hit MongoDB on every single message.
const cache = new Map();
const TTL = 60_000;

async function getGuildConfig(guildId) {
  const cached = cache.get(guildId);
  if (cached && Date.now() - cached.time < TTL) return cached.data;

  let doc = await GuildConfig.findOne({ guildId });
  if (!doc) doc = await GuildConfig.create({ guildId });

  cache.set(guildId, { data: doc, time: Date.now() });
  return doc;
}

function invalidate(guildId) {
  cache.delete(guildId);
}

module.exports = { getGuildConfig, invalidate };
