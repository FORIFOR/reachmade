"""Offline DOM/render tests. No navigation to external hosts or localhost.
Requires Python 3 and Playwright + Chromium. Build first with npm run build.
This does not validate live Cloudflare, CSP enforcement, Safari or email delivery.
"""
from pathlib import Path
import argparse, json, os, re, shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--screenshots',default=str(ROOT/'test-results/screenshots'))
args=parser.parse_args()
OUT=Path(args.screenshots);OUT.mkdir(parents=True,exist_ok=True)
CSS=(ROOT/'public/assets/site.css').read_text()
JS=(ROOT/'public/assets/site.js').read_text()
ROUTES=json.loads((ROOT/'docs/routes.json').read_text())
results=[]

def check(name,fn):
 try:
  fn();results.append({'name':name,'passed':True})
 except Exception as exc:
  results.append({'name':name,'passed':False,'error':str(exc)});print('FAIL',name,str(exc)[:500])

def load(page,route='/',enhance=True):
 file=ROOT/'dist'/route.strip('/')/'index.html' if route!='/404.html' else ROOT/'dist/404.html'
 html=file.read_text()
 # In-memory rendering: do not navigate around an environment's network policy.
 html=re.sub(r'<link\b[^>]+(?:rel="stylesheet"|rel="icon")[^>]*>','',html)
 html=re.sub(r'<script\b[^>]*src=[^>]*></script>','',html)
 page.set_content(html,wait_until='domcontentloaded')
 page.add_style_tag(content=CSS)
 if enhance:page.add_script_tag(content=JS)
 page.evaluate("window.scrollTo({top:0,left:0,behavior:'instant'})")
 page.wait_for_timeout(30)

def expect(value,message):
 assert value,message

with sync_playwright() as p:
 executable=os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')
 opts={'headless':True}
 if executable:opts['executable_path']=executable
 if os.geteuid()==0:opts['args']=['--no-sandbox','--disable-dev-shm-usage']
 browser=p.chromium.launch(**opts)
 version=browser.version
 for route in [r['route'] for r in ROUTES]+['/404.html']:
  for width in [320,390,768,1440,1920]:
   def layout(route=route,width=width):
    page=browser.new_page(viewport={'width':width,'height':900},device_scale_factor=1)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    try:
     load(page,route)
     info=page.evaluate('''() => ({page:document.documentElement.scrollWidth, viewport:innerWidth, bad:[...document.querySelectorAll('main *, header *, footer *')].filter(e => {const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left<-1);}).slice(0,8).map(e=>({tag:e.tagName,cls:e.className,x:e.getBoundingClientRect().x,right:e.getBoundingClientRect().right}))})''')
     expect(info['page']<=width+1,f'Horizontal overflow: {info}')
     expect(not errors,f'JS errors: {errors}')
     expect(page.locator('h1').count()==1,'one h1')
     expect(page.locator('main').is_visible(),'main visible')
    finally:page.close()
   check(f'layout {route} {width}px',layout)

 page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
 def menu():
  load(page)
  toggle=page.locator('.nav-toggle');nav=page.locator('#main-nav')
  expect(toggle.is_visible(),'toggle visible')
  expect(not nav.is_visible(),'collapsed initially')
  toggle.click();expect(toggle.get_attribute('aria-expanded')=='true' and nav.is_visible(),'opens')
  page.keyboard.press('Escape');expect(not nav.is_visible(),'escape closes')
  expect(toggle.evaluate('(el)=>el===document.activeElement'),'focus returns')
  toggle.click();page.locator('h1').click();expect(not nav.is_visible(),'outside closes')
 check('mobile menu, Escape, focus, outside click',menu)
def filter_products():
  load(page,'/products/')
  total=page.locator('.project-row').count()
  expect(page.locator('.project-row:visible').count()==total,'initial products')
  page.locator('[data-filter="voice"]').click();expect(page.locator('.project-row:visible').count()==2,'voice has 2')
  expect(page.locator('[data-filter="voice"]').get_attribute('aria-pressed')=='true','pressed state')
  expect(page.locator('.filter-count').inner_text().startswith('2'),'count updated')
  page.locator('[data-filter="trust"]').click();expect(page.locator('.project-row:visible').count()==1,'trust has 1')
  page.locator('[data-filter="all"]').click();expect(page.locator('.project-row:visible').count()==total,'reset products')
 check('product filters, count and selected state',filter_products)
 def disclosures():
  load(page,'/products/')
  first=page.locator('.project-detail').first;first.locator('summary').click()
  expect(first.get_attribute('open') is not None,'details opens')
  expect(first.locator('div').first.is_visible(),'content visible')
 check('product disclosure works',disclosures)
 def draft_validation():
  load(page,'/contact/')
  page.locator('#copy-brief').click()
  expect(page.locator('#brief').get_attribute('aria-invalid')=='true','required input invalid')
  expect('入力' in page.locator('.copy-status').inner_text(),'error message')
 check('brief rejects empty input without submission',draft_validation)
 def copy_fallback():
  load(page,'/contact/')
  page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('permission denied')}}})")
  page.locator('#brief').fill('予約変更をAIで試したい。<script>ignored</script>')
  page.locator('#timing').fill('未定')
  page.locator('#copy-brief').click()
  expect(page.locator('#copy-fallback').is_visible(),'fallback visible')
  expect('<script>ignored</script>' in page.locator('#copy-fallback').input_value(),'text remains literal')
  expect('まだ送信していません' in page.locator('.copy-status').inner_text(),'no false submission')
  expect(page.locator('form').count()==0,'no form')
 check('clipboard denial uses safe manual copy; no fake success',copy_fallback)
 def copy_success():
  load(page,'/en/contact/')
  page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(t)=>{window.__copied=t}}})")
  page.locator('#brief').fill('Test a phone workflow.')
  page.locator('#copy-brief').click()
  expect('Test a phone workflow.' in page.evaluate('window.__copied'),'clipboard content')
  expect('Nothing has been sent' in page.locator('.copy-status').inner_text(),'no false submission')
  expect(not page.locator('#copy-fallback').is_visible(),'fallback hidden')
 check('clipboard success is distinct from inquiry submission',copy_success)
 def no_js():
  load(page,'/products/',enhance=False)
  expect(page.locator('#main-nav').is_visible(),'navigation available without JS')
  expect(page.locator('.project-row:visible').count()==6,'all products available without JS')
  expect(not page.locator('.product-filters').is_visible(),'nonworking filters hidden')
  load(page,'/contact/',enhance=False)
  expect(not page.locator('#copy-brief').is_visible(),'nonworking copy button hidden')
  expect(page.locator('.contact-destination a').count()>0 if page.locator('.contact-destination').count() else page.locator('a[href*="#business"]').count()>0,'external contact visible')
 check('no-JavaScript navigation, content and contact fallback',no_js)
 def reduced_motion():
  page.emulate_media(reduced_motion='reduce');load(page)
  expect(page.evaluate("getComputedStyle(document.documentElement).scrollBehavior")!='smooth','no forced smooth scrolling')
  page.emulate_media(reduced_motion='no-preference')
 check('reduced motion disables smooth scrolling',reduced_motion)
 for r in ['products','services','work','about','contact','privacy']:
  def language(r=r):
   load(page,'/'+r+'/');expect(page.locator('.language-switch').get_attribute('href')=='/en/'+r+'/','route preserved in EN switch')
  check('language switch retains '+r,language)
 for name,w,h,route in [('home-desktop',1440,1000,'/'),('home-mobile',390,844,'/'),('products-desktop',1440,1000,'/products/'),('contact-mobile',390,844,'/contact/'),('home-en',1440,1000,'/en/')]:
  page.set_viewport_size({'width':w,'height':h});load(page,route)
  page.mouse.move(0,0);page.wait_for_timeout(250)
  page.screenshot(path=str(OUT/f'{name}.png'),full_page=True)
  if name in ('home-desktop','home-mobile'):page.screenshot(path=str(OUT/f'{name}-first-screen.png'))
 page.close();browser.close()
report={'testedAt':'2026-09-15','mode':'In-memory HTML/CSS/JS rendering, not HTTP navigation or Cloudflare deployment','browser':'Chromium '+version,'passed':sum(x['passed'] for x in results),'failed':sum(not x['passed'] for x in results),'checks':results,'notTested':['Cloudflare authentication and live deployment','External demo availability and actual product execution','Existing external contact form delivery','Safari / iPhone / real mobile devices','Live CSP enforcement in the browser','Core Web Vitals field data or Lighthouse score']}
(ROOT/'docs/browser-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='checks'},ensure_ascii=False,indent=2))
raise SystemExit(1 if report['failed'] else 0)
