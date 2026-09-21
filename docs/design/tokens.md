# Token contract

正本はCSSの`:root`とレイヤーのスコープ変数。このファイルは索引であり、新しい指定ではない。
値を変えるときはCSS側を直し、ここを更新する。

このサイトには**2系統**ある。混ぜない。

| 系統 | 配信されるページ | 正本 |
|---|---|---|
| showcase | トップ（日英）、6製品ページ（日英） | `public/assets/showcase.css`の`:root` + 追記される各層 |
| site | プロダクト一覧、企業向け支援、開発記録、ラボについて、相談、プライバシー、404 | `public/assets/site.css`（`@import`で各層を読む） |

## showcase系（トップ・製品ページ）

| 分類 | 変数 | 値 | 役割 |
|---|---|---|---|
| Color | `--paper` | `#f5f4ef` | 背景 |
| Color | `--surface` | `#fff` | カード・前面 |
| Color | `--ink` | `#20231f` | 本文 |
| Color | `--muted` | `#62655e` | 補足・注記 |
| Color | `--rule` | `#d9dbd3` | 罫線 |
| Color | `--accent` | `#294536` | 主操作のhover・強調（深緑） |
| Color | `--stage` | `#181c19` | 実演パネルなどの濃色面 |
| Layout | `--measure` | `1280px` | コンテンツ最大幅（`.container`は`min(--measure, 100% - 96px)`） |

最終層（`home-flagship.css` / `signature-scene.css`）が足したスコープ変数:

| 変数 | 値 | 役割 |
|---|---|---|
| `--rm-line` | `#dbdcd2` | トップの罫線 |
| `--rm-soft` | `#eeede6` | FAQ帯の面 |
| `--rm-dim` | `#5d635a` | トップの補足文字 |
| `--rm-mono` | `ui-monospace, SFMono-Regular, Consolas, monospace` | 番号・ラベル |

シーン内の固定色（濃色面の上なので`:root`を使わない）: 面`#121d21`、枠`#2a3b3f`、
本文`#eef1ea`、補足`#b7c4bb`、強調`#e3b575`（実演CTAと共通の琥珀）。

## site系（その他のページ）

`docs/DESIGN.md`が方針の正本。背景`#f6f5f0`、文字`#20251f`、作図のアクセント`#e24b2b`、
文字のアクセント`#bd3519`、企業向けパネル`#25372e`、コンテンツ幅`1248px`。

## Type

リモートフォントを読み込まない。フォントファイルも同梱しない。

```
Inter, "Helvetica Neue", "Hiragino Kaku Gothic ProN", "Noto Sans CJK JP", Meiryo, sans-serif
```

見出しは`clamp()`で幅に追従させる（例: トップのh1は`clamp(38px, 5.3vw, 80px)`、
`letter-spacing:-.058em`、`font-weight:650` — 下記「Homepage editorial layer」が正本）。等幅は`--rm-mono`。

日本語の本文段落は語中で改行させない。`overflow-wrap:normal; word-break:normal;`に加えて
`word-break:auto-phrase`を重ねる（非対応ブラウザは前者にフォールバックする）。

## Spacing / Shape / Motion / Layout

- Spacing: セクションは`clamp(54px, 6vw, 96px)`、要素間は`clamp(7px, .7vw, 22px)`程度。`clamp()`を既定にする。
- Shape: 角丸はほぼ使わない（`border-radius:0`）。境界は1pxの罫線で表す。
- Elevation: 影は控えめに1箇所だけ（例: 実演パネル`0 30px 64px -46px #101d1a`）。
- Motion: 状態遷移`.45s〜.5s`、オーブなど大きな動き`.9s〜1s`。`prefers-reduced-motion:reduce`で
  必ず無効化し、最終状態を静止表示する。
- Breakpoints: showcase系は1080 / 900 / 760 / 650 / 380px、site系は1150 / 900 / 650px。

## 運用

- 一度しか使わない装飾値をグローバルトークンへ昇格させない。
- 0、auto、100%、calc、必要な光学補正は「トークン違反」ではない。
- 新しい層は、既存層に詳細度で負けないスコープ（`body[data-<layer>]`か固有クラス名）を持たせる。

## Guided sample follow-up

`lab-explorer.css` keeps the existing paper/ink/rule/accent tokens. Secondary sample buttons now use the existing 7px component radius, 12px text, 1.6 line-height, 10×12px padding and minimum 44px hit height; focus remains a 3px outline. Pending file-read text uses ink and font-weight 600. No new animation or remote assets. The non-editable illustration is hidden only while guided editing is active; switching modes restores it. These are project values, not measured VoiceOS/PLAUD values.

## Homepage task picker

`public/assets/home-task-picker.css`: sage surface #edf1e9, ink #24372d, supporting
text #53645a, rule #cbd5c8, focus #245c3d; title25–34px, task18–22px, result/product13px,
auxiliary12px. Padding20–36px, linked-row padding22px, 18px outer radius. Native links;
background response150ms, none under reduced motion. No automatic scene animation.

## Homepage editorial layer

`public/assets/home-editorial.css`（`writeHomeFlagship`が3番目の層として追記）。
2026-09-22、ObsidianUIのトップを参照して構成と型階層のみ採り入れた層。配色は変更していない。

| 対象 | 変更前 | 変更後 |
|---|---|---|
| トップのh1 | `clamp(37px,4.35vw,63px)` / `-.052em` / 600 / lh 1.24 | `clamp(38px,5.3vw,80px)` / `-.058em` / 650 / lh 1.12 |
| `.rm-band-head h2` | `clamp(27px,3.1vw,42px)` / lh 1.42 / 560 | `clamp(28px,3.5vw,50px)` / lh 1.24 / 650 |
| `.lab-collection-heading h2` | `clamp(30px,3.5vw,46px)` / lh 1.4 / 550 | `clamp(28px,3.5vw,50px)` / lh 1.24 / 650 |
| `.rm-faq-intro h2` | 継承 | `clamp(27px,3.2vw,45px)` / lh 1.26 / 650 |
| `.lab-work-with h2` | 継承 | `clamp(30px,3.9vw,56px)` / lh 1.2 / 650 |
| `.sig-marquee-list b` | 13px | 14px / `-.03em` |

新しい部品:

- `.rm-hero-badge` — 事実のピル。`border-radius:999px`（≤700pxでは13px）、`--surface`面、
  1px `--rm-line`、11px `--rm-mono`、`--rm-dim`。マーカーの●は`--accent`の8px。
  角丸999pxはこれと、既存のヘッダーCTA・締めCTA（`.button`）を含めて使っている。
  面やカードを丸めないという方針は変えていない。
- `.rm-hero-evidence` — 11px `--rm-mono`のドット区切り行。ドットは`--accent`を`opacity:.65`で。
- `.rm-task-go` / カード主リンクの`::after` — 34px（≤700pxで30px）と30pxの丸枠。
  hoverで`#245c3d` / `--accent`に反転。`prefers-reduced-motion`で遷移なし、
  `forced-colors`で枠を`CanvasText`に。
- ヒットエリア: `.lab-card-actions>a` と `.rm-access-link` を`min-height:44px`へ。

`--task-*`（task picker）と showcase系の`:root`は変更していない。
