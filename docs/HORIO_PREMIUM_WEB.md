# Horio Premium Web

Horio Premium Web is the release-quality gate used on top of Reachmade's Quiet Cinema visual direction.

## Goal

A page should feel simple and rich because the real product is composed, cropped and explained well — not because generic decoration was added.

## Defaults

- Real product screens, recordings or delivered artifacts are the visual evidence.
- Typography, spacing, composition and crop do most of the visual work.
- Keep one meaningful **Signature Moment**. Do not animate the whole page.
- Mobile is a separate composition, not a scaled desktop screenshot.
- An implemented recording and a concept/design preview must remain visibly distinct.
- Do not invent functionality, customer names/logos, testimonials, adoption numbers, performance numbers or completed outcomes.

## Avoid by default

- meaningless 3D objects
- glow as decoration
- glassmorphism as the main visual system
- blue/purple “AI” gradients
- decorative particles
- a page whose main idea is only a bento grid
- large collections of interchangeable same-shape cards
- stagger/fade motion on every section

## Reachmade homepage Signature Moment

The homepage uses one implemented moment: **the real Genie product recording in the hero stage**.

- On wide desktop, and only when reduced motion/data saving do not forbid it, that real same-origin recording may play silently when visible.
- Other product recordings are manual.
- At 1024px and mobile widths the hero remains a strong real-product poster until the visitor explicitly presses Play.
- If automatic media loading fails, the real poster remains; an error is disclosed only after a visitor explicitly attempts playback.

## Required release tests

### Logo Swap Test

Temporarily replace the Reachmade wordmark with a generic name. The first viewport must still be recognizable from its product-specific headline, real product stage and product name. If the page becomes generic without its logo, the design is not finished.

### Screenshot Test

Capture the actual generated site at **1440px**, **1024px**, and **390px**. Review hierarchy, crop, text wrapping, controls, overflow and the amount of generic chrome.

### First 5–10 seconds

Without scrolling, a visitor should be able to identify that Reachmade builds multiple AI products for concrete work, and should see a real product surface as evidence.

### Real product / real result test

A real implemented product screen or result must be the strongest visual object. Concept art cannot pass this gate in its place.

### Stillness test

With `prefers-reduced-motion: reduce`, the page must remain composed and understandable. The product poster, hierarchy and primary actions cannot depend on animation.

## Additional checks

- keyboard focus is visible
- autoplay is muted and limited to the single Signature Moment
- reduced motion and supported data-saving preferences disable automatic playback
- video failure has a usable poster/fallback
- no horizontal overflow at tested widths
- no external fonts/analytics are added merely for appearance
