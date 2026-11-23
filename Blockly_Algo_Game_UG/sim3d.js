// 3D Simulator Engine (Three.js) synced with Blockly/Flowchart execution trace

(function () {
  let scene, camera, renderer, animId;
  let dynamicGroup = null;
  let playTimer = null;
  let lastTrace = [];
  let lastLevel = null;
  let isPlaying = false;

  function initThree(container) {
    if (typeof THREE === 'undefined') {
      container.innerHTML = '<div class="muted" style="padding:14px;text-align:center;">ไม่สามารถโหลด Three.js CDN ได้ (ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต)</div>';
      return false;
    }

    if (renderer) return true;

    const w = container.clientWidth || 320;
    const h = container.clientHeight || 220;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070d1a);

    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 6.5, 11.5);
    camera.lookAt(0, 1.2, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0x93c5fd, 1.1);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // Sci-fi Grid Floor
    const grid = new THREE.GridHelper(16, 16, 0x3b82f6, 0x1e293b);
    scene.add(grid);

    dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);

    // Gentle camera orbit sway
    let t = 0;
    function animate() {
      animId = requestAnimationFrame(animate);
      t += 0.008;
      if (camera) {
        camera.position.x = Math.sin(t * 0.5) * 1.1;
        camera.lookAt(0, 1.2, 0);
      }
      renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    const ro = new ResizeObserver(() => {
      if (!renderer || !camera) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      if (nw > 20 && nh > 20) {
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      }
    });
    ro.observe(container);
    return true;
  }

  function clearDynamic() {
    if (!dynamicGroup) return;
    while (dynamicGroup.children.length > 0) {
      const obj = dynamicGroup.children[0];
      dynamicGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }
  }

  function renderFrame(level, frame) {
    if (!dynamicGroup) return;
    clearDynamic();

    const statusEl = document.getElementById('sim3d-status');
    if (statusEl && frame.label) {
      statusEl.textContent = frame.label;
    }

    // Mode 1: Array Levels (3D Bar Pillars)
    if (level.hasArrayViz && Array.isArray(frame.list)) {
      const arr = frame.list;
      const n = arr.length || 1;
      const maxAbs = Math.max(10, ...arr.map((v) => Math.abs(v)));
      const span = Math.min(10, n * 0.85);
      const stepX = span / n;
      const barW = Math.max(0.22, stepX * 0.72);

      arr.forEach((val, idx) => {
        const h = Math.max(0.25, (Math.abs(val) / maxAbs) * 3.8);
        const geo = new THREE.BoxGeometry(barW, h, barW);

        let color = val < 0 ? 0xf43f5e : 0x3b82f6;
        if (frame.swapPair && (idx + 1 === frame.swapPair[0] || idx + 1 === frame.swapPair[1])) {
          color = 0xf59e0b; // Swapping
        } else if (idx + 1 === frame.activeIndex) {
          color = 0x38bdf8; // Active pointer
        } else if (frame.type === 'end') {
          color = 0x10b981; // Completed
        }

        const mat = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.35,
          metalness: 0.25,
          emissive: idx + 1 === frame.activeIndex ? 0x0284c7 : 0x000000,
          emissiveIntensity: 0.5
        });
        const mesh = new THREE.Mesh(geo, mat);
        const x = -span / 2 + stepX * (idx + 0.5);
        const yLift = idx + 1 === frame.activeIndex ? 0.25 : 0;
        mesh.position.set(x, h / 2 + yLift, 0);
        dynamicGroup.add(mesh);
      });
      return;
    }

    // Mode 2: Zoo Height Gate
    if (level.id === 'zoo') {
      const height = Number(frame.height ?? 100);
      const gateY = 2.0; // Represents 100 cm
      const gateGeo = new THREE.BoxGeometry(4.6, 0.1, 0.15);
      const isDiscount = height < 100;
      const gateMat = new THREE.MeshStandardMaterial({
        color: isDiscount ? 0x10b981 : 0xf59e0b,
        emissive: isDiscount ? 0x059669 : 0xd97706,
        emissiveIntensity: 0.6
      });
      const gate = new THREE.Mesh(gateGeo, gateMat);
      gate.position.set(0, gateY, 0);
      dynamicGroup.add(gate);

      const pH = Math.max(0.2, (height / 100) * gateY);
      const person = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.55, pH, 16),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 })
      );
      person.position.set(0, pH / 2, 0);
      dynamicGroup.add(person);
      return;
    }

    // Mode 3: Plant Moisture Growth
    if (level.id === 'plant') {
      const m = Math.min(100, Math.max(0, Number(frame.moisture ?? 20)));
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.65, 1.0, 16),
        new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 })
      );
      pot.position.set(0, 0.5, 0);
      dynamicGroup.add(pot);

      const stemH = 0.6 + (m / 100) * 2.4;
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, stemH, 12),
        new THREE.MeshStandardMaterial({ color: m >= 60 ? 0x10b981 : 0x84cc16 })
      );
      stem.position.set(0, 1.0 + stemH / 2, 0);
      dynamicGroup.add(stem);

      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(0.45 + (m / 100) * 0.55, 16, 16),
        new THREE.MeshStandardMaterial({ color: m >= 60 ? 0x22c55e : 0xa3e635, roughness: 0.4 })
      );
      crown.position.set(0, 1.0 + stemH, 0);
      dynamicGroup.add(crown);

      if (frame.type === 'water') {
        for (let d = 0; d < 5; d++) {
          const drop = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7 })
          );
          drop.position.set((d - 2) * 0.35, 3.8 - (d % 2) * 0.4, 0);
          dynamicGroup.add(drop);
        }
      }
      return;
    }

    // Mode 4: Binary Search Range (guess)
    if (level.id === 'guess') {
      const track = new THREE.Mesh(
        new THREE.BoxGeometry(9, 0.18, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x334155 })
      );
      track.position.set(0, 0.1, 0);
      dynamicGroup.add(track);

      const gNum = frame.guessNum || 500;
      const xPos = ((gNum - 1) / 999) * 8.4 - 4.2;
      const isCorrect = frame.guessRes === 'ถูกต้อง';
      const beacon = new THREE.Mesh(
        new THREE.ConeGeometry(0.4, 1.6, 16),
        new THREE.MeshStandardMaterial({
          color: isCorrect ? 0x10b981 : 0xf59e0b,
          emissive: isCorrect ? 0x059669 : 0xb45309,
          emissiveIntensity: 0.6
        })
      );
      beacon.position.set(xPos, 1.1, 0);
      dynamicGroup.add(beacon);
    }
  }

  window.Sim3D = {
    init(level, inputs) {
      const container = document.getElementById('sim3d-canvas');
      if (!container) return;
      if (!initThree(container)) return;
      lastLevel = level;
      renderFrame(level, {
        type: 'init',
        list: inputs ? inputs.list : [],
        height: inputs ? inputs.height : 100,
        moisture: inputs ? inputs.moisture : 20,
        label: 'พร้อมจำลอง 3D (กด ⚡ ทดลองรัน เพื่อดูการทำงาน)'
      });
    },
    playTrace(level, traceEvents) {
      const container = document.getElementById('sim3d-canvas');
      if (!container || !initThree(container)) return;
      if (playTimer) clearInterval(playTimer);

      lastLevel = level;
      lastTrace = traceEvents || [];
      if (lastTrace.length === 0) return;

      isPlaying = true;
      let idx = 0;
      renderFrame(level, lastTrace[0]);

      playTimer = setInterval(() => {
        idx++;
        if (idx >= lastTrace.length) {
          clearInterval(playTimer);
          playTimer = null;
          isPlaying = false;
          return;
        }
        renderFrame(level, lastTrace[idx]);
      }, 320);
    },
    replay() {
      if (lastLevel && lastTrace.length > 0) {
        this.playTrace(lastLevel, lastTrace);
      }
    }
  };
})();
