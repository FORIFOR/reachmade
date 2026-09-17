import crypto from 'node:crypto';

export const proofProducts = Object.freeze(['genie','ai-meeting','oathra','aisecure','agent-team','launchloom']);
export const proofKinds = Object.freeze(['real-use','pilot','external-review','public-adoption']);

function text(value, field, max) {
  const result = String(value ?? '').trim();
  if (!result || result.length > max) throw new TypeError(`${field} must be 1-${max} characters`);
  return result;
}

function publicEvidenceUrl(value) {
  const url = new URL(text(value,'evidenceUrl',500));
  if (url.protocol !== 'https:' || url.username || url.password) throw new TypeError('evidenceUrl must be public HTTPS without credentials');
  if (['localhost','127.0.0.1','0.0.0.0'].includes(url.hostname)) throw new TypeError('evidenceUrl must be public');
  return url.href;
}

export function validateProofEntry(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('proof entry must be an object');
  const product = text(input.product,'product',40);
  const kind = text(input.kind,'kind',40);
  if (!proofProducts.includes(product)) throw new TypeError('unknown product');
  if (!proofKinds.includes(kind)) throw new TypeError('unknown proof kind');
  const observedAt = text(input.observedAt,'observedAt',10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(observedAt) || Number.isNaN(Date.parse(`${observedAt}T00:00:00Z`))) throw new TypeError('observedAt must be YYYY-MM-DD');
  if (input.permissionToPublish !== true) throw new TypeError('permissionToPublish must be true');
  if (input.verification !== 'public-evidence') throw new TypeError('verification must be public-evidence');
  return {
    product,
    kind,
    observedAt,
    claim: text(input.claim,'claim',180),
    scope: text(input.scope,'scope',280),
    evidenceUrl: publicEvidenceUrl(input.evidenceUrl),
    permissionToPublish: true,
    verification: 'public-evidence'
  };
}

export function validateProofRegistry(registry) {
  if (!registry || registry.version !== 1 || !Array.isArray(registry.entries)) throw new TypeError('invalid proof registry');
  const ids = new Set();
  for (const item of registry.entries) {
    if (!item.id || ids.has(item.id)) throw new TypeError('proof entries require unique ids');
    ids.add(item.id);
    validateProofEntry(item);
  }
  return registry;
}

export function addProofEntry(registry, input, now = new Date()) {
  validateProofRegistry(registry);
  const entry = validateProofEntry(input);
  const digest = crypto.createHash('sha256').update(`${entry.product}\n${entry.observedAt}\n${entry.claim}\n${entry.evidenceUrl}`).digest('hex').slice(0,10);
  const id = `${entry.product}-${entry.observedAt}-${digest}`;
  if (registry.entries.some(x => x.id === id || x.evidenceUrl === entry.evidenceUrl)) throw new TypeError('duplicate proof evidence');
  const entries = [...registry.entries, {id, ...entry}].sort((a,b) => b.observedAt.localeCompare(a.observedAt) || a.id.localeCompare(b.id));
  return {version:1, updatedAt:now.toISOString(), entries};
}
