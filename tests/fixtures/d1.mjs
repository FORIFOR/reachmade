// A Cloudflare D1 stand-in over Node's built-in SQLite, with the real migration applied.
// Only the D1 calls this site uses: prepare().bind().first()/run()/all() and batch().
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

export function testD1({ failOn } = {}) {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(readFileSync(new URL('../../migrations/0001_inquiries.sql', import.meta.url), 'utf8'));
  const statement = (sql, args = []) => ({
    sql, args,
    bind: (...values) => statement(sql, values),
    first: async () => { if (failOn?.test(sql)) throw new Error('D1 unavailable'); return db.prepare(sql).get(...args) ?? null; },
    run: async () => { if (failOn?.test(sql)) throw new Error('D1 unavailable'); db.prepare(sql).run(...args); return { success: true }; },
    all: async () => { if (failOn?.test(sql)) throw new Error('D1 unavailable'); return { results: db.prepare(sql).all(...args) }; },
  });
  return {
    sqlite: db,
    prepare: sql => statement(sql),
    batch: async statements => {
      db.exec('BEGIN');
      try { for (const s of statements) db.prepare(s.sql).run(...s.args); db.exec('COMMIT'); }
      catch (error) { db.exec('ROLLBACK'); throw error; }
      return statements.map(() => ({ success: true }));
    },
  };
}
