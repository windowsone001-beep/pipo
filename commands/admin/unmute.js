const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { logModAction } = require('../../utils/modLogger');
const { getOrCreateMutedRole } = require('../../utils/mutedRole');

module.exports = {
  category: 'Administration',
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a member.')
    .addUserOption(o => o.setName('user').setDescription('User to unmute').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return interaction.reply({ embeds: [embeds.error('That user is not in this server.')], ephemeral: true });

    const mutedRole = await getOrCreateMutedRole(interaction.guild);
    await member.roles.remove(mutedRole, `Unmuted by ${interaction.user.tag}`);
    await logModAction(interaction.guild, { userId: user.id, moderatorId: interaction.user.id, action: 'unmute' });

    await interaction.reply({ embeds: [embeds.success(`**${user.tag}** has been unmuted.`)] });
  }
};
