const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embeds = require('../../../utils/embeds');
const Ticket = require('../../../models/Ticket');

module.exports = {
  id: 'ticket_close_',
  async execute(interaction) {
    const channelId = interaction.customId.replace('ticket_close_', '');
    const ticket = await Ticket.findOne({ channelId });
    if (!ticket) return interaction.reply({ embeds: [embeds.error('This ticket could not be found in the database.')], ephemeral: true });
    if (ticket.status === 'closed') return interaction.reply({ embeds: [embeds.warn('This ticket is already closed.')], ephemeral: true });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ticket_confirmclose_${channelId}`).setLabel('Confirm Close').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
      new ButtonBuilder().setCustomId(`ticket_cancelclose_${channelId}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embeds.warn('Are you sure you want to close this ticket? A transcript will be saved.')], components: [row] });
  }
};
