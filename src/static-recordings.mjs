/** Deliver packaged recordings through ASSETS. No runtime third-party fetch. */
import { recordings } from './films.mjs';
const MAX_BYTES = 24 * 1024 * 1024;
export function byteRange(value, length) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2]) || value.length > 80 || !Number.isSafeInteger(length) || length < 1) return null;
  const total = BigInt(length);
  let start, end;
  if (!match[1]) {
    const suffix = BigInt(match[2]); if (suffix === 0n) return null;
    start = suffix >= total ? 0n : total - suffix; end = total - 1n;
  } else {
    start = BigInt(match[1]); end = match[2] ? BigInt(match[2]) : total - 1n;
    if (start >= total || end < start) return null;
    if (end >= total) end = total - 1n;
  }
  return [Number(start), Number(end)];
}
function ifRangeMatches(value, headers) {
  if (!value) return true;
  if (value.startsWith('W/')) return false;
  if (value.startsWith('"')) return value === headers.get('etag');
  const date = Date.parse(value), modified = Date.parse(headers.get('last-modified') || '');
  return Number.isFinite(date) && Number.isFinite(modified) && modified <= date;
}
function sliceStream(body, start, end) {
  const reader = body.getReader(); let position = 0;
  return new ReadableStream({
    async pull(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { controller.close(); return; }
          const from = Math.max(0, start - position), to = Math.min(value.length, end + 1 - position);
          position += value.length;
          if (to > from) controller.enqueue(value.slice(from, to));
          if (position > end) { await reader.cancel(); controller.close(); return; }
          if (to > from) return;
        }
      } catch (error) { controller.error(error); }
    },
    cancel(reason) { return reader.cancel(reason); },
  });
}
export async function serveStaticRecording(request, assets) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/media/products/')) return null;
  const reply = (status, text, extra = {}) => new Response(request.method === 'HEAD' ? null : text, {
    status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra },
  });
  const match = /^\/media\/products\/([a-z0-9-]+)\.mp4$/.exec(url.pathname);
  if (!match || !Object.hasOwn(recordings, match[1])) return reply(404, 'Recording not found');
  if (!['GET', 'HEAD'].includes(request.method)) return reply(405, 'Method not allowed', { Allow: 'GET, HEAD' });
  const range = request.method === 'GET' ? request.headers.get('range') : null;
  if (range && (!/^bytes=(?:\d+-\d*|-\d+)$/.test(range) || range.length > 80)) return reply(416, 'Unsupported byte range');
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
  const out = new Headers({ 'Content-Type': 'video/mp4', 'Cache-Control': 'public, max-age=3600, must-revalidate', 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin', 'Accept-Ranges': 'bytes' });
  for (const name of ['content-length', 'content-range', 'etag', 'last-modified']) {
    const value = response.headers.get(name); if (value) out.set(name, value);
  }
  // Local ASSETS may ignore Range. Preserve byte-range semantics for video seeking.
  if (response.status === 200 && range && ifRangeMatches(request.headers.get('if-range'), response.headers)) {
    const length = Number(response.headers.get('content-length'));
    if (!Number.isSafeInteger(length) || length < 1 || length > MAX_BYTES || !response.body) {
      await response.body?.cancel(); return reply(503, 'Invalid packaged recording length');
    }
    const bounds = byteRange(range, length);
    if (!bounds) { await response.body.cancel(); return reply(416, 'Unsatisfiable byte range', { 'Content-Range': `bytes */${length}` }); }
    const [start, end] = bounds;
    out.set('Content-Range', `bytes ${start}-${end}/${length}`);
    out.set('Content-Length', String(end - start + 1));
    return new Response(sliceStream(response.body, start, end), { status: 206, headers: out });
  }
  if (response.status === 416) out.set('Cache-Control', 'no-store');
  return new Response(request.method === 'HEAD' || response.status === 304 ? null : response.body, { status: response.status, headers: out });
}
