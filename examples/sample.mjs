/** node examples/sample.mjs > sample.md — stdout only, no network or browser. */
import {createDraft, exportDraft} from '../public/assets/sample-draft.mjs';
const draft = createDraft({product:'genie', language:'ja', text:'見出し：相談を、次の一歩に。\n\n説明：これは手動編集した評価用サンプルです。'});
process.stdout.write(exportDraft(draft).text);
