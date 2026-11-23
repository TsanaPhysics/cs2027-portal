-- CT-Lab v4.0 — Database System Prototype Schema (MySQL / MariaDB for XAMPP & Server)
-- รองรับการใช้งานพร้อมกันจำนวนมากด้วย InnoDB Engine, UTF-8 (utf8mb4) และระบบ AI ตรวจงาน/รายงานอัตโนมัติ

CREATE DATABASE IF NOT EXISTS `ct_lab_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `ct_lab_db`;

CREATE TABLE IF NOT EXISTS `ctlab_students` (
  `student_id` VARCHAR(32) NOT NULL,
  `full_name` VARCHAR(120) NOT NULL,
  `section` VARCHAR(40) NOT NULL DEFAULT '',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_id`),
  INDEX `idx_section` (`section`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ctlab_submissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` VARCHAR(32) NOT NULL,
  `module_id` VARCHAR(64) NOT NULL DEFAULT 'all',
  `completed_count` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `total_modules` TINYINT UNSIGNED NOT NULL DEFAULT 9,
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
  INDEX `idx_student` (`student_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_module` (`module_id`),
  INDEX `idx_submitted_at` (`submitted_at`),
  CONSTRAINT `fk_ctlab_submissions_student`
    FOREIGN KEY (`student_id`) REFERENCES `ctlab_students` (`student_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ctlab_ai_reports` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `report_scope` VARCHAR(64) NOT NULL DEFAULT 'all',
  `total_students` INT UNSIGNED NOT NULL DEFAULT 0,
  `submitted_students` INT UNSIGNED NOT NULL DEFAULT 0,
  `avg_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `summary_json` LONGTEXT NOT NULL,
  `narrative_text` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_scope` (`report_scope`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE VIEW `vw_ctlab_student_summary` AS
SELECT
  st.student_id,
  st.full_name,
  st.section,
  COUNT(sub.id) AS total_submissions,
  COUNT(DISTINCT CASE WHEN sub.module_id <> 'all' THEN sub.module_id END) AS distinct_modules_submitted,
  ROUND(AVG(COALESCE(sub.teacher_score, sub.ai_score, sub.auto_score)), 2) AS avg_score,
  ROUND(MAX(COALESCE(sub.teacher_score, sub.ai_score, sub.auto_score)), 2) AS best_score,
  MAX(sub.submitted_at) AS last_submitted_at,
  (SELECT s2.status
   FROM ctlab_submissions s2
   WHERE s2.student_id = st.student_id
   ORDER BY s2.submitted_at DESC, s2.id DESC
   LIMIT 1) AS latest_status
FROM ctlab_students st
LEFT JOIN ctlab_submissions sub ON sub.student_id = st.student_id
GROUP BY st.student_id, st.full_name, st.section;
