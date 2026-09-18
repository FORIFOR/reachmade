# Owned product sites — 2026-09-19

Genie and AI Meeting marketing links use Reachmade. Original public source URLs
are retained in the provenance record, not used by visitor pages or media builds.
The existing product-page presentation remains intact.

- Genie: `/products/genie/`; original demos: `/products/genie/demos/`.
- AI Meeting: `/products/ai-meeting/`; usage guide: `/products/ai-meeting/guide/`.
- English variants use `/en/products/...`.
- AI Meeting's application, authentication, task storage and app alias retain
  their existing origin. `appSite` is distinct from the marketing `site`.
- Original recordings, captions, posters and demonstration outputs are tracked
  in `public/media/originals/` with byte counts and SHA-256 integrity checks.
- The two feature recordings load from Git during builds, never from the old
  hosts or the current production website. Missing or changed files fail closed.
- Old hosting accounts have not been changed or deleted. Retiring their URLs
  requires a separate redirect change at those hosts.

Validation: `npm run check`, `npm run media:prepare`, then
`python scripts/verify-owned-sites.py` against the local Worker.
