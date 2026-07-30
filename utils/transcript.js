const discordTranscripts = require('discord-html-transcripts');

/**
 * Generates an HTML transcript attachment for a ticket channel.
 * Returns a Discord AttachmentBuilder that can be sent directly or saved.
 */
async function generateTranscript(channel, ticketNumber) {
  const attachment = await discordTranscripts.createTranscript(channel, {
    limit: -1,
    returnType: 'attachment',
    filename: `ticket-${ticketNumber}.html`,
    saveImages: true,
    footerText: 'Exported {number} message(s) — MineCore Manager'
  });
  return attachment;
}

module.exports = { generateTranscript };
