const embeds = require('../../../utils/embeds');

module.exports = {
  id: 'ticket_cancelclose_',
  async execute(interaction) {
    await interaction.update({ embeds: [embeds.info('Ticket close cancelled.')], components: [] });
  }
};
