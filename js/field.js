/* field.js — 바람에 흔들리는 설치 작품 (canvas 2D)
   v22 풀밭의 '바람에 흔들리는 느낌'을 전시 콘셉트에 맞게 선과 점으로 바꾼 것입니다.
   · 가만히 있어도 바람에 천천히 흔들림
   · 마우스(손가락)가 지나가면 그 방향으로 밀려나고, 놓으면 스프링처럼 돌아옴
   · 빠르게 스크롤하면 돌풍이 붐 (아래로 내리면 오른쪽, 올리면 왼쪽)
   사용: <canvas class="field" data-density="1" data-heads="0.14"></canvas> */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
  const fields = [...document.querySelectorAll("canvas.field")]
  if (!fields.length) return

  /* 스크롤 돌풍: 모든 설치 작품이 같이 씀 */
  let gust = 0, lastY = scrollY
  addEventListener("scroll", () => { const dy = scrollY - lastY; lastY = scrollY; gust = Math.max(-1.1, Math.min(1.1, gust + dy * 0.0016)) }, { passive: true })

  fields.forEach((cv) => {
    const g = cv.getContext("2d"), density = +(cv.dataset.density || 1), headRate = +(cv.dataset.heads || 0.14)
    let W = 0, H = 0, dpr = 1, blades = [], vis = false, raf = 0, last = 0
    const ptr = { x: -9999, y: -9999, vx: 0, px: -9999, on: false }

    const build = () => {
      dpr = Math.min(2, devicePixelRatio || 1)
      W = cv.clientWidth; H = cv.clientHeight
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
      const n = Math.round((W / (W < 600 ? 7 : 6)) * density)
      blades = Array.from({ length: n }, (_, i) => {
        const tall = Math.random()
        return {
          x: ((i + Math.random() * 0.8) / n) * W,
          h: H * (0.28 + Math.pow(tall, 1.6) * 0.66),
          w: 1 + Math.random() * 1.6,
          ang: 0, vel: 0,
          ph: Math.random() * 6.28, stiff: 18 + Math.random() * 14,
          head: Math.random() < headRate ? 2.4 + Math.random() * 3.2 : 0,
          lime: Math.random() < 0.55,
          shade: 0.35 + Math.random() * 0.65
        }
      })
    }

    const color = () => getComputedStyle(document.body).getPropertyValue("--fg").trim() || "#0E0E0E"

    const frame = (ts) => {
      raf = vis ? requestAnimationFrame(frame) : 0
      const dt = Math.min(0.033, last ? (ts - last) / 1000 : 0.016); last = ts
      const t = ts / 1000
      gust *= Math.exp(-dt * 1.6)
      ptr.vx *= Math.exp(-dt * 6)
      const fg = color()
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, W, H)
      g.lineCap = "round"
      for (const b of blades) {
        // 바람: 느린 큰 물결 + 빠른 잔물결 + 돌풍
        const wind = Math.sin(t * 0.7 + b.x * 0.0045) * 0.16 + Math.sin(t * 1.9 + b.x * 0.017 + b.ph) * 0.05 + gust * 0.55
        // 마우스: 가까운 선을 밀어냄 (높이까지 고려)
        let push = 0
        if (ptr.on) {
          const dx = b.x - ptr.x, reach = 130, tipY = H - b.h
          const vy = ptr.y < tipY - 40 ? 0 : 1
          if (Math.abs(dx) < reach && vy) { const f = 1 - Math.abs(dx) / reach; push = Math.sign(dx || 1) * f * f * 0.95 + ptr.vx * f * 0.004 }
        }
        const target = wind + push
        b.vel += ((target - b.ang) * b.stiff - b.vel * 4.2) * dt
        b.ang += b.vel * dt
        b.ang = Math.max(-1.25, Math.min(1.25, b.ang))
        // 그리기: 아래가 고정된 휘는 선
        const bx = b.x, by = H, s = Math.sin(b.ang), c = Math.cos(b.ang)
        const tx = bx + s * b.h, ty = by - c * b.h
        const cx = bx + Math.sin(b.ang * 0.45) * b.h * 0.55, cy = by - b.h * 0.6
        g.globalAlpha = b.shade
        g.strokeStyle = fg; g.lineWidth = b.w
        g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(cx, cy, tx, ty); g.stroke()
        if (b.head) {
          g.globalAlpha = 1
          g.fillStyle = b.lime ? "#C5FF00" : fg
          g.beginPath(); g.arc(tx, ty, b.head, 0, Math.PI * 2); g.fill()
          if (b.lime) { g.strokeStyle = fg; g.lineWidth = 1; g.globalAlpha = 0.5; g.stroke() }
        }
      }
      g.globalAlpha = 1
    }

    const start = () => { if (!raf && vis && !reduce) { last = 0; raf = requestAnimationFrame(frame) } }
    new ResizeObserver(() => { build(); if (reduce || !raf) frame(performance.now()) }).observe(cv)
    new IntersectionObserver((e) => { vis = e[0].isIntersecting; start() }, { rootMargin: "100px" }).observe(cv)

    const move = (e) => {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left
      if (ptr.px > -9000) ptr.vx = (x - ptr.px) / Math.max(0.016, 1 / 60) * 0.016 * 60
      ptr.px = x; ptr.x = x; ptr.y = e.clientY - r.top; ptr.on = true
    }
    // 캔버스 위쪽 여백에서도 반응하도록 부모 영역 기준으로 받음
    const zone = cv.parentElement
    zone.addEventListener("pointermove", move, { passive: true })
    zone.addEventListener("pointerdown", move, { passive: true })
    zone.addEventListener("pointerleave", () => { ptr.on = false; ptr.px = -9999 })
    addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") { ptr.on = false; ptr.px = -9999 } })
  })
})()
