"""Horio Premium Web visual/behavior acceptance checks on the real generated site.

Runs against local Wrangler and packaged real recordings. No production writes.
"""
from pathlib import Path
import json
import time
import urllib.request
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8787'
OUT = Path('film-qa/horio-premium')
OUT.mkdir(parents=True, exist_ok=True)
report = {
    'scope': 'Actual generated Reachmade pages and packaged real recordings in local Chromium; not production Safari',
    'viewports': [], 'gates': {}, 'errors': []
}

for attempt in range(90):
    try:
        with urllib.request.urlopen(BASE + '/', timeout=2) as r:
            if r.status == 200:
                break
    except Exception:
        if attempt == 89:
            raise RuntimeError('local Worker not ready')
        time.sleep(1)


def box(locator):
    value = locator.bounding_box()
    if not value:
        raise AssertionError(f'element has no box: {locator}')
    return {k: round(v, 2) for k, v in value.items()}


def ensure_first_view(page, viewport_height):
    h1 = page.locator('.hero h1')
    stage = page.locator('.hero .rm-film-stage')
    label = page.locator('.hero .eyebrow').first
    assert h1.is_visible() and stage.is_visible() and label.is_visible()
    hb, sb = box(h1), box(stage)
    assert hb['y'] < viewport_height, hb
    assert sb['y'] < viewport_height, sb
    text = page.locator('.hero').inner_text()
    assert ('6 INDEPENDENT AI PRODUCTS' in text)
    assert ('Genie' in text)
    return hb, sb


with sync_playwright() as pw:
    browser = pw.chromium.launch()
    for language, route in [('ja', '/'), ('en', '/en/')]:
        for width, height in [(1440, 1000), (1024, 900), (390, 844)]:
            context = browser.new_context(viewport={'width': width, 'height': height})
            page = context.new_page(); page.set_default_timeout(30000)
            page_errors = []
            page.on('pageerror', lambda e: page_errors.append(str(e)))
            try:
                page.goto(BASE + route, wait_until='networkidle')
                page.wait_for_function('() => window.__reachmadeFilms === true')
                assert page.locator('h1').count() == 1
                assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
                hb, sb = ensure_first_view(page, height)
                desc = box(page.locator('.hero-description'))
                if width >= 1181:
                    # Desktop is a spread: product and promise coexist horizontally.
                    assert sb['x'] > hb['x'] + hb['width'] * 0.55, (hb, sb)
                    assert abs(sb['y'] - hb['y']) < 240, (hb, sb)
                else:
                    # Tablet/mobile is intentionally recomposed: headline -> product -> explanation.
                    assert sb['y'] >= hb['y'] + hb['height'] - 2, (hb, sb)
                    assert desc['y'] >= sb['y'] + sb['height'] - 2, (desc, sb)
                if width == 390:
                    # Product stage intentionally breaks out of the text measure on mobile.
                    assert sb['x'] <= 1 and sb['width'] >= 388, sb
                # Product is the strongest visual object by area in the first viewport.
                h_area = hb['width'] * hb['height']
                s_area = min(sb['width'] * sb['height'], sb['width'] * max(1, height - sb['y']))
                assert s_area > h_area, (h_area, s_area)
                # Signature Moment: auto only on wide desktop.
                video = page.locator('.hero .rm-film-preview')
                if width >= 1181:
                    page.wait_for_function("() => { const v=document.querySelector('.hero .rm-film-preview'); return v && v.currentTime > .20 && !v.paused; }")
                    playing = page.locator('.rm-film-preview').evaluate_all('(vs)=>vs.filter(v=>!v.paused).map(v=>v.closest("[data-product-film]")?.dataset.productFilm)')
                    assert playing == ['genie'], playing
                else:
                    assert video.get_attribute('src') is None, 'narrow view auto-loaded media'
                    assert video.evaluate('(v)=>v.paused')
                assert not page_errors, page_errors
                shot = OUT / f'home-{language}-{width}.png'
                page.screenshot(path=str(shot), full_page=True)
                report['viewports'].append({
                    'language': language, 'width': width, 'height': height,
                    'headline': hb, 'product_stage': sb, 'description': desc,
                    'horizontal_overflow': False,
                    'desktop_spread': width >= 1181,
                    'mobile_full_bleed': width == 390,
                    'hero_auto_play': width >= 1181,
                    'screenshot': str(shot),
                })
            except Exception as e:
                report['errors'].append({'language': language, 'width': width, 'error': str(e)})
                page.screenshot(path=str(OUT / f'FAILED-{language}-{width}.png'), full_page=True)
            finally:
                context.close()

    # Logo Swap Test: generic branding cannot erase product identity.
    context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
    page = context.new_page(); page.set_default_timeout(30000)
    try:
        page.goto(BASE + '/', wait_until='networkidle'); page.wait_for_function('() => window.__reachmadeFilms === true')
        page.evaluate("""() => { const s=document.querySelector('.site-header .brand > span'); if(s) s.textContent='Sample Studio'; }""")
        hero = page.locator('.hero').inner_text()
        assert '会話をタスクに' in hero and 'Genie' in hero and 'REAL SCREENS' in hero
        assert page.locator('.hero .rm-film-stage').is_visible()
        page.screenshot(path=str(OUT / 'logo-swap-1440.png'), full_page=False)
        report['gates']['logo_swap_test'] = True
    except Exception as e:
        report['errors'].append({'logo_swap_test': str(e)})
    finally:
        context.close()

    # Stillness test: reduced motion keeps a complete, beautiful real-product poster and no autoplay.
    context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
    page = context.new_page(); page.set_default_timeout(30000)
    try:
        page.goto(BASE + '/', wait_until='networkidle'); page.wait_for_function('() => window.__reachmadeFilms === true')
        ensure_first_view(page, 1000)
        video = page.locator('.hero .rm-film-preview')
        assert video.get_attribute('src') is None
        assert video.evaluate('(v)=>v.paused')
        assert video.get_attribute('poster') == '/assets/products/genie.jpg'
        assert not page.locator('.hero .rm-film-error').is_visible()
        page.screenshot(path=str(OUT / 'stillness-reduced-motion-1440.png'), full_page=False)
        report['gates']['stillness_test'] = True
    except Exception as e:
        report['errors'].append({'stillness_test': str(e)})
    finally:
        context.close()

    # Automatic media failure must leave the real poster clean; explicit playback discloses the error.
    context = browser.new_context(viewport={'width': 1440, 'height': 1000})
    context.route('**/media/products/genie.mp4', lambda route: route.abort())
    page = context.new_page(); page.set_default_timeout(30000)
    try:
        page.goto(BASE + '/', wait_until='networkidle'); page.wait_for_function('() => window.__reachmadeFilms === true')
        page.wait_for_timeout(1000)
        assert page.locator('.hero .rm-film-preview').get_attribute('poster') == '/assets/products/genie.jpg'
        assert not page.locator('.hero .rm-film-error').is_visible(), 'automatic failure leaked error into first view'
        page.locator('.hero .rm-film-toggle').click()
        page.wait_for_function("() => { const e=document.querySelector('.hero .rm-film-error'); return e && !e.hidden; }")
        assert page.locator('.hero .rm-film-error').is_visible()
        report['gates']['media_failure_fallback'] = True
    except Exception as e:
        report['errors'].append({'media_failure_fallback': str(e)})
    finally:
        context.close()

    browser.close()

report['gates']['screenshot_test'] = len(report['viewports']) == 6 and not any('width' in e for e in report['errors'])
report['gates']['first_5_10_seconds'] = report['gates']['screenshot_test']
report['gates']['real_product_is_primary'] = report['gates']['screenshot_test']
(OUT / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(json.dumps(report, ensure_ascii=False, indent=2))
raise SystemExit(bool(report['errors']))
