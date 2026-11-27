/* project.js — 케이스 스터디 (project.html?p=goldendew)
   내용은 js/data.js 의 works[].detail 에서 고칩니다. 채운 항목만 화면에 나타납니다. */
(function () {
  const D = window.CIM_DATA
  const $ = (s) => document.querySelector(s)
  const pad = (n) => String(n).padStart(2, "0")
  const list = D.works
  let i = list.findIndex((w) => w.id === new URLSearchParams(location.search).get("p"))
  if (i < 0) i = 0
  const w = list[i], n = list[(i + 1) % list.length], dt = w.detail || {}, cs = dt.case || {}
  const ov = dt.overview || {}, st = cs.strategy || {}, rf = dt.reflection || {}, rs = dt.responsive || {}
  const has = (v) => (Array.isArray(v) ? v.length > 0 : !!v)
  const t = (v) => String(v == null ? "" : v)
  const li = (a) => (a || []).map((x) => `<li>${x}</li>`).join("")
  const STATUS = { done: ["확인 완료", "ok"], todo: ["추가 검증 필요", ""] }
  document.title = `${w.name} — 케이스 스터디 | 홍어진 포트폴리오`
  document.documentElement.style.setProperty("--pc", w.color)

  const toc = []
  const sec = (id, en, title, body, sub) => {
    toc.push([id, title])
    return `<section class="cs" id="${id}" data-theme="light" data-room="${pad(toc.length)}|${en}">
      <header class="cs__head"><span class="eyebrow">${pad(toc.length)} · ${en}</span><h2 class="split">${title}</h2>${sub ? `<p>${sub}</p>` : ""}</header>${body}</section>`
  }

  const s = []
  s.push(sec("overview", "OVERVIEW", "프로젝트 개요", `
    <div class="box">
      <dl class="ov">
        <div><dt>PROJECT</dt><dd>${w.name}</dd></div><div><dt>TYPE</dt><dd>${w.type}</dd></div><div><dt>YEAR</dt><dd>${w.period}</dd></div>
        <div><dt>FORM</dt><dd>${t(ov.personal)}</dd></div><div><dt>ROLE</dt><dd>${ov.role || w.scope}</dd></div><div><dt>STACK</dt><dd>${w.stack.join(" · ")}</dd></div>
      </dl>
      <span class="tag">PROJECT GOAL</span>
      <p class="lead2">${ov.goal || w.problem}</p>
      <ul class="chips">${li(w.parts)}</ul>
    </div>`))

  s.push(sec("problem", "PROBLEM", "문제 정의", `
    ${cs.personaNote ? `<p class="disclaim">${cs.personaNote}</p>` : ""}
    <div class="g2">
      <article class="box rv"><span class="tag">TARGET USER</span><p>${t(cs.who)}</p></article>
      <article class="box rv"><span class="tag">USER SCENARIO</span><p>${t(cs.scenario)}</p></article>
      <article class="box rv"><span class="tag">PAIN POINT</span><p class="lead2">${t(cs.pain)}</p></article>
      <article class="box rv"><span class="tag">DESIGN GOAL</span><p class="lead2">${t(cs.goal)}</p></article>
    </div>`, "누가, 어떤 상황에서, 무엇이 불편한지를 먼저 구체적으로 적었습니다."))

  s.push(sec("research", "RESEARCH", "근거와 인사이트", `
    <p class="disclaim">실제 인터뷰 · 설문 · 사용자 테스트는 진행하지 않았습니다. 아래는 현장 경험, 가설, 화면 구조 분석입니다.</p>
    <div class="g3">${(cs.evidence || []).map((e) => `<article class="box rv"><span class="tag">${e.kind}</span><h3>${e.title}</h3><p>${e.text}</p></article>`).join("")}</div>
    <div class="g2">
      ${has(cs.findSteps) ? `<div class="box rv"><span class="tag">정보를 찾는 순서 (가설)</span><ol class="num-list">${li(cs.findSteps)}</ol></div>` : ""}
      ${has(cs.opportunities) ? `<div class="box rv"><span class="tag">개선 기회</span><ol class="num-list">${li(cs.opportunities)}</ol></div>` : ""}
    </div>`))

  const cmp = st.compare
  const flow = (st.flow || []).map((f) => { const [a, b] = f.split("|"); return `<li><small>${a}</small><b>${b}</b></li>` }).join("")
  s.push(sec("strategy", "STRATEGY", "설계 전략", `
    ${has(st.improve) ? `<div class="box rv"><span class="tag">개선 방향</span><p class="lead2">${st.improve}</p></div>` : ""}
    <div class="g2">
      <div class="box rv"><span class="tag">정보 구조 (IA)</span>${(st.ia || []).map((r) => `<div class="ia"><b>${r.title}</b><ul>${li(r.children)}</ul></div>`).join("")}</div>
      <div class="box rv"><span class="tag">콘텐츠 우선순위</span><ol class="num-list">${li(st.priority)}</ol></div>
    </div>
    <div class="box rv"><span class="tag">사용자 흐름</span><ol class="flow">${flow}</ol></div>
    <div class="g2">
      <div class="box rv"><span class="tag">주요 UI 구성</span><ul class="bul">${li(st.ui)}</ul></div>
      <div class="box rv"><span class="tag">CTA 배치 이유</span><p>${t(st.cta)}</p></div>
    </div>
    ${cmp ? `<p class="disclaim" style="margin-top:22px">${cmp.note}</p>
    <div class="cmp">
      <article class="box rv"><span class="tag">BEFORE</span><h3>${cmp.before.title}</h3><ul class="bul">${li(cmp.before.items)}</ul></article>
      <article class="box after rv"><span class="tag">AFTER</span><h3>${cmp.after.title}</h3><ul class="bul">${li(cmp.after.items)}</ul></article>
    </div>` : ""}`))

  s.push(sec("decisions", "DECISIONS", "디자인 의사결정", `
    <div class="dec">${(cs.decisions || []).map((d, k) => `
      <article class="box rv"><span class="dec__n">${pad(k + 1)}</span><h3>${d.title}</h3>
        <dl><div><dt>문제 상황</dt><dd>${t(d.situation)}</dd></div><div><dt>선택한 디자인</dt><dd>${t(d.choice)}</dd></div>
        <div><dt>선택한 이유</dt><dd>${t(d.why)}</dd></div><div><dt>검토한 대안</dt><dd>${t(d.alt)}</dd></div><div><dt>기대한 효과</dt><dd>${t(d.effect)}</dd></div></dl>
      </article>`).join("")}</div>`, "요소를 나열하지 않고, 왜 그렇게 정했는지를 카드마다 적었습니다."))

  s.push(sec("build", "IMPLEMENTATION", "구현", `
    <div class="g3">${(dt.implementation || []).map((m) => `<article class="box rv"><span class="tag">${m.tag}</span><h3>${m.title}</h3><p>${m.body}</p></article>`).join("")}</div>
    <div class="browser rv"><div class="frame__bar"><i></i><i></i><i></i><span>${w.url.replace(/^https?:\/\//, "")}</span></div>
      <div class="frame__view"><iframe data-w="1280" data-src="${w.url}" title="${w.name} 실제 사이트 미리보기" tabindex="-1"></iframe></div></div>
    <p class="disclaim" style="margin-top:12px">배포된 실제 사이트를 그대로 불러온 미리보기입니다. (인터넷 연결 필요)</p>`, "이 프로젝트에서 실제로 구현한 기능만 적었습니다."))

  const devBox = (k, l) => (rs[k] ? `<article class="box rv"><span class="tag">${l}</span><p>${rs[k]}</p></article>` : "")
  s.push(sec("responsive", "RESPONSIVE", "반응형과 인터랙션", `
    <div class="g3">${devBox("desktop", "DESKTOP")}${devBox("tablet", "TABLET")}${devBox("mobile", "MOBILE")}</div>
    <div class="devs">
      <figure class="dev dev--m rv"><div class="dev__view"><iframe data-w="390" data-src="${w.url}" title="${w.name} 모바일 폭 미리보기" tabindex="-1"></iframe></div><figcaption>MOBILE · 390PX</figcaption></figure>
      <figure class="dev dev--t rv"><div class="dev__view"><iframe data-w="820" data-src="${w.url}" title="${w.name} 태블릿 폭 미리보기" tabindex="-1"></iframe></div><figcaption>TABLET · 820PX</figcaption></figure>
    </div>
    ${rs.intro ? `<p class="disclaim">${rs.intro}</p>` : ""}
    ${has(dt.interaction) ? `<div class="box itx rv"><table><thead><tr><th>사용자 행동</th><th>화면 반응</th><th>구현 방식</th><th>사용 목적</th></tr></thead><tbody>${dt.interaction.map((r) => `<tr><td data-l="사용자 행동">${r.action}</td><td data-l="화면 반응">${r.response}</td><td data-l="구현 방식">${r.how}</td><td data-l="사용 목적">${r.purpose}</td></tr>`).join("")}</tbody></table></div>` : ""}`))

  s.push(sec("validation", "VALIDATION", "검증과 개선", `
    <p class="disclaim">확인하지 않은 항목은 완료로 표시하지 않았습니다. 사용성 테스트 결과와 수치 성과는 아직 없습니다.</p>
    <ul class="vlist">${(cs.validation || []).map((v) => { const [l, c] = STATUS[v.status] || STATUS.todo; return `<li class="rv"><span class="st ${c}">${l}</span><b>${v.item}</b><small>${t(v.note)}</small></li>` }).join("")}</ul>`))

  s.push(sec("reflection", "REFLECTION", "돌아보며", `
    <div class="g2">
      <article class="box rv"><span class="tag">가장 어려웠던 부분</span><p>${t(rf.hard)}</p></article>
      <article class="box rv"><span class="tag">해결 과정</span><p>${t(rf.solve)}</p></article>
      <article class="box rv"><span class="tag">잘한 점</span><p>${t(rf.good)}</p></article>
      <article class="box rv"><span class="tag">부족했던 점</span><p>${t(rf.lack)}</p></article>
    </div>
    <div class="box rv"><span class="tag">다음 버전에서 개선할 내용</span><ol class="num-list">${li(rf.next)}</ol></div>`))

  const img = `<img src="${w.local}" alt="${w.name} 메인 화면" onerror="if(this.dataset.f){this.remove()}else{this.dataset.f=1;this.src='${w.img}'}">`
  document.getElementById("app").innerHTML = `
  <section class="phero" id="top" data-theme="dark" data-room="${w.no}|${w.name.toUpperCase()}">
    <div class="wrap">
      <div class="crumb"><a href="index.html#works">← ALL WORKS</a><span class="eyebrow">CASE STUDY ${w.no} / ${pad(list.length)}</span></div>
      <h1><span class="line-mask"><span>${w.name}</span></span></h1>
      <p class="sub">${w.sub}</p>
      <div class="phero__grid">
        <a class="frame" href="${w.url}" target="_blank" rel="noopener" data-cur="LIVE" style="--c:${w.color}" aria-label="${w.name} 라이브 사이트 열기">
          <div class="frame__bar"><i></i><i></i><i></i><span>${w.url.replace(/^https?:\/\//, "")}</span></div>
          <div class="frame__view"><span class="ph" aria-hidden="true">${w.name}</span>${img}</div>
        </a>
        <div>
          <dl class="spec"><dt>TYPE</dt><dd>${w.type}</dd><dt>YEAR</dt><dd>${w.period}</dd><dt>ROLE</dt><dd>${w.scope}</dd><dt>STACK</dt><dd>${w.stack.join(" · ")}</dd></dl>
          <p style="margin:0 0 24px;color:var(--mute)">${w.desc}</p>
          <a class="btn btn--lime" href="${w.url}" target="_blank" rel="noopener">라이브 사이트 보기 ↗</a>
        </div>
      </div>
    </div>
  </section>
  <div class="cs-layout" data-theme="light" data-room="CASE|STUDY">
    <ol class="toc" id="toc" aria-label="케이스 스터디 목차">${toc.map(([id, title], k) => `<li><a href="#${id}"><small>${pad(k + 1)}</small>${title}</a></li>`).join("")}</ol>
    <div>${s.join("")}</div>
  </div>
  <section class="pnext" data-theme="dark" data-room="NEXT|${n.name.toUpperCase()}" style="--pc:${n.color}">
    <div class="wrap"><span class="eyebrow">NEXT CASE · ${n.no} / ${pad(list.length)}</span></div>
    <a class="pnext__card" href="project.html?p=${n.id}" data-cur="NEXT" aria-label="다음 프로젝트 ${n.name}"><b>${n.name} →</b><span>${n.sub}</span></a>
    <footer class="foot"><span>© 2026 홍어진 Hong Eojin</span><a href="index.html#works">ALL WORKS</a><a href="index.html#contact">CONTACT</a><a href="summary.html">1페이지 요약</a><a href="#top">맨 위로 ↑</a></footer>
  </section>`

  /* 미리보기 iframe: 화면에 가까워질 때 불러오고, 상자 폭에 맞게 축소 */
  const fit = () => document.querySelectorAll("iframe[data-w]").forEach((f) => {
    const W = +f.dataset.w, box = f.parentNode, sc = box.clientWidth / W
    f.style.width = W + "px"; f.style.height = box.clientHeight / sc + "px"; f.style.setProperty("--s", sc.toFixed(4))
  })
  fit(); addEventListener("resize", fit)
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.src = e.target.dataset.src; io.unobserve(e.target) } }), { rootMargin: "400px" })
  document.querySelectorAll("iframe[data-src]").forEach((f) => io.observe(f))

  /* 목차: 지금 읽는 장 표시 */
  const links = [...document.querySelectorAll("#toc a")]
  const io2 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id)) }), { rootMargin: "-45% 0px -50% 0px" })
  document.querySelectorAll(".cs").forEach((el) => io2.observe(el))

  if (window.gsap && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gsap.from(".phero h1 .line-mask>span", { yPercent: 110, duration: 1.2, ease: "power4.out", delay: .2 })
    gsap.from(".crumb,.phero .sub,.phero__grid>*", { y: 40, opacity: 0, duration: 1, stagger: .1, ease: "power3.out", delay: .35 })
  }
})()
