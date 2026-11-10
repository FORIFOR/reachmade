/**
 * The inquiry form's own intake: stored in this site's D1 database and announced to the
 * operator by email. No public reads; nothing is forwarded to another service.
 */
import { inquiryStore, StoreError } from './inquiry-store.mjs';
import { noticeConfigured, replyLink, sendNotice } from './inquiry-mail.mjs';
export const SITE_ORIGIN = 'https://reachmade.com';
export const MAX_INQUIRY_BYTES = 8192;
const uses = new Set(['tasks','interview','training','language','custom','genie','oathra','aisecure','agent-team','launchloom']);
const keys = new Set(['requestId','name','email','organization','useCase','message','consent','website','language']);
export class InquiryError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}
export function parseInquiry(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !keys.has(k))) throw new InquiryError(400,'INVALID_INPUT');
  const out = { ...value };
  for (const [key,min,max] of [['name',1,80],['email',3,254],['organization',0,120],['message',10,2000]]) {
    if (typeof out[key] !== 'string' || out[key].length > max || out[key].trim().length < min || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(out[key])) throw new InquiryError(400,'INVALID_INPUT');
    out[key] = out[key].trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email) || !uses.has(out.useCase) || out.consent !== true || out.website !== '' || !['ja','en'].includes(out.language) || typeof out.requestId !== 'string' || !/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(out.requestId)) throw new InquiryError(400,'INVALID_INPUT');
  return out;
}
export async function boundedJson(body, maxBytes = MAX_INQUIRY_BYTES) {
  if (!body) throw new InquiryError(400,'INVALID_INPUT');
  const reader = body.getReader(), parts = []; let length = 0;
  try {
    while (true) {
      const {done,value} = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > maxBytes) { await reader.cancel(); throw new InquiryError(413,'TOO_LARGE'); }
      parts.push(value);
    }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const part of parts) { bytes.set(part,offset); offset += part.byteLength; }
    try { return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)); }
    catch { throw new InquiryError(400,'INVALID_INPUT'); }
  } finally { reader.releaseLock(); }
}
const json = (status,data) => new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
export const intakeReady = env => !!env?.INQUIRIES && noticeConfigured(env);
export async function handleInquiry(request, env = {}, { fetcher = fetch, now = Date.now } = {}) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/inquiries' && url.pathname !== '/api/inquiries/status') return null;
  if (url.origin !== SITE_ORIGIN || url.search || request.headers.get('Sec-Fetch-Site') === 'cross-site') return json(403,{error:'ORIGIN'});
  const statusOnly = url.pathname.endsWith('/status');
  if (request.method !== (statusOnly ? 'GET' : 'POST')) return json(405,{error:'METHOD'});
  if (!statusOnly && request.headers.get('Origin') !== SITE_ORIGIN) return json(403,{error:'ORIGIN'});
  if (!statusOnly && !/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type') || '')) return json(415,{error:'CONTENT_TYPE'});
  // Read-only capability probe. Fails closed until storage and the operator notice are both configured.
  if (statusOnly) return intakeReady(env) ? json(200,{available:true}) : json(503,{available:false,error:'UNAVAILABLE'});
  try {
    const lead = parseInquiry(await boundedJson(request.body));
    if (!intakeReady(env)) return json(503,{error:'UNAVAILABLE'});
    const store = inquiryStore(env.INQUIRIES, now);
    const { receipt, created } = await store.create(lead);
    // The inquiry is already stored; a failed email must not turn it into an error for the visitor.
    // The outcome stays on the record so unannounced inquiries can be found.
    if (created) {
      const outcome = await replyLink(env, SITE_ORIGIN, lead.requestId, now())
        .then(link => sendNotice(env, lead, receipt, link, fetcher))
        .then(() => 'sent', error => { console.error('[inquiries] notice failed', receipt, error instanceof Error ? error.message : ''); return 'failed'; });
      await store.noticed(lead.requestId, outcome).catch(() => {});
    }
    return json(201,{receipt});
  } catch (error) {
    if (error instanceof InquiryError || error instanceof StoreError) return json(error.status,{error:error.code});
    console.error('[inquiries] intake failed', error instanceof Error ? error.message : '');
    return json(503,{error:'UNAVAILABLE'});
  }
}
