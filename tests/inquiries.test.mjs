import test from 'node:test';
import assert from 'node:assert/strict';
import { handleInquiry, parseInquiry, SITE_ORIGIN } from '../src/inquiries.mjs';
import { inquiryStore, DAILY_PER_EMAIL, RETENTION_DAYS } from '../src/inquiry-store.mjs';
import { testD1 } from './fixtures/d1.mjs';

const valid = (patch = {}) => ({ requestId: '12345678-1234-4123-8123-123456789abc', name: 'Test visitor', email: 'qa@example.invalid', organization: '', useCase: 'custom', message: 'Synthetic test inquiry only.', consent: true, website: '', language: 'en', ...patch });
const req = (body = valid(), init = {}) => new Request(SITE_ORIGIN + '/api/inquiries', { method: 'POST', headers: { Origin: SITE_ORIGIN, 'Content-Type': 'application/json' }, body: JSON.stringify(body), ...init });
const SECRET = 'x'.repeat(40);
const env = (db = testD1(), patch = {}) => ({ INQUIRIES: db, RESEND_API_KEY: 'k', INQUIRY_NOTIFY_TO: 'owner@example.invalid', INQUIRY_REPLY_SECRET: SECRET, INQUIRY_REPLY_TO: 'inbox@example.invalid', ...patch });
const mail = () => { const sent = []; const fetcher = async (url, init) => { sent.push({ url, init, body: JSON.parse(init.body) }); return new Response('{}', { status: 200 }); }; return { sent, fetcher }; };
const noMail = () => assert.fail('must not send email');
const id = n => `12345678-1234-4123-8123-12345678${String(n).padStart(4, '0')}`;

test('validation creates a normalized copy and preserves idempotency fields', () => { const x = valid(); x.name = ' Test '; const y = parseInquiry(x); assert.equal(x.name, ' Test '); assert.equal(y.name, 'Test'); assert.equal(x.requestId, y.requestId); });
test('rejects consent, honeypot, arbitrary fields and invalid contact data', () => { for (const patch of [{ consent: false }, { website: 'bot' }, { unexpected: 'field' }, { email: 'bad' }, { message: 'short' }, { language: 'fr' }, { requestId: 'bad' }, { useCase: 'unknown' }, { name: 'a\u0000b' }]) assert.throws(() => parseInquiry({ ...valid(), ...patch })); });
test('unrelated routes remain untouched', async () => assert.equal(await handleInquiry(new Request(SITE_ORIGIN + '/products/'), env(), { fetcher: noMail }), null));
test('requires the real exact site origin for private submissions', async () => { for (const origin of ['https://evil.example', 'null', 'https://reachmade.com.evil.example']) assert.equal((await handleInquiry(req(valid(), { headers: { Origin: origin, 'Content-Type': 'application/json' } }), env(), { fetcher: noMail })).status, 403); });
test('rejects query strings and cross-site requests', async () => { const a = new Request(req(), { headers: { Origin: SITE_ORIGIN, 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'cross-site' } }); assert.equal((await handleInquiry(a, env(), { fetcher: noMail })).status, 403); assert.equal((await handleInquiry(new Request(SITE_ORIGIN + '/api/inquiries?target=evil', { method: 'POST' }), env(), { fetcher: noMail })).status, 403); });
test('rejects unapproved request methods and encodings', async () => { assert.equal((await handleInquiry(new Request(SITE_ORIGIN + '/api/inquiries'), env(), { fetcher: noMail })).status, 405); assert.equal((await handleInquiry(req(valid(), { headers: { Origin: SITE_ORIGIN, 'Content-Type': 'text/plain' } }), env(), { fetcher: noMail })).status, 415); });
test('stream limit holds without Content-Length and truncated JSON fails', async () => { for (const [body, status] of [['x'.repeat(9000), 413], ['{', 400]]) { const r = req(); const incoming = new Request(r.url, { method: 'POST', headers: r.headers, body }); assert.equal((await handleInquiry(incoming, env(), { fetcher: noMail })).status, status); } });

test('status and intake fail closed until storage and the operator notice are configured', async () => {
  const status = e => handleInquiry(new Request(SITE_ORIGIN + '/api/inquiries/status'), e, { fetcher: noMail });
  assert.equal((await status(env())).status, 200);
  for (const missing of ['INQUIRIES', 'RESEND_API_KEY', 'INQUIRY_NOTIFY_TO']) {
    const e = env(); delete e[missing];
    assert.equal((await status(e)).status, 503);
    assert.equal((await handleInquiry(req(), e, { fetcher: noMail })).status, 503);
  }
});

test('stores the inquiry, then emails the operator once with a reply link and no visitor Reply-To', async () => {
  const db = testD1(), { sent, fetcher } = mail();
  const incoming = req(valid(), { headers: { Origin: SITE_ORIGIN, 'Content-Type': 'application/json', Cookie: 'private', 'CF-Connecting-IP': '1.2.3.4' } });
  const out = await handleInquiry(incoming, env(db), { fetcher, now: () => 1_800_000_000_000 });
  assert.equal(out.status, 201); assert.equal(out.headers.get('Cache-Control'), 'no-store');
  const { receipt } = await out.json(); assert.match(receipt, /^RM-[A-F\d]{8}$/);
  const row = db.sqlite.prepare('SELECT * FROM inquiries').get();
  assert.equal(row.email, 'qa@example.invalid'); assert.equal(row.notice, 'sent'); assert.equal(row.expires_at, 1_800_000_000_000 + RETENTION_DAYS * 86400000);
  assert.equal(JSON.stringify(row).includes('1.2.3.4'), false);
  assert.equal(sent.length, 1);
  const { url, init, body } = sent[0];
  assert.equal(url, 'https://api.resend.com/emails'); assert.equal(init.headers['Idempotency-Key'], `inquiry-notice-${receipt}`);
  assert.deepEqual(body.to, ['owner@example.invalid']); assert.equal(body.from, 'Reachmade <no-reply@reachmade.com>');
  assert.equal('reply_to' in body, false);
  assert.match(body.text, new RegExp(`${SITE_ORIGIN}/inquiries/reply/${valid().requestId}\\?exp=\\d+&sig=[\\w-]{43}`));
  for (const field of ['Test visitor', 'qa@example.invalid', 'Synthetic test inquiry only.', receipt]) assert.ok(body.text.includes(field));
});

test('a retry returns the same receipt without a second email; a changed body is a conflict', async () => {
  const db = testD1(), { sent, fetcher } = mail();
  const a = await (await handleInquiry(req(), env(db), { fetcher })).json();
  const b = await (await handleInquiry(req(), env(db), { fetcher })).json();
  assert.equal(a.receipt, b.receipt); assert.equal(sent.length, 1);
  const c = await handleInquiry(req(valid({ message: 'A different inquiry body' })), env(db), { fetcher });
  assert.equal(c.status, 409); assert.deepEqual(await c.json(), { error: 'REQUEST_CONFLICT' });
});

test('keeps the receipt when the operator email fails and records the failure', async () => {
  const db = testD1(), error = console.error; console.error = () => {};
  try {
    const r = await handleInquiry(req(), env(db), { fetcher: async () => new Response('{}', { status: 500 }) });
    assert.equal(r.status, 201);
    assert.equal(db.sqlite.prepare('SELECT notice FROM inquiries').get().notice, 'failed');
  } finally { console.error = error; }
});

test('limits each email per day and returns the quota when a limit is hit', async () => {
  const db = testD1(), { fetcher } = mail();
  for (let n = 0; n < DAILY_PER_EMAIL; n++) assert.equal((await handleInquiry(req(valid({ requestId: id(n) })), env(db), { fetcher })).status, 201);
  const over = await handleInquiry(req(valid({ requestId: id(9) })), env(db), { fetcher });
  assert.equal(over.status, 429); assert.deepEqual(await over.json(), { error: 'CAPACITY' });
  assert.equal(db.sqlite.prepare("SELECT n FROM inquiry_usage WHERE k = '*'").get().n, DAILY_PER_EMAIL);
  assert.equal((await handleInquiry(req(valid({ requestId: id(10), email: 'other@example.invalid' })), env(db), { fetcher })).status, 201);
});

test('storage failures fail closed without leaking details', async () => {
  const error = console.error; console.error = () => {};
  try {
    const r = await handleInquiry(req(), env(testD1({ failOn: /INSERT INTO inquiries/ })), { fetcher: noMail });
    assert.equal(r.status, 503); assert.deepEqual(await r.json(), { error: 'UNAVAILABLE' });
  } finally { console.error = error; }
});

test('the daily cleanup removes expired inquiries with their replies and old counters', async () => {
  const db = testD1(); let t = 0; const store = inquiryStore(db, () => t);
  const { receipt } = await store.create(parseInquiry(valid()));
  assert.match(receipt, /^RM-/);
  assert.equal(await store.reserve(valid().requestId, { nonce: id(1), text: 'hi', at: 1 }), 'reserved');
  t = RETENTION_DAYS * 86400000 - 1; await store.sweep();
  assert.ok(await store.get(valid().requestId));
  t = RETENTION_DAYS * 86400000; assert.equal(await store.get(valid().requestId), null);
  await store.sweep();
  for (const table of ['inquiries', 'inquiry_replies', 'inquiry_usage']) assert.equal(db.sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n, 0, table);
});
