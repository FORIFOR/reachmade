# Reachmade / product homepage audit — 2026-09-17

This audit compares the deployed Reachmade experience and the six public product sites against a top-tier product-homepage bar: immediate comprehension, visual ownership, real-product proof, conversion clarity, mobile composition, and honest boundaries.

The goal is not to make all seven sites look the same. Shared craft should stay shared; hero composition, signature scene, rhythm, and product proof should remain product-specific.

## P0 — portfolio-wide

### 1. Deploy drift: `main` and reachmade.com are not the same experience

The current `main` already contains the Horio Premium / product-specific art-direction pass, while the deployed homepage still shows the older hero hierarchy. Treat deployment parity as a release gate before judging further visual changes.

**Acceptance:** after every visual merge, compare the deployed `/`, all six `/products/<id>/` pages, and JA/EN at 1440px, 1024px, and 390px.

### 2. The homepage promise must explain the product studio before the design philosophy

`CLAIM → PROOF` is a strong Reachmade signature, but it is an operating principle, not the clearest first-visit product promise. Use a plain-language H1 first and keep `CLAIM → PROOF` as the smaller signature.

### 3. Keep Reachmade pages and product sites different in purpose

- `reachmade.com/products/<id>/`: concise proof page — what it is, one real scene, first action, current limit, source.
- Product domain/site: full product story — desirability, workflow, detailed proof, installation/onboarding, deeper limitations.

Do not duplicate a long product homepage inside Reachmade.

### 4. Never fill missing social proof with invented logos, users, quotes, or metrics

Use real evidence: shipped artifacts, public repositories, test/evaluation records, reproducible examples, explicit limits, and real-use proof only when publication is permitted.

---

## 01 — Genie

Public site: `https://genie.reachmade.com/ja.html`

### Homepage — P1

- The value proposition is clear, but the first screen should make the **actual workspace** the dominant object rather than making visitors read before seeing the product.
- Reduce the feeling of multiple repeated recordings near the top. Lead with one canonical **request → work → artifact** scene; move the other examples below.
- Make the difference from a generic chat wrapper visible in the composition: the artifact and saved work should be as visually important as the conversation/request.
- Keep macOS/model/local-service requirements, but move detailed setup friction after the first proof scene.

### Product UI — P1

- Make `request`, `work in progress`, and `saved artifact` visually distinct states.
- Make it obvious where a generated result lives after the conversation ends.
- When an artifact opens outside Genie, show that boundary honestly instead of implying an in-app preview or publish flow.

### Signature scene

`REQUEST → WORK → ARTIFACT`

---

## 02 — AI Meeting

Public site: `https://ai-meeting.forifor.chatgpt.site/ja`

### Homepage — P1

- The hero currently carries headline, multiple explanatory paragraphs, two actions, access conditions, and the character space. Reduce the first screen to one promise, one primary action, and one live-looking product scene.
- Keep **“登録せずタスクを試す”** as the strongest first action; demo/video can be secondary.
- The character should support the product idea, not become the product identity by itself. The memorable visual should be the state change from conversation to a confirmed task.
- Move email-verification/time-limit detail directly below the primary proof, not into the main visual hierarchy.

### Product UI — P1

- Pending interpretation vs confirmed mutation must be visually unmistakable.
- Show what changed: task, due date, completion state, and the confirmation that caused the save.
- Make interruption/direction-change behavior visible; that is more differentiating than a generic meeting transcript.

### Signature scene

`CONVERSATION → REVIEW → CONFIRMED NEXT ACTION`

---

## 03 — Oathra

Public site: `https://oathra.reachmade.com/`

### Homepage — P1, mostly refinement

- This has one of the strongest product positions in the portfolio: the agent's claim is not completion evidence.
- Keep the current headline concept. Reduce version/install/setup text in the hero so the evidence scene wins the first screen.
- Make the transcript/evidence relationship the largest visual object: **what the agent claims vs what the other party actually said**.
- Move carrier/model setup, version differences, and phone doctor detail into the technical/start section.

### Product UI — P1

- Keep spoken agreement, verified evidence, and external-system registration as three distinct states.
- Never render “verified” in a way that implies the restaurant/business system was updated unless there is evidence for that system state.
- Surface the exact utterance supporting date, amount, party size, and confirmation.

### Signature scene

`CLAIM ≠ PROOF · OTHER PARTY'S WORDS → VERIFIED EVIDENCE`

---

## 04 — AI Secure

Public site: `https://aisecure.reachmade.com/index.ja.html`

### Positioning — P0

There are currently two valid product stories:

1. the public homepage's **preflight workbench** — inspect input/destination before sending and retain the reason/delivery state;
2. the existing correlation/triage foundation — connect exposure, privilege, and behavior into a reviewable case.

Do not let Reachmade and the product site look like unrelated products. Choose one front-door story and make the other a clearly named capability below it. The current public homepage makes preflight the clearest entry point, so Reachmade art direction should continue to align to `INPUT → CHECK → BLOCK / not_executed` while still documenting the deeper triage foundation.

### Homepage — P1

- Keep “AIに渡す前に、確かめる。” as the simple top promise.
- Make destination, policy/classification check, decision reason, and delivery state visible together.
- Separate concept film, synthetic demo, and real enforcement evidence with explicit labels.

### Product UI — P0/P1

- The decision state must answer four questions in one scan: **what is being sent, where, why allowed/blocked, whether anything was actually sent**.
- `blocked`, `not_executed`, `approved`, and any real-delivery state must never collapse into one generic success/failure treatment.
- The investigation/correlation mode needs a visibly separate context from preflight to avoid mental-model collision.

### Signature scene

`INPUT → CHECK → BLOCK / NOT_EXECUTED`

---

## 05 — Agent Team / Multibot

Public site: `https://multibot.reachmade.com/ja/`

### Homepage — P0/P1

- The external product copy **“作ってほしいものを、いつもの言葉で。”** is easier to understand than a multi-agent/trace-first description. Use the user outcome first; explain work trails after the product is understood.
- The homepage currently lacks strong image/media assets in the page extraction. Add one canonical real run as a dominant visual proof rather than relying mainly on explanatory sections.
- Show one job from request to produced file. Avoid architecture diagrams as the hero.
- Clarify who this is for: someone who wants code/docs/data work produced and reviewed, not someone shopping for “multi-agent technology.”

### Product UI — P0/P1

The execution timeline needs to answer, without opening logs:

- what the user asked for;
- which role/agent is active now;
- what artifact/version exists;
- what was reviewed and by whom/which role;
- whether the run is complete, partial, blocked, or failed;
- what the user should do next.

### Signature scene

`REQUEST → DRAFT → REVIEW → REVISION → FILE`

---

## 06 — Launchloom

Public site: `https://launchloom.reachmade.com/ja/`

### Homepage — P0/P1

- The site opens with evidence/anti-fake framing before it lets the output create desire. Keep that honesty, but move it below the first result.
- The hero should be an **output wall**: landscape film, vertical cut, LP, and social copy from one campaign. The product should sell through what it creates.
- Make “実際の生成物セットを見る” / the real launch kit the primary first action.
- Do not lead with a dashboard. The finished campaign assets are the strongest visual material.

### Product UI — P1

- Make campaign state and asset lineage visible: source recording → edit → variants → review → approved package.
- Separate `generated`, `reviewed`, `approved`, and `published` states.
- Publishing permission and per-post approval should be visually obvious and should not read like background documentation.

### Signature scene

`ONE BRIEF → 16:9 + 9:16 + LP + SOCIAL → APPROVED KIT`

---

## Reachmade-owned product landing priorities after deployment parity

The latest source already gives the six owned pages distinct hero and post-hero rhythms. After deploying `main`, do a screenshot audit before adding more CSS.

### Keep shared

- navigation and global typography quality;
- spacing/grid discipline;
- button behavior;
- accessibility and reduced-motion behavior;
- evidence disclosure and limitations;
- source/GitHub pathways.

### Keep product-specific

- hero composition;
- signature scene;
- accent/color balance;
- film crop/presentation;
- section rhythm;
- first CTA;
- the object that occupies the largest part of the screen.

## Release gate

Do not call the redesign finished until all of these pass:

1. **5-second test:** a new visitor can explain what Reachmade or the product does.
2. **Logo-swap test:** replacing the logo with a generic AI startup name makes the page feel wrong.
3. **Screenshot test:** the hero still looks art-directed when motion is paused.
4. **Proof test:** the largest product claim has a real screen, artifact, reproducible demo, or clearly labeled concept behind it.
5. **Boundary test:** concept, synthetic demo, simulation, beta behavior, and production evidence are visibly distinct.
6. **Mobile test:** 390px is intentionally composed, not a scaled desktop page.
7. **Deployment-parity test:** the deployed page matches the reviewed commit.
