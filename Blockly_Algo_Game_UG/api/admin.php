<?php
/**
 * AlgoQuest UG — Admin / Instructor Backend API
 * จัดการเฉลยในฐานข้อมูล (blockly_ug_solutions) และรายงานผลคะแนนนักศึกษา
 */
require_once __DIR__ . '/config.php';

function aq_require_admin_pin()
{
    $pin = '';
    if (isset($_SERVER['HTTP_X_ADMIN_PIN'])) {
        $pin = trim((string)$_SERVER['HTTP_X_ADMIN_PIN']);
    } elseif (isset($_GET['pin'])) {
        $pin = trim((string)$_GET['pin']);
    } else {
        $body = aq_get_json_body();
        if (isset($body['pin'])) {
            $pin = trim((string)$body['pin']);
        }
    }

    if ($pin !== AQ_TEACHER_PIN) {
        aq_json_response(array('ok' => false, 'error' => 'Unauthorized: Invalid Admin PIN'), 401);
    }
}

function aq_upsert_solution($pdo, $levelId, $note, $xml, $updatedBy = 'admin')
{
    if (aq_db_driver($pdo) === 'sqlite') {
        $chk = $pdo->prepare('SELECT 1 FROM blockly_ug_solutions WHERE level_id = ?');
        $chk->execute(array($levelId));
        if ($chk->fetchColumn()) {
            $upd = $pdo->prepare('
                UPDATE blockly_ug_solutions
                SET teaching_note = ?, solution_xml = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
                WHERE level_id = ?
            ');
            $upd->execute(array($note, $xml, $updatedBy, $levelId));
        } else {
            $ins = $pdo->prepare('
                INSERT INTO blockly_ug_solutions (level_id, teaching_note, solution_xml, updated_by)
                VALUES (?, ?, ?, ?)
            ');
            $ins->execute(array($levelId, $note, $xml, $updatedBy));
        }
        return;
    }

    $upsert = $pdo->prepare('
        INSERT INTO blockly_ug_solutions (level_id, teaching_note, solution_xml, updated_by)
        VALUES (:level_id, :teaching_note, :solution_xml, :updated_by)
        ON DUPLICATE KEY UPDATE
            teaching_note = VALUES(teaching_note),
            solution_xml = VALUES(solution_xml),
            updated_by = VALUES(updated_by)
    ');
    $upsert->execute(array(
        ':level_id' => $levelId,
        ':teaching_note' => $note,
        ':solution_xml' => $xml,
        ':updated_by' => $updatedBy,
    ));
}

try {
    $pdo = aq_get_pdo();
    $method = $_SERVER['REQUEST_METHOD'];
    $action = isset($_GET['action']) ? trim((string)$_GET['action']) : '';

    if ($action === 'verify_pin' && $method === 'POST') {
        $body = aq_get_json_body();
        $pin = isset($body['pin']) ? trim((string)$body['pin']) : '';
        if ($pin !== AQ_TEACHER_PIN) {
            aq_json_response(array('ok' => false, 'error' => 'รหัสผ่านอาจารย์ไม่ถูกต้อง'), 401);
        }
        aq_json_response(array('ok' => true, 'message' => 'Authenticated'));
    }

    aq_require_admin_pin();

    if ($action === 'solutions' && $method === 'GET') {
        $stmt = $pdo->query('SELECT level_id, teaching_note, solution_xml, updated_by, updated_at FROM blockly_ug_solutions ORDER BY level_id ASC');
        $rows = $stmt->fetchAll();
        $map = array();
        foreach ($rows as $r) {
            $map[$r['level_id']] = array(
                'note' => $r['teaching_note'],
                'xml' => $r['solution_xml'],
                'updated_by' => $r['updated_by'],
                'updated_at' => $r['updated_at'],
            );
        }
        aq_json_response(array(
            'ok' => true,
            'driver' => aq_db_driver($pdo),
            'count' => count($map),
            'solutions' => $map,
        ));
    }

    if ($action === 'seed_solutions' && $method === 'POST') {
        $body = aq_get_json_body();
        $items = isset($body['solutions']) ? $body['solutions'] : array();
        if (!is_array($items)) {
            aq_json_response(array('ok' => false, 'error' => 'Invalid solutions payload'), 400);
        }
        $count = 0;
        foreach ($items as $levelId => $item) {
            $note = isset($item['note']) ? trim((string)$item['note']) : '';
            $xml = isset($item['xml']) ? trim((string)$item['xml']) : '';
            if ($levelId !== '' && $xml !== '') {
                aq_upsert_solution($pdo, (string)$levelId, $note, $xml, 'system_seed');
                $count++;
            }
        }
        aq_json_response(array('ok' => true, 'seeded' => $count));
    }

    if ($action === 'save_solution' && $method === 'POST') {
        $body = aq_get_json_body();
        $levelId = isset($body['level_id']) ? trim((string)$body['level_id']) : '';
        $note = isset($body['note']) ? trim((string)$body['note']) : '';
        $xml = isset($body['xml']) ? trim((string)$body['xml']) : '';
        if ($levelId === '' || $xml === '') {
            aq_json_response(array('ok' => false, 'error' => 'level_id and xml are required'), 400);
        }
        aq_upsert_solution($pdo, $levelId, $note, $xml, 'admin');
        aq_json_response(array('ok' => true, 'message' => 'Solution saved to database'));
    }

    if ($action === 'report' && $method === 'GET') {
        $roster = aq_fetch_student_roster($pdo);
        $progStmt = $pdo->query('SELECT student_id, full_name, section, rank_title, total_xp, total_stars, passed_count, updated_at FROM blockly_ug_progress');
        $progMap = array();
        foreach ($progStmt->fetchAll() as $row) {
            $progMap[$row['student_id']] = $row;
        }

        $merged = array();
        foreach ($roster['students'] as $stu) {
            $sid = $stu['student_id'];
            $p = isset($progMap[$sid]) ? $progMap[$sid] : null;
            $merged[] = array(
                'student_id' => $sid,
                'full_name' => $stu['full_name'],
                'section' => $stu['section'],
                'rank_title' => $p ? $p['rank_title'] : 'ยังไม่เริ่มเล่น',
                'total_xp' => $p ? (int)$p['total_xp'] : 0,
                'total_stars' => $p ? (int)$p['total_stars'] : 0,
                'passed_count' => $p ? (int)$p['passed_count'] : 0,
                'updated_at' => $p ? $p['updated_at'] : null,
            );
            unset($progMap[$sid]);
        }
        foreach ($progMap as $sid => $p) {
            $merged[] = array(
                'student_id' => $sid,
                'full_name' => $p['full_name'],
                'section' => $p['section'],
                'rank_title' => $p['rank_title'],
                'total_xp' => (int)$p['total_xp'],
                'total_stars' => (int)$p['total_stars'],
                'passed_count' => (int)$p['passed_count'],
                'updated_at' => $p['updated_at'],
            );
        }

        aq_json_response(array(
            'ok' => true,
            'source' => $roster['source'],
            'driver' => aq_db_driver($pdo),
            'rows' => $merged,
        ));
    }

    if ($action === 'reset_student' && $method === 'POST') {
        $body = aq_get_json_body();
        $studentId = isset($body['student_id']) ? trim((string)$body['student_id']) : '';
        if ($studentId === '') {
            aq_json_response(array('ok' => false, 'error' => 'student_id is required'), 400);
        }
        $del = $pdo->prepare('DELETE FROM blockly_ug_progress WHERE student_id = ?');
        $del->execute(array($studentId));
        aq_json_response(array('ok' => true, 'message' => 'Student progress reset'));
    }

    aq_json_response(array('ok' => false, 'error' => 'Unknown action'), 400);
} catch (Exception $e) {
    aq_json_response(array('ok' => false, 'error' => $e->getMessage()), 500);
}
