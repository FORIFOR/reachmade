// Fixed public recordings only. Never accept an upstream URL from the request.
// Cloudflare fetches these public files server-side. Visitor cookies, authorization,
// IP headers and referrers are not forwarded to the product hosting providers.
export const recordings = Object.freeze({
  genie: 'https://genie-forifor.forifor.chatgpt.site/assets/genie-orbit-web.mp4',
  'ai-meeting': 'https://ai-meeting.forifor.chatgpt.site/demo.mp4',
  oathra: 'https://forifor.github.io/oathra/media/oathra-battle-ja.mp4',
  aisecure: 'https://forifor.github.io/AISecure/media/intro.mp4',
  'agent-team': 'https://forifor.github.io/Multibot/media/real-walkthrough-ja-silent.mp4',
  launchloom: 'https://forifor.github.io/Launchloom/film.mp4',
});

export async function serveRecording(request, fetcher = fetch) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/media/products/')) return null;
  const match = /^\/media\/products\/([a-z0-9-]+)\.mp4$/.exec(url.pathname);
  const upstream = match && Object.hasOwn(recordings, match[1]) ? recordings[match[1]] : null;
  const error = (message, status, extra = {}) => new Response(message, {
    status, headers: { 'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', ...extra },
  });
  if (!upstream) return error('Recording not found', 404);
  if (!['GET','HEAD'].includes(request.method)) return error('Method not allowed', 405, {Allow:'GET, HEAD'});
  // Single byte ranges support seeking without forwarding any user identity.
  const range = request.headers.get('range');
  if (range && !/^bytes=(?:\d+-\d*|-\d+)$/.test(range)) return error('Unsupported byte range', 416);
  const headers = new Headers();
  for (const name of ['range','if-range','if-none-match','if-modified-since']) {
    const value=request.headers.get(name); if(value)headers.set(name,value);
  }
  let response;
  try {
    response = await fetcher(upstream, {method:request.method,headers,redirect:'error'});
  } catch { return error('Recording temporarily unavailable', 502); }
  if (![200,206,304,416].includes(response.status)) return error('Recording temporarily unavailable', 502);
  if ([200,206].includes(response.status) && !/^(video\/mp4|application\/octet-stream)(?:;|$)/i.test(response.headers.get('content-type') || '')) {
    return error('Invalid recording response', 502);
  }
  const out=new Headers({
    'Content-Type':'video/mp4',
    'Cache-Control':'public, max-age=3600, must-revalidate',
    'X-Content-Type-Options':'nosniff',
    'Cross-Origin-Resource-Policy':'same-origin',
    'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'",
  });
  for (const name of ['content-length','content-range','accept-ranges','etag','last-modified']) {
    const value=response.headers.get(name); if(value)out.set(name,value);
  }
  if(response.status===416)out.set('Cache-Control','no-store');
  return new Response(request.method==='HEAD'||response.status===304?null:response.body, {status:response.status,headers:out});
}
