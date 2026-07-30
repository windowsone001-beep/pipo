const { model } = require('../utils/jsondb');

module.exports = model('ModLog', {
  guildId: null,
  userId: null,
  moderatorId: null,
  action: null,
  reason: 'No reason provided',
  duration: null
});
