/** Same-origin facade for the owner's existing private intake. No public reads. */
export const INTAKE_ORIGIN = 'https://ai-meeting-broker-pdygkns5gq-an.a.run.app';
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
export async function handleInquiry(request, fetcher = fetch) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/inquiries' && url.pathname !== '/api/inquiries/status') return null;
  // Never forward a caller-selected origin, path, cookies, authorization or IP.
  if (url.origin !== SITE_ORIGIN || url.search || request.headers.get('Sec-Fetch-Site') === 'cross-site') return json(403,{error:'ORIGIN'});
  const statusOnly = url.pathname.endsWith('/status');
  if (request.method !== (statusOnly ? 'GET' : 'POST')) return json(405,{error:'METHOD'});
  if (!statusOnly && request.headers.get('Origin') !== SITE_ORIGIN) return json(403,{error:'ORIGIN'});
  if (!statusOnly && !/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type') || '')) return json(415,{error:'CONTENT_TYPE'});
  try {
    const payload = statusOnly ? undefined : parseInquiry(await boundedJson(request.body));
    // The real site origin must be authorized by the broker; no impersonation
    // of its older GitHub Pages origin is used to get around that policy.
    const response = await fetcher(INTAKE_ORIGIN + '/api/site/' + (statusOnly ? 'status' : 'leads'), {
      method: statusOnly ? 'GET' : 'POST', redirect:'error', signal:AbortSignal.timeout(12000),
      headers:{Origin:SITE_ORIGIN,'Content-Type':'application/json',Accept:'application/json'},
      ...(payload ? {body:JSON.stringify(payload)} : {}),
    });
    if (!/^application\/json(?:;|$)/i.test(response.headers.get('Content-Type') || '')) { await response.body?.cancel(); return json(503,{error:'UNAVAILABLE'}); }
    let result;
    try { result = await boundedJson(response.body,2048); }
    catch { return json(503,{error:'UNAVAILABLE'}); }
    if (statusOnly) return response.status === 200 && result.available === true ? json(200,{available:true}) : json(503,{available:false,error:'UNAVAILABLE'});
    if (response.status === 201 && typeof result.receipt === 'string' && /^AM-[A-F\d]{8}$/.test(result.receipt)) return json(201,{receipt:result.receipt});
    const errors = {400:'INVALID_INPUT',409:'REQUEST_CONFLICT',429:'CAPACITY'};
    if (Object.hasOwn(errors,response.status)) return json(response.status,{error:errors[response.status]});
    return json(503,{error:'UNAVAILABLE'});
  } catch (error) {
    if (error instanceof InquiryError) return json(error.status,{error:error.code});
    return json(503,{error:'UNAVAILABLE'});
  }
}
