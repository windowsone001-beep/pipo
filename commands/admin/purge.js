const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { logModAction } = require('../../utils/modLogger');

module.exports = {
  category: 'Administration',
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages in this channel.')
    .addIntegerOption(o => o.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o => o.setName('user').setDescription('Only delete messages from this user'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const user = interaction.options.getUser('user');
    await interaction.deferReply({ ephemeral: true });

    let messages = await interaction.channel.messages.fetch({ limit: amount });
    if (user) messages = messages.filter(m => m.author.id === user.id);

    const deleted = await interaction.channel.bulkDelete(messages, true).catch(() => null);
    await logModAction(interaction.guild, { userId: user?.id || 'N/A', moderatorId: interaction.user.id, action: 'purge', reason: `Purged ${deleted?.size ?? 0} messages in #${interaction.channel.name}` });

    await interaction.editReply({ embeds: [embeds.success(`Deleted **${deleted?.size ?? 0}** messages.`)] });
  }
};
