/* project.js — 프로젝트 상세 페이지 (project.html?p=biocord)
   data.js 의 works[].detail 에 값을 넣은 항목만 화면에 나타납니다. */
(() => {
  'use strict';
  const { $, $$, root, hasG, fit, img, data: D } = window.CIM;
  const list = D.works;
  const id = new URLSearchParams(location.search).get('p');
  let i = list.findIndex(w => w.id === id); if (i < 0) i = 0;
  const w = list[i], n = list[(i + 1) % list.length], dt = w.detail || {};
  const pad = k => String(k + 1).padStart(2, '0');
  document.title = `${w.name} — 홍어진 포트폴리오`;
  root.style.setProperty('--pc', w.color);
  root.style.setProperty('--pi', w.ink);
  document.querySelector('meta[name=theme-color]').setAttribute('content', w.color);

  /* 섹션 번호는 실제로 나타나는 순서대로 자동 부여 (01 = 메인 비주얼) */
  let no = 1;
  const sec = (label, body, extra = '') => `<section class="p-sec" ${extra}><div class="wrap"><div class="p-sec__lab" data-fade><b>${String(++no).padStart(2, '0')}</b><span class="meta">${label}</span></div><div class="p-sec__body">${body}</div></div></section>`;
  const has = v => Array.isArray(v) ? v.length > 0 : !!v;
  const bullets = v => Array.isArray(v) ? `<ul class="bul" data-fade>${v.map(t => `<li>${t}</li>`).join('')}</ul>` : `<p class="p-text" data-fade>${v}</p>`;

  $('#app').innerHTML = `
  <header class="p-hero" style="--pc:${w.color};--pi:${w.ink}" id="top">
    <div class="wrap">
      <p class="meta p-hero__top"><span>01 — MAIN VISUAL</span><span>PROJECT ${pad(i)} / ${String(list.length).padStart(2, '0')}</span><span>${w.type}</span></p>
      <h1 aria-label="${w.name}"><span class="ln"><span>${w.name}</span></span></h1>
      <p class="p-hero__sub">${w.sub}</p>
      <div class="p-visual" id="pVisual"><span class="ph"><b>${w.name}</b></span>${img(w, w.name + ' 메인 비주얼')}</div>
    </div>
  </header>

  ${sec('OVERVIEW · 프로젝트 개요', `
    <p class="p-lead" data-fade>${w.desc}</p>
    <dl class="dl" data-fade>
      <div><dt>유형</dt><dd>${w.type}</dd></div><div><dt>작업 기간</dt><dd>${w.period}</dd></div>
      <div><dt>작업 범위</dt><dd>${w.scope}</dd></div><div><dt>사용 기술</dt><dd>${w.stack.join(' · ')}</dd></div>
      <div><dt>링크</dt><dd><a class="btn" href="${w.url}" target="_blank" rel="noopener">VIEW LIVE SITE <i>↗</i></a></dd></div>
    </dl>`, 'id="overview"')}

  ${sec('DESIGN CONCEPT · 디자인 콘셉트', `
    <p class="p-lead" data-fade>${w.problem}</p>
    <p class="p-text" data-fade>${w.approach}</p>
    <ul class="chips chips--c" data-fade style="margin-top:22px">${w.parts.map(p => `<li>${p}</li>`).join('')}</ul>`)}

  ${sec('KEY SCREENS · 주요 화면', `
    <div class="browser" data-fade><div class="browser__bar"><i></i><i></i><i></i><span>${w.name} · Live preview</span></div>
      <div class="browser__view"><iframe data-w="1280" src="${w.url}" title="${w.name} 실제 사이트 미리보기" loading="lazy" tabindex="-1"></iframe></div></div>
    <p class="p-note">배포된 실제 사이트를 그대로 불러온 미리보기입니다. (인터넷 연결 필요)</p>`)}

  ${has(dt.process) ? sec('IMPLEMENTATION · 구현 과정', `<div class="t-block" data-fade><ol>${dt.process.map(p => `<li>${p}</li>`).join('')}</ol></div>`) : ''}

  ${sec('RESPONSIVE · 반응형 화면', `
    ${dt.responsive ? `<p class="p-text" style="margin:0 0 22px" data-fade>${dt.responsive}</p>` : ''}
    <div class="devs" data-fade>
      <figure class="dev dev--m"><div class="dev__view"><iframe data-w="390" src="${w.url}" title="${w.name} 모바일 폭 미리보기" loading="lazy" tabindex="-1"></iframe></div><figcaption>Mobile · 390px</figcaption></figure>
      <figure class="dev dev--t"><div class="dev__view"><iframe data-w="820" src="${w.url}" title="${w.name} 태블릿 폭 미리보기" loading="lazy" tabindex="-1"></iframe></div><figcaption>Tablet · 820px</figcaption></figure>
    </div>
    <p class="p-note">같은 배포 사이트를 모바일·태블릿 가로폭으로 불러온 미리보기입니다.</p>`)}

  ${has(dt.interaction) ? sec('INTERACTION · 인터랙션 구현', bullets(dt.interaction)) : ''}

  ${sec('RESULT · 작업 결과' + (dt.learned ? ' 및 배운 점' : ''), `
    <p class="p-lead" data-fade>${w.result}</p>
    ${dt.learned ? `<p class="p-text" data-fade>${dt.learned}</p>` : ''}`)}

  <a class="p-next" href="project.html?p=${n.id}" data-go data-color="${n.color}" data-cur="Next" style="--nc:${n.color};--ni:${n.ink}" aria-label="다음 프로젝트 ${n.name}">
    <div class="wrap"><p class="meta">NEXT PROJECT · ${pad((i + 1) % list.length)} / ${String(list.length).padStart(2, '0')}</p>
      <div class="p-next__row"><h2>${n.name}</h2><span class="arrow" aria-hidden="true">→</span></div></div>
  </a>
  <footer class="p-foot meta"><span>© 2026 홍어진</span><a href="index.html#works" data-go>ALL WORKS</a><a href="index.html#contact" data-go>CONTACT</a></footer>`;

  fit(document);
  addEventListener('load', () => fit(document));

  const hd = $('.hd'), hero = $('.p-hero'), nextEl = $('.p-next');
  hd.style.color = w.ink;
  root.style.setProperty('--hdbg', w.color);
  /* 히어로 위에서는 프로젝트 컬러, 본문에서는 크림, 다음 프로젝트 위에서는 그 컬러로 헤더를 맞춘다 */
  const paintHd = () => {
    const inHero = scrollY < hero.offsetHeight - 60, atNext = nextEl.getBoundingClientRect().top < 60;
    hd.style.color = inHero ? w.ink : (atNext ? n.ink : '#1C1729');
    root.style.setProperty('--hdbg', inHero ? w.color : (atNext ? n.color : '#ECE9F3'));
  };
  addEventListener('scroll', paintHd, { passive: true }); paintHd();
  if (!hasG) return;

  const name = $('.p-hero h1 .ln>span');
  gsap.set(name, { yPercent: 112 });
  const vis = $('#pVisual');
  gsap.set(vis, { clipPath: 'inset(0 0 100% 0)' });
  CIM.revealTl.to(name, { yPercent: 0, duration: 1.2, ease: 'power4.out' }, '-=.4')
    .from('.p-hero__top, .p-hero__sub', { opacity: 0, y: 16, duration: .8, stagger: .08, ease: 'power3.out' }, '-=.8')
    .to(vis, { clipPath: 'inset(0 0 0% 0)', duration: 1.4, ease: 'power4.inOut' }, '-=.8');
  gsap.fromTo($$('#pVisual img, #pVisual .ph'), { scale: 1.15 }, { scale: 1, duration: 1.8, ease: 'power3.out', delay: 1.4 });
  gsap.to('#pVisual img', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '#pVisual', start: 'top bottom', end: 'bottom top', scrub: true } });
  CIM.fadeIn(document);
  gsap.from('.p-next h2', { yPercent: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.p-next', start: 'top 80%' } });
  addEventListener('load', () => ScrollTrigger.refresh());
})();
