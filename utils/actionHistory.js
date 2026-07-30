const ModLog = require('../models/ModLog');
const Ticket = require('../models/Ticket');
const Application = require('../models/Application');

// Builds a real activity timeline for one Discord user, pulled from actual
// stored records (mod actions they took or received, tickets they opened,
// applications they submitted) — not synthetic/decorative data.
async function getActionHistory(userId, limit = 20) {
  const [actionsTaken, actionsReceived, tickets, applications] = await Promise.all([
    ModLog.find({ moderatorId: userId }).sort({ createdAt: -1 }).limit(limit),
    ModLog.find({ userId: userId }).sort({ createdAt: -1 }).limit(limit),
    Ticket.find({ openerId: userId }).sort({ createdAt: -1 }).limit(limit),
    Application.find({ userId: userId }).sort({ createdAt: -1 }).limit(limit)
  ]);

  const events = [
    ...actionsTaken.map(a => ({
      type: 'mod_action_taken', icon: 'fa-solid fa-gavel', createdAt: a.createdAt, guildId: a.guildId,
      text: `Issued a ${a.action} in a server${a.reason ? ` — "${a.reason}"` : ''}`
    })),
    ...actionsReceived.map(a => ({
      type: 'mod_action_received', icon: 'fa-solid fa-triangle-exclamation', createdAt: a.createdAt, guildId: a.guildId,
      text: `Received a ${a.action} in a server`
    })),
    ...tickets.map(t => ({
      type: 'ticket', icon: 'fa-solid fa-ticket', createdAt: t.createdAt, guildId: t.guildId,
      text: `Opened ticket #${t.ticketNumber ?? '—'} (${t.status})`
    })),
    ...applications.map(a => ({
      type: 'application', icon: 'fa-solid fa-file-signature', createdAt: a.createdAt, guildId: a.guildId,
      text: `Submitted a staff application (${a.status})`
    }))
  ];

  return events
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, limit);
}

module.exports = { getActionHistory };
