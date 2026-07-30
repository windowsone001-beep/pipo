const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const Giveaway = require('../../models/Giveaway');
const { endGiveaway } = require('../../utils/giveawayManager');

module.exports = {
  category: 'Giveaway',
  data: new SlashCommandBuilder()
    .setName('gend')
    .setDescription('End a giveaway early.')
    .addStringOption(o => o.setName('message_id').setDescription('The giveaway message ID').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents),
  async execute(interaction) {
    const messageId = interaction.options.getString('message_id');
    const giveaway = await Giveaway.findOne({ messageId, guildId: interaction.guild.id });
    if (!giveaway) return interaction.reply({ embeds: [embeds.error('Giveaway not found.')], ephemeral: true });
    if (giveaway.ended) return interaction.reply({ embeds: [embeds.warn('That giveaway has already ended.')], ephemeral: true });

    await interaction.deferReply({ ephemeral: true });
    await endGiveaway(interaction.client, giveaway);
    await interaction.editReply({ embeds: [embeds.success('Giveaway ended.')] });
  }
};
