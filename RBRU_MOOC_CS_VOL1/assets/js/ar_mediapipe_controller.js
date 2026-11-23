/**
 * RBRU MOOC Course Builder - AR MediaPipe Hands Controller
 * Multi-Modal 60 FPS Controller with Zero-External Asset Web Audio Synthesizer
 * Author: Assistant Professor Dr. Chewa Thassana
 * Rambhai Barni Rajabhat University (RBRU)
 */

class ARMediaPipeController {
  constructor(options = {}) {
    this.options = Object.assign({
      containerId: 'ar-controller-root',
      videoWidth: 200,
      videoHeight: 150,
      pinchThreshold: 0.075,
      swipeThreshold: 0.25,
      autoStart: false,
      onHandMove: null,
      onPinch: null,
      onPinchRelease: null,
      onSwipe: null,
      onLandmarks: null
    }, options);

    this.isActive = false;
    this.camera = null;
    this.hands = null;
    this.audioCtx = null;
    this.isPinching = false;
    this.lastPinchState = false;
    this.lastHandPos = { x: 0.5, y: 0.5 };
    this.prevPositions = [];
    this.lastSwipeTime = 0;

    this.initAudio();
    this.createUI();
    if (this.options.autoStart) {
      this.start();
    }
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn('[AR Controller] Web Audio API not supported', e);
    }
  }

  playSynth(type = 'pinch') {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    if (type === 'pinch') {
      // 880 Hz Triangle Wave (40 ms)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.start(t);
      osc.stop(t + 0.04);
    } else if (type === 'action') {
      // 1200 Hz Sine Wave (100 ms)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
    } else if (type === 'swipe') {
      // 440 Hz Sine Wave (150 ms)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.15);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.15);
    } else if (type === 'laser') {
      // 1760 Hz Sawtooth Wave (200 ms)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1760, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.2);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  }

  createUI() {
    let root = document.getElementById(this.options.containerId);
    if (!root) {
      root = document.createElement('div');
      root.id = this.options.containerId;
      document.body.appendChild(root);
    }

    root.innerHTML = `
      <div id="ar-pip-panel" style="
        position: fixed; bottom: 20px; right: 20px; z-index: 99999;
        background: rgba(10, 15, 29, 0.9); backdrop-filter: blur(12px);
        border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 14px;
        padding: 8px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
        font-family: 'Sarabun', sans-serif; color: #f1f5f9; display: flex; flex-direction: column; align-items: center;
        transition: all 0.3s ease;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 6px; padding: 0 4px;">
          <span style="font-size: 0.78rem; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 4px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10b981;" id="ar-status-dot"></span>
            AR Hand Control
          </span>
          <button id="ar-toggle-btn" style="
            background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; color: #38bdf8;
            border-radius: 6px; font-size: 0.72rem; padding: 2px 8px; cursor: pointer;
          ">เปิดกล้อง</button>
        </div>
        <div style="position: relative; width: ${this.options.videoWidth}px; height: ${this.options.videoHeight}px; border-radius: 8px; overflow: hidden; background: #000;">
          <video id="ar-webcam-video" style="width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1);" playsinline></video>
          <canvas id="ar-overlay-canvas" width="${this.options.videoWidth}" height="${this.options.videoHeight}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: scaleX(-1); pointer-events: none;"></canvas>
          <div id="ar-hud-gesture" style="
            position: absolute; bottom: 6px; left: 6px; font-size: 0.7rem; font-weight: bold;
            background: rgba(0,0,0,0.7); padding: 2px 6px; border-radius: 4px; color: #fde047;
          ">รอตรวจจับมือ...</div>
        </div>
        <div style="margin-top: 6px; font-size: 0.68rem; color: #94a3b8; text-align: center;">
          ☝️ ชี้พิกัด • 🤏 จีบนิ้วคลิก • 🖐️ ปัดเปลี่ยนหน้า
        </div>
      </div>
    `;

    document.getElementById('ar-toggle-btn').addEventListener('click', () => {
      if (this.isActive) {
        this.stop();
      } else {
        this.start();
      }
    });
  }

  async start() {
    const video = document.getElementById('ar-webcam-video');
    const hud = document.getElementById('ar-hud-gesture');
    const dot = document.getElementById('ar-status-dot');
    const toggleBtn = document.getElementById('ar-toggle-btn');

    if (!window.Hands || !window.Camera) {
      hud.textContent = 'กำลังโหลด AI Model...';
      await this.loadMediaPipeScripts();
    }

    try {
      this.hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
      });

      this.hands.onResults((results) => this.processResults(results));

      this.camera = new window.Camera(video, {
        onFrame: async () => {
          if (this.isActive) {
            await this.hands.send({ image: video });
          }
        },
        width: this.options.videoWidth,
        height: this.options.videoHeight
      });

      await this.camera.start();
      this.isActive = true;
      dot.style.background = '#38bdf8';
      toggleBtn.textContent = 'ปิดกล้อง';
      hud.textContent = 'พร้อมตรวจจับมือ ✅';
      this.playSynth('action');
    } catch (err) {
      console.error('[AR Controller] Camera error:', err);
      hud.textContent = 'ไม่สามารถเปิดกล้องได้';
      dot.style.background = '#ef4444';
    }
  }

  stop() {
    if (this.camera) {
      this.camera.stop();
    }
    this.isActive = false;
    const dot = document.getElementById('ar-status-dot');
    const toggleBtn = document.getElementById('ar-toggle-btn');
    const hud = document.getElementById('ar-hud-gesture');
    if (dot) dot.style.background = '#64748b';
    if (toggleBtn) toggleBtn.textContent = 'เปิดกล้อง';
    if (hud) hud.textContent = 'ปิดการทำงาน';
  }

  processResults(results) {
    const canvas = document.getElementById('ar-overlay-canvas');
    const ctx = canvas.getContext('2d');
    const hud = document.getElementById('ar-hud-gesture');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      hud.textContent = 'ไม่พบมือ';
      if (this.isPinching) {
        this.isPinching = false;
        if (this.options.onPinchRelease) this.options.onPinchRelease();
      }
      return;
    }

    const landmarks = results.multiHandLandmarks[0];
    this.drawSkeleton(ctx, landmarks, canvas.width, canvas.height);

    // Track Index Tip (Landmark 8) and Thumb Tip (Landmark 4)
    const indexTip = landmarks[8];
    const thumbTip = landmarks[4];

    // Normalized X, Y (Mirrored X for intuitive user experience)
    const normX = 1.0 - indexTip.x;
    const normY = indexTip.y;
    this.lastHandPos = { x: normX, y: normY };

    // Pinch Calculation (Euclidean Distance between Index Tip and Thumb Tip in 3D space)
    const dx = indexTip.x - thumbTip.x;
    const dy = indexTip.y - thumbTip.y;
    const dz = indexTip.z - thumbTip.z;
    const pinchDist = Math.sqrt(dx*dx + dy*dy + dz*dz);

    const isPinchingNow = pinchDist < this.options.pinchThreshold;

    if (isPinchingNow && !this.isPinching) {
      this.isPinching = true;
      hud.textContent = '🤏 Pinch! (คลิก)';
      this.playSynth('pinch');
      if (this.options.onPinch) this.options.onPinch(normX, normY);
    } else if (!isPinchingNow && this.isPinching) {
      this.isPinching = false;
      hud.textContent = '☝️ Pointing';
      if (this.options.onPinchRelease) this.options.onPinchRelease();
    } else if (!isPinchingNow) {
      hud.textContent = '☝️ Pointing';
    }

    // Swipe Detection via velocity of wrist / palm
    this.detectSwipe(landmarks[0]);

    // Triggers Hand Move callback
    if (this.options.onHandMove) {
      this.options.onHandMove(normX, normY, this.isPinching);
    }
    if (this.options.onLandmarks) {
      this.options.onLandmarks(landmarks);
    }
  }

  detectSwipe(wrist) {
    const now = Date.now();
    const currX = 1.0 - wrist.x;
    this.prevPositions.push({ x: currX, time: now });

    // Keep only last 250 ms of history
    this.prevPositions = this.prevPositions.filter(p => now - p.time <= 250);

    if (this.prevPositions.length >= 4 && now - this.lastSwipeTime > 1000) {
      const oldest = this.prevPositions[0];
      const deltaX = currX - oldest.x;
      const deltaTime = (now - oldest.time) / 1000;
      const velocityX = deltaX / deltaTime;

      if (Math.abs(velocityX) > 1.2) {
        const direction = velocityX > 0 ? 'right' : 'left';
        this.lastSwipeTime = now;
        this.playSynth('swipe');
        const hud = document.getElementById('ar-hud-gesture');
        if (hud) hud.textContent = `🖐️ Swipe ${direction}!`;
        if (this.options.onSwipe) {
          this.options.onSwipe(direction);
        }
      }
    }
  }

  drawSkeleton(ctx, landmarks, w, h) {
    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [5,9],[9,10],[10,11],[11,12],
      [9,13],[13,14],[14,15],[15,16],
      [13,17],[17,18],[18,19],[19,20],
      [0,17]
    ];

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;

    for (const [i, j] of connections) {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      ctx.beginPath();
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();
    }

    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      ctx.fillStyle = (i === 4 || i === 8) ? '#fde047' : '#00f0ff';
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, (i === 4 || i === 8) ? 4.5 : 2.5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async loadMediaPipeScripts() {
    await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
    await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
  }
}

// Auto attach to window
window.ARMediaPipeController = ARMediaPipeController;
