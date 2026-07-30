const express = require('express');
const router = express.Router();
const GuildConfig = require('../../models/GuildConfig');
const Ticket = require('../../models/Ticket');
const Warning = require('../../models/Warning');
const ModLog = require('../../models/ModLog');
const Giveaway = require('../../models/Giveaway');
const Application = require('../../models/Application');
const Wallet = require('../../models/Wallet');
const { readBotGuilds } = require('../../utils/botGuildsFile');
const { requireGuildAccess } = require('../middleware/auth');
const { getBadges } = require('../../utils/discordBadges');
const { getActionHistory } = require('../../utils/actionHistory');

const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_REWARD = 250;

const SECTIONS = [
  { key: 'overview', label: 'Overview', icon: 'fa-solid fa-chart-line', group: 'Overview' },
  { key: 'tickets', label: 'Tickets', icon: 'fa-solid fa-ticket', group: 'Community' },
  { key: 'welcome', label: 'Welcome & Goodbye', icon: 'fa-solid fa-hand-sparkles', group: 'Community' },
  { key: 'giveaways', label: 'Giveaways', icon: 'fa-solid fa-gift', group: 'Community' },
  { key: 'applications', label: 'Applications', icon: 'fa-solid fa-file-signature', group: 'Community' },
  { key: 'suggestions', label: 'Suggestions', icon: 'fa-solid fa-lightbulb', group: 'Community' },
  { key: 'warnings', label: 'Warnings & Mod Log', icon: 'fa-solid fa-triangle-exclamation', group: 'Moderation' },
  { key: 'security', label: 'Security', icon: 'fa-solid fa-shield-halved', group: 'Moderation' },
  { key: 'logging', label: 'Logging Channels', icon: 'fa-solid fa-scroll', group: 'Moderation' },
  { key: 'roles', label: 'Roles', icon: 'fa-solid fa-masks-theater', group: 'Customization' },
  { key: 'embeds', label: 'Embed Builder', icon: 'fa-solid fa-puzzle-piece', group: 'Customization' },
  { key: 'commands', label: 'Commands', icon: 'fa-solid fa-keyboard', group: 'Customization' },
  { key: 'levels', label: 'Levels', icon: 'fa-solid fa-ranking-star', group: 'Extras' },
  { key: 'economy', label: 'Economy', icon: 'fa-solid fa-sack-dollar', group: 'Extras' },
  { key: 'music', label: 'Music', icon: 'fa-solid fa-music', group: 'Extras' },
  { key: 'premium', label: 'Premium', icon: 'fa-solid fa-gem', group: 'Extras' }
];
const SECTION_KEYS = SECTIONS.map(s => s.key);

// ---------------------------------------------------------------------------
// Home: user profile + server list (sidebar). This is the landing page after
// login — a single server picker grid is no longer the first thing you see.
// ---------------------------------------------------------------------------
router.get('/dashboard', async (req, res) => {
  const allGuilds = readBotGuilds();
  const { user } = req.session;
  const guilds = user.isOwner ? allGuilds : allGuilds.filter(g => user.manageableGuildIds.includes(g.id));

  let wallet = await Wallet.findOne({ userId: user.id });
  if (!wallet) wallet = await Wallet.create({ userId: user.id });

  const now = Date.now();
  const lastClaim = wallet.lastDaily ? new Date(wallet.lastDaily).getTime() : 0;
  const msSinceClaim = now - lastClaim;
  const canClaim = msSinceClaim >= DAY_MS;
  const nextClaimAt = canClaim ? null : new Date(lastClaim + DAY_MS).toISOString();

  const badges = getBadges(user.publicFlags);
  const activity = await getActionHistory(user.id, 15);
  const guildNameById = Object.fromEntries(allGuilds.map(g => [g.id, g.name]));

  res.render('home', {
    guilds, wallet, canClaim, nextClaimAt, dailyReward: DAILY_REWARD,
    badges, activity, guildNameById
  });
});

router.post('/dashboard/daily-claim', async (req, res) => {
  const { user } = req.session;
  let wallet = await Wallet.findOne({ userId: user.id });
  if (!wallet) wallet = await Wallet.create({ userId: user.id });

  const now = Date.now();
  const lastClaim = wallet.lastDaily ? new Date(wallet.lastDaily).getTime() : 0;
  if (now - lastClaim < DAY_MS) {
    return res.redirect('/dashboard?error=' + encodeURIComponent('Daily reward already claimed — come back later.'));
  }

  const withinStreakWindow = now - lastClaim < DAY_MS * 2; // claimed yesterday -> streak continues
  wallet.credits = (wallet.credits || 0) + DAILY_REWARD;
  wallet.dailyStreak = withinStreakWindow ? (wallet.dailyStreak || 0) + 1 : 1;
  wallet.lastDaily = new Date().toISOString();
  await wallet.save();

  res.redirect('/dashboard?saved=1');
});

// Convenience redirect: /dashboard/:guildId -> /dashboard/:guildId/overview
router.get('/dashboard/:guildId', requireGuildAccess, (req, res) => {
  res.redirect(`/dashboard/${req.params.guildId}/overview`);
});

// ---------------------------------------------------------------------------
// Per-server settings — each section is its own real page/route (not one
// long scrollable page), sharing one shell + sidebar.
// ---------------------------------------------------------------------------
router.get('/dashboard/:guildId/:section', requireGuildAccess, async (req, res) => {
  const { guildId, section } = req.params;
  if (!SECTION_KEYS.includes(section)) return res.status(404).render('404');

  const guilds = readBotGuilds();
  const guild = guilds.find(g => g.id === guildId);
  if (!guild) return res.status(404).render('404');

  const cfg = await GuildConfig.findOne({ guildId }) || await GuildConfig.create({ guildId });

  const [tickets, warnings, modlogs, giveaways, applications] = await Promise.all([
    Ticket.find({ guildId }),
    Warning.find({ guildId }),
    ModLog.find({ guildId }),
    Giveaway.find({ guildId }),
    Application.find({ guildId })
  ]);

  const openTickets = tickets.filter(t => t.status === 'open').length;
  const closedTickets = tickets.filter(t => t.status === 'closed').length;
  const activeGiveaways = giveaways.filter(g => !g.ended).length;
  const pendingApplications = applications.filter(a => a.status === 'pending').length;

  const actionCounts = {};
  for (const log of modlogs) actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;

  const days = [];
  const ticketsPerDay = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push(key);
    ticketsPerDay.push(tickets.filter(t => (t.createdAt || '').slice(0, 10) === key).length);
  }

  const stats = {
    totalTickets: tickets.length, openTickets, closedTickets,
    totalWarnings: warnings.length, totalModActions: modlogs.length,
    activeGiveaways, totalGiveaways: giveaways.length,
    pendingApplications, totalApplications: applications.length,
    actionCounts, ticketTrend: { days, counts: ticketsPerDay }
  };

  res.render('guild-section', {
    guildId, guild, cfg, stats, section, sections: SECTIONS,
    recentTickets: [...tickets].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 10),
    recentWarnings: [...warnings].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 10),
    recentGiveaways: [...giveaways].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 10),
    recentApplications: [...applications].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 10)
  });
});

module.exports = router;
