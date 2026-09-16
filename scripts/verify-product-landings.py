"""Read-only Chromium checks of generated pages through the real local Worker."""
from pathlib import Path
import json
import time
import urllib.request
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8787'
OUT = Path('film-qa/product-landings')
OUT.mkdir(parents=True, exist_ok=True)
report = {'scope': 'Generated pages and actual packaged recordings in local Chromium, not production or Safari', 'checks': [], 'errors': []}
end = time.monotonic() + 90
while True:
    try:
        with urllib.request.urlopen(BASE + '/', timeout=2) as response:
            if response.status == 200:
                break
    except Exception:
        if time.monotonic() > end:
            raise RuntimeError('Local Worker did not become ready')
        time.sleep(1)

with sync_playwright() as p:
    browser = p.chromium.launch()
    for width in [390, 1440]:
        for lang in ['ja', 'en']:
            for product in ['genie', 'ai-meeting']:
                route = ('/en' if lang == 'en' else '') + f'/products/{product}/'
                context = browser.new_context(viewport={'width': width, 'height': 900}, reduced_motion='reduce')
                page = context.new_page()
                errors = []
                page.on('pageerror', lambda err: errors.append(str(err)))
                try:
                    page.goto(BASE + route, wait_until='networkidle')
                    video = page.locator('.owned-film video')
                    button = page.locator('.owned-film__play')
                    assert video.count() == 1
                    assert video.get_attribute('src') is None, 'Video was loaded before explicit intent'
                    assert video.get_attribute('preload') == 'none'
                    bounds = button.bounding_box()
                    assert bounds and bounds['height'] >= 44
                    button.click()
                    page.wait_for_function("() => { const v=document.querySelector('.owned-film video'); return v && v.readyState>=2 && v.currentTime>0.25 && !v.error; }", timeout=30000)
                    state = video.evaluate('(v)=>({src:v.currentSrc,duration:v.duration,time:v.currentTime,width:v.videoWidth,height:v.videoHeight,controls:v.controls})')
                    assert state['src'] == BASE + f'/media/products/{product}.mp4'
                    assert state['width'] > 0 and state['duration'] > 1 and state['controls']
                    assert not button.is_visible()
                    video.evaluate('(v)=>v.pause()')
                    assert video.evaluate('(v)=>v.paused')
                    overflow = page.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
                    assert not overflow, 'Horizontal overflow'
                    assert not errors, errors
                    page.screenshot(path=str(OUT / f'{product}-{lang}-{width}.png'), full_page=True)
                    report['checks'].append({'route':route,'width':width,'no_initial_media':True,'explicit_playback':state,'paused_with_native_api':True,'overflow':False})
                except Exception as error:
                    report['errors'].append({'route':route,'width':width,'error':str(error)})
                    page.screenshot(path=str(OUT / f'failed-{product}-{lang}-{width}.png'), full_page=True)
                finally:
                    context.close()
    browser.close()
(OUT / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(json.dumps(report, ensure_ascii=False, indent=2))
raise SystemExit(bool(report['errors']))
