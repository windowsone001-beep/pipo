const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

const styleMap = { primary: ButtonStyle.Primary, secondary: ButtonStyle.Secondary, success: ButtonStyle.Success, danger: ButtonStyle.Danger, link: ButtonStyle.Link };

module.exports = {
  category: 'Embed Builder',
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Build and send custom embeds.')
    .addSubcommand(sc => sc.setName('send').setDescription('Send a custom embed.')
      .addChannelOption(o => o.setName('channel').setDescription('Channel to send to (defaults to here)'))
      .addStringOption(o => o.setName('title').setDescription('Embed title'))
      .addStringOption(o => o.setName('description').setDescription('Embed description (use \\n for new lines)'))
      .addStringOption(o => o.setName('color').setDescription('Hex color, e.g. #5865F2'))
      .addStringOption(o => o.setName('footer').setDescription('Footer text'))
      .addStringOption(o => o.setName('thumbnail').setDescription('Thumbnail image URL'))
      .addStringOption(o => o.setName('image').setDescription('Large image URL'))
      .addStringOption(o => o.setName('author_name').setDescription('Author name shown at the top'))
      .addStringOption(o => o.setName('author_icon').setDescription('Author icon URL'))
      .addStringOption(o => o.setName('button_label').setDescription('Optional: label for a single button'))
      .addStringOption(o => o.setName('button_url').setDescription('Optional: URL the button links to (makes it a link button)')))
    .addSubcommand(sc => sc.setName('edit').setDescription('Edit an embed the bot previously sent.')
      .addStringOption(o => o.setName('message_id').setDescription('Message ID to edit').setRequired(true))
      .addChannelOption(o => o.setName('channel').setDescription('Channel the message is in (defaults to here)'))
      .addStringOption(o => o.setName('title').setDescription('New title'))
      .addStringOption(o => o.setName('description').setDescription('New description'))
      .addStringOption(o => o.setName('color').setDescription('New hex color')))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    if (sub === 'send') {
      const embed = new EmbedBuilder().setColor(interaction.options.getString('color') || '#5865F2');
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      if (title) embed.setTitle(title);
      if (description) embed.setDescription(description.replace(/\\n/g, '\n'));
      const footer = interaction.options.getString('footer');
      if (footer) embed.setFooter({ text: footer });
      const thumb = interaction.options.getString('thumbnail');
      if (thumb) embed.setThumbnail(thumb);
      const image = interaction.options.getString('image');
      if (image) embed.setImage(image);
      const authorName = interaction.options.getString('author_name');
      if (authorName) embed.setAuthor({ name: authorName, iconURL: interaction.options.getString('author_icon') || undefined });

      if (!title && !description && !image) {
        return interaction.reply({ embeds: [embeds.error('Provide at least a title, description, or image.')], ephemeral: true });
      }

      const payload = { embeds: [embed] };
      const btnLabel = interaction.options.getString('button_label');
      const btnUrl = interaction.options.getString('button_url');
      if (btnLabel && btnUrl) {
        payload.components = [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel(btnLabel).setURL(btnUrl).setStyle(ButtonStyle.Link)
        )];
      }

      await channel.send(payload);
      await interaction.reply({ embeds: [embeds.success(`Embed sent to ${channel}.`)], ephemeral: true });
    }

    if (sub === 'edit') {
      const message = await channel.messages.fetch(interaction.options.getString('message_id')).catch(() => null);
      if (!message || message.author.id !== interaction.client.user.id) {
        return interaction.reply({ embeds: [embeds.error('That message was not found, or was not sent by me.')], ephemeral: true });
      }
      const existing = message.embeds[0] ? EmbedBuilder.from(message.embeds[0]) : new EmbedBuilder();
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      const color = interaction.options.getString('color');
      if (title) existing.setTitle(title);
      if (description) existing.setDescription(description.replace(/\\n/g, '\n'));
      if (color) existing.setColor(color);

      await message.edit({ embeds: [existing] });
      await interaction.reply({ embeds: [embeds.success('Embed updated.')], ephemeral: true });
    }
  }
};
