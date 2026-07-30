const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'db', 'bot-guilds.json');

function writeBotGuilds(client) {
  const guilds = client.guilds.cache.map(g => ({
    id: g.id,
    name: g.name,
    icon: g.iconURL({ size: 128 }),
    memberCount: g.memberCount
  }));
  fs.writeFileSync(FILE, JSON.stringify(guilds, null, 2));
}

function readBotGuilds() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return [];
  }
}

module.exports = { writeBotGuilds, readBotGuilds };
