# AI phone implementation checklist

One practical article at `/products/oathra/guide/`, paired with `/en/products/oathra/guide/` for the site's existing language switch and hreflang contract. This is one topic, not a series of keyword variants.

The search task is to understand what must be decided before prototyping AI phone booking. The article covers confirmation/failure/awaiting-verification states, approval and human handoff, recording and data handling, existing-system boundaries, and five details for an initial consultation. It is design guidance, not an operating service or a customer case study.

## Sources and boundaries

- Current product facts: `src/products.mjs` (Oathra ledger). The spoken agreement/system-registration boundary and incomplete 100-real-call evaluation are preserved; no new product capability is claimed.
- Public introduction: https://reachmade.com/products/oathra/#experience-film — 24-second illustrative film; source/credits and existing caveat are retained.
- Public concept demos: https://reachmade.com/products/oathra/#concept-demos — fictional input and no real call/booking. The English article labels its link as Japanese.
- Reference https://note.com/ganma_cat/n/na50ce3dcfc43 is a third-party account of updating an existing website's SEO articles. Its traffic is self-reported and is not reused as evidence, a target or a promised result. No paid content was acquired or copied. The X reference was inaccessible; no X text is claimed verified.

No service prices, private customer/business information, new analytics, accounts or dependencies are introduced. Consultation uses the existing localized `/contact/#product-oathra` flow; `/api/inquiries` and its behavior are unchanged. No real inquiry was submitted.

## Scope and design

The existing static owned-guide frame and stylesheet are reused, with a contents list and short sections. No new animation, embed or CSS. One contextual link is added below the Oathra introduction in both languages. These are additive changes; the earlier Noa viewing work stays in draft PR #39, not in this guide PR.

Read repository CLAUDE.md, ui-craft/ui-review, and design brief/acceptance/tokens. No AGENTS.md was found in the checkout or ancestor scope. The local world-class-ui instructions support bounded reuse; frontend-design is not installed. The cloud horio-premium-web overview was readable but its reference resources were unavailable, so no completion of that separate skill's full gate is claimed.

Route-count assertions change from 32 to 34; owned guides change from four to six localized routes. The new article uses the same zero-script contract as the two existing owned guides. Existing checks still validate all internal targets/fragments, canonical/hreflang, one h1, form confinement, and HTTPS external destinations. No test thresholds are relaxed.

## Validation

- `npm run check`: 504 passing tests, zero skipped. The first sandboxed run could not start the local HTTP server; a permitted local-server run passed.
- `UI_CAPTURE_REQUIRED_ONLY=1 npm run ui:capture`: all 37 required screenshots, including full article pages in JA/EN at 1440, 1024, 390 and 320 CSS px. Capture manifest and hashes are in ignored `artifacts/ui/capture.json`.
- Browser interaction: Japanese contents link to consultation, JP/EN guide CTA to the matching existing inquiry page, and language switch. Only navigation, no form input or submission. Local preview cannot serve the backend and correctly shows its unavailable state.
- Visual review is tracked separately in `artifacts/ui/guide-review.md` and `artifacts/ui/review.json`.

No merge or production deployment. Search indexing, rankings, views and inquiries are not measured or guaranteed. Physical Safari/iPhone, VoiceOver and real production inquiry delivery are outside this change's verification.
