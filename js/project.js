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
const ov = dt.overview || {}, st = cs.strategy || {}, rf = dt.reflection || {}, rs = dt.responsive || {}
const esc = (t) => String(t == null ? "" : t)
const li = (a) => (a || []).map((t) => `<li>${t}</li>`).join("")
const STATUS = { done: ["확인 완료", "ok"], todo: ["추가 검증 필요", "todo"] }
let k = 0
const sec = (id, stage, title, body, sub) => `
  <section class="pg pp-sec cs" id="${id}">
    <header class="sec-head">
      <span class="meta time">${pad(++k)} · ${stage}</span>
      <h2>${title}</h2>
      ${sub ? `<p class="lead">${sub}</p>` : ""}
    </header>
    ${body}
  </section>`

/* 01 */
const s01 = sec("overview", "SEED · PROJECT OVERVIEW", "프로젝트 개요", `
  <div class="pbox">
    <dl class="ovgrid">
      <div><dt>프로젝트</dt><dd>${w.name}</dd></div>
      <div><dt>유형</dt><dd>${w.type}</dd></div>
      <div><dt>기간</dt><dd>${w.period}</dd></div>
      <div><dt>진행 형태</dt><dd>${ov.personal || ""}</dd></div>
      <div><dt>담당 역할</dt><dd>${ov.role || w.scope}</dd></div>
      <div><dt>사용 기술</dt><dd>${w.stack.join(" · ")}</dd></div>
    </dl>
    <p class="meta">PROJECT GOAL</p>
    <p class="lead2">${ov.goal || w.problem}</p>
    <ul class="chips">${li(w.parts)}</ul>
  </div>`)

/* 02 */
const s02 = sec("problem", "ROOT · PROBLEM DEFINITION", "문제 정의", `
  ${cs.personaNote ? `<p class="badge2">${cs.personaNote}</p>` : ""}
  <div class="qgrid">
    <article class="pbox"><b class="tag">TARGET USER</b><p>${esc(cs.who)}</p></article>
    <article class="pbox"><b class="tag">USER SCENARIO</b><p>${esc(cs.scenario)}</p></article>
    <article class="pbox"><b class="tag">PAIN POINT</b><p>${esc(cs.pain)}</p></article>
    <article class="pbox pbox--goal"><b class="tag">DESIGN GOAL</b><p>${esc(cs.goal)}</p></article>
  </div>`, "누가, 어떤 상황에서, 무엇이 불편한지를 먼저 구체적으로 적었습니다.")

/* 03 */
const s03 = sec("research", "ROOT · RESEARCH & INSIGHT", "근거와 인사이트", `
  <p class="badge2">실제 인터뷰 · 설문 · 사용자 테스트를 진행하지 않았습니다. 아래는 현장 경험, 가설, 화면 구조 분석입니다.</p>
  <div class="evgrid">${(cs.evidence || []).map((e) => `<article class="pbox ev"><b class="tag">${e.kind}</b><h3>${e.title}</h3><p>${e.text}</p></article>`).join("")}</div>
  ${has(cs.findSteps) ? `<div class="pbox"><p class="meta">사용자가 정보를 찾는 순서 (가설)</p><ol class="cs-steps">${li(cs.findSteps)}</ol></div>` : ""}
  ${has(cs.opportunities) ? `<div class="pbox"><p class="meta">개선 기회</p><ul class="bul">${li(cs.opportunities)}</ul></div>` : ""}`)

/* 04 */
const cmp = st.compare
const iaTree = (st.ia || []).map((r) => `<div class="ia"><b>${r.title}</b><ul>${li(r.children)}</ul></div>`).join("")
const flow = (st.flow || []).map((f) => { const [a, b] = f.split("|"); return `<li><small>${a}</small><b>${b}</b></li>` }).join("")
const s04 = sec("strategy", "STEM · DESIGN STRATEGY", "설계 전략", `
  ${has(st.improve) ? `<div class="pbox"><p class="meta">개선 방향</p><p class="lead2">${st.improve}</p></div>` : ""}
  <div class="pgrid2">
    <div class="pbox"><p class="meta">정보 구조 (IA)</p>${iaTree}</div>
    <div class="pbox"><p class="meta">콘텐츠 우선순위</p><ol class="cs-steps">${li(st.priority)}</ol></div>
  </div>
  <div class="pbox"><p class="meta">사용자 흐름</p><ol class="flow">${flow}</ol></div>
  <div class="pgrid2">
    <div class="pbox"><p class="meta">주요 UI 구성</p><ul class="bul">${li(st.ui)}</ul></div>
    <div class="pbox"><p class="meta">CTA 배치 이유</p><p>${esc(st.cta)}</p></div>
  </div>
  ${cmp ? `<div class="cmp"><p class="badge2">${cmp.note}</p>
    <div class="cmp__row">
      <article class="pbox cmp__b"><b class="tag">BEFORE · ${cmp.before.title}</b><ul class="bul">${li(cmp.before.items)}</ul></article>
      <article class="pbox cmp__a"><b class="tag">AFTER · ${cmp.after.title}</b><ul class="bul">${li(cmp.after.items)}</ul></article>
    </div></div>` : ""}`)

/* 05 */
const s05 = sec("decisions", "STEM · DESIGN DECISIONS", "디자인 의사결정", `
  <div class="decs">${(cs.decisions || []).map((d, n) => `
    <article class="pbox deccard"><span class="deccard__n">${pad(n + 1)}</span><h3>${d.title}</h3>
      <dl>
        <div><dt>문제 상황</dt><dd>${esc(d.situation)}</dd></div>
        <div><dt>선택한 디자인</dt><dd>${esc(d.choice)}</dd></div>
        <div><dt>선택한 이유</dt><dd>${esc(d.why)}</dd></div>
        <div><dt>검토한 대안</dt><dd>${esc(d.alt)}</dd></div>
        <div><dt>기대한 효과</dt><dd>${esc(d.effect)}</dd></div>
      </dl></article>`).join("")}</div>`, "요소를 나열하지 않고, 왜 그렇게 정했는지를 카드마다 적었습니다.")

/* 06 */
const s06 = sec("implementation", "LEAF · IMPLEMENTATION", "구현", `
  <div class="impl">${(dt.implementation || []).map((m) => `<article class="pbox"><b class="tag">${m.tag}</b><h3>${m.title}</h3><p>${m.body}</p>${m.code ? `<pre class="code"><code>${esc(m.code).replace(/</g, "&lt;")}</code></pre>` : ""}</article>`).join("")}</div>
  <div class="browser"><div class="browser__bar"><i></i><i></i><i></i><span>${w.name} · Live preview</span></div>
    <div class="browser__view"><iframe data-w="1280" src="${w.url}" title="${w.name} 실제 사이트 미리보기" loading="lazy" tabindex="-1"></iframe></div></div>
  <p class="note2">배포된 실제 사이트를 그대로 불러온 미리보기입니다. (인터넷 연결 필요)</p>`, "이 프로젝트에서 실제로 구현한 기능만 적었습니다.")

/* 07 */
const dev = (k2, t) => (rs[k2] ? `<article class="pbox"><b class="tag">${t}</b><p>${rs[k2]}</p></article>` : "")
const s07 = sec("responsive", "PETAL · RESPONSIVE & INTERACTION", "반응형과 인터랙션", `
  <div class="pgrid">${dev("desktop", "DESKTOP")}${dev("tablet", "TABLET")}${dev("mobile", "MOBILE")}</div>
  <div class="devs">
    <figure class="dev dev--m"><div class="dev__view"><iframe data-w="390" src="${w.url}" title="${w.name} 모바일 폭 미리보기" loading="lazy" tabindex="-1"></iframe></div><figcaption>Mobile · 390px</figcaption></figure>
    <figure class="dev dev--t"><div class="dev__view"><iframe data-w="820" src="${w.url}" title="${w.name} 태블릿 폭 미리보기" loading="lazy" tabindex="-1"></iframe></div><figcaption>Tablet · 820px</figcaption></figure>
  </div>
  <p class="note2">${rs.intro || ""}</p>
  ${has(dt.interaction) ? `<div class="pbox itx"><table><thead><tr><th>사용자 행동</th><th>화면 반응</th><th>구현 방식</th><th>사용 목적</th></tr></thead><tbody>${dt.interaction.map((r) => `<tr><td data-l="사용자 행동">${r.action}</td><td data-l="화면 반응">${r.response}</td><td data-l="구현 방식">${r.how}</td><td data-l="사용 목적">${r.purpose}</td></tr>`).join("")}</tbody></table></div>` : ""}`)

/* 08 */
const s08 = sec("validation", "FLOWER · VALIDATION & IMPROVEMENT", "검증과 개선", `
  <p class="badge2">확인하지 않은 항목은 완료로 표시하지 않았습니다. 사용성 테스트 결과와 수치 성과는 없습니다.</p>
  <ul class="vlist">${(cs.validation || []).map((v) => { const [t, c] = STATUS[v.status] || STATUS.todo; return `<li><span class="chip2 chip2--${c}">${t}</span><b>${v.item}</b><small>${v.note || ""}</small></li>` }).join("")}</ul>`)

/* 09 */
const s09 = sec("reflection", "NIGHT · REFLECTION", "돌아보며", `
  <div class="pgrid2">
    <article class="pbox"><b class="tag">가장 어려웠던 부분</b><p>${esc(rf.hard)}</p></article>
    <article class="pbox"><b class="tag">해결 과정</b><p>${esc(rf.solve)}</p></article>
    <article class="pbox"><b class="tag">잘한 점</b><p>${esc(rf.good)}</p></article>
    <article class="pbox"><b class="tag">부족했던 점</b><p>${esc(rf.lack)}</p></article>
  </div>
  <div class="pbox"><b class="tag">다음 버전에서 개선할 내용</b><ul class="bul">${li(rf.next)}</ul></div>`)

const only = (cond, html) => (cond ? html : "")
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
  ${s01}${s02}${s03}${s04}${s05}${s06}${s07}${s08}${s09}

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
const lowEnd = mobile || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4
const meadow = mountMeadow($("#meadow"), { day: { time: 6 }, flowers: lowEnd ? 3 : 4.5, grass: lowEnd ? 2.5 : 5, depthBlur: lowEnd ? 2 : 4.9, eventTarget: document.documentElement })
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
  const blocks = ".pp-sec .sec-head,.pbox,.cmp__row>*,.browser,.dev,.note2,.badge2,.vlist li,.flow,.pnext .meta,.pnext__card,.foot"
  gsap.set(blocks, { y: 44, opacity: 0 })
  ScrollTrigger.batch(blocks, { start: "top 93%", once: true, onEnter: (b) => gsap.to(b, { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: "power3.out", overwrite: true }) })
}

scrollFx(meadow)
