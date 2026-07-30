const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  category: 'Utility',
  data: new SlashCommandBuilder().setName('help').setDescription('List all available commands.'),
  async execute(interaction) {
    const client = interaction.client;
    const categories = {};

    for (const [, cmd] of client.commands) {
      const category = cmd.category || 'Misc';
      if (!categories[category]) categories[category] = [];
      categories[category].push(`\`/${cmd.data.name}\``);
    }

    const embed = embeds.baseEmbed().setTitle('📖 MineCore Manager — Commands');
    for (const [category, cmds] of Object.entries(categories)) {
      embed.addFields({ name: category, value: cmds.join(', ') });
    }
    embed.setFooter({ text: 'Use / to see live descriptions and options for each command.' });

    await interaction.reply({ embeds: [embed] });
  }
};
