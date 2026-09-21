import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {IDS} from '../public/assets/lab-core.mjs';
import {createDraft, exportDraft, importDraft, DraftError, MAX_DRAFT_CHARS} from '../public/assets/sample-draft.mjs';
const input = {product:'genie', language:'ja', text:'日本語の例\n\n<svg onload="bad()"> & 😀\n 末尾の空白  '};
for (const product of IDS) for (const language of ['ja','en']) test(`draft v1: ${product}/${language} can be exported and reopened`,()=>{
  const draft=createDraft({product,language});
  assert.deepEqual(importDraft(exportDraft(draft).text),draft);
  assert.equal(Object.isFrozen(draft),true);
});
test('UTF-8 text roundtrips without losing whitespace or interpreting HTML',()=>{
  const draft=createDraft(input);
  assert.equal(importDraft(exportDraft(draft).text).text,input.text);
  assert.equal(importDraft('\uFEFF'+exportDraft(draft).text.replaceAll('\n','\r\n')).text,input.text);
});
test('empty, control, oversized, malformed and unsupported inputs fail closed',()=>{
  for (const [text,code] of [['  \n','EMPTY'],['a'.repeat(MAX_DRAFT_CHARS+1),'TOO_LONG'],['hi\0','INVALID_TEXT'],['hi\ud800','INVALID_TEXT']])
    assert.throws(()=>createDraft({...input,text}),e=>e instanceof DraftError&&e.code===code);
  for (const value of [null,[],{}, {...input,product:'constructor'}, {...input,language:'xx'}, {...input,extra:true}]) assert.throws(()=>createDraft(value),DraftError);
  for (const file of ['', '# random file', '> Reachmade guided sample · v1 · constructor · ja\n', 'x'.repeat(40000)]) assert.throws(()=>importDraft(file),DraftError);
  assert.throws(()=>importDraft(exportDraft(createDraft(input)).text.replace('· v1','· v2')),e=>e.code==='UNSUPPORTED_VERSION');
  assert.throws(()=>exportDraft({...createDraft(input),version:2}),e=>e.code==='UNSUPPORTED_VERSION');
});
test('disclosure survives arbitrary body edits, and invalid files cannot alter the original',()=>{
  const original=createDraft(input),file=exportDraft(original);
  assert.match(file.text,/新しいAI生成・外部実行・実アプリへの保存ではありません/);
  assert.throws(()=>importDraft(file.text.replace('操作の評価用サンプル','本物のAI結果')),DraftError);
  assert.equal(original.text,input.text);
});
test('portable core imports and executes without browser, transport or storage',()=>{
  const code=`globalThis.fetch=()=>{throw Error('network forbidden')};
    const {createDraft,exportDraft}=await import('./public/assets/sample-draft.mjs');
    console.log(exportDraft(createDraft({product:'genie',language:'en'})).filename);`;
  const result=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'reachmade-genie-sample.md');
});

test('incomplete export never silently substitutes example content',()=>{
  for(const patch of [{text:undefined},{text:null},{text:4},{extra:'unknown'}])
    assert.throws(()=>exportDraft({...createDraft(input),...patch}),e=>e.code==='INVALID_INPUT');
});

test('historical v1 fixture remains readable and exports byte-for-byte',async()=>{
  const fs=await import('node:fs/promises');
  const file=await fs.readFile(new URL('./fixtures/sample-v1-ja.md',import.meta.url),'utf8');
  const expected=JSON.parse(await fs.readFile(new URL('./fixtures/sample-v1-ja.json',import.meta.url),'utf8'));
  assert.deepEqual(importDraft(file),expected);
  assert.equal(exportDraft(expected).text,file);
});

test('byte decoding rejects corrupt UTF-8 instead of inserting replacement characters',async()=>{
  const {decodeDraft}=await import('../public/assets/sample-draft.mjs');
  const valid=new TextEncoder().encode(exportDraft(createDraft(input)).text);
  assert.deepEqual(decodeDraft(valid),createDraft(input));
  const corrupt=new Uint8Array([...valid,0xff]);
  assert.throws(()=>decodeDraft(corrupt),e=>e.code==='INVALID_ENCODING');
  assert.throws(()=>decodeDraft(new Uint8Array(32769)),e=>e.code==='TOO_LARGE');
  assert.throws(()=>decodeDraft(valid.buffer),e=>e.code==='INVALID_INPUT');
  assert.deepEqual(decodeDraft(new Uint8Array([0xef,0xbb,0xbf,...valid])),createDraft(input));
});

test('documented two-file integration runs from a fresh directory without repository UI',async()=>{
  const fs=await import('node:fs/promises'),os=await import('node:os'),path=await import('node:path');
  const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'reachmade-consumer-'));
  try{
    for(const file of ['sample-draft.mjs','lab-core.mjs'])await fs.copyFile(new URL('../public/assets/'+file,import.meta.url),path.join(tmp,file));
    const script=`globalThis.fetch=()=>{throw Error('Network is forbidden')};
      const {createDraft,exportDraft,decodeDraft}=await import('./sample-draft.mjs');
      const draft=createDraft({product:'genie',language:'ja',text:'独立した利用側の文章 😀'});
      const file=exportDraft(draft);if(decodeDraft(new TextEncoder().encode(file.text)).text!==draft.text)throw Error('roundtrip');
      process.stdout.write(file.text);`;
    await fs.writeFile(path.join(tmp,'consumer.mjs'),script);
    const result=spawnSync(process.execPath,['consumer.mjs'],{cwd:tmp,encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/独立した利用側の文章 😀/);
  }finally{await fs.rm(tmp,{recursive:true,force:true});}
});
