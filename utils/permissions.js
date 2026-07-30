const config = require('../config/config');

/**
 * Central permission gate. Every sensitive command/component should call
 * one of these instead of re-implementing permission checks inline.
 */

function isOwner(userId) {
  return config.ownerIds.includes(userId);
}

function isAdmin(member) {
  if (!member) return false;
  if (isOwner(member.id)) return true;
  return member.permissions.has('Administrator');
}

function hasPermission(member, permissionFlag) {
  if (!member) return false;
  if (isOwner(member.id)) return true;
  return member.permissions.has(permissionFlag);
}

function isStaff(member, roleIds = []) {
  if (!member) return false;
  if (isAdmin(member)) return true;
  return member.roles.cache.some(r => roleIds.includes(r.id));
}

// Prevents mods from actioning users with equal/higher roles, or actioning themselves/the bot.
function canModerate(guild, moderator, target) {
  if (!target) return { ok: false, reason: 'User not found.' };
  if (target.id === moderator.id) return { ok: false, reason: 'You cannot moderate yourself.' };
  if (target.id === guild.client.user.id) return { ok: false, reason: 'You cannot moderate the bot.' };
  if (isOwner(moderator.id)) return { ok: true };
  if (target.id === guild.ownerId) return { ok: false, reason: 'You cannot moderate the server owner.' };
  if (moderator.roles.highest.position <= target.roles.highest.position) {
    return { ok: false, reason: 'You cannot moderate someone with an equal or higher role.' };
  }
  if (!guild.members.me.permissions.has('Administrator') &&
      guild.members.me.roles.highest.position <= target.roles.highest.position) {
    return { ok: false, reason: "My role is too low to moderate that user." };
  }
  return { ok: true };
}

module.exports = { isOwner, isAdmin, hasPermission, isStaff, canModerate };
