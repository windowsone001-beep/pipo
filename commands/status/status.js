const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const embeds = require('../../utils/embeds');
const { getGuildConfig } = require('../../utils/getGuildConfig');

module.exports = {
  category: 'Status',
  data: new SlashCommandBuilder().setName('status').setDescription('Show Discord server stats and Minecraft server status.'),
  async execute(interaction) {
    // Fetching all members + calling an external API can easily take longer than Discord's
    // 3-second interaction window, which made this command silently "do nothing" before.
    // Deferring immediately buys up to 15 minutes to finish and reply.
    await interaction.deferReply();

    const guild = interaction.guild;
    // With the Guild Presences intent enabled, presence data for cached members updates live —
    // no need for a slow full guild.members.fetch().
    const online = guild.presences.cache.filter(p => p.status && p.status !== 'offline').size;
    const offline = Math.max(guild.memberCount - online, 0);

    const embed = embeds.baseEmbed()
      .setTitle(`📊 ${guild.name} — Server Status`)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: 'Members', value: `${guild.memberCount}`, inline: true },
        { name: 'Online', value: `${online}`, inline: true },
        { name: 'Offline', value: `${offline}`, inline: true },
        { name: 'Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
        { name: 'Bot Ping', value: `${interaction.client.ws.ping}ms`, inline: true }
      );

    const cfg = await getGuildConfig(guild.id);
    if (cfg.minecraft?.ip) {
      try {
        const res = await axios.get(`https://api.mcsrvstat.us/3/${cfg.minecraft.ip}:${cfg.minecraft.port}`, { timeout: 5000 });
        const mc = res.data;
        embed.addFields({
          name: `🎮 Minecraft — ${cfg.minecraft.ip}`,
          value: mc.online
            ? `**Status:** 🟢 Online\n**Players:** ${mc.players?.online ?? 0}/${mc.players?.max ?? '?'}\n**Version:** ${mc.version || 'Unknown'}`
            : '**Status:** 🔴 Offline'
        });
      } catch {
        embed.addFields({ name: '🎮 Minecraft Server', value: 'Could not reach status API right now.' });
      }
    } else {
      embed.addFields({ name: '🎮 Minecraft Server', value: 'Not configured. Set one with `/server set ip:<ip>`.' });
    }

    await interaction.editReply({ embeds: [embed] });
  }
};
