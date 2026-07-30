const express = require('express');
const os = require('os');
const router = express.Router();

const Ticket = require('../../models/Ticket');
const Warning = require('../../models/Warning');
const ModLog = require('../../models/ModLog');
const Giveaway = require('../../models/Giveaway');
const Application = require('../../models/Application');
const { readBotGuilds } = require('../../utils/botGuildsFile');
const { readBotStatus } = require('../../utils/botStatusFile');
const { getTotalCommandsExecuted, getCommandsPerDay, getTopCommands, getCommandsPerGuild } = require('../../utils/commandStats');

router.get('/', async (req, res) => {
  const guilds = readBotGuilds();
  const botStatus = readBotStatus();

  const [tickets, warnings, modlogs, giveaways, applications, commandsTotal, commandsPerDay, topCommands, commandsPerGuild] = await Promise.all([
    Ticket.find({}),
    Warning.find({}),
    ModLog.find({}),
    Giveaway.find({}),
    Application.find({}),
    getTotalCommandsExecuted(),
    getCommandsPerDay(14),
    getTopCommands(8),
    getCommandsPerGuild()
  ]);

  const openTickets = tickets.filter(t => t.status === 'open').length;
  const activeGiveaways = giveaways.filter(g => !g.ended).length;

  const actionCounts = {};
  for (const log of modlogs) actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;

  const totalMembers = guilds.reduce((sum, g) => sum + (g.memberCount || 0), 0);

  const mostActiveServers = guilds
    .map(g => ({
      ...g,
      ticketCount: tickets.filter(t => t.guildId === g.id).length,
      modActionCount: modlogs.filter(m => m.guildId === g.id).length,
      commandCount: commandsPerGuild[g.id] || 0
    }))
    .sort((a, b) => (b.ticketCount + b.modActionCount + b.commandCount) - (a.ticketCount + a.modActionCount + a.commandCount))
    .slice(0, 8);

  const stats = {
    totalServers: guilds.length,
    totalMembers,
    totalTickets: tickets.length,
    openTickets,
    totalWarnings: warnings.length,
    totalModActions: modlogs.length,
    activeGiveaways,
    totalGiveaways: giveaways.length,
    pendingApplications: applications.filter(a => a.status === 'pending').length,
    commandsTotal,
    commandsPerDay,
    topCommands,
    actionCounts,
    mostActiveServers,
    hostCpuCores: os.cpus().length,
    hostLoadAvg: os.loadavg()[0].toFixed(2),
    hostMemTotalGB: (os.totalmem() / 1024 / 1024 / 1024).toFixed(1),
    hostMemFreeGB: (os.freemem() / 1024 / 1024 / 1024).toFixed(1),
    hostMemUsedPct: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
    dashboardUptimeSeconds: Math.floor(process.uptime())
  };

  res.render('admin', { guilds, stats, botStatus });
});

module.exports = router;
