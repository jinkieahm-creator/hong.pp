/* home.js — 메인 페이지: 오프닝(타이핑 → 3D 솟아오름 → 표지 펼침), 렌더링, 인터랙션
   내용(텍스트·링크)은 data.js, 색은 css/style.css 맨 위 :root 에서 바꿉니다. */
(() => {
  'use strict';
  const { $, $$, root, hasG, fine, fit, img, data: D } = window.CIM;
  const small = matchMedia('(max-width:900px)').matches;
  const pad = n => String(n).padStart(2, '0');

  /* ---------------- PAGE ONE: 드래그 가능한 유리 오브 + 흩어지는 파티클 ----------------
     Canvas 2D로 가벼운 입체감과 유리 재질을 직접 그립니다.
     포인터를 공에 놓고 드래그하거나 주변의 유리 조각을 밀어낼 수 있습니다. */
  (() => {
    const canvas = $('#heroPlay');
    const hero = $('#home');
    if (!canvas || !hero) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = {
      w: 0, h: 0, dpr: 1, pointer: { x: -9999, y: -9999, down: false },
      orb: { x: 0, y: 0, vx: 0, vy: 0, r: 58, drag: false, ox: 0, oy: 0 },
      bits: [], raf: 0
    };
    const rand = (a, b) => a + Math.random() * (b - a);

    function resize() {
      const rect = hero.getBoundingClientRect();
      state.w = rect.width; state.h = rect.height;
      state.dpr = Math.min(devicePixelRatio || 1, 1.6);
      canvas.width = Math.round(state.w * state.dpr);
      canvas.height = Math.round(state.h * state.dpr);
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      state.orb.r = Math.max(34, Math.min(66, state.w * .045));
      state.orb.x = state.w * .77;
      state.orb.y = state.h * .46;
      state.bits = Array.from({ length: state.w < 700 ? 13 : 25 }, (_, i) => {
        const a = rand(0, Math.PI * 2), d = rand(state.orb.r * 1.5, Math.min(state.w, state.h) * .34);
        const x = state.orb.x + Math.cos(a) * d;
        const y = state.orb.y + Math.sin(a) * d * .75;
        return { x, y, bx: x, by: y, vx: 0, vy: 0, size: rand(5, 15), rot: rand(0, Math.PI), spin: rand(-.008, .008), sides: Math.random() > .5 ? 4 : 5 };
      });
    }

    function drawOrb(o) {
      const r = o.r;
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.globalCompositeOperation = 'screen';
      const g = ctx.createRadialGradient(-r * .38, -r * .48, r * .04, r * .15, r * .15, r * 1.12);
      g.addColorStop(0, 'rgba(255,255,255,.88)');
      g.addColorStop(.16, 'rgba(235,239,246,.34)');
      g.addColorStop(.48, 'rgba(174,190,208,.10)');
      g.addColorStop(.78, 'rgba(255,255,255,.18)');
      g.addColorStop(1, 'rgba(255,255,255,.025)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255,255,255,.62)'; ctx.lineWidth = 1.15;
      ctx.beginPath(); ctx.arc(0, 0, r - .7, -.9, 1.35); ctx.stroke();
      ctx.strokeStyle = 'rgba(91,100,119,.22)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, r - 3, 1.7, 4.6); ctx.stroke();
      const shine = ctx.createRadialGradient(-r * .38, -r * .48, 0, -r * .38, -r * .48, r * .48);
      shine.addColorStop(0, 'rgba(255,255,255,.78)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine; ctx.beginPath(); ctx.arc(-r * .38, -r * .48, r * .48, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.beginPath(); ctx.ellipse(r * .38, r * .48, r * .11, r * .045, -.7, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function drawShard(p) {
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      const s = p.size;
      ctx.beginPath();
      for (let i = 0; i < p.sides; i++) {
        const a = (Math.PI * 2 * i / p.sides) - Math.PI / 2;
        const rr = s * (i % 2 ? .72 : 1.25);
        const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
        if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      const grad = ctx.createLinearGradient(-s, -s, s, s);
      grad.addColorStop(0, 'rgba(255,255,255,.48)');
      grad.addColorStop(.5, 'rgba(205,218,231,.12)');
      grad.addColorStop(1, 'rgba(255,255,255,.025)');
      ctx.fillStyle = grad; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = .8; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * .45, -s * .2); ctx.lineTo(s * .38, s * .45);
      ctx.strokeStyle = 'rgba(255,255,255,.34)'; ctx.stroke();
      ctx.restore();
    }

    function frame() {
      ctx.clearRect(0, 0, state.w, state.h);
      const o = state.orb, m = state.pointer;
      if (o.drag) {
        o.x += (m.x - o.x) * .24; o.y += (m.y - o.y) * .24;
        o.vx = (m.x - o.x) * .08; o.vy = (m.y - o.y) * .08;
      } else if (!reduced) {
        o.x += o.vx; o.y += o.vy;
        o.vx += (state.w * .77 - o.x) * .0018; o.vy += (state.h * .46 - o.y) * .0018;
        o.vx *= .94; o.vy *= .94;
      }

      state.bits.forEach(p => {
        const dx = p.x - m.x, dy = p.y - m.y, dist = Math.hypot(dx, dy);
        if (dist < 115 && dist > .01) {
          const force = (115 - dist) / 115 * .95;
          p.vx += dx / dist * force; p.vy += dy / dist * force;
        }
        const ox = p.x - o.x, oy = p.y - o.y, od = Math.hypot(ox, oy);
        if (od < o.r + p.size + 13 && od > .01) {
          p.vx += ox / od * .45; p.vy += oy / od * .45;
        }
        p.vx += (p.bx - p.x) * .012; p.vy += (p.by - p.y) * .012;
        p.vx *= .91; p.vy *= .91; p.x += p.vx; p.y += p.vy;
        if (!reduced) p.rot += p.spin;
        drawShard(p);
      });
      drawOrb(o);
      state.raf = requestAnimationFrame(frame);
    }

    function localPoint(e) {
      const r = hero.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    hero.addEventListener('pointermove', e => {
      const p = localPoint(e); state.pointer.x = p.x; state.pointer.y = p.y;
      if (state.orb.drag) { state.orb.x = p.x; state.orb.y = p.y; }
    });
    hero.addEventListener('pointerleave', () => {
      if (!state.orb.drag) { state.pointer.x = -9999; state.pointer.y = -9999; }
    });
    hero.addEventListener('pointerdown', e => {
      if (e.target.closest('a,button')) return;
      const p = localPoint(e), o = state.orb;
      if (Math.hypot(p.x - o.x, p.y - o.y) <= o.r + 15) {
        o.drag = true; state.pointer.down = true;
        state.pointer.x = p.x; state.pointer.y = p.y;
        hero.classList.add('is-orb-dragging');
      }
    });
    addEventListener('pointerup', () => {
      state.orb.drag = false; state.pointer.down = false;
      hero.classList.remove('is-orb-dragging');
    });
    if (window.ResizeObserver) new ResizeObserver(() => { resize(); }).observe(hero);
    else addEventListener('resize', resize);
    resize(); frame();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && state.raf) cancelAnimationFrame(state.raf);
      else if (!document.hidden && !reduced) frame();
    });
  })();


  /* ---------------- 점토 글자: 글자 단위로 쪼개기 ---------------- */
  $$('[data-clay]').forEach(el => {
    const raw = el.dataset.clay;
    el.setAttribute('aria-label', raw.replace(/\|/g, ' '));
    el.innerHTML = raw.split('|').map(line => line.split(' ').map(w =>
      `<span class="wd">${[...w].map(ch => `<span class="c" aria-hidden="true">${ch}</span>`).join('')}</span>`).join(' ')).join('<br>');
  });

  /* ---------------- Selected Works ---------------- */
  const spec = w => `<dl class="spec"><div><dt>유형</dt><dd>${w.type}</dd></div><div><dt>기간</dt><dd>${w.period}</dd></div><div><dt>작업 범위</dt><dd>${w.scope}</dd></div><div><dt>사용 기술</dt><dd>${w.stack.join(' · ')}</dd></div></dl>`;
  $('#workList').innerHTML = D.works.map(w => `
    <article class="pw" style="--pc:${w.color};--pi:${w.ink}"><div class="wrap g12">
      <a class="shot" href="project.html?p=${w.id}" data-go data-color="${w.color}" data-cur="View" aria-label="${w.name} 프로젝트 보기"><span class="ph"><b>${w.name.replace(' ', '<br>')}</b></span>${img(w, w.name + ' 대표 이미지', true)}</a>
      <div class="info">
        <p class="num">작품 ${w.no} / ${pad(D.works.length)}</p>
        <h3 class="wname">${w.name}</h3>
        <p class="wsub">${w.sub}</p>
        ${spec(w)}
        <p class="wdesc">${w.desc}</p>
        <div class="btns"><a class="btn btn--solid" href="project.html?p=${w.id}" data-go data-color="${w.color}" data-cur="Open">프로젝트 보기 <i>↗</i></a><a class="btn" href="${w.url}" target="_blank" rel="noopener">Live site <i>↗</i></a></div>
      </div></div></article>`).join('');

  /* ---------------- Rebuild Studies (9개 모두 펼쳐서 보이게) ---------------- */
  $('#studyList').innerHTML = D.studies.map((s, i) => `
    <li class="srow" id="s-${s.id}">
      <button class="srow__btn" type="button" aria-expanded="false" aria-controls="p-${s.id}" data-cur="Open">
        <span class="i">${pad(i + 1)}</span>
        <span class="n">${s.name}<small>${s.type}</small></span>
        <span class="t">${s.layout}</span>
        <span class="t it">${s.feats.join(' · ')}</span>
        <span class="t tl">${D.studyTools.join(' · ')}</span>
        <span class="p" aria-hidden="true">+</span>
      </button>
      <a class="srow__live" href="${s.url}" target="_blank" rel="noopener" aria-label="${s.name} 재현 사이트 새 창에서 보기">LIVE ↗</a>
      <div class="spanel" id="p-${s.id}" role="region" aria-label="${s.name} 상세" hidden><div class="spanel__in" data-i="${i}"></div></div>
    </li>`).join('');

  function fillPanel(box) {
    if (box.dataset.ready) return; box.dataset.ready = 1;
    const s = D.studies[+box.dataset.i];
    box.innerHTML = `
      <div class="cmp">
        <figure class="rb"><figcaption><b>Rebuilt Website</b><span>Live</span></figcaption><div class="vp"><iframe data-w="1280" src="${s.url}" title="${s.name} 재현 사이트 미리보기" loading="lazy" tabindex="-1" aria-hidden="true"></iframe></div></figure>
      </div>
      <dl class="sinfo">
        <div><dt>Original</dt><dd>${s.orig}${s.origUrl ? ` · <a href="${s.origUrl}" target="_blank" rel="noopener">방문 ↗</a>` : ''}</dd></div>
        <div><dt>Rebuilt</dt><dd><a href="${s.url}" target="_blank" rel="noopener">Live site ↗</a><br><small>개인 학습 · 재현 작업</small></dd></div>
        <div><dt>Layout</dt><dd>${s.layout}</dd></div>
        ${s.responsive ? `<div><dt>Responsive</dt><dd>${s.responsive}</dd></div>` : ''}
        <div><dt>Interaction</dt><dd>${s.feats.join(', ')}</dd></div>
        <div><dt>Tools</dt><dd>${D.studyTools.join(', ')}</dd></div>
      </dl>
      <a class="btn" href="${s.url}" target="_blank" rel="noopener">재현 사이트 보기 <i>↗</i></a>`;
    fit(box);
  }
  function toggle(row, open) {
    const btn = $('.srow__btn', row), panel = $('.spanel', row);
    row.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', open);
    if (open) { panel.hidden = false; fillPanel($('.spanel__in', panel)); fit(panel); }
    if (!hasG) { panel.hidden = !open; panel.style.height = open ? 'auto' : ''; return; }
    if (open) gsap.fromTo(panel, { height: 0 }, { height: 'auto', duration: .8, ease: 'power3.inOut', onComplete: () => { fit(panel); ScrollTrigger.refresh(); } });
    else gsap.to(panel, { height: 0, duration: .6, ease: 'power3.inOut', onComplete: () => { panel.hidden = true; ScrollTrigger.refresh(); } });
  }
  $('#studyList').addEventListener('click', e => {
    const btn = e.target.closest('.srow__btn'); if (!btn) return;
    const row = btn.parentNode, open = !row.classList.contains('is-open');
    $$('.srow.is-open').forEach(r => { if (r !== row) toggle(r, false); });
    toggle(row, open);
  });

  /* ---------------- Process ---------------- */
  const GLYPH = [
    '<circle class="st" cx="50" cy="50" r="30"/><line class="st" x1="72" y1="72" x2="96" y2="96"/><circle class="fl" cx="50" cy="50" r="11"/>',
    '<rect class="fl" x="50" y="14" width="36" height="36"/><rect class="st" x="14" y="14" width="72" height="72"/><line class="st" x1="50" y1="14" x2="50" y2="86"/><line class="st" x1="14" y1="50" x2="86" y2="50"/>',
    '<polyline class="st" points="36,28 14,50 36,72"/><polyline class="st" points="64,28 86,50 64,72"/><line class="st" x1="56" y1="22" x2="44" y2="78"/><circle class="fl" cx="92" cy="12" r="8"/>',
    '<path class="st" d="M24 14 L24 82 L42 66 L54 94 L66 88 L54 62 L78 60 Z"/><circle class="fl" cx="84" cy="24" r="12"/>',
    '<circle class="st" cx="50" cy="50" r="36"/><polyline class="st" points="31,52 45,66 71,34"/><circle class="fl" cx="92" cy="50" r="8"/>'
  ];
  $('#steps').innerHTML = D.process.map((p, i) => `
    <li class="step"><p class="step__no" aria-hidden="true">0${i + 1}</p>
      <div class="step__t"><span class="meta">Step 0${i + 1}</span><h3>${p[0]}</h3><p><b>${p[1]}</b><br>${p[2]}</p></div>
      <div class="step__g" aria-hidden="true"><svg viewBox="0 0 100 100">${GLYPH[i]}</svg></div></li>`).join('');

  /* ---------------- About: 펠리체골드 디자인 작업 (클릭하면 열림) ---------------- */
  const fb = $('#feliceBtn'), fx = $('#feliceBox');
  fb && fx && fb.addEventListener('click', () => {
    const o = fb.getAttribute('aria-expanded') !== 'true';
    fb.setAttribute('aria-expanded', o); fx.hidden = !o;
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });

  fit();
  addEventListener('load', () => fit());
  if (!hasG) return;

  /* ---------------- 점토 글자 공통 동작 ---------------- */
  const DEPTH = .09;
  const rise = (chars, o = {}) => gsap.to(chars, Object.assign({ '--d': DEPTH, y: 0, opacity: 1, duration: 1.5, stagger: .06, ease: 'elastic.out(1,.62)' }, o));

  // 큰 제목: 화면에 들어오면 글자가 하나씩 솟아오름
  $$('.ttl, .contact__big').forEach(h => {
    const cs = $$('.c', h);
    gsap.set(cs, { '--d': 0, y: 28, opacity: 0 });
    ScrollTrigger.create({ trigger: h, start: 'top 86%', once: true, onEnter: () => rise(cs, { stagger: .04, duration: 1.4 }) });
  });

  // 마우스에 따라 그림자 방향이 바뀌는 글자(오프닝 이름, 첫 장 제목)
  const light = (el, area) => {
    if (!fine) return;
    area.addEventListener('pointermove', e => {
      const r = area.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
      el.style.setProperty('--sx', Math.max(-1, Math.min(1, -nx * 2.2)).toFixed(3));
      el.style.setProperty('--sy', Math.max(.15, Math.min(1.1, .6 - ny * 1.6)).toFixed(3));
      gsap.to(el, { rotationY: nx * 10, rotationX: -ny * 8, duration: .8, ease: 'power3.out', overwrite: 'auto' });
    });
    area.addEventListener('pointerleave', () => gsap.to(el, { rotationY: 0, rotationX: 0, duration: 1, ease: 'power3.out' }));
  };
  light($('.hero__title'), $('#home'));

  /* ---------------- 오프닝 ---------------- */
  const intro = $('#intro'), heroChars = $$('.hero__title .c'), heroRest = $$('.hero__slogan, .hero__top, .hero__foot');
  gsap.set(heroChars, { '--d': 0, y: 40, opacity: 0 });
  gsap.set(heroRest, { opacity: 0, y: 16 });
  let opened = false;

  function enterHero(delay = 0) {
    root.style.overflow = ''; document.body.classList.add('is-open');
    rise(heroChars, { delay, stagger: .07, duration: 1.7 });
    gsap.to(heroRest, { opacity: 1, y: 0, duration: .9, stagger: .1, delay: delay + .5, ease: 'power3.out' });
    ScrollTrigger.refresh();
  }

  const cameBack = location.hash || /project\.html/.test(document.referrer);
  if (cameBack || new URLSearchParams(location.search).has('skip')) {
    intro.classList.add('is-gone'); opened = true;
    enterHero(.5);
  } else {
    root.style.overflow = 'hidden';
    const name = $('.cover__name', intro), nameChars = $$('.c', name), tx = $('.tx', intro), caret = $('.caret', intro);
    const sub = $('.cover__sub', intro), btn = $('#open'), glow = $('.glow', intro);
    gsap.set(nameChars, { '--d': 0, opacity: 0, y: 10, scale: .86 });
    gsap.set([sub, btn], { opacity: 0, y: 14 });
    light(name, intro);

    const LINES = ['안녕하세요', '고객의 선택을 세심하게 관찰해', '시선을 설계하는 홍어진입니다.'];
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    let skipped = false;

    (async () => {
      await sleep(900);                                   // 빈 화면
      for (let li = 0; li < LINES.length && !skipped; li++) {
        const line = document.createElement('span'); line.style.display = 'block'; tx.append(line);
        for (const ch of LINES[li]) { if (skipped) return; line.textContent += ch; await sleep(ch === ' ' ? 40 : 62 + Math.random() * 40); }
        if (li < LINES.length - 1) await sleep(420);
      }
      if (skipped) return;
      await sleep(520);
      caret.style.display = 'none';
      for (const c of nameChars) {                        // 핵심 문장이 한 글자씩 타이핑
        if (skipped) return;
        gsap.to(c, { opacity: 1, y: 0, scale: 1, duration: .3, ease: 'back.out(3)' });
        await sleep(260);
      }
      await sleep(260);
      if (skipped) return;
      gsap.to(glow, { opacity: 1, duration: 2.2, ease: 'power2.out' });
      rise(nameChars, { '--d': .105, stagger: .16, duration: 1.8 });   // 3D로 솟아오름
      gsap.to([sub, btn], { opacity: 1, y: 0, duration: .9, stagger: .15, delay: 1.2, ease: 'power3.out'});
    })();

    // 표지를 양쪽으로 펼치기
    const openBook = instant => {
      if (opened) return; opened = true; skipped = true;
      if (instant) { intro.classList.add('is-gone'); enterHero(.1); return; }
      const mk = side => {
        const d = document.createElement('div'); d.className = 'door door--' + side;
        const inn = document.createElement('div'); inn.className = 'door__in';
        const clone = $('.cover', intro).cloneNode(true);
        clone.setAttribute('aria-hidden', 'true'); $$('button,[id]', clone).forEach(n => { n.removeAttribute('id'); n.tabIndex = -1; });
        const g = glow.cloneNode(true); g.style.opacity = glow.style.opacity || 1;
        inn.append(g, clone); d.append(inn, Object.assign(document.createElement('div'), { className: 'door__shade' }));
        return d;
      };
      const doors = document.createElement('div'); doors.className = 'doors'; doors.setAttribute('aria-hidden', 'true');
      const L = mk('l'), R = mk('r'); doors.append(L, R); document.body.append(doors);
      intro.classList.add('is-gone');
      const tl = gsap.timeline({ onComplete: () => doors.remove() });
      tl.to(L, { rotationY: 112, duration: 1.7, ease: 'power3.inOut' }, 0)
        .to(R, { rotationY: -112, duration: 1.7, ease: 'power3.inOut' }, 0)
        .to($$('.door__shade', doors), { opacity: 1, duration: 1.7, ease: 'power2.in' }, 0)
        .add(() => enterHero(0), .55);
    };
    btn.addEventListener('click', () => openBook(false));
    $('#skipIntro').addEventListener('click', () => openBook(true));
    addEventListener('keydown', e => { if (e.key === 'Enter' && !opened && btn.style.opacity > 0.9) openBook(false); });
  }

  /* ---------------- 스크롤 인터랙션 ---------------- */
  // 헤더 색·책갈피 현재 위치
  const hd = $('.hd'), tabs = $$('.tabs a');
  $$('.pg[data-theme]').forEach(sec => ScrollTrigger.create({
    trigger: sec, start: 'top 60px', end: 'bottom 60px',
    onToggle: s => { if (!s.isActive) return; hd.dataset.t = sec.dataset.theme; root.style.setProperty('--hdbg', sec.dataset.theme === 'night' ? '#1C1729' : '#ECE9F3');
      tabs.forEach(a => a.classList.toggle('is-cur', a.getAttribute('href') === '#' + sec.id)); }
  }));

  // About: 문장이 스크롤에 따라 또렷해짐
  const lead = $('.about__lead');
  lead.innerHTML = lead.textContent.trim().split(/\s+/).map(w => `<span>${w}</span>`).join(' ');
  gsap.fromTo($$('.about__lead span'), { opacity: .18 }, { opacity: 1, stagger: .5, ease: 'none', scrollTrigger: { trigger: lead, start: 'top 82%', end: 'bottom 52%', scrub: true } });
  gsap.from('.about__me, .about__philo li, .about__sheet dl, .skill', { opacity: 0, y: 28, duration: .9, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: '.about__me', start: 'top 82%' } });

  // Works: 페이지를 넘기듯 작품이 펼쳐짐
  $$('.pw').forEach(w => {
    const sh = $('.shot', w), left = w.matches(':nth-of-type(even)') && !small;
    gsap.from(sh, { rotationY: left ? 16 : -16, transformPerspective: 1400, transformOrigin: left ? '100% 50%' : '0 50%', opacity: 0, duration: 1.3, ease: 'power3.out', scrollTrigger: { trigger: sh, start: 'top 82%' } });
    gsap.from($$('.info > *', w), { opacity: 0, y: 26, duration: .9, stagger: .07, ease: 'power3.out', scrollTrigger: { trigger: w, start: 'top 62%' } });
  });
  gsap.from('.srow', { opacity: 0, y: 24, duration: .7, stagger: .05, ease: 'power3.out', scrollTrigger: { trigger: '.tbl', start: 'top 88%' } });

  // Process: 도형이 그려지며 등장
  $$('.step').forEach(s => {
    const paths = $$('.st', s);
    paths.forEach(p => { const Ln = p.getTotalLength ? Math.ceil(p.getTotalLength()) : 200; p.style.strokeDasharray = Ln; p.style.strokeDashoffset = Ln; });
    gsap.timeline({ scrollTrigger: { trigger: s, start: 'top 80%' } })
      .from(s.querySelector('.step__t'), { opacity: 0, y: 30, duration: .8, ease: 'power3.out' })
      .to(paths, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', stagger: .1 }, 0)
      .from($$('.fl', s), { scale: 0, transformOrigin: '50% 50%', duration: .8, ease: 'back.out(2)' }, .5);
  });
  gsap.from('.contact__list li', { opacity: 0, y: 24, duration: .8, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: '.contact__list', start: 'top 88%' } });
  addEventListener('load', () => ScrollTrigger.refresh());
})();
