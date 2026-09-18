"""Acceptance checks for the actual generated showcase, not a visual mockup.

Run against the local Worker after npm run check and npm run media:prepare.
Writes screenshots and machine-readable evidence; never deploys or submits forms.
"""
from pathlib import Path
import json
import os
import time
import urllib.request
from playwright.sync_api import sync_playwright

BASE = os.environ.get('QA_BASE', 'http://127.0.0.1:8787')
IDS = ['genie', 'ai-meeting', 'oathra', 'aisecure', 'agent-team', 'launchloom']

def ready():
    for i in range(90):
        try:
            with urllib.request.urlopen(BASE + '/', timeout=2) as r:
                if r.status == 200:
                    return
        except Exception:
            pass
        time.sleep(1)
    raise RuntimeError('Local Worker did not become ready')

def geometry(page):
    return page.evaluate('''() => ({
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      background: getComputedStyle(document.body).backgroundColor,
      foreground: getComputedStyle(document.body).color,
      columns: document.querySelector('.owned-hero-grid') ? getComputedStyle(document.querySelector('.owned-hero-grid')).gridTemplateColumns : null,
      areas: document.querySelector('.owned-hero-grid') ? getComputedStyle(document.querySelector('.owned-hero-grid')).gridTemplateAreas : null
    })''')

def healthy(page):
    assert page.locator('h1').count() == 1, 'Exactly one primary headline required'
    assert page.locator('body').get_attribute('data-showcase') == '20260918'
    assert not geometry(page)['overflow'], 'Horizontal overflow'
    page.wait_for_function('''() => [...document.querySelectorAll('.studio-player-screen>img,.owned-film__screen>img')].every(i => i.complete && i.naturalWidth > 0)''')
    assert page.locator('link[rel="canonical"]').count() == 1

def play_recording(page, selector):
    video = page.locator(selector + ' video')
    assert video.evaluate('(v)=>v.paused && v.currentTime===0'), 'No autoplay'
    assert video.get_attribute('src') is None, 'No eager recording download'
    page.locator(selector + ' button').click()
    page.wait_for_function('''s => {const v=document.querySelector(s+' video');return v && !v.paused && v.currentTime>.25 && v.readyState>=2 && v.getVideoPlaybackQuality().totalVideoFrames>0;}''', arg=selector)
    info = video.evaluate('(v)=>({duration:v.duration,rate:v.playbackRate,time:v.currentTime,src:v.currentSrc,frames:v.getVideoPlaybackQuality().totalVideoFrames})')
    assert 12.5 <= info['duration'] <= 13.5, info
    assert info['rate'] == 1, info
    assert info['src'].startswith(BASE + '/media/products/'), info
    assert info['frames'] > 0
    video.evaluate('(v)=>v.pause()')
    return info

def main(home_only=False, output='film-qa/product-landings'):
    ready()
    out=Path(output);out.mkdir(parents=True,exist_ok=True)
    report={'scope':'Actual built site and packaged recordings in Chromium; not production or Safari','pages':[],'playback':[],'gates':{},'errors':[]}
    with sync_playwright() as pw:
        browser=pw.chromium.launch()
        for lang,prefix in [('ja','/'),('en','/en/')]:
            routes=[(prefix,'home')]+([] if home_only else [(prefix+'products/'+id+'/',id) for id in IDS])
            for width,height in [(1440,1000),(1024,900),(390,844)]:
                context=browser.new_context(viewport={'width':width,'height':height})
                for route,id in routes:
                    page=context.new_page();page.set_default_timeout(20000)
                    errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
                    try:
                        page.goto(BASE+route,wait_until='networkidle')
                        healthy(page)
                        if id=='home':
                            assert page.locator('[role=tab]').count()==6
                            assert page.locator('[aria-selected=true]').count()==1
                            image=page.locator('.studio-player-screen>img')
                            assert image.is_visible()
                            assert page.locator('.studio-player video').evaluate('(v)=>v.paused')
                            assert page.locator('.studio-player video').get_attribute('src') is None
                            stage=page.locator('.studio-workbench').bounding_box()
                            assert stage['y'] < height, ('Product selector below first viewport',stage)
                            if width==390:
                                toggle=page.locator('.nav-toggle');toggle.click()
                                assert page.locator('#main-nav').is_visible()
                                page.keyboard.press('Escape')
                                assert toggle.get_attribute('aria-expanded')=='false'
                            if width==1440:
                                first=page.locator('[role=tab]').first;first.focus()
                                page.keyboard.press('ArrowRight')
                                assert page.locator('[aria-selected=true]').get_attribute('data-studio-choice')=='ai-meeting'
                                page.keyboard.press('End')
                                assert page.locator('[aria-selected=true]').get_attribute('data-studio-choice')=='launchloom'
                                page.keyboard.press('Home')
                                for choice in IDS:
                                    page.locator('[data-studio-choice="'+choice+'"]').click()
                                    assert choice in image.get_attribute('src')
                                    assert page.locator('[data-studio-link]').get_attribute('href').endswith('/products/'+choice+'/')
                                first.click()
                        else:
                            assert page.locator('.owned-film__screen>img').is_visible()
                            assert page.locator('.owned-film video').get_attribute('src') is None
                            assert page.locator('.owned-flow li').count()==3
                            assert page.locator('.owned-action-note').inner_text().strip()
                            access=page.locator('.owned-access');access.locator('summary').click()
                            assert access.locator('.owned-requirements').is_visible()
                            access.locator('summary').click()
                            assert page.locator('.owned-boundaries').is_visible()
                            assert page.locator('.studio-related a').count()==3
                        page.evaluate('window.scrollTo(0,0)')
                        shot=out/f'{lang}-{id}-{width}.png'
                        page.screenshot(path=str(shot),full_page=True)
                        report['pages'].append({'route':route,'width':width,'geometry':geometry(page),'screenshot':str(shot)})
                        if width==1440:
                            info=play_recording(page,'.studio-player' if id=='home' else '.owned-film')
                            report['playback'].append({'route':route,**info})
                        assert not errors, errors
                    except Exception as error:
                        report['errors'].append({'route':route,'width':width,'error':str(error)})
                        page.screenshot(path=str(out/f'FAILED-{lang}-{id}-{width}.png'),full_page=True)
                    finally:
                        page.close()
                context.close()
        # All content and navigation survive disabled scripts. No broken play controls.
        for id in ['home','genie','launchloom']:
            context=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
            page=context.new_page()
            try:
                page.goto(BASE+('/' if id=='home' else '/products/'+id+'/'),wait_until='networkidle')
                assert page.locator('h1').is_visible()
                if id=='home':
                    assert page.locator('.studio-picker a').count()==6
                    assert page.locator('.studio-player-screen>img').is_visible()
                    assert page.locator('#main-nav').is_visible()
                    assert not page.locator('.studio-play').is_visible()
                else:
                    assert page.locator('.owned-film__screen>img').is_visible()
                    assert not page.locator('.owned-film__play').is_visible()
                assert not geometry(page)['overflow']
                report['gates']['no_script_'+id]=True
            except Exception as error:
                report['errors'].append({'no_script':id,'error':str(error)})
            finally:
                context.close()
        for id in ['home','launchloom']:
            context=browser.new_context(reduced_motion='reduce',viewport={'width':390,'height':844})
            context.route('**/media/products/*.mp4',lambda route:route.abort())
            page=context.new_page();page.set_default_timeout(20000)
            try:
                page.goto(BASE+('/' if id=='home' else '/products/'+id+'/'),wait_until='networkidle')
                selector='.studio-player' if id=='home' else '.owned-film'
                assert page.locator(selector+' video').evaluate('(v)=>v.paused')
                page.locator(selector+' button').click()
                page.wait_for_function('s=>document.querySelector(s).dataset.mediaState==="unavailable"',arg=selector)
                assert page.locator(selector+' img').is_visible()
                assert page.locator(selector+' button').is_enabled()
                assert page.locator(selector+' a').count()>0
                report['gates']['reduced_motion_and_failed_media_'+id]=True
            except Exception as error:
                report['errors'].append({'failure_test':id,'error':str(error)})
            finally:
                context.close()
        if not home_only:
            desktop=[p for p in report['pages'] if p['width']==1440 and p['route'].startswith('/products/')]
            signatures={json.dumps(p['geometry'],sort_keys=True) for p in desktop}
            assert len(signatures)==6, 'Six distinct product treatments must be measured, not named only'
            report['gates']['six_distinct_product_treatments']=True
        browser.close()
    (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps(report,ensure_ascii=False,indent=2))
    raise SystemExit(bool(report['errors']))

if __name__=='__main__':
    main()
