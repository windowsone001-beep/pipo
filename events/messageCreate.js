const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { getGuildConfig } = require('../utils/getGuildConfig');
const config = require('../config/config');
const ModLog = require('../models/ModLog');

// userId -> array of message timestamps, for anti-spam
const spamBuckets = new Map();
// "guildId:channelId" -> timestamp of the last auto-reply sent there, so one busy
// channel with several matching messages in a row doesn't spam replies back.
const autoReplyCooldowns = new Map();
const AUTOREPLY_COOLDOWN_MS = 3000;

const INVITE_REGEX = /(discord\.gg|discord(?:app)?\.com\/invite)\/[a-zA-Z0-9-]+/i;
const LINK_REGEX = /https?:\/\/[^\s]+/gi;

async function logSecurity(guild, cfg, description) {
  if (!cfg.securityLogChannel) return;
  const channel = guild.channels.cache.get(cfg.securityLogChannel);
  if (!channel) return;
  channel.send({
    embeds: [new EmbedBuilder().setColor(config.colors.danger).setTitle('🛡️ Security Action').setDescription(description).setTimestamp()]
  }).catch(() => {});
}

function findAutoReplyMatch(autoReplies, content) {
  for (const entry of autoReplies) {
    if (!entry.enabled) continue;
    const haystack = entry.caseSensitive ? content : content.toLowerCase();
    const needle = entry.caseSensitive ? entry.trigger : entry.trigger.toLowerCase();
    if (entry.matchType === 'exact' ? haystack === needle : haystack.includes(needle)) {
      return entry;
    }
  }
  return null;
}

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const cfg = await getGuildConfig(message.guild.id);
    const isAdmin = message.member?.permissions.has(PermissionsBitField.Flags.Administrator);

    // ---- Security filters (admins are exempt, same as before) ----
    if (!isAdmin) {
      const sec = cfg.security;
      const whitelisted = sec.whitelistedUsers.includes(message.author.id);

      if (!whitelisted) {
        // Anti @everyone/@here
        if (sec.antiEveryone?.enabled && message.mentions.everyone && !message.member.permissions.has('MentionEveryone')) {
          await message.delete().catch(() => {});
          await logSecurity(message.guild, cfg, `${message.author.tag} attempted an @everyone/@here mention in ${message.channel}.`);
          return;
        }

        // Anti invite / Anti link
        if (sec.antiInvite?.enabled && INVITE_REGEX.test(message.content)) {
          await message.delete().catch(() => {});
          await logSecurity(message.guild, cfg, `Removed a Discord invite link from ${message.author.tag} in ${message.channel}.`);
          return;
        }
        if (sec.antiLink?.enabled) {
          const links = message.content.match(LINK_REGEX);
          if (links && !links.every(l => sec.antiLink.whitelist.some(w => l.includes(w)))) {
            await message.delete().catch(() => {});
            await logSecurity(message.guild, cfg, `Removed a non-whitelisted link from ${message.author.tag} in ${message.channel}.`);
            return;
          }
        }

        // Anti-spam
        if (sec.antiSpam?.enabled) {
          const now = Date.now();
          const key = `${message.guild.id}:${message.author.id}`;
          const bucket = (spamBuckets.get(key) || []).filter(t => now - t < sec.antiSpam.interval);
          bucket.push(now);
          spamBuckets.set(key, bucket);

          if (bucket.length > sec.antiSpam.messages) {
            spamBuckets.set(key, []);
            try {
              if (sec.antiSpam.punishment === 'timeout') {
                const ms = require('ms')(sec.antiSpam.duration || '10m');
                await message.member.timeout(ms, 'Anti-spam: message flood').catch(() => {});
              } else if (sec.antiSpam.punishment === 'kick') {
                await message.member.kick('Anti-spam: message flood').catch(() => {});
              }
              await ModLog.create({
                guildId: message.guild.id,
                userId: message.author.id,
                moderatorId: message.client.user.id,
                action: 'auto-antispam',
                reason: 'Message flood detected'
              });
              await logSecurity(message.guild, cfg, `Auto-punished ${message.author.tag} for spamming (${bucket.length} messages).`);
            } catch {}
            return; // message author just got timed out/kicked — no point checking auto-replies too
          }
        }
      }
    }

    // ---- Auto Reply ----
    // Runs for everyone (including admins) since it's not a punishment system —
    // it's meant to answer common questions automatically.
    if (cfg.autoReplies?.length && message.content) {
      const match = findAutoReplyMatch(cfg.autoReplies, message.content.trim());
      if (match) {
        const cooldownKey = `${message.guild.id}:${message.channel.id}`;
        const last = autoReplyCooldowns.get(cooldownKey) || 0;
        if (Date.now() - last >= AUTOREPLY_COOLDOWN_MS) {
          autoReplyCooldowns.set(cooldownKey, Date.now());
          await message.reply({ content: match.response, allowedMentions: { repliedUser: false } }).catch(() => {});
        }
      }
    }
  }
};
