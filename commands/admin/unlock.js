const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { logModAction } = require('../../utils/modLogger');

module.exports = {
  category: 'Administration',
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock the current or a specified channel.')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to unlock'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
    await logModAction(interaction.guild, { userId: interaction.user.id, moderatorId: interaction.user.id, action: 'unlock' });
    await interaction.reply({ embeds: [embeds.success(`🔓 ${channel} has been unlocked.`)] });
  }
};
