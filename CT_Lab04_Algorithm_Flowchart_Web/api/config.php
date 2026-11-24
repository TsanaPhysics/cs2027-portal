<?php
/**
 * CT-Lab 04 — Database & API Configuration (Dual-Engine: MySQL + SQLite Fallback)
 * สำหรับเว็บไซต์เชิงโต้ตอบ: การออกแบบขั้นตอนวิธี รหัสลำลอง ผังงาน และ Trace Table
 */

define('CT_LAB04_TEACHER_PIN', 'physicss');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Teacher-Pin, X-Admin-Pin');
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function is_university_server()
{
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';
    return strpos($host, 'rbru.ac.th') !== false;
}

function json_response($data, $status = 200)
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function get_json_body()
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return array();
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : array();
}

function db_driver($pdo)
{
    try {
        return strtolower((string)$pdo->getAttribute(PDO::ATTR_DRIVER_NAME));
    } catch (Exception $e) {
        return 'mysql';
    }
}

function db_upsert_student($pdo, $studentId, $fullName, $section)
{
    if (db_driver($pdo) === 'sqlite') {
        $chk = $pdo->prepare('SELECT 1 FROM ctlab04_students WHERE student_id = ?');
        $chk->execute(array($studentId));
        if ($chk->fetchColumn()) {
            $upd = $pdo->prepare('UPDATE ctlab04_students SET full_name = ?, section = ?, updated_at = CURRENT_TIMESTAMP WHERE student_id = ?');
            $upd->execute(array($fullName, $section, $studentId));
        } else {
            $ins = $pdo->prepare('INSERT INTO ctlab04_students (student_id, full_name, section) VALUES (?, ?, ?)');
            $ins->execute(array($studentId, $fullName, $section));
        }
        return;
    }

    $upsert = $pdo->prepare('
        INSERT INTO ctlab04_students (student_id, full_name, section)
        VALUES (:student_id, :full_name, :section)
        ON DUPLICATE KEY UPDATE
            full_name = VALUES(full_name),
            section = VALUES(section)
    ');
    $upsert->execute(array(
        ':student_id' => $studentId,
        ':full_name' => $fullName,
        ':section' => $section,
    ));
}

function get_pdo()
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $options = array(
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    );

    if (is_university_server()) {
        try {
            $dsn = 'mysql:host=localhost;dbname=chewa;charset=utf8mb4';
            $pdo = new PDO($dsn, 'chewa', 'PhysiK66', $options);
            ensure_schema($pdo);
            return $pdo;
        } catch (PDOException $e) {
            // Fallback to local MySQL or SQLite below
        }
    }

    $db = 'ct_lab_db';
    $user = 'root';
    $pass = '';
    $xamppSock = '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock';

    $attempts = array();
    if (@file_exists($xamppSock)) {
        $attempts[] = array(
            'dsn' => sprintf('mysql:unix_socket=%s;dbname=%s;charset=utf8mb4', $xamppSock, $db),
            'rootDsn' => sprintf('mysql:unix_socket=%s;charset=utf8mb4', $xamppSock),
        );
    }
    $attempts[] = array(
        'dsn' => sprintf('mysql:host=127.0.0.1;dbname=%s;charset=utf8mb4', $db),
        'rootDsn' => 'mysql:host=127.0.0.1;charset=utf8mb4',
    );

    foreach ($attempts as $att) {
        try {
            $pdo = new PDO($att['dsn'], $user, $pass, $options);
            ensure_schema($pdo);
            return $pdo;
        } catch (PDOException $e) {
            if ((int)$e->getCode() === 1049 || strpos($e->getMessage(), 'Unknown database') !== false) {
                try {
                    $rootPdo = new PDO($att['rootDsn'], $user, $pass, $options);
                    $rootPdo->exec('CREATE DATABASE IF NOT EXISTS `' . $db . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
                    $pdo = new PDO($att['dsn'], $user, $pass, $options);
                    ensure_schema($pdo);
                    return $pdo;
                } catch (PDOException $inner) {
                    // Fallback next
                }
            }
        }
    }

    // SQLite Fallback อัตโนมัติเมื่อ MySQL ไม่พร้อมใช้งาน
    $dataDir = dirname(__DIR__) . '/data';
    if (!is_dir($dataDir)) {
        @mkdir($dataDir, 0775, true);
    }
    $sqlitePath = $dataDir . '/ctlab04_local.sqlite';
    $pdo = new PDO('sqlite:' . $sqlitePath, null, null, $options);
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA busy_timeout = 5000');
    ensure_schema($pdo);
    return $pdo;
}

function ensure_schema($pdo)
{
    static $checked = false;
    if ($checked) {
        return;
    }

    $driver = db_driver($pdo);

    if ($driver === 'sqlite') {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS ctlab04_students (
                student_id TEXT NOT NULL PRIMARY KEY,
                full_name TEXT NOT NULL,
                section TEXT NOT NULL DEFAULT '',
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ct04_students_section ON ctlab04_students (section)");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS ctlab04_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                module_id TEXT NOT NULL DEFAULT 'all',
                completed_count INTEGER NOT NULL DEFAULT 0,
                total_modules INTEGER NOT NULL DEFAULT 4,
                auto_score REAL NOT NULL DEFAULT 0.0,
                ai_score REAL NULL DEFAULT NULL,
                ai_rubric_json TEXT NULL,
                ai_feedback TEXT NULL,
                ai_model TEXT NULL DEFAULT NULL,
                ai_graded_at DATETIME NULL DEFAULT NULL,
                payload_json TEXT NOT NULL,
                student_note TEXT NULL,
                teacher_score REAL NULL DEFAULT NULL,
                teacher_feedback TEXT NULL,
                status TEXT NOT NULL DEFAULT 'submitted',
                submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                graded_at DATETIME NULL DEFAULT NULL,
                FOREIGN KEY (student_id) REFERENCES ctlab04_students (student_id)
                    ON DELETE CASCADE ON UPDATE CASCADE
            )
        ");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ct04_sub_student ON ctlab04_submissions (student_id)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ct04_sub_status ON ctlab04_submissions (status)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ct04_sub_module ON ctlab04_submissions (module_id)");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS ctlab04_ai_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_scope TEXT NOT NULL DEFAULT 'all',
                total_students INTEGER NOT NULL DEFAULT 0,
                submitted_students INTEGER NOT NULL DEFAULT 0,
                avg_score REAL NOT NULL DEFAULT 0.0,
                summary_json TEXT NOT NULL,
                narrative_text TEXT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ct04_rep_scope ON ctlab04_ai_reports (report_scope)");
    } else {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `ctlab04_students` (
                `student_id` VARCHAR(32) NOT NULL,
                `full_name` VARCHAR(120) NOT NULL,
                `section` VARCHAR(40) NOT NULL DEFAULT '',
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`student_id`),
                INDEX `idx_ct04_section` (`section`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `ctlab04_submissions` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                `student_id` VARCHAR(32) NOT NULL,
                `module_id` VARCHAR(64) NOT NULL DEFAULT 'all',
                `completed_count` TINYINT UNSIGNED NOT NULL DEFAULT 0,
                `total_modules` TINYINT UNSIGNED NOT NULL DEFAULT 4,
                `auto_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
                `ai_score` DECIMAL(5,2) NULL DEFAULT NULL,
                `ai_rubric_json` LONGTEXT NULL,
                `ai_feedback` TEXT NULL,
                `ai_model` VARCHAR(64) NULL DEFAULT NULL,
                `ai_graded_at` DATETIME NULL DEFAULT NULL,
                `payload_json` LONGTEXT NOT NULL,
                `student_note` TEXT NULL,
                `teacher_score` DECIMAL(5,2) NULL DEFAULT NULL,
                `teacher_feedback` TEXT NULL,
                `status` ENUM('submitted','graded','resubmit') NOT NULL DEFAULT 'submitted',
                `submitted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `graded_at` DATETIME NULL DEFAULT NULL,
                PRIMARY KEY (`id`),
                INDEX `idx_ct04_student` (`student_id`),
                INDEX `idx_ct04_status` (`status`),
                INDEX `idx_ct04_module` (`module_id`),
                INDEX `idx_ct04_submitted` (`submitted_at`),
                CONSTRAINT `fk_ctlab04_submissions_student`
                    FOREIGN KEY (`student_id`) REFERENCES `ctlab04_students` (`student_id`)
                    ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `ctlab04_ai_reports` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                `report_scope` VARCHAR(64) NOT NULL DEFAULT 'all',
                `total_students` INT UNSIGNED NOT NULL DEFAULT 0,
                `submitted_students` INT UNSIGNED NOT NULL DEFAULT 0,
                `avg_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
                `summary_json` LONGTEXT NOT NULL,
                `narrative_text` LONGTEXT NOT NULL,
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                INDEX `idx_ct04_rep_scope` (`report_scope`),
                INDEX `idx_ct04_rep_created` (`created_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    $checked = true;
    seed_default_students($pdo);
}

function seed_default_students($pdo)
{
    $insertIgnore = db_driver($pdo) === 'sqlite' ? 'INSERT OR IGNORE INTO' : 'INSERT IGNORE INTO';

    $pdo->exec("
        $insertIgnore ctlab04_students (student_id, full_name, section)
        VALUES ('TEACHER01', 'อาจารย์ชีวะ (ทดสอบระบบ)', 'อาจารย์/ทดสอบ')
    ");

    $count = (int)$pdo->query('SELECT COUNT(*) FROM ctlab04_students')->fetchColumn();
    if ($count >= 26) {
        return;
    }

    $roster = array(
        array('6614611001', 'นางสาวกนกวรรณพึ่งฉ่ำ', '661/วิทย์'),
        array('6614611002', 'นางสาวกาญจน์สณีทรงศรี', '661/วิทย์'),
        array('6614611003', 'นางสาวกิติยาแสงทอง', '661/วิทย์'),
        array('6614611004', 'นางสาวชุลีขวัญคนขยัน', '661/วิทย์'),
        array('6614611005', 'นางสาวณัฐณิชานาคาพยัคฆ์', '661/วิทย์'),
        array('6614611006', 'นางสาวณัฐวรรณคำกอก', '661/วิทย์'),
        array('6614611007', 'นางสาวเณศราโพธิ์นิล', '661/วิทย์'),
        array('6614611009', 'นางสาวธันยธรณ์หมั่นกู้', '661/วิทย์'),
        array('6614611010', 'นางสาวธิชานันท์นนเทศา', '661/วิทย์'),
        array('6614611011', 'นางสาวนภัสนาวงศ์จันทร์', '661/วิทย์'),
        array('6614611012', 'นางสาวพรทิพย์บรรณสาร', '661/วิทย์'),
        array('6614611013', 'นางสาวพัชราพรมจีน', '661/วิทย์'),
        array('6614611014', 'นางสาวภัทริดาเจ๊ะมัด', '661/วิทย์'),
        array('6614611015', 'นายมนตรีจันทร์เทศ', '661/วิทย์'),
        array('6614611018', 'นายอชิระสราภิรมย์', '661/วิทย์'),
        array('6614611019', 'นายอุดมชัยบุตรอุดม', '661/วิทย์'),
        array('6614611021', 'นางสาวจิฬาภรณ์อภิบาลศรี', '661/วิทย์'),
        array('6614611024', 'นายมงคลศรีสมบัติ', '661/วิทย์'),
        array('6614611025', 'นางสาววาสินีสุวรรณา', '661/วิทย์'),
        array('6614611029', 'นางสาวรัตมณีเถาวัลณีย์', '661/วิทย์'),
        array('6614901002', 'นางสาวมุกดาหนองน้ำเย็น', '661/ฟิสิกส์'),
        array('6614901003', 'นางสาววิดาพรธนะปฐมชัย', '661/ฟิสิกส์'),
        array('6614901004', 'นายวุฒิชัยเจริญวงศ์', '661/ฟิสิกส์'),
        array('6614901006', 'นายนวพลแสงพระจันทร์', '661/ฟิสิกส์'),
        array('6614901008', 'นางสาวอุไรพรเต็กใจตรง', '661/ฟิสิกส์'),
    );

    $stmt = $pdo->prepare("$insertIgnore ctlab04_students (student_id, full_name, section) VALUES (?, ?, ?)");
    foreach ($roster as $row) {
        $stmt->execute($row);
    }
}
