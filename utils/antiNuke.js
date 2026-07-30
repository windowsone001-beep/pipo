const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const config = require('../config/config');
const { getGuildConfig } = require('./getGuildConfig');

// guildId -> executorId -> { count, timer }
const actionBuckets = new Map();

/**
 * Generic threshold tracker for destructive audit-logged actions
 * (channel/role create & delete, etc). If an executor exceeds the
 * configured threshold within 10s, they are stripped of dangerous
 * permissions and logged.
 */
async function trackDestructiveAction(guild, auditLogType, settingKey, label) {
  const cfg = await getGuildConfig(guild.id);
  const setting = cfg.security[settingKey];
  if (!setting?.enabled) return;

  const logs = await guild.fetchAuditLogs({ type: auditLogType, limit: 1 }).catch(() => null);
  const entry = logs?.entries.first();
  if (!entry || Date.now() - entry.createdTimestamp > 5000) return;

  const executorId = entry.executor?.id;
  if (!executorId || cfg.security.whitelistedUsers.includes(executorId)) return;
  if (guild.ownerId === executorId) return;

  const key = `${guild.id}:${executorId}`;
  const bucket = actionBuckets.get(key) || { count: 0, timer: null };
  bucket.count += 1;
  if (bucket.timer) clearTimeout(bucket.timer);
  bucket.timer = setTimeout(() => actionBuckets.delete(key), 10_000);
  actionBuckets.set(key, bucket);

  if (bucket.count >= (setting.threshold || 3)) {
    actionBuckets.delete(key);
    const member = await guild.members.fetch(executorId).catch(() => null);
    if (member) {
      // Strip all dangerous roles (quarantine) rather than ban outright — safer default.
      await member.roles.set([], `Anti-nuke: rapid ${label}`).catch(() => {});
    }
    if (cfg.securityLogChannel) {
      const log = guild.channels.cache.get(cfg.securityLogChannel);
      if (log) {
        log.send({
          embeds: [new EmbedBuilder()
            .setColor(config.colors.danger)
            .setTitle('🚨 Anti-Nuke Triggered')
            .setDescription(`<@${executorId}> exceeded the ${label} threshold and had all roles stripped as a precaution.`)
            .setTimestamp()]
        }).catch(() => {});
      }
    }
  }
}

module.exports = { trackDestructiveAction };
