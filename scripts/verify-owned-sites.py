#!/usr/bin/env python3
"""Read-only local browser checks. No sign-in, submission, real model call or app write."""
import json, os, time, urllib.request
from pathlib import Path
from urllib.parse import urlsplit, unquote
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('OWNED_SITE_QA_BASE','http://127.0.0.1:8787').rstrip('/')
ROUTES=['/products/genie/','/products/ai-meeting/','/products/genie/demos/','/en/products/genie/demos/','/products/ai-meeting/guide/','/en/products/ai-meeting/guide/']
report={'base':BASE,'pages':[],'videos':[],'failures':[]}
for _ in range(100):
 try:
  with urllib.request.urlopen(BASE+'/',timeout=2) as r:
   if r.status==200:break
 except Exception:time.sleep(.3)
else:raise RuntimeError('Worker did not become ready')
for p in (ROOT/'dist').rglob('*'):
 if p.suffix in {'.html','.mjs','.js','.css','.json','.xml'}:
  if 'chatgpt.site' in p.read_text(errors='replace'):report['failures'].append('Legacy URL in '+str(p.relative_to(ROOT/'dist')))
with sync_playwright() as pw:
 browser=pw.chromium.launch()
 for width in [390,1440]:
  page=browser.new_page(viewport={'width':width,'height':900},reduced_motion='reduce')
  page.on('request',lambda req:report['failures'].append('Legacy network request: '+req.url) if 'chatgpt.site' in req.url else None)
  page.on('pageerror',lambda err:report['failures'].append(str(err)))
  for route in ROUTES:
   response=page.goto(BASE+route,wait_until='networkidle')
   assert response.status==200,(route,response.status)
   assert page.locator('h1').count()==1,route
   assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),(route,width,'overflow')
   assert page.locator('link[rel="canonical"]').get_attribute('href')=='https://reachmade.com'+route
   for href in page.locator('a[href],source[src],track[src],video[poster],link[rel="stylesheet"]').evaluate_all('(els)=>els.map(e=>e.getAttribute("href")||e.getAttribute("src")||e.getAttribute("poster"))'):
    if not href or href.startswith('#'):continue
    parsed=urlsplit(href)
    if parsed.netloc and parsed.netloc!='reachmade.com':continue
    target=ROOT/'dist'/unquote(parsed.path).lstrip('/')
    if parsed.path.endswith('/'):target=target/'index.html'
    assert target.is_file(),(route,href,'missing local target')
   report['pages'].append({'route':route,'width':width,'status':response.status,'overflow':False})
  page.close()
 page=browser.new_page()
 for route in ['/products/genie/demos/','/products/ai-meeting/guide/']:
  page.goto(BASE+route)
  for i in range(page.locator('video').count()):
   video=page.locator('video').nth(i)
   result=video.evaluate('''async v=>{v.muted=true;v.load();await v.play();await new Promise(r=>setTimeout(r,600));const result={src:v.currentSrc,duration:v.duration,time:v.currentTime,width:v.videoWidth,height:v.videoHeight,error:v.error?.code||null};v.pause();return result;}''')
   assert result['time']>0 and result['width']>0 and not result['error'],result
   req=page.request.get(result['src'],headers={'Range':'bytes=0-1023'})
   assert req.status==206,(result['src'],req.status,'Range not honored')
   report['videos'].append(result)
 browser.close()
report['ok']=not report['failures']
dest=ROOT/'docs/owned-site-migration-browser.json';dest.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('OWNED_SITE_BROWSER_REPORT='+json.dumps(report,ensure_ascii=False))
assert report['ok'],report['failures']
