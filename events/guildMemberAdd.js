const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/getGuildConfig');
const { applyVariables } = require('../utils/embeds');
const config = require('../config/config');
const logger = require('../utils/logger');
const { trackJoin } = require('../utils/antiRaid');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const cfg = await getGuildConfig(member.guild.id);

    // ---- Anti-raid join-flood tracking ----
    if (cfg.security?.antiRaid?.enabled) {
      await trackJoin(member, cfg);
    }

    // ---- Auto Role ----
    if (cfg.autoRole?.enabled && cfg.autoRole.roles.length) {
      const roleList = member.user.bot ? cfg.autoRole.botRoles : cfg.autoRole.roles;
      for (const roleId of roleList) {
        const role = member.guild.roles.cache.get(roleId);
        if (role) await member.roles.add(role).catch(() => {});
      }
    }

    // ---- Welcome message ----
    if (cfg.welcome?.enabled && cfg.welcome.channel) {
      const channel = member.guild.channels.cache.get(cfg.welcome.channel);
      if (channel) {
        const embed = new EmbedBuilder()
          .setColor(cfg.welcome.embedColor || config.colors.primary)
          .setDescription(applyVariables(cfg.welcome.message, { member, guild: member.guild }))
          .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
          .setTimestamp();
        channel.send({ content: `${member}`, embeds: [embed] }).catch(() => {});
      }
    }

    // ---- DM welcome ----
    if (cfg.welcome?.dmEnabled) {
      member.send({
        embeds: [new EmbedBuilder()
          .setColor(config.colors.primary)
          .setDescription(applyVariables(cfg.welcome.dmMessage, { member, guild: member.guild }))]
      }).catch(() => { /* DMs closed, ignore */ });
    }

    // ---- Join/leave log ----
    if (cfg.joinLeaveLogChannel) {
      const log = member.guild.channels.cache.get(cfg.joinLeaveLogChannel);
      if (log) {
        log.send({
          embeds: [new EmbedBuilder()
            .setColor(config.colors.success)
            .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
            .setDescription(`📥 ${member} joined the server.\nAccount created: <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`)
            .setFooter({ text: `Member count: ${member.guild.memberCount}` })
            .setTimestamp()]
        }).catch(() => {});
      }
    }
  }
};
