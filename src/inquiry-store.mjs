/**
 * Inquiries stored in Cloudflare D1 (binding `INQUIRIES`). See migrations/0001_inquiries.sql.
 *
 * D1 has no interactive transactions, so every step that must not race is one statement:
 * the daily limits are an upsert that only increments below the cap, the inquiry is an insert
 * that does nothing on a duplicate retry ID, and a reply is an insert guarded by its nonce.
 */
export const RETENTION_DAYS = 90;
export const DAILY_TOTAL = 100;
export const DAILY_PER_EMAIL = 3;
export const REPLIES_PER_INQUIRY = 20;
const DAY = 86400000;

export class StoreError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}

async function sha256(text) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}
function newReceipt() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return 'RM-' + [...bytes].map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function inquiryStore(db, now = Date.now) {
  const take = async (day, k, cap) => (await db.prepare(
    'INSERT INTO inquiry_usage (day, k, n) VALUES (?1, ?2, 1) ON CONFLICT (day, k) DO UPDATE SET n = n + 1 WHERE n < ?3 RETURNING n'
  ).bind(day, k, cap).first()) !== null;
  const give = (day, k) => db.prepare('UPDATE inquiry_usage SET n = n - 1 WHERE day = ?1 AND k = ?2 AND n > 0').bind(day, k).run();

  return {
    /** Stores a parsed inquiry. `created` is false for a retry of one already stored. */
    async create(lead) {
      const { requestId, website, consent, ...content } = lead;
      const fingerprint = await sha256(JSON.stringify(content));
      const existing = await db.prepare('SELECT receipt, fingerprint FROM inquiries WHERE request_id = ?1').bind(requestId).first();
      if (existing) {
        if (existing.fingerprint !== fingerprint) throw new StoreError(409, 'REQUEST_CONFLICT');
        return { receipt: existing.receipt, created: false };
      }
      const at = now(), day = new Date(at).toISOString().slice(0, 10), who = await sha256(lead.email.toLowerCase());
      if (!(await take(day, '*', DAILY_TOTAL))) throw new StoreError(429, 'CAPACITY');
      if (!(await take(day, who, DAILY_PER_EMAIL))) { await give(day, '*'); throw new StoreError(429, 'CAPACITY'); }
      const receipt = newReceipt();
      const row = await db.prepare(
        `INSERT INTO inquiries (request_id, receipt, name, email, organization, use_case, message, language, fingerprint, created_at, expires_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11) ON CONFLICT (request_id) DO NOTHING RETURNING receipt`
      ).bind(requestId, receipt, lead.name, lead.email, lead.organization, lead.useCase, lead.message, lead.language, fingerprint, at, at + RETENTION_DAYS * DAY).first();
      if (row) return { receipt: row.receipt, created: true };
      // A concurrent retry with the same ID won the insert: hand back its receipt, return the quota.
      await give(day, who); await give(day, '*');
      const winner = await db.prepare('SELECT receipt, fingerprint FROM inquiries WHERE request_id = ?1').bind(requestId).first();
      if (!winner || winner.fingerprint !== fingerprint) throw new StoreError(409, 'REQUEST_CONFLICT');
      return { receipt: winner.receipt, created: false };
    },

    async noticed(requestId, outcome) {
      await db.prepare('UPDATE inquiries SET notice = ?2 WHERE request_id = ?1').bind(requestId, outcome).run();
    },

    /** One inquiry with its replies, or null once it has expired or been removed. */
    async get(requestId) {
      const row = await db.prepare(
        'SELECT request_id, receipt, name, email, organization, use_case, message, language, created_at, status FROM inquiries WHERE request_id = ?1 AND expires_at > ?2'
      ).bind(requestId, now()).first();
      if (!row) return null;
      const { results } = await db.prepare('SELECT nonce, text, at FROM inquiry_replies WHERE request_id = ?1 ORDER BY at').bind(requestId).all();
      return { requestId: row.request_id, receipt: row.receipt, name: row.name, email: row.email, organization: row.organization, useCase: row.use_case,
        message: row.message, language: row.language, createdAt: row.created_at, status: row.status, replies: results ?? [] };
    },

    /** Claims a reply before it is sent: 'reserved', 'duplicate' (same nonce, already claimed) or 'full'. */
    async reserve(requestId, { nonce, text, at }) {
      const row = await db.prepare(
        `INSERT INTO inquiry_replies (request_id, nonce, text, at)
         SELECT ?1, ?2, ?3, ?4 WHERE (SELECT COUNT(*) FROM inquiry_replies WHERE request_id = ?1) < ?5
         ON CONFLICT (request_id, nonce) DO NOTHING RETURNING nonce`
      ).bind(requestId, nonce, text, at, REPLIES_PER_INQUIRY).first();
      if (row) { await db.prepare("UPDATE inquiries SET status = 'replied' WHERE request_id = ?1").bind(requestId).run(); return 'reserved'; }
      const same = await db.prepare('SELECT 1 AS hit FROM inquiry_replies WHERE request_id = ?1 AND nonce = ?2').bind(requestId, nonce).first();
      return same ? 'duplicate' : 'full';
    },

    /** Gives back a claimed reply whose email was not accepted. */
    async release(requestId, nonce) {
      await db.prepare('DELETE FROM inquiry_replies WHERE request_id = ?1 AND nonce = ?2').bind(requestId, nonce).run();
      await db.prepare("UPDATE inquiries SET status = 'new' WHERE request_id = ?1 AND NOT EXISTS (SELECT 1 FROM inquiry_replies WHERE request_id = ?1)").bind(requestId).run();
    },

    /** Removes expired inquiries, their replies and old daily counters. */
    async sweep() {
      const at = now(), cutoff = new Date(at - 2 * DAY).toISOString().slice(0, 10);
      await db.batch([
        db.prepare('DELETE FROM inquiry_replies WHERE request_id IN (SELECT request_id FROM inquiries WHERE expires_at <= ?1)').bind(at),
        db.prepare('DELETE FROM inquiries WHERE expires_at <= ?1').bind(at),
        db.prepare('DELETE FROM inquiry_usage WHERE day < ?1').bind(cutoff),
      ]);
    },
  };
}
