# Security

This repository is a static evaluation website plus an optional, owner-specific
inquiry adapter. The sample editor does not send input, run AI, or persist data
in browser storage. Imported Markdown is untrusted text; the UI renders it with
textContent / textarea, never as HTML. Integrators rendering Markdown must sanitize
it and prohibit active content themselves.

Supported scope: current source and sample-document contract v1. There is no
published npm SDK or support SLA. Old deployed revisions are not automatically
updated when local source changes.

Do not post secrets, personal data or exploit details in public issues. Use the
repository's GitHub **Security → Report a vulnerability** if private reporting is
enabled. Its availability is not verified here. If unavailable, ask the maintainer
for a private channel without disclosing the vulnerability publicly. No monitored
security mailbox is claimed or invented.

The inquiry broker is a separate service. Origin validation is not authentication
or an anti-abuse guarantee. Before enabling it for a fork, configure an owned
receiver with authorization, rate limits and durable atomic idempotency, reconcile
ambiguous receipts, and verify data retention/consent. A UUID alone does not prove
deduplication. Do not reuse Reachmade's receiver for your own deployment.
