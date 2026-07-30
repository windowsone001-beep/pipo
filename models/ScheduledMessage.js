const { model } = require('../utils/jsondb');

module.exports = model('ScheduledMessage', {
  guildId: null,
  channelId: null,
  authorId: null,
  content: null,
  embedJson: null,
  sendAt: null,
  sent: false
});
