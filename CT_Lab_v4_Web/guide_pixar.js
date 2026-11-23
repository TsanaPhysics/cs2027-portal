/**
 * CT-Lab v4.0 — 3D Pixar Card Covers & Step-by-Step "How to Play" Guides
 */
(function () {
  const GUIDE_DATA = {
    survival: {
      img: 'assets/pixar/mod01.jpg',
      title: 'วิธีเล่นกิจกรรม 01: สถานการณ์ชวนคิด',
      steps: [
        'อ่านคำถามสถานการณ์จำลองการพบหมีในป่าทีละขั้น',
        'แตะเลือกตัวเลือกการตัดสินใจที่รอบคอบที่สุดด้านล่างภาพ',
        'ตอบให้ครบทั้ง 4 ขั้น แล้วตรวจสอบบันทึกกระบวนการตัดสินใจ'
      ]
    },
    books: {
      img: 'assets/pixar/mod02.svg',
      title: 'วิธีเล่นกิจกรรม 02: ระบบแนะนำหนังสือ',
      steps: [
        'แตะปุ่มเลข 0 / 1 ในแถว "ฉัน (เป้าหมาย)" เพื่อระบุความสนใจ',
        'สังเกตค่าระยะห่าง (Hamming Distance) ที่เปลี่ยนไปทันที',
        'ดูชื่อหนังสือแนะนำที่มีระยะห่างน้อยที่สุดทางด้านขวา'
      ]
    },
    house: {
      img: 'assets/pixar/mod03.jpg',
      title: 'วิธีเล่นกิจกรรม 03: บ้านตามพิกัด x,y',
      steps: [
        'เปิดสวิตช์ "แสดงเส้นต้นแบบ" เพื่อดูรูปบ้านเป้าหมาย',
        'กด "▶ ทำทั้งหมด" เพื่อรันโค้ด หรือสลับเป็น "วาดด้วยเมาส์/นิ้ว"',
        'กด "✓ ตรวจภาพ" เพื่อตรวจสอบความถูกต้องของรูปบ้าน'
      ]
    },
    routes: {
      img: 'assets/pixar/mod04.svg',
      title: 'วิธีเล่นกิจกรรม 04: ไปให้ครบทุกที่',
      steps: [
        'แตะจุดสถานที่บนแผนที่ทีละจุดเพื่อวางแผนเส้นทาง',
        'เดินให้ครบทุกจุดเป้าหมายและดูระยะทางรวม',
        'กดเปรียบเทียบเส้นทางเพื่อหาเส้นทางที่สั้นที่สุด'
      ]
    },
    gcd: {
      img: 'assets/pixar/mod05.jpg',
      title: 'วิธีเล่นกิจกรรม 05: หา ห.ร.ม.',
      steps: [
        'กรอกตัวเลข 2 จำนวน (หรือแตะปุ่มตัวอย่างโจทย์)',
        'ลองทายค่า ห.ร.ม. แล้วกด "ตรวจคำตอบ" หรือกด "▷ ขั้นถัดไป"',
        'ติดตามตารางหารเอาเศษจนกระทั่งเศษ r = 0'
      ]
    },
    decomposition: {
      img: 'assets/pixar/mod06.svg',
      title: 'วิธีเล่นกิจกรรม 06: การย่อยปัญหา',
      steps: [
        'เลือกแท็บห้องย่อย (จักรยาน, นวัตกรรม, เดินทาง, หลักฐาน, ภารกิจ)',
        'แตะแยกชิ้นส่วนหรือจัดลำดับขั้นตอนย่อยตามโจทย์',
        'ทำกิจกรรมย่อยให้ครบอย่างน้อย 3 ห้องเพื่อผ่านโมดูลนี้'
      ]
    },
    searching: {
      img: 'assets/pixar/mod07.jpg',
      title: 'วิธีเล่นกิจกรรม 07: การค้นหาข้อมูล',
      steps: [
        'เปรียบเทียบการเปิดบัตรแบบ Linear Search และ Binary Search',
        'เลื่อนลงด้านล่างเพื่อเล่นเกมทายตำแหน่ง Binary Search',
        'หาตัวเลขเป้าหมายให้พบโดยใช้จำนวนครั้งน้อยที่สุด'
      ]
    },
    algorithms: {
      img: 'assets/pixar/mod08.svg',
      title: 'วิธีเล่นกิจกรรม 08: การออกแบบขั้นตอนวิธี',
      steps: [
        'ทดลองห้องย่อยทั้ง 4: รดน้ำต้นไม้, หาค่า Min, ตรรกะ, นับสินค้า',
        'ปรับค่าตัวแปรแล้วกดปุ่ม Step / Auto / ตรวจคำตอบ',
        'ทำถูกต้องอย่างน้อย 2 ห้องทดลองเพื่อบันทึกความสำเร็จ'
      ]
    },
    flowcharts: {
      img: 'assets/pixar/mod09.svg',
      title: 'วิธีเล่นกิจกรรม 09: เกมเรียงผังงาน',
      steps: [
        'เลือกด่านด้านบน (เช่น แปรงฟัน, ใส่เสื้อเชิ้ต, ทอดไข่)',
        'แตะบล็อกจากคลังด้านขวาเพื่อเรียงลำดับ (ใช้ ↑ ↓ × บนมือถือ)',
        'กด "✓ ตรวจผังงาน" และ "▷ ดูการทำงาน" เพื่อจำลองเส้นทาง'
      ]
    },
    challenge: {
      img: 'assets/pixar/mod10.svg',
      title: 'วิธีเล่นกิจกรรม 10: แบบฝึกหัดพร้อมภาพประกอบ',
      steps: [
        'เลือกสาขาของตนเองก่อน แล้วจึงเลือกรหัสและชื่อ-นามสกุล',
        'ดูภาพประกอบทั้ง 5 ข้อ และแตะเลือกคำตอบที่ถูกต้องที่สุด',
        'กด "📤 ส่งคำตอบให้อาจารย์ตรวจ" (เฉลยสงวนไว้เฉพาะอาจารย์)'
      ]
    }
  };

  const SEMI_TASKS = {
    survival: {
      prompt: 'จัดลำดับขั้นตอนการตัดสินใจฉุกเฉิน (พลบค่ำ ฝนตกหนัก ไม่มีสัญญาณ เพื่อนข้อเท้าแพลง) โดยคัดบล็อกที่อันตรายออก',
      blocks: [
        'ประเมินอาการเพื่อนและห้ามเคลื่อนย้ายเร็ว',
        'ให้เพื่อนเดินล่วงหน้าไปคนเดียวเพื่อขอความช่วยเหลือ',
        'หยุดสังเกตทิศทางหมีและรวมกลุ่มให้เงียบ',
        'วิ่งหนีแยกย้ายคนละทิศทางทันที',
        'หาที่กำบังที่ปลอดภัยและพยุงเพื่อนถอยอย่างช้าๆ',
        'ใช้ไฟฉายหรือนกหวีดส่งสัญญาณเมื่อปลอดภัยแล้ว'
      ],
      subjPrompt: 'อธิบายสั้นๆ ว่าเหตุใดจึงไม่เลือกบล็อกที่ตัดออก และเงื่อนไขใดสำคัญที่สุด?'
    },
    books: {
      prompt: 'เรียงลำดับขั้นตอนระบบแนะนำหนังสือ เมื่อพบว่าหนังสือ 2 เล่มมี Hamming Distance เท่ากัน',
      blocks: [
        'รับข้อมูลความชอบ 0/1 ของผู้ใช้ (Input)',
        'สุ่มเลือกหนังสือ 1 เล่มโดยไม่ดูหมวดหมู่',
        'เปรียบเทียบและนับจำนวนบิตที่ต่างกัน (Hamming Distance)',
        'คูณค่าน้ำหนักความสำคัญของหมวดหมู่ที่ผู้ใช้ชอบมากที่สุด',
        'แสดงรายชื่อหนังสือที่มีคะแนนความเหมาะสมสูงสุด'
      ],
      subjPrompt: 'หากผู้ใช้ชอบหมวดวิทยาศาสตร์และเทคโนโลยีเท่ากัน คุณจะออกแบบเกณฑ์ Tie-breaker เพิ่มอย่างไร?'
    },
    house: {
      prompt: 'เรียงลำดับคำสั่งวาดบ้าน + ต่อเติมหน้าต่าง และตรวจสอบขอบเขตไม่ให้เกินกริด (0–14, 0–10)',
      blocks: [
        'RECT 2 1 11 6 (วาดตัวบ้านหลัก)',
        'RECT 12 8 18 12 (วาดรั้วออกนอกขอบเขตกริด)',
        'LINE 1 6 6.5 9 (วาดหลังคาด้านซ้าย)',
        'LINE 6.5 9 12 6 (วาดหลังคาด้านขวา)',
        'RECT 3 3 5 5 (วาดหน้าต่างบานที่ 1 ไม่ทับประตู)',
        'ตรวจสอบพิกัดทุกจุดให้อยู่ในช่วง x∈[0,14], y∈[0,10]'
      ],
      subjPrompt: 'หากต้องการเพิ่มปล่องไฟบนหลังคาฝั่งขวา ควรกำหนดพิกัด RECT ประมาณเท่าใด และตรวจขอบเขตอย่างไร?'
    },
    routes: {
      prompt: 'เรียงลำดับการวางแผนเส้นทาง เมื่อต้องแวะจุด C ก่อน D เสมอ และเส้นทาง A–B ปิดซ่อม',
      blocks: [
        'ตัดเส้นทาง A–B ออกจากกราฟเพราะปิดซ่อม',
        'เลือกเดินทาง A → B → D → C เพื่อประหยัดเวลา',
        'เริ่มต้นเดินทางจากจุด A ไปยังจุด C',
        'คำนวณระยะทางรวมของเส้นทางที่เป็นไปได้ทั้งหมด',
        'เลือกเส้นทางที่ผ่าน C ก่อน D และมีระยะทางรวมน้อยที่สุด'
      ],
      subjPrompt: 'อธิบายเหตุผลว่าทำไมต้องตัดเส้นทาง A–B ออกก่อนเริ่มคำนวณ และผลลัพธ์จะเปลี่ยนอย่างไรถ้าไม่ตัดออก?'
    },
    gcd: {
      prompt: 'เรียงลำดับขั้นตอนวิธีของยูคลิด (Euclidean Algorithm) สำหรับหา ห.ร.ม. ของ (a, b)',
      blocks: [
        'รับค่าจำนวนเต็มบวก a และ b (ให้ a ≥ b)',
        'นำ a คูณ b เพื่อหาคำตอบทันที',
        'คำนวณเศษจากการหาร r = a mod b',
        'ถ้า r = 0 ให้หยุดและตอบว่า ห.ร.ม. คือ b',
        'ถ้า r ≠ 0 ให้แทนค่า a ← b และ b ← r แล้ววนซ้ำ'
      ],
      subjPrompt: 'เหตุใดคู่ตัวเลขแบบฟีโบนัชชี เช่น (144, 89) จึงทำให้วิธีของยูคลิดวนซ้ำมากกว่า (1000000, 999999)?'
    },
    decomposition: {
      prompt: 'เรียงลำดับการทำ Decomposition 3 ระดับสำหรับ "ระบบยืม-คืนอุปกรณ์วิทยาศาสตร์ในห้องแล็บ"',
      blocks: [
        'ระดับที่ 1: กำหนดเป้าหมายระบบยืม-คืนอุปกรณ์ทั้งหมด',
        'ซื้ออุปกรณ์ใหม่ทั้งหมดโดยไม่จัดทำทะเบียน',
        'ระดับที่ 2: แบ่งเป็น 3 ส่วนย่อย (ลงทะเบียน, ตรวจสต็อก, แจ้งเตือนคืน)',
        'ระดับที่ 3: ระบุ Input/Process/Output ของแต่ละส่วนย่อย',
        'ทดสอบการทำงานทีละส่วนย่อยแล้วนำมารวมกัน'
      ],
      subjPrompt: 'ในส่วนย่อย "แจ้งเตือนการคืนอุปกรณ์" อะไรคือ Input, Process และ Output?'
    },
    searching: {
      prompt: 'เรียงลำดับขั้นตอนการใช้ Binary Search ค้นหาข้อมูลขนาดใหญ่ (1,000,000 รายการ)',
      blocks: [
        'ตรวจสอบว่าข้อมูลเรียงลำดับแล้วหรือไม่ (ถ้ายังให้ Sort ก่อน)',
        'เปิดตรวจทีละตัวตั้งแต่ตัวแรกจนครบ 1,000,000 ตัว',
        'กำหนดขอบเขตซ้าย (low) และขวา (high)',
        'คำนวณตำแหน่งกึ่งกลาง mid = ⌊(low + high) / 2⌋',
        'เปรียบเทียบค่าที่ mid กับเป้าหมาย แล้วตัดครึ่งที่ไม่ใช่ออก'
      ],
      subjPrompt: 'ถ้าต้องการค้นหาเพียง "1 ครั้ง" บนข้อมูลที่ยังไม่เรียง ควรเลือก Linear Search หรือ Sort+Binary Search? เพราะเหตุใด?'
    },
    algorithms: {
      prompt: 'เรียงลำดับ Pseudocode ระบบรดน้ำอัจฉริยะ (เช็กถังน้ำว่างก่อน และรดเมื่อ H < 0.15 ในเวลาที่เหมาะสม)',
      blocks: [
        'อ่านค่า WaterLevel, ความชื้น H, เวลา และอุณหภูมิ T',
        'เปิดปั๊มน้ำทิ้งไว้ตลอดเวลาโดยไม่เช็ก WaterLevel',
        'ถ้า WaterLevel == 0 ให้หยุดปั๊มน้ำและแจ้งเตือนทันที',
        'ถ้า H < 0.15 และ (นอกเวลา 11:00–14:00 หรือ T < 35) ให้เปิดน้ำ',
        'มิฉะนั้น ให้ปิดปั๊มน้ำ'
      ],
      subjPrompt: 'เหตุใดจึงต้องตรวจสอบเงื่อนไข WaterLevel == 0 ก่อนเงื่อนไขความชื้น H < 0.15?'
    },
    flowcharts: {
      prompt: 'เรียงลำดับผังงาน "ระบบคัดกรองอุณหภูมิก่อนเข้าห้องสอบ" (ต้องวัดซ้ำหากค่าคลาดเคลื่อน)',
      blocks: [
        '[วงรี] เริ่มต้น',
        '[สี่เหลี่ยม] ปล่อยเข้าห้องสอบโดยไม่ต้องวัดอุณหภูมิ',
        '[สี่เหลี่ยม] วัดอุณหภูมิร่างกาย (T)',
        '[ข้าวหลามตัด] ค่า T คลาดเคลื่อน/ผิดปกติหรือไม่?',
        '[สี่เหลี่ยม] ถ้าปกติ: บันทึกผลลงฐานข้อมูลและอนุญาตเข้าสอบ',
        '[วงรี] จบการทำงาน'
      ],
      subjPrompt: 'หากเงื่อนไข "ค่า T คลาดเคลื่อน" เป็นจริง ลูกศรในผังงานควรวนกลับไปที่ขั้นตอนใด?'
    }
  };

  const SEMI_STORAGE_KEY = 'ctlab-semi-v1';
  function getSemiKey() {
    try {
      const p = JSON.parse(localStorage.getItem('ctlab-student-profile-v1') || '{}');
      return p.student_id ? `${SEMI_STORAGE_KEY}-${p.student_id}` : SEMI_STORAGE_KEY;
    } catch {
      return SEMI_STORAGE_KEY;
    }
  }
  function loadSemi() {
    try { return JSON.parse(localStorage.getItem(getSemiKey()) || '{}'); } catch { return {}; }
  }
  function saveSemi(obj) {
    try { localStorage.setItem(getSemiKey(), JSON.stringify(obj)); } catch {}
  }

  function injectPixarAndGuides() {
    // 1. ใส่ภาพ 3D Pixar บนการ์ดหน้าภาพรวม (Overview)
    document.querySelectorAll('.module-card[data-go]').forEach((card) => {
      const key = card.getAttribute('data-go');
      const info = GUIDE_DATA[key];
      if (!info || card.querySelector('.pixar-card-cover')) return;

      const wrap = document.createElement('div');
      wrap.className = 'pixar-card-cover';
      const img = document.createElement('img');
      img.src = info.img;
      img.alt = info.title;
      img.loading = 'lazy';
      wrap.appendChild(img);

      // ซ่อนไอคอน emoji เดิมแล้วแสดงภาพปก 3D Pixar แทนอย่างสวยงาม
      const oldEmoji = card.querySelector('.module-emoji');
      if (oldEmoji) oldEmoji.style.display = 'none';
      card.insertBefore(wrap, card.firstChild);
    });

    // 2. ใส่ภาพ 3D Pixar + กล่อง "วิธีเล่น 3 ขั้นตอน" ในแต่ละหน้ากิจกรรม
    Object.keys(GUIDE_DATA).forEach((key) => {
      const sec = document.querySelector(`.page[data-page="${key}"]`);
      if (!sec || sec.querySelector('.howto-banner')) return;

      const info = GUIDE_DATA[key];
      const banner = document.createElement('div');
      banner.className = 'howto-banner';
      banner.innerHTML = `
        <div class="howto-img">
          <img src="${info.img}" alt="${info.title}" loading="lazy">
        </div>
        <div class="howto-body">
          <div class="eyebrow">HOW TO PLAY • วิธีเล่นกิจกรรม</div>
          <h3>${info.title}</h3>
          <ol class="howto-steps">
            ${info.steps.map((s) => `<li>${s}</li>`).join('')}
          </ol>
        </div>
      `;

      const pageHead = sec.querySelector('.page-head');
      if (pageHead && pageHead.nextSibling) {
        sec.insertBefore(banner, pageHead.nextSibling);
      } else {
        sec.insertBefore(banner, sec.firstChild);
      }

      // 3. เพิ่มแบบทดสอบกึ่งอัตนัย-กึ่งจัดบล็อก (Parsons Problem + Short Justification) + ปุ่มส่งงานท้ายกิจกรรม (01-09)
      if (key !== 'challenge' && !sec.querySelector('.module-submit-bar')) {
        const task = SEMI_TASKS[key];
        if (task && !sec.querySelector('.subjective-card')) {
          const allSemi = loadSemi();
          const curState = allSemi[key] || { seq: [], note: '' };
          if (!Array.isArray(curState.seq)) curState.seq = [];

          const sCard = document.createElement('div');
          sCard.className = 'subjective-card';
          sCard.innerHTML = `
            <div class="subjective-head">
              <span class="eyebrow">SEMI-STRUCTURED CHALLENGE • แบบทดสอบกึ่งจัดบล็อก + กึ่งอัตนัย</span>
              <span class="tag soft">ไม่มีเฉลยฝั่งผู้เรียน</span>
            </div>
            <p class="subjective-q"><b>ส่วนที่ 1 (จัดตำแหน่งบล็อก):</b> ${task.prompt}</p>
            <div class="semi-builder">
              <div class="semi-col">
                <div class="semi-col-title">ลำดับคำตอบของคุณ (ใช้ปุ่ม ↑ ↓ × ปรับตำแหน่ง)</div>
                <div class="semi-seq" id="semi-seq-${key}"></div>
              </div>
              <div class="semi-col">
                <div class="semi-col-title">คลังบล็อก (แตะเพื่อเพิ่มเข้าลำดับ)</div>
                <div class="semi-bank" id="semi-bank-${key}"></div>
              </div>
            </div>
            <p class="subjective-q" style="margin-top:14px"><b>ส่วนที่ 2 (อัตนัยสั้น):</b> ${task.subjPrompt}</p>
            <textarea id="subj-${key}" class="subjective-input" rows="3" placeholder="พิมพ์เหตุผลสั้นๆ ของคุณที่นี่ (บันทึกอัตโนมัติระหว่างพิมพ์)..."></textarea>
          `;

          const seqBox = sCard.querySelector(`#semi-seq-${key}`);
          const bankBox = sCard.querySelector(`#semi-bank-${key}`);
          const ta = sCard.querySelector('textarea');
          ta.value = curState.note || '';

          function persistState() {
            const store = loadSemi();
            store[key] = { seq: curState.seq, note: ta.value };
            saveSemi(store);
          }

          function renderSemi() {
            seqBox.replaceChildren();
            if (curState.seq.length === 0) {
              seqBox.innerHTML = '<div class="empty-state" style="padding:14px">ยังไม่ได้เลือกบล็อก แตะบล็อกจากคลังด้านขวาเพื่อจัดลำดับ</div>';
            } else {
              curState.seq.forEach((txt, idx) => {
                const item = document.createElement('div');
                item.className = 'semi-seq-item';
                item.innerHTML = `
                  <span class="semi-num">${idx + 1}</span>
                  <span class="semi-txt"></span>
                  <div class="semi-actions">
                    <button type="button" class="semi-btn" data-act="up" ${idx === 0 ? 'disabled' : ''} aria-label="เลื่อนขึ้น">↑</button>
                    <button type="button" class="semi-btn" data-act="down" ${idx === curState.seq.length - 1 ? 'disabled' : ''} aria-label="เลื่อนลง">↓</button>
                    <button type="button" class="semi-btn del" data-act="del" aria-label="นำออก">×</button>
                  </div>
                `;
                item.querySelector('.semi-txt').textContent = txt;
                item.querySelectorAll('button').forEach((b) => {
                  b.addEventListener('click', () => {
                    const act = b.getAttribute('data-act');
                    if (act === 'up' && idx > 0) {
                      const tmp = curState.seq[idx - 1];
                      curState.seq[idx - 1] = curState.seq[idx];
                      curState.seq[idx] = tmp;
                    } else if (act === 'down' && idx < curState.seq.length - 1) {
                      const tmp = curState.seq[idx + 1];
                      curState.seq[idx + 1] = curState.seq[idx];
                      curState.seq[idx] = tmp;
                    } else if (act === 'del') {
                      curState.seq.splice(idx, 1);
                    }
                    persistState();
                    renderSemi();
                  });
                });
                seqBox.appendChild(item);
              });
            }

            bankBox.replaceChildren();
            task.blocks.forEach((txt) => {
              const used = curState.seq.indexOf(txt) !== -1;
              const btn = document.createElement('button');
              btn.type = 'button';
              btn.className = 'semi-bank-btn' + (used ? ' used' : '');
              btn.disabled = used;
              btn.textContent = (used ? '✓ ' : '+ ') + txt;
              btn.addEventListener('click', () => {
                if (curState.seq.indexOf(txt) === -1) {
                  curState.seq.push(txt);
                  persistState();
                  renderSemi();
                }
              });
              bankBox.appendChild(btn);
            });
          }

          ta.addEventListener('input', persistState);
          renderSemi();

          const srcNote = sec.querySelector('.source-note');
          if (srcNote) sec.insertBefore(sCard, srcNote);
          else sec.appendChild(sCard);
        }

        const bar = document.createElement('div');
        bar.className = 'module-submit-bar';
        bar.innerHTML = `
          <div>
            <strong>ทำกิจกรรมนี้เสร็จแล้วหรือยัง?</strong>
            <span>บันทึกความคืบหน้าและส่งงานกิจกรรมนี้เข้าสู่ฐานข้อมูลให้อาจารย์ตรวจได้ทันที</span>
          </div>
          <button type="button" class="btn btn-primary" data-submit-module="${key}">📤 ส่งงานกิจกรรมนี้ให้อาจารย์ตรวจ</button>
        `;
        const srcNote = sec.querySelector('.source-note');
        if (srcNote) {
          sec.insertBefore(bar, srcNote);
        } else {
          sec.appendChild(bar);
        }
        bar.querySelector('button').addEventListener('click', () => {
          if (typeof window.openSubmitForModule === 'function') {
            window.openSubmitForModule(key);
          }
        });
      }
    });

    // 4. ป้องกันการเผลอกดปุ่มรีเซตบน iPad/มือถือ (ถามยืนยันก่อนล้างข้อมูล)
    const resetIds = [
      'survival-reset',
      'house-clear',
      'house-clear-free',
      'gcd-reset',
      'search-challenge-reset',
      'alg-water-reset',
      'fc-reset'
    ];
    resetIds.forEach((id) => {
      const btn = document.getElementById(id);
      if (!btn || btn.dataset.guardAttached) return;
      btn.dataset.guardAttached = '1';
      btn.addEventListener('click', (e) => {
        if (!window.confirm('ต้องการเริ่มใหม่ / ล้างข้อมูลในกิจกรรมนี้ใช่หรือไม่?')) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }, true);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectPixarAndGuides);
  } else {
    injectPixarAndGuides();
  }
})();
