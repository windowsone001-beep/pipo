const { EmbedBuilder } = require('discord.js');
const embeds = require('../../../utils/embeds');
const { translateText } = require('../../../utils/translate');
const config = require('../../../config/config');

module.exports = {
  id: 'trembed_translate',
  async execute(interaction) {
    const original = interaction.message.embeds[0];
    if (!original || (!original.description && !original.title)) {
      return interaction.reply({ embeds: [embeds.error('Nothing to translate on this message.')], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true }); // translation call is a network request — could exceed 3s

    try {
      const translatedTitle = original.title ? await translateText(original.title, 'ar') : null;
      const translatedDescription = original.description ? await translateText(original.description, 'ar') : null;

      const embed = new EmbedBuilder().setColor(config.colors.primary);
      if (translatedTitle) embed.setTitle(translatedTitle);
      if (translatedDescription) embed.setDescription(translatedDescription);
      embed.setFooter({ text: 'ترجمة تلقائية — Automatic translation' });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({ embeds: [embeds.error('Translation failed — the translation service may be temporarily unavailable. Try again in a moment.')] });
    }
  }
};
