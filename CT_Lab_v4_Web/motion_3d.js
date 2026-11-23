/**
 * CT-Lab v4.0 — 60 FPS 3D Motion Engine (Rossark-Motion Principles) & 3D House Viewer
 * 1) Single Shared Scene Clock (requestAnimationFrame)
 * 2) 3D Perspective Tilt + Follow-Through Gloss Sheen on Pixar Cards
 * 3) Zero-dependency Interactive 3D Rotatable House Viewer (Module 03)
 */
(function () {
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function attach3DTilt(el) {
    if (!el || el.dataset.tiltAttached) return;
    el.dataset.tiltAttached = '1';

    const cover = el.querySelector('.pixar-card-cover, .howto-img');
    if (cover && !cover.querySelector('.pixar-sheen')) {
      const sheen = document.createElement('div');
      sheen.className = 'pixar-sheen';
      cover.appendChild(sheen);
    }

    function updateTilt(clientX, clientY) {
      if (reducedMotion) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = (clientX - rect.left) / rect.width - 0.5;
      const ny = (clientY - rect.top) / rect.height - 0.5;
      const rx = (-ny * 9).toFixed(2);
      const ry = (nx * 9).toFixed(2);
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(4px)`;
      if (cover) {
        cover.style.setProperty('--sx', `${((nx + 0.5) * 100).toFixed(1)}%`);
        cover.style.setProperty('--sy', `${((ny + 0.5) * 100).toFixed(1)}%`);
      }
    }

    function resetTilt() {
      el.style.transform = '';
    }

    el.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse') updateTilt(e.clientX, e.clientY);
    });
    el.addEventListener('pointerleave', resetTilt);
  }

  function initSharedClock() {
    if (reducedMotion) return;
    const floats = Array.from(document.querySelectorAll('.hero-float, .hero-core'));
    let start = null;

    function tick(ts) {
      if (!start) start = ts;
      const t = (ts - start) * 0.001;
      if (!document.hidden) {
        floats.forEach((node, idx) => {
          const phase = t * 1.8 + idx * 1.1;
          const dy = Math.sin(phase) * 5.5;
          const rot = node.classList.contains('hero-core')
            ? -10 + Math.sin(t * 1.1) * 2.5
            : (idx === 0 ? -9 : 8) + Math.cos(phase * 0.8) * 2;
          node.style.transform = `translateY(${dy.toFixed(2)}px) rotate(${rot.toFixed(2)}deg)`;
        });
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Interactive 3D House Viewer for Module 03 (parses RECT & LINE from #house-code)
  function init3DHouseViewer() {
    const housePage = document.querySelector('.page[data-page="house"] .lab-primary');
    const codeEl = document.getElementById('house-code');
    if (!housePage || !codeEl || document.getElementById('house-3d-canvas')) return;

    const panel = document.createElement('div');
    panel.className = 'panel house-3d-panel';
    panel.innerHTML = `
      <div class="panel-top">
        <div>
          <h2>🧊 มุมมองบ้าน 3 มิติ (หมุนดู 360°)</h2>
          <span>จำลองโครงสร้างบ้านจากคำสั่งพิกัดของคุณเป็นโมเดล 3 มิติแบบเรียลไทม์</span>
        </div>
        <button type="button" class="btn btn-small btn-outline" id="house-3d-spin">⏸ หยุดหมุนอัตโนมัติ</button>
      </div>
      <div class="house-3d-canvas-wrap">
        <canvas id="house-3d-canvas" width="760" height="320"></canvas>
        <div class="house-3d-hint">👆 ลากนิ้วหรือเมาส์เพื่อหมุนดูบ้าน 3 มิติ</div>
      </div>
    `;
    housePage.appendChild(panel);

    const canvas = document.getElementById('house-3d-canvas');
    const ctx = canvas.getContext('2d');
    const spinBtn = document.getElementById('house-3d-spin');

    let yaw = 0.55;
    let pitch = 0.36;
    let autoSpin = !reducedMotion;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    spinBtn.textContent = autoSpin ? '⏸ หยุดหมุนอัตโนมัติ' : '▶ หมุนอัตโนมัติ';
    spinBtn.addEventListener('click', () => {
      autoSpin = !autoSpin;
      spinBtn.textContent = autoSpin ? '⏸ หยุดหมุนอัตโนมัติ' : '▶ หมุนอัตโนมัติ';
    });

    canvas.addEventListener('pointerdown', (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      yaw += (e.clientX - lastX) * 0.01;
      pitch = Math.max(-0.2, Math.min(1.1, pitch + (e.clientY - lastY) * 0.008));
      lastX = e.clientX;
      lastY = e.clientY;
    });
    canvas.addEventListener('pointerup', () => { dragging = false; });
    canvas.addEventListener('pointercancel', () => { dragging = false; });

    function parseCommands() {
      const lines = (codeEl.value || '').split(/\r?\n/);
      const edges = [];
      lines.forEach((raw) => {
        const clean = raw.split('#')[0].trim();
        if (!clean) return;
        const parts = clean.split(/\s+/);
        const cmd = (parts[0] || '').toUpperCase();
        const nums = parts.slice(1).map(Number);
        if (nums.some((n) => !Number.isFinite(n))) return;

        if (cmd === 'RECT' && nums.length >= 4) {
          const [x1, y1, x2, y2] = nums;
          // 3D Extrusion: วาดกรอบหน้า (z=-2) และกรอบหลัง (z=+2) พร้อมเส้นเชื่อมความลึก
          const zF = -2.2, zB = 2.2;
          const front = [[x1, y1, zF], [x2, y1, zF], [x2, y2, zF], [x1, y2, zF]];
          const back = [[x1, y1, zB], [x2, y1, zB], [x2, y2, zB], [x1, y2, zB]];
          for (let i = 0; i < 4; i++) {
            edges.push([front[i], front[(i + 1) % 4], '#2563eb', 2.4]);
            edges.push([back[i], back[(i + 1) % 4], '#60a5fa', 1.6]);
            edges.push([front[i], back[i], '#93c5fd', 1.4]);
          }
        } else if (cmd === 'LINE' && nums.length >= 4) {
          const [x1, y1, x2, y2] = nums;
          const zF = -2.2, zB = 2.2;
          edges.push([[x1, y1, zF], [x2, y2, zF], '#e11d48', 2.6]);
          edges.push([[x1, y1, zB], [x2, y2, zB], '#fb7185', 1.8]);
          edges.push([[x1, y1, zF], [x1, y1, zB], '#fda4af', 1.4]);
          edges.push([[x2, y2, zF], [x2, y2, zB], '#fda4af', 1.4]);
        }
      });
      return edges;
    }

    function project(pt, w, h) {
      // Center around (7, 4.5, 0)
      const cx = pt[0] - 7;
      const cy = -(pt[1] - 4.5);
      const cz = pt[2];

      const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
      const x1 = cx * cosY - cz * sinY;
      const z1 = cx * sinY + cz * cosY;

      const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
      const y2 = cy * cosP - z1 * sinP;
      const z2 = cy * sinP + z1 * cosP;

      const scale = 340 / (16 + z2);
      return [w / 2 + x1 * scale, h / 2 + y2 * scale, z2];
    }

    function render3D() {
      const houseSec = document.querySelector('.page[data-page="house"]');
      if (houseSec && houseSec.classList.contains('active')) {
        if (autoSpin && !dragging) yaw += 0.008;

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // 3D Base Grid Floor (y = 0)
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.22)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx <= 14; gx += 2) {
          const a = project([gx, 0, -4], w, h);
          const b = project([gx, 0, 4], w, h);
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        }
        for (let gz = -4; gz <= 4; gz += 2) {
          const a = project([0, 0, gz], w, h);
          const b = project([14, 0, gz], w, h);
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        }

        const edges = parseCommands();
        edges.forEach(([p1, p2, color, lw]) => {
          const a = project(p1, w, h);
          const b = project(p2, w, h);
          ctx.strokeStyle = color;
          ctx.lineWidth = lw;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
          ctx.stroke();
        });
      }
      requestAnimationFrame(render3D);
    }
    requestAnimationFrame(render3D);
  }

  function init() {
    document.querySelectorAll('.module-card, .howto-banner').forEach(attach3DTilt);
    initSharedClock();
    init3DHouseViewer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Run after guide_pixar.js has injected cards/banners
    setTimeout(init, 60);
  }
})();
