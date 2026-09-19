# Current UI acceptance

The outcome-first rollout preserves the five-chapter UI stories, guided samples and native recorded workflows. Existing acceptance entrypoints now share the active contract rather than asserting the retired hero position or `data-user-intent` field.

`scripts/verify_showcase.py` first runs the complete unmodified-build layout suite over local HTTP. It then independently verifies actual packaged frames at normal playback speed, no early recording fetch, pause, a deliberately aborted HTTP video request, a real retry, visible fallback/source links, return to UI stories, chapter stillness and product no-JavaScript access. The layout suite additionally covers four widths, both locales, six direct-entry links and the original saved Genie artifact. Only screenshot upload is non-blocking when GitHub quota is exhausted; no browser assertion is converted to a warning.

This is local static-HTTP browser acceptance. Production rollout, actual devices and Worker security/range delivery have separate acceptance requirements. Existing packaged-media and owned-site regression workflows remain unchanged.
