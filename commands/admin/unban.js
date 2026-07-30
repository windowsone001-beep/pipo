const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { logModAction } = require('../../utils/modLogger');

module.exports = {
  category: 'Administration',
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by ID.')
    .addStringOption(o => o.setName('user_id').setDescription('The user ID to unban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for the unban'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const userId = interaction.options.getString('user_id');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    try {
      await interaction.guild.members.unban(userId, reason);
      await logModAction(interaction.guild, { userId, moderatorId: interaction.user.id, action: 'unban', reason });
      await interaction.reply({ embeds: [embeds.success(`Unbanned <@${userId}>.`)] });
    } catch {
      await interaction.reply({ embeds: [embeds.error('That user is not banned or the ID is invalid.')], ephemeral: true });
    }
  }
};
