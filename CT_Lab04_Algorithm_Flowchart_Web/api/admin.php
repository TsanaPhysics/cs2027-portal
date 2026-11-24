<?php
/**
 * CT-Lab 04 — Teacher Grading, Gradebook & AI Auto-Report API (PHP 5.6+ Compatible)
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/ai_grader.php';

session_start();

$action = isset($_GET['action']) ? (string)$_GET['action'] : (isset($_POST['action']) ? (string)$_POST['action'] : 'list');

function is_teacher_authenticated()
{
    if (!empty($_SESSION['ct04_teacher_auth'])) {
        return true;
    }
    $headerPin = isset($_SERVER['HTTP_X_TEACHER_PIN']) ? (string)$_SERVER['HTTP_X_TEACHER_PIN'] : '';
    return $headerPin !== '' && hash_equals(CT_LAB04_TEACHER_PIN, $headerPin);
}

try {
    if ($action === 'login') {
        $body = get_json_body();
        $pin = isset($body['pin']) ? trim((string)$body['pin']) : (isset($_POST['pin']) ? trim((string)$_POST['pin']) : '');
        if ($pin === '' || !hash_equals(CT_LAB04_TEACHER_PIN, $pin)) {
            json_response(array('ok' => false, 'error' => 'รหัสผ่านอาจารย์ไม่ถูกต้อง'), 401);
        }
        $_SESSION['ct04_teacher_auth'] = true;
        json_response(array('ok' => true));
    }

    if ($action === 'logout') {
        $_SESSION['ct04_teacher_auth'] = false;
        session_destroy();
        json_response(array('ok' => true));
    }

    if ($action === 'check') {
        json_response(array('ok' => true, 'authenticated' => is_teacher_authenticated()));
    }

    if (!is_teacher_authenticated()) {
        json_response(array('ok' => false, 'error' => 'กรุณาเข้าสู่ระบบอาจารย์ก่อน'), 401);
    }

    if ($action === 'answers') {
        require_once __DIR__ . '/challenge.php';
        json_response(array('ok' => true, 'answers' => get_challenge_bank()));
    }

    $pdo = get_pdo();
    $reqMethod = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : '';

    if ($action === 'list') {
        $section = isset($_GET['section']) ? trim((string)$_GET['section']) : '';
        $status = isset($_GET['status']) ? trim((string)$_GET['status']) : '';
        $moduleId = isset($_GET['module_id']) ? trim((string)$_GET['module_id']) : '';
        $studentId = isset($_GET['student_id']) ? trim((string)$_GET['student_id']) : '';
        $q = isset($_GET['q']) ? trim((string)$_GET['q']) : '';

        $where = array();
        $params = array();
        if ($section !== '') {
            $where[] = 'st.section = :section';
            $params[':section'] = $section;
        }
        if ($studentId !== '') {
            $where[] = 'sub.student_id = :student_id';
            $params[':student_id'] = $studentId;
        }
        if ($moduleId !== '') {
            $where[] = 'sub.module_id = :module_id';
            $params[':module_id'] = $moduleId;
        }
        if ($status !== '' && in_array($status, array('submitted', 'graded', 'resubmit'), true)) {
            $where[] = 'sub.status = :status';
            $params[':status'] = $status;
        }
        if ($q !== '') {
            $where[] = '(st.student_id LIKE :q1 OR st.full_name LIKE :q2)';
            $params[':q1'] = '%' . $q . '%';
            $params[':q2'] = '%' . $q . '%';
        }

        $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

        $sql = "
            SELECT sub.id, sub.student_id, st.full_name, st.section,
                   sub.module_id, sub.completed_count, sub.total_modules,
                   sub.auto_score, sub.ai_score, sub.ai_rubric_json,
                   sub.ai_feedback, sub.ai_model, sub.ai_graded_at,
                   sub.payload_json, sub.student_note,
                   sub.teacher_score, sub.teacher_feedback, sub.status,
                   sub.submitted_at, sub.graded_at
            FROM ctlab04_submissions sub
            INNER JOIN ctlab04_students st ON st.student_id = sub.student_id
            $whereSql
            ORDER BY sub.submitted_at DESC, sub.id DESC
            LIMIT 500
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $kpi = $pdo->query("
            SELECT
                (SELECT COUNT(*) FROM ctlab04_students) AS total_students,
                COUNT(*) AS total_submissions,
                SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS pending_count,
                SUM(CASE WHEN status = 'graded' THEN 1 ELSE 0 END) AS graded_count,
                SUM(CASE WHEN status = 'resubmit' THEN 1 ELSE 0 END) AS resubmit_count,
                ROUND(AVG(COALESCE(teacher_score, ai_score, auto_score)), 2) AS avg_score
            FROM ctlab04_submissions
        ")->fetch();

        $sections = $pdo->query("SELECT DISTINCT section FROM ctlab04_students WHERE section <> '' ORDER BY section ASC")->fetchAll(PDO::FETCH_COLUMN);
        $studentsList = $pdo->query("SELECT student_id, full_name, section FROM ctlab04_students ORDER BY student_id ASC")->fetchAll();

        json_response(array(
            'ok' => true,
            'db_engine' => db_driver($pdo),
            'kpi' => $kpi,
            'sections' => $sections,
            'students' => $studentsList,
            'submissions' => $rows,
        ));
    }

    if ($action === 'roster') {
        $roster = $pdo->query("
            SELECT st.student_id, st.full_name, st.section,
                   COUNT(sub.id) AS submit_count,
                   MAX(sub.submitted_at) AS last_submitted_at,
                   (SELECT s2.status FROM ctlab04_submissions s2 WHERE s2.student_id = st.student_id ORDER BY s2.submitted_at DESC, s2.id DESC LIMIT 1) AS latest_status,
                   (SELECT COALESCE(s2.teacher_score, s2.ai_score, s2.auto_score) FROM ctlab04_submissions s2 WHERE s2.student_id = st.student_id ORDER BY s2.submitted_at DESC, s2.id DESC LIMIT 1) AS latest_score,
                   (SELECT s2.completed_count FROM ctlab04_submissions s2 WHERE s2.student_id = st.student_id ORDER BY s2.submitted_at DESC, s2.id DESC LIMIT 1) AS latest_completed
            FROM ctlab04_students st
            LEFT JOIN ctlab04_submissions sub ON sub.student_id = st.student_id
            GROUP BY st.student_id, st.full_name, st.section
            ORDER BY st.student_id ASC
        ")->fetchAll();
        json_response(array('ok' => true, 'roster' => $roster));
    }

    if ($action === 'gradebook' || $action === 'export_gradebook') {
        $section = isset($_GET['section']) ? trim((string)$_GET['section']) : '';
        $gb = build_gradebook_data($pdo, $section);

        if ($action === 'export_gradebook') {
            $filename = 'CT_Lab04_Gradebook_' . date('Y-m-d') . '.csv';
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $filename . '"');

            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, array(
                'ลำดับ', 'รหัสนักศึกษา', 'ชื่อ-นามสกุล', 'กลุ่มเรียน',
                '01 Algorithm Design', '02 Pseudocode', '03 Flowchart', '04 Lab 4 & Trace Table', '05 Assessment',
                'ส่งแล้ว (โมดูล)', 'คะแนนรวม (เต็ม 500)', 'คะแนนเฉลี่ย (%)'
            ));
            foreach ($gb['rows'] as $idx => $r) {
                $sc = $r['scores'];
                fputcsv($out, array(
                    $idx + 1,
                    $r['student_id'],
                    $r['full_name'],
                    $r['section'],
                    $sc['algo_design'] !== null ? $sc['algo_design'] : '',
                    $sc['pseudocode'] !== null ? $sc['pseudocode'] : '',
                    $sc['flowchart'] !== null ? $sc['flowchart'] : '',
                    $sc['lab4_tracetable'] !== null ? $sc['lab4_tracetable'] : '',
                    $sc['challenge10'] !== null ? $sc['challenge10'] : '',
                    $r['completed_modules'],
                    $r['total_score'],
                    $r['avg_score']
                ));
            }
            fclose($out);
            exit;
        }

        json_response(array(
            'ok' => true,
            'modules' => $gb['modules'],
            'sections' => $gb['sections'],
            'rows' => $gb['rows'],
        ));
    }

    if ($action === 'grade' && $reqMethod === 'POST') {
        $body = get_json_body();
        $id = isset($body['id']) ? (int)$body['id'] : 0;
        $status = isset($body['status']) ? trim((string)$body['status']) : 'graded';
        $feedback = isset($body['teacher_feedback']) ? trim((string)$body['teacher_feedback']) : '';
        $rawScore = isset($body['teacher_score']) ? $body['teacher_score'] : null;

        if ($id <= 0) json_response(array('ok' => false, 'error' => 'ไม่พบรหัสการส่งงาน'), 400);
        if (!in_array($status, array('submitted', 'graded', 'resubmit'), true)) {
            json_response(array('ok' => false, 'error' => 'สถานะไม่ถูกต้อง'), 400);
        }

        $score = null;
        if ($rawScore !== null && $rawScore !== '') {
            $score = (float)$rawScore;
            if ($score < 0 || $score > 100) json_response(array('ok' => false, 'error' => 'คะแนนต้องอยู่ระหว่าง 0 ถึง 100'), 400);
        }

        $stmt = $pdo->prepare('
            UPDATE ctlab04_submissions
            SET teacher_score = :score,
                teacher_feedback = :feedback,
                status = :status,
                graded_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ');
        $stmt->execute(array(
            ':score' => $score,
            ':feedback' => $feedback !== '' ? $feedback : null,
            ':status' => $status,
            ':id' => $id,
        ));

        // ส่งการแจ้งเตือนกลับให้นักศึกษาพร้อมบันทึกลงฐานข้อมูลวิเคราะห์ข้อผิดพลาด
        $fbFile = dirname(dirname(__DIR__)) . '/api_student_feedback.php';
        if (file_exists($fbFile)) {
            require_once $fbFile;
            try {
                $sStmt = $pdo->prepare("
                    SELECT sub.*, st.full_name, st.section
                    FROM ctlab04_submissions sub
                    LEFT JOIN ctlab04_students st ON st.student_id = sub.student_id
                    WHERE sub.id = ?
                ");
                $sStmt->execute(array($id));
                $sRow = $sStmt->fetch();
                if ($sRow) {
                    $rub = !empty($sRow['ai_rubric_json']) ? @json_decode((string)$sRow['ai_rubric_json'], true) : array();
                    fb_record_notification($pdo, array(
                        'student_id' => $sRow['student_id'],
                        'full_name' => !empty($sRow['full_name']) ? $sRow['full_name'] : $sRow['student_id'],
                        'section' => !empty($sRow['section']) ? $sRow['section'] : '',
                        'game_id' => 'ctlab04',
                        'module_id' => $sRow['module_id'],
                        'submission_id' => (int)$id,
                        'score' => $score !== null ? $score : (float)($sRow['ai_score'] !== null ? $sRow['ai_score'] : $sRow['auto_score']),
                        'rubric' => is_array($rub) ? $rub : array(),
                        'teacher_comment' => $feedback !== '' ? $feedback : $sRow['ai_feedback'],
                        'notify_source' => 'อาจารย์ผู้สอนตรวจและแจ้งเตือนกลับ',
                        'status' => $status,
                    ));
                }
            } catch (Exception $fe) {}
        }

        json_response(array('ok' => true, 'message' => 'บันทึกผลการตรวจและส่งแจ้งเตือนคะแนน/ข้อผิดพลาด/แนวทางแก้ไขกลับให้นักศึกษาเรียบร้อยแล้ว'));
    }

    if ($action === 'submission_delete' && $reqMethod === 'POST') {
        $body = get_json_body();
        $id = isset($body['id']) ? (int)$body['id'] : 0;
        if ($id <= 0) json_response(array('ok' => false, 'error' => 'ไม่พบรหัสรายการส่งงาน'), 400);
        $stmt = $pdo->prepare('DELETE FROM ctlab04_submissions WHERE id = ?');
        $stmt->execute(array($id));
        json_response(array('ok' => true, 'message' => 'ลบรายการส่งงานเรียบร้อยแล้ว'));
    }

    if ($action === 'student_save' && $reqMethod === 'POST') {
        $body = get_json_body();
        $origId = isset($body['original_id']) ? trim((string)$body['original_id']) : '';
        $studentId = isset($body['student_id']) ? trim((string)$body['student_id']) : '';
        $fullName = isset($body['full_name']) ? trim((string)$body['full_name']) : '';
        $section = isset($body['section']) ? trim((string)$body['section']) : '';

        if ($studentId === '' || ai_len($studentId) > 32) {
            json_response(array('ok' => false, 'error' => 'กรุณากรอกรหัสนักศึกษาให้ถูกต้อง'), 400);
        }
        if ($fullName === '' || ai_len($fullName) > 120) {
            json_response(array('ok' => false, 'error' => 'กรุณากรอกชื่อ-นามสกุล'), 400);
        }

        if ($origId !== '') {
            $stmt = $pdo->prepare('UPDATE ctlab04_students SET student_id = :new_id, full_name = :full_name, section = :section WHERE student_id = :orig_id');
            $stmt->execute(array(':new_id' => $studentId, ':full_name' => $fullName, ':section' => $section, ':orig_id' => $origId));
            json_response(array('ok' => true, 'message' => 'แก้ไขข้อมูลนักศึกษาเรียบร้อยแล้ว'));
        } else {
            db_upsert_student($pdo, $studentId, $fullName, $section);
            json_response(array('ok' => true, 'message' => 'เพิ่มข้อมูลนักศึกษาเรียบร้อยแล้ว'));
        }
    }

    if ($action === 'student_delete' && $reqMethod === 'POST') {
        $body = get_json_body();
        $studentId = isset($body['student_id']) ? trim((string)$body['student_id']) : '';
        if ($studentId === '') json_response(array('ok' => false, 'error' => 'ไม่พบรหัสนักศึกษา'), 400);
        $stmt = $pdo->prepare('DELETE FROM ctlab04_students WHERE student_id = ?');
        $stmt->execute(array($studentId));
        json_response(array('ok' => true, 'message' => 'ลบข้อมูลนักศึกษาเรียบร้อยแล้ว'));
    }

    if ($action === 'export') {
        $rows = $pdo->query("
            SELECT sub.id, sub.student_id, st.full_name, st.section,
                   sub.module_id, sub.completed_count, sub.total_modules,
                   sub.auto_score, sub.ai_score, sub.teacher_score, sub.status,
                   sub.student_note, sub.ai_feedback, sub.teacher_feedback,
                   sub.submitted_at, sub.graded_at
            FROM ctlab04_submissions sub
            INNER JOIN ctlab04_students st ON st.student_id = sub.student_id
            ORDER BY st.section ASC, sub.student_id ASC, sub.submitted_at DESC
        ")->fetchAll();

        $filename = 'CT_Lab04_Submissions_' . date('Y-m-d') . '.csv';
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');

        $out = fopen('php://output', 'w');
        fwrite($out, "\xEF\xBB\xBF");
        fputcsv($out, array('ID', 'รหัสนักศึกษา', 'ชื่อ-นามสกุล', 'กลุ่มเรียน', 'โมดูลที่ส่ง', 'ผ่าน', 'ทั้งหมด', 'คะแนนระบบ', 'คะแนน AI', 'คะแนนอาจารย์', 'สถานะ', 'บันทึกนักศึกษา', 'ผลวิเคราะห์ AI', 'ข้อเสนอแนะอาจารย์', 'เวลาส่งงาน', 'เวลาตรวจ'));
        foreach ($rows as $r) {
            fputcsv($out, array($r['id'], $r['student_id'], $r['full_name'], $r['section'], $r['module_id'], $r['completed_count'], $r['total_modules'], $r['auto_score'], $r['ai_score'], $r['teacher_score'], $r['status'], $r['student_note'], $r['ai_feedback'], $r['teacher_feedback'], $r['submitted_at'], $r['graded_at']));
        }
        fclose($out);
        exit;
    }

    if ($action === 'ai_grade_single' && $reqMethod === 'POST') {
        $body = get_json_body();
        $id = isset($body['id']) ? (int)$body['id'] : 0;
        $applyToTeacher = array_key_exists('apply_to_teacher', $body) ? (bool)$body['apply_to_teacher'] : true;
        if ($id <= 0) json_response(array('ok' => false, 'error' => 'ไม่พบรหัสรายการส่งงาน'), 400);

        $stmt = $pdo->prepare('SELECT * FROM ctlab04_submissions WHERE id = ?');
        $stmt->execute(array($id));
        $row = $stmt->fetch();
        if (!$row) json_response(array('ok' => false, 'error' => 'ไม่พบข้อมูล #' . $id), 404);

        $res = ai_grade_existing_submission($pdo, $row, $applyToTeacher);
        json_response(array(
            'ok' => true,
            'id' => $id,
            'ai_score' => $res['score'],
            'ai_rubric' => $res['rubric'],
            'ai_feedback' => $res['feedback'],
            'ai_model' => $res['model'],
            'status' => $res['status'],
            'message' => 'AI วิเคราะห์และให้คะแนนงาน #' . $id . ' เรียบร้อยแล้ว (' . $res['score'] . '%)',
        ));
    }

    if ($action === 'ai_grade_batch' && $reqMethod === 'POST') {
        $body = get_json_body();
        $mode = isset($body['mode']) ? trim((string)$body['mode']) : 'pending';
        $rows = ($mode === 'all')
            ? $pdo->query('SELECT * FROM ctlab04_submissions ORDER BY id ASC')->fetchAll()
            : $pdo->query("SELECT * FROM ctlab04_submissions WHERE status = 'submitted' OR ai_score IS NULL ORDER BY id ASC")->fetchAll();
        $count = 0;
        foreach ($rows as $r) {
            ai_grade_existing_submission($pdo, $r, true);
            $count++;
        }
        json_response(array(
            'ok' => true,
            'graded_count' => $count,
            'mode' => $mode,
            'message' => $count > 0 ? "AI ตรวจงานอัตโนมัติสำเร็จจำนวน $count รายการ" : 'ไม่มีรายการที่ต้องตรวจเพิ่มเติม',
        ));
    }

    if ($action === 'ai_report') {
        $section = '';
        $saveToDb = ($reqMethod === 'POST');
        if ($reqMethod === 'POST') {
            $body = get_json_body();
            $section = isset($body['section']) ? trim((string)$body['section']) : '';
            if (array_key_exists('save', $body)) $saveToDb = (bool)$body['save'];
        } else {
            $section = isset($_GET['section']) ? trim((string)$_GET['section']) : '';
            if (isset($_GET['save']) && $_GET['save'] === '1') $saveToDb = true;
        }
        $report = ai_generate_class_report($pdo, $section, $saveToDb);
        $history = ai_get_latest_reports($pdo, 10);
        $sections = $pdo->query("SELECT DISTINCT section FROM ctlab04_students WHERE section <> '' ORDER BY section ASC")->fetchAll(PDO::FETCH_COLUMN);
        json_response(array('ok' => true, 'db_engine' => db_driver($pdo), 'sections' => $sections, 'report' => $report, 'history' => $history));
    }

    if ($action === 'ai_config_get') {
        $cfg = get_ai_config();
        json_response(array(
            'ok' => true,
            'config' => array(
                'auto_grade_on_submit' => (bool)$cfg['auto_grade_on_submit'],
                'auto_approve' => (bool)$cfg['auto_approve'],
                'resubmit_threshold' => (float)$cfg['resubmit_threshold'],
                'provider' => $cfg['provider'],
                'has_gemini_key' => !empty($cfg['gemini_api_key']),
                'gemini_model' => $cfg['gemini_model'],
                'ollama_url' => $cfg['ollama_url'],
                'ollama_model' => $cfg['ollama_model'],
            ),
        ));
    }

    if ($action === 'ai_config_save' && $reqMethod === 'POST') {
        $saved = save_ai_config(get_json_body());
        if ($saved === false) json_response(array('ok' => false, 'error' => 'บันทึกการตั้งค่า AI ไม่สำเร็จ'), 500);
        json_response(array('ok' => true, 'message' => 'บันทึกการตั้งค่าระบบตรวจงาน AI เรียบร้อยแล้ว'));
    }

    if ($action === 'seed_demo_submissions' && $reqMethod === 'POST') {
        $seedRes = ai_seed_demo_submissions($pdo);
        json_response(array(
            'ok' => true,
            'created' => $seedRes['created'],
            'message' => $seedRes['created'] > 0
                ? 'จำลองข้อมูลการส่งงานและตรวจให้คะแนนด้วย AI สำเร็จ ' . $seedRes['created'] . ' คน'
                : 'นักศึกษาตัวอย่างมีข้อมูลการส่งงานในฐานข้อมูลแล้ว',
        ));
    }

    json_response(array('ok' => false, 'error' => 'Invalid action'), 400);
} catch (Exception $e) {
    json_response(array('ok' => false, 'error' => 'เกิดข้อผิดพลาดในระบบฐานข้อมูล', 'detail' => $e->getMessage()), 500);
}

function build_gradebook_data($pdo, $section = '')
{
    $modules = array('algo_design', 'pseudocode', 'flowchart', 'lab4_tracetable', 'challenge10');
    $sections = $pdo->query("SELECT DISTINCT section FROM ctlab04_students WHERE section <> '' ORDER BY section ASC")->fetchAll(PDO::FETCH_COLUMN);

    if ($section !== '') {
        $stStmt = $pdo->prepare('SELECT student_id, full_name, section FROM ctlab04_students WHERE section = ? ORDER BY student_id ASC');
        $stStmt->execute(array($section));
        $students = $stStmt->fetchAll();
    } else {
        $students = $pdo->query('SELECT student_id, full_name, section FROM ctlab04_students ORDER BY student_id ASC')->fetchAll();
    }

    $subRows = $pdo->query('SELECT student_id, module_id, ai_rubric_json, COALESCE(teacher_score, ai_score, auto_score) AS best_score FROM ctlab04_submissions')->fetchAll();
    $bestMap = array();

    foreach ($subRows as $sr) {
        $sid = $sr['student_id'];
        $mod = $sr['module_id'] === 'challenge' ? 'challenge10' : $sr['module_id'];
        if ($mod === 'all' && !empty($sr['ai_rubric_json'])) {
            $rub = @json_decode((string)$sr['ai_rubric_json'], true);
            if (is_array($rub) && !empty($rub['modules']) && is_array($rub['modules'])) {
                foreach ($rub['modules'] as $mk => $mev) {
                    if (!in_array($mk, $modules, true)) continue;
                    $mTot = isset($mev['total']) ? (float)$mev['total'] : 0.0;
                    if ($mTot <= 0 && empty($mev['completed']) && empty($mev['has_semi_seq']) && empty($mev['has_subjective'])) continue;
                    if (!isset($bestMap[$sid])) $bestMap[$sid] = array();
                    if (!isset($bestMap[$sid][$mk]) || $mTot > $bestMap[$sid][$mk]) $bestMap[$sid][$mk] = $mTot;
                }
            }
            continue;
        }
        if (!in_array($mod, $modules, true)) continue;
        $val = (float)$sr['best_score'];
        if (!isset($bestMap[$sid])) $bestMap[$sid] = array();
        if (!isset($bestMap[$sid][$mod]) || $val > $bestMap[$sid][$mod]) $bestMap[$sid][$mod] = $val;
    }

    $rows = array();
    foreach ($students as $st) {
        $sid = $st['student_id'];
        $scores = array();
        $completedMods = 0;
        $totalScore = 0.0;
        foreach ($modules as $m) {
            if (isset($bestMap[$sid][$m])) {
                $v = round($bestMap[$sid][$m], 1);
                $scores[$m] = $v;
                $completedMods++;
                $totalScore += $v;
            } else {
                $scores[$m] = null;
            }
        }
        $rows[] = array(
            'student_id' => $sid,
            'full_name' => $st['full_name'],
            'section' => $st['section'],
            'scores' => $scores,
            'completed_modules' => $completedMods,
            'total_score' => round($totalScore, 1),
            'avg_score' => $completedMods > 0 ? round($totalScore / $completedMods, 1) : 0.0,
        );
    }

    return array('modules' => $modules, 'sections' => $sections, 'rows' => $rows);
}
