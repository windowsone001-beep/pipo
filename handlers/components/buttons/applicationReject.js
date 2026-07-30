const embeds = require('../../../utils/embeds');
const GuildConfig = require('../../../models/GuildConfig');
const Application = require('../../../models/Application');
const { isStaff } = require('../../../utils/permissions');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  id: 'app_reject_',
  async execute(interaction) {
    const cfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
    const application = await Application.findById(interaction.customId.replace('app_reject_', '')).catch(() => null);
    if (!application) return interaction.reply({ embeds: [embeds.error('Application not found.')], ephemeral: true });

    const panel = cfg?.applications.find(p => p.panelId === application.panelId);
    if (panel && !isStaff(interaction.member, panel.reviewerRoles) && !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ embeds: [embeds.error('You are not authorized to review this application.')], ephemeral: true });
    }
    if (application.status !== 'pending') return interaction.reply({ embeds: [embeds.warn('This application was already reviewed.')], ephemeral: true });

    application.status = 'rejected';
    application.reviewedBy = interaction.user.id;
    await application.save();

    const user = await interaction.client.users.fetch(application.userId).catch(() => null);
    if (user) {
      await user.send(`Your **${panel?.name || 'staff'}** application in **${interaction.guild.name}** was **not accepted** this time. Thank you for applying.`).catch(() => {});
    }

    await interaction.update({ components: [] });
    await interaction.followUp({ embeds: [embeds.error(`Application rejected by ${interaction.user}.`, '❌ Application Rejected')] });
  }
};
