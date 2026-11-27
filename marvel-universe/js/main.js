/* =========================================================
   MARVEL UNIVERSE — main.js (HOME)
   ========================================================= */
(() => {
  const { $, $$, esc, year, upcoming, ICON, posterArt, wideArt, favBtn, charCard, detailUrl, syncFavs, hasGsap, reveal, reduced } = MU;
  const released = MOVIES.filter((m) => !upcoming(m));

  /* ---------- 01 hero — Brocade Eyelet ---------- */
  $("#heroCount").textContent = MOVIES.length;
  const tick = MOVIES.map((m) => `<span>${esc(m.en.replace(/\*$/, ""))}</span>`).join("");
  $("#ticker").innerHTML = tick + tick;

  const hero = $("#hero");
  const wide = () => innerWidth >= 1024;
  const brocadeProps = () => ({
    background: "#09090B",
    baseColor: "#E62429",        // 마블 레드: 실이 모일수록 흰빛으로 타오름
    accentColor: "#4F7BFF",      // 스페이스 스톤 블루 프린지
    speed: reduced ? 0 : 50,
    scale: wide() ? 97 : 120,
    density: wide() ? 40 : 30,
    pinch: 24,
    fringe: 18,
    direction: "up",
    placement: { x: wide() ? 20 : 8, y: wide() ? 0 : -12, angle: 0, tilt: 0 },
    response: { follow: true, reach: 5.4, swirl: 6, shockwave: 6 },
    advanced: { coreColor: "#FFE9E0", violetColor: "#B04CFF", midColor: "#7A2A2E", hazeColor: "#5A1416", dustColor: "#FFD9CF", dust: 36, stars: 26, vignette: 28, cyanShare: 22, violetShare: 16, exposure: 150 },
  });
  let brocade = null;
  try { brocade = window.mountBrocade ? mountBrocade(hero, $("#brocade"), brocadeProps()) : null; } catch (e) { brocade = null; }
  let wasWide = wide();
  addEventListener("resize", () => { if (brocade && wide() !== wasWide) { wasWide = wide(); brocade.set(brocadeProps()); } });

  if (hasGsap()) {
    const tl = gsap.timeline({ delay: 0.75 });
    tl.from(".hero-eye", { opacity: 0, x: -30, duration: 0.8, ease: "power3.out" }, 0)
      .from(".hero-title .ln>*", { yPercent: 115, duration: 1.2, stagger: 0.15, ease: "power4.out" }, 0.1)
      .from(".hero-copy, .hero-ko", { opacity: 0, y: 18, duration: 0.9, stagger: 0.12 }, 0.7)
      .from(".hero-cta .btn", { opacity: 0, y: 30, duration: 0.8, stagger: 0.1, ease: "power3.out" }, 0.9)
      .from(".hero-side div", { opacity: 0, x: 30, duration: 0.8, stagger: 0.1, ease: "power3.out" }, 1)
      .from(".hero-hint, .ticker", { opacity: 0, y: 20, duration: 0.8, stagger: 0.1 }, 1.2);
    // 장면 전환: 히어로가 고정된 채 뒤로 물러나고, 다음 장면이 위로 덮어 올라옴
    if (innerWidth >= 768) {
      ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom top", pin: true, pinSpacing: false });
      gsap.to("#heroIn, .hero-side", { yPercent: -18, opacity: 0, scale: 0.94, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".brocade", { opacity: 0.25, scale: 1.08, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    }
    // 추천 영화 슬라이더: 작은 창이 화면 가득 열리듯
    gsap.fromTo("#fswiper", { clipPath: "inset(12% 14% 12% 14% round 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 6px)", ease: "none", scrollTrigger: { trigger: "#featured", start: "top 85%", end: "top 15%", scrub: true } });
  }

  /* ---------- 02 featured ---------- */
  $("#fprev").innerHTML = ICON.left;
  $("#fnext").innerHTML = ICON.right;
  const feat = MOVIES.filter((m) => m.featured);
  $("#fwrap").innerHTML = feat.map((m, i) => `
    <div class="swiper-slide" role="group" aria-roledescription="slide" aria-label="${i + 1} / ${feat.length}: ${esc(m.ko)}">
      <article class="fslide">
        <div class="fslide-bg">${wideArt(m, false)}</div>
        <div class="fslide-in">
          <a class="fslide-poster" href="${detailUrl(m.id)}" tabindex="-1" aria-hidden="true">${posterArt(m)}</a>
          <div>
            <p class="fslide-meta">PHASE ${m.phase} · ${year(m)} · ${esc(m.genre.join(" / "))}</p>
            <h3>${esc(m.en)}</h3><p>${esc(m.ko)}</p>
            <p class="fslide-txt">${esc(m.overview)}</p>
            <div class="fslide-act">
              <a class="btn btn-red" href="${detailUrl(m.id)}">View Details ${ICON.arrow}</a>
              ${favBtn(m.id)}
            </div>
          </div>
        </div>
      </article>
    </div>`).join("");
  syncFavs();

  const fs = $("#fswiper");
  if (window.Swiper) {
    new Swiper(fs, {
      slidesPerView: 1, spaceBetween: 24, speed: reduced ? 0 : 900, loop: true, grabCursor: true,
      autoplay: reduced ? false : { delay: 6500, disableOnInteraction: false, pauseOnMouseEnter: true },
      keyboard: { enabled: true, onlyInViewport: true },
      navigation: { prevEl: "#fprev", nextEl: "#fnext" },
      pagination: { el: "#fpag", clickable: true, renderBullet: (i, cls) => `<button type="button" class="${cls}" aria-label="${i + 1}번째 영화로 이동"></button>` },
      a11y: { enabled: true, prevSlideMessage: "이전 영화", nextSlideMessage: "다음 영화" },
    });
  } else {
    // Swiper를 불러오지 못하면 스크롤 스냅 슬라이더로 동작
    fs.classList.add("noswiper");
    const go = (d) => fs.scrollBy({ left: d * fs.clientWidth, behavior: reduced ? "auto" : "smooth" });
    $("#fprev").addEventListener("click", () => go(-1));
    $("#fnext").addEventListener("click", () => go(1));
    $("#fpag").innerHTML = feat.map((m, i) => `<button type="button" class="swiper-pagination-bullet" aria-label="${i + 1}번째 영화로 이동"></button>`).join("");
    $$("#fpag button").forEach((b, i) => b.addEventListener("click", () => fs.scrollTo({ left: i * fs.clientWidth, behavior: "smooth" })));
  }

  /* ---------- 03 universe ---------- */
  const stats = [
    [released.length, "RELEASED FILMS"],
    [6, "PHASES"],
    [2, "SAGAS"],
    [CHARACTERS.length, "CHARACTERS"],
  ];
  $("#stats").innerHTML = stats.map(([n, l]) => `<div class="stat"><b data-count="${n}">0</b><span>${l}</span></div>`).join("");
  $("#sagas").innerHTML = SAGAS.map((s, i) => `
    <article class="saga" data-word="${s.id === "infinity" ? "∞" : "M"}" style="--glow:${i ? "#245f94" : "#e62429"}">
      <h3>${s.en}<small>${s.ko}</small></h3>
      <p>${esc(s.text)}</p>
      <div class="phase-list">${s.phases.map((p) => {
        const n = MOVIES.filter((m) => m.phase === p).length;
        return `<a href="movies.html?phase=${p}"><b>PHASE ${p}</b><span>${PHASES[p].years} · ${n}편</span><svg class="pl-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>`;
      }).join("")}</div>
    </article>`).join("");

  /* ---------- 04 characters ---------- */
  $("#legends").innerHTML = LEGENDS.map((id) => charCard(MU.charById(id))).join("");

  /* ---------- 05 timeline ---------- */
  const track = $("#tlTrack");
  let html = "", last = 0;
  MOVIES.forEach((m) => {
    if (m.phase !== last) {
      last = m.phase;
      const s = SAGAS.find((x) => x.phases.includes(m.phase));
      html += `<div class="tl-mark" id="tl-p${m.phase}"><b>PHASE ${m.phase}</b><span>${PHASES[m.phase].years}</span><p>${s.ko}</p></div>`;
    }
    html += `<div class="tl-item"><span class="yr">${year(m)}${upcoming(m) ? " · 개봉 예정" : ""}</span><a href="${detailUrl(m.id)}">${posterArt(m)}<h3>${esc(m.ko)}</h3></a></div>`;
  });
  track.innerHTML = html;
  $("#tlTabs").innerHTML = Object.keys(PHASES).map((p) => `<button type="button" class="chip" data-p="${p}" aria-pressed="${p === "1"}">PHASE ${p}</button>`).join("");
  const tabs = $$("#tlTabs .chip");
  const scrollToEl = (el) => track.scrollTo({ left: el.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft), behavior: reduced ? "auto" : "smooth" });
  tabs.forEach((b) => b.addEventListener("click", () => scrollToEl($(`#tl-p${b.dataset.p}`))));
  const step = () => Math.max(220, track.clientWidth * 0.8);
  $("#tlPrev").innerHTML = ICON.left;
  $("#tlNext").innerHTML = ICON.right;
  $("#tlPrev").addEventListener("click", () => track.scrollBy({ left: -step(), behavior: reduced ? "auto" : "smooth" }));
  $("#tlNext").addEventListener("click", () => track.scrollBy({ left: step(), behavior: reduced ? "auto" : "smooth" }));
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); track.scrollBy({ left: 220, behavior: "smooth" }); }
    if (e.key === "ArrowLeft") { e.preventDefault(); track.scrollBy({ left: -220, behavior: "smooth" }); }
  });
  // 현재 보이는 페이즈 탭 표시
  let raf = 0;
  track.addEventListener("scroll", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const x = track.scrollLeft + track.clientWidth * 0.3;
      let cur = "1";
      $$(".tl-mark", track).forEach((m) => { if (m.offsetLeft <= x) cur = m.id.slice(4); });
      tabs.forEach((b) => b.setAttribute("aria-pressed", b.dataset.p === cur));
    });
  }, { passive: true });
  // 세로 휠로 가로 이동 (트랙 위에서만)
  track.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const max = track.scrollWidth - track.clientWidth;
    if ((e.deltaY < 0 && track.scrollLeft <= 0) || (e.deltaY > 0 && track.scrollLeft >= max - 1)) return;
    e.preventDefault();
    track.scrollLeft += e.deltaY;
  }, { passive: false });

  /* ---------- scene 02 — gallery tunnel warp ---------- */
  const warp = $("#warp");
  const tunnel = mountTunnel({ frame: warp, canvas: $("#tunnel"), cursor: $("#warpLabel"), labels: { idle: "HOLD TO WARP", boost: "WARPING…" } });
  if (hasGsap()) {
    // 스크롤 속도만큼 터널이 가속
    ScrollTrigger.create({ trigger: warp, start: "top bottom", end: "bottom top", onUpdate: (self) => { if (tunnel) tunnel.kick(Math.min(10, Math.abs(self.getVelocity()) / 260)); } });
    gsap.fromTo(".warp-title span", { scale: 0.7, opacity: 0, letterSpacing: "0.2em" }, { scale: 1, opacity: 1, letterSpacing: "0em", ease: "none", scrollTrigger: { trigger: warp, start: "top 80%", end: "center center", scrub: true } });
    gsap.fromTo(".warp-title em", { y: 60, opacity: 0 }, { y: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: warp, start: "top 60%", end: "center 55%", scrub: true } });
    gsap.to(".warp-in", { scale: 1.25, opacity: 0, ease: "none", scrollTrigger: { trigger: warp, start: "center 40%", end: "bottom top", scrub: true } });
  }

  /* ---------- 06 cta — venom button ---------- */
  const vbtn = $("#vbtn");
  mountVenom({ stage: $("#vstage"), btn: vbtn, glc: $("#vgoo"), hc: $("#vhand"), goo: [0.008, 0.008, 0.012], autoplay: true });
  vbtn.addEventListener("click", () => {
    $("#vstage").classList.add("leaving");
    setTimeout(() => MU.go("movies.html"), reduced ? 0 : 300);
  });

  reveal();
  if (hasGsap()) gsap.from(".tl-item", { opacity: 0, x: 60, duration: 0.8, stagger: 0.04, ease: "power3.out", scrollTrigger: { trigger: "#tlTrack", start: "top 85%", once: true } });
})();
