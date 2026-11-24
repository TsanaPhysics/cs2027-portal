/**
 * CT-Lab v4.0 — Student Submission & Grading Status Client
 * เชื่อมต่อกับ api/submit.php (XAMPP PHP + MySQL)
 */
(function () {
  const PROFILE_KEY = 'ctlab-student-profile-v1';
  const PROGRESS_KEY = 'ctlab-progress-v1';

  const MODULE_LABELS = {
    survival: '01 สถานการณ์ชวนคิด',
    books: '02 แนะนำหนังสือ',
    house: '03 บ้านตามพิกัด',
    routes: '04 ไปให้ครบทุกที่',
    gcd: '05 หา ห.ร.ม.',
    decomposition: '06 การย่อยปัญหา',
    searching: '07 การค้นหาข้อมูล',
    algorithms: '08 ออกแบบขั้นตอนวิธี',
    flowcharts: '09 เกมเรียงผังงาน'
  };

  const DISPLAY_LABELS = Object.assign({}, MODULE_LABELS, {
    challenge: '10 แบบฝึกหัดภาพประกอบ',
    challenge10: '10 แบบฝึกหัดภาพประกอบ'
  });

  function getEl(id) {
    return document.getElementById(id);
  }

  function loadProfile() {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveProfile(profile) {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {}
  }

  function loadProgressState() {
    try {
      const prof = loadProfile();
      const key = prof.student_id ? `${PROGRESS_KEY}-${prof.student_id}` : PROGRESS_KEY;
      const p = JSON.parse(localStorage.getItem(key) || '{}');
      return {
        completed: p.completed || {},
        attempts: p.attempts || {},
        last: p.last || {}
      };
    } catch {
      return { completed: {}, attempts: {}, last: {} };
    }
  }

  function updateSidebarStudentBadge() {
    const box = document.querySelector('.side-progress');
    if (!box) return;
    let badge = getEl('side-student-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'side-student-badge';
      badge.style.cssText = 'font-size:11px;color:#8ef1d5;margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      box.insertBefore(badge, box.firstChild);
    }
    const prof = loadProfile();
    badge.textContent = prof.student_id ? `👤 ${prof.student_id} · ${prof.full_name}` : '👤 ยังไม่ได้ระบุตัวตนผู้เรียน';
  }

  function getActiveModuleId() {
    const activePage = document.querySelector('.page.active');
    const target = activePage ? activePage.getAttribute('data-page') : 'overview';
    return MODULE_LABELS[target] ? target : 'all';
  }

  function renderSummaryPills() {
    const prog = loadProgressState();
    const keys = Object.keys(MODULE_LABELS);
    const doneCount = keys.filter((k) => !!prog.completed[k]).length;

    const countEl = getEl('sub-progress-count');
    if (countEl) {
      countEl.textContent = `สำเร็จ ${doneCount} / ${keys.length} กิจกรรม (${Math.round((doneCount / keys.length) * 100)}%)`;
    }

    const pillsEl = getEl('sub-module-pills');
    if (!pillsEl) return;
    pillsEl.replaceChildren();
    keys.forEach((k) => {
      const span = document.createElement('span');
      const isDone = !!prog.completed[k];
      span.className = 'submit-pill' + (isDone ? ' done' : '');
      span.textContent = (isDone ? '✓ ' : '') + MODULE_LABELS[k];
      pillsEl.appendChild(span);
    });
  }

  function collectSnapshot() {
    let subjective = {};
    let semi = {};
    try {
      subjective = JSON.parse(localStorage.getItem('ctlab-subjective-v1') || '{}');
    } catch {}
    try {
      const prof = loadProfile();
      const semiKey = prof.student_id ? `ctlab-semi-v1-${prof.student_id}` : 'ctlab-semi-v1';
      semi = JSON.parse(localStorage.getItem(semiKey) || '{}');
    } catch {}
    const snap = {
      active_page: document.querySelector('.page.active')?.getAttribute('data-page') || 'overview',
      house_code: getEl('house-code')?.value || '',
      gcd_inputs: [getEl('gcd-a')?.value || '', getEl('gcd-b')?.value || ''],
      subjective_answers: subjective,
      semi_answers: semi
    };
    return snap;
  }

  function setStatusBox(msg, type) {
    const box = getEl('sub-feedback');
    if (!box) return;
    box.className = 'feedback ' + (type || '');
    box.textContent = msg;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function statusLabel(st) {
    if (st === 'graded') return { text: 'ตรวจแล้ว', cls: 'badge-graded' };
    if (st === 'resubmit') return { text: 'ส่งแก้ไข', cls: 'badge-resubmit' };
    return { text: 'รออาจารย์ตรวจ', cls: 'badge-submitted' };
  }

  function renderAiEvalHtml(aiScore, aiRubric, aiFeedback, aiModel) {
    if (aiScore === null || aiScore === undefined) return '';
    const num = Number(aiScore);
    const tierCls = num >= 80 ? 'score-high' : (num >= 50 ? 'score-mid' : 'score-low');
    let barsHtml = '';
    if (aiRubric && typeof aiRubric.simulation === 'number' && typeof aiRubric.sequencing === 'number' && typeof aiRubric.subjective === 'number') {
      const simPct = Math.min(100, Math.round((aiRubric.simulation / 40) * 100));
      const seqPct = Math.min(100, Math.round((aiRubric.sequencing / 35) * 100));
      const subjPct = Math.min(100, Math.round((aiRubric.subjective / 25) * 100));
      barsHtml = `
        <div class="ai-rubric-bars">
          <div class="ai-bar-row">
            <div class="ai-bar-label"><span>ห้องจำลอง</span><span>${aiRubric.simulation}/40</span></div>
            <div class="ai-bar-track"><div class="ai-bar-fill" style="width:${simPct}%"></div></div>
          </div>
          <div class="ai-bar-row">
            <div class="ai-bar-label"><span>จัดลำดับบล็อก</span><span>${aiRubric.sequencing}/35</span></div>
            <div class="ai-bar-track"><div class="ai-bar-fill" style="width:${seqPct}%"></div></div>
          </div>
          <div class="ai-bar-row">
            <div class="ai-bar-label"><span>เหตุผลอัตนัย</span><span>${aiRubric.subjective}/25</span></div>
            <div class="ai-bar-track"><div class="ai-bar-fill" style="width:${subjPct}%"></div></div>
          </div>
        </div>
      `;
    }
    return `
      <div class="ai-eval-card">
        <div class="ai-eval-head">
          <div class="ai-eval-title">🤖 ผลการตรวจประเมินด้วย AI ${aiModel ? `<span class="ai-pill-badge">${escapeHtml(aiModel)}</span>` : ''}</div>
          <span class="ai-pill-badge ${tierCls}">คะแนน AI: ${num.toFixed(1)}%</span>
        </div>
        ${barsHtml}
        ${aiFeedback ? `<pre class="ai-feedback-pre">${escapeHtml(aiFeedback)}</pre>` : ''}
      </div>
    `;
  }

  async function loadHistory() {
    const listEl = getEl('sub-history-list');
    const studentId = (getEl('sub-student-id')?.value || '').trim();
    if (!listEl) return;

    if (!studentId) {
      listEl.innerHTML = '<div class="empty-state">กรุณากรอกรหัสนักศึกษาในแท็บ "ส่งงาน" ก่อน เพื่อดูประวัติการส่งงาน</div>';
      return;
    }

    if (location.protocol === 'file:') {
      listEl.innerHTML = '<div class="empty-state">โหมดไฟล์ออฟไลน์ (file://) ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาเปิดผ่าน http://localhost/CT_Lab_v4_Web/</div>';
      return;
    }

    listEl.innerHTML = '<div class="empty-state">กำลังโหลดข้อมูล...</div>';
    try {
      const res = await fetch(`api/submit.php?student_id=${encodeURIComponent(studentId)}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        listEl.innerHTML = `<div class="empty-state">${escapeHtml(data.error || 'โหลดข้อมูลไม่สำเร็จ')}</div>`;
        return;
      }
      if (!data.submissions || data.submissions.length === 0) {
        listEl.innerHTML = '<div class="empty-state">ยังไม่มีประวัติการส่งงานสำหรับรหัสนักศึกษานี้</div>';
        return;
      }

      listEl.replaceChildren();
      data.submissions.forEach((item) => {
        const badge = statusLabel(item.status);
        const modLabel = item.module_id === 'all' ? 'ภาพรวมทั้งหมด (9 กิจกรรม)' : (DISPLAY_LABELS[item.module_id] || item.module_id);
        let rub = item.ai_rubric || null;
        if (!rub && item.ai_rubric_json) {
          try { rub = JSON.parse(item.ai_rubric_json); } catch {}
        }
        const isChallenge = item.module_id === 'challenge10' || item.module_id === 'challenge';
        const showTeacherFb = item.teacher_feedback && item.teacher_feedback !== item.ai_feedback;
        const aiHtml = (!isChallenge && item.ai_score !== null && item.ai_score !== undefined)
          ? renderAiEvalHtml(item.ai_score, rub, item.ai_feedback, item.ai_model)
          : (isChallenge && item.ai_score !== null && item.ai_score !== undefined
            ? `<div class="ai-eval-card"><div class="ai-eval-head"><div class="ai-eval-title">🤖 AI ประเมินผลกิจกรรมที่ 10</div><span class="ai-pill-badge">คะแนนรวม: ${Number(item.ai_score).toFixed(1)}%</span></div></div>`
            : '');
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
          <div class="history-card-top">
            <strong>#${item.id} · ${escapeHtml(modLabel)}</strong>
            <span class="badge ${badge.cls}">${badge.text}</span>
          </div>
          <div class="history-meta">
            <span>ผ่าน: <b>${item.completed_count}/${item.total_modules}</b></span>
            <span>คะแนนระบบ: <b>${item.auto_score}</b></span>
            <span>คะแนน AI: <b>${item.ai_score !== null && item.ai_score !== undefined ? item.ai_score : '—'}</b></span>
            <span>คะแนนอาจารย์: <b>${item.teacher_score !== null ? item.teacher_score : '—'}</b></span>
            <span>ส่งเมื่อ: ${escapeHtml(item.submitted_at)}</span>
          </div>
          ${item.student_note ? `<div class="history-meta" style="margin-top:6px"><span>บันทึกของฉัน: ${escapeHtml(item.student_note)}</span></div>` : ''}
          ${aiHtml}
          ${showTeacherFb ? `<div class="history-feedback"><b>ข้อเสนอแนะเพิ่มเติมจากอาจารย์:</b> ${escapeHtml(item.teacher_feedback)}</div>` : ''}
        `;
        listEl.appendChild(card);
      });
    } catch {
      listEl.innerHTML = '<div class="empty-state">ไม่สามารถเชื่อมต่อ api/submit.php ได้ (กรุณาตรวจสอบว่าเปิด Apache และ MySQL ใน XAMPP แล้ว)</div>';
    }
  }

  let rosterList = [];
  let rosterMap = new Map();

  const CS2027_DEFAULT_ROSTER = [
    { student_id: '6614611001', full_name: 'นางสาวกนกวรรณพึ่งฉ่ำ', section: '661/วิทย์' },
    { student_id: '6614611002', full_name: 'นางสาวกาญจน์สณีทรงศรี', section: '661/วิทย์' },
    { student_id: '6614611003', full_name: 'นางสาวกิติยาแสงทอง', section: '661/วิทย์' },
    { student_id: '6614611004', full_name: 'นางสาวชุลีขวัญคนขยัน', section: '661/วิทย์' },
    { student_id: '6614611005', full_name: 'นางสาวณัฐณิชานาคาพยัคฆ์', section: '661/วิทย์' },
    { student_id: '6614611006', full_name: 'นางสาวณัฐวรรณคำกอก', section: '661/วิทย์' },
    { student_id: '6614611007', full_name: 'นางสาวเณศราโพธิ์นิล', section: '661/วิทย์' },
    { student_id: '6614611009', full_name: 'นางสาวธันยธรณ์หมั่นกู้', section: '661/วิทย์' },
    { student_id: '6614611010', full_name: 'นางสาวธิชานันท์นนเทศา', section: '661/วิทย์' },
    { student_id: '6614611011', full_name: 'นางสาวนภัสนาวงศ์จันทร์', section: '661/วิทย์' },
    { student_id: '6614611012', full_name: 'นางสาวพรทิพย์บรรณสาร', section: '661/วิทย์' },
    { student_id: '6614611013', full_name: 'นางสาวพัชราพรมจีน', section: '661/วิทย์' },
    { student_id: '6614611014', full_name: 'นางสาวภัทริดาเจ๊ะมัด', section: '661/วิทย์' },
    { student_id: '6614611015', full_name: 'นายมนตรีจันทร์เทศ', section: '661/วิทย์' },
    { student_id: '6614611018', full_name: 'นายอชิระสราภิรมย์', section: '661/วิทย์' },
    { student_id: '6614611019', full_name: 'นายอุดมชัยบุตรอุดม', section: '661/วิทย์' },
    { student_id: '6614611021', full_name: 'นางสาวจิฬาภรณ์อภิบาลศรี', section: '661/วิทย์' },
    { student_id: '6614611024', full_name: 'นายมงคลศรีสมบัติ', section: '661/วิทย์' },
    { student_id: '6614611025', full_name: 'นางสาววาสินีสุวรรณา', section: '661/วิทย์' },
    { student_id: '6614611029', full_name: 'นางสาวรัตมณีเถาวัลณีย์', section: '661/วิทย์' },
    { student_id: '6614901002', full_name: 'นางสาวมุกดาหนองน้ำเย็น', section: '661/ฟิสิกส์' },
    { student_id: '6614901003', full_name: 'นางสาววิดาพรธนะปฐมชัย', section: '661/ฟิสิกส์' },
    { student_id: '6614901004', full_name: 'นายวุฒิชัยเจริญวงศ์', section: '661/ฟิสิกส์' },
    { student_id: '6614901006', full_name: 'นายนวพลแสงพระจันทร์', section: '661/ฟิสิกส์' },
    { student_id: '6614901008', full_name: 'นางสาวอุไรพรเต็กใจตรง', section: '661/ฟิสิกส์' },
    { student_id: 'TEACHER01', full_name: 'อาจารย์ชีวะ (ทดสอบระบบ)', section: 'อาจารย์/ทดสอบ' }
  ];

  function mergeWithDefaultRoster(students) {
    const map = new Map();
    (Array.isArray(students) ? students : []).forEach((s) => {
      if (s && s.student_id) map.set(String(s.student_id), s);
    });
    CS2027_DEFAULT_ROSTER.forEach((def) => {
      if (!map.has(def.student_id)) map.set(def.student_id, def);
    });
    return Array.from(map.values());
  }

  function applySelectedStudent(student) {
    const idEl = getEl('sub-student-id');
    const nameEl = getEl('sub-full-name');
    const secEl = getEl('sub-section');
    const card = getEl('sub-selected-card');

    if (!student) {
      if (idEl) idEl.value = '';
      if (nameEl) nameEl.value = '';
      if (secEl) secEl.value = '';
      if (card) card.hidden = true;
      return;
    }

    if (idEl) idEl.value = student.student_id;
    if (nameEl) nameEl.value = student.full_name;
    if (secEl) secEl.value = student.section;
    if (card) {
      getEl('sub-selected-name').textContent = student.full_name;
      getEl('sub-selected-id').textContent = student.student_id;
      getEl('sub-selected-sec').textContent = student.section;
      card.hidden = false;
    }
  }

  function populateStudentsForSection(section, preselectId) {
    const stuSel = getEl('sub-student-select');
    if (!stuSel) return;

    stuSel.replaceChildren();
    if (!section) {
      stuSel.disabled = true;
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '-- กรุณาเลือกสาขาก่อน --';
      stuSel.appendChild(opt);
      applySelectedStudent(null);
      return;
    }

    const filtered = rosterList.filter((s) => s.section === section);
    stuSel.disabled = false;
    const defOpt = document.createElement('option');
    defOpt.value = '';
    defOpt.textContent = `-- เลือกชื่อนักศึกษา (${filtered.length} คน) --`;
    stuSel.appendChild(defOpt);

    filtered.forEach((st) => {
      const opt = document.createElement('option');
      opt.value = st.student_id;
      opt.textContent = `${st.student_id} — ${st.full_name}`;
      stuSel.appendChild(opt);
    });

    if (preselectId && rosterMap.has(preselectId) && rosterMap.get(preselectId).section === section) {
      stuSel.value = preselectId;
      applySelectedStudent(rosterMap.get(preselectId));
    } else {
      stuSel.value = '';
      applySelectedStudent(null);
    }
  }

  async function loadRosterForSelect() {
    if (rosterList.length > 0) return;
    const secSel = getEl('sub-section-select');
    if (!secSel) return;

    try {
      let data = null;
      try {
        const res = await fetch('api/submit.php?action=roster');
        data = await res.json();
      } catch (_) {
        try {
          const resFb = await fetch('../data/cs2027_students.json');
          data = await resFb.json();
        } catch (_2) {
          data = { ok: true, students: CS2027_DEFAULT_ROSTER };
        }
      }
      const rawStudents = (data && Array.isArray(data.students)) ? data.students : CS2027_DEFAULT_ROSTER;
      rosterList = mergeWithDefaultRoster(rawStudents);
      rosterMap = new Map();
      const secCounts = new Map();
      rosterList.forEach((st) => {
        rosterMap.set(st.student_id, st);
        const sec = st.section || 'อื่นๆ';
        secCounts.set(sec, (secCounts.get(sec) || 0) + 1);
      });

      secSel.replaceChildren();
      const defOpt = document.createElement('option');
      defOpt.value = '';
      defOpt.textContent = '-- กรุณาเลือกสาขา / กลุ่มเรียน --';
      secSel.appendChild(defOpt);

      Array.from(secCounts.keys()).forEach((sec) => {
        const opt = document.createElement('option');
        opt.value = sec;
        opt.textContent = `${sec} (${secCounts.get(sec)} คน)`;
        secSel.appendChild(opt);
      });

      const prof = loadProfile();
      if (prof.section && secCounts.has(prof.section)) {
        secSel.value = prof.section;
        populateStudentsForSection(prof.section, prof.student_id || '');
      }
    } catch {}
  }

  function init() {
    const dialog = getEl('submit-dialog');
    const openBtn = getEl('open-submit-modal');
    if (!dialog || !openBtn) return;

    getEl('sub-section-select')?.addEventListener('change', (e) => {
      populateStudentsForSection(e.target.value, '');
    });

    getEl('sub-student-select')?.addEventListener('change', (e) => {
      const st = rosterMap.get(e.target.value) || null;
      applySelectedStudent(st);
      if (st) {
        saveProfile({ student_id: st.student_id, full_name: st.full_name, section: st.section });
        if (typeof window.reloadStudentProgress === 'function') window.reloadStudentProgress();
        if (typeof window.reloadSemiAnswers === 'function') window.reloadSemiAnswers();
        renderSummaryPills();
        updateSidebarStudentBadge();
      }
    });

    updateSidebarStudentBadge();

    openBtn.addEventListener('click', () => {
      openSubmitModal('all');
    });

    function openSubmitModal(scope) {
      renderSummaryPills();
      loadRosterForSelect();
      const scopeSel = getEl('sub-scope');
      if (scopeSel && scope) {
        scopeSel.value = scope;
      }
      // สลับไปแท็บส่งงานเสมอเมื่อเปิดจากปุ่มส่งงาน
      document.querySelectorAll('[data-sub-tab]').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-sub-tab') === 'form');
      });
      if (getEl('sub-pane-form')) getEl('sub-pane-form').hidden = false;
      if (getEl('sub-pane-history')) getEl('sub-pane-history').hidden = true;
      const noteEl = getEl('sub-note');
      if (noteEl && scope && scope !== 'all') {
        try {
          const prof = loadProfile();
          const semiKey = prof.student_id ? `ctlab-semi-v1-${prof.student_id}` : 'ctlab-semi-v1';
          const semi = JSON.parse(localStorage.getItem(semiKey) || '{}');
          if (semi[scope] && semi[scope].note) {
            noteEl.value = semi[scope].note;
          } else {
            const subj = JSON.parse(localStorage.getItem('ctlab-subjective-v1') || '{}');
            if (subj[scope]) noteEl.value = subj[scope];
          }
        } catch {}
      }
      setStatusBox('', '');
      const aiResEl = getEl('sub-ai-result');
      if (aiResEl) aiResEl.innerHTML = '';
      dialog.showModal();
    }

    window.openSubmitForModule = function (modKey) {
      openSubmitModal(modKey || 'all');
    };

    getEl('sub-close-btn')?.addEventListener('click', () => dialog.close());

    // Tabs
    document.querySelectorAll('[data-sub-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-sub-tab');
        document.querySelectorAll('[data-sub-tab]').forEach((b) => b.classList.toggle('active', b === btn));
        getEl('sub-pane-form').hidden = tab !== 'form';
        getEl('sub-pane-history').hidden = tab !== 'history';
        if (tab === 'history') {
          loadHistory();
        }
      });
    });

    getEl('sub-refresh-history')?.addEventListener('click', loadHistory);

    getEl('sub-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (location.protocol === 'file:') {
        setStatusBox('ขณะนี้เปิดไฟล์แบบออฟไลน์ (file://) กรุณาเปิดผ่าน XAMPP (http://localhost/CT_Lab_v4_Web/) เพื่อส่งงานลงฐานข้อมูล', 'bad');
        return;
      }

      const studentId = getEl('sub-student-id').value.trim();
      const fullName = getEl('sub-full-name').value.trim();
      const section = getEl('sub-section').value.trim();
      const moduleId = getEl('sub-scope').value;
      const studentNote = getEl('sub-note').value.trim();

      if (!studentId || !fullName) {
        setStatusBox('กรุณากรอกรหัสนักศึกษาและชื่อ-นามสกุลให้ครบถ้วน', 'bad');
        return;
      }

      saveProfile({ student_id: studentId, full_name: fullName, section });

      const prog = loadProgressState();
      const submitBtn = getEl('sub-submit-btn');
      let aiResEl = getEl('sub-ai-result');
      if (!aiResEl) {
        const fbNode = getEl('sub-feedback');
        if (fbNode && fbNode.parentNode) {
          aiResEl = document.createElement('div');
          aiResEl.id = 'sub-ai-result';
          fbNode.parentNode.insertBefore(aiResEl, fbNode.nextSibling);
        }
      }
      if (aiResEl) aiResEl.innerHTML = '';

      submitBtn.disabled = true;
      submitBtn.textContent = 'กำลังบันทึกและให้ AI ตรวจงาน...';
      setStatusBox('', '');

      try {
        const res = await fetch('api/submit.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            full_name: fullName,
            section,
            module_id: moduleId,
            completed: prog.completed,
            attempts: prog.attempts,
            snapshot: collectSnapshot(),
            student_note: studentNote,
            client_time: new Date().toISOString()
          })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setStatusBox(data.error || 'เกิดข้อผิดพลาดในการส่งงาน', 'bad');
        } else {
          const aiTxt = (data.ai_score !== null && data.ai_score !== undefined)
            ? ` · คะแนน AI: ${data.ai_score}% (${data.status === 'graded' ? 'ตรวจแล้วอัตโนมัติ' : (data.status === 'resubmit' ? 'แนะนำแก้ไขเพิ่ม' : 'รออาจารย์ยืนยัน')})`
            : '';
          setStatusBox(
            `ส่งงานสำเร็จ! รหัสส่งงาน #${data.submission_id} · ผ่าน ${data.completed_count}/${data.total_modules} กิจกรรม (คะแนนระบบ ${data.auto_score}%)${aiTxt}`,
            'good'
          );
          if (aiResEl && data.ai_score !== null && data.ai_score !== undefined) {
            aiResEl.innerHTML = renderAiEvalHtml(data.ai_score, data.ai_rubric, data.ai_feedback, data.ai_model);
          }
          if (typeof window.toast === 'function') {
            window.toast(data.ai_score !== null && data.ai_score !== undefined ? `ส่งงานสำเร็จ · AI ประเมิน ${data.ai_score}%` : 'ส่งงานลงฐานข้อมูลสำเร็จ');
          }
        }
      } catch {
        setStatusBox('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ XAMPP / MySQL ได้ กรุณาตรวจสอบว่าเปิด Apache และ MySQL แล้ว', 'bad');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '📤 ส่งงานบันทึกลงฐานข้อมูล';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
