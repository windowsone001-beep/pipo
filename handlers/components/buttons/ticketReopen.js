const embeds = require('../../../utils/embeds');
const Ticket = require('../../../models/Ticket');

module.exports = {
  id: 'ticket_reopen_',
  async execute(interaction) {
    const channelId = interaction.customId.replace('ticket_reopen_', '');
    const ticket = await Ticket.findOne({ channelId });
    if (!ticket) return interaction.reply({ embeds: [embeds.error('Ticket not found.')], ephemeral: true });

    ticket.status = 'open';
    ticket.closedBy = null;
    ticket.closedAt = null;
    await ticket.save();

    await interaction.channel.permissionOverwrites.edit(ticket.openerId, { SendMessages: true }).catch(() => {});
    for (const uid of ticket.addedUsers) {
      await interaction.channel.permissionOverwrites.edit(uid, { SendMessages: true }).catch(() => {});
    }

    await interaction.update({ components: [] });
    await interaction.channel.send({ embeds: [embeds.success(`🔓 Ticket reopened by ${interaction.user}.`)] });
  }
};
