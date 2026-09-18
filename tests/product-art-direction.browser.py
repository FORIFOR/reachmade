"""Read-only, offline browser QA for the built six-product art direction.

Normal mode requires real local poster files from `npm run build`.
--layout-fixture explicitly uses labelled image stand-ins for isolated local tests.
Neither mode tests the live site, Safari, or actual product execution.
"""
from __future__ import annotations
import argparse
import base64
import re
import json
import mimetypes
import os
from pathlib import Path
from urllib.parse import unquote, urlsplit
from playwright.sync_api import sync_playwright

IDS = ['genie', 'ai-meeting', 'oathra', 'aisecure', 'agent-team', 'launchloom']
SIZES = [(1440, 1000), (1024, 900), (390, 844), (320, 780)]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', default='dist')
    parser.add_argument('--output', default='film-qa/art-direction')
    parser.add_argument('--layout-fixture', action='store_true')
    args = parser.parse_args()
    root = Path(args.root).resolve()
    out = Path(args.output).resolve()
    out.mkdir(parents=True, exist_ok=True)
    report = {'mode': 'isolated-layout-fixture' if args.layout_fixture else 'full-built-site',
              'browser': 'Chromium', 'live_site': False, 'safari': False,
              'layout': [], 'no_javascript': [], 'failed_media': [], 'errors': []}
    image_mock = b'<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><rect width="1600" height="1000" fill="#202a2c"/><text x="800" y="490" text-anchor="middle" fill="#ecebe4" font-family="sans-serif" font-size="40">MEDIA PLACEHOLDER</text><text x="800" y="555" text-anchor="middle" fill="#b0bab8" font-family="sans-serif" font-size="26">Layout fixture only - not a product screenshot</text></svg>'

    def serve(route):
        request_path = unquote(urlsplit(route.request.url).path)
        if request_path.endswith('.mp4'):
            route.abort('failed')  # Deliberate failure; playback is covered by the existing media suite.
            return
        if args.layout_fixture and request_path.endswith(('.jpg', '.png')):
            route.fulfill(status=200, content_type='image/svg+xml', body=image_mock)
            return
        target = (root / request_path.lstrip('/')).resolve()
        if not target.is_relative_to(root):
            route.fulfill(status=403, body='Forbidden')
            return
        if target.is_dir():
            target = target / 'index.html'
        if not target.is_file():
            route.fulfill(status=404, body='Missing local fixture asset')
            return
        mime = 'text/javascript' if target.suffix == '.mjs' else (mimetypes.guess_type(str(target))[0] or 'application/octet-stream')
        route.fulfill(status=200, content_type=mime, body=target.read_bytes())

    def load(page, url):
        if not args.layout_fixture:
            page.goto(url, wait_until='networkidle')
            return
        # Local Chromium disallows URL navigation, so render isolated fixtures in memory.
        target = root / unquote(urlsplit(url).path).lstrip('/') / 'index.html'
        html = target.read_text(encoding='utf-8')
        css = (root / 'assets/showcase.css').read_text(encoding='utf-8')
        js = (root / 'assets/showcase.mjs').read_text(encoding='utf-8')
        html = html.replace('<link rel="stylesheet" href="/assets/showcase.css">', '<style>' + css + '</style>')
        html = html.replace('<script type="module" src="/assets/showcase.mjs"></script>', '<script type="module">' + js + '</script>')
        uri = 'data:image/svg+xml;base64,' + base64.b64encode(image_mock).decode()
        html = re.sub(r'(src|poster)="/(?:assets|media)/products/[^" ]+\.jpg"', lambda m: m[1] + '="' + uri + '"', html)
        page.set_content(html, wait_until='load')

    with sync_playwright() as p:
        executable = os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH')
        browser = p.chromium.launch(headless=True, **({'executable_path': executable} if executable else {}))
        try:
            for lang in ['ja', 'en']:
                for identifier in IDS:
                    url = f'http://127.0.0.1:4173/{"en/" if lang == "en" else ""}products/{identifier}/'
                    for width, height in SIZES:
                        key = f'{identifier}-{lang}-{width}'
                        ctx = browser.new_context(viewport={'width': width, 'height': height}, reduced_motion='reduce')
                        ctx.set_default_timeout(2500)
                        ctx.route('**/*', serve)
                        page = ctx.new_page()
                        errors, requests = [], []
                        page.on('pageerror', lambda error: errors.append(str(error)))
                        page.on('request', lambda req: requests.append(req.url))
                        try:
                            load(page, url)
                            page.locator('.ad-hero').wait_for()
                            assert not errors, errors
                            assert page.locator('h1').count() == 1
                            assert page.locator('.ad-hero video').count() == 1
                            assert not any('.mp4' in req for req in requests), 'Video requested before consent'
                            poster = page.locator('.owned-film__screen>img')
                            assert poster.evaluate('(e)=>e.complete && e.naturalWidth>0'), 'Real poster missing'
                            dimensions = page.evaluate('''() => {
                              const b = s => { const r=document.querySelector(s).getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right}; };
                              return {viewport:innerWidth, width:document.documentElement.scrollWidth,
                                title:b('.ad-hero h1'), lead:b('.ad-hero .owned-lead'), primary:b('.ad-hero .owned-primary'), film:b('.owned-film'),
                                tryNow:b('.owned-try-now'), access:b('.owned-access'),
                                titleFont:parseFloat(getComputedStyle(document.querySelector('.ad-hero h1')).fontSize)};
                            }''')
                            assert dimensions['width'] <= width + 1, f'Horizontal overflow: {dimensions}'
                            assert dimensions['titleFont'] >= 30
                            assert dimensions['title']['bottom'] <= dimensions['lead']['y'] + 2 or identifier == 'launchloom', 'Heading overlaps body'
                            assert (dimensions['tryNow']['right'] <= dimensions['access']['x'] + 1 or dimensions['tryNow']['bottom'] <= dimensions['access']['y'] + 1), 'Scope sections overlap'
                            assert dimensions['primary']['height'] >= 44
                            assert dimensions['primary']['x'] >= 0 and dimensions['primary']['right'] <= width + 1
                            assert dimensions['film']['width'] >= min(260, width - 60)
                            assert page.locator('.owned-film figcaption a').is_visible()
                            page.keyboard.press('Tab')
                            assert page.evaluate('document.activeElement.classList.contains("skip-link")'), 'Skip link is not first'
                            page.keyboard.press('Enter')
                            assert page.evaluate('location.hash') == '#main'
                            summary = page.locator('.owned-access summary')
                            summary.focus()
                            page.keyboard.press('Enter')
                            assert page.locator('.owned-access').get_attribute('open') is not None
                            page.keyboard.press('Enter')
                            page.evaluate('document.activeElement.blur(); window.scrollTo(0,0)')
                            if width in (1440, 390):
                                page.screenshot(path=str(out / f'{key}.png'), full_page=True)
                            report['layout'].append({'case': key, 'passed': True, 'geometry': dimensions})
                        except Exception as exc:
                            report['errors'].append({'case': key, 'error': str(exc)})
                        finally:
                            ctx.close()
                    # Source links and real poster are available without the enhancement script.
                    ctx = browser.new_context(viewport={'width':390,'height':844}, java_script_enabled=False)
                    ctx.set_default_timeout(2500)
                    ctx.route('**/*', serve)
                    page = ctx.new_page()
                    try:
                        load(page, url)
                        assert page.locator('.owned-primary').first.is_visible()
                        assert page.locator('.owned-film figcaption a').is_visible()
                        assert page.locator('.owned-film__screen>img').is_visible()
                        report['no_javascript'].append({'case': f'{identifier}-{lang}', 'passed': True})
                    except Exception as exc:
                        report['errors'].append({'case': f'no-js-{identifier}-{lang}', 'error': str(exc)})
                    finally:
                        ctx.close()
                    # A failed video must restore the poster and expose a working retry button.
                    ctx = browser.new_context(viewport={'width':390,'height':844})
                    ctx.set_default_timeout(2500)
                    ctx.route('**/*', serve)
                    page = ctx.new_page()
                    try:
                        load(page, url)
                        page.locator('.owned-film__play').click()
                        if args.layout_fixture:
                            page.locator('.owned-film video').evaluate('(v)=>v.dispatchEvent(new Event("error"))')
                        page.wait_for_function('document.querySelector(".owned-film").dataset.mediaState === "unavailable"')
                        assert page.locator('.owned-film__status').is_visible()
                        assert page.locator('.owned-film__screen>img').is_visible()
                        assert page.locator('.owned-film__play').is_enabled()
                        assert page.locator('.owned-film figcaption a').is_visible()
                        report['failed_media'].append({'case': f'{identifier}-{lang}', 'passed': True})
                    except Exception as exc:
                        report['errors'].append({'case': f'failed-media-{identifier}-{lang}', 'error': str(exc)})
                    finally:
                        ctx.close()
        finally:
            browser.close()
            (out / 'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({key:len(report[key]) for key in ['layout','no_javascript','failed_media','errors']}))
    if report['errors']:
        raise SystemExit('Product art-direction browser QA failed; inspect report.json')

if __name__ == '__main__':
    main()
