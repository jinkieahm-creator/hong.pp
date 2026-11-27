/* sticker.js — 끌어서 떼었다 붙이는 스티커 (WebGL)
   (v22 의 꽃 스티커 효과를 그대로 쓰고, 그림만 전시 티켓·배지로 바꿈 → js/stickers.js)
   Originkit "Draggable Sticker" 를 바닐라 JS 로 옮긴 것입니다.
   mountSticker(host, { source: canvas|img, width, height, x, y }) → { el, destroy }
   · 누른 곳부터 종이가 벗겨지듯 휘어지고, 놓으면 그 자리에 붙습니다. */
const VS = `
attribute vec2 aPos; attribute vec2 aUV;
uniform float uPeel; uniform float uPeelAngle; uniform float uPasting; uniform float uScale; uniform float uElevation;
varying vec2 vUV; varying float vHi; varying float vSh;
void main(){
  vUV=aUV; vec2 p=aPos; vHi=0.0; vSh=0.0;
  if(uPeel>0.0){
    vec2 ax=vec2(cos(uPeelAngle),sin(uPeelAngle));
    float proj=dot(aUV-vec2(0.5),ax); float diag=0.5-proj;
    float line=-0.3+uPeel*2.0; float rw=0.6;
    float lifted=1.0-smoothstep(line-rw,line,diag);
    p*=1.0+lifted*uElevation;
    float inRamp=smoothstep(line-rw,line-rw*0.5,diag)*smoothstep(line+0.05,line-rw*0.3,diag);
    p+=(-ax)*inRamp*(uPasting>0.5?0.06:0.12);
    float t=smoothstep(line-rw,line,diag);
    vHi=inRamp*0.75*pow(1.0-t,1.2); vSh=inRamp*0.75*pow(t,1.2);
  }
  gl_Position=vec4(p*uScale,0.0,1.0);
}`
const FS = `
precision mediump float;
uniform sampler2D uTex; uniform vec2 uTilt; uniform float uSheen; uniform float uMaxTilt; uniform vec3 uSheenColor;
varying vec2 vUV; varying float vHi; varying float vSh;
vec3 ov(vec3 b,vec3 l){return mix(2.0*b*l,1.0-2.0*(1.0-b)*(1.0-l),step(0.5,b));}
void main(){
  vec4 tex=texture2D(uTex,vUV); if(tex.a<0.01) discard;
  vec3 c=tex.rgb*0.95;
  float mag=clamp(length(uTilt)/max(0.001,uMaxTilt),0.0,1.0);
  float gate=smoothstep(0.035,1.0,mag);
  float g=fract(vUV.x*0.5+vUV.y*0.5+(uTilt.x+uTilt.y)*0.05);
  float sheen=smoothstep(0.2,0.5,g)*(1.0-smoothstep(0.5,0.8,g));
  c=mix(c,uSheenColor,sheen*uSheen*gate*tex.a);
  float hiW=clamp(vHi,0.0,1.0)*0.55, shW=clamp(vSh,0.0,1.0)*0.60;
  c=mix(c,ov(c,vec3(1.0)),hiW);
  c=mix(c,ov(c,vec3(0.0)),shW); c*=(1.0-shW*0.35);
  gl_FragColor=vec4(clamp(c,0.0,1.0),tex.a);
}`

let Z = 1000
const hex = (h) => { h = h.replace("#", ""); if (h.length === 3) h = [...h].map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) }

export function mountSticker(host, opt = {}) {
  const o = { width: 130, height: 130, x: 0, y: 0, tilt: 45, smooth: 0.05, strength: 8, color: "#ffffff", elev: 6, ...opt }
  const W = o.width, H = o.height
  const elevation = (Math.min(10, Math.max(1, o.elev)) / 10) * 0.3
  const pad = 20 + Math.max(W, H) * elevation * 0.6
  const cw = W + pad * 2, ch = H + pad * 2, scale = Math.min(W / cw, H / ch)
  const sheen = Math.min(10, Math.max(1, o.strength)) / 10

  const el = document.createElement("div")
  el.className = "sticker"
  el.style.cssText = `position:absolute;left:${o.x}px;top:${o.y}px;width:${W}px;height:${H}px;cursor:grab;user-select:none;touch-action:none;perspective:800px;transform-style:preserve-3d;pointer-events:auto`
  const inner = document.createElement("div")
  inner.style.cssText = "position:absolute;inset:0;transform-style:preserve-3d"
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(cw * 2); canvas.height = Math.round(ch * 2)
  canvas.style.cssText = `position:absolute;left:${-pad}px;top:${-pad}px;width:${cw}px;height:${ch}px;pointer-events:none;display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.3))`
  inner.appendChild(canvas); el.appendChild(inner); host.appendChild(el)

  const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false })
  if (!gl) { // WebGL 없음: 움직이지 않는 그림으로
    canvas.getContext("2d").drawImage(o.source, pad * 2, pad * 2, W * 2, H * 2)
    el.style.cursor = "default"
    return { el, destroy: () => el.remove() }
  }
  const sh = (src, type) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s }
  const prog = gl.createProgram()
  gl.attachShader(prog, sh(VS, gl.VERTEX_SHADER)); gl.attachShader(prog, sh(FS, gl.FRAGMENT_SHADER)); gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return { el, destroy: () => el.remove() }
  gl.useProgram(prog)

  const N = 32, verts = [], inds = []
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) verts.push((i / N) * 2 - 1, (j / N) * 2 - 1, i / N, 1 - j / N)
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i; inds.push(a, a + 1, a + N + 1, a + 1, a + N + 2, a + N + 1) }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(inds), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(prog, "aPos"), aUV = gl.getAttribLocation(prog, "aUV")
  gl.enableVertexAttribArray(aPos); gl.enableVertexAttribArray(aUV)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0); gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 16, 8)
  const U = {}
  for (const n of ["uPeel", "uPeelAngle", "uPasting", "uScale", "uElevation", "uTilt", "uSheen", "uMaxTilt", "uSheenColor", "uTex"]) U[n] = gl.getUniformLocation(prog, n)

  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, o.source)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  const sc = hex(o.color)

  const s = { x: o.x, y: o.y, peel: 0, lift: 0, angle: -Math.PI / 4, held: false, peeling: false, sticking: false, sx: 0, sy: 0, ox: 0, oy: 0, tx: 0, ty: 0, lx: 0, ly: 0, lt: 0 }
  const draw = () => {
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform1f(U.uPeel, s.peel); gl.uniform1f(U.uPeelAngle, s.angle); gl.uniform1f(U.uPasting, s.sticking ? 1 : 0)
    gl.uniform1f(U.uScale, scale); gl.uniform1f(U.uElevation, elevation)
    gl.uniform2f(U.uTilt, s.tx, s.ty); gl.uniform1f(U.uSheen, sheen); gl.uniform1f(U.uMaxTilt, o.tilt)
    gl.uniform3f(U.uSheenColor, sc[0], sc[1], sc[2]); gl.uniform1i(U.uTex, 0)
    gl.drawElements(gl.TRIANGLES, inds.length, gl.UNSIGNED_SHORT, 0)
  }
  const shadow = () => {
    const t0 = Math.max(s.lift, s.peel), t = t0 * t0 * (3 - 2 * t0)
    canvas.style.filter = `drop-shadow(0 ${(1 + 12 * t).toFixed(1)}px ${(2 + 12 * t).toFixed(1)}px rgba(0,0,0,.3))`
  }
  let raf = 0, last = null
  const tick = (ts) => {
    if (last === null) last = ts
    const dt = Math.min((ts - last) / 1000, 0.1); last = ts
    const step = 1.92 * dt; let ch2 = false
    if (s.peeling && (s.peel < 1 || s.lift < 1)) { s.peel = Math.min(1, s.peel + step); s.lift = Math.min(1, s.lift + step); ch2 = true }
    if (s.sticking) { if (s.peel > 0 || s.lift > 0) { s.peel = Math.max(0, s.peel - step); s.lift = Math.max(0, s.lift - step); ch2 = true } else s.sticking = false }
    if (ch2) shadow()
    if (ch2 || s.held) draw()
    if (s.held || s.peeling || s.sticking) raf = requestAnimationFrame(tick)
    else { raf = 0; last = null }
  }
  const go = () => { if (!raf) { last = null; raf = requestAnimationFrame(tick) } }
  const poseTilt = () => (inner.style.transform = `rotateX(${s.tx}deg) rotateY(${s.ty}deg)`)

  let pid = null
  el.addEventListener("pointerdown", (e) => {
    if (e.button > 0 || pid !== null) return
    e.preventDefault()
    pid = e.pointerId; el.setPointerCapture && el.setPointerCapture(pid)
    const r = el.getBoundingClientRect()
    inner.style.transformOrigin = `${e.clientX - r.left}px ${e.clientY - r.top}px`
    s.angle = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2))
    s.sx = e.clientX; s.sy = e.clientY; s.ox = s.x; s.oy = s.y
    s.peel = 0; s.lift = 0; s.held = true; s.peeling = true; s.sticking = false
    s.lx = e.clientX; s.ly = e.clientY; s.lt = performance.now()
    el.style.zIndex = ++Z; el.style.cursor = "grabbing"
    go()
  })
  el.addEventListener("pointermove", (e) => {
    if (!s.held || e.pointerId !== pid) return
    s.x = s.ox + (e.clientX - s.sx); s.y = s.oy + (e.clientY - s.sy)
    el.style.left = s.x + "px"; el.style.top = s.y + "px"
    const now = performance.now(), dt = Math.max(1, now - s.lt)
    const vx = ((e.clientX - s.lx) / dt) * 16, vy = ((e.clientY - s.ly) / dt) * 16
    s.lx = e.clientX; s.ly = e.clientY; s.lt = now
    const m = o.tilt, k = 3
    s.ty += (Math.max(-m, Math.min(m, vx * k)) - s.ty) * o.smooth
    s.tx += (Math.max(-m, Math.min(m, -vy * k)) - s.tx) * o.smooth
    poseTilt()
  })
  const up = (e) => {
    if (!s.held || e.pointerId !== pid) return
    pid = null
    s.held = false; s.peeling = false; s.sticking = true; el.style.cursor = "grab"
    if (s.peel >= 0.95) {
      const r = inner.getBoundingClientRect()
      s.angle = Math.atan2(-(s.ly - (r.top + r.height / 2)), -(s.lx - (r.left + r.width / 2))); s.peel = 1
    }
    const settle = () => {
      s.tx *= 0.9; s.ty *= 0.9; poseTilt()
      if (Math.abs(s.tx) > 0.1 || Math.abs(s.ty) > 0.1) requestAnimationFrame(settle)
      else { s.tx = s.ty = 0; inner.style.transform = "" }
    }
    settle(); go()
  }
  el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up)
  draw()
  return { el, destroy() { cancelAnimationFrame(raf); el.remove() } }
}

