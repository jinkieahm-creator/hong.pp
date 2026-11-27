/* stickers.js — 첫 화면 스티커 5장 (끌어서 떼었다 붙이기)
   그림은 코드로 그려서 외부 이미지가 필요 없습니다. 글자·색·위치는 아래 LIST 에서 바꾸세요. */
import { mountSticker } from "./sticker.js"

const INK = "#0E0E0E", LIME = "#C5FF00", PAPER = "#F2F1EC", CORAL = "#FF704F", BLUE = "#354BFF"
const FONT = "Manrope, 'Pretendard Variable', Pretendard, sans-serif"

/* 오려 낸 스티커처럼: 모양 경로를 흰 테두리로 두껍게 그린 뒤 채움 */
const cut = (g, path, fill, line = 22) => {
  g.save(); g.lineJoin = "round"; g.strokeStyle = "#fff"; g.lineWidth = line; g.stroke(path); g.fillStyle = "#fff"; g.fill(path); g.restore()
  g.fillStyle = fill; g.fill(path)
  g.strokeStyle = "rgba(0,0,0,.12)"; g.lineWidth = 2; g.stroke(path)
}
const canvas = (rot) => { const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d"); g.translate(128, 128); g.rotate((rot * Math.PI) / 180); g.translate(-128, -128); return [c, g] }
const text = (g, t, x, y, size, color, weight = 800, align = "center") => { g.fillStyle = color; g.font = `${weight} ${size}px ${FONT}`; g.textAlign = align; g.textBaseline = "middle"; g.fillText(t, x, y) }

const DRAW = {
  // 입장권: 양옆이 파인 티켓
  ticket(rot) {
    const [c, g] = canvas(rot), p = new Path2D(), x = 28, y = 70, w = 200, h = 116, r = 14
    p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.arcTo(x + w, y, x + w, y + r, r); p.lineTo(x + w, y + h / 2 - 14); p.arc(x + w, y + h / 2, 14, -Math.PI / 2, Math.PI / 2, true)
    p.lineTo(x + w, y + h - r); p.arcTo(x + w, y + h, x + w - r, y + h, r); p.lineTo(x + r, y + h); p.arcTo(x, y + h, x, y + h - r, r); p.lineTo(x, y + h / 2 + 14)
    p.arc(x, y + h / 2, 14, Math.PI / 2, -Math.PI / 2, true); p.lineTo(x, y + r); p.arcTo(x, y, x + r, y, r); p.closePath()
    cut(g, p, LIME)
    g.setLineDash([5, 6]); g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(178, y + 10); g.lineTo(178, y + h - 10); g.stroke(); g.setLineDash([])
    text(g, "ADMIT", 102, 108, 34, INK); text(g, "ONE", 102, 142, 34, INK); text(g, "No.2026", 102, 170, 13, INK, 700)
    g.save(); g.translate(203, 128); g.rotate(-Math.PI / 2); text(g, "HONG EOJIN", 0, 0, 12, INK, 800); g.restore()
    return c
  },
  // 둥근 배지: 가장자리를 도는 글자
  badge(rot) {
    const [c, g] = canvas(rot), p = new Path2D(); p.arc(128, 128, 100, 0, Math.PI * 2)
    cut(g, p, INK)
    g.strokeStyle = LIME; g.lineWidth = 2; g.beginPath(); g.arc(128, 128, 62, 0, Math.PI * 2); g.stroke()
    const t = "OPEN TO WORK · NEW GRAD 2026 · ", step = (Math.PI * 2) / t.length
    g.font = `800 15px ${FONT}`; g.fillStyle = PAPER; g.textAlign = "center"; g.textBaseline = "middle"
    ;[...t].forEach((ch, i) => { g.save(); g.translate(128, 128); g.rotate(i * step); g.fillText(ch, 0, -80); g.restore() })
    text(g, "HI!", 128, 128, 44, LIME)
    return c
  },
  // 피그마 협업 커서 + 이름표
  figma(rot) {
    const [c, g] = canvas(rot), p = new Path2D()
    p.moveTo(46, 40); p.lineTo(46, 150); p.lineTo(76, 122); p.lineTo(100, 168); p.lineTo(120, 158); p.lineTo(98, 114); p.lineTo(138, 112); p.closePath()
    const tag = new Path2D(); tag.roundRect(96, 150, 132, 52, 26)
    const all = new Path2D(); all.addPath(p); all.addPath(tag)
    g.save(); g.lineJoin = "round"; g.strokeStyle = "#fff"; g.lineWidth = 22; g.stroke(all); g.restore()
    g.fillStyle = LIME; g.fill(p); g.strokeStyle = INK; g.lineWidth = 5; g.lineJoin = "round"; g.stroke(p)
    g.fillStyle = INK; g.fill(tag)
    text(g, "Eojin", 162, 177, 26, LIME)
    return c
  },
  // 컬러칩 (팬톤 카드처럼)
  chip(rot) {
    const [c, g] = canvas(rot), p = new Path2D(); p.roundRect(58, 28, 140, 200, 10)
    cut(g, p, "#fff")
    const sw = new Path2D(); sw.roundRect(68, 38, 120, 118, 4); g.fillStyle = LIME; g.fill(sw)
    text(g, "HONG", 70, 178, 22, INK, 800, "left"); text(g, "#C5FF00", 70, 204, 15, INK, 700, "left")
    return c
  },
  // 보석 (보석감정사)
  gem(rot) {
    const [c, g] = canvas(rot), p = new Path2D()
    p.moveTo(80, 64); p.lineTo(176, 64); p.lineTo(214, 106); p.lineTo(128, 210); p.lineTo(42, 106); p.closePath()
    cut(g, p, "#DDEBFF")
    g.strokeStyle = "rgba(53,75,255,.55)"; g.lineWidth = 3; g.lineJoin = "round"
    g.beginPath(); g.moveTo(42, 106); g.lineTo(214, 106); g.moveTo(80, 64); g.lineTo(104, 106); g.lineTo(128, 64); g.lineTo(152, 106); g.lineTo(176, 64)
    g.moveTo(104, 106); g.lineTo(128, 210); g.lineTo(152, 106); g.stroke()
    g.fillStyle = "rgba(255,255,255,.8)"; g.beginPath(); g.moveTo(92, 72); g.lineTo(112, 72); g.lineTo(100, 96); g.closePath(); g.fill()
    const r = new Path2D(); r.roundRect(52, 196, 152, 38, 19); g.fillStyle = BLUE; g.fill(r)
    text(g, "GEMOLOGIST", 128, 216, 16, "#fff")
    return c
  },
  // 코드 태그
  code(rot) {
    const [c, g] = canvas(rot), p = new Path2D(); p.roundRect(40, 60, 176, 136, 30)
    cut(g, p, CORAL)
    text(g, "</>", 128, 118, 60, "#fff"); text(g, "HTML · CSS · JS", 128, 166, 14, "#fff", 800)
    return c
  }
}

/* [그림, 기울기, 크기 배율, PC 위치(x,y 비율), 모바일·태블릿 위치(x 비율, y px)] */
const LIST = [
  ["badge", -6, 1.1, [0.80, 0.20], [0.00, 0]],
  ["ticket", 8, 1.05, [0.63, 0.34], [0.20, 44]],
  ["gem", -8, 0.95, [0.90, 0.44], [0.40, 0]],
  ["figma", 4, 1.0, [0.66, 0.62], [0.58, 46]],
  ["chip", 10, 0.85, [0.84, 0.70], [0.78, 2]],
  ["code", -10, 0.8, [0.58, 0.12], [0.90, 60]]
]

const host = document.getElementById("stickers")
if (host) {
  let mounted = []
  const place = () => {
    mounted.forEach((m) => m.destroy()); mounted = []
    const W = innerWidth, small = W < 1025, size = W < 560 ? 70 : W < 1025 ? 96 : 128
    const hw = host.clientWidth, hh = host.clientHeight
    LIST.forEach(([kind, rot, k, pc, mo]) => {
      const sz = Math.round(size * k)
      const x = small ? Math.min(hw - sz, mo[0] * hw) : Math.min(hw - sz, pc[0] * hw)
      const y = small ? mo[1] : pc[1] * hh - sz / 2
      mounted.push(mountSticker(host, { source: DRAW[kind](rot), width: sz, height: sz, x, y }))
    })
  }
  const ready = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve()
  ready.then(place)
  // 화면 폭 구간(PC/태블릿·모바일)이 바뀔 때만 다시 배치 (붙여 둔 위치는 그 전까지 유지)
  let band = innerWidth < 1025
  addEventListener("resize", () => { const b = innerWidth < 1025; if (b !== band) { band = b; place() } })
}
