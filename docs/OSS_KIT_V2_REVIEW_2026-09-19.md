# OSS quality kit follow-up — 2026-09-19

This is a local improvement of the Genie evaluation-sample workflow, not completion
of the six advertised applications or evidence of superiority to another product.
The user selected installation and additional improvement. Original code remains
under the previously authorized MIT scope; branding/media and the supplied kit are
excluded as explained in NOTICE.md. Nothing was published or submitted externally.

## Scope and installation

Installed and directly applied the supplied `oss-quality-kit` `2.0.0-draft`:
oss-standard-audit → outcome-first-ux → world-class-ui → contract-first-build;
a fresh agent used independent-product-verification before reading implementation.
The attachment was used as task guidance, not as additional permission.
See [installation and removal](QUALITY_SKILLS.md).

Baseline: `c35736bf671170ab8102a60c81189d1f42495cf2` plus local edits.
`artifacts/ui/oss-v2/before.patch` and `before-hashes.json` preserve the starting
state. `final-evidence.json` identifies the final dirty source; HEAD alone does not
identify the tested implementation. Evidence paths below are repository-relative.

## Changes and bounded rounds

1. Fixed K1–K6 criteria in `docs/design/acceptance.md`, audited the installed kit,
   and ran an uncoached AI exploration. It found a stale download instruction after
   returning to editing, an irrelevant mandatory original-example exercise, and
   a large noneditable illustration above the mobile editor.
2. Cleared stale notices when editing resumes, made the explicitly labelled example
   exercise optional, and removed that illustration only in guided mode. Added
   visible file-reading state, cancellation and Next protection. Typing, leaving
   the mode or cancelling invalidates pending application without losing the draft.
3. Added strict UTF-8 byte decoding and errors, complete-document export validation,
   an immutable historical v1 fixture, and a clean two-module consumer test; then
   rebuilt and rechecked. The independent recheck found missing JA/EN pending-mode-switch evidence; added both-language cancellation/typing/mode-switch/failure/recovery tests passed. No full redesign or parallel business-rule implementation.

Valid v1 Markdown stays byte compatible. Malformed UTF-8 now fails instead of
silently introducing replacement characters. `exportDraft` rejects incomplete
objects rather than substituting catalog content. See [public contract](SAMPLE_CONTRACT.md).

## Evidence and judgment

Environment: macOS Darwin 25.6.0 arm64, Node v26.5.0; automated browser
HeadlessChrome 153.0.8010.12. Browser QA blocks non-loopback requests and uses
explicit local inquiry-response fixtures. No actual inquiry service was exercised.

| Check | Status | Command / observed result / evidence |
|---|---|---|
| K1 installation | PASS | Bundle SHA256 verification, validator and 19 installer tests exit 0; 13 installed files byte-identical. `artifacts/ui/oss-v2/install.json` |
| Build and behavioral tests | PASS | `npm run check`, exit 0, 382 tests; `artifacts/ui/oss-v2/check.log` and independent recheck output |
| K2/K3 file failure and recovery | PASS | `SAMPLE_QA_OUT=artifacts/ui/oss-v2 npm run qa:sample`, exit 0; 40 browser checks including invalid bytes, pending read, cancel, failure and recovery. `browser-report.json`, `browser-run.log`, state PNGs |
| K4 compatibility / K5 integration | PASS | Core tests included in 382: 20 sample tests, fixed pre-change fixture import and byte equality, isolated consumer; `tests/fixtures/sample-v1-ja.*`, `core-tests.log` |
| K6 first-use discovery | PASS | Fresh read-only agent discovered edit → review → actual download → reload/reopen without route coaching. Download bytes and hashes verified. `artifacts/ui/oss-v2/independent/report.json`; AI exploration, not human research |
| Narrow widths / keyboard / composition / motion | PASS | Automated scope only: JA/EN widths 320–1920, focus, long text, empty input, CDP composition, reduced motion; `browser-report.json` |
| Real OS IME / real browser 200% / physical Safari / VoiceOver | BLOCKED | No successful native-device/assistive-technology evidence. CSS zoom and CDP composition are not substitutes |
| Competitor comparison / human first-use research | BLOCKED | No same-task comparative run or human participants; no superiority claim |
| Actual external persistence and deduplication | BLOCKED | No backend permission/evidence; unknown outcomes remain blocked from resubmission in the page |
| Typecheck | NOT_APPLICABLE | Static JavaScript, no configured typechecker. Build/tests are not described as typechecking |
| Native app verification | NOT_APPLICABLE | This repository's delivered slice is a static website; advertised native apps are outside it |
| Overall product acceptance / UI gate | BLOCKED | Manual/device/independent full-site requirements remain; gate is deliberately not given a passing receipt |

The scoped browser-report PASS applies only to its listed automated assertions.
The independent report and final evidence identify any recheck limitations separately.
First-use timing includes AI/tool overhead and excludes setup; it is not a usability
benchmark. The original user-edited files are checked against the preserved hashes.
Historical evidence in `artifacts/ui/oss/` remains separate from this follow-up.

Final independent recheck: scoped changes PASS with no P0/P1; see
`artifacts/ui/oss-v2/independent/recheck.json`. Its live recheck reached review
via the optional skip. Browser availability/foreground changed before completion,
so later checks used independent source/image/hash review of the implementation
agent's 40-check run, not a second complete independent browser execution. The
independently executed 382-test run passed. The original three findings are closed.
