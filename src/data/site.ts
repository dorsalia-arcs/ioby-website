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
};

export const brand = {
  name: 'iObY',
  summary:
    'AIで作業を効率化し、そのぶん依頼者とのやり取りに時間を使うことを大切にしています。資料作成、AI活用のサポート、業務ツール「TKシリーズ」の開発を行っています。',
  points: ['資料・スライドの作成', 'AI活用のサポート', '業務ツール TKシリーズ（TKtask・TKclock）'],
};

export const paths = {
  home: '/',
  tkclock: '/tkclock/',
  tkclockPrivacy: '/tkclock/privacy/',
  tokushoho: '/tokushoho/',
  tkclockFontLicense: '/tkclock/fonts/LICENSE.txt',
};

// storeUrl stays null until the Microsoft Store listing is public. Every store button on the
// site reads it: null shows "近日公開", a URL turns them into links.
// Price is shown on the store listing only (not decided for the site).
export const tkclock = {
  storeUrl: null as string | null,
  // From the MSIX manifest: MinVersion 10.0.19041.0 (= Windows 10 2004), x64 package
  os: 'Windows 11 / 10（64 ビット）',
  osDetail: 'Windows 11、Windows 10（バージョン 2004 以降）。64 ビット（x64）版',
};
