/* project.js — 프로젝트 상세 (project.html?p=goldendew)
   메인 사이트와 같은 풀밭·하루의 시간 컨셉. 내용은 js/data.js 의 works[] 에서 고칩니다. */
import { mountMeadow } from "./meadow.js"
import { mountFlower } from "./flower3d.js"
import { scrollFx } from "./fx.js"

const D = window.CIM_DATA
const $ = (s) => document.querySelector(s)
const pad = (n) => String(n).padStart(2, "0")
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
const mobile = matchMedia("(max-width:768px)").matches
const list = D.works
const id = new URLSearchParams(location.search).get("p")
let i = list.findIndex((w) => w.id === id)
if (i < 0) i = 0
const w = list[i], n = list[(i + 1) % list.length], dt = w.detail || {}, cs = dt.case || {}
const has = (v) => (Array.isArray(v) ? v.length > 0 : !!v)
const bullets = (v) => (Array.isArray(v) ? `<ul class="bul">${v.map((t) => `<li>${t}</li>`).join("")}</ul>` : `<p>${v}</p>`)
document.title = `${w.name} — 홍어진 포트폴리오`
document.documentElement.style.setProperty("--pc", w.color)
document.documentElement.style.setProperty("--pi", w.ink)

const img = (alt) => `<img src="${w.local}" alt="${alt}" onerror="this.onerror=null;this.src='${w.img}'">`
let k = 0
const sec = (id, stage, title, body) => `
  <section class="pg pp-sec" id="${id}">
    <header class="sec-head">
      <span class="meta time">${pad(++k)} · ${stage}</span>
      <h2>${title}</h2>
    </header>
    ${body}
  </section>`

$("#app").innerHTML = `
  <section class="pg phero" id="top">
    <p class="meta">FLOWER ${w.no} / ${pad(list.length)} · ${w.type}</p>
    <h1>${w.name}</h1>
    <p class="slogan">${w.sub}</p>
    <div class="pvis">
      <div class="shotw"><div class="shot">${img(w.name + " 메인 화면")}</div><div class="fl" data-c="${w.color}"></div></div>
      <div class="pbox">
        <dl class="spec">
          <div><dt>유형</dt><dd>${w.type}</dd></div><div><dt>기간</dt><dd>${w.period}</dd></div>
          <div><dt>범위</dt><dd>${w.scope}</dd></div><div><dt>기술</dt><dd>${w.stack.join(" · ")}</dd></div>
        </dl>
        <a class="btn btn--solid" href="${w.url}" target="_blank" rel="noopener" data-cur="LIVE">라이브 사이트 보기 ↗</a>
      </div>
    </div>
    <a class="cue" href="#overview" data-cur="SCROLL">아래로 ↓</a>
  </section>

  ${sec("overview", "SEED · 프로젝트 소개", "어떤 프로젝트인가", `
    <div class="pbox"><p class="lead2">${w.desc}</p>
    <ul class="chips">${w.parts.map((p) => `<li>${p}</li>`).join("")}</ul></div>`)}

  ${has(cs.who) || has(cs.pain) ? sec("problem", "ROOT · 문제 정의", "누구의 어떤 문제인가", `
    <div class="pbox">${cs.who ? `<p><b>누구의 문제인가</b><br>${cs.who}</p>` : ""}${cs.pain ? `<p class="lead2">${cs.pain}</p>` : ""}${has(cs.evidence) ? `<p class="meta">근거</p>${bullets(cs.evidence)}` : ""}</div>`) : ""}

  ${sec("concept", "STEM · 디자인 콘셉트", "왜, 이렇게 설계했나", `
    <div class="pgrid">
      <article class="pbox"><b class="tag">QUESTION · 질문</b><p>${w.problem}</p></article>
      <article class="pbox"><b class="tag">APPROACH · 접근</b><p>${w.approach}</p></article>
      <article class="pbox"><b class="tag">RESULT · 결과</b><p>${w.result}</p></article>
    </div>`)}

  ${has(cs.decisions) ? sec("decisions", "LEAF · 설계 결정", "선택한 것과 버린 것", `<ol class="pbox dec">${cs.decisions.map((d) => `<li><b>${d.title}</b><br>${d.why}${d.alt ? `<br><small>검토했던 대안: ${d.alt}</small>` : ""}</li>`).join("")}</ol>`) : ""}

  ${has(dt.process) ? sec("process", "LEAF · 구현 과정", "만든 순서", `<ol class="pbox dec">${dt.process.map((p) => `<li>${p}</li>`).join("")}</ol>`) : ""}

  ${sec("screens", "BUD · 주요 화면", "실제로 배포된 화면", `
    <div class="browser"><div class="browser__bar"><i></i><i></i><i></i><span>${w.name} · Live preview</span></div>
      <div class="browser__view"><iframe data-w="1280" src="${w.url}" title="${w.name} 실제 사이트 미리보기" loading="lazy" tabindex="-1"></iframe></div></div>
    <p class="note2">배포된 실제 사이트를 그대로 불러온 미리보기입니다. (인터넷 연결 필요)</p>`)}

  ${sec("responsive", "PETAL · 반응형", "화면 크기에 맞춰 피어납니다", `
    ${dt.responsive ? `<div class="pbox"><p>${dt.responsive}</p></div>` : ""}
    <div class="devs">
      <figure class="dev dev--m"><div class="dev__view"><iframe data-w="390" src="${w.url}" title="${w.name} 모바일 폭 미리보기" loading="lazy" tabindex="-1"></iframe></div><figcaption>Mobile · 390px</figcaption></figure>
      <figure class="dev dev--t"><div class="dev__view"><iframe data-w="820" src="${w.url}" title="${w.name} 태블릿 폭 미리보기" loading="lazy" tabindex="-1"></iframe></div><figcaption>Tablet · 820px</figcaption></figure>
    </div>
    <p class="note2">같은 사이트를 모바일·태블릿 가로폭으로 불러온 미리보기입니다.</p>`)}

  ${has(dt.interaction) ? sec("interaction", "PETAL · 인터랙션", "직접 구현한 움직임", `<div class="pbox">${bullets(dt.interaction)}</div>`) : ""}
  ${has(cs.validation) ? sec("validation", "FRUIT · 검증", "확인한 것", `<div class="pbox">${bullets(cs.validation)}</div>`) : ""}
  ${dt.learned ? sec("learned", "FRUIT · 배운 점", "다음에 더 가꿀 것", `<div class="pbox"><p>${dt.learned}</p></div>`) : ""}

  <section class="pg pnext" id="next">
    <span class="meta">다음 꽃으로 · NEXT ${n.no} / ${pad(list.length)}</span>
    <a class="pnext__card" href="project.html?p=${n.id}" style="--pc:${n.color};--pi:${n.ink}" data-cur="NEXT" aria-label="다음 프로젝트 ${n.name}">
      <b>${n.name}</b><span>${n.sub}</span><i aria-hidden="true">→</i>
    </a>
    <footer class="foot"><span>© 2026 홍어진. All rights reserved.</span><a href="index.html#works">ALL WORKS</a><a href="index.html#contact">CONTACT</a><a href="#top">맨 위로 ↑</a></footer>
  </section>`

/* iframe 미리보기를 상자 폭에 맞춰 축소 */
const fit = () => document.querySelectorAll("iframe[data-w]").forEach((f) => {
  const W = +f.dataset.w, box = f.parentNode, s = box.clientWidth / W
  f.style.width = W + "px"
  f.style.height = box.clientHeight / s + "px"
  f.style.setProperty("--s", s.toFixed(4))
})
fit()
addEventListener("resize", fit)
addEventListener("load", fit)

document.querySelectorAll(".fl").forEach((el) => mountFlower(el, el.dataset.c, el.dataset.c === "#D8F36A" ? "#E86A2A" : "#F2C83A"))

/* 풀밭 배경: 페이지를 내려갈수록 아침 → 밤 */
const meadow = mountMeadow($("#meadow"), { day: { time: 6 }, flowers: 4.5, grass: mobile ? 3 : 5, depthBlur: mobile ? 2 : 4.9, eventTarget: document.documentElement })
const phase = (h) => (h < 8 ? "SUNRISE" : h < 16 ? "DAYTIME" : h < 19 ? "GOLDEN HOUR" : h < 21 ? "DUSK" : "NIGHT")
const tint = (h) => (h < 8 ? "#FFCB8C" : h < 16 ? "#FFF4DC" : h < 19 ? "#FF9A6A" : h < 21 ? "#C58AD0" : "#9DB0F0")
const stem = $(".stem"), clockT = $("#clockT"), clockP = $("#clockP"), clockI = $("#clockI")
let cur = 6, shown = ""
gsap.ticker.add(() => {
  const max = document.documentElement.scrollHeight - innerHeight
  const p = max > 0 ? Math.min(1, scrollY / max) : 0
  const t = 6 + 16 * p
  cur = reduce ? t : cur + (t - cur) * 0.08
  meadow.props.day.time = cur
  stem.style.setProperty("--p", p.toFixed(3))
  const label = pad(Math.floor(cur)) + ":" + pad(Math.floor(((cur % 1) * 60) / 10) * 10)
  if (label !== shown) { shown = label; clockT.textContent = label; clockP.textContent = phase(cur); clockI.style.background = tint(cur) }
})

/* 커서 라벨 */
if (matchMedia("(hover:hover) and (pointer:fine)").matches) {
  document.documentElement.classList.add("fine")
  const c = document.createElement("div")
  c.className = "cur"
  c.innerHTML = "<span></span>"
  document.body.append(c)
  const qx = gsap.quickTo(c, "x", { duration: 0.25, ease: "power3" }), qy = gsap.quickTo(c, "y", { duration: 0.25, ease: "power3" })
  addEventListener("pointermove", (e) => { c.classList.add("on"); qx(e.clientX); qy(e.clientY) })
  document.addEventListener("pointerover", (e) => {
    const t = e.target.closest("[data-cur]")
    c.classList.toggle("is-label", !!t)
    c.classList.toggle("is-link", !t && !!e.target.closest("a,button"))
    if (t) c.firstChild.textContent = t.dataset.cur
  })
  document.documentElement.addEventListener("pointerleave", () => c.classList.remove("on"))
}

/* 등장 효과 (글은 한 번 나타나면 그대로 남음) */
gsap.registerPlugin(ScrollTrigger)
if (!reduce) {
  gsap.from(".phero > *", { y: 40, opacity: 0, duration: 1, stagger: 0.12, ease: "power3.out", delay: 0.2 })
  const blocks = ".pp-sec .sec-head,.pbox,.browser,.dev,.note2,.pnext .meta,.pnext__card,.foot"
  gsap.set(blocks, { y: 44, opacity: 0 })
  ScrollTrigger.batch(blocks, { start: "top 93%", once: true, onEnter: (b) => gsap.to(b, { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: "power3.out", overwrite: true }) })
}

scrollFx(meadow)
