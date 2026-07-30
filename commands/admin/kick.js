const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { canModerate } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLogger');

module.exports = {
  category: 'Administration',
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server.')
    .addUserOption(o => o.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for the kick'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return interaction.reply({ embeds: [embeds.error('That user is not in this server.')], ephemeral: true });

    const check = canModerate(interaction.guild, interaction.member, member);
    if (!check.ok) return interaction.reply({ embeds: [embeds.error(check.reason)], ephemeral: true });

    await user.send(`You have been kicked from **${interaction.guild.name}**.\nReason: ${reason}`).catch(() => {});
    await member.kick(reason);
    await logModAction(interaction.guild, { userId: user.id, moderatorId: interaction.user.id, action: 'kick', reason });

    await interaction.reply({ embeds: [embeds.success(`**${user.tag}** has been kicked.\n**Reason:** ${reason}`, '👢 Member Kicked')] });
  }
};
