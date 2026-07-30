const Giveaway = require('../models/Giveaway');
const { endGiveaway } = require('./giveawayManager');
const logger = require('../utils/logger');

function startGiveawayLoop(client) {
  setInterval(async () => {
    try {
      const due = await Giveaway.find({ ended: false, paused: false, endsAt: { $lte: new Date() } });
      for (const giveaway of due) {
        await endGiveaway(client, giveaway).catch(err => logger.error('Error auto-ending giveaway', err));
      }
    } catch (err) {
      logger.error('Giveaway loop error', err);
    }
  }, 15_000);
}

module.exports = { startGiveawayLoop };
