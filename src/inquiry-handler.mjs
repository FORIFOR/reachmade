/** Existing private inbox only. No cookies, credentials, arbitrary URLs or logs. */
export const INQUIRY_ENDPOINT = 'https://ai-meeting-broker-pdygkns5gq-an.a.run.app/api/site/leads';
const origins = new Set(['https://reachmade.com','http://127.0.0.1:8787']);
const fields = ['requestId','name','email','organization','message','consent','website','language'];
export function parseInquiry(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key=>!fields.includes(key))) throw new Error('INVALID_INPUT');
  const out = {};
  for (const [key,min,max] of [['name',1,80],['email',3,254],['organization',0,120],['message',10,2000]]) {
    if (typeof value[key] !== 'string' || value[key].trim().length < min || value[key].length > max) throw new Error('INVALID_INPUT');
    out[key] = value[key].trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email) || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value.requestId || '') || value.consent !== true || value.website !== '' || !['ja','en'].includes(value.language)) throw new Error('INVALID_INPUT');
  return {...out,requestId:value.requestId,consent:true,website:'',language:value.language,useCase:'custom'};
}
async function boundedJSON(stream, limit) {
  if (!stream) throw new Error('INVALID_INPUT');
  const reader = stream.getReader(); let length = 0; const chunks = [];
  try {
    for (;;) { const {done,value} = await reader.read(); if(done)break; length += value.byteLength; if(length>limit){await reader.cancel();throw new Error('TOO_LARGE');} chunks.push(value); }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset=0; for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
const json = (status, body, extra={}) => new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
export async function serveInquiry(request, fetcher=fetch) {
  const url = new URL(request.url);
  if(url.pathname!=='/api/inquiry')return null;
  if(!origins.has(url.origin))return json(403,{error:'ORIGIN'});
  if(!['GET','POST'].includes(request.method))return json(405,{error:'METHOD'},{Allow:'GET, POST'});
  if(request.method==='GET') {
    // The existing inbox returns METHOD only after its store and origin checks.
    try {
      const result=await fetcher(INQUIRY_ENDPOINT,{method:'GET',headers:{Origin:url.origin},redirect:'error',signal:AbortSignal.timeout(8000)});
      const body=await boundedJSON(result.body,1024);
      return json(200,{available:result.status===405 && body.error==='METHOD'});
    } catch { return json(200,{available:false}); }
  }
  if(request.headers.get('origin')!==url.origin)return json(403,{error:'ORIGIN'});
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))return json(415,{error:'CONTENT_TYPE'});
  let input;
  try { input=parseInquiry(await boundedJSON(request.body,8192)); }
  catch(error){return json(error.message==='TOO_LARGE'?413:400,{error:error.message==='TOO_LARGE'?'TOO_LARGE':'INVALID_INPUT'});}
  try {
    const result=await fetcher(INQUIRY_ENDPOINT,{method:'POST',headers:{Origin:url.origin,'Content-Type':'application/json'},body:JSON.stringify(input),redirect:'error',signal:AbortSignal.timeout(10000)});
    const body=await boundedJSON(result.body,1024);
    if(result.status===201 && /^AM-[0-9A-F]{8}$/.test(body.receipt||''))return json(201,{receipt:body.receipt});
    if([400,409,429].includes(result.status))return json(result.status,{error:result.status===429?'CAPACITY':result.status===409?'REQUEST_CONFLICT':'INVALID_INPUT'});
    return json(503,{error:'UNAVAILABLE'});
  } catch { return json(503,{error:'UNAVAILABLE'}); }
}
