/**
 * STORE — tiny persistence layer: MongoDB when connected, in-memory otherwise.
 *
 * MongoDB matters on Render's free tier: the instance sleeps after inactivity and
 * loses memory, so reports / API budget / caches should survive in the database.
 */

import mongoose from 'mongoose';

const isMongo = () => mongoose.connection.readyState === 1;

// ─── Models (TTL indexes let MongoDB expire old rows itself) ─────────────────
const reportSchema = new mongoose.Schema({
  phatakId: { type: String, index: true },
  status: { type: String, enum: ['OPEN', 'CLOSED'] },
  trainType: String,
  note: String,
  reporter: String,
  at: { type: Date, default: Date.now, expires: 60 * 60 },
});
const kvSchema = new mongoose.Schema({
  _id: String,
  value: mongoose.Schema.Types.Mixed,
  expiresAt: { type: Date, index: { expires: 0 } },
});

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
const Kv = mongoose.models.Kv || mongoose.model('Kv', kvSchema);

// ─── Memory fallback ──────────────────────────────────────────────────────────
const memReports = [];
const memKv = new Map();

function pruneMemReports() {
  const cutoff = Date.now() - 60 * 60 * 1000;
  while (memReports.length && memReports[0].at < cutoff) memReports.shift();
}

export async function addReport(r) {
  const doc = { ...r, at: Date.now() };
  if (isMongo()) {
    try {
      await Report.create({ ...doc, at: new Date(doc.at) });
      return doc;
    } catch (err) {
      console.error('❌ [store] report write failed, keeping in memory:', err.message);
    }
  }
  memReports.push(doc);
  pruneMemReports();
  return doc;
}

export async function recentReports(phatakId, sinceMs) {
  if (isMongo()) {
    try {
      const rows = await Report.find({ phatakId, at: { $gte: new Date(sinceMs) } }).lean();
      return rows.map((d) => ({ status: d.status, trainType: d.trainType, reporter: d.reporter, at: d.at.getTime() }));
    } catch (err) {
      console.error('❌ [store] report read failed:', err.message);
    }
  }
  pruneMemReports();
  return memReports.filter((r) => r.phatakId === phatakId && r.at >= sinceMs);
}

/** Phatak ids with any report since `sinceMs` (for map colouring). */
export async function reportedPhatakIds(sinceMs) {
  if (isMongo()) {
    try {
      return new Set(await Report.distinct('phatakId', { at: { $gte: new Date(sinceMs) } }));
    } catch { /* fall through */ }
  }
  return new Set(memReports.filter((r) => r.at >= sinceMs).map((r) => r.phatakId));
}

export async function kvGet(key) {
  if (isMongo()) {
    try {
      const d = await Kv.findById(key).lean();
      if (d && (!d.expiresAt || d.expiresAt > new Date())) return d.value;
      return null;
    } catch (err) {
      console.error('❌ [store] kv read failed:', err.message);
    }
  }
  const m = memKv.get(key);
  if (!m) return null;
  if (m.expiresAt && m.expiresAt < Date.now()) {
    memKv.delete(key);
    return null;
  }
  return m.value;
}

export async function kvSet(key, value, ttlMs) {
  const expiresAt = ttlMs ? Date.now() + ttlMs : null;
  if (isMongo()) {
    try {
      await Kv.updateOne(
        { _id: key },
        { $set: { value, expiresAt: expiresAt ? new Date(expiresAt) : null } },
        { upsert: true },
      );
      return;
    } catch (err) {
      console.error('❌ [store] kv write failed:', err.message);
    }
  }
  memKv.set(key, { value, expiresAt });
}

/** Atomic increment (MongoDB) — used for the shared RailRadar call budget. */
export async function kvIncr(key, ttlMs) {
  if (isMongo()) {
    try {
      const d = await Kv.findOneAndUpdate(
        { _id: key },
        { $inc: { value: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + ttlMs) } },
        { upsert: true, new: true },
      ).lean();
      return d.value;
    } catch (err) {
      console.error('❌ [store] kv incr failed:', err.message);
    }
  }
  const cur = (await kvGet(key)) || 0;
  memKv.set(key, { value: cur + 1, expiresAt: Date.now() + ttlMs });
  return cur + 1;
}

export const storeBackend = () => (isMongo() ? 'mongodb' : 'memory');
