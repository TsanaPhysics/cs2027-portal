<?php
/**
 * CT-Lab v4.0 — Teacher Grading & Admin API (PHP 5.6+ Compatible)
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/ai_grader.php';

session_start();

$action = isset($_GET['action']) ? (string)$_GET['action'] : (isset($_POST['action']) ? (string)$_POST['action'] : 'list');

function is_teacher_authenticated()
{
    if (!empty($_SESSION['ct_teacher_auth'])) {
        return true;
    }
    $headerPin = isset($_SERVER['HTTP_X_TEACHER_PIN']) ? (string)$_SERVER['HTTP_X_TEACHER_PIN'] : '';
    return $headerPin !== '' && hash_equals(CT_LAB_TEACHER_PIN, $headerPin);
}

try {
    if ($action === 'login') {
        $body = get_json_body();
        $pin = isset($body['pin']) ? trim((string)$body['pin']) : (isset($_POST['pin']) ? trim((string)$_POST['pin']) : '');
        if ($pin === '' || !hash_equals(CT_LAB_TEACHER_PIN, $pin)) {
            json_response(array('ok' => false, 'error' => 'รหัสผ่านอาจารย์ไม่ถูกต้อง'), 401);
        }
        $_SESSION['ct_teacher_auth'] = true;
        json_response(array('ok' => true));
    }

    if ($action === 'logout') {
        $_SESSION['ct_teacher_auth'] = false;
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
            if ($moduleId === 'cat:thinking') {
                $where[] = "sub.module_id IN ('survival','books','house','routes','decomposition')";
            } elseif ($moduleId === 'cat:algorithms') {
                $where[] = "sub.module_id IN ('gcd','searching','algorithms','flowcharts')";
            } elseif ($moduleId === 'cat:assessment') {
                $where[] = "sub.module_id IN ('challenge','challenge10')";
            } else {
                $where[] = 'sub.module_id = :module_id';
                $params[':module_id'] = $moduleId;
            }
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
            FROM ctlab_submissions sub
            INNER JOIN ctlab_students st ON st.student_id = sub.student_id
            $whereSql
            ORDER BY sub.submitted_at DESC, sub.id DESC
            LIMIT 500
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $kpi = $pdo->query("
            SELECT
                (SELECT COUNT(*) FROM ctlab_students) AS total_students,
                COUNT(*) AS total_submissions,
                SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS pending_count,
                SUM(CASE WHEN status = 'graded' THEN 1 ELSE 0 END) AS graded_count,
                SUM(CASE WHEN status = 'resubmit' THEN 1 ELSE 0 END) AS resubmit_count,
                ROUND(AVG(COALESCE(teacher_score, ai_score, auto_score)), 2) AS avg_score
            FROM ctlab_submissions
        ")->fetch();

        $sections = $pdo->query("
            SELECT DISTINCT section FROM ctlab_students WHERE section <> '' ORDER BY section ASC
        ")->fetchAll(PDO::FETCH_COLUMN);

        $studentsList = $pdo->query("
            SELECT student_id, full_name, section FROM ctlab_students ORDER BY student_id ASC
        ")->fetchAll();

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
                   (SELECT s2.status FROM ctlab_submissions s2 WHERE s2.student_id = st.student_id ORDER BY s2.submitted_at DESC, s2.id DESC LIMIT 1) AS latest_status,
                   (SELECT COALESCE(s2.teacher_score, s2.ai_score, s2.auto_score) FROM ctlab_submissions s2 WHERE s2.student_id = st.student_id ORDER BY s2.submitted_at DESC, s2.id DESC LIMIT 1) AS latest_score,
                   (SELECT s2.completed_count FROM ctlab_submissions s2 WHERE s2.student_id = st.student_id ORDER BY s2.submitted_at DESC, s2.id DESC LIMIT 1) AS latest_completed
            FROM ctlab_students st
            LEFT JOIN ctlab_submissions sub ON sub.student_id = st.student_id
            GROUP BY st.student_id, st.full_name, st.section
            ORDER BY st.student_id ASC
        ")->fetchAll();
        json_response(array('ok' => true, 'roster' => $roster));
    }

    if ($action === 'gradebook' || $action === 'export_gradebook') {
        $section = isset($_GET['section']) ? trim((string)$_GET['section']) : '';
        $gb = build_gradebook_data($pdo, $section);

        if ($action === 'export_gradebook') {
            $filename = 'CT_Lab_Gradebook_' . date('Y-m-d') . '.csv';
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $filename . '"');

            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, array(
                'ลำดับ', 'รหัสนักศึกษา', 'ชื่อ-นามสกุล', 'กลุ่มเรียน',
                '01 สถานการณ์ชวนคิด', '02 แนะนำหนังสือ', '03 บ้านตามพิกัด', '04 ไปให้ครบทุกที่',
                '05 หา ห.ร.ม.', '06 การย่อยปัญหา', '07 การค้นหาข้อมูล', '08 ออกแบบขั้นตอนวิธี',
                '09 เกมเรียงผังงาน', '10 แบบฝึกหัดภาพประกอบ',
                'ส่งแล้ว (โมดูล)', 'คะแนนรวม (เต็ม 1000)', 'คะแนนเฉลี่ย (%)'
            ));
            foreach ($gb['rows'] as $idx => $r) {
                $sc = $r['scores'];
                fputcsv($out, array(
                    $idx + 1,
                    $r['student_id'],
                    $r['full_name'],
                    $r['section'],
                    $sc['survival'] !== null ? $sc['survival'] : '',
                    $sc['books'] !== null ? $sc['books'] : '',
                    $sc['house'] !== null ? $sc['house'] : '',
                    $sc['routes'] !== null ? $sc['routes'] : '',
                    $sc['gcd'] !== null ? $sc['gcd'] : '',
                    $sc['decomposition'] !== null ? $sc['decomposition'] : '',
                    $sc['searching'] !== null ? $sc['searching'] : '',
                    $sc['algorithms'] !== null ? $sc['algorithms'] : '',
                    $sc['flowcharts'] !== null ? $sc['flowcharts'] : '',
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

    $reqMethod = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : '';
    if ($action === 'grade' && $reqMethod === 'POST') {
        $body = get_json_body();
        $id = isset($body['id']) ? (int)$body['id'] : 0;
        $status = isset($body['status']) ? trim((string)$body['status']) : 'graded';
        $feedback = isset($body['teacher_feedback']) ? trim((string)$body['teacher_feedback']) : '';
        $rawScore = isset($body['teacher_score']) ? $body['teacher_score'] : null;

        if ($id <= 0) {
            json_response(array('ok' => false, 'error' => 'ไม่พบรหัสการส่งงาน'), 400);
        }
        if (!in_array($status, array('submitted', 'graded', 'resubmit'), true)) {
            json_response(array('ok' => false, 'error' => 'สถานะไม่ถูกต้อง'), 400);
        }

        $score = null;
        if ($rawScore !== null && $rawScore !== '') {
            $score = (float)$rawScore;
            if ($score < 0 || $score > 100) {
                json_response(array('ok' => false, 'error' => 'คะแนนต้องอยู่ระหว่าง 0 ถึง 100'), 400);
            }
        }

        $stmt = $pdo->prepare('
            UPDATE ctlab_submissions
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

        json_response(array('ok' => true, 'message' => 'บันทึกผลการตรวจเรียบร้อยแล้ว'));
    }

    if ($action === 'submission_delete' && $reqMethod === 'POST') {
        $body = get_json_body();
        $id = isset($body['id']) ? (int)$body['id'] : 0;
        if ($id <= 0) {
            json_response(array('ok' => false, 'error' => 'ไม่พบรหัสรายการส่งงาน'), 400);
        }
        $stmt = $pdo->prepare('DELETE FROM ctlab_submissions WHERE id = ?');
        $stmt->execute(array($id));
        json_response(array('ok' => true, 'message' => 'ลบรายการส่งงานเรียบร้อยแล้ว'));
    }

    if ($action === 'student_save' && $reqMethod === 'POST') {
        $body = get_json_body();
        $origId = isset($body['original_id']) ? trim((string)$body['original_id']) : '';
        $studentId = isset($body['student_id']) ? trim((string)$body['student_id']) : '';
        $fullName = isset($body['full_name']) ? trim((string)$body['full_name']) : '';
        $section = isset($body['section']) ? trim((string)$body['section']) : '';

        if ($studentId === '' || mb_strlen($studentId, 'UTF-8') > 32) {
            json_response(array('ok' => false, 'error' => 'กรุณากรอกรหัสนักศึกษาให้ถูกต้อง (ไม่เกิน 32 ตัวอักษร)'), 400);
        }
        if ($fullName === '' || mb_strlen($fullName, 'UTF-8') > 120) {
            json_response(array('ok' => false, 'error' => 'กรุณากรอกชื่อ-นามสกุล'), 400);
        }

        if ($origId !== '') {
            $stmt = $pdo->prepare('
                UPDATE ctlab_students
                SET student_id = :new_id, full_name = :full_name, section = :section
                WHERE student_id = :orig_id
            ');
            $stmt->execute(array(
                ':new_id' => $studentId,
                ':full_name' => $fullName,
                ':section' => $section,
                ':orig_id' => $origId,
            ));
            json_response(array('ok' => true, 'message' => 'แก้ไขข้อมูลนักศึกษาเรียบร้อยแล้ว'));
        } else {
            db_upsert_student($pdo, $studentId, $fullName, $section);
            json_response(array('ok' => true, 'message' => 'เพิ่มข้อมูลนักศึกษาเรียบร้อยแล้ว'));
        }
    }

    if ($action === 'student_delete' && $reqMethod === 'POST') {
        $body = get_json_body();
        $studentId = isset($body['student_id']) ? trim((string)$body['student_id']) : '';
        if ($studentId === '') {
            json_response(array('ok' => false, 'error' => 'ไม่พบรหัสนักศึกษา'), 400);
        }
        $stmt = $pdo->prepare('DELETE FROM ctlab_students WHERE student_id = ?');
        $stmt->execute(array($studentId));
        json_response(array('ok' => true, 'message' => 'ลบข้อมูลนักศึกษาและประวัติการส่งงานที่เกี่ยวข้องเรียบร้อยแล้ว'));
    }

    if ($action === 'export') {
        $rows = $pdo->query("
            SELECT sub.id, sub.student_id, st.full_name, st.section,
                   sub.module_id, sub.completed_count, sub.total_modules,
                   sub.auto_score, sub.ai_score, sub.teacher_score, sub.status,
                   sub.student_note, sub.ai_feedback, sub.teacher_feedback,
                   sub.submitted_at, sub.graded_at
            FROM ctlab_submissions sub
            INNER JOIN ctlab_students st ON st.student_id = sub.student_id
            ORDER BY st.section ASC, sub.student_id ASC, sub.submitted_at DESC
        ")->fetchAll();

        $filename = 'CT_Lab_Submissions_' . date('Y-m-d') . '.csv';
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');

        $out = fopen('php://output', 'w');
        fwrite($out, "\xEF\xBB\xBF");
        fputcsv($out, array(
            'ID', 'รหัสนักศึกษา', 'ชื่อ-นามสกุล', 'กลุ่มเรียน',
            'โมดูลที่ส่ง', 'กิจกรรมที่ผ่าน', 'กิจกรรมทั้งหมด',
            'คะแนนอัตโนมัติ', 'คะแนน AI', 'คะแนนอาจารย์', 'สถานะ',
            'บันทึกนักศึกษา', 'ผลวิเคราะห์ AI', 'ข้อเสนอแนะอาจารย์', 'เวลาส่งงาน', 'เวลาตรวจ'
        ));
        foreach ($rows as $r) {
            fputcsv($out, array(
                $r['id'],
                $r['student_id'],
                $r['full_name'],
                $r['section'],
                $r['module_id'],
                $r['completed_count'],
                $r['total_modules'],
                $r['auto_score'],
                $r['ai_score'],
                $r['teacher_score'],
                $r['status'],
                $r['student_note'],
                $r['ai_feedback'],
                $r['teacher_feedback'],
                $r['submitted_at'],
                $r['graded_at'],
            ));
        }
        fclose($out);
        exit;
    }

    if ($action === 'ai_grade_single' && $reqMethod === 'POST') {
        $body = get_json_body();
        $id = isset($body['id']) ? (int)$body['id'] : 0;
        $applyToTeacher = array_key_exists('apply_to_teacher', $body) ? (bool)$body['apply_to_teacher'] : true;
        if ($id <= 0) {
            json_response(array('ok' => false, 'error' => 'ไม่พบรหัสรายการส่งงาน'), 400);
        }
        $stmt = $pdo->prepare('SELECT * FROM ctlab_submissions WHERE id = ?');
        $stmt->execute(array($id));
        $row = $stmt->fetch();
        if (!$row) {
            json_response(array('ok' => false, 'error' => 'ไม่พบข้อมูลการส่งงาน #' . $id), 404);
        }
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
        if ($mode === 'all') {
            $rows = $pdo->query('SELECT * FROM ctlab_submissions ORDER BY id ASC')->fetchAll();
        } else {
            $rows = $pdo->query("SELECT * FROM ctlab_submissions WHERE status = 'submitted' OR ai_score IS NULL ORDER BY id ASC")->fetchAll();
        }
        $count = 0;
        foreach ($rows as $r) {
            ai_grade_existing_submission($pdo, $r, true);
            $count++;
        }
        json_response(array(
            'ok' => true,
            'graded_count' => $count,
            'mode' => $mode,
            'message' => $count > 0
                ? "AI ตรวจงานและบันทึกคะแนนอัตโนมัติสำเร็จจำนวน $count รายการ"
                : 'ไม่มีรายการที่ต้องตรวจเพิ่มเติมในขณะนี้',
        ));
    }

    if ($action === 'ai_report') {
        $section = '';
        $saveToDb = ($reqMethod === 'POST');
        if ($reqMethod === 'POST') {
            $body = get_json_body();
            $section = isset($body['section']) ? trim((string)$body['section']) : '';
            if (array_key_exists('save', $body)) {
                $saveToDb = (bool)$body['save'];
            }
        } else {
            $section = isset($_GET['section']) ? trim((string)$_GET['section']) : '';
            if (isset($_GET['save']) && $_GET['save'] === '1') {
                $saveToDb = true;
            }
        }
        $report = ai_generate_class_report($pdo, $section, $saveToDb);
        $history = ai_get_latest_reports($pdo, 10);
        $sections = $pdo->query("SELECT DISTINCT section FROM ctlab_students WHERE section <> '' ORDER BY section ASC")->fetchAll(PDO::FETCH_COLUMN);
        json_response(array(
            'ok' => true,
            'db_engine' => db_driver($pdo),
            'sections' => $sections,
            'report' => $report,
            'history' => $history,
        ));
    }

    if ($action === 'ai_config_get') {
        $cfg = get_ai_config();
        $safeCfg = array(
            'auto_grade_on_submit' => (bool)$cfg['auto_grade_on_submit'],
            'auto_approve' => (bool)$cfg['auto_approve'],
            'resubmit_threshold' => (float)$cfg['resubmit_threshold'],
            'provider' => $cfg['provider'],
            'has_gemini_key' => !empty($cfg['gemini_api_key']),
            'gemini_model' => $cfg['gemini_model'],
            'ollama_url' => $cfg['ollama_url'],
            'ollama_model' => $cfg['ollama_model'],
        );
        json_response(array('ok' => true, 'config' => $safeCfg));
    }

    if ($action === 'ai_config_save' && $reqMethod === 'POST') {
        $body = get_json_body();
        $saved = save_ai_config($body);
        if ($saved === false) {
            json_response(array('ok' => false, 'error' => 'ไม่สามารถบันทึกไฟล์ตั้งค่า AI ใน data/ ได้'), 500);
        }
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

    if ($action === 'github_config_get') {
        $cfgPath = dirname(__DIR__) . '/data/github_config.json';
        $cfg = array('repo' => '', 'branch' => 'main', 'folder' => 'backups', 'has_token' => false);
        if (file_exists($cfgPath)) {
            $raw = json_decode((string)file_get_contents($cfgPath), true);
            if (is_array($raw)) {
                $cfg['repo'] = isset($raw['repo']) ? (string)$raw['repo'] : '';
                $cfg['branch'] = isset($raw['branch']) && $raw['branch'] !== '' ? (string)$raw['branch'] : 'main';
                $cfg['folder'] = isset($raw['folder']) && $raw['folder'] !== '' ? (string)$raw['folder'] : 'backups';
                $cfg['has_token'] = !empty($raw['token']);
            }
        }
        json_response(array('ok' => true, 'config' => $cfg));
    }

    if ($action === 'github_config_save' && $reqMethod === 'POST') {
        $body = get_json_body();
        $repo = isset($body['repo']) ? trim((string)$body['repo']) : '';
        $branch = isset($body['branch']) ? trim((string)$body['branch']) : 'main';
        $folder = isset($body['folder']) ? trim((string)$body['folder'], "/ \t\n\r") : 'backups';
        $token = isset($body['token']) ? trim((string)$body['token']) : '';

        if ($repo === '' || !preg_match('/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/', $repo)) {
            json_response(array('ok' => false, 'error' => 'รูปแบบ Repository ต้องเป็น username/repo-name'), 400);
        }
        if ($branch === '') $branch = 'main';
        if ($folder === '') $folder = 'backups';

        $dir = dirname(__DIR__) . '/data';
        if (!is_dir($dir)) @mkdir($dir, 0775, true);
        $cfgPath = $dir . '/github_config.json';

        if ($token === '' && file_exists($cfgPath)) {
            $old = json_decode((string)file_get_contents($cfgPath), true);
            if (is_array($old) && !empty($old['token'])) {
                $token = (string)$old['token'];
            }
        }
        if ($token === '') {
            json_response(array('ok' => false, 'error' => 'กรุณาระบุ GitHub Personal Access Token'), 400);
        }

        $data = array('repo' => $repo, 'branch' => $branch, 'folder' => $folder, 'token' => $token);
        if (file_put_contents($cfgPath, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) === false) {
            json_response(array('ok' => false, 'error' => 'ไม่สามารถบันทึกไฟล์ตั้งค่าใน data/ ได้'), 500);
        }
        @chmod($cfgPath, 0600);
        json_response(array('ok' => true, 'message' => 'บันทึกการตั้งค่า GitHub เรียบร้อยแล้ว'));
    }

    if ($action === 'github_backup' && $reqMethod === 'POST') {
        $cfgPath = dirname(__DIR__) . '/data/github_config.json';
        if (!file_exists($cfgPath)) {
            json_response(array('ok' => false, 'error' => 'ยังไม่ได้ตั้งค่า GitHub Repository และ Token'), 400);
        }
        $cfg = json_decode((string)file_get_contents($cfgPath), true);
        if (!is_array($cfg) || empty($cfg['repo']) || empty($cfg['token'])) {
            json_response(array('ok' => false, 'error' => 'ข้อมูลตั้งค่า GitHub ไม่ครบถ้วน'), 400);
        }

        $students = $pdo->query('SELECT * FROM ctlab_students ORDER BY student_id ASC')->fetchAll();
        $submissions = $pdo->query('SELECT * FROM ctlab_submissions ORDER BY id ASC')->fetchAll();

        $jsonPayload = json_encode(array(
            'exported_at' => date('c'),
            'total_students' => count($students),
            'total_submissions' => count($submissions),
            'students' => $students,
            'submissions' => $submissions,
        ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

        // สร้าง CSV (UTF-8 BOM)
        $mem = fopen('php://temp', 'r+');
        fwrite($mem, "\xEF\xBB\xBF");
        fputcsv($mem, array('ID', 'รหัสนักศึกษา', 'โมดูล', 'ผ่าน', 'ทั้งหมด', 'คะแนนระบบ', 'คะแนนอาจารย์', 'สถานะ', 'เวลาส่ง', 'เวลาตรวจ'));
        foreach ($submissions as $r) {
            fputcsv($mem, array(
                $r['id'], $r['student_id'], $r['module_id'], $r['completed_count'], $r['total_modules'],
                $r['auto_score'], $r['teacher_score'], $r['status'], $r['submitted_at'], $r['graded_at']
            ));
        }
        rewind($mem);
        $csvPayload = stream_get_contents($mem);
        fclose($mem);

        $repo = $cfg['repo'];
        $branch = isset($cfg['branch']) ? $cfg['branch'] : 'main';
        $folder = trim(isset($cfg['folder']) ? $cfg['folder'] : 'backups', '/');
        $token = $cfg['token'];

        $res1 = github_upsert_file($repo, $branch, $folder . '/ctlab_backup_latest.json', $jsonPayload, 'CT-Lab Backup JSON (' . date('Y-m-d H:i') . ')', $token);
        if (!$res1['ok']) {
            json_response(array('ok' => false, 'error' => 'อัปโหลด JSON ขึ้น GitHub ไม่สำเร็จ: ' . $res1['error']), 502);
        }

        $res2 = github_upsert_file($repo, $branch, $folder . '/ctlab_submissions_latest.csv', $csvPayload, 'CT-Lab Backup CSV (' . date('Y-m-d H:i') . ')', $token);
        if (!$res2['ok']) {
            json_response(array('ok' => false, 'error' => 'อัปโหลด CSV ขึ้น GitHub ไม่สำเร็จ: ' . $res2['error']), 502);
        }

        json_response(array(
            'ok' => true,
            'message' => 'Backup ข้อมูลนักศึกษาและงานที่ส่งขึ้น GitHub เรียบร้อยแล้ว (' . count($students) . ' คน, ' . count($submissions) . ' รายการ)',
            'commit_url' => isset($res2['html_url']) ? $res2['html_url'] : (isset($res1['html_url']) ? $res1['html_url'] : ''),
        ));
    }

    json_response(array('ok' => false, 'error' => 'Invalid action'), 400);
} catch (Exception $e) {
    json_response(array(
        'ok' => false,
        'error' => 'เกิดข้อผิดพลาดในระบบฐานข้อมูล',
        'detail' => $e->getMessage(),
    ), 500);
}

function github_api_request($url, $method, $token, $bodyArr = null)
{
    $headers = array(
        'User-Agent: CT-Lab-Backup/1.0',
        'Accept: application/vnd.github+json',
        'Authorization: Bearer ' . $token,
    );
    $content = '';
    if ($bodyArr !== null) {
        $content = json_encode($bodyArr, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $headers[] = 'Content-Type: application/json';
    }
    $ctx = stream_context_create(array(
        'http' => array(
            'method' => $method,
            'header' => implode("\r\n", $headers) . "\r\n",
            'content' => $content,
            'ignore_errors' => true,
            'timeout' => 20,
        ),
    ));
    $resp = @file_get_contents($url, false, $ctx);
    $status = 0;
    if (isset($http_response_header) && is_array($http_response_header) && isset($http_response_header[0])) {
        if (preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
            $status = (int)$m[1];
        }
    }
    $decoded = $resp !== false ? json_decode($resp, true) : null;
    return array('status' => $status, 'data' => is_array($decoded) ? $decoded : array(), 'raw' => $resp);
}

function github_upsert_file($repo, $branch, $path, $rawContent, $message, $token)
{
    $apiUrl = 'https://api.github.com/repos/' . $repo . '/contents/' . $path;
    $getRes = github_api_request($apiUrl . '?ref=' . urlencode($branch), 'GET', $token);
    $sha = null;
    if ($getRes['status'] === 200 && isset($getRes['data']['sha'])) {
        $sha = $getRes['data']['sha'];
    }

    $payload = array(
        'message' => $message,
        'content' => base64_encode($rawContent),
        'branch' => $branch,
    );
    if ($sha !== null) {
        $payload['sha'] = $sha;
    }

    $putRes = github_api_request($apiUrl, 'PUT', $token, $payload);
    if ($putRes['status'] === 200 || $putRes['status'] === 201) {
        $htmlUrl = isset($putRes['data']['commit']['html_url']) ? $putRes['data']['commit']['html_url'] : '';
        return array('ok' => true, 'html_url' => $htmlUrl);
    }
    $errMsg = isset($putRes['data']['message']) ? $putRes['data']['message'] : ('HTTP ' . $putRes['status']);
    return array('ok' => false, 'error' => $errMsg);
}

function build_gradebook_data($pdo, $section = '')
{
    $modules = array(
        'survival', 'books', 'house', 'routes', 'gcd',
        'decomposition', 'searching', 'algorithms', 'flowcharts', 'challenge10'
    );

    $sections = $pdo->query("
        SELECT DISTINCT section FROM ctlab_students WHERE section <> '' ORDER BY section ASC
    ")->fetchAll(PDO::FETCH_COLUMN);

    if ($section !== '') {
        $stStmt = $pdo->prepare('SELECT student_id, full_name, section FROM ctlab_students WHERE section = ? ORDER BY student_id ASC');
        $stStmt->execute(array($section));
        $students = $stStmt->fetchAll();
    } else {
        $students = $pdo->query('SELECT student_id, full_name, section FROM ctlab_students ORDER BY student_id ASC')->fetchAll();
    }

    $subRows = $pdo->query('
        SELECT student_id, module_id, ai_rubric_json, COALESCE(teacher_score, ai_score, auto_score) AS best_score
        FROM ctlab_submissions
    ')->fetchAll();

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
                    if ($mTot <= 0 && empty($mev['completed']) && empty($mev['has_semi_seq']) && empty($mev['has_subjective'])) {
                        continue;
                    }
                    if (!isset($bestMap[$sid])) $bestMap[$sid] = array();
                    if (!isset($bestMap[$sid][$mk]) || $mTot > $bestMap[$sid][$mk]) {
                        $bestMap[$sid][$mk] = $mTot;
                    }
                }
            }
            continue;
        }
        if (!in_array($mod, $modules, true)) {
            continue;
        }
        $val = (float)$sr['best_score'];
        if (!isset($bestMap[$sid])) {
            $bestMap[$sid] = array();
        }
        if (!isset($bestMap[$sid][$mod]) || $val > $bestMap[$sid][$mod]) {
            $bestMap[$sid][$mod] = $val;
        }
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

        $avgScore = $completedMods > 0 ? round($totalScore / $completedMods, 1) : 0.0;
        $rows[] = array(
            'student_id' => $sid,
            'full_name' => $st['full_name'],
            'section' => $st['section'],
            'scores' => $scores,
            'completed_modules' => $completedMods,
            'total_score' => round($totalScore, 1),
            'avg_score' => $avgScore,
        );
    }

    return array(
        'modules' => $modules,
        'sections' => $sections,
        'rows' => $rows,
    );
}
