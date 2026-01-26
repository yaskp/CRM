
-- Migration: Create Work Templates
CREATE TABLE IF NOT EXISTS `work_templates` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `description` TEXT,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `work_template_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `template_id` INT NOT NULL,
    `work_item_type_id` INT NOT NULL,
    `item_type` ENUM('material', 'labour', 'contract') DEFAULT 'labour',
    `unit` VARCHAR(20),
    `sort_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`template_id`) REFERENCES `work_templates`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`work_item_type_id`) REFERENCES `work_item_types`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
