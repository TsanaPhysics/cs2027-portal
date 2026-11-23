/**
 * CT-Lab v4.0 — Module 10: กิจกรรมท้าทายพร้อมภาพประกอบ (Illustrated Challenge)
 * เฉลยถูกเก็บไว้ที่ฝั่ง Server (api/challenge.php) เท่านั้น นักศึกษาไม่สามารถดูเฉลยได้
 */
(function () {
  const PROFILE_KEY = 'ctlab-student-profile-v1';

  // ภาพประกอบ SVG สำหรับทั้ง 5 ข้อ (คมชัดทุกขนาดจอ รวมถึง iPad และสมาร์ทโฟน)
  const ILLUSTRATIONS = {
    q1: `<svg viewBox="0 0 640 230" role="img" aria-label="ภาพประกอบระบบโรงเรือนอัจฉริยะ">
      <defs>
        <linearGradient id="gh-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e3f3ff"/><stop offset="100%" stop-color="#f5fbff"/></linearGradient>
      </defs>
      <rect width="640" height="230" rx="14" fill="url(#gh-sky)"/>
      <rect x="0" y="182" width="640" height="48" fill="#cde8d4"/>
      <polygon points="80,95 230,36 380,95" fill="#d9eefc" stroke="#4a89c8" stroke-width="3"/>
      <rect x="92" y="95" width="276" height="90" fill="#ffffff" fill-opacity="0.78" stroke="#4a89c8" stroke-width="3"/>
      <g fill="#2b9b66">
        <ellipse cx="150" cy="162" rx="22" ry="12"/><rect x="147" y="162" width="6" height="20" fill="#6b4f3a"/>
        <ellipse cx="230" cy="158" rx="24" ry="14"/><rect x="227" y="158" width="6" height="24" fill="#6b4f3a"/>
        <ellipse cx="310" cy="162" rx="22" ry="12"/><rect x="307" y="162" width="6" height="20" fill="#6b4f3a"/>
      </g>
      <rect x="142" y="176" width="16" height="18" rx="3" fill="#e67e22"/>
      <text x="150" y="142" text-anchor="middle" font-size="11" font-weight="700" fill="#1d4d73">เซนเซอร์ความชื้น</text>
      <rect x="430" y="54" width="165" height="62" rx="10" fill="#132d4c"/>
      <text x="512" y="80" text-anchor="middle" font-size="13" font-weight="800" fill="#7ff3d3">บอร์ดควบคุม (MCU)</text>
      <text x="512" y="100" text-anchor="middle" font-size="11" fill="#c3dcf7">อ่านค่า → ตัดสินใจ → สั่งงาน</text>
      <rect x="445" y="145" width="135" height="42" rx="8" fill="#2563eb"/>
      <text x="512" y="171" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">💧 ปั๊มน้ำอัตโนมัติ</text>
      <path d="M158 185 L430 92" stroke="#e67e22" stroke-width="2.5" stroke-dasharray="5,4" fill="none"/>
      <path d="M512 116 L512 145" stroke="#2563eb" stroke-width="3" fill="none"/>
      <path d="M445 166 L368 122" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="4,4" fill="none"/>
    </svg>`,

    q2: `<svg viewBox="0 0 640 230" role="img" aria-label="กราฟอุณหภูมิรายชั่วโมง">
      <rect width="640" height="230" rx="14" fill="#f7faff"/>
      <g stroke="#dce6f2" stroke-width="1">
        <line x1="70" y1="45" x2="590" y2="45"/><line x1="70" y1="85" x2="590" y2="85"/>
        <line x1="70" y1="125" x2="590" y2="125"/><line x1="70" y1="165" x2="590" y2="165"/>
      </g>
      <line x1="70" y1="30" x2="70" y2="180" stroke="#7c90a8" stroke-width="2"/>
      <line x1="70" y1="180" x2="590" y2="180" stroke="#7c90a8" stroke-width="2"/>
      <polyline points="120,145 260,55 400,115" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/>
      <line x1="400" y1="115" x2="540" y2="148" stroke="#94a3b8" stroke-width="3" stroke-dasharray="6,6"/>
      <circle cx="120" cy="145" r="7" fill="#2563eb"/><text x="120" y="132" text-anchor="middle" font-size="12" font-weight="800" fill="#1e3a5f">24°C</text>
      <circle cx="260" cy="55" r="7" fill="#ef4444"/><text x="260" y="42" text-anchor="middle" font-size="12" font-weight="800" fill="#b91c1c">34°C</text>
      <circle cx="400" cy="115" r="7" fill="#f59e0b"/><text x="400" y="102" text-anchor="middle" font-size="12" font-weight="800" fill="#b45309">28°C</text>
      <circle cx="540" cy="148" r="14" fill="#eef4ff" stroke="#2563eb" stroke-width="2.5" stroke-dasharray="4,3"/>
      <text x="540" y="153" text-anchor="middle" font-size="15" font-weight="900" fill="#2563eb">?</text>
      <g font-size="12" font-weight="700" fill="#475569" text-anchor="middle">
        <text x="120" y="202">06:00 (เช้า)</text><text x="260" y="202">12:00 (เที่ยง)</text>
        <text x="400" y="202">18:00 (เย็น)</text><text x="540" y="202">24:00 (เที่ยงคืน)</text>
      </g>
    </svg>`,

    q3: `<svg viewBox="0 0 640 230" role="img" aria-label="การคิดเชิงนามธรรมจากแผนที่สู่กราฟ">
      <rect width="640" height="230" rx="14" fill="#f8fafc"/>
      <rect x="20" y="18" width="275" height="194" rx="12" fill="#e8f5e9" stroke="#bfe0c6"/>
      <text x="157" y="40" text-anchor="middle" font-size="12" font-weight="800" fill="#1f6b43">แผนที่จริง (รายละเอียดเยอะ)</text>
      <path d="M55 155 Q130 95 255 85" stroke="#cbd5e1" stroke-width="14" fill="none" stroke-linecap="round"/>
      <circle cx="95" cy="80" r="16" fill="#4ade80"/><circle cx="215" cy="155" r="18" fill="#4ade80"/>
      <rect x="135" y="135" width="38" height="28" rx="4" fill="#fca5a5"/><text x="154" y="153" text-anchor="middle" font-size="10" font-weight="700" fill="#7f1d1d">☕ ร้าน</text>
      <text x="55" y="160" font-size="13" font-weight="900" fill="#1e293b">A</text>
      <text x="255" y="88" font-size="13" font-weight="900" fill="#1e293b">D</text>
      <text x="320" y="120" text-anchor="middle" font-size="24" font-weight="900" fill="#2563eb">→</text>
      <rect x="345" y="18" width="275" height="194" rx="12" fill="#eef4ff" stroke="#c7dbfb"/>
      <text x="482" y="40" text-anchor="middle" font-size="12" font-weight="800" fill="#1e40af">กราฟโหนด (Abstraction)</text>
      <line x1="390" y1="150" x2="480" y2="85" stroke="#3b82f6" stroke-width="3"/>
      <line x1="480" y1="85" x2="575" y2="115" stroke="#3b82f6" stroke-width="3"/>
      <line x1="390" y1="150" x2="575" y2="115" stroke="#93c5fd" stroke-width="2" stroke-dasharray="5,4"/>
      <text x="425" y="108" font-size="11" font-weight="800" fill="#1d4ed8">4 km</text>
      <text x="535" y="92" font-size="11" font-weight="800" fill="#1d4ed8">3 km</text>
      <text x="485" y="152" font-size="11" font-weight="700" fill="#64748b">9 km</text>
      <circle cx="390" cy="150" r="16" fill="#2563eb"/><text x="390" y="155" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">A</text>
      <circle cx="480" cy="85" r="16" fill="#2563eb"/><text x="480" y="90" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">B</text>
      <circle cx="575" cy="115" r="16" fill="#10b981"/><text x="575" y="120" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">D</text>
    </svg>`,

    q4: `<svg viewBox="0 0 640 230" role="img" aria-label="ผังงานคัดแยกผลไม้ตามน้ำหนัก">
      <rect width="640" height="230" rx="14" fill="#f8fafc"/>
      <rect x="235" y="14" width="170" height="36" rx="18" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
      <text x="320" y="37" text-anchor="middle" font-size="12" font-weight="800" fill="#1e3a8a">รับน้ำหนักผลไม้ (W)</text>
      <line x1="320" y1="50" x2="320" y2="70" stroke="#475569" stroke-width="2"/>
      <polygon points="320,70 435,112 320,154 205,112" fill="#fef3c7" stroke="#d97706" stroke-width="2.5"/>
      <text x="320" y="116" text-anchor="middle" font-size="12" font-weight="800" fill="#92400e">W >= 250 กรัม ?</text>
      <line x1="205" y1="112" x2="120" y2="112" stroke="#16a34a" stroke-width="2.5"/>
      <line x1="120" y1="112" x2="120" y2="165" stroke="#16a34a" stroke-width="2.5"/>
      <text x="160" y="104" text-anchor="middle" font-size="11" font-weight="800" fill="#15803d">ใช่ (True)</text>
      <rect x="45" y="165" width="150" height="44" rx="8" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
      <text x="120" y="192" text-anchor="middle" font-size="13" font-weight="800" fill="#166534">คัดเป็น เกรด A</text>
      <line x1="435" y1="112" x2="520" y2="112" stroke="#dc2626" stroke-width="2.5"/>
      <line x1="520" y1="112" x2="520" y2="165" stroke="#dc2626" stroke-width="2.5"/>
      <text x="480" y="104" text-anchor="middle" font-size="11" font-weight="800" fill="#b91c1c">ไม่ใช่ (False)</text>
      <rect x="445" y="165" width="150" height="44" rx="8" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
      <text x="520" y="192" text-anchor="middle" font-size="13" font-weight="800" fill="#991b1b">คัดเป็น เกรด B</text>
    </svg>`,

    q5: `<svg viewBox="0 0 640 230" role="img" aria-label="วงจรตรรกะ AND ระบบเตือนภัยน้ำท่วม">
      <rect width="640" height="230" rx="14" fill="#f0f9ff"/>
      <rect x="40" y="42" width="185" height="52" rx="10" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
      <text x="132" y="65" text-anchor="middle" font-size="12" font-weight="800" fill="#166534">A: เซนเซอร์ระดับน้ำ</text>
      <text x="132" y="83" text-anchor="middle" font-size="11" font-weight="700" fill="#15803d">สถานะ: จริง (True)</text>
      <rect x="40" y="132" width="185" height="52" rx="10" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
      <text x="132" y="155" text-anchor="middle" font-size="12" font-weight="800" fill="#991b1b">B: เซนเซอร์ฝนตกหนัก</text>
      <text x="132" y="173" text-anchor="middle" font-size="11" font-weight="700" fill="#b91c1c">สถานะ: เท็จ (False)</text>
      <line x1="225" y1="68" x2="310" y2="95" stroke="#16a34a" stroke-width="3"/>
      <line x1="225" y1="158" x2="310" y2="131" stroke="#dc2626" stroke-width="3"/>
      <path d="M310,72 H355 A42,42 0 0,1 355,156 H310 Z" fill="#1e3a8a" stroke="#1d4ed8" stroke-width="2"/>
      <text x="348" y="119" text-anchor="middle" font-size="14" font-weight="900" fill="#fff">AND</text>
      <line x1="397" y1="114" x2="465" y2="114" stroke="#475569" stroke-width="3"/>
      <rect x="465" y="84" width="140" height="60" rx="12" fill="#fff" stroke="#64748b" stroke-width="2"/>
      <text x="535" y="111" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">🚨 สัญญาณเตือน</text>
      <text x="535" y="130" text-anchor="middle" font-size="12" font-weight="800" fill="#2563eb">ผลลัพธ์ = ?</text>
    </svg>`
  };

  function el(id) {
    return document.getElementById(id);
  }

  function loadProfile() {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveProfile(p) {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    } catch {}
  }

  let rosterList = [];
  let rosterMap = new Map();

  function populateStudents(sec, preId) {
    const stuSel = el('ch-student-select');
    if (!stuSel) return;
    stuSel.replaceChildren();
    if (!sec) {
      stuSel.disabled = true;
      const o = document.createElement('option');
      o.value = '';
      o.textContent = '-- กรุณาเลือกสาขาก่อน --';
      stuSel.appendChild(o);
      return;
    }
    const list = rosterList.filter((s) => s.section === sec);
    stuSel.disabled = false;
    const def = document.createElement('option');
    def.value = '';
    def.textContent = `-- เลือกชื่อนักศึกษา (${list.length} คน) --`;
    stuSel.appendChild(def);
    list.forEach((s) => {
      const o = document.createElement('option');
      o.value = s.student_id;
      o.textContent = `${s.student_id} — ${s.full_name}`;
      stuSel.appendChild(o);
    });
    if (preId && rosterMap.has(preId) && rosterMap.get(preId).section === sec) {
      stuSel.value = preId;
    }
  }

  async function initChallenge() {
    const container = el('ch-questions');
    if (!container) return;

    if (location.protocol === 'file:') {
      container.innerHTML = '<div class="empty-state">กิจกรรมนี้ตรวจคำตอบบนเซิร์ฟเวอร์เพื่อไม่ให้เห็นเฉลย กรุณาเปิดผ่านระบบเว็บของมหาวิทยาลัยหรือ XAMPP</div>';
      return;
    }

    try {
      const [qRes, rRes] = await Promise.all([
        fetch('api/challenge.php'),
        fetch('api/submit.php?action=roster')
      ]);
      const qData = await qRes.json();
      const rData = await rRes.json();

      if (rRes.ok && rData.ok && Array.isArray(rData.students)) {
        rosterList = rData.students;
        rosterMap = new Map();
        const secCounts = new Map();
        rosterList.forEach((s) => {
          rosterMap.set(s.student_id, s);
          secCounts.set(s.section, (secCounts.get(s.section) || 0) + 1);
        });
        const secSel = el('ch-section-select');
        if (secSel) {
          secSel.replaceChildren();
          const def = document.createElement('option');
          def.value = '';
          def.textContent = '-- กรุณาเลือกสาขา / กลุ่มเรียน --';
          secSel.appendChild(def);
          Array.from(secCounts.keys()).forEach((sec) => {
            const o = document.createElement('option');
            o.value = sec;
            o.textContent = `${sec} (${secCounts.get(sec)} คน)`;
            secSel.appendChild(o);
          });
          const prof = loadProfile();
          if (prof.section && secCounts.has(prof.section)) {
            secSel.value = prof.section;
            populateStudents(prof.section, prof.student_id || '');
          }
          secSel.addEventListener('change', (e) => populateStudents(e.target.value, ''));
          el('ch-student-select')?.addEventListener('change', (e) => {
            const st = rosterMap.get(e.target.value);
            if (st) {
              saveProfile({ student_id: st.student_id, full_name: st.full_name, section: st.section });
              if (typeof window.reloadStudentProgress === 'function') window.reloadStudentProgress();
              const badge = document.getElementById('side-student-badge');
              if (badge) badge.textContent = `👤 ${st.student_id} · ${st.full_name}`;
            }
          });
        }
      }

      if (!qRes.ok || !qData.ok || !Array.isArray(qData.questions)) {
        container.innerHTML = '<div class="empty-state">ไม่สามารถโหลดโจทย์กิจกรรมได้</div>';
        return;
      }

      container.replaceChildren();
      qData.questions.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'panel ch-card';
        const svgHtml = ILLUSTRATIONS[q.id] || '';
        const optsHtml = Object.entries(q.options)
          .map(([key, text]) => `
            <label class="ch-option">
              <input type="radio" name="ch_${q.id}" value="${key}" required>
              <span class="ch-opt-key">${key}</span>
              <span class="ch-opt-text">${text}</span>
            </label>
          `)
          .join('');
        card.innerHTML = `
          <div class="panel-top">
            <div>
              <span class="eyebrow">ข้อที่ ${idx + 1} · ${q.topic}</span>
              <h3 style="margin-top:4px">${q.question}</h3>
            </div>
            <span class="tag soft">ไม่มีเฉลยฝั่งผู้เรียน</span>
          </div>
          <div class="ch-svg-wrap">${svgHtml}</div>
          <div class="ch-options">${optsHtml}</div>
        `;
        container.appendChild(card);
      });
    } catch {
      container.innerHTML = '<div class="empty-state">ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้</div>';
    }

    el('ch-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const studentId = el('ch-student-select')?.value || '';
      const st = rosterMap.get(studentId);
      const fb = el('ch-feedback');
      const btn = el('ch-submit-btn');

      if (!st) {
        fb.className = 'feedback bad';
        fb.textContent = 'กรุณาเลือกสาขา และชื่อนักศึกษาก่อนส่งคำตอบ';
        return;
      }

      const answers = {};
      ['q1', 'q2', 'q3', 'q4', 'q5'].forEach((qid) => {
        const checked = document.querySelector(`input[name="ch_${qid}"]:checked`);
        if (checked) answers[qid] = checked.value;
      });

      btn.disabled = true;
      btn.textContent = 'กำลังบันทึกคำตอบ...';
      fb.textContent = '';

      try {
        const res = await fetch('api/challenge.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: st.student_id,
            full_name: st.full_name,
            section: st.section,
            answers,
            student_note: el('ch-note')?.value.trim() || ''
          })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          fb.className = 'feedback bad';
          fb.textContent = data.error || 'ส่งคำตอบไม่สำเร็จ';
        } else {
          fb.className = 'feedback good';
          fb.textContent = data.ai_safe_feedback
            ? `${data.message} — ${data.ai_safe_feedback}`
            : data.message;
          if (typeof window.record === 'function') {
            window.record('challenge', true);
          }
          if (typeof window.toast === 'function') {
            window.toast('ส่งคำตอบกิจกรรมที่ 10 สำเร็จ');
          }
        }
      } catch {
        fb.className = 'feedback bad';
        fb.textContent = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
      } finally {
        btn.disabled = false;
        btn.textContent = '📤 ส่งคำตอบให้อาจารย์ตรวจ';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChallenge);
  } else {
    initChallenge();
  }
})();
