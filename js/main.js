/* main.js — 메인 페이지. 내용(텍스트·링크)은 js/data.js 에서 고칩니다. */
(function () {
  const D = window.CIM_DATA, { $, $$, reduce, fine, hasGsap } = UI
  const pad = (n) => String(n).padStart(2, "0")

  /* ---------- 렌더링 ---------- */
  $("#career").innerHTML = [
    ...D.career.map((c) => `<li><small>${c.period}</small><b>${c.title}</b><span>${c.text}</span></li>`),
    ...D.certs.map((c) => `<li><small>${c.period}</small><b>${c.title}</b></li>`)
  ].join("")
  const sk = D.skills
  const chips = (a, hi) => a.map((s) => `<span class="chip${hi ? " hi" : ""}">${s.name}</span>`).join("")
  $("#skills").innerHTML = `<div><dt>DESIGN</dt><dd>${chips(sk.design, true)}</dd></div><div><dt>DEVELOPMENT</dt><dd>${chips(sk.dev, true)}</dd></div><div><dt>WORK PROCESS</dt><dd>${chips(sk.process)}</dd></div>`

  const img = (w) => `<img src="${w.local}" alt="${w.name} 메인 화면" loading="lazy" onerror="if(this.dataset.f){this.remove()}else{this.dataset.f=1;this.src='${w.img}'}">`
  $("#workList").innerHTML =
    `<article class="wk wk--intro"><div><p class="intro-lead">선물,<br>브랜드 감도,<br>신뢰.</p><p>세 가지 질문에서 출발한<br>세 개의 화면입니다.<span class="h-only"><br>옆으로 넘겨 보세요 →</span></p></div></article>` +
    D.works.map((w, i) => `
    <article class="wk" id="w-${w.id}" style="--c:${w.color}">
      <a class="frame" href="project.html?p=${w.id}" data-cur="VIEW" aria-label="${w.name} 케이스 스터디 보기">
        <div class="frame__bar"><i></i><i></i><i></i><span>${w.url.replace(/^https?:\/\//, "")}</span></div>
        <div class="frame__view"><span class="ph" aria-hidden="true">${w.name}</span>${img(w)}</div>
      </a>
      <div class="wk__info">
        <span class="wk__no">WORK ${w.no} / ${pad(D.works.length)} · ${w.type}</span>
        <h3 class="wk__name">${w.name}</h3>
        <p class="wk__sub">${w.sub}</p>
        <p class="wk__desc">${w.problem}</p>
        <dl class="caption"><dt>ROLE</dt><dd>${w.scope}</dd><dt>YEAR</dt><dd>${w.period}</dd><dt>STACK</dt><dd>${w.stack.join(" · ")}</dd></dl>
        <div class="wk__btns"><a class="btn btn--solid" href="project.html?p=${w.id}">케이스 스터디 <span class="arr">→</span></a><a class="btn btn--ghost" href="${w.url}" target="_blank" rel="noopener" data-cur="LIVE">라이브 사이트 ↗</a></div>
      </div>
    </article>`).join("") +
    `<article class="wk wk--outro"><div><h3>이 세 작업 전에는,<br>잘 만든 사이트를 따라 만들며<br>손을 익혔습니다.</h3><a class="btn btn--ghost" href="#studies">재현 작업 9개 보기 <span class="arr">↓</span></a></div></article>`

  $("#studyList").innerHTML = D.studies.map((s, i) => `
    <li><a href="${s.url}" target="_blank" rel="noopener" data-cur="LIVE" data-i="${i}">
      <span class="ix-no">${pad(i + 1)}</span><span class="ix-name">${s.name}</span><span class="ix-type">${s.type}</span><span class="ix-lay">${s.layout} · ${s.feats.join(", ")}</span><span class="ix-go">LIVE ↗</span>
    </a></li>`).join("")

  $("#steps").insertAdjacentHTML("beforeend", D.process.map((p, i) => `<li data-n="${pad(i + 1)}"><small>${p[0]}</small><h3>${p[1]}</h3><p>${p[2]}</p></li>`).join(""))

  /* ---------- 펠리체골드 디자인 (눌러야 보임) + 크게 보기 ---------- */
  const fb = $("#feliceBtn"), fx = $("#feliceBox")
  fb.addEventListener("click", () => { const open = fx.hidden; fx.hidden = !open; fb.setAttribute("aria-expanded", open); if (hasGsap) ScrollTrigger.refresh() })
  const lb = $("#lb"), lbImg = $("img", lb)
  let lbFrom = null
  const closeLb = () => { lb.hidden = true; document.documentElement.style.overflow = ""; lbFrom && lbFrom.focus() }
  $$("#feliceBox button").forEach((b) => b.addEventListener("click", () => { const im = $("img", b); lbImg.src = im.src; lbImg.alt = im.alt; lbFrom = b; lb.hidden = false; document.documentElement.style.overflow = "hidden"; $("button", lb).focus() }))
  lb.addEventListener("click", closeLb)
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) closeLb() })

  /* ---------- 연락처 카드: 메일 복사 ---------- */
  UI.copyMail = () => {
    const mail = D.person.mail
    const ok = () => UI.toast("메일 주소를 복사했어요 · " + mail)
    try { navigator.clipboard.writeText(mail).then(ok, () => UI.toast(mail)) } catch (e) { UI.toast(mail) }
  }

  /* ---------- 재현 작업 미리보기: 목록에 마우스를 올리면 실제 화면이 따라옴 (PC) ---------- */
  if (fine) {
    const pv = document.createElement("div")
    pv.className = "pv"; pv.setAttribute("aria-hidden", "true")
    pv.innerHTML = '<div class="frame__bar"><i></i><i></i><i></i><span></span></div><div class="pv__body"></div>'
    document.body.append(pv)
    const body = $(".pv__body", pv), cap = $(".frame__bar span", pv), cache = {}
    let px = 0, py = 0, tx = 0, ty = 0, raf = 0
    const follow = () => { px += (tx - px) * 0.18; py += (ty - py) * 0.18; pv.style.translate = `${px}px ${py}px`; raf = pv.classList.contains("on") ? requestAnimationFrame(follow) : 0 }
    const aim = (e) => { const w = 380, h = 266; tx = e.clientX + 32 + w > innerWidth - 16 ? e.clientX - w - 32 : e.clientX + 32; ty = Math.min(Math.max(e.clientY - h / 2, 80), innerHeight - h - 16) }
    $$("#studyList a").forEach((a) => {
      const s = D.studies[+a.dataset.i]
      a.addEventListener("pointerenter", (e) => {
        if (!cache[s.url]) { const f = document.createElement("iframe"); f.src = s.url; f.loading = "lazy"; f.tabIndex = -1; f.title = ""; f.setAttribute("scrolling", "no"); cache[s.url] = f }
        body.replaceChildren(cache[s.url]); cap.textContent = s.url.replace(/^https?:\/\//, "")
        aim(e); if (!pv.classList.contains("on")) { px = tx; py = ty } pv.classList.add("on"); if (!raf) raf = requestAnimationFrame(follow)
      })
      a.addEventListener("pointermove", aim)
      a.addEventListener("pointerleave", () => pv.classList.remove("on"))
    })
  }

  /* ---------- 로딩 화면 (첫 방문 한 번) ---------- */
  const loader = $("#loader")
  const intro = () => {
    if (!hasGsap || reduce) return
    gsap.from(".hero__kicker span", { y: 20, opacity: 0, duration: .8, stagger: .08, ease: "power3.out", delay: .1 })
    gsap.from(".hero h1 .line-mask>span", { yPercent: 110, duration: 1.2, stagger: .1, ease: "power4.out", delay: .15 })
    gsap.from(".hero__lead,.hero__sub,.hero__cta,.hero__side", { y: 30, opacity: 0, duration: 1, stagger: .1, ease: "power3.out", delay: .45 })
  }
  let seen = false
  try { seen = sessionStorage.getItem("he-seen") === "1"; sessionStorage.setItem("he-seen", "1") } catch (e) {}
  if (reduce || seen || !hasGsap || location.hash) { loader.remove(); intro() }
  else {
    const num = $("#loaderNum"), bar = $("#loaderBar"), o = { v: 0 }
    gsap.to(o, { v: 100, duration: 1.3, ease: "power2.inOut", onUpdate: () => { num.textContent = Math.round(o.v); bar.style.width = o.v + "%" },
      onComplete: () => { loader.classList.add("done"); setTimeout(intro, 250); setTimeout(() => loader.remove(), 1100) } })
  }

  /* three.js 를 못 불러오면(인터넷 끊김 등) 그라데이션 배경으로 */
  addEventListener("load", () => setTimeout(() => { if (!window.__tunnelOK) $("#top").classList.add("no3d") }, 400))

  /* ---------- 스크롤 연출 ---------- */
  if (!hasGsap) return
  gsap.registerPlugin(ScrollTrigger)
  UI.reveal()

  // 01 메시지: 스크롤에 따라 단어에 불이 켜짐 (켜진 글자는 다시 꺼지지 않음 → 끝까지 읽을 수 있음)
  const st = $("#stmt")
  $$(".ln", st).forEach((ln) => { ln.innerHTML = ln.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ") })
  const words = $$(".w", st)
  if (reduce) words.forEach((w) => w.classList.add("lit"))
  else {
    let lit = 0
    ScrollTrigger.create({ trigger: st, start: "top 80%", end: "bottom 45%", onUpdate: (s) => {
      const n = Math.round(s.progress * words.length)
      if (n > lit) { for (let i = lit; i < n; i++) words[i].classList.add("lit"); lit = n }
    }, onLeave: () => words.forEach((w) => w.classList.add("lit")) })
  }

  // 03 대표작: 세로 스크롤 → 가로 이동 (PC·태블릿)
  const mm = gsap.matchMedia()
  mm.add("(min-width:761px) and (prefers-reduced-motion: no-preference)", () => {
    const hz = $("#hz"), track = $("#workList"); hz.classList.add("is-h")
    const dist = () => Math.max(0, track.scrollWidth - innerWidth)
    const tw = gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: hz, start: () => `top ${Math.max(70, (innerHeight - hz.offsetHeight) / 2)}`, end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
      onUpdate: (s) => { $("#hzBar").style.transform = `scaleX(${s.progress})` } } })
    // 각 작업 화면이 가운데로 올 때 이미지가 살짝 움직임 (패럴랙스)
    $$(".wk .frame__view img").forEach((im) => gsap.fromTo(im, { xPercent: -4 }, { xPercent: 4, ease: "none", scrollTrigger: { trigger: im.closest(".wk"), containerAnimation: tw, start: "left right", end: "right left", scrub: true } }))
    return () => { hz.classList.remove("is-h"); gsap.set(track, { clearProps: "transform" }) }
  })

  // 05 과정: 선이 그려지며 단계에 불이 들어옴
  const stepsEls = $$("#steps li")
  ScrollTrigger.create({ trigger: "#steps", start: "top 75%", end: "bottom 55%", scrub: true,
    onUpdate: (s) => { $("#stepsFill").style.transform = `scaleX(${s.progress})`; stepsEls.forEach((li, i) => { if (s.progress >= i / (stepsEls.length - 1) - 0.02) li.classList.add("on") }) } })
  stepsEls.forEach((li) => ScrollTrigger.create({ trigger: li, start: "top 70%", once: true, onEnter: () => li.classList.add("on") }))

  // 폰트·이미지 로딩 뒤 위치 다시 계산
  addEventListener("load", () => ScrollTrigger.refresh())
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh())
})()
