const { AuditLogEvent } = require('discord.js');
const { trackDestructiveAction } = require('../utils/antiNuke');
module.exports = {
  name: 'channelCreate',
  async execute(channel) {
    if (!channel.guild) return;
    await trackDestructiveAction(channel.guild, AuditLogEvent.ChannelCreate, 'antiChannelDeleteCreate', 'channel creation');
  }
};
