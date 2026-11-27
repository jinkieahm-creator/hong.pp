/* =========================================================
   MARVEL UNIVERSE — characters.js
   ALL / HERO / VILLAIN 분류 + 이름 검색, 카드 클릭 시 프로필 모달
   ========================================================= */
(() => {
  const { $, $$, esc, charCard, hasGsap, reveal, openChar, param } = MU;
  const grid = $("#cgrid"), input = $("#cq");
  const CATS = [["all", "ALL"], ["hero", "HERO"], ["villain", "VILLAIN"]];
  const state = { cat: "all", q: "" };
  const norm = (s) => String(s).toLowerCase().replace(/[\s·-]/g, "");

  $("#cfilter").innerHTML = CATS.map(([k, t]) => {
    const n = k === "all" ? CHARACTERS.length : CHARACTERS.filter((c) => c.type === k).length;
    return `<button type="button" class="chip" data-c="${k}" aria-pressed="false">${t} <span style="opacity:.6;margin-left:8px">${n}</span></button>`;
  }).join("");

  function render(animate = true) {
    const q = norm(state.q);
    const list = CHARACTERS.filter((c) => (state.cat === "all" || c.type === state.cat) && (!q || [c.ko, c.name, c.real].some((v) => norm(v).includes(q))));
    $$("#cfilter .chip").forEach((b) => b.setAttribute("aria-pressed", b.dataset.c === state.cat));
    $("#ccount").innerHTML = `<b>${list.length}</b>CHARACTERS${state.q ? ` · “${esc(state.q)}”` : ""}`;
    grid.innerHTML = list.map(charCard).join("");
    $("#cempty").hidden = list.length > 0;
    if (animate && hasGsap() && list.length) gsap.from(grid.children, { opacity: 0, y: 30, duration: 0.6, stagger: 0.04, ease: "power3.out", clearProps: "all" });
  }

  $("#cfilter").addEventListener("click", (e) => { const b = e.target.closest("[data-c]"); if (!b) return; state.cat = b.dataset.c; render(); });
  let t;
  input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { state.q = input.value.trim(); render(); }, 160); });
  $("#cform").addEventListener("submit", (e) => e.preventDefault());
  $("#creset").addEventListener("click", () => { state.cat = "all"; state.q = ""; input.value = ""; render(); input.focus(); });

  render(false);
  reveal();
  // characters.html?id=thor 로 들어오면 해당 프로필을 바로 열기
  const id = param("id");
  if (id && MU.charById(id)) openChar(id);
})();
