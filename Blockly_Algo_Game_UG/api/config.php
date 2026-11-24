<?php
/**
 * AlgoQuest UG — Database Configuration (Dual-Engine: MySQL + SQLite Fallback)
 * เชื่อมต่อรายชื่อนักศึกษาจากฐานข้อมูลหลัก (ct_lab_db / SQLite) และบันทึกผลคะแนน Blockly UG
 */

define('AQ_TEACHER_PIN', 'physicss');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Teacher-Pin, X-Admin-Pin');
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

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
        try {
            $dsn = 'mysql:host=localhost;dbname=chewa;charset=utf8mb4';
            $pdo = new PDO($dsn, 'chewa', 'PhysiK66', $options);
            aq_ensure_schema($pdo);
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

function aq_default_cs2027_roster()
{
    return array(
        array('student_id' => '6614611001', 'full_name' => 'นางสาวกนกวรรณพึ่งฉ่ำ', 'section' => '661/วิทย์'),
        array('student_id' => '6614611002', 'full_name' => 'นางสาวกาญจน์สณีทรงศรี', 'section' => '661/วิทย์'),
        array('student_id' => '6614611003', 'full_name' => 'นางสาวกิติยาแสงทอง', 'section' => '661/วิทย์'),
        array('student_id' => '6614611004', 'full_name' => 'นางสาวชุลีขวัญคนขยัน', 'section' => '661/วิทย์'),
        array('student_id' => '6614611005', 'full_name' => 'นางสาวณัฐณิชานาคาพยัคฆ์', 'section' => '661/วิทย์'),
        array('student_id' => '6614611006', 'full_name' => 'นางสาวณัฐวรรณคำกอก', 'section' => '661/วิทย์'),
        array('student_id' => '6614611007', 'full_name' => 'นางสาวเณศราโพธิ์นิล', 'section' => '661/วิทย์'),
        array('student_id' => '6614611009', 'full_name' => 'นางสาวธันยธรณ์หมั่นกู้', 'section' => '661/วิทย์'),
        array('student_id' => '6614611010', 'full_name' => 'นางสาวธิชานันท์นนเทศา', 'section' => '661/วิทย์'),
        array('student_id' => '6614611011', 'full_name' => 'นางสาวนภัสนาวงศ์จันทร์', 'section' => '661/วิทย์'),
        array('student_id' => '6614611012', 'full_name' => 'นางสาวพรทิพย์บรรณสาร', 'section' => '661/วิทย์'),
        array('student_id' => '6614611013', 'full_name' => 'นางสาวพัชราพรมจีน', 'section' => '661/วิทย์'),
        array('student_id' => '6614611014', 'full_name' => 'นางสาวภัทริดาเจ๊ะมัด', 'section' => '661/วิทย์'),
        array('student_id' => '6614611015', 'full_name' => 'นายมนตรีจันทร์เทศ', 'section' => '661/วิทย์'),
        array('student_id' => '6614611018', 'full_name' => 'นายอชิระสราภิรมย์', 'section' => '661/วิทย์'),
        array('student_id' => '6614611019', 'full_name' => 'นายอุดมชัยบุตรอุดม', 'section' => '661/วิทย์'),
        array('student_id' => '6614611021', 'full_name' => 'นางสาวจิฬาภรณ์อภิบาลศรี', 'section' => '661/วิทย์'),
        array('student_id' => '6614611024', 'full_name' => 'นายมงคลศรีสมบัติ', 'section' => '661/วิทย์'),
        array('student_id' => '6614611025', 'full_name' => 'นางสาววาสินีสุวรรณา', 'section' => '661/วิทย์'),
        array('student_id' => '6614611029', 'full_name' => 'นางสาวรัตมณีเถาวัลณีย์', 'section' => '661/วิทย์'),
        array('student_id' => '6614901002', 'full_name' => 'นางสาวมุกดาหนองน้ำเย็น', 'section' => '661/ฟิสิกส์'),
        array('student_id' => '6614901003', 'full_name' => 'นางสาววิดาพรธนะปฐมชัย', 'section' => '661/ฟิสิกส์'),
        array('student_id' => '6614901004', 'full_name' => 'นายวุฒิชัยเจริญวงศ์', 'section' => '661/ฟิสิกส์'),
        array('student_id' => '6614901006', 'full_name' => 'นายนวพลแสงพระจันทร์', 'section' => '661/ฟิสิกส์'),
        array('student_id' => '6614901008', 'full_name' => 'นางสาวอุไรพรเต็กใจตรง', 'section' => '661/ฟิสิกส์'),
        array('student_id' => 'TEACHER01', 'full_name' => 'อาจารย์ชีวะ (ทดสอบระบบ)', 'section' => 'อาจารย์/ทดสอบ')
    );
}

function aq_merge_required_roster($found)
{
    $map = array();
    if (is_array($found)) {
        foreach ($found as $r) {
            if (!empty($r['student_id'])) {
                $map[(string)$r['student_id']] = array(
                    'student_id' => (string)$r['student_id'],
                    'full_name' => isset($r['full_name']) ? (string)$r['full_name'] : '',
                    'section' => isset($r['section']) ? (string)$r['section'] : ''
                );
            }
        }
    }
    foreach (aq_default_cs2027_roster() as $def) {
        $sid = $def['student_id'];
        if (!isset($map[$sid])) {
            $map[$sid] = $def;
        } elseif (empty($map[$sid]['section'])) {
            $map[$sid]['section'] = $def['section'];
        }
    }
    $list = array_values($map);
    usort($list, function ($a, $b) {
        $c = strcmp($a['section'], $b['section']);
        if ($c !== 0) return $c;
        return strcmp($a['student_id'], $b['student_id']);
    });
    return $list;
}

/**
 * ดึงรายชื่อนักศึกษาจากฐานข้อมูลหลัก (MySQL ctlab04_students / ctlab_students / students หรือ SQLite ของ CT_Lab)
 * พร้อมรับประกันว่ามีรายชื่อนักศึกษาสาขาฟิสิกส์ (661/ฟิสิกส์ 5 คน) และวิทยาศาสตร์ทั่วไป (661/วิทย์ 20 คน) ครบเสมอ
 */
function aq_fetch_student_roster($pdo)
{
    $driver = aq_db_driver($pdo);
    $defaultRoster = aq_default_cs2027_roster();

    // 1. Try tables in active PDO (MySQL ct_lab_db / chewa) - prioritize ctlab04_students & ctlab_students
    foreach (array('ctlab04_students', 'ctlab_students', 'students') as $tbl) {
        try {
            $stmt = $pdo->query("SELECT student_id, full_name, section FROM {$tbl} ORDER BY section ASC, student_id ASC");
            $found = $stmt->fetchAll();
            if (!empty($found)) {
                if (count($found) < 26) {
                    try {
                        $insSql = ($driver === 'sqlite')
                            ? "INSERT OR IGNORE INTO {$tbl} (student_id, full_name, section) VALUES (?, ?, ?)"
                            : "INSERT IGNORE INTO {$tbl} (student_id, full_name, section) VALUES (?, ?, ?)";
                        $ins = $pdo->prepare($insSql);
                        foreach ($defaultRoster as $r) {
                            $ins->execute(array($r['student_id'], $r['full_name'], $r['section']));
                        }
                    } catch (Exception $ie) {
                        // Ignore if table schema differs
                    }
                }
                return array('source' => $driver . ':' . $tbl, 'students' => aq_merge_required_roster($found));
            }
        } catch (Exception $e) {
            // Table may not exist in this DB
        }
    }

    // 2. Fallback to existing CT_Lab SQLite databases in workspace
    $root = dirname(dirname(__DIR__));
    $sqliteCandidates = array(
        array('path' => $root . '/CT_Lab04_Algorithm_Flowchart_Web/data/ctlab04_local.sqlite', 'table' => 'ctlab04_students'),
        array('path' => $root . '/CT_Lab_v4_Web/data/ctlab_local.sqlite', 'table' => 'ctlab_students'),
        array('path' => $root . '/CT_Lab_v4_Web/data/ctlab_local.sqlite', 'table' => 'students'),
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
                    return array('source' => 'sqlite:' . basename($cand['path']), 'students' => aq_merge_required_roster($found));
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
        foreach ($defaultRoster as $r) {
            $ins->execute(array($r['student_id'], $r['full_name'], $r['section']));
        }
        $stmt = $pdo->query("SELECT student_id, full_name, section FROM ctlab04_students ORDER BY section ASC, student_id ASC");
        return array('source' => $driver . ':ctlab04_students', 'students' => aq_merge_required_roster($stmt->fetchAll()));
    } catch (Exception $e) {
        // Ignore
    }

    return array('source' => $driver . ':fallback', 'students' => $defaultRoster);
}
