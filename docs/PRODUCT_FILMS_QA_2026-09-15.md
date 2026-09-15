# Product films: verification on 2026-09-15

## Source run

GitHub Actions run: https://github.com/FORIFOR/reachmade/actions/runs/34972948491

Job: 104393437734. Tested commit: `880990678b63a35c318cf0ed82478d045ff0090a`.

This report is transcribed from that job's decoded logs. The source allowlist and player are the implementation merged in PR #1 (`d061c558fea60e268aa050de78689f08e7710022`).

## Results

- `npm run check`: **74 tests passed; 0 failed**, including the 12 new media/player boundary tests.
- `python scripts/verify-product-films.py`: **success**, with `errors: []`.
- All six exact upstream recording URLs returned HTTP 200, `video/mp4`, with no redirect. FFprobe identified a video stream; FFmpeg decoded a sample frame from every file.
- On the actual locally built product-directory page in Chromium, all six videos reached readyState 4, decoded frames, and advanced beyond the configured preview start. At most one inline preview played at a time.
- The actual Japanese/English home and product-directory pages each rendered six players at both 1440px and 390px viewport widths. No horizontal page overflow was detected. With reduced motion enabled, no preview media request was initiated.

| Product | Source resolution | Source duration | File bytes | Observed playback time | Decoded frames at observation |
| --- | --- | ---: | ---: | ---: | ---: |
| Genie | 1920 × 1080 | 33.00 s | 2,549,408 | 0.326318 s | 14 |
| AI Meeting | 1280 × 720 | 45.09 s | 6,092,417 | 4.320640 s | 134 |
| Oathra | 1920 × 1080 | 62.70 s | 6,123,820 | 6.324262 s | 194 |
| AI Secure | 1920 × 1080 | 35.40 s | 6,576,358 | 0.317446 s | 14 |
| Agent Team | 1280 × 800 | 32.00 s | 1,957,597 | 5.317123 s | 164 |
| Launchloom | 1280 × 720 | 27.00 s | 728,094 | 3.321545 s | 84 |

All source video codecs were H.264. A playback-start check is not a complete frame-by-frame or end-to-end viewing-quality review.

## Screenshot archival failure is separate from playback

The job's final `actions/upload-artifact@v4` step failed with: `Artifact storage quota has been hit`. Consequently the overall workflow run is marked failure, even though both the test suite and the actual media/browser test step succeeded. No billing changes or deletion of existing artifacts were performed.

The workflow now writes its result JSON to the job summary and makes optional screenshot archival dependent on `REACHMADE_QA_UPLOAD_ARTIFACTS=true`. Actual test failures remain blocking. Screenshots from the first run could not be retrieved for visual review through the artifact service.

## What is not established

- This is verification of actual recordings on **locally built pages inside the GitHub runner**, not of Cloudflare production delivery.
- Cloudflare's video proxy has unit tests, but live Worker deployment, Range delivery and production browser playback still need verification after deployment.
- Safari/iPhone playback, full-film completion, perceptual video quality and all detailed accessibility behavior were not established by this test.
- Existing recordings were reused. There was no new app recording, upscaling or replacement of product application interfaces.
- The independent product landing pages were not modified; this change covers the Reachmade hub's Japanese/English home and product directory.
- The public Reachmade home and directory still lacked the new player elements when rechecked after merging. The Cloudflare dashboard was logged out in the available browser session, so manual deployment was not performed.
