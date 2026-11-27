/* =========================================================
   MARVEL UNIVERSE — common.js
   헤더·푸터, 모바일 메뉴, 검색, 즐겨찾기(LocalStorage),
   캐릭터 모달, 공통 카드, 스크롤 애니메이션
   ========================================================= */
const MU = (() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = () => !!(window.gsap && window.ScrollTrigger) && !reduced;
  const page = document.body.dataset.page || "";
  const param = (k) => {
    const v = new URLSearchParams(location.search).get(k);
    if (v) return v;
    const h = location.hash.slice(1);
    return k === "id" && h ? decodeURIComponent(h) : null;
  };
  const today = new Date();
  const year = (m) => m.date.slice(0, 4);
  const upcoming = (m) => new Date(m.date + "T00:00:00") > today;
  const fmtDate = (d) => { const [y, m, dd] = d.split("-"); return `${y}년 ${+m}월 ${+dd}일`; };
  const fmtRun = (n) => (n ? `${Math.floor(n / 60)}시간 ${n % 60}분 (${n}분)` : "미정");
  const byId = (id) => MOVIES.find((m) => m.id === id);
  const charById = (id) => CHARACTERS.find((c) => c.id === id);
  const detailUrl = (id) => `movie-detail.html?id=${encodeURIComponent(id)}`;

  const ICON = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.4C1.4 7.6 3.6 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.6 0 5.8 3.6 4.5 7.1-1.8 4.8-9.3 9.4-9.3 9.4Z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  };

  /* ---------- favorites (LocalStorage) ---------- */
  const FKEY = "mu-favorites";
  let favs = [];
  try { favs = JSON.parse(localStorage.getItem(FKEY) || "[]").filter((id) => byId(id)); } catch (e) { favs = []; }
  const isFav = (id) => favs.includes(id);
  const saveFavs = () => { try { localStorage.setItem(FKEY, JSON.stringify(favs)); } catch (e) { /* 저장 불가 환경: 이번 방문 동안만 유지 */ } };
  function toggleFav(id) {
    favs = isFav(id) ? favs.filter((x) => x !== id) : [...favs, id];
    saveFavs();
    syncFavs();
    const m = byId(id);
    toast(isFav(id) ? `「${m.ko}」을(를) 즐겨찾기에 담았어요` : `「${m.ko}」을(를) 즐겨찾기에서 뺐어요`);
    document.dispatchEvent(new CustomEvent("favchange", { detail: { id } }));
  }
  function syncFavs() {
    $$("[data-fav]").forEach((b) => {
      const on = isFav(b.dataset.fav);
      b.setAttribute("aria-pressed", on);
      const m = byId(b.dataset.fav);
      if (m) b.setAttribute("aria-label", `${m.ko} ${on ? "즐겨찾기 해제" : "즐겨찾기 추가"}`);
    });
    $$(".fav-count").forEach((el) => { el.textContent = favs.length; el.dataset.n = favs.length; });
  }
  const favBtn = (id, cls = "fav") => `<button type="button" class="${cls}" data-fav="${esc(id)}" aria-pressed="false">${ICON.heart}<span class="fav-txt"></span></button>`;

  /* ---------- toast ---------- */
  let toastT;
  function toast(msg) {
    let t = $("#toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ---------- artwork ---------- */
  function posterArt(m) {
    const p = PHASES[m.phase];
    const img = m.poster ? `<img src="${esc(m.poster)}" alt="${esc(m.ko)} 포스터" loading="lazy" data-fallback>` : "";
    return `<div class="art art-poster" style="--a:${p.a};--b:${p.b}" ${m.poster ? "" : `role="img" aria-label="${esc(m.ko)} (${year(m)}) 대체 포스터"`}>
      ${img}<span class="ap-top" aria-hidden="true"><span>${p.name}</span><span>${String(MOVIES.indexOf(m) + 1).padStart(2, "0")}</span></span>
      <span class="ap-yr" aria-hidden="true">${year(m)}</span>
      <strong class="ap-en" aria-hidden="true">${esc(m.en)}</strong><span class="ap-ko" aria-hidden="true">${esc(m.ko)}</span></div>`;
  }
  function wideArt(m, label = true) {
    const p = PHASES[m.phase];
    const img = m.backdrop ? `<img src="${esc(m.backdrop)}" alt="" loading="lazy" data-fallback>` : "";
    return `<div class="art art-wide" style="--a:${p.a};--b:${p.b}" ${label ? `role="img" aria-label="${esc(m.ko)} 배경 대체 이미지"` : 'aria-hidden="true"'}>${img}<span class="aw-beam"></span><span class="aw-txt">${esc(m.en.split(":")[0])}</span></div>`;
  }
  function charArt(c) {
    const mono = c.name.split(/[\s-]+/).map((w) => w[0]).join("");
    const img = c.img ? `<img src="${esc(c.img)}" alt="${esc(c.ko)}" loading="lazy" data-fallback>` : "";
    return `<div class="art art-char" style="--a:${c.color};--b:#08080a" ${c.img ? "" : `role="img" aria-label="${esc(c.ko)} 대체 이미지"`}>${img}<span class="ac-ring" aria-hidden="true"></span><span class="ac-mono" aria-hidden="true">${mono}</span><span class="ac-name" aria-hidden="true">${esc(c.name)}</span></div>`;
  }
  // 이미지 경로가 깨지면 이미지만 지우고 대체 아트워크를 보여 줌
  document.addEventListener("error", (e) => { const t = e.target; if (t.tagName === "IMG" && t.hasAttribute("data-fallback")) t.remove(); }, true);

  function movieCard(m) {
    return `<article class="mcard" data-id="${esc(m.id)}">
      <a class="mcard-link" href="${detailUrl(m.id)}" aria-label="${esc(m.ko)} 상세 보기">
        <div class="mcard-img">${posterArt(m)}<span class="glare" aria-hidden="true"></span><span class="mcard-ov" aria-hidden="true"><span>VIEW DETAILS ${ICON.arrow.replace('aria-hidden="true"', 'aria-hidden="true" width="16" height="16"')}</span></span></div>
        <div class="mcard-txt"><h3>${esc(m.ko)}</h3><p><span>${year(m)}</span><span>PHASE ${m.phase}</span></p></div>
      </a>${upcoming(m) ? '<span class="badge">COMING SOON</span>' : ""}${favBtn(m.id)}</article>`;
  }
  function charCard(c) {
    return `<button type="button" class="ccard" data-char="${esc(c.id)}" aria-haspopup="dialog">${charArt(c)}<span class="glare" aria-hidden="true"></span><span class="ccard-hover" aria-hidden="true">VIEW PROFILE ${ICON.arrow}</span>
      <span class="ccard-txt"><span class="ccard-type ${c.type === "villain" ? "v" : ""}">${c.type.toUpperCase()}</span><b>${esc(c.ko)}</b><small>${esc(c.real)}</small></span></button>`;
  }

  /* ---------- layout ---------- */
  const NAV = [["home", "index.html", "HOME", "홈"], ["movies", "movies.html", "MOVIES", "영화"], ["characters", "characters.html", "CHARACTERS", "캐릭터"], ["about", "about.html", "ABOUT", "소개"]];
  const cur = (p) => (p === page ? ' aria-current="page"' : "");
  function renderLayout() {
    document.body.insertAdjacentHTML("afterbegin", `
      <a class="skip" href="#main">본문 바로가기</a>
      <div class="progress" aria-hidden="true"><i id="prog"></i></div>
      <header class="gnb" id="gnb"><div class="wrap gnb-in">
        <a class="logo" href="index.html" aria-label="MARVEL UNIVERSE 홈으로"><i aria-hidden="true"></i>MARVEL UNIVERSE</a>
        <nav class="menu" aria-label="주 메뉴">${NAV.map(([p, h, t]) => `<a href="${h}"${cur(p)}>${t}</a>`).join("")}</nav>
        <div class="tools">
          <a class="icon-btn fav-link" href="movies.html?phase=fav" aria-label="즐겨찾기한 영화 보기">${ICON.heart.replace("<svg", '<svg fill="none" stroke="currentColor" stroke-width="2"')}<span class="fav-count" data-n="0"></span></a>
          <button type="button" class="icon-btn" id="openSearch" aria-label="검색 열기" aria-haspopup="dialog">${ICON.search}</button>
          <button type="button" class="icon-btn burger" id="burger" aria-label="메뉴 열기" aria-expanded="false" aria-controls="mnav"><span></span><span></span></button>
        </div></div></header>
      <nav class="mnav" id="mnav" aria-label="모바일 메뉴" hidden>
        ${NAV.map(([p, h, t, k]) => `<a href="${h}"${cur(p)}>${t}<small>${k}</small></a>`).join("")}
        <p>ONE UNIVERSE. INFINITE STORIES.</p></nav>
      <div class="search" id="search" role="dialog" aria-modal="true" aria-label="영화와 캐릭터 검색" hidden>
        <button type="button" class="icon-btn search-x" id="closeSearch" aria-label="검색 닫기">${ICON.close}</button>
        <div class="search-box">
          <form class="search-row" id="searchForm" role="search">${ICON.search}
            <label class="sr" for="sq">영화 제목, 감독, 배우, 캐릭터 검색</label>
            <input id="sq" type="search" autocomplete="off" placeholder="SEARCH THE UNIVERSE" aria-controls="sres"></form>
          <p class="search-hint">한글·영문 제목, 감독, 배우, 캐릭터 이름으로 찾을 수 있어요. Enter를 누르면 영화 아카이브에서 전체 결과를 봅니다.</p>
          <ul class="sres" id="sres" aria-live="polite"></ul></div></div>
      <button type="button" class="totop" id="totop" aria-label="맨 위로 이동">${ICON.up}</button>`);
    document.body.insertAdjacentHTML("beforeend", `
      <footer class="foot"><div class="wrap">
        <div class="foot-top"><div><a class="logo" href="index.html"><i aria-hidden="true"></i>MARVEL UNIVERSE</a>
          <p class="lead" style="margin-top:14px;font-size:15px">ONE UNIVERSE. INFINITE STORIES.</p></div>
          <nav aria-label="푸터 메뉴">${NAV.map(([, h, t]) => `<a href="${h}">${t}</a>`).join("")}</nav></div>
        <div class="foot-note"><p>이 사이트는 홍어진의 웹디자인 포트폴리오 프로젝트이며 Marvel Studios 또는 The Walt Disney Company의 공식 웹사이트가 아닙니다.<br>Marvel 관련 명칭·캐릭터·포스터의 권리는 각 스튜디오와 권리자에게 있습니다.${IMAGE_MANIFEST.source === "TMDB" ? '<br>Poster &amp; backdrop images via <a href="https://www.themoviedb.org/" target="_blank" rel="noopener" style="text-decoration:underline">TMDB</a>. This product uses the TMDB API but is not endorsed or certified by TMDB.' : "<br>포스터가 없는 영화는 직접 만든 대체 아트워크로 표시됩니다."}</p>
          <p>© 2026 Portfolio Project · Non-commercial</p></div>
      </div></footer>`);
  }

  /* ---------- header, menu, top, progress ---------- */
  function bindLayout() {
    const gnb = $("#gnb"), prog = $("#prog"), top = $("#totop");
    let ticking = false;
    const onScroll = () => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      gnb.classList.toggle("scrolled", y > 40);
      prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      top.classList.toggle("show", y > innerHeight * 0.8);
      ticking = false;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
    top.addEventListener("click", () => { scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); $(".skip").focus({ preventScroll: true }); });

    const burger = $("#burger"), mnav = $("#mnav");
    const setMenu = (open) => {
      mnav.hidden = !open;
      burger.setAttribute("aria-expanded", open);
      burger.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
      document.body.classList.toggle("lock", open);
      gnb.classList.toggle("menu-open", open);
      if (open && hasGsap()) gsap.from("#mnav a", { y: 40, opacity: 0, stagger: 0.06, duration: 0.5, ease: "power3.out" });
    };
    burger.addEventListener("click", () => setMenu(mnav.hidden));
    mnav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    addEventListener("resize", () => { if (innerWidth > 900 && !mnav.hidden) setMenu(false); });

  }
  function sessionStorageGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function sessionStorageSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* noop */ } }

  /* ---------- search ---------- */
  const norm = (s) => String(s).toLowerCase().replace(/[\s:·*.,'’-]/g, "");
  function searchMovies(q) {
    const n = norm(q);
    if (!n) return MOVIES.slice();
    return MOVIES.filter((m) => [m.ko, m.en, m.director, ...m.cast, year(m)].some((t) => norm(t).includes(n)));
  }
  function searchChars(q) {
    const n = norm(q);
    return n ? CHARACTERS.filter((c) => [c.ko, c.name, c.real].some((t) => norm(t).includes(n))) : [];
  }
  let lastFocus = null;
  function bindSearch() {
    const box = $("#search"), input = $("#sq"), res = $("#sres");
    const open = () => { lastFocus = document.activeElement; box.hidden = false; document.body.classList.add("lock"); input.value = ""; draw(); input.focus(); };
    const close = () => { box.hidden = true; document.body.classList.remove("lock"); lastFocus && lastFocus.focus(); };
    const draw = () => {
      const q = input.value.trim();
      if (!q) { res.innerHTML = `<li class="sres-empty">추천: ${["엔드게임", "Spider-Man", "타노스", "루소"].map((w) => `<button type="button" class="chip" data-q="${w}" style="display:inline-flex;width:auto;margin:4px">${w}</button>`).join("")}</li>`; return; }
      const ms = searchMovies(q).slice(0, 6), cs = searchChars(q).slice(0, 4);
      if (!ms.length && !cs.length) { res.innerHTML = `<li class="sres-empty">「${esc(q)}」에 맞는 영화나 캐릭터가 없어요. 다른 단어로 찾아보세요.</li>`; return; }
      res.innerHTML = ms.map((m) => `<li><a href="${detailUrl(m.id)}"><span class="thumb">${posterArt(m)}</span><span><b>${esc(m.ko)}</b><small>${esc(m.en)} · ${year(m)} · ${esc(m.director)}</small></span><span class="tag">MOVIE</span></a></li>`).join("")
        + cs.map((c) => `<li><button type="button" data-char="${c.id}"><span class="thumb">${charArt(c)}</span><span><b>${esc(c.ko)}</b><small>${esc(c.name)} · ${esc(c.real)}</small></span><span class="tag">${c.type.toUpperCase()}</span></button></li>`).join("");
    };
    $("#openSearch").addEventListener("click", open);
    $("#closeSearch").addEventListener("click", close);
    input.addEventListener("input", draw);
    res.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-q]");
      if (chip) { input.value = chip.dataset.q; draw(); input.focus(); return; }
      if (e.target.closest("[data-char]")) close();
    });
    $("#searchForm").addEventListener("submit", (e) => { e.preventDefault(); const q = input.value.trim(); location.href = `movies.html${q ? `?q=${encodeURIComponent(q)}` : ""}`; });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !box.hidden) close();
      if (e.key === "/" && box.hidden && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
      if (e.key === "Tab" && !box.hidden) trap(e, box);
    });
  }
  function trap(e, root) {
    const f = $$('a[href],button:not([disabled]),input,select,[tabindex]:not([tabindex="-1"])', root).filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- character modal ---------- */
  let modalReturn = null;
  function buildModal() {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal" id="cmodal" role="dialog" aria-modal="true" aria-labelledby="cmName" hidden>
        <div class="modal-box">
          <button type="button" class="icon-btn modal-x" id="cmClose" aria-label="캐릭터 프로필 닫기">${ICON.close}</button>
          <div class="modal-img" id="cmImg"></div>
          <div class="modal-body"><p class="modal-cat" id="cmCat"></p><h2 id="cmName"></h2><p class="modal-real" id="cmReal"></p>
            <dl class="info"><dt>REAL NAME</dt><dd id="cmReal2"></dd><dt>POWER</dt><dd id="cmPower"></dd><dt>AFFILIATION</dt><dd id="cmTeam"></dd></dl>
            <h3 id="cmMovH">APPEARANCES</h3><ul class="mlist" id="cmMovies" aria-labelledby="cmMovH"></ul></div></div></div>`);
    const modal = $("#cmodal");
    $("#cmClose").addEventListener("click", closeChar);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeChar(); });
    document.addEventListener("keydown", (e) => {
      if (modal.hidden) return;
      if (e.key === "Escape") closeChar();
      if (e.key === "Tab") trap(e, modal);
    });
  }
  function openChar(id) {
    const c = charById(id);
    if (!c) return;
    const modal = $("#cmodal");
    if (modal.hidden) modalReturn = document.activeElement;
    $("#cmImg").innerHTML = charArt(c);
    $("#cmCat").textContent = c.type === "hero" ? "HERO" : "VILLAIN";
    $("#cmName").textContent = c.name;
    $("#cmReal").textContent = c.ko;
    $("#cmReal2").textContent = c.real;
    $("#cmPower").textContent = c.power;
    $("#cmTeam").textContent = c.team;
    $("#cmMovH").textContent = `APPEARANCES · ${c.movies.length}편`;
    $("#cmMovies").innerHTML = c.movies.map(byId).filter(Boolean).map((m) => `<li><a href="${detailUrl(m.id)}">${esc(m.ko)} <span style="color:var(--gray);margin-left:6px">${year(m)}</span></a></li>`).join("");
    modal.hidden = false;
    document.body.classList.add("lock");
    $("#cmClose").focus();
    if (hasGsap()) gsap.fromTo(".modal-box", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" });
  }
  function closeChar() {
    $("#cmodal").hidden = true;
    document.body.classList.remove("lock");
    modalReturn && modalReturn.focus();
  }

  /* ---------- delegated clicks ---------- */
  document.addEventListener("click", (e) => {
    const f = e.target.closest("[data-fav]");
    if (f) { e.preventDefault(); toggleFav(f.dataset.fav); f.classList.remove("pop"); void f.offsetWidth; f.classList.add("pop"); return; }
    const c = e.target.closest("[data-char]");
    if (c) { e.preventDefault(); if (!$("#search").hidden) { $("#search").hidden = true; } openChar(c.dataset.char); }
  });

  /* ---------- motion ---------- */
  function counters() {
    const run = (el) => {
      const to = +el.dataset.count, dur = 1400, t0 = performance.now();
      if (reduced) { el.textContent = to; return; }
      const step = (t) => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    const els = $$("[data-count]:not(.counted)");
    if (!("IntersectionObserver" in window)) { els.forEach((el) => (el.textContent = el.dataset.count)); return; }
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("counted"); run(en.target); io.unobserve(en.target); } }), { threshold: 0.5 });
    els.forEach((el) => io.observe(el));
  }
  function reveal(scope = document) {
    counters();
    if (!hasGsap()) return;
    gsap.registerPlugin(ScrollTrigger);
    $$("[data-fade]:not(.faded)", scope).forEach((el) => {
      el.classList.add("faded");
      gsap.from(el, { y: 48, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
    });
    $$("[data-stagger]:not(.faded)", scope).forEach((el) => {
      el.classList.add("faded");
      gsap.from(el.children, { y: 40, opacity: 0, duration: 0.8, stagger: 0.06, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });
    $$("[data-parallax]:not(.para)", scope).forEach((el) => {
      el.classList.add("para");
      gsap.fromTo(el, { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
    ScrollTrigger.refresh();
  }

  /* ---------- scene transition: curtain between pages ---------- */
  const curtain = document.createElement("div");
  curtain.className = "curtain cover instant";
  curtain.setAttribute("aria-hidden", "true");
  curtain.innerHTML = "<i></i><i></i><b>MARVEL<em>universe</em></b>";
  function openCurtain() {
    if (reduced) { curtain.remove(); return; }
    if (curtain.classList.contains("leaving")) return;
    requestAnimationFrame(() => { curtain.classList.remove("instant"); requestAnimationFrame(() => curtain.classList.remove("cover")); });
  }
  function go(url) {
    if (reduced || !document.body.contains(curtain)) { location.href = url; return; }
    curtain.classList.remove("instant");
    curtain.classList.add("cover", "leaving");
    setTimeout(() => { location.href = url; }, 820);
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== "_self") return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || /^(https?:|mailto:|tel:)/i.test(href) || !/\.html(\?|#|$)/.test(href)) return;
    e.preventDefault();
    go(href);
  });
  addEventListener("pageshow", (e) => { if (e.persisted) { curtain.classList.add("instant"); curtain.classList.remove("cover", "leaving"); } });

  /* ---------- hover: 3D tilt + glare on cards, magnetic buttons ---------- */
  if (!reduced && matchMedia("(hover: hover)").matches) {
    document.addEventListener("pointermove", (e) => {
      const card = e.target.closest(".mcard-img, .ccard");
      if (card) {
        const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
        card.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
        const g = card.querySelector(".glare") || card;
        g.style.setProperty("--mx", `${x * 100}%`);
        g.style.setProperty("--my", `${y * 100}%`);
      }
      const mag = e.target.closest(".magnet");
      if (mag) {
        const r = mag.getBoundingClientRect();
        mag.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
      }
    }, { passive: true });
    document.addEventListener("pointerout", (e) => {
      const card = e.target.closest(".mcard-img, .ccard");
      if (card && !card.contains(e.relatedTarget)) { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); }
      const mag = e.target.closest(".magnet");
      if (mag && !mag.contains(e.relatedTarget)) mag.style.transform = "";
    });
  }

  /* ---------- init ---------- */
  document.body.appendChild(curtain);
  renderLayout();
  bindLayout();
  bindSearch();
  buildModal();
  syncFavs();
  if (document.body.hasAttribute("data-reveal")) reveal();
  if (document.readyState === "complete") openCurtain(); else addEventListener("load", openCurtain);
  setTimeout(openCurtain, 900);
  addEventListener("storage", (e) => { if (e.key === FKEY) { try { favs = JSON.parse(e.newValue || "[]"); } catch (_) { favs = []; } syncFavs(); document.dispatchEvent(new CustomEvent("favchange")); } });

  return { go, $, $$, esc, reduced, hasGsap, param, year, upcoming, fmtDate, fmtRun, byId, charById, detailUrl, ICON, isFav, favs: () => favs.slice(), favBtn, syncFavs, toast, posterArt, wideArt, charArt, movieCard, charCard, openChar, searchMovies, reveal, trap };
})();
