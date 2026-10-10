import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {root} from '../scripts/build.mjs';

test('distributed simulation matches its recorded source build and stays self-contained', async () => {
  const manifest=JSON.parse(await fs.readFile(path.join(root,'public/demos/oathra/source-manifest.json'),'utf8'));
  assert.equal(manifest.sourceRepository,'https://github.com/FORIFOR/oathra');
  assert.match(manifest.sourceRevision,/^[a-f0-9]{40}$/);
  assert.equal(manifest.files.length,5);
  for (const file of manifest.files) {
    const bytes=await fs.readFile(path.join(root,'public',file.path));
    assert.equal(bytes.length,file.bytes,file.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,file.path+' drift');
    assert.match(file.sourceSha256,/^[a-f0-9]{64}$/);
    if (file.path.endsWith('/demo.css') || file.path.endsWith('/use-cases.js')) assert.equal(file.sha256,file.sourceSha256,'CSS and behavior must be copied unchanged');
  }
  const html=await fs.readFile(path.join(root,'dist/demos/oathra/index.html'),'utf8');
  assert.equal((html.match(/<script\b/g)||[]).length,1);
  assert.match(html,/<script type="module" src="\.\/use-cases\.js"><\/script>/);
  assert.match(html,/<link rel="stylesheet" href="\.\/demo\.css">/);
  assert.match(html,/class="brand" href="\/products\/oathra\/"/);
  assert.match(html,/connect-src 'none'/);
  assert.match(html,/構想デモ・実際の発信\/予約は行いません/);
  assert.doesNotMatch(html,/<iframe|src="https?:|href="tel:|src="\.\.\/use-cases/);
  for (const id of ['restaurant','stock','modify']) {
    assert.ok(html.includes(`href="/media/films/use-case-${id}.mp4"`));
    await fs.access(path.join(root,`dist/media/films/use-case-${id}.mp4`));
  }
  await fs.access(path.join(root,'dist/demos/oathra/LICENSE'));
  assert.match(await fs.readFile(path.join(root,'dist/demos/oathra/THIRD_PARTY_NOTICES.txt'),'utf8'),/MIT License/);
});
