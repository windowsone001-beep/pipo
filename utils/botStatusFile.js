const fs = require('fs');
const path = require('path');

// A small heartbeat file the bot process writes and the (separate) dashboard
// process reads. This is how the dashboard gets real numbers for latency,
// uptime, and memory instead of the bot process, which it can't talk to directly.
const FILE = path.join(__dirname, '..', 'data', 'db', 'bot-status.json');

function writeBotStatus(client) {
  const mem = process.memoryUsage();
  const status = {
    tag: client.user?.tag || null,
    wsPing: Math.round(client.ws.ping),
    uptimeSeconds: Math.floor(process.uptime()),
    guildCount: client.guilds.cache.size,
    memberCount: client.guilds.cache.reduce((sum, g) => sum + (g.memberCount || 0), 0),
    rssMB: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
    heapUsedMB: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
    updatedAt: new Date().toISOString()
  };
  try {
    fs.writeFileSync(FILE, JSON.stringify(status, null, 2));
  } catch {
    // non-fatal — dashboard will just show "offline" until this succeeds
  }
}

function readBotStatus() {
  try {
    const status = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    // Consider the bot "online" only if it's heartbeated in the last 90s —
    // this file otherwise looks identical whether the bot is up or crashed.
    status.online = Date.now() - new Date(status.updatedAt).getTime() < 90_000;
    return status;
  } catch {
    return { online: false, tag: null, wsPing: null, uptimeSeconds: 0, guildCount: 0, memberCount: 0, rssMB: 0, heapUsedMB: 0, updatedAt: null };
  }
}

module.exports = { writeBotStatus, readBotStatus };
