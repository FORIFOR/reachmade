# Oathra / RingZero simulation distribution

Reachmade hosts the built fictional demo at `/demos/oathra/` so a review preview can run all three workflows before either repository is merged. Source and business rules remain in [FORIFOR/oathra](https://github.com/FORIFOR/oathra), in `site/src/use-case-model.ts` and `site/src/use-cases.ts`.

The app uses synthetic venues, phone numbers, inventory, dialogue and booking records. It does not connect to a store, telephone provider or live booking system. The persistent UI/video label is **構想デモ・実際の発信/予約は行いません**.

## Synchronize an approved source build

Build the website in the Oathra checkout with its documented `pnpm build:site` command, then run from Reachmade:

```sh
node scripts/sync-oathra-demo.mjs /path/to/oathra
npm run check
node scripts/verify-oathra-demos.mjs
```

Only the built HTML, CSS and JavaScript plus licensing notices are distributed. HTML adapts the bundle path, brand link and three video URLs and carries an adaptation notice; CSS and JavaScript remain byte-for-byte copies. `public/demos/oathra/source-manifest.json` records the source revision, source-working-tree state and SHA-256 values. If the source shape changes, the sync command fails instead of silently applying a partial rewrite. This does not add npm dependencies to Reachmade.

Do not edit the copied JavaScript/CSS directly. Fix Oathra, rebuild, sync and recheck. The copied Oathra code is Apache-2.0; bundled Zod is MIT. The Reachmade media retains its existing separate reuse scope.

## Recorded demonstrations

`public/media/films/use-case-{restaurant,stock,modify}.mp4` are silent Japanese recordings of the operational simulation UI. They are not live calls or external reservations. The matching JPGs are posters. Each player has native controls, a direct file link and a text alternative; it never starts automatically. Full media provenance and hashes are in `public/media/films/manifest.json`.

Browser QA at 1440/1024/390/320px checks the Reachmade presentation and local playback. The Oathra repository owns behavioral and adversarial workflow tests. Real Safari/VoiceOver, real telephony, store systems, payments and human usability studies remain separate checks; do not infer them from this preview.

## Review and publish

`PORT=4183 npm run preview` serves the build locally. `npm run deploy:check` is a dry-run, not a hosted preview. With existing authorized Cloudflare credentials, `wrangler versions upload` can create a version URL without deploying that version to production; record the returned URL and confirm the production deployment is unchanged. Never assume an alias or URL exists.

Review the draft PR and preview, then use the established deployment process when production deployment is authorized. Intended public entry: `https://reachmade.com/products/oathra/#concept-demos`; app entry: `https://reachmade.com/demos/oathra/`. Their presence in a draft branch does not mean they are already live.
