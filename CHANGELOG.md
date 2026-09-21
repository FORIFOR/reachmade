# Changelog

## 2026-09-22 — Editorial home pass (deployed, version 336e2ff2)

- Home opening: a factual pill above the claim (source-check date, recordings and evidence),
  a dotted row naming the three kinds of evidence, and the claim set at 38-80px.
- A circular forward affordance on each task row and on each product card's main link;
  section headers enlarged across the page. Palette, card radius and information order unchanged.
- Hit areas: access-table and product-card links raised to 44px (under-44 interactive
  elements at 320/390px went from 10 to 4; the remaining 4 are in the shared shell).
- The signature scene is no longer shipped to pages that do not mount it: the marquee moved
  to `signature-marquee.css` and the 6.6KB client module is no longer fetched on every page.
- Local evidence is no longer a candidate for commit (`.gitignore` covers `artifacts/`).
- Composition reference, adoptions and rejections recorded in `docs/design/references/README.md`.

Independent AI review: pass (no P0, no P1; one P2 open — three different forward glyphs
coexist). No human approval, no user testing, no measured comparison against any other site.
Product claims and the ledger are unchanged.

## Unreleased — OSS quality follow-up (2026-09-19)

- Added project-local OSS Quality Kit v2 Skills with provenance; original instructions retained.
- Added strict UTF-8 byte import and required complete documents for export; valid v1 output remains unchanged.
- Added visible/cancellable local file reading; rejected files and late reads preserve current edits.
- Made original-example practice optional and cleared notices when their destination screen changes.
- Prioritized the actual editor over the non-editable illustration in guided mode; retained recording/story modes.
- Added frozen v1 compatibility fixture, isolated two-file consumer test and browser recovery checks.
- Prior local changes: manual sample edit/review/export/reopen, portable core, inquiry uncertainty handling, MIT scope and OSS onboarding.

No release, deployment or production-service verification is implied. See the dated verification reports for actual commands, results and remaining BLOCKED checks.
