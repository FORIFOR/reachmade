"""Acceptance helpers for the real localized v4 home, using the source ledger.

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
HOME_FILMS = {
    'oathra': ('/media/films/home-oathra-13s.mp4', 'イメージ映像（演出を含む）'),
    'agent-team': ('/media/films/home-agent-team-13s.mp4', '設計動画（画面は再現・未実装を含む）'),
}
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


def wait_native_media(page, expression, *, phase, selector='.v4-reel-video', arg=None,
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
          frame:document.querySelector('[data-v4-reel]')?.className ?? null,
          status:document.querySelector('[data-v4-reel-tag]')?.textContent ?? null
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


def _selected(page, choice):
    expect(choice).to_have_attribute('aria-selected', 'true')
    assert page.locator('[data-v4-choice][aria-selected="true"]').count() == 1
    expect(page.locator('[data-v4-reel-name]')).to_have_text(choice.get_attribute('data-name'))
    expect(page.locator('[data-v4-reel-proof]')).to_have_text(choice.get_attribute('data-proof'))
    expect(page.locator('[data-v4-reel-proof]')).to_be_visible()
    expect(page.locator('[data-v4-reel-tag]')).to_contain_text(choice.get_attribute('data-kind'))
    panel_id = choice.get_attribute('aria-controls')
    assert panel_id, 'Every tab identifies the actual media panel'
    expect(page.locator('#' + panel_id)).to_have_attribute('aria-labelledby', choice.get_attribute('id'))
    expect(page.locator('.v4-reel-video')).to_have_attribute('poster', choice.get_attribute('data-poster'))
    assert page.locator('.v4-reel-video').evaluate('v=>v.paused')


def assert_home_v4(page, *, interactive=True):
    """Check seven real products, truthful footage, manual selection and no-JS access."""
    products = product_ledger()
    home_v4_phase(page, 'Check localized home contract' if interactive else 'Check no-script home contract')
    lang = page.locator('html').get_attribute('lang')
    assert lang in ['ja', 'en'], lang
    prefix = '/en' if lang == 'en' else ''
    expect(page.locator('[data-home-v4-root]')).to_be_visible()
    assert page.locator('h1').count() == 1
    assert page.locator('[data-v4-chapter]').count() == len(products)
    assert page.locator('[data-v4-choice]').count() == len(products)
    assert page.locator('[data-v4-stage]').count() == 0
    for video in page.locator('video').all():
        _native_video(video)
    expect(page.locator(f'.v4-hero a[href="{prefix}/contact/"]')).to_be_visible()
    expect(page.locator('.v4-hero a[href="#products"]')).to_be_visible()
    assert page.locator('#services').evaluate("e=>Boolean(e.compareDocumentPosition(document.querySelector('#products')) & Node.DOCUMENT_POSITION_FOLLOWING)")
    checked = []
    for p in products:
        identifier = p['id']
        card = page.locator(f'[data-v4-chapter="{identifier}"]')
        choice = page.locator(f'[data-v4-choice][data-studio-choice="{identifier}"]')
        source = HOME_FILMS.get(identifier, (f'/media/products/{identifier}.mp4', None))[0]
        poster = source.replace('.mp4', '.jpg')
        assert (ROOT / 'dist' / source.lstrip('/')).is_file(), source
        assert (ROOT / 'dist' / poster.lstrip('/')).is_file(), poster
        assert (ROOT / 'dist' / prefix.lstrip('/') / 'products' / identifier / 'index.html').is_file()
        assert choice.get_attribute('href') == '#' + identifier
        for attr in ['data-src', 'data-v4-rec']:
            assert choice.get_attribute(attr) == source, (identifier, attr)
        assert choice.get_attribute('data-poster') == poster
        assert card.locator('video source').get_attribute('src') == source
        assert card.locator('video').get_attribute('poster') == poster
        assert card.locator(f'a[href="{prefix}/products/{identifier}/"]').count() >= 1
        text = card.text_content()
        for fact in ['headline', 'outcome', 'status', 'scope', 'license', 'proof']:
            assert p[lang][fact] in text, (identifier, fact)
        proof = card.locator('figcaption .v4-proof').text_content()
        assert choice.get_attribute('data-proof') == proof, identifier
        if identifier in HOME_FILMS:
            if lang == 'ja':
                assert choice.get_attribute('data-kind') == HOME_FILMS[identifier][1]
                assert '録画ではありません' in proof
                assert '実録画' not in card.locator('figure').text_content()
            else:
                assert re.search(r'concept|illustrat|design', choice.get_attribute('data-kind'), re.I)
                assert re.search(r'not (?:a |an )?(?:recording|real|actual)', proof, re.I), proof
            assert proof != p[lang]['proof'], 'Film provenance and separate product evidence must not be conflated'
        else:
            assert proof == p[lang]['proof'], identifier
        if identifier == 'noa':
            assert re.search('紹介映像|introduction film', choice.get_attribute('data-kind'), re.I)
            assert card.locator(f'a[href="{p["demo"]}"]').count() == 1
            anchor = f'{prefix}/products/noa/#' + ('watch' if lang == 'ja' else 'start')
            assert card.locator(f'a[href="{anchor}"]').count() == 1
        elif identifier == 'launchloom':
            assert 'Launchloom' in choice.get_attribute('data-kind')
            assert re.search('紹介映像|film', choice.get_attribute('data-kind'), re.I)
        checked.append({'id': identifier, 'source': source, 'poster': poster, 'proof': proof})

    if not interactive:
        # Native disclosures and product links are the working no-script interface.
        expect(page.locator('[data-v4-reel-start]')).to_be_hidden()
        expect(page.locator('.v4-reel-video')).to_be_visible()
        for p in products:
            scope = page.locator(f'[data-v4-chapter="{p["id"]}"] details')
            scope.locator('summary').click()
            expect(scope.locator('video')).to_be_visible()
            expect(scope.locator('.v4-proof')).to_be_visible()
            assert scope.locator('video').evaluate('v=>v.controls && v.paused')
            scope.locator('summary').click()
        return {'products': checked, 'javascript': False, 'native_disclosures': True,
                'network': _home_requests(page), 'geometry': no_overflow(page)}

    expect(page.locator('[data-v4-reel]')).to_have_class(re.compile(r'\bis-enhanced\b'))
    choices = page.locator('[data-v4-choice]')
    assert page.locator('[data-v4-choice][role="tab"]').count() == len(products)
    for choice in choices.all():
        assert choice.bounding_box()['height'] >= 44
        choice.click()
        _selected(page, choice)
        assert page.locator('.v4-reel-video').get_attribute('src') is None, 'Selecting a still must not load a video'
    # The previous player advanced every 4.2 seconds. Observe beyond that interval
    # on the desktop case; narrow cases retain the same static-state assertions.
    last = choices.last
    if page.viewport_size['width'] == 1440:
        page.wait_for_timeout(4500)
        _selected(page, last)
    for index in [2, 0, 1]:
        choices.nth(index).click()
    _selected(page, choices.nth(1))
    first = choices.first
    first.focus()
    for key, target in [('End', choices.last), ('ArrowRight', first), ('ArrowLeft', choices.last), ('Home', first), (' ', first)]:
        page.keyboard.press(key)
        _selected(page, target)
        expect(target).to_be_focused()
    outline = first.evaluate('e=>({style:getComputedStyle(e).outlineStyle,width:parseFloat(getComputedStyle(e).outlineWidth)})')
    assert outline['style'] != 'none' and outline['width'] > 0, outline
    page.keyboard.press('Tab')
    expect(page.locator('[data-v4-reel-start]')).to_be_focused()
    page.emulate_media(reduced_motion='no-preference')
    _selected(page, first)
    page.emulate_media(reduced_motion='reduce')
    _selected(page, first)
    for selector in ['.v4-hero a', '[data-v4-reel-start]', '.v4-scope>summary']:
        for control in page.locator(selector).all():
            assert control.bounding_box()['height'] >= 44, selector
    return {'products': checked, 'javascript': True, 'manual_selection': True, 'keyboard': True,
            'motion_preference_change': True, 'network': _home_requests(page), 'geometry': no_overflow(page)}


def playback_home_v4(page):
    """Play each actual packaged film, then verify native pause/seek and scope closing."""
    expect(page.locator('[data-v4-reel]')).to_have_class(re.compile(r'\bis-enhanced\b'))
    initial_requests = _home_requests(page)
    video = page.locator('.v4-reel-video')
    results = []
    for choice in page.locator('[data-v4-choice]').all():
        home_v4_phase(page, 'Select and play ' + choice.get_attribute('data-src'))
        choice.click()
        _selected(page, choice)
        source = choice.get_attribute('data-src')
        page.locator('[data-v4-reel-start]').click()
        wait_native_media(page, '()=>{const v=document.querySelector(".v4-reel-video");return !v.paused && v.currentTime>.25 && v.readyState>=2}', phase=source + ': explicit playback')
        info = video.evaluate('v=>({duration:v.duration,rate:v.playbackRate,src:v.currentSrc,frames:v.getVideoPlaybackQuality().totalVideoFrames,controls:v.controls})')
        assert 12.5 <= info['duration'] <= 13.5 and info['rate'] == 1, info
        assert info['frames'] > 0 and info['controls'], info
        assert info['src'] == urljoin(page.url, source), info
        video.evaluate('v=>v.pause()')
        assert video.evaluate('v=>v.paused')
        video.evaluate('v=>{v.currentTime=Math.min(3,v.duration/2)}')
        wait_native_media(page, '()=>{const v=document.querySelector(".v4-reel-video");return !v.seeking && v.currentTime>=2.9 && v.readyState>=2}', phase=source + ': paused native seek')
        # Finish seeking while paused, then measure real resumed frames before
        # testing native end; a seek to the final frame alone is insufficient.
        video.evaluate('v=>{v.currentTime=v.duration-2}')
        wait_native_media(page, '()=>{const v=document.querySelector(".v4-reel-video");return v.paused && !v.seeking && v.readyState>=2 && Math.abs(v.currentTime-(v.duration-2))<.1}', phase=source + ': paused seek near end')
        resume_from = video.evaluate('v=>({time:v.currentTime,frames:v.getVideoPlaybackQuality().totalVideoFrames})')
        attempt_id = start_native_media(page, video, phase=source + ': resume near end')
        wait_native_media(page, '(start)=>{const v=document.querySelector(".v4-reel-video");return !v.paused && !v.seeking && v.readyState>=2 && v.currentTime>start.time+.25 && v.getVideoPlaybackQuality().totalVideoFrames>start.frames}', phase=source + ': resumed time and decoded frames advance', arg=resume_from)
        resumed = video.evaluate('v=>({source:v.currentSrc,time:v.currentTime,frames:v.getVideoPlaybackQuality().totalVideoFrames,error:v.error?.code ?? null})')
        NATIVE_ATTEMPTS[page][attempt_id].update({'resume_from': resume_from, 'resumed': resumed})
        wait_native_media(page, '()=>document.querySelector(".v4-reel-video").ended', phase=source + ': native end after seek', completed_attempt=attempt_id)
        page.wait_for_timeout(200)
        _selected(page, choice)
        results.append({'id': choice.get_attribute('data-studio-choice'), **info, 'pause_seek_end': True,
                        'resume_from': resume_from, 'resumed': resumed})
    scope = page.locator('[data-v4-chapter="ai-meeting"] details')
    scope.locator('summary').click()
    inline = scope.locator('video')
    start_native_media(page, inline, phase='AI Meeting: start inline playback')
    wait_native_media(page, '()=>document.querySelector("[data-v4-chapter=ai-meeting] video").currentTime>.25', phase='AI Meeting: inline playback', selector='[data-v4-chapter="ai-meeting"] video')
    scope.locator('summary').click()
    expect(scope).not_to_have_attribute('open', '')
    wait_native_media(page, '()=>document.querySelector("[data-v4-chapter=ai-meeting] video").paused', phase='AI Meeting: closing disclosure pauses playback', selector='[data-v4-chapter="ai-meeting"] video')
    return {'films': results, 'closing_scope_pauses': True, 'before_play_network': initial_requests,
            'network': _home_requests(page, before_play=False), 'native_playback': native_playback_report(page)}


def failure_home_v4(page):
    """Caller aborts actual local MP4 requests; verify real failure and repeat request."""
    choice = page.locator('[data-v4-choice][data-studio-choice="oathra"]')
    expect(page.locator('[data-v4-reel]')).to_have_class(re.compile(r'\bis-enhanced\b'))
    initial_requests = _home_requests(page)
    choice.click()
    source = urljoin(page.url, choice.get_attribute('data-src'))
    button = page.locator('[data-v4-reel-start]')
    for _ in range(2):
        with page.expect_request(lambda request: request.url == source):
            button.click()
        expect(page.locator('[data-v4-reel-tag]')).to_contain_text(re.compile('映像を読み込めませんでした|could not|couldn.t|unable|failed', re.I))
        expect(button).to_be_visible()
        expect(button).to_be_enabled()
        expect(page.locator('[data-v4-still="oathra"]')).to_be_visible()
        expect(page.locator('[data-v4-reel-proof]')).to_have_text(choice.get_attribute('data-proof'))
        assert page.locator('.v4-reel-video').evaluate('v=>v.paused')
    # A failed request must not trap navigation or remove the real product link.
    page.locator('[data-v4-choice][data-studio-choice="noa"]').click()
    _selected(page, page.locator('[data-v4-choice][data-studio-choice="noa"]'))
    prefix = '/en' if page.locator('html').get_attribute('lang') == 'en' else ''
    expect(page.locator(f'[data-v4-chapter="oathra"] a[href="{prefix}/products/oathra/"]').first).to_be_visible()
    return {'network_aborted': True, 'same_source_retry': True, 'selection_recovers': True, 'source': source,
            'before_play_network': initial_requests, 'network': _home_requests(page, before_play=False)}
