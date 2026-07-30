const embeds = require('../../../utils/embeds');
const Ticket = require('../../../models/Ticket');

function extractId(input) {
  const match = input.match(/\d{17,20}/);
  return match ? match[0] : null;
}

module.exports = {
  id: 'ticket_removeuser_modal_',
  async execute(interaction) {
    const channelId = interaction.customId.replace('ticket_removeuser_modal_', '');
    const raw = interaction.fields.getTextInputValue('user_id');
    const userId = extractId(raw);
    if (!userId) return interaction.reply({ embeds: [embeds.error('Could not parse a valid user ID.')], ephemeral: true });

    await interaction.channel.permissionOverwrites.delete(userId).catch(() => {});
    await Ticket.updateOne({ channelId }, { $pull: { addedUsers: userId } });
    await interaction.reply({ embeds: [embeds.success(`<@${userId}> has been removed from this ticket.`)] });
  }
};
