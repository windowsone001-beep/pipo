const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const Warning = require('../../models/Warning');
const { canModerate } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLogger');

module.exports = {
  category: 'Administration',
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member.')
    .addUserOption(o => o.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for the warning').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const member = interaction.guild.members.cache.get(user.id);
    if (member) {
      const check = canModerate(interaction.guild, interaction.member, member);
      if (!check.ok) return interaction.reply({ embeds: [embeds.error(check.reason)], ephemeral: true });
    }

    const warning = await Warning.create({ guildId: interaction.guild.id, userId: user.id, moderatorId: interaction.user.id, reason });
    await logModAction(interaction.guild, { userId: user.id, moderatorId: interaction.user.id, action: 'warn', reason });
    await user.send(`You were warned in **${interaction.guild.name}**.\nReason: ${reason}`).catch(() => {});

    const count = await Warning.countDocuments({ guildId: interaction.guild.id, userId: user.id, active: true });
    await interaction.reply({ embeds: [embeds.success(`**${user.tag}** has been warned.\n**Reason:** ${reason}\n**Total active warnings:** ${count}\n**Warning ID:** \`${warning._id}\``, '⚠️ Member Warned')] });
  }
};
