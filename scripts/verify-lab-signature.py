"""Homepage product-selection acceptance on the actual built site.

Both locales use the manual home-v4 reel and native product disclosures. The
shared contract checks product identity, footage disclosures, stillness,
keyboard selection, native controls and no-script access. Chromium and WebKit
coverage does not claim a physical iPhone or a production deployment.
"""
from pathlib import Path
import json
import os
import time
import urllib.request
from playwright.sync_api import sync_playwright
from verify_home_v4 import assert_home_v4, playback_home_v4, begin_home_v4_requests

BASE = os.environ.get('QA_BASE', 'http://127.0.0.1:8787')
OUT = Path(os.environ.get('QA_OUTPUT', 'film-qa/lab-signature'))


def open_page(page, lang):
    page.goto(BASE + ('/' if lang == 'ja' else '/en/'), wait_until='networkidle')


def capture(page, path, report, label, full_page=False):
    try:
        page.screenshot(path=str(path), full_page=full_page, animations='disabled')
    except Exception as error:
        # Preserve the original assertion failure and the JSON report even if
        # screenshot capture itself fails. A missing image remains a failure.
        report['errors'].append({'case':label, 'error':'Screenshot: ' + str(error)})


def run_browser_matrix(report):
    with sync_playwright() as playwright:
        for engine in os.environ.get('QA_BROWSERS', 'chromium,webkit').split(','):
            kwargs = {}
            if os.environ.get('QA_EXECUTABLE'):
                kwargs['executable_path'] = os.environ['QA_EXECUTABLE']
            browser = getattr(playwright, engine).launch(**kwargs)
            try:
                for width, height in [(1440,1000), (1024,900), (390,844)]:
                    for lang in ['ja', 'en']:
                        context = browser.new_context(
                            viewport={'width':width, 'height':height},
                            has_touch=width < 500, is_mobile=width < 500,
                            device_scale_factor=1)
                        page = context.new_page()
                        begin_home_v4_requests(page)
                        page.set_default_timeout(12000)
                        errors = []
                        page.on('pageerror', lambda error:errors.append(str(error)))
                        label = f'{engine}-{lang}-{width}'
                        try:
                            open_page(page, lang)
                            contract = assert_home_v4(page)
                            playback = playback_home_v4(page) if width in [1440,390] else None
                            page.evaluate('scrollTo(0,0)')
                            capture(page, OUT/f'{label}-first.png', report, label)
                            if width == 1440:
                                capture(page, OUT/f'{label}-full.png', report, label, full_page=True)
                            assert not errors, errors
                            report['cases'].append({'case':label, 'contract':contract,
                                                    'playback':playback})
                        except Exception as error:
                            report['errors'].append({'case':label, 'error':str(error)})
                            capture(page, OUT/f'FAILED-{label}.png', report, label)
                        finally:
                            context.close()
                for lang in ['ja', 'en']:
                    context = browser.new_context(java_script_enabled=False,
                                                  viewport={'width':390, 'height':844})
                    page = context.new_page()
                    begin_home_v4_requests(page)
                    page.set_default_timeout(12000)
                    label = f'{engine}-{lang}-no-script'
                    try:
                        open_page(page, lang)
                        contract = assert_home_v4(page, interactive=False)
                        capture(page, OUT/f'{label}.png', report, label)
                        report['cases'].append({'case':label, 'contract':contract})
                    except Exception as error:
                        report['errors'].append({'case':label, 'error':str(error)})
                    finally:
                        context.close()
            finally:
                browser.close()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    report = {'scope':'Actual built homepages through local Worker',
              'physical_iphone':False, 'production':False, 'cases':[], 'errors':[]}
    try:
        for attempt in range(90):
            try:
                with urllib.request.urlopen(BASE, timeout=2) as response:
                    if response.status == 200:
                        break
            except Exception:
                if attempt == 89:
                    raise
                time.sleep(1)
        run_browser_matrix(report)
    except Exception as error:
        report['errors'].append({'case':'browser-matrix', 'error':str(error)})
    finally:
        (OUT/'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
        print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(bool(report['errors']))


if __name__ == '__main__':
    main()
