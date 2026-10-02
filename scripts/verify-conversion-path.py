"""Local conversion QA. Existing Chromium + Playwright; mocked intake only."""
from pathlib import Path
import json, os, subprocess, hashlib
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('CONVERSION_QA_ORIGIN','http://127.0.0.1:4197')
assert urlparse(BASE).hostname in ['127.0.0.1','localhost'], 'Only local QA origins are permitted'
OUT = Path('artifacts/ui/conversion'); OUT.mkdir(parents=True, exist_ok=True)
report = {'scope':'Built local pages; synthetic intake responses; no production form submissions', 'revision':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(), 'checks':[], 'errors':[], 'externalRequests':[], 'blocked':['Live intake storage/operator receipt','Real iPhone/Safari and VoiceOver','Visitor counts and conversion uplift']}
report['sourceHashes']={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for folder in ['src','public/assets'] for p in sorted(Path(folder).glob('*')) if p.is_file()}
report['status']='RUNNING'
(OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
def local_only(route):
    if route.request.url.startswith(BASE+'/'): route.continue_()
    else:
        report['externalRequests'].append(route.request.url);route.abort()

with sync_playwright() as pw:
    try:
        browser=pw.chromium.launch(executable_path=os.environ.get('CHROME_BIN','/usr/bin/chromium'),args=['--no-sandbox'])
    except Exception as error:
        report['status']='BLOCKED';report['blocked'].append('Browser startup: '+str(error))
        (OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
        print(json.dumps(report,ensure_ascii=False,indent=2));raise SystemExit(2)
    report['browser']=browser.version
    for language in ['ja','en']:
        prefix='/en' if language=='en' else ''
        for width in [1440,1024,390,320]:
            context=browser.new_context(viewport={'width':width,'height':1000},reduced_motion='reduce')
            submitted=[]; mode={'status':201}; errors=[]; requests=[]
            def handle(route):
                req=route.request; requests.append({'method':req.method,'url':req.url})
                if not req.url.startswith(BASE+'/'):
                    report['externalRequests'].append(req.url);route.abort();return
                path=urlparse(req.url).path
                if path=='/api/inquiries/status':
                    route.fulfill(status=200,content_type='application/json',body='{"available":true}');return
                if path=='/api/inquiries':
                    submitted.append(req.post_data_json)
                    data={'receipt':'AM-1234ABCD'} if mode['status']==201 else {'error':'TEST_FAILURE'}
                    route.fulfill(status=mode['status'],content_type='application/json',body=json.dumps(data));return
                route.continue_()
            context.route('**/*',handle)
            page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
            page.set_default_timeout(7000)
            try:
                # Actual home -> record -> scoped offer -> contextual inquiry.
                page.goto(BASE+prefix+'/',wait_until='networkidle')
                page.locator(f'a[href="{prefix}/work/#noa"]').click()
                expect(page.locator('#noa .work-consult')).to_be_visible()
                page.screenshot(path=str(OUT/f'work-{language}-{width}.png'),full_page=False)
                page.locator(f'#noa a[href="{prefix}/services/#ai-character"]').click()
                expect(page.locator('#ai-character')).to_be_visible()
                page.locator('#feasibility').scroll_into_view_if_needed()
                page.screenshot(path=str(OUT/f'offer-{language}-{width}.png'),full_page=False)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
                page.locator(f'#ai-character a[href="{prefix}/contact/#service-ai-character"]').click()
                expect(page.locator('#inquiry-entry')).to_be_visible()
                expect(page.locator('#inquiry-submit')).to_be_enabled()
                expect(page.locator('[name=message]')).to_have_value('')
                expect(page.locator('[name=consent]')).not_to_be_checked()
                assert submitted==[]
                page.locator('#inquiry-use-template').focus()
                page.keyboard.press('Enter')
                expect(page.locator('[name=message]')).to_be_focused()
                first=page.locator('[name=message]').input_value()
                assert 'AI' in first and len(first)>10
                assert page.locator('[name=useCase]').input_value()=='custom'
                assert submitted==[]
                page.locator('#inquiry-use-template').click()
                expect(page.locator('[name=message]')).to_have_value(first)
                page.locator('[name=message]').fill(first+'\nLocal QA detail')
                saved=page.locator('[name=message]').input_value()
                # A form jump must stay in this tab and preserve contextual help and draft.
                page.locator('a[href="#reachmade-inquiry"]').click()
                assert len(context.pages)==1
                expect(page.locator('#inquiry-entry')).to_be_visible()
                expect(page.locator('[name=message]')).to_have_value(saved)
                # Same-page newer navigation and Back/Forward must not overwrite draft/topic.
                page.evaluate("location.hash='product-ai-meeting'")
                expect(page.locator('#inquiry-entry-label')).to_contain_text('AI Meeting')
                page.locator('#inquiry-use-template').click()
                expect(page.locator('[name=message]')).to_have_value(saved)
                page.go_back();expect(page.locator('[name=message]')).to_have_value(saved)
                page.go_forward();expect(page.locator('[name=message]')).to_have_value(saved)
                page.locator('#reachmade-inquiry').scroll_into_view_if_needed()
                page.screenshot(path=str(OUT/f'contact-{language}-{width}.png'),full_page=False)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
                # Rejection keeps draft; unknown result blocks repost; these replies are local fixtures.
                page.locator('[name=name]').fill('Conversion QA')
                page.locator('[name=email]').fill('qa@example.invalid')
                page.locator('#inquiry-submit').click();assert submitted==[]
                page.locator('[name=consent]').check();mode['status']=400
                page.locator('#inquiry-submit').click()
                expect(page.locator('#reachmade-inquiry')).to_have_attribute('data-state','rejected')
                expect(page.locator('[name=message]')).to_have_value(saved)
                mode['status']=503;page.locator('#inquiry-submit').click()
                expect(page.locator('#reachmade-inquiry')).to_have_attribute('data-state','unconfirmed')
                assert len(submitted)==2 and submitted[0]['requestId']==submitted[1]['requestId']
                expect(page.locator('#inquiry-submit')).to_be_disabled()
                page.locator('#inquiry-use-template').click()
                expect(page.locator('[name=message]')).to_have_value(saved)
                page.locator('#inquiry-reconnect').click()
                expect(page.locator('#inquiry-submit')).to_be_disabled()
                # New independent page lifecycle for synthetic accepted/reset scenario.
                page.goto(BASE+prefix+'/contact/#product-noa',wait_until='networkidle')
                page.locator('#inquiry-use-template').click();mode['status']=201
                page.locator('[name=name]').fill('Conversion QA')
                page.locator('[name=email]').fill('qa@example.invalid')
                page.locator('[name=message]').fill(page.locator('[name=message]').input_value()+'\nSynthetic acceptance test')
                page.locator('[name=consent]').check();page.locator('#inquiry-submit').click()
                expect(page.locator('#inquiry-result')).to_have_attribute('data-receipt','AM-1234ABCD')
                expect(page.locator('[name=message]')).to_have_value('')
                expect(page.locator('[name=consent]')).not_to_be_checked()
                assert len(submitted)==3 and submitted[-1]['useCase']=='custom'
                assert set(submitted[-1])=={'requestId','name','email','organization','useCase','message','consent','website','language'}
                assert submitted[-1]['language']==language
                page.locator('#inquiry-use-template').click();expect(page.locator('[name=message]')).to_have_value('')
                assert not errors,errors
                report['checks'].append({'language':language,'width':width,'flow':'home→work→service→inquiry','templateExplicitAndEditable':True,'noPostBeforeConsent':True,'noDraftOverwriteOnRepeatOrNavigation':True,'uncertainBlocksResend':True,'valid201ReceiptAndReset':True,'schemaUnchanged':True,'overflow':False})
            except Exception as error:
                report['errors'].append({'language':language,'width':width,'error':str(error)})
                page.screenshot(path=str(OUT/f'failure-{language}-{width}.png'),full_page=True)
            finally: context.close()
        # Legacy parameters and malicious input are exercised on the real generated form.
        context=browser.new_context(viewport={'width':390,'height':1000})
        context.route('**/*',local_only)
        context.route(BASE+'/api/inquiries/status',lambda r:r.fulfill(status=200,content_type='application/json',body='{"available":true}'))
        context.route(BASE+'/api/inquiries',lambda r:r.abort())
        page=context.new_page()
        try:
            for query,use in [('product=ai-meeting','tasks'),('product=noa','custom'),('product=genie','genie'),('service=01','custom'),('service=02','custom'),('service=03','custom')]:
                page.goto(BASE+prefix+'/contact/?'+query,wait_until='networkidle')
                page.locator('#inquiry-use-template').click()
                expect(page.locator('[name=useCase]')).to_have_value(use)
                expect(page.locator('[name=consent]')).not_to_be_checked()
            page.goto(BASE+prefix+'/contact/?product=%3Cscript%3E&message=private',wait_until='networkidle')
            expect(page.locator('#inquiry-entry')).to_be_hidden()
            expect(page.locator('[name=message]')).to_have_value('')
            report['checks'].append({'language':language,'legacyLinks':6,'maliciousInputIgnored':True})
        except Exception as error: report['errors'].append({'language':language,'legacy':str(error)})
        context.close()
        # Negative receipt boundaries use independent page lifecycles and local replies.
        for status,payload in [(200,{'receipt':'AM-1234ABCD'}),(201,{'receipt':'invalid'})]:
            context=browser.new_context(viewport={'width':390,'height':1000})
            context.route('**/*',local_only)
            context.route(BASE+'/api/inquiries/status',lambda r:r.fulfill(status=200,content_type='application/json',body='{"available":true}'))
            context.route(BASE+'/api/inquiries',lambda r:r.fulfill(status=status,content_type='application/json',body=json.dumps(payload)))
            page=context.new_page()
            try:
                page.goto(BASE+prefix+'/contact/#service-voice-ai',wait_until='networkidle')
                page.locator('#inquiry-use-template').click()
                page.locator('[name=name]').fill('Local QA');page.locator('[name=email]').fill('qa@example.invalid')
                page.locator('[name=consent]').check();page.locator('#inquiry-submit').click()
                expect(page.locator('#reachmade-inquiry')).to_have_attribute('data-state','unconfirmed')
                expect(page.locator('#inquiry-submit')).to_be_disabled()
                assert not page.locator('#inquiry-result').get_attribute('data-receipt')
                report['checks'].append({'language':language,'negativeReceiptFixture':{'status':status,'payload':payload},'falseAcceptancePrevented':True})
            except Exception as error: report['errors'].append({'language':language,'negativeReceipt':str(error)})
            context.close()
        context=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':1000})
        context.route('**/*',local_only);page=context.new_page()
        try:
            page.goto(BASE+prefix+'/services/');expect(page.locator('#ai-character a.button')).to_be_visible()
            page.locator('#ai-character a.button').click()
            expect(page.locator('noscript')).to_contain_text('JavaScript')
            expect(page.locator('#inquiry-submit')).to_be_disabled()
            report['checks'].append({'language':language,'noJsLinksAndExplanation':True})
        except Exception as error: report['errors'].append({'language':language,'noJs':str(error)})
        context.close()
    browser.close()
report['status']='PASS' if not report['errors'] and not report['externalRequests'] else 'FAIL'
(OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
raise SystemExit(report['status']!='PASS')
