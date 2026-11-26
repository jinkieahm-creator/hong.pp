/* fx.js — 스크롤에 반응하는 화면 연출 (글이 사라지지 않는 움직임만)
   scrollFx(meadow, { bands }) : 메인·상세 페이지 공통 */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

export function scrollFx(meadow, { bands = false } = {}) {
  if (reduce) return
  const mobile = matchMedia("(max-width:768px)").matches

  /* 1) 풀밭 카메라: 스크롤할수록 하늘을 올려다보며 풀밭으로 다가감 + 스크롤이 빠르면 바람이 세짐 */
  const baseWind = 5, baseCloud = 3
  let lastY = scrollY, boost = 0
  gsap.ticker.add((_, dt) => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight)
    const p = clamp(scrollY / max, 0, 1)
    const vel = Math.abs(scrollY - lastY) / Math.max(1, dt)  // px / ms
    lastY = scrollY
    boost += (clamp(vel / 2.2, 0, 1) - boost) * 0.08
    const pr = meadow.props
    pr.tilt += (p - pr.tilt) * 0.08
    pr.zoom += (p * 0.9 - pr.zoom) * 0.08
    pr.wind = baseWind + boost * 5
    pr.cloudSpeed = baseCloud + boost * 5
  })

  /* 2) 떠다니는 꽃잎: 스크롤하면 서로 다른 속도로 위로 흘러감 */
  const wrap = document.createElement("div")
  wrap.className = "petals"
  wrap.setAttribute("aria-hidden", "true")
  const cols = ["#F4B0BA", "#FFCB8C", "#FFF4DC", "#F08AB0", "#F2C83A"]
  const petals = Array.from({ length: mobile ? 8 : 16 }, (_, i) => {
    const el = document.createElement("i")
    const size = 7 + Math.random() * 11
    el.style.cssText = `width:${size}px;height:${size}px;background:${cols[i % cols.length]};opacity:${0.35 + Math.random() * 0.4}`
    wrap.append(el)
    return { el, x: Math.random(), y: Math.random(), rate: 0.12 + Math.random() * 0.55, ph: Math.random() * 6.28, spin: 0.05 + Math.random() * 0.2 }
  })
  document.body.insertBefore(wrap, document.getElementById("meadow").nextSibling)
  gsap.ticker.add((t) => {
    const H = innerHeight + 120, W = innerWidth
    petals.forEach((p) => {
      const y = ((((p.y * H - scrollY * p.rate) % H) + H) % H) - 60
      const x = p.x * W + Math.sin(t * 0.6 + p.ph) * 28
      p.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${(scrollY * p.spin + t * 20 * p.spin).toFixed(1)}deg)`
    })
  })

  /* 3) 큰 제목은 스크롤에 맞춰 옆으로 살짝 미끄러짐 (글은 그대로 보임) */
  document.querySelectorAll(".sec-head h2,.msg h2,.contact h2,.phero h1,.pnext__card b").forEach((el, i) => {
    const d = i % 2 ? -1 : 1
    gsap.fromTo(el, { x: d * -26 }, { x: d * 26, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } })
  })
  const h1 = document.querySelector(".hero h1")
  if (h1) gsap.to(h1, { x: -70, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } })

  /* 4) 작품 이미지는 카드 안에서 천천히 이동 (패럴랙스) */
  document.querySelectorAll(".work .shot img,.pvis .shot img").forEach((img) => {
    gsap.fromTo(img, { yPercent: -8, scale: 1.2 }, { yPercent: 8, scale: 1.2, ease: "none", scrollTrigger: { trigger: img.closest(".shot"), start: "top bottom", end: "bottom top", scrub: true } })
  })

  /* 5) 글자 띠: 스크롤하면 옆으로 흘러가는 큰 문구 (장식, 읽는 글과 겹치지 않음) */
  if (bands) {
    const make = (text, before, dir) => {
      const t = document.querySelector(before)
      if (!t) return
      const b = document.createElement("div")
      b.className = "band"
      b.setAttribute("aria-hidden", "true")
      b.innerHTML = `<div class="band__t">${Array(6).fill(`<span>${text}</span>`).join("")}</div>`
      t.parentNode.insertBefore(b, t)
      gsap.fromTo(b.firstChild, { xPercent: dir > 0 ? -34 : 0 }, { xPercent: dir > 0 ? 0 : -34, ease: "none", scrollTrigger: { trigger: b, start: "top bottom", end: "bottom top", scrub: true } })
    }
    make("SEED — ROOT — STEM — BUD — BLOOM —", "#message", -1)
    make("GROW — TOGETHER — GROW — TOGETHER —", "#contact", 1)
  }
}
