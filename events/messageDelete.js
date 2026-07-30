const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/getGuildConfig');
const config = require('../config/config');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    if (!message.guild || message.author?.bot) return;
    const cfg = await getGuildConfig(message.guild.id);
    if (!cfg.messageLogChannel) return;
    const log = message.guild.channels.cache.get(cfg.messageLogChannel);
    if (!log) return;

    log.send({
      embeds: [new EmbedBuilder()
        .setColor(config.colors.danger)
        .setAuthor({ name: message.author?.tag || 'Unknown user', iconURL: message.author?.displayAvatarURL?.() })
        .setTitle('🗑️ Message Deleted')
        .setDescription(message.content ? message.content.slice(0, 1000) : '*No text content (embed/attachment only)*')
        .addFields({ name: 'Channel', value: `${message.channel}`, inline: true })
        .setTimestamp()]
    }).catch(() => {});
  }
};
