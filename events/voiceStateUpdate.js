const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/getGuildConfig');
const config = require('../config/config');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const guild = newState.guild;
    const cfg = await getGuildConfig(guild.id);
    if (!cfg.voiceLogChannel) return;
    const log = guild.channels.cache.get(cfg.voiceLogChannel);
    if (!log) return;

    const member = newState.member;
    let description = null;
    if (!oldState.channel && newState.channel) description = `🔊 ${member} joined **${newState.channel.name}**`;
    else if (oldState.channel && !newState.channel) description = `🔇 ${member} left **${oldState.channel.name}**`;
    else if (oldState.channel?.id !== newState.channel?.id) description = `🔀 ${member} moved from **${oldState.channel?.name}** to **${newState.channel?.name}**`;
    else return;

    log.send({ embeds: [new EmbedBuilder().setColor(config.colors.info).setDescription(description).setTimestamp()] }).catch(() => {});
  }
};
