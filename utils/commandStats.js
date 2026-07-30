const { Counter } = require('../models/Counter');

// Best-effort, fire-and-forget usage counters. This is intentionally simple
// (a handful of jsondb counter rows) rather than a full analytics pipeline —
// it exists so the admin dashboard can show real "commands executed" numbers
// instead of a fabricated one. Never awaited from the command path, and any
// failure here must never affect the actual command response.
function recordCommand(commandName, guildId) {
  const day = new Date().toISOString().slice(0, 10);
  const keys = ['cmd:total', `cmd:day:${day}`, `cmd:name:${commandName}`];
  if (guildId) keys.push(`cmd:guild:${guildId}`);

  for (const key of keys) {
    Counter.findOneAndUpdate({ key }, { $inc: { seq: 1 } }, { upsert: true }).catch(() => {});
  }
}

async function getTotalCommandsExecuted() {
  const doc = await Counter.findOne({ key: 'cmd:total' });
  return doc?.seq || 0;
}

async function getCommandsPerDay(days = 14) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const doc = await Counter.findOne({ key: `cmd:day:${key}` });
    out.push({ day: key, count: doc?.seq || 0 });
  }
  return out;
}

async function getTopCommands(limit = 8) {
  const all = await Counter.find({});
  return all
    .filter(c => c.key.startsWith('cmd:name:'))
    .map(c => ({ name: c.key.replace('cmd:name:', ''), count: c.seq }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

async function getCommandsPerGuild() {
  const all = await Counter.find({});
  const map = {};
  for (const c of all) {
    if (c.key.startsWith('cmd:guild:')) map[c.key.replace('cmd:guild:', '')] = c.seq;
  }
  return map;
}

module.exports = { recordCommand, getTotalCommandsExecuted, getCommandsPerDay, getTopCommands, getCommandsPerGuild };
