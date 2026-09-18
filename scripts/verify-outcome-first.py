"""Full-build browser acceptance over local HTTP, not a production audit.
No content/script rewriting, mocked posters, remote AI calls or auth.
"""
from __future__ import annotations
import argparse
import json
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright
IDS=['genie','ai-meeting','oathra','aisecure','agent-team','launchloom']
SIZES=[(1440,1000),(1024,900),(390,844),(320,780)]
class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def log_message(self,*args): pass

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--browser',choices=['chromium','webkit'],default='chromium');args=parser.parse_args()
    root=Path(__file__).resolve().parents[1];out=root/'film-qa'/'outcome-first'/args.browser;out.mkdir(parents=True,exist_ok=True)
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(root/'dist')))
    threading.Thread(target=server.serve_forever,daemon=True).start();origin=f'http://127.0.0.1:{server.server_port}'
    report={'browser':args.browser,'mode':'unmodified build over local HTTP','production':False,'cases':[],'errors':[]}
    with sync_playwright() as p:
        browser=getattr(p,args.browser).launch()
        try:
            for lang in ['ja','en']:
                base='' if lang=='ja' else 'en/'
                for product in ['home',*IDS]:
                    route=f'/{base}' if product=='home' else f'/{base}products/{product}/'
                    for width,height in SIZES:
                        key=f'{lang}-{product}-{width}';context=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce',accept_downloads=True)
                        page=context.new_page();page.set_default_timeout(8000);errors=[]
                        page.on('pageerror',lambda error:errors.append(str(error)))
                        try:
                            response=page.goto(origin+route,wait_until='networkidle');assert response.status==200
                            assert page.locator('body').get_attribute('data-outcome-first')=='20260919-outcome-1'
                            assert page.locator('h1').count()==1
                            dimensions=page.evaluate('({width:document.documentElement.scrollWidth,viewport:innerWidth,h1:parseFloat(getComputedStyle(document.querySelector("h1")).fontSize)})')
                            assert dimensions['width']<=width+1,dimensions
                            assert dimensions['h1']>=30,dimensions
                            page.keyboard.press('Tab');assert page.evaluate('document.activeElement.classList.contains("skip-link")')
                            if product=='home':
                                page.wait_for_selector('[data-orbit-ready]');assert page.locator('[data-orbit-study]').get_attribute('data-orbit-motion')=='paused'
                                if width==390:
                                    page.locator('[data-orbit-toggle]').click();assert page.locator('[data-orbit-study]').get_attribute('data-orbit-motion')=='running'
                                    page.locator('[data-orbit-toggle]').click()
                                    page.locator('[data-orbit-palette="night"]').click();assert page.locator('[data-orbit-study]').get_attribute('data-orbit-theme')=='night'
                                    with page.expect_download() as download:page.locator('[data-orbit-save]').click()
                                    assert download.value.suggested_filename=='reachmade-orbit-study.html'
                                page.wait_for_selector('[data-lab-try]')
                                for identifier in IDS:
                                    choice=page.locator(f'[data-studio-choice="{identifier}"]');choice.click()
                                    page.wait_for_function('(id)=>document.querySelector(".studio-workbench").dataset.product===id',arg=identifier)
                                    expected=choice.get_attribute('data-outcome-start');actual=page.locator('[data-outcome-start-link]').get_attribute('href');assert actual==expected,(identifier,expected,actual)
                                page.locator('[data-studio-choice="genie"]').click()
                            else:
                                page.wait_for_selector('[data-outcome-sample]:not([hidden])')
                                assert page.locator('.owned-primary').first.bounding_box()['height']>=44
                                if width==390:
                                    page.locator('[data-outcome-sample]').click();assert page.locator('.owned-film .lab-hands').is_visible()
                            assert not errors,errors
                            page.evaluate('document.activeElement.blur();window.scrollTo(0,0)')
                            if width in [1440,390]:page.screenshot(path=str(out/f'{key}.png'),full_page=True)
                            report['cases'].append({'id':key,'passed':True,'geometry':dimensions})
                        except Exception as exc:
                            report['errors'].append({'id':key,'error':str(exc),'page_errors':errors})
                            try:page.screenshot(path=str(out/f'failure-{key}.png'),full_page=True)
                            except Exception:pass
                        finally:context.close()
            for lang in ['ja','en']:
                context=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844});page=context.new_page()
                try:
                    page.goto(origin+('/' if lang=='ja' else '/en/'))
                    assert page.locator('.outcome-intro a[href="#explore"]').is_visible()
                    assert page.locator('[data-orbit-study] svg').is_visible()
                    assert page.locator('[data-orbit-controls]').is_hidden()
                    assert page.locator('[data-outcome-start-link]').is_visible()
                    report['cases'].append({'id':f'{lang}-no-js','passed':True})
                except Exception as exc:report['errors'].append({'id':f'{lang}-no-js','error':str(exc)})
                finally:context.close()
        finally:
            browser.close();server.shutdown();(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'browser':args.browser,'passed':len(report['cases']),'errors':report['errors']},ensure_ascii=False,indent=2))
    if report['errors']:raise SystemExit(1)
if __name__=='__main__':main()
