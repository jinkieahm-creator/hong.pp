/* =========================================================
   MARVEL UNIVERSE — tunnel.js
   보내주신 Originkit「Gallery Tunnel」(React + three.js)을 바닐라 JS로 옮긴 버전.
   터널 구조(세그먼트 재활용, 안개, 누르면 가속, 커서 라벨)는 원본 그대로이고,
   벽에 붙는 이미지를 data.js의 영화 포스터(경로가 없으면 직접 그린 포스터 카드)로 바꿨습니다.
   사용: mountTunnel({ frame, canvas, cursor, labels:{idle, boost} })
   ========================================================= */
function mountTunnel(opts) {
  const { frame, canvas, cursor } = opts;
  const labels = Object.assign({ idle: "HOLD TO WARP", boost: "WARPING…" }, opts.labels);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!frame || !canvas || !window.THREE) { frame && frame.classList.add("no3d"); return null; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" }); }
  catch (e) { frame.classList.add("no3d"); return null; }

  /* ---- 원본 상수 ---- */
  const TUNNEL_WIDTH = 2, TUNNEL_HEIGHT = 1.8, SEGMENT_DEPTH = 1, NUM_SEGMENTS = 15, LINE_RADIUS = 0.003;
  const SCROLL_TO_Z = 0.05, CAMERA_CHASE = 0.1, FADE_IN = 1, FOG_FAR = NUM_SEGMENTS * SEGMENT_DEPTH * 0.95;
  const GRID = 4, BG = "#09090B", LINE = "#B0B0B0", LINE_OPACITY = 0.35;
  const SPEED = reduced ? 0.12 : 1, BOOST = 10;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(new THREE.Color(BG), 0, FOG_FAR - 0.01);
  const camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);
  camera.position.set(0, 0, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const lineMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(LINE), transparent: true, opacity: LINE_OPACITY });

  /* ---- 이미지 슬랩: 영화 포스터 ---- */
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  const fading = [];
  const drawCard = (c, m) => {
    const x = c.getContext("2d"), p = PHASES[m.phase], S = 512;
    const g = x.createLinearGradient(0, 0, S, S);
    g.addColorStop(0, p.a); g.addColorStop(1, p.b);
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    x.globalAlpha = 0.07; x.fillStyle = "#fff";
    for (let k = -S; k < S * 1.5; k += 24) { x.save(); x.translate(k, 0); x.rotate(0.4); x.fillRect(0, -60, 2, S * 1.6); x.restore(); }
    x.globalAlpha = 1;
    x.fillStyle = "rgba(255,255,255,.14)"; x.font = "200px 'Bebas Neue', Oswald, Impact, sans-serif"; x.fillText(m.date.slice(0, 4), 24, 200);
    x.fillStyle = "#E62429"; x.fillRect(32, 250, 44, 4);
    x.fillStyle = "rgba(255,255,255,.8)"; x.font = "500 26px Oswald, sans-serif"; x.fillText(`PHASE ${m.phase}`, 32, 292);
    x.fillStyle = "#fff"; x.font = "64px 'Bebas Neue', Oswald, Impact, sans-serif";
    const words = m.en.toUpperCase().split(" "), lines = []; let line = "";
    words.forEach((w) => { const t = line ? line + " " + w : w; if (x.measureText(t).width > 448 && line) { lines.push(line); line = w; } else line = t; });
    lines.push(line);
    lines.slice(-3).reverse().forEach((l, k) => x.fillText(l, 32, 480 - k * 60));
  };
  const imageMats = MOVIES.map((m) => {
    const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide });
    const useCard = () => {
      const c = document.createElement("canvas"); c.width = c.height = 512;
      drawCard(c, m);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
      mat.map = t; mat.needsUpdate = true; mat.userData.card = { c, m, t };
      fading.push(mat);
    };
    if (m.poster) {
      loader.load(m.poster, (tex) => {
        tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace;
        mat.map = tex; mat.needsUpdate = true; fading.push(mat);
      }, undefined, useCard); // 경로가 깨지면 포스터 카드로
    } else useCard();
    return mat;
  });
  // 웹폰트가 늦게 도착하면 카드 글자를 다시 그림
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => imageMats.forEach((mat) => { const d = mat.userData.card; if (d) { drawCard(d.c, d.m); d.t.needsUpdate = true; } }));

  const palette = ["#E62429", "#17171C", ...Object.values(PHASES).map((p) => p.a), "#E62429"];
  const colorMats = palette.map((hex) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex), side: THREE.DoubleSide }));

  /* ---- 터널 기하 (원본 그대로) ---- */
  const hw = TUNNEL_WIDTH / 2, hh = TUNNEL_HEIGHT / 2, cols = GRID, rows = GRID;
  const colW = TUNNEL_WIDTH / cols, rowH = TUNNEL_HEIGHT / rows;
  const geoFloor = new THREE.PlaneGeometry(colW, SEGMENT_DEPTH), geoWall = new THREE.PlaneGeometry(SEGMENT_DEPTH, rowH);
  const V = THREE.Vector3;
  const tubeGeo = (b) => new THREE.TubeGeometry(new THREE.LineCurve3(new V(0, 0, 0), b), 1, LINE_RADIUS, 8);
  const geoTubeZ = tubeGeo(new V(0, 0, -SEGMENT_DEPTH)), geoTubeX = tubeGeo(new V(TUNNEL_WIDTH, 0, 0)), geoTubeY = tubeGeo(new V(0, TUNNEL_HEIGHT, 0));
  const tube = (geo, x, y) => { const m = new THREE.Mesh(geo, lineMaterial); m.position.set(x, y, 0); return m; };
  const SLOTS = [], z = -SEGMENT_DEPTH / 2;
  for (let i = 0; i < cols; i++) {
    const x = -hw + i * colW + colW / 2;
    SLOTS.push({ geo: geoFloor, pos: [x, -hh, z], rot: [-Math.PI / 2, 0, 0] }, { geo: geoFloor, pos: [x, hh, z], rot: [Math.PI / 2, 0, 0] });
  }
  for (let i = 0; i < rows; i++) {
    const y = -hh + i * rowH + rowH / 2;
    SLOTS.push({ geo: geoWall, pos: [-hw, y, z], rot: [0, Math.PI / 2, 0] }, { geo: geoWall, pos: [hw, y, z], rot: [0, -Math.PI / 2, 0] });
  }
  let populateIndex = 0;
  /* 포스터를 섞은 덱에서 한 장씩 뽑아 모든 영화가 골고루 나오게 함 (다 쓰면 다시 섞기) */
  let deck = [], lastMat = null;
  const nextPoster = () => {
    if (!deck.length) {
      deck = imageMats.slice();
      for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
      if (deck.length > 1 && deck[deck.length - 1] === lastMat) deck.unshift(deck.pop());
    }
    lastMat = deck.pop();
    return lastMat;
  };
  function populate(group) {
    const takesSlabs = populateIndex++ % 2 === 0;
    for (const slab of group.userData.slabs) {
      if (!takesSlabs || Math.random() > 0.5) { slab.visible = false; continue; }
      slab.visible = true;
      slab.material = nextPoster(); // 색 칸 없이 전부 포스터로 채움
    }
  }
  const segments = [];
  for (let n = 0; n < NUM_SEGMENTS; n++) {
    const group = new THREE.Group();
    group.position.z = -n * SEGMENT_DEPTH;
    for (let i = 0; i <= cols; i++) { const x = -hw + i * colW; group.add(tube(geoTubeZ, x, -hh), tube(geoTubeZ, x, hh)); }
    for (let i = 1; i < rows; i++) { const y = -hh + i * rowH; group.add(tube(geoTubeZ, -hw, y), tube(geoTubeZ, hw, y)); }
    group.add(tube(geoTubeX, -hw, -hh), tube(geoTubeX, -hw, hh), tube(geoTubeY, -hw, -hh), tube(geoTubeY, hw, -hh));
    group.userData.slabs = SLOTS.map((s) => { const m = new THREE.Mesh(s.geo, colorMats[0]); m.position.set(...s.pos); m.rotation.set(...s.rot); m.visible = false; group.add(m); return m; });
    populate(group);
    scene.add(group);
    segments.push(group);
  }

  const resize = () => {
    const w = Math.max(1, frame.clientWidth), h = Math.max(1, frame.clientHeight);
    camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
  };
  new ResizeObserver(resize).observe(frame);
  resize();

  /* ---- 루프: 화면 밖에서는 멈춤 ---- */
  let visible = true, scrollPos = 0, last = 0, pressed = false, extra = 0;
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(frame);
  const animate = (now) => {
    requestAnimationFrame(animate);
    if (!visible) { last = 0; return; }
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    scrollPos += pressed ? BOOST : SPEED + extra;
    extra *= 0.93;
    camera.position.z += CAMERA_CHASE * (-SCROLL_TO_Z * scrollPos - camera.position.z);
    const cz = camera.position.z, span = NUM_SEGMENTS * SEGMENT_DEPTH;
    for (const seg of segments) {
      if (seg.position.z > cz + SEGMENT_DEPTH) {
        let min = 0; for (const s of segments) min = Math.min(min, s.position.z);
        seg.position.z = min - SEGMENT_DEPTH; populate(seg);
      } else if (seg.position.z < cz - span - SEGMENT_DEPTH) {
        let max = -1e6; for (const s of segments) max = Math.max(max, s.position.z);
        seg.position.z = max + SEGMENT_DEPTH; populate(seg);
      }
    }
    for (let i = fading.length - 1; i >= 0; i--) { const m = fading[i]; m.opacity = Math.min(1, m.opacity + dt / FADE_IN); if (m.opacity >= 1) fading.splice(i, 1); }
    renderer.render(scene, camera);
  };
  requestAnimationFrame(animate);

  /* ---- 누르면 워프 + 따라다니는 라벨 (링크·버튼 위에서는 꺼짐) ---- */
  const overUi = (e) => e.target.closest("a,button,input,select");
  const setLabel = (on, txt) => { if (!cursor) return; cursor.style.opacity = on ? "1" : "0"; if (txt) cursor.textContent = txt; };
  frame.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    if (overUi(e)) { setLabel(false); frame.classList.remove("warp-cursor"); return; }
    frame.classList.add("warp-cursor");
    const r = frame.getBoundingClientRect();
    if (cursor) { cursor.style.left = `${e.clientX - r.left}px`; cursor.style.top = `${e.clientY - r.top}px`; }
    setLabel(true);
  });
  frame.addEventListener("pointerleave", () => { pressed = false; setLabel(false, labels.idle); frame.classList.remove("warp-cursor", "warping"); });
  frame.addEventListener("pointerdown", (e) => {
    if (overUi(e) || e.pointerType === "touch") return;
    pressed = true; frame.classList.add("warping"); setLabel(true, labels.boost);
  });
  window.addEventListener("pointerup", () => { if (!pressed) return; pressed = false; frame.classList.remove("warping"); if (cursor) cursor.textContent = labels.idle; });
  return { boost: (on) => { pressed = !!on; }, kick: (v) => { if (!reduced) extra = Math.min(BOOST, Math.max(extra, v)); } };
}
