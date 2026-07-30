const { model } = require('../utils/jsondb');

module.exports = model('Ticket', {
  guildId: null,
  channelId: null,
  ticketNumber: null,
  categoryId: null,
  openerId: null,
  claimedBy: null,
  addedUsers: [],
  status: 'open',
  transcriptUrl: null,
  closedBy: null,
  closeReason: null,
  closedAt: null
});
