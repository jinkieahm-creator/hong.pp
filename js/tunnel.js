/* tunnel.js — 첫 화면: 작업물이 벽에 걸린 3D 복도 (three.js)
   벽에는 대표작 3편의 화면·펠리체골드 디자인·키워드 카드가 번갈아 걸립니다.
   이미지를 못 불러오면(인터넷·CORS) 글자 카드로 대신 보입니다. */
import * as THREE from "three"

const D = window.CIM_DATA
const frame = document.getElementById("top"), canvas = document.getElementById("tunnel"), lab = document.getElementById("warp")
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
const mobile = matchMedia("(max-width:760px)").matches

let renderer
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: "high-performance" }) }
catch (e) { frame.classList.add("no3d") }

if (renderer) {
  window.__tunnelOK = true
  const TW = 2, TH = 1.8, SD = 1, NS = 15, LR = .003, STZ = .05, CH = .1, FOG_FAR = NS * SD * .95, grid = 4
  const scene = new THREE.Scene()
  scene.background = new THREE.Color("#000")
  scene.fog = new THREE.Fog(new THREE.Color("#000"), 0, FOG_FAR - .01)
  const camera = new THREE.PerspectiveCamera(45, 1, 1, 1000)
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2))
  const lineMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#8e918b"), transparent: true, opacity: .4 })

  /* ----- 벽에 걸 카드 ----- */
  const pad = (n) => String(n).padStart(2, "0")
  const ITEMS = [
    ...D.works.map((w) => ({ big: w.no, t: w.name, lab: w.type.toUpperCase(), c: w.color, src: [w.local, w.img] })),
    { big: "UX", t: "UI/UX Designer", lab: "HONG EOJIN", c: "#C5FF00" },
    { big: "</>", t: "Web Publisher", lab: "HTML · CSS · JS · GSAP", c: "#F2F1EC" },
    { big: "MD", t: "From Jewelry MD", lab: "FELICE GOLD 2024—2026", c: "#C5FF00", src: ["images/felice/sale.jpg"] },
    { big: "09", t: "Rebuild Studies", lab: "STUDY · ANALYZE · REBUILD", c: "#F2F1EC", src: ["images/felice/collection.jpg"] },
    { big: "26", t: "Portfolio 2026", lab: "SELECTED WORKS", c: "#C5FF00" }
  ]
  const FONT = "Manrope, Pretendard, sans-serif"
  const paint = (cv, it, im) => {
    const x = cv.getContext("2d"), S = 512
    x.clearRect(0, 0, S, S)
    x.fillStyle = "#0c0c0c"; x.fillRect(0, 0, S, S)
    if (im) { // 이미지 꽉 채우기 + 아래 어둡게
      const r = Math.max(S / im.width, S / im.height), w = im.width * r, h = im.height * r
      x.drawImage(im, (S - w) / 2, 0, w, h)
      const g = x.createLinearGradient(0, S * .35, 0, S); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.88)"); x.fillStyle = g; x.fillRect(0, 0, S, S)
    } else {
      const g = x.createRadialGradient(0, 0, 0, 0, 0, 640); g.addColorStop(0, it.c + "66"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, S, S)
      x.globalAlpha = .06; x.fillStyle = "#fff"
      for (let k = -S; k < S; k += 26) { x.save(); x.translate(k, 0); x.rotate(.5); x.fillRect(0, -50, 4, 900); x.restore() }
      x.globalAlpha = 1
      x.fillStyle = it.c; x.font = `800 170px ${FONT}`; x.fillText(it.big, 26, 200)
    }
    x.fillStyle = it.c; x.fillRect(0, 0, S, 10)
    x.fillStyle = "rgba(255,255,255,.72)"; x.font = `700 26px ${FONT}`; x.fillText(it.lab, 32, im ? 392 : 262)
    x.fillStyle = "#fff"; x.font = `800 58px ${FONT}`
    const words = it.t.split(" "), lines = []; let line = ""
    words.forEach((w) => { const t = line ? line + " " + w : w; if (x.measureText(t).width > 450 && line) { lines.push(line); line = w } else line = t })
    lines.push(line); lines.reverse().forEach((l, k) => x.fillText(l, 32, 470 - k * 64))
  }
  const cards = ITEMS.map((it) => {
    const cv = document.createElement("canvas"); cv.width = cv.height = 512; paint(cv, it, null)
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false
    return { it, cv, t, mat: new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }), im: null }
  })
  const redraw = (c) => { paint(c.cv, c.it, c.im); c.t.needsUpdate = true }
  // 이미지 불러오기 (local → 원격 순서, 원격은 CORS 허용 필요)
  cards.forEach((c) => {
    const list = (c.it.src || []).filter(Boolean)
    const tryNext = (i) => {
      if (i >= list.length) return
      const im = new Image(); im.crossOrigin = "anonymous"
      im.onload = () => { c.im = im; redraw(c) }
      im.onerror = () => tryNext(i + 1)
      im.src = list[i]
    }
    tryNext(0)
  })
  if (document.fonts) document.fonts.ready.then(() => cards.forEach(redraw))

  const palette = ["#C5FF00", "#141414", "#FF704F", "#222222", "#F2F1EC", "#0f0f0f", "#354BFF"]
  const colorMats = palette.map((h) => new THREE.MeshBasicMaterial({ color: new THREE.Color(h), side: THREE.DoubleSide }))
  const hw = TW / 2, hh = TH / 2, colW = TW / grid, rowH = TH / grid
  const geoFloor = new THREE.PlaneGeometry(colW, SD), geoWall = new THREE.PlaneGeometry(SD, rowH)
  const tubeG = (a, b) => new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 1, LR, 8)
  const V3 = THREE.Vector3
  const geoZ = tubeG(new V3(0, 0, 0), new V3(0, 0, -SD)), geoX = tubeG(new V3(0, 0, 0), new V3(TW, 0, 0)), geoY = tubeG(new V3(0, 0, 0), new V3(0, TH, 0))
  const tube = (g, x, y) => { const m = new THREE.Mesh(g, lineMat); m.position.set(x, y, 0); return m }
  const SLOTS = [], z0 = -SD / 2
  for (let i = 0; i < grid; i++) { const x = -hw + i * colW + colW / 2; SLOTS.push({ g: geoFloor, p: [x, -hh, z0], r: [-Math.PI / 2, 0, 0] }, { g: geoFloor, p: [x, hh, z0], r: [Math.PI / 2, 0, 0] }) }
  for (let i = 0; i < grid; i++) { const y = -hh + i * rowH + rowH / 2; SLOTS.push({ g: geoWall, p: [-hw, y, z0], r: [0, Math.PI / 2, 0] }, { g: geoWall, p: [hw, y, z0], r: [0, -Math.PI / 2, 0] }) }
  let imageIndex = 0, colorIndex = 0, populateIndex = 0
  const populate = (group) => {
    const takes = populateIndex++ % 2 === 0
    for (const s of group.userData.slabs) {
      if (!takes || Math.random() > .5) { s.visible = false; continue }
      s.visible = true
      s.material = Math.random() > .6 ? colorMats[(5 * colorIndex++) % colorMats.length] : cards[imageIndex++ % cards.length].mat
    }
  }
  const segments = []
  for (let n = 0; n < NS; n++) {
    const g = new THREE.Group(); g.position.z = -n * SD
    for (let i = 0; i <= grid; i++) { const x = -hw + i * colW; g.add(tube(geoZ, x, -hh), tube(geoZ, x, hh)) }
    for (let i = 1; i < grid; i++) { const y = -hh + i * rowH; g.add(tube(geoZ, -hw, y), tube(geoZ, hw, y)) }
    g.add(tube(geoX, -hw, -hh), tube(geoX, -hw, hh), tube(geoY, -hw, -hh), tube(geoY, hw, -hh))
    g.userData.slabs = SLOTS.map((s) => { const m = new THREE.Mesh(s.g, colorMats[0]); m.position.set(...s.p); m.rotation.set(...s.r); m.visible = false; g.add(m); return m })
    populate(g); scene.add(g); segments.push(g)
  }

  const resize = () => { const w = Math.max(1, frame.clientWidth), h = Math.max(1, frame.clientHeight); camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false) }
  new ResizeObserver(resize).observe(frame); resize()
  let vis = true
  new IntersectionObserver((e) => { vis = e[0].isIntersecting }).observe(frame)

  /* 마우스 위치에 따라 카메라가 살짝 고개를 돌림 + 꾹 누르면 빨라짐 */
  let scrollPos = 0, pressed = false, mx = 0, my = 0, lx = 0, ly = 0
  const speed = reduce ? .15 : 1, boost = 10
  const animate = () => {
    requestAnimationFrame(animate)
    if (!vis) return
    scrollPos += pressed ? boost : speed
    camera.position.z += CH * (-STZ * scrollPos - camera.position.z)
    lx += (mx - lx) * .05; ly += (my - ly) * .05
    camera.rotation.y = -lx * .12; camera.rotation.x = -ly * .08
    const z = camera.position.z
    for (const seg of segments) {
      if (seg.position.z > z + SD) { let m = 0; for (const s of segments) m = Math.min(m, s.position.z); seg.position.z = m - SD; populate(seg) }
    }
    renderer.render(scene, camera)
  }
  animate()

  const release = () => { pressed = false; lab.textContent = "꾹 누르면 워프" }
  frame.addEventListener("pointermove", (e) => {
    const r = frame.getBoundingClientRect()
    mx = (e.clientX - r.left) / r.width * 2 - 1; my = (e.clientY - r.top) / r.height * 2 - 1
    if (e.pointerType !== "mouse" || e.target.closest(".hero__cta,.sticker")) { lab.style.opacity = "0"; return }
    lab.style.opacity = "1"; lab.style.left = e.clientX - r.left + "px"; lab.style.top = e.clientY - r.top + "px"
  })
  frame.addEventListener("pointerleave", () => { release(); lab.style.opacity = "0"; mx = my = 0 })
  frame.addEventListener("pointerdown", (e) => { if (e.target.closest(".hero__cta,a,button,.sticker")) return; pressed = true; lab.textContent = "워프 중…" })
  addEventListener("pointerup", release); addEventListener("pointercancel", release)
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); frame.classList.add("no3d") })
}
