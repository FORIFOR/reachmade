/**
 * Email for inquiries, through Resend, from the Reachmade address.
 *
 * The operator notice carries the whole inquiry and a signed link to the reply page. It has no
 * Reply-To: answering it from a personal inbox would show that personal address to the visitor.
 * Replies to visitors come from INQUIRY_MAIL_FROM with Reply-To INQUIRY_REPLY_TO, a real inbox.
 */
export const DEFAULT_FROM = 'Reachmade <no-reply@reachmade.com>';
export const REPLY_LINK_DAYS = 30;
const topics = { custom: '星藍ノア・共同開発・未定', genie: 'Genie', tasks: 'AI Meeting', oathra: 'Oathra', aisecure: 'AI Secure', 'agent-team': 'Agent Team', launchloom: 'Launchloom',
  interview: 'interview', training: 'training', language: 'language' };
export const topicName = id => topics[id] ?? id;

const enc = new TextEncoder();
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));
const hmacKey = (secret, use) => crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [use]);
const signed = (requestId, exp) => enc.encode(`reachmade-inquiry-reply.v1.${requestId}.${exp}`);

export const replyConfigured = env => typeof env.INQUIRY_REPLY_SECRET === 'string' && env.INQUIRY_REPLY_SECRET.length >= 32;

/** The reply page for one inquiry, valid for REPLY_LINK_DAYS. */
export async function replyLink(env, origin, requestId, now = Date.now()) {
  if (!replyConfigured(env)) return null;
  const exp = Math.floor(now / 1000) + REPLY_LINK_DAYS * 86400;
  const sig = b64url(await crypto.subtle.sign('HMAC', await hmacKey(env.INQUIRY_REPLY_SECRET, 'sign'), signed(requestId, exp)));
  return `${origin}/inquiries/reply/${requestId}?exp=${exp}&sig=${sig}`;
}

/** Checks a reply link in constant time (crypto.subtle.verify). */
export async function verifyReplyLink(secret, requestId, exp, sig, now = Date.now()) {
  if (!/^\d{1,12}$/.test(exp ?? '') || !/^[A-Za-z0-9_-]{43}$/.test(sig ?? '') || Number(exp) * 1000 <= now) return false;
  try { return await crypto.subtle.verify('HMAC', await hmacKey(secret, 'verify'), unb64url(sig), signed(requestId, Number(exp))); }
  catch { return false; }
}

async function send(env, fetcher, message, idempotencyKey) {
  const response = await fetcher('https://api.resend.com/emails', { method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(8000),
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ from: env.INQUIRY_MAIL_FROM || DEFAULT_FROM, ...message }) });
  await response.body?.cancel();
  if (!response.ok) throw new Error(`Resend HTTP ${response.status}`);
}

export const noticeConfigured = env => !!env.RESEND_API_KEY && !!env.INQUIRY_NOTIFY_TO;

export function noticeText(lead, receipt, link) {
  return `受付番号: ${receipt}\nお名前: ${lead.name}\nメール: ${lead.email}\n会社・団体: ${lead.organization || '（なし）'}\n相談の対象: ${topicName(lead.useCase)}\n言語: ${lead.language === 'en' ? '英語' : '日本語'}\n\n${lead.message}\n\n`
    + (link ? `返信はこちらから（no-reply@reachmade.com から送ります。このメールには返信しないでください）:\n${link}\n` : '返信ページが設定されていません。このメールに返信すると、あなたのアドレスから相手に届きます。\n');
}

export async function sendNotice(env, lead, receipt, link, fetcher = fetch) {
  await send(env, fetcher, { to: [env.INQUIRY_NOTIFY_TO], subject: `新しい問い合わせ ${receipt}`, text: noticeText(lead, receipt, link),
    ...(link ? {} : { reply_to: lead.email }) }, `inquiry-notice-${receipt}`);
}

export function replyMessage(inquiry, text) {
  const en = inquiry.language === 'en';
  const quoted = inquiry.message.split(/\r?\n/).map(line => `> ${line}`).join('\n');
  return en
    ? { subject: `Re: Your inquiry to Reachmade (${inquiry.receipt})`, text: `${text.trim()}\n\n--\nReachmade\nhttps://reachmade.com/en/\nYou can reply to this email.\n\n— Your inquiry (${inquiry.receipt}) —\n${quoted}\n` }
    : { subject: `Re: Reachmade へのお問い合わせ（受付番号 ${inquiry.receipt}）`, text: `${text.trim()}\n\n--\nReachmade\nhttps://reachmade.com/\nこのメールにそのまま返信できます。\n\n―― お問い合わせ内容（受付番号 ${inquiry.receipt}）――\n${quoted}\n` };
}

export async function sendReply(env, inquiry, text, nonce, fetcher = fetch) {
  await send(env, fetcher, { to: [inquiry.email], ...(env.INQUIRY_REPLY_TO ? { reply_to: env.INQUIRY_REPLY_TO } : {}), ...replyMessage(inquiry, text) },
    `inquiry-reply-${inquiry.requestId}-${nonce}`);
}
