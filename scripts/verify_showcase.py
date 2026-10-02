"""Acceptance for the current v4 homes and seven published product pages.

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
import re
import subprocess
import sys
import threading
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright, expect
from verify_home_v4 import assert_home_v4, begin_home_v4_requests, product_ledger, playback_home_v4, failure_home_v4, wait_native_media

IDS = [product['id'] for product in product_ledger()]

class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.mjs':'text/javascript'}
    def log_message(self, *args):
        pass

    def send_head(self):
        # The production Worker supports byte ranges. Native browser seeking
        # needs the same HTTP contract; SimpleHTTPRequestHandler ignores Range.
        self._media_range = None
        path = Path(self.translate_path(self.path))
        if path.suffix != '.mp4' or not path.is_file():
            return super().send_head()
        size = path.stat().st_size
        start, end = 0, size - 1
        requested = self.headers.get('Range')
        if requested:
            match = re.fullmatch(r'bytes=(\d*)-(\d*)', requested)
            if not match or not any(match.groups()):
                self.send_error(416, 'Unsatisfiable byte range')
                return None
            first, last = match.groups()
            if first:
                start = int(first)
                end = min(int(last), end) if last else end
            else:
                start = max(0, size - int(last))
            if start > end or start >= size:
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{size}')
                self.send_header('Content-Length', '0')
                self.end_headers()
                return None
        stream = path.open('rb')
        self._media_range = (start, end)
        self.send_response(206 if requested else 200)
        self.send_header('Content-Type', 'video/mp4')
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Length', str(end - start + 1))
        if requested:
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.end_headers()
        return stream

    def copyfile(self, source, outputfile):
        if self._media_range is None:
            return super().copyfile(source, outputfile)
        start, end = self._media_range
        source.seek(start)
        remaining = end - start + 1
        while remaining:
            chunk = source.read(min(64 * 1024, remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            remaining -= len(chunk)

# Product pages whose top film is a produced film rather than the product recording, with the
# sentence its caption must carry. Japanese Genie plays its TaskDock reconstruction (src/genie-lp.mjs, TOP_FILM).
PAGE_FILMS = {('ja', 'genie'): ('/media/films/genie-taskdock-13s.mp4', '実アプリの録画ではありません')}

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

    def native_noa(page, failed=False):
        """Noa's Japanese page has an explicitly labelled native film, not a story widget."""
        figure = page.locator('.nlp-film')
        video = figure.locator('video')
        source = video.locator('source').get_attribute('src')
        assert source == '/media/originals/noa/lp-film.mp4'
        expect(figure.locator('figcaption')).to_contain_text('配信の実録画ではありません')
        assert video.get_attribute('controls') is not None and video.get_attribute('autoplay') is None
        assert video.get_attribute('preload') == 'none' and video.evaluate('v=>v.paused')
        if failed:
            # Reload the actual aborted resource. No replacement response or video is supplied.
            failures = []
            for _ in range(2):
                with page.expect_event('requestfailed', predicate=lambda request: request.url == urljoin(page.url, source)) as failed_request:
                    video.evaluate('v=>{v.load();v.play().catch(()=>{})}')
                # A failed <source> candidate reports NETWORK_NO_SOURCE; unlike
                # a video.src failure it need not set HTMLMediaElement.error or
                # settle the play promise. Measure failed requests and no frames.
                wait_native_media(page, '()=>{const v=document.querySelector(".nlp-film video");return (Boolean(v.error) || v.networkState===HTMLMediaElement.NETWORK_NO_SOURCE) && v.readyState===HTMLMediaElement.HAVE_NOTHING && v.currentTime===0}', phase='Noa: aborted native source', selector='.nlp-film video')
                assert video.evaluate('v=>v.getVideoPlaybackQuality().totalVideoFrames===0')
                assert failed_request.value.failure
                failures.append(failed_request.value.failure)
                expect(video).to_be_visible()
                expect(page.locator('.nlp-actions .owned-primary')).to_be_visible()
            return {'native_error': True, 'same_source_retry': True, 'channel_accessible': True,
                    'failed_requests': failures, 'decoded_frames': 0}
        video.evaluate('v=>v.play()')
        wait_native_media(page, '()=>{const v=document.querySelector(".nlp-film video");return !v.paused && v.currentTime>.25 && v.readyState>=2}', phase='Noa: explicit native playback', selector='.nlp-film video')
        info = video.evaluate('v=>({duration:v.duration,rate:v.playbackRate,src:v.currentSrc,frames:v.getVideoPlaybackQuality().totalVideoFrames})')
        manifest = json.loads((root/'public/media/originals/manifest.json').read_text())
        original = next(item for item in manifest['files'] if item['path'] == source)
        assert abs(info['duration'] - original['duration']) < .5 and info['rate'] == 1 and info['frames'] > 0, info
        assert info['src'] == urljoin(page.url, source)
        video.evaluate('v=>{v.pause();v.currentTime=3}')
        wait_native_media(page, '()=>{const v=document.querySelector(".nlp-film video");return v.paused && !v.seeking && v.currentTime>=2.9}', phase='Noa: paused native seek', selector='.nlp-film video')
        return {**info, 'native_pause_seek': True}

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
                    if product == 'home':
                        begin_home_v4_requests(page)
                    page.set_default_timeout(20000)
                    try:
                        page.goto(origin+route, wait_until='networkidle')
                        if product == 'home':
                            info = playback_home_v4(page)
                        elif lang == 'ja' and product == 'noa':
                            info = native_noa(page)
                        else:
                            page.wait_for_selector(selector+' [data-mode="recording"]')
                            check_story(page, selector, product)
                            enter_recording(page, selector)
                            video = page.locator(selector+' video')
                            assert video.evaluate('(v)=>v.paused && v.currentTime===0')
                            assert video.get_attribute('src') is None, 'A recording must not be fetched before play'
                            page.locator(selector).locator('.owned-film__play').click()
                            page.wait_for_function('s=>{const v=document.querySelector(s+" video");return !v.paused && v.currentTime>.25 && v.readyState>=2;}',arg=selector)
                            info = video.evaluate('(v)=>({duration:v.duration,rate:v.playbackRate,time:v.currentTime,src:v.currentSrc,frames:v.getVideoPlaybackQuality().totalVideoFrames})')
                            assert 12.5 <= info['duration'] <= 13.5, info
                            assert info['rate'] == 1 and info['frames'] > 0, info
                            if (lang, product) in PAGE_FILMS:
                                # A produced film on a product page must be the declared file and say what it is.
                                assert info['src'] == origin+PAGE_FILMS[(lang, product)][0], info
                                caption = page.locator(selector+' figcaption').inner_text()
                                assert PAGE_FILMS[(lang, product)][1] in caption and '実録画' not in page.locator(selector+' .owned-film__bar').inner_text(), caption
                            else:
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
                    context.route('**/media/**/*.mp4', lambda route:route.abort('failed'))
                    page = context.new_page()
                    if product == 'home':
                        begin_home_v4_requests(page)
                    page.set_default_timeout(20000)
                    try:
                        page.goto(origin+route, wait_until='networkidle')
                        if product == 'home':
                            details = failure_home_v4(page)
                        elif lang == 'ja' and product == 'noa':
                            details = native_noa(page, failed=True)
                        else:
                            page.wait_for_selector(selector+' [data-mode="recording"]')
                            enter_recording(page, selector)
                            button = page.locator(selector).locator('.owned-film__play')
                            button.click()
                            page.wait_for_function('s=>document.querySelector(s).dataset.mediaState==="unavailable"',arg=selector)
                            assert page.locator(selector+' video').is_hidden()
                            assert page.locator(selector+' .owned-film__screen>img').is_visible()
                            assert page.locator(selector+' .owned-film__status').is_visible()
                            assert button.is_enabled() and button.is_visible()
                            assert page.locator(selector+' figcaption a').first.is_visible()
                            with page.expect_request('**'+PAGE_FILMS[(lang, product)][0] if (lang, product) in PAGE_FILMS else '**/media/products/*.mp4'):
                                button.click()
                            page.wait_for_function('s=>document.querySelector(s).dataset.mediaState==="unavailable"',arg=selector)
                            check_story(page, selector, product)
                            details = {'network_aborted':True,'retry':True,'return_to_story':True}
                        report['failure_recovery'].append({'case':key,**details})
                    except Exception as exc:
                        report['errors'].append({'case':'failure-'+key,'error':str(exc)})
                    finally:
                        context.close()
            for lang, route in [('ja', '/'), ('en', '/en/')]:
                context = browser.new_context(java_script_enabled=False, viewport={'width':390,'height':844})
                page = context.new_page()
                begin_home_v4_requests(page)
                try:
                    page.goto(origin+route, wait_until='networkidle')
                    details = assert_home_v4(page, interactive=False)
                    report['no_javascript'].append({'case':lang+'-home',**details})
                except Exception as exc:
                    report['errors'].append({'case':'no-js-'+lang+'-home','error':repr(exc)})
                finally:
                    context.close()
            for product in ([] if home_only else ['genie','launchloom','noa']):
                context = browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
                page = context.new_page()
                try:
                    page.goto(origin+'/products/'+product+'/',wait_until='networkidle')
                    assert page.locator('.owned-primary').first.is_visible()
                    if product == 'noa':
                        expect(page.locator('.nlp-film video')).to_be_visible()
                        assert page.locator('.nlp-film video').evaluate('v=>v.controls && v.paused')
                        expect(page.locator('.nlp-film figcaption')).to_contain_text('配信の実録画ではありません')
                    else:
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
