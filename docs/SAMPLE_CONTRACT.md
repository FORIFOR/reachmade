# Sample document contract v1

Scope: a local, manually edited evaluation document for one of the six product
samples. This is not an SDK for Genie or the other applications, and does not
invoke models. No packaged npm release is offered. Pin the source commit and copy
`public/assets/sample-draft.mjs` together with `lab-core.mjs`, LICENSE and NOTICE.

## Responsibilities

- Core: `lab-core.mjs` (sample catalog/decisions) and `sample-draft.mjs` (validation,
  immutable value, Markdown export/import). Importing them does not touch DOM or IO.
- UI: `lab-explorer.mjs` owns editing, focus, transient per-product drafts and notices.
  Existing exports from lab-explorer are re-exported for compatibility; importing
  that UI module in a browser still auto-mounts. SDK users should import the core.
- File adapter: browser Blob/download and user-selected File, in the UI. No uploads.
  `examples/sample.mjs` is the Node stdout adapter using exactly the same core.
- Inquiry adapter: `src/inquiries.mjs` / `worker.js`, unrelated to sample export.
  It forwards approved input only to the fixed owner endpoint. It is experimental
  for reuse and should remain disabled in a fork until replaced with an owned backend.

## Core API

```js
import {createDraft, exportDraft, importDraft, decodeDraft, DraftError}
  from './public/assets/sample-draft.mjs';
const draft = createDraft({product:'genie', language:'en', text:'My edited example'});
const file = exportDraft(draft); // {filename, mimeType, text}; no write performed
const restored = importDraft(file.text); // same validated immutable document
```

`createDraft({product, language, text?})` accepts only these keys. Product is one
of genie/ai-meeting/oathra/aisecure/agent-team/launchloom; language is ja/en. Omitted
text uses the catalog example. Result is frozen `{version:1, product, language,
text}`. Text has 1–4,000 UTF-16 code units after CRLF/CR → LF normalization, must
contain non-whitespace, and must not contain unpaired surrogates or disallowed
control characters. Leading/trailing whitespace and HTML-looking text are retained.
`exportDraft` requires all four document fields (including string text), rejects unknown fields, validates again and emits a deterministic UTF-8-compatible string,
fixed safe `.md` filename and `text/markdown;charset=utf-8` MIME. UI and CLI use
these same functions. Core throws `DraftError` with stable `.code`; messages are
localized by the caller, never parsed for logic.

| Code | Meaning / recovery |
|---|---|
| INVALID_INPUT | Unknown keys, product, locale or non-string; fix caller input |
| EMPTY | Enter some non-whitespace text |
| TOO_LONG | Reduce to 4,000 UTF-16 units |
| INVALID_TEXT | Remove invalid Unicode/control characters |
| INVALID_ENCODING | Malformed UTF-8 bytes; resave the original file as UTF-8 |
| TOO_LARGE | Import is larger than 32,768 UTF-8 bytes |
| INVALID_FILE | Not this export or disclosure was changed; choose an original export |
| UNSUPPORTED_VERSION | Version other than 1; use its compatible reader |

`decodeDraft(bytes: Uint8Array)` accepts UTF-8 file bytes up to 32,768 bytes, decodes with `TextDecoder` fatal mode, then calls `importDraft`. Invalid bytes are rejected rather than silently replaced with U+FFFD. `importDraft(string)` remains the string API; a caller must use strict decoding before it if input came from bytes.

Markdown uses standard text, headings and a two-line blockquote disclosure. The
first line identifies document version/product/language; this minimal envelope
lets the reader reject unrelated/unsupported files. Import accepts UTF-8 BOM and
Windows newlines. Edit the body in any plain-text/Markdown editor, retaining the
two disclosure lines and blank separator. This is a sample document convention,
not a general Markdown parser or a new exchange standard. The UI rejects a
product/locale mismatch without overwriting the draft. A cancelled file picker
has no effect. HTML text is never executed.

## State, permissions and recovery

Editing → optional original-example practice → review → export-ready. An incorrect practice decision stays pending and explains why; it never edits or evaluates the user’s text. The explicit skip action bypasses practice only, not a real authorization step. Back/mode/product switches
retain text in this tab. Reload closes that memory; reopen the downloaded file to
recover. No browser storage, cookies, telemetry or external requests are introduced.
Reading a file and downloading are explicit user actions. Import has no server
side effect. Download can only report **requested**: browsers cannot prove that a
user saved the file. If it fails, the readonly export and keyboard-copy action
remain available. There is no loading/approval service, asynchronous AI job or
external cancellation API. Local file reads show a reading state, block Next, and expose Cancel reopen. Cancellation stops applying the eventual result; it does not claim to abort OS disk IO. Typing, mode switches and newer reads invalidate the pending result. Read errors retain text and permit another file. Valid content is applied only to the same active product. No public DOM event bus or stable CSS/selector API is promised.

The inquiry UI separately reports sending / accepted (valid 201 receipt) / rejected
(400/413/429) / unconfirmed. Unknown results and conflicts disable another POST in
that page. No automatic resend. This is not durable deduplication: another tab or
reload can resend. The upstream must atomically bind requestId to payload and saved
receipt, reject conflicting payloads and provide reconciliation. That upstream
implementation is outside this repo and was not verified or changed here.

## Compatibility

- Node: >=22 native ESM, TextEncoder, String.isWellFormed; no TS build or npm install.
- Browser: modern ESM, Blob/object URLs, File.arrayBuffer, TextDecoder fatal mode, Map, String.isWellFormed and
  MutationObserver. Exact tested Chrome/OS are in the verification report; Safari,
  iPhone and older engines remain BLOCKED unless measured. No polyfills shipped.
- JavaScript off: product descriptions, original evidence and setup links remain
  usable; interactive sample editing/export requires JavaScript.
- A frozen pre-follow-up v1 fixture (`tests/fixtures/sample-v1-ja.md`) protects the existing export format. Complete valid v1 documents are unchanged; incomplete export objects now fail instead of silently inserting an example. New `decodeDraft` is additive.
- Source catalog exports are retained. New document v1 changes that break input,
  errors or export format require a new document version and explicit migration.
  UI/DOM, inquiry adapter, and catalog wording remain experimental.
- Exports are text; no native Mac app compatibility, AI correctness, actual external
  persistence, or six-product interoperability is claimed.

Standards/references checked 2026-09-19: [MIT](https://opensource.org/license/mit),
[W3C reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html),
[VS Code Markdown workflow](https://code.visualstudio.com/docs/languages/markdown).
These establish license text, a reflow criterion and a comparison workflow; they
are not evidence that this implementation meets WCAG or outperforms VS Code.

The byte decoder follows the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/#interface-textdecoder) (checked 2026-09-19; retrieved snapshot identity a985b62a9b45c17da3e17a9f0a0b4e30c34c4a8a). The export uses [CommonMark 0.31.2 blockquotes](https://spec.commonmark.org/0.31.2/#block-quotes); no custom renderer was added.
