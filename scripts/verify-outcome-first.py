"""Full-build acceptance of both v4 homes and seven real product pages.
No content/script rewriting, substitute media, remote AI calls or auth.
"""
from __future__ import annotations
import argparse
import json
import subprocess
import threading
from functools import lru_cache, partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from verify_home_v4 import assert_home_v4, begin_home_v4_requests, product_ledger

ROOT = Path(__file__).resolve().parents[1]
SIZES = [(1440, 1000), (1024, 900), (390, 844), (320, 780)]

class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.mjs': 'text/javascript'}
    def log_message(self, *args):
        pass

@lru_cache(maxsize=1)
def source_contract():
    script = """import {landingExperience} from './src/product-landings.mjs';
import {FILM as oathra} from './src/oathra-lp.mjs';
import {FILM as noa} from './src/noa-lp.mjs';
console.log(JSON.stringify({landings:landingExperience, films:{oathra,noa}}));"""
    return json.loads(subprocess.check_output(['node', '--input-type=module', '-e', script], cwd=ROOT, text=True))

def product_checks(page, lang, product, width):
    contract = source_contract()
    primary = page.locator('.owned-primary').first
    expect(primary).to_be_visible()
    assert primary.bounding_box()['height'] >= 44, 'Primary action remains a usable touch target'
    assert primary.get_attribute('href') == contract['landings'][product][lang]['primary'][1]
    for video in page.locator('video').all():
        assert video.get_attribute('autoplay') is None
        assert video.get_attribute('preload') == 'none'
        assert video.evaluate('v=>v.paused'), 'No product media plays on entry'
    if lang == 'ja' and product in ['oathra', 'noa']:
        # These authored pages replaced the generic sample CTA before this PR.
        # Their real film, source and disclosure replace the missing widget check.
        name = 'olp' if product == 'oathra' else 'nlp'
        figure = page.locator(f'.{name}-film').first
        film = contract['films'][product]
        expect(figure).to_be_visible()
        assert figure.locator('video source').get_attribute('src') == film['src']
        assert figure.locator('video').get_attribute('poster') == film['poster']
        assert figure.locator('video').get_attribute('controls') is not None
        for asset in film.values():
            assert (ROOT / 'dist' / asset.lstrip('/')).is_file(), asset
        if product == 'oathra':
            expect(figure).to_contain_text('設計画面 · 未リリース')
            expect(figure.locator('figcaption')).to_contain_text('現行のOathraにはまだありません')
            expect(page.locator('#recordings')).to_be_visible()
            if width == 390:
                page.locator('.owned-film [data-mode="story"]').click()
                expect(page.locator('.owned-film .rm-live-demo')).to_be_visible()
        else:
            expect(figure.locator('figcaption')).to_contain_text('配信の実録画ではありません')
            assert page.locator('main a[href*="github.com"]').count() == 0
            expect(page.locator('a.nlp-secondary[href="#watch"]')).to_be_visible()
            if width == 390:
                page.locator('a.nlp-secondary[href="#watch"]').click()
                expect(page.locator('#watch')).to_be_visible()
    else:
        sample = page.locator('[data-outcome-sample]:not([hidden])')
        expect(sample).to_be_visible()
        if width == 390:
            sample.click()
            expect(page.locator('.owned-film .lab-hands')).to_be_visible()

def recorded_artifact(context, origin):
    # Retain the actual saved artifact check although the new home links to its product page.
    artifact = context.new_page()
    try:
        response = artifact.goto(origin + '/media/originals/genie/orbit.html', wait_until='networkidle')
        assert response.status == 200
        expect(artifact.locator('#universe')).to_be_visible()
        expect(artifact.locator('#pause')).to_be_visible()
        artifact.locator('#pause').click()
        assert artifact.locator('#planetNav button').count() > 0
    finally:
        artifact.close()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--browser', choices=['chromium', 'webkit'], default='chromium')
    args = parser.parse_args()
    out = ROOT / 'film-qa' / 'outcome-first' / args.browser
    out.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT / 'dist')))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = f'http://127.0.0.1:{server.server_port}'
    report = {'browser': args.browser, 'mode': 'unmodified build over local HTTP', 'production': False,
              'cases': [], 'errors': [], 'capture_errors': []}
    ids = [p['id'] for p in product_ledger()]
    with sync_playwright() as p:
        browser = getattr(p, args.browser).launch()
        try:
            for lang in ['ja', 'en']:
                base = '' if lang == 'ja' else 'en/'
                for product in ['home', *ids]:
                    route = f'/{base}' if product == 'home' else f'/{base}products/{product}/'
                    for width, height in SIZES:
                        key = f'{lang}-{product}-{width}'
                        context = browser.new_context(viewport={'width': width, 'height': height}, reduced_motion='reduce', accept_downloads=True)
                        page = context.new_page()
                        if product == 'home':
                            begin_home_v4_requests(page)
                        page.set_default_timeout(8000)
                        errors = []
                        page.on('pageerror', lambda error: errors.append(str(error)))
                        try:
                            response = page.goto(origin + route, wait_until='networkidle')
                            assert response.status == 200
                            assert page.locator('body').get_attribute('data-outcome-first') == '20260919-outcome-1'
                            assert page.locator('h1').count() == 1
                            dimensions = page.evaluate('({width:document.documentElement.scrollWidth,viewport:innerWidth,h1:parseFloat(getComputedStyle(document.querySelector("h1")).fontSize)})')
                            assert dimensions['width'] <= width + 1, dimensions
                            assert dimensions['h1'] >= 30, dimensions
                            page.keyboard.press('Tab')
                            assert page.evaluate('document.activeElement.classList.contains("skip-link")')
                            details = assert_home_v4(page) if product == 'home' else product_checks(page, lang, product, width)
                            if product == 'genie' and width == 390:
                                recorded_artifact(context, origin)
                            assert not errors, errors
                            page.evaluate('document.activeElement.blur();window.scrollTo(0,0)')
                            if width in [1440, 390]:
                                page.screenshot(path=str(out / f'{key}.png'), full_page=True)
                            report['cases'].append({'id': key, 'passed': True, 'geometry': dimensions, 'contract': details})
                        except Exception as exc:
                            report['errors'].append({'id': key, 'error': repr(exc), 'page_errors': errors})
                            try:
                                page.screenshot(path=str(out / f'failure-{key}.png'), full_page=True)
                            except Exception as capture:
                                report['capture_errors'].append({'id': key, 'error': repr(capture)})
                        finally:
                            context.close()
            for lang in ['ja', 'en']:
                context = browser.new_context(java_script_enabled=False, viewport={'width': 390, 'height': 844})
                page = context.new_page()
                begin_home_v4_requests(page)
                try:
                    response = page.goto(origin + ('/' if lang == 'ja' else '/en/'))
                    assert response.status == 200
                    details = assert_home_v4(page, interactive=False)
                    report['cases'].append({'id': f'{lang}-no-js', 'passed': True, 'contract': details})
                except Exception as exc:
                    report['errors'].append({'id': f'{lang}-no-js', 'error': repr(exc)})
                finally:
                    context.close()
        finally:
            browser.close()
            server.shutdown()
            server.server_close()
            (out / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'browser': args.browser, 'passed': len(report['cases']), 'errors': report['errors']}, ensure_ascii=False, indent=2))
    if report['errors']:
        raise SystemExit(1)

if __name__ == '__main__':
    main()
