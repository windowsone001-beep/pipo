const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/getGuildConfig');
const config = require('../config/config');

module.exports = {
  name: 'webhooksUpdate',
  async execute(channel) {
    const cfg = await getGuildConfig(channel.guild.id);
    if (!cfg.security.antiWebhook?.enabled || !cfg.securityLogChannel) return;
    const log = channel.guild.channels.cache.get(cfg.securityLogChannel);
    if (log) {
      log.send({
        embeds: [new EmbedBuilder()
          .setColor(config.colors.warning)
          .setTitle('🪝 Webhook Update Detected')
          .setDescription(`A webhook was created/updated/deleted in ${channel}. Check audit log for details.`)
          .setTimestamp()]
      }).catch(() => {});
    }
  }
};
