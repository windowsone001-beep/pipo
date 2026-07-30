const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType } = require('discord.js');
const embeds = require('../../utils/embeds');
const generateId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const GuildConfig = require('../../models/GuildConfig');
const { invalidate } = require('../../utils/getGuildConfig');

/**
 * /ticket-panel — create and manage ticket panels.
 * Categories are added afterward with add-category so panels can support
 * an unlimited number of ticket categories without an unwieldy single command.
 */
module.exports = {
  category: 'Tickets',
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Create and manage ticket panels.')
    .addSubcommand(sc => sc
      .setName('create')
      .setDescription('Create a new ticket panel.')
      .addChannelOption(o => o.setName('channel').setDescription('Channel to post the panel in').addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addStringOption(o => o.setName('title').setDescription('Panel embed title').setRequired(true))
      .addStringOption(o => o.setName('description').setDescription('Panel embed description').setRequired(true))
      .addStringOption(o => o.setName('color').setDescription('Hex color, e.g. #5865F2')))
    .addSubcommand(sc => sc
      .setName('add-category')
      .setDescription('Add a ticket category to a panel.')
      .addStringOption(o => o.setName('panel_id').setDescription('Panel ID (shown after creating the panel)').setRequired(true))
      .addStringOption(o => o.setName('label').setDescription('Category button/option label').setRequired(true))
      .addChannelOption(o => o.setName('discord_category').setDescription('Discord category tickets are created under').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
      .addStringOption(o => o.setName('emoji').setDescription('Emoji for this category'))
      .addStringOption(o => o.setName('welcome_message').setDescription('Message sent when a ticket of this type opens'))
      .addRoleOption(o => o.setName('ping_role').setDescription('Role to ping when this ticket type opens')))
    .addSubcommand(sc => sc
      .setName('remove-category')
      .setDescription('Remove a category from a panel.')
      .addStringOption(o => o.setName('panel_id').setDescription('Panel ID').setRequired(true))
      .addStringOption(o => o.setName('label').setDescription('Exact label of the category to remove').setRequired(true)))
    .addSubcommand(sc => sc
      .setName('delete')
      .setDescription('Delete a panel entirely (does not close existing tickets).')
      .addStringOption(o => o.setName('panel_id').setDescription('Panel ID').setRequired(true)))
    .addSubcommand(sc => sc
      .setName('list')
      .setDescription('List all ticket panels and their categories in this server.'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    let cfg = await GuildConfig.findOne({ guildId: interaction.guild.id }) || await GuildConfig.create({ guildId: interaction.guild.id });

    if (sub === 'create') {
      const channel = interaction.options.getChannel('channel');
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      const color = interaction.options.getString('color') || '#5865F2';
      const panelId = generateId().slice(0, 8);

      if (!/^#?[0-9A-Fa-f]{6}$/.test(color)) {
        return interaction.reply({ embeds: [embeds.error('Invalid color. Use a hex code like `#5865F2`.')], ephemeral: true });
      }

      const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor(color).setFooter({ text: `Panel ID: ${panelId}` });
      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`ticket_open_${panelId}`)
          .setPlaceholder('Select a ticket category...')
          .addOptions({ label: 'No categories configured yet', value: 'placeholder', description: 'Ask an admin to add categories with /ticket-panel add-category' })
      );

      const message = await channel.send({ embeds: [embed], components: [row] }).catch(() => null);
      if (!message) {
        return interaction.reply({ embeds: [embeds.error("I couldn't post to that channel. Check I have View Channel and Send Messages permissions there.")], ephemeral: true });
      }

      cfg.tickets.panels.push({ panelId, channelId: channel.id, messageId: message.id, title, description, color, categories: [] });
      await cfg.save();
      invalidate(interaction.guild.id);

      await interaction.reply({ embeds: [embeds.success(`Panel created in ${channel}.\n**Panel ID:** \`${panelId}\`\nAdd categories with \`/ticket-panel add-category panel_id:${panelId}\``)], ephemeral: true });
    }

    if (sub === 'add-category') {
      const panelId = interaction.options.getString('panel_id');
      const panel = cfg.tickets.panels.find(p => p.panelId === panelId);
      if (!panel) return interaction.reply({ embeds: [embeds.error('No panel found with that ID. Use `/ticket-panel list` to see valid IDs.')], ephemeral: true });

      if (panel.categories.length >= 25) {
        return interaction.reply({ embeds: [embeds.error('This panel already has 25 categories, which is the maximum a single Discord select menu can hold. Create a second panel for more.')], ephemeral: true });
      }

      const discordCategory = interaction.options.getChannel('discord_category');
      const category = {
        id: Math.random().toString(36).slice(2, 8),
        label: interaction.options.getString('label').slice(0, 100),
        emoji: interaction.options.getString('emoji') || '🎫',
        categoryChannelId: discordCategory.id,
        welcomeMessage: interaction.options.getString('welcome_message') || 'Support will be with you shortly. Please describe your issue.',
        pingRoles: interaction.options.getRole('ping_role') ? [interaction.options.getRole('ping_role').id] : []
      };
      panel.categories.push(category);
      await cfg.save();
      invalidate(interaction.guild.id);

      // Rebuild the live panel message's select menu with the updated category list.
      const channel = interaction.guild.channels.cache.get(panel.channelId);
      const message = channel ? await channel.messages.fetch(panel.messageId).catch(() => null) : null;
      if (message) {
        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`ticket_open_${panelId}`)
            .setPlaceholder('Select a ticket category...')
            .addOptions(panel.categories.map(c => ({ label: c.label, value: c.id, emoji: c.emoji })))
        );
        await message.edit({ components: [row] }).catch(() => {});
      } else {
        await interaction.followUp({ embeds: [embeds.warn("The original panel message couldn't be found/edited (was it deleted?). The category was saved, but you may want to recreate the panel.")], ephemeral: true }).catch(() => {});
      }

      await interaction.reply({ embeds: [embeds.success(`Category **${category.label}** added to panel \`${panelId}\`.`)], ephemeral: true });
    }

    if (sub === 'remove-category') {
      const panelId = interaction.options.getString('panel_id');
      const label = interaction.options.getString('label');
      const panel = cfg.tickets.panels.find(p => p.panelId === panelId);
      if (!panel) return interaction.reply({ embeds: [embeds.error('No panel found with that ID.')], ephemeral: true });

      const before = panel.categories.length;
      panel.categories = panel.categories.filter(c => c.label !== label);
      if (panel.categories.length === before) {
        return interaction.reply({ embeds: [embeds.error('No category with that exact label was found on this panel.')], ephemeral: true });
      }
      await cfg.save();
      invalidate(interaction.guild.id);

      const channel = interaction.guild.channels.cache.get(panel.channelId);
      const message = channel ? await channel.messages.fetch(panel.messageId).catch(() => null) : null;
      if (message) {
        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`ticket_open_${panelId}`)
            .setPlaceholder('Select a ticket category...')
            .addOptions(panel.categories.length
              ? panel.categories.map(c => ({ label: c.label, value: c.id, emoji: c.emoji }))
              : [{ label: 'No categories configured yet', value: 'placeholder' }])
        );
        await message.edit({ components: [row] }).catch(() => {});
      }

      await interaction.reply({ embeds: [embeds.success(`Category **${label}** removed from panel \`${panelId}\`.`)], ephemeral: true });
    }

    if (sub === 'delete') {
      const panelId = interaction.options.getString('panel_id');
      const panel = cfg.tickets.panels.find(p => p.panelId === panelId);
      if (!panel) return interaction.reply({ embeds: [embeds.error('No panel found with that ID.')], ephemeral: true });

      cfg.tickets.panels = cfg.tickets.panels.filter(p => p.panelId !== panelId);
      await cfg.save();
      invalidate(interaction.guild.id);

      const channel = interaction.guild.channels.cache.get(panel.channelId);
      const message = channel ? await channel.messages.fetch(panel.messageId).catch(() => null) : null;
      if (message) await message.delete().catch(() => {});

      await interaction.reply({ embeds: [embeds.success(`Panel \`${panelId}\` deleted. Existing open tickets from it are unaffected.`)], ephemeral: true });
    }

    if (sub === 'list') {
      if (!cfg.tickets.panels.length) {
        return interaction.reply({ embeds: [embeds.info('No ticket panels have been created yet. Use `/ticket-panel create` to make one.')], ephemeral: true });
      }
      const embed = embeds.baseEmbed().setTitle('🎫 Ticket Panels');
      for (const panel of cfg.tickets.panels) {
        const categoryList = panel.categories.length
          ? panel.categories.map(c => `${c.emoji} ${c.label}`).join(', ')
          : '*No categories yet*';
        embed.addFields({ name: `${panel.title}  —  \`${panel.panelId}\``, value: `Channel: <#${panel.channelId}>\nCategories: ${categoryList}` });
      }
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
