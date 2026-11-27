/* =========================================================
   MARVEL UNIVERSE — movies.js
   검색 + 페이즈 필터 + 정렬을 동시에 적용, URL과 동기화
   ========================================================= */
(() => {
  const { $, $$, esc, ICON, movieCard, searchMovies, syncFavs, isFav, hasGsap, reveal, param } = MU;
  const grid = $("#mgrid"), input = $("#mq"), sortSel = $("#msort"), clearBtn = $("#mclear");
  const FILTERS = [["all", "ALL MOVIES"], ...Object.keys(PHASES).map((p) => [p, `PHASE ${p}`]), ["fav", "FAVORITES"]];

  const state = {
    q: param("q") || "",
    phase: FILTERS.some(([k]) => k === param("phase")) ? param("phase") : "all",
    sort: ["old", "new", "az"].includes(param("sort")) ? param("sort") : "old",
  };

  $("#mfilter").innerHTML = FILTERS.map(([k, t]) =>
    `<button type="button" class="chip" data-f="${k}" aria-pressed="false">${k === "fav" ? ICON.heart.replace("<svg", '<svg fill="currentColor"') : ""}${t}</button>`).join("");
  clearBtn.innerHTML = ICON.close;

  function results() {
    let list = searchMovies(state.q);
    if (state.phase === "fav") list = list.filter((m) => isFav(m.id));
    else if (state.phase !== "all") list = list.filter((m) => m.phase === +state.phase);
    const sorters = {
      old: (a, b) => a.date.localeCompare(b.date),
      new: (a, b) => b.date.localeCompare(a.date),
      az: (a, b) => a.en.replace(/^The /, "").localeCompare(b.en.replace(/^The /, ""), "en"),
    };
    return list.sort(sorters[state.sort]);
  }

  function syncUrl() {
    const p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.phase !== "all") p.set("phase", state.phase);
    if (state.sort !== "old") p.set("sort", state.sort);
    const qs = p.toString();
    try { history.replaceState(null, "", qs ? `?${qs}` : location.pathname); } catch (e) { /* 일부 뷰어에서는 주소 변경 불가 */ }
  }

  function render(animate = true) {
    const list = results();
    input.value = state.q;
    sortSel.value = state.sort;
    clearBtn.hidden = !state.q;
    $$("#mfilter .chip").forEach((b) => b.setAttribute("aria-pressed", b.dataset.f === state.phase));
    const label = FILTERS.find(([k]) => k === state.phase)[1];
    $("#mcount").innerHTML = `<b>${list.length}</b>FILMS${state.phase !== "all" ? ` · ${label}` : ""}${state.q ? ` · “${esc(state.q)}”` : ""}`;
    $("#mreset").hidden = state.q === "" && state.phase === "all" && state.sort === "old";

    grid.innerHTML = list.map(movieCard).join("");
    $("#mempty").hidden = list.length > 0;
    if (!list.length) {
      $("#memptyTxt").textContent = state.phase === "fav" && !state.q
        ? "아직 즐겨찾기한 영화가 없어요. 영화 카드의 하트를 눌러 담아 보세요."
        : `${state.q ? `「${state.q}」에 맞는 ` : "조건에 맞는 "}영화가 없어요. 검색어나 필터를 바꿔 보세요.`;
    }
    syncFavs();
    syncUrl();
    if (animate && hasGsap() && list.length) gsap.from(grid.children, { opacity: 0, y: 30, duration: 0.6, stagger: 0.03, ease: "power3.out", clearProps: "all" });
  }

  let t;
  input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { state.q = input.value.trim(); render(); }, 180); });
  $("#mform").addEventListener("submit", (e) => { e.preventDefault(); state.q = input.value.trim(); render(); });
  clearBtn.addEventListener("click", () => { state.q = ""; render(); input.focus(); });
  sortSel.addEventListener("change", () => { state.sort = sortSel.value; render(); });
  $("#mfilter").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (!b) return; state.phase = b.dataset.f; render(); });
  const reset = () => { state.q = ""; state.phase = "all"; state.sort = "old"; render(); input.focus(); };
  $("#mreset").addEventListener("click", reset);
  $("#memptyReset").addEventListener("click", reset);
  // 즐겨찾기 탭을 보는 중에 하트를 해제하면 목록에서 바로 빠짐
  document.addEventListener("favchange", () => { if (state.phase === "fav") render(false); });

  render(false);
  reveal();
})();
