const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const GuildConfig = require('../models/GuildConfig');
const logger = require('../utils/logger');

const connections = new Map(); // guildId -> VoiceConnection

async function join(guild, channelId) {
  const connection = joinVoiceChannel({
    channelId,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000)
      ]);
      // it's reconnecting, do nothing
    } catch {
      // actually disconnected — attempt manual reconnect
      try {
        connection.destroy();
      } catch {}
      connections.delete(guild.id);
      setTimeout(() => join(guild, channelId).catch(() => {}), 5000);
    }
  });

  connections.set(guild.id, connection);
  return connection;
}

// Called once on bot startup to restore all guilds with 24/7 voice enabled.
async function rejoinPersistentVoice(client) {
  const configs = await GuildConfig.find({ 'voice247.enabled': true });
  for (const cfg of configs) {
    const guild = client.guilds.cache.get(cfg.guildId);
    if (!guild || !cfg.voice247.channelId) continue;
    try {
      await join(guild, cfg.voice247.channelId);
      logger.info(`Rejoined 24/7 voice channel in ${guild.name}`);
    } catch (err) {
      logger.error(`Failed to rejoin voice in ${guild.name}`, err);
    }
  }
}

module.exports = { join, connections, rejoinPersistentVoice };
