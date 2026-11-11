import test from 'node:test';
import assert from 'node:assert/strict';
import { handleReply, SITE_ORIGIN } from '../src/inquiry-reply.mjs';
import { replyLink, verifyReplyLink, replyMessage } from '../src/inquiry-mail.mjs';
import { inquiryStore, REPLIES_PER_INQUIRY } from '../src/inquiry-store.mjs';
import { parseInquiry } from '../src/inquiries.mjs';
import { testD1 } from './fixtures/d1.mjs';
import worker from '../worker.js';

const ID = '12345678-1234-4123-8123-123456789abc';
const SECRET = 'x'.repeat(40);
const lead = (patch = {}) => parseInquiry({ requestId: ID, name: '山田 <b>太郎</b>', email: 'asker@example.invalid', organization: '', useCase: 'genie', message: 'Genie を試したいです。\n2行目', consent: true, website: '', language: 'ja', ...patch });
async function setup(patch = {}) {
  const db = testD1(); await inquiryStore(db).create(lead(patch));
  return { db, env: { INQUIRIES: db, RESEND_API_KEY: 'k', INQUIRY_NOTIFY_TO: 'owner@example.invalid', INQUIRY_REPLY_SECRET: SECRET, INQUIRY_REPLY_TO: 'inbox@example.invalid' } };
}
const link = async (now = Date.now()) => new URL(await replyLink({ INQUIRY_REPLY_SECRET: SECRET }, SITE_ORIGIN, ID, now));
const nonceOf = html => /name="nonce" value="([^"]+)"/.exec(html)[1];
const post = (url, body, headers = {}) => new Request(url, { method: 'POST', headers: { Origin: SITE_ORIGIN, 'Content-Type': 'application/x-www-form-urlencoded', ...headers }, body: new URLSearchParams(body).toString() });
const mail = () => { const sent = []; return { sent, fetcher: async (_url, init) => { sent.push({ init, body: JSON.parse(init.body) }); return new Response('{}'); } }; };
const quiet = async fn => { const e = console.error; console.error = () => {}; try { return await fn(); } finally { console.error = e; } };

test('links are signed per inquiry and reject tampering, other inquiries, other keys and expiry', async () => {
  const now = 1_800_000_000_000, url = await link(now), exp = url.searchParams.get('exp'), sig = url.searchParams.get('sig');
  assert.equal(url.pathname, `/inquiries/reply/${ID}`);
  assert.equal(await verifyReplyLink(SECRET, ID, exp, sig, now), true);
  assert.equal(await verifyReplyLink(SECRET, ID.replace('abc', 'abd'), exp, sig, now), false);
  assert.equal(await verifyReplyLink(SECRET, ID, String(Number(exp) + 1), sig, now), false);
  assert.equal(await verifyReplyLink('y'.repeat(40), ID, exp, sig, now), false);
  assert.equal(await verifyReplyLink(SECRET, ID, exp, sig, Number(exp) * 1000), false);
  assert.equal(await replyLink({ INQUIRY_REPLY_SECRET: 'short' }, SITE_ORIGIN, ID), null);
});

test('the page shows the inquiry escaped, privately, and refuses without a valid link', async () => {
  const { env, db } = await setup();
  const ok = await handleReply(new Request(await link()), env);
  assert.equal(ok.status, 200);
  const html = await ok.text();
  assert.ok(html.includes('山田 &lt;b&gt;太郎&lt;/b&gt;')); assert.equal(html.includes('<b>太郎'), false);
  assert.ok(html.includes('asker@example.invalid')); assert.ok(html.includes('contact@reachmade.com から送ります')); assert.equal(html.includes('no-reply'), false); assert.ok(html.includes('お問い合わせいただき、ありがとうございます'));
  assert.equal(/<script/i.test(html), false);
  assert.match(ok.headers.get('Content-Security-Policy'), /default-src 'none'/); assert.match(ok.headers.get('Content-Security-Policy'), /form-action 'self'/);
  assert.equal(ok.headers.get('X-Robots-Tag'), 'noindex, nofollow'); assert.equal(ok.headers.get('Cache-Control'), 'no-store');
  const bad = await link(); bad.searchParams.set('sig', 'A'.repeat(43));
  assert.equal((await handleReply(new Request(bad), env)).status, 403);
  assert.equal((await handleReply(new Request(`${SITE_ORIGIN}/inquiries/reply/${ID}`), env)).status, 403);
  assert.equal((await handleReply(new Request((await link()).toString().replace(SITE_ORIGIN, 'https://reachmade.workers.dev')), env)).status, 403);
  db.sqlite.exec('DELETE FROM inquiries');
  assert.equal((await handleReply(new Request(await link()), env)).status, 404);
  assert.equal((await handleReply(new Request(await link()), { ...env, INQUIRY_REPLY_SECRET: undefined })).status, 503);
  assert.equal(await handleReply(new Request(`${SITE_ORIGIN}/inquiries/`), env), null);
});

test('sends one reply to the visitor from the Reachmade address and ignores a double submit', async () => {
  const { env, db } = await setup(), { sent, fetcher } = mail();
  const nonce = nonceOf(await (await handleReply(new Request(await link()), env)).text());
  for (let i = 0; i < 2; i++) {
    const r = await handleReply(post(await link(), { nonce, text: '山田様\r\n\r\n資料をお送りします。' }), env, { fetcher, now: () => 5_000 });
    assert.equal(r.status, 200); assert.ok((await r.text()).includes('送信しました'));
  }
  assert.equal(sent.length, 1);
  const { init, body } = sent[0];
  assert.deepEqual(body.to, ['asker@example.invalid']); assert.equal(body.from, 'Reachmade <contact@reachmade.com>'); assert.equal(body.reply_to, 'inbox@example.invalid');
  assert.equal(init.headers['Idempotency-Key'], `inquiry-reply-${ID}-${nonce}`);
  assert.ok(body.subject.includes('RM-')); assert.ok(body.text.startsWith('山田様\n\n資料をお送りします。')); assert.ok(body.text.includes('> Genie を試したいです。'));
  assert.deepEqual(db.sqlite.prepare('SELECT nonce, text, at FROM inquiry_replies').all().map(r => ({ ...r })), [{ nonce, text: '山田様\n\n資料をお送りします。', at: 5_000 }]);
  assert.equal(db.sqlite.prepare('SELECT status FROM inquiries').get().status, 'replied');
});

test('a failed send keeps the draft and the nonce, and frees the slot', async () => {
  const { env, db } = await setup(), nonce = crypto.randomUUID();
  const url = await link();
  const html = await (await quiet(() => handleReply(post(url, { nonce, text: '下書き本文' }), env, { fetcher: async () => new Response('{}', { status: 500 }) }))).text();
  assert.ok(html.includes('送信できませんでした')); assert.ok(html.includes('下書き本文')); assert.equal(nonceOf(html), nonce);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM inquiry_replies').get().n, 0);
  assert.equal(db.sqlite.prepare('SELECT status FROM inquiries').get().status, 'new');
});

test('refuses cross-site posts, wrong encodings, bad nonces, empty and oversized replies', async () => {
  const { env } = await setup(), { sent, fetcher } = mail(), url = await link(), body = { nonce: crypto.randomUUID(), text: 'hello' };
  assert.equal((await handleReply(post(url, body, { Origin: 'https://evil.example' }), env, { fetcher })).status, 403);
  assert.equal((await handleReply(post(url, body, { Origin: 'null' }), env, { fetcher })).status, 403);
  assert.equal((await handleReply(post(url, body, { 'Sec-Fetch-Site': 'cross-site' }), env, { fetcher })).status, 403);
  assert.equal((await handleReply(new Request(url, { method: 'POST', headers: { Origin: SITE_ORIGIN, 'Content-Type': 'application/json' }, body: '{}' }), env, { fetcher })).status, 415);
  assert.equal((await handleReply(post(url, { ...body, nonce: 'x' }), env, { fetcher })).status, 400);
  assert.ok((await (await handleReply(post(url, { ...body, text: '   ' }), env, { fetcher })).text()).includes('1〜5,000文字'));
  assert.ok((await (await handleReply(post(url, { ...body, text: 'x'.repeat(5001) }), env, { fetcher })).text()).includes('1〜5,000文字'));
  const expired = new URL(url); expired.searchParams.set('exp', '1');
  assert.equal((await handleReply(post(expired, body), env, { fetcher })).status, 403);
  assert.equal(sent.length, 0);
});

test('stops at the per-inquiry reply limit', async () => {
  const { env, db } = await setup(), { sent, fetcher } = mail(), store = inquiryStore(db);
  for (let i = 0; i < REPLIES_PER_INQUIRY; i++) assert.equal(await store.reserve(ID, { nonce: `n${i}`, text: 't', at: i }), 'reserved');
  const html = await (await handleReply(post(await link(), { nonce: crypto.randomUUID(), text: 'one more' }), env, { fetcher })).text();
  assert.ok(html.includes('これ以上返信できません')); assert.equal(sent.length, 0);
});

test('replies are written in the visitor language', () => {
  const inquiry = { receipt: 'RM-1234ABCD', message: 'Hi', language: 'en' };
  assert.equal(replyMessage(inquiry, 'Hello').subject, 'Re: Your inquiry to Reachmade (RM-1234ABCD)');
  assert.equal(replyMessage({ ...inquiry, language: 'ja' }, 'こんにちは').subject, 'Re: Reachmade へのお問い合わせ（受付番号 RM-1234ABCD）');
});

test('the worker routes the reply page before static assets and runs the daily cleanup', async () => {
  const { env, db } = await setup(), assets = { fetch: async () => assert.fail('must not reach assets') };
  const r = await worker.fetch(new Request(await link()), { ...env, ASSETS: assets });
  assert.equal(r.status, 200); assert.match(r.headers.get('Content-Type'), /text\/html/);
  db.sqlite.exec('UPDATE inquiries SET expires_at = 0');
  await worker.scheduled({}, { ...env, ASSETS: assets });
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM inquiries').get().n, 0);
});
