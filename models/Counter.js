const { model } = require('../utils/jsondb');

// Generic incrementing counter (used for ticket numbers, etc), keyed per guild+scope.
const Counter = model('Counter', { key: null, seq: 0 });

async function nextSeq(key) {
  const doc = await Counter.findOneAndUpdate({ key }, { $inc: { seq: 1 } }, { upsert: true });
  return doc.seq;
}

module.exports = { Counter, nextSeq };
