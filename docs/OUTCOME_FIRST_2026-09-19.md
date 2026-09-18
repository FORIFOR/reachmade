# Outcome-first integration

This branch integrates the six product compositions from #25 with the merged Product Lab #26 and owned-site migration #27. All newly migrated media, routes, guide pages, source registries, aliases, Worker and read-only migration tests are retained from main. No original branch is force-pushed or closed.

## Final experience

- A concise, outcome-led opening. One primary product-selection action and a large real-work stage.
- **The final hero uses the original Genie Orbit recording and the saved interactive HTML imported by #27, not the newly hand-authored Orbit study.** Visitors can watch the creation workflow, open the actual saved artifact, and inspect the original recording/outputs. The public demonstration uses fictional inputs and edited waiting/actions; opening it does not start a new AI run.
- The six-product Lab now synchronizes a direct destination AND its access conditions. Genie opens the saved artifact; AI Meeting opens account-free text tasks; Oathra opens its public transcript checker; AI Secure opens a synthetic case; Agent Team opens an existing work record; Launchloom opens existing generated material. Installation and proof links remain available.
- Each product page retains a distinct first-view composition and gains a direct entry into its existing labelled guided sample, only when the relevant controls successfully mount. No duplicate sample engine was added.
- The extra hand-authored Orbit module is retained as an optional, self-contained export example tested separately. It is not mounted in the final home/product pages or presented as a Genie output.

## Verification scope

Thirteen new Node tests pass in the local source subset. Eight separately tested optional-artifact Chromium cases covered play/pause, speed, theme, zero network, HTML export, reopening and re-export. Earlier local hero captures showed this optional artifact in a review shell; they are NOT captures of the final real-recording hero.

The `Outcome first acceptance` CI builds and tests the full repository, rebuilds clean final assets and serves unmodified built pages over local HTTP. It targets Chromium and WebKit, JA/EN home plus twelve product pages, four widths, destination synchronization, original saved-artifact navigation, guided-sample entry, keyboard and no-JavaScript paths. CI conclusions must be read from actual runs; a workflow definition is not evidence of a pass. WebKit automation is not physical iPhone/Safari testing. Artifact upload can fail independently when GitHub storage is exhausted, without suppressing browser assertions.

Release marker: `data-outcome-first="20260919-outcome-1"`.

## Boundaries

No main merge or production deployment by this implementation step. No new model call, microphone access, real phone call, booking, security enforcement, social publishing, customer proof, tracking or persistent visitor storage. Original media and imported generated artifacts are unchanged. The underlying apps and their model onboarding are not rewritten. No measured claim of beating VoiceOS or winning a design award is made.
