# Noa: connect the public videos to their actual watch pages

Base: `1e4bee47f4d268d6f3c33e0ff58e1021945dc2f0` (PR #38).

## Observed gap

The production Japanese Noa page showed the explainer and introduction as
non-clickable cards with individual links "coming soon". The product ledger
sent both the demo and the evidence link to the channel home. Public videos
already provide more specific destinations.

## Public destinations checked

The signed-out public watch pages were inspected in a cloud browser on
2026-10-04, 16:13–16:16 UTC. Player duration is used below; list-card rounding
can differ by a second. This establishes reachable public pages and their
labels/descriptions, not an independent full runtime review of the character.

- [Gameplay test](https://www.youtube.com/watch?v=A6eJSOnGj1Q):
  "AI VTuberがVampire Survivorsに挑戦！武器選びから反省会まで【星藍ノア】",
  4:08. Its description explicitly identifies an edited test recording with
  waiting time removed, and warns that commentary can lag or contain errors.
- [Judgement Short](https://www.youtube.com/watch?v=OfRHH5nBHAI):
  "AIはゲーム中、何を考えてる？実際の3判断を見せます #Shorts", 0:28.
  This is not the introduction PV or the long explainer.
- [Reply, voice and face explainer](https://www.youtube.com/watch?v=NtrGg4zRqQM):
  "AI VTuberの中身、見せます｜返答・声・表情の仕組み【星藍ノア】", 5:49.
- [Self-introduction](https://www.youtube.com/watch?v=3yosX4frOgM):
  "【自己紹介】はじめまして、星藍ノアです。｜AI VTuber", 0:34.

## Bounded change

- Keep the existing three-card Japanese watch layout. Link its cards to the
  edited gameplay test, explainer and introduction; add the short and channel
  as secondary text links. Remove the obsolete pending-link message.
- Give the JA/EN product ledger an individual edited-test demo and explainer
  evidence destination. The work page derives the same links from that ledger.
- Refresh the English first-use copy to name the edited Japanese test video
  and remove the promise of future individual links.
- Preserve the staged introduction film, closed-source boundary, full-live-run
  unpublished caveat, existing consultation route, and capability-check date.
- No design replacement, new measurement, form changes, subscription, inquiry
  submission, merge or production deployment.

## Verification

- Environment: Linux cloud workspace, Node v24.19.0, zero added dependencies.
- Reproduction before the change: build plus `node --test
  tests/noa-watch-links.test.mjs` failed both new tests on the missing individual
  destinations.
- After the link change: `npm run check` passed all 498 Node tests, zero skipped.
  New tests cover direct links, matching video types/durations, JA/EN demo and
  evidence paths, removal of pending copy, and the full-run caveat.
- Local browser preview: **BLOCKED**. CUA could not open
  `http://127.0.0.1:4197/products/noa/` (`ERR_BLOCKED_BY_CLIENT`). No local
  screenshot, mobile visual review, keyboard interaction or visual gate pass
  is claimed. The existing public pages were inspected, not this unpublished
  build. Physical Safari/iPhone and VoiceOver are also unverified.
- CI and independent review status belong to the draft PR checks/discussion;
  a passing code suite is not evidence of more views, inquiries or paid work.

## CI follow-up

On `7369cbb8c7a84949fecbe9cc6d42ecd197f0c395`, the required-image job captured
and uploaded the actual screenshots but failed for horizontal overflow in the
390px expanded access table (`home-m-access.png`). Inspection of that image
showed the shared entry-link style did not wrap, including the existing Genie
entry. The mobile-only rule now permits wrapping instead of hiding overflow or
removing the edited-test qualification from the label.

The required capture set now includes the changed Noa Japanese watch section
and English scope links at desktop/phone sizes, plus expanded English-phone
and Japanese-320px access tables. The local suite after this follow-up passes
499 tests. No thresholds were relaxed. Inspect the latest CI images and checks
before treating the visual follow-up as passed; the initial capture does not
prove the later fix.
