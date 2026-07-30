const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { logModAction } = require('../../utils/modLogger');

module.exports = {
  category: 'Administration',
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock the current or a specified channel.')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to lock'))
    .addStringOption(o => o.setName('reason').setDescription('Reason for locking'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const reason = interaction.options.getString('reason') || 'No reason provided';

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }, { reason });
    await logModAction(interaction.guild, { userId: interaction.user.id, moderatorId: interaction.user.id, action: 'lock', reason });

    await interaction.reply({ embeds: [embeds.success(`🔒 ${channel} has been locked.\n**Reason:** ${reason}`)] });
  }
};
