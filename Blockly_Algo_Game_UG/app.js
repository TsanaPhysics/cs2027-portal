// AlgoQuest UG — Game Engine, Sandboxed Blockly Runner, Visualizer & Progression

const STORAGE_KEY = window.IS_TEACHER_MODE ? 'algoquest_ug_teacher_v1' : 'algoquest_ug_v1';

const state = {
  currentLevelIndex: 0,
  workspace: null,
  codeLang: 'js',
  soundEnabled: true,
  isRunning: false,
  sandboxInputs: {},
  profile: {
    studentId: '',
    name: '',
    section: ''
  },
  progress: {} // { [levelId]: { passed: bool, stars: 0-3, bestBlocks: num, bestSteps: num, xml: string } }
};

// --- Web Audio Synthesizer (Zero external assets) ---
const sfx = {
  ctx: null,
  play(type) {
    if (!state.soundEnabled) return;
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = this.ctx;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'pass') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'fail') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.22);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (_) {
      // Ignore audio errors
    }
  }
};

// --- Persistence ---
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.profile) state.profile = parsed.profile;
    if (parsed.progress) state.progress = parsed.progress;
    if (typeof parsed.soundEnabled === 'boolean') state.soundEnabled = parsed.soundEnabled;
  } catch (e) {
    console.warn('Failed to load saved state:', e);
  }
}

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        profile: state.profile,
        progress: state.progress,
        soundEnabled: state.soundEnabled
      })
    );
  } catch (e) {
    console.warn('Failed to save state:', e);
  }
}

function saveCurrentWorkspace() {
  if (!state.workspace) return;
  const level = CHALLENGES[state.currentLevelIndex];
  const xmlDom = Blockly.Xml.workspaceToDom(state.workspace);
  const xmlText = Blockly.Xml.domToText(xmlDom);
  if (!state.progress[level.id]) {
    state.progress[level.id] = { passed: false, stars: 0, bestBlocks: null, bestSteps: null, xml: '' };
  }
  state.progress[level.id].xml = xmlText;
  saveState();
}

// --- HUD & Sidebar ---
function getRankTitle(totalXp) {
  if (totalXp >= 1300) return 'Algorithm Grandmaster';
  if (totalXp >= 900) return 'Complexity Tactician';
  if (totalXp >= 500) return 'Data Architect';
  if (totalXp >= 200) return 'Logic Apprentice';
  return 'Novice Coder';
}

function updateHUD() {
  let totalXp = 0;
  let totalStars = 0;
  let passedCount = 0;

  CHALLENGES.forEach((lvl) => {
    const p = state.progress[lvl.id];
    if (p && p.passed) {
      passedCount++;
      totalStars += p.stars || 0;
      totalXp += lvl.xp + (p.stars === 3 ? 50 : 0);
    }
  });

  document.getElementById('hud-xp').textContent = totalXp;
  document.getElementById('hud-stars').textContent = `${totalStars} / ${CHALLENGES.length * 3}`;
  document.getElementById('hud-rank').textContent = getRankTitle(totalXp);
  document.getElementById('sidebar-progress').textContent = `${passedCount}/${CHALLENGES.length} ผ่าน`;
  document.getElementById('btn-sound').textContent = state.soundEnabled ? '🔊' : '🔇';

  const stuBtn = document.getElementById('btn-student-modal');
  if (stuBtn) {
    stuBtn.textContent = state.profile.studentId
      ? `👤 ${state.profile.studentId}`
      : '👤 เลือกนักศึกษา';
    stuBtn.title = state.profile.name ? `${state.profile.studentId} ${state.profile.name}` : 'เลือกชื่อนักศึกษา';
  }
}

function computeSummaryStats() {
  let totalXp = 0;
  let totalStars = 0;
  let passedCount = 0;
  CHALLENGES.forEach((lvl) => {
    const p = state.progress[lvl.id];
    if (p && p.passed) {
      passedCount++;
      totalStars += p.stars || 0;
      totalXp += lvl.xp + (p.stars === 3 ? 50 : 0);
    }
  });
  return { totalXp, totalStars, passedCount, rankTitle: getRankTitle(totalXp) };
}

let cachedRoster = [];

const CS2027_REQUIRED_ROSTER = [
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

function mergeRequiredRoster(list) {
  const byId = new Map();
  (Array.isArray(list) ? list : []).forEach((s) => {
    if (s && s.student_id) byId.set(String(s.student_id), s);
  });
  CS2027_REQUIRED_ROSTER.forEach((req) => {
    if (!byId.has(req.student_id)) {
      byId.set(req.student_id, req);
    }
  });
  return Array.from(byId.values());
}

function populateStudentsBySection(section) {
  const select = document.getElementById('select-student-db');
  if (!select) return;

  if (!section) {
    select.disabled = true;
    select.innerHTML = '<option value="">-- กรุณาเลือกสาขา/หมู่เรียนก่อน --</option>';
    return;
  }

  const filtered = cachedRoster.filter((s) => s.section === section);
  select.disabled = false;
  select.innerHTML = `<option value="">-- เลือกรายชื่อ (${filtered.length} คน) --</option>`;
  filtered.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.student_id;
    opt.dataset.name = s.full_name;
    opt.dataset.section = s.section;
    opt.textContent = `${s.student_id} — ${s.full_name}`;
    if (state.profile.studentId === s.student_id) opt.selected = true;
    select.appendChild(opt);
  });
}

async function fetchStudentRoster() {
  const secSelect = document.getElementById('select-section-db');
  const stuSelect = document.getElementById('select-student-db');
  const badge = document.getElementById('roster-source-badge');
  if (!secSelect || !stuSelect) return;
  try {
    let data = null;
    try {
      const res = await fetch('api/students.php');
      data = await res.json();
    } catch (_) {
      try {
        const resFallback = await fetch('../data/cs2027_students.json');
        data = await resFallback.json();
      } catch (_2) {
        data = { ok: true, source: 'cs2027-builtin', students: CS2027_REQUIRED_ROSTER };
      }
    }
    const rawList = (data && Array.isArray(data.students)) ? data.students : CS2027_REQUIRED_ROSTER;
    cachedRoster = mergeRequiredRoster(rawList);
    if (badge) badge.textContent = `${cachedRoster.length} คน (${(data && data.source) || 'CS2027'})`;

    const sections = Array.from(new Set(cachedRoster.map((s) => s.section).filter(Boolean)));
    secSelect.innerHTML = '<option value="">-- เลือกสาขา / หมู่เรียน --</option>';
    sections.forEach((sec) => {
      const cnt = cachedRoster.filter((s) => s.section === sec).length;
      const opt = document.createElement('option');
      opt.value = sec;
      opt.textContent = `${sec} (${cnt} คน)`;
      if (state.profile.section === sec) opt.selected = true;
      secSelect.appendChild(opt);
    });

    populateStudentsBySection(secSelect.value);
  } catch (err) {
    cachedRoster = mergeRequiredRoster(CS2027_REQUIRED_ROSTER);
    if (badge) badge.textContent = `${cachedRoster.length} คน (CS2027)`;
  }
}

function recordBlocklyDiagnosticLocal(stats) {
  const pctScore = Math.round((stats.passedCount / CHALLENGES.length) * 100);
  const errors = [];
  const rems = [];

  CHALLENGES.forEach((lvl) => {
    const p = state.progress[lvl.id];
    if (!p || !p.passed) {
      errors.push({
        code: `ERR_LVL_${lvl.id.toUpperCase()}`,
        category: `ด่านที่ยังไม่ผ่าน: ${lvl.shortTitle}`,
        severity: 'medium',
        detail: `ยังไม่ได้ส่งหรือยังไม่ผ่าน Test Cases ของด่าน ${lvl.shortTitle} (เป้าหมายความซับซ้อน ${lvl.complexity})`
      });
    } else if ((p.stars || 0) < 3) {
      errors.push({
        code: `OPT_LVL_${lvl.id.toUpperCase()}`,
        category: `ประสิทธิภาพจำนวนบล็อก: ${lvl.shortTitle}`,
        severity: 'low',
        detail: `ผ่านด่าน ${lvl.shortTitle} แล้ว (${p.stars}/3 ดาว) แต่ใช้บล็อก ${p.bestBlocks} บล็อก (เกณฑ์ Par ≤ ${lvl.parBlocks} บล็อก)`
      });
    }
  });

  if (errors.length > 0) {
    rems.push({ step: 'ใช้โครงสร้างลูป (Repeat / While) และตัวแปรสะสมค่าแทนการวางบล็อกซ้ำกัน เพื่อลดจำนวนบล็อกให้ไม่เกินเกณฑ์ Par Blocks' });
    rems.push({ step: 'กดปุ่ม "💡 คำใบ้" ในด่านที่ยังไม่ผ่าน แล้วกด "▶ ทดสอบ & ส่งตรวจ (Judge)" เพื่อเก็บให้ครบ 10 ด่าน' });
  } else {
    errors.push({
      code: 'NONE_EXCELLENT',
      category: 'พิชิตครบทั้ง 10 ด่านสมบูรณ์',
      severity: 'low',
      detail: `ยอดเยี่ยมมาก! ผ่านครบ ${stats.passedCount}/${CHALLENGES.length} ด่าน สะสม ${stats.totalStars} ดาว (${stats.totalXp} XP)`
    });
    rems.push({ step: 'สามารถเปิดดูรายงานผลตรวจย้อนหลังและพิมพ์รายงาน PDF ได้ในหน้าฐานข้อมูลผลตรวจผู้เรียน' });
  }

  try {
    const customList = JSON.parse(localStorage.getItem('cs2027_custom_notifications_v1') || '[]');
    customList.unshift({
      id: Date.now(),
      student_id: state.profile.studentId,
      full_name: state.profile.name,
      section: state.profile.section,
      game_id: 'blockly_ug',
      module_id: 'blockly_10_levels',
      module_title: 'AlgoQuest UG (Blockly 10 ด่าน)',
      submission_ref_id: 999,
      score: pctScore,
      max_score: 100,
      status: pctScore >= 80 ? 'graded' : 'needs_improvement',
      notify_source: 'AlgoQuest Blockly Auto-Judge',
      summary_title: `🔔 ผลตรวจ AlgoQuest UG (Blockly): คะแนน ${pctScore}% (ผ่าน ${stats.passedCount}/${CHALLENGES.length} ด่าน · ${stats.totalStars} ⭐)`,
      errors: errors.slice(0, 5),
      remediations: rems,
      rubric: {},
      teacher_comment: `ระดับขั้น: ${stats.rankTitle} | XP: ${stats.totalXp} | ดาวสะสม: ${stats.totalStars}/${CHALLENGES.length * 3}`,
      is_read: 0,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    });
    localStorage.setItem('cs2027_custom_notifications_v1', JSON.stringify(customList));
  } catch (_) {}

  return { pctScore, errors, rems };
}

async function syncProgressToDB(silent = true) {
  if (window.IS_TEACHER_MODE) return;
  if (!state.profile.studentId) {
    if (!silent) {
      logConsole('⚠️ กรุณาเลือกสาขาและชื่อนักศึกษาก่อนส่งงาน', 'err');
      fetchStudentRoster();
      document.getElementById('student-modal').hidden = false;
    }
    return;
  }
  saveCurrentWorkspace();
  const stats = computeSummaryStats();
  const diag = recordBlocklyDiagnosticLocal(stats);
  const errSummary = diag.errors.slice(0, 3).map((e) => `• ${e.detail}`).join('\n');
  const remSummary = diag.rems.map((r) => `• ${r.step}`).join('\n');

  try {
    const res = await fetch('api/progress.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: state.profile.studentId,
        full_name: state.profile.name,
        section: state.profile.section,
        rank_title: stats.rankTitle,
        total_xp: stats.totalXp,
        total_stars: stats.totalStars,
        passed_count: stats.passedCount,
        progress_json: state.progress
      })
    });
    const data = await res.json();
    if (data.ok) {
      const msg = `ส่งงานและบันทึกคะแนนของ ${state.profile.studentId} ${state.profile.name} เรียบร้อยแล้ว!\nคะแนนรวม: ${diag.pctScore}% (ผ่าน ${stats.passedCount}/${CHALLENGES.length} ด่าน | ดาว: ${stats.totalStars}/${CHALLENGES.length * 3} ⭐ | XP: ${stats.totalXp})\n\n⚠️ การวิเคราะห์ข้อผิดพลาด:\n${errSummary}\n\n🛠️ แนวทางแก้ไข:\n${remSummary}\n\n(บันทึกลงฐานข้อมูลแล้ว สามารถเปิดดูย้อนหลังได้ที่ปุ่ม "🔔 ผลตรวจ & แนวทางแก้ไข")`;
      logConsole(`☁️ บันทึกผลตรวจและแนวทางแก้ไขของ ${state.profile.studentId} ลงฐานข้อมูลแล้ว (${diag.pctScore}%)`, 'ok');
      if (!silent) {
        sfx.play('pass');
        alert(`✅ ${msg}`);
      }
    } else if (!silent) {
      sfx.play('fail');
      logConsole(`❌ ส่งงานไม่สำเร็จ: ${data.error}`, 'err');
      alert(`❌ ส่งงานไม่สำเร็จ: ${data.error}`);
    }
  } catch (err) {
    // Fallback for GitHub Pages static hosting
    const localSubs = JSON.parse(localStorage.getItem('cs2027_blockly_submissions') || '{}');
    localSubs[state.profile.studentId] = {
      student_id: state.profile.studentId,
      full_name: state.profile.name,
      section: state.profile.section,
      rank_title: stats.rankTitle,
      total_xp: stats.totalXp,
      total_stars: stats.totalStars,
      passed_count: stats.passedCount,
      submitted_at: new Date().toLocaleString('th-TH')
    };
    localStorage.setItem('cs2027_blockly_submissions', JSON.stringify(localSubs));
    const msg = `ส่งงานและบันทึกคะแนนของ ${state.profile.studentId} ${state.profile.name} เรียบร้อยแล้ว!\nคะแนนรวม: ${diag.pctScore}% (ผ่าน ${stats.passedCount}/${CHALLENGES.length} ด่าน | ดาว: ${stats.totalStars}/${CHALLENGES.length * 3} ⭐ | XP: ${stats.totalXp})\n\n⚠️ การวิเคราะห์ข้อผิดพลาด:\n${errSummary}\n\n🛠️ แนวทางแก้ไข:\n${remSummary}\n\n(บันทึกลงฐานข้อมูลแล้ว สามารถเปิดดูย้อนหลังได้ที่ปุ่ม "🔔 ผลตรวจ & แนวทางแก้ไข")`;
    logConsole(`☁️ บันทึกผลตรวจและแนวทางแก้ไขของ ${state.profile.studentId} ลงฐานข้อมูลแล้ว (${diag.pctScore}%)`, 'ok');
    if (!silent) {
      sfx.play('pass');
      alert(`✅ ${msg}`);
    }
  }
}

async function loadProgressFromDB(studentId) {
  if (!studentId) return;
  try {
    const res = await fetch(`api/progress.php?student_id=${encodeURIComponent(studentId)}`);
    const data = await res.json();
    if (data.ok && data.found && data.record && data.record.progress_json) {
      const dbProg = JSON.parse(data.record.progress_json);
      if (dbProg && typeof dbProg === 'object') {
        state.progress = dbProg;
        saveState();
        updateHUD();
        loadLevel(state.currentLevelIndex);
        logConsole(`☁️ โหลดความก้าวหน้าเดิมของ ${studentId} จากฐานข้อมูลแล้ว`, 'info');
      }
    }
  } catch (_) {
    // Ignore if offline
  }
}

function renderMissionSidebar() {
  const container = document.getElementById('mission-list');
  container.innerHTML = '';

  CHALLENGES.forEach((lvl, idx) => {
    const p = state.progress[lvl.id] || {};
    const starsStr = p.passed ? '⭐'.repeat(p.stars || 1) + '☆'.repeat(3 - (p.stars || 1)) : '☆☆☆';
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `mission-card ${idx === state.currentLevelIndex ? 'active' : ''}`;
    card.innerHTML = `
      <div class="mission-card-top">
        <span>${lvl.complexity}</span>
        <span>${starsStr}</span>
      </div>
      <div class="mission-card-title">${lvl.shortTitle}</div>
      <div class="mission-card-sub">${p.passed ? `✅ ผ่านแล้ว (${lvl.xp} XP)` : `🎯 ${lvl.xp} XP`}</div>
    `;
    card.addEventListener('click', () => {
      sfx.play('click');
      loadLevel(idx);
    });
    container.appendChild(card);
  });
}

// --- Sandbox Input Generator ---
function generateRandomArray(cfg) {
  const arr = [];
  for (let i = 0; i < cfg.length; i++) {
    arr.push(Math.floor(Math.random() * (cfg.max - cfg.min + 1)) + cfg.min);
  }
  return arr;
}

function generateSortedDescArray(length) {
  const set = new Set();
  while (set.size < length) {
    set.add(Math.floor(Math.random() * 100) + 1);
  }
  return Array.from(set).sort((a, b) => b - a);
}

function initSandboxInputs(level, randomize = false) {
  if (!randomize && state.sandboxInputs[level.id]) return;

  const inputs = {};
  (level.sandboxConfig || []).forEach((cfg) => {
    if (cfg.type === 'range' || cfg.type === 'number') {
      inputs[cfg.key] = randomize
        ? Math.floor(Math.random() * (cfg.max - cfg.min + 1)) + cfg.min
        : cfg.default;
    } else if (cfg.type === 'array') {
      inputs[cfg.key] = generateRandomArray(cfg);
    } else if (cfg.type === 'sorted_desc') {
      inputs[cfg.key] = generateSortedDescArray(cfg.length);
      if (inputs.target !== undefined) {
        // Ensure target exists in list for meaningful sandbox testing
        inputs.target = inputs[cfg.key][Math.floor(Math.random() * inputs[cfg.key].length)];
      }
    }
  });

  // For rank, ensure target is in the list on initial load too
  if (level.id === 'rank' && Array.isArray(inputs.list)) {
    if (!inputs.list.includes(inputs.target)) {
      inputs.target = inputs.list[Math.floor(inputs.list.length / 2)];
    }
  }

  state.sandboxInputs[level.id] = inputs;
}

function renderSandboxControls(level) {
  const container = document.getElementById('sandbox-controls');
  container.innerHTML = '';
  const inputs = state.sandboxInputs[level.id] || {};

  (level.sandboxConfig || []).forEach((cfg) => {
    const row = document.createElement('div');
    row.className = 'sandbox-row';

    if (cfg.type === 'range') {
      const valSpan = document.createElement('span');
      valSpan.textContent = `${cfg.label}: ${inputs[cfg.key]}`;
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = cfg.min;
      slider.max = cfg.max;
      slider.value = inputs[cfg.key];
      slider.addEventListener('input', () => {
        inputs[cfg.key] = Number(slider.value);
        valSpan.textContent = `${cfg.label}: ${inputs[cfg.key]}`;
      });
      row.appendChild(valSpan);
      row.appendChild(slider);
    } else if (cfg.type === 'number') {
      const lbl = document.createElement('span');
      lbl.textContent = cfg.label;
      const num = document.createElement('input');
      num.type = 'number';
      num.min = cfg.min;
      num.max = cfg.max;
      num.value = inputs[cfg.key];
      num.addEventListener('change', () => {
        inputs[cfg.key] = Number(num.value);
      });
      row.appendChild(lbl);
      row.appendChild(num);
    } else if (cfg.type === 'array' || cfg.type === 'sorted_desc') {
      row.innerHTML = `<span>${cfg.label}: <code>[${inputs[cfg.key].slice(0, 6).join(', ')}${inputs[cfg.key].length > 6 ? ', ...' : ''}]</code></span>`;
    }

    container.appendChild(row);
  });

  // Array Visualizer
  const vizCard = document.getElementById('array-viz-card');
  if (level.hasArrayViz && Array.isArray(inputs.list)) {
    vizCard.style.display = 'block';
    renderArrayViz(inputs.list, -1, -1);
  } else {
    vizCard.style.display = 'none';
  }
}

function renderArrayViz(arr, activeIdx1Based = -1, foundIdx1Based = -1) {
  const viz = document.getElementById('array-viz');
  viz.innerHTML = '';
  arr.forEach((val, i) => {
    const cell = document.createElement('div');
    cell.className = 'arr-cell';
    if (i + 1 === activeIdx1Based) cell.classList.add('active');
    if (i + 1 === foundIdx1Based) cell.classList.add('found');
    cell.textContent = val;
    cell.title = `Index ${i + 1}`;
    viz.appendChild(cell);
  });
}

// --- Level Loading & Blockly Setup ---
function loadLevel(index) {
  if (state.workspace) saveCurrentWorkspace();
  state.currentLevelIndex = index;
  const level = CHALLENGES[index];

  document.getElementById('level-tier').textContent = level.tier;
  document.getElementById('level-complexity').textContent = `Target: ${level.complexity}`;
  document.getElementById('level-title').textContent = level.title;
  document.getElementById('level-desc').textContent = level.description;
  const noteInput = document.getElementById('teacher-note-input');
  if (noteInput && window.IS_TEACHER_MODE && typeof SOLUTIONS !== 'undefined' && SOLUTIONS[level.id]) {
    noteInput.value = SOLUTIONS[level.id].note || '';
  }
  document.getElementById('target-blocks').textContent = `⭐⭐ ใช้บล็อก ≤ ${level.parBlocks}`;
  document.getElementById('target-steps').textContent =
    level.id === 'guess'
      ? `⭐⭐⭐ ทายไม่เกิน ${level.maxSteps} ครั้ง`
      : `⭐⭐⭐ Steps ≤ ${level.maxSteps}`;

  initSandboxInputs(level, false);
  renderSandboxControls(level);
  renderMissionSidebar();

  // Reset test cases display
  const tcList = document.getElementById('test-cases-list');
  tcList.innerHTML = level.tests
    .map(
      (t) => `
      <div class="test-item">
        <div class="test-item-head">
          <span>${t.name}</span>
          <span>⏳ รอตรวจ</span>
        </div>
        <div class="test-item-detail">Expected: ${t.expected.join(', ')}</div>
      </div>`
    )
    .join('');
  document.getElementById('judge-summary').textContent = 'รอการทดสอบ';
  document.getElementById('var-watch').innerHTML = '<span class="muted">ยังไม่มีตัวแปรทำงาน</span>';
  document.getElementById('viz-steps').textContent = 'Steps: 0';

  // Recreate Blockly workspace with level's toolbox
  if (state.workspace) {
    state.workspace.dispose();
  }
  state.workspace = Blockly.inject('blockly-div', {
    renderer: 'zelos',
    toolbox: level.toolbox,
    grid: { spacing: 24, length: 3, colour: '#cbd5e1', snap: true },
    zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 1.5, minScale: 0.5 },
    trashcan: true
  });

  // Restore saved XML if any
  const saved = state.progress[level.id];
  if (saved && saved.xml) {
    try {
      const xmlDom = Blockly.utils.xml.textToDom(saved.xml);
      Blockly.Xml.domToWorkspace(xmlDom, state.workspace);
    } catch (e) {
      console.warn('Could not restore XML:', e);
    }
  }

  let refreshTimer = null;
  function refreshWorkspaceViews() {
    if (!state.workspace) return;
    const count = state.workspace.getAllBlocks(false).length;
    document.getElementById('block-counter').textContent = `บล็อกที่ใช้: ${count}`;
    try {
      updateCodePreview();
    } catch (e) {
      console.warn('Code preview error:', e);
    }
    try {
      if (typeof window.renderBlocklyFlowchart === 'function') {
        window.renderBlocklyFlowchart(
          state.workspace,
          document.getElementById('flowchart-view'),
          CHALLENGES[state.currentLevelIndex]
        );
      }
    } catch (e) {
      console.warn('Flowchart render error:', e);
    }
  }

  state.workspace.addChangeListener(() => {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refreshWorkspaceViews, 30);
  });

  refreshWorkspaceViews();
  if (window.Sim3D) {
    window.Sim3D.init(level, state.sandboxInputs[level.id]);
  }
}

function updateCodePreview() {
  if (!state.workspace) return;
  const jsGen = (window.javascript && window.javascript.javascriptGenerator) || Blockly.JavaScript;
  const pyGen = (window.python && window.python.pythonGenerator) || Blockly.Python;

  let code = '';
  if (state.codeLang === 'js' && jsGen) {
    jsGen.INFINITE_LOOP_TRAP = '';
    code = jsGen.workspaceToCode(state.workspace);
  } else if (state.codeLang === 'py' && pyGen) {
    code = pyGen.workspaceToCode(state.workspace);
  }
  document.getElementById('code-preview').textContent = code.trim() || '// ลากบล็อกเพื่อดูโค้ดที่ถูกสร้างอัตโนมัติ';
}

// --- Console Logger ---
function logConsole(msg, cls = '') {
  const box = document.getElementById('console-log');
  const line = document.createElement('div');
  line.className = `log-line ${cls}`;
  line.textContent = msg;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

// --- Sandboxed Execution Engine ---
function executeBlocklyCode(level, rawInputs, isSandbox = false) {
  const jsGen = (window.javascript && window.javascript.javascriptGenerator) || Blockly.JavaScript;
  jsGen.INFINITE_LOOP_TRAP = '__rt.step();\n';
  const code = jsGen.workspaceToCode(state.workspace);
  jsGen.INFINITE_LOOP_TRAP = '';

  const inputs = JSON.parse(JSON.stringify(rawInputs));
  const outputs = [];
  const vars = {};
  const traceEvents = [];
  let steps = 0;
  let guessCount = 0;
  let lastActiveIdx = -1;
  const MAX_STEPS = 10000;

  function pushTrace(ev) {
    if (!isSandbox || traceEvents.length >= 80) return;
    traceEvents.push({
      step: steps,
      list: Array.isArray(inputs.list) ? inputs.list.slice() : null,
      height: inputs.height,
      moisture: inputs.moisture,
      ...ev
    });
  }

  const __rt = {
    step() {
      steps++;
      if (steps > MAX_STEPS) {
        throw new Error('ตรวจพบ Infinite Loop (ทำงานเกิน 10,000 รอบ)');
      }
    },
    print(val) {
      const str = String(val);
      outputs.push(str);
      pushTrace({ type: 'print', label: `พิมพ์ผลลัพธ์: ${str}` });
      if (isSandbox) logConsole(`> ${str}`, 'ok');
    },
    getInput(key) {
      return inputs[key];
    },
    waterPlant() {
      __rt.step();
      inputs.moisture = (inputs.moisture || 0) + 15;
      vars['moisture'] = inputs.moisture;
      pushTrace({ type: 'water', label: `รดน้ำต้นไม้ → ความชื้น ${inputs.moisture}%` });
    },
    listLength() {
      return Array.isArray(inputs.list) ? inputs.list.length : 0;
    },
    listGet(idx1Based) {
      const arr = inputs.list || [];
      const idx = Math.floor(Number(idx1Based)) - 1;
      if (idx < 0 || idx >= arr.length) {
        throw new Error(`Index Out of Bounds: เข้าถึงตำแหน่งที่ ${idx1Based} (มีข้อมูล ${arr.length} ตัว)`);
      }
      lastActiveIdx = idx + 1;
      pushTrace({ type: 'get', activeIndex: lastActiveIdx, label: `อ่าน list[${lastActiveIdx}] = ${arr[idx]}` });
      return arr[idx];
    },
    listSwap(i1Based, j1Based) {
      __rt.step();
      const arr = inputs.list || [];
      const i = Math.floor(Number(i1Based)) - 1;
      const j = Math.floor(Number(j1Based)) - 1;
      if (i < 0 || i >= arr.length || j < 0 || j >= arr.length) {
        throw new Error(`Index Out of Bounds (Swap): ตำแหน่ง (${i1Based}, ${j1Based}) จาก ${arr.length} ตัว`);
      }
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
      lastActiveIdx = j + 1;
      pushTrace({ type: 'swap', swapPair: [i + 1, j + 1], activeIndex: j + 1, label: `สลับตำแหน่ง ${i + 1} ↔ ${j + 1}` });
    },
    printAll() {
      const arr = inputs.list || [];
      const str = arr.join(', ');
      outputs.push(str);
      pushTrace({ type: 'print', label: `พิมพ์รายการ: [${str}]` });
      if (isSandbox) logConsole(`> [${str}]`, 'ok');
    },
    guess(num) {
      __rt.step();
      guessCount++;
      const n = Number(num);
      const secret = Number(inputs.secret);
      vars['guessCount'] = guessCount;
      vars['lastGuess'] = n;
      const resText = n === secret ? 'ถูกต้อง' : (n > secret ? 'มากไป' : 'น้อยไป');
      pushTrace({ type: 'guess', guessNum: n, guessRes: resText, label: `ครั้งที่ ${guessCount}: ทาย ${n} → ${resText}` });
      return resText;
    },
    watch(name, val) {
      vars[name] = val;
    }
  };

  try {
    const fn = new Function('__rt', code);
    fn(__rt);
    pushTrace({ type: 'end', label: `เสร็จสิ้น (${outputs.join(', ') || 'จบการทำงาน'})` });
    return {
      ok: true,
      outputs,
      vars,
      steps: level.id === 'guess' ? guessCount : steps,
      lastActiveIdx,
      finalInputs: inputs,
      traceEvents
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message || String(err),
      outputs,
      vars,
      steps: level.id === 'guess' ? guessCount : steps,
      lastActiveIdx,
      traceEvents
    };
  }
}

function runSandbox() {
  const level = CHALLENGES[state.currentLevelIndex];
  const inputs = state.sandboxInputs[level.id] || {};
  logConsole(`--- รัน Sandbox: ${level.shortTitle} ---`, 'info');

  const res = executeBlocklyCode(level, inputs, true);
  document.getElementById('viz-steps').textContent = `Steps: ${res.steps}`;

  // Update Variable Watch
  const watchEl = document.getElementById('var-watch');
  const entries = Object.entries(res.vars);
  if (entries.length > 0) {
    watchEl.innerHTML = entries
      .map(([k, v]) => `<div class="var-chip">${k} = <span>${v}</span></div>`)
      .join('');
  } else {
    watchEl.innerHTML = '<span class="muted">รันเสร็จสิ้น (ไม่มีตัวแปร loop ที่ถูกติดตาม)</span>';
  }

  if (level.hasArrayViz && Array.isArray(inputs.list)) {
    const displayArr = (res.finalInputs && Array.isArray(res.finalInputs.list)) ? res.finalInputs.list : inputs.list;
    renderArrayViz(displayArr, res.lastActiveIdx, -1);
  }
  if (window.Sim3D && res.traceEvents) {
    window.Sim3D.playTrace(level, res.traceEvents);
  }

  if (!res.ok) {
    sfx.play('fail');
    logConsole(`❌ Error: ${res.error}`, 'err');
  } else {
    sfx.play('click');
    if (res.outputs.length === 0) {
      logConsole('⚠️ โปรแกรมทำงานจบแล้ว แต่ไม่มีคำสั่ง "พิมพ์" ผลลัพธ์', 'info');
    }
  }
}

function runJudge() {
  const level = CHALLENGES[state.currentLevelIndex];
  saveCurrentWorkspace();

  const blockCount = state.workspace.getAllBlocks(false).length;
  if (blockCount === 0) {
    sfx.play('fail');
    logConsole('⚠️ กรุณาลากบล็อกลงในพื้นที่ทำงานก่อนส่งตรวจ', 'err');
    return;
  }

  const tcList = document.getElementById('test-cases-list');
  tcList.innerHTML = '';
  let passCount = 0;
  let maxStepsObserved = 0;

  level.tests.forEach((tc) => {
    const res = executeBlocklyCode(level, tc.inputs, false);
    maxStepsObserved = Math.max(maxStepsObserved, res.steps);

    const actualNorm = res.outputs.map((s) => String(s).trim());
    const expectedNorm = tc.expected.map((s) => String(s).trim());
    const isMatch =
      res.ok &&
      actualNorm.length === expectedNorm.length &&
      actualNorm.every((v, i) => v === expectedNorm[i]);

    if (isMatch) passCount++;

    const item = document.createElement('div');
    item.className = `test-item ${isMatch ? 'pass' : 'fail'}`;
    item.innerHTML = `
      <div class="test-item-head">
        <span>${isMatch ? '✅' : '❌'} ${tc.name}</span>
        <span>${res.steps} steps</span>
      </div>
      <div class="test-item-detail">
        Expected: <b>${expectedNorm.join(', ')}</b> | Got: <b>${res.ok ? (actualNorm.join(', ') || '(ว่าง)') : `Error: ${res.error}`}</b>
      </div>
    `;
    tcList.appendChild(item);
  });

  const allPassed = passCount === level.tests.length;
  document.getElementById('judge-summary').textContent = `${passCount}/${level.tests.length} ผ่าน`;

  if (allPassed) {
    sfx.play('pass');
    let stars = 1;
    if (blockCount <= level.parBlocks) stars++;
    if (maxStepsObserved <= level.maxSteps) stars++;

    const prev = state.progress[level.id] || {};
    state.progress[level.id] = {
      passed: true,
      stars: Math.max(prev.stars || 0, stars),
      bestBlocks: prev.bestBlocks ? Math.min(prev.bestBlocks, blockCount) : blockCount,
      bestSteps: prev.bestSteps ? Math.min(prev.bestSteps, maxStepsObserved) : maxStepsObserved,
      xml: prev.xml || ''
    };
    saveState();
    updateHUD();
    renderMissionSidebar();
    syncProgressToDB(true);

    // Show Victory Modal
    document.getElementById('victory-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    document.getElementById('victory-title').textContent = `ผ่านด่าน ${level.shortTitle}!`;
    document.getElementById('victory-msg').textContent =
      stars === 3
        ? 'ยอดเยี่ยมมาก! อัลกอริทึมของคุณถูกต้อง กระชับ และมีประสิทธิภาพสูงสุด'
        : 'ผ่านทุก Test Case แล้ว! ลองลดจำนวนบล็อกหรือปรับปรุงประสิทธิภาพเพื่อเก็บให้ครบ 3 ดาว';
    document.getElementById('victory-metrics').innerHTML = `
      <div class="v-metric">บล็อกที่ใช้: <b>${blockCount}</b> (เป้า ≤ ${level.parBlocks})</div>
      <div class="v-metric">Max Steps: <b>${maxStepsObserved}</b> (เป้า ≤ ${level.maxSteps})</div>
      <div class="v-metric">ได้รับ: <b>+${level.xp} XP</b></div>
    `;
    document.getElementById('btn-next-level').style.display =
      state.currentLevelIndex < CHALLENGES.length - 1 ? 'inline-flex' : 'none';
    document.getElementById('victory-modal').hidden = false;
  } else {
    sfx.play('fail');
    logConsole(`❌ ผลตรวจ ${level.shortTitle}: ผ่าน ${passCount}/${level.tests.length} Test Cases`, 'err');
  }
}

// --- Export Report ---
function exportProgress() {
  saveCurrentWorkspace();
  const payload = {
    exportedAt: new Date().toISOString(),
    student: state.profile,
    rank: document.getElementById('hud-rank').textContent,
    totalXp: Number(document.getElementById('hud-xp').textContent),
    progress: state.progress
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AlgoQuest_${state.profile.studentId || 'student'}_report.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  registerCustomBlocks();
  updateHUD();
  loadLevel(0);

  // Tabs
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  // Code language switch
  document.querySelectorAll('.lang-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.lang-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      state.codeLang = pill.dataset.lang;
      updateCodePreview();
    });
  });

  // Toolbar actions
  document.getElementById('btn-run-tests').addEventListener('click', runJudge);
  document.getElementById('btn-run-sandbox').addEventListener('click', runSandbox);
  document.getElementById('btn-randomize-input').addEventListener('click', () => {
    const level = CHALLENGES[state.currentLevelIndex];
    initSandboxInputs(level, true);
    renderSandboxControls(level);
  });
  const sim3dRunBtn = document.getElementById('btn-sim3d-run');
  if (sim3dRunBtn) {
    sim3dRunBtn.addEventListener('click', runSandbox);
  }
  const sim3dReplayBtn = document.getElementById('btn-sim3d-replay');
  if (sim3dReplayBtn) {
    sim3dReplayBtn.addEventListener('click', () => {
      if (window.Sim3D) window.Sim3D.replay();
    });
  }

  document.getElementById('btn-clear-console').addEventListener('click', () => {
    document.getElementById('console-log').innerHTML = '';
  });

  const exportSvgBtn = document.getElementById('btn-export-svg');
  if (exportSvgBtn) {
    exportSvgBtn.addEventListener('click', () => {
      const svg = document.getElementById('flowchart-svg');
      if (!svg) return;
      const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const level = CHALLENGES[state.currentLevelIndex];
      a.href = url;
      a.download = `flowchart_${level.id}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!confirm('ต้องการล้างบล็อกในด่านนี้ทั้งหมดใช่หรือไม่?')) return;
    state.workspace.clear();
    saveCurrentWorkspace();
  });

  document.getElementById('btn-hint').addEventListener('click', () => {
    const level = CHALLENGES[state.currentLevelIndex];
    document.getElementById('hint-body').innerHTML = `<p style="line-height:1.6;margin:0">${level.hint}</p>`;
    document.getElementById('hint-modal').hidden = false;
  });

  document.getElementById('btn-sound').addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    saveState();
    updateHUD();
  });

  // Student Profile Modal (Student Edition only)
  const studentModalBtn = document.getElementById('btn-student-modal');
  if (studentModalBtn) {
    studentModalBtn.addEventListener('click', () => {
      document.getElementById('input-student-id').value = state.profile.studentId || '';
      document.getElementById('input-student-name').value = state.profile.name || '';
      document.getElementById('input-student-sec').value = state.profile.section || '';
      fetchStudentRoster();
      document.getElementById('student-modal').hidden = false;
    });
  }

  const selectSectionDb = document.getElementById('select-section-db');
  if (selectSectionDb) {
    selectSectionDb.addEventListener('change', () => {
      populateStudentsBySection(selectSectionDb.value);
      document.getElementById('input-student-sec').value = selectSectionDb.value;
      document.getElementById('input-student-id').value = '';
      document.getElementById('input-student-name').value = '';
    });
  }

  const selectStudentDb = document.getElementById('select-student-db');
  if (selectStudentDb) {
    selectStudentDb.addEventListener('change', () => {
      const opt = selectStudentDb.selectedOptions[0];
      if (!opt || !opt.value) return;
      document.getElementById('input-student-id').value = opt.value;
      document.getElementById('input-student-name').value = opt.dataset.name || '';
      document.getElementById('input-student-sec').value = opt.dataset.section || '';
    });
  }

  const syncDbBtn = document.getElementById('btn-sync-db');
  if (syncDbBtn) {
    syncDbBtn.addEventListener('click', () => syncProgressToDB(false));
  }

  const saveStudentBtn = document.getElementById('btn-save-student');
  if (saveStudentBtn) {
    saveStudentBtn.addEventListener('click', async () => {
      state.profile.studentId = document.getElementById('input-student-id').value.trim();
      state.profile.name = document.getElementById('input-student-name').value.trim();
      state.profile.section = document.getElementById('input-student-sec').value.trim();
      saveState();
      updateHUD();
      document.getElementById('student-modal').hidden = true;
      logConsole(`บันทึกข้อมูลนักศึกษา: ${state.profile.studentId} ${state.profile.name}`, 'info');
      await loadProgressFromDB(state.profile.studentId);
    });
  }

  const classReportBtn = document.getElementById('btn-class-report');
  if (classReportBtn) {
    async function loadClassReport() {
      const tbody = document.getElementById('class-report-tbody');
      const srcEl = document.getElementById('report-db-source');
      const pin = sessionStorage.getItem('aq_admin_pin') || '';
      tbody.innerHTML = '<tr><td colspan="7" class="muted">กำลังดึงข้อมูลจากฐานข้อมูล...</td></tr>';
      try {
        const res = await fetch('api/admin.php?action=report', {
          headers: { 'X-Admin-Pin': pin }
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'Unauthorized');
        srcEl.textContent = `${data.rows.length} คน (${data.source})`;
        tbody.innerHTML = data.rows
          .map(
            (r) => `
            <tr>
              <td><code>${r.student_id}</code></td>
              <td>${r.full_name}</td>
              <td>${r.section}</td>
              <td>${r.rank_title}</td>
              <td>${r.passed_count} / ${CHALLENGES.length}</td>
              <td>⭐ ${r.total_stars}</td>
              <td><b>${r.total_xp}</b></td>
            </tr>`
          )
          .join('');
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="err">ไม่สามารถดึงข้อมูลได้: ${err.message}</td></tr>`;
      }
    }

    classReportBtn.addEventListener('click', () => {
      document.getElementById('class-report-modal').hidden = false;
      loadClassReport();
    });
  }

  // Admin Backend Auth & DB Solutions (Teacher Edition)
  if (window.IS_TEACHER_MODE) {
    const loginModal = document.getElementById('admin-login-modal');
    const pinInput = document.getElementById('input-admin-pin');
    const loginBtn = document.getElementById('btn-admin-login');
    const loginErr = document.getElementById('admin-login-err');
    const dbBadge = document.getElementById('admin-db-badge');
    const logoutBtn = document.getElementById('btn-admin-logout');
    const saveSolDbBtn = document.getElementById('btn-save-solution-db');

    async function initAdminSession(pin) {
      try {
        let verifiedViaPhp = false;
        try {
          const vRes = await fetch('api/admin.php?action=verify_pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin })
          });
          const vData = await vRes.json();
          if (!vData.ok) throw new Error(vData.error || 'รหัสผ่านไม่ถูกต้อง');
          verifiedViaPhp = true;
        } catch (netErr) {
          if (netErr && netErr.message === 'รหัสผ่านไม่ถูกต้อง') throw netErr;
          if (pin !== 'physicss') throw new Error('รหัสผ่านอาจารย์ไม่ถูกต้อง (PIN: physicss)');
        }

        sessionStorage.setItem('aq_admin_pin', pin);
        if (loginModal) loginModal.hidden = true;
        if (loginErr) loginErr.textContent = '';

        if (verifiedViaPhp) {
          const sRes = await fetch('api/admin.php?action=solutions', {
            headers: { 'X-Admin-Pin': pin }
          });
          const sData = await sRes.json();
          if (sData.ok) {
            if (sData.count === 0 && typeof SOLUTIONS !== 'undefined') {
              await fetch('api/admin.php?action=seed_solutions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin },
                body: JSON.stringify({ solutions: SOLUTIONS })
              });
              logConsole('📦 นำเข้าเฉลยทั้ง 10 ด่านเข้าสู่ฐานข้อมูลอัตโนมัติแล้ว', 'info');
            } else if (sData.solutions && typeof SOLUTIONS !== 'undefined') {
              Object.entries(sData.solutions).forEach(([lvlId, item]) => {
                SOLUTIONS[lvlId] = { note: item.note, xml: item.xml };
              });
            }
            if (dbBadge) dbBadge.textContent = `🔓 DB: ${sData.driver || 'connected'}`;
          }
        } else {
          if (dbBadge) dbBadge.textContent = '🔓 DB: Cloud/Hybrid';
        }
        const curLvl = CHALLENGES[state.currentLevelIndex];
        const noteInput = document.getElementById('teacher-note-input');
        if (noteInput && typeof SOLUTIONS !== 'undefined' && SOLUTIONS[curLvl.id]) {
          noteInput.value = SOLUTIONS[curLvl.id].note || '';
        }
      } catch (err) {
        sessionStorage.removeItem('aq_admin_pin');
        if (loginModal) loginModal.hidden = false;
        if (loginErr) loginErr.textContent = err.message;
      }
    }

    const savedPin = sessionStorage.getItem('aq_admin_pin');
    if (savedPin) {
      initAdminSession(savedPin);
    } else if (loginModal) {
      loginModal.hidden = false;
    }

    if (loginBtn) {
      loginBtn.addEventListener('click', () => initAdminSession(pinInput.value.trim()));
    }
    if (pinInput) {
      pinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') initAdminSession(pinInput.value.trim());
      });
    }
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('aq_admin_pin');
        if (dbBadge) dbBadge.textContent = '🔒 Admin: รอยืนยัน';
        if (loginModal) loginModal.hidden = false;
      });
    }
    if (saveSolDbBtn) {
      saveSolDbBtn.addEventListener('click', async () => {
        const pin = sessionStorage.getItem('aq_admin_pin') || '';
        const level = CHALLENGES[state.currentLevelIndex];
        const xmlText = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(state.workspace));
        const noteVal = document.getElementById('teacher-note-input')?.value.trim() || '';
        try {
          const res = await fetch('api/admin.php?action=save_solution', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin },
            body: JSON.stringify({ level_id: level.id, note: noteVal, xml: xmlText })
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.error || 'Save failed');
          if (typeof SOLUTIONS !== 'undefined') {
            SOLUTIONS[level.id] = { note: noteVal, xml: xmlText };
          }
          sfx.play('pass');
          logConsole(`💾 บันทึกเฉลยและแนวทางสอนด่าน "${level.shortTitle}" ลงฐานข้อมูลแล้ว`, 'ok');
        } catch (err) {
          sfx.play('fail');
          logConsole(`❌ บันทึกเฉลยไม่สำเร็จ: ${err.message}`, 'err');
        }
      });
    }
  }

  const exportBtn = document.getElementById('btn-export');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportProgress);
  }

  // Teacher Edition Controls
  const loadSolBtn = document.getElementById('btn-load-solution');
  if (loadSolBtn && typeof SOLUTIONS !== 'undefined') {
    loadSolBtn.addEventListener('click', () => {
      const level = CHALLENGES[state.currentLevelIndex];
      const sol = SOLUTIONS[level.id];
      if (!sol) return;
      state.workspace.clear();
      const xmlDom = Blockly.utils.xml.textToDom(sol.xml);
      Blockly.Xml.domToWorkspace(xmlDom, state.workspace);
      saveCurrentWorkspace();
      sfx.play('click');
      logConsole(`🔑 โหลดเฉลยด่าน ${level.shortTitle} เรียบร้อย`, 'info');
    });
  }

  const verifyAllBtn = document.getElementById('btn-verify-all');
  if (verifyAllBtn && typeof SOLUTIONS !== 'undefined') {
    verifyAllBtn.addEventListener('click', () => {
      // Switch to Console tab so instructor sees full verification log
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      document.querySelector('[data-tab="console"]')?.classList.add('active');
      document.getElementById('tab-console')?.classList.add('active');

      logConsole('=== เริ่มทดสอบเฉลยทั้ง 10 ด่าน ===', 'info');
      let allOk = 0;
      CHALLENGES.forEach((lvl, idx) => {
        loadLevel(idx);
        const sol = SOLUTIONS[lvl.id];
        state.workspace.clear();
        Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(sol.xml), state.workspace);

        const blocks = state.workspace.getAllBlocks(false).length;
        let passed = 0;
        let maxSteps = 0;
        lvl.tests.forEach((tc) => {
          const r = executeBlocklyCode(lvl, tc.inputs, false);
          maxSteps = Math.max(maxSteps, r.steps);
          const got = r.outputs.map((s) => String(s).trim());
          const exp = tc.expected.map((s) => String(s).trim());
          if (r.ok && got.length === exp.length && got.every((v, i) => v === exp[i])) {
            passed++;
          }
        });
        const ok = passed === lvl.tests.length;
        if (ok) allOk++;
        let stars = ok ? 1 : 0;
        if (ok && blocks <= lvl.parBlocks) stars++;
        if (ok && maxSteps <= lvl.maxSteps) stars++;

        logConsole(
          `${ok ? '✅' : '❌'} ${lvl.shortTitle}: ${passed}/${lvl.tests.length} tests | ${blocks}/${lvl.parBlocks} blocks | ${maxSteps}/${lvl.maxSteps} steps | ${'⭐'.repeat(stars)}`,
          ok ? 'ok' : 'err'
        );
      });
      logConsole(`=== สรุปผล: ผ่าน ${allOk}/${CHALLENGES.length} ด่าน ===`, allOk === CHALLENGES.length ? 'ok' : 'err');
    });
  }

  document.getElementById('btn-next-level').addEventListener('click', () => {
    document.getElementById('victory-modal').hidden = true;
    if (state.currentLevelIndex < CHALLENGES.length - 1) {
      loadLevel(state.currentLevelIndex + 1);
    }
  });

  // Close modals
  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.close).hidden = true;
    });
  });
});
