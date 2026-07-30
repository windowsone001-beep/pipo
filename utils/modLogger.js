const { EmbedBuilder } = require('discord.js');
const ModLog = require('../models/ModLog');
const config = require('../config/config');
const { getGuildConfig } = require('./getGuildConfig');

async function logModAction(guild, { userId, moderatorId, action, reason = 'No reason provided', duration = null }) {
  await ModLog.create({ guildId: guild.id, userId, moderatorId, action, reason, duration });

  const cfg = await getGuildConfig(guild.id);
  if (!cfg.modLogChannel) return;
  const channel = guild.channels.cache.get(cfg.modLogChannel);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(config.colors.warning)
    .setTitle(`📋 ${action.toUpperCase()}`)
    .addFields(
      { name: 'User', value: `<@${userId}>`, inline: true },
      { name: 'Moderator', value: `<@${moderatorId}>`, inline: true },
      { name: 'Reason', value: reason }
    )
    .setTimestamp();

  if (duration) embed.addFields({ name: 'Duration', value: duration, inline: true });

  channel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = { logModAction };
