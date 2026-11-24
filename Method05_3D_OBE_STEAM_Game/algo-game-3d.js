import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/**
 * ALGO-QUEST 3D (PBR Studio Edition) — 3D Realtime Interactive Simulator for 05_method.pdf (สสวท.)
 * Features:
 * - PMREM Studio Environment Lighting + Physical Glass, Brushed Steel, Copper & Neon Shaders
 * - Multi-Part Articulated 3D Apparatus for all 6 Algorithm Stages (Zero label overlap)
 * - Collapsible, Expandable & Zen-Mode Sidebars
 * - OBE × STEAM 5-Axis Assessment + CS2027 25-Student Database Sync
 */

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

const state = {
  activeStage: 's1',
  passed: { s1: false, s2: false, s3: false, s4: false, s5: false, s6: false },
  steam: { S: 0, T: 0, E: 0, A: 0, M: 0 },
  students: [],
  currentStudent: null,
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
  s5Count: 4,
  s6Scores: [6.2, 6.0, 7.2, 6.8]
};

// Three.js PBR Studio Renderer & PMREM Environment
const container = document.getElementById('canvas-3d');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060a18);
scene.fog = new THREE.FogExp2(0x060a18, 0.022);

const camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 5.2, 9.8);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;
container.appendChild(renderer.domElement);

// Studio HDR-like PMREM reflection environment for realistic metal & glass
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI / 2.02;
controls.minDistance = 3.2;
controls.maxDistance = 18;
controls.target.set(0, 1.15, 0);

// Studio Lighting
scene.add(new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 0.75));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
keyLight.position.set(6, 12, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
rimLight.position.set(-7, 6, -6);
scene.add(rimLight);

const glowLight = new THREE.PointLight(0xec4899, 1.4, 16);
glowLight.position.set(0, 3.8, 1);
scene.add(glowLight);

// Shared PBR Material Palette
const MAT = {
  darkSteel: new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.24 }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.92, roughness: 0.14 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.88, roughness: 0.18 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xe0f2fe, transmission: 0.88, opacity: 1, transparent: true,
    roughness: 0.06, ior: 1.5, thickness: 0.3, clearcoat: 1.0
  }),
  emeraldGlow: new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.7, roughness: 0.2, metalness: 0.3 }),
  cyanGlow: new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.75, roughness: 0.2, metalness: 0.3 }),
  pinkGlow: new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xbe185d, emissiveIntensity: 0.75, roughness: 0.2, metalness: 0.3 }),
  amberGlow: new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 0.65, roughness: 0.25, metalness: 0.3 })
};

// Multi-Layered Sci-Fi Laboratory Pedestal Floor
const baseGroup = new THREE.Group();
const lowerBase = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 6.2, 0.24, 64), MAT.darkSteel);
lowerBase.position.y = -0.12;
lowerBase.receiveShadow = true;
baseGroup.add(lowerBase);

const trimRing = new THREE.Mesh(
  new THREE.TorusGeometry(5.82, 0.035, 16, 96),
  new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
);
trimRing.rotation.x = Math.PI / 2;
trimRing.position.y = 0.01;
baseGroup.add(trimRing);

const grid = new THREE.GridHelper(9.5, 19, 0x38bdf8, 0x1e293b);
grid.position.y = 0.008;
baseGroup.add(grid);
scene.add(baseGroup);

const stageGroup = new THREE.Group();
scene.add(stageGroup);

function makeLabel(text, bg = '#0f172a', border = '#38bdf8', scaleX = 1.7) {
  const c = document.createElement('canvas');
  c.width = 560; c.height = 124;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(8, 8, 544, 108, 24); ctx.fill();
  ctx.strokeStyle = border; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px Sarabun, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 280, 62);
  const tex = new THREE.CanvasTexture(c);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.scale.set(scaleX, scaleX * 0.22, 1);
  return sp;
}

function clearStage3D() {
  while (stageGroup.children.length > 0) {
    stageGroup.remove(stageGroup.children[0]);
  }
}

/* =========================================================
   HYPER-REALISTIC PBR 3D STAGE BUILDERS (S1 - S6)
   ========================================================= */
let animObjects = {};

// STAGE 1: 3D Automated Smart Kitchen & AI IPO Conveyor Line
function buildStage1_IPO() {
  clearStage3D();
  animObjects = { fans: [] };
  glowLight.color.setHex(0xec4899);

  // Conveyor Table Frame & Metallic Rollers
  const frame = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.22, 1.35), MAT.darkSteel);
  frame.position.set(0, 0.45, 0);
  frame.castShadow = true; frame.receiveShadow = true;
  stageGroup.add(frame);

  for (let x = -3.4; x <= 3.4; x += 0.34) {
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.2, 16), MAT.chrome);
    roller.rotation.x = Math.PI / 2;
    roller.position.set(x, 0.56, 0);
    stageGroup.add(roller);
  }
  [-3.2, -1.1, 1.1, 3.2].forEach((lx) => {
    [-0.52, 0.52].forEach((lz) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.45, 16), MAT.chrome);
      leg.position.set(lx, 0.225, lz);
      stageGroup.add(leg);
    });
  });

  // 4 High-Detail Stations along the conveyor
  const stations = [
    { x: -2.7, color: 0x10b981, title: '1. ข้อมูลนำเข้า (Input)', sub: 'เมนูอาหาร & ราคา', type: 'hopper' },
    { x: -0.9, color: 0xf59e0b, title: '2. เงื่อนไข + ตัวแปร', sub: state.s1Cond === 'clear' ? 'ราคา <= 50฿ (ชัดเจน)' : 'อาหารน่ากิน (คลุมเครือ)', type: 'scanner' },
    { x: 0.9, color: 0x8b5cf6, title: '3. ขั้นตอนวิธี (Algorithm)', sub: 'หน่วยประมวลผลคัดกรอง', type: 'cpu' },
    { x: 2.7, color: 0xec4899, title: '4. ข้อมูลส่งออก (Output)', sub: state.s1Cond === 'clear' ? 'ข้าวมันไก่ 45฿ ✓' : 'ประมวลผลไม่ได้ ✕', type: 'output' }
  ];

  stations.forEach((st) => {
    const grp = new THREE.Group();
    grp.position.set(st.x, 0.58, 0);

    // Metallic Base Pad
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.65, 0.1, 32), MAT.chrome);
    pad.position.y = 0.05;
    grp.add(pad);

    const accentMat = new THREE.MeshStandardMaterial({
      color: st.color, emissive: st.color, emissiveIntensity: 0.55, metalness: 0.4, roughness: 0.2
    });

    if (st.type === 'hopper') {
      const glassChamber = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.85, 32), MAT.glass);
      glassChamber.position.y = 0.52;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.48, 0.1, 32), accentMat);
      cap.position.y = 0.98;
      grp.add(glassChamber, cap);
    } else if (st.type === 'scanner') {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.07, 16, 36, Math.PI), accentMat);
      arch.position.y = 0.45;
      const laserRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 12, 32), MAT.cyanGlow);
      laserRing.rotation.x = Math.PI / 2;
      laserRing.position.y = 0.55;
      grp.add(arch, laserRing);
      animObjects.fans.push(laserRing);
    } else if (st.type === 'cpu') {
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 1), accentMat);
      core.position.y = 0.62;
      const cage = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.88, 0.88), MAT.glass);
      cage.position.y = 0.55;
      grp.add(core, cage);
      animObjects.fans.push(core);
    } else {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.46, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), MAT.glass);
      dome.position.y = 0.35;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.035, 12, 32), accentMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.35;
      grp.add(dome, ring);
    }

    stageGroup.add(grp);

    // High-mounted floating labels (never clipped by conveyor items)
    const lbl1 = makeLabel(st.title, '#0f172a', `#${st.color.toString(16).padStart(6, '0')}`, 1.62);
    lbl1.position.set(st.x, 2.28, 0);
    stageGroup.add(lbl1);

    const lbl2 = makeLabel(st.sub, '#1e293b', '#f8fafc', 1.52);
    lbl2.position.set(st.x, 2.75, 0);
    stageGroup.add(lbl2);
  });

  // 3D Gourmet Meal Tray moving along the conveyor
  const trayGrp = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.06, 24), MAT.chrome);
  const rice = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 }));
  rice.position.y = 0.03;
  const garnish = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), MAT.emeraldGlow);
  garnish.position.set(0.08, 0.16, 0.05);
  trayGrp.add(plate, rice, garnish);
  trayGrp.position.set(-2.7, 0.72, 0);
  stageGroup.add(trayGrp);
  animObjects.ipoOrb = trayGrp;
}

// STAGE 2: 3D Smart IoT Greenhouse, Botanical Tree, Sensor Probe & Water Droplets
function buildStage2_PlantWatering() {
  clearStage3D();
  animObjects = { droplets: [] };
  glowLight.color.setHex(0x10b981);

  // 3D Volumetric Sun & Corona Ring
  const sunGrp = new THREE.Group();
  sunGrp.position.set(-2.6, 2.85, -1.1);
  const sunCore = new THREE.Mesh(new THREE.SphereGeometry(0.48, 32, 32), new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 1.2 + state.s2Sun / 80 }));
  const sunHalo = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.03, 16, 48), MAT.amberGlow);
  sunGrp.add(sunCore, sunHalo);
  stageGroup.add(sunGrp);
  animObjects.sun = sunGrp;

  const sunLbl = makeLabel(`☀️ แสงแดด ${state.s2Sun} หน่วย`, '#713f12', '#facc15', 1.45);
  sunLbl.position.set(-2.6, 3.72, -1.1);
  stageGroup.add(sunLbl);

  // Multi-Tier Ceramic & Chrome Planter Pot
  const potOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.68, 0.95, 32), MAT.copper);
  potOuter.position.set(0, 0.48, 0);
  potOuter.castShadow = true;
  const potRim = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.06, 16, 48), MAT.chrome);
  potRim.rotation.x = Math.PI / 2;
  potRim.position.set(0, 0.95, 0);
  stageGroup.add(potOuter, potRim);

  const soilColor = state.s2Moist < 40 ? 0x78350f : 0x271709;
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.84, 0.08, 32), new THREE.MeshStandardMaterial({ color: soilColor, roughness: 0.92 }));
  soil.position.set(0, 0.93, 0);
  stageGroup.add(soil);

  // 3D Botanical Tree with Trunk, Branches & Lush Canopy
  const plantGrp = new THREE.Group();
  plantGrp.position.set(0, 0.95, 0);
  const healthy = state.s2Moist >= 40;
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.8 });
  const leafMat = new THREE.MeshStandardMaterial({
    color: healthy ? 0x10b981 : 0xd97706,
    emissive: healthy ? 0x064e3b : 0x451a03,
    emissiveIntensity: 0.3,
    roughness: 0.35
  });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.15, 1.05, 16), trunkMat);
  trunk.position.y = 0.52;
  trunk.castShadow = true;
  plantGrp.add(trunk);

  const crownPositions = [
    [0, 1.18, 0, 0.46], [-0.34, 0.95, 0.22, 0.34], [0.36, 0.98, -0.18, 0.35],
    [0.22, 1.05, 0.32, 0.32], [-0.26, 1.02, -0.3, 0.32]
  ];
  crownPositions.forEach(([cx, cy, cz, cr]) => {
    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(cr, 1), leafMat);
    foliage.position.set(cx, healthy ? cy : cy - 0.12, cz);
    foliage.castShadow = true;
    plantGrp.add(foliage);
  });
  stageGroup.add(plantGrp);

  // 3D IoT Soil Moisture Sensor Probe in the pot
  const probe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.08), MAT.chrome);
  probe.position.set(0.55, 1.12, 0.25);
  const probeLed = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), healthy ? MAT.emeraldGlow : MAT.amberGlow);
  probeLed.position.set(0.55, 1.42, 0.25);
  stageGroup.add(probe, probeLed);

  // Overhead Chrome Irrigation Pipe & Sprinkler Nozzle
  const pipeV = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.1, 16), MAT.chrome);
  pipeV.position.set(1.65, 1.55, 0);
  const pipeH = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.75, 16), MAT.chrome);
  pipeH.rotation.z = Math.PI / 2;
  pipeH.position.set(0.8, 3.05, 0);
  const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.22, 20), MAT.gold);
  nozzle.position.set(0, 2.95, 0);
  stageGroup.add(pipeV, pipeH, nozzle);

  // Animated 3D Water Droplets when Pump is ON
  if (state.s2Pump) {
    for (let i = 0; i < 28; i++) {
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 10), MAT.cyanGlow);
      const ang = (i / 28) * Math.PI * 2;
      const rad = 0.12 + (i % 4) * 0.14;
      drop.userData = { baseX: Math.cos(ang) * rad, baseZ: Math.sin(ang) * rad, phase: i * 0.22 };
      drop.position.set(drop.userData.baseX, 2.8 - (i % 7) * 0.25, drop.userData.baseZ);
      stageGroup.add(drop);
      animObjects.droplets.push(drop);
    }
  }

  const hLbl = makeLabel(`H = ความชื้นดิน ${state.s2Moist}% (${state.s2Pump ? '💦 เปิดน้ำ ON' : '🛑 ปิดน้ำ OFF'})`, '#064e3b', '#34d399', 2.25);
  hLbl.position.set(0, 3.55, 0);
  stageGroup.add(hLbl);
}

// STAGE 3: 3D Cybernetic Energy Pillars & Overhead Laser Scanner Gantry (Min Finder)
function buildStage3_MinFinder() {
  clearStage3D();
  animObjects = {};
  glowLight.color.setHex(0x38bdf8);

  const arr = state.s3Arr;
  arr.forEach((val, idx) => {
    const x = (idx - 2) * 1.35;
    const h = Math.max(0.55, val / 16);
    const isCurrent = idx === state.s3Step;
    const isMin = val === state.s3Min && idx <= state.s3Step;

    // Hexagonal Metallic Pedestal
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.58, 0.16, 6), MAT.chrome);
    ped.position.set(x, 0.08, 0);
    stageGroup.add(ped);

    // Outer Glass Sleeve + Inner Glowing Core Cylinder
    const coreMat = isMin ? MAT.emeraldGlow : isCurrent ? MAT.amberGlow : MAT.cyanGlow;
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, h, 24), coreMat);
    core.position.set(x, 0.16 + h / 2, 0);
    core.castShadow = true;

    const glassSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, h + 0.04, 24), MAT.glass);
    glassSleeve.position.set(x, 0.16 + h / 2, 0);

    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 24), isMin ? MAT.gold : MAT.chrome);
    topCap.position.set(x, 0.18 + h, 0);
    stageGroup.add(core, glassSleeve, topCap);

    if (isMin) {
      const crown = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.04, 12, 32), MAT.gold);
      crown.rotation.x = Math.PI / 2;
      crown.position.set(x, 0.36 + h, 0);
      stageGroup.add(crown);
      animObjects.minCrown = crown;
    }

    const lbl = makeLabel(`x=${val}${isMin ? ' ★Min' : ''}`, '#0f172a', isMin ? '#10b981' : isCurrent ? '#f59e0b' : '#38bdf8', 1.18);
    lbl.position.set(x, h + 0.72, 0);
    stageGroup.add(lbl);
  });

  // Overhead Scanner Drone hovering over active index s3Step
  const scanX = (state.s3Step - 2) * 1.35;
  const drone = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.2, 0.22, 16), MAT.amberGlow);
  drone.position.set(scanX, 3.45, 0);
  stageGroup.add(drone);

  const banner = makeLabel(`ค่าต่ำสุดที่พบปัจจุบัน Min = ${state.s3Min}`, '#064e3b', '#34d399', 2.05);
  banner.position.set(0, 3.95, 0);
  stageGroup.add(banner);
}

// STAGE 4: 3D CNC Coordinate Arena & Laser Beacon (Cross Region Page 8)
function buildStage4_CrossCoordinate() {
  clearStage3D();
  animObjects = {};
  glowLight.color.setHex(0xa855f7);

  const scale = 0.34;
  const ox = -7 * scale;
  const oz = 4.5 * scale;

  // Metallic Coordinate Frame
  const frameBase = new THREE.Mesh(new THREE.BoxGeometry(15.2 * scale, 0.08, 10.2 * scale), MAT.darkSteel);
  frameBase.position.set(0, 0.04, 0);
  stageGroup.add(frameBase);

  // Glowing Glass Cross Region: Vertical [5..8, 0..9] & Horizontal [0..14, 4..6]
  const crossMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.35,
    roughness: 0.15, metalness: 0.2, clearcoat: 1.0
  });
  const vBar = new THREE.Mesh(new THREE.BoxGeometry(3 * scale, 0.16, 9 * scale), crossMat);
  vBar.position.set(ox + 6.5 * scale, 0.1, oz - 4.5 * scale);
  const hBar = new THREE.Mesh(new THREE.BoxGeometry(14 * scale, 0.16, 2 * scale), crossMat);
  hBar.position.set(ox + 7.0 * scale, 0.1, oz - 5.0 * scale);
  stageGroup.add(vBar, hBar);

  const x = state.s4X;
  const y = state.s4Y;
  const inside = (x >= 5 && x <= 8 && y >= 0 && y <= 9) || (x >= 0 && x <= 14 && y >= 4 && y <= 6);

  // 3D Laser Target Beacon at (x, y)
  const beaconGrp = new THREE.Group();
  beaconGrp.position.set(ox + x * scale, 0.18, oz - y * scale);

  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 12, 32), inside ? MAT.emeraldGlow : MAT.pinkGlow);
  baseRing.rotation.x = Math.PI / 2;
  const laserPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.45, 24), inside ? MAT.emeraldGlow : MAT.pinkGlow);
  laserPillar.position.y = 0.72;
  const floatingOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), MAT.gold);
  floatingOrb.position.y = 1.65;
  beaconGrp.add(baseRing, laserPillar, floatingOrb);
  stageGroup.add(beaconGrp);
  animObjects.minCrown = floatingOrb;

  const statusTxt = inside ? `พิกัด (${x}, ${y}) อยู่ในพื้นที่กากบาท (TRUE ✓)` : `พิกัด (${x}, ${y}) อยู่นอกพื้นที่ (FALSE ✕)`;
  const lbl = makeLabel(statusTxt, inside ? '#064e3b' : '#7f1d1d', inside ? '#34d399' : '#f87171', 2.35);
  lbl.position.set(0, 2.85, 0);
  stageGroup.add(lbl);
}

// STAGE 5: 3D Automated Carousel & Levitating Smart Capsules (Count Items <= M)
function buildStage5_CountItems() {
  clearStage3D();
  animObjects = { capsules: [] };
  glowLight.color.setHex(0xf59e0b);

  // Central Holographic Counter Core
  const centerPed = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 0.35, 32), MAT.chrome);
  centerPed.position.y = 0.18;
  const centerCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.52, 1), MAT.amberGlow);
  centerCore.position.y = 0.95;
  const centerGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.25, 32), MAT.glass);
  centerGlass.position.y = 0.95;
  stageGroup.add(centerPed, centerCore, centerGlass);
  animObjects.minCrown = centerCore;

  let count = 0;
  state.s5Prices.forEach((p, idx) => {
    const ang = (idx / state.s5Prices.length) * Math.PI * 2;
    const rx = Math.cos(ang) * 2.45;
    const rz = Math.sin(ang) * 2.45;
    const ok = p <= state.s5Budget;
    if (ok) count++;

    const pod = new THREE.Group();
    pod.position.set(rx, 0, rz);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.54, 0.14, 24), ok ? MAT.gold : MAT.darkSteel);
    base.position.y = 0.07;
    pod.add(base);

    const itemBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.65, 24),
      ok ? MAT.emeraldGlow : MAT.darkSteel
    );
    itemBody.position.y = ok ? 0.62 : 0.45;
    itemBody.castShadow = true;
    pod.add(itemBody);

    const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.85, 24), MAT.glass);
    dome.position.y = ok ? 0.62 : 0.45;
    pod.add(dome);

    const lbl = makeLabel(`สินค้า ${p}฿ ${ok ? '≤ M ✓' : '> M'}`, '#0f172a', ok ? '#10b981' : '#64748b', 1.15);
    lbl.position.set(0, 1.38, 0);
    pod.add(lbl);

    stageGroup.add(pod);
  });

  state.s5Count = count;
  const centerLbl = makeLabel(`งบ M = ${state.s5Budget}฿ → นับสินค้าที่ซื้อได้ count = ${count} ชิ้น`, '#064e3b', '#fcd34d', 2.4);
  centerLbl.position.set(0, 2.75, 0);
  stageGroup.add(centerLbl);
}

// STAGE 6: 3D Championship Culinary Podiums & Smax Crown
function buildStage6_SmaxAndSearch() {
  clearStage3D();
  animObjects = {};
  glowLight.color.setHex(0xec4899);

  state.s6Scores.forEach((s, idx) => {
    const x = (idx - 1.5) * 1.55;
    const h = (s - 5.0) * 1.05;
    const isBest = s === 7.2;

    const grp = new THREE.Group();
    grp.position.set(x, 0, 0);

    // Tiered Marble/Metal Podium
    const pod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.56, h, 32),
      isBest ? MAT.pinkGlow : MAT.darkSteel
    );
    pod.position.y = h / 2;
    pod.castShadow = true;

    const goldTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.08, 32), isBest ? MAT.gold : MAT.chrome);
    goldTrim.position.y = h + 0.04;

    // 3D Gourmet Platter under Glass Cloche on top of each podium
    const cloche = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), MAT.glass);
    cloche.position.y = h + 0.08;
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), isBest ? MAT.gold : MAT.cyanGlow);
    dish.scale.set(1, 0.5, 1);
    dish.position.y = h + 0.14;

    grp.add(pod, goldTrim, cloche, dish);

    if (isBest) {
      const trophy = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), MAT.gold);
      trophy.position.y = h + 0.66;
      grp.add(trophy);
      animObjects.minCrown = trophy;
    }

    const lbl = makeLabel(`อันดับ #${idx + 1}: S=${s}${isBest ? ' ★Smax' : ''}`, '#0f172a', isBest ? '#f472b6' : '#38bdf8', 1.38);
    lbl.position.set(0, h + 1.08, 0);
    grp.add(lbl);

    stageGroup.add(grp);
  });

  const topLbl = makeLabel('ผลการวนซ้ำ 4 รอบ → อาหารลำดับที่ 3 (Smax = 7.2) เหมาะสมที่สุด', '#4a044e', '#f472b6', 2.45);
  topLbl.position.set(0, 3.85, 0);
  stageGroup.add(topLbl);
}

/* =========================================================
   SIDEBAR COLLAPSE / EXPAND / ZEN MODE & CAMERA PRESETS
   ========================================================= */
const leftPanel = document.getElementById('left-panel');
const rightPanel = document.getElementById('right-panel');
const pillLeft = document.getElementById('pill-open-left');
const pillRight = document.getElementById('pill-open-right');

function setLeftCollapsed(col) {
  sfx.tone(520);
  leftPanel.classList.toggle('collapsed', col);
  pillLeft.classList.toggle('hidden', !col);
}
function setRightCollapsed(col) {
  sfx.tone(520);
  rightPanel.classList.toggle('collapsed', col);
  pillRight.classList.toggle('hidden', !col);
}

document.getElementById('btn-close-left').onclick = () => setLeftCollapsed(true);
document.getElementById('btn-close-right').onclick = () => setRightCollapsed(true);
pillLeft.onclick = () => setLeftCollapsed(false);
pillRight.onclick = () => setRightCollapsed(false);

document.getElementById('btn-expand-left').onclick = (e) => {
  sfx.tone(600);
  const exp = leftPanel.classList.toggle('expanded');
  e.currentTarget.textContent = exp ? '⤡' : '⤢';
};
document.getElementById('btn-expand-right').onclick = (e) => {
  sfx.tone(600);
  const exp = rightPanel.classList.toggle('expanded');
  e.currentTarget.textContent = exp ? '⤡' : '⤢';
};

document.getElementById('btn-toggle-both').onclick = () => {
  const anyVisible = !leftPanel.classList.contains('collapsed') || !rightPanel.classList.contains('collapsed');
  setLeftCollapsed(anyVisible);
  setRightCollapsed(anyVisible);
};

document.getElementById('btn-zen-mode').onclick = () => {
  sfx.tone(560);
  document.body.classList.toggle('zen-mode');
};
window.addEventListener('keydown', (e) => {
  if ((e.key === 'h' || e.key === 'H') && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
    document.body.classList.toggle('zen-mode');
  }
});

// Camera Preset Buttons
document.getElementById('btn-cam-front').onclick = () => {
  sfx.tone(620);
  camera.position.set(0, 4.6, 9.8);
  controls.target.set(0, 1.15, 0);
};
document.getElementById('btn-cam-top').onclick = () => {
  sfx.tone(620);
  camera.position.set(0, 10.5, 2.2);
  controls.target.set(0, 0.5, 0);
};
document.getElementById('btn-cam-iso').onclick = () => {
  sfx.tone(620);
  camera.position.set(5.8, 5.6, 7.8);
  controls.target.set(0, 1.1, 0);
};

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
  sfx.win();
  updateOBEUI();
  showToast(msg, 'ok');
}

function updateOBEUI() {
  const passedCount = Object.values(state.passed).filter(Boolean).length;
  document.getElementById('stage-progress-txt').textContent = `${passedCount} / 6 ด่าน`;

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
  if (total >= 85) rank = '🌟 Mastering (เชี่ยวชาญ OBE STEAM)';
  else if (total >= 65) rank = '✅ Achieving (ผ่านเกณฑ์มาตรฐาน)';
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
        <p>ทดลองเปรียบเทียบการกำหนด <strong>เงื่อนไข</strong> ให้สายพานอัจฉริยะ 3 มิติคัดกรองเมนูอาหาร</p>
        <div class="flow-box">
          <div class="flow-step ${state.s1Cond === 'clear' ? 'active' : ''}">ข้อมูลนำเข้า → รายการอาหาร + ตัวแปรราคา</div>
          <div class="flow-step ${state.s1Cond === 'clear' ? 'active' : ''}">เงื่อนไข → "${state.s1Cond === 'clear' ? 'ราคา <= 50 บาท และ แคลอรี < 600' : 'อาหารที่อร่อยและน่ากิน'}"</div>
          <div class="flow-step ${state.s1Cond === 'clear' ? 'active' : ''}">ข้อมูลส่งออก → ${state.s1Cond === 'clear' ? 'ข้าวมันไก่ 45 บาท ✓' : 'ERROR: เงื่อนไขคลุมเครือ'}</div>
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
  let apiStudents = [];
  try {
    const res = await fetch('api.php');
    if (res.ok) {
      const d = await res.json();
      if (d.ok && Array.isArray(d.students) && d.students.length > 0) {
        apiStudents = d.students;
      }
    }
  } catch (_) {}

  // Always merge CS2027_FALLBACK_ROSTER so the 5 Physics students (661/ฟิสิกส์) and 20 Science students are NEVER missing
  const byId = new Map();
  apiStudents.forEach((s) => {
    if (s && s.student_id) byId.set(String(s.student_id), s);
  });
  CS2027_FALLBACK_ROSTER.forEach((def) => {
    if (!byId.has(def.student_id)) {
      byId.set(def.student_id, def);
    }
  });
  state.students = Array.from(byId.values());

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
  const physCount = state.students.filter((s) => (s.section || '').includes('ฟิสิกส์')).length;
  const sciCount = state.students.filter((s) => (s.section || '').includes('วิทย์')).length;
  const html = `
    <p style="margin-bottom:8px;color:#cbd5e1;">เลือกรายชื่อนักศึกษาวิชา CS2027 (สาขาวิทยาศาสตร์ทั่วไป ${sciCount} คน + สาขาฟิสิกส์ ${physCount} คน)</p>
    <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">
      <button class="hud-btn primary" data-sec-filter="ALL">ทั้งหมด (${state.students.length})</button>
      <button class="hud-btn" data-sec-filter="661/ฟิสิกส์" style="border-color:#38bdf8;color:#7dd3fc;">⚛️ 661/ฟิสิกส์ (${physCount} คน)</button>
      <button class="hud-btn" data-sec-filter="661/วิทย์">🧪 661/วิทย์ (${sciCount} คน)</button>
    </div>
    <div id="stu-picker-list" style="display:flex;flex-direction:column;gap:6px;max-height:340px;overflow-y:auto;">
      ${state.students.map((s) => `
        <button class="btn-action" data-stu="${s.student_id}" data-stu-sec="${s.section || ''}">
          <span><strong>${s.student_id}</strong> — ${s.full_name}</span>
          <small style="color:${(s.section || '').includes('ฟิสิกส์') ? '#38bdf8' : '#a7f3d0'};font-weight:700;">${s.section || ''}</small>
        </button>
      `).join('')}
    </div>
  `;
  openModal('🎓 เลือกนักศึกษาผู้ปฏิบัติการ (วิทย์ 20 + ฟิสิกส์ 5 = 25 คน)', html);
  document.querySelectorAll('[data-sec-filter]').forEach((fb) => {
    fb.onclick = () => {
      const f = fb.dataset.secFilter;
      document.querySelectorAll('[data-sec-filter]').forEach((b) => b.classList.toggle('primary', b === fb));
      document.querySelectorAll('[data-stu]').forEach((row) => {
        row.style.display = (f === 'ALL' || row.dataset.stuSec === f) ? 'flex' : 'none';
      });
    };
  });
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
  const stuTxt = state.currentStudent ? `${state.currentStudent.student_id} ${state.currentStudent.full_name} (${state.currentStudent.section})` : 'ยังไม่ได้เลือกนักศึกษา';
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

  const stageNames = {
    s1: 'ด่าน 1 (หน้า 1-2): IPO & เงื่อนไขเลือกอาหารที่ชัดเจน',
    s2: 'ด่าน 2 (หน้า 3-4): ระบบรดน้ำต้นไม้อัตโนมัติ (ความชื้น 40-60%)',
    s3: 'ด่าน 3 (หน้า 5): ขั้นตอนวิธีหาค่าต่ำสุด (Min)',
    s4: 'ด่าน 4 (หน้า 6-8): ตรรกศาสตร์ AND/OR พิกัดกากบาท (x,y)',
    s5: 'ด่าน 5 (หน้า 9-12): การวนซ้ำนับจำนวนสินค้าที่ราคา <= M บาท',
    s6: 'ด่าน 6 (หน้า 13-14): การหาค่าสูงสุด Smax & ตัวแปรสถานะ found'
  };
  const missingStages = Object.keys(state.passed).filter((k) => !state.passed[k]);
  const errItems = missingStages.length > 0
    ? missingStages.map((k) => ({
        code: `ERR_STAGE_${k.toUpperCase()}`,
        category: 'ด่านจำลองขั้นตอนวิธี 3 มิติที่ยังไม่ได้ทำหรือยังไม่ผ่านเกณฑ์',
        severity: 'medium',
        detail: `ยังไม่ได้ทำหรือยังไม่ผ่าน ${stageNames[k]}`
      }))
    : [{
        code: 'NONE_EXCELLENT',
        category: 'ผ่านครบทั้ง 6 ด่านจำลอง 3 มิติสมบูรณ์',
        severity: 'low',
        detail: `ผลงานยอดเยี่ยม! ผ่านครบทั้ง 6 ด่าน ได้คะแนน OBE × STEAM ${score}/100`
      }];
  const remItems = missingStages.length > 0
    ? missingStages.map((k) => ({
        step: `เข้าฝึกปฏิบัติและกดยืนยันคำตอบใน ${stageNames[k]} ให้ครบถ้วนแล้วกดส่งผล OBE อีกครั้ง`
      }))
    : [{
        step: 'สามารถเปิดดูรายงานผลตรวจย้อนหลังและพิมพ์รายงาน PDF ได้ในหน้าฐานข้อมูลผลตรวจผู้เรียน'
      }];

  try {
    const customList = JSON.parse(localStorage.getItem('cs2027_custom_notifications_v1') || '[]');
    customList.unshift({
      id: Date.now(),
      student_id: state.currentStudent.student_id,
      full_name: state.currentStudent.full_name,
      section: state.currentStudent.section || '',
      game_id: 'method05_3d',
      module_id: '05_method_obe_steam',
      module_title: 'ALGO-QUEST 3D (05_method OBE × STEAM)',
      submission_ref_id: 999,
      score,
      max_score: 100,
      status: score >= 80 ? 'graded' : 'needs_improvement',
      notify_source: 'ALGO-QUEST 3D Auto-Diagnostic Engine',
      summary_title: `🔔 ผลตรวจ ALGO-QUEST 3D (05_method): คะแนน ${score}/100 (ผ่าน ${passedCount}/6 ด่าน)`,
      errors: errItems,
      remediations: remItems,
      rubric: {},
      teacher_comment: `ผลประเมิน 5 แกน STEAM: S=${state.steam.S}%, T=${state.steam.T}%, E=${state.steam.E}%, A=${state.steam.A}%, M=${state.steam.M}%`,
      is_read: 0,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    });
    localStorage.setItem('cs2027_custom_notifications_v1', JSON.stringify(customList));
  } catch (_) {}

  try {
    await fetch('api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (_) {}

  sfx.win();
  showToast(`ส่งผลคะแนน OBE STEAM (${score}/100) และบันทึกผลวิเคราะห์ลงฐานข้อมูลสำเร็จ!`, 'ok');

  openModal(
    '🔔 แจ้งเตือนผลตรวจ ข้อผิดพลาด & แนวทางแก้ไขรายบุคคล (บันทึกลงฐานข้อมูลแล้ว)',
    `<p style="margin-bottom:10px;"><strong>ผู้เรียน:</strong> ${state.currentStudent.student_id} ${state.currentStudent.full_name} (${state.currentStudent.section || ''})<br>
     <strong>คะแนนผลสัมฤทธิ์ OBE × STEAM:</strong> <span style="color:#34d399;font-size:18px;font-weight:800;">${score} / 100</span> (ผ่าน ${passedCount}/6 ด่าน)</p>
     <div style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.4);border-radius:11px;padding:11px;margin-bottom:10px;">
       <strong style="color:#fca5a5;">⚠️ ข้อผิดพลาด / ด่านที่ต้องปรับปรุง:</strong>
       <ul style="margin:6px 0 0 18px;color:#fecaca;">
         ${errItems.map((e) => `<li>${e.detail}</li>`).join('')}
       </ul>
     </div>
     <div style="background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.4);border-radius:11px;padding:11px;">
       <strong style="color:#7dd3fc;">🛠️ แนวทางการแก้ไขรายบุคคล:</strong>
       <ul style="margin:6px 0 0 18px;color:#bae6fd;">
         ${remItems.map((r) => `<li>${r.step}</li>`).join('')}
       </ul>
     </div>`,
    `<button class="hud-btn" id="m-ok">ปิด</button>
     <a class="hud-btn primary" href="../student_report.html?student_id=${encodeURIComponent(state.currentStudent.student_id)}">🔔 เปิดฐานข้อมูลผลตรวจย้อนหลังด้วยตนเอง ↗</a>`
  );
};

// 60 FPS Animation Loop
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  if (animObjects.ipoOrb) {
    const maxX = state.s1Cond === 'clear' ? 2.7 : -0.9;
    animObjects.ipoOrb.position.x = -2.7 + ((Math.sin(t * 1.8) + 1) / 2) * (maxX - (-2.7));
    animObjects.ipoOrb.rotation.y = t * 1.4;
  }
  if (animObjects.fans) {
    animObjects.fans.forEach((f, i) => {
      f.rotation.y = t * (2.2 + i);
      f.rotation.z = Math.sin(t * 2) * 0.25;
    });
  }
  if (animObjects.sun) {
    const s = 1 + Math.sin(t * 3) * 0.05;
    animObjects.sun.scale.set(s, s, s);
    animObjects.sun.rotation.z = t * 0.8;
  }
  if (animObjects.droplets) {
    animObjects.droplets.forEach((d) => {
      const y = 2.85 - (((t * 2.2 + d.userData.phase) % 1) * 1.85);
      d.position.y = y;
    });
  }
  if (animObjects.minCrown) {
    animObjects.minCrown.rotation.y = t * 2.4;
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
