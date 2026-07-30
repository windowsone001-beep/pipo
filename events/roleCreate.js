const { AuditLogEvent } = require('discord.js');
const { trackDestructiveAction } = require('../utils/antiNuke');
module.exports = {
  name: 'roleCreate',
  async execute(role) {
    await trackDestructiveAction(role.guild, AuditLogEvent.RoleCreate, 'antiRoleDeleteCreate', 'role creation');
  }
};
