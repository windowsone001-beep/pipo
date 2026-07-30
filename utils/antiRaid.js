const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

// guildId -> array of join timestamps
const joinBuckets = new Map();
const lockedDown = new Set();

async function trackJoin(member, cfg) {
  const { joins, interval } = cfg.security.antiRaid;
  const now = Date.now();
  const bucket = (joinBuckets.get(member.guild.id) || []).filter(t => now - t < interval);
  bucket.push(now);
  joinBuckets.set(member.guild.id, bucket);

  if (bucket.length >= joins && !lockedDown.has(member.guild.id)) {
    lockedDown.add(member.guild.id);
    setTimeout(() => lockedDown.delete(member.guild.id), 5 * 60_000);

    // Lockdown: raise verification level temporarily to slow down further raid joins.
    try {
      await member.guild.setVerificationLevel(4, 'Anti-raid: join flood detected'); // Highest (phone verification)
    } catch {}

    const logChannelId = (await require('./getGuildConfig').getGuildConfig(member.guild.id)).securityLogChannel;
    if (logChannelId) {
      const log = member.guild.channels.cache.get(logChannelId);
      if (log) {
        log.send({
          embeds: [new EmbedBuilder()
            .setColor(config.colors.danger)
            .setTitle('🚨 Anti-Raid Triggered')
            .setDescription(`Detected ${bucket.length} joins within ${interval / 1000}s. Server verification level raised temporarily.`)
            .setTimestamp()]
        }).catch(() => {});
      }
    }
  }
}

module.exports = { trackJoin };
