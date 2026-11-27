/* hello.js — CONTACT 의 털 버튼 (SAY HELLO)
   누르면 메일 주소가 복사되고 연락처 카드로 내려갑니다. */
import { mountAngora } from "./angora.js"

const stage = document.getElementById("furStage")
if (stage) {
  const small = innerWidth < 761
  mountAngora(stage, {
    label: "SAY HELLO",
    background: "#F2F1EC",
    furColor: "#C5FF00",
    textColor: "#111111",
    font: { fontFamily: "Manrope", fontWeight: 800, fontSize: small ? "120px" : "104px" },
    buttonWidth: small ? 980 : 720,
    buttonHeight: small ? 300 : 210,
    radius: 200,
    fur: { density: 10, length: 2.2, lift: 1.1, frizz: 8.1, flow: "art" },
    advanced: { puff: 10, emboss: 60, rimShare: 38, hairWidth: 2 },
    onClick: () => {
      if (window.UI && UI.copyMail) UI.copyMail()
      const r = document.getElementById("reach")
      if (!r) return
      r.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" })
      setTimeout(() => [...r.children].forEach((c, i) => setTimeout(() => { c.classList.remove("ooze"); void c.offsetWidth; c.classList.add("ooze") }, i * 140)), 600)
    }
  })
}
