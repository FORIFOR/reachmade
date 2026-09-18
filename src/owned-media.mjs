/** Resolve imported original recordings from Git, never from the legacy hosts or our own live site. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sources = new Set([
  '/media/originals/genie/assets/genie-orbit-web.mp4',
  '/media/originals/ai-meeting/demo.mp4',
]);
export async function readOwnedRecording(value, { repositoryRoot = root } = {}) {
  const url = new URL(value);
  if (url.origin !== 'https://reachmade.com' || !url.pathname.startsWith('/media/originals/')) return null;
  if (url.search || url.hash || url.username || url.password || !sources.has(url.pathname)) throw new Error('Unknown owned recording');
  const manifest = JSON.parse(await fs.readFile(path.join(repositoryRoot, 'public/media/originals/manifest.json'), 'utf8'));
  const item = manifest.files.find(item => item.path === url.pathname);
  if (!item) throw new Error('Owned recording is absent from the verified inventory');
  const file = path.join(repositoryRoot, 'public', url.pathname);
  if ((await fs.lstat(file)).isSymbolicLink()) throw new Error('Owned recording must not be a symlink');
  const bytes = await fs.readFile(file);
  if (bytes.length !== item.bytes || createHash('sha256').update(bytes).digest('hex') !== item.sha256) throw new Error('Owned recording hash mismatch');
  return bytes;
}
