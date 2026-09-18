#!/usr/bin/env python3
"""Bounded, one-time migration of the owner's two public product sites.
Only fixed public hosts are read, without credentials. Existing app origins stay intact.
"""
from __future__ import annotations
import hashlib, html, json, re, subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit, unquote, quote
from urllib.request import Request, build_opener, HTTPRedirectHandler
ROOT = Path(__file__).resolve().parents[2]
ORIGIN = 'https://reachmade.com'
LEGACY = {'genie':'https://genie-forifor.forifor.chatgpt.site','ai-meeting':'https://ai-meeting.forifor.chatgpt.site'}
MEDIA = {'.mp4','.jpg','.jpeg','.png','.webp','.vtt','.srt','.md'}
MAX_FILE = 24 * 1024 * 1024
class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise RuntimeError(f'Unexpected redirect from {req.full_url} to {newurl}')
def read_public(url, maximum=MAX_FILE):
    p=urlsplit(url)
    if p.scheme!='https' or p.netloc not in {urlsplit(v).netloc for v in LEGACY.values()} or p.username or p.password:
        raise ValueError('Only the two fixed public source hosts are permitted')
    encoded=urlunsplit((p.scheme,p.netloc,quote(unquote(p.path),safe='/'),p.query,''))
    request=Request(encoded,headers={'User-Agent':'Reachmade-owned-site-migration/1','Accept':'*/*'})
    with build_opener(NoRedirect).open(request,timeout=60) as response:
        if response.status!=200:raise RuntimeError(f'HTTP {response.status}: {url}')
        raw=response.read(maximum+1)
    if not raw or len(raw)>maximum:raise ValueError(f'Invalid source size: {url}')
    return raw
URL_PATTERN=re.compile(r'https://(?:genie-forifor\.forifor|ai-meeting\.forifor)\.chatgpt\.site[^\s\'"<>`\)\]]*')
def target_for(url):
    p=urlsplit(html.unescape(url))
    product=next((k for k,v in LEGACY.items() if p.netloc==urlsplit(v).netloc),None)
    if product is None:return url
    lang='en' if p.path.startswith('/en') or 'lang=en' in p.query else 'ja'
    base=f'{ORIGIN}/{"en/" if lang=="en" else ""}products/{product}/'
    if p.path.startswith('/assets/') or Path(unquote(p.path)).suffix.lower() in MEDIA or (product=='genie' and p.path=='/orbit.html'):
        return ORIGIN+'/media/originals/'+product+p.path+(('?'+p.query) if p.query else '')+(('#'+p.fragment) if p.fragment else '')
    if p.fragment=='business':return ORIGIN+('/en' if lang=='en' else '')+'/contact/'
    if product=='genie' and p.fragment in {'demo','demos','prototype','proposal','priorities'}:
        return base+'demos/#'+{'demo':'prototype','demos':'prototype'}.get(p.fragment,p.fragment)
    if product=='ai-meeting':return base+'guide/'+(('#'+p.fragment) if p.fragment else '')
    return base+(('#'+p.fragment) if p.fragment else '')
def rewrite(text):return URL_PATTERN.sub(lambda m:target_for(m.group()),text)
class Assets(HTMLParser):
    def __init__(self,base):super().__init__();self.base=base;self.urls=set()
    def handle_starttag(self,tag,attrs):
        for key,value in attrs:
            if not value or key not in {'href','src','poster','data-source','data-mobile-source','data-mobile-poster'}:continue
            u=urljoin(self.base,value);p=urlsplit(u)
            if p.netloc!=urlsplit(self.base).netloc:continue
            if Path(unquote(p.path)).suffix.lower() in MEDIA or (p.path=='/orbit.html' and 'genie' in p.netloc):
                self.urls.add(urlunsplit((p.scheme,p.netloc,p.path,'','')))
def write(rel,value):
    dest=ROOT/rel;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(value,encoding='utf-8')
def replace_exact(rel,before,after):
    p=ROOT/rel;text=p.read_text()
    if after in text:return
    if before not in text:raise RuntimeError(f'Patch context missing: {rel}: {before[:90]}')
    p.write_text(text.replace(before,after),encoding='utf-8')
def import_media():
    manifest_path=ROOT/'public/media/originals/manifest.json'
    if manifest_path.exists():
        for item in json.loads(manifest_path.read_text())['files']:
            raw=(ROOT/'public'/item['path'].lstrip('/')).read_bytes()
            if len(raw)!=item['bytes'] or hashlib.sha256(raw).hexdigest()!=item['sha256']:raise RuntimeError('Stored media hash mismatch')
        return
    rows=[];provenance=[]
    for product,host in LEGACY.items():
        urls=set()
        for page in ['/','/ja']:
            parser=Assets(host+page);parser.feed(read_public(host+page,3*1024*1024).decode('utf-8'));urls|=parser.urls
        required=['/assets/genie-orbit-web.mp4','/assets/genie-web-proposal-web.mp4','/assets/genie-product-film-web.mp4','/orbit.html'] if product=='genie' else ['/demo.mp4','/demo-poster.jpg']
        urls.update(host+p for p in required)
        if len(urls)>60:raise RuntimeError('Unexpected media inventory size')
        seen=set()
        for url in sorted(urls):
            relpath=unquote(urlsplit(url).path).lstrip('/')
            if '..' in Path(relpath).parts or not relpath:raise RuntimeError('Unsafe source path')
            if relpath in seen:continue
            seen.add(relpath)
            raw=read_public(url);dest=ROOT/'public/media/originals'/product/relpath;dest.parent.mkdir(parents=True,exist_ok=True)
            if dest.suffix in {'.html','.md','.vtt','.srt'}:raw=rewrite(raw.decode('utf-8')).encode('utf-8')
            dest.write_bytes(raw)
            entry={'path':'/media/originals/'+product+'/'+relpath,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
            if dest.suffix=='.mp4':
                meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_type,codec_name,width,height','-of','json',str(dest)]))
                if not any(s.get('codec_type')=='video' for s in meta['streams']):raise RuntimeError('Missing video track')
                subprocess.run(['ffmpeg','-v','error','-xerror','-nostdin','-i',str(dest),'-f','null','-'],check=True,stdout=subprocess.DEVNULL,timeout=120)
                entry['duration']=float(meta['format']['duration']);entry['streams']=meta['streams']
            rows.append(entry);provenance.append({'source':url,**entry})
            print('IMPORTED',entry['path'],entry['bytes'],entry.get('duration',''),flush=True)
    write('public/media/originals/manifest.json',json.dumps({'schema':1,'importedAt':'2026-09-19','files':rows},ensure_ascii=False,indent=2)+'\n')
    write('docs/owned-site-migration-provenance.json',json.dumps({'schema':1,'files':provenance},ensure_ascii=False,indent=2)+'\n')
def main():
    import_media()
    for folder in ['src','public/assets']:
        for p in (ROOT/folder).rglob('*'):
            if p.is_file() and p.suffix in {'.mjs','.js','.json','.html','.css'}:
                old=p.read_text();new=rewrite(old)
                if old!=new:p.write_text(new)
    p=ROOT/'scripts/build-core.mjs';p.write_text(rewrite(p.read_text()))
    replace_exact('src/products.mjs',"site: 'https://ai-meeting.web.app/'","site: 'https://reachmade.com/products/ai-meeting/', appSite: 'https://ai-meeting.web.app/'")
    replace_exact('worker.js','product.site]','(product.appSite || product.site)]')
    replace_exact('worker.js','import { products }',"import { ownedAliasTarget } from './src/owned-aliases.mjs';\nimport { products }")
    replace_exact('worker.js','function productRedirect(url) {','function productRedirect(url) {\n  const owned = ownedAliasTarget(url);\n  if (owned) return owned;')
    replace_exact('scripts/build.mjs',"import fs from 'node:fs/promises';","import fs from 'node:fs/promises';\nimport { writeOwnedGuides } from '../src/owned-guides.mjs';")
    replace_exact('scripts/build.mjs','await bundleDemoAssets(dist);','await bundleDemoAssets(dist);\n  routes.push(...await writeOwnedGuides(dist));')
    replace_exact('scripts/prepare-media.mjs',"import fs from 'node:fs/promises';","import fs from 'node:fs/promises';\nimport { readOwnedRecording } from '../src/owned-media.mjs';")
    replace_exact('scripts/prepare-media.mjs','fetcher = fetch, ffmpeg =','fetcher = fetch, sourceReader = readOwnedRecording, ffmpeg =')
    replace_exact('scripts/prepare-media.mjs','sourceBytes = await downloadRecording(source, fetcher);','sourceBytes = (await sourceReader(source)) ?? (await downloadRecording(source, fetcher));')
    for p in (ROOT/'tests').glob('*.test.mjs'):
        old=p.read_text();new=rewrite(old)
        if 'prepareMedia({' in new and 'sourceReader: async()=>null' not in new:new=new.replace('prepareMedia({','prepareMedia({sourceReader: async()=>null,')
        if old!=new:p.write_text(new)
    replace_exact('tests/site.test.mjs',"assert.equal(routes.length,26);for(const lang of ['ja','en'])assert.equal(routes.filter(r=>r.lang===lang).length,13);","assert.equal(routes.length,30);for(const lang of ['ja','en'])assert.equal(routes.filter(r=>r.lang===lang).length,15);")
    replace_exact('tests/site.test.mjs',"test('26 routes represent 7 portfolio and 6 product pages per language'","test('30 routes represent portfolio, product and owned guide pages in both languages'")
    replace_exact('tests/site.test.mjs',"assert.equal((html.match(/<script\\b/g)||[]).length,1);","assert.equal((html.match(/<script\\b/g)||[]).length, ['genie-demos','ai-meeting-guide'].includes(r.page)?0:1);")
    replace_exact('src/owned-guides.mjs','class="skip"','class="skip-link"')
    replace_exact('public/assets/owned-guides.css','.skip{','.skip-link{')
    replace_exact('public/assets/owned-guides.css','.skip:focus{','.skip-link:focus{')
    replace_exact('src/owned-guides.mjs','<link rel="alternate" hreflang="${ja?\'en\':\'ja\'}" href="https://reachmade.com${other}">','<link rel="alternate" hreflang="ja" href="https://reachmade.com/products/${product}/${suffix}/"><link rel="alternate" hreflang="en" href="https://reachmade.com/en/products/${product}/${suffix}/"><link rel="alternate" hreflang="x-default" href="https://reachmade.com/products/${product}/${suffix}/">')
    for rel in ['README.md','docs/CONTENT.md','docs/SITE_ARCHITECTURE.ja.md']:
        p=ROOT/rel
        if p.exists():p.write_text(rewrite(p.read_text()))
    write('docs/OWNED_SITE_MIGRATION.md','''# Owned product sites — 2026-09-19

Genie and AI Meeting marketing links use Reachmade. Original public source URLs
are retained in the provenance record, not used by visitor pages or media builds.
The existing product-page presentation remains intact.

- Genie: `/products/genie/`; original demos: `/products/genie/demos/`.
- AI Meeting: `/products/ai-meeting/`; usage guide: `/products/ai-meeting/guide/`.
- English variants use `/en/products/...`.
- AI Meeting's application, authentication, task storage and app alias retain
  their existing origin. `appSite` is distinct from the marketing `site`.
- Original recordings, captions, posters and demonstration outputs are tracked
  in `public/media/originals/` with byte counts and SHA-256 integrity checks.
- The two feature recordings load from Git during builds, never from the old
  hosts or the current production website. Missing or changed files fail closed.
- Old hosting accounts have not been changed or deleted. Retiring their URLs
  requires a separate redirect change at those hosts.

Validation: `npm run check`, `npm run media:prepare`, then
`python scripts/verify-owned-sites.py` against the local Worker.
''')
    print('MIGRATION_SOURCE_READY',flush=True)
if __name__=='__main__':main()
