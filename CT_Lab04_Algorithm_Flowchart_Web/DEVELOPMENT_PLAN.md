# แผนพัฒนาเว็บไซต์เชิงโต้ตอบ: การออกแบบขั้นตอนวิธี รหัสลำลอง และผังงาน
**รหัสชุดปฏิบัติการ:** CT-Lab 04 (`CT_Lab04_Algorithm_Flowchart_Web`)  
**หลักสูตร / กลุ่มเป้าหมาย:** นักศึกษาระดับปริญญาตรี รายวิชาวิทยาการคำนวณและการคิดเชิงคำนวณ  
**มาตรฐานอ้างอิง:** Outcome-Based Education (OBE), ISO 5807:1985 / ANSI X3.5, Cambridge IGCSE/AS-Level, IB CS, Dual-Engine Database & AI Rubric Grader  
**แหล่งข้อมูลหลัก NotebookLM (`FlowCharT-CS2027` — 51 แหล่งข้อมูล):**
- Notebook เต็ม: [FlowCharT-CS2027](https://notebook.google.com/notebook/b726099e-9711-4319-9deb-d3c42c772173)
- ลิงก์แชร์สาธารณะ: [https://notebooklm.link.google/IP0aexOtZhEb](https://notebooklm.link.google/IP0aexOtZhEb)

---

## 1. หลักการและเหตุผล (Rationale)
การเปลี่ยนผ่านจากแนวคิดการแก้ปัญหาในชีวิตประจำวันไปสู่การเขียนโปรแกรมและการควบคุมกระบวนการทดลองทางวิทยาศาสตร์ จำเป็นต้องอาศัยทักษะ **การออกแบบขั้นตอนวิธี (Algorithm Design)** การถ่ายทอดตรรกะผ่าน **รหัสลำลอง (Pseudocode)** และ **ผังงานมาตรฐาน (Standard Flowchart)** รวมถึงทักษะสำคัญที่ผู้เรียนมักมองข้ามคือ **การทวนสอบความถูกต้องด้วยตารางติดตามค่าตัวแปร (Trace Table / Dry Run)** ก่อนลงมือปฏิบัติจริง

เว็บแอปพลิเคชันเชิงโต้ตอบนี้ถูกออกแบบมาเพื่อให้นักศึกษาได้ลงมือวิเคราะห์ปัญหาแบบ **Input → Process → Output (IPO)** ทดลองรันรหัสลำลองทีละบรรทัด สร้างแผนภาพผังงาน SVG แบบไดนามิก และทำ **ปฏิบัติการที่ 4: ออกแบบผังงานควบคุมขั้นตอนการทดลองทางวิทยาศาสตร์และตรวจสอบความถูกต้องด้วย Trace Table** พร้อมระบบตรวจงาน ให้คะแนนแยกตามเกณฑ์ Rubric และรายงานวิเคราะห์ผลการเรียนด้วย AI อัตโนมัติ

---

## 2. วัตถุประสงค์การเรียนรู้เชิงพฤติกรรม (Course Learning Outcomes: CLOs)
เมื่อนักศึกษาเรียนรู้และทำปฏิบัติการผ่านเว็บไซต์นี้ครบทั้ง 5 ส่วน จะสามารถ:
1. **CLO 1 (Algorithm Design):** วิเคราะห์โจทย์ปัญหาทางวิทยาศาสตร์ให้อยู่ในรูป IPO Model และลำดับขั้นตอนวิธีที่มีจุดเริ่มต้น-จุดสิ้นสุดชัดเจน ไม่กำกวม และมีประสิทธิภาพ
2. **CLO 2 (Pseudocode):** เขียนและอ่านรหัสลำลองภายใต้โครงสร้างควบคุม 3 รูปแบบ (Sequence, Selection, Repetition) พร้อมคาดการณ์การเปลี่ยนแปลงค่าตัวแปรในแต่ละบรรทัดได้
3. **CLO 3 (Standard Flowchart):** เลือกใช้สัญลักษณ์ผังงานมาตรฐาน ANSI/ISO 5807 ได้ถูกต้อง และแปลงรหัสลำลองเป็นผังงานที่มีทิศทางการไหล (Flowline) ครบถ้วน
4. **CLO 4 (Lab 04 & Trace Table):** ออกแบบผังงานควบคุมกระบวนการทดลองทางวิทยาศาสตร์ (เคมี ฟิสิกส์ ชีววิทยา) และใช้ **Trace Table** ไล่ค่าตัวแปรทีละรอบ (Step-by-Step Dry Run) เพื่อตรวจจับข้อผิดพลาดเชิงตรรกะ (Logic Error / Infinite Loop) ได้
5. **CLO 5 (Assessment & Reflection):** ตัดสินใจเลือกโครงสร้างอัลกอริทึมที่เหมาะสมกับข้อจำกัดของปัญหา และอธิบายเหตุผลเชิงวิทยาศาสตร์รองรับการออกแบบของตนเองได้

---

## 3. โครงสร้างโมดูลและกิจกรรมการเรียนรู้เชิงโต้ตอบ (5 โมดูล)

| โมดูล | รหัสโมดูล | หัวข้อการเรียนรู้ | เครื่องมือเชิงโต้ตอบ (Interactive Sandbox) |
| :---: | :--- | :--- | :--- |
| **01** | `algo_design` | **Algorithm Design: การลำดับขั้นตอนแก้ปัญหาอย่างเป็นระบบ** | **IPO Analyzer Sandbox** + **Four-Tier Test Data Validator** (`Normal`, `Extreme`, `Boundary`, `Abnormal`) สำหรับโจทย์วิทยาศาสตร์ (ความเข้มข้น, ความหนาแน่น, ช่วงอุณหภูมิปลอดภัย 35–40°C) |
| **02** | `pseudocode` | **การเขียนรหัสลำลอง (Pseudocode Studio)** | **Interactive Pseudocode Step Runner** รองรับไวยากรณ์มาตรฐาน `INITIALISE`, `INPUT`, `OUTPUT`, `←` และเปรียบเทียบลูป 3 ตระกูล (`FOR`, `WHILE` Pre-test 0+ รอบ, `REPEAT-UNTIL` Post-test 1+ รอบ, `PROCEDURE/CALL`) |
| **03** | `flowchart` | **ผังงานมาตรฐาน (ISO 5807:1985 Flowchart Builder & Multi-Branch Simulator)** | คลังสัญลักษณ์มาตรฐาน **ISO 5807:1985 ครบ 16 สัญลักษณ์** + **ตัวต่อผังงาน SVG 4 บริบท** (คุณภาพน้ำ, เกษตรอัจฉริยะ, ระบบตัดเกรด, การสอนวิทย์ซ่อมเสริม) + **Interactive Multi-Branch Simulator** (`IF–ELSEIF–ELSE`, Smart Farm AIoT, Dichotomous Key) |
| **04** | `lab4_tracetable` | **ปฏิบัติการที่ 4: ผังงานควบคุมวิทย์ เกษตรอัจฉริยะ วัดผล & Trace Table** | เลือกทำ **6 กิจกรรม** (**4.0 CSTR**, 4.1 ไทเทรต, 4.2 เพนดูลัม, 4.3 ตู้บ่มเชื้อ, **4.4 เกษตรอัจฉริยะ AIoT**, **4.5 ตัดเกรด & ซ่อมเสริม**) เรียงผังงาน ISO 5807 กรอก **Trace Table** และวิเคราะห์ **4 Logic Error Taxonomy** |
| **05** | `assessment` | **แบบทดสอบวัดผลพร้อมภาพประกอบ** | ข้อสอบวิเคราะห์ 5 ข้อมาตรฐาน ISO 5807 & NotebookLM Quiz (`Preparation` หกเหลี่ยม, `WHILE` vs `REPEAT-UNTIL`, Boundary Test Data, CSTR Trace Table, Logic Error / Fail-Safe) |

---

## 3.1 มาตรฐานสัญลักษณ์ผังงาน ISO 5807:1985 (16 สัญลักษณ์จากรายงาน Deep Research)
| สัญลักษณ์ | รูปทรง | หน้าที่และการใช้งาน |
| :--- | :--- | :--- |
| **Terminal / Terminator** | วงรี / สี่เหลี่ยมมุมมน | จุดเริ่มต้น (`START`) หรือจุดสิ้นสุด (`END`) |
| **Process** | สี่เหลี่ยมผืนผ้า | ประมวลผล คำนวณ หรือกำหนดค่าตัวแปร (`←`) |
| **Decision** | สี่เหลี่ยมข้าวหลามตัด | ทดสอบเงื่อนไขตรรกศาสตร์ มีทางออกอย่างน้อย 2 เส้นทาง (`TRUE`/`FALSE`) |
| **Data (Input/Output)** | สี่เหลี่ยมด้านขนาน | รับข้อมูลเข้าหรือแสดงผลลัพธ์ออกโดยไม่ระบุชนิดอุปกรณ์ |
| **Predefined Process** | สี่เหลี่ยมมีเส้นแนวตั้งขนาบข้าง | เรียกใช้ฟังก์ชัน โปรแกรมย่อย หรือ Subroutine (`CALL`) |
| **Preparation** | หกเหลี่ยมแนวนอน (Hexagon) | ตั้งค่าเริ่มต้นของตัวแปร สวิตช์ หรือตัวนับ (`INITIALISE`) ก่อนเข้าลูป |
| **Manual Input** | สี่เหลี่ยมขอบบนเอียง | การป้อนข้อมูลด้วยมือมนุษย์ขณะประมวลผล |
| **Manual Operation** | สี่เหลี่ยมคางหมูกลับหัว | ขั้นตอนที่มนุษย์ลงมือปฏิบัติเองโดยไม่ผ่านคอมพิวเตอร์ |
| **Document** | สี่เหลี่ยมขอบล่างคลื่น | รายงานหรือเอกสารที่มนุษย์อ่านได้ |
| **Stored Data** | สี่เหลี่ยมมุมโค้งบานออก | ข้อมูลที่บันทึกในสื่อจัดเก็บทั่วไป |
| **Direct Access Storage** | รูปทรงกระบอก (Cylinder) | ฐานข้อมูล ดิสก์ หรือสื่อเข้าถึงโดยตรง |
| **Sequential Access** | รูปม้วนเทปวงกลมมีหาง | สื่อจัดเก็บแบบลำดับต่อเนื่อง |
| **Delay** | รูปตัว D / ครึ่งวงกลม | การหน่วงเวลา/พักรอ (`DELAY 5 SECONDS`) |
| **On-Page Connector** | วงกลมขนาดเล็ก | จุดเชื่อมต่อในหน้าเดียวกัน ลดเส้นตัดกัน |
| **Off-Page Connector** | ห้าเหลี่ยมรูปบ้าน | จุดเชื่อมต่อข้ามไปหน้าถัดไป |
| **Flowline** | เส้นตรงพร้อมหัวลูกศร | แสดงทิศทางการไหลของข้อมูลและการควบคุม |

---

## 4. การออกแบบ Interactive Trace Table Engine (ปฏิบัติการที่ 4)
ตาราง Trace Table ในโมดูล 04 ถูกออกแบบตามกฎมาตรฐานสากล (คอลัมน์ Step, Variables, Condition Evaluation, Output/Actuator; บันทึกค่าเฉพาะเมื่อตัวแปรเปลี่ยนแปลงจริง และขึ้นแถวใหม่เมื่อเข้าสู่รอบลูปใหม่) ครอบคลุม **6 กิจกรรมทางวิทยาศาสตร์ เกษตรอัจฉริยะ และการจัดการเรียนรู้**:

0. **กิจกรรม 4.0 (Flagship Case Study): ระบบควบคุมถังปฏิกรณ์เคมีอัตโนมัติ (CSTR Closed-Loop Control)**
   - *ตัวแปรติดตาม:* `TotalCycles`, `SystemStatus`, `StopSignal`, `Temp (°C)`, `pH`, `CoolerActuator`, `HeaterActuator`, `AlkaliPumpActuator`
   - *ตรรกะควบคุม:* รักษา `35 ≤ Temp ≤ 40 °C` และ `pH ≥ 6.0` ในลูป `TotalCycles < 3 AND SystemStatus == "RUNNING"` พร้อม `DELAY 5 SECONDS` และ **Fail-Safe Reset Block** ปิด Actuator ทั้งหมดเมื่อจบการทำงาน
   - *ชุดข้อมูล Dry Run 4 รอบ:* รอบ 1 (`Temp=42.5, pH=5.5`), รอบ 2 (`Temp=32.0, pH=6.8`), รอบ 3 (`Temp=37.0, pH=5.8`), รอบ 4 (`3 < 3 is FALSE → Safe-state Reset OFF`)
1. **กิจกรรม 4.1 (เคมี): ระบบไทเทรตกรด-เบสอัตโนมัติ** (`V_base += 2 mL` ขณะที่ `pH < 7.0`)
2. **กิจกรรม 4.2 (ฟิสิกส์): การวัดคาบการแกว่งเพนดูลัมและคัดกรองค่าผิดปกติ** (`1.5 ≤ T ≤ 2.5`)
3. **กิจกรรม 4.3 (ชีววิทยา): ระบบควบคุมอุณหภูมิตู้บ่มเชื้อจุลินทรีย์** (`36.5 ≤ T ≤ 37.5`)
4. **กิจกรรม 4.4 (เกษตรอัจฉริยะ AIoT): ระบบให้น้ำและจ่ายปุ๋ยอัตโนมัติ** (`Moist ≥ 40%`, `EC ≥ 1.5 mS/cm` ด้วย `Predefined Process` CALL จ่ายปุ๋ย AB, `DELAY 10s` และ Fail-Safe Reset)
5. **กิจกรรม 4.5 (การจัดการเรียนรู้วิทย์ & วัดผล): ระบบตัดเกรด A–F และคัดกรองซ่อมเสริม** (`total ← lab + exam`, `IF–ELSEIF–ELSE`, และการส่งผู้เรียนที่ได้ `< 60` เข้า `CALL AssignRemedialLab()`)

### 4.1 อนุกรมความผิดพลาดเชิงตรรกะ 4 รูปแบบ (4 Logic Error Taxonomy) และชุดข้อมูลทดสอบ 4 ระดับ
- **4 Logic Errors:** (1) `Off-by-One Boundary Error` (`<=` แทน `<`), (2) `Uninitialized / Reset Variable Error` (ลืม Preparation หกเหลี่ยม หรือวาง `total ← 0` ในลูป), (3) `Infinite Loop Error` (ลืม `TotalCycles ← TotalCycles + 1`), (4) `Actuator Chatter Error` (แก้ด้วย Deadband / Hysteresis)
- **Four-Tier Test Data Validation:** `Normal Data` (ข้อมูลปกติ), `Extreme Data` (ข้อมูลสุดขอบ), `Boundary Data` (ข้อมูลประชิดขอบเขต เช่น `-1, 0, 100, 101`), `Abnormal Data` (ข้อมูลผิดพลาด)

นักศึกษาสามารถ:
- **โหมดจำลองทีละขั้น (Step Trace Simulator):** กดเดินหน้าทีละแถวเพื่อดูว่าจุดใดในผังงานกำลังทำงานและตัวแปรเปลี่ยนอย่างไร
- **โหมดฝึกตรวจสอบด้วยตนเอง (Interactive Dry-Run Check):** เติมค่าตัวแปร ค่าความจริง (`True/False`) และ Action ที่ขาดหายลงในช่องตาราง แล้วกดตรวจคำตอบเพื่อรับคะแนน Trace Table

---

## 5. สถาปัตยกรรมฐานข้อมูลต้นแบบและ AI ตรวจงานอัตโนมัติ

### 5.1 โครงสร้างฐานข้อมูล Dual-Engine (`ctlab04_*`)
- รองรับ **MySQL / MariaDB** (XAMPP และเซิร์ฟเวอร์มหาวิทยาลัย `rbru.ac.th`) และ **SQLite Fallback อัตโนมัติ** (`data/ctlab04_local.sqlite`)
- แยกชุดตารางเป็นเอกเทศเพื่อความสะอาดของข้อมูล:
  1. `ctlab04_students` (`student_id`, `full_name`, `section`, `created_at`, `updated_at`)
  2. `ctlab04_submissions` (`id`, `student_id`, `module_id`, `completed_count`, `total_modules`, `auto_score`, `ai_score`, `ai_rubric_json`, `ai_feedback`, `ai_model`, `ai_graded_at`, `payload_json`, `student_note`, `teacher_score`, `teacher_feedback`, `status`, `submitted_at`, `graded_at`)
  3. `ctlab04_ai_reports` (`id`, `report_scope`, `total_students`, `submitted_students`, `avg_score`, `summary_json`, `narrative_text`, `created_at`)

### 5.2 เกณฑ์การตรวจและให้คะแนนอัตโนมัติด้วย AI (`api/ai_grader.php`)
การตรวจแต่ละโมดูลมีคะแนนเต็ม 100 คะแนน แบ่งเป็น 3 มิติ (Multi-Rubric):
1. **Simulation & Trace Table Mastery (40 คะแนน):**
   - ตรวจการผ่านกิจกรรมใน Sandbox, จำนวนรอบที่ทดลอง (`attempts`), และสำหรับ `lab4_tracetable` จะตรวจความแม่นยำของข้อมูล Trace Table ที่นักศึกษากรอกส่งมาใน `snapshot.trace_answers`
2. **Algorithm / Pseudocode / Flowchart Sequencing (35 คะแนน):**
   - ตรวจการจัดลำดับขั้นตอน (`semi_answers[mod].seq`) ด้วยอัลกอริทึม Longest Common Subsequence (LCS) และตรวจจับการคัดกรองบล็อกตัวลวง (Distractor)
3. **Scientific & Algorithmic Reasoning (25 คะแนน):**
   - วิเคราะห์เหตุผลอัตนัยใน `semi_answers[mod].note` และ `student_note` ด้วยตัวจับมโนทัศน์เฉพาะทางวิทยาศาสตร์และวิทยาการคำนวณ (เช่น `เงื่อนไขหยุด`, `Infinite Loop`, `Dry Run`, `ตัวแปรควบคุม`, `pH`, `ANSI/ISO`) พร้อมรองรับการเสริมคำอธิบายด้วย Gemini API หรือ Local Ollama

### 5.3 ระบบรายงานวิเคราะห์ผู้สอนอัตโนมัติ (`teacher.html` & `api/admin.php`)
- ปุ่ม **AI ตรวจงานอัตโนมัติทั้งหมด (Batch Grading)** และตรวจซ้ำรายบุคคลพร้อมกราฟแท่ง Rubric Breakdown
- แท็บ **AI Auto-Report** วิเคราะห์ค่าสถิติ (Mean, S.D., Min–Max), คะแนนแยกตาม 4 ทักษะหลัก (Algorithm Design, Pseudocode, Flowchart, Trace Table), วิเคราะห์จุดติดขัดรายโมดูล, คัดกรองนักศึกษากลุ่มเสี่ยง/ดีเด่น, จำลองข้อมูลทดสอบ (`Demo Seed`), บันทึกรายงานลง `ctlab04_ai_reports` และสั่งพิมพ์ PDF

---

## 6. แผนการดำเนินงาน (Implementation Roadmap)

| ระยะ | งานหลัก | ผลผลิต (Deliverables) |
| :---: | :--- | :--- |
| **ระยะที่ 1** | ออกแบบโครงสร้างฐานข้อมูลและเอนจิน AI | `database.sql`, `api/config.php`, `api/ai_grader.php` |
| **ระยะที่ 2** | พัฒนา Backend API ส่งงาน ตรวจข้อสอบ และระบบผู้สอน | `api/submit.php`, `api/challenge.php`, `api/admin.php` |
| **ระยะที่ 3** | พัฒนา Frontend เว็บเชิงโต้ตอบ 5 โมดูล + Interactive Trace Table | `index.html`, `styles.css`, `app.js` |
| **ระยะที่ 4** | พัฒนาพอร์ทัลผู้สอนและรายงานวิเคราะห์ AI อัตโนมัติ | `teacher.html` |
| **ระยะที่ 5** | ทดสอบไวยากรณ์ PHP/JS และรันจำลองฐานข้อมูลและเอนจิน AI | ผลทดสอบ `php -l`, `node --check`, PHP CLI Test Suite |
