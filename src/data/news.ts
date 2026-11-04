// NEWS articles. Each one gets a page at /news/<slug>/ (src/pages/news/[slug].astro).
// The cards on the top page's NEWS panel (src/ioby-top/index.html) are written by hand: update them too.
export interface NewsItem {
  slug: string;
  date: string; // YYYY-MM-DD
  tag: string;
  title: string;
  body: string[]; // paragraphs
}

export const news: NewsItem[] = [
  {
    slug: 'site-renewal',
    date: '2026-11-04',
    tag: 'お知らせ',
    title: 'Webサイトをリニューアルしました',
    body: [
      'iObYのWebサイトをリニューアルしました。',
      '資料作成・データ整理・業務効率化のサポートと、Windows向けアプリ「iObY Clock」をご紹介しています。',
      'お困りごとがあれば、お気軽にご相談ください。',
    ],
  },
];

export const newsPath = (item: NewsItem) => `/news/${item.slug}/`;
export const newsDate = (item: NewsItem) => item.date.replaceAll('-', '.');
