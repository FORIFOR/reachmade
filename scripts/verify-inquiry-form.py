"""Actual generated form and local Worker; mocked intake, no production messages."""
from pathlib import Path
import json
import time
import urllib.request
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:8787'
OUT = Path('film-qa/inquiries'); OUT.mkdir(parents=True, exist_ok=True)
report = {'scope': 'Actual generated UI and Worker headers, mocked intake responses; not a production submission', 'checks': [], 'errors': []}
for attempt in range(90):
    try:
        urllib.request.urlopen(BASE, timeout=2).close(); break
    except Exception:
        if attempt == 89: raise
        time.sleep(1)
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    for width in [390, 1440]:
        for language in ['ja','en']:
            route = ('/en' if language == 'en' else '') + '/contact/'
            context = browser.new_context(viewport={'width':width,'height':1000})
            # An accidental external request cannot contact the live intake.
            context.route('https://**/*', lambda r: r.abort())
            submitted = []
            replies = [(503, {'error':'UNAVAILABLE'}),(201, {'receipt':'AM-1234ABCD'}),(429, {'error':'CAPACITY'}),(200, {'receipt':'AM-1234ABCD'})]
            def intake(r):
                submitted.append(r.request.post_data_json)
                status, payload = replies.pop(0)
                r.fulfill(status=status, content_type='application/json', body=json.dumps(payload))
            context.route('**/api/inquiries/status', lambda r:r.fulfill(status=200,content_type='application/json',body='{"available":true}'))
            context.route('**/api/inquiries', intake)
            page = context.new_page(); page.set_default_timeout(15000)
            errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
            try:
                response=page.goto(BASE+route,wait_until='networkidle')
                assert "connect-src 'self'" in response.headers['content-security-policy']
                expect(page.locator('#inquiry-submit')).to_be_enabled()
                assert submitted == [], 'Input was submitted before intent'
                def fill():
                    page.locator('[name=name]').fill('QA visitor')
                    page.locator('[name=email]').fill('qa@example.invalid')
                    page.locator('[name=message]').fill('Synthetic browser acceptance test only.')
                fill()
                assert submitted == [], 'Typing transmitted the message'
                page.locator('#inquiry-submit').click()
                assert submitted == [], 'Unchecked consent did not prevent submission'
                page.locator('[name=consent]').check()
                page.locator('#inquiry-submit').click()
                expect(page.locator('#reachmade-inquiry')).not_to_have_attribute('aria-busy','true')
                assert len(submitted)==1 and submitted[0]['consent'] is True
                expect(page.locator('[name=message]')).to_have_value('Synthetic browser acceptance test only.')
                assert not page.locator('#inquiry-result').get_attribute('data-receipt')
                page.locator('#inquiry-submit').click()
                expect(page.locator('#inquiry-result')).to_have_attribute('data-receipt','AM-1234ABCD')
                assert len(submitted)==2 and submitted[0]['requestId']==submitted[1]['requestId']
                assert submitted[1]['language']==language
                expect(page.locator('[name=message]')).to_have_value('')
                expect(page.locator('[name=consent]')).not_to_be_checked()
                fill(); page.locator('[name=consent]').check();page.locator('#inquiry-submit').click()
                expect(page.locator('#reachmade-inquiry')).not_to_have_attribute('aria-busy','true')
                assert len(submitted)==3 and submitted[2]['requestId']!=submitted[1]['requestId']
                assert not page.locator('#inquiry-result').get_attribute('data-receipt'), 'Stale receipt survived'
                expect(page.locator('[name=message]')).to_have_value('Synthetic browser acceptance test only.')
                page.locator('#inquiry-submit').click()
                expect(page.locator('#reachmade-inquiry')).not_to_have_attribute('aria-busy','true')
                assert len(submitted)==4 and submitted[3]['requestId']==submitted[2]['requestId']
                assert not page.locator('#inquiry-result').get_attribute('data-receipt'), 'Non-201 accepted as saved'
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
                assert not errors, errors
                page.screenshot(path=str(OUT/f'{language}-{width}.png'),full_page=True)
                report['checks'].append({'language':language,'width':width,'consent_gate':True,'no_input_transmission_before_submit':True,'failed_write_retains_input':True,'idempotent_retry':True,'new_inquiry_has_new_id':True,'receipt_requires_201':True,'overflow':False})
            except Exception as e:
                report['errors'].append({'language':language,'width':width,'error':str(e)})
            finally: context.close()
    # Readiness remains closed without an explicitly available backend.
    context=browser.new_context(viewport={'width':390,'height':900})
    context.route('**/api/inquiries/status',lambda r:r.fulfill(status=503,content_type='application/json',body='{"available":false}'))
    page=context.new_page();page.goto(BASE+'/contact/',wait_until='networkidle')
    try:
        expect(page.locator('#inquiry-submit')).to_be_disabled()
        assert not page.locator('#inquiry-result').get_attribute('data-receipt')
        report['checks'].append({'unconfigured_service_stays_disabled':True})
    except Exception as e: report['errors'].append({'readiness':str(e)})
    context.close();browser.close()
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
raise SystemExit(bool(report['errors']))
