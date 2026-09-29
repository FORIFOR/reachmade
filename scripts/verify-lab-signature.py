"""Homepage product-selection acceptance on the actual built site.

Both locales use the manual home-v4 reel and native product disclosures. The
shared contract checks product identity, footage disclosures, stillness,
keyboard selection, native controls and no-script access. Chromium and WebKit
coverage does not claim a physical iPhone or a production deployment.
"""
from pathlib import Path
import json
import os
import ssl
import time
import urllib.request
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
from verify_home_v4 import assert_home_v4, playback_home_v4, begin_home_v4_requests

BASE = os.environ.get('QA_BASE', 'http://127.0.0.1:8787')
OUT = Path(os.environ.get('QA_OUTPUT', 'film-qa/lab-signature'))


def allow_self_signed_loopback():
    if os.environ.get('QA_ALLOW_SELF_SIGNED_LOOPBACK') != '1':
        return False
    origin = urlsplit(BASE)
    assert os.environ.get('CI') == 'true', 'Self-signed TLS is limited to the CI local Worker'
    assert origin.scheme == 'https' and origin.hostname in ['127.0.0.1', '::1']
    assert origin.port == 8787 and not origin.username and not origin.password
    assert origin.path in ['', '/'] and not origin.query and not origin.fragment
    return True


def observe_delivery(page):
    """Retain real failed/pending URLs if navigation or CSS/font readiness fails."""
    pending, responses, failed = {}, [], []

    def requested(request):
        pending[request] = {'url': request.url, 'method': request.method,
                            'type': request.resource_type}

    def responded(response):
        record = {'url': response.url, 'status': response.status,
                  'type': response.request.resource_type}
        if response.request.resource_type == 'document':
            record['csp'] = response.headers.get('content-security-policy')
        responses.append(record)

    def request_failed(request):
        failed.append({**pending.pop(request, {'url': request.url}), 'error': request.failure})

    page.on('request', requested)
    page.on('response', responded)
    page.on('requestfinished', lambda request: pending.pop(request, None))
    page.on('requestfailed', request_failed)
    return lambda: {'unfinished': list(pending.values()), 'failed': list(failed),
                    'responses': list(responses)}


def open_page(page, lang):
    target = BASE.rstrip('/') + ('/' if lang == 'ja' else '/en/')
    response = page.goto(target, wait_until='networkidle')
    assert response is not None and response.status == 200 and response.url == target
    assert 'upgrade-insecure-requests' in response.headers.get('content-security-policy', ''), 'Exercise the real Worker CSP'


def capture(page, path, report, label, full_page=False):
    try:
        page.screenshot(path=str(path), full_page=full_page, animations='disabled')
    except Exception as error:
        # Preserve the original assertion failure and the JSON report even if
        # screenshot capture itself fails. A missing image remains a failure.
        report['errors'].append({'case':label, 'error':'Screenshot: ' + str(error)})


def run_browser_matrix(report):
    local_tls = allow_self_signed_loopback()
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
                            device_scale_factor=1, ignore_https_errors=local_tls)
                        page = context.new_page()
                        delivery = observe_delivery(page)
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
                            report['errors'].append({'case':label, 'error':str(error),
                                                     'delivery':delivery()})
                            capture(page, OUT/f'FAILED-{label}.png', report, label)
                        finally:
                            context.close()
                for lang in ['ja', 'en']:
                    context = browser.new_context(java_script_enabled=False,
                                                  viewport={'width':390, 'height':844},
                                                  ignore_https_errors=local_tls)
                    page = context.new_page()
                    delivery = observe_delivery(page)
                    begin_home_v4_requests(page)
                    page.set_default_timeout(12000)
                    label = f'{engine}-{lang}-no-script'
                    try:
                        open_page(page, lang)
                        contract = assert_home_v4(page, interactive=False)
                        capture(page, OUT/f'{label}.png', report, label)
                        report['cases'].append({'case':label, 'contract':contract})
                    except Exception as error:
                        report['errors'].append({'case':label, 'error':str(error),
                                                 'delivery':delivery()})
                    finally:
                        context.close()
            finally:
                browser.close()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    report = {'scope':'Actual built homepages through local Worker',
              'base_url':BASE, 'physical_iphone':False, 'production':False,
              'cases':[], 'errors':[]}
    try:
        local_tls = allow_self_signed_loopback()
        # This context is used only for the guarded CI loopback readiness check.
        # No default/global TLS policy or production security header is changed.
        readiness_tls = ssl._create_unverified_context() if local_tls else None
        report['ci_loopback_self_signed_certificate'] = local_tls
        for attempt in range(90):
            try:
                with urllib.request.urlopen(BASE, timeout=2, context=readiness_tls) as response:
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
