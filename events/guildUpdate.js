const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/getGuildConfig');
const config = require('../config/config');

module.exports = {
  name: 'guildUpdate',
  async execute(oldGuild, newGuild) {
    const cfg = await getGuildConfig(newGuild.id);
    if (!cfg.security.antiServerUpdate?.enabled || !cfg.securityLogChannel) return;
    const log = newGuild.channels.cache.get(cfg.securityLogChannel);
    if (!log) return;

    const changes = [];
    if (oldGuild.name !== newGuild.name) changes.push(`Name: \`${oldGuild.name}\` → \`${newGuild.name}\``);
    if (oldGuild.icon !== newGuild.icon) changes.push('Icon changed');
    if (oldGuild.verificationLevel !== newGuild.verificationLevel) changes.push(`Verification level: ${oldGuild.verificationLevel} → ${newGuild.verificationLevel}`);
    if (!changes.length) return;

    log.send({
      embeds: [new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle('⚙️ Server Settings Updated')
        .setDescription(changes.join('\n'))
        .setTimestamp()]
    }).catch(() => {});
  }
};
