const { SlashCommandBuilder, ChannelType } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  category: 'Utility',
  data: new SlashCommandBuilder().setName('serverinfo').setDescription('Show information about this server.'),
  async execute(interaction) {
    await interaction.deferReply(); // guild.members.fetch() below could exceed Discord's 3s window

    const guild = interaction.guild;
    const online = guild.presences.cache.filter(p => p.status && p.status !== 'offline').size;

    const embed = embeds.baseEmbed()
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'Members', value: `${guild.memberCount}`, inline: true },
        { name: 'Online', value: `${online}`, inline: true },
        { name: 'Text Channels', value: `${guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size}`, inline: true },
        { name: 'Voice Channels', value: `${guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size}`, inline: true },
        { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'Boost Count', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
        { name: 'Boost Tier', value: `${guild.premiumTier || 0}`, inline: true },
        { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
      );

    await interaction.editReply({ embeds: [embed] });
  }
};
