const axios = require('axios');

/**
 * Translates text using Google Translate's public web endpoint (the same one
 * translate.google.com's website itself calls) — no API key required.
 * `to` is a language code, e.g. 'ar' for Arabic, 'en' for English.
 */
async function translateText(text, to, from = 'auto') {
  const res = await axios.get('https://translate.googleapis.com/translate_a/single', {
    params: { client: 'gtx', sl: from, tl: to, dt: 't', q: text },
    timeout: 8000
  });
  // Response shape: [[[translatedChunk, originalChunk, ...], ...], ...] — Google splits
  // long text into chunks, so we stitch them back together in order.
  const chunks = res.data?.[0] || [];
  return chunks.map(chunk => chunk[0]).join('');
}

module.exports = { translateText };
