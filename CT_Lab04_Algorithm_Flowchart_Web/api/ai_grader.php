<?php
/**
 * CT-Lab 04 — AI Auto-Grading, Trace Table Evaluator & Automated Class Report Engine (PHP 5.6+ Compatible)
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
        'provider' => 'hybrid_local',
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

    if (isset($newCfg['auto_grade_on_submit'])) $cur['auto_grade_on_submit'] = (bool)$newCfg['auto_grade_on_submit'];
    if (isset($newCfg['auto_approve'])) $cur['auto_approve'] = (bool)$newCfg['auto_approve'];
    if (isset($newCfg['resubmit_threshold'])) {
        $th = (float)$newCfg['resubmit_threshold'];
        $cur['resubmit_threshold'] = max(0, min(100, $th));
    }
    if (isset($newCfg['provider']) && in_array($newCfg['provider'], array('hybrid_local', 'gemini', 'ollama'), true)) {
        $cur['provider'] = $newCfg['provider'];
    }
    if (isset($newCfg['gemini_api_key']) && trim((string)$newCfg['gemini_api_key']) !== '') {
        $cur['gemini_api_key'] = trim((string)$newCfg['gemini_api_key']);
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
    return function_exists('mb_strtolower') ? mb_strtolower($s, 'UTF-8') : strtolower($s);
}

function ai_len($str)
{
    $s = trim((string)$str);
    return function_exists('mb_strlen') ? mb_strlen($s, 'UTF-8') : strlen($s);
}

function ai_contains($haystack, $needle)
{
    $h = ai_lower($haystack);
    $n = ai_lower($needle);
    if ($n === '') return false;
    return function_exists('mb_strpos') ? (mb_strpos($h, $n, 0, 'UTF-8') !== false) : (strpos($h, $n) !== false);
}

function ai_lcs_length($seq, $expected)
{
    $m = count($seq);
    $n = count($expected);
    if ($m === 0 || $n === 0) return 0;
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
        'algo_design' => '01 Algorithm Design (การลำดับขั้นตอน)',
        'pseudocode' => '02 รหัสลำลอง (Pseudocode)',
        'flowchart' => '03 ผังงานมาตรฐาน (Flowchart)',
        'lab4_tracetable' => '04 ปฏิบัติการที่ 4: ผังงานวิทย์ & Trace Table',
        'challenge10' => '05 แบบทดสอบวัดผล (5 ข้อ)',
    );
}

function get_ai_pillar_labels()
{
    return array(
        'Algorithm Design' => 'การออกแบบขั้นตอนวิธี (Algorithm Design)',
        'Pseudocode' => 'การเขียนรหัสลำลอง (Pseudocode)',
        'Flowchart' => 'ผังงานมาตรฐาน (Standard Flowchart)',
        'Trace Table' => 'การทวนสอบด้วย Trace Table (Dry Run)',
    );
}

function get_ai_module_rubrics()
{
    return array(
        'algo_design' => array(
            'label' => '01 Algorithm Design (การลำดับขั้นตอน)',
            'pillar' => 'Algorithm Design',
            'expected_seq' => array(
                '1. ระบุ Input: จำนวนโมล (n) และปริมาตรสารละลายเป็นลิตร (V)',
                '2. ตรวจสอบเงื่อนไขขอบเขต: ถ้า V <= 0 ให้แจ้งข้อผิดพลาดทันที',
                '3. ประมวลผล (Process): คำนวณความเข้มข้น C = n / V',
                '4. แสดงผลลัพธ์ (Output): รายงานค่าความเข้มข้น C (mol/L) และจบ',
            ),
            'distractors' => array(
                'ผสมสารเคมีลงในบีกเกอร์ทันทีโดยไม่ต้องวัดปริมาตร V',
            ),
            'keywords_core' => array('หารด้วยศูนย์', '0', 'error', 'คลาดเคลื่อน', 'ขอบเขต', 'boundary', 'abnormal', 'extreme', 'normal', 'เงื่อนไข', 'ปริมาตร', 'เป็นลบ', 'ไม่นิยาม', 'ป้องกัน'),
            'hint_seq' => 'ต้องเรียงตามโครงสร้าง IPO (รับ Input -> ตรวจขอบเขต V > 0 -> คำนวณ Process -> แสดง Output) และตัดขั้นตอนที่ไม่วัดปริมาตรออก',
            'hint_subj' => 'ควรอธิบายว่าช่วยป้องกันการหารด้วยศูนย์ (Division by Zero) และดัก Boundary/Abnormal Data ที่ทำให้ผลลัพธ์ไม่นิยาม/ผิดพลาด',
        ),
        'pseudocode' => array(
            'label' => '02 รหัสลำลอง (Pseudocode)',
            'pillar' => 'Pseudocode',
            'expected_seq' => array(
                'INITIALISE count ← 0, i ← 1',
                'WHILE i <= N DO',
                '  INPUT temp[i]',
                '  IF temp[i] > 37.5 THEN count ← count + 1 ENDIF',
                '  i ← i + 1',
                'ENDWHILE แล้ว OUTPUT count',
            ),
            'distractors' => array(
                'INITIALISE count ← 0 ภายในลูป WHILE เพื่อรีเซ็ตทุกรอบ',
            ),
            'keywords_core' => array('infinite loop', 'วนซ้ำไม่รู้จบ', 'ไม่หยุด', 'ค้าง', 'รีเซ็ต', 'ตัวแปร', 'off-by-one', 'i', 'เงื่อนไข', 'เท่าเดิม', 'เป็นจริงตลอด', 'ตลอดไป', 'ตัวนับ'),
            'hint_seq' => 'ต้องกำหนดค่าเริ่มต้น INITIALISE count ← 0, i ← 1 ก่อนเข้าลูป WHILE และอัปเดต i ← i + 1 ท้ายลูปก่อน ENDWHILE แล้วจึง OUTPUT count',
            'hint_subj' => 'ควรระบุชัดเจนว่าตัวนับ i จะคงค่าเดิมจนเกิด Infinite Loop และการนำ count ← 0 ไว้ในลูปจะทำให้ตัวแปรถูกรีเซ็ตค่าหายทุกรอบ',
        ),
        'flowchart' => array(
            'label' => '03 ผังงานมาตรฐาน (Flowchart)',
            'pillar' => 'Flowchart',
            'expected_seq' => array(
                '[วงรี Terminator] เริ่มต้นการทำงาน',
                '[หกเหลี่ยม Preparation] กำหนดค่าเกณฑ์เริ่มต้น pH_min ← 5.5',
                '[สี่เหลี่ยมด้านขนาน Input] อ่านค่า pH จากเซนเซอร์ดิน',
                '[ข้าวหลามตัด Decision] ตรวจสอบเงื่อนไข pH < pH_min ?',
                '[สี่เหลี่ยมผืนผ้า Process] ถ้าใช่: แจ้งเตือน "ดินเป็นกรด" / ถ้าไม่ใช่: แสดง "ปกติ"',
                '[วงรี Terminator] จบการทำงาน',
            ),
            'distractors' => array(
                '[ข้าวหลามตัด Decision] จบการทำงานและปิดระบบ',
            ),
            'keywords_core' => array('2 ทาง', 'สองทาง', 'จริง', 'เท็จ', 'true', 'false', 'ใช่', 'ไม่ใช่', 'preparation', 'หกเหลี่ยม', 'predefined', 'โปรแกรมย่อย', 'subroutine', 'delay', 'หน่วงเวลา', 'เกษตรอัจฉริยะ', 'ตัดเกรด', 'ค่าเริ่มต้น', 'เงื่อนไข', 'ทางออก', '1 ทาง', 'ลูกศร', 'ตัดสินใจ'),
            'hint_seq' => 'จุดเริ่ม/จบใช้วงรี (Terminator) กำหนดค่าเริ่มต้นใช้หกเหลี่ยม (Preparation) รับค่าใช้ด้านขนาน และจุดตัดสินใจใช้ข้าวหลามตัด',
            'hint_subj' => 'ควรอธิบายว่าข้าวหลามตัด (Decision) มีทางออก 2 เส้น (True/False) ส่วนหกเหลี่ยม (Preparation) ใช้กำหนดค่าเริ่มต้นก่อนเข้าประมวลผล',
        ),
        'lab4_tracetable' => array(
            'label' => '04 ปฏิบัติการที่ 4: ผังงานวิทย์ & Trace Table',
            'pillar' => 'Trace Table',
            'expected_seq' => array(
                '[วงรี Terminator] เริ่มต้นระบบควบคุมปฏิกิริยาเคมี CSTR',
                '[หกเหลี่ยม Preparation] INITIALISE TotalCycles ← 0, MaxCycles ← 3',
                '[ข้าวหลามตัด Decision] TotalCycles < MaxCycles AND EmergencyStop == FALSE ?',
                '[สี่เหลี่ยม Process/Delay] INPUT Temp, pH → สั่ง Actuator และ DELAY 5 SECONDS',
                '[สี่เหลี่ยม Process] อัปเดต TotalCycles ← TotalCycles + 1 แล้ววนกลับตรวจสอบเงื่อนไข',
                '[สี่เหลี่ยม Predefined] Fail-Safe Default Reset: ปิด Cooler, Heater, AlkaliPump ← OFF',
                '[วงรี Terminator] OUTPUT รายงานสถานะและจบการทำงาน',
            ),
            'distractors' => array(
                '[สี่เหลี่ยม Process] เปิด Heater และ AlkaliPump ทิ้งไว้ตลอดเวลาโดยไม่รอหน่วงเวลา DELAY',
            ),
            'keywords_core' => array('fail-safe', 'ปิดอุปกรณ์', 'off-by-one', 'infinite loop', 'hysteresis', 'deadband', 'chatter', 'วนไม่รู้จบ', 'ข้อผิดพลาด', 'trace', 'dry run', 'สารเคมี', 'เสียหาย', 'ตัวแปร', 'ปลอดภัย'),
            'hint_seq' => 'เริ่ม -> Preparation กำหนด MaxCycles -> Decision ตรวจ TotalCycles -> รับค่า+สั่ง Actuator+DELAY -> เพิ่ม TotalCycles -> Fail-Safe ปิด OFF ทุกตัว -> จบ',
            'hint_subj' => 'ควรอธิบายว่า Trace Table ช่วยดัก Logic Errors (เช่น Off-by-One, Infinite Loop, Hysteresis Chatter) และต้องทำ Fail-Safe Default Reset ปิดอุปกรณ์ก่อนจบ',
        ),
    );
}

function ai_evaluate_module($modKey, $completed, $attempts, $snapshot, $studentNote = '')
{
    $rubrics = get_ai_module_rubrics();
    if (!isset($rubrics[$modKey])) {
        return null;
    }
    $r = $rubrics[$modKey];

    // 1. Simulation & Trace Table Mastery (0..40)
    $simScore = 0.0;
    $isDone = !empty($completed[$modKey]);
    $att = isset($attempts[$modKey]) ? (int)$attempts[$modKey] : 0;
    $simDetail = '';

    if ($modKey === 'lab4_tracetable') {
        $traceMap = (isset($snapshot['trace_answers']) && is_array($snapshot['trace_answers'])) ? $snapshot['trace_answers'] : array();
        $expKeys = array('cstr', 'titration', 'pendulum', 'incubator', 'smartfarm', 'grading_edu');
        $verifiedCnt = 0;
        $pctSum = 0.0;
        foreach ($expKeys as $ek) {
            if (isset($traceMap[$ek]) && is_array($traceMap[$ek])) {
                $pct = isset($traceMap[$ek]['score_pct']) ? (float)$traceMap[$ek]['score_pct'] : 0.0;
                if (!empty($traceMap[$ek]['verified']) || $pct > 0) {
                    $verifiedCnt++;
                    $pctSum += min(100.0, max(0.0, $pct));
                }
            }
        }
        $avgTracePct = $verifiedCnt > 0 ? min(100.0, ($pctSum / 4.0)) : 0.0; // เต็ม 100% เมื่อทำครบอย่างน้อย 4 จาก 6 กิจกรรม
        $baseSim = $isDone ? 20.0 : ($verifiedCnt > 0 ? 10.0 : 0.0);
        $tracePts = round(($avgTracePct / 100.0) * 20.0, 1);
        $simScore = min(40.0, $baseSim + $tracePts);
        $totalExp = count($expKeys);

        if ($verifiedCnt > 0) {
            $simDetail = "ตรวจสอบ Trace Table แล้ว $verifiedCnt/$totalExp กิจกรรม (ได้คะแนน Trace {$tracePts}/20" . ($isDone ? ', ผ่านปฏิบัติการที่ 4 แล้ว)' : ', ยังไม่กดส่งยืนยันผ่าน)');
        } elseif ($isDone) {
            $simScore = 30.0;
            $simDetail = "ผ่านปฏิบัติการที่ 4 (แนะนำให้ตรวจ Trace Table อย่างน้อย 4 จาก $totalExp กิจกรรม เช่น CSTR, เกษตรอัจฉริยะ, ตัดเกรด เพื่อรับคะแนนเต็ม 40)";
        } else {
            $simDetail = 'ยังไม่ผ่านการตรวจสอบผังงานและ Trace Table ในปฏิบัติการที่ 4';
        }
    } else {
        if ($isDone) {
            $simScore = 35.0;
            $fcDoneCnt = isset($snapshot['fc3_scenarios_done']) ? (int)$snapshot['fc3_scenarios_done'] : 0;
            if ($modKey === 'algo_design' && !empty($snapshot['four_tier_tested'])) {
                $simScore = 40.0;
                $simDetail = 'ผ่าน IPO Sandbox และจำแนกชุดทดสอบ Four-Tier Test Data แล้ว';
            } elseif ($modKey === 'flowchart' && (!empty($snapshot['fc3_branch_tested']) || $fcDoneCnt >= 2)) {
                $simScore = 40.0;
                $simDetail = 'ต่อบล็อกผังงาน ISO 5807 และจำลองเส้นทางหลายกิ่ง (เกษตรอัจฉริยะ/ตัดเกรด/การสอนวิทย์) ครบถ้วน';
            } elseif ($att <= 2) {
                $simScore += 5.0;
                $simDetail = 'ผ่านห้องทดลองจำลองด้วยความแม่นยำสูง';
            } elseif ($att <= 5) {
                $simScore += 3.0;
                $simDetail = 'ผ่านห้องทดลองจำลองได้ดี';
            } else {
                $simScore += 1.0;
                $simDetail = 'ผ่านห้องทดลองจำลองหลังทดลองหลายรอบ';
            }
        } else {
            if ($modKey === 'algo_design' && !empty($snapshot['ipo_checked']) && !empty($snapshot['four_tier_tested'])) {
                $simScore = 22.0;
                $simDetail = 'ทดลองวิเคราะห์ IPO Sandbox และจำแนก Four-Tier Test Data แล้ว แต่ยังไม่ทำกิจกรรมหลักครบ';
            } elseif ($modKey === 'algo_design' && (!empty($snapshot['ipo_checked']) || !empty($snapshot['four_tier_tested']))) {
                $simScore = 15.0;
                $simDetail = 'ทดลองวิเคราะห์ IPO Sandbox / Four-Tier แล้ว แต่ยังไม่ผ่านกิจกรรมครบ';
            } elseif ($modKey === 'pseudocode' && !empty($snapshot['pseudo_steps'])) {
                $simScore = 15.0;
                $simDetail = 'ทดลองรันรหัสลำลองแล้ว แต่ยังไม่ทำครบเงื่อนไข';
            } elseif ($modKey === 'flowchart' && (!empty($snapshot['fc3_branch_tested']) || !empty($snapshot['fc3_scenarios_done']))) {
                $simScore = 18.0;
                $simDetail = 'ทดลองจำลองผังงานหลายกิ่งหรือต่อบล็อกบางส่วนแล้ว แต่ยังไม่ตรวจผ่านครบ';
            } else {
                $simDetail = 'ยังไม่ผ่านกิจกรรมในห้องทดลองจำลอง';
            }
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
        if (count($foundDistractors) === 0 && count($cleanSeq) >= max(2, count($expected) - 1)) {
            $seqScore += 10.0;
        } elseif (count($foundDistractors) === 0) {
            $seqScore += 5.0;
        } else {
            $seqScore += max(0.0, 4.0 - (count($foundDistractors) * 2.0));
            $seqNotes[] = 'พบการเลือกบล็อกตัวลวง (' . implode(', ', $foundDistractors) . ')';
        }

        $matchedCount = 0;
        foreach ($expected as $expItem) {
            if (in_array($expItem, $cleanSeq, true)) {
                $matchedCount++;
            }
        }
        $seqScore += (count($expected) > 0) ? (10.0 * ($matchedCount / count($expected))) : 0.0;

        $lcs = ai_lcs_length($cleanSeq, $expected);
        $seqScore += (count($expected) > 0) ? (15.0 * ($lcs / count($expected))) : 0.0;

        if ($lcs === count($expected) && count($foundDistractors) === 0 && count($cleanSeq) === count($expected)) {
            $seqNotes[] = 'เรียงลำดับขั้นตอนได้ถูกต้องสมบูรณ์และคัดบล็อกลวงออกครบถ้วน';
        } elseif ($lcs < count($expected)) {
            $seqNotes[] = 'ลำดับบล็อกตรง ' . $lcs . '/' . count($expected) . ' ขั้นตอน (' . $r['hint_seq'] . ')';
        }
    }

    // 3. Subjective Reasoning (0..25)
    $notePieces = array();
    if (!empty($semiEntry['note'])) $notePieces[] = trim((string)$semiEntry['note']);
    if (!empty($snapshot['subjective_answers'][$modKey])) $notePieces[] = trim((string)$snapshot['subjective_answers'][$modKey]);
    if (trim((string)$studentNote) !== '') $notePieces[] = trim((string)$studentNote);
    $combinedText = trim(implode(' ', $notePieces));

    $subjScore = 0.0;
    $subjNotes = array();
    $textLen = ai_len($combinedText);

    if ($textLen === 0) {
        $subjNotes[] = 'ยังไม่มีคำอธิบายเหตุผลอัตนัย (' . $r['hint_subj'] . ')';
    } else {
        if ($textLen >= 60) $subjScore += 8.0;
        elseif ($textLen >= 25) $subjScore += 5.5;
        elseif ($textLen >= 10) $subjScore += 3.0;
        else $subjScore += 1.0;

        $matchedKw = array();
        foreach ($r['keywords_core'] as $kw) {
            if (ai_contains($combinedText, $kw)) {
                $matchedKw[] = $kw;
            }
        }
        $subjScore += min(12.0, count($matchedKw) * 3.5);

        $logicWords = array('เพราะ', 'เนื่องจาก', 'ดังนั้น', 'ถ้า', 'เพื่อ', 'เงื่อนไข', 'วนซ้ำ', 'มิฉะนั้น', 'ส่งผล', 'ป้องกัน', 'ช่วย');
        $logicHits = 0;
        foreach ($logicWords as $lw) {
            if (ai_contains($combinedText, $lw)) $logicHits++;
        }
        $subjScore += min(5.0, $logicHits * 2.0);

        if ($subjScore >= 20.0) {
            $subjNotes[] = 'คำอธิบายเหตุผลครอบคลุมมโนทัศน์หลัก (' . implode(', ', array_slice($matchedKw, 0, 4)) . ')';
        } elseif ($subjScore >= 12.0) {
            $subjNotes[] = 'อธิบายแนวคิดได้ตรงประเด็นบางส่วน ควรเสริมเพิ่มเติม: ' . $r['hint_subj'];
        } else {
            $subjNotes[] = 'คำอธิบายยังสั้นหรือขาดคำสำคัญ: ' . $r['hint_subj'];
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
        'Algorithm Design' => array('sum' => 0, 'cnt' => 0),
        'Pseudocode' => array('sum' => 0, 'cnt' => 0),
        'Flowchart' => array('sum' => 0, 'cnt' => 0),
        'Trace Table' => array('sum' => 0, 'cnt' => 0),
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

        $topicStr = (string)$q['topic'];
        $pillar = 'Algorithm Design';
        if (strpos($topicStr, 'Pseudocode') !== false) $pillar = 'Pseudocode';
        elseif (strpos($topicStr, 'Flowchart') !== false) $pillar = 'Flowchart';
        elseif (strpos($topicStr, 'Trace') !== false || strpos($topicStr, 'Loop') !== false) $pillar = 'Trace Table';
        $pillarScores[$pillar]['sum'] += ($isCorrect ? 100.0 : 0.0);
        $pillarScores[$pillar]['cnt']++;
    }

    $noteLen = ai_len($studentNote);
    $noteBonus = 0.0;
    if ($noteLen >= 30) $noteBonus = 10.0;
    elseif ($noteLen >= 10) $noteBonus = 6.0;
    elseif ($noteLen > 0) $noteBonus = 3.0;

    $quizScore = $noteLen > 0
        ? ($totalQ > 0 ? round(($correctCount / $totalQ) * 90.0, 2) : 0.0)
        : ($totalQ > 0 ? round(($correctCount / $totalQ) * 100.0, 2) : 0.0);
    $finalScore = round(min(100.0, $quizScore + $noteBonus), 2);

    $fbLines = array();
    $fbLines[] = "🤖 สรุปผลแบบทดสอบวัดผล (5 ข้อ): ถูกต้อง $correctCount / $totalQ ข้อ (คะแนน AI: $finalScore/100)";
    if (count($rightTopics) > 0) $fbLines[] = "✅ หัวข้อที่ผ่าน: " . implode(', ', $rightTopics);
    if (count($wrongTopics) > 0) {
        $fbLines[] = "💡 ประเด็นที่ควรทบทวน:";
        foreach ($wrongTopics as $wt) $fbLines[] = "  • " . $wt;
    } else {
        $fbLines[] = "🌟 ตอบถูกครบทั้ง 5 หัวข้อ (Algorithm Design, Pseudocode, Flowchart, Trace Table, Debugging)";
    }

    $studentSafeFeedback = "🤖 AI วิเคราะห์ผลแบบทดสอบเบื้องต้น: ผ่าน $correctCount/$totalQ หัวข้อ (" . round(($correctCount / max(1, $totalQ)) * 100) . "%)";
    if (count($wrongTopics) > 0) {
        $studentSafeFeedback .= " — แนะนำให้ทบทวนเพิ่มเติมใน " . count($wrongTopics) . " หัวข้อที่ยังมีจุดคลาดเคลื่อน";
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
        'model' => 'CT-Lab04 Hybrid AI v1.0',
    );
}

function ai_try_llm_polish($contextText, $baseFeedback, $cfg)
{
    $provider = isset($cfg['provider']) ? $cfg['provider'] : 'hybrid_local';
    if ($provider === 'hybrid_local') {
        return array('feedback' => $baseFeedback, 'model' => 'CT-Lab04 Hybrid AI v1.0');
    }

    $prompt = "คุณคือผู้ช่วยอาจารย์วิชาวิทยาการคำนวณ จงสรุปคำแนะนำสั้นๆ 2-3 ประโยคให้นักศึกษาเรื่องการออกแบบขั้นตอนวิธี รหัสลำลอง ผังงาน และ Trace Table จากข้อมูล:\n" . $contextText . "\nผลตรวจ:\n" . $baseFeedback;

    if ($provider === 'gemini' && !empty($cfg['gemini_api_key'])) {
        $model = !empty($cfg['gemini_model']) ? $cfg['gemini_model'] : 'gemini-2.5-flash';
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . urlencode($model) . ':generateContent?key=' . urlencode($cfg['gemini_api_key']);
        $body = json_encode(array(
            'contents' => array(array('parts' => array(array('text' => $prompt)))),
            'generationConfig' => array('temperature' => 0.3, 'maxOutputTokens' => 280),
        ));
        $ctx = stream_context_create(array(
            'http' => array('method' => 'POST', 'header' => "Content-Type: application/json\r\n", 'content' => $body, 'timeout' => 5, 'ignore_errors' => true),
        ));
        $resp = @file_get_contents($url, false, $ctx);
        if ($resp !== false) {
            $dec = @json_decode($resp, true);
            if (isset($dec['candidates'][0]['content']['parts'][0]['text'])) {
                $aiTxt = trim((string)$dec['candidates'][0]['content']['parts'][0]['text']);
                if ($aiTxt !== '') {
                    return array('feedback' => $baseFeedback . "\n\n✨ คำแนะนำเพิ่มเติมจาก Gemini:\n" . $aiTxt, 'model' => 'Gemini (' . $model . ')');
                }
            }
        }
    }

    if ($provider === 'ollama' && !empty($cfg['ollama_url'])) {
        $model = !empty($cfg['ollama_model']) ? $cfg['ollama_model'] : 'llama3.2';
        $url = rtrim($cfg['ollama_url'], '/') . '/api/generate';
        $body = json_encode(array('model' => $model, 'prompt' => $prompt, 'stream' => false));
        $ctx = stream_context_create(array(
            'http' => array('method' => 'POST', 'header' => "Content-Type: application/json\r\n", 'content' => $body, 'timeout' => 5, 'ignore_errors' => true),
        ));
        $resp = @file_get_contents($url, false, $ctx);
        if ($resp !== false) {
            $dec = @json_decode($resp, true);
            if (!empty($dec['response'])) {
                return array('feedback' => $baseFeedback . "\n\n🦙 คำแนะนำเพิ่มเติมจาก Ollama:\n" . trim((string)$dec['response']), 'model' => 'Ollama (' . $model . ')');
            }
        }
    }

    return array('feedback' => $baseFeedback, 'model' => 'CT-Lab04 Hybrid AI v1.0');
}

function ai_grade_submission_payload($moduleId, $completed, $attempts, $snapshot, $studentNote = '', $extraPayload = array())
{
    $cfg = get_ai_config();

    if ($moduleId === 'challenge10' || $moduleId === 'challenge' || $moduleId === 'assessment') {
        require_once __DIR__ . '/challenge.php';
        $bank = get_challenge_bank();
        $detail = isset($extraPayload['grading_detail']) && is_array($extraPayload['grading_detail']) ? $extraPayload['grading_detail'] : array();
        $answers = isset($extraPayload['answers']) && is_array($extraPayload['answers']) ? $extraPayload['answers'] : array();
        return ai_grade_challenge10($detail, $bank, $studentNote, $answers);
    }

    $rubrics = get_ai_module_rubrics();
    $validModules = array_keys($rubrics);

    if ($moduleId !== 'all' && isset($rubrics[$moduleId])) {
        $ev = ai_evaluate_module($moduleId, $completed, $attempts, $snapshot, $studentNote);
        $fb = array();
        $fb[] = "🤖 AI ตรวจงาน {$ev['label']} · คะแนนรวม {$ev['total']}/100";
        $fb[] = "📊 เกณฑ์ย่อย: จำลอง/Trace {$ev['rubric']['simulation']}/40 · จัดบล็อก {$ev['rubric']['sequencing']}/35 · เหตุผล {$ev['rubric']['subjective']}/25";
        $fb[] = "• กิจกรรม/Trace Table: " . $ev['details']['sim'];
        $fb[] = "• การจัดลำดับรหัส/ผังงาน: " . $ev['details']['seq'];
        $fb[] = "• เหตุผลเชิงวิทยาศาสตร์: " . $ev['details']['subj'];
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

    $evals = array();
    $simSum = 0.0;
    $seqSum = 0.0;
    $subjSum = 0.0;
    $completedCnt = 0;
    $semiDoneCnt = 0;
    $strengths = array();
    $improvements = array();

    foreach ($validModules as $m) {
        $ev = ai_evaluate_module($m, $completed, $attempts, $snapshot, '');
        $evals[$m] = $ev;
        $simSum += $ev['rubric']['simulation'];
        $seqSum += $ev['rubric']['sequencing'];
        $subjSum += $ev['rubric']['subjective'];
        if ($ev['completed']) $completedCnt++;
        if ($ev['has_semi_seq'] || $ev['has_subjective']) $semiDoneCnt++;

        if ($ev['total'] >= 80) $strengths[] = $ev['label'] . " ({$ev['total']}%)";
        elseif (!$ev['completed'] || $ev['total'] < 50) $improvements[] = $ev['label'];
    }

    $nMods = count($validModules);
    $avgSim = round($simSum / $nMods, 1);
    $avgSeq = round($seqSum / $nMods, 1);
    $avgSubj = round($subjSum / $nMods, 1);

    $noteLen = ai_len($studentNote);
    $noteBonus = $noteLen >= 30 ? 5.0 : ($noteLen >= 10 ? 2.5 : 0.0);
    $overallScore = round(min(100.0, $avgSim + $avgSeq + $avgSubj + $noteBonus), 2);

    $fb = array();
    $fb[] = "🤖 AI ประเมินภาพรวมบทปฏิบัติการที่ 4 (4 โมดูล) · คะแนนรวม $overallScore/100";
    $fb[] = "📊 เกณฑ์เฉลี่ย: จำลอง/Trace $avgSim/40 · จัดลำดับ $avgSeq/35 · เหตุผล $avgSubj/25" . ($noteBonus > 0 ? " (+สรุปแนวคิด $noteBonus)" : '');
    $fb[] = "• ความครบถ้วน: ผ่านห้องจำลอง $completedCnt/$nMods โมดูล · ทำแบบฝึกกึ่งอัตนัย $semiDoneCnt/$nMods โมดูล";
    if (count($strengths) > 0) $fb[] = "✅ จุดเด่น: " . implode(', ', $strengths);
    if (count($improvements) > 0) $fb[] = "💡 ควรทบทวนเพิ่มเติม: " . implode(', ', $improvements);
    else $fb[] = "🌟 ครบถ้วนทุกหัวข้อทั้ง Algorithm Design, Pseudocode, Flowchart และ Trace Table";

    $baseFeedback = implode("\n", $fb);
    $polished = ai_try_llm_polish("All 4 modules completed: $completedCnt/$nMods, Score: $overallScore", $baseFeedback, $cfg);

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

function ai_grade_existing_submission($pdo, $submissionRow, $applyToTeacher = true)
{
    $cfg = get_ai_config();
    $payload = @json_decode((string)$submissionRow['payload_json'], true);
    if (!is_array($payload)) $payload = array();

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
            UPDATE ctlab04_submissions
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
            UPDATE ctlab04_submissions
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

function ai_generate_class_report($pdo, $section = '', $saveToDb = true)
{
    $modLabels = get_ai_module_labels();
    $rubrics = get_ai_module_rubrics();
    $pillarLabels = get_ai_pillar_labels();

    if ($section !== '') {
        $stStmt = $pdo->prepare('SELECT student_id, full_name, section FROM ctlab04_students WHERE section = ? ORDER BY student_id ASC');
        $stStmt->execute(array($section));
        $students = $stStmt->fetchAll();
    } else {
        $students = $pdo->query("SELECT student_id, full_name, section FROM ctlab04_students WHERE student_id <> 'TEACHER01' ORDER BY student_id ASC")->fetchAll();
    }

    $subRows = $pdo->query('
        SELECT sub.id, sub.student_id, st.full_name, st.section,
               sub.module_id, sub.completed_count, sub.total_modules,
               sub.auto_score, sub.ai_score, sub.ai_rubric_json,
               sub.teacher_score, sub.status, sub.payload_json, sub.submitted_at
        FROM ctlab04_submissions sub
        INNER JOIN ctlab04_students st ON st.student_id = sub.student_id
        ORDER BY sub.submitted_at DESC, sub.id DESC
    ')->fetchAll();

    $studentMap = array();
    foreach ($students as $st) $studentMap[$st['student_id']] = $st;

    $studentBestByMod = array();
    $studentLatestScore = array();
    $studentSubCount = array();
    $rubricAccum = array('sim' => 0.0, 'seq' => 0.0, 'subj' => 0.0, 'count' => 0);
    $pillarAccum = array(
        'Algorithm Design' => array('sum' => 0.0, 'cnt' => 0),
        'Pseudocode' => array('sum' => 0.0, 'cnt' => 0),
        'Flowchart' => array('sum' => 0.0, 'cnt' => 0),
        'Trace Table' => array('sum' => 0.0, 'cnt' => 0),
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
        if (!isset($studentMap[$sid])) continue;

        $totalSubmissionsInScope++;
        if ($sr['status'] === 'graded') $gradedCount++;
        elseif ($sr['status'] === 'resubmit') $resubmitCount++;
        else $pendingCount++;

        $effScore = $sr['teacher_score'] !== null
            ? (float)$sr['teacher_score']
            : ($sr['ai_score'] !== null ? (float)$sr['ai_score'] : (float)$sr['auto_score']);

        if (!isset($studentSubCount[$sid])) $studentSubCount[$sid] = 0;
        $studentSubCount[$sid]++;
        if (!isset($studentLatestScore[$sid])) $studentLatestScore[$sid] = $effScore;

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
                    if (!empty($mev['distractor_hits'])) $moduleStats[$mk]['distractor_hits']++;
                    if (empty($mev['has_subjective'])) $moduleStats[$mk]['missing_subj']++;
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
        }
    }

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
                'reason' => 'ยังไม่เคยส่งงานปฏิบัติการที่ 4 เข้าระบบ',
            );
            continue;
        }

        $submittedStudentsCount++;
        $avgStu = count($modsDone) > 0 ? round(array_sum($modsDone) / count($modsDone), 2) : round($studentLatestScore[$sid], 2);
        $studentScoresList[] = $avgStu;

        if ($avgStu < 50.0) {
            $atRiskStudents[] = array(
                'student_id' => $sid,
                'full_name' => $st['full_name'],
                'section' => $st['section'],
                'avg_score' => $avgStu,
                'completed_modules' => count($modsDone),
                'reason' => 'คะแนนเฉลี่ยต่ำกว่า 50% แนะนำให้ทวนสอบผังงานและ Trace Table เพิ่ม',
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

    usort($topPerformers, function ($a, $b) {
        if ($a['avg_score'] == $b['avg_score']) return 0;
        return ($a['avg_score'] > $b['avg_score']) ? -1 : 1;
    });
    usort($atRiskStudents, function ($a, $b) {
        if ($a['avg_score'] == $b['avg_score']) return 0;
        return ($a['avg_score'] < $b['avg_score']) ? -1 : 1;
    });

    $totalStudents = count($students);
    $nSc = count($studentScoresList);
    $meanScore = $nSc > 0 ? round(array_sum($studentScoresList) / $nSc, 2) : 0.0;
    $minScore = $nSc > 0 ? round(min($studentScoresList), 2) : 0.0;
    $maxScore = $nSc > 0 ? round(max($studentScoresList), 2) : 0.0;
    $sdScore = 0.0;
    if ($nSc > 1) {
        $varSum = 0.0;
        foreach ($studentScoresList as $v) $varSum += pow($v - $meanScore, 2);
        $sdScore = round(sqrt($varSum / $nSc), 2);
    }
    $submissionRate = $totalStudents > 0 ? round(($submittedStudentsCount / $totalStudents) * 100, 1) : 0.0;

    $pillarsOut = array();
    $weakestPillar = null;
    $strongestPillar = null;
    foreach ($pillarLabels as $pKey => $pThai) {
        $cnt = $pillarAccum[$pKey]['cnt'];
        $avgP = $cnt > 0 ? round($pillarAccum[$pKey]['sum'] / $cnt, 1) : 0.0;
        $pillarsOut[] = array('key' => $pKey, 'label' => $pThai, 'avg_score' => $avgP, 'sample_count' => $cnt);
        if ($cnt > 0) {
            if ($weakestPillar === null || $avgP < $weakestPillar['avg_score']) $weakestPillar = array('label' => $pThai, 'avg_score' => $avgP);
            if ($strongestPillar === null || $avgP > $strongestPillar['avg_score']) $strongestPillar = array('label' => $pThai, 'avg_score' => $avgP);
        }
    }

    $modulesOut = array();
    $bottleneckMod = null;
    $bestMod = null;
    foreach ($moduleStats as $mk => $ms) {
        $cnt = count($ms['scores']);
        $avgM = $cnt > 0 ? round(array_sum($ms['scores']) / $cnt, 1) : 0.0;
        $passCnt = 0;
        foreach ($ms['scores'] as $sv) { if ($sv >= 50.0) $passCnt++; }
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
            if ($bottleneckMod === null || $avgM < $bottleneckMod['avg_score']) $bottleneckMod = $rowOut;
            if ($bestMod === null || $avgM > $bestMod['avg_score']) $bestMod = $rowOut;
        }
    }

    $rubricAvg = array(
        'simulation' => $rubricAccum['count'] > 0 ? round($rubricAccum['sim'] / $rubricAccum['count'], 1) : 0.0,
        'sequencing' => $rubricAccum['count'] > 0 ? round($rubricAccum['seq'] / $rubricAccum['count'], 1) : 0.0,
        'subjective' => $rubricAccum['count'] > 0 ? round($rubricAccum['subj'] / $rubricAccum['count'], 1) : 0.0,
    );

    $scopeText = $section !== '' ? "กลุ่มเรียน $section" : "ทุกกลุ่มเรียนในระบบ";
    $narrLines = array();
    $narrLines[] = "📌 สรุปผลสัมฤทธิ์ปฏิบัติการที่ 4 ($scopeText): จากนักศึกษา $totalStudents คน มีผู้ส่งงานแล้ว $submittedStudentsCount คน ($submissionRate%) รวม $totalSubmissionsInScope ครั้ง (ตรวจแล้ว $gradedCount ครั้ง, รอตรวจ $pendingCount ครั้ง)";
    if ($nSc > 0) {
        $narrLines[] = "📈 การกระจายคะแนน: ค่าเฉลี่ย Mean = $meanScore% (S.D. = $sdScore, ต่ำสุด $minScore%, สูงสุด $maxScore%)";
        $narrLines[] = "🧩 โครงสร้างทักษะตาม Rubric เฉลี่ย: ห้องจำลอง/Trace Table {$rubricAvg['simulation']}/40, จัดลำดับรหัสลำลองและผังงาน {$rubricAvg['sequencing']}/35, เหตุผลเชิงวิทยาศาสตร์ {$rubricAvg['subjective']}/25";
    }
    if ($strongestPillar !== null && $weakestPillar !== null) {
        $narrLines[] = "🧠 ทักษะ 4 ด้านหลัก: เด่นที่สุดคือ {$strongestPillar['label']} ({$strongestPillar['avg_score']}%) และทักษะที่ควรเสริมคือ {$weakestPillar['label']} ({$weakestPillar['avg_score']}%)";
    }
    if ($bestMod !== null && $bottleneckMod !== null) {
        $narrLines[] = "⚙️ วิเคราะห์รายโมดูล: กิจกรรมที่ได้คะแนนสูงสุดคือ {$bestMod['label']} ({$bestMod['avg_score']}%) ส่วนกิจกรรมที่ควรเน้นทบทวนคือ {$bottleneckMod['label']} ({$bottleneckMod['avg_score']}%, ติดตัวลวง {$bottleneckMod['distractor_hits']} ครั้ง)";
    }
    if (count($atRiskStudents) > 0) {
        $narrLines[] = "⚠️ ข้อเสนอแนะเชิงรุก: พบนักศึกษากลุ่มเสี่ยง/ยังไม่ส่งงาน " . count($atRiskStudents) . " คน แนะนำให้ฝึก Dry Run ด้วย Trace Table ทีละรอบเพื่อลดข้อผิดพลาดเชิงเงื่อนไขและการวนซ้ำ";
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
            INSERT INTO ctlab04_ai_reports (
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
    return $pdo->query("
        SELECT id, report_scope, total_students, submitted_students, avg_score, narrative_text, created_at
        FROM ctlab04_ai_reports
        ORDER BY created_at DESC, id DESC
        LIMIT $lim
    ")->fetchAll();
}

function ai_seed_demo_submissions($pdo)
{
    $rubrics = get_ai_module_rubrics();
    $students = $pdo->query("SELECT student_id, full_name, section FROM ctlab04_students WHERE student_id <> 'TEACHER01' ORDER BY student_id ASC LIMIT 12")->fetchAll();
    if (count($students) === 0) return array('created' => 0);

    $created = 0;
    foreach ($students as $idx => $st) {
        $chk = $pdo->prepare('SELECT COUNT(*) FROM ctlab04_submissions WHERE student_id = ?');
        $chk->execute(array($st['student_id']));
        if ((int)$chk->fetchColumn() > 0) continue;

        $tier = $idx < 5 ? 'high' : ($idx < 9 ? 'mid' : 'low');
        $completed = array();
        $attempts = array();
        $semiAnswers = array();
        $traceAnswers = array();
        $modKeys = array_keys($rubrics);

        foreach ($modKeys as $mIdx => $mk) {
            $r = $rubrics[$mk];
            if ($tier === 'high') {
                $completed[$mk] = true;
                $attempts[$mk] = 1;
                $semiAnswers[$mk] = array(
                    'seq' => $r['expected_seq'],
                    'note' => 'เนื่องจาก ' . implode(' และ ', array_slice($r['keywords_core'], 0, 4)) . ' เพื่อป้องกันความผิดพลาดเชิงตรรกะและ Infinite Loop',
                );
            } elseif ($tier === 'mid') {
                $completed[$mk] = ($mIdx < 3);
                $attempts[$mk] = 3;
                $seq = array_slice($r['expected_seq'], 0, 3);
                if ($mIdx === 2) $seq[] = $r['distractors'][0];
                $semiAnswers[$mk] = array(
                    'seq' => $seq,
                    'note' => 'เพราะต้องตรวจเงื่อนไข ' . $r['keywords_core'][0],
                );
            } else {
                $completed[$mk] = ($mIdx < 1);
                $attempts[$mk] = 6;
                if ($mIdx < 2) {
                    $semiAnswers[$mk] = array(
                        'seq' => array($r['expected_seq'][0], $r['distractors'][0]),
                        'note' => 'ยังไม่แน่ใจเงื่อนไขหยุด',
                    );
                }
            }
        }

        if ($tier === 'high') {
            $traceAnswers = array(
                'cstr' => array('verified' => true, 'score_pct' => 100),
                'titration' => array('verified' => true, 'score_pct' => 100),
                'pendulum' => array('verified' => true, 'score_pct' => 100),
                'incubator' => array('verified' => true, 'score_pct' => 100),
                'smartfarm' => array('verified' => true, 'score_pct' => 100),
                'grading_edu' => array('verified' => true, 'score_pct' => 100),
            );
        } elseif ($tier === 'mid') {
            $traceAnswers = array(
                'cstr' => array('verified' => true, 'score_pct' => 85),
                'titration' => array('verified' => true, 'score_pct' => 80),
                'pendulum' => array('verified' => true, 'score_pct' => 60),
                'smartfarm' => array('verified' => true, 'score_pct' => 80),
            );
        } else {
            $traceAnswers = array(
                'cstr' => array('verified' => false, 'score_pct' => 40),
                'titration' => array('verified' => false, 'score_pct' => 30),
            );
        }

        $snapshot = array(
            'active_page' => 'lab4_tracetable',
            'ipo_checked' => true,
            'four_tier_tested' => ($tier !== 'low'),
            'fc3_scenarios_done' => ($tier === 'high' ? 4 : ($tier === 'mid' ? 2 : 0)),
            'fc3_branch_tested' => ($tier !== 'low'),
            'pseudo_steps' => 5,
            'trace_answers' => $traceAnswers,
            'semi_answers' => $semiAnswers,
        );
        $note = $tier === 'high'
            ? 'สรุปปฏิบัติการที่ 4: ทำ Dry Run Trace Table ครบกิจกรรมวิทยาศาสตร์ เกษตรอัจฉริยะ และการตัดเกรด/ซ่อมเสริม รวมถึง Fail-Safe Default Reset ตามมาตรฐาน ISO 5807:1985'
            : ($tier === 'mid' ? 'เข้าใจโครงสร้างผังงานเบื้องต้น แต่ยังพลาดใน Trace Table บางจุด' : 'ยังสับสนเงื่อนไขวนซ้ำและสัญลักษณ์ Decision/Preparation');

        $aiRes = ai_grade_submission_payload('all', $completed, $attempts, $snapshot, $note);
        $payload = array(
            'completed' => $completed,
            'attempts' => $attempts,
            'snapshot' => $snapshot,
            'demo_seed' => true,
        );
        $completedCnt = count(array_filter($completed));

        $ins = $pdo->prepare("
            INSERT INTO ctlab04_submissions (
                student_id, module_id, completed_count, total_modules,
                auto_score, ai_score, ai_rubric_json, ai_feedback, ai_model, ai_graded_at,
                payload_json, student_note, teacher_score, teacher_feedback, status, graded_at
            ) VALUES (
                :sid, 'all', :comp, 4,
                :auto_sc, :ai_sc, :ai_rub, :ai_fb, :ai_mod, CURRENT_TIMESTAMP,
                :payload, :note, :t_sc, :t_fb, 'graded', CURRENT_TIMESTAMP
            )
        ");
        $ins->execute(array(
            ':sid' => $st['student_id'],
            ':comp' => $completedCnt,
            ':auto_sc' => round(($completedCnt / 4) * 100, 2),
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
