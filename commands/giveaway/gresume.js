const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const Giveaway = require('../../models/Giveaway');

module.exports = {
  category: 'Giveaway',
  data: new SlashCommandBuilder()
    .setName('gresume')
    .setDescription('Resume a paused giveaway.')
    .addStringOption(o => o.setName('message_id').setDescription('The giveaway message ID').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents),
  async execute(interaction) {
    const giveaway = await Giveaway.findOne({ messageId: interaction.options.getString('message_id'), guildId: interaction.guild.id });
    if (!giveaway || giveaway.ended) return interaction.reply({ embeds: [embeds.error('Giveaway not found or already ended.')], ephemeral: true });
    giveaway.paused = false;
    await giveaway.save();
    await interaction.reply({ embeds: [embeds.success('Giveaway resumed.')] });
  }
};
