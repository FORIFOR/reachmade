"""Read-only QA for rendered premium product films; never deploy or access credentials."""
from pathlib import Path
import functools
import hashlib
import http.server
import json
import subprocess
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'film-qa'
OUT.mkdir(exist_ok=True)
MEDIA = ROOT / 'dist/media/products'
manifest = json.loads((MEDIA / 'manifest.json').read_text())
report = {'scope': 'Rendered premium product films and locally built product directory. Not production or Safari.', 'media': [], 'browser': [], 'errors': []}

try:
    assert manifest['schema'] == 2 and manifest['mode'] == 'premium-site-edits'
    assert manifest['policy']['speed'] == 1 and manifest['policy']['audio'] is False
    assert len(manifest['recordings']) == 6
except Exception as error:
    report['errors'].append('manifest: ' + str(error))

for item in manifest.get('recordings', []):
    product = item['id']
    result = {'product': product, 'source': item['source'], 'source_sha256': item['sourceSha256'], 'edit': item['edit']}
    try:
        target = MEDIA / f'{product}.mp4'
        poster = MEDIA / f'{product}.jpg'
        raw = target.read_bytes()
        assert hashlib.sha256(raw).hexdigest() == item['sha256']
        metadata = json.loads(subprocess.check_output([
            'ffprobe', '-v', 'error', '-show_entries',
            'format=duration:stream=codec_name,codec_type,width,height,avg_frame_rate', '-of', 'json', str(target)
        ], text=True, timeout=30))
        videos = [s for s in metadata['streams'] if s.get('codec_type') == 'video']
        audios = [s for s in metadata['streams'] if s.get('codec_type') == 'audio']
        assert len(videos) == 1 and not audios
        assert videos[0]['codec_name'] == 'h264' and videos[0]['width'] == 1280 and videos[0]['height'] == 720
        duration = float(metadata['format']['duration'])
        assert 12.5 <= duration <= 13.5
        poster_raw = poster.read_bytes(); assert poster_raw[:2] == b'\xff\xd8' and poster_raw[-2:] == b'\xff\xd9'
        result.update({'bytes': len(raw), 'duration_seconds': duration, 'video': videos[0], 'poster_bytes': len(poster_raw), 'decoded_frame': True})
        subprocess.run([
            'ffmpeg', '-nostdin', '-loglevel', 'error', '-ss', '6', '-i', str(target),
            '-frames:v', '1', '-vf', 'scale=960:-2', '-y', str(OUT / (product + '-frame.jpg'))
        ], check=True, timeout=45)
    except Exception as error:
        result['error'] = str(error); report['errors'].append(product + ': ' + str(error))
    report['media'].append(result)

handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT / 'dist'))
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
base = 'http://127.0.0.1:' + str(server.server_port)
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
        page = context.new_page(); page.set_default_timeout(20000)
        page.on('pageerror', lambda error: report['errors'].append('page: ' + str(error)))
        page.goto(base + '/products/', wait_until='networkidle')
        assert page.locator('.rm-film').count() == 6
        assert page.locator('.rm-film-preview[src]').count() == 0
        for item in manifest['recordings']:
            product = item['id']
            frame = page.locator('[data-product-film="' + product + '"]')
            try:
                video = frame.locator('video')
                assert video.get_attribute('poster') == item['poster']
                frame.scroll_into_view_if_needed(); frame.locator('.rm-film-toggle').click()
                page.wait_for_function('id => {const v=document.querySelector(`[data-product-film="${id}"] video`);return v.readyState>=2 && !v.paused && v.currentTime>.3 && v.getVideoPlaybackQuality().totalVideoFrames>0;}', arg=product)
                state = video.evaluate('(v) => ({time:v.currentTime,duration:v.duration,width:v.videoWidth,height:v.videoHeight,readyState:v.readyState,frames:v.getVideoPlaybackQuality().totalVideoFrames})')
                assert state['width'] == 1280 and state['height'] == 720 and state['frames'] > 0
                assert page.locator('.rm-film-preview').evaluate_all('(vs) => vs.filter(v=>!v.paused).length') <= 1
                frame.locator('.rm-film-toggle').click(); assert video.evaluate('(v)=>v.paused')
                assert frame.locator('.rm-film-error').is_hidden()
                frame.screenshot(path=str(OUT / (product + '-player.png')))
                report['browser'].append({'product': product, 'playback': state})
            except Exception as error:
                report['errors'].append('playback ' + product + ': ' + str(error))
        context.close()
        for width in [1440, 390]:
            ctx = browser.new_context(viewport={'width': width, 'height': 1000}, reduced_motion='reduce')
            pg = ctx.new_page(); pg.set_default_timeout(15000)
            requests = []
            pg.on('request', lambda r: requests.append(r.url) if '/media/products/' in r.url and r.resource_type == 'media' else None)
            for route in ['/products/', '/en/products/']:
                pg.goto(base + route, wait_until='networkidle')
                assert pg.locator('.rm-film').count() == 6, route
                assert pg.locator('.rm-film-preview[src]').count() == 0, 'Reduced-motion must not preload media'
                assert pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Horizontal overflow: ' + route
                label = route.strip('/').replace('/', '-')
                pg.screenshot(path=str(OUT / (label + '-' + str(width) + '.png')))
                report['browser'].append({'route': route, 'width': width, 'films': 6, 'overflow': False, 'reduced_motion_autoload': False})
            assert not requests, 'Reduced-motion initiated media requests'
            ctx.close()
        browser.close()
except Exception as error:
    report['errors'].append('browser QA: ' + str(error))
finally:
    server.shutdown()
    (OUT / 'report.json').write_text(json.dumps(report, indent=2, ensure_ascii=False))
    print(json.dumps(report, indent=2, ensure_ascii=False))
if report['errors']:
    raise SystemExit(1)
