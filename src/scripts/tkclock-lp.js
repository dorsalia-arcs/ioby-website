(() => {
  "use strict";

  let tickDesk = null;

  /* 実機と同じ配色。値はアプリのテーマ定義から持ってきている */
  const THEMES = [
    {key:"dq",      name:"ドット調",           bg:"#0b0b0f", win:"#000000", bd:"#ffffff", fg:"#ffffff", acc:"#1b1b3a"},
    {key:"paper",   name:"ペーパーホワイト",   bg:"#f4f3ef", win:"#ffffff", bd:"#2f3033", fg:"#23242a", acc:"#c8c6bf"},
    {key:"milktea", name:"ミルクティー",       bg:"#efe5d6", win:"#fbf5ea", bd:"#8a6a4b", fg:"#4a3728", acc:"#dfcdb4"},
    {key:"mint",    name:"ミント",             bg:"#e2f1eb", win:"#f5fbf8", bd:"#3f8f77", fg:"#1f4f43", acc:"#c2e2d7"},
    {key:"rose",    name:"くすみピンク",       bg:"#f4e6e9", win:"#fdf4f6", bd:"#b5788a", fg:"#5c3846", acc:"#ecd2d9"},
    {key:"navy",    name:"ネイビー＆ゴールド", bg:"#0f1626", win:"#16203c", bd:"#d4af62", fg:"#f2e6c8", acc:"#2b3c66"},
    {key:"lcd",     name:"レトロ液晶",         bg:"#2b2f24", win:"#9ca37a", bd:"#3a3f2c", fg:"#1b1f12", acc:"#7e855e"},
    {key:"famicom", name:"8bit調",             bg:"#1a1c2c", win:"#29366f", bd:"#ffffff", fg:"#fbf236", acc:"#be2633"},
    {key:"matrix",  name:"ターミナル",         bg:"#001000", win:"#001a00", bd:"#00ff66", fg:"#00ff66", acc:"#003b1a"}
  ];

  const FONTS = [
    {key:"dot",    name:"ドット",           word:"おつかれさま"},
    {key:"bizg",   name:"BIZ UDPゴシック",  word:"おつかれさま"},
    {key:"maru",   name:"丸ゴシック",       word:"おつかれさま"},
    {key:"klee",   name:"手書き・万年筆",   word:"おつかれさま"},
    {key:"yusei",  name:"手書き・マーカー", word:"おつかれさま"},
    {key:"hachi",  name:"手書き・かわいい", word:"おつかれさま"},
    {key:"impact", name:"極太インパクト",   word:"おつかれさま"},
    {key:"retro",  name:"レトロ明朝",       word:"おつかれさま"},
    {key:"brush",  name:"筆・ホラー",       word:"おつかれさま"}
  ];

  const pad = n => String(n).padStart(2, "0");
  // HTML属性の中に入れるので、必ずシングルクォートで組み立てる。
  // ダブルクォートだと style="..." が途中で閉じ、書体も影も効かなくなる。
  const fam = k => `'tk-${k}', 'Hiragino Sans', sans-serif`;
  const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  // 日付。exe（clock_template.html）と同じ書式。かっこは半角、「にち」の後ろに半角空白1つ
  const WEEKja = ["にち","げつ","か","すい","もく","きん","ど"];
  const dateJa = d =>
    `${d.getFullYear()}ねん ${pad(d.getMonth()+1)}がつ ${pad(d.getDate())}にち (${WEEKja[d.getDay()]})`;

  // 桁ごとに固定幅の枠へ入れる（製品と同じ考えかた）。
  // 枠の幅は書体ごとに実測する。全書体で同じ幅にすると、
  // 極太インパクトのような幅の広い書体で数字が枠からはみ出し、「：」に重なる。
  // exe は実測値をそのまま使う（逃げを掛けない）ので、こちらも掛けない。コロンは自然幅。
  const METRICS = {};
  function measureFont(key){
    const SIZE = 100;
    const cv = measureFont.cv || (measureFont.cv = document.createElement("canvas"));
    const ctx = cv.getContext("2d");
    ctx.font = `${SIZE}px 'tk-${key}', 'Hiragino Sans', sans-serif`;
    let d = 0;
    for (let n = 0; n <= 9; n++) d = Math.max(d, ctx.measureText(String(n)).width);
    return { d: d / SIZE };
  }
  function metricsOf(key){
    return METRICS[key] || (METRICS[key] = measureFont(key));
  }

  // 時計を描く。中身の組みは exe の .dq-time と同じ
  //   dg dg colon dg dg （秒ありなら）colon sec(dg dg)
  // 2つめのコロンは .sec の外に出す（exe と同じく等倍で点滅させるため）
  function paintTime(el, key, d, withSec){
    if (!el) return;
    el.style.setProperty("--dw", metricsOf(key).d.toFixed(3) + "em");
    const dg = ch => `<span class="dg">${ch}</span>`;
    const colon = '<span class="colon">:</span>';
    const hh = pad(d.getHours()), mm = pad(d.getMinutes()), ss = pad(d.getSeconds());
    let out = dg(hh[0]) + dg(hh[1]) + colon + dg(mm[0]) + dg(mm[1]);
    if (withSec) out += colon + `<span class="sec">${dg(ss[0])}${dg(ss[1])}</span>`;
    el.innerHTML = out;
  }

  /* --- 文字の大きさを器に合わせる（exe の fit() の移植）---
     日付行が入ると横幅を決めるのは時刻ではなく日付になるため、clamp() の固定値では
     幅の広い書体で日付がはみ出し、幅の狭い書体では窓がガラ空きになる。
     「ドットの書体ならこの器で何px になるか」を測り、日付と ▼ の比率を下げて
     時刻の大きさだけはドットのときと揃える。 */
  function setSubScale(ck, f){
    const r = f / .40;
    const dt = ck.querySelector(".ck__date");
    const cu = ck.querySelector(".ck__cur");
    if (dt) dt.style.fontSize = f.toFixed(4) + "em";
    if (cu) cu.style.fontSize = (.30 * r).toFixed(4) + "em";
  }
  function fitDotSize(ck, content, availW, availH){
    const t = ck.querySelector(".ck__time");
    if (!t) return 0;
    const keepJp = content.style.fontFamily, keepNum = t.style.fontFamily,
          keepDw = t.style.getPropertyValue("--dw"), keepLs = t.style.letterSpacing;
    setSubScale(ck, .40);
    // exe は PixelNum（1em 幅）で測るが LP には入っていないので tk-dot の実測値で測る
    content.style.fontFamily = fam("dot");
    t.style.fontFamily = fam("dot");
    t.style.setProperty("--dw", metricsOf("dot").d.toFixed(3) + "em");
    t.style.letterSpacing = "0.06em";
    const w = content.scrollWidth, h = content.scrollHeight;
    content.style.fontFamily = keepJp;
    t.style.fontFamily = keepNum;
    t.style.letterSpacing = keepLs;
    if (keepDw) t.style.setProperty("--dw", keepDw); else t.style.removeProperty("--dw");
    return (w <= 0 || h <= 0) ? 0 : 100 * Math.min(availW / w, availH / h);
  }
  function fitClock(ck){
    if (!ck) return;
    const area = ck.querySelector(".ck__area");
    const content = ck.querySelector(".ck__content");
    if (!area || !content) return;
    const availW = area.clientWidth * .93, availH = area.clientHeight * .92;
    if (availW <= 0 || availH <= 0) return;
    // exe の vmin（窓の短辺÷100）に当たる値。枠の太さと角の丸みがこれに乗っている。
    // 枠の太さを変えると clientHeight も動くので、外枠を含む offsetHeight から出す
    ck.style.setProperty("--ck-vmin", (ck.offsetHeight / 100) + "px");
    content.style.fontSize = "100px";
    const ref = fitDotSize(ck, content, availW, availH);
    let f = .40;
    if (ref > 0){
      // 日付を縮めると時刻が大きくなり、その分また日付比率が下がる関係なので数回で収束させる
      for (let k = 0; k < 4; k++){
        setSubScale(ck, f);
        const cw = content.scrollWidth, chh = content.scrollHeight;
        if (cw <= 0 || chh <= 0) break;
        const F = 100 * Math.min(availW / cw, availH / chh);
        const nf = Math.min(.40, .40 * ref / F);
        if (Math.abs(nf - f) < .002){ f = nf; break; }
        f = nf;
      }
    }
    setSubScale(ck, f);
    const w = content.scrollWidth, h = content.scrollHeight;
    if (w <= 0 || h <= 0) return;
    const fs = Math.max(10, 100 * Math.min(availW / w, availH / h));
    content.style.fontSize = fs + "px";
    ck.style.fontSize = fs + "px";      // .ck__memo も同じ基準に乗せる
  }
  function fitAllClocks(){ document.querySelectorAll(".ck").forEach(fitClock); }

  /* --- 帯の時計 --- */
  const stripNow = document.getElementById("stripNow");

  /* --- 1秒ごとに動くものをまとめて --- */
  function tick(){
    const d = new Date();
    if (stripNow) stripNow.textContent = `${hhmm(d)}:${pad(d.getSeconds())}`;
  }
  tick(); setInterval(tick, 1000);

  /* --- 背景の入れ替わり（スライドショーの見立て）
         写真4枚と動画4本の8枠は markup 側に置いてある。ここは .on を回すだけ。
         動画の番はほぼ1本ぶん流してから次へ（製品の「動画は最後まで再生してから次へ」と同じ見せ方）。
         見本の中で動画がくり返す場面を見せないので、無償版の「くり返さない」とも食い違わない。
         動画の src は開いた時点では空にしてあり、1枠前に入れて読み始める
         （4本ぶんのデコードが最初の表示を重くしないため。preload="auto" に戻さないこと） --- */
  const stage = document.getElementById("wallStage");
  const wallClock = document.getElementById("wallClock");
  if (stage){
    const WALL_HOLD  = 1800;   // 写真1枚の表示時間
    const VIDEO_TAIL = 600;    // 動画の長さから引く。フェード（.55s）を動画の終わりまでに済ませ、ループの継ぎ目を見せない
    const FALLBACK_HOLD = 3400;   // duration が取れないときの動画1枠ぶん
    const layers = stage.querySelectorAll(".wall__layer");
    // REDUCED はこの下で宣言しているので、ここでは直接問い合わせる
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    let si = 0, inView = true, seen = false, pauseTimer = 0;
    const videoAt = i => layers[i].querySelector("video");
    const prime = i => {                 // 次に来る動画を1枠前から読み始める
      const v = videoAt(i);
      if (!v || v.src || calm.matches || !seen) return;
      v.src = v.dataset.src;
      v.load();
    };
    const playVideo = v => {
      if (!v || calm.matches) return;
      v.muted = true;
      const p = v.play();
      if (p && p.catch) p.catch(() => {});   // 省電力モードなどで止められたら poster のまま見せる
    };
    const nextWall = () => {
      const leaving = videoAt(si);
      layers[si].classList.remove("on");
      si = (si + 1) % layers.length;
      layers[si].classList.add("on");
      let hold = WALL_HOLD;
      const now = videoAt(si);
      if (leaving){
        pauseTimer = setTimeout(() => leaving.pause(), 600);   // フェードが終わってから止める
      }
      if (now){
        clearTimeout(pauseTimer);
        now.currentTime = 0;
        if (inView) playVideo(now);
        hold = (now.duration > 0 && isFinite(now.duration)) ? now.duration * 1000 - VIDEO_TAIL : FALLBACK_HOLD;
      }
      prime((si + 1) % layers.length);
      setTimeout(nextWall, hold);
    };
    // 動きを減らす設定のときは、最初の写真のまま入れ替えない
    if (!calm.matches) setTimeout(nextWall, WALL_HOLD);
    // 画面外では動画だけ止める（切り替えのタイマーは止めない）
    if ("IntersectionObserver" in window){
      new IntersectionObserver(entries => {
        inView = entries[entries.length - 1].isIntersecting;
        if (inView){
          seen = true;
          prime(si);                          // 動画の枠で画面に入ってきた場合はその場で読む
          prime((si + 1) % layers.length);
          playVideo(videoAt(si));
        } else {
          const v = videoAt(si);
          if (v) v.pause();
        }
      }).observe(stage);
    } else {
      seen = true;
    }
    const wallT = wallClock && wallClock.querySelector(".ck__time");
    const wallDate = document.getElementById("wallDate");
    const paintWall = () => {
      const d = new Date();
      paintTime(wallT, "dot", d, true);
      if (wallDate) wallDate.textContent = dateJa(d);
    };
    paintWall(); fitClock(wallClock); setInterval(paintWall, 1000);
  }

  /* =======================================================
     スクロールで送るコマ
     参照元は写真を数十枚めくっているが、こちらは素材が無いので
     コマの中身をその場で描く。仕組み（スクロール量 → コマ番号）は同じ。
  ======================================================= */
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 縦長トラックの中での進み具合を 0〜1 で返し、コマ数に量子化して paint を呼ぶ。
  // 番号が変わったときだけ描き直すので、これが「コマ送り」になる。
  //   opts.map        進捗 → コマ送りに使う 0〜1（前に「溜め」を置きたいときに使う）
  //   opts.onProgress 進捗そのもの。毎スクロール呼ぶので、軽い処理だけ入れること
  function reel(track, frames, paint, opts){
    if (!track) return;
    opts = opts || {};
    let last = -1;
    const update = () => {
      const r = track.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      if (opts.onProgress) opts.onProgress(p);
      const q = opts.map ? opts.map(p) : p;
      const f = Math.min(frames - 1, Math.max(0, Math.round(q * (frames - 1))));
      if (f !== last){ last = f; paint(f); }
    };
    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; update(); });
    };
    window.addEventListener("scroll", onScroll, { passive:true });
    window.addEventListener("resize", onScroll);
    update();
  }

  const clamp01 = v => Math.min(1, Math.max(0, v));
  // カバー兼用のコマ送りは、先頭に「溜め」を置いてからコマを流す
  // 空と太陽は「スクロールした最初の1pxから」動かす。止めておくと演出が始まらない。
  // 粘らせるのはヒーローの文字だけにする。
  const HERO_HOLD  = .14;   // ヒーローをそのまま見せておく区間
  const HERO_FADE  = .10;   // ヒーローが引く区間
  const CLOCK_FADE = .09;   // 時刻表示が入る区間（ヒーローが引ききってから）
  const DAY_EASE   = 1.3;   // 朝のコマほどスクロール量を多く使い、日の出をじっくり見せる
  const lerp = (a, b, t) => a + (b - a) * t;
  const hex = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const mix = (a, b, t) => {
    const x = hex(a), y = hex(b);
    return `rgb(${Math.round(lerp(x[0],y[0],t))},${Math.round(lerp(x[1],y[1],t))},${Math.round(lerp(x[2],y[2],t))})`;
  };

  /* --- コマ送り その1：一日 --- */
  const DAY_FRAMES = 19;                 // 1時間きざみ。06:00 から 00:00 まで
  const DAY_START  = 6;                  // 朝からはじめる（ヒーローが夜明けの空に乗る）
  // [時刻, 空の上・中・下]
  const DAYKEYS = [
    [0,  ["#060918","#0b1030","#151c42"]],   // 深夜
    [5,  ["#0f1436","#33265a","#7a4a6a"]],   // 夜明け前
    [7,  ["#28386c","#8a5a7a","#f0a072"]],   // 朝焼け
    [10, ["#2a6cb4","#74aede","#d6e9f6"]],   // 昼
    [15, ["#2a6cb4","#74aede","#d6e9f6"]],   // 昼のまま保つ（すぐ夕方にならないように）
    [18, ["#1d2a5c","#8c4a7a","#ff9d5c"]],   // 夕焼け
    [20, ["#0d0a24","#2f1f5c","#6a3a6a"]],   // 宵
    [24, ["#060918","#0b1030","#151c42"]]    // 深夜へ戻る
  ];
  // ひとことは「時刻」ではなく「コマ番号」で引く。時刻で引くと 23時→0時でまたいだときに
  // 若い番号へ戻ってしまい、最後のコマ（00:00）に「また明日、同じ場所で。」を出せない
  const CAPS = [
    [0,  "一日がはじまる。"],                       // 06:00
    [5,  "机の上で、いちばん多く目に入るもの。"],   // 11:00
    [9,  "見た目は、その日の気分で掛け替えられる。"], // 15:00
    [11, "そろそろ、帰りどき。"],                   // 17:00
    [13, "おつかれさま。"],                         // 19:00
    [16, "夜のあいだも、静かに置いてある。"],       // 22:00
    [18, "また明日、同じ場所で。"]                  // 00:00
  ];
  const pick = (list, h) => { let v = list[0][1]; for (const [at, val] of list){ if (h >= at) v = val; } return v; };

  const daySky = document.getElementById("daySky");
  if (daySky){
    const dayOrb  = document.getElementById("dayOrb");
    const dayTime = document.getElementById("dayTime");
    const dayCap  = document.getElementById("dayCap");
    const dayNo   = document.getElementById("dayNo");
    const dayDial = document.getElementById("dayDial");
    const dayHH   = document.getElementById("dayHH");
    const dayMM   = document.getElementById("dayMM");
    const dayLights = document.getElementById("dayLights");
    const heroCopy  = document.getElementById("heroCopy");
    const dayCopy   = document.getElementById("dayCopy");
    const dayCue    = document.getElementById("dayCue");
    const dayMeta   = document.getElementById("dayMeta");

    // フィルムの目盛り
    const strip = document.getElementById("dayStrip");
    const ticks = [];
    if (strip) for (let i = 0; i < DAY_FRAMES; i++){
      const t = document.createElement("span");
      t.className = "reel__tick";
      strip.appendChild(t); ticks.push(t);
    }
    // 窓あかり。街並みの輪郭に合わせて散らす
    const cells = document.getElementById("dayLightCells");
    if (cells){
      const seed = [62,104,152,192,244,302,362,404,462,522,582,624,702,762,802,862,922,972,1042,1102,1142,1202,1262,1322,1382];
      seed.forEach((x, i) => {
        for (let r = 0; r < 4; r++){
          if ((i + r) % 3 === 0) continue;      // まばらに
          const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          rect.setAttribute("x", x - 26 + (r % 2) * 12);
          rect.setAttribute("y", 128 + r * 14);
          rect.setAttribute("width", "6"); rect.setAttribute("height", "8");
          cells.appendChild(rect);
        }
      });
    }

    reel(document.getElementById("dayTrack"), DAY_FRAMES, f => {
      const h = (DAY_START + f) % 24;        // 06:00 はじまり
      const mins = h * 60;

      // 空。前後のキーフレームを混ぜる
      let i = 0; while (i < DAYKEYS.length - 2 && h >= DAYKEYS[i + 1][0]) i++;
      const [h0, c0] = DAYKEYS[i], [h1, c1] = DAYKEYS[i + 1];
      const t = (h - h0) / (h1 - h0);
      daySky.style.background =
        `linear-gradient(180deg, ${mix(c0[0],c1[0],t)} 0%, ${mix(c0[1],c1[1],t)} 52%, ${mix(c0[2],c1[2],t)} 100%)`;

      // 太陽と月。昼は太陽、夜は月が同じ弧を通る
      const day = h >= 5 && h <= 19;
      const u = day ? (h - 5) / 14 : ((h > 19 ? h - 19 : h + 5) / 10);
      dayOrb.style.left = `${8 + u * 84}%`;
      dayOrb.style.top  = `${64 - Math.sin(u * Math.PI) * 52}%`;   // 頂点12%。中央の文字を避ける
      dayOrb.style.background = day
        ? "radial-gradient(circle at 50% 50%, #fff8d0 0%, #ffd26a 55%, rgba(255,170,60,0) 72%)"
        : "radial-gradient(circle at 50% 50%, #eef1ff 0%, #c9d2f0 52%, rgba(160,175,220,0) 70%)";

      // 窓あかり
      const night = h < 5.5 ? 1 : h < 7 ? (7 - h) / 1.5 : h < 17.5 ? 0 : h < 19 ? (h - 17.5) / 1.5 : 1;
      dayLights.style.opacity = (night * .85).toFixed(3);

      // 時刻
      dayTime.textContent = `${String(h).padStart(2, "0")}:00`;

      dayCap.textContent = pick(CAPS, f);
      dayNo.textContent = String(f + 1).padStart(2, "0");
      ticks.forEach((el, i2) => el.classList.toggle("on", i2 <= f));

      // キャラクターの振り向き。15%〜55% のあいだで背中→正面に変わる
      const turn = Math.min(1, Math.max(0, (f / (DAY_FRAMES - 1) - .12) / .34));
      const ease = turn * turn * (3 - 2 * turn);
      dayDial.setAttribute("transform", `translate(${(100 + (1 - ease) * 7).toFixed(1)} 100) scale(${ease.toFixed(3)} 1)`);
      dayHH.setAttribute("transform", `rotate(${((mins / 720) * 360) % 360})`);
      dayMM.setAttribute("transform", `rotate(${(mins % 60) * 6})`);
    },
    {
      // コマは進捗0から動かす。以前は先頭に「溜め」を置いていたが、
      // そのあいだ太陽も止まってしまい「スクロールしても演出が始まらない」状態だった。
      // 代わりに軽いイージングをかけ、朝のコマほどスクロール量を多く使う。
      map: p => Math.pow(p, DAY_EASE),
      onProgress: p => {
        // 持ち替えはコマ単位ではなく進捗そのもので動かす（3段でパチパチ切り替わって見えていた）
        // 重ねて溶かすと、2つの文章が同じ場所で重なって読めなくなる。
        // ヒーローが完全に引いてから時計を入れる（前後に分ける）。
        const o = clamp01((p - HERO_HOLD) / HERO_FADE);
        const out = o * o * (3 - 2 * o);                 // ヒーローが引く量
        const i = clamp01((p - HERO_HOLD - HERO_FADE) / CLOCK_FADE);
        const inn = i * i * (3 - 2 * i);                 // 時計が入る量
        const lift = clamp01(p / (HERO_HOLD + HERO_FADE));

        if (heroCopy){
          heroCopy.style.opacity = 1 - out;
          heroCopy.style.transform = `translateY(${(-lift * 26).toFixed(1)}px)`;
          if (out >= 1) heroCopy.setAttribute("data-off", ""); else heroCopy.removeAttribute("data-off");
          heroCopy.setAttribute("aria-hidden", String(out >= 1));
        }
        if (dayCopy){
          dayCopy.style.opacity = inn;
          dayCopy.style.transform = `translateY(${((1 - inn) * 22).toFixed(1)}px)`;
          if (inn <= 0) dayCopy.setAttribute("data-off", ""); else dayCopy.removeAttribute("data-off");
        }
        if (dayCue) dayCue.style.opacity = 1 - clamp01((p - HERO_HOLD * .5) / (HERO_HOLD * .5 + HERO_FADE));
        if (dayMeta) dayMeta.style.opacity = inn;
        if (strip) strip.style.opacity = inn;
      }
    });
  }

  /* --- 81通り：ランダムボタンで切り替える --- */
  const comboWin = document.getElementById("comboWin");
  if (comboWin){
    const comboT = document.getElementById("comboT");
    const comboDate = document.getElementById("comboDate");
    const comboTheme = document.getElementById("comboTheme");
    const comboFont = document.getElementById("comboFont");
    let ci = 0;

    // いまの時刻を秒まで描く。書体が変わっても桁位置は動かない
    const paintComboTime = () => {
      const d = new Date();
      paintTime(comboT, FONTS[ci % 9].key, d, true);
      if (comboDate) comboDate.textContent = dateJa(d);
    };

    const showCombo = i => {
      ci = (i + 81) % 81;
      const t = THEMES[Math.floor(ci / 9)], fo = FONTS[ci % 9];
      // 配色と書体はカスタムプロパティで渡す（インライン style を文字列で組み立てない）
      comboWin.style.setProperty("--ck-win", t.win);
      comboWin.style.setProperty("--ck-bd", t.bd);
      comboWin.style.setProperty("--ck-fg", t.fg);
      comboWin.style.setProperty("--ck-acc", t.acc);
      comboWin.style.setProperty("--ck-jp", fam(fo.key));
      comboWin.style.setProperty("--ck-num", fam(fo.key));
      comboWin.setAttribute("data-font", fo.key);
      comboTheme.textContent = t.name;
      comboFont.textContent = fo.name;
      comboFont.style.fontFamily = fam(fo.key);
      paintComboTime();
      fitClock(comboWin);
    };

    // ランダム。テーマも書体も今と違うもの（64通り）から引く。
    // 片方だけ変わると、押しても変化が小さく見えるため
    const rnd = document.getElementById("comboRandom");
    if (rnd) rnd.addEventListener("click", () => {
      let n = ci;
      while (Math.floor(n / 9) === Math.floor(ci / 9) || n % 9 === ci % 9) n = Math.floor(Math.random() * 81);
      showCombo(n);
      comboWin.classList.remove("pop"); void comboWin.offsetWidth; comboWin.classList.add("pop");
    });

    // メモ欄の出し入れ。既定は OFF（exe の初期状態と同じ）。
    // メモを出すと時刻の器が狭くなるので、切り替えたら文字の大きさを測り直す
    const memoBtn = document.getElementById("comboMemo");
    if (memoBtn) memoBtn.addEventListener("click", () => {
      const on = memoBtn.getAttribute("aria-pressed") !== "true";
      memoBtn.setAttribute("aria-pressed", String(on));
      comboWin.classList.toggle("is-memo", on);
      fitClock(comboWin);
    });
    // 9書体を先に読ませておく。使うまで読み込まれないと、初回クリックで一瞬ちらついて見える。
    // 画面外に要素を置く方式だと横方向のはみ出し検査に引っかかるので、フォントAPIで読む。
    if (document.fonts && document.fonts.load){
      Promise.all(FONTS.map(f =>
        document.fonts.load(`1em 'tk-${f.key}'`, "0123456789: ▼()ねがつにちげすもくきどうあわせぎゅか").catch(() => {})
      )).then(() => {
        // 代替書体の幅を測ってしまっている可能性があるので、読み込み後に測り直す
        FONTS.forEach(f => { METRICS[f.key] = measureFont(f.key); });
        paintComboTime();
        if (tickDesk) tickDesk();
        fitAllClocks();
      });
    }

    showCombo(Math.floor(Math.random() * 81));
    setInterval(paintComboTime, 1000);
  }

  /* --- デスクトップのイメージ図。時計は本物で、テーマの配色をあてる --- */
  const deskWin = document.getElementById("deskWin");
  if (deskWin){
    const deskTime = document.getElementById("deskTime");
    const deskDate = document.getElementById("deskDate");
    const deskMemo = document.getElementById("deskMemo");
    const deskBar  = document.getElementById("deskBarTime");
    const T = THEMES[5], F = FONTS[0];          // ネイビー＆ゴールド ／ ドット
    deskWin.style.background = T.win;
    deskWin.style.borderColor = T.bd;
    deskWin.style.color = T.fg;
    deskWin.style.fontFamily = fam(F.key);
    deskMemo.style.background = T.acc;
    tickDesk = () => {
      const d = new Date();
      paintTime(deskTime, F.key, d, true);
      deskDate.textContent = dateJa(d);
      deskBar.textContent = hhmm(d);
      const bd = document.getElementById("deskBarDate");
      if (bd) bd.textContent = `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())}`;
    };
    tickDesk(); setInterval(tickDesk, 1000);
  }

  /* --- デスクトップ：仮想画面（1280×720）を、写真の画面の4隅に射影変換で合わせる --- */
  const deskShot = document.getElementById("deskShot");
  const deskImg = deskShot && deskShot.querySelector(".deskshot__img");
  const deskScreen = deskShot && deskShot.querySelector(".screen");
  if (deskImg && deskScreen){
    const SW = 1280, SH = 720, BAR_H = 40;
    const points = s => (s || "").trim().split(/\s+/).filter(Boolean).map(p => p.split(",").map(Number));
    const quad = points(deskShot.dataset.quad);
    // 単位正方形 → 四辺形（Heckbert の閉形式）。x = (a·u + b·v + c) / (g·u + h·v + 1)、y も同様（d, e, f）
    const squareToQuad = q => {
      const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
      const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
      const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
      let g = 0, h = 0;
      if (dx3 !== 0 || dy3 !== 0){
        const den = dx1 * dy2 - dx2 * dy1;
        g = (dx3 * dy2 - dx2 * dy3) / den;
        h = (dx1 * dy3 - dx3 * dy1) / den;
      }
      return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h];
    };

    // 手前の物（data-cut）の輪郭を仮想画面の座標に直し、そこだけ切り欠く（evenodd で穴にする）
    const cut = points(deskShot.dataset.cut);
    if (quad.length === 4 && cut.length > 2){
      const [a, b, c, d, e, f, g, h] = squareToQuad(quad);
      // 3×3 行列 [[a,b,c],[d,e,f],[g,h,1]] の余因子行列（逆写像。定数倍は割り算で消える）
      const m = [e - f * h, c * h - b, b * f - c * e,
                 f * g - d, a - c * g, c * d - a * f,
                 d * h - e * g, b * g - a * h, a * e - b * d];
      const hole = cut.map(([x, y]) => {
        const w = m[6] * x + m[7] * y + m[8];
        return [(m[0] * x + m[1] * y + m[2]) / w * SW, (m[3] * x + m[4] * y + m[5]) / w * SH];
      });
      const P = ([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      deskScreen.style.clipPath = `polygon(evenodd, 0px 0px, ${SW}px 0px, ${SW}px ${SH}px, 0px ${SH}px, 0px 0px, `
        + `${hole.map(P).join(", ")}, ${P(hole[0])}, 0px 0px)`;
      // タスクバーの右端が隠れるなら、トレイと時計をその手前まで寄せる
      const low = hole.filter(p => p[1] >= SH - BAR_H).map(p => p[0]);
      if (low.length) deskScreen.style.setProperty("--tray-gap", `${Math.max(14, Math.round(SW - Math.min(...low) + 14))}px`);
    }

    const fitScreen = () => {
      const k = deskImg.clientWidth / (deskImg.naturalWidth || Number(deskImg.getAttribute("width")));
      if (!k || quad.length !== 4) return;
      const [a, b, c, d, e, f, g, h] = squareToQuad(quad.map(([x, y]) => [x * k, y * k]));
      deskScreen.style.transform =
        `matrix3d(${[a / SW, d / SW, 0, g / SW, b / SH, e / SH, 0, h / SH, 0, 0, 1, 0, c, f, 0, 1].join(",")})`;
      deskScreen.classList.add("is-fit");
    };
    fitScreen();
    if (!deskImg.complete) deskImg.addEventListener("load", fitScreen);
    if ("ResizeObserver" in window) new ResizeObserver(fitScreen).observe(deskImg);
    else window.addEventListener("resize", fitScreen);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitScreen);
  }

  /* --- 時計の文字の大きさを器に追従させる。
         1秒ごとの描き直しでは呼ばない（桁は固定幅の枠に入っていて幅が変わらない） --- */
  if ("ResizeObserver" in window){
    const ro = new ResizeObserver(() => fitAllClocks());
    document.querySelectorAll(".ck").forEach(el => ro.observe(el));
  } else {
    window.addEventListener("resize", fitAllClocks);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAllClocks);

})();
