const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  category: 'Embed Builder',
  data: new SlashCommandBuilder()
    .setName('trembed')
    .setDescription('Send an embed with a button members can click to translate it to Arabic.')
    .addStringOption(o => o.setName('text').setDescription('The embed text — write it in whatever language you want').setRequired(true))
    .addStringOption(o => o.setName('title').setDescription('Embed title'))
    .addStringOption(o => o.setName('color').setDescription('Hex color, e.g. #5865F2'))
    .addChannelOption(o => o.setName('channel').setDescription('Channel to send to (defaults to here)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const text = interaction.options.getString('text').replace(/\\n/g, '\n');
    const title = interaction.options.getString('title');
    const color = interaction.options.getString('color') || '#5865F2';
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    if (!/^#?[0-9A-Fa-f]{6}$/.test(color)) {
      return interaction.reply({ embeds: [embeds.error('Invalid color. Use a hex code like `#5865F2`.')], ephemeral: true });
    }

    const embed = new EmbedBuilder().setColor(color).setDescription(text);
    if (title) embed.setTitle(title);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('trembed_translate').setLabel('ترجمة  •  Translate').setEmoji('🌐').setStyle(ButtonStyle.Secondary)
    );

    const sent = await channel.send({ embeds: [embed], components: [row] }).catch(() => null);
    if (!sent) return interaction.reply({ embeds: [embeds.error("I couldn't send to that channel — check my permissions there.")], ephemeral: true });

    await interaction.reply({ embeds: [embeds.success(`Embed sent to ${channel}.`)], ephemeral: true });
  }
};
