/** One practical article, localized for the existing owned-guide routes. */
export function oathraReadinessGuide(lang) {
  const ja = lang === 'ja';
  const title = ja ? 'AI電話・音声エージェント導入前の確認事項' : 'Before adopting an AI phone or voice agent';
  const description = ja
    ? '予約成立・失敗・確認待ちの分け方、発信前の承認、録音・データ保護、既存システム連携を整理。Oathraの公開デモを参考に、導入相談までに決めることをまとめます。'
    : 'Define booking outcomes, approval before calls, recording and data protection, and system integration. A practical checklist informed by Oathra’s public demonstrations.';
  const body = ja ? `
<p class="lead">電話を任せる前に、「何をもって完了とするか」と「誰が確認するか」を決めましょう。予約受付・日程調整を試作する担当者向けの確認事項です。</p>
<p class="note">Oathraの公開資料をもとにした設計の整理です。稼働済みの電話予約サービスや顧客事例の紹介ではありません。</p>
<nav class="chapters" aria-label="確認事項の目次"><a href="#outcomes">結果の判定</a><a href="#approval">承認と引き継ぎ</a><a href="#data">録音・データ</a><a href="#integration">システム連携</a><a href="#consult">相談の準備</a></nav>
<section id="outcomes"><h2>1. 会話の合意と、予約の登録を分ける</h2>
<p>「予約できました」というAI自身の発言だけで完了にしない設計が必要です。相手が了承した日時・人数・条件と、予約台帳への登録を別々に確認します。</p>
<ul><li><strong>予約成立：</strong>相手の合意と、業務で決めた登録確認が揃った状態。確認した担当者・時刻・予約番号など、必要な根拠を残します。</li><li><strong>失敗：</strong>満席・条件不一致など、成立しなかった根拠がある状態。代替案の承認か、人への引き継ぎに進みます。</li><li><strong>確認待ち：</strong>聞き取れない、途中で切れた、登録の返答がない状態。失敗と決めつけて再実行せず、先に照会して二重予約を防ぎます。</li></ul>
<p class="note">これは導入時に決める業務上の区分です。Oathraが検証するのは相手側の発言に基づく会話上の合意までで、店舗システムへの登録は別工程です。</p></section>
<section id="approval"><h2>2. 発信前の承認と、人に戻す条件を決める</h2>
<p>目的・相手・日時・人数・予算上限・変更できる条件を、発信前に担当者が確認します。条件変更、聞き取りの不一致、相手からの質問に答えられない場合は、担当者へ戻すルールを用意します。</p>
<p>キャンセルや変更も承認の対象です。引き継ぐときは、会話の要点、相手が同意した条件、未確認の項目、次に確認する担当者を残します。</p></section>
<section id="data"><h2>3. 録音とデータの扱いを先に決める</h2>
<p>AI応対や録音を相手にどう伝え、必要な同意をどう確認するかを整理します。音声・文字起こし・連絡先について、保存する項目、保存先、保持期間、閲覧できる人、削除方法を決めます。</p>
<p>音声認識・音声合成・モデルの各処理先に何を送るかも確認します。試作は架空のデータから始め、実データを使う前に社内の取扱基準と照合してください。</p></section>
<section id="integration"><h2>4. 既存システムとの境界を決める</h2>
<p>予約台帳・CRMのどれを正本にするか、空き状況を読む方法、登録する権限、登録後に結果を照会する方法を確認します。APIがない場合は、人が転記・照合する工程も選択肢です。</p>
<p>応答が途絶えたときの照会先と、同じ依頼を重複登録しない方法を決めます。Oathraの公開説明はCRMへの自動反映を示していません。連携の可否は対象システムごとに確認が必要です。</p></section>
<section id="examples"><h2>公開デモで確認できること</h2>
<p><a href="/products/oathra/#experience-film">24秒の利用イメージ動画</a>と<a href="/products/oathra/#concept-demos">用途別の構想デモ</a>で、依頼から結果確認までの流れを見られます。いずれも実電話で成立した予約の証拠ではなく、構想デモでは実際の発信・予約を行いません。</p>
<p><a href="/products/oathra/#scope">現在の検証範囲と公開資料</a>では、会話上の合意と実システム登録の境界を確認できます。100件の実電話検証は未完了で、紹介映像だけから稼働品質を判断することはできません。</p></section>
<section id="consult"><h2>5. 相談には、この5点を用意する</h2>
<ol><li>任せたい業務と、現在の担当者の手順</li><li>件数の目安・受付時間・対応言語</li><li>成立・失敗・確認待ちの判定条件と、引き継ぎ先</li><li>連携したいシステムの種類と、APIの有無</li><li>録音・保存・削除に関する制約と、試作で確認したいこと</li></ol>
<p>まずは業務の概要だけで相談できます。顧客名、電話番号、通話音声、認証情報などは送らないでください。</p>
<a class="button" href="/contact/#product-oathra">AI電話の導入・試作を相談する</a></section>` : `
<p class="lead">Before delegating a call, define what counts as complete and who verifies it. Use this checklist when prototyping booking or scheduling workflows.</p>
<p class="note">This is design guidance based on Oathra’s public materials, not a deployed booking service or customer case study.</p>
<nav class="chapters" aria-label="Checklist contents"><a href="#outcomes">Outcomes</a><a href="#approval">Approval and handoff</a><a href="#data">Recording and data</a><a href="#integration">System integration</a><a href="#consult">Prepare a consultation</a></nav>
<section id="outcomes"><h2>1. Separate a spoken agreement from a saved booking</h2>
<p>The agent saying “booked” is insufficient. Check the other party’s agreement on the date, party size and conditions separately from the entry in the booking system.</p>
<ul><li><strong>Confirmed booking:</strong> the agreement and the registration checks required by your workflow are complete. Keep the necessary evidence, such as the verifier, time and booking reference.</li><li><strong>Failed:</strong> there is evidence the booking was not made, such as no availability or incompatible conditions. Seek approval for an alternative or hand over to a person.</li><li><strong>Awaiting verification:</strong> speech is unclear, the call ends early, or the registration response is missing. Check the result before retrying to avoid a duplicate booking.</li></ul>
<p class="note">These are workflow categories to define during implementation. Oathra verifies spoken agreement from the other party’s words; registration in a business system is a separate step.</p></section>
<section id="approval"><h2>2. Define approval before calls and human handoff</h2>
<p>Have a responsible person review the purpose, recipient, date, party size, spending limit and negotiable conditions before a call. Define when changed conditions, misunderstood speech or unanswered questions require human review.</p>
<p>Changes and cancellations also need approval. A handoff should include a conversation summary, agreed conditions, unresolved items and the next responsible person.</p></section>
<section id="data"><h2>3. Decide how recording and data will be handled</h2>
<p>Plan how to disclose AI handling and recording, and how to confirm any required consent. For audio, transcripts and contact details, define the fields kept, storage location, retention period, access and deletion process.</p>
<p>Check what goes to speech recognition, speech synthesis and model providers. Start with fictional data and review internal handling requirements before using real data.</p></section>
<section id="integration"><h2>4. Set the boundary with existing systems</h2>
<p>Choose the authoritative booking system or CRM. Check how to read availability, obtain write permission and verify a saved result. If no API is available, manual entry and reconciliation may be an option.</p>
<p>Define where to check an uncertain result and how to prevent duplicate submissions. Oathra’s public materials do not demonstrate automatic CRM updates. Integration must be assessed for each target system.</p></section>
<section id="examples"><h2>What the public demonstrations show</h2>
<p>The <a href="/en/products/oathra/#experience-film">24-second introduction</a> and <a href="/products/oathra/#concept-demos" hreflang="ja">concept demos (Japanese)</a> illustrate the path from request to result review. Neither is evidence of a booking completed over a real phone call. The concept demos do not place calls or make bookings.</p>
<p>Review the <a href="/en/products/oathra/#scope">current validation scope and public sources</a> for the boundary between spoken agreement and system registration. The 100-real-call evaluation is incomplete. An introduction film alone cannot establish operating quality.</p></section>
<section id="consult"><h2>5. Bring these five details to a consultation</h2>
<ol><li>The task to delegate and the current human workflow</li><li>Approximate volume, operating hours and languages</li><li>Confirmation, failure and pending criteria, plus a handoff owner</li><li>The types of systems involved and whether APIs are available</li><li>Recording, retention and deletion constraints, and what the prototype should test</li></ol>
<p>A high-level workflow description is enough to start. Do not send customer names, phone numbers, call recordings or credentials.</p>
<a class="button" href="/en/contact/#product-oathra">Discuss an AI phone workflow</a></section>`;
  return { product: 'oathra', suffix: 'guide', title, description, eyebrow: 'OATHRA / IMPLEMENTATION CHECKLIST', body };
}
