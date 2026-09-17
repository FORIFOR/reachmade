import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { addProofEntry, validateProofEntry, validateProofRegistry } from '../src/proof-registry.mjs';

const valid = {
  product:'genie', kind:'real-use', observedAt:'2026-10-01',
  claim:'A public, evidence-backed real-use fact.',
  scope:'The public evidence states exactly this scope; no wider adoption is implied.',
  evidenceUrl:'https://example.com/evidence', permissionToPublish:true, verification:'public-evidence'
};

test('real-use proof requires public evidence and publication permission', () => {
  assert.deepEqual(validateProofEntry(valid), {...valid,evidenceUrl:'https://example.com/evidence'});
  assert.throws(()=>validateProofEntry({...valid,permissionToPublish:false}),/permissionToPublish/);
  assert.throws(()=>validateProofEntry({...valid,evidenceUrl:'http://example.com/evidence'}),/public HTTPS/);
  assert.throws(()=>validateProofEntry({...valid,evidenceUrl:'https://localhost/evidence'}),/must be public/);
  assert.throws(()=>validateProofEntry({...valid,kind:'page-view'}),/unknown proof kind/);
});

test('proof registry rejects duplicate evidence and produces stable evidence ids', () => {
  const empty={version:1,updatedAt:null,entries:[]};
  const next=addProofEntry(empty,valid,new Date('2026-10-02T00:00:00Z'));
  assert.equal(next.entries.length,1);
  assert.match(next.entries[0].id,/^genie-2026-10-01-[a-f0-9]{10}$/);
  assert.equal(next.updatedAt,'2026-10-02T00:00:00.000Z');
  assert.throws(()=>addProofEntry(next,valid),/duplicate proof evidence/);
});

test('repository ships no fabricated real-use proof', async () => {
  const registry=JSON.parse(await fs.readFile(new URL('../public/data/real-use-proof.json',import.meta.url),'utf8'));
  validateProofRegistry(registry);
  assert.deepEqual(registry.entries,[]);
  assert.equal(registry.updatedAt,null);
});
