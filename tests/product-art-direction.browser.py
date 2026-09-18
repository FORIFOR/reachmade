"""Read-only browser QA of the final built art-direction pages.

Like scripts/verify_showcase.py, render final HTML/CSS/JS in memory. Normal
mode uses complete built styles and real local posters; --layout-fixture uses
explicit image stand-ins. Media-error recovery uses an injected DOM error,
not an HTTP failure E2E. This tests neither HTTP delivery nor live production,
Safari, physical devices, nor actual AI execution.
"""
from __future__ import annotations
import argparse
import base64
import json
import mimetypes
import os
import re
import traceback
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
    root, out = Path(args.root).resolve(), Path(args.output).resolve()
    out.mkdir(parents=True, exist_ok=True)
    report = {'mode': 'isolated-layout-fixture' if args.layout_fixture else 'full-built-site-memory-render',
              'browser': 'Chromium', 'live_site': False, 'http_delivery': False,
              'media_failure_method': 'injected DOM error; not network-failure E2E',
              'safari': False, 'layout': [], 'no_javascript': [], 'failed_media': [], 'errors': []}
    image_mock = b'<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><rect width="1600" height="1000" fill="#202a2c"/><text x="800" y="490" text-anchor="middle" fill="#ecebe4" font-family="sans-serif" font-size="40">MEDIA PLACEHOLDER</text><text x="800" y="555" text-anchor="middle" fill="#b0bab8" font-family="sans-serif" font-size="26">Layout fixture only - not a product screenshot</text></svg>'

    def serve(route):
        name = unquote(urlsplit(route.request.url).path)
        if name.endswith('.mp4'):
            route.abort('failed')
            return
        if args.layout_fixture and name.endswith(('.jpg', '.png')):
            route.fulfill(status=200, content_type='image/svg+xml', body=image_mock)
            return
        target = (root / name.lstrip('/')).resolve()
        if not target.is_relative_to(root):
            route.fulfill(status=403, body='Forbidden')
        elif target.is_file():
            mime = mimetypes.guess_type(str(target))[0] or 'application/octet-stream'
            route.fulfill(status=200, content_type=mime, body=target.read_bytes())
        else:
            route.fulfill(status=404, body='Missing local asset')

    def load(page, identifier, lang):
        file = root / ('en' if lang == 'en' else '') / 'products' / identifier / 'index.html'
        html = file.read_text(encoding='utf-8')
        css = (root / 'assets/showcase.css').read_text(encoding='utf-8')
        js = (root / 'assets/showcase.mjs').read_text(encoding='utf-8')
        assert 'Product-specific compositions.' in css, 'Final art-direction CSS is missing'
        assert '.owned-film__screen' in css and '.owned-primary' in css, 'Shared player/button CSS missing'
        style = '<link rel="stylesheet" href="/assets/showcase.css">'
        script = '<script type="module" src="/assets/showcase.mjs"></script>'
        assert html.count(style) == 1 and html.count(script) == 1, 'Unexpected asset entrypoints'
        html = html.replace(style, '<style>' + css + '</style>')
        html = html.replace(script, '<script type="module">' + js + '</script>')
        recording = f'data-recording-src="/media/products/{identifier}.mp4"'
        assert recording in html, 'Expected original recording path is missing'
        if args.layout_fixture:
            uri = 'data:image/svg+xml;base64,' + base64.b64encode(image_mock).decode()
            html = re.sub(r'(?<![\w-])(src|poster)="/(?:assets|media)/products/[^" ]+\.jpg"', lambda m: m[1] + '="' + uri + '"', html)
        else:
            # Resolve images only. Never rewrite data-recording-src: the real
            # player's security guard deliberately accepts only relative paths.
            html = re.sub(r'(?<![\w-])((?:src|poster)=")(/(?:assets|media)/[^" ]+)',
                          lambda m: m[1] + 'http://127.0.0.1:4173' + m[2], html)
        assert recording in html, 'The test harness must not rewrite guarded recording paths'
        page.set_content(html, wait_until='networkidle')

    def diagnostic(page, key, exc):
        error = {'case': key, 'error': str(exc), 'trace': traceback.format_exc()}
        try:
            error['dom'] = page.evaluate('''() => {
                const box=s=>{const e=document.querySelector(s);if(!e)return null;
                  const r=e.getBoundingClientRect(),c=getComputedStyle(e);
                  return {x:r.x,y:r.y,width:r.width,height:r.height,font:c.fontSize,display:c.display};};
                return {body:document.body.outerHTML.slice(0,240),title:box('.ad-hero h1'),
                  primary:box('.ad-hero .owned-primary'),film:box('.owned-film'),screen:box('.owned-film__screen'),
                  mediaState:document.querySelector('.owned-film')?.dataset.mediaState};
            }''')
            page.screenshot(path=str(out / f'failure-{key}.png'), full_page=True)
        except Exception as capture:
            error['capture_error'] = str(capture)
        report['errors'].append(error)

    def layout(page, width):
        assert page.locator('h1').count() == 1
        assert page.locator('.ad-hero video').count() == 1
        assert page.locator('.owned-film__screen>img').evaluate('(e)=>e.complete && e.naturalWidth>0'), 'Poster missing'
        d = page.evaluate('''() => {
            const b=s=>{const r=document.querySelector(s).getBoundingClientRect();
              return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};
            return {width:document.documentElement.scrollWidth,title:b('.ad-hero h1'),
              lead:b('.ad-hero .owned-lead'),primary:b('.ad-hero .owned-primary'),film:b('.owned-film'),
              tryNow:b('.owned-try-now'),access:b('.owned-access'),
              font:parseFloat(getComputedStyle(document.querySelector('.ad-hero h1')).fontSize)};
        }''')
        assert d['width'] <= width + 1, f'Horizontal overflow: {d}'
        assert d['font'] >= 30, f'Heading too small: {d}'
        assert d['title']['bottom'] <= d['lead']['y'] + 2 or d['title']['right'] <= d['lead']['x'] + 2, f'Heading/body overlap: {d}'
        assert d['tryNow']['right'] <= d['access']['x'] + 1 or d['tryNow']['bottom'] <= d['access']['y'] + 1, f'Scope overlap: {d}'
        assert d['primary']['height'] >= 44, f'CTA target too small: {d}'
        assert d['primary']['x'] >= 0 and d['primary']['right'] <= width + 1, f'CTA overflows: {d}'
        assert d['film']['width'] >= min(260, width - 60), f'Film too narrow: {d}'
        assert page.locator('.owned-film figcaption a').is_visible()
        page.keyboard.press('Tab')
        assert page.evaluate('document.activeElement.classList.contains("skip-link")'), 'Skip link is not first'
        page.keyboard.press('Enter')
        assert page.evaluate('location.hash') == '#main'
        page.locator('.owned-access summary').focus()
        page.keyboard.press('Enter')
        assert page.locator('.owned-access').get_attribute('open') is not None
        page.keyboard.press('Enter')
        page.evaluate('document.activeElement.blur(); window.scrollTo(0,0)')
        return d

    with sync_playwright() as p:
        executable = os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH')
        browser = p.chromium.launch(headless=True, **({'executable_path': executable} if executable else {}))
        try:
            for lang in ['ja', 'en']:
                for identifier in IDS:
                    cases = [('layout', w, h, True) for w, h in SIZES]
                    cases += [('no_javascript', 390, 844, False), ('failed_media', 390, 844, True)]
                    for kind, width, height, enabled in cases:
                        key = f'{kind}-{identifier}-{lang}-{width}'
                        ctx = browser.new_context(viewport={'width':width,'height':height}, java_script_enabled=enabled, reduced_motion='reduce')
                        ctx.set_default_timeout(3000)
                        ctx.route('**/*', serve)
                        page = ctx.new_page()
                        errors, requests = [], []
                        page.on('pageerror', lambda err: errors.append(str(err)))
                        page.on('request', lambda req: requests.append(req.url))
                        try:
                            load(page, identifier, lang)
                            assert not errors, errors
                            assert not any('.mp4' in req for req in requests), 'Video requested before play'
                            entry = {'case': key, 'passed': True}
                            if kind == 'layout':
                                entry['geometry'] = layout(page, width)
                                if width in (1440, 390):
                                    page.screenshot(path=str(out / f'{key}.png'), full_page=True)
                            elif kind == 'no_javascript':
                                assert page.locator('.owned-primary').first.is_visible()
                                assert page.locator('.owned-film figcaption a').is_visible()
                                assert page.locator('.owned-film__screen>img').is_visible()
                            else:
                                page.locator('.owned-film__play').click()
                                video = page.locator('.owned-film video')
                                assert video.get_attribute('src') == f'/media/products/{identifier}.mp4', 'Play did not pass the real source guard'
                                # Exercise the unmodified native error listener. This is
                                # deliberate event injection, not a network-failure E2E.
                                video.evaluate('(v)=>v.dispatchEvent(new Event("error"))')
                                page.wait_for_function('document.querySelector(".owned-film").dataset.mediaState === "unavailable"')
                                assert page.locator('.owned-film__status').is_visible()
                                assert page.locator('.owned-film__screen>img').is_visible()
                                assert page.locator('.owned-film__play').is_enabled()
                                assert page.locator('.owned-film figcaption a').is_visible()
                            report[kind].append(entry)
                        except Exception as exc:
                            diagnostic(page, key, exc)
                        finally:
                            ctx.close()
        finally:
            browser.close()
            (out / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({key:len(report[key]) for key in ['layout','no_javascript','failed_media','errors']}))
    if report['errors']:
        raise SystemExit('Art-direction browser QA failed; inspect report.json')

if __name__ == '__main__':
    main()
