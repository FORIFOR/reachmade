"""Check premium built pages and packaged recordings via local Wrangler; never deploy."""
from pathlib import Path
import hashlib
import json
import subprocess
import time
import urllib.request
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = 'http://127.0.0.1:8787'

def main():
    out = ROOT / 'film-qa'; out.mkdir(exist_ok=True)
    manifest = json.loads((ROOT / 'dist/media/products/manifest.json').read_text())
    report = {'scope': 'Premium website edits, posters and built pages through local Wrangler; not production or Safari', 'media': [], 'pages': [], 'errors': []}
    by_id = {}
    assert manifest['schema'] == 2
    assert manifest['mode'] == 'premium-site-edits'
    assert manifest['policy']['speed'] == 1
    assert manifest['policy']['audio'] is False
    assert len(manifest['recordings']) == 6
    for attempt in range(60):
        try:
            with urllib.request.urlopen(BASE, timeout=2) as response:
                if response.status == 200: break
        except Exception:
            if attempt == 59: raise
            time.sleep(1)
    for item in manifest['recordings']:
        result = {'id': item['id'], 'sha256': item['sha256'], 'source_sha256': item['sourceSha256']}
        report['media'].append(result); by_id[item['id']] = result
        try:
            assert item['edit']['speed'] == 1 and item['edit']['audio'] is False
            assert len(item['edit']['clips']) == 2
            target = ROOT / 'dist' / item['path'].lstrip('/')
            raw = target.read_bytes()
            assert hashlib.sha256(raw).hexdigest() == item['sha256']
            assert len(raw) == item['bytes'] < 25 * 1024 * 1024
            poster = ROOT / 'dist' / item['poster'].lstrip('/')
            poster_raw = poster.read_bytes()
            assert poster_raw[:2] == b'\xff\xd8' and poster_raw[-2:] == b'\xff\xd9'
            assert (ROOT / 'dist/assets/products' / f"{item['id']}.jpg").read_bytes() == poster_raw
            metadata = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height,avg_frame_rate', '-of', 'json', str(target)], text=True, timeout=30))
            video = [s for s in metadata['streams'] if s.get('codec_type') == 'video']
            audio = [s for s in metadata['streams'] if s.get('codec_type') == 'audio']
            assert len(video) == 1 and not audio
            assert video[0].get('codec_name') == 'h264'
            assert video[0].get('width') == 1280 and video[0].get('height') == 720
            duration = float(metadata['format']['duration'])
            assert 12.5 <= duration <= 13.5, (item['id'], duration)
            result.update(bytes=len(raw), poster_bytes=len(poster_raw), duration=duration, metadata=metadata)
            for method, headers in [('HEAD', {}), ('GET', {'Range': 'bytes=0-63'})]:
                with urllib.request.urlopen(urllib.request.Request(BASE + item['path'], method=method, headers=headers), timeout=15) as r:
                    assert r.status == (206 if headers else 200), (item['id'], method, r.status)
                    assert r.headers.get_content_type() == 'video/mp4'
                    if method == 'GET': assert r.read() == raw[:64]
            with urllib.request.urlopen(BASE + item['poster'], timeout=15) as r:
                assert r.status == 200 and r.headers.get_content_type() in ('image/jpeg','image/jpg')
            result['head_range_poster'] = True
        except Exception as error: report['errors'].append(item['id'] + ': ' + str(error))
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for width in [390, 1440]:
            context = browser.new_context(viewport={'width': width, 'height': 1000}, reduced_motion='reduce')
            page = context.new_page(); page.set_default_timeout(20000)
            page.on('pageerror', lambda error: report['errors'].append('page: ' + str(error)))
            for language in ['', 'en/']:
                for sub in ['', 'products/', 'services/', 'work/', 'about/', 'contact/', 'privacy/']:
                    route = '/' + language + sub
                    try:
                        page.goto(BASE + route, wait_until='networkidle')
                        assert page.locator('h1').count() == 1
                        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), route
                        if sub == '':
                            assert page.locator('.hero .rm-film-preview').count() == 1
                            assert page.locator('.hero [data-product-film="genie"]').count() == 1
                            assert page.locator('.compact-products .rm-film-preview').count() == 0
                            assert page.locator('.rm-film-preview[src]').count() == 0
                            assert page.locator('.hero .rm-film-preview').evaluate('(v)=>v.paused')
                            assert page.locator('.hero .rm-film-preview').get_attribute('poster') == '/media/products/genie.jpg'
                        elif sub == 'products/':
                            assert page.locator('.rm-film-preview').count() == 6
                            assert page.locator('.rm-film-preview[src]').count() == 0
                            for item in manifest['recordings']:
                                assert page.locator(f'[data-product-film="{item["id"]}"] video').get_attribute('poster') == item['poster']
                        if sub == 'contact/':
                            assert page.locator('#reachmade-inquiry').count() == 1
                            assert not page.locator('input[name="consent"]').is_checked()
                            assert page.locator('#inquiry-submit').is_disabled()
                            assert not page.locator('#inquiry-result').get_attribute('data-receipt')
                        report['pages'].append({'route': route, 'width': width, 'overflow': False})
                    except Exception as error: report['errors'].append(route + ': ' + str(error))
            context.close()
        context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
        page = context.new_page(); page.set_default_timeout(20000)
        for item in manifest['recordings']:
            try:
                page.goto(BASE + '/products/', wait_until='networkidle')
                frame = page.locator('[data-product-film="' + item['id'] + '"]')
                frame.scroll_into_view_if_needed(); frame.locator('.rm-film-toggle').click()
                page.wait_for_function('id => { const v=document.querySelector(`[data-product-film="${id}"] video`); return !v.paused && v.readyState>=2 && v.getVideoPlaybackQuality().totalVideoFrames > 0; }', arg=item['id'])
                frame.locator('.rm-film-toggle').click()
                assert frame.locator('video').evaluate('v=>v.paused')
                frame.locator('.rm-film-expand').click()
                page.wait_for_function('()=>document.querySelector(".rm-film-full").readyState>=2')
                page.locator('.rm-film-full').evaluate('v=>{v.pause();v.currentTime=Math.min(3,v.duration/2)}')
                page.wait_for_function('()=>{const v=document.querySelector(".rm-film-full");return !v.seeking && v.currentTime>0 && v.readyState>=2}')
                page.locator('.rm-film-close').click()
                assert page.locator('.rm-film-dialog').get_attribute('open') is None
                by_id[item['id']]['play_pause_expand_seek'] = True
            except Exception as error:
                report['errors'].append('playback ' + item['id'] + ': ' + str(error))
                by_id[item['id']]['playback_state'] = page.locator('.rm-film-full').evaluate('(v)=>({src:v.currentSrc,error:v.error?.code,time:v.currentTime,readyState:v.readyState})') if page.locator('.rm-film-full').count() else None
            finally:
                page.evaluate('document.querySelector(".rm-film-dialog[open]")?.close()')
        browser.close()
    (out / 'packaged-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report['errors']: raise SystemExit(1)

if __name__ == '__main__': main()
