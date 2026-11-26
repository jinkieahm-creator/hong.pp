/* flower3d.js — 프로젝트마다 한 송이씩 피는 3D 복셀 꽃 (three.js)
   mountFlower(요소, 꽃잎색, 꽃술색): 마우스 쪽으로 고개를 돌리고, 바람처럼 살랑입니다. */
import * as THREE from "three"

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
const box = new THREE.BoxGeometry(1, 1, 1)

export function mountFlower(el, petal = "#F08AB0", centre = "#F2C83A") {
  let r
  try { r = new THREE.WebGLRenderer({ alpha: true, antialias: true }) } catch (e) { return }
  r.setPixelRatio(Math.min(2, devicePixelRatio || 1))
  r.domElement.style.cssText = "width:100%;height:100%;display:block"
  el.appendChild(r.domElement)

  const scene = new THREE.Scene()
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50)
  cam.position.set(0, 1.9, 9.5)
  cam.lookAt(0, 1.9, 0)
  scene.add(new THREE.AmbientLight(0xffffff, 0.8))
  const sun = new THREE.DirectionalLight(0xffe9c8, 1.2)
  sun.position.set(3, 5, 4)
  scene.add(sun)

  const g = new THREE.Group()
  scene.add(g)
  const add = (x, y, z, sx, sy, sz, c) => {
    const m = new THREE.Mesh(box, new THREE.MeshLambertMaterial({ color: c }))
    m.position.set(x, y, z)
    m.scale.set(sx, sy, sz)
    g.add(m)
  }
  for (let i = 0; i < 5; i++) add(0, i * 0.5 + 0.25, 0, 0.3, 0.5, 0.3, i % 2 ? "#3E7C1E" : "#4A8C24") // 줄기
  add(-0.38, 1.0, 0, 0.6, 0.26, 0.3, "#2C5A16") // 잎
  add(0.38, 1.6, 0, 0.6, 0.26, 0.3, "#2C5A16")
  const hy = 3.15
  for (const [x, y] of [[-0.82, 0], [0.82, 0], [0, 0.82], [0, -0.82]]) add(x, hy + y, 0, 0.82, 0.82, 0.82, petal) // 꽃잎
  add(0, hy, 0.25, 0.66, 0.66, 0.66, centre) // 꽃술

  let vis = true
  new IntersectionObserver((e) => (vis = e[0].isIntersecting)).observe(el)
  let tx = 0, ty = 0
  addEventListener("pointermove", (e) => {
    tx = (e.clientX / innerWidth - 0.5) * 1.5
    ty = (e.clientY / innerHeight - 0.5) * 0.35
  })
  const size = () => {
    const w = el.clientWidth, h = el.clientHeight
    if (w < 2 || h < 2) return
    r.setSize(w, h, false)
    cam.aspect = w / h
    cam.updateProjectionMatrix()
  }
  new ResizeObserver(size).observe(el)
  size()

  let t = Math.random() * 6
  r.setAnimationLoop(() => {
    if (!vis) return
    t += 0.016
    const goalY = reduce ? 0 : tx + Math.sin(t * 0.8) * 0.22
    g.rotation.y += (goalY - g.rotation.y) * 0.06
    g.rotation.x += ((reduce ? 0 : ty) - g.rotation.x) * 0.06
    g.rotation.z = reduce ? 0 : Math.sin(t * 1.3) * 0.04
    r.render(scene, cam)
  })
}
