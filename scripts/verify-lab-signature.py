"""Request/Result signature acceptance. Chromium + WebKit are not physical iPhones.
QA_FIXTURE enables explicitly labelled, offline component-shell checks only.
The normal CI path checks the real generated site through the local Worker.
"""
from pathlib import Path
import json, os, time, urllib.request
from playwright.sync_api import sync_playwright

BASE=os.environ.get('QA_BASE','http://127.0.0.1:8787')
FIXTURE=os.environ.get('QA_FIXTURE')
IDS=['genie','ai-meeting','oathra','aisecure','agent-team','launchloom']
OUT=Path(os.environ.get('QA_OUTPUT','film-qa/lab-signature'))

def open_page(page,lang):
    if FIXTURE:
        file=Path(FIXTURE if lang=='ja' else FIXTURE.replace('.html','-en.html'))
        page.set_content(file.read_text(),wait_until='load')
    else:
        page.goto(BASE+('/' if lang=='ja' else '/en/'),wait_until='networkidle')

def no_overflow(page):
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'), 'Horizontal page overflow'

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    report={'scope':'Offline component/review shell' if FIXTURE else 'Actual built Product Lab through local Worker', 'physical_iphone':False,'production':False,'cases':[],'errors':[]}
    if not FIXTURE:
        for attempt in range(90):
            try:
                if urllib.request.urlopen(BASE,timeout=2).status==200:break
            except Exception:
                if attempt==89:raise
                time.sleep(1)
    with sync_playwright() as p:
        for engine in os.environ.get('QA_BROWSERS','chromium,webkit').split(','):
            kwargs={}
            if os.environ.get('QA_EXECUTABLE'):kwargs['executable_path']=os.environ['QA_EXECUTABLE']
            browser=getattr(p,engine).launch(**kwargs)
            for width,height in [(1440,1000),(1024,900),(390,844)]:
                for lang in ['ja','en']:
                    context=browser.new_context(viewport={'width':width,'height':height},has_touch=width<500,is_mobile=width<500,device_scale_factor=1)
                    page=context.new_page();page.set_default_timeout(12000)
                    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                    label=f'{engine}-{lang}-{width}'
                    try:
                        open_page(page,lang)
                        page.wait_for_selector('body[data-signature-ready="true"]')
                        assert page.locator('.lab-signature').count()==1
                        assert page.locator('.lab-selection-line').count()==1
                        assert page.locator('[role=tab]').count()==6
                        no_overflow(page)
                        assert page.locator('.studio-player').bounding_box()['y'] < height, 'Product starts below first viewport'
                        for id in IDS:
                            page.locator(f'[data-studio-choice="{id}"]').click()
                            page.wait_for_function('id=>document.querySelector(".lab-signature").dataset.product===id && document.querySelector(".rm-app").dataset.product===id',arg=id)
                            assert page.locator('[data-signature-request]').inner_text().strip()
                            assert page.locator('[data-signature-result]').inner_text().strip()
                            page.locator('[data-signature-cue="4"]').click()
                            page.wait_for_function('document.querySelector(".lab-signature").dataset.phase==="4"')
                            assert page.locator('.rm-live-demo').get_attribute('data-phase')=='4'
                            assert page.locator('.rm-live-demo').get_attribute('data-running')=='false'
                            assert page.locator('.lab-signature').evaluate("e=>e.style.getPropertyValue('--signature-progress')")=='1'
                            no_overflow(page)
                        # Last selection wins even before previous transitions complete.
                        page.evaluate('''()=>{for(const id of ['oathra','genie','ai-meeting'])document.querySelector(`[data-studio-choice="${id}"]`).click()}''')
                        page.wait_for_function('document.querySelector(".lab-signature").dataset.product==="ai-meeting"')
                        assert page.locator('.rm-app').get_attribute('data-product')=='ai-meeting'
                        page.locator('[data-signature-cue="4"]').click()
                        page.wait_for_function('document.querySelector(".lab-signature").dataset.phase==="4"')
                        pos=page.locator('.rm-demo-scrub input').input_value()
                        page.evaluate('scrollTo(0,document.body.scrollHeight)');page.wait_for_timeout(100)
                        page.evaluate('scrollTo(0,0)');page.wait_for_timeout(120)
                        assert page.locator('.rm-demo-scrub input').input_value()==pos,'Scrolling resumed a paused story'
                        page.locator('[data-mode="recording"]').click()
                        page.wait_for_function('document.querySelector(".lab-signature").dataset.mode==="recording"')
                        assert not page.locator('.rm-live-demo').is_visible()
                        assert page.locator('.studio-player video').evaluate('(v)=>v.paused')
                        page.locator('[data-signature-cue="0"]').click()
                        page.wait_for_function('document.querySelector(".lab-signature").dataset.phase==="0"')
                        assert page.locator('.rm-live-demo').is_visible()
                        page.locator('[data-lab-try]').click()
                        assert page.locator('.studio-player').get_attribute('data-lab-guided')=='true'
                        page.locator('[data-signature-cue="4"]').click()
                        assert page.locator('.studio-player').get_attribute('data-lab-guided') is None
                        first=page.locator('[role=tab]').first;first.focus();page.keyboard.press('End')
                        page.wait_for_function('document.querySelector(".lab-signature").dataset.product==="launchloom"')
                        page.keyboard.press('Home')
                        page.wait_for_function('document.querySelector(".lab-signature").dataset.product==="genie"')
                        # Reduced motion may change while this page is open.
                        page.emulate_media(reduced_motion='reduce')
                        page.wait_for_function('document.querySelector(".rm-live-demo").dataset.running==="false"')
                        assert page.locator('.lab-selection-line').evaluate('(e)=>getComputedStyle(e).transitionDuration')=='0s'
                        assert page.locator('[data-action="pause"]').is_disabled()
                        page.locator('[data-signature-cue="0"]').click()
                        page.wait_for_function('document.querySelector(".lab-signature").dataset.phase==="0"')
                        page.locator('[data-signature-cue="4"]').click()
                        page.wait_for_function('document.querySelector(".lab-signature").dataset.phase==="4"')
                        for b in page.locator('.rm-demo-modes button,[data-signature-cue]').all():
                            if b.is_visible():assert b.bounding_box()['height']>=44, 'Small touch control'
                        page.evaluate('scrollTo(0,0)')
                        page.screenshot(path=str(OUT/f'{label}-first.png'))
                        if width==1440:page.screenshot(path=str(OUT/f'{label}-full.png'),full_page=True)
                        assert not errors, errors
                        report['cases'].append({'case':label,'products':6,'rapid_switch':True,'pause_survives_scroll':True,'keyboard':True,'live_reduced_motion':True,'modes':True,'overflow':False})
                    except Exception as e:
                        report['errors'].append({'case':label,'error':str(e)})
                        page.screenshot(path=str(OUT/f'FAILED-{label}.png'))
                    finally:context.close()
            for lang in ['ja','en']:
                context=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
                page=context.new_page()
                try:
                    open_page(page,lang)
                    assert page.locator('.lab-signature').is_visible()
                    assert page.locator('.studio-picker a').count()==6
                    assert not page.locator('[data-signature-cue="4"]').is_visible()
                    no_overflow(page)
                    report['cases'].append({'case':f'{engine}-{lang}-no-script','static_request_result':True,'navigation':True})
                except Exception as e:report['errors'].append({'case':f'{engine}-{lang}-no-script','error':str(e)})
                finally:context.close()
            browser.close()
    (OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps(report,ensure_ascii=False,indent=2))
    raise SystemExit(bool(report['errors']))
if __name__=='__main__':main()
