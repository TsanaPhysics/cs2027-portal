# CT-Lab 04 — เว็บไซต์เชิงโต้ตอบ: การออกแบบขั้นตอนวิธี รหัสลำลอง และผังงาน

สื่อการเรียนรู้และห้องปฏิบัติการจำลองเชิงโต้ตอบสำหรับนักศึกษา ครอบคลุมตั้งแต่การออกแบบขั้นตอนวิธี (Algorithm Design), การเขียนและรันรหัสลำลอง (Pseudocode), ผังงานมาตรฐาน (ANSI/ISO Flowchart) และ **ปฏิบัติการที่ 4: ออกแบบผังงานควบคุมขั้นตอนการทดลองทางวิทยาศาสตร์และตรวจสอบความถูกต้องด้วย Trace Table** พร้อมระบบฐานข้อมูลและ AI ตรวจงาน/รายงานอัตโนมัติ

## วิธีเปิดใช้งาน

- **ใช้งานครบทุกฟีเจอร์ (ส่งงานเข้าฐานข้อมูล + AI ตรวจงาน + ทำแบบทดสอบ 5 ข้อ + หน้าผู้สอน):**
  เปิดผ่าน XAMPP / Apache ที่ `http://localhost/CS2027/CT_Lab04_Algorithm_Flowchart_Web/`
- **หน้าพอร์ทัลผู้สอน (Teacher Portal & AI Auto-Report):**
  เปิด `http://localhost/CS2027/CT_Lab04_Algorithm_Flowchart_Web/teacher.html` (รหัส PIN เริ่มต้น: `physicss`)

## โมดูลการเรียนรู้ทั้ง 5 ส่วน (อัปเดตตามแหล่งข้อมูล NotebookLM `FlowCharT-CS2027`)

1. **01 Algorithm Design (`algo_design`):** วิเคราะห์ IPO (Input → Process → Output) โจทย์วิทยาศาสตร์และทดสอบชุดข้อมูล 4 ระดับ (**Four-Tier Test Data**: Normal, Extreme, Boundary, Abnormal)
2. **02 Pseudocode Studio (`pseudocode`):** เขียนรหัสลำลองมาตรฐาน (`INITIALISE`, `←`, `INPUT`, `OUTPUT`, `PROCEDURE/CALL`) พร้อม Step Runner เปรียบเทียบลูป `FOR`, `WHILE` (Pre-test) และ `REPEAT-UNTIL` (Post-test)
3. **03 Standard Flowchart (`flowchart`):** สัญลักษณ์มาตรฐาน **ISO 5807:1985 ครบ 16 สัญลักษณ์**, ตัวสร้างผังงาน SVG **4 บริบท** (คุณภาพน้ำวิทย์, เกษตรอัจฉริยะ, ระบบตัดเกรด `IF–ELSEIF–ELSE`, การสอนซ่อมเสริมอัตโนมัติ) พร้อม **Interactive Multi-Branch Simulator** (ระบบตัดเกรด, เกษตรอัจฉริยะ AIoT, กุญแจจำแนกพืช Dichotomous Key)
4. **04 Lab 4: Scientific Flowchart & Trace Table (`lab4_tracetable`):** ออกแบบผังงานควบคุมและตรวจตาราง **Trace Table (Dry Run) 6 กิจกรรม** (4.0 **CSTR ถังปฏิกรณ์เคมี + Fail-Safe Reset**, 4.1 ไทเทรต, 4.2 เพนดูลัม, 4.3 ตู้บ่มเชื้อ, 4.4 **เกษตรอัจฉริยะน้ำ-ปุ๋ย AIoT**, 4.5 **ระบบตัดเกรดและคัดกรองซ่อมเสริมสำหรับครูวิทย์**) และศึกษา **4 Logic Error Taxonomy**
5. **05 Assessment (`assessment`):** แบบทดสอบวัดผล 5 ข้อมาตรฐาน ISO 5807 & NotebookLM Quiz พร้อมภาพประกอบ SVG (ตรวจฝั่ง Server เก็บเฉลยเฉพาะอาจารย์)

## แหล่งข้อมูลเสริม NotebookLM (`FlowCharT-CS2027` — 51 แหล่งข้อมูล)
- เปิดคลังสไลด์ บัตรคำ 50 ใบ แผนผังความคิด และรายงานอินเทอร์แอกทีฟ:
  - [Gemini Notebook (FlowCharT-CS2027)](https://notebook.google.com/notebook/b726099e-9711-4319-9deb-d3c42c772173)
  - [ลิงก์แชร์สาธารณะ NotebookLM](https://notebooklm.link.google/IP0aexOtZhEb)

## ระบบฐานข้อมูลและ AI อัตโนมัติ

- ฐานข้อมูลรองรับทั้ง **MySQL / MariaDB** (ตาม [database.sql](database.sql)) และ **SQLite Fallback อัตโนมัติ** (`data/ctlab04_local.sqlite`)
- ตารางเฉพาะบทปฏิบัติการ: `ctlab04_students`, `ctlab04_submissions`, `ctlab04_ai_reports`
- AI ตรวจคะแนน Rubric 3 มิติอัตโนมัติ:
  - Simulation & Trace Table Mastery (40 คะแนน)
  - Flowchart & Pseudocode Sequencing (35 คะแนน)
  - Scientific Reasoning (25 คะแนน)

## เอกสารแผนพัฒนา
ดูรายละเอียดแผนพัฒนาหลักสูตร สถาปัตยกรรม Trace Table Engine และเกณฑ์ Rubric ได้ที่ [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)
