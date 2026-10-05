"""Acceptance helpers for the real localized home, using the source ledger.

The deployed home is the 2026-10 redesign (src/redesign.mjs): a 15-second reel with native controls, a
seven-row product list, the kept access table and FAQ, and records links for every product. The function names
keep their v4 names so every CI caller runs the same checks against the current page.

These functions drive the unmodified built page. They create no substitute DOM,
responses or product data. Browser execution belongs to the CI callers.
"""
from functools import lru_cache
import json
import re
from pathlib import Path
import subprocess
from urllib.parse import urljoin, urlsplit
from weakref import WeakKeyDictionary

from playwright.sync_api import expect

ROOT = Path(__file__).resolve().parents[1]
REEL = ('/media/films/reachmade-15s.mp4', '/media/films/reachmade-15s.jpg')
AGENT_TEAM_FILM = '/media/films/agent-team-design-30s.mp4'
REEL_VIDEO = '[data-rd-reel] video'
HOME_REQUESTS = WeakKeyDictionary()
HOME_PROGRESS = WeakKeyDictionary()
NATIVE_REJECTIONS = WeakKeyDictionary()
NATIVE_ATTEMPTS = WeakKeyDictionary()
NATIVE_REJECTION_PREFIX = 'reachmade-native-rejection:'
RETIRED_HOME_MODULES = {
    'animated-demos.mjs', 'lab-explorer.mjs', 'lab-signature.mjs', 'outcome-controls.mjs',
}


def home_v4_phase(page, phase):
    callback = HOME_PROGRESS.get(page)
    if callback:
        callback(phase)
    else:
        print(json.dumps({'home_v4_phase': phase, 'url': page.url}), flush=True)


def begin_home_v4_requests(page, *, progress=None):
    """Observe real requests before navigation so eager imports/media cannot escape the check."""
    assert page.url == 'about:blank', 'Register home request observation before navigation'
    assert page not in HOME_REQUESTS, 'Do not reset an existing request history'
    requests = []
    by_request = {}
    HOME_REQUESTS[page] = requests
    HOME_PROGRESS[page] = progress
    NATIVE_REJECTIONS[page] = []
    NATIVE_ATTEMPTS[page] = {}

    def native_rejected(message):
        if message.type == 'error' and message.text.startswith(NATIVE_REJECTION_PREFIX):
            rejection = json.loads(message.text[len(NATIVE_REJECTION_PREFIX):])
            NATIVE_REJECTIONS[page].append(rejection)
            home_v4_phase(page, 'Native play rejected: ' + json.dumps(rejection))

    def requested(request):
        record = {'url': request.url, 'type': request.resource_type,
                  'method': request.method, 'range': request.headers.get('range')}
        requests.append(record)
        by_request[request] = record

    def responded(response):
        record = by_request.get(response.request)
        if record is not None:
            record.update({'status': response.status,
                           'content_length': response.headers.get('content-length'),
                           'content_range': response.headers.get('content-range')})

    def finished(request):
        record = by_request.get(request)
        if record is not None and urlsplit(request.url).path.endswith('.mp4'):
            if record.get('status') is None:
                # WebKit can finish a resource without responseReceived. sizes()
                # waits for that missing response; leave it explicitly unknown.
                record['transfer_unavailable'] = 'requestfinished_without_response'
                return
            home_v4_phase(page, 'Measure completed media transfer: ' + request.url)
            record['transfer'] = request.sizes()

    def failed(request):
        record = by_request.get(request)
        if record is not None:
            record['failure'] = request.failure

    page.on('request', requested)
    page.on('response', responded)
    page.on('requestfinished', finished)
    page.on('requestfailed', failed)
    page.on('console', native_rejected)


def _home_requests(page, *, before_play=True):
    assert page in HOME_REQUESTS, 'The caller must observe requests before navigation'
    requests = HOME_REQUESTS[page]
    retired = [item for item in requests if Path(urlsplit(item['url']).path).name in RETIRED_HOME_MODULES]
    assert not retired, ('Retired home interactions must not be downloaded', retired)
    media = [item for item in requests if urlsplit(item['url']).path.endswith('.mp4')]
    # WebKit reports a completed resource record for each deferred native video:
    # GET/other, status 0, no HTTP media headers, and measured body size 0. Keep
    # those records visible and distinguish them from HTTP responses. This is
    # browser-reported data; Outcome independently checks the real HTTP server.
    # A real HTTP response, any transferred body, missing completion/measurement,
    # or a different request shape must still fail the before-play requirement.
    deferred = [item for item in media if (
        item.get('method') == 'GET' and item.get('type') == 'other'
        and item.get('status') == 0
        and item.get('range') is None and item.get('content_range') is None
        and item.get('content_length') is None
        and item.get('transfer', {}).get('responseBodySize') == 0
        and not item.get('failure')
    )]
    body_sizes = [item.get('transfer', {}).get('responseBodySize') for item in media]
    measured_bytes = sum(body_sizes) if all(isinstance(size, int) and size >= 0 for size in body_sizes) else None
    if before_play:
        assert all(item in deferred for item in media), ('Video bodies must stay unloaded before explicit play; unknown transfers also fail', media)
        assert measured_bytes == 0, ('Before-play video body bytes must be measured as zero', media)
    return {'observed_requests': len(requests), 'retired_module_requests': retired,
            'media_requests': media, 'deferred_media_records': deferred,
            'browser_reported_media_body_bytes': measured_bytes, 'before_play': before_play}


@lru_cache(maxsize=1)
def product_ledger():
    source = "import {products} from './src/products.mjs'; console.log(JSON.stringify(products));"
    products = json.loads(subprocess.check_output(
        ['node', '--input-type=module', '-e', source], cwd=ROOT, text=True))
    assert len(products) == 7 and len({p['id'] for p in products}) == 7
    assert any(p['id'] == 'noa' and p['closedSource'] for p in products)
    return products


def no_overflow(page):
    geometry = page.evaluate('({width:document.documentElement.scrollWidth, viewport:innerWidth})')
    assert geometry['width'] <= geometry['viewport'] + 1, geometry
    return geometry


def _native_video(video):
    assert video.get_attribute('autoplay') is None, 'No video may autoplay'
    assert video.get_attribute('preload') == 'none'
    assert video.get_attribute('controls') is not None, 'Native controls must survive without scripts'
    assert video.evaluate('v=>v.paused'), 'Media must start paused'


def native_playback_report(page):
    """Retain every rejection, distinguishing only proven completed playback."""
    attempts = NATIVE_ATTEMPTS.get(page, {})
    rejections = NATIVE_REJECTIONS.get(page, [])
    completed_aborts, unexpected = [], []
    for rejection in rejections:
        attempt = attempts.get(rejection.get('attempt_id'), {})
        ended_before_rejection = rejection.get('ended_before_rejection') or {}
        start = attempt.get('resume_from', {})
        # Ending playback may reject pending play promises with AbortError:
        # https://html.spec.whatwg.org/multipage/media.html#ended-playback
        # A completed native-state proof for this exact call/source is required;
        # an AbortError alone never excuses a failed or interrupted playback.
        completed = (rejection.get('name') == 'AbortError'
                     and attempt.get('completed_playback')
                     and rejection.get('source') == attempt.get('source')
                     and rejection.get('phase') == attempt.get('phase')
                     and ended_before_rejection.get('source') == attempt.get('source')
                     and ended_before_rejection.get('ended') is True
                     and ended_before_rejection.get('paused') is True
                     and ended_before_rejection.get('error') is None
                     and ended_before_rejection.get('time', 0) > start.get('time', float('inf')) + .25
                     and ended_before_rejection.get('frames', 0) > start.get('frames', float('inf')))
        (completed_aborts if completed else unexpected).append(rejection)
    return {'attempts': list(attempts.values()), 'rejections': list(rejections),
            'completed_playback_aborts': completed_aborts,
            'unexpected_rejections': unexpected}


def wait_native_media(page, expression, *, phase, selector=REEL_VIDEO, arg=None,
                      completed_attempt=None):
    """Keep the native-media assertion, and preserve observable state when it fails."""
    try:
        home_v4_phase(page, 'Wait for ' + phase)
        page.wait_for_function(expression, arg=arg)
        if completed_attempt is not None:
            attempt = NATIVE_ATTEMPTS[page][completed_attempt]
            end = page.locator(selector).evaluate('''v=>({source:v.currentSrc,
              time:v.currentTime,duration:v.duration,ended:v.ended,paused:v.paused,
              frames:v.getVideoPlaybackQuality().totalVideoFrames,error:v.error?.code ?? null})''')
            start, resumed = attempt['resume_from'], attempt['resumed']
            assert resumed['source'] == end['source'] == attempt['source']
            assert resumed['time'] > start['time'] + .25 and resumed['frames'] > start['frames']
            assert resumed['error'] is None and end['error'] is None
            assert end['ended'] and end['paused'] and abs(end['time'] - end['duration']) < .1
            attempt['completed_playback'] = end
        unexpected = native_playback_report(page)['unexpected_rejections']
        assert not unexpected, unexpected
    except Exception as exc:
        state = page.locator(selector).evaluate('''v=>({
          source:v.currentSrc, time:v.currentTime, duration:v.duration,
          paused:v.paused, ended:v.ended, seeking:v.seeking, ready:v.readyState,
          network:v.networkState, error:v.error?.code ?? null,
          seekable:Array.from({length:v.seekable.length},(_,i)=>[v.seekable.start(i),v.seekable.end(i)]),
          buffered:Array.from({length:v.buffered.length},(_,i)=>[v.buffered.start(i),v.buffered.end(i)]),
          frame:document.querySelector('[data-rd-reel]')?.className ?? null
        })''')
        raise AssertionError(f'{phase}: {exc}; media={state}; play_rejections={NATIVE_REJECTIONS.get(page, [])}') from exc


def start_native_media(page, video, *, phase):
    """Start the real player without waiting indefinitely for its play promise."""
    home_v4_phase(page, phase)
    attempts = NATIVE_ATTEMPTS[page]
    attempt_id = len(attempts) + 1
    attempt = {'attempt_id': attempt_id, 'phase': phase}
    attempts[attempt_id] = attempt
    attempt['source'] = video.evaluate('''(v, args)=>{
      const source=v.currentSrc || v.querySelector('source')?.src || v.src;
      const snapshot=()=>({source:v.currentSrc,time:v.currentTime,duration:v.duration,
        ended:v.ended,paused:v.paused,frames:v.getVideoPlaybackQuality().totalVideoFrames,
        error:v.error?.code ?? null});
      let endedBeforeRejection=null;
      const onEnded=()=>{if(v.currentSrc===source) endedBeforeRejection=snapshot();};
      v.addEventListener('ended',onEnded);
      v.play().then(()=>v.removeEventListener('ended',onEnded), error=>{
        const atRejection=snapshot();
        v.removeEventListener('ended',onEnded);
        console.error(args.prefix+JSON.stringify({
          attempt_id:args.attemptId,phase:args.phase,name:error.name,message:error.message,source,
          at_rejection:atRejection,
          ended_before_rejection:endedBeforeRejection ||
            (atRejection.source===source && atRejection.ended ? atRejection : null)
        }));
      });
      return source;
    }''', {'attemptId': attempt_id, 'prefix': NATIVE_REJECTION_PREFIX, 'phase': phase})
    return attempt_id


def assert_home_v4(page, *, interactive=True):
    """Check seven real products, a truthfully labelled reel, routes to evidence, and no-JS access."""
    products = product_ledger()
    home_v4_phase(page, 'Check localized home contract' if interactive else 'Check no-script home contract')
    lang = page.locator('html').get_attribute('lang')
    assert lang in ['ja', 'en'], lang
    prefix = '/en' if lang == 'en' else ''
    expect(page.locator('body[data-rd]')).to_be_attached()
    assert page.locator('h1').count() == 1
    assert page.locator('a.rd-row').count() == len(products)
    for video in page.locator('video').all():
        _native_video(video)
    assert page.locator('video').count() == 1, 'Only the reel is a video on the home'
    expect(page.locator(f'.rd-hero a[href="{prefix}/contact/"]')).to_be_visible()
    expect(page.locator('.rd-hero a[href="#products"]')).to_be_visible()
    for anchor in ['#products', '#access', '#faq', '#services', '#principles', '#contact']:
        expect(page.locator(anchor)).to_be_attached()
    assert page.locator('#products').evaluate("e=>Boolean(e.compareDocumentPosition(document.querySelector('#services')) & Node.DOCUMENT_POSITION_FOLLOWING)")
    # The reel: the actual packaged film and poster, labelled as staged motion graphics with sound.
    reel = page.locator(REEL_VIDEO)
    assert reel.locator('source').get_attribute('src') == REEL[0]
    assert reel.get_attribute('poster') == REEL[1]
    for asset in REEL:
        assert (ROOT / 'dist' / asset.lstrip('/')).is_file(), asset
    caption = page.locator('[data-rd-reel] .rd-reel-cap').text_content()
    assert re.search('演出を含む|staging', caption), caption
    assert re.search('音声あり|with sound', caption), caption
    assert not re.search('無音|silent|実録画|recording', caption, re.I), caption
    checked = []
    for p in products:
        identifier, t = p['id'], p[lang]
        row = page.locator(f'a.rd-row[href="{prefix}/products/{identifier}/"]')
        assert row.count() == 1, identifier
        assert (ROOT / 'dist' / prefix.lstrip('/') / 'products' / identifier / 'index.html').is_file()
        text = row.text_content()
        for fact in ['headline', 'outcome', 'status']:
            assert t[fact] in text, (identifier, fact)
        preview = row.get_attribute('data-rd-preview')
        # Agent Team uses a labelled frame of its design film (src/redesign.mjs STILLS); the others their preview.
        if identifier == 'agent-team':
            assert preview == '/assets/products/agent-team/film-still.jpg', preview
            assert re.search('設計動画|design film', row.get_attribute('data-rd-label')), identifier
        else:
            assert preview == p['preview'], identifier
            assert t['previewLabel'] in row.get_attribute('data-rd-label'), identifier
        assert (ROOT / 'dist' / preview.lstrip('/')).is_file(), identifier
        expect(page.locator(f'.rd-records a[href="{prefix}/work/#{identifier}"]')).to_be_attached()
        if identifier == 'agent-team':
            assert row.get_attribute('data-rd-film') == AGENT_TEAM_FILM
            assert (ROOT / 'dist' / AGENT_TEAM_FILM.lstrip('/')).is_file()
            assert re.search('設計動画|Design film', row.get_attribute('data-rd-film-label')), 'The owner film is a design film'
        else:
            assert row.get_attribute('data-rd-film') is None, identifier
        checked.append({'id': identifier, 'preview': preview})

    if not interactive:
        # Without script nothing is hidden for motion, and the header links remain usable.
        assert page.locator('[data-rd-hidden]').count() == 0
        expect(page.locator('[data-rd-clock]')).to_be_hidden()
        expect(page.locator('#main-nav')).to_be_visible()
        expect(reel).to_be_visible()
        expect(page.locator('#access details summary')).to_be_visible()
        return {'products': checked, 'javascript': False, 'native_reel': True,
                'network': _home_requests(page), 'geometry': no_overflow(page)}

    expect(page.locator('html.js')).to_be_attached()
    for selector in ['.rd-hero .rd-btn', 'a.rd-row']:
        for control in page.locator(selector).all():
            assert control.bounding_box()['height'] >= 44, selector
    network = _home_requests(page)
    toggle = page.locator('.nav-toggle')
    if toggle.is_visible():
        toggle.click()
        expect(toggle).to_have_attribute('aria-expanded', 'true')
        expect(page.locator('#main-nav')).to_be_visible()
        page.keyboard.press('Escape')
        expect(toggle).to_have_attribute('aria-expanded', 'false')
        expect(toggle).to_be_focused()
    return {'products': checked, 'javascript': True, 'menu': True,
            'network': network, 'geometry': no_overflow(page)}


def playback_home_v4(page):
    """Play the actual packaged reel natively, then pause, seek, resume and reach its end."""
    expect(page.locator('html.js')).to_be_attached()
    initial_requests = _home_requests(page)
    video = page.locator(REEL_VIDEO)
    video.scroll_into_view_if_needed()
    start_native_media(page, video, phase='Reel: explicit playback')
    wait_native_media(page, f'()=>{{const v=document.querySelector("{REEL_VIDEO}");return !v.paused && v.currentTime>.25 && v.readyState>=2}}', phase='Reel: explicit playback')
    info = video.evaluate('v=>({duration:v.duration,rate:v.playbackRate,src:v.currentSrc,frames:v.getVideoPlaybackQuality().totalVideoFrames,controls:v.controls})')
    assert 14.5 <= info['duration'] <= 15.5 and info['rate'] == 1, info
    assert info['frames'] > 0 and info['controls'], info
    assert info['src'] == urljoin(page.url, REEL[0]), info
    video.evaluate('v=>v.pause()')
    assert video.evaluate('v=>v.paused')
    video.evaluate('v=>{v.currentTime=Math.min(3,v.duration/2)}')
    wait_native_media(page, f'()=>{{const v=document.querySelector("{REEL_VIDEO}");return !v.seeking && v.currentTime>=2.9 && v.readyState>=2}}', phase='Reel: paused native seek')
    video.evaluate('v=>{v.currentTime=v.duration-2}')
    wait_native_media(page, f'()=>{{const v=document.querySelector("{REEL_VIDEO}");return v.paused && !v.seeking && v.readyState>=2 && Math.abs(v.currentTime-(v.duration-2))<.1}}', phase='Reel: paused seek near end')
    resume_from = video.evaluate('v=>({time:v.currentTime,frames:v.getVideoPlaybackQuality().totalVideoFrames})')
    attempt_id = start_native_media(page, video, phase='Reel: resume near end')
    wait_native_media(page, f'(start)=>{{const v=document.querySelector("{REEL_VIDEO}");return !v.paused && !v.seeking && v.readyState>=2 && v.currentTime>start.time+.25 && v.getVideoPlaybackQuality().totalVideoFrames>start.frames}}', phase='Reel: resumed time and decoded frames advance', arg=resume_from)
    resumed = video.evaluate('v=>({source:v.currentSrc,time:v.currentTime,frames:v.getVideoPlaybackQuality().totalVideoFrames,error:v.error?.code ?? null})')
    NATIVE_ATTEMPTS[page][attempt_id].update({'resume_from': resume_from, 'resumed': resumed})
    wait_native_media(page, f'()=>document.querySelector("{REEL_VIDEO}").ended', phase='Reel: native end after seek', completed_attempt=attempt_id)
    # A finished reel never starts another film by itself.
    page.wait_for_timeout(500)
    assert page.locator('video').evaluate_all('vs=>vs.every(v=>v.paused)')
    return {'films': [{'id': 'reel', **info, 'pause_seek_end': True, 'resume_from': resume_from, 'resumed': resumed}],
            'before_play_network': initial_requests, 'network': _home_requests(page, before_play=False),
            'native_playback': native_playback_report(page)}


def failure_home_v4(page):
    """Caller aborts actual local MP4 requests; the reel fails visibly, can be retried, and the page stays usable."""
    initial_requests = _home_requests(page)
    video = page.locator(REEL_VIDEO)
    video.scroll_into_view_if_needed()
    source = urljoin(page.url, REEL[0])
    for attempt in range(2):
        with page.expect_request(lambda request: request.url == source):
            video.evaluate('v=>{v.load();v.play().catch(()=>{})}')
        page.wait_for_function(f'()=>{{const v=document.querySelector("{REEL_VIDEO}");return v.networkState===3 || v.error!==null}}')
        # A failed source never plays: nothing is decoded and the position stays at the start.
        state = video.evaluate('v=>({ready:v.readyState,time:v.currentTime,network:v.networkState,error:v.error?.code ?? null})')
        assert state['ready'] == 0 and state['time'] == 0, (attempt, state)
        expect(video).to_be_visible()
        expect(page.locator('[data-rd-reel] .rd-reel-cap')).to_be_visible()
    # A failed film must not trap navigation or remove the real product links.
    prefix = '/en' if page.locator('html').get_attribute('lang') == 'en' else ''
    expect(page.locator(f'a.rd-row[href="{prefix}/products/oathra/"]')).to_be_visible()
    return {'network_aborted': True, 'same_source_retry': True, 'links_remain': True, 'source': source,
            'before_play_network': initial_requests, 'network': _home_requests(page, before_play=False)}
