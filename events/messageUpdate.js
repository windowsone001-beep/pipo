const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/getGuildConfig');
const config = require('../config/config');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    const cfg = await getGuildConfig(newMessage.guild.id);
    if (!cfg.messageLogChannel) return;
    const log = newMessage.guild.channels.cache.get(cfg.messageLogChannel);
    if (!log) return;

    log.send({
      embeds: [new EmbedBuilder()
        .setColor(config.colors.warning)
        .setAuthor({ name: newMessage.author.tag, iconURL: newMessage.author.displayAvatarURL() })
        .setTitle('✏️ Message Edited')
        .addFields(
          { name: 'Before', value: (oldMessage.content || '*empty*').slice(0, 1000) },
          { name: 'After', value: (newMessage.content || '*empty*').slice(0, 1000) },
          { name: 'Channel', value: `${newMessage.channel}`, inline: true }
        )
        .setTimestamp()]
    }).catch(() => {});
  }
};
