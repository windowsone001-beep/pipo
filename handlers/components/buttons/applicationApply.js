const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const embeds = require('../../../utils/embeds');
const GuildConfig = require('../../../models/GuildConfig');
const Application = require('../../../models/Application');

module.exports = {
  id: 'app_apply_',
  async execute(interaction) {
    const panelId = interaction.customId.replace('app_apply_', '');
    const cfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
    const panel = cfg?.applications.find(p => p.panelId === panelId);
    if (!panel) return interaction.reply({ embeds: [embeds.error('This application panel no longer exists.')], ephemeral: true });
    if (!panel.open) return interaction.reply({ embeds: [embeds.warn('This application is currently closed.')], ephemeral: true });

    const existing = await Application.findOne({ guildId: interaction.guild.id, panelId, userId: interaction.user.id, status: 'pending' });
    if (existing) return interaction.reply({ embeds: [embeds.warn('You already have a pending application for this panel.')], ephemeral: true });

    const modal = new ModalBuilder().setCustomId(`app_submit_${panelId}`).setTitle(panel.name.slice(0, 45));
    panel.questions.forEach((q, i) => {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(`q${i}`)
            .setLabel(q.slice(0, 45))
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000)
        )
      );
    });

    await interaction.showModal(modal);
  }
};
