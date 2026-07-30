const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const { getGuildConfig } = require('./getGuildConfig');

function pickWinners(entries, count) {
  const pool = [...new Set(entries)];
  const winners = [];
  while (winners.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]);
  }
  return winners;
}

async function endGiveaway(client, giveaway) {
  const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
  if (!channel) {
    giveaway.ended = true;
    await giveaway.save();
    return;
  }

  const winners = pickWinners(giveaway.entries, giveaway.winnerCount);
  giveaway.winners = winners;
  giveaway.ended = true;
  await giveaway.save();

  const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('🎉 Giveaway Ended')
    .setDescription(
      `**Prize:** ${giveaway.prize}\n` +
      (winners.length
        ? `**Winner(s):** ${winners.map(w => `<@${w}>`).join(', ')}`
        : 'No valid entries — no winner could be chosen.')
    )
    .setTimestamp();

  if (message) await message.edit({ embeds: [embed], components: [] }).catch(() => {});

  await channel.send({
    content: winners.length ? `🎉 Congratulations ${winners.map(w => `<@${w}>`).join(', ')}! You won **${giveaway.prize}**!` : 'No winner could be determined for this giveaway.'
  }).catch(() => {});

  const cfg = await getGuildConfig(giveaway.guildId);
  if (cfg.giveawayLogChannel) {
    const log = await client.channels.fetch(cfg.giveawayLogChannel).catch(() => null);
    if (log) {
      log.send({
        embeds: [new EmbedBuilder()
          .setColor(config.colors.info)
          .setTitle('Giveaway Ended')
          .addFields(
            { name: 'Prize', value: giveaway.prize },
            { name: 'Entries', value: `${giveaway.entries.length}` },
            { name: 'Winners', value: winners.length ? winners.map(w => `<@${w}>`).join(', ') : 'None' }
          )
          .setTimestamp()]
      }).catch(() => {});
    }
  }

  return winners;
}

async function rerollGiveaway(client, giveaway, count = giveaway.winnerCount) {
  const winners = pickWinners(giveaway.entries.filter(e => !giveaway.winners.includes(e)), count);
  const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
  if (channel) {
    await channel.send({
      content: winners.length
        ? `🔁 New winner(s) for **${giveaway.prize}**: ${winners.map(w => `<@${w}>`).join(', ')}`
        : 'Not enough entries to reroll.'
    }).catch(() => {});
  }
  return winners;
}

module.exports = { endGiveaway, rerollGiveaway, pickWinners };
