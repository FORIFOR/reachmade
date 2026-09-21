# Contributing

Use Node.js 22 or newer. `npm run check` builds the static site and runs the full
Node suite without installing packages or using an API key. `npm run dev` serves
only on loopback. The public API example is `node examples/sample.mjs` (stdout).
See [the contract](docs/SAMPLE_CONTRACT.md) and [acceptance criteria](docs/design/acceptance.md).

Start with one reproducible task, a failing case and its expected outcome. Preserve
existing working-tree changes. Keep public behavior in portable core functions;
UI owns DOM/focus, adapters own IO. Keep npm dependencies at zero. Do not delete
checks or weaken expected results to make a change pass. For UI changes follow
`.claude/skills/ui-craft/SKILL.md`, capture actual screens, and seek independent review.

Run the optional local browser check with `npm run qa:sample` after building.
It uses an already installed Chrome/Chromium and synthetic local inquiry responses;
it never submits a production inquiry. `CHROME_BIN` can select the executable.
Record revision, dirty-file hashes, environment, commands, exit codes, outputs and
unverified checks. OS IME, Safari/iPhone and human usability need separate evidence.

Issues/PRs should include: task, steps, actual/expected result, language, OS/browser,
synthetic input, and relevant test output. Never include secrets or customer data.
Use the security reporting route in SECURITY.md for vulnerabilities.

You retain copyright in your contribution and must have rights to submit it under
this repository's applicable license. Identify third-party code and its license.
Do not contribute brand/media assets without explicit redistribution permission.
Local contribution work does not authorize push, publishing, deployment, posting,
paid operations or sending visitor data to a third party.
