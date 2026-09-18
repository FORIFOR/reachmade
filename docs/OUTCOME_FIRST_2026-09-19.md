# Outcome-first integrated experience

This branch builds on Product Lab PR #26 and incorporates the six product art-direction implementation and messaging from PR #25. It does not merge either PR or deploy the production domain.

## What visitors can do

- Read concrete outcomes in a quieter, two-column opening with a single product-selection action.
- Operate a real, hand-authored Orbit study: start/pause, change speed, change palette and save a self-contained HTML artifact. This study is explicitly NOT a Genie-generated result, an AI execution or a scientific simulation.
- Switch between six products in the existing Lab. A new synchronized direct destination and access note points to the actual configured setup guide, text-task UI, public transcript check, synthetic investigation, work record or existing launch examples. The site does not claim that all six are instant hosted AI apps.
- Enter the existing labelled guided sample from each product page's first view, while retaining the real recordings and original source/setup links.

## Integration and safety

The build order is base pages → owned landings → six art directions → existing animated-demo assets → Product Lab → outcome finishing. Release marker: `data-outcome-first="20260919-outcome-1"`. Existing canonical URLs, source recordings, maturity/scope notes, application code, Worker, privacy and inquiry handling remain unchanged. No microphone, model API, credential, external workflow transport, analytics or persistent visitor storage was added. Downloads require an explicit button click. Motion starts only on explicit input and pauses offscreen or when the document is hidden.

## Validation

Before committing: 13 new Node tests passed. Eight local Chromium cases (Japanese/English × 1440/1024/390/320px) exercised real controls, zero network, HTML export, reopening and re-exporting the saved artifact. PC/mobile hero screenshots were visually reviewed using the actual new component and its CSS in a small review shell. They are NOT production or complete-site screenshots. The local browser blocks URL navigation, so this component review used in-memory authored HTML.

The added `Outcome first acceptance` workflow runs the entire repository's build/tests, rebuilds a clean final site, and tests unmodified built HTML/CSS/JS over local HTTP in Chromium and WebKit. It covers both homepages and all twelve owned product pages, four widths, direct destination synchronization, sample entry, keyboard access and no-JavaScript fallbacks. Read CI results rather than treating the workflow definition as a passed test. WebKit automation is not a claim of physical iPhone/Safari testing. Artifact upload can fail if GitHub storage remains full; assertions still fail the job.

## Acceptance boundary

This is an implementation and reviewable design improvement, not an objectively measured claim to beat VoiceOS, an award claim, or a production rollout. Original third-party product sites and real-model onboarding are not rewritten by this branch.
