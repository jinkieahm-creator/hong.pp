/* docent.js — ROOM 01 의 안내 로봇 "지니" + 말풍선
   로봇을 누르면 점프하고, 말풍선이 다음 안내로 바뀝니다. 문구는 아래 LINES 에서 바꾸세요. */
import { mountClayRobot } from "./robot.js"

const LINES = [
  "안녕하세요, 저는 지니예요! 작업을 안내해 드릴게요.",
  "저를 누르면 점프해요. 한 번 더 눌러 보세요!",
  "대표작은 3편이에요. 옆으로 넘기며 보세요.",
  "첫 화면 스티커는 떼서 아무 데나 붙일 수 있어요.",
  "맨 아래 PICK ME 버튼, 꼭 쓰다듬어 보세요.",
  "마음에 드셨다면 메일 한 통 부탁드려요!"
]

const frame = document.getElementById("robot"), bubble = document.getElementById("bubble")
if (frame) {
  const robot = mountClayRobot(frame, {
    background: { top: "#E3E2DA", bottom: "#F2F1EC", shadow: "#6F6E64", shadowDepth: 30 },
    colors: { clay: "#D6F25A", visor: "#141416", eyes: "#C5FF00" },
    response: { track: "page", headTurn: 7, eyeTravel: 6, followSpeed: 6, hop: 6 },
    walk: true, wave: true, glance: 5, blink: true, animate: true, delay: 0.3
  })
  let i = 0
  const say = (t) => {
    bubble.textContent = t
    bubble.classList.remove("pop"); void bubble.offsetWidth; bubble.classList.add("pop")
  }
  robot.el.addEventListener("pointerdown", () => { i = (i + 1) % LINES.length; say(LINES[i]) })
  // 키보드로도 말을 걸 수 있게
  frame.tabIndex = 0
  frame.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); robot.el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })) } })
  say(LINES[0])
}
