<?php
/**
 * CS2027 — Unified Student Notification, Diagnostic Error Analysis & Remediation Database API
 * รองรับ PHP 5.6+ (chewa.rbru.ac.th MySQL dbname=chewa) และ XAMPP (ct_lab_db / SQLite Fallback)
 *
 * ตารางฐานข้อมูล: cs2027_feedback_notifications
 * - จัดเก็บประวัติการส่งงาน คะแนน ข้อผิดพลาดรายประเด็น (errors_json) แนวทางแก้ไข (remediation_json)
 * - ระบบแจ้งเตือนย้อนกลับให้นักศึกษารายบุคคล (is_read, notify_type, teacher_comment)
 * - ระบบคลังข้อมูลวิเคราะห์ข้อผิดพลาดเชิงลึกสำหรับผู้สอนและผู้เรียนเปิดดูย้อนหลังด้วยตนเอง
 */

require_once __DIR__ . '/Blockly_Algo_Game_UG/api/config.php';

function fb_ensure_schema($pdo)
{
    static $done = false;
    if ($done) return;

    $driver = aq_db_driver($pdo);
    if ($driver === 'sqlite') {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS cs2027_feedback_notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                full_name TEXT NOT NULL DEFAULT '',
                section TEXT NOT NULL DEFAULT '',
                game_id TEXT NOT NULL DEFAULT 'ctlab04',
                module_id TEXT NOT NULL DEFAULT 'all',
                module_title TEXT NOT NULL DEFAULT '',
                submission_ref_id INTEGER DEFAULT NULL,
                score REAL NOT NULL DEFAULT 0,
                max_score REAL NOT NULL DEFAULT 100,
                status TEXT NOT NULL DEFAULT 'graded',
                notify_source TEXT NOT NULL DEFAULT 'AI+System',
                summary_title TEXT NOT NULL DEFAULT '',
                errors_json TEXT NOT NULL DEFAULT '[]',
                remediation_json TEXT NOT NULL DEFAULT '[]',
                rubric_json TEXT NOT NULL DEFAULT '{}',
                teacher_comment TEXT DEFAULT NULL,
                is_read INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                read_at DATETIME DEFAULT NULL
            )
        ");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_cs2027_fb_stu ON cs2027_feedback_notifications (student_id, is_read)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_cs2027_fb_game ON cs2027_feedback_notifications (game_id, module_id)");
    } else {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `cs2027_feedback_notifications` (
                `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
                `student_id` VARCHAR(32) NOT NULL,
                `full_name` VARCHAR(160) NOT NULL DEFAULT '',
                `section` VARCHAR(64) NOT NULL DEFAULT '',
                `game_id` VARCHAR(40) NOT NULL DEFAULT 'ctlab04',
                `module_id` VARCHAR(64) NOT NULL DEFAULT 'all',
                `module_title` VARCHAR(190) NOT NULL DEFAULT '',
                `submission_ref_id` INT DEFAULT NULL,
                `score` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
                `max_score` DECIMAL(6,2) NOT NULL DEFAULT 100.00,
                `status` VARCHAR(24) NOT NULL DEFAULT 'graded',
                `notify_source` VARCHAR(64) NOT NULL DEFAULT 'AI+System',
                `summary_title` VARCHAR(255) NOT NULL DEFAULT '',
                `errors_json` LONGTEXT NOT NULL,
                `remediation_json` LONGTEXT NOT NULL,
                `rubric_json` LONGTEXT NOT NULL,
                `teacher_comment` TEXT DEFAULT NULL,
                `is_read` TINYINT(1) NOT NULL DEFAULT 0,
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `read_at` DATETIME DEFAULT NULL,
                PRIMARY KEY (`id`),
                KEY `idx_cs2027_fb_stu` (`student_id`, `is_read`),
                KEY `idx_cs2027_fb_game` (`game_id`, `module_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }
    $done = true;
}

/**
 * วิเคราะห์ข้อผิดพลาด (Errors) และแนวทางแก้ไข (Remediation) อัตโนมัติจากข้อมูลการส่งงาน
 */
function fb_analyze_diagnostic($gameId, $moduleId, $score, $rubric, $rawFeedback, $payload)
{
    $errors = array();
    $remediations = array();
    $numScore = (float)$score;

    $moduleNames = array(
        'algo_design' => '01 Algorithm Design (การออกแบบขั้นตอนวิธี & ข้อมูลทดสอบ 4 ระดับ)',
        'pseudocode' => '02 รหัสลำลอง (Pseudocode WHILE vs REPEAT-UNTIL)',
        'flowchart' => '03 ผังงานมาตรฐาน ISO 5807:1985',
        'lab4_tracetable' => '04 ปฏิบัติการที่ 4: ผังงานวิทย์ & Trace Table (CSTR)',
        'challenge10' => '05 แบบทดสอบวัดผล 5 ข้อ',
        'challenge' => '05 แบบทดสอบวัดผล',
        'all' => 'ภาพรวมการส่งงานทุกโมดูล',
        '05_method_obe_steam' => 'ALGO-QUEST 3D (การออกแบบขั้นตอนวิธี 05_method OBE × STEAM)',
    );
    $moduleTitle = isset($moduleNames[$moduleId]) ? $moduleNames[$moduleId] : $moduleId;

    $sim = isset($rubric['simulation']) ? (float)$rubric['simulation'] : null;
    $seq = isset($rubric['sequencing']) ? (float)$rubric['sequencing'] : null;
    $subj = isset($rubric['subjective']) ? (float)$rubric['subjective'] : null;

    if ($gameId === 'ctlab04' || $gameId === 'ctlab_v4') {
        if ($sim !== null && $sim < 35) {
            $errors[] = array(
                'code' => 'ERR_SIM_INCOMPLETE',
                'category' => 'การจำลองและตรวจสอบ Trace Table',
                'severity' => $sim < 20 ? 'high' : 'medium',
                'detail' => "คะแนนภาคปฏิบัติการจำลอง/Trace Table ได้ {$sim}/40 คะแนน (ยังทำกิจกรรมจำลองหรือตารางไล่ค่าตัวแปรไม่ครบทุกกรณีทดสอบ)"
            );
            $remediations[] = array(
                'step' => 'ทบทวนและรันการจำลองให้ครบทุกกรณี (Normal, Boundary, Abnormal Data) และกดตรวจคำตอบในตาราง Trace Table ให้ครบอย่างน้อย 4 กิจกรรมก่อนส่งงานใหม่'
            );
        }

        if ($seq !== null && $seq < 30) {
            $errors[] = array(
                'code' => 'ERR_SEQ_ORDER',
                'category' => 'การจัดลำดับขั้นตอนวิธี / สัญลักษณ์ผังงาน',
                'severity' => $seq < 18 ? 'high' : 'medium',
                'detail' => "คะแนนการจัดลำดับรหัสลำลอง/ผังงานได้ {$seq}/35 คะแนน (มีการสลับลำดับขั้นตอน หรือเลือกตัวลวง Distractor เข้ามาในลำดับการทำงาน)"
            );
            if ($moduleId === 'algo_design') {
                $remediations[] = array('step' => 'จัดลำดับตามโครงสร้าง IPO: (1) รับค่า Input n, V -> (2) ตรวจสอบเงื่อนไขขอบเขต V <= 0 ก่อนคำนวณ -> (3) คำนวณ C = n / V -> (4) แสดงผลลัพธ์ Output และตัดตัวลวงที่ไม่วัดปริมาตรออก');
            } elseif ($moduleId === 'pseudocode') {
                $remediations[] = array('step' => 'ต้องกำหนดค่าเริ่มต้น INITIALISE count <- 0, i <- 1 นอกลูป WHILE และต้องมี i <- i + 1 ท้ายลูปก่อน ENDWHILE เพื่อไม่ให้เกิด Infinite Loop');
            } elseif ($moduleId === 'flowchart') {
                $remediations[] = array('step' => 'ตรวจสอบสัญลักษณ์ ISO 5807: จุดเริ่ม/จบใช้วงรี (Terminator), กำหนดค่าเริ่มต้นใช้หกเหลี่ยม (Preparation), รับค่าใช้สี่เหลี่ยมด้านขนาน และเงื่อนไขใช้ข้าวหลามตัด (Decision) ที่มีทางออก จริง/เท็จ');
            } elseif ($moduleId === 'lab4_tracetable') {
                $remediations[] = array('step' => 'ในระบบควบคุมถังปฏิกรณ์ CSTR ต้องมีขั้นตอน Fail-Safe Default Reset (สั่งปิด Cooler, Heater, AlkaliPump <- OFF) ก่อนจบการทำงานเสมอ');
            } else {
                $remediations[] = array('step' => 'ตรวจสอบลำดับบล็อกขั้นตอนวิธีในส่วน Semi-Structured Sequencing โดยตัดบล็อกตัวลวงออกและเรียงตามลำดับ Input -> Validation -> Process -> Output');
            }
        }

        if ($subj !== null && $subj < 20) {
            $errors[] = array(
                'code' => 'ERR_SUBJ_REASONING',
                'category' => 'การอธิบายเหตุผลเชิงวิทยาการคำนวณและวิทยาศาสตร์',
                'severity' => $subj < 12 ? 'high' : 'medium',
                'detail' => "คะแนนคำอธิบายเหตุผลอัตนัยได้ {$subj}/25 คะแนน (คำตอบยังขาดคำสำคัญเชิงเทคนิคหรือยังไม่อธิบายผลกระทบเมื่อข้อมูลผิดพลาด)"
            );
            $remediations[] = array(
                'step' => 'เขียนอธิบายเหตุผลในช่องคำถามอัตนัยให้ครบถ้วน โดยระบุสาเหตุของข้อผิดพลาด (เช่น การหารด้วยศูนย์ Division by Zero, Infinite Loop, Off-by-One Error หรือระบบ Fail-Safe) พร้อมยกตัวอย่างค่าตัวแปรประกอบ'
            );
        }

        if (($moduleId === 'challenge10' || $moduleId === 'challenge') && $numScore < 80) {
            $errors[] = array(
                'code' => 'ERR_QUIZ_CONCEPT',
                'category' => 'แบบทดสอบวัดผลแนวคิดขั้นตอนวิธีและผังงาน',
                'severity' => $numScore < 60 ? 'high' : 'medium',
                'detail' => "คะแนนแบบทดสอบได้ {$numScore}% (ยังมีความคลาดเคลื่อนในเรื่องเงื่อนไขลูป WHILE vs REPEAT-UNTIL หรือการไล่ค่า Trace Table)"
            );
            $remediations[] = array(
                'step' => 'ทบทวนความแตกต่างระหว่างลูปตรวจเงื่อนไขก่อนทำ (WHILE) กับทำก่อนตรวจเงื่อนไข (REPEAT-UNTIL) และลำดับการอัปเดตตัวแปรใน Trace Table แล้วทำแบบทดสอบซ้ำ'
            );
        }
    } elseif ($gameId === 'blockly_ug') {
        if ($numScore < 100) {
            $errors[] = array(
                'code' => 'ERR_BLOCKLY_OPT',
                'category' => 'ความครบถ้วนของด่านและประสิทธิภาพจำนวนบล็อก (Par Blocks)',
                'severity' => $numScore < 50 ? 'high' : 'medium',
                'detail' => "ความก้าวหน้าการพิชิตด่าน Blockly อยู่ที่ {$numScore}% (บางด่านยังไม่ได้ส่งหรือใช้จำนวนบล็อกเกินเกณฑ์ Par Blocks 3 ดาว)"
            );
            $remediations[] = array(
                'step' => 'ใช้โครงสร้างลูปซ้ำ (Repeat / While) และตัวแปรแทนการวางบล็อกซ้ำกันหลายบรรทัด เพื่อลดจำนวนบล็อกให้ไม่เกินเกณฑ์ Par Blocks และเก็บครบ 3 ดาวในทุกด่าน'
            );
        }
    } elseif ($gameId === 'method05_3d') {
        if ($numScore < 100) {
            $errors[] = array(
                'code' => 'ERR_3D_STAGES',
                'category' => 'ด่านจำลองขั้นตอนวิธี 3 มิติ (05_method OBE × STEAM)',
                'severity' => $numScore < 60 ? 'high' : 'medium',
                'detail' => "คะแนนผลสัมฤทธิ์ OBE × STEAM ได้ {$numScore}/100 (ยังผ่านด่านจำลอง 3 มิติไม่ครบทั้ง 6 ด่าน)"
            );
            $remediations[] = array(
                'step' => 'เข้าฝึกปฏิบัติให้ครบทั้ง 6 ด่านใน ALGO-QUEST 3D (ด่าน 1 IPO เลือกอาหาร, ด่าน 2 รดน้ำต้นไม้ 40-60%, ด่าน 3 หาค่าต่ำสุด Min, ด่าน 4 พิกัดกากบาท AND/OR, ด่าน 5 วนซ้ำนับสินค้า <= M, ด่าน 6 หาค่าสูงสุด Smax)'
            );
        }
    }

    if (empty($errors)) {
        $errors[] = array(
            'code' => 'NONE_EXCELLENT',
            'category' => 'ผ่านเกณฑ์สมบูรณ์ (ไม่พบข้อผิดพลาดหลัก)',
            'severity' => 'low',
            'detail' => "ผลงานได้คะแนน {$numScore}% ผ่านเกณฑ์มาตรฐานทั้งด้านการจำลอง การจัดลำดับขั้นตอนวิธี และการให้เหตุผล"
        );
        $remediations[] = array(
            'step' => 'รักษามาตรฐานการทำงาน และสามารถทดลองปรับพารามิเตอร์กรณีขอบเขต (Boundary / Extreme Cases) เพิ่มเติมเพื่อต่อยอดทักษะขั้นสูง'
        );
    }

    $status = $numScore >= 80 ? 'graded' : ($numScore >= 50 ? 'needs_improvement' : 'resubmit');
    $summaryTitle = $numScore >= 80
        ? "✅ ผลตรวจ {$moduleTitle}: ผ่านเกณฑ์ดีเยี่ยม ({$numScore}%)"
        : ($numScore >= 50
            ? "⚠️ ผลตรวจ {$moduleTitle}: ผ่านเกณฑ์เบื้องต้น แนะนำปรับปรุงตามแนวทางแก้ไข ({$numScore}%)"
            : "🔴 แจ้งเตือนให้แก้ไขและส่งใหม่ {$moduleTitle}: พบข้อผิดพลาดที่ต้องแก้ไข ({$numScore}%)");

    return array(
        'module_title' => $moduleTitle,
        'status' => $status,
        'summary_title' => $summaryTitle,
        'errors' => $errors,
        'remediations' => $remediations,
    );
}

/**
 * ซิงค์ข้อมูลจากตารางการส่งงานจริงเข้าสู่ตาราง cs2027_feedback_notifications อัตโนมัติ (ถ้ายังไม่มี)
 */
function fb_sync_existing_submissions($pdo)
{
    fb_ensure_schema($pdo);
    $driver = aq_db_driver($pdo);

    // Check current count
    $cnt = (int)$pdo->query("SELECT COUNT(*) FROM cs2027_feedback_notifications")->fetchColumn();
    if ($cnt > 0) {
        return;
    }

    $rosterRes = aq_fetch_student_roster($pdo);
    $stuMap = array();
    foreach ($rosterRes['students'] as $st) {
        $stuMap[$st['student_id']] = $st;
    }

    $ins = $pdo->prepare("
        INSERT INTO cs2027_feedback_notifications (
            student_id, full_name, section, game_id, module_id, module_title,
            submission_ref_id, score, max_score, status, notify_source,
            summary_title, errors_json, remediation_json, rubric_json,
            teacher_comment, is_read, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 100, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    ");

    // 1. Sync from ctlab04_submissions
    try {
        $rows04 = $pdo->query("SELECT * FROM ctlab04_submissions ORDER BY submitted_at DESC, id DESC LIMIT 200")->fetchAll();
        foreach ($rows04 as $r) {
            $sid = $r['student_id'];
            $st = isset($stuMap[$sid]) ? $stuMap[$sid] : array('full_name' => $sid, 'section' => '');
            $score = isset($r['teacher_score']) && $r['teacher_score'] !== null
                ? (float)$r['teacher_score']
                : (isset($r['ai_score']) && $r['ai_score'] !== null ? (float)$r['ai_score'] : (float)$r['auto_score']);
            $rub = !empty($r['ai_rubric_json']) ? @json_decode((string)$r['ai_rubric_json'], true) : array();
            if (!is_array($rub)) $rub = array();
            $payload = !empty($r['payload_json']) ? @json_decode((string)$r['payload_json'], true) : array();
            $diag = fb_analyze_diagnostic('ctlab04', $r['module_id'], $score, $rub, $r['ai_feedback'], $payload);
            $comment = !empty($r['teacher_feedback']) ? $r['teacher_feedback'] : $r['ai_feedback'];
            $createdAt = !empty($r['graded_at']) ? $r['graded_at'] : (!empty($r['submitted_at']) ? $r['submitted_at'] : date('Y-m-d H:i:s'));

            $ins->execute(array(
                $sid,
                $st['full_name'],
                $st['section'],
                'ctlab04',
                $r['module_id'],
                $diag['module_title'],
                (int)$r['id'],
                $score,
                $diag['status'],
                !empty($r['ai_model']) ? $r['ai_model'] : 'CT-Lab04 AI Grader',
                $diag['summary_title'],
                json_encode($diag['errors'], JSON_UNESCAPED_UNICODE),
                json_encode($diag['remediations'], JSON_UNESCAPED_UNICODE),
                json_encode($rub, JSON_UNESCAPED_UNICODE),
                $comment,
                $createdAt
            ));
        }
    } catch (Exception $e) {
        // Ignore if table not in current DB
    }

    // 2. Sync from ctlab_submissions (CT-Lab v4)
    try {
        $rowsV4 = $pdo->query("SELECT * FROM ctlab_submissions ORDER BY submitted_at DESC, id DESC LIMIT 300")->fetchAll();
        foreach ($rowsV4 as $r) {
            $sid = $r['student_id'];
            $st = isset($stuMap[$sid]) ? $stuMap[$sid] : array('full_name' => $sid, 'section' => '');
            $score = isset($r['teacher_score']) && $r['teacher_score'] !== null
                ? (float)$r['teacher_score']
                : (isset($r['ai_score']) && $r['ai_score'] !== null ? (float)$r['ai_score'] : (float)$r['auto_score']);
            $rub = !empty($r['ai_rubric_json']) ? @json_decode((string)$r['ai_rubric_json'], true) : array();
            if (!is_array($rub)) $rub = array();
            $payload = !empty($r['payload_json']) ? @json_decode((string)$r['payload_json'], true) : array();
            $diag = fb_analyze_diagnostic('ctlab_v4', $r['module_id'], $score, $rub, $r['ai_feedback'], $payload);
            $comment = !empty($r['teacher_feedback']) ? $r['teacher_feedback'] : $r['ai_feedback'];
            $createdAt = !empty($r['graded_at']) ? $r['graded_at'] : (!empty($r['submitted_at']) ? $r['submitted_at'] : date('Y-m-d H:i:s'));

            $ins->execute(array(
                $sid,
                $st['full_name'],
                $st['section'],
                'ctlab_v4',
                $r['module_id'],
                'CT-Lab v4: ' . $diag['module_title'],
                (int)$r['id'],
                $score,
                $diag['status'],
                !empty($r['ai_model']) ? $r['ai_model'] : 'CT-Lab v4 AI Grader',
                $diag['summary_title'],
                json_encode($diag['errors'], JSON_UNESCAPED_UNICODE),
                json_encode($diag['remediations'], JSON_UNESCAPED_UNICODE),
                json_encode($rub, JSON_UNESCAPED_UNICODE),
                $comment,
                $createdAt
            ));
        }
    } catch (Exception $e) {
        // Ignore
    }
}

/**
 * บันทึกการแจ้งเตือนผลตรวจ ข้อผิดพลาด และแนวทางแก้ไขลงฐานข้อมูล cs2027_feedback_notifications
 */
function fb_record_notification($pdo, $params)
{
    fb_ensure_schema($pdo);
    $studentId = isset($params['student_id']) ? trim((string)$params['student_id']) : '';
    if ($studentId === '') return null;

    $fullName = isset($params['full_name']) ? trim((string)$params['full_name']) : $studentId;
    $section = isset($params['section']) ? trim((string)$params['section']) : '';
    $gameId = isset($params['game_id']) ? trim((string)$params['game_id']) : 'ctlab04';
    $moduleId = isset($params['module_id']) ? trim((string)$params['module_id']) : 'all';
    $subRefId = isset($params['submission_id']) ? (int)$params['submission_id'] : null;
    $score = isset($params['score']) ? (float)$params['score'] : 0.0;
    $rubric = (isset($params['rubric']) && is_array($params['rubric'])) ? $params['rubric'] : array();
    $teacherComment = isset($params['teacher_comment']) ? trim((string)$params['teacher_comment']) : '';
    $notifySource = isset($params['notify_source']) ? trim((string)$params['notify_source']) : 'AI+System';

    $diag = fb_analyze_diagnostic($gameId, $moduleId, $score, $rubric, $teacherComment, $params);
    $errors = (isset($params['errors']) && is_array($params['errors']) && !empty($params['errors'])) ? $params['errors'] : $diag['errors'];
    $remediations = (isset($params['remediations']) && is_array($params['remediations']) && !empty($params['remediations'])) ? $params['remediations'] : $diag['remediations'];
    $status = (isset($params['status']) && $params['status'] !== '') ? (string)$params['status'] : $diag['status'];
    $summaryTitle = (isset($params['summary_title']) && $params['summary_title'] !== '') ? (string)$params['summary_title'] : $diag['summary_title'];

    $stmt = $pdo->prepare("
        INSERT INTO cs2027_feedback_notifications (
            student_id, full_name, section, game_id, module_id, module_title,
            submission_ref_id, score, max_score, status, notify_source,
            summary_title, errors_json, remediation_json, rubric_json,
            teacher_comment, is_read
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 100, ?, ?, ?, ?, ?, ?, ?, 0)
    ");
    $stmt->execute(array(
        $studentId,
        $fullName,
        $section,
        $gameId,
        $moduleId,
        $diag['module_title'],
        $subRefId,
        $score,
        $status,
        $notifySource,
        $summaryTitle,
        json_encode($errors, JSON_UNESCAPED_UNICODE),
        json_encode($remediations, JSON_UNESCAPED_UNICODE),
        json_encode($rubric, JSON_UNESCAPED_UNICODE),
        $teacherComment !== '' ? $teacherComment : null
    ));

    return array(
        'notification_id' => (int)$pdo->lastInsertId(),
        'module_title' => $diag['module_title'],
        'status' => $status,
        'summary_title' => $summaryTitle,
        'errors' => $errors,
        'remediations' => $remediations,
    );
}

if (isset($_SERVER['SCRIPT_FILENAME']) && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
try {
    $pdo = aq_get_pdo();
    fb_ensure_schema($pdo);
    fb_sync_existing_submissions($pdo);

    $method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';
    $action = isset($_GET['action']) ? trim((string)$_GET['action']) : 'student_feed';

    if ($method === 'GET') {
        if ($action === 'student_feed') {
            $studentId = isset($_GET['student_id']) ? trim((string)$_GET['student_id']) : '';
            $gameId = isset($_GET['game_id']) ? trim((string)$_GET['game_id']) : '';

            $roster = aq_fetch_student_roster($pdo);
            if ($studentId === '') {
                aq_json_response(array(
                    'ok' => true,
                    'students' => $roster['students'],
                    'notifications' => array(),
                    'unread_count' => 0,
                ));
            }

            $sql = "SELECT * FROM cs2027_feedback_notifications WHERE student_id = :sid";
            $params = array(':sid' => $studentId);
            if ($gameId !== '') {
                $sql .= " AND game_id = :gid";
                $params[':gid'] = $gameId;
            }
            $sql .= " ORDER BY created_at DESC, id DESC LIMIT 100";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();

            $unreadCount = 0;
            foreach ($rows as $idx => $r) {
                $rows[$idx]['score'] = (float)$r['score'];
                $rows[$idx]['max_score'] = (float)$r['max_score'];
                $rows[$idx]['is_read'] = (int)$r['is_read'];
                if ((int)$r['is_read'] === 0) $unreadCount++;
                $err = @json_decode((string)$r['errors_json'], true);
                $rem = @json_decode((string)$r['remediation_json'], true);
                $rub = @json_decode((string)$r['rubric_json'], true);
                $rows[$idx]['errors'] = is_array($err) ? $err : array();
                $rows[$idx]['remediations'] = is_array($rem) ? $rem : array();
                $rows[$idx]['rubric'] = is_array($rub) ? $rub : array();
            }

            aq_json_response(array(
                'ok' => true,
                'student_id' => $studentId,
                'unread_count' => $unreadCount,
                'total_count' => count($rows),
                'notifications' => $rows,
            ));
        }

        if ($action === 'class_analytics') {
            $roster = aq_fetch_student_roster($pdo);
            $allStmt = $pdo->query("SELECT * FROM cs2027_feedback_notifications ORDER BY created_at DESC, id DESC LIMIT 600");
            $allRows = $allStmt->fetchAll();

            $errorStats = array();
            $stuSummary = array();
            foreach ($roster['students'] as $st) {
                $sid = $st['student_id'];
                $stuSummary[$sid] = array(
                    'student_id' => $sid,
                    'full_name' => $st['full_name'],
                    'section' => $st['section'],
                    'total_reports' => 0,
                    'unread_reports' => 0,
                    'avg_score' => 0,
                    'score_sum' => 0,
                    'error_count' => 0,
                    'latest_status' => 'ยังไม่มีผลตรวจ',
                    'latest_at' => null,
                );
            }

            foreach ($allRows as $idx => $r) {
                $sid = $r['student_id'];
                $err = @json_decode((string)$r['errors_json'], true);
                $rem = @json_decode((string)$r['remediation_json'], true);
                $rub = @json_decode((string)$r['rubric_json'], true);
                $allRows[$idx]['errors'] = is_array($err) ? $err : array();
                $allRows[$idx]['remediations'] = is_array($rem) ? $rem : array();
                $allRows[$idx]['rubric'] = is_array($rub) ? $rub : array();
                $allRows[$idx]['score'] = (float)$r['score'];
                $allRows[$idx]['is_read'] = (int)$r['is_read'];

                foreach ($allRows[$idx]['errors'] as $eItem) {
                    $code = isset($eItem['code']) ? $eItem['code'] : 'OTHER';
                    if ($code === 'NONE_EXCELLENT') continue;
                    if (!isset($errorStats[$code])) {
                        $errorStats[$code] = array(
                            'code' => $code,
                            'category' => isset($eItem['category']) ? $eItem['category'] : $code,
                            'count' => 0,
                        );
                    }
                    $errorStats[$code]['count']++;
                }

                if (isset($stuSummary[$sid])) {
                    $stuSummary[$sid]['total_reports']++;
                    if ((int)$r['is_read'] === 0) $stuSummary[$sid]['unread_reports']++;
                    $stuSummary[$sid]['score_sum'] += (float)$r['score'];
                    foreach ($allRows[$idx]['errors'] as $eItem) {
                        if (isset($eItem['code']) && $eItem['code'] !== 'NONE_EXCELLENT') {
                            $stuSummary[$sid]['error_count']++;
                        }
                    }
                    if ($stuSummary[$sid]['latest_at'] === null) {
                        $stuSummary[$sid]['latest_at'] = $r['created_at'];
                        $stuSummary[$sid]['latest_status'] = $r['status'];
                    }
                }
            }

            foreach ($stuSummary as $sid => $info) {
                if ($info['total_reports'] > 0) {
                    $stuSummary[$sid]['avg_score'] = round($info['score_sum'] / $info['total_reports'], 1);
                }
                unset($stuSummary[$sid]['score_sum']);
            }

            aq_json_response(array(
                'ok' => true,
                'driver' => aq_db_driver($pdo),
                'students' => array_values($stuSummary),
                'error_breakdown' => array_values($errorStats),
                'notifications' => $allRows,
            ));
        }
    }

    if ($method === 'POST') {
        $body = aq_get_json_body();
        $postAction = isset($body['action']) ? trim((string)$body['action']) : $action;

        // 1. บันทึกและส่งการแจ้งเตือนผลตรวจ + ข้อผิดพลาด + แนวทางแก้ไข กลับให้นักศึกษา
        if ($postAction === 'create_notification' || $postAction === 'auto_notify') {
            $studentId = isset($body['student_id']) ? trim((string)$body['student_id']) : '';
            $fullName = isset($body['full_name']) ? trim((string)$body['full_name']) : '';
            $section = isset($body['section']) ? trim((string)$body['section']) : '';
            $gameId = isset($body['game_id']) ? trim((string)$body['game_id']) : 'ctlab04';
            $moduleId = isset($body['module_id']) ? trim((string)$body['module_id']) : 'all';
            $subRefId = isset($body['submission_id']) ? (int)$body['submission_id'] : null;
            $score = isset($body['score']) ? (float)$body['score'] : 0.0;
            $rubric = (isset($body['rubric']) && is_array($body['rubric'])) ? $body['rubric'] : array();
            $teacherComment = isset($body['teacher_comment']) ? trim((string)$body['teacher_comment']) : '';
            $notifySource = isset($body['notify_source']) ? trim((string)$body['notify_source']) : 'AI+Teacher';

            if ($studentId === '') {
                aq_json_response(array('ok' => false, 'error' => 'กรุณาระบุรหัสนักศึกษา'), 400);
            }

            $diag = fb_analyze_diagnostic($gameId, $moduleId, $score, $rubric, $teacherComment, $body);

            // Allow custom errors/remediations from teacher if provided
            $customErrors = (isset($body['errors']) && is_array($body['errors']) && !empty($body['errors']))
                ? $body['errors']
                : $diag['errors'];
            $customRemediations = (isset($body['remediations']) && is_array($body['remediations']) && !empty($body['remediations']))
                ? $body['remediations']
                : $diag['remediations'];
            $status = isset($body['status']) && $body['status'] !== '' ? trim((string)$body['status']) : $diag['status'];
            $summaryTitle = isset($body['summary_title']) && $body['summary_title'] !== '' ? trim((string)$body['summary_title']) : $diag['summary_title'];

            $stmt = $pdo->prepare("
                INSERT INTO cs2027_feedback_notifications (
                    student_id, full_name, section, game_id, module_id, module_title,
                    submission_ref_id, score, max_score, status, notify_source,
                    summary_title, errors_json, remediation_json, rubric_json,
                    teacher_comment, is_read
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 100, ?, ?, ?, ?, ?, ?, ?, 0)
            ");
            $stmt->execute(array(
                $studentId,
                $fullName,
                $section,
                $gameId,
                $moduleId,
                $diag['module_title'],
                $subRefId,
                $score,
                $status,
                $notifySource,
                $summaryTitle,
                json_encode($customErrors, JSON_UNESCAPED_UNICODE),
                json_encode($customRemediations, JSON_UNESCAPED_UNICODE),
                json_encode($rubric, JSON_UNESCAPED_UNICODE),
                $teacherComment !== '' ? $teacherComment : null
            ));
            $newId = (int)$pdo->lastInsertId();

            aq_json_response(array(
                'ok' => true,
                'notification_id' => $newId,
                'student_id' => $studentId,
                'score' => $score,
                'status' => $status,
                'summary_title' => $summaryTitle,
                'errors' => $customErrors,
                'remediations' => $customRemediations,
                'message' => 'ส่งแจ้งเตือนรายงานคะแนน ข้อผิดพลาด และแนวทางแก้ไขกลับให้นักศึกษาและบันทึกลงฐานข้อมูลเรียบร้อยแล้ว'
            ), 201);
        }

        // 2. นักศึกษากดรับทราบ / อ่านการแจ้งเตือนแล้ว
        if ($postAction === 'mark_read') {
            $id = isset($body['id']) ? (int)$body['id'] : 0;
            $studentId = isset($body['student_id']) ? trim((string)$body['student_id']) : '';

            if ($id > 0) {
                $stmt = $pdo->prepare("UPDATE cs2027_feedback_notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?");
                $stmt->execute(array($id));
            } elseif ($studentId !== '') {
                $stmt = $pdo->prepare("UPDATE cs2027_feedback_notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE student_id = ?");
                $stmt->execute(array($studentId));
            }
            aq_json_response(array('ok' => true, 'message' => 'อัปเดตสถานะการอ่านแจ้งเตือนเรียบร้อยแล้ว'));
        }
    }

    aq_json_response(array('ok' => false, 'error' => 'Invalid action'), 400);
} catch (Exception $e) {
    aq_json_response(array('ok' => false, 'error' => $e->getMessage()), 500);
}
}

