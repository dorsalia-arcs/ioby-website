# ioby-website

iObY のサイト [ioby.net](https://ioby.net) のソースです。Astro で作り、GitHub Pages で公開しています。
運営は合同会社Dorsalia Arcs です。

> **`main` に push すると、そのまま ioby.net に公開されます**（GitHub Actions が 1 分ほどでデプロイ）。
> push の前に、手元で `npm run build` が通ることと、表示を確かめてください。

## 手元で動かす

Node.js 22.12 以上が必要です。

```sh
npm install
npm run dev       # http://localhost:4321/ で確認しながら編集できる
npm run build     # 公開と同じものを dist/ に作る（push の前に必ず通す）
npm run preview   # dist/ の中身を確認する
```

## ページとファイルの場所

| URL | ソース | メモ |
|---|---|---|
| `/` | `src/pages/index.astro` | トップ |
| `/iobyclock/` | `src/iobyclock-lp/index.html`（`src/pages/iobyclock/index.astro` が読み込む） | iObY Clock の LP（下の「LP の直し方」） |
| `/iobyclock/privacy/` | `src/pages/iobyclock/privacy/index.astro` | プライバシーポリシー（日本語・英語） |
| `/tokushoho/` | `src/pages/tokushoho/index.astro` | 特定商取引法に基づく表記 |
| 404 | `src/pages/404.astro` | |
| `/tkclock/`・`/tkclock/privacy/` | `astro.config.mjs` の `redirects` | 旧 URL。新しい URL へ転送している |

- 共通のヘッダー・フッター・見た目: `src/layouts/BaseLayout.astro`（LP 以外のページ）
- 会社名・連絡先・電話番号・Store の URL など: `src/data/site.ts`（ここを直せば全ページに反映される）
- 画像などの素材: `public/`（ロゴは `public/ioby-logo.svg`）

## LP の直し方（/iobyclock/）

LP は、デザイナー（大山滉大さん）の HTML をもとに、岩渕さんの指示した修正（製品名・価格・ロゴ・フッターのリンク・動作環境と FAQ の節など）を加えたものです。

- 中身は `src/iobyclock-lp/index.html` を**直接直します**。見た目・構成・文言は、岩渕さんの指示がある箇所以外は変えないでください
- その中の `%%STORE_URL%%`・`%%PRIVACY%%` などの目印と `<!--soon-->…<!--/soon-->` の囲みは、ビルドのときに `src/data/site.ts` の値に置き換わります（`src/pages/iobyclock/index.astro`）。目印は消さないでください
- Microsoft Store の URL が決まったら `src/data/site.ts` の `iobyclock.storeUrl` に入れると、ボタンがリンクになり「近日公開」の表示が消えます
- 画像・動画・書体は `public/iobyclock/` にあります

## 守ってほしいこと

- **`/iobyclock/privacy/` と `/tokushoho/` の URL は変えない。** アプリ本体と各ストア（Microsoft Store・Google Play・App Store）に登録しています。旧 URL `/tkclock/` の転送も消さないでください
- **プライバシーポリシー・特商法の文面を変えるときは、先に岩渕さんに確認する。** 改定したら、ポリシー末尾の「最終改定日」（ファイル先頭の `updatedJa`・`updatedEn`）も直す
- **製品や権利の帰属を言い切る文言は書かない**（扱いを協議中のため）。販売者の表記は「合同会社Dorsalia Arcs」のまま
- 価格は ￥330
- 外部のスクリプト・アナリティクス・CDN は入れない。npm の依存を増やすときは先に相談する
- リポジトリは公開されています。パスワードやキーなどの秘密情報はコミットしない
- LP の背景の写真・動画は Pexels の素材、書体は SIL OFL 1.1（全文は `public/iobyclock/fonts/LICENSE.txt`）。素材を差し替えるときは出所を確かめる

`CLAUDE.md` は Claude Code（AI エージェント）向けのメモです。中に出てくる `G:\マイドライブ\…` は岩渕さんの手元の資料なので、ほかの人は開けません。

## 連絡先

わからないことは岩渕さんへ。サイトの問い合わせ先は support@ioby.net です。
