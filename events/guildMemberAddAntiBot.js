// Kicks unauthorized bots on join if Anti-Bot is enabled (bots added without an approved OAuth flow).
const { getGuildConfig } = require('../utils/getGuildConfig');
const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    if (!member.user.bot) return;
    const cfg = await getGuildConfig(member.guild.id);
    if (!cfg.security.antiBot?.enabled) return;
    // Whitelisted staff bypass via whitelistedUsers (store bot IDs there too if trusted)
    if (cfg.security.whitelistedUsers.includes(member.id)) return;

    await member.kick('Anti-Bot: unauthorized bot addition').catch(() => {});
    if (cfg.securityLogChannel) {
      const log = member.guild.channels.cache.get(cfg.securityLogChannel);
      if (log) {
        log.send({
          embeds: [new EmbedBuilder()
            .setColor(config.colors.danger)
            .setTitle('🤖 Anti-Bot Triggered')
            .setDescription(`Kicked unauthorized bot **${member.user.tag}**. Add it to the whitelist if this was intentional.`)
            .setTimestamp()]
        }).catch(() => {});
      }
    }
  }
};
