const express = require('express');
const router = express.Router();
const GuildConfig = require('../../models/GuildConfig');
const { invalidate } = require('../../utils/getGuildConfig');
const { requireGuildAccess } = require('../middleware/auth');

router.use('/guilds/:guildId', requireGuildAccess);

router.post('/guilds/:guildId/welcome', async (req, res) => {
  const cfg = await GuildConfig.findOne({ guildId: req.params.guildId }) || await GuildConfig.create({ guildId: req.params.guildId });

  cfg.welcome.enabled = !!req.body.welcomeEnabled;
  cfg.welcome.channel = req.body.welcomeChannel || null;
  cfg.welcome.message = req.body.welcomeMessage || cfg.welcome.message;
  cfg.welcome.dmEnabled = !!req.body.welcomeDm;

  cfg.goodbye.enabled = !!req.body.goodbyeEnabled;
  cfg.goodbye.channel = req.body.goodbyeChannel || null;
  cfg.goodbye.message = req.body.goodbyeMessage || cfg.goodbye.message;

  await cfg.save();
  invalidate(req.params.guildId);
  res.redirect(`/dashboard/${req.params.guildId}/welcome?saved=1`);
});

router.post('/guilds/:guildId/logging', async (req, res) => {
  const cfg = await GuildConfig.findOne({ guildId: req.params.guildId }) || await GuildConfig.create({ guildId: req.params.guildId });

  cfg.modLogChannel = req.body.modLogChannel || null;
  cfg.securityLogChannel = req.body.securityLogChannel || null;
  cfg.ticketLogChannel = req.body.ticketLogChannel || null;

  await cfg.save();
  invalidate(req.params.guildId);
  res.redirect(`/dashboard/${req.params.guildId}/logging?saved=1`);
});

router.post('/guilds/:guildId/security', async (req, res) => {
  const cfg = await GuildConfig.findOne({ guildId: req.params.guildId }) || await GuildConfig.create({ guildId: req.params.guildId });

  const modules = ['antiSpam', 'antiLink', 'antiInvite', 'antiEveryone', 'antiBot', 'antiWebhook', 'antiRaid', 'antiChannelDeleteCreate', 'antiRoleDeleteCreate', 'antiServerUpdate'];
  for (const mod of modules) {
    cfg.security[mod].enabled = !!req.body[mod];
  }

  await cfg.save();
  invalidate(req.params.guildId);
  res.redirect(`/dashboard/${req.params.guildId}/security?saved=1`);
});

router.post('/guilds/:guildId/autorole', async (req, res) => {
  const cfg = await GuildConfig.findOne({ guildId: req.params.guildId }) || await GuildConfig.create({ guildId: req.params.guildId });
  cfg.autoRole.enabled = !!req.body.autoRoleEnabled;
  cfg.autoRole.roles = (req.body.autoRoleIds || '').split(',').map(s => s.trim()).filter(Boolean);
  await cfg.save();
  invalidate(req.params.guildId);
  res.redirect(`/dashboard/${req.params.guildId}/roles?saved=1`);
});

module.exports = router;
