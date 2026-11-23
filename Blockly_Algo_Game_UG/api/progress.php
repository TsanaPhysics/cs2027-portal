<?php
require_once __DIR__ . '/config.php';

try {
    $pdo = aq_get_pdo();
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        if (isset($_GET['all']) && $_GET['all'] === '1') {
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

            // Include any extra students who saved progress even if not in roster
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
                'rows' => $merged,
            ));
        }

        $studentId = isset($_GET['student_id']) ? trim((string)$_GET['student_id']) : '';
        if ($studentId === '') {
            aq_json_response(array('ok' => false, 'error' => 'Missing student_id'), 400);
        }

        $stmt = $pdo->prepare('SELECT * FROM blockly_ug_progress WHERE student_id = ?');
        $stmt->execute(array($studentId));
        $row = $stmt->fetch();
        aq_json_response(array(
            'ok' => true,
            'found' => (bool)$row,
            'record' => $row ?: null,
        ));
    }

    if ($method === 'POST') {
        $body = aq_get_json_body();
        $studentId = trim((string)($body['student_id'] ?? ''));
        if ($studentId === '') {
            aq_json_response(array('ok' => false, 'error' => 'student_id is required'), 400);
        }

        $fullName = trim((string)($body['full_name'] ?? ''));
        $section = trim((string)($body['section'] ?? ''));
        $rankTitle = trim((string)($body['rank_title'] ?? 'Novice Coder'));
        $totalXp = (int)($body['total_xp'] ?? 0);
        $totalStars = (int)($body['total_stars'] ?? 0);
        $passedCount = (int)($body['passed_count'] ?? 0);
        $progressJson = is_string($body['progress_json'] ?? null)
            ? $body['progress_json']
            : json_encode($body['progress_json'] ?? array(), JSON_UNESCAPED_UNICODE);

        if (aq_db_driver($pdo) === 'sqlite') {
            $chk = $pdo->prepare('SELECT 1 FROM blockly_ug_progress WHERE student_id = ?');
            $chk->execute(array($studentId));
            if ($chk->fetchColumn()) {
                $upd = $pdo->prepare('
                    UPDATE blockly_ug_progress
                    SET full_name = ?, section = ?, rank_title = ?, total_xp = ?, total_stars = ?, passed_count = ?, progress_json = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE student_id = ?
                ');
                $upd->execute(array($fullName, $section, $rankTitle, $totalXp, $totalStars, $passedCount, $progressJson, $studentId));
            } else {
                $ins = $pdo->prepare('
                    INSERT INTO blockly_ug_progress (student_id, full_name, section, rank_title, total_xp, total_stars, passed_count, progress_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ');
                $ins->execute(array($studentId, $fullName, $section, $rankTitle, $totalXp, $totalStars, $passedCount, $progressJson));
            }
        } else {
            $upsert = $pdo->prepare('
                INSERT INTO blockly_ug_progress (student_id, full_name, section, rank_title, total_xp, total_stars, passed_count, progress_json)
                VALUES (:student_id, :full_name, :section, :rank_title, :total_xp, :total_stars, :passed_count, :progress_json)
                ON DUPLICATE KEY UPDATE
                    full_name = VALUES(full_name),
                    section = VALUES(section),
                    rank_title = VALUES(rank_title),
                    total_xp = VALUES(total_xp),
                    total_stars = VALUES(total_stars),
                    passed_count = VALUES(passed_count),
                    progress_json = VALUES(progress_json)
            ');
            $upsert->execute(array(
                ':student_id' => $studentId,
                ':full_name' => $fullName,
                ':section' => $section,
                ':rank_title' => $rankTitle,
                ':total_xp' => $totalXp,
                ':total_stars' => $totalStars,
                ':passed_count' => $passedCount,
                ':progress_json' => $progressJson,
            ));
        }

        aq_json_response(array('ok' => true, 'message' => 'Saved to database'));
    }

    aq_json_response(array('ok' => false, 'error' => 'Method not allowed'), 405);
} catch (Exception $e) {
    aq_json_response(array('ok' => false, 'error' => $e->getMessage()), 500);
}
