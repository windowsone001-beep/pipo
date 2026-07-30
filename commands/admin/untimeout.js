const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { logModAction } = require('../../utils/modLogger');

module.exports = {
  category: 'Administration',
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Remove a timeout from a member.')
    .addUserOption(o => o.setName('user').setDescription('User to un-timeout').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return interaction.reply({ embeds: [embeds.error('That user is not in this server.')], ephemeral: true });

    await member.timeout(null, `Timeout removed by ${interaction.user.tag}`);
    await logModAction(interaction.guild, { userId: user.id, moderatorId: interaction.user.id, action: 'untimeout' });
    await interaction.reply({ embeds: [embeds.success(`Timeout removed for **${user.tag}**.`)] });
  }
};
