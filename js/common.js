/* common.js — 공통: 페이지 전환 커튼, 커서, 메뉴, 최상단 버튼, 유틸 */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const hasG = !!(window.gsap && window.ScrollTrigger) && !reduce;
  const curtain = $('.curtain');
  const store = { get: k => { try { return sessionStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch {} } };

  if (!hasG) root.classList.remove('js');
  if (hasG) gsap.registerPlugin(ScrollTrigger);

  /* iframe 미리보기를 컨테이너 폭에 맞춰 축소 (data-w: 원래 가로폭) */
  const fit = (scope = document) => $$('iframe[data-w]', scope).forEach(f => {
    const w = +f.dataset.w, box = f.parentNode, s = box.clientWidth / w;
    f.style.width = w + 'px'; f.style.height = (box.clientHeight / s) + 'px'; f.style.setProperty('--s', s.toFixed(4));
  });
  addEventListener('resize', () => fit());

  /* 커튼 전환 */
  const wipeIn = (color, then) => {
    if (color) curtain.style.background = color;
    gsap.timeline().set(curtain, { transformOrigin: '50% 100%' })
      .fromTo(curtain, { scaleY: 0 }, { scaleY: 1, duration: .55, ease: 'power3.inOut' }).add(then);
  };
  const wipeOut = () => gsap.timeline().set(curtain, { transformOrigin: '50% 0' })
    .to(curtain, { scaleY: 0, duration: .65, ease: 'power3.inOut' });

  const go = (href, color) => {
    if (!hasG) { location.href = href; return; }
    store.set('cimC', color || '#1C1729');
    wipeIn(color || '#1C1729', () => { location.href = href; });
  };

  const CIM = { $, $$, root, reduce, fine, hasG, fit, go, wipeIn, wipeOut, data: window.CIM_DATA };
  window.CIM = CIM;

  /* 이미지: 로컬(images/) 우선 → 실패하면 원격 → 그래도 실패하면 제거(플레이스홀더 노출) */
  CIM.img = (w, alt, lazy) => `<img src="${w.local || w.img}" alt="${alt}"${lazy ? ' loading="lazy"' : ''} data-remote="${w.local ? w.img : ''}" onerror="CIM.imgFail(this)">`;
  CIM.imgFail = el => { const r = el.dataset.remote; if (r) { el.dataset.remote = ''; el.src = r; } else el.remove(); };

  /* 스크롤하면 헤더에 반투명 배경 */
  const hdEl = $('.hd');
  if (hdEl) { const u = () => hdEl.classList.toggle('is-solid', scrollY > 60); addEventListener('scroll', u, { passive: true }); u(); }

  /* 첫 진입/페이지 도착 시 커튼 열기 */
  CIM.revealTl = gsap.timeline && hasG ? gsap.timeline({ delay: .1 }) : null;
  if (hasG && curtain) {
    const c = store.get('cimC'); if (c) curtain.style.background = c;
    CIM.revealTl.set(curtain, { transformOrigin: '50% 0' }).to(curtain, { scaleY: 0, duration: .9, ease: 'power3.inOut' });
  }
  addEventListener('pageshow', e => { if (e.persisted && hasG) gsap.set(curtain, { scaleY: 0 }); });

  /* 링크: data-go(페이지 이동) / 페이지 내 앵커 */
  document.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || a.target === '_blank') return;
    const href = a.getAttribute('href') || '';
    if (a.hasAttribute('data-go')) { e.preventDefault(); go(a.href, a.dataset.color); return; }
    if (href.startsWith('#')) {
      const t = href.length > 1 ? $(href) : null;
      if (!t && href !== '#home') return;
      e.preventDefault();
      setMenu(false);
      (t || document.body).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  });

  /* 모바일 메뉴 */
  const menu = $('.hd__menu'), mnav = $('#mnav');
  function setMenu(o) {
    if (!menu) return;
    menu.setAttribute('aria-expanded', o); menu.setAttribute('aria-label', o ? '메뉴 닫기' : '메뉴 열기');
    mnav.hidden = !o; root.style.overflow = o ? 'hidden' : ''; document.body.classList.toggle('menu-open', o);
  }
  menu && menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  addEventListener('resize', () => { if (innerWidth > 900 && mnav && !mnav.hidden) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* 최상단 이동 버튼 */
  const top = $('#totop');
  if (top) {
    const upd = () => top.classList.toggle('on', scrollY > innerHeight * .8);
    addEventListener('scroll', upd, { passive: true }); upd();
    top.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
  }

  /* 커서 라벨 */
  if (fine && hasG) {
    const c = $('.cursor'), lb = $('span', c);
    const mx = gsap.quickTo(c, 'x', { duration: .4, ease: 'power3' }), my = gsap.quickTo(c, 'y', { duration: .4, ease: 'power3' });
    addEventListener('mousemove', e => { mx(e.clientX); my(e.clientY); }, { passive: true });
    document.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-cur]');
      if (t) { lb.textContent = t.dataset.cur; c.classList.toggle('is-view', t.dataset.cur === 'View'); c.classList.add('is-on'); } else c.classList.remove('is-on');
    });
    document.addEventListener('mouseleave', () => c.classList.remove('is-on'));
  }

  /* 복사 버튼 */
  const copy = $('#copy');
  copy && copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('#mail').textContent.trim()); copy.textContent = 'COPIED'; } catch { copy.textContent = 'CTRL+C'; }
    setTimeout(() => copy.textContent = 'COPY', 1600);
  });

  /* 헤드라인 줄 마스크 등장 (data-lines) */
  CIM.revealLines = scope => $$('[data-lines]', scope).forEach(h => {
    const spans = $$('.ln>span', h);
    gsap.set(spans, { y: 0, yPercent: 112 });
    gsap.to(spans, { yPercent: 0, duration: 1.1, stagger: .1, ease: 'power4.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
  });
  CIM.fadeIn = scope => $$('[data-fade]', scope).forEach(el => {
    gsap.set(el, { y: 24 });
    gsap.to(el, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
})();
