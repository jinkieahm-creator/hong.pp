/* golden.js — 메인 페이지. 내용(텍스트·링크)은 js/data.js 에서 고칩니다.
   스크롤 위치 → 하루의 시간(06시 일출 → 12시 정오 → 18시 일몰 → 22시 밤) */
import { mountMeadow } from "./meadow.js"
import { mountSticker, flowerSticker } from "./sticker.js"
import { mountFlower } from "./flower3d.js"
import { scrollFx } from "./fx.js"

const D = window.CIM_DATA
const $ = (s) => document.querySelector(s)
const pad = (n) => String(n).padStart(2, "0")
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
const mobile = matchMedia("(max-width:768px)").matches

/* ---------- 렌더링 ---------- */
$("#workList").innerHTML = D.works.map((w) => `
  <section class="pg scene" id="w-${w.id}"><article class="work" style="--pc:${w.color};--pi:${w.ink}">
    <div class="shotw"><a class="shot" href="project.html?p=${w.id}" aria-label="${w.name} 프로젝트 보기">
      <img src="${w.local}" alt="${w.name} 대표 화면" loading="lazy" onerror="this.onerror=null;this.src='${w.img}'">
    </a><div class="fl" data-c="${w.color}"></div></div>
    <div class="info">
      <p class="meta">FLOWER ${w.no} / ${pad(D.works.length)}</p>
      <h3>${w.name}</h3>
      <p class="wsub">${w.sub}</p>
      <p class="meta dim">${w.type} · ${w.period} · ${w.scope}</p>
      <p>${w.desc}</p>
      <ul class="chips">${w.parts.map((p) => `<li>${p}</li>`).join("")}</ul>
      <div class="btns">
        <a class="btn btn--solid" href="project.html?p=${w.id}">프로젝트 보기 ↗</a>
        <a class="btn" href="${w.url}" target="_blank" rel="noopener">LIVE SITE ↗</a>
      </div>
    </div>
  </article></section>`).join("")
$("#workList").lastElementChild.insertAdjacentHTML("beforeend", '<p class="bridge">세 송이가 피기까지, 이름 없는 연습의 밭이 있었습니다.</p>')

$("#studyList").innerHTML = D.studies.map((s, i) => `
  <li class="study">
    <div class="top"><span class="meta">${pad(i + 1)}</span><small>${s.type}</small></div>
    <h3>${s.name}</h3>
    <p>${s.layout}</p>
    <ul class="chips">${s.feats.map((f) => `<li>${f}</li>`).join("")}</ul>
    <a class="btn" href="${s.url}" target="_blank" rel="noopener" aria-label="${s.name} 재현 사이트 새 창에서 보기">LIVE ↗</a>
  </li>`).join("")

$("#steps").innerHTML = D.process.map((p) => `
  <li class="step"><b>${p[0]}</b><h4>${p[1]}</h4><p>${p[2]}</p></li>`).join("")

/* 프로젝트마다 3D 꽃 한 송이 (프로젝트 대표색이 꽃잎색) */
document.querySelectorAll(".fl").forEach((el) => mountFlower(el, el.dataset.c, el.dataset.c === "#D8F36A" ? "#E86A2A" : "#F2C83A"))

/* ---------- 작은 인터랙션 ---------- */
const fb = $("#feliceBtn"), fx = $("#feliceBox")
if (fb && fx) fb.addEventListener("click", () => {
  const open = fx.hidden
  fx.hidden = !open
  fb.setAttribute("aria-expanded", open)
  fb.querySelector("i").textContent = open ? "−" : "+"
})
const cp = $("#copy")
if (cp) cp.addEventListener("click", () => {
  navigator.clipboard?.writeText(D.person.mail)
  cp.textContent = "COPIED!"
  setTimeout(() => (cp.textContent = "COPY"), 1400)
})

/* ---------- 풀밭 배경 + 하루의 시간 ---------- */
// 저사양(모바일·코어 4개 이하·메모리 4GB 이하)이면 풀·꽃·블러를 줄여 가볍게
const lowEnd = mobile || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4
const meadow = mountMeadow($("#meadow"), {
  day: { time: 6 },
  flowers: lowEnd ? 3 : 4.5,
  grass: lowEnd ? 2.5 : 5,
  depthBlur: lowEnd ? 2 : 4.9,
  eventTarget: document.documentElement, // 글 위에서도 꽃이 마우스에 반응
})

// 각 섹션의 맨 위가 화면 맨 위에 닿을 때의 시각
const stops = [["#home", 6], ["#message", 7.5], ["#about", 9], ["#tools", 10.5], ["#works", 12],
  ...D.works.map((w, i) => ["#w-" + w.id, 13 + i]), ["#studies", 18], ["#process", 20], ["#contact", 22]]
let marks = [[0, 6], [1, 22]], sts = null // 각 장이 시작하는 스크롤 위치(핀 계산이 끝난 뒤 채워짐)
const measure = () => { if (sts) marks = sts.map((t, i) => [t.start, stops[i][1]]) }
const timeAt = (y) => {
  if (y <= marks[0][0]) return marks[0][1]
  for (let i = 1; i < marks.length; i++) {
    if (y <= marks[i][0]) {
      const [y0, t0] = marks[i - 1], [y1, t1] = marks[i]
      return t0 + ((y - y0) / (y1 - y0)) * (t1 - t0)
    }
  }
  return marks[marks.length - 1][1]
}
const phase = (h) => (h < 8 ? "SUNRISE" : h < 16 ? "DAYTIME" : h < 19 ? "GOLDEN HOUR" : h < 21 ? "DUSK" : "NIGHT")
const tint = (h) => (h < 8 ? "#FFCB8C" : h < 16 ? "#FFF4DC" : h < 19 ? "#FF9A6A" : h < 21 ? "#C58AD0" : "#9DB0F0")

const clockT = $("#clockT"), clockP = $("#clockP"), clockI = $("#clockI")
measure()
addEventListener("resize", measure)
addEventListener("load", measure)
let cur = 6, shown = ""
gsap.ticker.add(() => {
  const t = timeAt(scrollY)
  cur = reduce ? t : cur + (t - cur) * 0.08
  meadow.props.day.time = cur
  const label = pad(Math.floor(cur)) + ":" + pad(Math.floor((cur % 1) * 60 / 10) * 10)
  if (label !== shown) {
    shown = label
    clockT.textContent = label
    clockP.textContent = phase(cur)
    clockI.style.background = tint(cur)
  }
})

/* ---------- 마우스: 꽃 모양 커서 + 라벨(View · Open · Live …) ---------- */
const labels = { ".shot": "VIEW", ".btn--solid": "OPEN", ".work .btn:not(.btn--solid)": "LIVE", ".study .btn": "LIVE",
  "#feliceBtn": "OPEN", ".felice__box img": "ZOOM", "#copy": "COPY", "#mail": "MAIL", ".cue": "SCROLL", ".logo": "TOP" }
for (const [sel, text] of Object.entries(labels)) document.querySelectorAll(sel).forEach((el) => (el.dataset.cur = text))

if (matchMedia("(hover:hover) and (pointer:fine)").matches) {
  document.documentElement.classList.add("fine")
  const c = document.createElement("div")
  c.className = "cur"
  c.innerHTML = "<span></span>"
  document.body.append(c)
  const qx = gsap.quickTo(c, "x", { duration: 0.25, ease: "power3" })
  const qy = gsap.quickTo(c, "y", { duration: 0.25, ease: "power3" })
  addEventListener("pointermove", (e) => { c.classList.add("on"); qx(e.clientX); qy(e.clientY) })
  document.addEventListener("pointerover", (e) => {
    const t = e.target.closest("[data-cur]")
    c.classList.toggle("is-label", !!t)
    c.classList.toggle("is-link", !t && !!e.target.closest("a,button"))
    if (t) c.firstChild.textContent = t.dataset.cur
  })
  document.documentElement.addEventListener("pointerleave", () => c.classList.remove("on"))
}

/* ---------- 펠리체골드 사진 크게 보기 ---------- */
const lb = document.createElement("div")
lb.className = "lb"
lb.hidden = true
lb.dataset.cur = "CLOSE"
lb.innerHTML = "<img alt=''>"
document.body.append(lb)
const closeLb = () => { lb.hidden = true; document.body.style.overflow = "" }
lb.addEventListener("click", closeLb)
addEventListener("keydown", (e) => e.key === "Escape" && closeLb())
document.querySelectorAll(".felice__box img").forEach((im) => im.addEventListener("click", () => {
  lb.firstChild.src = im.src
  lb.firstChild.alt = im.alt
  lb.hidden = false
  document.body.style.overflow = "hidden"
}))

/* ---------- 스크롤: 줄기 진행바 + 글자가 스르르 올라오기 ---------- */
gsap.registerPlugin(ScrollTrigger)
const stem = $(".stem")
ScrollTrigger.create({ start: 0, end: "max", onUpdate: (st) => stem.style.setProperty("--p", st.progress.toFixed(3)) })

if (!reduce) {
  // 글자를 단어 단위로 쪼개서, 아래에서 한 단어씩 올라오게
  const split = (el) => {
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment()
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return
          if (/^\s+$/.test(t)) return frag.append(" ")
          const w = document.createElement("span"), i = document.createElement("span")
          w.className = "w"
          i.textContent = t
          w.append(i)
          frag.append(w)
        })
        n.replaceWith(frag)
      } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n)
    })
    walk(el)
    return el.querySelectorAll(".w > span")
  }
  const rise = (sel, delay = 0) => document.querySelectorAll(sel).forEach((el) => {
    gsap.from(split(el), { yPercent: 90, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.05, delay,
      scrollTrigger: { trigger: el, start: "top 90%", once: true } })
  })
  rise(".hero h1", 0.2); rise(".hero .slogan", 0.9); rise(".hero .sub", 1.2)
  rise(".sec-head h2"); rise(".sec-head .lead"); rise(".msg h2"); rise(".contact h2"); rise(".bridge")

  // 카드·문단은 아래에서 부드럽게, 형제끼리는 차례로
  const blocks = ".hero .meta,.hero .who,.hero .hint,.hero .cue,.sec-head .meta,.sec-head .note,.msg li,.g,.skills,.felice,.work,.study,.step,.contact .wrap > .meta,.mail,.foot"
  gsap.set(blocks, { y: 46, opacity: 0 })
  ScrollTrigger.batch(blocks, { start: "top 93%", once: true,
    onEnter: (b) => gsap.to(b, { y: 0, opacity: 1, duration: 1, stagger: 0.12, ease: "power3.out", overwrite: true }) })
}

/* ---------- 화면 전환 ---------- */
// 가로로 넘어가는 연습 밭: 세로 스크롤 → 가로 이동
const rail = document.querySelector(".studyrail"), track = $("#studyList")
const dist = () => Math.max(0, track.scrollWidth - rail.clientWidth + 2 * parseFloat(getComputedStyle(rail).paddingLeft))
if (!reduce) gsap.to(track, { x: () => -dist(), ease: "none",
  scrollTrigger: { trigger: rail, start: "center center", end: () => "+=" + dist(), pin: true, pinSpacing: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true } })

// 시간 지도는 핀 계산 뒤에 만든다
sts = stops.map(([sel]) => ScrollTrigger.create({ trigger: sel, start: "top top" }))
ScrollTrigger.addEventListener("refresh", measure)
ScrollTrigger.refresh()

// 메뉴를 누르면 꽃잎이 열리듯 원이 번지며 장이 바뀜
const iris = document.createElement("div")
iris.className = "iris"
document.body.append(iris)
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
  const k = stops.findIndex(([sel]) => sel === a.getAttribute("href"))
  if (k < 0 || reduce) return
  e.preventDefault()
  iris.dataset.t = a.textContent.replace(/[↓↑]/g, "").trim()
  iris.style.setProperty("--x", (e.clientX || innerWidth / 2) + "px")
  iris.style.setProperty("--y", (e.clientY || innerHeight / 2) + "px")
  gsap.timeline()
    .set(iris, { "--r": 0 })
    .to(iris, { "--r": 150, duration: 0.55, ease: "power3.in" })
    .add(() => { scrollTo({ top: marks[k][0], behavior: "instant" }); ScrollTrigger.update(); iris.style.setProperty("--x", "50%"); iris.style.setProperty("--y", "50%") })
    .to(iris, { "--r": 0, duration: 0.7, ease: "power3.out" })
}))

/* ---------- 사이트 미리보기: LIVE·카드에 마우스를 올리면 작은 화면이 따라옴 ---------- */
if (matchMedia("(hover:hover) and (pointer:fine)").matches) {
  const pv = document.createElement("div")
  pv.className = "pv"
  pv.setAttribute("aria-hidden", "true")
  pv.innerHTML = '<div class="pv__bar"><i></i><i></i><i></i><span></span></div><div class="pv__body"></div>'
  document.body.append(pv)
  const body = pv.querySelector(".pv__body"), cap = pv.querySelector(".pv__bar span")
  const cache = {}
  const make = (key, url, img, fb) => {
    if (cache[key]) return cache[key]
    let el
    if (img) { el = document.createElement("img"); el.src = img; el.alt = ""; el.onerror = () => { el.onerror = null; if (fb) el.src = fb } }
    else { el = document.createElement("iframe"); el.src = url; el.loading = "lazy"; el.tabIndex = -1; el.setAttribute("scrolling", "no") }
    return (cache[key] = el)
  }
  const items = []
  D.works.forEach((w) => document.querySelectorAll('#w-' + w.id + ' a').forEach((a) => items.push([a, w.name, w.url, w.local, w.img])))
  D.studies.forEach((st, i) => { const li = document.querySelectorAll("#studyList .study")[i]; if (li) items.push([li, st.name, st.url, null, null]) })
  let px = 0, py = 0, shownKey = ""
  const mx = gsap.quickTo(pv, "x", { duration: 0.35, ease: "power3" }), my = gsap.quickTo(pv, "y", { duration: 0.35, ease: "power3" })
  const place = (e) => {
    const w = pv.offsetWidth || 340, h = pv.offsetHeight || 240
    px = Math.min(e.clientX + 28, innerWidth - w - 16)
    py = Math.min(Math.max(e.clientY - h / 2, 70), innerHeight - h - 16)
    if (e.clientX + 28 + w > innerWidth - 16) px = e.clientX - w - 28
    mx(px); my(py)
  }
  items.forEach(([el, name, url, local, fb]) => {
    el.addEventListener("pointerenter", (e) => {
      if (shownKey !== url) { body.replaceChildren(make(url, url, local, fb)); shownKey = url }
      cap.textContent = name
      pv.classList.add("on")
      gsap.set(pv, { x: e.clientX + 28, y: e.clientY - 120 }); place(e)
    })
    el.addEventListener("pointermove", place)
    el.addEventListener("pointerleave", () => pv.classList.remove("on"))
  })
}

/* 다른 페이지에서 index.html#works 처럼 들어올 때: 장면 계산이 끝난 뒤 정확한 위치로 */
if (location.hash && $(location.hash)) addEventListener("load", () => setTimeout(() => { ScrollTrigger.refresh(); $(location.hash).scrollIntoView() }, 350))

/* 스크롤 연출: 카메라 이동, 바람, 꽃잎, 글자 띠 */
/* 실무 역량 (data.js 의 skills) — 이름만 간단히 */
{
  const S = D.skills, box = document.getElementById("skills")
  if (S && box) {
    const grp = (lv, arr) => `<div class="skill"><h4><span class="lv">${lv}</span></h4><ul class="sk">${arr.map((s) => `<li>${s.name}</li>`).join("")}</ul></div>`
    box.innerHTML = grp("DESIGN", S.design) + grp("DEVELOPMENT", S.dev) + grp("WORK PROCESS", S.process)
  }
}

/* ---------- 첫 화면: 흰 하늘 위로 풀밭이 올라오고, 꽃 스티커를 끌어 볼 수 있습니다 ---------- */
{
  const host = $("#stickers")
  if (host) {
    const place = () => {
      const W = innerWidth, small = W < 860, size = W < 560 ? 66 : W < 860 ? 88 : 128, hw = host.clientWidth, hh = host.clientHeight
      // [모양, 꽃잎색, 꽃술색, 기울기, 크기배율, PC 위치(x,y 비율), 모바일·태블릿 위치(x 비율, y 오프셋)]
      const list = [
        ["cross", "#FF704F", "#F2C83A", -8, 1.15, [0.78, 0.13], [0.0, 6]],
        ["tulip", "#F08AB0", "#F2C83A", 7, 0.8, [0.91, 0.3], [0.2, 26]],
        ["daisy", "#354BFF", "#FFD9A0", -5, 1.0, [0.74, 0.47], [0.4, 0]],
        ["spike", "#B48CF0", "#FFF1B8", 9, 0.9, [0.89, 0.6], [0.6, 22]],
        ["clover", "#D8F36A", "#E86A2A", -10, 0.72, [0.62, 0.63], [0.8, 8]],
      ]
      list.forEach(([k, p, c, r, m, pc, mo]) => {
        const sz = Math.round(size * m)
        const x = small ? mo[0] * (hw - sz) : Math.min(hw - sz, pc[0] * hw)
        const y = small ? mo[1] : pc[1] * hh - sz / 2
        mountSticker(host, { source: flowerSticker(k, p, c, r), width: sz, height: sz, x, y })
      })
    }
    // 글꼴이 자리 잡아 첫 화면 높이가 정해진 뒤에 배치
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]).then(place)
  }
  const root = document.documentElement
  let lastV = -1
  gsap.ticker.add(() => {
    const v = Math.max(0, Math.min(1, 1 - scrollY / (innerHeight * 0.75)))
    if (Math.abs(v - lastV) > 0.002) { lastV = v; root.style.setProperty("--v", v.toFixed(3)) }
  })
}

scrollFx(meadow, { bands: true })
