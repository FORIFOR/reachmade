# Reachmade Premium Product Films

These are website films, not ads and not concept renders. Every visible product frame comes from an existing real product recording. The edit may remove waiting time with chronological hard cuts, but **must not speed up model/runtime behavior**, synthesize a successful outcome, or imply external completion that the product did not prove.

## Shared master

- 1280 × 720, H.264, 30 fps, yuv420p, faststart
- silent website master
- warm-black letterbox `#171A17` when the source is not 16:9
- two chronological sections from the already-reviewed preview window
- no zoom effect, artificial cursor, glow, particles, 3D, fake notifications or generated UI
- 0.35 s first-frame hold and 0.55 s final-frame hold for visual comprehension
- hard cut only; no transition that could imply continuity
- playback speed remains 1×
- generated poster comes from the same edited film

The website itself provides product name, disclosure and controls. The video therefore stays almost entirely product.

## 01 — Genie

**Story:** request → usable artifact.

Use the current real-app recording only. The first section establishes the request/work surface; the second section shows the later state within the same previously reviewed preview window. Do not imply that the shortened middle is actual model latency.

Disclosure: `実アプリ録画のサイト用編集版。2区間を時系列のままつなぎ、再生速度は変えていません。`

## 02 — AI Meeting

**Story:** conversation → task that remains after the meeting.

The source uses synthetic Japanese input and real AI responses. Keep that disclosure. The film must not imply unrestricted voice availability or that every meeting platform is automatically joined.

Disclosure: `合成した日本語入力と実際のAI応答による録画の編集版。再生速度は変えていません。`

## 03 — Oathra

**Story:** conversation → evidence available for a decision.

The source is the simulator. The film can demonstrate evidence/verification behavior but must never present spoken confirmation as proof that a reservation was entered into a restaurant's actual booking system.

Disclosure: `シミュレーター実録画の編集版。実電話や店舗システムへの登録完了を示すものではありません。`

## 04 — AI Secure

**Story:** signal → investigation context.

The source uses synthetic data. Show the investigation UI, not a fake attack being stopped in production. No claim of live monitoring or blocking.

Disclosure: `合成データによる実画面録画の編集版。実環境の監視・遮断は行いません。`

## 05 — Agent Team

**Story:** brief → reviewed artifact.

Use the actual model-run replay. Preserve the limitation that the source run took about 24 minutes and ended partially complete with source verification still unfinished. The short website cut is not a latency benchmark.

Disclosure: `実モデル実行の録画を短く編集。元の実行は約24分で、出典照合を残して部分完了です。`

## 06 — Launchloom

**Story:** recording → launch material.

Use the film already produced from real footage. Re-editing for the website may tighten it, but must not be presented as a live external-social-publishing demo.

Disclosure: `実録画からLaunchloomで作成した映像をサイト用に再編集。外部SNSへの投稿実演ではありません。`

## Release gate

A film ships only if all six outputs:

1. decode as one H.264 video stream with no audio stream;
2. are exactly 1280 × 720;
3. run roughly 13 seconds;
4. have a poster generated from the same edit;
5. support HEAD, byte-range playback, pause, seek and modal playback through the real Worker;
6. retain the source SHA-256 and chronological clip list in `manifest.json`;
7. pass the Horio Premium 1440 / 1024 / 390 browser checks.

`npm run media:prepare` is intentionally a release step. If a source recording or ffmpeg render fails, deployment stops instead of publishing a missing or silently substituted film.
