// Storage engine — talks to a real MongoDB database (Atlas or self-hosted) via
// the official native driver. Despite the filename (kept so none of the 50+
// files that do `require('../utils/jsondb')` needed to change), this is a real
// MongoDB-backed store, not local JSON files.
//
// It intentionally does NOT use Mongoose. Every model in this project already
// mutates plain fetched objects and calls `.save()` (e.g. `cfg.welcome.enabled =
// true; await cfg.save()`), which is exactly how the previous local-JSON engine
// worked. Mongoose's change-tracking on loosely-typed/nested documents requires
// `markModified()` calls we'd have to audit into 50+ call sites to avoid silent
// data loss. Using the native driver directly and replicating that same
// fetch-mutate-save contract on top of it keeps identical behavior while
// storing everything in real MongoDB collections.
const { MongoClient } = require('mongodb');

let client = null;
let dbPromise = null;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Establishes the connection. Safe to call multiple times — subsequent calls
// reuse the same in-flight/established connection. Call this once at startup
// (index.js / dashboard/server.js) so a bad connection string fails fast and
// loudly instead of surfacing as a mysterious error on the first command used.
function connect() {
  if (dbPromise) return dbPromise;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    dbPromise = Promise.reject(new Error(
      'MONGODB_URI is not set. Add your MongoDB connection string to .env (see .env.example).'
    ));
    return dbPromise;
  }

  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10_000
  });

  dbPromise = client.connect()
    .then(async (c) => {
      const db = c.db(process.env.MONGODB_DB_NAME || 'vaylex');
      await db.command({ ping: 1 });
      return db;
    })
    .catch((err) => {
      dbPromise = null; // allow a retry on the next call instead of caching a dead rejection forever
      throw err;
    });

  return dbPromise;
}

function getDb() {
  return dbPromise || connect();
}

class Collection {
  constructor(name, defaults = {}) {
    this.name = name;
    this.defaults = defaults;
  }

  async _col() {
    const db = await getDb();
    return db.collection(this.name);
  }

  // Attaches a non-enumerable .save() so callers can mutate the returned
  // object directly (e.g. `cfg.welcome.enabled = true; await cfg.save();`),
  // exactly like the old local-JSON engine, without those helpers leaking
  // into what actually gets written to MongoDB.
  _hydrate(doc) {
    if (!doc) return doc;
    const self = this;
    Object.defineProperty(doc, 'save', {
      enumerable: false,
      configurable: true,
      value: async function () {
        const col = await self._col();
        const { _id, ...rest } = doc;
        await col.updateOne({ _id }, { $set: rest }, { upsert: true });
        return doc;
      }
    });
    return doc;
  }

  find(filter = {}) {
    return new QueryResult(this, filter);
  }

  async findOne(filter = {}) {
    const col = await this._col();
    const doc = await col.findOne(filter);
    return doc ? this._hydrate(doc) : null;
  }

  async findById(id) {
    if (!id) return null;
    return this.findOne({ _id: String(id) });
  }

  async create(data = {}) {
    const doc = { ...deepClone(this.defaults), ...deepClone(data), _id: generateId(), createdAt: new Date().toISOString() };
    const col = await this._col();
    await col.insertOne(doc);
    return this._hydrate(doc);
  }

  async countDocuments(filter = {}) {
    const col = await this._col();
    return col.countDocuments(filter);
  }

  async deleteOne(filter = {}) {
    const col = await this._col();
    const result = await col.deleteOne(filter);
    return { deletedCount: result.deletedCount };
  }

  // Shared by updateOne/findOneAndUpdate. When `update` has no `$operators`,
  // it's treated as a direct $set (mongoose-like convenience), matching the
  // old engine's behavior.
  _normalizeUpdate(update) {
    const hasOperators = Object.keys(update).some(k => k.startsWith('$'));
    return hasOperators ? { ...update } : { $set: update };
  }

  async updateOne(filter = {}, update = {}, opts = {}) {
    const col = await this._col();
    const mongoUpdate = this._normalizeUpdate(update);

    if (opts.upsert) {
      // On insert, fill in full defaults + the filter fields — same as the
      // old engine's upsert behavior — without colliding with any field the
      // update itself already touches (Mongo errors on that overlap).
      const touched = new Set();
      for (const op of ['$set', '$inc', '$addToSet', '$pull', '$push']) {
        if (mongoUpdate[op]) Object.keys(mongoUpdate[op]).forEach(k => touched.add(k.split('.')[0]));
      }
      const base = { ...deepClone(this.defaults), ...deepClone(filter) };
      const setOnInsert = {};
      for (const [k, v] of Object.entries(base)) {
        if (!touched.has(k)) setOnInsert[k] = v;
      }
      if (!touched.has('_id')) setOnInsert._id = generateId();
      if (!touched.has('createdAt')) setOnInsert.createdAt = new Date().toISOString();
      mongoUpdate.$setOnInsert = { ...setOnInsert, ...(mongoUpdate.$setOnInsert || {}) };
    }

    const result = await col.findOneAndUpdate(filter, mongoUpdate, {
      returnDocument: 'after',
      upsert: !!opts.upsert,
      includeResultMetadata: true
    });

    if (!result.value) return { matchedCount: 0 };
    return this._hydrate(result.value);
  }

  async findOneAndUpdate(filter = {}, update = {}, opts = {}) {
    const doc = await this.updateOne(filter, update, opts);
    return doc.matchedCount === 0 ? null : doc;
  }
}

// Thin wrapper so `Model.find(...)` supports the .sort()/.limit() chaining
// this project uses (e.g. Warning.find(...).sort({createdAt:-1}).limit(15)),
// while still being awaitable directly, same as the old local-JSON engine.
class QueryResult {
  constructor(collection, filter) {
    this.collection = collection;
    this.filter = filter;
    this.sortSpec = null;
    this.limitN = null;
  }
  sort(spec) { this.sortSpec = spec; return this; }
  limit(n) { this.limitN = n; return this; }

  async _exec() {
    const col = await this.collection._col();
    let cursor = col.find(this.filter);
    if (this.sortSpec) cursor = cursor.sort(this.sortSpec);
    if (this.limitN != null) cursor = cursor.limit(this.limitN);
    const docs = await cursor.toArray();
    return docs.map(d => this.collection._hydrate(d));
  }
  then(resolve, reject) { return this._exec().then(resolve, reject); }
  catch(reject) { return this._exec().catch(reject); }
}

const registry = new Map();

function model(name, defaults) {
  if (!registry.has(name)) registry.set(name, new Collection(name, defaults));
  return registry.get(name);
}

module.exports = { model, connect, getDb };
