const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/getGuildConfig');
const { applyVariables } = require('../utils/embeds');
const config = require('../config/config');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    const cfg = await getGuildConfig(member.guild.id);

    if (cfg.goodbye?.enabled && cfg.goodbye.channel) {
      const channel = member.guild.channels.cache.get(cfg.goodbye.channel);
      if (channel) {
        channel.send({
          embeds: [new EmbedBuilder()
            .setColor(config.colors.danger)
            .setDescription(applyVariables(cfg.goodbye.message, { member, guild: member.guild }))
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .setTimestamp()]
        }).catch(() => {});
      }
    }

    if (cfg.joinLeaveLogChannel) {
      const log = member.guild.channels.cache.get(cfg.joinLeaveLogChannel);
      if (log) {
        log.send({
          embeds: [new EmbedBuilder()
            .setColor(config.colors.danger)
            .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
            .setDescription(`📤 ${member.user.tag} left the server.`)
            .setFooter({ text: `Member count: ${member.guild.memberCount}` })
            .setTimestamp()]
        }).catch(() => {});
      }
    }
  }
};
