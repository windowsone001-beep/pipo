const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { canModerate } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLogger');

module.exports = {
  category: 'Administration',
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server.')
    .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for the ban'))
    .addIntegerOption(o => o.setName('delete_days').setDescription('Days of messages to delete (0-7)').setMinValue(0).setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;
    const targetMember = interaction.guild.members.cache.get(user.id);

    if (targetMember) {
      const check = canModerate(interaction.guild, interaction.member, targetMember);
      if (!check.ok) return interaction.reply({ embeds: [embeds.error(check.reason)], ephemeral: true });
    }

    await user.send(`You have been banned from **${interaction.guild.name}**.\nReason: ${reason}`).catch(() => {});
    await interaction.guild.members.ban(user, { reason, deleteMessageSeconds: deleteDays * 86400 });
    await logModAction(interaction.guild, { userId: user.id, moderatorId: interaction.user.id, action: 'ban', reason });

    await interaction.reply({ embeds: [embeds.success(`**${user.tag}** has been banned.\n**Reason:** ${reason}`, '🔨 Member Banned')] });
  }
};
