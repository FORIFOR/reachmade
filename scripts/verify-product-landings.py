"""Read-only Chromium checks of all six video-first product pages through local Wrangler."""
from pathlib import Path
import json
import time
import urllib.request
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8787'
OUT = Path('film-qa/product-landings')
OUT.mkdir(parents=True, exist_ok=True)
PRODUCTS = ['genie','ai-meeting','oathra','aisecure','agent-team','launchloom']
VIEWPORTS = [(1440,1000),(1024,900),(390,844)]
report = {'scope': 'Six generated video-first product pages and packaged real recordings in local Chromium; product-specific hero composition at 1440 / 1024 / 390; not production or Safari', 'layouts': [], 'playback': [], 'errors': []}
end = time.monotonic() + 90
while True:
    try:
        with urllib.request.urlopen(BASE + '/', timeout=2) as response:
            if response.status == 200: break
    except Exception:
        if time.monotonic() > end: raise RuntimeError('Local Worker did not become ready')
        time.sleep(1)

def box(locator):
    value=locator.bounding_box()
    if not value: raise AssertionError('Element has no box')
    return {k:round(v,2) for k,v in value.items()}

with sync_playwright() as p:
    browser = p.chromium.launch()
    for width,height in VIEWPORTS:
        for lang in ['ja','en']:
            for product in PRODUCTS:
                route = ('/en' if lang == 'en' else '') + f'/products/{product}/'
                context = browser.new_context(viewport={'width': width, 'height': height}, reduced_motion='reduce')
                page = context.new_page(); page.set_default_timeout(30000)
                js_errors=[]; page.on('pageerror',lambda err:js_errors.append(str(err)))
                try:
                    page.goto(BASE + route, wait_until='networkidle')
                    assert page.locator('h1').count()==1
                    assert page.locator('.owned-film').count()==1
                    assert page.locator('.owned-flow li').count()==3
                    assert page.locator('.owned-boundaries article').count()==2
                    assert page.locator('.owned-try-now').count()==1
                    assert page.locator('.owned-action-note').count()==1
                    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
                    h1=box(page.locator('.owned-hero-grid h1'))
                    film=box(page.locator('.owned-film--hero'))
                    lead=box(page.locator('.owned-lead'))
                    first_try=box(page.locator('.owned-try-now'))
                    primary_locator=page.locator('.owned-hero-grid .owned-primary')
                    primary=box(primary_locator)
                    note=box(page.locator('.owned-action-note'))
                    video=page.locator('.owned-film video'); button=page.locator('.owned-film__play')
                    signature=page.evaluate("getComputedStyle(document.querySelector('.owned-hero-grid h1'),'::after').content")
                    assert signature and signature not in ('none','normal','\"\"'), (route,width,'missing art-direction signature')
                    assert video.get_attribute('src') is None, 'Video loaded before explicit intent'
                    assert video.get_attribute('preload')=='none'
                    assert video.get_attribute('poster')==f'/media/products/{product}.jpg'
                    b=button.bounding_box(); assert b and b['height']>=44
                    assert h1['y'] < height and film['y'] < height, (h1,film,height)
                    assert primary_locator.is_visible() and primary_locator.get_attribute('href').startswith('https://')
                    assert page.locator('.owned-try-now strong').inner_text().strip()
                    assert page.locator('.owned-action-note').inner_text().strip()
                    if width>=1101:
                        if product == 'ai-meeting':
                            assert film['y'] >= h1['y']+h1['height']-2, (route,h1,film)
                            assert film['width'] >= 1100, (route,film)
                            assert film['x'] <= h1['x']+2, (route,h1,film)
                        elif product == 'oathra':
                            assert film['x'] < h1['x'], (route,h1,film)
                            assert film['width'] > h1['width'], (route,h1,film)
                            assert abs(film['y']-h1['y']) < 180, (route,h1,film)
                        else:
                            assert film['x'] > h1['x'] + h1['width']*.55, (route,h1,film)
                            assert film['width'] > h1['width'], (route,h1,film)
                        if product != 'ai-meeting':
                            assert primary['y'] < height, (route,primary,height)
                        else:
                            assert primary['y'] <= height+160, (route,primary,height)
                        if lang == 'en':
                            assert h1['height'] <= 300, (route,h1)
                    else:
                        assert film['y'] >= h1['y']+h1['height']-2, (h1,film)
                        assert first_try['y'] >= film['y']+film['height']-2, (first_try,film)
                        assert primary['y'] >= first_try['y']+first_try['height']-2, (primary,first_try)
                        assert note['y'] >= primary['y']+primary['height']-2, (note,primary)
                        assert lead['y'] >= note['y']+note['height']-2, (lead,note)
                        assert primary['y'] <= height+120, (primary,height)
                        if width == 1024:
                            assert 735 <= film['width'] <= 745, (route,film)
                            assert primary['y'] <= height+40, (route,primary,height)
                    if width==390:
                        assert film['x']<=1 and film['width']>=388, film
                    assert not js_errors, js_errors
                    page.screenshot(path=str(OUT/f'{product}-{lang}-{width}.png'),full_page=True)
                    report['layouts'].append({'route':route,'product':product,'width':width,'headline':h1,'film':film,'lead':lead,'first_try':first_try,'primary_cta':primary,'action_note':note,'art_signature':signature,'product_specific_desktop':width<1101 or product in PRODUCTS,'overflow':False,'no_initial_media':True})
                except Exception as error:
                    report['errors'].append({'route':route,'width':width,'error':str(error)})
                    page.screenshot(path=str(OUT/f'failed-{product}-{lang}-{width}.png'),full_page=True)
                finally:
                    context.close()

    context = browser.new_context(viewport={'width':1440,'height':1000})
    page = context.new_page(); page.set_default_timeout(30000)
    for product in PRODUCTS:
        route=f'/products/{product}/'
        try:
            page.goto(BASE+route,wait_until='networkidle')
            video=page.locator('.owned-film video'); button=page.locator('.owned-film__play')
            button.click()
            page.wait_for_function("id => { const v=document.querySelector('.owned-film video'); return v && v.readyState>=2 && v.currentTime>.25 && !v.paused && !v.error && v.currentSrc.endsWith('/media/products/'+id+'.mp4'); }",arg=product)
            state=video.evaluate('(v)=>({src:v.currentSrc,duration:v.duration,time:v.currentTime,width:v.videoWidth,height:v.videoHeight,paused:v.paused})')
            assert 12 <= state['duration'] <= 14
            assert state['width']==1280 and state['height']==720
            assert not button.is_visible()
            video.evaluate('(v)=>v.pause()'); assert video.evaluate('(v)=>v.paused')
            report['playback'].append({'product':product,**state})
        except Exception as error:
            report['errors'].append({'playback':product,'error':str(error)})
    context.close(); browser.close()

assert len(report['layouts']) == len(PRODUCTS)*2*len(VIEWPORTS) or report['errors']
assert len(report['playback']) == len(PRODUCTS) or report['errors']
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
if report['errors']:
    print(json.dumps({'errors': report['errors']},ensure_ascii=False,indent=2))
else:
    selected=[x for x in report['layouts'] if x['width'] in (1440,1024,390) and x['route'].startswith('/products/')]
    print(json.dumps({'layout_count':len(report['layouts']),'playback_count':len(report['playback']),'selected_metrics':selected},ensure_ascii=False,indent=2))
raise SystemExit(bool(report['errors']))