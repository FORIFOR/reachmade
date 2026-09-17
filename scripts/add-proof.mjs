import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { addProofEntry } from '../src/proof-registry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root,'public/data/real-use-proof.json');
const args = process.argv.slice(2);
const values = {};
for (let i=0;i<args.length;i++) {
  const key = args[i];
  if (!key.startsWith('--')) throw new TypeError(`Unexpected argument: ${key}`);
  if (key === '--permission-to-publish') { values.permissionToPublish = true; continue; }
  const value = args[++i];
  if (!value || value.startsWith('--')) throw new TypeError(`Missing value for ${key}`);
  values[key.slice(2).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())] = value;
}
values.verification = 'public-evidence';
const registry = JSON.parse(await fs.readFile(target,'utf8'));
const next = addProofEntry(registry, values);
await fs.writeFile(target, JSON.stringify(next,null,2)+'\n');
const created = next.entries.find(entry => !registry.entries.some(old => old.id === entry.id));
console.log(`Added proof ${created.id}. Review the public claim and evidence URL before committing.`);
