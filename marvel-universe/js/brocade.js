/* =========================================================
   MARVEL UNIVERSE — brocade.js
   보내주신 Originkit「Brocade Eyelet」(React/TSX + WebGL2)를 바닐라 JS로 옮긴 버전.
   셰이더·물리·품질 조절은 원본 그대로이고, React와 Framer 부분만 걷어냈습니다.
   사용: mountBrocade(rootElement, canvas, props) → { set(props) }
   WebGL2를 못 쓰면 아무것도 그리지 않고 root의 CSS 배경이 그대로 보입니다.
   ========================================================= */
(function () {
/* eslint-disable */
// Brocade Eyelet — Originkit
/* eslint-disable */
// Brocade Eyelet — Originkit
/**
 * BrocadeEyelet — a whole frame of light threads streaming upward, and an eye
 * of a needle that gathers them. Threads within reach are drawn through the
 * eyelet and cinch into a white-hot waist leaning in a soft S, flaring out of
 * focus into prismatic fans above and below it; threads beyond the reach run
 * on straight and dim, so the sheet fills the frame edge to edge. The pointer
 * is the eyelet: the threads re-gather wherever it goes, and a click sends a
 * shockwave rippling out along them with a burst of sparks flung down the
 * threads.
 *
 * A variation on LumenCinch (this library's hourglass of light filaments), and
 * built on its look and plumbing: light added as energy and shown through a
 * soft clip 1 − e^−E, warm hue climbing copper → amber → cream with density,
 * white cores, cool fringes only where the streaks open out of focus, glint
 * spindles, glitter, energy-conserving bloom at ¼ and ⅛, stars, grain and
 * vignette. Where LumenCinch reads its hourglass off a fitted flow map, here
 * the hourglass is a field that can move: every thread has a rest position x0
 * and is pulled toward the eyelet E by
 *
 *   x = x0 − c·(x0 − Ex),   c = a · P(x0 − Ex) · Q(y),
 *   P = exp(−(dx/R)²)            (reach: who gets gathered)
 *   Q = 1 / (1 + ((y − yc)/σ)²)  (waist: a hyperbolic pinch, long open fans)
 *   yc = Ey − lean · tanh(dx/R)  (left flank cinches lower than the right: the S)
 *
 * which keeps x monotonic in x0 for a < 1 (threads never cross) and is cheap to
 * evaluate per vertex. Everything that rides a thread (glints, glitter, sparks,
 * shock rings) goes through the same function, and the copper haze inverts it
 * per pixel at ¼ resolution.
 *
 * Rendering (WebGL2):
 *  1. Light buffer (R11G11B10F, else half float): threads as one triangle strip
 *     (degenerate joins), glint ribbons and glitter points, then shock sparks,
 *     all additive.
 *  2. Soft buffer at ¼ size: the copper haze (density of gathered threads) and
 *     the near, out-of-focus strands that drift across in front of the sheet.
 *  3. Bloom at ¼ and ⅛ size. 4. Composite: soft clip, stars, ground, vignette, grain.
 */
// ── Reference frame ─────────────────────────────────────────────────────────
const REF_W = 1200;
const REF_H = 800;
const REF_ASPECT = REF_W / REF_H;
/** Perspective for the Placement tilt, as a multiple of the frame's long side. */
const TILT_PERSPECTIVE = 1.5;
/** Fine threads per world unit (one world unit = the composition's height) at Threads 100%. */
const THREADS_PER_UNIT = 380;
/** Below this on-screen spacing (CSS px) every other thread is dropped and the rest brighten. */
const MIN_THREAD_PX = 2.2;
/** Segments per thread strip across the visible height. */
const THREAD_SEG = 96;
/**
 * On-screen length of one thread segment (CSS px): near the eyelet, where the
 * waist bends them, and out in the sheet where the pull has faded. 20 px is
 * indistinguishable from 8 px at the waist (mean diff 0.5/255).
 */
const SEG_PX_NEAR = 20;
const SEG_PX_FAR = 34;
/** Near, out-of-focus strands per world unit (drawn soft, at ¼ resolution). */
const NEAR_PER_UNIT = 12;
/** Glint lanes per world unit at Threads 100%. */
const GLINT_PER_UNIT = 105;
/** Ribbon segments per glint. */
const GLINT_SEG = 10;
/** Glitter per world unit² over the whole sheet, and per reach-sized cluster at the eyelet, at Dust 50%. */
const DUST_FIELD = 7000;
const DUST_EYE = 16000;
/** Sparks a full-strength shockwave throws. */
const SPARKS = 360;
/** Shockwaves alive at once; a new one replaces the oldest. */
const WAVES = 4;
const WAVE_LIFE = 1.9;
/** Flow at Flow Speed 100% and Speed 50, world units per second. */
const FLOW_RATE = 1;
const SMOOTH_FLOW_PX = 45;
/**
 * Device-pixel budget. Threads are hairlines, so this sits a little above
 * LumenCinch's (2.6 MP): a 1200×800 frame renders at ~1.8 device px per CSS px.
 */
const MAX_PIXELS = 3.0e6;
const QUALITY_LEVELS = [1, 0.85, 0.72, 0.6];
const MAX_THREADS = 2600;
/** The eyelet pulls threads this many times further out than it lights them. */
const PULL_REACH = 1.6;
// ── Defaults ────────────────────────────────────────────────────────────────
const DEFAULTS = {
    background: "#131212",
    baseColor: "#FF8A3A",
    accentColor: "#5FE0E0",
    speed: 50,
    scale: 97,
    density: 36,
    pinch: 12,
    fringe: 0,
    direction: "up",
};
/** Which way the light streams: the whole sheet turns so its flow runs that way (clockwise degrees). */
const DIRECTION_ANGLE = { up: 0, right: 90, down: 180, left: -90 };
const DEFAULT_PLACEMENT = { x: 0, y: 0, angle: 0, tilt: 0 };
const DEFAULT_RESPONSE = { follow: true, reach: 5, swirl: 5, shockwave: 5 };
/** Tuning constants behind the look. Out of the box these are the component. */
const DEFAULT_ADVANCED = {
    seed: 1,
    lean: 100,
    waist: 28,
    nearStrands: 50,
    occupancy: 55,
    streakLength: 18,
    streakWidth: 1,
    defocus: 100,
    coreColor: "#EADBB9",
    violetColor: "#8A6CFF",
    midColor: "#8D6A61",
    hazeColor: "#6E4A40",
    dustColor: "#D8D0C8",
    cyanShare: 15,
    violetShare: 10,
    exposure: 140,
    bloom: 75,
    haze: 60,
    fibres: 100,
    fieldLight: 16,
    dust: 0,
    stars: 0,
    grain: 0,
    vignette: 10,
    flowSpeed: 40,
    flicker: 12,
    breathe: 6,
    breathePeriod: 6000,
    sway: 30,
    parallax: 30,
    followTime: 100,
    returnTime: 650,
    ringSpeed: 70,
    sparks: 100,
};
const COLOR_CACHE = new Map();
function parseColorA(input, fallback) {
    if (typeof input !== "string")
        return { c: fallback, a: 1 };
    let hit = COLOR_CACHE.get(input);
    if (hit === undefined) {
        hit = parseColorRaw(input);
        COLOR_CACHE.set(input, hit);
    }
    return hit !== null && hit !== void 0 ? hit : { c: fallback, a: 1 };
}
function parseColor(input, fallback) {
    return parseColorA(input, fallback).c;
}
function parseColorRaw(raw) {
    let s = raw.trim();
    const v = /^var\(\s*--[^,]+,\s*(.+)\)$/.exec(s);
    if (v)
        s = v[1].trim();
    if (s[0] === "#") {
        const h = s.slice(1);
        const x = (t) => parseInt(t, 16) / 255;
        let c;
        let a = 1;
        if (h.length === 3 || h.length === 4) {
            c = [x(h[0] + h[0]), x(h[1] + h[1]), x(h[2] + h[2])];
            if (h.length === 4)
                a = x(h[3] + h[3]);
        }
        else if (h.length === 6 || h.length === 8) {
            c = [x(h.slice(0, 2)), x(h.slice(2, 4)), x(h.slice(4, 6))];
            if (h.length === 8)
                a = x(h.slice(6, 8));
        }
        else
            return null;
        return c.every(Number.isFinite) && Number.isFinite(a) ? { c, a } : null;
    }
    const m = /^(rgba?|hsla?)\(([^)]*)\)$/i.exec(s);
    if (!m)
        return null;
    const parts = m[2].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3)
        return null;
    const pn = (p, scale) => (p.endsWith("%") ? (parseFloat(p) / 100) * scale : parseFloat(p));
    const a = parts.length > 3 ? pn(parts[3], 1) : 1;
    let rgb;
    if (m[1].toLowerCase().startsWith("rgb")) {
        rgb = [pn(parts[0], 255) / 255, pn(parts[1], 255) / 255, pn(parts[2], 255) / 255];
    }
    else {
        const hh = (((parseFloat(parts[0]) % 360) + 360) % 360) / 360;
        const ss = pn(parts[1], 1);
        const ll = pn(parts[2], 1);
        const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
        const p = 2 * ll - q;
        const f = (t) => {
            t = (t + 1) % 1;
            if (t < 1 / 6)
                return p + (q - p) * 6 * t;
            if (t < 1 / 2)
                return q;
            if (t < 2 / 3)
                return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        rgb = [f(hh + 1 / 3), f(hh), f(hh - 1 / 3)];
    }
    if (!rgb.every(Number.isFinite) || !Number.isFinite(a))
        return null;
    return { c: rgb.map((c) => Math.min(1, Math.max(0, c))), a: Math.min(1, Math.max(0, a)) };
}
/**
 * A colour as light: run backwards through the composite's soft clip, so one
 * thread at nominal strength shows exactly the chosen colour, faint ones deepen
 * and bunched ones burn toward white.
 */
function asLight(c) {
    const f = (v) => -Math.log(1 - Math.min(v, 0.96) * 0.97);
    return [f(c[0]), f(c[1]), f(c[2])];
}
function num(v, d, lo = -Infinity, hi = Infinity) {
    const n = typeof v === "number" && Number.isFinite(v) ? v : d;
    return Math.min(hi, Math.max(lo, n));
}
/** One level deep: Framer re-renders with fresh-but-equal objects. */
function sameProps(a, b) {
    if (!b)
        return false;
    const ka = Object.keys(a);
    if (ka.length !== Object.keys(b).length)
        return false;
    for (const k of ka) {
        const x = a[k];
        const y = b[k];
        if (x === y || k === "style")
            continue;
        if (x && y && typeof x === "object" && typeof y === "object") {
            const ox = x;
            const oy = y;
            const kx = Object.keys(ox);
            if (kx.length !== Object.keys(oy).length)
                return false;
            for (const kk of kx)
                if (ox[kk] !== oy[kk])
                    return false;
            continue;
        }
        return false;
    }
    return true;
}
/** CPU copy of the shader's threadAt(): where thread x0 runs at height y. */
function threadX(e, x0, y) {
    const dx = x0 - e.x;
    const u = dx / Math.max(e.R, 1e-3);
    const v = (u * u) / (PULL_REACH * PULL_REACH);
    const P = Math.exp(-v * v);
    const yc = e.y - e.lean * Math.tanh(u);
    const g = (y - yc) / Math.max(e.sig, 1e-3);
    const Q = 1 / (1 + g * g);
    const c = e.a * P * Q;
    return x0 - c * dx + c * (e.lag * (1 - Q) + e.tilt * (y - yc));
}
/** Which thread passes through (x, y): x is monotonic in x0, so bisect. */
function restX(e, x, y) {
    let lo = x - 3 * e.R - 1;
    let hi = x + 3 * e.R + 1;
    for (let i = 0; i < 40; i++) {
        const mid = 0.5 * (lo + hi);
        if (threadX(e, mid, y) < x)
            lo = mid;
        else
            hi = mid;
    }
    return 0.5 * (lo + hi);
}
// ── GLSL ────────────────────────────────────────────────────────────────────
const HEAD = `#version 300 es
precision highp float;
precision highp int;
`;
/** Shared by every pass: the frame map, the eyelet's gather field and the shock rings. */
const MAP_GLSL = `
uniform vec4 uMap;     // cos angle, sin angle, tilt (rad), perspective (CSS px)
uniform vec4 uMap2;    // CSS px per world unit, content centre x, y (CSS px), device px per CSS px
uniform vec2 uFrame;   // frame size, CSS px
uniform vec4 uEye;     // eyelet x, y, reach R, gather a
uniform vec4 uEye2;    // waist sigma, lean (world), lag (world), focus y
uniform vec4 uDof;     // sharp half-band, blur gain (world), hairline sigma (CSS px), min sigma (CSS px)
uniform vec4 uSway;    // amplitude (world), phase, parallax x, parallax y (world per unit depth)
uniform vec4 uWave[${WAVES}];  // centre x, y, radius, strength (0 = idle)
uniform vec4 uWaveP;   // ring width, push (world), brightening, -
uniform float uSalt;
uniform float uTilt;   // how far the gathered threads lean through the waist (dx/dy)
uniform float uBundleShift; // slow sideways drift of the bright bundles (world)
const float PULL_K = ${(1 / (PULL_REACH * PULL_REACH)).toFixed(5)};

uint hu(uint x) { x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu; x ^= x >> 16; return x; }
vec4 h4(uint x) {
    uint a = hu(x); uint b = hu(a ^ 0x9e3779b9u); uint c = hu(b ^ 0x85ebca6bu); uint d = hu(c ^ 0xc2b2ae35u);
    return vec4(float(a >> 8u), float(b >> 8u), float(c >> 8u), float(d >> 8u)) * (1.0 / 16777216.0);
}
float h1(int i) { return float(hu(uint(i + 1048576) * 0x2c1b3c6du + uint(uSalt) * 0x297a2d39u) >> 8u) * (1.0 / 16777216.0); }
// Bundles: a slow 1-D noise across the sheet, so some runs of threads burn white
// and the lanes between them stay copper, as LumenCinch's poster light does.
float bundleAt(float x0) {
    x0 += uBundleShift;
    float s = x0 * 26.0;
    float i = floor(s);
    float f = s - i;
    f = f * f * (3.0 - 2.0 * f);
    float n = mix(h1(int(i)), h1(int(i) + 1), f);
    float s2 = x0 * 71.0 + 13.0;
    float i2 = floor(s2);
    float f2 = s2 - i2;
    f2 = f2 * f2 * (3.0 - 2.0 * f2);
    n = 0.7 * n + 0.3 * mix(h1(int(i2) + 7777), h1(int(i2) + 7778), f2);
    return 0.15 + 2.2 * n * n * n;
}

// Where thread x0 runs at height y. P: how strongly the eyelet reaches it,
// Q: how near the waist this height is, c: how far it has been drawn in.
// d: the thread's slope dx/dy there (analytic, so a vertex needs one evaluation),
// dc: how fast c changes with y.
struct TP { vec2 p; float P; float Q; float c; float d; float dc; };
TP threadAt(float x0, float y, float gm) {
    TP t;
    float R = max(uEye.z, 1e-3);
    float dx = x0 - uEye.x;
    float u = dx / R;
    float u2 = u * u;
    t.P = exp(-u2 * u2);
    // The pull reaches further than the light, so the bright bundle cinches as one
    // and the dim threads just outside it bow in toward the eyelet too.
    float v2 = u2 * PULL_K;
    float yc = uEye.y - uEye2.y * tanh(u);
    float g = (y - yc) / max(uEye2.x, 1e-3);
    t.Q = 1.0 / (1.0 + g * g);
    float A = uEye.w * gm * exp(-v2 * v2);
    t.c = A * t.Q;
    float off = uEye2.z * (1.0 - t.Q) + uTilt * (y - yc);
    t.p = vec2(x0 - t.c * dx + t.c * off, y);
    float dQ = -2.0 * g / max(uEye2.x, 1e-3) * t.Q * t.Q;
    t.dc = A * dQ;
    t.d = t.dc * (off - dx) + t.c * (uTilt - uEye2.z * dQ);
    return t;
}
// Shock rings: push threads sideways off each ring and brighten them as it passes.
// sl carries the thread's slope dx/dy through the push.
float shockAt(inout vec2 p, inout float sl) {
    float b = 0.0;
    float dxs = 0.0;
    float dsl = 0.0;
    for (int k = 0; k < ${WAVES}; k++) {
        vec4 wv = uWave[k];
        if (wv.w <= 0.0) continue;
        vec2 d = p - wv.xy;
        float r = max(length(d), 1e-3);
        float g = (r - wv.z) / uWaveP.x;
        float ring = wv.w * exp(-g * g);
        float g2 = g + 1.6;
        float lag = 0.45 * wv.w * exp(-g2 * g2);
        // A short wave train: the ring leads, a softer counter-swing follows it.
        float train = ring - lag;
        float dtrain = (-2.0 * g * ring + 2.0 * g2 * lag) / uWaveP.x;
        float drdy = (d.x * sl + d.y) / r;
        float q = d.x / r;
        float dq = (sl * r - d.x * drdy) / (r * r);
        dxs += uWaveP.y * train * q;
        dsl += uWaveP.y * (dtrain * drdy * q + train * dq);
        b += ring;
    }
    p.x += dxs;
    sl += dsl;
    return b;
}
float dofAt(float y) {
    float d = max(abs(y - uEye2.w) - uDof.x, 0.0);
    return uDof.y * pow(d, 1.3);
}
// How far into the open, defocused ends a height lies (0 in the focus band, 1 beyond it).
float endsAt(float y) {
    return smoothstep(0.03, 0.2, max(abs(y - uEye2.w) - uDof.x, 0.0));
}
vec2 toScreen(vec2 w) {
    vec2 q = w * uMap2.x;
    vec2 r = vec2(q.x * uMap.x - q.y * uMap.y, q.x * uMap.y + q.y * uMap.x);
    float k = uMap.w / max(uMap.w - r.y * sin(uMap.z), 1.0);
    return uMap2.yz + vec2(r.x, r.y * cos(uMap.z)) * k;
}
vec2 toWorld(vec2 s) {
    vec2 v = s - uMap2.yz;
    float st = sin(uMap.z);
    float ry = v.y * uMap.w / max(cos(uMap.z) * uMap.w + v.y * st, 1.0);
    float k = uMap.w / max(uMap.w - ry * st, 1.0);
    vec2 r = vec2(v.x / k, ry);
    vec2 q = vec2(r.x * uMap.x + r.y * uMap.y, -r.x * uMap.y + r.y * uMap.x);
    return q / uMap2.x;
}
vec4 toClip(vec2 s) {
    return vec4(s.x / uFrame.x * 2.0 - 1.0, 1.0 - s.y / uFrame.y * 2.0, 0.0, 1.0);
}
// Screen-space direction of a thread with slope sl at world point p.
vec2 tangentAt(vec2 p, vec2 s0, float sl) {
    vec2 tg = toScreen(p + 0.002 * vec2(sl, 1.0)) - s0;
    return tg / max(length(tg), 1e-5);
}
`;
/**
 * Threads: one triangle strip per thread with degenerate joins, all threads in
 * one draw (software GL pays per instance). Each vertex places itself through
 * the gather field, so the waist is exact wherever the eyelet is.
 */
const THREAD_VS = HEAD +
    MAP_GLSL +
    `
uniform vec4 uTh;    // first thread index, stride, pitch (world), brightness per thread
uniform vec4 uTh2;   // y from, y to (world), gather share, layer (0 sharp sheet, 1 near strands)
uniform vec4 uTh3;   // flow offset, fibre gain, bed gain, field light
uniform vec4 uTh4;   // fringe base (CSS px), fringe per blur px, near blur (CSS px), near gain
uniform vec4 uTh5;   // whitening, time, flicker, -
uniform vec3 uK0;    // white core,
uniform vec3 uK1;    // warm,
uniform vec3 uK2;    // cyan and
uniform vec3 uK3;    // violet fibres as light; in focus the cool ones read near-white:
uniform vec3 uK2s;
uniform vec3 uK3s;
uniform vec3 uMidE;
uniform vec3 uTint;  // copper the dim light leans to
out vec4 vA;
out vec3 vE;
out float vS;        // scrolled position along the thread
flat out vec4 vK;    // dash frequencies k1, k2, k3, gate
flat out vec4 vPh;   // dash phases, near flag
uniform float uSeg;  // segments per thread in this draw
void main() {
    int SEG = int(uSeg);
    int VPT = 2 * (SEG + 1) + 2;
    int tid = gl_VertexID / VPT;
    int v = gl_VertexID - tid * VPT;
    int j = clamp(v - 1, 0, 2 * SEG + 1);
    int row = j / 2;
    float side = (j - row * 2) == 0 ? -1.0 : 1.0;
    int idx = int(uTh.x) + tid * int(uTh.y);
    bool nearL = uTh2.w > 0.5;
    uint hid = uint(idx + 1048576) * (nearL ? 0x632be5abu : 0x9E3779B1u) + uint(uSalt) * 0x85ebca6bu;
    vec4 h = h4(hid);
    vec4 h2 = h4(hu(hid ^ 0x5bd1e995u));
    vec4 h3 = h4(hu(hid ^ 0x27d4eb2du));
    float x0 = (float(idx) + 0.5 + (h.x - 0.5) * 0.85) * uTh.z;
    // Each sheet thread wanders a little sideways on its own slow beat, so the
    // crossings where threads bunch at the waist never sit still.
    if (!nearL) x0 += 0.3 * uTh.z * uTh.y * sin(6.2831853 * (uTh5.y * (0.04 + 0.08 * h3.y) + h.x));
    // Depth: the sheet is nearly flat; near strands sit well in front of it.
    float z = nearL ? 0.55 + 0.45 * h2.x : 0.12 * h2.x;
    x0 += uSway.z * z;
    float y = mix(uTh2.x, uTh2.y, float(row) / float(SEG));
    float sw = uSway.x * (0.6 + 0.8 * h3.x);
    float swf = 2.2 + 2.5 * h3.y;
    TP t = threadAt(x0, y, uTh2.z);
    vec2 p = t.p;
    float sl = t.d;
    float sa = y * swf + uSway.y * (0.7 + 0.6 * h3.z) + 6.2831853 * h3.w;
    float sv = sin(sa);
    p.x += sw * sv * (1.0 - t.c);
    sl += sw * (cos(sa) * swf * (1.0 - t.c) - sv * t.dc);
    p.y += uSway.w * z;
    float ring = shockAt(p, sl);
    vec2 s0 = toScreen(p);
    vec2 tg = tangentAt(p, s0, sl);
    vec2 n = vec2(-tg.y, tg.x);

    // Brightening and fading along the length, scrolling up with the flow.
    bool bright = nearL || h.y < 0.38;
    float s = (y + uTh3.x * (0.8 + 0.4 * h2.y)) * 0.5;
    float k1 = 1.0 + floor(h2.z * 3.0);
    float k2 = 4.0 + floor(h2.w * 6.0);
    float k3 = 11.0 + floor(h3.z * 14.0);
    // The dashes are worked out per pixel (THREAD_FS). Sampled at the vertices, the
    // fine ones landed on the fixed vertex rows and pulsed in place instead of travelling.
    vS = s;
    vK = vec4(k1, k2, k3, bright ? 0.02 : 0.35);
    vPh = vec4(h3.x, h3.y, h3.w, nearL ? 1.0 : 0.0);
    float fl = 1.0 - uTh5.z + uTh5.z * (0.5 + 0.5 * sin(6.2831853 * (uTh5.y * (0.15 + 0.4 * h3.y) + h2.x)));
    float amp = bright ? 0.35 + 0.65 * h.w : 0.2 + 0.6 * h.w;

    float dofW = dofAt(y);
    float dofPx = dofW * uMap2.x;
    float nearPx = nearL ? uTh4.z * (0.45 + 0.55 * z) : 0.0;
    float hair = max(uDof.z, uDof.w);
    float sig = sqrt(hair * hair + dofPx * dofPx + nearPx * nearPx);
    float delta = (uTh4.x + uTh4.y * (dofPx + nearPx)) * (p.x < uEye.x ? -1.0 : 1.0);
    float ends = endsAt(y);
    // Gathered threads are the bright ones; the rest of the sheet glows low.
    float reach = mix(uTh3.w, 1.0, t.P);
    // Where the eyelet bunches them the light whitens; beyond it, it leans copper.
    float wh = smoothstep(0.35, 0.85, t.c) * mix(0.5, 1.0, ends) * uTh5.x;
    float r = h.z;
    vec3 col;
    if (!bright) col = uMidE * uTh3.z * t.P;
    else if (r < 0.4) col = uK0;
    else if (r < 0.62) col = mix(uK1, uK0, wh);
    else if (r < 0.82) col = mix(uK2s, uK2, max(ends, float(nearL)));
    else col = mix(uK3s, uK3, max(ends, float(nearL)));
    if (bright) col *= uTh3.y;
    col *= mix(uTint, vec3(1.0), max(t.P, wh));
    // White-hot where the eyelet bunches them.
    float e = amp * fl * reach * bundleAt(x0) * uTh.w * (hair / sig) * (1.0 + 1.5 * t.c) * (1.0 + uWaveP.z * ring);
    // Out of focus, a strand's light spreads rather than fades as fast as its width grows.
    if (nearL) e *= uTh4.w * pow(sig / hair, 0.7);
    vE = col * e;
    // The gaussian is spent by 2.7σ. Stretches with no light to show (dark gaps in a
    // fibre, bed threads beyond the reach) collapse to zero width and cost no pixels.
    float ext = max(vE.r, max(vE.g, vE.b)) < 0.003 ? 0.0 : 2.7 * sig + abs(delta) + 0.75;
    gl_Position = toClip(s0 + n * side * ext);
    vA = vec4(side * ext, sig, delta, 0.0);
}
`;
const THREAD_FS = HEAD +
    `
in vec4 vA;
in vec3 vE;
in float vS;
flat in vec4 vK;
flat in vec4 vPh;
uniform float uOut;
out vec4 o;
void main() {
    // Brightening and fading along the length, scrolling up with the flow.
    float along;
    if (vPh.w > 0.5) {
        // Near strands are long soft veils, not dashes: one slow swell along each.
        along = 0.25 + 0.75 * (0.5 + 0.5 * sin(6.2831853 * (vK.x * vS * 0.5 + vPh.x)));
    } else {
        float nn = 0.5 * sin(6.2831853 * (vK.x * vS + vPh.x)) + 0.32 * sin(6.2831853 * (vK.y * vS + vPh.y)) + 0.18 * sin(6.2831853 * (vK.z * vS + vPh.z));
        float tt = clamp((nn + vK.w) / 0.8, 0.0, 1.0);
        along = tt * tt * (3.0 - 2.0 * tt);
    }
    float s = vA.y;
    vec3 d = vec3(vA.x - vA.z, vA.x, vA.x + vA.z);
    vec3 E = vE * along * exp(-0.5 * d * d / (s * s));
    o = vec4(clamp(E, vec3(0.0), vec3(64.0)) * uOut, 0.0);
}
`;
const GLINT_VS = HEAD +
    MAP_GLSL +
    `
uniform vec4 uGl;   // first lane, lanes, slots per lane, lane pitch (world)
uniform vec4 uGl2;  // range start, range length, flow offset, occupancy
uniform vec4 uGl3;  // hairline sigma (CSS px), gain, cyan share, violet share
uniform vec4 uGl4;  // flicker, time, fringe per blur px, fringe base px
uniform vec4 uGl5;  // field light, length scale, lane stride, -
uniform vec3 uCoreE;
uniform vec3 uBaseE;
uniform vec3 uAccE;
uniform vec3 uVioE;
out vec4 vA;
out float vSc;
out vec3 vCore;
out vec3 vHalo;
out float vI;
const int SEG = ${GLINT_SEG};
void main() {
    int corner = gl_VertexID % 6;
    int inst = gl_VertexID / (6 * SEG);
    int seg = (gl_VertexID / 6) - inst * SEG;
    int rowOff = (corner == 2 || corner == 4 || corner == 5) ? 1 : 0;
    float side = (corner == 1 || corner == 3 || corner == 5) ? 1.0 : -1.0;
    int NS = int(uGl.z);
    int lane = inst / NS;
    int slot = inst - lane * NS;
    int li = int(uGl.x) + lane * int(uGl5.z);
    uint sd = uint(uSalt) * 0x9E3779B1u;
    vec4 hl = h4(uint(li + 1048576) * 0x27d4eb2du + sd);
    float x0 = (float(li) + 0.5 + (hl.x - 0.5) * 0.9) * uGl.w;
    float P = uGl2.y;
    float cell = P / float(NS);
    // Upward flow: the moving coordinate falls with time and wraps over the range.
    float m = (float(slot) + hl.y) * cell - uGl2.z * (0.8 + 0.4 * hl.z);
    float cyc = floor(m / P);
    float mw = m - cyc * P;
    uint cu = uint(int(cyc) + 65536);
    uint iid = uint(li + 1048576) * 64u + uint(slot);
    vec4 hs = h4(iid * 0x165667b1u + cu * 0x61c88647u + sd);
    vec4 hs2 = h4(hu(iid ^ 0x5bd1e995u) + cu * 0x2545f491u + sd);
    float yc = uGl2.x + mw;
    TP tc = threadAt(x0, yc, 1.0);
    float reach = mix(uGl5.x, 1.0, tc.P);
    float fade = smoothstep(0.0, 0.25, mw) * smoothstep(0.0, 0.25, P - mw);
    // Glints crowd the gathered threads; out in the sheet they are rarer.
    if (hs.x > uGl2.w * mix(0.22, 1.0, tc.P) || reach * fade < 0.004) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }

    // Wide clumps gather in the middle of the bundle; the flanks carry only slender spindles.
    float flank = smoothstep(0.5, 1.4, abs(x0 - uEye.x) / max(uEye.z, 1e-3));
    float wq = hs.w * (1.0 - 0.75 * flank);
    float spread = 1.0 - 0.85 * tc.c;
    float len = 0.25 * (0.12 + 0.5 * hs.y * hs.y) * (1.0 + 2.0 * wq * wq) * pow(max(spread, 0.3), 0.5) * uGl5.y * (1.0 + 2.6 * endsAt(yc));

    float tau = float(seg + rowOff) / float(SEG);
    float y = yc + (tau - 0.5) * len;
    TP t = threadAt(x0, y, 1.0);
    vec2 p = t.p;
    float sl = t.d;
    float ring = shockAt(p, sl);
    vec2 s0 = toScreen(p);
    vec2 tg = tangentAt(p, s0, sl);
    vec2 n = vec2(-tg.y, tg.x);
    float a = sin(3.14159265 * tau);
    a *= a;
    float dofPx = dofAt(y) * uMap2.x;
    // Each spindle has its own width, from a hairline to a soft clump; drawn in
    // by the eyelet it narrows with the threads around it.
    float wW = 0.0019 * pow(12.0, wq) * (1.0 - 0.95 * t.c);
    float body = max(uGl3.x, wW * uMap2.x) * (0.35 + 0.65 * sqrt(a));
    float sig = sqrt(body * body + dofPx * dofPx);
    vSc = sqrt(uGl3.x * uGl3.x + dofPx * dofPx);
    float delta = (uGl4.w + uGl4.z * dofPx) * (x0 < uEye.x ? -1.0 : 1.0);
    float ext = 3.0 * sig + abs(delta) + 1.0;
    gl_Position = toClip(s0 + n * side * ext);
    vA = vec4(side * ext, tau, sig, delta);
    float fl = 1.0 - uGl4.x + uGl4.x * (0.5 + 0.5 * sin(6.2831853 * (uGl4.y * (0.15 + 0.5 * hs2.x) + hs2.y)));
    float wht = 0.6 + 0.8 * smoothstep(0.3, 0.8, tc.c);
    vI = uGl3.y * reach * bundleAt(x0) * wht * fade * fl * (0.25 + 0.75 * hs.z * hs.z) * (body / sig) * (1.0 + uWaveP.z * ring);
    // Cool fringes belong to the defocused ends: none at the waist.
    float ends = endsAt(yc);
    float cool = 2.0 * ends;
    float hj = hs2.w - 0.5;
    vec3 halo = uBaseE * vec3(1.0, 1.0 + 0.9 * hj, 1.0 + 1.2 * hj);
    vec3 core = uCoreE;
    float slim = 1.0 - smoothstep(0.35, 0.6, wq);
    if (hs2.z < uGl3.z * cool * slim) { halo = uAccE; core = mix(uCoreE, uAccE, 0.7); }
    else if (hs2.z < (uGl3.z + uGl3.w) * cool * slim) { halo = uVioE; core = mix(uCoreE, uVioE, 0.7); }
    float clump = smoothstep(0.5, 0.85, wq);
    vCore = core * (uGl3.x / vSc) * 0.6;
    vHalo = mix(halo, core * 0.6, clump);
}
`;
const GLINT_FS = HEAD +
    `
in vec4 vA;
in float vSc;
in vec3 vCore;
in vec3 vHalo;
in float vI;
uniform float uOut;
out vec4 o;
void main() {
    float a = sin(3.14159265 * vA.y);
    a *= a;
    float s = max(vA.z, 0.3);
    float sc = max(min(vSc, s), 0.3);
    vec3 d = vec3(vA.x - vA.w, vA.x, vA.x + vA.w);
    vec3 E = vI * a * (vCore * exp(-0.5 * d * d / (sc * sc)) * sqrt(a) + vHalo * exp(-0.5 * d * d / (s * s)));
    o = vec4(clamp(E, vec3(0.0), vec3(64.0)) * uOut, 0.0);
}
`;
/** Glitter riding the threads: a cluster that travels with the eyelet, and a sprinkle over the whole sheet. */
const DUST_VS = HEAD +
    MAP_GLSL +
    `
uniform vec4 uDu;   // range start, range length, flow offset, point size (device px)
uniform vec4 uDu2;  // eyelet-cluster count, sheet x from, sheet x span, strength
uniform vec4 uDu3;  // time, field light, -, -
uniform vec3 uDustE;
out vec3 vC;
void main() {
    int id = gl_VertexID;
    uint sd = uint(uSalt) * 0x297a2d39u;
    vec4 h = h4(uint(id) * 0x2c1b3c6du + sd);
    vec4 h2 = h4(hu(uint(id) ^ 0x51ed270bu) + sd);
    float x0;
    if (float(id) < uDu2.x) {
        // Box-Muller: a gaussian cloud the size of the reach, centred on the eyelet.
        float g = sqrt(-2.0 * log(max(h.w, 1e-6))) * cos(6.2831853 * h2.z);
        x0 = uEye.x + 0.7 * uEye.z * g;
    } else {
        x0 = uDu2.y + uDu2.z * h.w;
    }
    float P = uDu.y;
    float m = h.y * P - uDu.z * (0.25 + 0.15 * h.z);
    float mw = m - floor(m / P) * P;
    float y = uDu.x + mw;
    TP t = threadAt(x0, y, 1.0);
    vec2 p = t.p;
    float sl = t.d;
    float ring = shockAt(p, sl);
    vec2 s = toScreen(p);
    float tw = max(0.0, 0.55 + 0.45 * sin(6.2831853 * (uDu3.x * (0.3 + 1.4 * h2.z) + h2.w)));
    float fade = smoothstep(0.0, 0.2, mw) * smoothstep(0.0, 0.2, P - mw);
    float b = uDu2.w * tw * fade * (0.25 + 0.75 * h.z) * mix(uDu3.y, 1.0, t.P) * (1.0 + 0.6 * t.c) * (1.0 + 2.0 * ring);
    gl_PointSize = uDu.w * (0.8 + 0.7 * h2.x * h2.x);
    gl_Position = b < 0.003 ? vec4(2.0, 2.0, 2.0, 1.0) : toClip(s);
    vC = uDustE * b;
}
`;
/** Sparks a shockwave flings along the threads: hot, fast, slowing, cooling. */
const SPARK_VS = HEAD +
    MAP_GLSL +
    `
uniform vec4 uSp;   // thread x0 at the click, click y, age (s), strength
uniform vec4 uSp2;  // point size (device px), wave id, flow offset, -
uniform vec3 uHot;
uniform vec3 uWarm;
out vec3 vC;
void main() {
    int id = gl_VertexID;
    uint sd = uint(uSalt) * 0x7feb352du + uint(uSp2.y) * 0x9e3779b9u;
    vec4 h = h4(uint(id) * 0x2c1b3c6du + sd);
    vec4 h2 = h4(hu(uint(id) ^ 0x51ed270bu) + sd);
    float g = sqrt(-2.0 * log(max(h.x, 1e-6))) * cos(6.2831853 * h.y);
    float x0 = uSp.x + g * (0.012 + 0.03 * h2.w);
    float dir = h.z < 0.5 ? -1.0 : 1.0;
    float v0 = 0.25 + 1.25 * h.w * h.w;
    float tau = 0.28 + 0.25 * h2.x;
    float age = uSp.z;
    float y = uSp.y + dir * v0 * tau * (1.0 - exp(-age / tau)) - 0.05 * age;
    TP t = threadAt(x0, y, 1.0);
    vec2 p = t.p;
    vec2 s = toScreen(p);
    float life = 0.55 + 1.1 * h2.y;
    float k = clamp(age / life, 0.0, 1.0);
    float tw = 0.6 + 0.4 * sin(age * (14.0 + 20.0 * h2.z) + 6.2831853 * h2.x);
    float b = uSp.w * (1.0 - k) * (1.0 - k) * tw * (0.4 + 0.6 * h2.z);
    gl_PointSize = uSp2.x * (1.0 + 1.2 * (1.0 - k) * h.w);
    gl_Position = (b < 0.003 || age > life) ? vec4(2.0, 2.0, 2.0, 1.0) : toClip(s);
    vC = mix(uWarm, uHot, (1.0 - k) * (1.0 - k)) * b;
}
`;
const POINT_FS = HEAD +
    `
in vec3 vC;
uniform float uOut;
out vec4 o;
void main() {
    vec2 r = gl_PointCoord - 0.5;
    o = vec4(vC * exp(-dot(r, r) * 5.0) * uOut, 0.0);
}
`;
const QUAD_VS = HEAD +
    `
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;
/**
 * The copper haze at ¼ size: per pixel, find which thread runs through it
 * (invert the gather) and glow by how densely the eyelet has packed the
 * threads it reaches. The shock rings leave a faint wash of light too.
 */
const HAZE_FS = HEAD +
    MAP_GLSL +
    `
uniform vec2 uBuf;
uniform float uPxc;     // device px per CSS px in this target
uniform vec4 uHazeE;    // haze light (rgb), strength
uniform vec3 uRingE;
uniform float uOut;
out vec4 o;
float gx(float dx, float y) {
    float R = max(uEye.z, 1e-3);
    float u = dx / R;
    float u2 = u * u * PULL_K;
    float P = exp(-u2 * u2);
    float yc = uEye.y - uEye2.y * tanh(u);
    float g = (y - yc) / max(uEye2.x, 1e-3);
    float Q = 1.0 / (1.0 + g * g);
    float c = uEye.w * P * Q;
    return dx - c * dx + c * (uEye2.z * (1.0 - Q) + uTilt * (y - yc));
}
void main() {
    vec2 css = vec2(gl_FragCoord.x, uBuf.y - gl_FragCoord.y) / uPxc;
    vec2 w = toWorld(css);
    float R = max(uEye.z, 1e-3);
    float X = w.x - uEye.x;
    vec3 E = vec3(0.0);
    if (abs(X) < 4.0 * R) {
        // Newton on the monotonic map, from the waist's compression as a first guess.
        float g0 = (w.y - uEye.y) / max(uEye2.x, 1e-3);
        float dx = clamp(X / max(1.0 - uEye.w / (1.0 + g0 * g0), 0.05), -3.5 * R, 3.5 * R);
        float hh = 0.002 * R;
        // Newton on dx in [-4R, 4R]: the map is monotonic there.
        float d1 = 1.0;
        for (int i = 0; i < 4; i++) {
            float f = gx(dx, w.y) - X;
            d1 = max((gx(dx + hh, w.y) - gx(dx, w.y)) / hh, 0.03);
            dx = clamp(dx - f / d1, -4.0 * R, 4.0 * R);
        }
        float u = dx / R;
        float P = exp(-u * u * u * u);
        float dens = min(P / d1, 12.0);
        float ends = endsAt(w.y);
        E = uHazeE.rgb * uHazeE.w * pow(max(dens, 0.0), 0.8) * mix(1.0, 0.3, ends);
    }
    float rg = 0.0;
    for (int k = 0; k < ${WAVES}; k++) {
        vec4 wv = uWave[k];
        if (wv.w <= 0.0) continue;
        float g = (length(w - wv.xy) - wv.z) / (uWaveP.x * 1.1);
        rg += wv.w * exp(-g * g);
    }
    E += uRingE * rg;
    if (any(isnan(E)) || any(isinf(E))) E = vec3(0.0);
    o = vec4(min(E, vec3(64.0)) * uOut, 0.0);
}
`;
/** 4×4 box down-sample: four bilinear taps one source texel either side of the block centre. */
const DOWN_FS = HEAD +
    `
uniform sampler2D uSrc;
uniform vec2 uSrcPx;
uniform vec2 uDstRes;
out vec4 o;
void main() {
    vec2 uv = gl_FragCoord.xy / uDstRes;
    vec2 d = uSrcPx;
    vec4 c = 0.25 * (texture(uSrc, uv + vec2(-d.x, -d.y)) + texture(uSrc, uv + vec2(d.x, -d.y)) +
                texture(uSrc, uv + vec2(-d.x, d.y)) + texture(uSrc, uv + d));
    // Anything that feeds a blur is untrusted: one NaN would spread into a block.
    if (any(isnan(c)) || any(isinf(c))) c = vec4(0.0);
    o = c;
}
`;
/** Separable Gaussian, σ = 2.5 texels, 11 taps. */
const BLUR_FS = HEAD +
    `
uniform sampler2D uSrc;
uniform vec2 uStep;
uniform vec2 uDstRes;
out vec4 o;
void main() {
    vec2 uv = gl_FragCoord.xy / uDstRes;
    vec4 acc = texture(uSrc, uv) * 0.16;
    float w[5] = float[5](0.1478, 0.1078, 0.0688, 0.0384, 0.0187);
    for (int i = 0; i < 5; i++) {
        vec2 off = uStep * float(i + 1);
        acc += (texture(uSrc, uv + off) + texture(uSrc, uv - off)) * w[i];
    }
    o = acc / (0.16 + 2.0 * 0.3815);
}
`;
/** Soft clip of all the light, then the ground, stars, vignette and grain. */
const COMP_FS = HEAD +
    `
uniform sampler2D uScene;
uniform sampler2D uBloomA;
uniform sampler2D uBloomB;
uniform sampler2D uSoft;
uniform vec2 uBuf;
uniform vec4 uLook;    // exposure, bloom, scene scale, device px per CSS px
uniform vec4 uBg;      // ground (straight rgb), alpha
uniform vec4 uFx;      // grain, vignette, stars, time
uniform vec3 uDustE;
uniform float uSeed;
out vec4 o;
uint hu(uint x) { x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu; x ^= x >> 16; return x; }
vec4 h4(uint x) {
    uint a = hu(x); uint b = hu(a ^ 0x9e3779b9u); uint c = hu(b ^ 0x85ebca6bu); uint d = hu(c ^ 0xc2b2ae35u);
    return vec4(float(a >> 8u), float(b >> 8u), float(c >> 8u), float(d >> 8u)) * (1.0 / 16777216.0);
}
void main() {
    float pxc = uLook.w;
    vec2 css = vec2(gl_FragCoord.x, uBuf.y - gl_FragCoord.y) / pxc;
    vec2 uv = gl_FragCoord.xy / uBuf;
    // A lens scatters light rather than adding it: a share of it leaves the sharp image for the glow.
    vec3 E = (texture(uScene, uv).rgb * (1.0 - uLook.y) + uLook.y * (0.5 * texture(uBloomA, uv).rgb + 0.5 * texture(uBloomB, uv).rgb)
              + texture(uSoft, uv).rgb) * uLook.z;
    vec3 lit = 1.0 - exp(-E * uLook.x);

    vec2 cell = floor(css / 14.0);
    vec4 hs = h4(uint(int(cell.x) + 4096) * 0x8da6b343u + uint(int(cell.y) + 4096) * 0xd8163841u + uint(uSeed) * 0xcb1ab31fu);
    float star = 0.0;
    if (hs.x < uFx.z) {
        vec2 c = (cell + 0.15 + 0.7 * hs.yz) * 14.0;
        vec2 dd = (css - c) * pxc;
        float rad = 0.35 * pxc + 0.2;
        float tw = 0.8 + 0.2 * sin(uFx.w * (0.4 + hs.w) * 2.0 + hs.y * 40.0);
        star = (0.08 + 0.55 * hs.w * hs.w * hs.w) * tw * exp(-dot(dd, dd) / (2.0 * rad * rad));
    }
    lit = 1.0 - (1.0 - lit) * (1.0 - star * uDustE / max(max(uDustE.r, uDustE.g), max(uDustE.b, 1e-3)));

    float la = max(max(lit.r, lit.g), lit.b);
    vec3 rgb = lit + uBg.rgb * uBg.a * (1.0 - lit);
    float al = uBg.a + la * (1.0 - uBg.a);
    float vd = length(uv - 0.5) * 1.4142;
    rgb *= 1.0 - uFx.y * smoothstep(0.35, 1.0, vd);
    vec4 hg = h4(uint(gl_FragCoord.x) * 0x9e3779b1u + uint(gl_FragCoord.y) * 0x85ebca77u + uint(uFx.w * 24.0) * 0xc2b2ae3du);
    rgb += (hg.x - 0.5) * uFx.x * al;
    o = vec4(clamp(rgb, 0.0, al), al);
}
`;
// ── GL plumbing ─────────────────────────────────────────────────────────────
function compile(gl, vs, fs) {
    const sh = (type, src) => {
        const s = gl.createShader(type);
        if (!s)
            throw new Error("createShader failed");
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) {
            const log = gl.getShaderInfoLog(s) || "shader compile failed";
            gl.deleteShader(s);
            throw new Error(log);
        }
        return s;
    };
    const p = gl.createProgram();
    if (!p)
        throw new Error("createProgram failed");
    const v = sh(gl.VERTEX_SHADER, vs);
    const f = sh(gl.FRAGMENT_SHADER, fs);
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.bindAttribLocation(p, 0, "aPos");
    gl.linkProgram(p);
    gl.deleteShader(v);
    gl.deleteShader(f);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) {
        throw new Error(gl.getProgramInfoLog(p) || "link failed");
    }
    return p;
}
/** Uniform setter that uploads only on change (doubles, not float32). */
class Uniforms {
    constructor(gl, prog) {
        this.gl = gl;
        this.prog = prog;
        this.loc = new Map();
        this.last = new Map();
    }
    get(name) {
        let l = this.loc.get(name);
        if (l === undefined) {
            l = this.gl.getUniformLocation(this.prog, name);
            this.loc.set(name, l);
        }
        return l;
    }
    changed(name, a, b = 0, c = 0, d = 0) {
        let v = this.last.get(name);
        if (!v) {
            v = new Float64Array([NaN, NaN, NaN, NaN]);
            this.last.set(name, v);
        }
        if (v[0] === a && v[1] === b && v[2] === c && v[3] === d)
            return false;
        v[0] = a;
        v[1] = b;
        v[2] = c;
        v[3] = d;
        return true;
    }
    f1(n, a) {
        if (this.changed(n, a))
            this.gl.uniform1f(this.get(n), a);
    }
    f2(n, a, b) {
        if (this.changed(n, a, b))
            this.gl.uniform2f(this.get(n), a, b);
    }
    f3(n, a, b, c) {
        if (this.changed(n, a, b, c))
            this.gl.uniform3f(this.get(n), a, b, c);
    }
    f4(n, a, b, c, d) {
        if (this.changed(n, a, b, c, d))
            this.gl.uniform4f(this.get(n), a, b, c, d);
    }
    i1(n, a) {
        if (this.changed(n, a, -1))
            this.gl.uniform1i(this.get(n), a);
    }
    c3(n, c) {
        this.f3(n, c[0], c[1], c[2]);
    }
}
function frameToWorld(m, sx, sy) {
    const vx = sx - m.cx;
    const vy = sy - m.cy;
    const st = Math.sin(m.tilt);
    const ry = (vy * m.persp) / Math.max(Math.cos(m.tilt) * m.persp + vy * st, 1);
    const k = m.persp / Math.max(m.persp - ry * st, 1);
    const rx = vx / k;
    const qx = rx * m.ca + ry * m.sa;
    const qy = -rx * m.sa + ry * m.ca;
    return [qx / m.unit, qy / m.unit];
}
// ── Component ───────────────────────────────────────────────────────────────
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
/**
 * Vanilla port of the component body: mountBrocade(root, canvas, props).
 * root is the element that receives the pointer and sets the size; the canvas fills it.
 * Returns { set(props) } to change props live.
 */
function mountBrocade(root, canvas, initial) {
    var _a;
    const propsRef = { current: initial };
    const setGpu = (on) => root.classList.toggle("gpu-on", on);
    const mq = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    let reduced = !!(mq && mq.matches);
    const onMq = () => {
        reduced = !!(mq && mq.matches);
        wake();
    };
    (_a = mq === null || mq === void 0 ? void 0 : mq.addEventListener) === null || _a === void 0 ? void 0 : _a.call(mq, "change", onMq);
    let gl = null;
    let threadProg = null;
    let glintProg = null;
    let dustProg = null;
    let sparkProg = null;
    let hazeProg = null;
    let downProg = null;
    let blurProg = null;
    let compProg = null;
    let uThread = null;
    let uGlint = null;
    let uDust = null;
    let uSpark = null;
    let uHaze = null;
    let uDown = null;
    let uBlur = null;
    let uComp = null;
    let quadVao = null;
    let emptyVao = null;
    let scene = null;
    let soft = null;
    const q4 = [null, null];
    const q8 = [null, null];
    let floatOK = false;
    let lost = false;
    let timerExt = null;
    const queries = [];
    // Light buffers are R11G11B10F where it renders (half the bandwidth of RGBA16F,
    // and the light needs no alpha), RGBA16F otherwise, RGBA8 at a quarter scale last.
    let packedOK = true;
    const makeTarget = (w, h, float) => {
        if (!gl)
            return null;
        const tex = gl.createTexture();
        const fbo = gl.createFramebuffer();
        if (!tex || !fbo)
            return null;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        if (float && packedOK)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.R11F_G11F_B10F, w, h, 0, gl.RGB, gl.HALF_FLOAT, null);
        else
            gl.texImage2D(gl.TEXTURE_2D, 0, float ? gl.RGBA16F : gl.RGBA8, w, h, 0, gl.RGBA, float ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        if (!ok) {
            gl.deleteTexture(tex);
            gl.deleteFramebuffer(fbo);
            if (float && packedOK) {
                packedOK = false;
                return makeTarget(w, h, float);
            }
            return null;
        }
        return { tex, fbo, w, h };
    };
    const dropTarget = (t) => {
        if (!t || !gl)
            return;
        gl.deleteTexture(t.tex);
        gl.deleteFramebuffer(t.fbo);
    };
    const initGL = () => {
        gl = canvas.getContext("webgl2", {
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            powerPreference: "low-power",
        });
        if (!gl)
            return false;
        try {
            threadProg = compile(gl, THREAD_VS, THREAD_FS);
            glintProg = compile(gl, GLINT_VS, GLINT_FS);
            dustProg = compile(gl, DUST_VS, POINT_FS);
            sparkProg = compile(gl, SPARK_VS, POINT_FS);
            hazeProg = compile(gl, QUAD_VS, HAZE_FS);
            downProg = compile(gl, QUAD_VS, DOWN_FS);
            blurProg = compile(gl, QUAD_VS, BLUR_FS);
            compProg = compile(gl, QUAD_VS, COMP_FS);
        }
        catch (e) {
            if (!gl.isContextLost())
                console.error("BrocadeEyelet:", e);
            gl = null;
            return false;
        }
        uThread = new Uniforms(gl, threadProg);
        uGlint = new Uniforms(gl, glintProg);
        uDust = new Uniforms(gl, dustProg);
        uSpark = new Uniforms(gl, sparkProg);
        uHaze = new Uniforms(gl, hazeProg);
        uDown = new Uniforms(gl, downProg);
        uBlur = new Uniforms(gl, blurProg);
        uComp = new Uniforms(gl, compProg);
        floatOK = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
        gl.getExtension("OES_texture_float_linear");
        timerExt = gl.getExtension("EXT_disjoint_timer_query_webgl2");
        const quad = gl.createBuffer();
        quadVao = gl.createVertexArray();
        gl.bindVertexArray(quadVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        emptyVao = gl.createVertexArray();
        gl.bindVertexArray(null);
        packedOK = true;
        scene = soft = null;
        q4[0] = q4[1] = q8[0] = q8[1] = null;
        queries.length = 0;
        return true;
    };
    // ── Size & resolution ──
    let W = 0;
    let H = 0;
    let shown = 1;
    let quality = 0;
    let bufW = 0;
    let bufH = 0;
    let pxPerCss = 1;
    const measureShown = () => {
        if (W <= 0)
            return false;
        const r = root.getBoundingClientRect();
        const s = Math.min(2, Math.max(1, r.width / W));
        if (Math.abs(s - shown) / shown > 0.05) {
            shown = s;
            return true;
        }
        return false;
    };
    // Resizing wipes the canvas; draw() applies a pending resize right before it
    // paints, so a wiped buffer is never shown.
    let resizePending = true;
    const applyResize = () => {
        resizePending = false;
        if (!gl || W <= 0 || H <= 0)
            return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        let k = dpr * shown * QUALITY_LEVELS[quality];
        const px = W * H * k * k;
        if (px > MAX_PIXELS)
            k *= Math.sqrt(MAX_PIXELS / px);
        const bw = Math.max(1, Math.round(W * k));
        const bh = Math.max(1, Math.round(H * k));
        pxPerCss = bw / W;
        if (bw === bufW && bh === bufH && scene)
            return;
        bufW = bw;
        bufH = bh;
        canvas.width = bw;
        canvas.height = bh;
        for (const t of [scene, soft, q4[0], q4[1], q8[0], q8[1]])
            dropTarget(t);
        scene = makeTarget(bw, bh, floatOK);
        if (!scene && floatOK) {
            floatOK = false;
            scene = makeTarget(bw, bh, false);
        }
        const w4 = Math.max(1, Math.ceil(bw / 4));
        const h4 = Math.max(1, Math.ceil(bh / 4));
        const w8 = Math.max(1, Math.ceil(bw / 8));
        const h8 = Math.max(1, Math.ceil(bh / 8));
        soft = makeTarget(w4, h4, floatOK);
        q4[0] = makeTarget(w4, h4, floatOK);
        q4[1] = makeTarget(w4, h4, floatOK);
        q8[0] = makeTarget(w8, h8, floatOK);
        q8[1] = makeTarget(w8, h8, floatOK);
    };
    // ── Pointer (client coords only; the rect is read in the frame) ──
    let ptrClientX = 0;
    let ptrClientY = 0;
    let ptrMoved = false;
    let ptrInside = false;
    let ptrU = 0.5;
    let ptrV = 0.5;
    /** A touch leaves the eyelet where it tapped for a while, then lets it go home. */
    let holdUntil = 0;
    let clickPending = false;
    let clickClientX = 0;
    let clickClientY = 0;
    const onMove = (e) => {
        if (e.clientX === ptrClientX && e.clientY === ptrClientY && ptrInside)
            return;
        ptrClientX = e.clientX;
        ptrClientY = e.clientY;
        ptrMoved = true;
        ptrInside = true;
        kick();
    };
    let holdTimer = 0;
    const onLeave = (e) => {
        if (e.pointerType !== "mouse") {
            holdUntil = performance.now() + 4000;
            // Wake once the hold ends, so the eyelet glides home even in a still scene.
            window.clearTimeout(holdTimer);
            holdTimer = window.setTimeout(() => kick(), 4050);
        }
        ptrInside = false;
        kick();
    };
    const onDown = (e) => {
        if (e.pointerType === "mouse" && e.button !== 0)
            return;
        onMove(e);
        clickPending = true;
        clickClientX = e.clientX;
        clickClientY = e.clientY;
        kick();
    };
    const onUp = (e) => {
        if (e.pointerType !== "mouse")
            onLeave(e);
    };
    const onScroll = () => {
        if (ptrInside) {
            ptrMoved = true;
            kick();
        }
    };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerenter", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    // ── Frame map (CPU copy of toWorld) ──
    const map = { unit: 1, cx: 0, cy: 0, ca: 1, sa: 0, tilt: 0, persp: 1 };
    const updateMap = (p) => {
        var _a;
        const pl = { ...DEFAULT_PLACEMENT, ...p.placement };
        // Contain the 1200×800 composition: S is its height, one world unit at 100%.
        const S = Math.min(H, W / REF_ASPECT);
        map.unit = S * (num(p.scale, DEFAULTS.scale, 30, 300) / 100);
        map.cx = W / 2 + (num(pl.x, 0, -50, 50) / 100) * W;
        map.cy = H / 2 + (num(pl.y, 0, -50, 50) / 100) * H;
        const dir = (_a = DIRECTION_ANGLE[p.direction]) !== null && _a !== void 0 ? _a : 0;
        const ang = ((num(pl.angle, 0, -180, 180) + dir) * Math.PI) / 180;
        map.ca = Math.cos(ang);
        map.sa = Math.sin(ang);
        map.tilt = (num(pl.tilt, 0, -60, 60) * Math.PI) / 180;
        map.persp = TILT_PERSPECTIVE * Math.max(W, H, 1);
    };
    /** The visible stretch of the world (plus the map's own margins). */
    const bounds = { x0: -1, x1: 1, y0: -1, y1: 1 };
    const updateBounds = () => {
        let x0 = Infinity;
        let x1 = -Infinity;
        let y0 = Infinity;
        let y1 = -Infinity;
        for (const [sx, sy] of [
            [0, 0],
            [W, 0],
            [0, H],
            [W, H],
            [W / 2, 0],
            [W / 2, H],
        ]) {
            const [wx, wy] = frameToWorld(map, sx, sy);
            x0 = Math.min(x0, wx);
            x1 = Math.max(x1, wx);
            y0 = Math.min(y0, wy);
            y1 = Math.max(y1, wy);
        }
        const cap = 8;
        bounds.x0 = Math.max(-cap, x0);
        bounds.x1 = Math.min(cap, x1);
        bounds.y0 = Math.max(-cap, y0);
        bounds.y1 = Math.min(cap, y1);
    };
    // ── Eyelet state ──
    const eye = { x: 0, y: 0, R: 0.26, a: 0.8, sig: 0.15, lean: 0.1, lag: 0, tilt: 0.3 };
    let ex = 0;
    let ey = 0;
    let evx = 0;
    let evy = 0;
    let snapEye = true;
    let swirl = 0;
    let parX = 0;
    let parY = 0;
    const waves = [];
    let waveId = 0;
    const setMapUniforms = (u, p, adv, ph) => {
        var _a;
        u.f4("uMap", map.ca, map.sa, map.tilt, map.persp);
        u.f4("uMap2", map.unit, map.cx, map.cy, pxPerCss);
        u.f2("uFrame", W, H);
        u.f4("uEye", eye.x, eye.y, eye.R, eye.a);
        u.f4("uEye2", eye.sig, eye.lean, eye.lag, eye.y);
        u.f1("uTilt", eye.tilt);
        u.f4("uDof", 0.17, 0.011 * (num(adv.defocus, DEFAULT_ADVANCED.defocus, 0, 300) / 100), 0.45 * num(adv.streakWidth, DEFAULT_ADVANCED.streakWidth, 1, 20), 0.8 / pxPerCss);
        const swayA = (num(adv.sway, DEFAULT_ADVANCED.sway, 0, 100) / 100) * 0.006;
        u.f4("uSway", swayA, ph * 0.35, parX, parY);
        for (let k = 0; k < WAVES; k++) {
            const w = waves[k];
            const life = w ? Math.max(0, 1 - w.age / WAVE_LIFE) : 0;
            const rs = (num(adv.ringSpeed, DEFAULT_ADVANCED.ringSpeed, 10, 200) / 100) * 1.1;
            if (w && life > 0)
                u.f4(`uWave[${k}]`, w.x, w.y, rs * w.age, w.amp * life * life);
            else
                u.f4(`uWave[${k}]`, 0, 0, 0, 0);
        }
        const shock = num((_a = p.response) === null || _a === void 0 ? void 0 : _a.shockwave, DEFAULT_RESPONSE.shockwave, 0, 10) / 5;
        u.f4("uWaveP", 0.032, 0.034 * Math.max(shock, 0.2), 4.0, 0);
        u.f1("uSalt", Math.round(num(adv.seed, DEFAULT_ADVANCED.seed, 0, 99)));
        u.f1("uBundleShift", (clock * 0.02) % 1000);
    };
    // ── Loop state ──
    let raf = 0;
    let running = false;
    let visible = true;
    let clock = 0;
    let flowPos = 0;
    let lastTick = -1;
    let lastDraw = -1;
    let dirty = true;
    let lastProps = null;
    let lateEma = 1;
    let gpuEma = 0;
    let goodFor = 0;
    let slowFor = 0;
    let banUntil = 0;
    let drawn = 0;
    let painted = false;
    let measuredAt = 0;
    let warm = 0;
    // Vsync lock: the median of recent rAF gaps is the display's cadence, and a
    // frame is drawn every `divisor` vsyncs.
    const gaps = new Float64Array(15);
    const gapSort = new Float64Array(15);
    let gapN = 0;
    let cadence = 1000 / 60;
    let divisor = 1;
    const pass = (t, prog) => {
        if (!gl || !t)
            return;
        gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
        gl.viewport(0, 0, t.w, t.h);
        gl.useProgram(prog);
        gl.bindVertexArray(quadVao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const draw = () => {
        var _a;
        if (resizePending)
            applyResize();
        if (!gl || lost || !threadProg || !glintProg || !dustProg || !sparkProg || !hazeProg || !downProg || !blurProg || !compProg)
            return;
        if (!uThread || !uGlint || !uDust || !uSpark || !uHaze || !uDown || !uBlur || !uComp || !scene)
            return;
        if (W <= 0 || H <= 0)
            return;
        const p = propsRef.current;
        const adv = { ...DEFAULT_ADVANCED, ...p.advanced };
        updateMap(p);
        updateBounds();
        const seed = Math.round(num(adv.seed, DEFAULT_ADVANCED.seed, 0, 99));
        const dens = num(p.density, DEFAULTS.density, 10, 200) / 100;
        let q = null;
        if (timerExt && queries.length < 4) {
            q = gl.createQuery();
            if (q)
                gl.beginQuery(timerExt.TIME_ELAPSED_EXT, q);
        }
        const period = num(adv.breathePeriod, DEFAULT_ADVANCED.breathePeriod, 500, 30000) / 1000;
        const ph = (2 * Math.PI * clock) / period;
        const outScale = floatOK ? 1 : 0.25;
        const fringeK = num(p.fringe, DEFAULTS.fringe, 0, 100) / 100;
        const coreE = asLight(parseColor(adv.coreColor, [0.92, 0.86, 0.73]));
        const baseE = asLight(parseColor(p.baseColor, [1, 0.54, 0.23]));
        const accE = asLight(parseColor(p.accentColor, [0.37, 0.88, 0.88]));
        const vioE = asLight(parseColor(adv.violetColor, [0.54, 0.42, 1]));
        const midE = asLight(parseColor(adv.midColor, [0.55, 0.42, 0.38]));
        const hazeE = asLight(parseColor(adv.hazeColor, [0.43, 0.29, 0.25]));
        const dustE = asLight(parseColor(adv.dustColor, [0.85, 0.82, 0.78]));
        // Warm and cool kinds carry the core's red energy, so the hue picks the colour
        // and not how hard a fully saturated channel pushes the soft clip.
        const atCore = (c, k) => {
            const m = (k * coreE[0]) / Math.max(c[0], c[1], c[2], 1e-3);
            return [c[0] * m, c[1] * m, c[2] * m];
        };
        const nrm = (c) => {
            const m = Math.max(c[0], c[1], c[2], 1e-3);
            return [c[0] / m, c[1] / m, c[2] / m];
        };
        const kWarm = atCore(baseE, 0.8);
        const kCyan = atCore(accE, 1);
        const kVio = atCore(vioE, 1);
        const cool = (k) => [k[0] * 0.25 + coreE[0] * 0.75, k[1] * 0.25 + coreE[1] * 0.75, k[2] * 0.25 + coreE[2] * 0.75];
        const hazeN = nrm(hazeE);
        const coreN = nrm(coreE);
        // Dim light leans copper (the haze's hue), bright light keeps the core's gold.
        const tint = [
            0.3 + 0.7 * Math.min(1.5, hazeN[0] / Math.max(coreN[0], 0.05)),
            0.3 + 0.7 * Math.min(1.5, hazeN[1] / Math.max(coreN[1], 0.05)),
            0.3 + 0.7 * Math.min(1.5, hazeN[2] / Math.max(coreN[2], 0.05)),
        ];
        const fieldLight = num(adv.fieldLight, DEFAULT_ADVANCED.fieldLight, 0, 100) / 100;
        const fibK = num(adv.fibres, DEFAULT_ADVANCED.fibres, 0, 300) / 100;
        // ── Light buffer ──
        gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fbo);
        gl.viewport(0, 0, scene.w, scene.h);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.bindVertexArray(emptyVao);
        // Threads: enumerate the ones the frame can show (gather pulls them in by up to ~0.43 R).
        const mx = 0.9 * eye.R + 0.03 + Math.abs(parX) + 0.02;
        const pitch0 = 1 / (THREADS_PER_UNIT * dens);
        let stride = 1;
        while (pitch0 * stride * map.unit < MIN_THREAD_PX && stride < 64)
            stride *= 2;
        while ((bounds.x1 - bounds.x0 + 2 * mx) / (pitch0 * stride) > MAX_THREADS && stride < 256)
            stride *= 2;
        const i0 = Math.floor((bounds.x0 - mx) / pitch0 / stride) * stride;
        const i1 = Math.ceil((bounds.x1 + mx) / pitch0 / stride) * stride;
        const nThreads = Math.max(0, Math.round((i1 - i0) / stride) + 1);
        const yPad = 0.04;
        const threadDraw = (layer, pitch, first, step, count, perThread, gm, seg) => {
            if (!uThread || count <= 0)
                return;
            uThread.f4("uTh", first, step, pitch, perThread);
            uThread.f4("uTh2", bounds.y0 - yPad, bounds.y1 + yPad, gm, layer);
            uThread.f1("uSeg", seg);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, count * (2 * (seg + 1) + 2));
        };
        gl.useProgram(threadProg);
        setMapUniforms(uThread, p, adv, ph);
        uThread.f4("uTh3", flowPos * 1.0, fibK * 1.0, fibK * 0.55, fieldLight);
        uThread.f4("uTh4", 0.12 * fringeK, 0.45 * fringeK, 9, 0.25);
        uThread.f4("uTh5", 1, clock, num(adv.flicker, DEFAULT_ADVANCED.flicker, 0, 100) / 100, 0);
        uThread.c3("uK0", coreE);
        uThread.c3("uK1", kWarm);
        uThread.c3("uK2", kCyan);
        uThread.c3("uK3", kVio);
        uThread.c3("uK2s", cool(kCyan));
        uThread.c3("uK3s", cool(kVio));
        uThread.c3("uMidE", midE);
        uThread.c3("uTint", tint);
        uThread.f1("uOut", outScale);
        // A thread's light per unit length: fewer, sparser threads each carry more.
        const perThread = 4.2 * Math.pow(1 / dens, 0.5) * stride;
        if (nThreads > 0) {
            // The bright bundle the eyelet bends sharply gets fine segments; the sheet beyond,
            // bowing gently, gets coarser ones, unless a shock ring is rippling through it.
            const lenPx = (bounds.y1 - bounds.y0 + 2 * yPad) * map.unit;
            const segNear = Math.max(24, Math.min(THREAD_SEG, Math.ceil(lenPx / SEG_PX_NEAR)));
            const segFar = waves.length ? segNear : Math.max(16, Math.min(THREAD_SEG, Math.ceil(lenPx / SEG_PX_FAR)));
            const span = 1.6 * eye.R + 0.02;
            const ia = Math.min(i1 + stride, Math.max(i0, Math.floor((eye.x - span) / pitch0 / stride) * stride));
            const ib = Math.max(ia - stride, Math.min(i1, Math.ceil((eye.x + span) / pitch0 / stride) * stride));
            threadDraw(0, pitch0, i0, stride, Math.round((ia - i0) / stride), perThread, 1, segFar);
            threadDraw(0, pitch0, ia, stride, Math.round((ib - ia) / stride) + 1, perThread, 1, segNear);
            threadDraw(0, pitch0, ib + stride, stride, Math.round((i1 - ib) / stride), perThread, 1, segFar);
        }
        // Glints.
        const gPitch = 1 / (GLINT_PER_UNIT * dens);
        // Glints are fine detail too: zoomed out, keep their on-screen spacing by skipping lanes.
        let gStride = 1;
        while (gPitch * gStride * map.unit < 6 && gStride < 64)
            gStride *= 2;
        const gl0 = Math.floor((bounds.x0 - mx) / gPitch / gStride) * gStride;
        const gl1 = Math.ceil((bounds.x1 + mx) / gPitch / gStride) * gStride;
        const nLanes = Math.max(0, Math.min(1200, Math.round((gl1 - gl0) / gStride) + 1));
        const ry0 = Math.floor((bounds.y0 - 0.4) / 0.25) * 0.25;
        const rLen = Math.max(0.5, Math.ceil((bounds.y1 + 0.4) / 0.25) * 0.25 - ry0);
        const cellLen = Math.max(0.03, num(adv.streakLength, DEFAULT_ADVANCED.streakLength, 5, 60) / 100) * 1.4;
        const NS = Math.max(1, Math.min(48, Math.ceil(rLen / cellLen)));
        if (nLanes > 0) {
            gl.useProgram(glintProg);
            setMapUniforms(uGlint, p, adv, ph);
            uGlint.f4("uGl", gl0, nLanes, NS, gPitch);
            uGlint.f4("uGl2", ry0, rLen, flowPos, num(adv.occupancy, DEFAULT_ADVANCED.occupancy, 5, 100) / 100);
            uGlint.f4("uGl3", 0.45 * num(adv.streakWidth, DEFAULT_ADVANCED.streakWidth, 1, 20), 4.0 * Math.pow(1 / dens, 0.5), num(adv.cyanShare, DEFAULT_ADVANCED.cyanShare, 0, 100) / 100, num(adv.violetShare, DEFAULT_ADVANCED.violetShare, 0, 100) / 100);
            uGlint.f4("uGl4", num(adv.flicker, DEFAULT_ADVANCED.flicker, 0, 100) / 100, clock, 0.45 * fringeK, 0.6 * fringeK);
            uGlint.f4("uGl5", fieldLight, cellLen / 0.25, gStride, 0);
            uGlint.c3("uCoreE", coreE);
            uGlint.c3("uBaseE", atCore(baseE, 0.8));
            uGlint.c3("uAccE", kCyan);
            uGlint.c3("uVioE", kVio);
            uGlint.f1("uOut", outScale);
            gl.drawArrays(gl.TRIANGLES, 0, nLanes * NS * GLINT_SEG * 6);
        }
        // Glitter: fine detail keeps its CSS size, so its count follows the on-screen size of the world.
        const dustAmt = num(adv.dust, DEFAULT_ADVANCED.dust, 0, 200) / 50;
        if (dustAmt > 0) {
            const zoom = Math.min(3, Math.max(0.05, (map.unit / REF_H) ** 2));
            const area = (bounds.x1 - bounds.x0 + 2 * mx) * rLen;
            const nEye = Math.round(DUST_EYE * (eye.R / 0.26) * Math.min(2, dustAmt) * zoom);
            const nField = Math.round(DUST_FIELD * area * Math.min(2, dustAmt) * zoom);
            const nDust = Math.min(200000, nEye + nField);
            gl.useProgram(dustProg);
            setMapUniforms(uDust, p, adv, ph);
            uDust.f4("uDu", ry0, rLen, flowPos, Math.max(1, 0.75 * pxPerCss));
            uDust.f4("uDu2", nEye, bounds.x0 - mx, bounds.x1 - bounds.x0 + 2 * mx, 1.1 * Math.max(1, dustAmt / 2));
            uDust.f4("uDu3", clock, fieldLight, 0, 0);
            uDust.c3("uDustE", dustE);
            uDust.f1("uOut", outScale);
            if (nDust > 0)
                gl.drawArrays(gl.POINTS, 0, nDust);
        }
        // Sparks thrown by each live shockwave.
        const sparkK = num(adv.sparks, DEFAULT_ADVANCED.sparks, 0, 300) / 100;
        if (sparkK > 0 && waves.length) {
            gl.useProgram(sparkProg);
            setMapUniforms(uSpark, p, adv, ph);
            uSpark.c3("uHot", [coreE[0] * 3, coreE[1] * 3, coreE[2] * 3]);
            uSpark.c3("uWarm", [kWarm[0] * 1.5, kWarm[1] * 1.5, kWarm[2] * 1.5]);
            uSpark.f1("uOut", outScale);
            const nSp = Math.round(SPARKS * Math.min(3, sparkK));
            for (const w of waves) {
                if (w.age > 1.7)
                    continue;
                uSpark.f4("uSp", w.x0, w.y, w.age, 5 * w.amp);
                uSpark.f4("uSp2", Math.max(1.5, 2.1 * pxPerCss), w.id % 997, flowPos, 0);
                gl.drawArrays(gl.POINTS, 0, nSp);
            }
        }
        gl.disable(gl.BLEND);
        // ── Soft buffer: haze, then the near out-of-focus strands ──
        if (soft) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, soft.fbo);
            gl.viewport(0, 0, soft.w, soft.h);
            gl.useProgram(hazeProg);
            setMapUniforms(uHaze, p, adv, ph);
            uHaze.f2("uBuf", soft.w, soft.h);
            uHaze.f1("uPxc", (soft.w / bufW) * pxPerCss);
            const hazeAmt = (num(adv.haze, DEFAULT_ADVANCED.haze, 0, 200) / 100) * 0.6;
            uHaze.f4("uHazeE", hazeN[0], hazeN[1], hazeN[2], Math.max(hazeE[0], hazeE[1], hazeE[2]) * hazeAmt);
            const rk = 0.12 * num((_a = p.response) === null || _a === void 0 ? void 0 : _a.shockwave, DEFAULT_RESPONSE.shockwave, 0, 10) / 5;
            uHaze.f3("uRingE", (kWarm[0] + coreE[0]) * rk * 0.6, (kWarm[1] + coreE[1]) * rk * 0.6, (kWarm[2] + coreE[2]) * rk * 0.6);
            uHaze.f1("uOut", outScale);
            gl.bindVertexArray(quadVao);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            const nearK = num(adv.nearStrands, DEFAULT_ADVANCED.nearStrands, 0, 200) / 100;
            if (nearK > 0) {
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.bindVertexArray(emptyVao);
                gl.useProgram(threadProg);
                const nearPitch = 1 / NEAR_PER_UNIT;
                const n0 = Math.floor((bounds.x0 - mx - Math.abs(parX) * 2) / nearPitch);
                const n1 = Math.ceil((bounds.x1 + mx + Math.abs(parX) * 2) / nearPitch);
                // The near strands are drawn in the soft target, so their blur is in its own px.
                uThread.f4("uMap2", map.unit, map.cx, map.cy, (soft.w / bufW) * pxPerCss);
                uThread.f4("uTh3", flowPos * 0.6, fibK * 1.0, fibK * 0.55, 0.55);
                uThread.f4("uTh4", 1.6 * fringeK, 0.35 * fringeK, 16, 0.35 * nearK);
                threadDraw(1, nearPitch, n0, 1, Math.max(0, Math.min(400, n1 - n0 + 1)), 1, 0.25, THREAD_SEG);
                gl.disable(gl.BLEND);
            }
        }
        // ── Bloom: ¼ and ⅛ size ──
        const bloomAmt = num(adv.bloom, DEFAULT_ADVANCED.bloom, 0, 200) / 100;
        if (bloomAmt > 0 && q4[0] && q4[1] && q8[0] && q8[1]) {
            gl.activeTexture(gl.TEXTURE0);
            gl.useProgram(downProg);
            uDown.i1("uSrc", 0);
            gl.bindTexture(gl.TEXTURE_2D, scene.tex);
            uDown.f2("uSrcPx", 1 / scene.w, 1 / scene.h);
            uDown.f2("uDstRes", q4[0].w, q4[0].h);
            pass(q4[0], downProg);
            gl.bindTexture(gl.TEXTURE_2D, q4[0].tex);
            uDown.f2("uSrcPx", 1 / q4[0].w, 1 / q4[0].h);
            uDown.f2("uDstRes", q8[0].w, q8[0].h);
            pass(q8[0], downProg);
            gl.useProgram(blurProg);
            uBlur.i1("uSrc", 0);
            for (const [pair, sx, sy] of [
                [q4, 1 / q4[0].w, 1 / q4[0].h],
                [q8, 1 / q8[0].w, 1 / q8[0].h],
            ]) {
                const a = pair[0];
                const b = pair[1];
                if (!a || !b)
                    continue;
                uBlur.f2("uDstRes", a.w, a.h);
                gl.bindTexture(gl.TEXTURE_2D, a.tex);
                uBlur.f2("uStep", sx, 0);
                pass(b, blurProg);
                gl.bindTexture(gl.TEXTURE_2D, b.tex);
                uBlur.f2("uStep", 0, sy);
                pass(a, blurProg);
            }
        }
        // ── Composite ──
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, bufW, bufH);
        gl.useProgram(compProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, scene.tex);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, q4[0] ? q4[0].tex : scene.tex);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, q8[0] ? q8[0].tex : scene.tex);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, soft ? soft.tex : scene.tex);
        uComp.i1("uScene", 0);
        uComp.i1("uBloomA", 1);
        uComp.i1("uBloomB", 2);
        uComp.i1("uSoft", 3);
        uComp.f2("uBuf", bufW, bufH);
        uComp.f4("uLook", num(adv.exposure, DEFAULT_ADVANCED.exposure, 20, 400) / 140, Math.min(0.9, 0.6 * bloomAmt), 1 / outScale, pxPerCss);
        const bg = parseColorA(p.background, [0.075, 0.07, 0.07]);
        uComp.f4("uBg", bg.c[0], bg.c[1], bg.c[2], bg.a);
        uComp.f4("uFx", (num(adv.grain, DEFAULT_ADVANCED.grain, 0, 100) / 100) * 0.12, num(adv.vignette, DEFAULT_ADVANCED.vignette, 0, 100) / 100, 0.06 * (num(adv.stars, DEFAULT_ADVANCED.stars, 0, 200) / 50), clock);
        uComp.c3("uDustE", dustE);
        uComp.f1("uSeed", seed);
        gl.bindVertexArray(quadVao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindVertexArray(null);
        if (q && timerExt) {
            gl.endQuery(timerExt.TIME_ELAPSED_EXT);
            queries.push({ q, level: quality });
        }
        drawn++;
        if (!painted) {
            painted = true;
            setGpu(true);
        }
    };
    const pollQueries = () => {
        if (!gl || !timerExt)
            return;
        const disjoint = gl.getParameter(timerExt.GPU_DISJOINT_EXT);
        while (queries.length) {
            const { q, level } = queries[0];
            if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE))
                break;
            const ms = gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6;
            gl.deleteQuery(q);
            queries.shift();
            if (!disjoint && level === quality && warm > 30)
                gpuEma = gpuEma ? gpuEma * 0.9 + ms * 0.1 : ms;
        }
    };
    // Eyelet spring targets (world) and whether anything is still moving.
    let tgtX = 0;
    let tgtY = 0;
    let springBusy = false;
    /** How often to draw: 60 while anything the pointer started moves or the flow crosses fast, 30 for slow drift, 0 when still. */
    const wantRate = (p) => {
        if (springBusy || waves.length)
            return 60;
        const adv = { ...DEFAULT_ADVANCED, ...p.advanced };
        const spd = num(p.speed, DEFAULTS.speed, 0, 100) / 50;
        if (reduced || spd <= 0)
            return 0;
        const flowPx = FLOW_RATE * (num(adv.flowSpeed, DEFAULT_ADVANCED.flowSpeed, 0, 200) / 100) * spd * map.unit;
        return flowPx > SMOOTH_FLOW_PX ? 60 : 30;
    };
    const stepEye = (p, adv, dt, now) => {
        const resp = { ...DEFAULT_RESPONSE, ...p.response };
        const reach = num(resp.reach, DEFAULT_RESPONSE.reach, 0, 10);
        eye.R = 0.08 + 0.052 * reach;
        const pin = num(p.pinch, DEFAULTS.pinch, 0, 100) / 100;
        const period = num(adv.breathePeriod, DEFAULT_ADVANCED.breathePeriod, 500, 30000) / 1000;
        const ph = (2 * Math.PI * clock) / period;
        const br = (num(adv.breathe, DEFAULT_ADVANCED.breathe, 0, 30) / 100) * Math.sin(ph);
        // Pinch 0 barely draws the threads in, 50 is a LumenCinch waist, 100 threads them all through one point.
        const a0 = 0.2 + 0.75 * Math.pow(pin, 0.75);
        eye.a = Math.min(0.97, Math.max(0, a0 * (1 + br)));
        eye.sig = (num(adv.waist, DEFAULT_ADVANCED.waist, 3, 60) / 100) * (1 - 0.5 * br);
        // Home: the composition's centre, drifting slowly when nothing holds the eyelet.
        const homeX = 0.018 * Math.sin(clock * 0.37) + 0.008 * Math.sin(clock * 0.91 + 2);
        const homeY = 0.012 * Math.sin(clock * 0.23 + 1);
        const follow = resp.follow !== false;
        const held = follow && !reduced ? ptrInside || now < holdUntil : false;
        tgtX = held ? ptrWX : homeX;
        tgtY = held ? ptrWY : homeY;
        if (snapEye) {
            snapEye = false;
            ex = tgtX;
            ey = tgtY;
            evx = evy = 0;
        }
        // Critically damped: ~100 ms to follow the pointer, a slower glide home.
        const T = held
            ? num(adv.followTime, DEFAULT_ADVANCED.followTime, 20, 1000) / 1000
            : num(adv.returnTime, DEFAULT_ADVANCED.returnTime, 50, 3000) / 1000;
        const omega = 5.8 / T;
        let rem = dt;
        while (rem > 1e-6) {
            const h = Math.min(rem, 1 / 240);
            evx += (omega * omega * (tgtX - ex) - 2 * omega * evx) * h;
            evy += (omega * omega * (tgtY - ey) - 2 * omega * evy) * h;
            ex += evx * h;
            ey += evy * h;
            rem -= h;
        }
        if (Math.abs(tgtX - ex) < 1e-5 && Math.abs(evx) < 1e-4) {
            ex = tgtX;
            evx = 0;
        }
        if (Math.abs(tgtY - ey) < 1e-5 && Math.abs(evy) < 1e-4) {
            ey = tgtY;
            evy = 0;
        }
        // Swirl: the eyelet's sideways speed leans the waist and trails the fans behind it.
        const swirlAmt = num(resp.swirl, DEFAULT_RESPONSE.swirl, 0, 10) / 5;
        const sTarget = Math.max(-1.5, Math.min(1.5, evx * 0.9)) * swirlAmt;
        swirl += (sTarget - swirl) * (1 - Math.exp(-dt / 0.22));
        if (Math.abs(sTarget - swirl) < 1e-4)
            swirl = sTarget;
        const lean = num(adv.lean, DEFAULT_ADVANCED.lean, 0, 200) / 100;
        eye.x = ex;
        eye.y = ey;
        eye.lean = eye.R * (0.6 * lean + 0.35 * swirl);
        eye.lag = -0.16 * swirl;
        eye.tilt = 0.45 * lean + 0.25 * swirl;
        // Parallax: the near strands slide against the sheet as the eyelet moves off centre.
        const par = num(adv.parallax, DEFAULT_ADVANCED.parallax, 0, 100) / 100;
        parX = -0.12 * par * ex;
        parY = -0.05 * par * ey;
        springBusy = ex !== tgtX || ey !== tgtY || evx !== 0 || evy !== 0 || Math.abs(swirl) > 1e-4;
    };
    let ptrWX = 0;
    let ptrWY = 0;
    const tick = (now) => {
        var _a;
        raf = 0;
        if (!running)
            return;
        const gap = lastTick < 0 ? 0 : now - lastTick;
        const dt = Math.min(0.1, gap / 1000);
        lastTick = now;
        if (gap > 0 && gap < 100) {
            gaps[gapN % gaps.length] = gap;
            gapN++;
            const n = Math.min(gapN, gaps.length);
            for (let i = 0; i < n; i++)
                gapSort[i] = gaps[i];
            const view = gapSort.subarray(0, n).sort();
            cadence = view[n >> 1];
        }
        const p = propsRef.current;
        const adv = { ...DEFAULT_ADVANCED, ...p.advanced };
        const spd = num(p.speed, DEFAULTS.speed, 0, 100) / 50;
        if (!reduced) {
            clock = (clock + dt * spd) % 36000;
            flowPos = (flowPos + dt * spd * FLOW_RATE * (num(adv.flowSpeed, DEFAULT_ADVANCED.flowSpeed, 0, 200) / 100)) % 3600;
        }
        // Pointer: one rect read per frame, only when it moved, scrolled or clicked.
        if (ptrMoved || clickPending) {
            ptrMoved = false;
            const r = root.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) {
                ptrU = (ptrClientX - r.left) / r.width;
                ptrV = (ptrClientY - r.top) / r.height;
                if (W > 0) {
                    const s = Math.min(2, Math.max(1, r.width / W));
                    if (Math.abs(s - shown) / shown > 0.05) {
                        shown = s;
                        resizePending = true;
                    }
                }
                if (clickPending) {
                    clickPending = false;
                    const shockK = num((_a = p.response) === null || _a === void 0 ? void 0 : _a.shockwave, DEFAULT_RESPONSE.shockwave, 0, 10) / 5;
                    if (shockK > 0 && !reduced) {
                        updateMap(p);
                        const [wx, wy] = frameToWorld(map, ((clickClientX - r.left) / r.width) * W, ((clickClientY - r.top) / r.height) * H);
                        if (waves.length >= WAVES)
                            waves.shift();
                        waves.push({ x: wx, y: wy, x0: restX(eye, wx, wy), age: 0, amp: Math.min(2, shockK), id: waveId++ });
                    }
                }
            }
        }
        updateMap(p);
        [ptrWX, ptrWY] = frameToWorld(map, ptrU * W, ptrV * H);
        stepEye(p, adv, dt, now);
        for (const w of waves)
            w.age += dt;
        while (waves.length && waves[0].age > WAVE_LIFE)
            waves.shift();
        if (!sameProps(p, lastProps)) {
            lastProps = p;
            dirty = true;
        }
        const rate = wantRate(p);
        // Lock to whole vsyncs: draw every `divisor` ticks of the display's cadence.
        if (rate > 0) {
            const x = 1000 / rate / Math.max(cadence, 1) + 0.1;
            if (x < divisor - 0.1 || x >= divisor + 1.1)
                divisor = Math.max(1, Math.floor(x));
        }
        let doDraw = dirty;
        if (!doDraw && rate > 0 && (lastDraw < 0 || now - lastDraw >= (divisor - 0.5) * cadence))
            doDraw = true;
        if (doDraw) {
            const drawGap = lastDraw < 0 ? 0 : now - lastDraw;
            lastDraw = now;
            pollQueries();
            adaptQuality(now, rate > 0 ? divisor * cadence : 0, drawGap);
            draw();
            dirty = false;
            warm++;
        }
        if (drawn - measuredAt >= 30) {
            measuredAt = drawn;
            if (measureShown())
                resizePending = true;
        }
        if (rate > 0 || dirty)
            raf = requestAnimationFrame(tick);
        else {
            running = false;
            lastTick = -1; // a still scene does not bank time
        }
    };
    /** Step resolution down when drawn frames run late and the GPU is the cause; win it back later. */
    const adaptQuality = (now, period, gapMs) => {
        if (period <= 0 || warm < 30 || gapMs <= 0)
            return;
        const late = gapMs / Math.min(period, 33.4);
        lateEma = lateEma * 0.9 + late * 0.1;
        const gpuShare = timerExt ? gpuEma / period : late;
        const dt = gapMs / 1000;
        if (lateEma > 1.3 && gpuShare > 0.6) {
            slowFor += dt;
            goodFor = 0;
        }
        else {
            slowFor = 0;
            goodFor += dt;
        }
        if (slowFor > 0.5 && quality < QUALITY_LEVELS.length - 1) {
            quality++;
            slowFor = goodFor = 0;
            banUntil = now + 4000;
            gpuEma = 0;
            resizePending = true;
        }
        else if (goodFor > 4 && quality > 0 && now > banUntil && (!timerExt || gpuEma < period * 0.45)) {
            quality--;
            goodFor = 0;
            gpuEma = 0;
            banUntil = now + 8000;
            resizePending = true;
        }
    };
    // Pointer input only starts the loop: frames stay paced while it runs, or a
    // 1000 Hz mouse would draw on every vsync.
    const kick = () => {
        if (!running)
            wake();
    };
    const wake = () => {
        dirty = true;
        if (running || !visible || lost || !gl)
            return;
        running = true;
        lastTick = -1;
        lastDraw = -1;
        raf = requestAnimationFrame(tick);
    };
    // ── Observers ──
    const ro = new ResizeObserver((entries) => {
        const cr = entries[entries.length - 1].contentRect;
        W = cr.width;
        H = cr.height;
        measureShown();
        resizePending = true;
        // Resize and repaint together, before the browser shows a wiped buffer.
        draw();
        wake();
    });
    ro.observe(root);
    const io = typeof IntersectionObserver === "function"
        ? new IntersectionObserver((entries) => {
            visible = entries[entries.length - 1].isIntersecting && document.visibilityState !== "hidden";
            if (visible)
                wake();
        })
        : null;
    io === null || io === void 0 ? void 0 : io.observe(root);
    const onVis = () => {
        visible = document.visibilityState !== "hidden";
        if (visible)
            wake();
    };
    document.addEventListener("visibilitychange", onVis);
    const onLost = (e) => {
        e.preventDefault();
        lost = true;
        // Leave the Background showing while the GPU is away.
        painted = false;
        setGpu(false);
        running = false;
        if (raf)
            cancelAnimationFrame(raf);
        raf = 0;
    };
    const onRestored = () => {
        lost = false;
        if (initGL()) {
            bufW = bufH = 0;
            resizePending = true;
            wake();
        }
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    if (initGL()) {
        const r = root.getBoundingClientRect();
        W = root.clientWidth || r.width;
        H = root.clientHeight || r.height;
        measureShown();
        resizePending = true;
        snapEye = true;
        wake();
    }
    return {
        set(p) { propsRef.current = { ...propsRef.current, ...p }; wake(); },
    };
}
;
window.mountBrocade = mountBrocade;

})();
