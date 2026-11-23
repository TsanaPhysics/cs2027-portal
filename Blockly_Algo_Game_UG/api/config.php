<?php
/**
 * AlgoQuest UG — Database Configuration (Dual-Engine: MySQL + SQLite Fallback)
 * เชื่อมต่อรายชื่อนักศึกษาจากฐานข้อมูลหลัก (ct_lab_db / SQLite) และบันทึกผลคะแนน Blockly UG
 */

define('AQ_TEACHER_PIN', 'physicss');

function aq_is_university_server()
{
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';
    return strpos($host, 'rbru.ac.th') !== false;
}

function aq_json_response($data, $status = 200)
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function aq_get_json_body()
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return array();
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : array();
}

function aq_db_driver($pdo)
{
    try {
        return strtolower((string)$pdo->getAttribute(PDO::ATTR_DRIVER_NAME));
    } catch (Exception $e) {
        return 'mysql';
    }
}

function aq_get_pdo()
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

    if (aq_is_university_server()) {
        $dsn = 'mysql:host=localhost;dbname=chewa;charset=utf8mb4';
        $pdo = new PDO($dsn, 'chewa', 'PhysiK66', $options);
        aq_ensure_schema($pdo);
        return $pdo;
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
            aq_ensure_schema($pdo);
            return $pdo;
        } catch (PDOException $e) {
            if ((int)$e->getCode() === 1049 || strpos($e->getMessage(), 'Unknown database') !== false) {
                try {
                    $rootPdo = new PDO($att['rootDsn'], $user, $pass, $options);
                    $rootPdo->exec('CREATE DATABASE IF NOT EXISTS `' . $db . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
                    $pdo = new PDO($att['dsn'], $user, $pass, $options);
                    aq_ensure_schema($pdo);
                    return $pdo;
                } catch (PDOException $inner) {
                    // Try next
                }
            }
        }
    }

    // SQLite fallback
    $dataDir = dirname(__DIR__) . '/data';
    if (!is_dir($dataDir)) {
        @mkdir($dataDir, 0775, true);
    }
    $sqlitePath = $dataDir . '/algoquest_ug.sqlite';
    $pdo = new PDO('sqlite:' . $sqlitePath, null, null, $options);
    $pdo->exec('PRAGMA busy_timeout = 5000');
    aq_ensure_schema($pdo);
    return $pdo;
}

function aq_ensure_schema($pdo)
{
    static $checked = false;
    if ($checked) {
        return;
    }

    if (aq_db_driver($pdo) === 'sqlite') {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS blockly_ug_progress (
                student_id TEXT NOT NULL PRIMARY KEY,
                full_name TEXT NOT NULL DEFAULT '',
                section TEXT NOT NULL DEFAULT '',
                rank_title TEXT NOT NULL DEFAULT 'Novice Coder',
                total_xp INTEGER NOT NULL DEFAULT 0,
                total_stars INTEGER NOT NULL DEFAULT 0,
                passed_count INTEGER NOT NULL DEFAULT 0,
                progress_json TEXT NOT NULL DEFAULT '{}',
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS blockly_ug_solutions (
                level_id TEXT NOT NULL PRIMARY KEY,
                teaching_note TEXT NOT NULL DEFAULT '',
                solution_xml TEXT NOT NULL DEFAULT '',
                updated_by TEXT NOT NULL DEFAULT 'admin',
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ");
    } else {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS blockly_ug_progress (
                student_id VARCHAR(32) NOT NULL PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL DEFAULT '',
                section VARCHAR(100) NOT NULL DEFAULT '',
                rank_title VARCHAR(100) NOT NULL DEFAULT 'Novice Coder',
                total_xp INT NOT NULL DEFAULT 0,
                total_stars INT NOT NULL DEFAULT 0,
                passed_count INT NOT NULL DEFAULT 0,
                progress_json LONGTEXT NOT NULL,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS blockly_ug_solutions (
                level_id VARCHAR(64) NOT NULL PRIMARY KEY,
                teaching_note TEXT NOT NULL,
                solution_xml LONGTEXT NOT NULL,
                updated_by VARCHAR(64) NOT NULL DEFAULT 'admin',
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }
    $checked = true;
}

/**
 * ดึงรายชื่อนักศึกษาจากฐานข้อมูลหลัก (MySQL students / ctlab04_students หรือ SQLite ของ CT_Lab)
 */
function aq_fetch_student_roster($pdo)
{
    $driver = aq_db_driver($pdo);
    $rows = array();
    $source = $driver;

    // 1. Try tables in active PDO (MySQL ct_lab_db / chewa)
    foreach (array('students', 'ctlab04_students') as $tbl) {
        try {
            $stmt = $pdo->query("SELECT student_id, full_name, section FROM {$tbl} ORDER BY section ASC, student_id ASC");
            $found = $stmt->fetchAll();
            if (!empty($found)) {
                return array('source' => $driver . ':' . $tbl, 'students' => $found);
            }
        } catch (Exception $e) {
            // Table may not exist in this DB
        }
    }

    // 2. Fallback to existing CT_Lab SQLite databases in workspace
    $root = dirname(dirname(__DIR__));
    $sqliteCandidates = array(
        array('path' => $root . '/CT_Lab_v4_Web/data/ctlab_local.sqlite', 'table' => 'students'),
        array('path' => $root . '/CT_Lab04_Algorithm_Flowchart_Web/data/ctlab04_local.sqlite', 'table' => 'ctlab04_students'),
    );

    foreach ($sqliteCandidates as $cand) {
        if (file_exists($cand['path'])) {
            try {
                $sPdo = new PDO('sqlite:' . $cand['path'], null, null, array(
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ));
                $stmt = $sPdo->query("SELECT student_id, full_name, section FROM {$cand['table']} ORDER BY section ASC, student_id ASC");
                $found = $stmt->fetchAll();
                if (!empty($found)) {
                    return array('source' => 'sqlite:' . basename($cand['path']), 'students' => $found);
                }
            } catch (Exception $e) {
                // Continue
            }
        }
    }

    // 3. Auto-seed default 26-student roster into active DB (for standalone university server deployment)
    try {
        if ($driver === 'sqlite') {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS ctlab04_students (
                    student_id TEXT NOT NULL PRIMARY KEY,
                    full_name TEXT NOT NULL,
                    section TEXT NOT NULL DEFAULT ''
                )
            ");
            $ins = $pdo->prepare("INSERT OR IGNORE INTO ctlab04_students (student_id, full_name, section) VALUES (?, ?, ?)");
        } else {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `ctlab04_students` (
                    `student_id` VARCHAR(32) NOT NULL PRIMARY KEY,
                    `full_name` VARCHAR(120) NOT NULL,
                    `section` VARCHAR(40) NOT NULL DEFAULT ''
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
            $ins = $pdo->prepare("INSERT IGNORE INTO ctlab04_students (student_id, full_name, section) VALUES (?, ?, ?)");
        }
        $defaultRoster = array(
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
            array('TEACHER01', 'อาจารย์ชีวะ (ทดสอบระบบ)', 'อาจารย์/ทดสอบ')
        );
        foreach ($defaultRoster as $r) {
            $ins->execute($r);
        }
        $stmt = $pdo->query("SELECT student_id, full_name, section FROM ctlab04_students ORDER BY section ASC, student_id ASC");
        return array('source' => $driver . ':ctlab04_students', 'students' => $stmt->fetchAll());
    } catch (Exception $e) {
        // Ignore
    }

    return array('source' => $source, 'students' => $rows);
}
