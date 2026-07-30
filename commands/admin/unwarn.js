const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const Warning = require('../../models/Warning');
const { logModAction } = require('../../utils/modLogger');

module.exports = {
  category: 'Administration',
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Remove a specific warning by its ID.')
    .addStringOption(o => o.setName('warning_id').setDescription('The warning ID (from /warnings)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const warningId = interaction.options.getString('warning_id');
    const warning = await Warning.findById(warningId).catch(() => null);
    if (!warning || warning.guildId !== interaction.guild.id) {
      return interaction.reply({ embeds: [embeds.error('Warning not found.')], ephemeral: true });
    }
    warning.active = false;
    await warning.save();
    await logModAction(interaction.guild, { userId: warning.userId, moderatorId: interaction.user.id, action: 'unwarn', reason: `Removed warning ${warningId}` });
    await interaction.reply({ embeds: [embeds.success('Warning removed.')] });
  }
};
