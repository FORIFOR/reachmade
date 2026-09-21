# Project quality Skills

Installed on 2026-09-19 from a local copy of the OSS Quality Kit, version
`2.0.0-draft`, supplied by the repository owner. This is a user-supplied independent kit,
not an OpenAI/Anthropic/Vercel official package. `SHA256SUMS.txt` verified before
execution. The reviewed installer does not use the network or git and refuses
existing destinations. Its 19 local tests and format/reference validator passed.

Codex project placement: `.agents/skills/` — **local only.** `NOTICE.md` records that
the supplied bundle carries no redistribution license, so `.gitignore` keeps it out of
this repository and it is not published or distributed with the site source. Anyone
else needs their own copy of the kit.

1. `oss-standard-audit`: claims, installation, reusable boundary.
2. `outcome-first-ux`: task, states and first successful outcome.
3. `world-class-ui`: component design and actual screen refinement.
4. `contract-first-build`: contracts, implementation and compatibility tests.
5. `independent-product-verification`: fresh read-only exploration before code review.

These Skills were read and applied directly in the installation turn. Automatic
Skill discovery is expected on the next turn; that next-turn runtime result is not
claimed as already observed. The verifier used a fresh agent context and the installed
Skill; its findings are AI evidence, not human user research.

No AGENTS.md or CLAUDE.md was replaced, no global Skill was overwritten, and no
additional frontend-design/Impeccable package was installed. New UI work uses
world-class-ui as the design owner, while existing ui-craft gate/evidence rules
still apply. The provided master prompt was read as task guidance; it adds no
permission for publication, paid work, third-party uploads or product claims.

Installation reproduction from a reviewed bundle:

```sh
python3 /path/to/oss-quality-kit/scripts/install.py --target /path/to/reachmade --tool codex
python3 /path/to/oss-quality-kit/scripts/install.py --target /path/to/reachmade --tool codex --apply
```

The first command is a dry run. Compare hashes and review any future update before
applying it; do not overwrite modified Skills. To uninstall, remove only these five
installed directories after checking for local edits, preserving unrelated Skills.
No background process, dependency package or hook was installed.

License: the kit contains no separate redistribution license. Local use and copying
were requested by the user; it is excluded from the site's MIT grant. Resolve its
redistribution terms before publishing a repository copy containing it. Installation
identity and command outcomes are recorded in `artifacts/ui/oss-v2/install.json`.
