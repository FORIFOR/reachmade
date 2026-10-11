# Oathra bilingual introduction films

The localized Oathra pages include a 24-second illustrative introduction at
`/products/oathra/#experience-film` and `/en/products/oathra/#experience-film`.
Each page has its own narration/captions, a language link, native playback,
an accessible transcript and a direct MP4 fallback. Existing simulation demos
and recordings remain available. Films do not play or load automatically
(`preload="none"`); metadata loads after the user starts playback.

Published assets are only the final `oathra-voiced-{ja,en}-v3.mp4`, matching
`-poster.jpg`, and compact credits. See [public credits](../public/media/films/oathra-voiced-v3-credits.txt)
and [hash manifest](../public/media/films/manifest.json). Do not publish raw stock,
the source ZIP, model weights, local runtime, credentials or Library metadata.
The films are copied without re-encoding; earlier films and the three 50-second
operated simulations are unchanged.

The film illustrates a possible experience, not a real call, booking or customer
testimonial. Result management refers to reviewing results within an AI
conversation. It does not establish pricing, success rates, calendar/reminder
integration or production availability. Service information remains the source
for features and conditions. Kokoro model/software are Apache-2.0; that is not
a license for the entire film or stock footage.

## Validation and release

Run `npm run check`; `node scripts/verify-oathra-intro.mjs` uses an installed
Chrome to inspect JA/EN links, 320/390/768/1440px layouts, no-script content,
full manual playback and no automatic playback. Set `INTRO_QA_ORIGIN` to the
returned hosted preview URL to also verify seeking through the Worker Range path. Evidence goes to
`artifacts/ui/oathra-intro/`. The repository UI capture/review gate also applies.
Run `npm run media:prepare` after the last build, before creating a Cloudflare
version preview, to retain the site's other packaged recordings.

The existing Worker Range/HEAD path serves both MP4 files. Verify anonymous
GET, MIME, byte range and SHA-256 on the returned version-preview URL before
promoting that exact version through the existing release procedure. A draft PR
or a successful build is not a production deployment. Do not alter authentication,
permissions, headers or unrelated deployments to publish these films.

Source QA reports 24 seconds, 600 frames, 1920×1080 at 25 fps, H.264/AAC,
full audio/video decoding and browser playback. These are technical checks.
**Auditory naturalness, pronunciation, accent and perceived synchronization are
unverified:** the review model cannot receive audio input. Do not describe the
narration as listened to or human-approved. The owner authorized publication
after this limitation was explained. Physical Safari/iPhone and VoiceOver
remain outside the browser checks.
