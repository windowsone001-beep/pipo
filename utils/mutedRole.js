const { PermissionsBitField } = require('discord.js');

async function getOrCreateMutedRole(guild) {
  let role = guild.roles.cache.find(r => r.name === 'Muted');
  if (role) return role;

  role = await guild.roles.create({
    name: 'Muted',
    color: '#818386',
    permissions: [],
    reason: 'MineCore Manager: auto-created Muted role'
  });

  // Apply deny overwrites across all channels so the mute is effective immediately.
  for (const [, channel] of guild.channels.cache) {
    await channel.permissionOverwrites.edit(role, {
      SendMessages: false,
      AddReactions: false,
      Speak: false,
      Stream: false
    }).catch(() => {});
  }

  return role;
}

module.exports = { getOrCreateMutedRole };
