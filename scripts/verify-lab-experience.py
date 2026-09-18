"""Read-only browser acceptance for Product Lab. No external workflows or forms.
Normal mode validates the generated site on QA_BASE. --fixture-dir is explicitly
labelled local shell/component testing and never reported as built-site evidence.
"""
from pathlib import Path
import argparse
import json
import os
from playwright.sync_api import sync_playwright

IDS = ['genie','ai-meeting','oathra','aisecure','agent-team','launchloom']

def guided(page, product):
    figure = page.locator('.studio-player,.owned-film').first
    page.wait_for_selector('[data-lab-try]')
    assert figure.locator('.rm-app').get_attribute('data-product') == product
    figure.locator('[data-lab-try]').click()
    assert figure.get_attribute('data-lab-guided') == 'true'
    assert figure.locator('.rm-live-demo').get_attribute('data-running') == 'false'
    assert figure.locator('video').get_attribute('src') is None
    assert figure.locator('video').evaluate('(v)=>v.paused')
    box = figure.locator('.lab-hands')
    box.locator('[data-next]').click()
    assert box.locator('[data-next]').is_disabled()
    box.locator('[data-answer="1"]').click()
    assert box.locator('[data-next]').is_disabled(), 'Unverified choice must not complete'
    assert box.locator('.lab-feedback').inner_text().strip()
    box.locator('[data-answer="0"]').click()
    assert box.locator('[data-next]').is_enabled()
    assert box.locator('[data-answer="0"]').get_attribute('aria-pressed') == 'true'
    box.locator('[data-next]').click()
    assert figure.locator('.rm-live-demo').get_attribute('data-phase') == '3'
    assert box.locator('.lab-output').is_visible()
    box.locator('[data-next]').click()
    assert figure.locator('.rm-live-demo').get_attribute('data-phase') == '4'
    assert box.locator('[data-download]').is_visible()
    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth+1')
    figure.locator('[data-mode="recording"]').click()
    assert not box.is_visible()
    assert not figure.locator('.rm-live-demo').is_visible()
    assert figure.locator('.studio-player-screen>img,.owned-film__screen>img').is_visible()
    assert figure.locator('video').get_attribute('src') is None, 'Selecting a mode cannot download media'
    figure.locator('[data-mode="story"]').click()
    assert figure.locator('.rm-live-demo').is_visible()
    assert figure.locator('.rm-demo-controls').is_visible()

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--fixture-dir')
    parser.add_argument('--output',default='film-qa/product-lab')
    args=parser.parse_args()
    base=os.environ.get('QA_BASE','http://127.0.0.1:8787')
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    report={'scope':'Local shell/component fixture; not the full repository or production' if args.fixture_dir else 'Generated repository site in Chromium; not production or Safari','checks':[],'errors':[]}
    with sync_playwright() as pw:
        options={}
        if os.environ.get('QA_CHROMIUM'): options={'executable_path':os.environ['QA_CHROMIUM'],'args':['--no-sandbox']}
        browser=pw.chromium.launch(**options)
        def load(page,lang,product=None):
            if args.fixture_dir:
                page.set_content((Path(args.fixture_dir)/f'{lang}.html').read_text())
            else:
                prefix='/en/' if lang=='en' else '/'
                page.goto(base+prefix+(f'products/{product}/' if product else ''),wait_until='networkidle')
        for lang in ['ja','en']:
            for width in [390,1024,1440]:
                context=browser.new_context(viewport={'width':width,'height':1000})
                page=context.new_page();page.set_default_timeout(12000)
                page.on('pageerror',lambda e:report['errors'].append(str(e)))
                try:
                    load(page,lang)
                    page.wait_for_selector('[data-lab-try]')
                    assert page.locator('h1').count()==1
                    assert page.locator('.lab-product-card').count()==6
                    assert page.locator('[data-lab-begin]').is_visible()
                    for product in IDS:
                        page.locator(f'[data-studio-choice="{product}"]').click()
                        page.wait_for_function('(id)=>document.querySelector(".rm-app").dataset.product===id',arg=product)
                        guided(page,product)
                        assert page.locator('.lab-current').get_attribute('data-product')==product
                        assert page.locator('[data-lab-detail]').get_attribute('href').endswith(f'/products/{product}/')
                        report['checks'].append({'lang':lang,'width':width,'product':product,'guide_and_recording_mode':True})
                    first=page.locator('[role=tab]').first;first.focus();page.keyboard.press('ArrowRight')
                    page.wait_for_function('document.querySelector(".lab-current").dataset.product==="ai-meeting"')
                    assert page.locator('.rm-app').get_attribute('data-product')=='ai-meeting'
                    page.locator('[data-lab-select="genie"]').click()
                    page.wait_for_function('document.querySelector(".lab-current").dataset.product==="genie"')
                    page.locator('[data-cue="4"]').click()
                    page.evaluate('window.scrollTo({top:0,behavior:"instant"})')
                    page.screenshot(path=str(out/f'{lang}-home-{width}.png'),full_page=True,animations='disabled')
                except Exception as e:
                    report['errors'].append({'lang':lang,'width':width,'error':str(e)})
                context.close()
            # Details must have the same guided sample, not just the homepage.
            if not args.fixture_dir:
                context=browser.new_context(viewport={'width':390,'height':844})
                page=context.new_page();page.set_default_timeout(12000)
                for product in IDS:
                    try:
                        load(page,lang,product)
                        guided(page,product)
                        report['checks'].append({'lang':lang,'product':product,'detail_guide':True})
                    except Exception as e: report['errors'].append({'detail':product,'lang':lang,'error':str(e)})
                context.close()
            context=browser.new_context(reduced_motion='reduce',viewport={'width':390,'height':844})
            page=context.new_page();page.set_default_timeout(12000)
            try:
                load(page,lang);page.wait_for_selector('[data-lab-try]')
                assert page.locator('.rm-live-demo').get_attribute('data-phase')=='4'
                assert page.locator('[data-action="pause"]').is_disabled()
                guided(page,'genie')
                report['checks'].append({'lang':lang,'reduced_motion_guide':True})
            except Exception as e: report['errors'].append({'reduced_motion':lang,'error':str(e)})
            context.close()
            context=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
            page=context.new_page()
            try:
                load(page,lang)
                assert page.locator('h1').is_visible()
                assert page.locator('.studio-picker a').count()==6
                assert page.locator('.studio-player-screen>img').is_visible()
                assert not page.locator('[data-lab-begin]').is_visible()
                assert page.locator('.lab-card-actions a').count()==12
                assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
                report['checks'].append({'lang':lang,'no_script_navigation':True})
            except Exception as e: report['errors'].append({'no_script':lang,'error':str(e)})
            context.close()
        browser.close()
    report['passed']=len(report['checks']);report['failed']=len(report['errors'])
    (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps(report,ensure_ascii=False,indent=2))
    raise SystemExit(bool(report['errors']))

if __name__=='__main__': main()
