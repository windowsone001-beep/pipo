const { model } = require('../utils/jsondb');

module.exports = model('Giveaway', {
  guildId: null,
  channelId: null,
  messageId: null,
  hostId: null,
  prize: null,
  winnerCount: 1,
  entries: [],
  requirements: { roles: [], minLevel: 0 },
  endsAt: null,
  ended: false,
  paused: false,
  winners: []
});
