// Facts shown on the site. Company facts must match dorsalia-website/src/data/site.ts (登記).
export const company = {
  nameJa: '合同会社Dorsalia Arcs',
  nameEn: 'Dorsalia Arcs LLC',
  representative: '代表社員 岩渕 貴洋',
  address: '〒103-0022 東京都中央区日本橋室町1丁目11番12号 日本橋水野ビル7階',
  url: 'https://dorsaliaarcs.com',
};

export const contact = {
  supportEmail: 'support@ioby.net',
  phone: '050-5586-3492',
};

export const paths = {
  home: '/',
  iobyclock: '/iobyclock/',
  privacy: '/privacy/',
  iobyclockPrivacy: '/iobyclock/privacy/',
  tokushoho: '/tokushoho/',
  iobyclockFontLicense: '/iobyclock/fonts/LICENSE.txt',
};

// Microsoft Store listing (released 2026-11). The iObY Clock LP buttons read it:
// null shows "近日公開", a URL turns them into links.
export const iobyclock = {
  storeUrl: 'https://apps.microsoft.com/detail/9P72DPB3Q5HK' as string | null,
};
