"""Read-only public-media QA; build locally, never deploy or access credentials."""
from pathlib import Path
import functools
import http.server
import json
import subprocess
import threading
import urllib.request
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'film-qa'
OUT.mkdir(exist_ok=True)
MEDIA = ROOT / 'dist/media/products'
MEDIA.mkdir(parents=True, exist_ok=True)
recordings = json.loads(subprocess.check_output([
    'node', '--input-type=module', '-e',
    "import {recordings} from './src/films.mjs'; console.log(JSON.stringify(recordings));"
], cwd=ROOT, text=True))
report = {'scope': 'Actual public recording downloads and locally built pages. Not Cloudflare production or Safari.', 'media': [], 'browser': [], 'errors': []}
LIMIT = 80 * 1024 * 1024
for product, url in recordings.items():
    item = {'product': product, 'source': url}
    try:
        target = MEDIA / (product + '.mp4')
        req = urllib.request.Request(url, headers={'User-Agent': 'Reachmade-product-film-QA/1.0'})
        with urllib.request.urlopen(req, timeout=40) as response, target.open('wb') as handle:
            item['http_status'] = response.status
            item['final_url'] = response.geturl()
            item['content_type'] = response.headers.get('Content-Type')
            size = 0
            while True:
                chunk = response.read(256 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > LIMIT:
                    raise ValueError('Recording exceeds 80 MiB QA limit')
                handle.write(chunk)
        item['bytes'] = size
        if item['final_url'] != url:
            raise ValueError('Source redirects; update the allowlist before using the strict proxy')
        metadata = json.loads(subprocess.check_output([
            'ffprobe', '-v', 'error', '-show_entries',
            'format=duration:stream=codec_name,codec_type,width,height', '-of', 'json', str(target)
        ], text=True, timeout=30))
        streams = [s for s in metadata['streams'] if s.get('codec_type') == 'video']
        if not streams:
            raise ValueError('No video stream')
        item['video'] = streams[0]
        item['duration_seconds'] = float(metadata['format']['duration'])
        if item['duration_seconds'] <= 1:
            raise ValueError('Recording too short')
        subprocess.run([
            'ffmpeg', '-nostdin', '-loglevel', 'error', '-ss', str(min(6, item['duration_seconds'] / 2)),
            '-i', str(target), '-frames:v', '1', '-vf', 'scale=960:-2', '-y', str(OUT / (product + '-frame.jpg'))
        ], check=True, timeout=45)
        item['decoded_frame'] = True
    except Exception as error:
        item['error'] = str(error)
        report['errors'].append(product + ': ' + str(error))
    report['media'].append(item)

handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT / 'dist'))
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
base = 'http://127.0.0.1:' + str(server.server_port)
starts = {'genie': 0, 'ai-meeting': 4, 'oathra': 6, 'aisecure': 0, 'agent-team': 5, 'launchloom': 3}
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 1000})
        page = context.new_page()
        page.set_default_timeout(20000)
        page.on('pageerror', lambda error: report['errors'].append('page: ' + str(error)))
        page.goto(base + '/products/', wait_until='domcontentloaded')
        page.wait_for_selector('.rm-film')
        assert page.locator('.rm-film').count() == 6
        for product in recordings:
            frame = page.locator('[data-product-film="' + product + '"]')
            try:
                frame.locator('.rm-film-stage').evaluate('(e) => scrollTo(0, e.getBoundingClientRect().top + scrollY - 20)')
                video = frame.locator('video')
                page.wait_for_function('([id,start]) => {const v=document.querySelector(`[data-product-film="${id}"] video`);return v.readyState>=2 && !v.paused && v.currentTime>start+0.3;}', arg=[product, starts[product]])
                state = video.evaluate('(v) => ({time:v.currentTime,width:v.videoWidth,height:v.videoHeight,readyState:v.readyState,frames:v.getVideoPlaybackQuality().totalVideoFrames})')
                assert state['frames'] > 0
                assert page.locator('.rm-film-preview').evaluate_all('(vs) => vs.filter(v=>!v.paused).length') <= 1
                frame.screenshot(path=str(OUT / (product + '-player.png')))
                report['browser'].append({'product': product, 'playback': state})
            except Exception as error:
                report['errors'].append('playback ' + product + ': ' + str(error))
        context.close()
        for width in [1440, 390]:
            ctx = browser.new_context(viewport={'width': width, 'height': 1000}, reduced_motion='reduce')
            pg = ctx.new_page()
            pg.set_default_timeout(15000)
            requests = []
            pg.on('request', lambda r: requests.append(r.url) if '/media/products/' in r.url else None)
            for route in ['/', '/products/', '/en/', '/en/products/']:
                pg.goto(base + route, wait_until='networkidle')
                assert pg.locator('.rm-film').count() == 6, route
                assert pg.locator('.rm-film-preview[src]').count() == 0, 'Reduced-motion must not preload media'
                assert pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Horizontal overflow: ' + route
                label = route.strip('/').replace('/', '-') or 'home'
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
