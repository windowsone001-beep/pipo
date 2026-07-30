const { AuditLogEvent } = require('discord.js');
const { trackDestructiveAction } = require('../utils/antiNuke');
module.exports = {
  name: 'roleDelete',
  async execute(role) {
    await trackDestructiveAction(role.guild, AuditLogEvent.RoleDelete, 'antiRoleDeleteCreate', 'role deletion');
  }
};
