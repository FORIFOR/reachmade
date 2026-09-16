/** Download owned public recordings, cut them into concise honest website films, then package them before deployment. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { recordings } from '../src/films.mjs';
import { PREMIUM_FILM_VERSION, premiumFilmCuts, premiumFilmPolicy, validatePremiumFilmCuts } from '../src/premium-film-cuts.mjs';

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

export function validateJpeg(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 1024 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) throw new Error('Generated poster is not a complete JPEG');
}

export async function downloadRecording(url, fetcher = fetch) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('Invalid recording URL');
  const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(90000), headers: { 'User-Agent': 'Reachmade-media-packager/2.0', 'Accept': 'video/mp4, application/octet-stream' } });
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

export function buildPremiumFilter(plan, policy = premiumFilmPolicy) {
  const scale = `scale=${policy.width}:${policy.height}:force_original_aspect_ratio=decrease:force_divisible_by=2`;
  const pad = `pad=${policy.width}:${policy.height}:(ow-iw)/2:(oh-ih)/2:color=0x${policy.paper.slice(1)}`;
  const clips = plan.clips.map(([start, end], index) => `[0:v]trim=start=${start}:end=${end},setpts=PTS-STARTPTS,${scale},${pad},fps=${policy.fps},setsar=1,format=yuv420p[v${index}]`);
  const inputs = plan.clips.map((_, index) => `[v${index}]`).join('');
  return `${clips.join(';')};${inputs}concat=n=${plan.clips.length}:v=1:a=0,tpad=start_mode=clone:start_duration=${policy.startHold}:stop_mode=clone:stop_duration=${policy.endHold}[outv]`;
}

export function ffmpegArgs(input, output, plan, policy = premiumFilmPolicy) {
  return [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', input,
    '-filter_complex', buildPremiumFilter(plan, policy), '-map', '[outv]', '-an',
    '-c:v', 'libx264', '-preset', policy.preset, '-crf', String(policy.crf),
    '-profile:v', 'high', '-level', '4.0', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-metadata', 'comment=Reachmade website edit from real product recording; chronological hard cut; playback speed unchanged',
    output,
  ];
}

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.setEncoding('utf8'); child.stderr.on('data', chunk => { stderr += chunk; });
    child.once('error', error => reject(error.code === 'ENOENT'
      ? new Error(`ffmpeg is required to build the premium website films. Install it with “brew install ffmpeg” or set FFMPEG_BIN. (${command})`)
      : error));
    child.once('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${stderr.trim().slice(-2000)}`)));
  });
}

export async function renderPremiumFilm({ input, output, poster, plan, ffmpeg = process.env.FFMPEG_BIN || 'ffmpeg' }) {
  await run(ffmpeg, ffmpegArgs(input, output, plan));
  await run(ffmpeg, ['-hide_banner','-loglevel','error','-y','-ss',String(premiumFilmPolicy.startHold),'-i',output,'-frames:v','1','-q:v','2',poster]);
}

export async function prepareMedia({ dist = path.join(root, 'dist'), fetcher = fetch, ffmpeg = process.env.FFMPEG_BIN || 'ffmpeg', renderer = renderPremiumFilm } = {}) {
  await fs.access(path.join(dist, 'index.html'));
  validatePremiumFilmCuts();
  const recordingIds = Object.keys(recordings).sort();
  const cutIds = Object.keys(premiumFilmCuts).sort();
  if (JSON.stringify(recordingIds) !== JSON.stringify(cutIds)) throw new Error('Premium film cuts must cover exactly the six packaged recordings');
  const mediaRoot = path.join(dist, 'media'); await fs.mkdir(mediaRoot, { recursive: true });
  const stage = await fs.mkdtemp(path.join(mediaRoot, '.recordings-'));
  const rawRoot = await fs.mkdtemp(path.join(mediaRoot, '.raw-'));
  const manifest = { schema: 2, mode: 'premium-site-edits', editVersion: PREMIUM_FILM_VERSION, policy: premiumFilmPolicy, recordings: [] };
  try {
    for (const [id, source] of Object.entries(recordings)) {
      if (!/^[a-z0-9-]+$/.test(id)) throw new Error('Invalid recording ID');
      let sourceBytes, lastError;
      for (let attempt = 0; attempt < 2; attempt++) {
        try { sourceBytes = await downloadRecording(source, fetcher); break; }
        catch (error) { lastError = error; }
      }
      if (!sourceBytes) throw new Error(`${id}: ${lastError?.message}. Deployment stopped; no missing-video release will be published.`);
      const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex');
      const rawPath = path.join(rawRoot, `${id}.mp4`);
      const outputPath = path.join(stage, `${id}.mp4`);
      const posterPath = path.join(stage, `${id}.jpg`);
      await fs.writeFile(rawPath, sourceBytes);
      await renderer({ input: rawPath, output: outputPath, poster: posterPath, plan: premiumFilmCuts[id], ffmpeg, id });
      const outputBytes = await fs.readFile(outputPath); validateMp4(outputBytes);
      const posterBytes = await fs.readFile(posterPath); validateJpeg(posterBytes);
      manifest.recordings.push({
        id, source, sourceBytes: sourceBytes.length, sourceSha256,
        path: `/media/products/${id}.mp4`, poster: `/media/products/${id}.jpg`,
        bytes: outputBytes.length, sha256: createHash('sha256').update(outputBytes).digest('hex'),
        edit: { version: PREMIUM_FILM_VERSION, clips: premiumFilmCuts[id].clips, speed: 1, audio: false, label: premiumFilmCuts[id].label },
      });
    }
    await fs.writeFile(path.join(stage, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    const destination = path.join(mediaRoot, 'products');
    await fs.rm(destination, { recursive: true, force: true });
    await fs.rename(stage, destination);
    const posterDestination = path.join(dist, 'assets', 'products'); await fs.mkdir(posterDestination, { recursive: true });
    for (const { id } of manifest.recordings) await fs.copyFile(path.join(destination, `${id}.jpg`), path.join(posterDestination, `${id}.jpg`));
    console.log(`Rendered ${manifest.recordings.length} premium website films from validated real recordings. Playback speed unchanged; no synthetic product frames added.`);
    return manifest;
  } finally {
    await fs.rm(stage, { recursive: true, force: true });
    await fs.rm(rawRoot, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await prepareMedia();
