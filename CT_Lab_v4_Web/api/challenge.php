<?php
/**
 * CT-Lab v4.0 — Module 10: Illustrated Challenge API (PHP 5.6+ Compatible)
 * เฉลยถูกเก็บไว้ที่ฝั่ง Server เท่านั้น นักศึกษาไม่สามารถเรียกดูเฉลยได้
 */

require_once __DIR__ . '/config.php';

function get_challenge_bank()
{
    return array(
        array(
            'id' => 'q1',
            'topic' => 'Decomposition (การย่อยปัญหา)',
            'question' => 'จากภาพระบบโรงเรือนอัจฉริยะ หากต้องการพัฒนา "ระบบรดน้ำอัตโนมัติ" ข้อใดคือการย่อยปัญหา (Decomposition) ที่ถูกต้องและเป็นระบบมากที่สุด?',
            'options' => array(
                'A' => 'ซื้ออุปกรณ์ทั้งหมดมาต่อสายไฟพร้อมกันแล้วค่อยทดสอบทีเดียว',
                'B' => 'แยกปัญหาออกเป็นส่วนย่อย: (1) อ่านค่าความชื้นดิน (2) เปรียบเทียบค่าเกณฑ์ (3) สั่งเปิด-ปิดปั๊มน้ำ (4) แสดงผลสถานะ',
                'C' => 'เปลี่ยนชนิดของพืชในโรงเรือนให้ทนแล้งแทนการสร้างระบบ',
                'D' => 'เขียนโค้ดควบคุมพัดลมระบายอากาศและไฟส่องสว่างก่อนเป็นอันดับแรก',
            ),
            'answer' => 'B',
            'explanation' => 'Decomposition คือการแตกปัญหาใหญ่ให้เป็นส่วนย่อยที่จัดการและทดสอบทีละส่วนได้ (Input เซนเซอร์ → Process เปรียบเทียบเกณฑ์ → Output ปั๊มน้ำ → Display)',
        ),
        array(
            'id' => 'q2',
            'topic' => 'Pattern Recognition (การหารูปแบบ)',
            'question' => 'จากกราฟอุณหภูมิในภาพ (06:00 = 24°C, 12:00 = 34°C, 18:00 = 28°C) อุณหภูมิช่วง 24:00 ควรมีแนวโน้มเป็นอย่างไร?',
            'options' => array(
                'A' => 'พุ่งสูงขึ้นเกิน 40°C เพราะสะสมความร้อนจากตอนเที่ยง',
                'B' => 'ลดลงต่อเนื่องเข้าใกล้ช่วง 22–25°C ตามรูปแบบวัฏจักรกลางวัน-กลางคืน',
                'C' => 'คงที่อยู่ที่ 34°C ตลอดทั้งคืน',
                'D' => 'ไม่สามารถคาดเดาได้เพราะข้อมูลมีไม่ถึง 100 จุด',
            ),
            'answer' => 'B',
            'explanation' => 'จากรูปแบบ (Pattern) ของอุณหภูมิรายวัน อุณหภูมิจะสูงสุดช่วงเที่ยง-บ่ายและค่อยๆ ลดลงในช่วงเย็นถึงกลางคืน',
        ),
        array(
            'id' => 'q3',
            'topic' => 'Abstraction (การคิดเชิงนามธรรม)',
            'question' => 'จากภาพแผนที่เปรียบเทียบกับกราฟโหนด หากต้องการหาเส้นทางที่ "สั้นที่สุด" จากจุด A ไป D ข้อมูลใดควรถูกตัดทิ้งตามหลัก Abstraction?',
            'options' => array(
                'A' => 'ระยะทางเป็นกิโลเมตรระหว่างจุดเชื่อมต่อแต่ละจุด',
                'B' => 'จุดเริ่มต้น A และจุดหมายปลายทาง D',
                'C' => 'สีของหลังคาบ้าน ต้นไม้ริมทาง และร้านกาแฟข้างถนน',
                'D' => 'เส้นทางเชื่อมต่อระหว่างโหนด B และ C',
            ),
            'answer' => 'C',
            'explanation' => 'Abstraction คือการคัดกรองรายละเอียดที่ไม่จำเป็นต่อการแก้ปัญหาออก (เช่น สีบ้าน ต้นไม้ ร้านกาแฟ) และคงไว้เฉพาะโหนดกับระยะทาง',
        ),
        array(
            'id' => 'q4',
            'topic' => 'Algorithm Design (การออกแบบขั้นตอนวิธี)',
            'question' => 'จากผังงานเครื่องคัดแยกผลไม้: เงื่อนไขคือ "น้ำหนัก >= 250 กรัม → เกรด A, มิฉะนั้น → เกรด B" หากผลไม้หนัก 249 กรัม ผลลัพธ์จะเป็นอย่างไร?',
            'options' => array(
                'A' => 'ได้เกรด A เพราะใกล้เคียง 250 กรัม',
                'B' => 'ได้เกรด B เพราะเงื่อนไข 249 >= 250 เป็นเท็จ',
                'C' => 'เครื่องหยุดทำงานและเกิดข้อผิดพลาด',
                'D' => 'ถูกส่งไปชั่งซ้ำไม่รู้จบ',
            ),
            'answer' => 'B',
            'explanation' => 'เงื่อนไข >= 250 ตรวจสอบอย่างเคร่งครัด เมื่อ 249 >= 250 เป็นเท็จ (False) โปรแกรมจึงเดินตามเส้นทาง "ไม่ใช่" ไปยังเกรด B',
        ),
        array(
            'id' => 'q5',
            'topic' => 'Boolean Logic (ตรรกะเงื่อนไข)',
            'question' => 'ระบบเตือนภัยใช้เกต AND ระหว่างเซนเซอร์น้ำสูง (A) และฝนตกหนัก (B): หาก A = จริง แต่วันนี้ B = เท็จ ระบบเตือนภัยจะทำงานหรือไม่?',
            'options' => array(
                'A' => 'ทำงาน เพราะ A เป็นจริงเพียงตัวเดียวก็พอ',
                'B' => 'ไม่ทำงาน เพราะเกต AND ต้องเป็นจริงทั้ง A และ B พร้อมกัน',
                'C' => 'ทำงานเฉพาะช่วงเวลากลางวันเท่านั้น',
                'D' => 'ไม่ทำงานเพราะเซนเซอร์ A เสีย',
            ),
            'answer' => 'B',
            'explanation' => 'ตัวดำเนินการ AND จะให้ผลลัพธ์เป็นจริง (True) ก็ต่อเมื่ออินพุตทุกตัวเป็นจริงพร้อมกัน เมื่อ A=True และ B=False ผลลัพธ์จึงเป็น False (ไม่เตือน)',
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
            'type' => 'illustrated_challenge',
            'answers' => $answers,
            'grading_detail' => $detail,
            'correct_count' => $correctCount,
            'total_questions' => $total,
        ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $ins = $pdo->prepare("
            INSERT INTO ctlab_submissions (
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

        // สำคัญ: ไม่ส่งเฉลย A/B/C/D รายข้อกลับไปให้นักศึกษาเห็น (เก็บไว้ให้เฉพาะอาจารย์ดูใน teacher.html)
        json_response(array(
            'ok' => true,
            'submission_id' => $subId,
            'status' => $status,
            'ai_safe_feedback' => $safeFeedback,
            'message' => 'ส่งคำตอบกิจกรรมที่ 10 เรียบร้อยแล้ว! ระบบบันทึกและวิเคราะห์คำตอบด้วย AI ลงฐานข้อมูลเรียบร้อยแล้ว',
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
