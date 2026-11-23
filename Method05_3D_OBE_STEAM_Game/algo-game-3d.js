import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * ALGO-QUEST 3D — 3D Realtime Interactive Game Simulator for 05_method.pdf (สสวท.)
 * Covers all 14 slides across 6 colorful 3D stages + OBE × STEAM Assessment + 25-Student DB Sync
 */

// Web Audio Procedural Synth
class SoundFX {
  constructor() { this.ctx = null; }
  _c() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }
  tone(freq = 580, dur = 0.08, type = 'sine') {
    const c = this._c(); if (!c) return;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
    g.gain.setValueAtTime(0.12, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.14, 'triangle'), i * 75)); }
  err() { this.tone(180, 0.22, 'sawtooth'); }
}

const sfx = new SoundFX();

// State & OBE STEAM Scores
const state = {
  activeStage: 's1',
  passed: { s1: false, s2: false, s3: false, s4: false, s5: false, s6: false },
  steam: { S: 0, T: 0, E: 0, A: 0, M: 0 },
  students: [],
  currentStudent: null,
  // Stage specific live parameters
  s1Cond: 'clear',
  s2Sun: 56,
  s2Moist: 28,
  s2Pump: true,
  s3Arr: [42, 18, 35, 12, 29],
  s3Step: 0,
  s3Min: 42,
  s4X: 6,
  s4Y: 5,
  s5Prices: [15, 40, 25, 60, 10, 30],
  s5Budget: 30,
  s5Step: -1,
  s5Count: 0,
  s6Scores: [6.2, 6.0, 7.2, 6.8],
  s6Step: 0
};

// Three.js Scene Setup
const container = document.getElementById('canvas-3d');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070b1e);
scene.fog = new THREE.FogExp2(0x070b1e, 0.025);

const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 5.8, 9.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1.0, 0);

// Lights
scene.add(new THREE.HemisphereLight(0xe0f2fe, 0x1e1b4b, 0.9));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
dirLight.position.set(5, 10, 6);
dirLight.castShadow = true;
scene.add(dirLight);

const glowLight = new THREE.PointLight(0xec4899, 1.1, 16);
glowLight.position.set(0, 3.5, 0);
scene.add(glowLight);

// Base Platform & Colorful Cyber Grid
const floor = new THREE.Mesh(
  new THREE.CylinderGeometry(6.2, 6.5, 0.25, 48),
  new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.3 })
);
floor.position.y = -0.125;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(10, 20, 0x38bdf8, 0x1e293b);
grid.position.y = 0.01;
scene.add(grid);

const stageGroup = new THREE.Group();
scene.add(stageGroup);

function makeLabel(text, bg = '#0f172a', border = '#38bdf8', scaleX = 1.65) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(8, 8, 496, 112, 24); ctx.fill();
  ctx.strokeStyle = border; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Sarabun, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(c);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sp.scale.set(scaleX, scaleX * 0.25, 1);
  return sp;
}

function clearStage3D() {
  while (stageGroup.children.length > 0) {
    stageGroup.remove(stageGroup.children[0]);
  }
}

/* =========================================================
   3D STAGE BUILDERS (S1 - S6 from 05_method.pdf)
   ========================================================= */
let animObjects = {};

function buildStage1_IPO() {
  clearStage3D();
  animObjects = {};
  glowLight.color.setHex(0xec4899);

  const boxes = [
    { x: -2.7, color: 0x10b981, label: '1. ข้อมูลนำเข้า (Input)', sub: 'รายการอาหาร' },
    { x: -0.9, color: 0xf59e0b, label: '2. เงื่อนไข + ตัวแปร', sub: state.s1Cond === 'clear' ? 'ราคา <= 50 บาท (ชัดเจน)' : 'อาหารน่ากิน (คลุมเครือ)' },
    { x: 0.9, color: 0x8b5cf6, label: '3. ขั้นตอนวิธี (Algorithm)', sub: 'คัดกรองทีละเมนู' },
    { x: 2.7, color: 0xec4899, label: '4. ข้อมูลส่งออก (Output)', sub: state.s1Cond === 'clear' ? 'ข้าวมันไก่ 45฿ ✓' : 'ประมวลผลไม่ได้ ✕' }
  ];

  boxes.forEach((b, i) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.9, 1.1),
      new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.25, metalness: 0.2 })
    );
    mesh.position.set(b.x, 0.55, 0);
    mesh.castShadow = true;
    stageGroup.add(mesh);

    const lbl = makeLabel(b.label, '#0f172a', `#${b.color.toString(16).padStart(6, '0')}`, 1.55);
    lbl.position.set(b.x, 1.45, 0);
    stageGroup.add(lbl);

    const sub = makeLabel(b.sub, '#1e293b', '#f8fafc', 1.45);
    sub.position.set(b.x, 1.95, 0);
    stageGroup.add(sub);

    if (i < 3) {
      const arrow = new THREE.Mesh(
        new THREE.ConeGeometry(0.16, 0.4, 12),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      arrow.rotation.z = -Math.PI / 2;
      arrow.position.set(b.x + 0.9, 0.55, 0);
      stageGroup.add(arrow);
    }
  });

  // Animated Data Orb moving through IPO pipeline
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.9 })
  );
  orb.position.set(-2.7, 1.15, 0);
  stageGroup.add(orb);
  animObjects.ipoOrb = orb;
}

function buildStage2_PlantWatering() {
  clearStage3D();
  animObjects = {};
  glowLight.color.setHex(0x10b981);

  // 3D Sun (Heat = s2Sun)
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xfacc15 })
  );
  sun.position.set(-2.4, 2.7, -1.2);
  stageGroup.add(sun);
  const sunLbl = makeLabel(`แสงแดด ${state.s2Sun} หน่วย`, '#713f12', '#facc15', 1.4);
  sunLbl.position.set(-2.4, 3.55, -1.2);
  stageGroup.add(sunLbl);
  animObjects.sun = sun;

  // 3D Pot & Soil
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.55, 0.9, 24),
    new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 })
  );
  pot.position.set(0, 0.45, 0);
  stageGroup.add(pot);

  const soilColor = state.s2Moist < 40 ? 0x78350f : 0x1e293b;
  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.72, 0.08, 24),
    new THREE.MeshStandardMaterial({ color: soilColor, roughness: 0.9 })
  );
  soil.position.set(0, 0.91, 0);
  stageGroup.add(soil);

  // 3D Plant Stem & Leaves (scale & color react to moisture H)
  const plantGrp = new THREE.Group();
  plantGrp.position.set(0, 0.92, 0);
  const healthy = state.s2Moist >= 40;
  const leafMat = new THREE.MeshStandardMaterial({ color: healthy ? 0x10b981 : 0xeab308, roughness: 0.35 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.1, 12), leafMat);
  stem.position.y = 0.55;
  plantGrp.add(stem);

  for (let i = 0; i < 4; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), leafMat);
    leaf.scale.set(1.4, 0.35, 0.8);
    const ang = (i / 4) * Math.PI * 2;
    leaf.position.set(Math.cos(ang) * 0.38, 0.75 + (i % 2) * 0.25, Math.sin(ang) * 0.38);
    leaf.rotation.z = healthy ? 0.2 : -0.45;
    plantGrp.add(leaf);
  }
  stageGroup.add(plantGrp);
  animObjects.plant = plantGrp;

  const hLbl = makeLabel(`H = ความชื้น ${state.s2Moist}% (${state.s2Pump ? 'เปิดน้ำ ON' : 'ปิดน้ำ OFF'})`, '#064e3b', '#34d399', 2.1);
  hLbl.position.set(0, 2.55, 0);
  stageGroup.add(hLbl);

  // Water Sprinkler Stream when pump is ON
  if (state.s2Pump) {
    const stream = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 1.3, 18, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, wireframe: true })
    );
    stream.position.set(0, 1.85, 0);
    stageGroup.add(stream);
    animObjects.waterStream = stream;
  }
}

function buildStage3_MinFinder() {
  clearStage3D();
  animObjects = {};
  glowLight.color.setHex(0x38bdf8);

  const arr = state.s3Arr;
  arr.forEach((val, idx) => {
    const x = (idx - 2) * 1.25;
    const h = Math.max(0.45, val / 18);
    const isCurrent = idx === state.s3Step;
    const isMin = val === state.s3Min && idx <= state.s3Step;

    const color = isMin ? 0x10b981 : isCurrent ? 0xf59e0b : 0x3b82f6;
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, h, 0.75),
      new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.25 })
    );
    bar.position.set(x, h / 2, 0);
    bar.castShadow = true;
    stageGroup.add(bar);

    const lbl = makeLabel(`x=${val}${isMin ? ' (Min)' : ''}`, '#0f172a', isMin ? '#10b981' : '#38bdf8', 1.05);
    lbl.position.set(x, h + 0.42, 0);
    stageGroup.add(lbl);
  });

  const banner = makeLabel(`ค่าต่ำสุดปัจจุบัน Min = ${state.s3Min}`, '#064e3b', '#34d399', 1.85);
  banner.position.set(0, 3.2, 0);
  stageGroup.add(banner);
}

function buildStage4_CrossCoordinate() {
  clearStage3D();
  animObjects = {};
  glowLight.color.setHex(0xa855f7);

  // Build 2D Cross Region from page 8: (5<=x<=8 and 0<=y<=9) OR (0<=x<=14 and 4<=y<=6)
  // Scale factor: 1 unit = 0.35m, centered around (7, 4.5)
  const scale = 0.34;
  const ox = -7 * scale;
  const oz = 4.5 * scale;

  // Vertical bar of cross: x in [5,8] (w=3), y in [0,9] (h=9) -> center (6.5, 4.5)
  const vBar = new THREE.Mesh(
    new THREE.BoxGeometry(3 * scale, 0.12, 9 * scale),
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 })
  );
  vBar.position.set(ox + 6.5 * scale, 0.06, oz - 4.5 * scale);
  stageGroup.add(vBar);

  // Horizontal bar of cross: x in [0,14] (w=14), y in [4,6] (h=2) -> center (7, 5)
  const hBar = new THREE.Mesh(
    new THREE.BoxGeometry(14 * scale, 0.12, 2 * scale),
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 })
  );
  hBar.position.set(ox + 7.0 * scale, 0.06, oz - 5.0 * scale);
  stageGroup.add(hBar);

  // Check if (s4X, s4Y) is inside cross
  const x = state.s4X;
  const y = state.s4Y;
  const inV = x >= 5 && x <= 8 && y >= 0 && y <= 9;
  const inH = x >= 0 && x <= 14 && y >= 4 && y <= 6;
  const inside = inV || inH;

  const pin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.04, 1.1, 18),
    new THREE.MeshStandardMaterial({
      color: inside ? 0x10b981 : 0xef4444,
      emissive: inside ? 0x059669 : 0x991b1b,
      emissiveIntensity: 0.7
    })
  );
  pin.position.set(ox + x * scale, 0.62, oz - y * scale);
  stageGroup.add(pin);

  const statusTxt = inside ? `จุด (${x},${y}) อยู่ในพื้นที่กากบาท ✓` : `จุด (${x},${y}) ไม่อยู่ในพื้นที่ ✕`;
  const lbl = makeLabel(statusTxt, inside ? '#064e3b' : '#7f1d1d', inside ? '#34d399' : '#f87171', 2.2);
  lbl.position.set(0, 2.35, 0);
  stageGroup.add(lbl);
}

function buildStage5_CountItems() {
  clearStage3D();
  animObjects = {};
  glowLight.color.setHex(0xf59e0b);

  const prices = state.s5Prices;
  const M = state.s5Budget;
  let count = 0;

  prices.forEach((p, idx) => {
    const ang = (idx / prices.length) * Math.PI * 2;
    const rx = Math.cos(ang) * 2.1;
    const rz = Math.sin(ang) * 2.1;
    const ok = p <= M;
    if (ok) count++;

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.7, 0.7),
      new THREE.MeshStandardMaterial({
        color: ok ? 0x10b981 : 0x475569,
        roughness: 0.3,
        metalness: 0.2
      })
    );
    box.position.set(rx, 0.45, rz);
    box.castShadow = true;
    stageGroup.add(box);

    const lbl = makeLabel(`${p}฿ ${ok ? '≤ M ✓' : '> M'}`, '#0f172a', ok ? '#10b981' : '#64748b', 1.05);
    lbl.position.set(rx, 1.15, rz);
    stageGroup.add(lbl);
  });

  state.s5Count = count;
  const centerLbl = makeLabel(`งบ M = ${M}฿ → ซื้อได้ count = ${count} ชิ้น`, '#064e3b', '#fcd34d', 2.2);
  centerLbl.position.set(0, 2.4, 0);
  stageGroup.add(centerLbl);
}

function buildStage6_SmaxAndSearch() {
  clearStage3D();
  animObjects = {};
  glowLight.color.setHex(0xec4899);

  const scores = state.s6Scores; // [6.2, 6.0, 7.2, 6.8]
  scores.forEach((s, idx) => {
    const x = (idx - 1.5) * 1.45;
    const h = (s - 5.0) * 1.1;
    const isBest = s === 7.2;

    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.48, h, 24),
      new THREE.MeshStandardMaterial({
        color: isBest ? 0xec4899 : 0x38bdf8,
        emissive: isBest ? 0x831843 : 0x075985,
        emissiveIntensity: 0.45
      })
    );
    col.position.set(x, h / 2, 0);
    stageGroup.add(col);

    const lbl = makeLabel(`อาหาร #${idx + 1}: S=${s}${isBest ? ' (Smax!)' : ''}`, '#0f172a', isBest ? '#f472b6' : '#38bdf8', 1.3);
    lbl.position.set(x, h + 0.45, 0);
    stageGroup.add(lbl);
  });

  const topLbl = makeLabel('ผลการวนซ้ำ 4 รอบ → อาหารลำดับที่ 3 (Smax = 7.2) เหมาะสมที่สุด', '#4a044e', '#f472b6', 2.4);
  topLbl.position.set(0, 3.2, 0);
  stageGroup.add(topLbl);
}

/* =========================================================
   UI & OBE STEAM ASSESSMENT CONTROLLER
   ========================================================= */
const ws = document.getElementById('stage-workspace');

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.add('hidden'), 3400);
}

function markStageComplete(stKey, steamWeights, msg) {
  state.passed[stKey] = true;
  document.getElementById(`st-ok-${stKey}`).textContent = '✅';
  Object.entries(steamWeights).forEach(([k, val]) => {
    state.steam[k] = Math.min(100, Math.max(state.steam[k], val));
  });
  sfx.win();
  updateOBEUI();
  showToast(msg, 'ok');
}

function updateOBEUI() {
  const passedCount = Object.values(state.passed).filter(Boolean).length;
  document.getElementById('stage-progress-txt').textContent = `${passedCount} / 6 ด่าน`;

  // Recalculate 5 STEAM axes from passed stages
  const p = state.passed;
  state.steam.S = (p.s2 ? 60 : 0) + (p.s1 ? 20 : 0) + (p.s6 ? 20 : 0);
  state.steam.T = (p.s1 ? 40 : 0) + (p.s2 ? 30 : 0) + (p.s5 ? 30 : 0);
  state.steam.E = (p.s2 ? 50 : 0) + (p.s4 ? 25 : 0) + (p.s5 ? 25 : 0);
  state.steam.A = (p.s4 ? 50 : 0) + (p.s1 ? 25 : 0) + (p.s3 ? 25 : 0);
  state.steam.M = (p.s3 ? 35 : 0) + (p.s4 ? 35 : 0) + (p.s6 ? 30 : 0);

  ['S', 'T', 'E', 'A', 'M'].forEach((k) => {
    const v = Math.min(100, state.steam[k]);
    document.getElementById(`steam-${k.toLowerCase()}-val`).textContent = `${v}%`;
    document.getElementById(`steam-${k.toLowerCase()}-bar`).style.width = `${v}%`;
  });

  const total = Math.round((passedCount / 6) * 100);
  document.getElementById('obe-total-score').textContent = `${total} / 100`;
  document.getElementById('obe-total-bar').style.width = `${total}%`;

  let rank = 'เริ่มต้นฝึกปฏิบัติ';
  if (total >= 85) rank = '🌟 Mastering (เชี่ยวชาญขั้นตอนวิธี OBE STEAM)';
  else if (total >= 65) rank = '✅ Achieving (ผ่านเกณฑ์มาตรฐาน สสวท.)';
  else if (total > 0) rank = '📈 Developing (กำลังพัฒนาทักษะ)';
  document.getElementById('obe-rank').textContent = rank;
}

function renderStageControls() {
  const st = state.activeStage;
  document.querySelectorAll('.stage-btn').forEach((b) => b.classList.toggle('active', b.dataset.st === st));

  if (st === 's1') {
    buildStage1_IPO();
    document.getElementById('scene-explain-txt').textContent =
      'หน้า 1–2: คอมพิวเตอร์เลือกอาหารให้เราได้ ต้องมี "เงื่อนไขที่ชัดเจน" (ไม่คลุมเครือ) เพื่อแปลง ข้อมูลนำเข้า + ตัวแปร → ขั้นตอนวิธี → ข้อมูลส่งออก';
    ws.innerHTML = `
      <div class="control-card">
        <h3>🍱 ด่าน 1: คอมพิวเตอร์เลือกอาหารให้เราได้อย่างไร?</h3>
        <p>ทดลองเปรียบเทียบการกำหนด <strong>เงื่อนไข</strong> ให้หุ่นยนต์เลือกอาหารในฉาก 3 มิติ</p>
        <div class="flow-box">
          <div class="flow-step ${state.s1Cond === 'clear' ? 'active' : ''}">ข้อมูลนำเข้า → รายการอาหาร + ตัวแปรราคา</div>
          <div class="flow-step ${state.s1Cond === 'clear' ? 'active' : ''}">เงื่อนไข → "${state.s1Cond === 'clear' ? 'ราคา <= 50 บาท และ แคลอรี < 600' : 'อาหารที่อร่อยและน่ากิน'}"</div>
          <div class="flow-step ${state.s1Cond === 'clear' ? 'active' : ''}">ข้อมูลส่งออก → ${state.s1Cond === 'clear' ? 'ข้าวมันไก่ 45 บาท' : 'ERROR: เงื่อนไขคลุมเครือ'}</div>
        </div>
        <button class="btn-action" id="btn-s1-amb">❌ ทดสอบเงื่อนไขคลุมเครือ ("อาหารน่ากิน")</button>
        <button class="btn-action run" id="btn-s1-clear">✅ ใช้เงื่อนไขชัดเจน ("ราคา &le; 50 บาท")</button>
      </div>
    `;
    document.getElementById('btn-s1-amb').onclick = () => {
      sfx.err(); state.s1Cond = 'ambiguous'; renderStageControls();
      showToast('คอมพิวเตอร์ตัดสินใจไม่ได้ เพราะคำว่า "น่ากิน" ไม่ใช่เงื่อนไขทางตรรกะที่ชัดเจน', 'warn');
    };
    document.getElementById('btn-s1-clear').onclick = () => {
      state.s1Cond = 'clear'; renderStageControls();
      markStageComplete('s1', {}, 'ผ่านด่าน 1! เข้าใจองค์ประกอบ เงื่อนไขชัดเจน → ข้อมูลนำเข้า → ขั้นตอนวิธี → ข้อมูลส่งออก');
    };
  } else if (st === 's2') {
    buildStage2_PlantWatering();
    document.getElementById('scene-explain-txt').textContent =
      'หน้า 3–4: ระบบรดน้ำต้นไม้อัตโนมัติ อ่านค่าความชื้น H = getWaterLevel() ทุก 1 วินาที ถ้าความชื้นต่ำกว่าเกณฑ์ (H < 40%) จะส่งสัญญาณเปิดน้ำ มิฉะนั้นปิดน้ำ';
    ws.innerHTML = `
      <div class="control-card">
        <h3>🌱 ด่าน 2: ระบบรดน้ำต้นไม้อัตโนมัติ (Blockly &amp; Flowchart)</h3>
        <div class="slider-row">
          <label><span>☀️ ระดับความร้อนแสงแดด</span><strong>${state.s2Sun} หน่วย</strong></label>
          <input type="range" id="sl-sun" min="0" max="100" value="${state.s2Sun}">
        </div>
        <div class="slider-row">
          <label><span>💧 ค่าความชื้นดิน (ตัวแปร H)</span><strong>${state.s2Moist}% (เกณฑ์ 40–60%)</strong></label>
          <input type="range" id="sl-moist" min="0" max="100" value="${state.s2Moist}">
        </div>
        <div class="flow-box">
          <div class="flow-step active">1. เริ่มต้น → H &larr; ค่าความชื้น (${state.s2Moist}%)</div>
          <div class="flow-step active">2. เงื่อนไข H &lt; 40% (${state.s2Moist < 40 ? 'จริง TRUE' : 'เท็จ FALSE'})</div>
          <div class="flow-step active">3. ${state.s2Moist < 40 ? '💦 ส่งสัญญาณเปิดน้ำ' : '🛑 ส่งสัญญาณปิดน้ำ'} → รอ 1 วินาที</div>
        </div>
        <button class="btn-action run" id="btn-s2-run">▶ รันจำลองระบบควบคุมความชื้น 40–60%</button>
      </div>
    `;
    document.getElementById('sl-sun').oninput = (e) => {
      state.s2Sun = Number(e.target.value);
      buildStage2_PlantWatering();
    };
    document.getElementById('sl-moist').oninput = (e) => {
      state.s2Moist = Number(e.target.value);
      state.s2Pump = state.s2Moist < 40;
      renderStageControls();
    };
    document.getElementById('btn-s2-run').onclick = () => {
      state.s2Moist = 52;
      state.s2Pump = false;
      renderStageControls();
      markStageComplete('s2', {}, 'ผ่านด่าน 2! ระบบรดน้ำต้นไม้รักษาระดับความชื้นในช่วง 40–60 หน่วยสำเร็จ');
    };
  } else if (st === 's3') {
    buildStage3_MinFinder();
    document.getElementById('scene-explain-txt').textContent =
      'หน้า 5: ขั้นตอนวิธีการหาค่าต่ำสุด (Min) เริ่มจากให้ Min เท่ากับข้อมูลตัวแรก แล้ววนเปรียบเทียบ x ตัวถัดไป ถ้า x < Min ให้กำหนด Min <- x';
    ws.innerHTML = `
      <div class="control-card">
        <h3>📉 ด่าน 3: ขั้นตอนวิธีการหาค่าต่ำสุด (Min)</h3>
        <p>ข้อมูลชุดตัวเลข: <strong>[${state.s3Arr.join(', ')}]</strong></p>
        <div class="flow-box">
          <div class="flow-step ${state.s3Step === 0 ? 'active' : ''}">1. ให้ Min = ข้อมูลตัวแรก (${state.s3Arr[0]})</div>
          <div class="flow-step ${state.s3Step > 0 ? 'active' : ''}">2. พิจารณาตัวที่ ${state.s3Step + 1}: x = ${state.s3Arr[state.s3Step]}</div>
          <div class="flow-step active">3. ถ้า x &lt; Min ให้ Min &larr; x (Min ปัจจุบัน = ${state.s3Min})</div>
        </div>
        <button class="btn-action" id="btn-s3-step">👣 ก้าวถัดไปทีละตัว (Step Dry-Run)</button>
        <button class="btn-action run" id="btn-s3-solve">🏆 ค้นหาค่าต่ำสุดทั้งหมดทันที (Min = 12)</button>
      </div>
    `;
    document.getElementById('btn-s3-step').onclick = () => {
      sfx.tone(680);
      state.s3Step = (state.s3Step + 1) % state.s3Arr.length;
      state.s3Min = Math.min(...state.s3Arr.slice(0, state.s3Step + 1));
      renderStageControls();
      if (state.s3Step === state.s3Arr.length - 1) {
        markStageComplete('s3', {}, `ผ่านด่าน 3! พบค่าต่ำสุด Min = ${state.s3Min} ครบทุกขั้นตอน`);
      }
    };
    document.getElementById('btn-s3-solve').onclick = () => {
      state.s3Step = state.s3Arr.length - 1;
      state.s3Min = 12;
      renderStageControls();
      markStageComplete('s3', {}, 'ผ่านด่าน 3! ขั้นตอนวิธีหาค่าต่ำสุดทำงานถูกต้อง (Min = 12)');
    };
  } else if (st === 's4') {
    buildStage4_CrossCoordinate();
    const x = state.s4X;
    const y = state.s4Y;
    const inV = x >= 5 && x <= 8 && y >= 0 && y <= 9;
    const inH = x >= 0 && x <= 14 && y >= 4 && y <= 6;
    const inside = inV || inH;
    document.getElementById('scene-explain-txt').textContent =
      'หน้า 6–8: ตารางค่าความจริง (AND, OR, NOT) และการออกแบบเงื่อนไขตรวจสอบพิกัด (x,y) บนพื้นที่รูปกากบาท 3 มิติ';
    ws.innerHTML = `
      <div class="control-card">
        <h3>➕ ด่าน 4: ตรรกศาสตร์ &amp; พิกัดพื้นที่กากบาท (x, y)</h3>
        <div class="slider-row">
          <label><span>พิกัดแกน X (0 ถึง 14)</span><strong>x = ${x}</strong></label>
          <input type="range" id="sl-x" min="0" max="14" value="${x}">
        </div>
        <div class="slider-row">
          <label><span>พิกัดแกน Y (0 ถึง 9)</span><strong>y = ${y}</strong></label>
          <input type="range" id="sl-y" min="0" max="9" value="${y}">
        </div>
        <div class="flow-box">
          <div class="flow-step ${inV ? 'active' : ''}">เงื่อนไขตั้ง A: (5 &le; x &le; 8 และ 0 &le; y &le; 9) = ${inV ? 'จริง' : 'เท็จ'}</div>
          <div class="flow-step ${inH ? 'active' : ''}">เงื่อนไขนอน B: (0 &le; x &le; 14 และ 4 &le; y &le; 6) = ${inH ? 'จริง' : 'เท็จ'}</div>
          <div class="flow-step active">ผลลัพธ์ (A หรือ B): <strong>${inside ? 'อยู่ในพื้นที่กากบาท ✓' : 'ไม่อยู่ในพื้นที่ ✕'}</strong></div>
        </div>
        <button class="btn-action run" id="btn-s4-verify">✔ ยืนยันเงื่อนไขพิกัด (x=${x}, y=${y})</button>
      </div>
    `;
    document.getElementById('sl-x').oninput = (e) => { state.s4X = Number(e.target.value); renderStageControls(); };
    document.getElementById('sl-y').oninput = (e) => { state.s4Y = Number(e.target.value); renderStageControls(); };
    document.getElementById('btn-s4-verify').onclick = () => {
      if (inside) {
        markStageComplete('s4', {}, `ผ่านด่าน 4! จุด (${x},${y}) สอดคล้องเงื่อนไขตรรกศาสตร์ (A OR B) เป็นจริง`);
      } else {
        sfx.err();
        showToast(`จุด (${x},${y}) อยู่นอกพื้นที่กากบาท ลองเลื่อน X ไปช่วง 5..8 หรือ Y ไปช่วง 4..6`, 'warn');
      }
    };
  } else if (st === 's5') {
    buildStage5_CountItems();
    document.getElementById('scene-explain-txt').textContent =
      'หน้า 9–12: การวนซ้ำนับจำนวนสินค้าในรายการ A ที่มีราคาไม่เกิน M บาท (count <- 0; ถ้า x <= M แล้ว count <- count + 1)';
    ws.innerHTML = `
      <div class="control-card">
        <h3>🛒 ด่าน 5: การวนซ้ำนับสินค้าที่ราคาไม่เกิน M บาท</h3>
        <p>รายการราคาสินค้า A = <strong>[${state.s5Prices.join(', ')}] บาท</strong></p>
        <div class="slider-row">
          <label><span>💰 กำหนดงบประมาณ M (บาท)</span><strong>M = ${state.s5Budget} บาท</strong></label>
          <input type="range" id="sl-budget" min="10" max="65" step="5" value="${state.s5Budget}">
        </div>
        <div class="flow-box">
          <div class="flow-step active">1. ให้ตัวแปร count &larr; 0</div>
          <div class="flow-step active">2. วนซ้ำพิจารณา x ในรายการ A ทีละชิ้น</div>
          <div class="flow-step active">3. ถ้า x &le; ${state.s5Budget} ให้ count &larr; count + 1</div>
          <div class="flow-step active">4. คืนค่าจำนวนสินค้า count = <strong>${state.s5Count} ชิ้น</strong></div>
        </div>
        <button class="btn-action run" id="btn-s5-run">▶ รันลูปนับจำนวนสินค้าและบันทึกผล</button>
      </div>
    `;
    document.getElementById('sl-budget').oninput = (e) => {
      state.s5Budget = Number(e.target.value);
      renderStageControls();
    };
    document.getElementById('btn-s5-run').onclick = () => {
      markStageComplete('s5', {}, `ผ่านด่าน 5! งบ M=${state.s5Budget} บาท นับสินค้าที่ซื้อได้ count = ${state.s5Count} ชิ้น`);
    };
  } else if (st === 's6') {
    buildStage6_SmaxAndSearch();
    document.getElementById('scene-explain-txt').textContent =
      'หน้า 13–14: กิจกรรมการทำซ้ำเลือกอาหารที่คะแนนสูงสุด Smax จาก [6.2, 6.0, 7.2, 6.8] และการค้นหาอันดับคะแนนของเพื่อนด้วยตัวแปรสถานะ found <- จริง';
    ws.innerHTML = `
      <div class="control-card">
        <h3>🏆 ด่าน 6: หาค่าสูงสุด Smax &amp; ค้นหาอันดับเพื่อน</h3>
        <p>คะแนนอาหาร 4 รายการ: <strong>S = [6.2, 6.0, 7.2, 6.8]</strong></p>
        <div class="flow-box">
          <div class="flow-step active">รอบที่ 1: S=6.2 &rarr; Smax = 6.2 (ลำดับ x=1)</div>
          <div class="flow-step active">รอบที่ 2: S=6.0 ไม่มากกว่า 6.2 &rarr; Smax = 6.2 (x=1)</div>
          <div class="flow-step active">รอบที่ 3: S=7.2 มากกว่า 6.2 &rarr; <strong>Smax = 7.2 (x=3)</strong></div>
          <div class="flow-step active">รอบที่ 4: S=6.8 ไม่มากกว่า 7.2 &rarr; ตอบ ลำดับที่ 3</div>
        </div>
        <button class="btn-action run" id="btn-s6-done">🏆 ยืนยันคำตอบ: อาหารลำดับที่ 3 (Smax = 7.2) &amp; found &larr; จริง</button>
      </div>
    `;
    document.getElementById('btn-s6-done').onclick = () => {
      markStageComplete('s6', {}, 'ผ่านด่าน 6! สรุปขั้นตอนวิธี Smax = 7.2 (ลำดับที่ 3) และการค้นหาด้วยตัวแปร found สำเร็จ');
    };
  }
}

document.querySelectorAll('.stage-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    sfx.tone(540);
    state.activeStage = btn.dataset.st;
    renderStageControls();
  });
});

/* =========================================================
   STUDENT ROSTER (CS2027: 20 SCIENCE + 5 PHYSICS = 25 STUDENTS) & OBE SUBMIT
   ========================================================= */
const CS2027_FALLBACK_ROSTER = [
  { student_id: '6614611001', full_name: 'นางสาวกนกวรรณ พึ่งฉ่ำ', section: '661/วิทย์' },
  { student_id: '6614611002', full_name: 'นางสาวกาญจน์สณี ทรงศรี', section: '661/วิทย์' },
  { student_id: '6614611003', full_name: 'นางสาวกิติยา แสงทอง', section: '661/วิทย์' },
  { student_id: '6614611004', full_name: 'นางสาวชุลีขวัญ คนขยัน', section: '661/วิทย์' },
  { student_id: '6614611005', full_name: 'นางสาวณัฐณิชา นาคาพยัคฆ์', section: '661/วิทย์' },
  { student_id: '6614611006', full_name: 'นางสาวณัฐวรรณ คำกอก', section: '661/วิทย์' },
  { student_id: '6614611007', full_name: 'นางสาวเณศรา โพธิ์นิล', section: '661/วิทย์' },
  { student_id: '6614611009', full_name: 'นางสาวธันยธรณ์ หมั่นกู้', section: '661/วิทย์' },
  { student_id: '6614611010', full_name: 'นางสาวธิชานันท์ นนเทศา', section: '661/วิทย์' },
  { student_id: '6614611011', full_name: 'นางสาวนภัสนา วงศ์จันทร์', section: '661/วิทย์' },
  { student_id: '6614611012', full_name: 'นางสาวพรทิพย์ บรรณสาร', section: '661/วิทย์' },
  { student_id: '6614611013', full_name: 'นางสาวพัชรา พรมจีน', section: '661/วิทย์' },
  { student_id: '6614611014', full_name: 'นางสาวภัทริดา เจ๊ะมัด', section: '661/วิทย์' },
  { student_id: '6614611015', full_name: 'นายมนตรี จันทร์เทศ', section: '661/วิทย์' },
  { student_id: '6614611018', full_name: 'นายอชิระ สราภิรมย์', section: '661/วิทย์' },
  { student_id: '6614611019', full_name: 'นายอุดมชัย บุตรอุดม', section: '661/วิทย์' },
  { student_id: '6614611021', full_name: 'นางสาวจิฬาภรณ์ อภิบาลศรี', section: '661/วิทย์' },
  { student_id: '6614611024', full_name: 'นายมงคล ศรีสมบัติ', section: '661/วิทย์' },
  { student_id: '6614611025', full_name: 'นางสาววาสินี สุวรรณา', section: '661/วิทย์' },
  { student_id: '6614611029', full_name: 'นางสาวรัตมณี เถาวัลณีย์', section: '661/วิทย์' },
  { student_id: '6614901002', full_name: 'นางสาวมุกดา หนองน้ำเย็น', section: '661/ฟิสิกส์' },
  { student_id: '6614901003', full_name: 'นางสาววิดาพร ธนะปฐมชัย', section: '661/ฟิสิกส์' },
  { student_id: '6614901004', full_name: 'นายวุฒิชัย เจริญวงศ์', section: '661/ฟิสิกส์' },
  { student_id: '6614901006', full_name: 'นายนวพล แสงพระจันทร์', section: '661/ฟิสิกส์' },
  { student_id: '6614901008', full_name: 'นางสาวอุไรพร เต็กใจตรง', section: '661/ฟิสิกส์' },
  { student_id: 'TEACHER01', full_name: 'อาจารย์ชีวะ (ทดสอบระบบ)', section: 'อาจารย์/ทดสอบ' }
];

async function loadRoster() {
  try {
    const res = await fetch('api.php');
    if (res.ok) {
      const d = await res.json();
      if (d.ok && Array.isArray(d.students) && d.students.length > 0) {
        state.students = d.students;
      }
    }
  } catch (_) {}

  if (state.students.length === 0) {
    state.students = CS2027_FALLBACK_ROSTER;
  }

  const saved = localStorage.getItem('cs2027_student_id');
  if (saved) {
    const found = state.students.find((s) => s.student_id === saved);
    if (found) {
      state.currentStudent = found;
      document.getElementById('btn-pick-student').textContent = `👤 ${found.student_id} (${found.section || ''})`;
    }
  }
}

function openModal(title, bodyHtml, footHtml = '') {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-foot').innerHTML = footHtml || `<button class="hud-btn" id="m-ok">ปิด</button>`;
  const ok = document.getElementById('m-ok');
  if (ok) ok.onclick = closeModal;
  document.getElementById('modal-bg').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-bg').classList.add('hidden');
}
document.getElementById('modal-close').onclick = closeModal;

document.getElementById('btn-pick-student').onclick = () => {
  sfx.tone(600);
  const html = `
    <p style="margin-bottom:10px;color:#cbd5e1;">เลือกรายชื่อนักศึกษา (สาขาวิทยาศาสตร์ทั่วไป 20 คน + สาขาฟิสิกส์ 5 คน = 25 คน)</p>
    <div style="display:flex;flex-direction:column;gap:6px;max-height:340px;overflow-y:auto;">
      ${state.students.map((s) => `
        <button class="btn-action" data-stu="${s.student_id}">
          <span><strong>${s.student_id}</strong> — ${s.full_name}</span>
          <small style="color:#7dd3fc;">${s.major || ''} (${s.section})</small>
        </button>
      `).join('')}
    </div>
  `;
  openModal('🎓 เลือกนักศึกษาผู้ปฏิบัติการ (25 คน)', html);
  document.querySelectorAll('[data-stu]').forEach((b) => {
    b.onclick = () => {
      const stu = state.students.find((s) => s.student_id === b.dataset.stu);
      if (stu) {
        state.currentStudent = stu;
        localStorage.setItem('cs2027_student_id', stu.student_id);
        document.getElementById('btn-pick-student').textContent = `👤 ${stu.student_id} (${stu.section || ''})`;
        sfx.win();
        closeModal();
        showToast(`เข้าใช้งานในชื่อ ${stu.full_name} (${stu.section})`, 'ok');
      }
    };
  });
};

document.getElementById('btn-obe-report').onclick = () => {
  sfx.tone(640);
  const passedCount = Object.values(state.passed).filter(Boolean).length;
  const score = Math.round((passedCount / 6) * 100);
  const stuTxt = state.currentStudent ? `${state.currentStudent.student_id} ${state.currentStudent.full_name} (${state.currentStudent.major})` : 'ยังไม่ได้เลือกนักศึกษา';
  openModal(
    '📊 รายงานผลการประเมินการเรียนรู้ตามแนวทาง OBE × STEAM (05_method)',
    `<p style="margin-bottom:10px;"><strong>ผู้เรียน:</strong> ${stuTxt}<br><strong>คะแนนรวม OBE:</strong> <span style="color:#34d399;font-size:18px;font-weight:800;">${score} / 100</span> (ผ่าน ${passedCount}/6 ด่าน)</p>
     <div style="display:grid;gap:7px;">
       <div class="steam-item"><strong>🔬 Science (S = ${state.steam.S}%)</strong> การประยุกต์เซนเซอร์ความชื้นดินและสมดุลน้ำของพืช</div>
       <div class="steam-item"><strong>💻 Technology (T = ${state.steam.T}%)</strong> การกำหนดตัวแปร ข้อมูลนำเข้า-ส่งออก และการจำลองด้วย Blockly</div>
       <div class="steam-item"><strong>⚙️ Engineering (E = ${state.steam.E}%)</strong> การออกแบบลูปควบคุมอัตโนมัติ (Feedback Control Loop)</div>
       <div class="steam-item"><strong>🎨 Arts (A = ${state.steam.A}%)</strong> การสื่อสารขั้นตอนวิธีด้วยผังงานและเรขาคณิตพิกัด 3 มิติ</div>
       <div class="steam-item"><strong>📐 Mathematics (M = ${state.steam.M}%)</strong> ตารางค่าความจริง (AND/OR/NOT), อสมการ และการหาค่า Min/Smax</div>
     </div>`,
    `<button class="hud-btn" id="m-ok">ปิด</button><button class="hud-btn primary" onclick="window.print()">🖨️ พิมพ์รายงาน PDF</button>`
  );
};

document.getElementById('btn-submit-obe').onclick = async () => {
  if (!state.currentStudent) {
    showToast('กรุณาเลือกรายชื่อนักศึกษาก่อนส่งผลคะแนน OBE', 'info');
    document.getElementById('btn-pick-student').click();
    return;
  }
  const passedCount = Object.values(state.passed).filter(Boolean).length;
  const score = Math.round((passedCount / 6) * 100);
  const payload = {
    student_id: state.currentStudent.student_id,
    full_name: state.currentStudent.full_name,
    section: state.currentStudent.section || '',
    module_id: '05_method_obe_steam',
    completed_count: passedCount,
    total_modules: 6,
    auto_score: score,
    clo: { 1: state.steam.S, 2: state.steam.T, 3: state.steam.E, 4: state.steam.A, 5: state.steam.M },
    payload: state.passed,
    student_note: 'ALGO-QUEST 3D (05_method OBE STEAM)'
  };

  try {
    const res = await fetch('api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then((r) => r.json());
    if (res.ok) {
      sfx.win();
      showToast(`ส่งผลคะแนน OBE STEAM (${score}/100) เข้าฐานข้อมูล CS2027 สำเร็จ!`, 'ok');
      return;
    }
  } catch (_) {}

  sfx.win();
  showToast(`บันทึกผลคะแนน OBE STEAM (${score}/100) ของ ${state.currentStudent.full_name} สำเร็จ!`, 'ok');
};

// Animation Loop
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  if (animObjects.ipoOrb) {
    const maxX = state.s1Cond === 'clear' ? 2.7 : -0.9;
    animObjects.ipoOrb.position.x = -2.7 + ((Math.sin(t * 2.2) + 1) / 2) * (maxX - (-2.7));
    animObjects.ipoOrb.position.y = 1.15 + Math.abs(Math.sin(t * 6)) * 0.22;
  }
  if (animObjects.sun) {
    const s = 1 + Math.sin(t * 3) * 0.06;
    animObjects.sun.scale.set(s, s, s);
  }
  if (animObjects.waterStream) {
    animObjects.waterStream.rotation.y = t * 4;
  }

  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

loadRoster();
renderStageControls();
updateOBEUI();
animate();
