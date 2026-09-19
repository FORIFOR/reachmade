"""Compatibility acceptance for the active outcome-first site.

Run the current, full-build local-HTTP layout suite, then independently test
real packaged playback, native errors/retry, UI-story stillness and no-script
product access. No HTML/CSS/JS rewriting or substitute product images.
This is not production, physical-device or Worker delivery acceptance; the
separate packaged-media/Worker workflow retains that scope.
"""
from __future__ import annotations
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import subprocess
import sys
import threading
from playwright.sync_api import sync_playwright

IDS = ['genie','ai-meeting','oathra','aisecure','agent-team','launchloom']

class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.mjs':'text/javascript'}
    def log_message(self, *args):
        pass

def main(home_only=False, output='film-qa/product-landings'):
    root = Path(__file__).resolve().parents[1]
    out = root / output
    out.mkdir(parents=True, exist_ok=True)
    # Old first-fold selector and data-user-intent assertions described a retired
    # page/player. Keep layout acceptance on the active, already tested renderer.
    layout = subprocess.run([sys.executable, str(root/'scripts/verify-outcome-first.py'), '--browser', 'chromium'], cwd=root)
    source_report = root/'film-qa/outcome-first/chromium/report.json'
    report = {'scope':'Unmodified built assets over local HTTP; not production or physical Safari',
              'layout_exit_code':layout.returncode, 'playback':[], 'failure_recovery':[],
              'no_javascript':[], 'errors':[]}
    if source_report.exists():
        report['layout_report'] = json.loads(source_report.read_text(encoding='utf-8'))
    if layout.returncode:
        report['errors'].append({'case':'full-built-layout','error':'Current layout/interaction suite failed; see embedded report'})
    server = ThreadingHTTPServer(('127.0.0.1',0), partial(Handler, directory=str(root/'dist')))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = f'http://127.0.0.1:{server.server_port}'

    def enter_recording(page, selector):
        page.locator(selector+' [data-mode="recording"]').click()
        assert page.locator(selector+' .rm-live-demo').is_hidden()

    def check_story(page, selector, product):
        page.locator(selector+' [data-mode="story"]').click()
        story = page.locator(selector+' .rm-live-demo')
        assert story.is_visible()
        assert story.locator('.rm-chapters button').count() == 5
        assert story.locator('.rm-demo-disclosure').inner_text().strip()
        story.locator('[data-cue="4"]').click()
        assert story.get_attribute('data-phase') == '4'
        assert story.get_attribute('data-running') == 'false'
        assert story.locator('.rm-app').get_attribute('data-product') == product
        position = story.locator('.rm-demo-scrub input').input_value()
        page.wait_for_timeout(160)
        assert story.locator('.rm-demo-scrub input').input_value() == position

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        try:
            for lang, prefix in [('ja','/'),('en','/en/')]:
                routes = [(prefix,'home')] + ([] if home_only else [(prefix+'products/'+p+'/',p) for p in IDS])
                for route, product in routes:
                    selector = '.studio-player' if product=='home' else '.owned-film'
                    key = lang+'-'+product
                    context = browser.new_context(viewport={'width':1440,'height':1000}, reduced_motion='reduce')
                    page = context.new_page()
                    page.set_default_timeout(20000)
                    try:
                        page.goto(origin+route, wait_until='networkidle')
                        page.wait_for_selector(selector+' [data-mode="recording"]')
                        check_story(page, selector, 'genie' if product=='home' else product)
                        enter_recording(page, selector)
                        video = page.locator(selector+' video')
                        assert video.evaluate('(v)=>v.paused && v.currentTime===0')
                        assert video.get_attribute('src') is None, 'A recording must not be fetched before play'
                        page.locator(selector).locator('.studio-play,.owned-film__play').click()
                        page.wait_for_function('s=>{const v=document.querySelector(s+" video");return !v.paused && v.currentTime>.25 && v.readyState>=2;}',arg=selector)
                        info = video.evaluate('(v)=>({duration:v.duration,rate:v.playbackRate,time:v.currentTime,src:v.currentSrc,frames:v.getVideoPlaybackQuality().totalVideoFrames})')
                        assert 12.5 <= info['duration'] <= 13.5, info
                        assert info['rate'] == 1 and info['frames'] > 0, info
                        assert info['src'].startswith(origin+'/media/products/'), info
                        video.evaluate('(v)=>v.pause()')
                        assert video.evaluate('(v)=>v.paused')
                        report['playback'].append({'case':key,**info})
                    except Exception as exc:
                        report['errors'].append({'case':'playback-'+key,'error':str(exc)})
                    finally:
                        context.close()
                    # A fresh page really aborts the HTTP media request. This is
                    # neither a mocked video element nor an injected DOM error.
                    context = browser.new_context(viewport={'width':390,'height':844}, reduced_motion='reduce')
                    context.route('**/media/products/*.mp4', lambda route:route.abort('failed'))
                    page = context.new_page()
                    page.set_default_timeout(20000)
                    try:
                        page.goto(origin+route, wait_until='networkidle')
                        page.wait_for_selector(selector+' [data-mode="recording"]')
                        enter_recording(page, selector)
                        button = page.locator(selector).locator('.studio-play,.owned-film__play')
                        button.click()
                        page.wait_for_function('s=>document.querySelector(s).dataset.mediaState==="unavailable"',arg=selector)
                        assert page.locator(selector+' video').is_hidden()
                        assert page.locator(selector+' .studio-player-screen>img,'+selector+' .owned-film__screen>img').is_visible()
                        assert page.locator(selector+' .studio-media-status,'+selector+' .owned-film__status').is_visible()
                        assert button.is_enabled() and button.is_visible()
                        assert page.locator(selector+' figcaption a').first.is_visible()
                        # Retry must issue the same guarded recording request,
                        # then expose the same safe fallback when it fails.
                        with page.expect_request('**/media/products/*.mp4'):
                            button.click()
                        page.wait_for_function('s=>document.querySelector(s).dataset.mediaState==="unavailable"',arg=selector)
                        check_story(page, selector, 'genie' if product=='home' else product)
                        report['failure_recovery'].append({'case':key,'network_aborted':True,'retry':True,'return_to_story':True})
                    except Exception as exc:
                        report['errors'].append({'case':'failure-'+key,'error':str(exc)})
                    finally:
                        context.close()
            for product in ([] if home_only else ['genie','launchloom']):
                context = browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
                page = context.new_page()
                try:
                    page.goto(origin+'/products/'+product+'/',wait_until='networkidle')
                    assert page.locator('.owned-primary').first.is_visible()
                    assert page.locator('.owned-film__screen>img').is_visible()
                    assert page.locator('.owned-film figcaption a').first.is_visible()
                    assert page.locator('.owned-film__play').is_hidden()
                    report['no_javascript'].append(product)
                except Exception as exc:
                    report['errors'].append({'case':'no-js-'+product,'error':str(exc)})
                finally:
                    context.close()
        finally:
            browser.close()
            server.shutdown()
            server.server_close()
            (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if report['errors']:
        raise SystemExit(1)

if __name__=='__main__':
    main()
