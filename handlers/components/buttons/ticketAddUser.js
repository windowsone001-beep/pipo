const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  id: 'ticket_adduser_',
  async execute(interaction) {
    const channelId = interaction.customId.replace('ticket_adduser_', '');
    const modal = new ModalBuilder()
      .setCustomId(`ticket_adduser_modal_${channelId}`)
      .setTitle('Add User to Ticket')
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
