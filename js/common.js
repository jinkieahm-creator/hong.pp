/* common.js — 메인·상세 페이지 공통
   조명 전환(밝은 방/어두운 방), 현재 방 표시, 진행 바, 메뉴, 커서 라벨, 페이지 전환 막, 등장 효과 */
(function () {
  const $ = (s, r = document) => r.querySelector(s)
  const $$ = (s, r = document) => [...r.querySelectorAll(s)]
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches
  const hasGsap = !!(window.gsap && window.ScrollTrigger)
  window.UI = { $, $$, reduce, fine, hasGsap }

  /* toast */
  let tt = 0
  UI.toast = (msg) => { const t = $("#toast"); if (!t) return; t.textContent = msg; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2600) }

  /* 조명 전환 + 현재 방: 화면 가운데에 걸친 섹션 기준 */
  const rooms = $$("[data-theme]").filter((el) => el !== document.body)
  const roomNo = $("#roomNo"), roomName = $("#roomName")
  const setRoom = (el) => {
    if (!el) return
    if (document.body.dataset.theme !== el.dataset.theme) {
      document.body.dataset.theme = el.dataset.theme
      const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = el.dataset.theme === "dark" ? "#0B0B0B" : "#F2F1EC"
    }
    if (roomNo && el.dataset.room) { const [n, name] = el.dataset.room.split("|"); if (roomNo.textContent !== n) { roomNo.textContent = n; roomName.textContent = name } }
    const id = el.id
    $$(".menu a").forEach((a) => a.classList.toggle("on", !!id && a.getAttribute("href") === "#" + id))
  }
  const pick = () => {
    const mid = innerHeight * 0.5
    let hit = null
    for (const el of [...rooms].reverse()) { const r = el.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) { hit = el; break } }
    if (!hit) { // 맨 아래(푸터)처럼 가운데에 아무것도 없을 때
      hit = rooms.filter((el) => el.getBoundingClientRect().top < innerHeight).pop()
    }
    setRoom(hit)
  }

  /* 진행 바 + 내비 배경/숨김 */
  const nav = $("#nav"), bar = $("#progress")
  let lastY = scrollY, ticking = false
  const onScroll = () => {
    ticking = false
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`
    if (nav) {
      nav.classList.toggle("solid", y > 40)
      const sheetOpen = document.body.classList.contains("menu-open")
      nav.classList.toggle("hide", !sheetOpen && y > lastY + 4 && y > innerHeight * 0.8)
      if (y < lastY - 4) nav.classList.remove("hide")
    }
    lastY = y
    pick()
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll) } }, { passive: true })
  addEventListener("resize", onScroll)
  onScroll()

  /* 모바일 메뉴 */
  const mb = $("#menuBtn"), sheet = $("#sheet")
  if (mb && sheet) {
    const set = (open) => { sheet.classList.toggle("open", open); document.body.classList.toggle("menu-open", open); mb.setAttribute("aria-expanded", open); mb.textContent = open ? "CLOSE" : "MENU"; document.documentElement.style.overflow = open ? "hidden" : "" }
    mb.addEventListener("click", () => set(!sheet.classList.contains("open")))
    $$("a", sheet).forEach((a) => a.addEventListener("click", () => set(false)))
    addEventListener("keydown", (e) => { if (e.key === "Escape" && sheet.classList.contains("open")) { set(false); mb.focus() } })
  }

  /* 커서 라벨: data-cur 가 붙은 요소 위에서만 형광 원으로 바뀜 */
  if (fine) {
    document.documentElement.classList.add("fine")
    const c = document.createElement("div"); c.className = "cur"; c.setAttribute("aria-hidden", "true"); document.body.append(c)
    let x = -200, y = -200, cx = x, cy = y
    addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY }, { passive: true })
    const loop = () => { cx += (x - cx) * 0.22; cy += (y - cy) * 0.22; c.style.translate = `${cx}px ${cy}px`; requestAnimationFrame(loop) }
    loop()
    document.addEventListener("pointerover", (e) => { const t = e.target.closest && e.target.closest("[data-cur]"); if (t) { c.textContent = t.dataset.cur; c.classList.add("on") } else c.classList.remove("on") })
    document.documentElement.addEventListener("pointerleave", () => c.classList.remove("on"))
  }

  /* 페이지 전환 막: 같은 사이트의 다른 페이지로 갈 때 */
  const curtain = $("#curtain")
  if (curtain && !reduce) {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]")
      if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
      const href = a.getAttribute("href")
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || /^https?:/.test(href)) return
      e.preventDefault()
      curtain.classList.remove("out"); curtain.classList.add("in")
      setTimeout(() => { location.href = href }, 520)
    })
    addEventListener("pageshow", () => { curtain.classList.remove("in"); curtain.classList.add("out") })
  }

  /* 큰 제목: 줄 단위로 아래에서 올라오기 / 문단·카드: 부드럽게 등장 (한 번 나타나면 계속 보임) */
  UI.reveal = () => {
    if (!hasGsap || reduce) return
    gsap.registerPlugin(ScrollTrigger)
    $$(".split").forEach((h) => {
      if (h.dataset.split) return; h.dataset.split = "1"
      // <br> 과 .ko 블록 기준으로 줄을 감쌈
      const parts = []; let buf = ""
      const flush = () => { if (buf.trim()) parts.push(`<span class="line-mask"><span>${buf}</span></span>`); buf = "" }
      h.childNodes.forEach((n) => {
        if (n.nodeName === "BR") flush()
        else if (n.nodeType === 1 && n.classList.contains("ko")) { flush(); parts.push(`<span class="ko">${n.innerHTML.split(/<br\s*\/?>/i).map((l) => `<span class="line-mask"><span>${l}</span></span>`).join("")}</span>`) }
        else buf += n.nodeType === 3 ? n.textContent : n.outerHTML
      })
      flush(); h.innerHTML = parts.join("")
      const lines = $$(".line-mask>span", h)
      gsap.set(lines, { yPercent: 110 })
      ScrollTrigger.create({ trigger: h, start: "top 86%", once: true, onEnter: () => gsap.to(lines, { yPercent: 0, duration: 1.1, stagger: 0.08, ease: "power4.out" }) })
    })
    const rv = $$(".rv")
    gsap.set(rv, { y: 40, opacity: 0 })
    const show = (b) => {
      b.forEach((el) => (el.dataset.shown = 1))
      const above = b.filter((el) => el.getBoundingClientRect().bottom < 0), inView = b.filter((el) => !above.includes(el))
      if (above.length) gsap.set(above, { y: 0, opacity: 1, overwrite: true }) // 지나친 글은 바로 보이게
      if (inView.length) gsap.to(inView, { y: 0, opacity: 1, duration: 1, stagger: Math.min(0.1, 0.6 / inView.length), ease: "power3.out", overwrite: true })
    }
    ScrollTrigger.batch(rv, { start: "top 90%", once: true, onEnter: show, onLeave: show, onEnterBack: show })
    // 목차·메뉴로 크게 건너뛰었을 때도 화면 안의 글이 빠짐없이 보이도록
    let sweep = 0
    const check = () => { const hidden = rv.filter((el) => !el.dataset.shown && el.getBoundingClientRect().top < innerHeight * 0.95); if (hidden.length) show(hidden) }
    addEventListener("scroll", () => { clearTimeout(sweep); sweep = setTimeout(check, 180) }, { passive: true })
    const lines = $$(".split .line-mask>span")
    addEventListener("scroll", () => setTimeout(() => lines.forEach((l) => { if (l.getBoundingClientRect().top < innerHeight * 0.95 && gsap.getProperty(l, "yPercent") > 100) gsap.to(l, { yPercent: 0, duration: 1, ease: "power4.out" }) }), 200), { passive: true })
  }
})()
