<?php
/**
 * One-Click Auto-Unzipper & Permission Fixer for CS2027 on rbu-ubuntu.rbru.ac.th
 * วิธีใช้: อัปโหลดไฟล์นี้ไว้ที่เดียวกับ cs2027_3games_rbru_deploy.zip แล้วเปิดไฟล์นี้ผ่านเบราว์เซอร์
 */
header('Content-Type: text/html; charset=utf-8');

$zipFile = __DIR__ . '/cs2027_3games_rbru_deploy.zip';
$targetDir = __DIR__ . '/CS2027';

echo "<div style='font-family:sans-serif;max-width:720px;margin:30px auto;padding:24px;border-radius:12px;background:#0f172a;color:#f8fafc;line-height:1.6;'>";
echo "<h2 style='color:#38bdf8;margin-top:0;'>🚀 ระบบติดตั้งอัตโนมัติ CS2027 (3D & Interactive Games Portal)</h2>";

if (!file_exists($zipFile)) {
    echo "<p style='color:#f87171;'>❌ ไม่พบไฟล์ <code>cs2027_3games_rbru_deploy.zip</code> ในโฟลเดอร์ <code>" . htmlspecialchars(__DIR__) . "</code></p>";
    echo "</div>";
    exit;
}

if (!is_dir($targetDir)) {
    @mkdir($targetDir, 0755, true);
}

$extracted = false;
if (class_exists('ZipArchive')) {
    $zip = new ZipArchive();
    if ($zip->open($zipFile) === TRUE) {
        $zip->extractTo($targetDir);
        $zip->close();
        $extracted = true;
    }
}

if (!$extracted) {
    // Fallback to system unzip command on Ubuntu
    $cmd = sprintf('unzip -o %s -d %s 2>&1', escapeshellarg($zipFile), escapeshellarg($targetDir));
    $out = shell_exec($cmd);
    if (file_exists($targetDir . '/portal.html')) {
        $extracted = true;
    } else {
        echo "<pre style='background:#1e293b;padding:12px;border-radius:8px;color:#fca5a5;'>" . htmlspecialchars((string)$out) . "</pre>";
    }
}

function fixPermissionsRecursive($dir) {
    if (!is_dir($dir)) return;
    $isDataDir = (basename($dir) === 'data');
    @chmod($dir, $isDataDir ? 0777 : 0755);

    $items = scandir($dir);
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;
        $path = $dir . '/' . $item;
        if (is_dir($path)) {
            fixPermissionsRecursive($path);
        } else {
            $isSqlite = (substr($item, -7) === '.sqlite' || basename($dir) === 'data');
            @chmod($path, $isSqlite ? 0666 : 0644);
        }
    }
}

if ($extracted) {
    fixPermissionsRecursive($targetDir);
    echo "<p style='color:#4ade80;font-weight:bold;'>✅ แตกไฟล์และตั้งค่า Permission (755/644 และ 777 สำหรับฐานข้อมูล SQLite) สำเร็จแล้ว!</p>";
    echo "<ul>";
    echo "<li>โฟลเดอร์ติดตั้ง: <code>" . htmlspecialchars($targetDir) . "</code></li>";
    echo "<li><a href='CS2027/portal.html' style='color:#38bdf8;font-weight:bold;'>👉 คลิกที่นี่เพื่อเข้าสู่หน้าหลัก CS2027 Portal (3 เกม)</a></li>";
    echo "<li><a href='CS2027/Method05_3D_OBE_STEAM_Game/index.html' style='color:#a855f7;font-weight:bold;'>👉 คลิกที่นี่เพื่อเข้าสู่เกม 3 มิติ ALGO-QUEST 3D (05_method)</a></li>";
    echo "</ul>";
} else {
    echo "<p style='color:#f87171;'>❌ ไม่สามารถแตกไฟล์อัตโนมัติได้ กรุณาแตกไฟล์ผ่าน SSH หรืออัปโหลดโฟลเดอร์ผ่าน FileZilla</p>";
}
echo "</div>";
