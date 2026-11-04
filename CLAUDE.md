# ioby-website（ioby.net）

| 一次情報 | 場所 |
|---|---|
| TKclock のプライバシー・特商法の根拠 | `../ioby-clock/docs/販売計画.md` §6-2 |
| iObY の方針・URL の決定事項 | `G:\マイドライブ\ぶっちーメモ\20_Projects\iObY\現在地サマリー.md`（読むだけ） |
| 会社情報・DNS | `G:\マイドライブ\ぶっちーメモ\20_Projects\DorsaliaArcs\法人の基本と計画.md` §3・同じフォルダの `ドメインと開発基盤.md` §14（読むだけ） |

## いま有効なルール

- Astro + GitHub Pages（`.github/workflows/deploy.yml`、main への push で公開）。リポジトリ `dorsalia-arcs/ioby-website`（public）。push はワークスペース CLAUDE.md の GitHub 節の手順で `takahiro-iwabuchi` に切り替えて行う
- 製品名は **iObY Clock**（2026-10-10 に TKclock から改名。URL も `/tkclock/` → `/iobyclock/` に変更し、旧 URL は `astro.config.mjs` の redirects で転送）。
- `/iobyclock/` は大山さんの LP の完全再現＋岩渕さん指示の追加。中身は `src/iobyclock-lp/index.html` を直接直す（2026-10-20 に取り込みスクリプトをやめた。大山さんから丸ごとの新しい版が届いたら、岩渕さんの修正を手でかけ直す）。見た目・構成・文言は指示のあった箇所以外変えない。追加物は LP の既存クラス・配色で組み、製品紹介の節は入れない。`%%NAME%%` の目印と `<!--soon-->` の囲みは `src/pages/iobyclock/index.astro` が site.ts の値で置き換える
- LP のストアのボタンの行き先は `src/data/site.ts` の `iobyclock.storeUrl`（2026-11-03 に Microsoft Store の掲載ページ https://apps.microsoft.com/detail/9P72DPB3Q5HK を設定。null にすると押せなくなり「Microsoft Store で近日公開」の注記が出る。Google Play・App Store は未公開）。法務リンク・連絡先・会社名も site.ts から `src/pages/iobyclock/index.astro` が差し込む。価格は ￥330（2026-10-12 改定）、対応 OS 表記は「Windows 11（64bit）」のまま（岩渕さん決定）
- トップ `/` はデザイナーのモック（`_design/ioby-site/ioby-website-03/`、デザイン03）の再現。中身は `src/ioby-top/index.html` を直接直し、素材は `public/assets/`。モックの `styles.css` は手を入れず、追加のスタイルは `public/assets/css/ioby.css` に書く。`%%NAME%%` の目印は `src/pages/index.astro` が site.ts の値で置き換える。指示のあった箇所以外、構成・文言は変えない。業務効率化に AI 活用サポート・ツール開発を含める（岩渕さん指示）
- それ以外のページ（ポリシー・特商法・404）の共通の見た目は `src/layouts/BaseLayout.astro`（トップの CSS を読み込み、ヘッダー・フッターはトップと同じ作り。片方を直したらもう片方も直す）、会社情報・連絡先は `src/data/site.ts` に集約する
- LP の背景の写真 4 枚・動画 4 本（`public/iobyclock/media/`）は Pexels の素材（2026-10-10 大山さんに確認済み）。差し替えるときも出所を確かめる
- LP の書体 `public/iobyclock/fonts/tk-*.woff2` は TKclock 同梱 OFL 書体のサブセット。ライセンス全文は同じフォルダの `LICENSE.txt`
- **`/iobyclock/privacy/` と `/tokushoho/` の URL は変えない**（exe と Microsoft Store に登録するため）。旧 `/tkclock/`・`/tkclock/privacy/` の転送は消さない（旧 URL を埋め込んだビルドがあるため）
- サイト全体のプライバシーポリシーは `/privacy/`（`src/pages/privacy/index.astro`、2026-11-04 制定）。会社のサイトのポリシー（`dorsalia-website/src/texts/privacy.md`）をもとにしているので、改定するときは両方の食い違いを確かめる。問い合わせフォームは送信でメールソフトを開く方式（`public/assets/js/main.js`）で、ポリシーの「1. 取得する情報」はこの方式を前提に書いてある。受付方法を変えたらポリシーも直す
- 問い合わせ先は `support@ioby.net`。電話番号は 050-5586-3492（`site.ts` の `contact.phone`）
- 権利の帰属先を断定する文言は書かない（大山さんと協議中）。規約・ポリシー・特商法の文面を変えるときは岩渕さんに確認する
- DNS はお名前メールのネームサーバーのまま。MX/SPF は触らない
