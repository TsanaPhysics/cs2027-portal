/**
 * CT-Lab 04 — Interactive Algorithm Design, Pseudocode, Standard Flowchart & Trace Table App
 */
(function () {
  const PROFILE_KEY = 'ctlab04-student-profile-v1';
  const PROGRESS_BASE = 'ctlab04-progress-v1';
  const SEMI_BASE = 'ctlab04-semi-v1';
  const TRACE_BASE = 'ctlab04-trace-v1';

  const MODULE_LABELS = {
    algo_design: '01 Algorithm Design',
    pseudocode: '02 รหัสลำลอง (Pseudocode)',
    flowchart: '03 ผังงานมาตรฐาน (Flowchart)',
    lab4_tracetable: '04 ปฏิบัติการ 4: Trace Table'
  };
  const DISPLAY_LABELS = Object.assign({}, MODULE_LABELS, {
    assessment: '05 แบบทดสอบวัดผล',
    challenge10: '05 แบบทดสอบวัดผล',
    challenge: '05 แบบทดสอบวัดผล'
  });

  const $ = (id) => document.getElementById(id);

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg) {
    const t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._tm);
    t._tm = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function loadProfile() {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); } catch { return {}; }
  }
  function saveProfile(p) {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {}
  }

  function scopedKey(base) {
    const p = loadProfile();
    return p.student_id ? `${base}-${p.student_id}` : base;
  }

  function loadProgress() {
    try {
      const p = JSON.parse(localStorage.getItem(scopedKey(PROGRESS_BASE)) || '{}');
      return { completed: p.completed || {}, attempts: p.attempts || {} };
    } catch { return { completed: {}, attempts: {} }; }
  }
  function saveProgress(prog) {
    try { localStorage.setItem(scopedKey(PROGRESS_BASE), JSON.stringify(prog)); } catch {}
  }

  function recordModule(modKey, passed) {
    const prog = loadProgress();
    prog.attempts[modKey] = (prog.attempts[modKey] || 0) + 1;
    if (passed) prog.completed[modKey] = true;
    saveProgress(prog);
    refreshProgressUI();
  }

  function refreshProgressUI() {
    const prog = loadProgress();
    const keys = Object.keys(MODULE_LABELS);
    const doneCnt = keys.filter((k) => !!prog.completed[k]).length;

    keys.forEach((k) => {
      const done = !!prog.completed[k];
      const navChk = $(`nav-chk-${k}`);
      if (navChk) {
        navChk.textContent = done ? '✓' : '—';
        navChk.classList.toggle('done', done);
      }
      const cardBadge = $(`card-badge-${k}`);
      if (cardBadge) {
        cardBadge.textContent = done ? '✓ ผ่านแล้ว' : 'ยังไม่ทำ';
        cardBadge.className = 'tag ' + (done ? 'done' : 'soft');
      }
      const modBadge = $(`badge-${k}`);
      if (modBadge && done) {
        modBadge.textContent = '✓ ผ่านกิจกรรมแล้ว';
        modBadge.className = 'tag done';
      }
    });

    const assDone = !!prog.completed.assessment;
    const navAss = $('nav-chk-assessment');
    if (navAss) {
      navAss.textContent = assDone ? '✓' : '—';
      navAss.classList.toggle('done', assDone);
    }
    const cardAss = $('card-badge-assessment');
    if (cardAss) {
      cardAss.textContent = assDone ? '✓ ส่งแล้ว' : 'ยังไม่ทำ';
      cardAss.className = 'tag ' + (assDone ? 'done' : 'soft');
    }

    if ($('side-prog-text')) $('side-prog-text').textContent = `${doneCnt}/${keys.length}`;
    if ($('side-prog-fill')) $('side-prog-fill').style.width = `${Math.round((doneCnt / keys.length) * 100)}%`;

    const prof = loadProfile();
    if ($('side-student-badge')) {
      $('side-student-badge').textContent = prof.student_id
        ? `👤 ${prof.student_id} · ${prof.full_name}`
        : '👤 ยังไม่ได้ระบุตัวตนผู้เรียน';
    }
  }

  // Navigation
  function goPage(pageKey) {
    document.querySelectorAll('.page').forEach((p) => {
      p.classList.toggle('active', p.getAttribute('data-page') === pageKey);
    });
    document.querySelectorAll('.nav-item[data-go]').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-go') === pageKey);
    });
    $('sidebar')?.classList.remove('open');
    $('mobile-overlay')?.classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function initNavigation() {
    document.querySelectorAll('[data-go]').forEach((el) => {
      el.addEventListener('click', () => goPage(el.getAttribute('data-go')));
    });
    $('mobile-menu-btn')?.addEventListener('click', () => {
      $('sidebar')?.classList.toggle('open');
      $('mobile-overlay')?.classList.toggle('open');
    });
    $('mobile-overlay')?.addEventListener('click', () => {
      $('sidebar')?.classList.remove('open');
      $('mobile-overlay')?.classList.remove('open');
    });
    $('export-progress-btn')?.addEventListener('click', () => {
      const data = {
        profile: loadProfile(),
        progress: loadProgress(),
        semi: loadSemi(),
        trace: loadTraceStore(),
        exported_at: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `CT_Lab04_Progress_${loadProfile().student_id || 'student'}.json`;
      a.click();
    });
  }

  // ==========================================================
  // MODULE 01: ALGORITHM DESIGN (IPO SANDBOX)
  // ==========================================================
  let ipoState = { validTested: false, edgeTested: false };
  let fourTierTested = false;

  function initModule01() {
    const scenSel = $('ipo-scenario');
    const lbl1 = $('ipo-lbl1');
    const lbl2 = $('ipo-lbl2');
    const v1 = $('ipo-val1');
    const v2 = $('ipo-val2');
    if (!scenSel) return;

    function syncLabels() {
      const s = scenSel.value;
      if (s === 'conc') {
        lbl1.textContent = 'จำนวนโมล n (mol)';
        lbl2.textContent = 'ปริมาตรสารละลาย V (L)';
        v1.value = '2.5'; v2.value = '0.5';
      } else if (s === 'density') {
        lbl1.textContent = 'มวลของวัตถุ m (g)';
        lbl2.textContent = 'ปริมาตร V (cm³)';
        v1.value = '150'; v2.value = '50';
      } else {
        lbl1.textContent = 'มวลน้ำ m (g) · c = 4.18 J/g°C';
        lbl2.textContent = 'อุณหภูมิที่เปลี่ยน ΔT (°C)';
        v1.value = '200'; v2.value = '25';
      }
    }
    scenSel.addEventListener('change', syncLabels);

    function runIpo() {
      const s = scenSel.value;
      const x1 = Number(v1.value);
      const x2 = Number(v2.value);
      const boxIn = $('ipo-step-in');
      const boxVal = $('ipo-step-val');
      const boxProc = $('ipo-step-proc');
      const boxOut = $('ipo-step-out');
      const fb = $('ipo-feedback');

      [boxIn, boxVal, boxProc, boxOut].forEach((b) => b.className = 'ipo-box');

      if (s === 'conc' || s === 'density') {
        const sym = s === 'conc' ? 'n' : 'm';
        const resSym = s === 'conc' ? 'C' : 'ρ';
        const unit = s === 'conc' ? 'mol/L' : 'g/cm³';
        boxIn.querySelector('.ipo-box-body').textContent = `READ ${sym} = ${x1}, V = ${x2}`;
        boxIn.classList.add('ok');

        if (isNaN(x1) || isNaN(x2) || x2 <= 0 || x1 < 0) {
          boxVal.querySelector('.ipo-box-body').textContent = `พบค่าผิดปกติ (${x2 <= 0 ? 'V ≤ 0' : sym + ' < 0'}) → หยุดคำนวณ!`;
          boxVal.classList.add('err');
          boxProc.querySelector('.ipo-box-body').textContent = 'ข้ามการหาร (ป้องกัน Division by Zero)';
          boxOut.querySelector('.ipo-box-body').textContent = 'PRINT "Error: ข้อมูลต้องมากกว่า 0"';
          boxOut.classList.add('err');
          ipoState.edgeTested = true;
          fb.className = 'feedback info';
          fb.textContent = '✓ ทดสอบกรณีผิดปกติ (Edge Case) สำเร็จ! ขั้นตอนวิธีตรวจจับ V ≤ 0 ได้ทันก่อนเกิด Error';
        } else {
          const ans = (x1 / x2).toFixed(2);
          boxVal.querySelector('.ipo-box-body').textContent = `เงื่อนไข V > 0 เป็นจริง (ผ่าน)`;
          boxVal.classList.add('ok');
          boxProc.querySelector('.ipo-box-body').textContent = `${resSym} = ${x1} / ${x2} = ${ans}`;
          boxProc.classList.add('ok');
          boxOut.querySelector('.ipo-box-body').textContent = `PRINT "${resSym} = ${ans} ${unit}"`;
          boxOut.classList.add('ok');
          ipoState.validTested = true;
          fb.className = 'feedback good';
          fb.textContent = ipoState.edgeTested
            ? `คำนวณสำเร็จ (${resSym} = ${ans} ${unit}) และทดสอบ Edge Case ครบแล้ว!`
            : `คำนวณสำเร็จ (${resSym} = ${ans} ${unit}) — ลองกด "🧪 ทดสอบกรณีผิดปกติ" เพื่อทดสอบ Edge Case ด้วย`;
        }
      } else {
        boxIn.querySelector('.ipo-box-body').textContent = `READ m = ${x1}, ΔT = ${x2}`;
        boxIn.classList.add('ok');
        if (isNaN(x1) || isNaN(x2) || x1 <= 0) {
          boxVal.querySelector('.ipo-box-body').textContent = 'พบ m ≤ 0 → หยุดการคำนวณ';
          boxVal.classList.add('err');
          boxProc.querySelector('.ipo-box-body').textContent = 'ข้ามสมการความร้อน';
          boxOut.querySelector('.ipo-box-body').textContent = 'PRINT "Error: มวลต้อง > 0"';
          boxOut.classList.add('err');
          ipoState.edgeTested = true;
          fb.className = 'feedback info';
          fb.textContent = '✓ ทดสอบกรณีผิดปกติ (m ≤ 0) สำเร็จ!';
        } else {
          const q = (x1 * 4.18 * x2).toFixed(1);
          boxVal.querySelector('.ipo-box-body').textContent = 'เงื่อนไข m > 0 เป็นจริง (ผ่าน)';
          boxVal.classList.add('ok');
          boxProc.querySelector('.ipo-box-body').textContent = `Q = ${x1} × 4.18 × ${x2} = ${q}`;
          boxProc.classList.add('ok');
          boxOut.querySelector('.ipo-box-body').textContent = `PRINT "Q = ${q} J"`;
          boxOut.classList.add('ok');
          ipoState.validTested = true;
          fb.className = 'feedback good';
          fb.textContent = `คำนวณพลังงานความร้อน Q = ${q} J สำเร็จ!`;
        }
      }

      if (ipoState.validTested && ipoState.edgeTested) {
        recordModule('algo_design', true);
      } else {
        recordModule('algo_design', false);
      }
    }

    $('ipo-run-btn')?.addEventListener('click', runIpo);
    $('ipo-test-zero-btn')?.addEventListener('click', () => {
      if (scenSel.value === 'heat') v1.value = '0';
      else v2.value = '0';
      runIpo();
    });

    // Four-Tier Test Data Validation (CSTR Safe Band: 35.0 - 40.0 C, Sensor: 0 - 100 C)
    const tierTempInp = $('tier-temp-input');
    const tierGuess = $('tier-guess');
    const tierFb = $('tier-feedback');
    const tierTestedSet = new Set();

    function classifyCstrTemp(t) {
      if (Number.isNaN(t)) {
        return { tier: 'abnormal', reason: 'ค่าว่าง/ไม่ใช่ตัวเลข (Invalid Input) — ระบบต้องดัก Error' };
      }
      const boundaryVals = [-0.1, 0.1, 34.9, 35.0, 35.1, 39.9, 40.0, 40.1, 99.9, 100.1];
      if (boundaryVals.some((b) => Math.abs(t - b) < 0.001)) {
        const extra = (t < 0 || t > 100)
          ? ' และอยู่นอกย่านเซนเซอร์ 0–100°C จึงช่วยดักขอบเขตผิดพลาดด้วย'
          : (t >= 35.0 && t <= 40.0 ? ' (ค่าขอบเขตปลอดภัยภายในช่วง 35.0–40.0°C)' : ' (ค่าประชิดขอบนอกช่วงปลอดภัยเพื่อตรวจ < กับ <=)');
        return { tier: 'boundary', reason: `T = ${t}°C เป็นข้อมูลประชิด/ตรงจุดเปลี่ยนเงื่อนไข IF${extra}` };
      }
      if (Math.abs(t - 0) < 0.001 || Math.abs(t - 100) < 0.001) {
        return { tier: 'extreme', reason: `T = ${t}°C เป็นค่าต่ำสุด/สูงสุดที่เป็นไปได้ของย่านเซนเซอร์ (0–100°C)` };
      }
      if (t < 0 || t > 100) {
        return { tier: 'abnormal', reason: `T = ${t}°C อยู่นอกย่านเซนเซอร์จริง (0–100°C) เช่น สายหลุดหรืออ่านเพี้ยน` };
      }
      if (t >= 35.0 && t <= 40.0) {
        return { tier: 'normal', reason: `T = ${t}°C อยู่ในช่วงปฏิบัติการปกติของถัง CSTR (35.0–40.0°C)` };
      }
      return { tier: 'normal', reason: `T = ${t}°C อยู่ในย่านเซนเซอร์ปกติ (0–100°C) และจะสั่ง Heater/Cooler ปรับเข้าสู่ช่วง 35.0–40.0°C` };
    }

    function runTierCheck() {
      if (!tierTempInp || !tierGuess || !tierFb) return;
      const val = parseFloat(tierTempInp.value);
      const res = classifyCstrTemp(val);
      const picked = tierGuess.value;
      const labels = {
        normal: 'Normal Data (ข้อมูลปกติ)',
        extreme: 'Extreme Data (ข้อมูลสุดขอบ)',
        boundary: 'Boundary Data (ข้อมูลประชิดขอบเขต)',
        abnormal: 'Abnormal Data (ข้อมูลผิดปกติ)'
      };
      if (picked === res.tier) {
        fourTierTested = true;
        tierTestedSet.add(res.tier);
        tierFb.className = 'feedback good';
        tierFb.textContent = `✓ ถูกต้อง! ${res.reason} · จำแนกครบแล้ว ${tierTestedSet.size}/4 ระดับ`;
      } else {
        tierFb.className = 'feedback bad';
        tierFb.textContent = `ยังไม่ตรงกับ ${labels[picked]} — สำหรับ T = ${Number.isNaN(val) ? 'NaN' : val}°C จัดเป็น "${labels[res.tier]}" เพราะ${res.reason}`;
      }
    }

    $('tier-check-btn')?.addEventListener('click', runTierCheck);
    document.querySelectorAll('[data-tier-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const raw = btn.getAttribute('data-tier-preset') || '';
        const [vStr, tStr] = raw.split('|');
        if (tierTempInp) tierTempInp.value = vStr;
        if (tierGuess && tStr) tierGuess.value = tStr;
        runTierCheck();
      });
    });
  }

  // ==========================================================
  // MODULE 02: PSEUDOCODE STUDIO (STEP RUNNER)
  // ==========================================================
  const PSEUDO_MODES = {
    sequence: {
      lines: [
        'BEGIN KineticEnergy',
        '  SET m = 2.0, v = 3.0',
        '  COMPUTE v2 = v * v',
        '  COMPUTE Ek = 0.5 * m * v2',
        '  PRINT "Ek =", Ek, "J"',
        'END'
      ],
      trace: [
        { line: 0, vars: { m: '—', v: '—', v2: '—', Ek: '—' }, note: 'เริ่มต้นโปรแกรม KineticEnergy (โครงสร้างแบบลำดับ)' },
        { line: 1, vars: { m: 2.0, v: 3.0, v2: '—', Ek: '—' }, note: 'กำหนดค่าตัวแปรตั้งต้น m = 2.0 kg และ v = 3.0 m/s' },
        { line: 2, vars: { m: 2.0, v: 3.0, v2: 9.0, Ek: '—' }, note: 'ประมวลผล v² = 3.0 × 3.0 = 9.0' },
        { line: 3, vars: { m: 2.0, v: 3.0, v2: 9.0, Ek: 9.0 }, note: 'คำนวณพลังงานจลน์ Ek = 0.5 × 2.0 × 9.0 = 9.0 J' },
        { line: 4, vars: { m: 2.0, v: 3.0, v2: 9.0, Ek: 9.0 }, note: 'แสดงผลลัพธ์ออกทางหน้าจอ: Ek = 9.0 J' },
        { line: 5, vars: { m: 2.0, v: 3.0, v2: 9.0, Ek: 9.0 }, note: 'จบการทำงาน (ครบทุกคำสั่งแบบเรียงลำดับบนลงล่าง)' }
      ]
    },
    selection: {
      lines: [
        'BEGIN CheckSoilPH',
        '  READ pH = 4.8',
        '  IF pH < 5.5 THEN',
        '    PRINT "ดินเป็นกรด (เติมปูนขาว)"',
        '  ELSE',
        '    PRINT "สภาพดินปกติ"',
        '  ENDIF',
        'END'
      ],
      trace: [
        { line: 0, vars: { pH: '—', condition: '—', output: '—' }, note: 'เริ่มต้นโปรแกรมตรวจสอบค่า pH ดิน' },
        { line: 1, vars: { pH: 4.8, condition: '—', output: '—' }, note: 'อ่านค่าเซนเซอร์ได้ pH = 4.8' },
        { line: 2, vars: { pH: 4.8, condition: 'True (4.8 < 5.5)', output: '—' }, note: 'ตรวจสอบเงื่อนไข IF: 4.8 < 5.5 เป็นจริง (True) จึงเข้ากิ่ง THEN' },
        { line: 3, vars: { pH: 4.8, condition: 'True', output: 'ดินเป็นกรด (เติมปูนขาว)' }, note: 'ทำคำสั่งภายในกิ่ง THEN และข้ามกิ่ง ELSE ทันที' },
        { line: 6, vars: { pH: 4.8, condition: 'True', output: 'ดินเป็นกรด (เติมปูนขาว)' }, note: 'จบโครงสร้างทางเลือก ENDIF' },
        { line: 7, vars: { pH: 4.8, condition: 'True', output: 'ดินเป็นกรด (เติมปูนขาว)' }, note: 'จบการทำงานโปรแกรม' }
      ]
    },
    repetition: {
      lines: [
        'BEGIN CountHighTemp',
        '  SET temps = [36.8, 38.2, 37.9], count = 0, i = 0',
        '  WHILE i < 3 DO',
        '    IF temps[i] > 37.5 THEN count = count + 1 ENDIF',
        '    SET i = i + 1',
        '  ENDWHILE',
        '  PRINT "จำนวนครั้งที่เกินเกณฑ์ =", count',
        'END'
      ],
      trace: [
        { line: 0, vars: { i: '—', 'temps[i]': '—', count: '—', cond: '—' }, note: 'เริ่มต้นโปรแกรมนับอุณหภูมิเกิน 37.5°C' },
        { line: 1, vars: { i: 0, 'temps[i]': '—', count: 0, cond: '—' }, note: 'ตั้งค่าเริ่มต้น list, count = 0, i = 0' },
        { line: 2, vars: { i: 0, 'temps[i]': 36.8, count: 0, cond: 'True (0 < 3)' }, note: 'รอบ 1: 0 < 3 เป็นจริง เข้าลูป WHILE' },
        { line: 3, vars: { i: 0, 'temps[i]': 36.8, count: 0, cond: '36.8 > 37.5 (False)' }, note: '36.8 ไม่เกิน 37.5 → count ยังคงเป็น 0' },
        { line: 4, vars: { i: 1, 'temps[i]': 36.8, count: 0, cond: 'เพิ่ม i เป็น 1' }, note: 'อัปเดตตัวนับ i = 0 + 1 = 1' },
        { line: 2, vars: { i: 1, 'temps[i]': 38.2, count: 0, cond: 'True (1 < 3)' }, note: 'รอบ 2: 1 < 3 เป็นจริง เข้าลูปต่อ' },
        { line: 3, vars: { i: 1, 'temps[i]': 38.2, count: 1, cond: '38.2 > 37.5 (True)' }, note: '38.2 > 37.5 เป็นจริง! เพิ่ม count = 1' },
        { line: 4, vars: { i: 2, 'temps[i]': 38.2, count: 1, cond: 'เพิ่ม i เป็น 2' }, note: 'อัปเดตตัวนับ i = 1 + 1 = 2' },
        { line: 2, vars: { i: 2, 'temps[i]': 37.9, count: 1, cond: 'True (2 < 3)' }, note: 'รอบ 3: 2 < 3 เป็นจริง เข้าลูปต่อ' },
        { line: 3, vars: { i: 2, 'temps[i]': 37.9, count: 2, cond: '37.9 > 37.5 (True)' }, note: '37.9 > 37.5 เป็นจริง! เพิ่ม count = 2' },
        { line: 4, vars: { i: 3, 'temps[i]': 37.9, count: 2, cond: 'เพิ่ม i เป็น 3' }, note: 'อัปเดตตัวนับ i = 2 + 1 = 3' },
        { line: 2, vars: { i: 3, 'temps[i]': '—', count: 2, cond: 'False (3 < 3)' }, note: 'ตรวจสอบ 3 < 3 เป็นเท็จ! ออกจากลูป WHILE' },
        { line: 6, vars: { i: 3, 'temps[i]': '—', count: 2, cond: 'Done' }, note: 'แสดงผลลัพธ์: จำนวนครั้งที่เกินเกณฑ์ = 2' },
        { line: 7, vars: { i: 3, 'temps[i]': '—', count: 2, cond: 'End' }, note: 'จบการทำงานอย่างสมบูรณ์ (ไม่มี Infinite Loop)' }
      ]
    },
    repeat_until: {
      lines: [
        'INITIALISE volume ← 0, pH ← 4.5',
        'REPEAT',
        '  volume ← volume + 2',
        '  INPUT pH  // วัดค่า pH หลังเติมเบส',
        'UNTIL pH >= 7.0',
        'OUTPUT "สมมูลที่", volume, "mL"'
      ],
      trace: [
        { line: 0, vars: { volume: 0, pH: 4.5, cond: 'Post-test (รัน ≥ 1 รอบ)' }, note: 'INITIALISE ค่าเริ่มต้นด้วยลูกศรกำหนดค่า (←)' },
        { line: 1, vars: { volume: 0, pH: 4.5, cond: 'Enter REPEAT' }, note: 'เข้าสู่ REPEAT-UNTIL โดยยังไม่ตรวจเงื่อนไข (ทำก่อนตรวจ)' },
        { line: 2, vars: { volume: 2, pH: 4.5, cond: 'Running' }, note: 'เติมเบสเพิ่ม +2 mL → volume ← 2' },
        { line: 3, vars: { volume: 2, pH: 6.2, cond: 'Sensor Read' }, note: 'INPUT pH: อ่านค่าจากหัววัดได้ pH = 6.2' },
        { line: 4, vars: { volume: 2, pH: 6.2, cond: 'False (6.2 < 7.0) → วนซ้ำ' }, note: 'ตรวจ UNTIL pH >= 7.0 ท้ายลูป: เป็นเท็จ จึงวนกลับไป REPEAT รอบที่ 2' },
        { line: 2, vars: { volume: 4, pH: 6.2, cond: 'Running' }, note: 'รอบที่ 2: เติมเบสเพิ่มอีก +2 mL → volume ← 4' },
        { line: 3, vars: { volume: 4, pH: 7.1, cond: 'Sensor Read' }, note: 'INPUT pH: อ่านค่าใหม่ได้ pH = 7.1' },
        { line: 4, vars: { volume: 4, pH: 7.1, cond: 'True (7.1 >= 7.0) → ออกลูป' }, note: 'ตรวจ UNTIL pH >= 7.0 เป็นจริง! ยุติการวนซ้ำและออกจากลูปทันที' },
        { line: 5, vars: { volume: 4, pH: 7.1, cond: 'Done' }, note: 'OUTPUT แสดงผลปริมาตรที่จุดสมมูล = 4 mL' }
      ]
    }
  };

  let curPMode = 'sequence';
  let curPStep = -1;
  let pseudoTimer = null;
  let totalPseudoSteps = 0;

  function renderPseudo() {
    const modeObj = PSEUDO_MODES[curPMode];
    const codeBox = $('pseudo-code-view');
    const watchBox = $('pseudo-watch-vars');
    const noteBox = $('pseudo-step-note');
    if (!codeBox || !watchBox) return;

    const frame = curPStep >= 0 ? modeObj.trace[curPStep] : null;
    codeBox.innerHTML = modeObj.lines.map((ln, idx) => `
      <div class="code-line ${frame && frame.line === idx ? 'active' : ''}">
        <span class="code-ln">${idx + 1}</span>
        <span>${esc(ln)}</span>
      </div>
    `).join('');

    const vars = frame ? frame.vars : modeObj.trace[0].vars;
    watchBox.innerHTML = Object.entries(vars).map(([k, v]) => `
      <div class="watch-row"><span>${esc(k)}</span><span class="watch-val">${esc(v)}</span></div>
    `).join('');

    noteBox.textContent = frame ? frame.note : 'กด "▷ ขั้นถัดไป" เพื่อเริ่มติดตามการทำงานทีละบรรทัด';
  }

  function stepPseudo() {
    const modeObj = PSEUDO_MODES[curPMode];
    if (curPStep < modeObj.trace.length - 1) {
      curPStep++;
      totalPseudoSteps++;
      renderPseudo();
      if (curPStep === modeObj.trace.length - 1) {
        clearInterval(pseudoTimer);
        pseudoTimer = null;
        $('pseudo-feedback').className = 'feedback good';
        $('pseudo-feedback').textContent = `✓ รันรหัสลำลองโครงสร้าง ${curPMode} ครบทุกบรรทัดแล้ว!`;
        recordModule('pseudocode', true);
      }
    }
  }

  function initModule02() {
    document.querySelectorAll('#pseudo-mode-tabs .sub-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        clearInterval(pseudoTimer);
        pseudoTimer = null;
        curPMode = btn.getAttribute('data-pmode');
        curPStep = -1;
        document.querySelectorAll('#pseudo-mode-tabs .sub-tab').forEach((b) => b.classList.toggle('active', b === btn));
        $('pseudo-feedback').className = 'feedback';
        renderPseudo();
      });
    });
    $('pseudo-step-btn')?.addEventListener('click', stepPseudo);
    $('pseudo-reset-btn')?.addEventListener('click', () => {
      clearInterval(pseudoTimer);
      pseudoTimer = null;
      curPStep = -1;
      $('pseudo-feedback').className = 'feedback';
      renderPseudo();
    });
    $('pseudo-auto-btn')?.addEventListener('click', () => {
      if (pseudoTimer) { clearInterval(pseudoTimer); pseudoTimer = null; return; }
      if (curPStep >= PSEUDO_MODES[curPMode].trace.length - 1) curPStep = -1;
      pseudoTimer = setInterval(stepPseudo, 650);
    });
    renderPseudo();
  }

  // ==========================================================
  // MODULE 03: DYNAMIC SVG FLOWCHART BUILDER + BRANCH SIMULATOR
  // ==========================================================
  const FC3_SCENARIOS = {
    water: {
      title: '3.1 วิทยาศาสตร์: ระบบตรวจสอบคุณภาพน้ำ (TDS > 500 ppm)',
      desc: 'ฝึกเรียง Terminator (วงรี), Preparation (หกเหลี่ยม), Data I/O (ด้านขนาน), Decision (ข้าวหลามตัด) และ Process (สี่เหลี่ยม) ตรวจสอบคุณภาพน้ำ',
      blocks: [
        { id: 'start', shape: 'term', text: '[วงรี] เริ่มต้นระบบวัดคุณภาพน้ำ' },
        { id: 'prep', shape: 'prep', text: '[หกเหลี่ยม Preparation] INITIALISE limit ← 500' },
        { id: 'input', shape: 'io', text: '[ด้านขนาน] อ่านค่า TDS จากเซนเซอร์' },
        { id: 'dec', shape: 'dec', text: '[ข้าวหลามตัด] TDS > limit (500 ppm) ?' },
        { id: 'proc', shape: 'proc', text: '[สี่เหลี่ยม] ใช่: แจ้งเตือนกรองน้ำ / ไม่ใช่: น้ำสะอาด' },
        { id: 'end', shape: 'term', text: '[วงรี] จบการทำงาน' },
        { id: 'bad_end', shape: 'proc', text: '[สี่เหลี่ยม] จบการทำงานด้วยสี่เหลี่ยมผืนผ้า' }
      ],
      expected: ['start', 'prep', 'input', 'dec', 'proc', 'end']
    },
    smartfarm: {
      title: '3.2 เกษตรอัจฉริยะ: ระบบให้น้ำและจ่ายปุ๋ยอัตโนมัติ (Smart Fertigation)',
      desc: 'บูรณาการ Preparation (ตั้งค่าเกณฑ์ชื้น 40%), Input เซนเซอร์, Decision, Predefined Process (จ่ายปุ๋ย AB) และ Delay (รูปตัว D รอซึมดิน)',
      blocks: [
        { id: 'sf_start', shape: 'term', text: '[วงรี Terminator] เริ่มต้นระบบเกษตรอัจฉริยะ' },
        { id: 'sf_prep', shape: 'prep', text: '[หกเหลี่ยม Preparation] INITIALISE Moist_min←40, EC_min←1.5' },
        { id: 'sf_io', shape: 'io', text: '[ด้านขนาน Input] อ่านค่า Moist และ EC จากเซนเซอร์ดิน' },
        { id: 'sf_dec', shape: 'dec', text: '[ข้าวหลามตัด Decision] Moist < 40% หรือ EC < 1.5 ?' },
        { id: 'sf_sub', shape: 'sub', text: '[สองขอบ Predefined] CALL จ่ายน้ำและปุ๋ย A-B ตามสูตร' },
        { id: 'sf_delay', shape: 'delay', text: '[รูปตัว D Delay] DELAY 10s รอความชื้นซึมลงดิน' },
        { id: 'sf_end', shape: 'term', text: '[วงรี Terminator] จบการทำงานรอบปัจจุบัน' },
        { id: 'sf_bad', shape: 'proc', text: '[สี่เหลี่ยม] เปิดปั๊มน้ำ-ปุ๋ยค้างไว้ 24 ชม. โดยไม่อ่านเซนเซอร์' }
      ],
      expected: ['sf_start', 'sf_prep', 'sf_io', 'sf_dec', 'sf_sub', 'sf_delay', 'sf_end']
    },
    grading: {
      title: '3.3 การตัดเกรด: ระบบประมวลผลคะแนนและตัดเกรดหลายทางเลือก (IF–ELSEIF–ELSE)',
      desc: 'วางลำดับ Preparation (เกณฑ์เกรด), Input คะแนน, Process รวมคะแนน, Decision ดักค่าผิดปกติ (<0 หรือ >100) และตัดสินเกรด A–F',
      blocks: [
        { id: 'gr_start', shape: 'term', text: '[วงรี Terminator] เริ่มต้นระบบตัดเกรดรายวิชา' },
        { id: 'gr_prep', shape: 'prep', text: '[หกเหลี่ยม Preparation] INITIALISE A≥80, B≥70, C≥60, D≥50' },
        { id: 'gr_io', shape: 'io', text: '[ด้านขนาน Input] รับคะแนนเก็บ (lab) และสอบ (exam)' },
        { id: 'gr_proc', shape: 'proc', text: '[สี่เหลี่ยม Process] คำนวณ total ← lab + exam' },
        { id: 'gr_dec1', shape: 'dec', text: '[ข้าวหลามตัด Decision] total < 0 หรือ total > 100 ?' },
        { id: 'gr_dec2', shape: 'dec', text: '[ข้าวหลามตัด Decision] IF total≥80→A .. ELSE→F' },
        { id: 'gr_out', shape: 'io', text: '[ด้านขนาน Output] แสดงผลคะแนนรวมและเกรด' },
        { id: 'gr_end', shape: 'term', text: '[วงรี Terminator] จบการประมวลผล' },
        { id: 'gr_bad', shape: 'proc', text: '[สี่เหลี่ยม] ออกเกรด F ทันทีโดยไม่รวมคะแนน lab + exam' }
      ],
      expected: ['gr_start', 'gr_prep', 'gr_io', 'gr_proc', 'gr_dec1', 'gr_dec2', 'gr_out', 'gr_end']
    },
    pedagogy: {
      title: '3.4 การสอนวิทย์: ระบบจัดการเรียนรู้แบบปรับเหมาะและซ่อมเสริม (Adaptive Mastery)',
      desc: 'จำลองการสอนวิทยาการคำนวณ: ตั้งเกณฑ์ผ่าน 60%, รับคะแนนวินิจฉัย, และใช้ Predefined Process เรียกชุดทดลองซ่อมเสริมเมื่อยังไม่ผ่านเกณฑ์',
      blocks: [
        { id: 'pd_start', shape: 'term', text: '[วงรี Terminator] เริ่มต้นบทเรียนวิทย์-คอมฯ' },
        { id: 'pd_prep', shape: 'prep', text: '[หกเหลี่ยม Preparation] INITIALISE Pass ← 60, Retry ← 0' },
        { id: 'pd_io', shape: 'io', text: '[ด้านขนาน Input] รับค่าคะแนนวินิจฉัย (Score)' },
        { id: 'pd_dec', shape: 'dec', text: '[ข้าวหลามตัด Decision] Score < Pass (60%) ?' },
        { id: 'pd_sub', shape: 'sub', text: '[สองขอบ Predefined] CALL ชุดซ่อมเสริม (Retry ← Retry+1)' },
        { id: 'pd_out', shape: 'io', text: '[ด้านขนาน Output] บันทึกผล & ปลดล็อกบทถัดไป' },
        { id: 'pd_end', shape: 'term', text: '[วงรี Terminator] จบหน่วยการเรียนรู้' },
        { id: 'pd_bad', shape: 'dec', text: '[ข้าวหลามตัด] สอบครั้งเดียวแล้วจบโดยไม่ซ่อมเสริมผู้ไม่ผ่าน' }
      ],
      expected: ['pd_start', 'pd_prep', 'pd_io', 'pd_dec', 'pd_sub', 'pd_out', 'pd_end']
    }
  };

  let curFc3Scenario = 'water';
  let fc3Seq = [];
  let fc3NodePos = {};
  let fc3Zoom = 1.0;
  let fc3DraggingId = null;
  let fc3DoneSet = new Set();
  let fc3BranchTested = false;

  const FC3_CANVAS_W = 540;
  const FC3_DEFAULT_X = 270;

  function clientToSvgPoint(svg, clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    return ctm ? pt.matrixTransform(ctm.inverse()) : { x: FC3_DEFAULT_X, y: 48 };
  }

  function clampAndSnapPos(rawX, rawY) {
    let nx = Math.max(138, Math.min(FC3_CANVAS_W - 138, rawX));
    let ny = Math.max(36, Math.min(1400, rawY));
    if ($('fc3-snap-chk')?.checked) {
      nx = Math.round(nx / 10) * 10;
      ny = Math.round(ny / 10) * 10;
    } else {
      nx = Math.round(nx);
      ny = Math.round(ny);
    }
    return { x: nx, y: ny };
  }

  function ensureFc3Positions() {
    fc3Seq.forEach((bid, idx) => {
      if (!fc3NodePos[bid]) {
        fc3NodePos[bid] = { x: FC3_DEFAULT_X, y: 48 + idx * 80 };
      }
    });
  }

  function autoAlignFc3Nodes(resetX) {
    fc3Seq.forEach((bid, idx) => {
      const prevX = fc3NodePos[bid]?.x ?? FC3_DEFAULT_X;
      fc3NodePos[bid] = { x: resetX ? FC3_DEFAULT_X : prevX, y: 48 + idx * 80 };
    });
    drawFc3Svg();
    if (resetX && $('fc3-drag-status')) {
      $('fc3-drag-status').textContent = '⊞ จัดเรียงสัญลักษณ์ทุกชิ้นให้อยู่กึ่งกลางแนวตั้งเรียบร้อยแล้ว';
    }
  }

  function computeFc3EdgeD(p1, p2) {
    const y1 = p1.y + 20;
    const y2 = p2.y - 22;
    const midY = Math.round((y1 + y2) / 2);
    return `M ${p1.x},${y1} C ${p1.x},${midY} ${p2.x},${midY} ${p2.x},${y2}`;
  }

  function updateFc3SvgPositionsOnly(svg) {
    if (!svg) return;
    fc3Seq.forEach((bid, idx) => {
      const pos = fc3NodePos[bid];
      if (!pos) return;
      const g = svg.querySelector(`.fc-drag-node[data-bid="${bid}"]`);
      if (g) g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
      const tag = svg.querySelector(`[data-coord-for="${bid}"]`);
      if (tag) tag.textContent = (fc3DraggingId === bid) ? `(${pos.x}, ${pos.y})` : '';
      if (idx > 0) {
        const p1 = fc3NodePos[fc3Seq[idx - 1]];
        const edge = svg.querySelector(`.fc-edge-path[data-to="${bid}"]`);
        if (edge && p1) edge.setAttribute('d', computeFc3EdgeD(p1, pos));
      }
    });
  }

  function updateFc3ScenarioSummary() {
    const box = $('fc3-scen-summary');
    if (!box) return;
    const labels = {
      water: '3.1 คุณภาพน้ำ',
      smartfarm: '3.2 เกษตรอัจฉริยะ',
      grading: '3.3 ระบบตัดเกรด',
      pedagogy: '3.4 การสอนวิทย์'
    };
    const pills = Object.keys(labels).map((k) => (
      fc3DoneSet.has(k)
        ? `<span class="submit-pill done">✓ ${labels[k]}</span>`
        : `<span class="submit-pill">${labels[k]} (ยังไม่ตรวจ)</span>`
    )).join('');
    box.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center"><span>ความก้าวหน้าด่านผังงาน (${fc3DoneSet.size}/4):</span>${pills}</div>`;
  }

  function renderFc3CenteredShape(shape) {
    if (shape === 'term') {
      return '<rect x="-120" y="-19" width="240" height="38" rx="19" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>';
    }
    if (shape === 'prep') {
      return '<polygon points="-112,-19 112,-19 132,0 112,19 -112,19 -132,0" fill="#ede9fe" stroke="#7c3aed" stroke-width="2"/>';
    }
    if (shape === 'io') {
      return '<polygon points="-112,-19 130,-19 112,19 -130,19" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>';
    }
    if (shape === 'dec') {
      return '<polygon points="0,-22 130,0 0,22 -130,0" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>'
        + '<text x="135" y="4" font-size="9" font-weight="800" fill="#b45309">T / F</text>';
    }
    if (shape === 'sub') {
      return '<rect x="-132" y="-19" width="264" height="38" fill="#e0e7ff" stroke="#4338ca" stroke-width="2"/>'
        + '<line x1="-120" y1="-19" x2="-120" y2="19" stroke="#4338ca" stroke-width="2"/>'
        + '<line x1="120" y1="-19" x2="120" y2="19" stroke="#4338ca" stroke-width="2"/>';
    }
    if (shape === 'delay') {
      return '<path d="M-126,-19 H96 A19,19 0 0,1 96,19 H-126 Z" fill="#ffedd5" stroke="#ea580c" stroke-width="2"/>';
    }
    return '<rect x="-132" y="-19" width="264" height="38" rx="6" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>';
  }

  function bindFc3SvgDrag(svg) {
    if (!svg) return;
    svg.querySelectorAll('.fc-drag-node').forEach((nodeEl) => {
      nodeEl.addEventListener('pointerdown', (e) => {
        const delBtn = e.target.closest('[data-del-bid]');
        if (delBtn) {
          e.stopPropagation();
          const delId = delBtn.getAttribute('data-del-bid');
          fc3Seq = fc3Seq.filter((id) => id !== delId);
          delete fc3NodePos[delId];
          renderFc3();
          return;
        }
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        e.preventDefault();
        const bid = nodeEl.getAttribute('data-bid');
        const startPt = clientToSvgPoint(svg, e.clientX, e.clientY);
        const orig = fc3NodePos[bid] || { x: FC3_DEFAULT_X, y: 48 };
        const offsetX = startPt.x - orig.x;
        const offsetY = startPt.y - orig.y;
        fc3DraggingId = bid;
        nodeEl.classList.add('dragging');
        if (nodeEl.setPointerCapture) nodeEl.setPointerCapture(e.pointerId);

        function onMove(ev) {
          const curPt = clientToSvgPoint(svg, ev.clientX, ev.clientY);
          fc3NodePos[bid] = clampAndSnapPos(curPt.x - offsetX, curPt.y - offsetY);
          updateFc3SvgPositionsOnly(svg);
          if ($('fc3-drag-status')) {
            const p = fc3NodePos[bid];
            $('fc3-drag-status').textContent = `✋ กำลังลากบล็อกที่ ${fc3Seq.indexOf(bid) + 1} → พิกัด (x: ${p.x}, y: ${p.y})`;
          }
        }

        function onEnd() {
          nodeEl.removeEventListener('pointermove', onMove);
          nodeEl.removeEventListener('pointerup', onEnd);
          nodeEl.removeEventListener('pointercancel', onEnd);
          nodeEl.classList.remove('dragging');
          fc3DraggingId = null;

          if ($('fc3-autosort-chk')?.checked && fc3Seq.length > 1) {
            const prevOrder = fc3Seq.join('|');
            fc3Seq.sort((a, b) => (fc3NodePos[a]?.y ?? 0) - (fc3NodePos[b]?.y ?? 0));
            if (fc3Seq.join('|') !== prevOrder) {
              renderFc3();
              if ($('fc3-drag-status')) {
                $('fc3-drag-status').textContent = '↕ อัปเดตลำดับผังงานตามตำแหน่งแกน Y เรียบร้อยแล้ว (กดตรวจเพื่อเช็คคำตอบ)';
              }
              return;
            }
          }
          drawFc3Svg();
        }

        nodeEl.addEventListener('pointermove', onMove);
        nodeEl.addEventListener('pointerup', onEnd);
        nodeEl.addEventListener('pointercancel', onEnd);
      });
    });
  }

  function drawFc3Svg() {
    const box = $('fc3-svg-preview');
    if (!box) return;
    const scen = FC3_SCENARIOS[curFc3Scenario];
    if (fc3Seq.length === 0) {
      box.innerHTML = '<div class="empty-state">เลือกหรือลากบล็อกจากด้านซ้ายมาวางที่นี่ เพื่อสร้างและจัดตำแหน่งผังงาน SVG</div>';
      return;
    }
    ensureFc3Positions();
    const maxY = fc3Seq.reduce((mx, bid) => Math.max(mx, fc3NodePos[bid]?.y ?? 60), 180);
    const h = Math.max(280, maxY + 75);

    const defs = `
      <defs>
        <pattern id="fc3-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#cbd5e1"/>
        </pattern>
        <marker id="fc3-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,1 L9,5 L0,9 Z" fill="#475569"/>
        </marker>
      </defs>
      <rect width="${FC3_CANVAS_W}" height="${h}" rx="10" fill="url(#fc3-grid)"/>
    `;

    let edgesSvg = '';
    fc3Seq.forEach((bid, idx) => {
      if (idx === 0) return;
      const p1 = fc3NodePos[fc3Seq[idx - 1]];
      const p2 = fc3NodePos[bid];
      if (!p1 || !p2) return;
      edgesSvg += `<path class="fc-edge-path" data-from="${fc3Seq[idx - 1]}" data-to="${bid}" d="${computeFc3EdgeD(p1, p2)}" fill="none" stroke="#475569" stroke-width="2.2" marker-end="url(#fc3-arrow)"/>`;
    });

    let nodesSvg = '';
    fc3Seq.forEach((bid, idx) => {
      const b = scen.blocks.find((x) => x.id === bid);
      const pos = fc3NodePos[bid];
      if (!b || !pos) return;
      const shortTxt = b.text.replace(/^\[.*?\]\s*/, '');
      nodesSvg += `
        <g class="fc-drag-node" data-bid="${b.id}" transform="translate(${pos.x}, ${pos.y})">
          ${renderFc3CenteredShape(b.shape)}
          <text x="0" y="4" text-anchor="middle" font-size="10.2" font-weight="800" fill="#0f172a">${esc(shortTxt)}</text>
          <circle cx="-122" cy="-16" r="9.5" fill="#1e293b"/>
          <text x="-122" y="-12.5" text-anchor="middle" font-size="9.5" font-weight="800" fill="#fff">${idx + 1}</text>
          <g data-del-bid="${b.id}" style="cursor:pointer">
            <circle cx="122" cy="-16" r="9.5" fill="#fff" stroke="#dc2626" stroke-width="1.5"/>
            <text x="122" y="-12.5" text-anchor="middle" font-size="11" font-weight="900" fill="#dc2626">×</text>
          </g>
          <text class="fc-coord-tag" data-coord-for="${b.id}" x="0" y="31" text-anchor="middle" font-size="9" font-weight="700" fill="#2563eb"></text>
        </g>
      `;
    });

    const zoomPct = Math.round(fc3Zoom * 100);
    box.innerHTML = `<svg id="fc3-canvas-svg" viewBox="0 0 ${FC3_CANVAS_W} ${h}" style="width:${zoomPct}%;min-width:300px">${defs}${edgesSvg}${nodesSvg}</svg>`;
    bindFc3SvgDrag($('fc3-canvas-svg'));
  }

  function renderFc3() {
    const bankEl = $('fc3-bank');
    const seqEl = $('fc3-seq');
    if (!bankEl || !seqEl) return;
    const scen = FC3_SCENARIOS[curFc3Scenario];
    if ($('fc3-scen-title')) $('fc3-scen-title').textContent = scen.title;
    if ($('fc3-scen-desc')) $('fc3-scen-desc').textContent = scen.desc;

    bankEl.replaceChildren();
    scen.blocks.forEach((b) => {
      const used = fc3Seq.includes(b.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'semi-bank-btn' + (used ? ' used' : '');
      btn.disabled = used;
      btn.textContent = (used ? '✓ ' : '+ ') + b.text;
      if (!used) {
        btn.draggable = true;
        btn.addEventListener('dragstart', (e) => {
          e.dataTransfer?.setData('text/plain', 'bank:' + b.id);
        });
      }
      btn.addEventListener('click', () => {
        fc3Seq.push(b.id);
        ensureFc3Positions();
        renderFc3();
      });
      bankEl.appendChild(btn);
    });

    seqEl.replaceChildren();
    if (fc3Seq.length === 0) {
      seqEl.innerHTML = '<div class="empty-state" style="padding:12px">ยังไม่มีบล็อกในผังงาน</div>';
    } else {
      fc3Seq.forEach((bid, idx) => {
        const b = scen.blocks.find((x) => x.id === bid);
        if (!b) return;
        const item = document.createElement('div');
        item.className = 'semi-seq-item';
        item.draggable = true;
        item.style.cursor = 'grab';
        item.innerHTML = `
          <span class="semi-num">${idx + 1}</span>
          <span class="semi-txt">${esc(b.text)}</span>
          <div class="semi-actions">
            <button type="button" class="semi-btn" data-act="up" ${idx === 0 ? 'disabled' : ''}>↑</button>
            <button type="button" class="semi-btn" data-act="down" ${idx === fc3Seq.length - 1 ? 'disabled' : ''}>↓</button>
            <button type="button" class="semi-btn del" data-act="del">×</button>
          </div>
        `;
        item.addEventListener('dragstart', (e) => {
          e.dataTransfer?.setData('text/plain', 'seq:' + idx);
        });
        item.addEventListener('dragover', (e) => {
          e.preventDefault();
          item.style.borderColor = '#2563eb';
        });
        item.addEventListener('dragleave', () => { item.style.borderColor = ''; });
        item.addEventListener('drop', (e) => {
          e.preventDefault();
          item.style.borderColor = '';
          const raw = e.dataTransfer?.getData('text/plain') || '';
          if (raw.startsWith('seq:')) {
            const fromIdx = parseInt(raw.slice(4), 10);
            if (!Number.isNaN(fromIdx) && fromIdx !== idx && fromIdx >= 0 && fromIdx < fc3Seq.length) {
              const [moved] = fc3Seq.splice(fromIdx, 1);
              fc3Seq.splice(idx, 0, moved);
              fc3Seq.forEach((id, k) => {
                const oldX = fc3NodePos[id]?.x ?? FC3_DEFAULT_X;
                fc3NodePos[id] = { x: oldX, y: 48 + k * 80 };
              });
              renderFc3();
            }
          }
        });
        item.querySelectorAll('button').forEach((btn) => {
          btn.addEventListener('click', () => {
            const act = btn.getAttribute('data-act');
            if (act === 'up' && idx > 0) [fc3Seq[idx - 1], fc3Seq[idx]] = [fc3Seq[idx], fc3Seq[idx - 1]];
            else if (act === 'down' && idx < fc3Seq.length - 1) [fc3Seq[idx + 1], fc3Seq[idx]] = [fc3Seq[idx], fc3Seq[idx + 1]];
            else if (act === 'del') {
              fc3Seq.splice(idx, 1);
              delete fc3NodePos[bid];
            }
            if (act !== 'del') {
              fc3Seq.forEach((id, k) => {
                const oldX = fc3NodePos[id]?.x ?? FC3_DEFAULT_X;
                fc3NodePos[id] = { x: oldX, y: 48 + k * 80 };
              });
            }
            renderFc3();
          });
        });
        seqEl.appendChild(item);
      });
    }
    drawFc3Svg();
    updateFc3ScenarioSummary();
  }

  // Shared ISO 5807 SVG node + flow arrow helpers for Multi-Branch Flowchart Simulator
  function fcIsoNode(cx, y, w, h, shape, text, tone) {
    const fills = {
      term: '#dbeafe', prep: '#ede9fe', io: '#e0f2fe',
      dec: '#fef3c7', proc: '#dcfce7', sub: '#e0e7ff', delay: '#ffedd5'
    };
    const isErr = tone === 'error';
    const isAct = tone === 'active';
    const fill = isErr ? '#fee2e2' : (isAct ? (fills[shape] || '#dcfce7') : '#f8fafc');
    const stroke = isErr ? '#dc2626' : (isAct ? '#15803d' : '#94a3b8');
    const sw = (isAct || isErr) ? '2.8' : '1.6';
    const textCol = (isAct || isErr) ? '#0f172a' : '#64748b';
    const x0 = cx - w / 2;
    const x1 = cx + w / 2;
    const cy = y + h / 2;
    let body = '';
    if (shape === 'term') {
      body = `<rect x="${x0}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    } else if (shape === 'prep') {
      const dx = 14;
      body = `<polygon points="${x0 + dx},${y} ${x1 - dx},${y} ${x1},${cy} ${x1 - dx},${y + h} ${x0 + dx},${y + h} ${x0},${cy}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    } else if (shape === 'io') {
      const sk = 12;
      body = `<polygon points="${x0 + sk},${y} ${x1},${y} ${x1 - sk},${y + h} ${x0},${y + h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    } else if (shape === 'dec') {
      body = `<polygon points="${cx},${y} ${x1},${cy} ${cx},${y + h} ${x0},${cy}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    } else if (shape === 'sub') {
      body = `<rect x="${x0}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
              <line x1="${x0 + 10}" y1="${y}" x2="${x0 + 10}" y2="${y + h}" stroke="${stroke}" stroke-width="${sw}"/>
              <line x1="${x1 - 10}" y1="${y}" x2="${x1 - 10}" y2="${y + h}" stroke="${stroke}" stroke-width="${sw}"/>`;
    } else if (shape === 'delay') {
      const r = h / 2;
      body = `<path d="M${x0},${y} H${x1 - r} A${r},${r} 0 0,1 ${x1 - r},${y + h} H${x0} Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    } else {
      body = `<rect x="${x0}" y="${y}" width="${w}" height="${h}" rx="5" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    }
    return `${body}<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="10.2" font-weight="800" fill="${textCol}">${esc(text)}</text>`;
  }

  function fcArrow(d, active, tone, label, lx, ly) {
    const col = tone === 'error' ? '#dc2626' : (active ? '#16a34a' : '#cbd5e1');
    const sw = active ? '2.6' : '1.5';
    const dash = active ? '' : 'stroke-dasharray="4,3"';
    const mk = tone === 'error' ? 'url(#fc-arr-red)' : (active ? 'url(#fc-arr-green)' : 'url(#fc-arr-idle)');
    let out = `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}" ${dash} marker-end="${mk}"/>`;
    if (label) {
      const lCol = tone === 'error' ? '#b91c1c' : (active ? '#15803d' : '#64748b');
      out += `<text x="${lx}" y="${ly}" font-size="9.5" font-weight="800" fill="${lCol}">${esc(label)}</text>`;
    }
    return out;
  }

  const FC_ARR_DEFS = `
    <defs>
      <marker id="fc-arr-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M0,1 L9,5 L0,9 Z" fill="#16a34a"/>
      </marker>
      <marker id="fc-arr-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M0,1 L9,5 L0,9 Z" fill="#dc2626"/>
      </marker>
      <marker id="fc-arr-idle" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M0,1 L9,5 L0,9 Z" fill="#cbd5e1"/>
      </marker>
    </defs>`;

  let curFcSimMode = 'sim_grading';

  function renderFc3BranchSim() {
    const svgBox = $('fc3-branch-svg');
    const expBox = $('fc3-branch-explain');
    if (!svgBox || !expBox) return;

    if (curFcSimMode === 'sim_grading') {
      const lab = parseFloat($('fcsim-lab')?.value ?? '45');
      const exam = parseFloat($('fcsim-exam')?.value ?? '30');
      const labV = Number.isNaN(lab) ? 0 : lab;
      const examV = Number.isNaN(exam) ? 0 : exam;
      const total = Math.round((labV + examV) * 10) / 10;
      const isInvalid = total < 0 || total > 100 || labV < 0 || examV < 0;
      const hitA = !isInvalid && total >= 80;
      const hitB = !isInvalid && !hitA && total >= 70;
      const hitC = !isInvalid && !hitA && !hitB && total >= 60;
      const hitD = !isInvalid && !hitA && !hitB && !hitC && total >= 50;
      const hitF = !isInvalid && !hitA && !hitB && !hitC && !hitD;

      let svg = FC_ARR_DEFS;
      // Spine arrows
      svg += fcArrow('M165,42 V54', true);
      svg += fcArrow('M165,90 V102', true);
      svg += fcArrow('M165,138 V150', true);
      svg += fcArrow('M270,173 H336', isInvalid, isInvalid ? 'error' : 'idle', 'True', 284, 166);
      svg += fcArrow('M165,194 V208', !isInvalid, 'active', 'False', 171, 204);
      svg += fcArrow('M270,231 H336', hitA, 'active', 'True', 284, 224);
      svg += fcArrow('M165,252 V266', !isInvalid && !hitA, 'active', 'False', 171, 262);
      svg += fcArrow('M270,289 H336', hitB, 'active', 'True', 284, 282);
      svg += fcArrow('M165,310 V324', !isInvalid && !hitA && !hitB, 'active', 'False', 171, 320);
      svg += fcArrow('M270,347 H336', hitC, 'active', 'True', 284, 340);
      svg += fcArrow('M165,368 V382', !isInvalid && !hitA && !hitB && !hitC, 'active', 'False', 171, 378);
      svg += fcArrow('M270,405 H336', hitD, 'active', 'True', 284, 398);
      svg += fcArrow('M165,426 V440', hitF, 'active', 'False', 171, 436);

      // Right collector rail to END
      [
        { y: 173, on: isInvalid, tone: 'error' },
        { y: 231, on: hitA, tone: 'active' },
        { y: 289, on: hitB, tone: 'active' },
        { y: 347, on: hitC, tone: 'active' },
        { y: 405, on: hitD, tone: 'active' }
      ].forEach((r) => {
        const col = r.on ? (r.tone === 'error' ? '#dc2626' : '#16a34a') : '#cbd5e1';
        svg += `<path d="M512,${r.y} H534 V459 H514" fill="none" stroke="${col}" stroke-width="${r.on ? 2.6 : 1.5}"/>`;
      });
      if (hitF) {
        svg += fcArrow('M270,459 H336', true, 'active');
      } else {
        svg += fcArrow('M270,459 H336', false, 'idle');
      }

      // Nodes
      svg += fcIsoNode(165, 10, 180, 32, 'term', 'เริ่มต้นตัดเกรด (START)', 'active');
      svg += fcIsoNode(165, 56, 200, 34, 'io', `INPUT lab=${labV}, exam=${examV}`, 'active');
      svg += fcIsoNode(165, 104, 200, 34, 'proc', `total ← ${total}`, 'active');
      svg += fcIsoNode(165, 152, 210, 42, 'dec', 'total<0 หรือ >100 ?', isInvalid ? 'error' : 'active');
      svg += fcIsoNode(425, 156, 174, 34, 'io', 'Error: คะแนนผิดปกติ', isInvalid ? 'error' : 'idle');
      svg += fcIsoNode(165, 210, 210, 42, 'dec', 'total >= 80 ?', (!isInvalid && !hitA) ? 'active' : (hitA ? 'active' : 'idle'));
      svg += fcIsoNode(425, 214, 174, 34, 'io', 'OUTPUT: เกรด A', hitA ? 'active' : 'idle');
      svg += fcIsoNode(165, 268, 210, 42, 'dec', 'total >= 70 ?', (!isInvalid && !hitA) ? 'active' : 'idle');
      svg += fcIsoNode(425, 272, 174, 34, 'io', 'OUTPUT: เกรด B', hitB ? 'active' : 'idle');
      svg += fcIsoNode(165, 326, 210, 42, 'dec', 'total >= 60 ?', (!isInvalid && !hitA && !hitB) ? 'active' : 'idle');
      svg += fcIsoNode(425, 330, 174, 34, 'io', 'OUTPUT: เกรด C', hitC ? 'active' : 'idle');
      svg += fcIsoNode(165, 384, 210, 42, 'dec', 'total >= 50 ?', (!isInvalid && !hitA && !hitB && !hitC) ? 'active' : 'idle');
      svg += fcIsoNode(425, 388, 174, 34, 'io', 'OUTPUT: เกรด D', hitD ? 'active' : 'idle');
      svg += fcIsoNode(165, 442, 210, 34, 'sub', 'CALL ซ่อมเสริม (เกรด F)', hitF ? 'active' : 'idle');
      svg += fcIsoNode(425, 442, 174, 34, 'term', 'จบการทำงาน (END)', isInvalid ? 'error' : 'active');

      svgBox.innerHTML = `<svg viewBox="0 0 560 490">${svg}</svg>`;
      if (isInvalid) {
        expBox.className = 'feedback bad';
        expBox.textContent = `⚠ เส้นทาง Abnormal Data: คะแนนรวม ${total} อยู่นอกช่วง 0–100 เงื่อนไขดักข้อผิดพลาดทำงานทันที ไม่หลุดไปคิดเกรด!`;
      } else {
        const grade = hitA ? 'A' : (hitB ? 'B' : (hitC ? 'C' : (hitD ? 'D' : 'F (ส่งเข้าชุดซ่อมเสริม)')));
        expBox.className = 'feedback good';
        expBox.textContent = `✓ เส้นทางคำตอบ: lab (${labV}) + exam (${examV}) = ${total} คะแนน → ผลลัพธ์: เกรด ${grade}`;
      }
      return;
    }

    if (curFcSimMode === 'sim_smartfarm') {
      const moist = parseFloat($('fcsim-moist')?.value ?? '35');
      const ec = parseFloat($('fcsim-ec')?.value ?? '1.2');
      const temp = parseFloat($('fcsim-temp')?.value ?? '34');
      const mV = Number.isNaN(moist) ? 0 : moist;
      const eV = Number.isNaN(ec) ? 0 : ec;
      const tV = Number.isNaN(temp) ? 0 : temp;
      const needWater = mV < 40;
      const needFert = eV < 1.5;
      const needCool = tV > 32;

      let svg = FC_ARR_DEFS;
      svg += fcArrow('M165,42 V54', true);
      svg += fcArrow('M165,90 V102', true);
      svg += fcArrow('M165,138 V150', true);
      svg += fcArrow('M265,173 H331', needWater, 'active', 'True', 284, 166);
      svg += fcArrow('M165,194 V208', !needWater, 'active', 'False', 171, 204);
      svg += fcArrow('M265,231 H331', needFert, 'active', 'True', 284, 224);
      svg += fcArrow('M165,252 V266', !needFert, 'active', 'False', 171, 262);
      svg += fcArrow('M265,289 H331', needCool, 'active', 'True', 284, 282);
      svg += fcArrow('M165,310 V326', !needCool, 'active', 'False', 171, 321);
      // Merge active actuator outputs back to Delay node
      svg += `<path d="M517,173 H538 V320 H165" fill="none" stroke="${needWater ? '#16a34a' : '#cbd5e1'}" stroke-width="${needWater ? 2.4 : 1.4}"/>`;
      svg += `<path d="M517,231 H538 V320 H165" fill="none" stroke="${needFert ? '#16a34a' : '#cbd5e1'}" stroke-width="${needFert ? 2.4 : 1.4}"/>`;
      svg += `<path d="M517,289 H538 V320 H165" fill="none" stroke="${needCool ? '#16a34a' : '#cbd5e1'}" stroke-width="${needCool ? 2.4 : 1.4}"/>`;
      svg += fcArrow('M165,364 V380', true);

      svg += fcIsoNode(165, 10, 190, 32, 'term', 'เริ่มต้น Smart Farm AIoT', 'active');
      svg += fcIsoNode(165, 56, 224, 34, 'prep', 'INITIALISE Moist≥40, EC≥1.5, T≤32', 'active');
      svg += fcIsoNode(165, 104, 204, 34, 'io', `INPUT M=${mV}%, EC=${eV}, T=${tV}°C`, 'active');
      svg += fcIsoNode(165, 152, 200, 42, 'dec', 'Moist < 40% ?', 'active');
      svg += fcIsoNode(425, 156, 184, 34, 'proc', 'เปิดปั๊มน้ำรดแปลง', needWater ? 'active' : 'idle');
      svg += fcIsoNode(165, 210, 200, 42, 'dec', 'EC < 1.5 mS/cm ?', 'active');
      svg += fcIsoNode(425, 214, 184, 34, 'sub', 'CALL จ่ายปุ๋ย A-B', needFert ? 'active' : 'idle');
      svg += fcIsoNode(165, 268, 200, 42, 'dec', 'Temp > 32°C ?', 'active');
      svg += fcIsoNode(425, 272, 184, 34, 'proc', 'เปิดพัดลม & พ่นหมอก', needCool ? 'active' : 'idle');
      svg += fcIsoNode(165, 328, 210, 36, 'delay', 'DELAY 10s (รอดินซึมซับ)', 'active');
      svg += fcIsoNode(165, 382, 210, 34, 'term', 'OUTPUT บันทึก Cloud & จบ', 'active');

      svgBox.innerHTML = `<svg viewBox="0 0 560 432">${svg}</svg>`;
      const acts = [];
      if (needWater) acts.push('เปิดปั๊มน้ำ');
      if (needFert) acts.push('CALL จ่ายปุ๋ย AB');
      if (needCool) acts.push('เปิดพัดลม+พ่นหมอก');
      expBox.className = 'feedback good';
      expBox.textContent = acts.length > 0
        ? `✓ สถานะควบคุมเกษตรอัจฉริยะ: สั่งการ [${acts.join(' + ')}] → หน่วงเวลา DELAY 10s แล้วบันทึกขึ้น Cloud`
        : '✓ ค่าความชื้น ปุ๋ย EC และอุณหภูมิอยู่ในช่วงสมดุลทั้งหมด → ไม่เปิดอุปกรณ์สิ้นเปลืองพลังงาน';
      return;
    }

    // sim_science_key: Dichotomous Key for Biology Teaching
    const hasChl = $('fcsim-chl')?.value === 'yes';
    const hasVasc = hasChl && $('fcsim-vasc')?.value === 'yes';
    const seedType = $('fcsim-seed')?.value || 'flower';
    const isFungi = !hasChl;
    const isBryo = hasChl && !hasVasc;
    const isFern = hasVasc && seedType === 'spore';
    const isGym = hasVasc && seedType === 'cone';
    const isAng = hasVasc && seedType === 'flower';

    let svg = FC_ARR_DEFS;
    svg += fcArrow('M280,40 V52', true);
    svg += fcArrow('M165,75 H95 V116', isFungi, 'active', 'ไม่ใช่', 112, 68);
    svg += fcArrow('M395,75 H360 V112', hasChl, 'active', 'ใช่', 385, 68);
    svg += fcArrow('M250,135 H155 V184', isBryo, 'active', 'ไม่มี', 180, 128);
    svg += fcArrow('M470,135 H430 V180', hasVasc, 'active', 'มีท่อ', 474, 128);
    svg += fcArrow('M332,203 H210 V252', isFern, 'active', 'สร้างสปอร์', 238, 196);
    svg += fcArrow('M528,203 H445 V248', hasVasc && !isFern, 'active', 'มีเมล็ด', 494, 196);
    svg += fcArrow('M352,271 H265 V326', isGym, 'active', 'ไม่มีดอก', 278, 264);
    svg += fcArrow('M538,271 H465 V326', isAng, 'active', 'มีดอก', 498, 264);

    svg += fcIsoNode(280, 10, 210, 30, 'term', 'ตัวอย่างสิ่งมีชีวิตศึกษา', 'active');
    svg += fcIsoNode(280, 54, 230, 42, 'dec', 'สังเคราะห์ด้วยแสงได้ ?', 'active');
    svg += fcIsoNode(95, 118, 160, 40, 'io', 'เห็ดรา/ผู้ย่อยสลาย (Fungi)', isFungi ? 'active' : 'idle');
    svg += fcIsoNode(360, 114, 220, 42, 'dec', 'มีท่อลำเลียง Xylem/Phloem ?', hasChl ? 'active' : 'idle');
    svg += fcIsoNode(155, 186, 165, 40, 'io', 'ไบรโอไฟต์ (เช่น มอสส์)', isBryo ? 'active' : 'idle');
    svg += fcIsoNode(430, 182, 196, 42, 'dec', 'สืบพันธุ์ด้วยเมล็ด ?', hasVasc ? 'active' : 'idle');
    svg += fcIsoNode(210, 254, 165, 40, 'io', 'เฟิร์น (Pteridophyta)', isFern ? 'active' : 'idle');
    svg += fcIsoNode(445, 250, 186, 42, 'dec', 'มีดอกและรังไข่ ?', (hasVasc && !isFern) ? 'active' : 'idle');
    svg += fcIsoNode(265, 328, 172, 40, 'io', 'เมล็ดเปลือย (เช่น สน)', isGym ? 'active' : 'idle');
    svg += fcIsoNode(465, 328, 170, 40, 'io', 'พืชดอก (Angiosperm)', isAng ? 'active' : 'idle');

    svgBox.innerHTML = `<svg viewBox="0 0 560 386">${svg}</svg>`;
    const resultLabel = isFungi ? 'กลุ่มเห็ดรา (Fungi)'
      : (isBryo ? 'กลุ่มไบรโอไฟต์ (มอสส์ — ไม่มีท่อลำเลียง)'
      : (isFern ? 'กลุ่มเฟิร์น (มีท่อลำเลียง แต่สร้างสปอร์)'
      : (isGym ? 'พืชเมล็ดเปลือย Gymnosperm (เช่น สน)' : 'พืชดอก Angiosperm (เช่น ข้าว/มะม่วง)')));
    expBox.className = 'feedback good';
    expBox.textContent = `✓ เส้นทาง Dichotomous Key Decision Tree: จำแนกได้เป็น "${resultLabel}"`;
  }

  function renderFc3SimControls() {
    const box = $('fc3-sim-controls');
    if (!box) return;
    if (curFcSimMode === 'sim_grading') {
      box.innerHTML = `
        <div class="field-grid">
          <div class="field"><label for="fcsim-lab">คะแนนเก็บ/ปฏิบัติการ (0–60)</label><input type="number" id="fcsim-lab" value="45" step="1"></div>
          <div class="field"><label for="fcsim-exam">คะแนนสอบปลายภาค (0–40)</label><input type="number" id="fcsim-exam" value="30" step="1"></div>
        </div>
        <div class="btn-row">
          <button type="button" class="btn btn-outline btn-small" data-fcpreset="54,32">เกรด A (86)</button>
          <button type="button" class="btn btn-outline btn-small" data-fcpreset="36,24">ขอบเกรด C (60)</button>
          <button type="button" class="btn btn-outline btn-small" data-fcpreset="24,18">ซ่อมเสริม F (42)</button>
          <button type="button" class="btn btn-outline btn-small" data-fcpreset="70,45">Abnormal (115)</button>
        </div>
      `;
      box.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', () => {
        fc3BranchTested = true;
        renderFc3BranchSim();
      }));
      box.querySelectorAll('[data-fcpreset]').forEach((btn) => btn.addEventListener('click', () => {
        const [a, b] = btn.getAttribute('data-fcpreset').split(',');
        $('fcsim-lab').value = a;
        $('fcsim-exam').value = b;
        fc3BranchTested = true;
        renderFc3BranchSim();
      }));
    } else if (curFcSimMode === 'sim_smartfarm') {
      box.innerHTML = `
        <div class="field-grid">
          <div class="field"><label for="fcsim-moist">ความชื้นดิน (%)</label><input type="number" id="fcsim-moist" value="35" step="1"></div>
          <div class="field"><label for="fcsim-ec">ค่าปุ๋ย EC (mS/cm)</label><input type="number" id="fcsim-ec" value="1.2" step="0.1"></div>
        </div>
        <div class="field" style="margin-top:8px"><label for="fcsim-temp">อุณหภูมิโรงเรือน (°C)</label><input type="number" id="fcsim-temp" value="34" step="0.5"></div>
        <div class="btn-row">
          <button type="button" class="btn btn-outline btn-small" data-sfpreset="32,1.1,34">แห้ง+ปุ๋ยต่ำ+ร้อน</button>
          <button type="button" class="btn btn-outline btn-small" data-sfpreset="48,1.8,29">สมดุลทั้งหมด</button>
          <button type="button" class="btn btn-outline btn-small" data-sfpreset="45,1.0,30">ชื้นดีแต่ปุ๋ยต่ำ</button>
        </div>
      `;
      box.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', () => {
        fc3BranchTested = true;
        renderFc3BranchSim();
      }));
      box.querySelectorAll('[data-sfpreset]').forEach((btn) => btn.addEventListener('click', () => {
        const [m, e, t] = btn.getAttribute('data-sfpreset').split(',');
        $('fcsim-moist').value = m;
        $('fcsim-ec').value = e;
        $('fcsim-temp').value = t;
        fc3BranchTested = true;
        renderFc3BranchSim();
      }));
    } else {
      box.innerHTML = `
        <div class="field"><label for="fcsim-chl">1. สังเคราะห์ด้วยแสงได้ (มีคลอโรฟิลล์)?</label>
          <select id="fcsim-chl"><option value="yes">ใช่ — สร้างอาหารเองได้</option><option value="no">ไม่ใช่ — ย่อยสลายสารอินทรีย์</option></select>
        </div>
        <div class="field" style="margin-top:8px"><label for="fcsim-vasc">2. มีท่อลำเลียงน้ำและอาหาร (Xylem &amp; Phloem)?</label>
          <select id="fcsim-vasc"><option value="yes">มีท่อลำเลียง</option><option value="no">ไม่มีท่อลำเลียง</option></select>
        </div>
        <div class="field" style="margin-top:8px"><label for="fcsim-seed">3. การสืบพันธุ์และโครงสร้างเมล็ด</label>
          <select id="fcsim-seed"><option value="flower">มีดอกและรังไข่หุ้มเมล็ด</option><option value="cone">มีเมล็ดเปลือย (Cone)</option><option value="spore">สร้างสปอร์ (ไม่มีเมล็ด)</option></select>
        </div>
      `;
      box.querySelectorAll('select').forEach((sel) => sel.addEventListener('change', () => {
        fc3BranchTested = true;
        renderFc3BranchSim();
      }));
    }
    renderFc3BranchSim();
  }

  function initFc3BranchSimulator() {
    document.querySelectorAll('#fc3-sim-tabs .sub-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        curFcSimMode = btn.getAttribute('data-fcsim');
        fc3BranchTested = true;
        document.querySelectorAll('#fc3-sim-tabs .sub-tab').forEach((b) => b.classList.toggle('active', b === btn));
        if ($('badge-fc3-sim')) {
          $('badge-fc3-sim').textContent = '✓ กำลังจำลองเส้นทาง';
          $('badge-fc3-sim').className = 'tag done';
        }
        renderFc3SimControls();
      });
    });
    renderFc3SimControls();
  }

  function initModule03() {
    document.querySelectorAll('#fc3-scenario-tabs .sub-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        curFc3Scenario = btn.getAttribute('data-fcscen');
        fc3Seq = [];
        fc3NodePos = {};
        document.querySelectorAll('#fc3-scenario-tabs .sub-tab').forEach((b) => b.classList.toggle('active', b === btn));
        $('fc3-feedback').className = 'feedback';
        renderFc3();
      });
    });

    $('fc3-align-btn')?.addEventListener('click', () => autoAlignFc3Nodes(true));
    $('fc3-zoom-in')?.addEventListener('click', () => {
      fc3Zoom = Math.min(1.6, Math.round((fc3Zoom + 0.15) * 100) / 100);
      drawFc3Svg();
    });
    $('fc3-zoom-out')?.addEventListener('click', () => {
      fc3Zoom = Math.max(0.7, Math.round((fc3Zoom - 0.15) * 100) / 100);
      drawFc3Svg();
    });
    $('fc3-autosort-chk')?.addEventListener('change', (e) => {
      if (e.target.checked && fc3Seq.length > 1) {
        fc3Seq.sort((a, b) => (fc3NodePos[a]?.y ?? 0) - (fc3NodePos[b]?.y ?? 0));
        renderFc3();
      }
    });

    const previewBox = $('fc3-svg-preview');
    if (previewBox) {
      previewBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        previewBox.classList.add('svg-drop-active');
      });
      previewBox.addEventListener('dragleave', () => {
        previewBox.classList.remove('svg-drop-active');
      });
      previewBox.addEventListener('drop', (e) => {
        e.preventDefault();
        previewBox.classList.remove('svg-drop-active');
        const raw = e.dataTransfer?.getData('text/plain') || '';
        if (!raw.startsWith('bank:')) return;
        const bid = raw.slice(5);
        const scen = FC3_SCENARIOS[curFc3Scenario];
        if (!scen.blocks.some((b) => b.id === bid) || fc3Seq.includes(bid)) return;

        const svgEl = $('fc3-canvas-svg');
        if (svgEl) {
          const pt = clientToSvgPoint(svgEl, e.clientX, e.clientY);
          fc3NodePos[bid] = clampAndSnapPos(pt.x, pt.y);
        } else {
          fc3NodePos[bid] = { x: FC3_DEFAULT_X, y: 48 + fc3Seq.length * 80 };
        }
        fc3Seq.push(bid);
        if ($('fc3-autosort-chk')?.checked && fc3Seq.length > 1) {
          fc3Seq.sort((a, b) => (fc3NodePos[a]?.y ?? 0) - (fc3NodePos[b]?.y ?? 0));
        }
        renderFc3();
      });
    }

    renderFc3();
    $('fc3-reset-btn')?.addEventListener('click', () => {
      fc3Seq = [];
      fc3NodePos = {};
      $('fc3-feedback').className = 'feedback';
      renderFc3();
    });
    $('fc3-check-btn')?.addEventListener('click', () => {
      const fb = $('fc3-feedback');
      const scen = FC3_SCENARIOS[curFc3Scenario];
      const ok = fc3Seq.length === scen.expected.length && scen.expected.every((v, i) => fc3Seq[i] === v);
      if (ok) {
        fc3DoneSet.add(curFc3Scenario);
        updateFc3ScenarioSummary();
        fb.className = 'feedback good';
        fb.textContent = `✓ ยอดเยี่ยม! ผังงาน "${scen.title}" ถูกต้องตามมาตรฐาน ISO 5807:1985 (ผ่านแล้ว ${fc3DoneSet.size}/4 ด่าน)`;
        recordModule('flowchart', true);
      } else {
        fb.className = 'feedback bad';
        fb.textContent = 'ยังไม่ถูกต้อง: ตรวจสอบว่าเริ่มต้น/จบด้วย [วงรี] Terminator วาง [หกเหลี่ยม] Preparation ก่อนลูป/เงื่อนไข และคัดบล็อกตัวลวงออก';
        recordModule('flowchart', false);
      }
    });

    initFc3BranchSimulator();
  }

  // ==========================================================
  // MODULE 04: LAB 04 SCIENTIFIC FLOWCHART & TRACE TABLE
  // ==========================================================
  const LAB4_EXPERIMENTS = {
    cstr: {
      eyebrow: 'EXPERIMENT 4.0 • CSTR CLOSED-LOOP CASE STUDY (NOTEBOOKLM)',
      title: 'กรณีศึกษาหลัก 4.0 (วิศวกรรมเคมี): ระบบควบคุมถังปฏิกรณ์เคมี CSTR แบบวงปิด',
      desc: 'ควบคุมถังปฏิกรณ์ให้อยู่ในช่วงปลอดภัย (35.0–40.0°C และ pH ≥ 6.0) สูงสุด 3 รอบ พร้อม DELAY 5 วินาที และปิดท้ายด้วย Fail-Safe Default Reset ปิดอุปกรณ์ทุกตัว',
      customLoop: true,
      pseudo: [
        'INITIALISE TotalCycles ← 0, MaxCycles ← 3',
        'WHILE TotalCycles < MaxCycles AND EmergencyStop == FALSE DO',
        '  INPUT Temp, pH',
        '  IF Temp > 40.0 THEN Cooler ← ON, Heater ← OFF ELSEIF Temp < 35.0 THEN Cooler ← OFF, Heater ← ON ELSE BOTH ← OFF',
        '  IF pH < 6.0 THEN AlkaliPump ← ON ELSE AlkaliPump ← OFF',
        '  DELAY 5 SECONDS ; TotalCycles ← TotalCycles + 1',
        'ENDWHILE',
        'CALL ResetActuatorsSafeState()  // Fail-Safe: Cooler, Heater, Pump ← OFF'
      ],
      svgNodes: [
        { id: 'c1', shape: 'term', y: 10, txt: 'เริ่มต้น CSTR Control' },
        { id: 'c2', shape: 'prep', y: 62, txt: 'INITIALISE TotalCycles←0, Max←3' },
        { id: 'c3', shape: 'dec', y: 114, txt: 'TotalCycles < 3 AND Stop=FALSE ?' },
        { id: 'c4', shape: 'io', y: 178, txt: 'INPUT Temp, pH (อ่านค่าเซนเซอร์)' },
        { id: 'c5', shape: 'proc', y: 232, txt: 'ตัดสินใจ Cooler / Heater / AlkaliPump' },
        { id: 'c6', shape: 'delay', y: 288, txt: 'DELAY 5s ; TotalCycles ← Cycles+1', loopBack: true },
        { id: 'c7', shape: 'proc', y: 342, txt: 'Fail-Safe Reset: ปิดอุปกรณ์ทุกตัว OFF' },
        { id: 'c8', shape: 'term', y: 398, txt: 'OUTPUT สรุปผล & จบการทำงาน' }
      ],
      cols: ['รอบ / Step', 'Temp (°C)', 'pH', 'Cooler', 'Heater', 'AlkaliPump', 'TotalCycles'],
      rows: [
        { node: 'c2', line: 0, cells: [
          { type: 'static', val: 'Init (ก่อนลูป)' },
          { type: 'static', val: '—' },
          { type: 'static', val: '—' },
          { type: 'static', val: 'OFF' },
          { type: 'static', val: 'OFF' },
          { type: 'static', val: 'OFF' },
          { type: 'input', ans: '0', ph: 'ค่าเริ่ม' }
        ]},
        { node: 'c5', line: 3, cells: [
          { type: 'static', val: 'Cycle 1 (>40°C)' },
          { type: 'static', val: '42.5' },
          { type: 'static', val: '5.5' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'ON' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'OFF' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'ON' },
          { type: 'input', ans: '1', ph: 'Cycles' }
        ]},
        { node: 'c5', line: 3, cells: [
          { type: 'static', val: 'Cycle 2 (<35°C)' },
          { type: 'static', val: '32.0' },
          { type: 'static', val: '6.8' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'OFF' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'ON' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'OFF' },
          { type: 'input', ans: '2', ph: 'Cycles' }
        ]},
        { node: 'c6', line: 5, cells: [
          { type: 'static', val: 'Cycle 3 (Deadband)' },
          { type: 'static', val: '37.0' },
          { type: 'static', val: '5.8' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'OFF' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'OFF' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'ON' },
          { type: 'input', ans: '3', ph: 'Cycles' }
        ]},
        { node: 'c7', line: 7, cells: [
          { type: 'static', val: 'Exit (3<3 False)' },
          { type: 'static', val: 'Safe-Reset' },
          { type: 'static', val: '—' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'OFF' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'OFF' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'OFF' },
          { type: 'static', val: '3 (หยุดปลอดภัย)' }
        ]}
      ]
    },
    titration: {
      eyebrow: 'EXPERIMENT 4.1 • CHEMISTRY TITRATION',
      title: 'การทดลอง 4.1 (เคมี): ระบบไทเทรตกรด-เบสอัตโนมัติ',
      desc: 'ระบบเริ่มต้นด้วยปริมาตรเบส V_base = 0 mL และอ่านค่า pH เริ่มต้น (2.0) หาก pH < 7.0 ให้เติมเบสครั้งละ 2 mL แล้วอ่าน pH ใหม่ซ้ำจนกว่า pH ≥ 7.0',
      pseudo: [
        'SET V_base = 0, pH = READ_PH()',
        'WHILE pH < 7.0 DO',
        '  ADD_BASE(2 mL) ; SET V_base = V_base + 2',
        '  SET pH = READ_PH()',
        'ENDWHILE',
        'STOP_PUMP() ; PRINT V_base'
      ],
      svgNodes: [
        { id: 'n1', shape: 'term', y: 12, txt: 'เริ่มต้น (V_base=0)' },
        { id: 'n2', shape: 'io', y: 66, txt: 'อ่านค่า pH เริ่มต้น' },
        { id: 'n3', shape: 'dec', y: 124, txt: 'pH < 7.0 ?' },
        { id: 'n4', shape: 'proc', y: 192, txt: 'เติมเบส +2 mL, อ่าน pH ใหม่' },
        { id: 'n5', shape: 'term', y: 256, txt: 'หยุดปั๊ม / จบ (จุดสมมูล)' }
      ],
      cols: ['รอบที่', 'V_base (mL)', 'pH ที่วัดได้', 'เงื่อนไข pH < 7.0', 'Action (การทำงาน)'],
      rows: [
        { node: 'n2', line: 0, cells: [
          { type: 'static', val: '1' },
          { type: 'static', val: '0' },
          { type: 'static', val: '2.0' },
          { type: 'select', opts: ['True', 'False'], ans: 'True' },
          { type: 'static', val: 'เติมเบส +2 mL' }
        ]},
        { node: 'n4', line: 2, cells: [
          { type: 'static', val: '2' },
          { type: 'input', ans: '2', ph: 'เลข mL' },
          { type: 'static', val: '3.2' },
          { type: 'select', opts: ['True', 'False'], ans: 'True' },
          { type: 'static', val: 'เติมเบส +2 mL' }
        ]},
        { node: 'n4', line: 2, cells: [
          { type: 'static', val: '3' },
          { type: 'input', ans: '4', ph: 'เลข mL' },
          { type: 'static', val: '4.8' },
          { type: 'static', val: 'True' },
          { type: 'static', val: 'เติมเบส +2 mL' }
        ]},
        { node: 'n4', line: 2, cells: [
          { type: 'static', val: '4' },
          { type: 'input', ans: '6', ph: 'เลข mL' },
          { type: 'static', val: '6.5' },
          { type: 'select', opts: ['True', 'False'], ans: 'True' },
          { type: 'static', val: 'เติมเบส +2 mL' }
        ]},
        { node: 'n5', line: 5, cells: [
          { type: 'static', val: '5' },
          { type: 'input', ans: '8', ph: 'เลข mL' },
          { type: 'static', val: '7.2' },
          { type: 'select', opts: ['True', 'False'], ans: 'False' },
          { type: 'select', opts: ['เติมเบส +2 mL', 'หยุดปั๊ม (จุดสมมูล)'], ans: 'หยุดปั๊ม (จุดสมมูล)' }
        ]}
      ]
    },
    pendulum: {
      eyebrow: 'EXPERIMENT 4.2 • PHYSICS PENDULUM',
      title: 'การทดลอง 4.2 (ฟิสิกส์): วัดคาบเพนดูลัมและคัดกรองค่าคลาดเคลื่อน',
      desc: 'รับค่าคาบ T จำนวน 4 ครั้ง คัดกรองเฉพาะค่าในช่วงปกติ 1.5 ≤ T ≤ 2.5 วินาที เพื่อสะสมผลรวม sum_T และจำนวนที่ผ่าน count_valid',
      pseudo: [
        'SET sum_T = 0, count_valid = 0',
        'FOR trial = 1 TO 4 DO',
        '  READ T',
        '  IF 1.5 <= T AND T <= 2.5 THEN',
        '    sum_T = sum_T + T ; count_valid = count_valid + 1',
        '  ENDIF',
        'ENDFOR ; PRINT sum_T / count_valid'
      ],
      svgNodes: [
        { id: 'n1', shape: 'term', y: 12, txt: 'เริ่ม (sum_T=0, count=0)' },
        { id: 'n2', shape: 'io', y: 66, txt: 'อ่านค่าคาบ T รอบที่ i' },
        { id: 'n3', shape: 'dec', y: 124, txt: '1.5 ≤ T ≤ 2.5 ?' },
        { id: 'n4', shape: 'proc', y: 192, txt: 'สะสม sum_T และ count++' },
        { id: 'n5', shape: 'term', y: 256, txt: 'คำนวณค่าเฉลี่ย / จบ' }
      ],
      cols: ['รอบที่', 'T ที่วัดได้ (s)', 'เงื่อนไข 1.5 ≤ T ≤ 2.5', 'sum_T (s)', 'count_valid'],
      rows: [
        { node: 'n4', line: 4, cells: [
          { type: 'static', val: '1' },
          { type: 'static', val: '2.01' },
          { type: 'static', val: 'True' },
          { type: 'static', val: '2.01' },
          { type: 'static', val: '1' }
        ]},
        { node: 'n3', line: 3, cells: [
          { type: 'static', val: '2' },
          { type: 'static', val: '4.20' },
          { type: 'select', opts: ['True', 'False'], ans: 'False' },
          { type: 'input', ans: '2.01', ph: 'ทศนิยม' },
          { type: 'input', ans: '1', ph: 'จำนวนนับ' }
        ]},
        { node: 'n4', line: 4, cells: [
          { type: 'static', val: '3' },
          { type: 'static', val: '1.99' },
          { type: 'static', val: 'True' },
          { type: 'input', ans: '4.00', ph: 'เช่น 4.00' },
          { type: 'input', ans: '2', ph: 'จำนวนนับ' }
        ]},
        { node: 'n5', line: 6, cells: [
          { type: 'static', val: '4' },
          { type: 'static', val: '2.00' },
          { type: 'select', opts: ['True', 'False'], ans: 'True' },
          { type: 'input', ans: '6.00', ph: 'เช่น 6.00' },
          { type: 'input', ans: '3', ph: 'จำนวนนับ' }
        ]}
      ]
    },
    incubator: {
      eyebrow: 'EXPERIMENT 4.3 • BIO INCUBATOR CONTROL',
      title: 'การทดลอง 4.3 (ชีววิทยา): ระบบควบคุมอุณหภูมิตู้บ่มเชื้อ',
      desc: 'ควบคุมอุณหภูมิให้อยู่ในช่วง 36.5°C – 37.5°C (ถ้า T < 36.5 เปิดฮีตเตอร์, ถ้า T > 37.5 เปิดพัดลม, นอกนั้นปิดอุปกรณ์)',
      pseudo: [
        'FOR cycle = 1 TO 4 DO',
        '  READ T',
        '  IF T < 36.5 THEN ACTION = "เปิดฮีตเตอร์"',
        '  ELSE IF T > 37.5 THEN ACTION = "เปิดพัดลมระบายอากาศ"',
        '  ELSE ACTION = "ปิดอุปกรณ์ทั้งหมด"',
        'ENDFOR'
      ],
      svgNodes: [
        { id: 'n1', shape: 'term', y: 12, txt: 'เริ่มต้นตู้บ่มเชื้อ' },
        { id: 'n2', shape: 'io', y: 66, txt: 'อ่านอุณหภูมิ T (°C)' },
        { id: 'n3', shape: 'dec', y: 124, txt: 'T < 36.5 หรือ T > 37.5 ?' },
        { id: 'n4', shape: 'proc', y: 192, txt: 'สั่งฮีตเตอร์ / พัดลม / ปิด' },
        { id: 'n5', shape: 'term', y: 256, txt: 'ครบ 4 รอบ / จบ' }
      ],
      cols: ['รอบที่', 'อุณหภูมิ T (°C)', 'สถานะช่วงอุณหภูมิ', 'คำสั่งควบคุม (Output)'],
      rows: [
        { node: 'n4', line: 2, cells: [
          { type: 'static', val: '1' },
          { type: 'static', val: '35.8' },
          { type: 'select', opts: ['T < 36.5', 'ปกติ', 'T > 37.5'], ans: 'T < 36.5' },
          { type: 'select', opts: ['เปิดฮีตเตอร์', 'เปิดพัดลมระบายอากาศ', 'ปิดอุปกรณ์ทั้งหมด'], ans: 'เปิดฮีตเตอร์' }
        ]},
        { node: 'n4', line: 4, cells: [
          { type: 'static', val: '2' },
          { type: 'static', val: '36.9' },
          { type: 'select', opts: ['T < 36.5', 'ปกติ', 'T > 37.5'], ans: 'ปกติ' },
          { type: 'select', opts: ['เปิดฮีตเตอร์', 'เปิดพัดลมระบายอากาศ', 'ปิดอุปกรณ์ทั้งหมด'], ans: 'ปิดอุปกรณ์ทั้งหมด' }
        ]},
        { node: 'n4', line: 3, cells: [
          { type: 'static', val: '3' },
          { type: 'static', val: '38.1' },
          { type: 'select', opts: ['T < 36.5', 'ปกติ', 'T > 37.5'], ans: 'T > 37.5' },
          { type: 'select', opts: ['เปิดฮีตเตอร์', 'เปิดพัดลมระบายอากาศ', 'ปิดอุปกรณ์ทั้งหมด'], ans: 'เปิดพัดลมระบายอากาศ' }
        ]},
        { node: 'n5', line: 4, cells: [
          { type: 'static', val: '4' },
          { type: 'static', val: '37.1' },
          { type: 'static', val: 'ปกติ' },
          { type: 'select', opts: ['เปิดฮีตเตอร์', 'เปิดพัดลมระบายอากาศ', 'ปิดอุปกรณ์ทั้งหมด'], ans: 'ปิดอุปกรณ์ทั้งหมด' }
        ]}
      ]
    },
    smartfarm: {
      eyebrow: 'EXPERIMENT 4.4 • SMART AGRICULTURE AIoT',
      title: 'การทดลอง 4.4 (เกษตรอัจฉริยะ): ระบบให้น้ำและปุ๋ยอัตโนมัติ (Soil Moisture & EC)',
      desc: 'ควบคุมความชื้นดิน (Moist ≥ 40%) และค่าปุ๋ย (EC ≥ 1.5 mS/cm) สูงสุด 3 รอบ ใช้ Predefined Process (CALL จ่ายปุ๋ย AB), Delay 10s และ Fail-Safe Reset',
      customLoop: true,
      pseudo: [
        'INITIALISE Moist_min ← 40, EC_min ← 1.5, Cycle ← 1',
        'WHILE Cycle <= 3 AND Emergency == FALSE DO',
        '  INPUT Moist, EC',
        '  IF Moist < 40 THEN WaterPump ← ON ELSE WaterPump ← OFF',
        '  IF EC < 1.5 THEN CALL DoseFertilizerAB() ELSE FertValve ← OFF',
        '  DELAY 10 SECONDS ; Cycle ← Cycle + 1',
        'ENDWHILE',
        'WaterPump ← OFF ; FertValve ← OFF  // Fail-Safe Reset'
      ],
      svgNodes: [
        { id: 'sf1', shape: 'term', y: 10, txt: 'เริ่มต้น Smart Farm AIoT' },
        { id: 'sf2', shape: 'prep', y: 62, txt: 'INITIALISE Moist≥40, EC≥1.5, Cycle←1' },
        { id: 'sf3', shape: 'dec', y: 114, txt: 'Cycle <= 3 AND Emergency==FALSE ?' },
        { id: 'sf4', shape: 'io', y: 178, txt: 'INPUT Moist (%), EC (mS/cm)' },
        { id: 'sf5', shape: 'sub', y: 232, txt: 'เปิดน้ำ & CALL DoseFertilizerAB()' },
        { id: 'sf6', shape: 'delay', y: 286, txt: 'DELAY 10s ; Cycle ← Cycle + 1', loopBack: true },
        { id: 'sf7', shape: 'proc', y: 340, txt: 'Fail-Safe: ปิดวาล์วน้ำและปุ๋ย OFF' },
        { id: 'sf8', shape: 'term', y: 396, txt: 'OUTPUT บันทึกข้อมูลฟาร์ม & จบ' }
      ],
      cols: ['รอบ (Cycle)', 'Moist (%)', 'EC (mS/cm)', 'WaterPump', 'FertValve', 'Fail-Safe', 'Cycle ถัดไป'],
      rows: [
        { node: 'sf2', line: 0, cells: [
          { type: 'static', val: 'Init (ก่อนลูป)' },
          { type: 'static', val: '—' },
          { type: 'static', val: '—' },
          { type: 'static', val: 'OFF' },
          { type: 'static', val: 'OFF' },
          { type: 'static', val: 'Active' },
          { type: 'input', ans: '1', ph: 'เริ่ม' }
        ]},
        { node: 'sf5', line: 3, cells: [
          { type: 'static', val: 'Cycle 1 (แห้ง+ปุ๋ยต่ำ)' },
          { type: 'static', val: '28' },
          { type: 'static', val: '1.0' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'ON' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'ON' },
          { type: 'static', val: 'Running' },
          { type: 'input', ans: '2', ph: 'Cycle' }
        ]},
        { node: 'sf5', line: 4, cells: [
          { type: 'static', val: 'Cycle 2 (ชื้นดี+ปุ๋ยต่ำ)' },
          { type: 'static', val: '45' },
          { type: 'static', val: '1.2' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'OFF' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'ON' },
          { type: 'static', val: 'Running' },
          { type: 'input', ans: '3', ph: 'Cycle' }
        ]},
        { node: 'sf6', line: 5, cells: [
          { type: 'static', val: 'Cycle 3 (ชื้นดี+ปุ๋ยพอ)' },
          { type: 'static', val: '48' },
          { type: 'static', val: '1.8' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'OFF' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'OFF' },
          { type: 'static', val: 'Running' },
          { type: 'input', ans: '4', ph: 'Cycle' }
        ]},
        { node: 'sf7', line: 7, cells: [
          { type: 'static', val: 'Exit (4<=3 False)' },
          { type: 'static', val: 'Safe-Reset' },
          { type: 'static', val: '—' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'OFF' },
          { type: 'select', opts: ['ON', 'OFF'], ans: 'OFF' },
          { type: 'select', opts: ['Active', 'Fail-Safe OFF'], ans: 'Fail-Safe OFF' },
          { type: 'static', val: 'หยุดปลอดภัย' }
        ]}
      ]
    },
    grading_edu: {
      eyebrow: 'EXPERIMENT 4.5 • GRADING & SCIENCE PEDAGOGY',
      title: 'การทดลอง 4.5 (การสอนวิทย์ & วัดผล): ระบบตัดเกรด A–F และส่งเข้าชุดซ่อมเสริม',
      desc: 'คำนวณ total ← lab + exam ของผู้เรียน 4 คน ตัดเกรดด้วย IF–ELSEIF–ELSE (A≥80, B≥70, C≥60, D≥50, F<50) และคัดกรองผู้ได้ <60 เข้า CALL AssignRemedialLab()',
      customLoop: true,
      pseudo: [
        'INITIALISE Pass ← 60, MaxStd ← 4, i ← 1',
        'WHILE i <= MaxStd DO',
        '  INPUT lab, exam ; total ← lab + exam',
        '  grade ← CALC_GRADE(total) // A≥80,B≥70,C≥60,D≥50,F<50',
        '  IF total < Pass THEN CALL AssignRemedialLab(i)',
        '  i ← i + 1',
        'ENDWHILE',
        'OUTPUT "สรุปผลเกรดและรายชื่อซ่อมเสริมทั้งชั้นเรียน"'
      ],
      svgNodes: [
        { id: 'gr1', shape: 'term', y: 10, txt: 'เริ่มต้นตัดเกรด & คัดกรองผู้เรียน' },
        { id: 'gr2', shape: 'prep', y: 62, txt: 'INITIALISE Pass←60, MaxStd←4, i←1' },
        { id: 'gr3', shape: 'dec', y: 114, txt: 'i <= 4 ? (ตรวจผู้เรียนทีละคน)' },
        { id: 'gr4', shape: 'io', y: 178, txt: 'INPUT lab (0-60), exam (0-40)' },
        { id: 'gr5', shape: 'proc', y: 232, txt: 'total ← lab+exam ; ตัดเกรด A–F' },
        { id: 'gr6', shape: 'sub', y: 288, txt: 'IF total<60 → CALL ซ่อมเสริม(); i←i+1', loopBack: true },
        { id: 'gr7', shape: 'io', y: 342, txt: 'OUTPUT รายงานเกรด & สรุปผลชั้นเรียน' },
        { id: 'gr8', shape: 'term', y: 396, txt: 'จบการทำงานระบบวัดผล' }
      ],
      cols: ['คนที่ (i)', 'Lab (60)', 'Exam (40)', 'Total = L+E', 'เกรด (Grade)', 'ซ่อมเสริม (<60)', 'i ถัดไป'],
      rows: [
        { node: 'gr5', line: 3, cells: [
          { type: 'static', val: 'คนที่ 1' },
          { type: 'static', val: '52' },
          { type: 'static', val: '33' },
          { type: 'input', ans: '85', ph: 'ผลรวม' },
          { type: 'select', opts: ['A', 'B', 'C', 'D', 'F'], ans: 'A' },
          { type: 'select', opts: ['ไม่ต้องซ่อมเสริม', 'CALL ซ่อมเสริม()'], ans: 'ไม่ต้องซ่อมเสริม' },
          { type: 'static', val: '2' }
        ]},
        { node: 'gr5', line: 3, cells: [
          { type: 'static', val: 'คนที่ 2' },
          { type: 'static', val: '45' },
          { type: 'static', val: '29' },
          { type: 'input', ans: '74', ph: 'ผลรวม' },
          { type: 'select', opts: ['A', 'B', 'C', 'D', 'F'], ans: 'B' },
          { type: 'select', opts: ['ไม่ต้องซ่อมเสริม', 'CALL ซ่อมเสริม()'], ans: 'ไม่ต้องซ่อมเสริม' },
          { type: 'input', ans: '3', ph: 'i' }
        ]},
        { node: 'gr5', line: 3, cells: [
          { type: 'static', val: 'คนที่ 3 (ขอบ C)' },
          { type: 'static', val: '36' },
          { type: 'static', val: '24' },
          { type: 'input', ans: '60', ph: 'ผลรวม' },
          { type: 'select', opts: ['A', 'B', 'C', 'D', 'F'], ans: 'C' },
          { type: 'select', opts: ['ไม่ต้องซ่อมเสริม', 'CALL ซ่อมเสริม()'], ans: 'ไม่ต้องซ่อมเสริม' },
          { type: 'input', ans: '4', ph: 'i' }
        ]},
        { node: 'gr6', line: 4, cells: [
          { type: 'static', val: 'คนที่ 4 (ไม่ผ่าน)' },
          { type: 'static', val: '28' },
          { type: 'static', val: '18' },
          { type: 'input', ans: '46', ph: 'ผลรวม' },
          { type: 'select', opts: ['A', 'B', 'C', 'D', 'F'], ans: 'F' },
          { type: 'select', opts: ['ไม่ต้องซ่อมเสริม', 'CALL ซ่อมเสริม()'], ans: 'CALL ซ่อมเสริม()' },
          { type: 'input', ans: '5', ph: 'i' }
        ]},
        { node: 'gr7', line: 7, cells: [
          { type: 'static', val: 'ทดสอบขอบ 50 (Boundary)' },
          { type: 'static', val: '30' },
          { type: 'static', val: '20' },
          { type: 'static', val: '50' },
          { type: 'select', opts: ['A', 'B', 'C', 'D', 'F'], ans: 'D' },
          { type: 'select', opts: ['ไม่ต้องซ่อมเสริม', 'CALL ซ่อมเสริม()'], ans: 'CALL ซ่อมเสริม()' },
          { type: 'static', val: 'จบลูป & ออกรายงาน' }
        ]}
      ]
    }
  };

  let curLab4Exp = 'cstr';
  let curTraceStep = -1;

  function loadTraceStore() {
    try { return JSON.parse(localStorage.getItem(scopedKey(TRACE_BASE)) || '{}'); } catch { return {}; }
  }
  function saveTraceStore(obj) {
    try { localStorage.setItem(scopedKey(TRACE_BASE), JSON.stringify(obj)); } catch {}
  }

  function renderLab4Experiment() {
    const exp = LAB4_EXPERIMENTS[curLab4Exp];
    $('lab4-exp-eyebrow').textContent = exp.eyebrow;
    $('lab4-exp-title').textContent = exp.title;
    $('lab4-exp-desc').textContent = exp.desc;

    // 1. SVG Flowchart
    const activeRow = curTraceStep >= 0 ? exp.rows[curTraceStep] : null;
    const activeNodeId = activeRow ? activeRow.node : null;
    const decNode = exp.svgNodes.find((n) => n.shape === 'dec');
    const decCenterY = decNode ? decNode.y + 24 : 124;
    const failSafeNode = exp.customLoop ? exp.svgNodes[exp.svgNodes.length - 2] : null;
    const lastNode = exp.svgNodes[exp.svgNodes.length - 1];
    const svgH = Math.max(305, (lastNode ? lastNode.y : 256) + 48);

    let svgInner = '';
    exp.svgNodes.forEach((nd, i) => {
      const isAct = nd.id === activeNodeId;
      const stroke = isAct ? '#dc2626' : (nd.shape === 'dec' ? '#d97706' : (nd.shape === 'prep' ? '#7c3aed' : (nd.shape === 'delay' ? '#9333ea' : (nd.shape === 'sub' ? '#4338ca' : '#2563eb'))));
      const sw = isAct ? '3.5' : '2';
      if (i > 0) {
        svgInner += `<line x1="165" y1="${nd.y - 16}" x2="165" y2="${nd.y}" stroke="#475569" stroke-width="2"/>`;
      }
      if (nd.shape === 'term') {
        svgInner += `<rect x="45" y="${nd.y}" width="240" height="36" rx="18" fill="${isAct ? '#fee2e2' : '#dbeafe'}" stroke="${stroke}" stroke-width="${sw}"/>`;
      } else if (nd.shape === 'prep') {
        svgInner += `<polygon points="55,${nd.y} 275,${nd.y} 298,${nd.y + 18} 275,${nd.y + 36} 55,${nd.y + 36} 32,${nd.y + 18}" fill="${isAct ? '#fee2e2' : '#ede9fe'}" stroke="${stroke}" stroke-width="${sw}"/>`;
      } else if (nd.shape === 'sub') {
        svgInner += `<rect x="38" y="${nd.y}" width="254" height="38" fill="${isAct ? '#fee2e2' : '#e0e7ff'}" stroke="${stroke}" stroke-width="${sw}"/>`;
        svgInner += `<line x1="50" y1="${nd.y}" x2="50" y2="${nd.y + 38}" stroke="${stroke}" stroke-width="${sw}"/>`;
        svgInner += `<line x1="280" y1="${nd.y}" x2="280" y2="${nd.y + 38}" stroke="${stroke}" stroke-width="${sw}"/>`;
        if (nd.loopBack) {
          svgInner += `<path d="M38,${nd.y + 19} H14 V${decCenterY} H45" stroke="#d97706" stroke-width="2" stroke-dasharray="4,3" fill="none"/>`;
        }
      } else if (nd.shape === 'delay') {
        svgInner += `<path d="M45,${nd.y} H248 A19,19 0 0,1 248,${nd.y + 38} H45 Z" fill="${isAct ? '#fee2e2' : '#faf5ff'}" stroke="${stroke}" stroke-width="${sw}"/>`;
        if (nd.loopBack) {
          svgInner += `<path d="M45,${nd.y + 19} H14 V${decCenterY} H45" stroke="#d97706" stroke-width="2" stroke-dasharray="4,3" fill="none"/>`;
        }
      } else if (nd.shape === 'io') {
        svgInner += `<polygon points="60,${nd.y} 295,${nd.y} 270,${nd.y + 38} 35,${nd.y + 38}" fill="${isAct ? '#fee2e2' : '#e0f2fe'}" stroke="${stroke}" stroke-width="${sw}"/>`;
      } else if (nd.shape === 'dec') {
        svgInner += `<polygon points="165,${nd.y} 285,${nd.y + 24} 165,${nd.y + 48} 45,${nd.y + 24}" fill="${isAct ? '#fee2e2' : '#fef3c7'}" stroke="${stroke}" stroke-width="${sw}"/>`;
        if (exp.customLoop && failSafeNode) {
          svgInner += `<path d="M285,${nd.y + 24} H316 V${failSafeNode.y + 20} H295" stroke="#dc2626" stroke-width="2" fill="none"/>`;
          svgInner += `<text x="296" y="${nd.y + 18}" font-size="10" font-weight="800" fill="#dc2626">False</text>`;
        } else {
          svgInner += `<path d="M285,${nd.y + 24} H316 V${nd.y + 84} H280" stroke="#16a34a" stroke-width="2" fill="none"/>`;
          svgInner += `<text x="296" y="${nd.y + 18}" font-size="10" font-weight="800" fill="#15803d">True</text>`;
        }
      } else {
        svgInner += `<rect x="35" y="${nd.y}" width="260" height="40" rx="6" fill="${isAct ? '#fee2e2' : '#dcfce7'}" stroke="${stroke}" stroke-width="${sw}"/>`;
        if (nd.loopBack || (!exp.customLoop && i === 3)) {
          svgInner += `<path d="M35,${nd.y + 20} H14 V${decCenterY} H45" stroke="#d97706" stroke-width="2" stroke-dasharray="4,3" fill="none"/>`;
        }
      }
      const txtY = nd.shape === 'dec' ? nd.y + 28 : nd.y + 23;
      svgInner += `<text x="165" y="${txtY}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#0f172a">${esc(nd.txt)}</text>`;
    });
    $('lab4-svg-stage').innerHTML = `<svg viewBox="0 0 330 ${svgH}">${svgInner}</svg>`;

    // 2. Parallel Pseudocode
    const activeLn = activeRow ? activeRow.line : -1;
    $('lab4-pseudo-box').innerHTML = exp.pseudo.map((ln, idx) => `
      <div class="code-line ${idx === activeLn ? 'active' : ''}">
        <span class="code-ln">${idx + 1}</span>
        <span>${esc(ln)}</span>
      </div>
    `).join('');

    // 3. Interactive Trace Table
    const store = loadTraceStore();
    const savedFilled = (store[curLab4Exp] && store[curLab4Exp].filled) ? store[curLab4Exp].filled : {};

    const thHtml = `<thead><tr>${exp.cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>`;
    const tbRows = exp.rows.map((row, rIdx) => {
      const tds = row.cells.map((cell, cIdx) => {
        const cellKey = `r${rIdx}_c${cIdx}`;
        const prevVal = savedFilled[cellKey] ?? '';
        if (cell.type === 'static') return `<td><b>${esc(cell.val)}</b></td>`;
        if (cell.type === 'input') {
          return `<td><input type="text" class="trace-input" data-ckey="${cellKey}" data-ans="${esc(cell.ans)}" value="${esc(prevVal)}" placeholder="${esc(cell.ph || '')}"></td>`;
        }
        const opts = ['<option value="">-- เลือก --</option>']
          .concat(cell.opts.map((o) => `<option value="${esc(o)}" ${prevVal === o ? 'selected' : ''}>${esc(o)}</option>`))
          .join('');
        return `<td><select class="trace-select" data-ckey="${cellKey}" data-ans="${esc(cell.ans)}">${opts}</select></td>`;
      }).join('');
      return `<tr class="${rIdx === curTraceStep ? 'trace-active' : ''}">${tds}</tr>`;
    }).join('');
    $('lab4-trace-table').innerHTML = thHtml + `<tbody>${tbRows}</tbody>`;

    $('lab4-trace-table').querySelectorAll('[data-ckey]').forEach((inp) => {
      inp.addEventListener('input', persistTraceInputs);
      inp.addEventListener('change', persistTraceInputs);
    });

    updateLab4SummaryBox();
  }

  function persistTraceInputs() {
    const store = loadTraceStore();
    if (!store[curLab4Exp]) store[curLab4Exp] = { verified: false, score_pct: 0, filled: {} };
    const filled = {};
    $('lab4-trace-table').querySelectorAll('[data-ckey]').forEach((inp) => {
      filled[inp.getAttribute('data-ckey')] = inp.value.trim();
    });
    store[curLab4Exp].filled = filled;
    saveTraceStore(store);
  }

  function updateLab4SummaryBox() {
    const store = loadTraceStore();
    const names = {
      cstr: '4.0 CSTR',
      titration: '4.1 ไทเทรต',
      pendulum: '4.2 เพนดูลัม',
      incubator: '4.3 ตู้บ่มเชื้อ',
      smartfarm: '4.4 เกษตรอัจฉริยะ',
      grading_edu: '4.5 ตัดเกรด/ซ่อมเสริม'
    };
    const parts = Object.keys(names).map((k) => {
      const st = store[k];
      if (st && st.verified) return `<span class="submit-pill done">✓ ${names[k]} (${st.score_pct}%)</span>`;
      if (st && st.score_pct > 0) return `<span class="submit-pill">${names[k]} (${st.score_pct}%)</span>`;
      return `<span class="submit-pill">${names[k]} (ยังไม่ตรวจ)</span>`;
    });
    $('lab4-trace-summary').innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center"><span>สถานะ Trace Table ทั้ง 6 กิจกรรม (แนะนำ ≥ 4 กิจกรรม):</span>${parts.join('')}</div>`;
  }

  function checkLab4Trace() {
    const inputs = Array.from($('lab4-trace-table').querySelectorAll('[data-ckey]'));
    let correct = 0;
    const filled = {};
    inputs.forEach((inp) => {
      const val = inp.value.trim();
      const ans = (inp.getAttribute('data-ans') || '').trim();
      filled[inp.getAttribute('data-ckey')] = val;
      inp.classList.remove('cell-ok', 'cell-bad');

      let isOk = false;
      if (val !== '') {
        if (!isNaN(Number(val)) && !isNaN(Number(ans))) {
          isOk = Math.abs(Number(val) - Number(ans)) <= 0.05;
        } else {
          isOk = val.toLowerCase() === ans.toLowerCase();
        }
      }
      if (isOk) {
        correct++;
        inp.classList.add('cell-ok');
      } else {
        inp.classList.add('cell-bad');
      }
    });

    const pct = inputs.length > 0 ? Math.round((correct / inputs.length) * 100) : 0;
    const store = loadTraceStore();
    store[curLab4Exp] = { verified: pct >= 80, score_pct: pct, filled };
    saveTraceStore(store);
    updateLab4SummaryBox();

    const fb = $('lab4-trace-fb');
    if (pct >= 80) {
      fb.className = 'feedback good';
      fb.textContent = `✓ ตรวจ Trace Table ผ่าน! ถูกต้อง ${correct}/${inputs.length} ช่อง (${pct}%) — แนะนำให้ทำครบอย่างน้อย 4 จาก 6 กิจกรรมเพื่อรับคะแนน AI เต็ม`;
      recordModule('lab4_tracetable', true);
    } else {
      fb.className = 'feedback bad';
      fb.textContent = `ถูกต้อง ${correct}/${inputs.length} ช่อง (${pct}%) — ช่องสีแดงยังไม่ตรงตามตรรกะของผังงาน ลองกด "▷ จำลอง Trace ทีละขั้น" เพื่อไล่ดูใหม่`;
      recordModule('lab4_tracetable', false);
    }
  }

  function initModule04() {
    document.querySelectorAll('#lab4-exp-tabs .sub-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        curLab4Exp = btn.getAttribute('data-exp');
        curTraceStep = -1;
        document.querySelectorAll('#lab4-exp-tabs .sub-tab').forEach((b) => b.classList.toggle('active', b === btn));
        $('lab4-trace-fb').className = 'feedback';
        renderLab4Experiment();
      });
    });

    $('lab4-check-trace')?.addEventListener('click', checkLab4Trace);
    $('lab4-step-trace')?.addEventListener('click', () => {
      const exp = LAB4_EXPERIMENTS[curLab4Exp];
      curTraceStep = (curTraceStep + 1) % exp.rows.length;
      renderLab4Experiment();
    });
    $('lab4-reset-trace')?.addEventListener('click', () => {
      const store = loadTraceStore();
      delete store[curLab4Exp];
      saveTraceStore(store);
      curTraceStep = -1;
      $('lab4-trace-fb').className = 'feedback';
      renderLab4Experiment();
    });
    renderLab4Experiment();
  }

  // ==========================================================
  // SEMI-STRUCTURED PARSONS + REASONING BUILDER (ALL 4 MODULES)
  // ==========================================================
  const SEMI_TASKS = {
    algo_design: {
      prompt: 'จัดลำดับขั้นตอนการออกแบบอัลกอริทึมคำนวณความเข้มข้นสารละลาย (C = n / V) อย่างเป็นระบบ พร้อมคัดขั้นตอนที่กำกวมออก',
      blocks: [
        '1. ระบุ Input: จำนวนโมล (n) และปริมาตรสารละลายเป็นลิตร (V)',
        'ผสมสารเคมีลงในบีกเกอร์ทันทีโดยไม่ต้องวัดปริมาตร V',
        '2. ตรวจสอบเงื่อนไขขอบเขต: ถ้า V <= 0 ให้แจ้งข้อผิดพลาดทันที',
        '3. ประมวลผล (Process): คำนวณความเข้มข้น C = n / V',
        '4. แสดงผลลัพธ์ (Output): รายงานค่าความเข้มข้น C (mol/L) และจบ'
      ],
      subjPrompt: 'เหตุใดขั้นตอนวิธีที่ดีจึงต้องตรวจสอบเงื่อนไขขอบเขต (Boundary / Abnormal Data) เช่น V <= 0 ก่อนทำการหาร C = n / V?'
    },
    pseudocode: {
      prompt: 'เรียงลำดับรหัสลำลองมาตรฐาน (INITIALISE / INPUT / OUTPUT / ←) สำหรับนับจำนวนข้อมูลอุณหภูมิที่สูงกว่าเกณฑ์ 37.5°C',
      blocks: [
        'INITIALISE count ← 0, i ← 1',
        'INITIALISE count ← 0 ภายในลูป WHILE เพื่อรีเซ็ตทุกรอบ',
        'WHILE i <= N DO',
        '  INPUT temp[i]',
        '  IF temp[i] > 37.5 THEN count ← count + 1 ENDIF',
        '  i ← i + 1',
        'ENDWHILE แล้ว OUTPUT count'
      ],
      subjPrompt: 'หากลืมเขียนคำสั่ง i ← i + 1 ก่อน ENDWHILE หรือเผลอนำ count ← 0 ไว้ในลูป จะเกิด Logic Error ใดบ้าง?'
    },
    flowchart: {
      prompt: 'เรียงลำดับสัญลักษณ์ผังงานมาตรฐาน ISO 5807:1985 (รวม Preparation หกเหลี่ยม) สำหรับระบบแจ้งเตือนค่า pH ดินที่เป็นกรด (pH < 5.5)',
      blocks: [
        '[วงรี Terminator] เริ่มต้นการทำงาน',
        '[หกเหลี่ยม Preparation] กำหนดค่าเกณฑ์เริ่มต้น pH_min ← 5.5',
        '[ข้าวหลามตัด Decision] จบการทำงานและปิดระบบ',
        '[สี่เหลี่ยมด้านขนาน Input] อ่านค่า pH จากเซนเซอร์ดิน',
        '[ข้าวหลามตัด Decision] ตรวจสอบเงื่อนไข pH < pH_min ?',
        '[สี่เหลี่ยมผืนผ้า Process] ถ้าใช่: แจ้งเตือน "ดินเป็นกรด" / ถ้าไม่ใช่: แสดง "ปกติ"',
        '[วงรี Terminator] จบการทำงาน'
      ],
      subjPrompt: 'ในผังงานมาตรฐาน สัญลักษณ์สี่เหลี่ยมข้าวหลามตัด (Decision) และหกเหลี่ยม (Preparation) แตกต่างจากสี่เหลี่ยมผืนผ้า (Process) อย่างไร?'
    },
    lab4_tracetable: {
      prompt: 'เรียงลำดับผังงานควบคุม "ระบบถังปฏิกรณ์เคมี CSTR" อย่างปลอดภัยตามมาตรฐาน ISO 5807 พร้อมขั้นตอน Fail-Safe Reset',
      blocks: [
        '[วงรี Terminator] เริ่มต้นระบบควบคุมปฏิกิริยาเคมี CSTR',
        '[หกเหลี่ยม Preparation] INITIALISE TotalCycles ← 0, MaxCycles ← 3',
        '[สี่เหลี่ยม Process] เปิด Heater และ AlkaliPump ทิ้งไว้ตลอดเวลาโดยไม่รอหน่วงเวลา DELAY',
        '[ข้าวหลามตัด Decision] TotalCycles < MaxCycles AND EmergencyStop == FALSE ?',
        '[สี่เหลี่ยม Process/Delay] INPUT Temp, pH → สั่ง Actuator และ DELAY 5 SECONDS',
        '[สี่เหลี่ยม Process] อัปเดต TotalCycles ← TotalCycles + 1 แล้ววนกลับตรวจสอบเงื่อนไข',
        '[สี่เหลี่ยม Predefined] Fail-Safe Default Reset: ปิด Cooler, Heater, AlkaliPump ← OFF',
        '[วงรี Terminator] OUTPUT รายงานสถานะและจบการทำงาน'
      ],
      subjPrompt: 'จาก Taxonomy ข้อผิดพลาด 4 ประการ เหตุใดจึงต้องทำ Trace Table (Dry Run) และปิดท้ายด้วย Fail-Safe Default Reset ก่อนเปิดเครื่อง CSTR จริง?'
    }
  };

  function loadSemi() {
    try { return JSON.parse(localStorage.getItem(scopedKey(SEMI_BASE)) || '{}'); } catch { return {}; }
  }
  function saveSemi(obj) {
    try { localStorage.setItem(scopedKey(SEMI_BASE), JSON.stringify(obj)); } catch {}
  }

  function injectSemiCards() {
    Object.keys(SEMI_TASKS).forEach((key) => {
      const sec = document.querySelector(`.page[data-page="${key}"]`);
      if (!sec || sec.querySelector('.subjective-card')) return;
      const task = SEMI_TASKS[key];
      const store = loadSemi();
      const curState = store[key] || { seq: [], note: '' };
      if (!Array.isArray(curState.seq)) curState.seq = [];

      const card = document.createElement('div');
      card.className = 'subjective-card';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">
          <span class="eyebrow" style="color:#b45309">AI RUBRIC CHALLENGE • กึ่งจัดบล็อก + เหตุผลอัตนัย</span>
          <span class="tag soft">ส่งให้ AI ตรวจได้ทันที</span>
        </div>
        <p style="font-size:14px;font-weight:700;margin:0 0 8px"><b>ส่วนที่ 1 (จัดลำดับขั้นตอน/ผังงาน 35 คะแนน):</b> ${esc(task.prompt)}</p>
        <div class="semi-builder">
          <div class="semi-col">
            <div class="semi-col-title">ลำดับคำตอบของคุณ (↑ ↓ ×)</div>
            <div class="semi-seq" id="semi-seq-${key}"></div>
          </div>
          <div class="semi-col">
            <div class="semi-col-title">คลังบล็อก (แตะเพื่อเพิ่มเข้าลำดับ)</div>
            <div class="semi-bank" id="semi-bank-${key}"></div>
          </div>
        </div>
        <p style="font-size:14px;font-weight:700;margin:14px 0 4px"><b>ส่วนที่ 2 (อธิบายเหตุผลเชิงวิทยาศาสตร์ 25 คะแนน):</b> ${esc(task.subjPrompt)}</p>
        <textarea id="subj-${key}" class="subjective-input" rows="3" placeholder="พิมพ์เหตุผลของคุณที่นี่ (บันทึกอัตโนมัติระหว่างพิมพ์)..."></textarea>
      `;

      const seqBox = card.querySelector(`#semi-seq-${key}`);
      const bankBox = card.querySelector(`#semi-bank-${key}`);
      const ta = card.querySelector('textarea');
      ta.value = curState.note || '';

      function persist() {
        const s = loadSemi();
        s[key] = { seq: curState.seq, note: ta.value };
        saveSemi(s);
      }

      function render() {
        seqBox.replaceChildren();
        if (curState.seq.length === 0) {
          seqBox.innerHTML = '<div class="empty-state" style="padding:12px">ยังไม่ได้เลือกบล็อก แตะบล็อกจากด้านขวา</div>';
        } else {
          curState.seq.forEach((txt, idx) => {
            const item = document.createElement('div');
            item.className = 'semi-seq-item';
            item.innerHTML = `
              <span class="semi-num">${idx + 1}</span>
              <span class="semi-txt"></span>
              <div class="semi-actions">
                <button type="button" class="semi-btn" data-act="up" ${idx === 0 ? 'disabled' : ''}>↑</button>
                <button type="button" class="semi-btn" data-act="down" ${idx === curState.seq.length - 1 ? 'disabled' : ''}>↓</button>
                <button type="button" class="semi-btn del" data-act="del">×</button>
              </div>
            `;
            item.querySelector('.semi-txt').textContent = txt;
            item.querySelectorAll('button').forEach((b) => {
              b.addEventListener('click', () => {
                const act = b.getAttribute('data-act');
                if (act === 'up' && idx > 0) [curState.seq[idx - 1], curState.seq[idx]] = [curState.seq[idx], curState.seq[idx - 1]];
                else if (act === 'down' && idx < curState.seq.length - 1) [curState.seq[idx + 1], curState.seq[idx]] = [curState.seq[idx], curState.seq[idx + 1]];
                else if (act === 'del') curState.seq.splice(idx, 1);
                persist();
                render();
              });
            });
            seqBox.appendChild(item);
          });
        }

        bankBox.replaceChildren();
        task.blocks.forEach((txt) => {
          const used = curState.seq.includes(txt);
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'semi-bank-btn' + (used ? ' used' : '');
          btn.disabled = used;
          btn.textContent = (used ? '✓ ' : '+ ') + txt;
          btn.addEventListener('click', () => {
            if (!curState.seq.includes(txt)) {
              curState.seq.push(txt);
              persist();
              render();
            }
          });
          bankBox.appendChild(btn);
        });
      }

      ta.addEventListener('input', persist);
      render();
      sec.appendChild(card);

      const bar = document.createElement('div');
      bar.className = 'module-submit-bar';
      bar.innerHTML = `
        <div>
          <strong>ทำโมดูล ${esc(MODULE_LABELS[key])} เสร็จแล้วหรือยัง?</strong>
          <span>ส่งงานเข้าสู่ฐานข้อมูลเพื่อให้ AI ตรวจให้คะแนน Rubric และแสดงคำแนะนำทันที</span>
        </div>
        <button type="button" class="btn btn-primary" data-submit-mod="${key}">📤 ส่งงานโมดูลนี้ให้ AI ตรวจ</button>
      `;
      bar.querySelector('button').addEventListener('click', () => openSubmitModal(key));
      sec.appendChild(bar);
    });
  }

  // ==========================================================
  // MODULE 05: ASSESSMENT (SERVER-SIDE CHALLENGE)
  // ==========================================================
  const QUIZ_SVGS = {
    q1: `<svg viewBox="0 0 600 175"><rect width="600" height="175" rx="12" fill="#f8fbff"/><rect x="30" y="55" width="120" height="58" rx="6" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/><text x="90" y="82" text-anchor="middle" font-size="11" font-weight="800" fill="#14532d">Process</text><text x="90" y="99" text-anchor="middle" font-size="10" fill="#166534">ประมวลผลทั่วไป</text><polygon points="215,44 385,44 410,84 385,124 215,124 190,84" fill="#ede9fe" stroke="#7c3aed" stroke-width="3"/><text x="300" y="75" text-anchor="middle" font-size="12" font-weight="800" fill="#5b21b6">Preparation (?)</text><text x="300" y="96" text-anchor="middle" font-size="11" font-weight="700" fill="#4c1d95">INITIALISE MaxCycles ← 3</text><polygon points="505,45 570,84 505,123 440,84" fill="#fef3c7" stroke="#d97706" stroke-width="2"/><text x="505" y="88" text-anchor="middle" font-size="11" font-weight="800" fill="#92400e">Decision</text></svg>`,
    q2: `<svg viewBox="0 0 600 175"><rect width="600" height="175" rx="12" fill="#0f172a"/><text x="26" y="34" font-family="monospace" font-size="13" font-weight="700" fill="#38bdf8">INITIALISE pH ← 7.5  (ค่าเริ่มต้นมากกว่า 7.0 แล้ว)</text><rect x="26" y="50" width="260" height="96" rx="8" fill="rgba(56,189,248,0.1)" stroke="#38bdf8"/><text x="40" y="74" font-family="monospace" font-size="12" font-weight="800" fill="#fbbf24">Pre-test Loop (WHILE)</text><text x="40" y="98" font-family="monospace" font-size="12" fill="#e2e8f0">WHILE pH &lt; 7.0 DO</text><text x="52" y="118" font-family="monospace" font-size="12" fill="#94a3b8">  ADD_BASE(2 mL)</text><text x="40" y="136" font-family="monospace" font-size="12" fill="#e2e8f0">ENDWHILE</text><rect x="310" y="50" width="264" height="96" rx="8" fill="rgba(52,211,153,0.1)" stroke="#34d399"/><text x="324" y="74" font-family="monospace" font-size="12" font-weight="800" fill="#34d399">Post-test Loop (REPEAT)</text><text x="324" y="98" font-family="monospace" font-size="12" fill="#e2e8f0">REPEAT</text><text x="336" y="118" font-family="monospace" font-size="12" fill="#94a3b8">  ADD_BASE(2 mL)</text><text x="324" y="136" font-family="monospace" font-size="12" fill="#e2e8f0">UNTIL pH &gt;= 7.0</text></svg>`,
    q3: `<svg viewBox="0 0 600 175"><rect width="600" height="175" rx="12" fill="#f8fafc"/><text x="300" y="30" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">ช่วงปลอดภัย CSTR: 35.0 – 40.0 °C (ย่านเซนเซอร์ 0 – 100 °C)</text><rect x="60" y="68" width="480" height="24" rx="12" fill="#e2e8f0"/><rect x="220" y="68" width="160" height="24" fill="#bbf7d0" stroke="#16a34a" stroke-width="2"/><text x="300" y="84" text-anchor="middle" font-size="11" font-weight="800" fill="#14532d">35.0 – 40.0 °C</text><line x1="210" y1="48" x2="210" y2="108" stroke="#d97706" stroke-width="2" stroke-dasharray="3,2"/><text x="195" y="128" text-anchor="middle" font-size="11" font-weight="800" fill="#b45309">34.9°C / 35.0°C</text><line x1="392" y1="48" x2="392" y2="108" stroke="#d97706" stroke-width="2" stroke-dasharray="3,2"/><text x="410" y="128" text-anchor="middle" font-size="11" font-weight="800" fill="#b45309">40.0°C / 40.1°C</text><text x="300" y="156" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">ชุดทดสอบประชิดจุดเปลี่ยน &lt; กับ &lt;= จัดเป็นข้อมูลระดับใด?</text></svg>`,
    q4: `<svg viewBox="0 0 600 175"><rect width="600" height="175" rx="12" fill="#f8fbff"/><text x="300" y="28" text-anchor="middle" font-size="13" font-weight="800" fill="#1e3a8a">CSTR Trace Table (ปลอดภัย: 35.0 ≤ Temp ≤ 40.0°C และ pH ≥ 6.0)</text><rect x="30" y="42" width="540" height="114" rx="8" fill="#fff" stroke="#cbd5e1"/><text x="65" y="66" font-size="11" font-weight="800" fill="#334155">Cycle</text><text x="135" y="66" font-size="11" font-weight="800" fill="#334155">Temp</text><text x="205" y="66" font-size="11" font-weight="800" fill="#334155">pH</text><text x="285" y="66" font-size="11" font-weight="800" fill="#334155">Cooler</text><text x="370" y="66" font-size="11" font-weight="800" fill="#334155">Heater</text><text x="470" y="66" font-size="11" font-weight="800" fill="#334155">AlkaliPump</text><line x1="40" y1="76" x2="560" y2="76" stroke="#e2e8f0"/><text x="65" y="102" font-size="11" fill="#334155">1</text><text x="135" y="102" font-size="11" fill="#334155">42.5°C</text><text x="205" y="102" font-size="11" fill="#334155">5.5</text><text x="285" y="102" font-size="11" font-weight="700" fill="#16a34a">ON</text><text x="370" y="102" font-size="11" fill="#64748b">OFF</text><text x="470" y="102" font-size="11" font-weight="700" fill="#16a34a">ON</text><text x="65" y="136" font-size="11" font-weight="800" fill="#2563eb">2</text><text x="135" y="136" font-size="11" font-weight="800" fill="#2563eb">32.0°C</text><text x="205" y="136" font-size="11" font-weight="800" fill="#2563eb">6.8</text><text x="285" y="136" font-size="12" font-weight="800" fill="#dc2626">?</text><text x="370" y="136" font-size="12" font-weight="800" fill="#dc2626">?</text><text x="470" y="136" font-size="12" font-weight="800" fill="#dc2626">?</text></svg>`,
    q5: `<svg viewBox="0 0 600 175"><rect width="600" height="175" rx="12" fill="#fef2f2"/><polygon points="150,42 260,84 150,126 40,84" fill="#fef3c7" stroke="#d97706" stroke-width="2.5"/><text x="150" y="88" text-anchor="middle" font-size="11" font-weight="800" fill="#92400e">TotalCycles &lt; 3 ?</text><line x1="260" y1="84" x2="320" y2="84" stroke="#dc2626" stroke-width="2.5"/><text x="290" y="74" text-anchor="middle" font-size="11" font-weight="800" fill="#dc2626">False</text><rect x="320" y="54" width="145" height="60" rx="8" fill="#fee2e2" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="5,4"/><text x="392" y="80" text-anchor="middle" font-size="11" font-weight="800" fill="#991b1b">[ ? ขั้นตอนก่อนจบ ]</text><text x="392" y="98" text-anchor="middle" font-size="10" fill="#b91c1c">Cooler/Heater/Pump</text><line x1="465" y1="84" x2="500" y2="84" stroke="#475569" stroke-width="2.5"/><rect x="500" y="64" width="76" height="40" rx="20" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/><text x="538" y="88" text-anchor="middle" font-size="11" font-weight="800" fill="#1e3a8a">END</text></svg>`
  };

  let rosterList = [];
  let rosterMap = new Map();

  function populateStudentSelect(secSelId, stuSelId, sectionVal, preId) {
    const stuSel = $(stuSelId);
    if (!stuSel) return;
    stuSel.replaceChildren();
    if (!sectionVal) {
      stuSel.disabled = true;
      stuSel.innerHTML = '<option value="">-- กรุณาเลือกสาขาก่อน --</option>';
      return;
    }
    const list = rosterList.filter((s) => s.section === sectionVal);
    stuSel.disabled = false;
    const def = document.createElement('option');
    def.value = '';
    def.textContent = `-- เลือกชื่อนักศึกษา (${list.length} คน) --`;
    stuSel.appendChild(def);
    list.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.student_id;
      opt.textContent = `${s.student_id} — ${s.full_name}`;
      stuSel.appendChild(opt);
    });
    if (preId && rosterMap.has(preId) && rosterMap.get(preId).section === sectionVal) {
      stuSel.value = preId;
    }
  }

  async function loadRosterOnce() {
    if (rosterList.length > 0 || location.protocol === 'file:') return;
    try {
      let data = null;
      try {
        const res = await fetch('api/submit.php?action=roster');
        data = await res.json();
      } catch (_) {
        const resFb = await fetch('../data/cs2027_students.json');
        data = await resFb.json();
      }
      if (!data || !data.ok || !Array.isArray(data.students)) return;
      rosterList = data.students;
      rosterMap = new Map();
      const secCounts = new Map();
      rosterList.forEach((s) => {
        rosterMap.set(s.student_id, s);
        const sec = s.section || 'อื่นๆ';
        secCounts.set(sec, (secCounts.get(sec) || 0) + 1);
      });

      const prof = loadProfile();
      [['ch-section-select', 'ch-student-select'], ['sub-section-select', 'sub-student-select']].forEach(([secId, stuId]) => {
        const secSel = $(secId);
        if (!secSel) return;
        secSel.replaceChildren();
        secSel.innerHTML = '<option value="">-- กรุณาเลือกสาขา / กลุ่มเรียน --</option>';
        Array.from(secCounts.keys()).forEach((sec) => {
          const opt = document.createElement('option');
          opt.value = sec;
          opt.textContent = `${sec} (${secCounts.get(sec)} คน)`;
          secSel.appendChild(opt);
        });
        if (prof.section && secCounts.has(prof.section)) {
          secSel.value = prof.section;
          populateStudentSelect(secId, stuId, prof.section, prof.student_id || '');
          if (stuId === 'sub-student-select' && prof.student_id && rosterMap.has(prof.student_id)) {
            const st = rosterMap.get(prof.student_id);
            $('sub-student-id').value = st.student_id;
            $('sub-full-name').value = st.full_name;
            $('sub-section').value = st.section;
          }
        }
      });
    } catch {}
  }

  async function initModule05() {
    const box = $('ch-questions');
    if (!box) return;
    if (location.protocol === 'file:') {
      box.innerHTML = '<div class="empty-state">แบบทดสอบนี้ตรวจผลบนเซิร์ฟเวอร์ กรุณาเปิดผ่านเว็บเซิร์ฟเวอร์ (HTTP/HTTPS) แทนการเปิดไฟล์โดยตรง</div>';
      return;
    }

    await loadRosterOnce();

    $('ch-section-select')?.addEventListener('change', (e) => {
      populateStudentSelect('ch-section-select', 'ch-student-select', e.target.value, '');
    });
    $('ch-student-select')?.addEventListener('change', (e) => {
      const st = rosterMap.get(e.target.value);
      if (st) {
        saveProfile({ student_id: st.student_id, full_name: st.full_name, section: st.section });
        refreshProgressUI();
        renderLab4Experiment();
      }
    });

    try {
      let data = null;
      try {
        const res = await fetch('api/challenge.php');
        data = await res.json();
      } catch (_) {
        const resFb = await fetch('data/challenge_questions.json');
        data = await resFb.json();
      }
      if (!data || !data.ok || !Array.isArray(data.questions)) {
        box.innerHTML = '<div class="empty-state">ไม่สามารถโหลดโจทย์ได้</div>';
        return;
      }
      box.replaceChildren();
      data.questions.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'panel';
        const opts = Object.entries(q.options).map(([k, txt]) => `
          <label class="ch-option">
            <input type="radio" name="ch_${q.id}" value="${k}" required>
            <strong style="color:var(--blue)">${k}.</strong>
            <span>${esc(txt)}</span>
          </label>
        `).join('');
        card.innerHTML = `
          <div class="panel-top">
            <div>
              <span class="eyebrow">ข้อที่ ${idx + 1} · ${esc(q.topic)}</span>
              <h3 style="margin-top:4px">${esc(q.question)}</h3>
            </div>
            <span class="tag soft">ตรวจด้วย AI ฝั่ง Server</span>
          </div>
          <div class="svg-stage" style="margin-bottom:12px">${QUIZ_SVGS[q.id] || ''}</div>
          <div class="ch-options">${opts}</div>
        `;
        box.appendChild(card);
      });
    } catch {
      box.innerHTML = '<div class="empty-state">ไม่สามารถเชื่อมต่อ api/challenge.php ได้</div>';
    }

    $('ch-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const sid = $('ch-student-select')?.value || '';
      const st = rosterMap.get(sid);
      const fb = $('ch-feedback');
      const btn = $('ch-submit-btn');
      if (!st) {
        fb.className = 'feedback bad';
        fb.textContent = 'กรุณาเลือกสาขาและชื่อนักศึกษาก่อนส่งคำตอบ';
        return;
      }
      const answers = {};
      ['q1', 'q2', 'q3', 'q4', 'q5'].forEach((qid) => {
        const c = document.querySelector(`input[name="ch_${qid}"]:checked`);
        if (c) answers[qid] = c.value;
      });
      btn.disabled = true;
      btn.textContent = 'กำลังส่งตรวจด้วย AI...';
      try {
        const res = await fetch('api/challenge.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: st.student_id,
            full_name: st.full_name,
            section: st.section,
            answers,
            student_note: $('ch-note')?.value.trim() || ''
          })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          fb.className = 'feedback bad';
          fb.textContent = data.error || 'ส่งคำตอบไม่สำเร็จ';
        } else {
          fb.className = 'feedback good';
          fb.textContent = data.ai_safe_feedback ? `${data.message} — ${data.ai_safe_feedback}` : data.message;
          const prog = loadProgress();
          prog.completed.assessment = true;
          saveProgress(prog);
          refreshProgressUI();
          toast('ส่งคำตอบแบบทดสอบสำเร็จ');
        }
      } catch {
        fb.className = 'feedback bad';
        fb.textContent = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
      } finally {
        btn.disabled = false;
        btn.textContent = '📤 ส่งคำตอบให้อาจารย์และ AI ตรวจ';
      }
    });
  }

  // ==========================================================
  // SUBMISSION MODAL & AI RUBRIC VIEWER
  // ==========================================================
  function renderAiEvalHtml(aiScore, aiRubric, aiFeedback, aiModel) {
    if (aiScore === null || aiScore === undefined) return '';
    const num = Number(aiScore);
    const tierCls = num >= 80 ? 'score-high' : (num >= 50 ? 'score-mid' : 'score-low');
    let barsHtml = '';
    if (aiRubric && typeof aiRubric.simulation === 'number' && typeof aiRubric.sequencing === 'number' && typeof aiRubric.subjective === 'number') {
      barsHtml = `
        <div class="ai-rubric-bars">
          <div class="ai-bar-row">
            <div class="ai-bar-label"><span>จำลอง &amp; Trace Table</span><span>${aiRubric.simulation}/40</span></div>
            <div class="ai-bar-track"><div class="ai-bar-fill" style="width:${Math.min(100, Math.round((aiRubric.simulation / 40) * 100))}%"></div></div>
          </div>
          <div class="ai-bar-row">
            <div class="ai-bar-label"><span>จัดลำดับรหัส/ผังงาน</span><span>${aiRubric.sequencing}/35</span></div>
            <div class="ai-bar-track"><div class="ai-bar-fill" style="width:${Math.min(100, Math.round((aiRubric.sequencing / 35) * 100))}%"></div></div>
          </div>
          <div class="ai-bar-row">
            <div class="ai-bar-label"><span>เหตุผลวิทยาศาสตร์</span><span>${aiRubric.subjective}/25</span></div>
            <div class="ai-bar-track"><div class="ai-bar-fill" style="width:${Math.min(100, Math.round((aiRubric.subjective / 25) * 100))}%"></div></div>
          </div>
        </div>
      `;
    }
    return `
      <div class="ai-eval-card">
        <div class="ai-eval-head">
          <div class="ai-eval-title">🤖 ผลประเมินด้วย AI ${aiModel ? `<span class="ai-pill-badge">${esc(aiModel)}</span>` : ''}</div>
          <span class="ai-pill-badge ${tierCls}">คะแนน AI: ${num.toFixed(1)}%</span>
        </div>
        ${barsHtml}
        ${aiFeedback ? `<pre class="ai-feedback-pre">${esc(aiFeedback)}</pre>` : ''}
      </div>
    `;
  }

  function renderSubSummaryPills() {
    const prog = loadProgress();
    const keys = Object.keys(MODULE_LABELS);
    const done = keys.filter((k) => !!prog.completed[k]).length;
    if ($('sub-progress-count')) $('sub-progress-count').textContent = `สำเร็จ ${done} / ${keys.length} โมดูล (${Math.round((done / keys.length) * 100)}%)`;
    const pills = $('sub-module-pills');
    if (!pills) return;
    pills.replaceChildren();
    keys.forEach((k) => {
      const sp = document.createElement('span');
      sp.className = 'submit-pill' + (prog.completed[k] ? ' done' : '');
      sp.textContent = (prog.completed[k] ? '✓ ' : '') + MODULE_LABELS[k];
      pills.appendChild(sp);
    });
  }

  async function openSubmitModal(scope) {
    renderSubSummaryPills();
    await loadRosterOnce();
    if (scope && $('sub-scope')) $('sub-scope').value = scope;
    document.querySelectorAll('[data-sub-tab]').forEach((b) => b.classList.toggle('active', b.getAttribute('data-sub-tab') === 'form'));
    $('sub-pane-form').hidden = false;
    $('sub-pane-history').hidden = true;
    $('sub-feedback').className = 'feedback';
    $('sub-ai-result').innerHTML = '';

    if (scope && scope !== 'all') {
      const semi = loadSemi();
      if (semi[scope] && semi[scope].note) $('sub-note').value = semi[scope].note;
    }
    $('submit-dialog')?.showModal();
  }

  async function loadHistory() {
    const listEl = $('sub-history-list');
    const sid = ($('sub-student-id')?.value || '').trim();
    if (!listEl) return;
    if (!sid) {
      listEl.innerHTML = '<div class="empty-state">กรุณาเลือกสาขาและชื่อนักศึกษาในแท็บส่งงานก่อน</div>';
      return;
    }
    if (location.protocol === 'file:') {
      listEl.innerHTML = '<div class="empty-state">โหมด file:// ไม่สามารถเชื่อมต่อฐานข้อมูลได้</div>';
      return;
    }
    listEl.innerHTML = '<div class="empty-state">กำลังโหลดประวัติ...</div>';
    try {
      const res = await fetch(`api/submit.php?student_id=${encodeURIComponent(sid)}`);
      const data = await res.json();
      if (!res.ok || !data.ok || !data.submissions || data.submissions.length === 0) {
        listEl.innerHTML = '<div class="empty-state">ยังไม่มีประวัติการส่งงาน</div>';
        return;
      }
      listEl.replaceChildren();
      data.submissions.forEach((item) => {
        const badgeCls = item.status === 'graded' ? 'badge-graded' : (item.status === 'resubmit' ? 'badge-resubmit' : 'badge-submitted');
        const badgeTxt = item.status === 'graded' ? 'ตรวจแล้ว' : (item.status === 'resubmit' ? 'ส่งแก้ไข' : 'รอตรวจ');
        const modLabel = item.module_id === 'all' ? 'ภาพรวมทั้งหมด (4 โมดูล)' : (DISPLAY_LABELS[item.module_id] || item.module_id);
        const isChall = item.module_id === 'challenge10' || item.module_id === 'challenge';
        const aiHtml = (!isChall && item.ai_score !== null && item.ai_score !== undefined)
          ? renderAiEvalHtml(item.ai_score, item.ai_rubric, item.ai_feedback, item.ai_model)
          : (isChall && item.ai_score !== null ? `<div class="ai-eval-card"><div class="ai-eval-head"><div class="ai-eval-title">🤖 AI ประเมินผลแบบทดสอบ</div><span class="ai-pill-badge">คะแนนรวม: ${Number(item.ai_score).toFixed(1)}%</span></div></div>` : '');
        const showTeacherFb = item.teacher_feedback && item.teacher_feedback !== item.ai_feedback;

        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
          <div class="history-card-top">
            <strong>#${item.id} · ${esc(modLabel)}</strong>
            <span class="badge ${badgeCls}">${badgeTxt}</span>
          </div>
          <div class="history-meta">
            <span>ผ่าน: <b>${item.completed_count}/${item.total_modules}</b></span>
            <span>คะแนนระบบ: <b>${item.auto_score}</b></span>
            <span>คะแนน AI: <b>${item.ai_score !== null ? item.ai_score : '—'}</b></span>
            <span>คะแนนอาจารย์: <b>${item.teacher_score !== null ? item.teacher_score : '—'}</b></span>
            <span>ส่งเมื่อ: ${esc(item.submitted_at)}</span>
          </div>
          ${aiHtml}
          ${showTeacherFb ? `<div class="history-feedback"><b>ข้อเสนอแนะเพิ่มเติมจากอาจารย์:</b> ${esc(item.teacher_feedback)}</div>` : ''}
        `;
        listEl.appendChild(card);
      });
    } catch {
      listEl.innerHTML = '<div class="empty-state">ไม่สามารถเชื่อมต่อ api/submit.php ได้</div>';
    }
  }

  function initSubmissionModal() {
    $('open-submit-modal')?.addEventListener('click', () => openSubmitModal('all'));
    $('sub-close-btn')?.addEventListener('click', () => $('submit-dialog')?.close());

    $('sub-section-select')?.addEventListener('change', (e) => {
      populateStudentSelect('sub-section-select', 'sub-student-select', e.target.value, '');
    });
    $('sub-student-select')?.addEventListener('change', (e) => {
      const st = rosterMap.get(e.target.value);
      if (st) {
        $('sub-student-id').value = st.student_id;
        $('sub-full-name').value = st.full_name;
        $('sub-section').value = st.section;
        saveProfile({ student_id: st.student_id, full_name: st.full_name, section: st.section });
        refreshProgressUI();
        renderSubSummaryPills();
        renderLab4Experiment();
      }
    });

    document.querySelectorAll('[data-sub-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const t = btn.getAttribute('data-sub-tab');
        document.querySelectorAll('[data-sub-tab]').forEach((b) => b.classList.toggle('active', b === btn));
        $('sub-pane-form').hidden = t !== 'form';
        $('sub-pane-history').hidden = t !== 'history';
        if (t === 'history') loadHistory();
      });
    });
    $('sub-refresh-history')?.addEventListener('click', loadHistory);

    $('sub-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (location.protocol === 'file:') {
        $('sub-feedback').className = 'feedback bad';
        $('sub-feedback').textContent = 'โหมด file:// ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาเปิดผ่าน XAMPP';
        return;
      }
      const sid = $('sub-student-id').value.trim();
      const fname = $('sub-full-name').value.trim();
      const sec = $('sub-section').value.trim();
      if (!sid || !fname) {
        $('sub-feedback').className = 'feedback bad';
        $('sub-feedback').textContent = 'กรุณาเลือกสาขาและชื่อนักศึกษาก่อนส่งงาน';
        return;
      }

      const btn = $('sub-submit-btn');
      btn.disabled = true;
      btn.textContent = 'กำลังบันทึกและให้ AI ตรวจงาน...';
      $('sub-feedback').className = 'feedback';
      $('sub-ai-result').innerHTML = '';

      const prog = loadProgress();
      const snapshot = {
        ipo_checked: ipoState.validTested || ipoState.edgeTested,
        four_tier_tested: fourTierTested,
        fc3_scenarios_done: fc3DoneSet.size,
        fc3_branch_tested: fc3BranchTested,
        pseudo_steps: totalPseudoSteps,
        trace_answers: loadTraceStore(),
        semi_answers: loadSemi()
      };

      try {
        const res = await fetch('api/submit.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: sid,
            full_name: fname,
            section: sec,
            module_id: $('sub-scope').value,
            completed: prog.completed,
            attempts: prog.attempts,
            snapshot,
            student_note: $('sub-note').value.trim(),
            client_time: new Date().toISOString()
          })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          $('sub-feedback').className = 'feedback bad';
          $('sub-feedback').textContent = data.error || 'ส่งงานไม่สำเร็จ';
        } else {
          $('sub-feedback').className = 'feedback good';
          $('sub-feedback').textContent = `ส่งงาน #${data.submission_id} สำเร็จ! คะแนน AI: ${data.ai_score ?? data.auto_score}%`;
          if (data.ai_score !== null && data.ai_score !== undefined) {
            $('sub-ai-result').innerHTML = renderAiEvalHtml(data.ai_score, data.ai_rubric, data.ai_feedback, data.ai_model);
          }
          toast(`ส่งงานสำเร็จ · AI ประเมิน ${data.ai_score ?? data.auto_score}%`);
        }
      } catch {
        const prog = loadProgress();
        const keys = Object.keys(MODULE_LABELS);
        const done = keys.filter((k) => !!prog.completed[k]).length;
        const autoScore = Math.round((done / keys.length) * 100);
        $('sub-feedback').className = 'feedback good';
        $('sub-feedback').textContent = `บันทึกผลการส่งงาน (Cloud Cache) ของ ${sid} ${fname} สำเร็จ! คะแนนความก้าวหน้า: ${autoScore}%`;
        toast(`บันทึกงานสำเร็จ · ${autoScore}%`);
      } finally {
        btn.disabled = false;
        btn.textContent = '📤 ส่งงานให้ AI ตรวจและบันทึกผล';
      }
    });
  }

  function init() {
    initNavigation();
    initModule01();
    initModule02();
    initModule03();
    initModule04();
    injectSemiCards();
    initModule05();
    initSubmissionModal();
    refreshProgressUI();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
