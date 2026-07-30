const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  id: 'ticket_removeuser_',
  async execute(interaction) {
    const channelId = interaction.customId.replace('ticket_removeuser_', '');
    const modal = new ModalBuilder()
      .setCustomId(`ticket_removeuser_modal_${channelId}`)
      .setTitle('Remove User from Ticket')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('user_id')
            .setLabel('User ID or @mention')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
    await interaction.showModal(modal);
  }
};
