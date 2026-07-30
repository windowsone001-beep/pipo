const GuildConfig = require('../models/GuildConfig');

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch().catch(() => {});
    if (!reaction.message.guild) return;

    const cfg = await GuildConfig.findOne({ guildId: reaction.message.guild.id });
    if (!cfg) return;
    const panel = cfg.selfRoles.find(p => p.messageId === reaction.message.id && p.type === 'reaction');
    if (!panel) return;

    const entry = panel.roles.find(r => r.emoji === reaction.emoji.name || r.emoji === `<:${reaction.emoji.name}:${reaction.emoji.id}>`);
    if (!entry) return;

    const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
    if (member) await member.roles.add(entry.roleId).catch(() => {});
  }
};
