<?php
/**
 * CT-Lab v4.0 — AI Auto-Grading, Rubric Assessment & Automated Report Engine (PHP 5.6+ Compatible)
 * ระบบ AI ตรวจงาน ให้คะแนนแยกตามเกณฑ์ Rubric (Simulation / Block Sequencing / Subjective Reasoning)
 * และวิเคราะห์สร้างรายงานสรุปผลระดับชั้นเรียนอัตโนมัติ
 */

require_once __DIR__ . '/config.php';

function ai_config_path()
{
    return dirname(__DIR__) . '/data/ai_config.json';
}

function get_ai_config()
{
    $defaults = array(
        'auto_grade_on_submit' => true,
        'auto_approve' => true,
        'resubmit_threshold' => 0,
        'provider' => 'hybrid_local', // hybrid_local | gemini | ollama
        'gemini_api_key' => '',
        'gemini_model' => 'gemini-2.5-flash',
        'ollama_url' => 'http://127.0.0.1:11434',
        'ollama_model' => 'llama3.2',
    );
    $path = ai_config_path();
    if (file_exists($path)) {
        $raw = @json_decode((string)@file_get_contents($path), true);
        if (is_array($raw)) {
            foreach ($defaults as $k => $v) {
                if (array_key_exists($k, $raw)) {
                    $defaults[$k] = $raw[$k];
                }
            }
        }
    }
    return $defaults;
}

function save_ai_config($newCfg)
{
    $cur = get_ai_config();
    $dir = dirname(ai_config_path());
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }

    if (isset($newCfg['auto_grade_on_submit'])) {
        $cur['auto_grade_on_submit'] = (bool)$newCfg['auto_grade_on_submit'];
    }
    if (isset($newCfg['auto_approve'])) {
        $cur['auto_approve'] = (bool)$newCfg['auto_approve'];
    }
    if (isset($newCfg['resubmit_threshold'])) {
        $th = (float)$newCfg['resubmit_threshold'];
        $cur['resubmit_threshold'] = max(0, min(100, $th));
    }
    if (isset($newCfg['provider']) && in_array($newCfg['provider'], array('hybrid_local', 'gemini', 'ollama'), true)) {
        $cur['provider'] = $newCfg['provider'];
    }
    if (isset($newCfg['gemini_api_key']) && trim((string)$newCfg['gemini_api_key']) !== '') {
        $cur['gemini_api_key'] = trim((string)$newCfg['gemini_api_key']);
    } elseif (isset($newCfg['clear_gemini_key']) && $newCfg['clear_gemini_key']) {
        $cur['gemini_api_key'] = '';
    }
    if (isset($newCfg['gemini_model']) && trim((string)$newCfg['gemini_model']) !== '') {
        $cur['gemini_model'] = trim((string)$newCfg['gemini_model']);
    }
    if (isset($newCfg['ollama_url']) && trim((string)$newCfg['ollama_url']) !== '') {
        $cur['ollama_url'] = rtrim(trim((string)$newCfg['ollama_url']), '/');
    }
    if (isset($newCfg['ollama_model']) && trim((string)$newCfg['ollama_model']) !== '') {
        $cur['ollama_model'] = trim((string)$newCfg['ollama_model']);
    }

    $ok = @file_put_contents(ai_config_path(), json_encode($cur, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    if ($ok !== false) {
        @chmod(ai_config_path(), 0600);
    }
    return $ok !== false ? $cur : false;
}

function ai_lower($str)
{
    $s = (string)$str;
    if (function_exists('mb_strtolower')) {
        return mb_strtolower($s, 'UTF-8');
    }
    return strtolower($s);
}

function ai_len($str)
{
    $s = trim((string)$str);
    if (function_exists('mb_strlen')) {
        return mb_strlen($s, 'UTF-8');
    }
    return strlen($s);
}

function ai_contains($haystack, $needle)
{
    $h = ai_lower($haystack);
    $n = ai_lower($needle);
    if ($n === '') {
        return false;
    }
    if (function_exists('mb_strpos')) {
        return mb_strpos($h, $n, 0, 'UTF-8') !== false;
    }
    return strpos($h, $n) !== false;
}

function ai_lcs_length($seq, $expected)
{
    $m = count($seq);
    $n = count($expected);
    if ($m === 0 || $n === 0) {
        return 0;
    }
    $dp = array();
    for ($i = 0; $i <= $m; $i++) {
        $dp[$i] = array_fill(0, $n + 1, 0);
    }
    for ($i = 1; $i <= $m; $i++) {
        for ($j = 1; $j <= $n; $j++) {
            if (trim((string)$seq[$i - 1]) === trim((string)$expected[$j - 1])) {
                $dp[$i][$j] = $dp[$i - 1][$j - 1] + 1;
            } else {
                $dp[$i][$j] = max($dp[$i - 1][$j], $dp[$i][$j - 1]);
            }
        }
    }
    return $dp[$m][$n];
}

function get_ai_module_labels()
{
    return array(
        'survival' => '01 สถานการณ์ชวนคิด',
        'books' => '02 แนะนำหนังสือ',
        'house' => '03 บ้านตามพิกัด',
        'routes' => '04 ไปให้ครบทุกที่',
        'gcd' => '05 หา ห.ร.ม.',
        'decomposition' => '06 การย่อยปัญหา',
        'searching' => '07 การค้นหาข้อมูล',
        'algorithms' => '08 ออกแบบขั้นตอนวิธี',
        'flowcharts' => '09 เกมเรียงผังงาน',
        'challenge10' => '10 แบบฝึกหัดภาพประกอบ',
    );
}

function get_ai_pillar_labels()
{
    return array(
        'Decomposition' => 'การย่อยปัญหา (Decomposition)',
        'Pattern Recognition' => 'การหารูปแบบ (Pattern Recognition)',
        'Abstraction' => 'การคิดเชิงนามธรรม (Abstraction)',
        'Algorithm Design' => 'การออกแบบขั้นตอนวิธี (Algorithm Design)',
    );
}

function get_ai_module_rubrics()
{
    return array(
        'survival' => array(
            'label' => '01 สถานการณ์ชวนคิด',
            'pillar' => 'Algorithm Design',
            'expected_seq' => array(
                'หยุดสังเกตทิศทางหมีและรวมกลุ่มให้เงียบ',
                'ประเมินอาการเพื่อนและห้ามเคลื่อนย้ายเร็ว',
                'หาที่กำบังที่ปลอดภัยและพยุงเพื่อนถอยอย่างช้าๆ',
                'ใช้ไฟฉายหรือนกหวีดส่งสัญญาณเมื่อปลอดภัยแล้ว',
            ),
            'distractors' => array(
                'ให้เพื่อนเดินล่วงหน้าไปคนเดียวเพื่อขอความช่วยเหลือ',
                'วิ่งหนีแยกย้ายคนละทิศทางทันที',
            ),
            'keywords_core' => array('ปลอดภัย', 'รวมกลุ่ม', 'หมี', 'ข้อเท้า', 'แพลง', 'เงื่อนไข', 'ประเมิน', 'พยุง', 'ฉุกเฉิน', 'สัญญาณ', 'อันตราย', 'แยกย้าย'),
            'hint_seq' => 'ต้องตัดทางเลือกเสี่ยงอันตราย (วิ่งแยกย้าย / ให้เพื่อนเดินคนเดียว) ออก และเริ่มจากสังเกตการณ์-ประเมินอาการก่อนถอยอย่างปลอดภัย',
            'hint_subj' => 'ควรระบุเหตุผลความเสี่ยงของการแยกกลุ่ม/เคลื่อนย้ายคนเจ็บ และชี้เงื่อนไขความปลอดภัยของชีวิตเป็นสำคัญที่สุด',
        ),
        'books' => array(
            'label' => '02 แนะนำหนังสือ',
            'pillar' => 'Pattern Recognition',
            'expected_seq' => array(
                'รับข้อมูลความชอบ 0/1 ของผู้ใช้ (Input)',
                'เปรียบเทียบและนับจำนวนบิตที่ต่างกัน (Hamming Distance)',
                'คูณค่าน้ำหนักความสำคัญของหมวดหมู่ที่ผู้ใช้ชอบมากที่สุด',
                'แสดงรายชื่อหนังสือที่มีคะแนนความเหมาะสมสูงสุด',
            ),
            'distractors' => array(
                'สุ่มเลือกหนังสือ 1 เล่มโดยไม่ดูหมวดหมู่',
            ),
            'keywords_core' => array('น้ำหนัก', 'weight', 'คะแนน', 'อันดับ', 'ล่าสุด', 'เรตติ้ง', 'rating', 'tie', 'เท่ากัน', 'หมวดหมู่', 'ความถี่', 'ผู้ใช้', 'นิยม', 'hamming'),
            'hint_seq' => 'ลำดับต้องเริ่มจากรับเวกเตอร์ 0/1 -> คำนวณ Hamming Distance -> ถ่วงน้ำหนักหมวดที่ชอบ -> แสดงผลลัพธ์',
            'hint_subj' => 'ควรเสนอเกณฑ์ Tie-breaker ที่เป็นระบบ เช่น คะแนนรีวิวเฉลี่ย, จำนวนคนยืม, ความใหม่ของหนังสือ หรือน้ำหนักความชอบรอง',
        ),
        'house' => array(
            'label' => '03 บ้านตามพิกัด',
            'pillar' => 'Abstraction',
            'expected_seq' => array(
                'RECT 2 1 11 6 (วาดตัวบ้านหลัก)',
                'LINE 1 6 6.5 9 (วาดหลังคาด้านซ้าย)',
                'LINE 6.5 9 12 6 (วาดหลังคาด้านขวา)',
                'RECT 3 3 5 5 (วาดหน้าต่างบานที่ 1 ไม่ทับประตู)',
                'ตรวจสอบพิกัดทุกจุดให้อยู่ในช่วง x∈[0,14], y∈[0,10]',
            ),
            'distractors' => array(
                'RECT 12 8 18 12 (วาดรั้วออกนอกขอบเขตกริด)',
            ),
            'keywords_core' => array('rect', 'line', 'x', 'y', '14', '10', 'พิกัด', 'ขอบเขต', 'หลังคา', 'ปล่องไฟ', '6.5', '12', '9', 'ไม่เกิน', 'ทับ', 'กริด'),
            'hint_seq' => 'ต้องตัดคำสั่ง RECT 12 8 18 12 ที่หลุดขอบเขตกริด (x>14, y>10) ออก และเรียงวาดตัวบ้าน หลังคา หน้าต่าง แล้วตรวจขอบเขต',
            'hint_subj' => 'ควรระบุพิกัด RECT บนหลังคาฝั่งขวา (ช่วง x ประมาณ 8–10, y ประมาณ 7–9.5) พร้อมระบุเงื่อนไขตรวจ 0 <= x <= 14 และ 0 <= y <= 10',
        ),
        'routes' => array(
            'label' => '04 ไปให้ครบทุกที่',
            'pillar' => 'Abstraction',
            'expected_seq' => array(
                'ตัดเส้นทาง A–B ออกจากกราฟเพราะปิดซ่อม',
                'เริ่มต้นเดินทางจากจุด A ไปยังจุด C',
                'คำนวณระยะทางรวมของเส้นทางที่เป็นไปได้ทั้งหมด',
                'เลือกเส้นทางที่ผ่าน C ก่อน D และมีระยะทางรวมน้อยที่สุด',
            ),
            'distractors' => array(
                'เลือกเดินทาง A → B → D → C เพื่อประหยัดเวลา',
            ),
            'keywords_core' => array('ปิดซ่อม', 'a–b', 'a-b', 'ตัด', 'เส้นทาง', 'ไม่ได้', 'กราฟ', 'ผิด', 'ผ่าน', 'ระยะทาง', 'เงื่อนไข', 'สั้นที่สุด', 'ข้อจำกัด'),
            'hint_seq' => 'ต้องตัดเส้นทาง A–B ที่ปิดซ่อมออกก่อน จากนั้นเริ่มจาก A ไป C แล้วเปรียบเทียบระยะทางเพื่อเลือกเส้นทางสั้นที่สุด',
            'hint_subj' => 'ควรอธิบายว่าการตัดเส้นที่ปิดซ่อมช่วยลดสถานะที่เป็นไปไม่ได้ และป้องกันไม่ให้อัลกอริทึมเลือกเส้นทางที่ใช้จริงไม่ได้',
        ),
        'gcd' => array(
            'label' => '05 หา ห.ร.ม.',
            'pillar' => 'Algorithm Design',
            'expected_seq' => array(
                'รับค่าจำนวนเต็มบวก a และ b (ให้ a ≥ b)',
                'คำนวณเศษจากการหาร r = a mod b',
                'ถ้า r = 0 ให้หยุดและตอบว่า ห.ร.ม. คือ b',
                'ถ้า r ≠ 0 ให้แทนค่า a ← b และ b ← r แล้ววนซ้ำ',
            ),
            'distractors' => array(
                'นำ a คูณ b เพื่อหาคำตอบทันที',
            ),
            'keywords_core' => array('ฟีโบนัชชี', 'fibonacci', 'เศษ', 'mod', 'หาร', 'ช้า', 'หลายรอบ', 'วนซ้ำ', '1', 'ครั้งเดียว', 'ลดลง', 'ใกล้เคียง', 'worst'),
            'hint_seq' => 'ขั้นตอนวิธีของยูคลิดเริ่มจากรับ a >= b -> หาเศษ r = a mod b -> ตรวจเงื่อนไขหยุด r = 0 -> มิฉะนั้นสลับค่าและวนซ้ำ',
            'hint_subj' => 'ควรอธิบายว่า (1000000, 999999) ได้เศษ 1 ในรอบแรกและจบใน 2 รอบ ส่วนคู่ฟีโบนัชชีลดลงช้าที่สุดตามลำดับถอยหลัง (Worst Case)',
        ),
        'decomposition' => array(
            'label' => '06 การย่อยปัญหา',
            'pillar' => 'Decomposition',
            'expected_seq' => array(
                'ระดับที่ 1: กำหนดเป้าหมายระบบยืม-คืนอุปกรณ์ทั้งหมด',
                'ระดับที่ 2: แบ่งเป็น 3 ส่วนย่อย (ลงทะเบียน, ตรวจสต็อก, แจ้งเตือนคืน)',
                'ระดับที่ 3: ระบุ Input/Process/Output ของแต่ละส่วนย่อย',
                'ทดสอบการทำงานทีละส่วนย่อยแล้วนำมารวมกัน',
            ),
            'distractors' => array(
                'ซื้ออุปกรณ์ใหม่ทั้งหมดโดยไม่จัดทำทะเบียน',
            ),
            'keywords_core' => array('input', 'process', 'output', 'วันครบกำหนด', 'กำหนดคืน', 'เปรียบเทียบ', 'แจ้งเตือน', 'ข้อมูล', 'ผู้ยืม', 'เวลา', 'ข้อความ', 'สถานะ', 'อุปกรณ์'),
            'hint_seq' => 'การย่อยปัญหาแบบ Top-Down ต้องเริ่มจากระดับ 1 (เป้าหมายรวม) -> ระดับ 2 (ส่วนย่อย) -> ระดับ 3 (IPO) -> ทดสอบและรวมระบบ',
            'hint_subj' => 'ควรระบุครบทั้ง 3 องค์ประกอบ: Input (วันที่ปัจจุบัน, กำหนดคืน, ชื่อผู้ยืม), Process (เทียบวันที่เลยกำหนด) และ Output (ข้อความแจ้งเตือน)',
        ),
        'searching' => array(
            'label' => '07 การค้นหาข้อมูล',
            'pillar' => 'Pattern Recognition',
            'expected_seq' => array(
                'ตรวจสอบว่าข้อมูลเรียงลำดับแล้วหรือไม่ (ถ้ายังให้ Sort ก่อน)',
                'กำหนดขอบเขตซ้าย (low) และขวา (high)',
                'คำนวณตำแหน่งกึ่งกลาง mid = ⌊(low + high) / 2⌋',
                'เปรียบเทียบค่าที่ mid กับเป้าหมาย แล้วตัดครึ่งที่ไม่ใช่ออก',
            ),
            'distractors' => array(
                'เปิดตรวจทีละตัวตั้งแต่ตัวแรกจนครบ 1,000,000 ตัว',
            ),
            'keywords_core' => array('linear', '1 ครั้ง', 'ครั้งเดียว', 'sort', 'เรียง', 'o(n)', 'log', 'ประหยัด', 'คุ้มค่า', 'ไม่ต้องเรียง', 'เวลา', 'ต้นทุน'),
            'hint_seq' => 'Binary Search ต้องตรวจสอบว่าเรียงข้อมูลแล้วก่อน จึงกำหนด low/high -> หา mid -> เปรียบเทียบและตัดครึ่งที่ไม่ใช่ทิ้ง',
            'hint_subj' => 'ควรตอบว่าเลือก Linear Search สำหรับค้นหาครั้งเดียวบนข้อมูลไม่เรียง เพราะต้นทุนการ Sort (O(n log n)) สูงกว่าการกวาดหาครั้งเดียว (O(n))',
        ),
        'algorithms' => array(
            'label' => '08 ออกแบบขั้นตอนวิธี',
            'pillar' => 'Algorithm Design',
            'expected_seq' => array(
                'อ่านค่า WaterLevel, ความชื้น H, เวลา และอุณหภูมิ T',
                'ถ้า WaterLevel == 0 ให้หยุดปั๊มน้ำและแจ้งเตือนทันที',
                'ถ้า H < 0.15 และ (นอกเวลา 11:00–14:00 หรือ T < 35) ให้เปิดน้ำ',
                'มิฉะนั้น ให้ปิดปั๊มน้ำ',
            ),
            'distractors' => array(
                'เปิดปั๊มน้ำทิ้งไว้ตลอดเวลาโดยไม่เช็ก WaterLevel',
            ),
            'keywords_core' => array('ปั๊ม', 'เสียหาย', 'ไหม้', 'ไม่มีน้ำ', 'แห้ง', 'ปลอดภัย', 'waterlevel', 'ก่อน', 'หยุด', 'เตือน', 'ลำดับ', 'รันแห้ง'),
            'hint_seq' => 'ต้องอ่านค่าเซนเซอร์ก่อน แล้วตรวจสอบความปลอดภัย (WaterLevel == 0) ก่อนเงื่อนไขความชื้นและเวลาเสมอ',
            'hint_subj' => 'ควรอธิบายว่าการเช็ก WaterLevel == 0 ก่อนช่วยป้องกันปั๊มน้ำทำงานขณะไม่มีน้ำ (Dry Run) ซึ่งทำให้ปั๊มเสียหายหรือไหม้ได้',
        ),
        'flowcharts' => array(
            'label' => '09 เกมเรียงผังงาน',
            'pillar' => 'Algorithm Design',
            'expected_seq' => array(
                '[วงรี] เริ่มต้น',
                '[สี่เหลี่ยม] วัดอุณหภูมิร่างกาย (T)',
                '[ข้าวหลามตัด] ค่า T คลาดเคลื่อน/ผิดปกติหรือไม่?',
                '[สี่เหลี่ยม] ถ้าปกติ: บันทึกผลลงฐานข้อมูลและอนุญาตเข้าสอบ',
                '[วงรี] จบการทำงาน',
            ),
            'distractors' => array(
                '[สี่เหลี่ยม] ปล่อยเข้าห้องสอบโดยไม่ต้องวัดอุณหภูมิ',
            ),
            'keywords_core' => array('วัดอุณหภูมิ', 'วัดซ้ำ', 'สี่เหลี่ยม', 'ขั้นตอน', 'วนกลับ', 'loop', 't', 'ตรวจสอบ', 'ซ้ำ', 'เริ่มต้นใหม่'),
            'hint_seq' => 'ผังงานต้องเริ่มจาก [วงรี] เริ่มต้น -> รับ/วัดค่า T -> ตัดสินใจ [ข้าวหลามตัด] -> บันทึกผล -> [วงรี] จบการทำงาน และตัดบล็อกที่ไม่วัดออก',
            'hint_subj' => 'ควรระบุชัดเจนว่าลูกศรต้องวนกลับไปที่ขั้นตอน "[สี่เหลี่ยม] วัดอุณหภูมิร่างกาย (T)" เพื่อวัดค่าซ้ำ',
        ),
    );
}

/**
 * ประเมินคะแนนรายโมดูล (01-09) ด้วย AI Multi-Rubric:
 *  - simulation (40 คะแนน)
 *  - sequencing (35 คะแนน)
 *  - subjective (25 คะแนน)
 */
function ai_evaluate_module($modKey, $completed, $attempts, $snapshot, $studentNote = '')
{
    $rubrics = get_ai_module_rubrics();
    if (!isset($rubrics[$modKey])) {
        return null;
    }
    $r = $rubrics[$modKey];

    // 1. Simulation Mastery (0..40)
    $simScore = 0.0;
    $isDone = !empty($completed[$modKey]);
    $att = isset($attempts[$modKey]) ? (int)$attempts[$modKey] : 0;
    $simDetail = '';

    if ($isDone) {
        $simScore = 35.0;
        if ($att <= 2) {
            $simScore += 5.0;
            $simDetail = 'ผ่านห้องจำลองด้วยความแม่นยำสูง';
        } elseif ($att <= 5) {
            $simScore += 3.0;
            $simDetail = 'ผ่านห้องจำลองได้ดี';
        } else {
            $simScore += 1.0;
            $simDetail = 'ผ่านห้องจำลองหลังทดลองหลายรอบ';
        }
    } else {
        // ตรวจหลักฐานความพยายามใน snapshot สำหรับบางโมดูล
        if ($modKey === 'house' && !empty($snapshot['house_code'])) {
            $code = strtoupper((string)$snapshot['house_code']);
            if (strpos($code, 'RECT') !== false && strpos($code, 'LINE') !== false) {
                $simScore = 18.0;
                $simDetail = 'พบโค้ดวาดบ้านในพื้นที่ทดลอง แต่ยังไม่กดยืนยันผ่านกิจกรรม';
            }
        } elseif ($modKey === 'gcd' && !empty($snapshot['gcd_inputs']) && is_array($snapshot['gcd_inputs'])) {
            if ((string)$snapshot['gcd_inputs'][0] !== '' && (string)$snapshot['gcd_inputs'][1] !== '') {
                $simScore = 10.0;
                $simDetail = 'มีการทดลองป้อนค่าตัวเลข แต่ยังไม่เสร็จสิ้นขั้นตอน';
            }
        }
        if ($simScore === 0.0) {
            $simDetail = 'ยังไม่ผ่านกิจกรรมจำลองในโมดูลนี้';
        }
    }

    // 2. Block Sequencing / Parsons Problem (0..35)
    $semiEntry = (isset($snapshot['semi_answers'][$modKey]) && is_array($snapshot['semi_answers'][$modKey]))
        ? $snapshot['semi_answers'][$modKey]
        : array();
    $seq = (isset($semiEntry['seq']) && is_array($semiEntry['seq'])) ? $semiEntry['seq'] : array();
    $expected = $r['expected_seq'];
    $distractors = $r['distractors'];

    $seqScore = 0.0;
    $foundDistractors = array();
    $cleanSeq = array();
    foreach ($seq as $item) {
        $itemStr = trim((string)$item);
        if ($itemStr === '') continue;
        if (in_array($itemStr, $distractors, true)) {
            $foundDistractors[] = $itemStr;
        } else {
            $cleanSeq[] = $itemStr;
        }
    }

    $seqNotes = array();
    if (count($seq) === 0) {
        $seqNotes[] = 'ยังไม่ได้จัดลำดับบล็อกในส่วนท้าทายกึ่งโครงสร้าง';
    } else {
        // คัดกรองตัวลวงออก (10 คะแนน)
        if (count($foundDistractors) === 0 && count($cleanSeq) >= max(2, count($expected) - 1)) {
            $seqScore += 10.0;
        } elseif (count($foundDistractors) === 0) {
            $seqScore += 5.0;
        } else {
            $seqScore += max(0.0, 4.0 - (count($foundDistractors) * 2.0));
            $seqNotes[] = 'เลือกบล็อกตัวลวงเข้ามา (' . implode(', ', $foundDistractors) . ')';
        }

        // ความครบถ้วนของบล็อกที่ถูกต้อง (10 คะแนน)
        $matchedCount = 0;
        foreach ($expected as $expItem) {
            if (in_array($expItem, $cleanSeq, true)) {
                $matchedCount++;
            }
        }
        $coverageScore = (count($expected) > 0) ? (10.0 * ($matchedCount / count($expected))) : 0.0;
        $seqScore += $coverageScore;

        // ความถูกต้องของลำดับ LCS (15 คะแนน)
        $lcs = ai_lcs_length($cleanSeq, $expected);
        $orderScore = (count($expected) > 0) ? (15.0 * ($lcs / count($expected))) : 0.0;
        $seqScore += $orderScore;

        if ($lcs === count($expected) && count($foundDistractors) === 0 && count($cleanSeq) === count($expected)) {
            $seqNotes[] = 'เรียงลำดับขั้นตอนได้ถูกต้องสมบูรณ์และคัดบล็อกลวงออกครบถ้วน';
        } elseif ($lcs < count($expected)) {
            $seqNotes[] = 'ลำดับหรือความครบถ้วนของบล็อกตรง ' . $lcs . '/' . count($expected) . ' ขั้นตอน (' . $r['hint_seq'] . ')';
        }
    }

    // 3. Subjective Reasoning (0..25)
    $notePieces = array();
    if (!empty($semiEntry['note'])) {
        $notePieces[] = trim((string)$semiEntry['note']);
    }
    if (!empty($snapshot['subjective_answers'][$modKey])) {
        $notePieces[] = trim((string)$snapshot['subjective_answers'][$modKey]);
    }
    if (trim((string)$studentNote) !== '') {
        $notePieces[] = trim((string)$studentNote);
    }
    $combinedText = trim(implode(' ', $notePieces));

    $subjScore = 0.0;
    $subjNotes = array();
    $textLen = ai_len($combinedText);

    if ($textLen === 0) {
        $subjNotes[] = 'ยังไม่มีคำอธิบายเหตุผลอัตนัย (' . $r['hint_subj'] . ')';
    } else {
        // คะแนนความสมบูรณ์ของคำอธิบาย (0..8)
        if ($textLen >= 60) {
            $subjScore += 8.0;
        } elseif ($textLen >= 25) {
            $subjScore += 5.5;
        } elseif ($textLen >= 10) {
            $subjScore += 3.0;
        } else {
            $subjScore += 1.0;
        }

        // คะแนนคำสำคัญเชิงมโนทัศน์ของโมดูล (0..12)
        $matchedKw = array();
        foreach ($r['keywords_core'] as $kw) {
            if (ai_contains($combinedText, $kw)) {
                $matchedKw[] = $kw;
            }
        }
        $kwHits = count($matchedKw);
        $kwPts = min(12.0, $kwHits * 3.5);
        $subjScore += $kwPts;

        // คะแนนคำเชื่อมเหตุผลเชิงตรรกะ (0..5)
        $logicWords = array('เพราะ', 'เนื่องจาก', 'ดังนั้น', 'ถ้า', 'เพื่อ', 'เงื่อนไข', 'วนซ้ำ', 'มิฉะนั้น', 'ส่งผล', 'ป้องกัน', 'ช่วย');
        $logicHits = 0;
        foreach ($logicWords as $lw) {
            if (ai_contains($combinedText, $lw)) {
                $logicHits++;
            }
        }
        $subjScore += min(5.0, $logicHits * 2.0);

        if ($subjScore >= 20.0) {
            $subjNotes[] = 'คำอธิบายเหตุผลครอบคลุมมโนทัศน์หลัก (' . implode(', ', array_slice($matchedKw, 0, 4)) . ')';
        } elseif ($subjScore >= 12.0) {
            $subjNotes[] = 'อธิบายแนวคิดได้ตรงประเด็นบางส่วน ควรขยายความเพิ่มเติม: ' . $r['hint_subj'];
        } else {
            $subjNotes[] = 'คำอธิบายยังสั้นหรือขาดคำสำคัญเชิงเทคนิค: ' . $r['hint_subj'];
        }
    }

    $simScore = round(min(40.0, $simScore), 1);
    $seqScore = round(min(35.0, $seqScore), 1);
    $subjScore = round(min(25.0, $subjScore), 1);
    $total = round(min(100.0, $simScore + $seqScore + $subjScore), 2);

    return array(
        'module_id' => $modKey,
        'label' => $r['label'],
        'pillar' => $r['pillar'],
        'total' => $total,
        'rubric' => array(
            'simulation' => $simScore,
            'sequencing' => $seqScore,
            'subjective' => $subjScore,
        ),
        'completed' => $isDone,
        'has_semi_seq' => count($seq) > 0,
        'has_subjective' => $textLen > 0,
        'distractor_hits' => $foundDistractors,
        'details' => array(
            'sim' => $simDetail,
            'seq' => implode(' ', $seqNotes),
            'subj' => implode(' ', $subjNotes),
        ),
    );
}

function ai_grade_challenge10($detail, $bank, $studentNote = '', $answers = array())
{
    $totalQ = count($bank);
    $correctCount = 0;
    $wrongTopics = array();
    $rightTopics = array();
    $pillarScores = array(
        'Decomposition' => array('sum' => 0, 'cnt' => 0),
        'Pattern Recognition' => array('sum' => 0, 'cnt' => 0),
        'Abstraction' => array('sum' => 0, 'cnt' => 0),
        'Algorithm Design' => array('sum' => 0, 'cnt' => 0),
    );

    foreach ($bank as $idx => $q) {
        $qid = $q['id'];
        $isCorrect = false;
        if (isset($detail[$qid]['correct'])) {
            $isCorrect = (bool)$detail[$qid]['correct'];
        } elseif (isset($answers[$qid])) {
            $isCorrect = (trim((string)$answers[$qid]) === $q['answer']);
        }
        if ($isCorrect) {
            $correctCount++;
            $rightTopics[] = 'ข้อ ' . ($idx + 1) . ' (' . $q['topic'] . ')';
        } else {
            $wrongTopics[] = 'ข้อ ' . ($idx + 1) . ' ' . $q['topic'] . ': ' . $q['explanation'];
        }

        // แมปหัวข้อเข้ากับ 4 เสาหลัก CT
        $topicStr = (string)$q['topic'];
        $pillar = 'Algorithm Design';
        if (strpos($topicStr, 'Decomposition') !== false) $pillar = 'Decomposition';
        elseif (strpos($topicStr, 'Pattern') !== false) $pillar = 'Pattern Recognition';
        elseif (strpos($topicStr, 'Abstraction') !== false) $pillar = 'Abstraction';
        $pillarScores[$pillar]['sum'] += ($isCorrect ? 100.0 : 0.0);
        $pillarScores[$pillar]['cnt']++;
    }

    $quizScore = $totalQ > 0 ? round(($correctCount / $totalQ) * 90.0, 2) : 0.0;
    $noteBonus = 0.0;
    $noteLen = ai_len($studentNote);
    if ($noteLen >= 30) {
        $noteBonus = 10.0;
    } elseif ($noteLen >= 10) {
        $noteBonus = 6.0;
    } elseif ($noteLen > 0) {
        $noteBonus = 3.0;
    } else {
        // ถ้าไม่เขียนบันทึกเพิ่มเติม ให้ปรับสเกลเป็น 100% จากคะแนนปรนัยเพื่อความเป็นธรรม
        $quizScore = $totalQ > 0 ? round(($correctCount / $totalQ) * 100.0, 2) : 0.0;
    }

    $finalScore = round(min(100.0, $quizScore + $noteBonus), 2);

    $fbLines = array();
    $fbLines[] = "🤖 สรุปผลประเมินกิจกรรมที่ 10: ถูกต้อง $correctCount / $totalQ ข้อ (คะแนนรวม AI: $finalScore/100)";
    if (count($rightTopics) > 0) {
        $fbLines[] = "✅ หัวข้อที่เข้าใจถูกต้อง: " . implode(', ', $rightTopics);
    }
    if (count($wrongTopics) > 0) {
        $fbLines[] = "💡 แนวคิดที่ควรทบทวนเพิ่มเติม:";
        foreach ($wrongTopics as $wt) {
            $fbLines[] = "  • " . $wt;
        }
    } else {
        $fbLines[] = "🌟 ยอดเยี่ยม! ตอบถูกครบทุกหัวข้อของแนวคิดเชิงคำนวณ";
    }
    if ($noteLen > 0) {
        $fbLines[] = "📝 คะแนนเสริมการสะท้อนคิดจากบันทึกผู้เรียน: +$noteBonus/10";
    }

    // สร้าง Feedback แบบไม่บอกเฉลย A/B/C/D ตรงๆ สำหรับแจ้งนักศึกษาทันที
    $studentSafeFeedback = "🤖 AI วิเคราะห์ผลกิจกรรมที่ 10 เบื้องต้น: ผ่านเกณฑ์ $correctCount/$totalQ หัวข้อ (" . round(($correctCount / max(1, $totalQ)) * 100) . "%)";
    if (count($wrongTopics) > 0) {
        $studentSafeFeedback .= " — แนะนำให้ทบทวนแนวคิดเรื่อง " . count($wrongTopics) . " หัวข้อที่ยังมีจุดคลาดเคลื่อนในส่วนประวัติผลตรวจ";
    } else {
        $studentSafeFeedback .= " — ความเข้าใจครอบคลุมทั้ง 4 เสาหลักแนวคิดเชิงคำนวณ!";
    }

    $rubric = array(
        'simulation' => round(($correctCount / max(1, $totalQ)) * 40.0, 1),
        'sequencing' => round(($correctCount / max(1, $totalQ)) * 35.0, 1),
        'subjective' => $noteLen > 0 ? round(15.0 + $noteBonus, 1) : round(($correctCount / max(1, $totalQ)) * 25.0, 1),
        'correct_count' => $correctCount,
        'total_questions' => $totalQ,
        'pillar_scores' => $pillarScores,
    );

    return array(
        'score' => $finalScore,
        'rubric' => $rubric,
        'feedback' => implode("\n", $fbLines),
        'student_safe_feedback' => $studentSafeFeedback,
        'model' => 'CT-Lab Hybrid AI v4.0',
    );
}

function ai_try_llm_polish($contextText, $baseFeedback, $cfg)
{
    $provider = isset($cfg['provider']) ? $cfg['provider'] : 'hybrid_local';
    if ($provider === 'hybrid_local') {
        return array('feedback' => $baseFeedback, 'model' => 'CT-Lab Hybrid AI v4.0');
    }

    $prompt = "คุณคือผู้ช่วยอาจารย์วิชาวิทยาการคำนวณ จงสรุปข้อเสนอแนะให้นักศึกษาอย่างสร้างสรรค์ กระชับ 2-3 ประโยค เป็นภาษาไทย จากข้อมูลการตรวจต่อไปนี้:\n" . $contextText . "\nผลตรวจหลัก:\n" . $baseFeedback;

    if ($provider === 'gemini' && !empty($cfg['gemini_api_key'])) {
        $model = !empty($cfg['gemini_model']) ? $cfg['gemini_model'] : 'gemini-2.5-flash';
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . urlencode($model) . ':generateContent?key=' . urlencode($cfg['gemini_api_key']);
        $body = json_encode(array(
            'contents' => array(
                array('parts' => array(array('text' => $prompt)))
            ),
            'generationConfig' => array('temperature' => 0.3, 'maxOutputTokens' => 280),
        ));
        $ctx = stream_context_create(array(
            'http' => array(
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\n",
                'content' => $body,
                'timeout' => 5,
                'ignore_errors' => true,
            ),
        ));
        $resp = @file_get_contents($url, false, $ctx);
        if ($resp !== false) {
            $dec = @json_decode($resp, true);
            if (isset($dec['candidates'][0]['content']['parts'][0]['text'])) {
                $aiTxt = trim((string)$dec['candidates'][0]['content']['parts'][0]['text']);
                if ($aiTxt !== '') {
                    return array(
                        'feedback' => $baseFeedback . "\n\n✨ คำแนะนำเพิ่มเติมจาก Gemini:\n" . $aiTxt,
                        'model' => 'Gemini (' . $model . ') + Rubric Engine',
                    );
                }
            }
        }
    }

    if ($provider === 'ollama' && !empty($cfg['ollama_url'])) {
        $model = !empty($cfg['ollama_model']) ? $cfg['ollama_model'] : 'llama3.2';
        $url = rtrim($cfg['ollama_url'], '/') . '/api/generate';
        $body = json_encode(array(
            'model' => $model,
            'prompt' => $prompt,
            'stream' => false,
        ));
        $ctx = stream_context_create(array(
            'http' => array(
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\n",
                'content' => $body,
                'timeout' => 5,
                'ignore_errors' => true,
            ),
        ));
        $resp = @file_get_contents($url, false, $ctx);
        if ($resp !== false) {
            $dec = @json_decode($resp, true);
            if (!empty($dec['response'])) {
                return array(
                    'feedback' => $baseFeedback . "\n\n🦙 คำแนะนำเพิ่มเติมจาก Ollama:\n" . trim((string)$dec['response']),
                    'model' => 'Ollama (' . $model . ') + Rubric Engine',
                );
            }
        }
    }

    return array('feedback' => $baseFeedback, 'model' => 'CT-Lab Hybrid AI v4.0');
}

/**
 * ฟังก์ชันหลักสำหรับตรวจงาน Submission ทั้งแบบรายโมดูล, ภาพรวมทั้งหมด ('all'), และ Challenge 10
 */
function ai_grade_submission_payload($moduleId, $completed, $attempts, $snapshot, $studentNote = '', $extraPayload = array())
{
    $cfg = get_ai_config();

    if ($moduleId === 'challenge10' || $moduleId === 'challenge') {
        require_once __DIR__ . '/challenge.php';
        $bank = get_challenge_bank();
        $detail = isset($extraPayload['grading_detail']) && is_array($extraPayload['grading_detail'])
            ? $extraPayload['grading_detail']
            : array();
        $answers = isset($extraPayload['answers']) && is_array($extraPayload['answers'])
            ? $extraPayload['answers']
            : array();
        return ai_grade_challenge10($detail, $bank, $studentNote, $answers);
    }

    $rubrics = get_ai_module_rubrics();
    $validModules = array_keys($rubrics);

    if ($moduleId !== 'all' && isset($rubrics[$moduleId])) {
        $ev = ai_evaluate_module($moduleId, $completed, $attempts, $snapshot, $studentNote);
        $fb = array();
        $fb[] = "🤖 AI ตรวจงานโมดูล {$ev['label']} · คะแนนรวม {$ev['total']}/100";
        $fb[] = "📊 เกณฑ์ย่อย: ห้องจำลอง {$ev['rubric']['simulation']}/40 · จัดบล็อก {$ev['rubric']['sequencing']}/35 · เหตุผลอัตนัย {$ev['rubric']['subjective']}/25";
        $fb[] = "• กิจกรรมจำลอง: " . $ev['details']['sim'];
        $fb[] = "• การจัดลำดับบล็อก: " . $ev['details']['seq'];
        $fb[] = "• คำตอบอัตนัย: " . $ev['details']['subj'];
        $baseFeedback = implode("\n", $fb);

        $polished = ai_try_llm_polish("Module: $moduleId, Score: {$ev['total']}", $baseFeedback, $cfg);

        return array(
            'score' => $ev['total'],
            'rubric' => array(
                'mode' => 'single_module',
                'module_id' => $moduleId,
                'pillar' => $ev['pillar'],
                'simulation' => $ev['rubric']['simulation'],
                'sequencing' => $ev['rubric']['sequencing'],
                'subjective' => $ev['rubric']['subjective'],
                'modules' => array($moduleId => $ev),
            ),
            'feedback' => $polished['feedback'],
            'model' => $polished['model'],
        );
    }

    // กรณีส่งภาพรวมทั้งหมด ('all')
    $evals = array();
    $simSum = 0.0;
    $seqSum = 0.0;
    $subjSum = 0.0;
    $completedCnt = 0;
    $semiDoneCnt = 0;
    $strengths = array();
    $improvements = array();

    foreach ($validModules as $m) {
        // สำหรับโหมด all: ให้ student_note ของฟอร์มหลักช่วยประเมินเฉพาะถ้ายังไม่มีคำตอบรายโมดูล
        $ev = ai_evaluate_module($m, $completed, $attempts, $snapshot, '');
        $evals[$m] = $ev;
        $simSum += $ev['rubric']['simulation'];
        $seqSum += $ev['rubric']['sequencing'];
        $subjSum += $ev['rubric']['subjective'];

        if ($ev['completed']) {
            $completedCnt++;
        }
        if ($ev['has_semi_seq'] || $ev['has_subjective']) {
            $semiDoneCnt++;
        }

        if ($ev['total'] >= 80) {
            $strengths[] = $ev['label'] . " ({$ev['total']}%)";
        } elseif (!$ev['completed'] || $ev['total'] < 40) {
            $improvements[] = $ev['label'];
        }
    }

    $nMods = count($validModules);
    $avgSim = round($simSum / $nMods, 1);   // out of 40
    $avgSeq = round($seqSum / $nMods, 1);   // out of 35
    $avgSubj = round($subjSum / $nMods, 1); // out of 25

    // โบนัสกรณีนักศึกษากรอกบันทึกสรุปแนวคิดภาพรวมท้ายฟอร์ม (ไม่เกิน +5 คะแนน)
    $noteLen = ai_len($studentNote);
    $noteBonus = 0.0;
    if ($noteLen >= 30) {
        $noteBonus = 5.0;
    } elseif ($noteLen >= 10) {
        $noteBonus = 2.5;
    }

    $overallScore = round(min(100.0, $avgSim + $avgSeq + $avgSubj + $noteBonus), 2);

    $fb = array();
    $fb[] = "🤖 AI ประเมินภาพรวมทั้งหมด (9 โมดูล) · คะแนนรวม $overallScore/100";
    $fb[] = "📊 เกณฑ์เฉลี่ย: ห้องจำลอง $avgSim/40 · จัดบล็อก $avgSeq/35 · เหตุผลอัตนัย $avgSubj/25" . ($noteBonus > 0 ? " (+สรุปแนวคิด $noteBonus)" : '');
    $fb[] = "• ความครบถ้วน: ผ่านห้องจำลอง $completedCnt/$nMods โมดูล · ทำแบบฝึกกึ่งอัตนัย $semiDoneCnt/$nMods โมดูล";
    if (count($strengths) > 0) {
        $fb[] = "✅ จุดเด่น: " . implode(', ', array_slice($strengths, 0, 4));
    }
    if (count($improvements) > 0) {
        $fb[] = "💡 ควรทำเพิ่มเติม/ทบทวน: " . implode(', ', array_slice($improvements, 0, 5));
    } else {
        $fb[] = "🌟 ครบถ้วนทุกโมดูลและมีเหตุผลรองรับอย่างเป็นระบบ";
    }

    $baseFeedback = implode("\n", $fb);
    $polished = ai_try_llm_polish("All modules completed: $completedCnt/$nMods, Score: $overallScore", $baseFeedback, $cfg);

    return array(
        'score' => $overallScore,
        'rubric' => array(
            'mode' => 'all_modules',
            'simulation' => $avgSim,
            'sequencing' => $avgSeq,
            'subjective' => min(25.0, round($avgSubj + $noteBonus, 1)),
            'completed_modules' => $completedCnt,
            'semi_completed_modules' => $semiDoneCnt,
            'modules' => $evals,
        ),
        'feedback' => $polished['feedback'],
        'model' => $polished['model'],
    );
}

/**
 * ตรวจงานที่มีอยู่แล้วในตาราง ctlab_submissions ด้วย AI แล้วบันทึกลงฐานข้อมูล
 */
function ai_grade_existing_submission($pdo, $submissionRow, $applyToTeacher = true)
{
    $cfg = get_ai_config();
    $payload = @json_decode((string)$submissionRow['payload_json'], true);
    if (!is_array($payload)) {
        $payload = array();
    }

    $moduleId = isset($submissionRow['module_id']) ? (string)$submissionRow['module_id'] : 'all';
    $completed = isset($payload['completed']) && is_array($payload['completed']) ? $payload['completed'] : array();
    $attempts = isset($payload['attempts']) && is_array($payload['attempts']) ? $payload['attempts'] : array();
    $snapshot = isset($payload['snapshot']) && is_array($payload['snapshot']) ? $payload['snapshot'] : array();
    $studentNote = isset($submissionRow['student_note']) ? (string)$submissionRow['student_note'] : '';

    $res = ai_grade_submission_payload($moduleId, $completed, $attempts, $snapshot, $studentNote, $payload);
    $rubricJson = json_encode($res['rubric'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $threshold = isset($cfg['resubmit_threshold']) ? (float)$cfg['resubmit_threshold'] : 0.0;
    $targetStatus = ($threshold > 0 && $res['score'] < $threshold) ? 'resubmit' : 'graded';

    if ($applyToTeacher) {
        $stmt = $pdo->prepare('
            UPDATE ctlab_submissions
            SET ai_score = :ai_score,
                ai_rubric_json = :ai_rubric,
                ai_feedback = :ai_feedback,
                ai_model = :ai_model,
                ai_graded_at = CURRENT_TIMESTAMP,
                teacher_score = :t_score,
                teacher_feedback = :t_feedback,
                status = :status,
                graded_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ');
        $stmt->execute(array(
            ':ai_score' => $res['score'],
            ':ai_rubric' => $rubricJson,
            ':ai_feedback' => $res['feedback'],
            ':ai_model' => $res['model'],
            ':t_score' => $res['score'],
            ':t_feedback' => $res['feedback'],
            ':status' => $targetStatus,
            ':id' => (int)$submissionRow['id'],
        ));
    } else {
        $stmt = $pdo->prepare('
            UPDATE ctlab_submissions
            SET ai_score = :ai_score,
                ai_rubric_json = :ai_rubric,
                ai_feedback = :ai_feedback,
                ai_model = :ai_model,
                ai_graded_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ');
        $stmt->execute(array(
            ':ai_score' => $res['score'],
            ':ai_rubric' => $rubricJson,
            ':ai_feedback' => $res['feedback'],
            ':ai_model' => $res['model'],
            ':id' => (int)$submissionRow['id'],
        ));
    }

    $res['status'] = $targetStatus;
    return $res;
}

/**
 * สร้างรายงานวิเคราะห์ผลการเรียนอัตโนมัติระดับชั้นเรียนด้วย AI และบันทึกลงตาราง ctlab_ai_reports
 */
function ai_generate_class_report($pdo, $section = '', $saveToDb = true)
{
    $modLabels = get_ai_module_labels();
    $rubrics = get_ai_module_rubrics();
    $pillarLabels = get_ai_pillar_labels();

    if ($section !== '') {
        $stStmt = $pdo->prepare('SELECT student_id, full_name, section FROM ctlab_students WHERE section = ? ORDER BY student_id ASC');
        $stStmt->execute(array($section));
        $students = $stStmt->fetchAll();
    } else {
        $students = $pdo->query("SELECT student_id, full_name, section FROM ctlab_students WHERE student_id <> 'TEACHER01' ORDER BY student_id ASC")->fetchAll();
    }

    $subRows = $pdo->query('
        SELECT sub.id, sub.student_id, st.full_name, st.section,
               sub.module_id, sub.completed_count, sub.total_modules,
               sub.auto_score, sub.ai_score, sub.ai_rubric_json,
               sub.teacher_score, sub.status, sub.payload_json, sub.submitted_at
        FROM ctlab_submissions sub
        INNER JOIN ctlab_students st ON st.student_id = sub.student_id
        ORDER BY sub.submitted_at DESC, sub.id DESC
    ')->fetchAll();

    $studentMap = array();
    foreach ($students as $st) {
        $studentMap[$st['student_id']] = $st;
    }

    // ตัวแปรสะสมสถิติ
    $studentBestByMod = array();
    $studentLatestScore = array();
    $studentSubCount = array();
    $rubricAccum = array('sim' => 0.0, 'seq' => 0.0, 'subj' => 0.0, 'count' => 0);
    $pillarAccum = array(
        'Decomposition' => array('sum' => 0.0, 'cnt' => 0),
        'Pattern Recognition' => array('sum' => 0.0, 'cnt' => 0),
        'Abstraction' => array('sum' => 0.0, 'cnt' => 0),
        'Algorithm Design' => array('sum' => 0.0, 'cnt' => 0),
    );
    $moduleStats = array();
    foreach ($modLabels as $mk => $ml) {
        $moduleStats[$mk] = array(
            'module_id' => $mk,
            'label' => $ml,
            'pillar' => isset($rubrics[$mk]['pillar']) ? $rubrics[$mk]['pillar'] : 'All 4 Pillars',
            'scores' => array(),
            'distractor_hits' => 0,
            'missing_subj' => 0,
        );
    }

    $totalSubmissionsInScope = 0;
    $gradedCount = 0;
    $pendingCount = 0;
    $resubmitCount = 0;

    foreach ($subRows as $sr) {
        $sid = $sr['student_id'];
        if (!isset($studentMap[$sid])) {
            continue;
        }
        $totalSubmissionsInScope++;
        if ($sr['status'] === 'graded') $gradedCount++;
        elseif ($sr['status'] === 'resubmit') $resubmitCount++;
        else $pendingCount++;

        $effScore = $sr['teacher_score'] !== null
            ? (float)$sr['teacher_score']
            : ($sr['ai_score'] !== null ? (float)$sr['ai_score'] : (float)$sr['auto_score']);

        if (!isset($studentSubCount[$sid])) $studentSubCount[$sid] = 0;
        $studentSubCount[$sid]++;
        if (!isset($studentLatestScore[$sid])) {
            $studentLatestScore[$sid] = $effScore;
        }

        $mod = $sr['module_id'] === 'challenge' ? 'challenge10' : $sr['module_id'];
        $rub = @json_decode((string)$sr['ai_rubric_json'], true);

        if (is_array($rub)) {
            if (isset($rub['simulation'], $rub['sequencing'], $rub['subjective'])) {
                $rubricAccum['sim'] += (float)$rub['simulation'];
                $rubricAccum['seq'] += (float)$rub['sequencing'];
                $rubricAccum['subj'] += (float)$rub['subjective'];
                $rubricAccum['count']++;
            }

            if ($mod === 'all' && isset($rub['modules']) && is_array($rub['modules'])) {
                foreach ($rub['modules'] as $mk => $mev) {
                    if (!isset($moduleStats[$mk])) continue;
                    $mTot = (float)$mev['total'];
                    if (!isset($studentBestByMod[$sid][$mk]) || $mTot > $studentBestByMod[$sid][$mk]) {
                        $studentBestByMod[$sid][$mk] = $mTot;
                    }
                    $moduleStats[$mk]['scores'][] = $mTot;
                    if (!empty($mev['distractor_hits'])) {
                        $moduleStats[$mk]['distractor_hits']++;
                    }
                    if (empty($mev['has_subjective'])) {
                        $moduleStats[$mk]['missing_subj']++;
                    }
                    $pil = isset($mev['pillar']) ? $mev['pillar'] : 'Algorithm Design';
                    if (isset($pillarAccum[$pil])) {
                        $pillarAccum[$pil]['sum'] += $mTot;
                        $pillarAccum[$pil]['cnt']++;
                    }
                }
            } elseif (isset($moduleStats[$mod])) {
                if (!isset($studentBestByMod[$sid][$mod]) || $effScore > $studentBestByMod[$sid][$mod]) {
                    $studentBestByMod[$sid][$mod] = $effScore;
                }
                $moduleStats[$mod]['scores'][] = $effScore;

                if ($mod === 'challenge10' && isset($rub['pillar_scores']) && is_array($rub['pillar_scores'])) {
                    foreach ($rub['pillar_scores'] as $pil => $pData) {
                        if (isset($pillarAccum[$pil]) && !empty($pData['cnt'])) {
                            $pillarAccum[$pil]['sum'] += (float)$pData['sum'];
                            $pillarAccum[$pil]['cnt'] += (int)$pData['cnt'];
                        }
                    }
                } elseif (isset($rub['modules'][$mod])) {
                    $mev = $rub['modules'][$mod];
                    if (!empty($mev['distractor_hits'])) $moduleStats[$mod]['distractor_hits']++;
                    if (empty($mev['has_subjective'])) $moduleStats[$mod]['missing_subj']++;
                    $pil = isset($mev['pillar']) ? $mev['pillar'] : 'Algorithm Design';
                    if (isset($pillarAccum[$pil])) {
                        $pillarAccum[$pil]['sum'] += $effScore;
                        $pillarAccum[$pil]['cnt']++;
                    }
                }
            }
        } elseif (isset($moduleStats[$mod])) {
            if (!isset($studentBestByMod[$sid][$mod]) || $effScore > $studentBestByMod[$sid][$mod]) {
                $studentBestByMod[$sid][$mod] = $effScore;
            }
            $moduleStats[$mod]['scores'][] = $effScore;
            if (isset($rubrics[$mod]['pillar'])) {
                $pil = $rubrics[$mod]['pillar'];
                $pillarAccum[$pil]['sum'] += $effScore;
                $pillarAccum[$pil]['cnt']++;
            }
        }
    }

    // สรุปคะแนนรายนักศึกษา
    $studentScoresList = array();
    $atRiskStudents = array();
    $topPerformers = array();
    $submittedStudentsCount = 0;

    foreach ($students as $st) {
        $sid = $st['student_id'];
        $subCnt = isset($studentSubCount[$sid]) ? $studentSubCount[$sid] : 0;
        $modsDone = isset($studentBestByMod[$sid]) ? $studentBestByMod[$sid] : array();

        if ($subCnt === 0) {
            $atRiskStudents[] = array(
                'student_id' => $sid,
                'full_name' => $st['full_name'],
                'section' => $st['section'],
                'avg_score' => 0.0,
                'completed_modules' => 0,
                'reason' => 'ยังไม่เคยส่งงานเข้าระบบ',
            );
            continue;
        }

        $submittedStudentsCount++;
        if (count($modsDone) > 0) {
            $avgStu = round(array_sum($modsDone) / count($modsDone), 2);
        } else {
            $avgStu = round($studentLatestScore[$sid], 2);
        }
        $studentScoresList[] = $avgStu;

        if ($avgStu < 50.0) {
            $atRiskStudents[] = array(
                'student_id' => $sid,
                'full_name' => $st['full_name'],
                'section' => $st['section'],
                'avg_score' => $avgStu,
                'completed_modules' => count($modsDone),
                'reason' => 'คะแนนเฉลี่ยต่ำกว่าเกณฑ์ 50% ควรทบทวนและส่งแก้ไข',
            );
        } elseif ($avgStu >= 80.0) {
            $topPerformers[] = array(
                'student_id' => $sid,
                'full_name' => $st['full_name'],
                'section' => $st['section'],
                'avg_score' => $avgStu,
                'completed_modules' => count($modsDone),
            );
        }
    }

    // เรียงลำดับ Top Performers จากมากไปน้อย และ At-Risk จากน้อยไปมาก
    usort($topPerformers, function ($a, $b) {
        if ($a['avg_score'] == $b['avg_score']) return 0;
        return ($a['avg_score'] > $b['avg_score']) ? -1 : 1;
    });
    usort($atRiskStudents, function ($a, $b) {
        if ($a['avg_score'] == $b['avg_score']) return 0;
        return ($a['avg_score'] < $b['avg_score']) ? -1 : 1;
    });

    // สถิติชั้นเรียน (Mean, SD, Min, Max)
    $totalStudents = count($students);
    $nSc = count($studentScoresList);
    $meanScore = $nSc > 0 ? round(array_sum($studentScoresList) / $nSc, 2) : 0.0;
    $minScore = $nSc > 0 ? round(min($studentScoresList), 2) : 0.0;
    $maxScore = $nSc > 0 ? round(max($studentScoresList), 2) : 0.0;
    $sdScore = 0.0;
    if ($nSc > 1) {
        $varSum = 0.0;
        foreach ($studentScoresList as $v) {
            $varSum += pow($v - $meanScore, 2);
        }
        $sdScore = round(sqrt($varSum / $nSc), 2);
    }

    $submissionRate = $totalStudents > 0 ? round(($submittedStudentsCount / $totalStudents) * 100, 1) : 0.0;

    // สถิติ 4 เสาหลัก CT
    $pillarsOut = array();
    $weakestPillar = null;
    $strongestPillar = null;
    foreach ($pillarLabels as $pKey => $pThai) {
        $cnt = $pillarAccum[$pKey]['cnt'];
        $avgP = $cnt > 0 ? round($pillarAccum[$pKey]['sum'] / $cnt, 1) : 0.0;
        $pillarsOut[] = array(
            'key' => $pKey,
            'label' => $pThai,
            'avg_score' => $avgP,
            'sample_count' => $cnt,
        );
        if ($cnt > 0) {
            if ($weakestPillar === null || $avgP < $weakestPillar['avg_score']) {
                $weakestPillar = array('label' => $pThai, 'avg_score' => $avgP);
            }
            if ($strongestPillar === null || $avgP > $strongestPillar['avg_score']) {
                $strongestPillar = array('label' => $pThai, 'avg_score' => $avgP);
            }
        }
    }

    // สถิติรายโมดูล
    $modulesOut = array();
    $bottleneckMod = null;
    $bestMod = null;
    foreach ($moduleStats as $mk => $ms) {
        $cnt = count($ms['scores']);
        $avgM = $cnt > 0 ? round(array_sum($ms['scores']) / $cnt, 1) : 0.0;
        $passCnt = 0;
        foreach ($ms['scores'] as $sv) {
            if ($sv >= 50.0) $passCnt++;
        }
        $passRate = $cnt > 0 ? round(($passCnt / $cnt) * 100, 1) : 0.0;
        $rowOut = array(
            'module_id' => $mk,
            'label' => $ms['label'],
            'pillar' => $ms['pillar'],
            'submissions' => $cnt,
            'avg_score' => $avgM,
            'pass_rate' => $passRate,
            'distractor_hits' => $ms['distractor_hits'],
            'missing_subj' => $ms['missing_subj'],
        );
        $modulesOut[] = $rowOut;

        if ($cnt > 0) {
            if ($bottleneckMod === null || $avgM < $bottleneckMod['avg_score']) {
                $bottleneckMod = $rowOut;
            }
            if ($bestMod === null || $avgM > $bestMod['avg_score']) {
                $bestMod = $rowOut;
            }
        }
    }

    $rubricAvg = array(
        'simulation' => $rubricAccum['count'] > 0 ? round($rubricAccum['sim'] / $rubricAccum['count'], 1) : 0.0,
        'sequencing' => $rubricAccum['count'] > 0 ? round($rubricAccum['seq'] / $rubricAccum['count'], 1) : 0.0,
        'subjective' => $rubricAccum['count'] > 0 ? round($rubricAccum['subj'] / $rubricAccum['count'], 1) : 0.0,
    );

    // สร้างบทวิเคราะห์เชิงบรรยายอัตโนมัติ (Executive AI Narrative)
    $scopeText = $section !== '' ? "กลุ่มเรียน $section" : "ทุกกลุ่มเรียนในระบบ";
    $narrLines = array();
    $narrLines[] = "📌 สรุปผลสัมฤทธิ์ทางการเรียน ($scopeText): จากนักศึกษาทั้งหมด $totalStudents คน มีผู้ส่งงานเข้าสู่ฐานข้อมูลแล้ว $submittedStudentsCount คน (คิดเป็น $submissionRate%) รวมการส่งงานทั้งหมด $totalSubmissionsInScope ครั้ง (ตรวจแล้ว $gradedCount ครั้ง, รอตรวจ $pendingCount ครั้ง, ส่งแก้ไข $resubmitCount ครั้ง)";
    if ($nSc > 0) {
        $narrLines[] = "📈 การกระจายคะแนน: คะแนนเฉลี่ยรวม (Mean) อยู่ที่ $meanScore% (S.D. = $sdScore, ต่ำสุด $minScore%, สูงสุด $maxScore%)";
        $narrLines[] = "🧩 โครงสร้างทักษะตาม Rubric เฉลี่ย: ห้องจำลองเสมือน {$rubricAvg['simulation']}/40, การจัดลำดับบล็อก {$rubricAvg['sequencing']}/35, การให้เหตุผลเชิงอัตนัย {$rubricAvg['subjective']}/25";
    } else {
        $narrLines[] = "ℹ️ ยังไม่มีรายการส่งงานที่ผ่านการประเมินในขอบเขตนี้ กรุณาให้นักศึกษาส่งงานหรือกดปุ่ม 'จำลองข้อมูลทดสอบระบบ' เพื่อดูกราฟวิเคราะห์";
    }
    if ($strongestPillar !== null && $weakestPillar !== null) {
        $narrLines[] = "🧠 ทักษะ 4 เสาหลัก CT: จุดแข็งที่สุดคือ {$strongestPillar['label']} (เฉลี่ย {$strongestPillar['avg_score']}%) ขณะที่เสาหลักที่ควรเสริมเพิ่มเติมคือ {$weakestPillar['label']} (เฉลี่ย {$weakestPillar['avg_score']}%)";
    }
    if ($bestMod !== null && $bottleneckMod !== null) {
        $narrLines[] = "⚙️ วิเคราะห์รายกิจกรรม: กิจกรรมที่ทำได้โดดเด่นที่สุดคือ {$bestMod['label']} (เฉลี่ย {$bestMod['avg_score']}%) ส่วนกิจกรรมที่พบจุดติดขัดมากที่สุดคือ {$bottleneckMod['label']} (เฉลี่ย {$bottleneckMod['avg_score']}%, พบการติดบล็อกตัวลวง {$bottleneckMod['distractor_hits']} ครั้ง)";
    }
    if (count($atRiskStudents) > 0) {
        $narrLines[] = "⚠️ ข้อเสนอแนะเชิงรุกสำหรับผู้สอน: พบนักศึกษากลุ่มเสี่ยง/ยังไม่ส่งงานจำนวน " . count($atRiskStudents) . " คน แนะนำให้ติดตามการส่งงานในโมดูลที่ค้าง และจัดการทบทวนเรื่องการคัดกรองเงื่อนไข/บล็อกตัวลวงและการเขียนเหตุผลเชิงเหตุ-ผล (IPO & Edge Cases)";
    } else {
        $narrLines[] = "✅ นักศึกษาทุกคนในกลุ่มเป้าหมายส่งงานและมีคะแนนผ่านเกณฑ์มาตรฐานเรียบร้อยแล้ว";
    }

    $narrativeText = implode("\n\n", $narrLines);

    $summaryPayload = array(
        'scope' => $section !== '' ? $section : 'all',
        'generated_at' => date('Y-m-d H:i:s'),
        'kpi' => array(
            'total_students' => $totalStudents,
            'submitted_students' => $submittedStudentsCount,
            'submission_rate' => $submissionRate,
            'total_submissions' => $totalSubmissionsInScope,
            'graded_count' => $gradedCount,
            'pending_count' => $pendingCount,
            'resubmit_count' => $resubmitCount,
            'mean_score' => $meanScore,
            'sd_score' => $sdScore,
            'min_score' => $minScore,
            'max_score' => $maxScore,
        ),
        'rubric_avg' => $rubricAvg,
        'pillars' => $pillarsOut,
        'modules' => $modulesOut,
        'at_risk' => $atRiskStudents,
        'top_performers' => array_slice($topPerformers, 0, 10),
        'narrative' => $narrativeText,
    );

    $reportId = null;
    if ($saveToDb) {
        $ins = $pdo->prepare('
            INSERT INTO ctlab_ai_reports (
                report_scope, total_students, submitted_students,
                avg_score, summary_json, narrative_text
            ) VALUES (
                :scope, :total_st, :sub_st, :avg_sc, :sum_json, :narr
            )
        ');
        $ins->execute(array(
            ':scope' => $section !== '' ? $section : 'all',
            ':total_st' => $totalStudents,
            ':sub_st' => $submittedStudentsCount,
            ':avg_sc' => $meanScore,
            ':sum_json' => json_encode($summaryPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ':narr' => $narrativeText,
        ));
        $reportId = (int)$pdo->lastInsertId();
    }

    $summaryPayload['report_id'] = $reportId;
    return $summaryPayload;
}

function ai_get_latest_reports($pdo, $limit = 10)
{
    $lim = max(1, min(50, (int)$limit));
    $rows = $pdo->query("
        SELECT id, report_scope, total_students, submitted_students, avg_score, narrative_text, created_at
        FROM ctlab_ai_reports
        ORDER BY created_at DESC, id DESC
        LIMIT $lim
    ")->fetchAll();
    return $rows;
}

/**
 * สร้างข้อมูลการส่งงานจำลองของนักศึกษาในทะเบียนเพื่อให้ผู้สอนทดสอบระบบฐานข้อมูลและรายงาน AI ได้ทันที
 */
function ai_seed_demo_submissions($pdo)
{
    $rubrics = get_ai_module_rubrics();
    $students = $pdo->query("SELECT student_id, full_name, section FROM ctlab_students WHERE student_id <> 'TEACHER01' ORDER BY student_id ASC LIMIT 12")->fetchAll();
    if (count($students) === 0) {
        return array('created' => 0);
    }

    $created = 0;
    foreach ($students as $idx => $st) {
        // ข้ามถ้านักศึกษาคนนี้มีงานส่งแล้ว
        $chk = $pdo->prepare('SELECT COUNT(*) FROM ctlab_submissions WHERE student_id = ?');
        $chk->execute(array($st['student_id']));
        if ((int)$chk->fetchColumn() > 0) {
            continue;
        }

        // สร้างระดับผลการเรียน 3 กลุ่ม: ดีเด่น (0..4), ปานกลาง (5..8), ต้องปรับปรุง (9..11)
        $tier = $idx < 5 ? 'high' : ($idx < 9 ? 'mid' : 'low');

        $completed = array();
        $attempts = array();
        $semiAnswers = array();
        $modKeys = array_keys($rubrics);

        foreach ($modKeys as $mIdx => $mk) {
            $r = $rubrics[$mk];
            if ($tier === 'high') {
                $completed[$mk] = true;
                $attempts[$mk] = 1 + ($mIdx % 2);
                $semiAnswers[$mk] = array(
                    'seq' => $r['expected_seq'],
                    'note' => 'อธิบายเหตุผล: ' . implode(' และ ', array_slice($r['keywords_core'], 0, 4)) . ' เพื่อความปลอดภัยและประสิทธิภาพของขั้นตอนวิธี',
                );
            } elseif ($tier === 'mid') {
                $completed[$mk] = ($mIdx < 7);
                $attempts[$mk] = 3 + ($mIdx % 3);
                $seq = array_slice($r['expected_seq'], 0, 3);
                if ($mIdx === 4 || $mIdx === 7) {
                    $seq[] = $r['distractors'][0];
                }
                $semiAnswers[$mk] = array(
                    'seq' => $seq,
                    'note' => 'เนื่องจาก ' . $r['keywords_core'][0] . ' และ ' . $r['keywords_core'][1],
                );
            } else {
                $completed[$mk] = ($mIdx < 3);
                $attempts[$mk] = 6 + $mIdx;
                if ($mIdx < 3) {
                    $semiAnswers[$mk] = array(
                        'seq' => array($r['expected_seq'][0], $r['distractors'][0]),
                        'note' => 'ลองทำตามขั้นตอน',
                    );
                }
            }
        }

        $snapshot = array(
            'active_page' => 'overview',
            'house_code' => 'RECT 2 1 11 6\nLINE 1 6 6.5 9\nLINE 6.5 9 12 6',
            'gcd_inputs' => array('144', '89'),
            'subjective_answers' => array(),
            'semi_answers' => $semiAnswers,
        );
        $note = $tier === 'high'
            ? 'สรุปภาพรวม: สามารถเชื่อมโยงการย่อยปัญหา การหารูปแบบ และการออกแบบขั้นตอนวิธีได้อย่างเป็นระบบ'
            : ($tier === 'mid' ? 'ส่งงานครบตามกิจกรรมหลัก ยังสับสนบางขั้นตอน' : 'ยังไม่เข้าใจเงื่อนไขวนซ้ำและการเลือกบล็อก');

        $aiRes = ai_grade_submission_payload('all', $completed, $attempts, $snapshot, $note);
        $payload = array(
            'completed' => $completed,
            'attempts' => $attempts,
            'snapshot' => $snapshot,
            'demo_seed' => true,
        );
        $completedCnt = count(array_filter($completed));

        $ins = $pdo->prepare("
            INSERT INTO ctlab_submissions (
                student_id, module_id, completed_count, total_modules,
                auto_score, ai_score, ai_rubric_json, ai_feedback, ai_model, ai_graded_at,
                payload_json, student_note, teacher_score, teacher_feedback, status, graded_at
            ) VALUES (
                :sid, 'all', :comp, 9,
                :auto_sc, :ai_sc, :ai_rub, :ai_fb, :ai_mod, CURRENT_TIMESTAMP,
                :payload, :note, :t_sc, :t_fb, 'graded', CURRENT_TIMESTAMP
            )
        ");
        $ins->execute(array(
            ':sid' => $st['student_id'],
            ':comp' => $completedCnt,
            ':auto_sc' => round(($completedCnt / 9) * 100, 2),
            ':ai_sc' => $aiRes['score'],
            ':ai_rub' => json_encode($aiRes['rubric'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ':ai_fb' => $aiRes['feedback'],
            ':ai_mod' => $aiRes['model'],
            ':payload' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ':note' => $note,
            ':t_sc' => $aiRes['score'],
            ':t_fb' => $aiRes['feedback'],
        ));
        $created++;
    }

    return array('created' => $created);
}
