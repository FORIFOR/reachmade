/** Download owned public recordings before deployment, never during a visit. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { recordings } from '../src/films.mjs';
export const MAX_BYTES = 24 * 1024 * 1024;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function validateMp4(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 32 || bytes.length > MAX_BYTES) throw new Error('Recording size is invalid');
  let offset = 0; const boxes = new Set();
  while (offset + 8 <= bytes.length) {
    let size = bytes.readUInt32BE(offset); const kind = bytes.toString('ascii', offset + 4, offset + 8); let header = 8;
    if (size === 1) {
      if (offset + 16 > bytes.length) throw new Error('Truncated MP4 header');
      const large = bytes.readBigUInt64BE(offset + 8);
      if (large > BigInt(MAX_BYTES)) throw new Error('Oversized MP4 box');
      size = Number(large); header = 16;
    } else if (size === 0) size = bytes.length - offset;
    if (size < header || offset + size > bytes.length) throw new Error('Truncated MP4 box');
    boxes.add(kind); offset += size;
  }
  if (offset !== bytes.length || !['ftyp', 'moov', 'mdat'].every(x => boxes.has(x))) throw new Error('Not a complete MP4 file');
}
export async function downloadRecording(url, fetcher = fetch) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('Invalid recording URL');
  const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(90000), headers: { 'User-Agent': 'Reachmade-media-packager/1.0', 'Accept': 'video/mp4, application/octet-stream' } });
  if (response.status !== 200 || !/^(video\/mp4|application\/octet-stream)(?:;|$)/i.test(response.headers.get('content-type') || '')) throw new Error(`Recording download failed (${response.status})`);
  if (Number(response.headers.get('content-length')) > MAX_BYTES) { await response.body?.cancel(); throw new Error('Recording exceeds 24 MiB'); }
  if (!response.body) throw new Error('Empty recording');
  const reader = response.body.getReader(); const chunks = []; let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.length;
      if (length > MAX_BYTES) { await reader.cancel(); throw new Error('Recording exceeds 24 MiB'); }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  const bytes = Buffer.concat(chunks); validateMp4(bytes); return bytes;
}
export async function prepareMedia({ dist = path.join(root, 'dist'), fetcher = fetch } = {}) {
  await fs.access(path.join(dist, 'index.html'));
  const mediaRoot = path.join(dist, 'media'); await fs.mkdir(mediaRoot, { recursive: true });
  const stage = await fs.mkdtemp(path.join(mediaRoot, '.recordings-'));
  const manifest = { schema: 1, mode: 'packaged-static-assets', recordings: [] };
  try {
    for (const [id, source] of Object.entries(recordings)) {
      if (!/^[a-z0-9-]+$/.test(id)) throw new Error('Invalid recording ID');
      let bytes, lastError;
      for (let attempt = 0; attempt < 2; attempt++) {
        try { bytes = await downloadRecording(source, fetcher); break; }
        catch (error) { lastError = error; }
      }
      if (!bytes) throw new Error(`${id}: ${lastError?.message}. Deployment stopped; no missing-video release will be published.`);
      await fs.writeFile(path.join(stage, `${id}.mp4`), bytes);
      manifest.recordings.push({ id, source, path: `/media/products/${id}.mp4`, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
    }
    await fs.writeFile(path.join(stage, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    const destination = path.join(mediaRoot, 'products');
    await fs.rm(destination, { recursive: true, force: true });
    await fs.rename(stage, destination);
    console.log(`Packaged ${manifest.recordings.length} validated MP4 recordings. No runtime proxy is required.`);
    return manifest;
  } finally { await fs.rm(stage, { recursive: true, force: true }); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await prepareMedia();
