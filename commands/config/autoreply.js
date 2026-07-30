const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const GuildConfig = require('../../models/GuildConfig');
const { invalidate } = require('../../utils/getGuildConfig');
const generateId = () => Math.random().toString(36).slice(2, 10);

module.exports = {
  category: 'Auto Reply',
  data: new SlashCommandBuilder()
    .setName('autoreply')
    .setDescription('Automatically respond when a message matches a trigger word/phrase.')
    .addSubcommand(sc => sc.setName('add').setDescription('Add a new auto-reply.')
      .addStringOption(o => o.setName('trigger').setDescription('Word or phrase to match').setRequired(true))
      .addStringOption(o => o.setName('response').setDescription('What the bot replies with').setRequired(true))
      .addStringOption(o => o.setName('match_type').setDescription('How the trigger should match').addChoices(
        { name: 'Contains (trigger appears anywhere in the message)', value: 'contains' },
        { name: 'Exact (message must be exactly the trigger)', value: 'exact' }
      ))
      .addBooleanOption(o => o.setName('case_sensitive').setDescription('Match letter case exactly? (default: no)')))
    .addSubcommand(sc => sc.setName('remove').setDescription('Remove an auto-reply.')
      .addStringOption(o => o.setName('id').setDescription('Auto-reply ID (from /autoreply list)').setRequired(true)))
    .addSubcommand(sc => sc.setName('list').setDescription('List all auto-replies configured for this server.'))
    .addSubcommand(sc => sc.setName('toggle').setDescription('Enable or disable a specific auto-reply.')
      .addStringOption(o => o.setName('id').setDescription('Auto-reply ID (from /autoreply list)').setRequired(true))
      .addBooleanOption(o => o.setName('enabled').setDescription('On or off').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    let cfg = await GuildConfig.findOne({ guildId: interaction.guild.id }) || await GuildConfig.create({ guildId: interaction.guild.id });

    if (sub === 'add') {
      if (cfg.autoReplies.length >= 50) {
        return interaction.reply({ embeds: [embeds.error('This server already has 50 auto-replies, which is the limit.')], ephemeral: true });
      }
      const trigger = interaction.options.getString('trigger').trim();
      const response = interaction.options.getString('response').trim();
      if (!trigger || !response) {
        return interaction.reply({ embeds: [embeds.error('Trigger and response cannot be empty.')], ephemeral: true });
      }
      if (response.length > 1900) {
        return interaction.reply({ embeds: [embeds.error('Response is too long (max ~1900 characters).')], ephemeral: true });
      }

      const entry = {
        id: generateId(),
        trigger,
        response,
        matchType: interaction.options.getString('match_type') || 'contains',
        caseSensitive: interaction.options.getBoolean('case_sensitive') || false,
        enabled: true
      };
      cfg.autoReplies.push(entry);
      await cfg.save();
      invalidate(interaction.guild.id);

      await interaction.reply({ embeds: [embeds.success(`Auto-reply added.\n**ID:** \`${entry.id}\`\n**Trigger (${entry.matchType}):** ${trigger}\n**Response:** ${response}`)], ephemeral: true });
    }

    if (sub === 'remove') {
      const id = interaction.options.getString('id');
      const before = cfg.autoReplies.length;
      cfg.autoReplies = cfg.autoReplies.filter(a => a.id !== id);
      if (cfg.autoReplies.length === before) {
        return interaction.reply({ embeds: [embeds.error('No auto-reply found with that ID.')], ephemeral: true });
      }
      await cfg.save();
      invalidate(interaction.guild.id);
      await interaction.reply({ embeds: [embeds.success('Auto-reply removed.')], ephemeral: true });
    }

    if (sub === 'list') {
      if (!cfg.autoReplies.length) {
        return interaction.reply({ embeds: [embeds.info('No auto-replies configured yet. Add one with `/autoreply add`.')], ephemeral: true });
      }
      const embed = embeds.baseEmbed().setTitle('💬 Auto-Replies');
      for (const a of cfg.autoReplies.slice(0, 25)) {
        embed.addFields({
          name: `${a.enabled ? '🟢' : '🔴'} \`${a.id}\`  —  ${a.trigger}`,
          value: `**Match:** ${a.matchType}${a.caseSensitive ? ' (case-sensitive)' : ''}\n**Reply:** ${a.response.slice(0, 200)}`
        });
      }
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'toggle') {
      const id = interaction.options.getString('id');
      const entry = cfg.autoReplies.find(a => a.id === id);
      if (!entry) return interaction.reply({ embeds: [embeds.error('No auto-reply found with that ID.')], ephemeral: true });
      entry.enabled = interaction.options.getBoolean('enabled');
      await cfg.save();
      invalidate(interaction.guild.id);
      await interaction.reply({ embeds: [embeds.success(`Auto-reply \`${id}\` is now **${entry.enabled ? 'enabled' : 'disabled'}**.`)], ephemeral: true });
    }
  }
};
