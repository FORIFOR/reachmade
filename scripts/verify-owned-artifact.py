#!/usr/bin/env python3
"""Read-only smoke check of the migrated generated HTML, under the real Worker CSP."""
import hashlib,json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.environ.get('OWNED_SITE_QA_BASE','http://127.0.0.1:8787').rstrip('/')
errors=[];requests=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch()
 page=browser.new_page(viewport={'width':1280,'height':800})
 page.on('pageerror',lambda err:errors.append(str(err)))
 page.on('console',lambda msg:errors.append(msg.text) if msg.type=='error' else None)
 page.on('request',lambda req:requests.append(req.url))
 response=page.goto(BASE+'/media/originals/genie/orbit.html',wait_until='networkidle')
 assert response.status==200,(response.status,page.url)
 page.wait_for_timeout(600)
 assert page.locator('canvas').count()>0,'Original artifact canvas is missing'
 first=page.locator('canvas').first.screenshot()
 page.wait_for_timeout(600)
 second=page.locator('canvas').first.screenshot()
 assert first!=second,'Canvas does not update under the deployed CSP'
 assert not errors,errors
 assert all(url.startswith(BASE) or url.startswith('data:') for url in requests),requests
 result={'url':page.url,'canvas_animated':True,'errors':errors,'requests':requests}
 Path('docs/owned-artifact-browser.json').write_text(json.dumps(result,indent=2)+'\n')
 print('OWNED_ARTIFACT_BROWSER='+json.dumps(result))
 browser.close()
