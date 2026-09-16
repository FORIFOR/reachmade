/** Public interface for page copy and entry points. Original copy remains separate. */
import { productNavigation as originalNavigation, improveCopy as originalCopy } from './site-content.mjs';
import { landingIds, landingRoute } from './product-landings.mjs';
export { contactDestination, productIndex, caseStudies, serviceExamples, profileProof } from './site-content.mjs';
export function improveCopy(original) {
  const copy = originalCopy(original);
  copy.ja.privacySections[0] = ['問い合わせの送信・保存', '問い合わせフォームの送信ボタンを押すと、お名前、返信先メール、任意の組織名、相談の対象・内容、同意、再送判定用ID、表示言語を同じドメインの受付経路に送信します。運営者の既存Google Cloud受付システムに保存し、問い合わせ対応に使います。入力内容をAIや広告・解析サービスへ送りません。受付番号は保存完了後に表示し、自動返信メールは送りません。受付側の保存期限設定は90日です。期限後の削除処理は非同期のため、正確な削除時刻を保証するものではありません。'];
  copy.en.privacySections[0] = ['Sending and storing an inquiry', 'Pressing Send transmits your name, reply email, optional organization, topic, message, consent, retry ID and language through the same-origin intake route to the operator’s existing Google Cloud inquiry system for follow-up. Form input is not sent to an AI, advertising or analytics service. A receipt is shown only after storage succeeds; no automatic email is sent. The intake retention setting is 90 days. Expired records are removed asynchronously, not at a guaranteed exact time.'];
  copy.ja.privacySections[1][1] = 'このサイト内の問い合わせは、画面に表示する運営者の受付へ送信します。代替フォーム・製品サイト・GitHubへのリンクは外部サービスです。移動後は、その送信先と情報の取り扱いを確認してください。';
  copy.en.privacySections[1][1] = 'On-site inquiries use the operator’s intake described beside the form. Fallback forms, product links and GitHub open external services. Check their destination and privacy information before submitting there.';
  return copy;
}
export function productNavigation(product, language) {
  const result = originalNavigation(product, language);
  if (landingIds.includes(product.id)) result.site = `https://reachmade.com${landingRoute(product.id,language)}`;
  if (product.id === 'genie') result.demo = result.demo.replace(/#demo$/, '#demos');
  return result;
}
