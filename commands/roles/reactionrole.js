const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const GuildConfig = require('../../models/GuildConfig');
const { invalidate } = require('../../utils/getGuildConfig');

module.exports = {
  category: 'Self Roles',
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Attach a reaction role to an existing message.')
    .addStringOption(o => o.setName('message_id').setDescription('The message ID to attach the reaction to').setRequired(true))
    .addStringOption(o => o.setName('emoji').setDescription('The emoji to react with').setRequired(true))
    .addRoleOption(o => o.setName('role').setDescription('The role to grant').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Channel the message is in (defaults to this channel)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    const messageId = interaction.options.getString('message_id');
    const emoji = interaction.options.getString('emoji');
    const role = interaction.options.getRole('role');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    const message = await channel.messages.fetch(messageId).catch(() => null);
    if (!message) return interaction.reply({ embeds: [embeds.error('Message not found in that channel.')], ephemeral: true });

    await message.react(emoji).catch(() => {
      return interaction.reply({ embeds: [embeds.error('I could not react with that emoji — make sure it is a valid unicode emoji or one from this server.')], ephemeral: true });
    });

    let cfg = await GuildConfig.findOne({ guildId: interaction.guild.id }) || await GuildConfig.create({ guildId: interaction.guild.id });
    let panel = cfg.selfRoles.find(p => p.messageId === messageId && p.type === 'reaction');
    if (!panel) {
      panel = { messageId, channelId: channel.id, type: 'reaction', roles: [] };
      cfg.selfRoles.push(panel);
    }
    panel.roles.push({ roleId: role.id, label: role.name, emoji });
    await cfg.save();
    invalidate(interaction.guild.id);

    await interaction.reply({ embeds: [embeds.success(`Reacting with ${emoji} on that message now grants **${role.name}**.`)], ephemeral: true });
  }
};
