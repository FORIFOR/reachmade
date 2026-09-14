# Reachmade Lab / Design

## Direction

静かなプロダクト研究所。オフホワイト、墨に近い文字、企業向けセクションの深緑、朱色の小さなアクセント。製品と事業を混同しない二層構成。

意味のない発光・紫グラデーション・架空のKPI・ロゴ列は置かない。大きな余白と読みやすい日本語を基本とし、すべてを同じカードへ押し込まない。

## Tokens

- Background: `#f6f5f0`
- Ink: `#20251f`
- Accent artwork: `#e24b2b`
- Accent text: `#bd3519`
- Enterprise panel: `#25372e`
- Content width: 1248px
- Body: system font; Japanese falls back to Hiragino/Yu Gothic/Noto CJK.
- No remote fonts; no font files included.
- Breakpoints: 1150px / 900px / 650px. Layout tested at 320, 390, 768, 1440, 1920 CSS px.

## Signature

Reach / madeという二つの言葉から、到達する幅が伸びていく形を構成。トップのオレンジの形はブランド用の説明図で、実測データの棒グラフではない。

トップと製品一覧のパネルは、各プロジェクトで公開されている検証記録から選んだ実画面を優先して表示する。Reachmadeが新たに録画・再検証したものではないため、画面下に出典を示す。プレビュー未登録の新製品は、公開資料に基づく設計要約へフォールバックする。デモボタンは行き先に合わせて「サンプルログを検証する」「45秒の実演を見る」などの文言にする。

## Interaction

- Home: no autoplay, no microphone prompts, no canvas animation.
- Products: category buttons with aria-pressed and announced count; all products visible without JS.
- Mobile nav: explicit menu toggle, Escape closes and restores focus, outside click closes.
- Product conditions: native details/summary.
- Contact: browser-only draft; copy requires click; clipboard permission failure has a manual-copy fallback. Never says sent.
- Language: JP/EN switch retains corresponding page.
- prefers-reduced-motion and keyboard focus style included.

## Accessibility boundaries

Tests check structure, visible content, overflow, menu focus and state. They are not a WCAG certification. Screen-reader users, real iPhone/Safari, zoom and operating system font differences still require manual review before marketing launch.
