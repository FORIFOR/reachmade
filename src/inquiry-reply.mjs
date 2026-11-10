/**
 * The operator's reply page: /inquiries/reply/<requestId>?exp=…&sig=…
 *
 * The signed link from the notice email is the only credential. It opens one inquiry and
 * nothing else, and it expires. The page is private (noindex, no-store, no referrer to other
 * sites) and only same-origin posts can send. No cookies, no scripts.
 */
import { replyConfigured, verifyReplyLink, sendReply, topicName, noticeConfigured } from './inquiry-mail.mjs';
import { inquiryStore } from './inquiry-store.mjs';

export const SITE_ORIGIN = 'https://reachmade.com';
const PATH = /^\/inquiries\/reply\/([a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12})\/?$/i;
const UUID = /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i;
const MAX_REPLY = 5000;

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = ms => new Date(ms).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const STYLE = `:root{color-scheme:light;--paper:#f6f5f0;--surface:#fff;--ink:#20251f;--muted:#5d635a;--rule:#d9dbd3;--panel:#25372e;--ok:#25603f;--warn:#a2321a}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.75 Inter,"Helvetica Neue","Hiragino Kaku Gothic ProN","Noto Sans CJK JP",Meiryo,sans-serif}
main{width:min(760px,100% - 32px);margin:0 auto;padding:clamp(28px,5vw,56px) 0 72px}.brand{font-size:13px;letter-spacing:.08em;color:var(--muted);margin:0 0 18px}
h1{font-size:clamp(22px,3vw,28px);font-weight:650;letter-spacing:-.02em;line-height:1.35;margin:0 0 6px}.sub{color:var(--muted);font-size:14px;margin:0 0 24px}
section{background:var(--surface);border:1px solid var(--rule);padding:clamp(16px,3vw,24px);margin:0 0 16px}h2{font-size:15px;margin:0 0 12px}
dl{display:grid;grid-template-columns:7.5em 1fr;gap:4px 12px;margin:0 0 14px;font-size:14px}dt{color:var(--muted)}dd{margin:0;overflow-wrap:anywhere}
.msg{white-space:pre-wrap;overflow-wrap:anywhere;word-break:normal;border-left:2px solid var(--rule);padding-left:14px;margin:0}
label{display:block;font-weight:600;margin:0 0 8px}textarea{display:block;width:100%;min-height:240px;font:inherit;color:inherit;background:var(--surface);border:1px solid #9a9d95;border-radius:0;padding:12px;resize:vertical}
textarea:focus-visible,button:focus-visible{outline:2px solid var(--panel);outline-offset:2px}.hint{color:var(--muted);font-size:13px;margin:10px 0 16px}
button{font:inherit;font-weight:600;color:#fff;background:var(--panel);border:1px solid var(--panel);border-radius:0;padding:10px 26px;cursor:pointer}button:hover{background:#1a2822}
.ok{border-color:var(--ok)}.ok p{color:var(--ok);font-weight:600;margin:0}.warn{color:var(--warn);font-weight:600;margin:0 0 12px}.past .msg{margin:4px 0 16px;font-size:14px}.past time{color:var(--muted);font-size:13px}
@media (forced-colors:active){button{border:1px solid ButtonText}}@media (max-width:480px){dl{grid-template-columns:6em 1fr}}`;

const headers = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'same-origin', 'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'; upgrade-insecure-requests" };
const page = (body, status = 200) => new Response(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>お問い合わせへの返信 · Reachmade</title><style>${STYLE}</style></head><body><main><p class="brand">REACHMADE</p>${body}</main></body></html>`, { status, headers });
const notice = (title, text, status) => page(`<h1>${esc(title)}</h1><p class="sub">${esc(text)}</p>`, status);

function view(inquiry, action, state = {}) {
  const en = inquiry.language === 'en';
  const greeting = en ? `Dear ${inquiry.name},\n\nThank you for contacting Reachmade.\n\n` : `${inquiry.name} 様\n\nお問い合わせいただき、ありがとうございます。Reachmade です。\n\n`;
  const past = inquiry.replies.map(r => `<time>${esc(when(r.at))} に送信</time><p class="msg">${esc(r.text)}</p>`).join('');
  return page(`<h1>お問い合わせへの返信</h1><p class="sub">受付番号 ${esc(inquiry.receipt)} · ${esc(when(inquiry.createdAt))} 受付</p>
${state.sent ? `<section class="ok" role="status"><p>送信しました。${esc(inquiry.email)} に no-reply@reachmade.com から届きます。</p></section>` : ''}
<section aria-labelledby="q"><h2 id="q">お問い合わせ</h2><dl><dt>お名前</dt><dd>${esc(inquiry.name)}</dd><dt>メール</dt><dd>${esc(inquiry.email)}</dd><dt>会社・団体</dt><dd>${esc(inquiry.organization || '（なし）')}</dd><dt>相談の対象</dt><dd>${esc(topicName(inquiry.useCase))}</dd><dt>言語</dt><dd>${en ? '英語' : '日本語'}</dd></dl><p class="msg">${esc(inquiry.message)}</p></section>
${past ? `<section class="past" aria-labelledby="p"><h2 id="p">送った返信</h2>${past}</section>` : ''}
<section><form method="post" action="${esc(action)}"><input type="hidden" name="nonce" value="${esc(state.nonce ?? crypto.randomUUID())}">
<label for="reply">返信${en ? '（英語のお問い合わせです）' : ''}</label>
${state.error ? `<p class="warn" role="alert">${esc(state.error)}</p>` : ''}<textarea id="reply" name="text" required maxlength="${MAX_REPLY}">${esc(state.draft ?? greeting)}</textarea>
<p class="hint">no-reply@reachmade.com から送ります。相手が返信すると、Reachmade の受信用アドレスに届きます。あなたの個人のアドレスは相手に表示されません。署名とお問い合わせ内容の引用は自動で付きます。</p>
<button type="submit">${inquiry.replies.length ? 'この内容でもう一度返信する' : 'この内容で返信する'}</button></form></section>`);
}

export function isReplyPath(pathname) { return PATH.test(pathname); }

export async function handleReply(request, env, { fetcher = fetch, now = Date.now } = {}) {
  const url = new URL(request.url), match = PATH.exec(url.pathname);
  if (!match) return null;
  if (url.origin !== SITE_ORIGIN) return notice('利用できません', 'このページは reachmade.com でだけ開けます。', 403);
  if (!replyConfigured(env) || !env.INQUIRIES || !noticeConfigured(env)) return notice('利用できません', '返信の機能が設定されていません。', 503);
  const id = match[1].toLowerCase(), exp = url.searchParams.get('exp'), sig = url.searchParams.get('sig');
  if (!(await verifyReplyLink(env.INQUIRY_REPLY_SECRET, id, exp, sig, now())))
    return notice('リンクが無効です', 'リンクの期限（30日）が切れているか、正しくありません。', 403);
  const store = inquiryStore(env.INQUIRIES, now);
  const inquiry = await store.get(id).catch(() => undefined);
  if (inquiry === undefined) return notice('一時的に開けません', '少し待ってから開き直してください。', 503);
  if (!inquiry) return notice('見つかりません', 'このお問い合わせは保存期間（90日）を過ぎたため、削除されました。', 404);
  const action = `/inquiries/reply/${id}?exp=${exp}&sig=${sig}`;

  if (request.method === 'GET' || request.method === 'HEAD') return view(inquiry, action);
  if (request.method !== 'POST') return notice('利用できません', 'この操作は受け付けません。', 405);
  // The link is the credential; refuse a post that another site makes with it.
  if (request.headers.get('Origin') !== SITE_ORIGIN || request.headers.get('Sec-Fetch-Site') === 'cross-site')
    return notice('送信できません', '別のページからの送信は受け付けません。', 403);
  if (!/^application\/x-www-form-urlencoded(?:;|$)/i.test(request.headers.get('Content-Type') || '')) return notice('送信できません', '送信の形式が正しくありません。', 415);
  const raw = await request.text();
  if (raw.length > 64 * 1024) return notice('送信できません', '本文が長すぎます。', 413);
  const form = new URLSearchParams(raw), nonce = form.get('nonce') || '', text = (form.get('text') || '').replace(/\r\n?/g, '\n');
  if (!UUID.test(nonce)) return notice('送信できません', 'ページを開き直してから送ってください。', 400);
  if (!text.trim() || text.length > MAX_REPLY) return view(inquiry, action, { error: '返信は1〜5,000文字で入力してください。', draft: text.slice(0, MAX_REPLY), nonce });

  const slot = await store.reserve(id, { nonce, text: text.trim(), at: now() }).catch(() => 'error');
  if (slot === 'duplicate') return view((await store.get(id)) ?? inquiry, action, { sent: true });
  if (slot === 'full') return view(inquiry, action, { error: 'このお問い合わせには、これ以上返信できません（20通まで）。', draft: text, nonce });
  if (slot === 'error') return view(inquiry, action, { error: '保存できませんでした。少し待ってからもう一度送ってください。', draft: text, nonce });
  try {
    await sendReply(env, inquiry, text, nonce, fetcher);
  } catch (error) {
    console.error('[inquiry-reply] send failed', inquiry.receipt, error instanceof Error ? error.message : '');
    await store.release(id, nonce).catch(() => {});
    // Same nonce on retry: if Resend did accept the first try, its idempotency key stops a second email.
    return view(inquiry, action, { error: '送信できませんでした。書いた内容はそのまま残っています。少し待ってからもう一度送ってください。', draft: text, nonce });
  }
  return view((await store.get(id).catch(() => null)) ?? inquiry, action, { sent: true });
}
