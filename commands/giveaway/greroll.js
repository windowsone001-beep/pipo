const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const Giveaway = require('../../models/Giveaway');
const { rerollGiveaway } = require('../../utils/giveawayManager');

module.exports = {
  category: 'Giveaway',
  data: new SlashCommandBuilder()
    .setName('greroll')
    .setDescription('Reroll winner(s) for an ended giveaway.')
    .addStringOption(o => o.setName('message_id').setDescription('The giveaway message ID').setRequired(true))
    .addIntegerOption(o => o.setName('winners').setDescription('How many new winners to pick').setMinValue(1))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents),
  async execute(interaction) {
    const messageId = interaction.options.getString('message_id');
    const giveaway = await Giveaway.findOne({ messageId, guildId: interaction.guild.id });
    if (!giveaway) return interaction.reply({ embeds: [embeds.error('Giveaway not found.')], ephemeral: true });
    if (!giveaway.ended) return interaction.reply({ embeds: [embeds.warn('That giveaway has not ended yet.')], ephemeral: true });

    await interaction.deferReply({ ephemeral: true });
    const count = interaction.options.getInteger('winners') || giveaway.winnerCount;
    const winners = await rerollGiveaway(interaction.client, giveaway, count);
    await interaction.editReply({ embeds: [embeds.success(winners.length ? `New winner(s): ${winners.map(w => `<@${w}>`).join(', ')}` : 'Not enough entries to reroll.')] });
  }
};
