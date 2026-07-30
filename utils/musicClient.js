const { DisTube } = require('distube');
const logger = require('./logger');
const config = require('../config/config');
const { EmbedBuilder } = require('discord.js');

let distube = null;

function initDisTube(client) {
  distube = new DisTube(client, {
    emitNewSongOnly: true,
    savePreviousSongs: true,
    emitAddSongWhenCreatingQueue: false
  });

  distube.on('playSong', (queue, song) => {
    queue.textChannel?.send({
      embeds: [new EmbedBuilder().setColor(config.colors.primary).setDescription(`🎶 Now playing **${song.name}** — requested by ${song.user}`)]
    }).catch(() => {});
  });

  distube.on('addSong', (queue, song) => {
    queue.textChannel?.send({
      embeds: [new EmbedBuilder().setColor(config.colors.info).setDescription(`➕ Added **${song.name}** to the queue.`)]
    }).catch(() => {});
  });

  distube.on('error', (channel, error) => {
    logger.error('DisTube error', error);
    channel?.send?.('❌ An error occurred while playing music.').catch(() => {});
  });

  distube.on('finish', (queue) => {
    queue.textChannel?.send('✅ Queue finished.').catch(() => {});
  });

  logger.success('DisTube music client initialized.');
  return distube;
}

function getDisTube() {
  return distube;
}

module.exports = { initDisTube, getDisTube };
