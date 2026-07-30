const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { canModerate } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLogger');
const { getOrCreateMutedRole } = require('../../utils/mutedRole');

// Persistent text/voice mute via a "Muted" role — separate from Discord's native 28-day-max timeout.
module.exports = {
  category: 'Administration',
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a member indefinitely using the Muted role.')
    .addUserOption(o => o.setName('user').setDescription('User to mute').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for the mute'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return interaction.reply({ embeds: [embeds.error('That user is not in this server.')], ephemeral: true });

    const check = canModerate(interaction.guild, interaction.member, member);
    if (!check.ok) return interaction.reply({ embeds: [embeds.error(check.reason)], ephemeral: true });

    const mutedRole = await getOrCreateMutedRole(interaction.guild);
    await member.roles.add(mutedRole, reason);
    await logModAction(interaction.guild, { userId: user.id, moderatorId: interaction.user.id, action: 'mute', reason });

    await interaction.reply({ embeds: [embeds.success(`**${user.tag}** has been muted.\n**Reason:** ${reason}`, '🔇 Member Muted')] });
  }
};
