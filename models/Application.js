const { model } = require('../utils/jsondb');

module.exports = model('Application', {
  guildId: null,
  panelId: null,
  userId: null,
  answers: [],
  status: 'pending',
  reviewedBy: null,
  reviewNote: null
});
