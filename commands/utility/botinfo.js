const { SlashCommandBuilder, version: djsVersion } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  category: 'Utility',
  data: new SlashCommandBuilder().setName('botinfo').setDescription('Show information about MineCore Manager.'),
  async execute(interaction) {
    const client = interaction.client;
    const embed = embeds.baseEmbed()
      .setTitle('MineCore Manager')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
        { name: 'Users', value: `${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`, inline: true },
        { name: 'discord.js', value: djsVersion, inline: true },
        { name: 'Node.js', value: process.version, inline: true },
        { name: 'Memory', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`, inline: true }
      );
    await interaction.reply({ embeds: [embed] });
  }
};
