const ScheduledMessage = require('../models/ScheduledMessage');
const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');

function startScheduledMessageLoop(client) {
  setInterval(async () => {
    try {
      const due = await ScheduledMessage.find({ sent: false, sendAt: { $lte: new Date() } });
      for (const msg of due) {
        const channel = await client.channels.fetch(msg.channelId).catch(() => null);
        if (channel) {
          const payload = {};
          if (msg.content) payload.content = msg.content;
          if (msg.embedJson) payload.embeds = [EmbedBuilder.from(msg.embedJson)];
          await channel.send(payload).catch(err => logger.error('Failed to send scheduled message', err));
        }
        msg.sent = true;
        await msg.save();
      }
    } catch (err) {
      logger.error('Scheduler loop error', err);
    }
  }, 20_000);
}

module.exports = { startScheduledMessageLoop };
