<?php
require_once __DIR__ . '/config.php';

try {
    $pdo = aq_get_pdo();
    $result = aq_fetch_student_roster($pdo);
    aq_json_response(array(
        'ok' => true,
        'source' => $result['source'],
        'count' => count($result['students']),
        'students' => $result['students'],
    ));
} catch (Exception $e) {
    aq_json_response(array(
        'ok' => false,
        'error' => $e->getMessage(),
        'students' => array(),
    ), 500);
}
