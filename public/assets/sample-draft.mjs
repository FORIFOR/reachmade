/** Portable sample-document contract v1. No DOM, IO, AI, or persistence. */
import {IDS, sampleResult} from './lab-core.mjs';

export const DRAFT_VERSION = 1;
export const MAX_DRAFT_CHARS = 4000; // JavaScript UTF-16 code units; never truncate.
export const MAX_FILE_BYTES = 32768;
export class DraftError extends Error {
  constructor(code) { super(code); this.name = 'DraftError'; this.code = code; }
}
const header = (product, language) => `> Reachmade guided sample · v${DRAFT_VERSION} · ${product} · ${language}\n> ${language === 'ja' ? '操作の評価用サンプル。手動編集した文章であり、新しいAI生成・外部実行・実アプリへの保存ではありません。' : 'Evaluation sample, edited by hand. Not a new AI generation, external execution, or storage in the actual app.'}\n\n`;

export function createDraft(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.keys(input).some(k => !['product', 'language', 'text'].includes(k)) ||
      !IDS.includes(input.product) || !['ja', 'en'].includes(input.language)) throw new DraftError('INVALID_INPUT');
  const text = input.text === undefined
    ? sampleResult(input.product, input.language).lines.join('\n\n')
    : input.text;
  if (typeof text !== 'string') throw new DraftError('INVALID_INPUT');
  const normalized = text.replace(/\r\n?/g, '\n');
  if (!normalized.trim()) throw new DraftError('EMPTY');
  if (normalized.length > MAX_DRAFT_CHARS) throw new DraftError('TOO_LONG');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(normalized) || !normalized.isWellFormed()) throw new DraftError('INVALID_TEXT');
  return Object.freeze({version: DRAFT_VERSION, product: input.product, language: input.language, text: normalized});
}

export function exportDraft(draft) {
  if (draft?.version !== DRAFT_VERSION) throw new DraftError('UNSUPPORTED_VERSION');
  if (typeof draft.text !== 'string' || Object.keys(draft).some(k => !['version', 'product', 'language', 'text'].includes(k))) throw new DraftError('INVALID_INPUT');
  const value = createDraft({product: draft.product, language: draft.language, text: draft.text});
  return Object.freeze({filename: `reachmade-${value.product}-sample.md`, mimeType: 'text/markdown;charset=utf-8',
    text: header(value.product, value.language) + value.text});
}

/** Decode a local UTF-8 file without silently replacing malformed bytes. */
export function decodeDraft(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new DraftError('INVALID_INPUT');
  if (bytes.byteLength > MAX_FILE_BYTES) throw new DraftError('TOO_LARGE');
  let text;
  try { text = new TextDecoder('utf-8', {fatal: true}).decode(bytes); }
  catch { throw new DraftError('INVALID_ENCODING'); }
  return importDraft(text);
}

/** Reopen our ordinary Markdown export, including edits made in a text editor. */
export function importDraft(text) {
  if (typeof text !== 'string') throw new DraftError('INVALID_INPUT');
  if (new TextEncoder().encode(text).length > MAX_FILE_BYTES) throw new DraftError('TOO_LARGE');
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const match = /^> Reachmade guided sample · v(\d+) · ([a-z-]+) · (ja|en)\n/.exec(normalized);
  if (!match) throw new DraftError('INVALID_FILE');
  if (Number(match[1]) !== DRAFT_VERSION) throw new DraftError('UNSUPPORTED_VERSION');
  const [, , product, language] = match;
  if (!IDS.includes(product)) throw new DraftError('INVALID_FILE');
  const prefix = header(product, language);
  if (!normalized.startsWith(prefix)) throw new DraftError('INVALID_FILE');
  return createDraft({product, language, text: normalized.slice(prefix.length)});
}
