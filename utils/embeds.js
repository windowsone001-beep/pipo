const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

function baseEmbed(color = config.colors.primary) {
  return new EmbedBuilder().setColor(color).setTimestamp();
}

const success = (desc, title = null) =>
  baseEmbed(config.colors.success).setTitle(title || `${config.emojis.success} Success`).setDescription(desc);

const error = (desc, title = null) =>
  baseEmbed(config.colors.danger).setTitle(title || `${config.emojis.error} Error`).setDescription(desc);

const warn = (desc, title = null) =>
  baseEmbed(config.colors.warning).setTitle(title || `${config.emojis.warning} Warning`).setDescription(desc);

const info = (desc, title = null) =>
  baseEmbed(config.colors.info).setTitle(title || 'ℹ️ Info').setDescription(desc);

// Replaces {user} {server} {memberCount} {mention} etc in welcome/goodbye templates.
function applyVariables(template, { member, guild }) {
  if (!template) return '';
  return template
    .replace(/{user}/g, member.user.username)
    .replace(/{mention}/g, `<@${member.id}>`)
    .replace(/{tag}/g, member.user.tag)
    .replace(/{server}/g, guild.name)
    .replace(/{memberCount}/g, guild.memberCount.toLocaleString());
}

module.exports = { baseEmbed, success, error, warn, info, applyVariables };
