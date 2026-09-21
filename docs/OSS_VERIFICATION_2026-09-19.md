# OSS / first-success verification — 2026-09-19

**Partial acceptance, with explicit BLOCKED items.** This change improves the
product-evaluation website. It does not implement or certify the six applications.
No comparative superiority or human usability result is claimed.

## Task and claims

Primary user: a first-time visitor evaluating Genie. Input: an editable fictional
sample. Result: reviewed, labelled Markdown that can be downloaded and reopened.
Success: text, Unicode and whitespace are preserved, the visitor can correct bad
input and recover a local copy, and sample output is not confused with an AI run.

| Claim / component | Implementation and classification |
|---|---|
| Editable local sample and Markdown recovery | `public/assets/sample-draft.mjs`, `lab-core.mjs`, `lab-explorer.mjs`: implemented, executed in Node and a real local browser |
| Sample decisions / stage animation | Fixed illustrative fixtures in `lab-core.mjs` and existing animated-demo modules; no model, external write or performance evidence |
| Real Genie recording and saved Orbit | Existing files under `public/media/originals/genie/`, linked by `src/outcome-first.mjs`; historical evidence, not freshly generated in this run |
| Six application capabilities | `src/products.mjs` is the site's claim registry; the app implementations are in separate repositories, not tested here |
| Inquiry acceptance | `src/inquiries.mjs` recognizes 201 + receipt from a separate Google Cloud broker; local mocked response verified, actual durable storage / receiver authorization / atomic deduplication BLOCKED |
| Automatic cross-product workflow, new AI output or SNS posting | Not implemented in this website; sample and export disclose that |
| Reusable OSS | Owner authorized MIT for original code; LICENSE/NOTICE delimit brand/media/third-party exclusions. The whole branded/media site is not blanket MIT |

Registry limitations retained: Genie requires Mac/local service/model setup;
AI Meeting text and voice access differ; Oathra conversation is not proof of an
external reservation; AISecure is a synthetic-data snapshot prototype, not live
blocking; Agent Team quality superiority is unverified; Launchloom real posting
is unverified. None were upgraded to PASS by this website change.

## Environment, identity and evidence

Base revision: `c35736bf671170ab8102a60c81189d1f42495cf2`, plus local dirty changes.
No commit, push, merge, publication or deployment was performed.
Measured: macOS Darwin 25.6.0 arm64; Node v26.5.0; HeadlessChrome 153.0.8010.12.
The browser is a real isolated Chromium process over a local HTTP server. Frame
callbacks were not substituted. CDP drives keyboard and text entry; file download
bytes are read from disk. Inquiry responses are explicitly intercepted fixtures,
not evidence of actual backend persistence. Non-loopback page requests are blocked.

Evidence root: `artifacts/ui/oss/` (ignored local evidence, not distributed test data).
`browser-report.json` contains command, exitCode, measured environment, every
observation, dirty-source SHA-256 hashes and screenshot hashes. Final source and
command records are `final-manifest.json` and `commands.json`. Pre-existing edits
are recorded in `pre-existing.patch`, `pre-existing-ui-probe.mjs` and
`user-files.sha256`; final hash verification must pass unchanged.

| Command | Exit | Observed result / evidence |
|---|---:|---|
| `npm run check` | 0 | 378 tests, 378 pass, none skipped; `check-final.log` |
| `npm run build` | 0 | Final localized pages rebuilt after tests; `build-final.log` |
| `npm run qa:sample` | 0 | 36 browser checks; `browser-report.json`, `browser-run.log` |
| `node examples/sample.mjs` | 0 | Real stdout Markdown; `sdk-example.md` |
| `git diff --check` | 0 | No whitespace errors |
| `npm run ui:capture` | 0 | 15 configured screenshots; `capture.log` / `artifacts/ui/capture.json` |
| `node scripts/ui-quality.mjs check codex-oss-20260919` | 1 | BLOCKED: required manual checks retained as blocking findings, not hidden to obtain a passing receipt; `gate-check.log` |

The optional pre-existing Python/Playwright inquiry regression script was updated
for the new unknown-outcome contract; it was not executed in this environment
(Python Playwright is not installed). The new dependency-free browser runner covers
unknown/rejected/accepted cases locally. Node 22 minimum-version CI execution is
not replaced by the local Node 26 result. No new package dependency was installed.

## Acceptance outcomes

| ID | Status | Evidence / limits |
|---|---|---|
| O1 | PASS | Build + 378 Node tests under Node >=22 (actual v26.5.0). Static JS typecheck: NOT_APPLICABLE; syntax and behavior are checked separately |
| O2 | PASS | Home entry and Genie entry open editable text; labelled workflow and result shown. `sample-home.png`, `sample-ja-390.png` |
| O3 | PASS | Keyboard edit/review/export; file bytes equal core export and readonly preview; import/back/mode retain leading newline, emoji, spaces and Japanese. `reachmade-genie-sample.md` and browser observations |
| O4 | PASS | Empty and 4,001-character input rejected without truncation; invalid file retains original; delayed read cannot overwrite a newer edit; failed Blob download leaves copy fallback. Cancel event injected; real OS file-picker cancel remains unmeasured |
| O5 | PASS | JA/EN 320/390/768/1024/1440/1920 editor layouts have no horizontal overflow; long-review → export/back focus bounds measured before screenshot scrolling, all inside viewport. Scope is the changed sample flow, not a WCAG certification |
| O6 | BLOCKED | CDP composition commit is asserted; long Japanese input and reduced-motion editor are measured. CSS 200% zoom proxy passed. Real OS IME candidate interaction, browser-level 200% zoom and physical iPhone/Safari/VoiceOver need separate manual/device sessions |
| O7 | PASS | Pure core import and round-trip tests; executed Node example; input/output/errors/version/compatibility documented in SAMPLE_CONTRACT.md |
| O8 | PASS | Local mock cases: valid receipt required, rejection can recover, unknown disables resend even after reconnect/programmatic submit. Actual authorization/idempotency/storage at the external broker: BLOCKED |
| O9 | PASS | README onboarding corrected; original code MIT, excluded materials documented; contribution/security/adapter integration policy added |
| O10 | BLOCKED | Separate agent reviewed code and actual images; review records in `artifacts/ui/oss/`. Human usability and identical reference-editor task comparison not performed; no users recruited, no comparative ranking claimed |

The installed `ui-craft` repository skill was used. Requested
`oss-standard-audit`, `outcome-first-ux`, `contract-first-build` and
`independent-product-verification` were searched for and were not installed;
`frontend-design` was also unavailable. The independent review was a separate
agent context, not execution of an absent skill or a human user study.

## Improvement rounds

1. Fixed acceptance, separated portable core from UI, added edit/review/export/
   reopen and copy fallback, corrected inquiry uncertainty and OSS documentation.
   Independent review found leading-LF loss, silent maxlength truncation and stale
   import overwrite. All three were fixed and reproduced in the browser checks.
2. Browser tests and image review passed the reviewed slice. Reviewer noted that
   screenshot scrolling could hide focus problems, composition needed an assertion,
   and evidence needed dirty-source identity. Added owner-controlled visible focus,
   pre-capture bounds checks, committed-composition comparison and SHA-256 records.
3. Final independent reviewer returned **keep** for the changed flow, with no
   unresolved P0/P1 implementation findings. All 15 configured regression images
   and current sample images were opened; downsampled tall images permit only broad
   layout assessment. O6/O10 manual checks remain BLOCKED. The evidence gate exits
   1 because that review deliberately retains the mandatory blocking checks. See
   `artifacts/ui/oss/independent-review.json` and `gate-check.log`.

## Remaining owner checks

Run the same edit → preview → save → reopen fixture in a chosen reference editor
(e.g. VS Code), record actions and failure recovery for both, then recruit first-time
users to assess comprehension. Official reference workflow is linked in
SAMPLE_CONTRACT.md; documentation alone is not a benchmark. Verify real OS Japanese
IME and browser zoom on supported devices. Verify the inquiry broker's durable
idempotency and reconciliation before relying on it. Deployment is a separate,
explicitly authorized operation.
