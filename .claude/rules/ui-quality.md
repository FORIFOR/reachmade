---
paths:
  - "src/**/*.mjs"
  - "public/assets/**/*.{css,mjs,js}"
  - "scripts/build*.mjs"
  - "scripts/serve.mjs"
  - "docs/design/**"
---
# UI engineering rules

このリポジトリはReact/Viteではなく、`src/*.mjs`がビルド時にHTMLを組み立て、
`public/assets/*.css`と`*.mjs`が層として`showcase.css` / `showcase.mjs`へ追記される構成。
「コンポーネント」に当たるのはこの層である。

## Design contract
- brief.mdとacceptance.mdを実装の基準にする。ユーザーの明示指示を最優先する。
- ブランド名を隠してもプロダクトの目的が伝わるコンテンツ・構成を選ぶ。
- 情報構造・日本語コピー・操作導線を、背景装飾より先に直す。
- `:root`の既存トークン（tokens.md）を再利用する。0、100%、auto、calc、必要な光学補正は禁止しない。
- トークン外の値が必要なら目的を説明し、再利用するものだけ昇格させる。
- **層の衝突に注意する。** 新しいCSS層は後から追記されるが、セレクタの詳細度が低ければ
  先行層に負ける。実際にこれでトップのファーストビューが壊れた（2026-09-19）。
  新しい層は、自前のクラス名か、`body[data-<layer>]`付きの十分な詳細度で確定させる。
- 標準部品・既存のアクセシブルな部品を優先し、独自部品は必然性がある場合に限る。

## Interaction contract
- 主操作には結果が予測できる具体的なラベルをつける。
- 状態は対象に必要なものを列挙し、不要な状態を水増ししない。
- loading/empty/error/success/disabled/focus、長い日本語、通信失敗を適宜確認する。
- 外部操作が必要な機能はデモと本番を区別し、デモを実行済みと偽らない。
- キーボード操作、フォーカス可視性、モバイルメニューの開閉と復帰先を確認する。
- reduced-motionは対応必須。通常motionは別に実際に確認する。
- WebKitのモバイル幅確認と、実機iPhoneのSafari確認を混同しない。

## Evidence contract
- スクリーンショットを保存するだけでなく画像として開いて読む。
- DOM/アクセシビリティツリーだけで見た目の完成を判断しない。
- 画像はサイズ、URL、状態、データ条件、撮影環境を記録する（`npm run ui:capture`が
  `artifacts/ui/capture.json`へ残す）。
- 主張は測定、画像観察、推定、未確認のいずれかを区別する。
- UIを変更したら最新画像を取り直し、レビューとテストをやり直す。
- **ローカルのheadless環境では`requestAnimationFrame`が進まないことがある。**
  時間経過で進む演出を「確認済み」と書く前に、どの環境で何を観測したかを明記する。
- **登場アニメーションの途中フレームを、完成した見た目と取り違えない。**
  `lab-arrive`は`opacity:.6`から始まるため、フレームが進まない環境では
  「薄い section」が撮れる。実際にこれで英語ページの締めCTAが薄いという
  誤った証拠が生まれた（2026-09-19）。**色やコントラストを判断するための撮影は
  `prefers-reduced-motion: reduce`で行う**（`.lab-entered{animation:none!important}`が効き、
  確実に最終状態が写る）。`npm run ui:capture`の全体撮影はこの条件で撮っている。
- **アンカー付きURL（`/#faq`など）での撮影は証拠にならない。**
  `html{scroll-behavior:smooth}`はフレームを必要とするため、headlessでは黙って
  ページ最上部が返る。下部セクションは全体撮影から切り出す。
