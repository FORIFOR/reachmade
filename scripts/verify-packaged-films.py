"""Check built pages and packaged recordings via local Wrangler; never deploy."""
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
    report = {'scope': 'Packaged media and built pages through local Wrangler, not production or Safari', 'media': [], 'pages': [], 'errors': []}
    for attempt in range(60):
        try:
            with urllib.request.urlopen(BASE, timeout=2) as response:
                if response.status == 200: break
        except Exception:
            if attempt == 59: raise
            time.sleep(1)
    for item in manifest['recordings']:
        try:
            target = ROOT / 'dist' / item['path'].lstrip('/')
            raw = target.read_bytes()
            assert hashlib.sha256(raw).hexdigest() == item['sha256']
            assert len(raw) == item['bytes'] < 25 * 1024 * 1024
            metadata = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height', '-of', 'json', str(target)], text=True, timeout=30))
            assert any(s.get('codec_type') == 'video' for s in metadata['streams'])
            assert float(metadata['format']['duration']) > 1
            for method, headers in [('HEAD', {}), ('GET', {'Range': 'bytes=0-63'})]:
                with urllib.request.urlopen(urllib.request.Request(BASE + item['path'], method=method, headers=headers), timeout=15) as r:
                    assert r.status == (206 if headers else 200), (item['id'], r.status)
                    assert r.headers.get_content_type() == 'video/mp4'
                    if method == 'GET': assert len(r.read()) == 64
            report['media'].append({'id': item['id'], 'sha256': item['sha256'], 'bytes': len(raw), 'metadata': metadata, 'head_and_range': True})
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
                        if sub in ['', 'products/']:
                            assert page.locator('.rm-film-preview').count() == 6
                            assert page.locator('.rm-film-preview[src]').count() == 0
                        if sub == 'contact/':
                            assert page.locator('.optional-brief').get_attribute('open') is None
                        report['pages'].append({'route': route, 'width': width, 'overflow': False})
                    except Exception as error: report['errors'].append(route + ': ' + str(error))
            context.close()
        context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
        page = context.new_page(); page.set_default_timeout(20000)
        page.goto(BASE + '/products/', wait_until='networkidle')
        for item in manifest['recordings']:
            try:
                frame = page.locator('[data-product-film="' + item['id'] + '"]')
                frame.scroll_into_view_if_needed(); frame.locator('.rm-film-toggle').click()
                page.wait_for_function('id => { const v=document.querySelector(`[data-product-film="${id}"] video`); return !v.paused && v.readyState>=2 && v.getVideoPlaybackQuality().totalVideoFrames > 0; }', arg=item['id'])
                frame.locator('.rm-film-toggle').click()
                assert frame.locator('video').evaluate('v=>v.paused')
                frame.locator('.rm-film-expand').click()
                page.wait_for_function('()=>document.querySelector(".rm-film-full").readyState>=2')
                page.locator('.rm-film-full').evaluate('v=>{v.pause();v.currentTime=Math.min(3,v.duration/2)}')
                page.wait_for_function('()=>document.querySelector(".rm-film-full").currentTime>0')
                page.locator('.rm-film-close').click()
                report['media'][list(manifest['recordings']).index(item)]['play_pause_expand_seek'] = True
            except Exception as error: report['errors'].append('playback ' + item['id'] + ': ' + str(error))
        browser.close()
    (out / 'packaged-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report['errors']: raise SystemExit(1)

if __name__ == '__main__': main()
