# Product-specific first views — phase 2

Scope: Reachmade-owned `/products/{id}/` and `/en/products/{id}/`, plus the active homepage's outcome-led copy. The independent product websites, application interfaces, existing recordings, production domain and deployment configuration are unchanged.

## Six visual directions

| Product | Composition | What it communicates |
| --- | --- | --- |
| Genie | Workspace spread: copy beside a paper-framed recording and note-to-artifact index | Start with a request, keep an artifact |
| AI Meeting | Dark listening room: a labelled usage example and a wide real recording | Conversation, review, task change |
| Oathra | Recording next to an evidence ledger | Trace a result to the other party's words |
| AI Secure | Separate preflight and investigation routes; labelled investigation recording | Do not confuse prevention guidance with synthetic-log investigation |
| Agent Team / Multibot | Editorial handoff: recording beside a clearly labelled role guide | See the artifact, then follow draft/review/revision |
| Launchloom | Screening room with a four-format output index | One recording can be adapted into different launch materials |

Guides, example phrases and output-format indexes are labelled. They are not presented as live execution or newly generated results. No fake success metrics, customer logos, calls, completed bookings, agent activity or security guarantees were added.

## Active rendering, not unused CSS

`writeShowcase` runs after the base product generator. `refineProductPage` now calls `artDirectProductHero`, which replaces only the known hero structure and preserves the existing recording figure byte-for-byte. Unknown products/locales and changed template boundaries fail closed. Native player hooks, poster, source recording, caveats, primary CTA, click expectations, setup conditions, lower-page evidence and SEO remain intact.

The canonical base stylesheet and the new scoped art-direction stylesheet are concatenated into one delivered `showcase.css`. Repeated builds produce identical styles rather than stacking appended rules. Client JavaScript is unchanged: no autoplay, telemetry, storage, new permissions or third-party APIs.

## Accessibility and responsive behavior

Four target widths: 1440, 1024, 390 and 320px. Mobile uses one-column or purpose-specific ordered compositions rather than compressed desktop panels. Source links remain accessible, primary targets are at least 44px tall, headings remain readable, and reduced-motion / forced-colors modes are supported. A grid-area inheritance overlap found in the local review was fixed by resetting the access-row children.

## Validation scope

Before the phase-2 branch update, isolated local validation passed:

- 19 unit tests against the new renderer/styles.
- 31 tests when the 12 integration assertions were run against generated isolated page fixtures.
- 48 Chromium layout cases: six products x two languages x four widths.
- 12 JavaScript-disabled cases and 12 deliberately failed-media recovery cases.

These local checks used labelled image stand-ins and a reduced shared-style harness because the editing container could not navigate to URLs or retrieve the full private repository. They do not constitute full-repository, real-image, production, Safari or real-device acceptance.

`Product art direction` CI runs `npm run check` against the actual checkout, then the browser suite against real built HTML, full styles and existing local product posters. It preserves screenshots and `report.json`. Existing media workflows retain responsibility for actual packaged-video playback. CI results are recorded in the PR, not assumed by this document.

Run in a complete checkout:

```sh
npm run check
python -m pip install playwright==1.57.0
python -m playwright install --with-deps chromium
python tests/product-art-direction.browser.py
```

No merge or production deployment is part of this change.
