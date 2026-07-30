const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const Warning = require('../../models/Warning');

module.exports = {
  category: 'Administration',
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription("View a member's warnings.")
    .addUserOption(o => o.setName('user').setDescription('The user').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const warnings = await Warning.find({ guildId: interaction.guild.id, userId: user.id, active: true }).sort({ createdAt: -1 }).limit(15);

    if (!warnings.length) return interaction.reply({ embeds: [embeds.info(`${user.tag} has no active warnings.`)] });

    const embed = embeds.baseEmbed().setTitle(`Warnings for ${user.tag}`).setDescription(
      warnings.map(w => `**ID:** \`${w._id}\`\n**Reason:** ${w.reason}\n**Moderator:** <@${w.moderatorId}>\n**Date:** <t:${Math.floor(w.createdAt.getTime() / 1000)}:R>`).join('\n\n')
    );
    await interaction.reply({ embeds: [embed] });
  }
};
