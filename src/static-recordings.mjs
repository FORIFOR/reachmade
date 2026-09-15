/** Deliver packaged recordings through ASSETS. No runtime third-party fetch. */
import { recordings } from './films.mjs';
export async function serveStaticRecording(request, assets) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/media/products/')) return null;
  const reply = (status, text, extra = {}) => new Response(request.method === 'HEAD' ? null : text, {
    status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra },
  });
  const match = /^\/media\/products\/([a-z0-9-]+)\.mp4$/.exec(url.pathname);
  if (!match || !Object.hasOwn(recordings, match[1])) return reply(404, 'Recording not found');
  if (!['GET', 'HEAD'].includes(request.method)) return reply(405, 'Method not allowed', { Allow: 'GET, HEAD' });
  const range = request.headers.get('range');
  if (range && !/^bytes=(?:\d+-\d*|-\d+)$/.test(range)) return reply(416, 'Unsupported byte range');
  if (!assets?.fetch) return reply(503, 'Recording not packaged');
  const headers = new Headers();
  for (const name of ['range', 'if-range', 'if-none-match', 'if-modified-since']) {
    const value = request.headers.get(name); if (value) headers.set(name, value);
  }
  url.search = '';
  let response;
  try { response = await assets.fetch(new Request(url, { method: request.method, headers })); }
  catch { return reply(503, 'Recording temporarily unavailable'); }
  if (![200, 206, 304, 416].includes(response.status)) return reply(503, 'Recording not packaged');
  if ([200, 206].includes(response.status) && !/^video\/mp4(?:;|$)/i.test(response.headers.get('content-type') || '')) return reply(503, 'Invalid packaged recording');
  const out = new Headers({ 'Content-Type': 'video/mp4', 'Cache-Control': 'public, max-age=3600, must-revalidate', 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin' });
  for (const name of ['content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
    const value = response.headers.get(name); if (value) out.set(name, value);
  }
  if (response.status === 416) out.set('Cache-Control', 'no-store');
  return new Response(request.method === 'HEAD' || response.status === 304 ? null : response.body, { status: response.status, headers: out });
}
