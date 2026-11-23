<?php
/**
 * CT-Lab v4.0 — Student Submission & AI Auto-Grading History API (PHP 5.6+ Compatible)
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/ai_grader.php';

$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';

try {
    $pdo = get_pdo();

    if ($method === 'GET') {
        $action = isset($_GET['action']) ? trim((string)$_GET['action']) : '';
        if ($action === 'roster') {
            $roster = $pdo->query('SELECT student_id, full_name, section FROM ctlab_students ORDER BY student_id ASC')->fetchAll();
            json_response(array('ok' => true, 'students' => $roster));
        }

        $studentId = isset($_GET['student_id']) ? trim((string)$_GET['student_id']) : '';
        if ($studentId === '') {
            json_response(array('ok' => false, 'error' => 'กรุณาระบุรหัสนักศึกษา'), 400);
        }

        $stuStmt = $pdo->prepare('SELECT student_id, full_name, section, updated_at FROM ctlab_students WHERE student_id = ?');
        $stuStmt->execute(array($studentId));
        $student = $stuStmt->fetch();

        $subStmt = $pdo->prepare('
            SELECT id, module_id, completed_count, total_modules, auto_score,
                   ai_score, ai_rubric_json, ai_feedback, ai_model, ai_graded_at,
                   student_note, teacher_score, teacher_feedback, status,
                   submitted_at, graded_at
            FROM ctlab_submissions
            WHERE student_id = ?
            ORDER BY submitted_at DESC, id DESC
            LIMIT 30
        ');
        $subStmt->execute(array($studentId));
        $submissions = $subStmt->fetchAll();

        foreach ($submissions as $idx => $row) {
            $rub = !empty($row['ai_rubric_json']) ? @json_decode((string)$row['ai_rubric_json'], true) : null;
            $submissions[$idx]['ai_rubric'] = is_array($rub) ? $rub : null;
            unset($submissions[$idx]['ai_rubric_json']);
        }

        json_response(array(
            'ok' => true,
            'student' => $student ? $student : null,
            'submissions' => $submissions,
        ));
    }

    if ($method === 'POST') {
        $body = get_json_body();
        $studentId = isset($body['student_id']) ? trim((string)$body['student_id']) : '';
        $fullName = isset($body['full_name']) ? trim((string)$body['full_name']) : '';
        $section = isset($body['section']) ? trim((string)$body['section']) : '';
        $moduleId = isset($body['module_id']) ? trim((string)$body['module_id']) : 'all';
        $studentNote = isset($body['student_note']) ? trim((string)$body['student_note']) : '';
        $completed = (isset($body['completed']) && is_array($body['completed'])) ? $body['completed'] : array();
        $attempts = (isset($body['attempts']) && is_array($body['attempts'])) ? $body['attempts'] : array();
        $snapshot = (isset($body['snapshot']) && is_array($body['snapshot'])) ? $body['snapshot'] : array();

        if ($studentId === '' || ai_len($studentId) > 32) {
            json_response(array('ok' => false, 'error' => 'กรุณากรอกรหัสนักศึกษาให้ถูกต้อง (ไม่เกิน 32 ตัวอักษร)'), 400);
        }
        if ($fullName === '' || ai_len($fullName) > 120) {
            json_response(array('ok' => false, 'error' => 'กรุณากรอกชื่อ-นามสกุล'), 400);
        }
        if ($moduleId === '' || ai_len($moduleId) > 64) {
            $moduleId = 'all';
        }

        $validModules = array('survival', 'books', 'house', 'routes', 'gcd', 'decomposition', 'searching', 'algorithms', 'flowcharts');
        $completedCount = 0;
        foreach ($validModules as $m) {
            if (!empty($completed[$m])) {
                $completedCount++;
            }
        }
        $totalModules = count($validModules);

        if ($moduleId === 'all') {
            $autoScore = round(($completedCount / $totalModules) * 100, 2);
        } else {
            $autoScore = !empty($completed[$moduleId]) ? 100.00 : 0.00;
        }

        $payload = array(
            'completed' => $completed,
            'attempts' => $attempts,
            'snapshot' => $snapshot,
            'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '',
            'client_time' => isset($body['client_time']) ? $body['client_time'] : null,
        );
        $payloadJson = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($payloadJson === false) {
            $payloadJson = '{}';
        }

        // ประมวลผลตรวจงานอัตโนมัติด้วย AI
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

        if (!empty($aiCfg['auto_grade_on_submit'])) {
            $aiResult = ai_grade_submission_payload($moduleId, $completed, $attempts, $snapshot, $studentNote);
            $aiScore = $aiResult['score'];
            $aiRubricJson = json_encode($aiResult['rubric'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $aiFeedback = $aiResult['feedback'];
            $aiModel = $aiResult['model'];
            $aiGradedAt = date('Y-m-d H:i:s');

            if (!empty($aiCfg['auto_approve'])) {
                $threshold = isset($aiCfg['resubmit_threshold']) ? (float)$aiCfg['resubmit_threshold'] : 0.0;
                $status = ($threshold > 0 && $aiScore < $threshold) ? 'resubmit' : 'graded';
                $teacherScore = $aiScore;
                $teacherFeedback = $aiFeedback;
                $gradedAt = $aiGradedAt;
            }
        }

        $pdo->beginTransaction();

        db_upsert_student($pdo, $studentId, $fullName, $section);

        $insertSub = $pdo->prepare("
            INSERT INTO ctlab_submissions (
                student_id, module_id, completed_count, total_modules,
                auto_score, ai_score, ai_rubric_json, ai_feedback, ai_model, ai_graded_at,
                payload_json, student_note, teacher_score, teacher_feedback, status, graded_at
            ) VALUES (
                :student_id, :module_id, :completed_count, :total_modules,
                :auto_score, :ai_score, :ai_rubric_json, :ai_feedback, :ai_model, :ai_graded_at,
                :payload_json, :student_note, :teacher_score, :teacher_feedback, :status, :graded_at
            )
        ");
        $insertSub->execute(array(
            ':student_id' => $studentId,
            ':module_id' => $moduleId,
            ':completed_count' => $completedCount,
            ':total_modules' => $totalModules,
            ':auto_score' => $autoScore,
            ':ai_score' => $aiScore,
            ':ai_rubric_json' => $aiRubricJson,
            ':ai_feedback' => $aiFeedback,
            ':ai_model' => $aiModel,
            ':ai_graded_at' => $aiGradedAt,
            ':payload_json' => $payloadJson,
            ':student_note' => $studentNote !== '' ? $studentNote : null,
            ':teacher_score' => $teacherScore,
            ':teacher_feedback' => $teacherFeedback,
            ':status' => $status,
            ':graded_at' => $gradedAt,
        ));

        $submissionId = (int)$pdo->lastInsertId();
        $pdo->commit();

        json_response(array(
            'ok' => true,
            'submission_id' => $submissionId,
            'auto_score' => $autoScore,
            'ai_score' => $aiScore,
            'ai_rubric' => $aiResult ? $aiResult['rubric'] : null,
            'ai_feedback' => $aiFeedback,
            'ai_model' => $aiModel,
            'status' => $status,
            'completed_count' => $completedCount,
            'total_modules' => $totalModules,
            'message' => $aiResult ? 'ส่งงานและตรวจให้คะแนนด้วย AI อัตโนมัติเรียบร้อยแล้ว' : 'ส่งงานและบันทึกลงฐานข้อมูลเรียบร้อยแล้ว',
        ), 201);
    }

    json_response(array('ok' => false, 'error' => 'Method not allowed'), 405);
} catch (Exception $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_response(array(
        'ok' => false,
        'error' => 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้',
        'detail' => $e->getMessage(),
    ), 500);
}
