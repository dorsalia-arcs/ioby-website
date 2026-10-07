# ioby-website（ioby.net）

| 一次情報 | 場所 |
|---|---|
| TKclock のプライバシー・特商法の根拠 | `../TKclock/docs/販売計画.md` §6-2 |
| iObY の方針・URL の決定事項 | `G:\マイドライブ\ぶっちーメモ\20_Projects\iObY\現在地サマリー.md`（読むだけ） |
| 会社情報・DNS | `G:\マイドライブ\ぶっちーメモ\20_Projects\独立_DorsaliaArcs\現在地サマリー.md` §3・§14（読むだけ） |

## いま有効なルール

- Astro + GitHub Pages（`.github/workflows/deploy.yml`、main への push で公開）。リポジトリ `dorsalia-arcs/ioby-website`（public）。push はワークスペース CLAUDE.md の GitHub 節の手順で `takahiro-iwabuchi` に切り替えて行う
- `/tkclock/` は大山さんの LP を完全再現（文言・リンクも原文のまま。変更は大山さんの新しい版で行う）。`_design/tkclock-lp/`（非公開・git 管理外）に届いた HTML を `python tools/import-tkclock-lp.py` で取り込むと、埋め込みの素材が `public/tkclock/` に、base64 をファイル参照に置き換えただけの HTML が `src/tkclock-lp/index.html` に出る。この HTML は手で直さない
- それ以外のページ（トップ・ポリシー・特商法・404）の共通の見た目は `src/layouts/BaseLayout.astro`、会社情報・連絡先は `src/data/site.ts` に集約する
- LP の書体 `public/tkclock/fonts/tk-*.woff2` は TKclock 同梱 OFL 書体のサブセット。ライセンス全文は同じフォルダの `LICENSE.txt`
- **`/tkclock/privacy/` と `/tokushoho/` の URL は変えない**（exe と Microsoft Store に登録するため）
- 問い合わせ先は `support@ioby.net`。電話番号は 050 番号を取るまで「請求があった場合は遅滞なく開示」
- 権利の帰属先を断定する文言は書かない（大山さんと協議中）。規約・ポリシー・特商法の文面を変えるときは岩渕さんに確認する
- DNS はお名前メールのネームサーバーのまま。MX/SPF は触らない
