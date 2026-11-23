<?php
/**
 * CT-Lab 04 — Assessment Challenge API (PHP 5.6+ Compatible)
 * เฉลยถูกเก็บไว้ที่ฝั่ง Server เท่านั้น นักศึกษาไม่สามารถเรียกดูเฉลยได้
 */

require_once __DIR__ . '/config.php';

function get_challenge_bank()
{
    return array(
        array(
            'id' => 'q1',
            'topic' => 'ISO 5807:1985 Flowchart (Preparation)',
            'question' => 'จากมาตรฐาน ISO 5807:1985 สัญลักษณ์รูปหกเหลี่ยม (Preparation) ที่แสดงคำสั่ง "INITIALISE MaxCycles ← 3" ใช้ทำหน้าที่ใดในผังงานวิทยาศาสตร์?',
            'options' => array(
                'A' => 'ใช้รับค่าข้อมูลจากเซนเซอร์ผ่านหน้าจอ',
                'B' => 'ใช้กำหนดค่าเริ่มต้นของตัวแปร ค่าคงที่ หรือตั้งค่ากลุ่มเงื่อนไขก่อนเข้าสู่ลูปการทำงาน',
                'C' => 'ใช้แสดงจุดจบการทำงานฉุกเฉินของระบบ',
                'D' => 'ใช้หน่วงเวลารอปฏิกิริยาเคมีแบบคงที่',
            ),
            'answer' => 'B',
            'explanation' => 'ตามมาตรฐาน ISO 5807:1985 รูปหกเหลี่ยม (Preparation) ใช้กำหนดค่าเริ่มต้นหรือปรับแต่งพารามิเตอร์/เงื่อนไขควบคุม (เช่น MaxCycles ← 3) ก่อนเริ่มเข้าสู่วงวนหลัก',
        ),
        array(
            'id' => 'q2',
            'topic' => 'Pseudocode (WHILE vs REPEAT-UNTIL)',
            'question' => 'หากกำหนดค่าเริ่มต้น pH ← 7.5 แล้วรันชุดคำสั่งเทียบระหว่าง WHILE pH < 7.0 DO ... ENDWHILE กับ REPEAT ... UNTIL pH >= 7.0 ผลลัพธ์จำนวนรอบการทำงานจะเป็นอย่างไร?',
            'options' => array(
                'A' => 'WHILE ทำงาน 1 รอบ และ REPEAT-UNTIL ทำงาน 0 รอบ',
                'B' => 'WHILE ทำงาน 0 รอบ (ตรวจเงื่อนไขก่อน) แต่ REPEAT-UNTIL ทำงานอย่างน้อย 1 รอบ (ตรวจเงื่อนไขท้ายลูป)',
                'C' => 'ทั้งสองโครงสร้างทำงานเท่ากันคือ 1 รอบ',
                'D' => 'ทั้งสองโครงสร้างเกิด Infinite Loop ทันที',
            ),
            'answer' => 'B',
            'explanation' => 'WHILE เป็น Pre-test Loop (ตรวจ pH < 7.0 ก่อน ซึ่ง 7.5 < 7.0 เป็นเท็จ จึงทำ 0 รอบ) ส่วน REPEAT-UNTIL เป็น Post-test Loop จึงทำงานคำสั่งในลูปอย่างน้อย 1 รอบก่อนตรวจ UNTIL pH >= 7.0 ท้ายลูป',
        ),
        array(
            'id' => 'q3',
            'topic' => 'Algorithm Design & Four-Tier Test Data',
            'question' => 'ในการทดสอบอัลกอริทึมควบคุมอุณหภูมิช่วงปลอดภัย 35.0–40.0°C การป้อนค่า T = 34.9°C, 35.0°C และ 40.1°C จัดเป็นชุดข้อมูลทดสอบประเภทใดตามหลัก Four-Tier Test Data?',
            'options' => array(
                'A' => 'Normal Data (ข้อมูลปกติทั่วไป)',
                'B' => 'Abnormal Data (ข้อมูลนอกย่านเซนเซอร์)',
                'C' => 'Boundary Data (ข้อมูลขอบเขตเพื่อตรวจจุดเปลี่ยนเงื่อนไขและข้อผิดพลาด < กับ <=)',
                'D' => 'Extreme Data (ข้อมูลค่าสุดขีดของฮาร์ดแวร์)',
            ),
            'answer' => 'C',
            'explanation' => 'ค่า 34.9°C, 35.0°C และ 40.1°C อยู่ตรงจุดตัดและประชิดขอบเขตเงื่อนไข (Boundary Data) ใช้พิสูจน์ว่าตัวดำเนินการเปรียบเทียบ (< vs <=) ทำงานตรงตามสเปกหรือไม่',
        ),
        array(
            'id' => 'q4',
            'topic' => 'Trace Table (CSTR Closed-Loop Control)',
            'question' => 'จาก Trace Table ถังปฏิกรณ์ CSTR (ปลอดภัย 35.0–40.0°C, pH ≥ 6.0): ใน Cycle 2 เมื่อวัดได้ Temp = 32.0°C และ pH = 6.8 อุปกรณ์ใดบ้างที่ต้องเปิดทำงาน (ON)?',
            'options' => array(
                'A' => 'Cooler = ON, Heater = OFF, AlkaliPump = ON',
                'B' => 'Cooler = OFF, Heater = ON, AlkaliPump = OFF',
                'C' => 'Cooler = OFF, Heater = OFF, AlkaliPump = OFF',
                'D' => 'Cooler = ON, Heater = ON, AlkaliPump = ON',
            ),
            'answer' => 'B',
            'explanation' => 'Temp = 32.0°C ต่ำกว่า 35.0°C จึงเปิด Heater (Cooler = OFF) ส่วน pH = 6.8 อยู่ในเกณฑ์ ≥ 6.0 จึงไม่ต้องเปิด AlkaliPump (OFF)',
        ),
        array(
            'id' => 'q5',
            'topic' => 'Debugging Logic Errors & Fail-Safe Loop Reset',
            'question' => 'ในการออกแบบผังงานระบบควบคุมถังปฏิกรณ์ CSTR เมื่อเงื่อนไขหยุดการทำงาน (เช่น TotalCycles < 3 เป็นเท็จ) ก่อนเข้าสู่สัญลักษณ์ Terminator (จบการทำงาน) ควรใส่ขั้นตอนใดเพื่อป้องกันอันตรายทางกายภาพ?',
            'options' => array(
                'A' => 'Fail-Safe Default Reset: สั่งปิด Actuator ทั้งหมด (Cooler, Heater, Pump ← OFF) ก่อนจบโปรแกรม',
                'B' => 'เปิด AlkaliPump ค้างไว้ตลอดเพื่อให้ pH สูงขึ้นเรื่อยๆ',
                'C' => 'ลบคำสั่งอัปเดต TotalCycles ← TotalCycles + 1 ออกเพื่อลดการใช้หน่วยความจำ',
                'D' => 'ไม่ต้องทำสิ่งใด ปล่อยให้สถานะขาออก (Output Pin) ค้างค่าจากรอบสุดท้ายไว้',
            ),
            'answer' => 'A',
            'explanation' => 'หลักความปลอดภัยระบบควบคุมวิทยาศาสตร์ต้องทำ Fail-Safe Default Reset ปิดฮาร์ดแวร์ทุกตัวเป็น OFF เสมอหลังออกจากลูป เพื่อไม่ให้อุณหภูมิหรือสารเคมีเกินพิกัดค้างอยู่ในถัง',
        ),
    );
}

if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
require_once __DIR__ . '/ai_grader.php';

$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';

try {
    if ($method === 'GET') {
        $bank = get_challenge_bank();
        $publicQuestions = array();
        foreach ($bank as $q) {
            $publicQuestions[] = array(
                'id' => $q['id'],
                'topic' => $q['topic'],
                'question' => $q['question'],
                'options' => $q['options'],
            );
        }
        json_response(array('ok' => true, 'questions' => $publicQuestions));
    }

    if ($method === 'POST') {
        $body = get_json_body();
        $studentId = isset($body['student_id']) ? trim((string)$body['student_id']) : '';
        $fullName = isset($body['full_name']) ? trim((string)$body['full_name']) : '';
        $section = isset($body['section']) ? trim((string)$body['section']) : '';
        $answers = (isset($body['answers']) && is_array($body['answers'])) ? $body['answers'] : array();
        $note = isset($body['student_note']) ? trim((string)$body['student_note']) : '';

        if ($studentId === '' || $fullName === '') {
            json_response(array('ok' => false, 'error' => 'กรุณาเลือกสาขาและชื่อนักศึกษาก่อนส่งคำตอบ'), 400);
        }

        $bank = get_challenge_bank();
        $correctCount = 0;
        $total = count($bank);
        $detail = array();

        foreach ($bank as $q) {
            $qid = $q['id'];
            $chosen = isset($answers[$qid]) ? trim((string)$answers[$qid]) : '';
            if ($chosen === '') {
                json_response(array('ok' => false, 'error' => 'กรุณาตอบคำถามให้ครบทั้ง ' . $total . ' ข้อก่อนส่ง'), 400);
            }
            $isCorrect = ($chosen === $q['answer']);
            if ($isCorrect) {
                $correctCount++;
            }
            $detail[$qid] = array(
                'chosen' => $chosen,
                'correct' => $isCorrect,
            );
        }

        $autoScore = round(($correctCount / $total) * 100, 2);

        $aiCfg = get_ai_config();
        $aiResult = null;
        $aiScore = null;
        $aiRubricJson = null;
        $aiFeedback = null;
        $aiModel = null;
        $aiGradedAt = null;
        $teacherScore = null;
        $teacherFeedback = null;
        $gradedAt = null;
        $status = 'submitted';
        $safeFeedback = null;

        if (!empty($aiCfg['auto_grade_on_submit'])) {
            $aiResult = ai_grade_challenge10($detail, $bank, $note, $answers);
            $aiScore = $aiResult['score'];
            $aiRubricJson = json_encode($aiResult['rubric'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $aiFeedback = $aiResult['feedback'];
            $aiModel = $aiResult['model'];
            $aiGradedAt = date('Y-m-d H:i:s');
            $safeFeedback = $aiResult['student_safe_feedback'];

            if (!empty($aiCfg['auto_approve'])) {
                $threshold = isset($aiCfg['resubmit_threshold']) ? (float)$aiCfg['resubmit_threshold'] : 0.0;
                $status = ($threshold > 0 && $aiScore < $threshold) ? 'resubmit' : 'graded';
                $teacherScore = $aiScore;
                $teacherFeedback = $aiFeedback;
                $gradedAt = $aiGradedAt;
            }
        }

        $pdo = get_pdo();
        $pdo->beginTransaction();

        db_upsert_student($pdo, $studentId, $fullName, $section);

        $payloadJson = json_encode(array(
            'type' => 'lab04_assessment',
            'answers' => $answers,
            'grading_detail' => $detail,
            'correct_count' => $correctCount,
            'total_questions' => $total,
        ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $ins = $pdo->prepare("
            INSERT INTO ctlab04_submissions (
                student_id, module_id, completed_count, total_modules,
                auto_score, ai_score, ai_rubric_json, ai_feedback, ai_model, ai_graded_at,
                payload_json, student_note, teacher_score, teacher_feedback, status, graded_at
            ) VALUES (
                :student_id, 'challenge10', :completed_count, :total_modules,
                :auto_score, :ai_score, :ai_rubric_json, :ai_feedback, :ai_model, :ai_graded_at,
                :payload_json, :student_note, :teacher_score, :teacher_feedback, :status, :graded_at
            )
        ");
        $ins->execute(array(
            ':student_id' => $studentId,
            ':completed_count' => $correctCount,
            ':total_modules' => $total,
            ':auto_score' => $autoScore,
            ':ai_score' => $aiScore,
            ':ai_rubric_json' => $aiRubricJson,
            ':ai_feedback' => $aiFeedback,
            ':ai_model' => $aiModel,
            ':ai_graded_at' => $aiGradedAt,
            ':payload_json' => $payloadJson,
            ':student_note' => $note !== '' ? $note : null,
            ':teacher_score' => $teacherScore,
            ':teacher_feedback' => $teacherFeedback,
            ':status' => $status,
            ':graded_at' => $gradedAt,
        ));

        $subId = (int)$pdo->lastInsertId();
        $pdo->commit();

        json_response(array(
            'ok' => true,
            'submission_id' => $subId,
            'status' => $status,
            'ai_safe_feedback' => $safeFeedback,
            'message' => 'ส่งคำตอบแบบทดสอบวัดผลเรียบร้อยแล้ว! ระบบบันทึกและวิเคราะห์ด้วย AI ลงฐานข้อมูลแล้ว',
        ), 201);
    }

    json_response(array('ok' => false, 'error' => 'Method not allowed'), 405);
} catch (Exception $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_response(array('ok' => false, 'error' => 'เกิดข้อผิดพลาดในการบันทึกคำตอบ', 'detail' => $e->getMessage()), 500);
}
}
