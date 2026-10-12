#!/usr/bin/env node
/** Copy only the built, fictional Oathra demo. Build it in its own repository first. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv[2]) throw Error('Usage: node scripts/sync-oathra-demo.mjs /path/to/oathra');
const source = path.resolve(process.argv[2]);
const target = path.join(root,'public/demos/oathra');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const git = args => {
  const result=spawnSync('git',['-C',source,...args],{encoding:'utf8'});
  if (result.status!==0) throw Error('Oathra source git metadata is unavailable');
  return result.stdout.trim();
};
function once(text, before, after) {
  if (text.split(before).length!==2) throw Error(`Oathra demo source changed: expected one ${before}`);
  return text.replace(before,after);
}
const files = [];
const planned = [];
for (const [from,to] of [['site/demos/index.html','index.html'],['site/demos/demo.css','demo.css'],['site/use-cases.js','use-cases.js'],['LICENSE','LICENSE']]) {
  const input = await fs.readFile(path.join(source,from));
  let output=input;
  if (to==='index.html') {
    let html=input.toString('utf8');
    html=once(html,'src="../use-cases.js"','src="./use-cases.js"');
    html=once(html,'class="brand" href="../"','class="brand" href="/products/oathra/"');
    for (const id of ['restaurant','stock','modify']) html=once(html,`href="../media/use-case-${id}.mp4"`,`href="/media/films/use-case-${id}.mp4"`);
    html=once(html,'<!doctype html>','<!doctype html>\n<!-- Reachmade distribution: local script, brand and video link paths adapted. Application behavior is unchanged; see source-manifest.json. -->');
    output=Buffer.from(html);
  }
  planned.push([to,output]);
  files.push({source:from,path:`/demos/oathra/${to}`,sourceSha256:hash(input),sha256:hash(output),bytes:output.length});
}
const zodRoot=path.join(source,'packages/contract/node_modules/zod');
const zodPackage=JSON.parse(await fs.readFile(path.join(zodRoot,'package.json'),'utf8'));
const zodLicense=await fs.readFile(path.join(zodRoot,'LICENSE'),'utf8');
const notices=Buffer.from(`The Oathra browser bundle includes Zod ${zodPackage.version}, under the MIT license.\n\n${zodLicense}`);
planned.push(['THIRD_PARTY_NOTICES.txt',notices]);
files.push({source:`Zod ${zodPackage.version} LICENSE`,path:'/demos/oathra/THIRD_PARTY_NOTICES.txt',sourceSha256:hash(Buffer.from(zodLicense)),sha256:hash(notices),bytes:notices.length});
const manifest={schema:1,sourceRepository:'https://github.com/FORIFOR/oathra',sourceRevision:git(['rev-parse','HEAD']),sourceWorkingTree:git(['status','--porcelain'])?'modified':'clean',scope:'Built local simulation only. No telephony, credential, provider or live-store integration is included.',adaptations:['index.html: bundle path ./use-cases.js; brand link /products/oathra/; three media links /media/films/. CSS and JavaScript copied byte-for-byte.'],license:'Apache-2.0 for Oathra; bundled Zod MIT. See LICENSE and THIRD_PARTY_NOTICES.txt.',files};
await fs.mkdir(target,{recursive:true});
for (const [name,bytes] of planned) await fs.writeFile(path.join(target,name),bytes);
await fs.writeFile(path.join(target,'source-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Synced ${files.length} source files plus third-party notices; source hashes recorded. Source revision ${manifest.sourceRevision} (${manifest.sourceWorkingTree}).`);
