<?php
/**
 * ALGO-QUEST 3D (05_method OBE × STEAM) — API & Database Endpoint for CS2027
 * เชื่อมต่อฐานข้อมูลหลักของรายวิชา CS2027 (ct_lab_db / ctlab04_students: วิทย์ 20 + ฟิสิกส์ 5 = 25 คน)
 */
require_once dirname(__DIR__) . '/Blockly_Algo_Game_UG/api/config.php';

$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';

try {
    $pdo = aq_get_pdo();
    $driver = aq_db_driver($pdo);

    if ($driver === 'sqlite') {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS method05_obe_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                full_name TEXT NOT NULL,
                section TEXT NOT NULL DEFAULT '',
                passed_stages INTEGER NOT NULL DEFAULT 0,
                total_stages INTEGER NOT NULL DEFAULT 6,
                obe_score REAL NOT NULL DEFAULT 0,
                steam_s INTEGER NOT NULL DEFAULT 0,
                steam_t INTEGER NOT NULL DEFAULT 0,
                steam_e INTEGER NOT NULL DEFAULT 0,
                steam_a INTEGER NOT NULL DEFAULT 0,
                steam_m INTEGER NOT NULL DEFAULT 0,
                stages_json TEXT NOT NULL DEFAULT '{}',
                submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");
    } else {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS method05_obe_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(32) NOT NULL,
                full_name VARCHAR(120) NOT NULL,
                section VARCHAR(40) NOT NULL DEFAULT '',
                passed_stages INT NOT NULL DEFAULT 0,
                total_stages INT NOT NULL DEFAULT 6,
                obe_score DECIMAL(5,2) NOT NULL DEFAULT 0,
                steam_s INT NOT NULL DEFAULT 0,
                steam_t INT NOT NULL DEFAULT 0,
                steam_e INT NOT NULL DEFAULT 0,
                steam_a INT NOT NULL DEFAULT 0,
                steam_m INT NOT NULL DEFAULT 0,
                stages_json LONGTEXT NOT NULL,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_m05_stu (student_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    if ($method === 'GET') {
        $roster = aq_fetch_student_roster($pdo);
        $subs = $pdo->query("SELECT * FROM method05_obe_submissions ORDER BY submitted_at DESC, id DESC LIMIT 100")->fetchAll();
        aq_json_response(array(
            'ok' => true,
            'source' => $roster['source'],
            'students' => $roster['students'],
            'submissions' => $subs,
        ));
    }

    if ($method === 'POST') {
        $body = aq_get_json_body();
        $studentId = isset($body['student_id']) ? trim((string)$body['student_id']) : '';
        $fullName = isset($body['full_name']) ? trim((string)$body['full_name']) : '';
        $section = isset($body['section']) ? trim((string)$body['section']) : '';
        $passed = isset($body['completed_count']) ? (int)$body['completed_count'] : 0;
        $score = isset($body['auto_score']) ? (float)$body['auto_score'] : 0;
        $clo = isset($body['clo']) && is_array($body['clo']) ? $body['clo'] : array();
        $payload = isset($body['payload']) ? $body['payload'] : array();

        if ($studentId === '' || $fullName === '') {
            aq_json_response(array('ok' => false, 'error' => 'กรุณาเลือกรายชื่อนักศึกษา'), 400);
        }

        $stmt = $pdo->prepare("
            INSERT INTO method05_obe_submissions (
                student_id, full_name, section, passed_stages, total_stages,
                obe_score, steam_s, steam_t, steam_e, steam_a, steam_m, stages_json
            ) VALUES (?, ?, ?, ?, 6, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute(array(
            $studentId,
            $fullName,
            $section,
            $passed,
            $score,
            isset($clo['1']) ? (int)$clo['1'] : 0,
            isset($clo['2']) ? (int)$clo['2'] : 0,
            isset($clo['3']) ? (int)$clo['3'] : 0,
            isset($clo['4']) ? (int)$clo['4'] : 0,
            isset($clo['5']) ? (int)$clo['5'] : 0,
            json_encode($payload, JSON_UNESCAPED_UNICODE),
        ));

        aq_json_response(array(
            'ok' => true,
            'submission_id' => (int)$pdo->lastInsertId(),
            'message' => 'บันทึกผลคะแนน OBE STEAM ลงฐานข้อมูล CS2027 สำเร็จ',
        ));
    }
} catch (Exception $e) {
    aq_json_response(array('ok' => false, 'error' => $e->getMessage()), 500);
}
