const { AuditLogEvent } = require('discord.js');
const { trackDestructiveAction } = require('../utils/antiNuke');
module.exports = {
  name: 'channelDelete',
  async execute(channel) {
    if (!channel.guild) return;
    await trackDestructiveAction(channel.guild, AuditLogEvent.ChannelDelete, 'antiChannelDeleteCreate', 'channel deletion');
  }
};
