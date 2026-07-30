const { model } = require('../utils/jsondb');

module.exports = model('Warning', {
  guildId: null,
  userId: null,
  moderatorId: null,
  reason: 'No reason provided',
  active: true
});
