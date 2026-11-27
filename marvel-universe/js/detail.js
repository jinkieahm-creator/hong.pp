/* =========================================================
   MARVEL UNIVERSE — detail.js
   movie-detail.html?id=iron-man 형식의 쿼리로 영화를 찾아 표시
   ========================================================= */
(() => {
  const { $, esc, ICON, param, byId, year, upcoming, fmtDate, fmtRun, posterArt, wideArt, movieCard, syncFavs, reveal, detailUrl } = MU;
  const root = $("#detail");
  const id = param("id");
  const m = id && byId(id);

  if (!m) {
    document.title = "영화를 찾을 수 없음 — MARVEL UNIVERSE";
    root.innerHTML = `
      <section class="phead derr" aria-labelledby="errTitle">
        <div class="wrap">
          <p class="eyebrow">Error · Movie Not Found</p>
          <h1 id="errTitle">404</h1>
          <p class="lead">${id ? `요청한 영화 ID 「${esc(id)}」를 찾을 수 없어요.` : "영화 ID가 전달되지 않았어요."} 주소가 바뀌었거나 아카이브에 없는 영화일 수 있습니다.</p>
          <div class="btns"><a class="btn btn-red" href="movies.html">영화 아카이브로</a><a class="btn btn-line" href="index.html">홈으로</a></div>
        </div>
        <span class="bigtxt" aria-hidden="true">LOST</span>
      </section>`;
    return;
  }

  document.title = `${m.ko} (${m.en}) — MARVEL UNIVERSE`;
  const idx = MOVIES.indexOf(m);
  const prev = MOVIES[idx - 1], next = MOVIES[idx + 1];
  const saga = SAGAS.find((s) => s.phases.includes(m.phase));
  const soon = upcoming(m);
  const chars = CHARACTERS.filter((c) => c.movies.includes(m.id));
  const stone = STONES.find((s) => s.movie === m.id);
  // 같은 페이즈 영화 중 개봉일이 가까운 순으로 4편
  const related = MOVIES.filter((x) => x.id !== m.id && x.phase === m.phase)
    .sort((a, b) => Math.abs(new Date(a.date) - new Date(m.date)) - Math.abs(new Date(b.date) - new Date(m.date)))
    .slice(0, 4);
  const trailer = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${m.en} official trailer Marvel Studios`)}`;
  const initials = (n) => n.replace(/\s/g, "").slice(0, 1);

  root.innerHTML = `
    <section class="dhero" aria-labelledby="dTitle">
      <div class="dhero-bg" data-parallax>${wideArt(m)}</div>
      <div class="wrap dhero-in">
        <nav class="crumb" aria-label="현재 위치"><a href="index.html">HOME</a><span aria-hidden="true">/</span><a href="movies.html?phase=${m.phase}">PHASE ${m.phase}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(m.en.toUpperCase())}</span></nav>
        <p class="eyebrow">${saga.en} · Phase ${m.phase}</p>
        <h1 id="dTitle">${esc(m.en)}</h1>
        <p class="ko">${esc(m.ko)}</p>
        <div class="dtags">${soon ? '<span class="live">COMING SOON</span>' : ""}<span>${year(m)}</span>${m.genre.map((g) => `<span>${esc(g)}</span>`).join("")}${m.runtime ? `<span>${m.runtime} MIN</span>` : ""}</div>
      </div>
    </section>

    <section class="sec dmain" aria-label="영화 정보">
      <div class="wrap dgrid">
        <aside class="dposter" data-fade>
          ${posterArt(m)}
          <div class="dact">
            <button type="button" class="favbig" data-fav="${m.id}" aria-pressed="false">${ICON.heart}<span class="fav-txt">FAVORITE</span></button>
            <a class="btn btn-red" href="${trailer}" target="_blank" rel="noopener noreferrer">Trailer ${ICON.arrow}<span class="sr">(유튜브 검색 결과가 새 창으로 열림)</span></a>
          </div>
        </aside>
        <div class="dinfo">
          <div class="dsec" data-fade>
            <h2>Information</h2>
            <dl class="info big">
              <dt>RELEASE</dt><dd>${fmtDate(m.date)} (북미)${soon ? " · 개봉 예정" : ""}</dd>
              <dt>RUNTIME</dt><dd>${fmtRun(m.runtime)}</dd>
              <dt>DIRECTOR</dt><dd>${esc(m.director)}</dd>
              <dt>GENRE</dt><dd>${esc(m.genre.join(", "))}</dd>
              <dt>SAGA</dt><dd>${saga.ko} · ${PHASES[m.phase].name}</dd>
              ${stone ? `<dt>STONE</dt><dd><span style="color:${stone.color}">◆</span> ${stone.ko} 첫 등장 (${stone.vessel})</dd>` : ""}
            </dl>
          </div>
          <div class="dsec" data-fade><h2>Overview</h2><p class="overview">${esc(m.overview)}</p></div>
          <div class="dsec" data-fade><h2>Cast</h2>
            <ul class="cast" data-stagger>${m.cast.map((c) => `<li><i aria-hidden="true">${esc(initials(c))}</i><span>${esc(c)}</span></li>`).join("")}</ul></div>
          ${chars.length ? `<div class="dsec" data-fade><h2>Characters</h2><div class="dchars">${chars.map((c) => `<button type="button" data-char="${c.id}" aria-haspopup="dialog">${esc(c.ko)}</button>`).join("")}</div></div>` : ""}
        </div>
      </div>
    </section>

    <section class="sec related" aria-labelledby="relTitle">
      <div class="wrap">
        <div class="sec-head" data-fade>
          <div><p class="eyebrow">More from Phase ${m.phase}</p><h2 class="h-sec" id="relTitle">Related Movies</h2></div>
          <a class="btn btn-line btn-sm" href="movies.html?phase=${m.phase}">Phase ${m.phase} 전체 보기</a>
        </div>
        <div class="mgrid" data-stagger>${related.map(movieCard).join("")}</div>
        <nav class="pn" aria-label="개봉 순서로 이동">
          ${prev ? `<a href="${detailUrl(prev.id)}"><small>← PREVIOUS RELEASE</small><b>${esc(prev.en)}</b></a>` : '<span class="blank"></span>'}
          ${next ? `<a class="next" href="${detailUrl(next.id)}"><small>NEXT RELEASE →</small><b>${esc(next.en)}</b></a>` : '<span class="blank"></span>'}
        </nav>
      </div>
    </section>`;

  syncFavs();
  reveal();
  if (MU.hasGsap()) gsap.from(".dhero-in > *", { opacity: 0, y: 40, duration: 1, stagger: 0.1, ease: "power3.out", delay: 0.2 });
})();
