# ioby-website（ioby.net）

| 一次情報 | 場所 |
|---|---|
| TKclock のプライバシー・特商法の根拠 | `../TKclock/docs/販売計画.md` §6-2 |
| iObY の方針・URL の決定事項 | `G:\マイドライブ\ぶっちーメモ\20_Projects\iObY\現在地サマリー.md`（読むだけ） |
| 会社情報・DNS | `G:\マイドライブ\ぶっちーメモ\20_Projects\独立_DorsaliaArcs\現在地サマリー.md` §3・§14（読むだけ） |

## いま有効なルール

- Astro + GitHub Pages（`.github/workflows/deploy.yml`、main への push で公開）。リポジトリ `dorsalia-arcs/ioby-website`（public）。push はワークスペース CLAUDE.md の GitHub 節の手順で `takahiro-iwabuchi` に切り替えて行う
- 製品名は **iObY Clock**（2026-10-10 に TKclock から改名。URL も `/tkclock/` → `/iobyclock/` に変更し、旧 URL は `astro.config.mjs` の redirects で転送）。LP の表示名は取り込みスクリプトの NAME。
- `/iobyclock/` は大山さんの LP の完全再現＋岩渕さん指示の追加（取り込みスクリプトで適用）。見た目・構成・文言は指示のあった箇所以外変えない。追加物は LP の既存クラス・配色で組み、製品紹介の節は入れない。`_design/iobyclock-lp/`（非公開・git 管理外）の HTML を `python tools/import-iobyclock-lp.py` で取り込むと、素材が `public/iobyclock/` に、HTML が `src/iobyclock-lp/index.html` に出る。この HTML は手で直さない。岩渕さんの修正はスクリプトの TITLE・REMOVE・REPLACE・INSERT と、差し込む `src/iobyclock-lp/additions.css`・`sections.html` に置く（目印が見つからなければスクリプトが止まる）。公開する HTML からはコメント（HTML・CSS・JS。原文由来・追加分とも）をスクリプトが取り除く（`tools/strip_comments.py`）
- LP のストアのボタンの行き先は `src/data/site.ts` の `iobyclock.storeUrl`（null の間は押せず「Microsoft Store で近日公開」の注記が出る）。法務リンク・連絡先・会社名も site.ts から `src/pages/iobyclock/index.astro` が差し込む。価格は LP 原文どおり ￥320、対応 OS 表記は「Windows 11（64bit）」のまま（岩渕さん決定）
- それ以外のページ（トップ・ポリシー・特商法・404）の共通の見た目は `src/layouts/BaseLayout.astro`、会社情報・連絡先は `src/data/site.ts` に集約する
- LP の書体 `public/iobyclock/fonts/tk-*.woff2` は TKclock 同梱 OFL 書体のサブセット。ライセンス全文は同じフォルダの `LICENSE.txt`
- **`/iobyclock/privacy/` と `/tokushoho/` の URL は変えない**（exe と Microsoft Store に登録するため）。旧 `/tkclock/`・`/tkclock/privacy/` の転送は消さない（旧 URL を埋め込んだビルドがあるため）
- 問い合わせ先は `support@ioby.net`。電話番号は 050-5586-3492（`site.ts` の `contact.phone`）
- 権利の帰属先を断定する文言は書かない（大山さんと協議中）。規約・ポリシー・特商法の文面を変えるときは岩渕さんに確認する
- DNS はお名前メールのネームサーバーのまま。MX/SPF は触らない
