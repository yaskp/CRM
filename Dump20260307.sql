-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: crm_construction
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `actual data_cron`
--

DROP TABLE IF EXISTS `actual data_cron`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `actual data_cron` (
  `id` int DEFAULT NULL,
  `employee_id` text,
  `username` text,
  `name` text,
  `email` text,
  `phone` text,
  `password_hash` text,
  `company_id` text,
  `is_active` int DEFAULT NULL,
  `last_login` text,
  `created_at` text,
  `updated_at` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `annexures`
--

DROP TABLE IF EXISTS `annexures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `annexures` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `clauses` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `client_scope` text,
  `contractor_scope` text,
  `type` enum('client_scope','contractor_scope','payment_terms','general_terms','purchase_order','scope_matrix') DEFAULT 'general_terms',
  `payment_terms` text,
  `delivery_terms` text,
  `quality_terms` text,
  `warranty_terms` text,
  `penalty_clause` text,
  `scope_matrix` json DEFAULT NULL,
  `_old_po_terms_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bar_bending_schedules`
--

DROP TABLE IF EXISTS `bar_bending_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bar_bending_schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `panel_number` varchar(50) DEFAULT NULL,
  `schedule_number` varchar(50) DEFAULT NULL,
  `drawing_reference` varchar(100) DEFAULT NULL,
  `steel_quantity_kg` decimal(10,2) DEFAULT NULL,
  `status` enum('draft','approved','in_progress','completed') DEFAULT 'draft',
  `created_by` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `bar_bending_schedules_ibfk_5` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `bar_bending_schedules_ibfk_6` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `budget_heads`
--

DROP TABLE IF EXISTS `budget_heads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_heads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `type` enum('group','item') DEFAULT 'item',
  `parent_id` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `budget_heads_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `budget_heads` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `client_contacts`
--

DROP TABLE IF EXISTS `client_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_contacts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `contact_name` varchar(255) NOT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_client_contacts_client_id` (`client_id`),
  CONSTRAINT `client_contacts_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `client_groups`
--

DROP TABLE IF EXISTS `client_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_name` varchar(100) NOT NULL,
  `group_type` enum('corporate','sme','government','individual','retail') NOT NULL DEFAULT 'corporate',
  `description` text,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `group_name` (`group_name`),
  UNIQUE KEY `group_name_2` (`group_name`),
  UNIQUE KEY `group_name_3` (`group_name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_code` varchar(50) NOT NULL,
  `client_group_id` int DEFAULT NULL,
  `company_name` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `gstin` varchar(20) DEFAULT NULL,
  `is_gst_registered` tinyint(1) DEFAULT '1',
  `pan` varchar(10) DEFAULT NULL,
  `payment_terms` varchar(200) DEFAULT NULL,
  `credit_limit` decimal(15,2) DEFAULT '0.00',
  `client_type` enum('individual','company','government') DEFAULT 'company',
  `status` enum('active','inactive','blocked') DEFAULT 'active',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `client_code` (`client_code`),
  UNIQUE KEY `client_code_2` (`client_code`),
  UNIQUE KEY `client_code_3` (`client_code`),
  KEY `idx_clients_group_id` (`client_group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `code_2` (`code`),
  UNIQUE KEY `code_3` (`code`),
  UNIQUE KEY `code_4` (`code`),
  UNIQUE KEY `code_5` (`code`),
  UNIQUE KEY `code_6` (`code`),
  UNIQUE KEY `code_7` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `company_branches`
--

DROP TABLE IF EXISTS `company_branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `branch_name` varchar(100) NOT NULL,
  `gstin` varchar(20) NOT NULL,
  `state_code` varchar(2) NOT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `company_branches_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `credit_note_items`
--

DROP TABLE IF EXISTS `credit_note_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `credit_note_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `credit_note_id` int NOT NULL,
  `material_id` int NOT NULL,
  `quantity` decimal(15,3) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `tax_percentage` decimal(5,2) DEFAULT '0.00',
  `tax_amount` decimal(15,2) DEFAULT '0.00',
  `total_amount` decimal(15,2) DEFAULT '0.00',
  `unit` varchar(20) DEFAULT NULL,
  `remarks` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `credit_note_id` (`credit_note_id`),
  KEY `material_id` (`material_id`),
  CONSTRAINT `credit_note_items_ibfk_1` FOREIGN KEY (`credit_note_id`) REFERENCES `credit_notes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `credit_note_items_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `credit_notes`
--

DROP TABLE IF EXISTS `credit_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `credit_notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `credit_note_number` varchar(50) NOT NULL,
  `transaction_date` date NOT NULL,
  `srn_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `purchase_order_id` int DEFAULT NULL,
  `subtotal` decimal(15,2) DEFAULT '0.00',
  `tax_amount` decimal(15,2) DEFAULT '0.00',
  `total_amount` decimal(15,2) DEFAULT '0.00',
  `gst_type` enum('intra_state','inter_state') DEFAULT 'intra_state',
  `status` enum('draft','approved','cancelled') DEFAULT 'draft',
  `remarks` text,
  `created_by` int NOT NULL,
  `approved_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `credit_note_number` (`credit_note_number`),
  KEY `srn_id` (`srn_id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `purchase_order_id` (`purchase_order_id`),
  KEY `created_by` (`created_by`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `credit_notes_ibfk_1` FOREIGN KEY (`srn_id`) REFERENCES `store_transactions` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `credit_notes_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `credit_notes_ibfk_3` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `credit_notes_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `credit_notes_ibfk_5` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `daily_progress_reports`
--

DROP TABLE IF EXISTS `daily_progress_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_progress_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `building_id` int DEFAULT NULL,
  `floor_id` int DEFAULT NULL,
  `zone_id` int DEFAULT NULL,
  `work_completion_percentage` decimal(5,2) DEFAULT '0.00',
  `report_date` date NOT NULL,
  `site_location` varchar(200) DEFAULT NULL,
  `panel_number` varchar(50) DEFAULT NULL,
  `guide_wall_running_meter` decimal(10,2) DEFAULT NULL,
  `steel_quantity_kg` decimal(10,2) DEFAULT NULL,
  `concrete_quantity_cubic_meter` decimal(10,2) DEFAULT NULL,
  `polymer_consumption_bags` int DEFAULT NULL,
  `diesel_consumption_liters` decimal(10,2) DEFAULT NULL,
  `weather_conditions` varchar(100) DEFAULT NULL,
  `remarks` text,
  `work_item_type_id` int DEFAULT NULL COMMENT 'Links to work_item_types master for work type tracking',
  `created_by` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `drawing_panel_id` int DEFAULT NULL,
  `actual_depth` decimal(10,2) DEFAULT NULL,
  `verticality_x` decimal(5,2) DEFAULT NULL,
  `verticality_y` decimal(5,2) DEFAULT NULL,
  `slurry_density` decimal(5,3) DEFAULT NULL,
  `slurry_viscosity` decimal(5,2) DEFAULT NULL,
  `slurry_sand_content` decimal(5,2) DEFAULT NULL,
  `cage_id_ref` varchar(100) DEFAULT NULL,
  `start_time` varchar(10) DEFAULT NULL,
  `end_time` varchar(10) DEFAULT NULL,
  `slump_flow` decimal(10,2) DEFAULT NULL,
  `tremie_pipe_count` int DEFAULT NULL,
  `theoretical_concrete_qty` decimal(10,2) DEFAULT NULL,
  `overbreak_percentage` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_project_date_panel` (`project_id`,`report_date`,`panel_number`),
  KEY `idx_dpr_project_date` (`project_id`,`report_date`),
  KEY `created_by` (`created_by`),
  KEY `idx_dpr_work_type` (`work_item_type_id`),
  KEY `fk_dpr_floor` (`floor_id`),
  KEY `fk_dpr_zone` (`zone_id`),
  KEY `idx_dpr_location` (`building_id`,`floor_id`,`zone_id`),
  KEY `fk_dpr_drawing_panels` (`drawing_panel_id`),
  CONSTRAINT `daily_progress_reports_ibfk_5` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `daily_progress_reports_ibfk_6` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_dpr_building` FOREIGN KEY (`building_id`) REFERENCES `project_buildings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dpr_drawing_panels` FOREIGN KEY (`drawing_panel_id`) REFERENCES `drawing_panels` (`id`),
  CONSTRAINT `fk_dpr_floor` FOREIGN KEY (`floor_id`) REFERENCES `project_floors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dpr_zone` FOREIGN KEY (`zone_id`) REFERENCES `project_zones` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dpr_machinery_breakdown_logs`
--

DROP TABLE IF EXISTS `dpr_machinery_breakdown_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dpr_machinery_breakdown_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_id` int NOT NULL,
  `project_id` int NOT NULL,
  `report_date` date NOT NULL,
  `equipment_id` int DEFAULT NULL,
  `equipment_name` varchar(255) DEFAULT NULL,
  `equipment_type` varchar(100) DEFAULT NULL,
  `registration_number` varchar(100) DEFAULT NULL,
  `breakdown_start` varchar(10) DEFAULT NULL,
  `breakdown_end` varchar(10) DEFAULT NULL,
  `breakdown_hours` decimal(5,2) DEFAULT NULL,
  `breakdown_reason` varchar(50) DEFAULT NULL,
  `breakdown_description` text,
  `action_taken` text,
  `status` enum('pending','repaired','replaced') DEFAULT 'pending',
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_dmachinery_transaction` (`transaction_id`),
  KEY `idx_dmachinery_project_date` (`project_id`,`report_date`),
  KEY `idx_dmachinery_equip_date` (`equipment_id`,`report_date`),
  KEY `idx_dmachinery_reason` (`breakdown_reason`),
  KEY `idx_dmachinery_status` (`status`),
  CONSTRAINT `dpr_machinery_breakdown_logs_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `store_transactions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `dpr_machinery_breakdown_logs_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `dpr_machinery_breakdown_logs_ibfk_3` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dpr_manpower_logs`
--

DROP TABLE IF EXISTS `dpr_manpower_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dpr_manpower_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_id` int NOT NULL,
  `project_id` int NOT NULL,
  `report_date` date NOT NULL,
  `worker_type` varchar(100) DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `staff_name` varchar(150) DEFAULT NULL,
  `staff_role` varchar(100) DEFAULT NULL,
  `count` int NOT NULL DEFAULT '0',
  `hajri` decimal(3,1) NOT NULL DEFAULT '1.0',
  `is_staff` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `work_order_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_dmanpower_transaction` (`transaction_id`),
  KEY `idx_dmanpower_project_date` (`project_id`,`report_date`),
  KEY `idx_dmanpower_worker_type` (`worker_type`),
  KEY `idx_dmanpower_user` (`user_id`),
  KEY `idx_dmanpower_is_staff` (`is_staff`),
  KEY `dpr_manpower_logs_work_order_id_foreign_idx` (`work_order_id`),
  CONSTRAINT `dpr_manpower_logs_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `store_transactions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `dpr_manpower_logs_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `dpr_manpower_logs_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `dpr_manpower_logs_work_order_id_foreign_idx` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dpr_panel_work_logs`
--

DROP TABLE IF EXISTS `dpr_panel_work_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dpr_panel_work_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_id` int NOT NULL,
  `project_id` int NOT NULL,
  `report_date` date NOT NULL,
  `drawing_panel_id` int DEFAULT NULL,
  `panel_identifier` varchar(50) DEFAULT NULL,
  `grabbing_depth` decimal(10,3) DEFAULT NULL,
  `grabbing_sqm` decimal(10,3) DEFAULT NULL,
  `grabbing_start_time` varchar(100) DEFAULT NULL,
  `grabbing_end_time` varchar(100) DEFAULT NULL,
  `concrete_start_time` varchar(100) DEFAULT NULL,
  `concrete_end_time` varchar(100) DEFAULT NULL,
  `concrete_grade` varchar(20) DEFAULT NULL,
  `theoretical_concrete_qty` decimal(10,3) DEFAULT NULL,
  `actual_concrete_qty` decimal(10,3) DEFAULT NULL,
  `cage_id_ref` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `work_order_id` int DEFAULT NULL,
  `boq_item_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_dpanellog_transaction` (`transaction_id`),
  KEY `idx_dpanellog_project_date` (`project_id`,`report_date`),
  KEY `idx_dpanellog_panel` (`drawing_panel_id`),
  KEY `idx_dpanellog_grade` (`concrete_grade`),
  KEY `idx_dpanellog_date` (`report_date`),
  KEY `idx_dpanel_work_order` (`work_order_id`),
  KEY `idx_dpanel_boq_item` (`boq_item_id`),
  CONSTRAINT `dpr_panel_work_logs_boq_item_id_foreign_idx` FOREIGN KEY (`boq_item_id`) REFERENCES `project_boq_items` (`id`),
  CONSTRAINT `dpr_panel_work_logs_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `store_transactions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `dpr_panel_work_logs_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `dpr_panel_work_logs_ibfk_3` FOREIGN KEY (`drawing_panel_id`) REFERENCES `drawing_panels` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `dpr_panel_work_logs_work_order_id_foreign_idx` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dpr_pile_work_logs`
--

DROP TABLE IF EXISTS `dpr_pile_work_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dpr_pile_work_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_id` int NOT NULL,
  `project_id` int NOT NULL,
  `report_date` date NOT NULL,
  `drawing_panel_id` int DEFAULT NULL,
  `pile_identifier` varchar(50) DEFAULT NULL,
  `achieved_depth` decimal(10,3) DEFAULT NULL,
  `rock_socket_length` decimal(10,3) DEFAULT NULL,
  `start_time` varchar(100) DEFAULT NULL,
  `end_time` varchar(100) DEFAULT NULL,
  `concrete_poured` decimal(10,3) DEFAULT NULL,
  `actual_concrete_qty` decimal(10,3) DEFAULT NULL,
  `concrete_grade` varchar(20) DEFAULT NULL,
  `steel_installed` decimal(10,3) DEFAULT NULL,
  `rig_id` int DEFAULT NULL,
  `slump_test` decimal(6,1) DEFAULT NULL,
  `cube_test_id` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `work_order_id` int DEFAULT NULL,
  `boq_item_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_dpilelog_transaction` (`transaction_id`),
  KEY `idx_dpilelog_project_date` (`project_id`,`report_date`),
  KEY `idx_dpilelog_pile` (`drawing_panel_id`),
  KEY `idx_dpilelog_grade` (`concrete_grade`),
  KEY `idx_dpilelog_date` (`report_date`),
  KEY `idx_dpile_work_order` (`work_order_id`),
  KEY `idx_dpile_boq_item` (`boq_item_id`),
  CONSTRAINT `dpr_pile_work_logs_boq_item_id_foreign_idx` FOREIGN KEY (`boq_item_id`) REFERENCES `project_boq_items` (`id`),
  CONSTRAINT `dpr_pile_work_logs_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `store_transactions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `dpr_pile_work_logs_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `dpr_pile_work_logs_ibfk_3` FOREIGN KEY (`drawing_panel_id`) REFERENCES `drawing_panels` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `dpr_pile_work_logs_work_order_id_foreign_idx` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dpr_rmc_logs`
--

DROP TABLE IF EXISTS `dpr_rmc_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dpr_rmc_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dpr_id` int NOT NULL,
  `vehicle_no` varchar(50) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `slump` decimal(10,2) DEFAULT NULL,
  `in_time` varchar(100) DEFAULT NULL,
  `start_time` varchar(100) DEFAULT NULL,
  `out_time` varchar(100) DEFAULT NULL,
  `remarks` text,
  `created_at` datetime DEFAULT NULL,
  `drawing_panel_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `dpr_id` (`dpr_id`),
  KEY `fk_rmclog_drawing_panel` (`drawing_panel_id`),
  CONSTRAINT `fk_rmclog_drawing_panel` FOREIGN KEY (`drawing_panel_id`) REFERENCES `drawing_panels` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `drawing_panel_anchors`
--

DROP TABLE IF EXISTS `drawing_panel_anchors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drawing_panel_anchors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `drawing_panel_id` int NOT NULL,
  `layer_number` int NOT NULL,
  `no_of_anchors` int NOT NULL DEFAULT '0',
  `anchor_length` decimal(10,2) NOT NULL DEFAULT '0.00',
  `anchor_capacity` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `drawing_panel_id` (`drawing_panel_id`),
  CONSTRAINT `drawing_panel_anchors_ibfk_1` FOREIGN KEY (`drawing_panel_id`) REFERENCES `drawing_panels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=851 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `drawing_panels`
--

DROP TABLE IF EXISTS `drawing_panels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drawing_panels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `drawing_id` int NOT NULL,
  `panel_identifier` varchar(50) NOT NULL,
  `coordinates_json` json DEFAULT NULL,
  `panel_type` varchar(50) DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `design_depth` decimal(10,2) DEFAULT NULL,
  `width` decimal(10,2) DEFAULT NULL,
  `theoretical_concrete_volume` decimal(10,2) DEFAULT NULL,
  `theoretical_steel_kg` decimal(10,2) DEFAULT NULL,
  `length` decimal(10,2) DEFAULT NULL,
  `top_rl` decimal(10,2) DEFAULT NULL,
  `bottom_rl` decimal(10,2) DEFAULT NULL,
  `reinforcement_ton` decimal(10,2) DEFAULT NULL,
  `no_of_anchors` int DEFAULT NULL,
  `anchor_length` decimal(10,2) DEFAULT NULL,
  `anchor_capacity` decimal(10,2) DEFAULT NULL,
  `concrete_design_qty` decimal(10,2) DEFAULT NULL,
  `grabbing_qty` decimal(10,2) DEFAULT NULL,
  `stop_end_area` decimal(10,2) DEFAULT NULL,
  `guide_wall_rm` decimal(10,2) DEFAULT NULL,
  `ramming_qty` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `drawing_id` (`drawing_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `drawing_panels_ibfk_7` FOREIGN KEY (`drawing_id`) REFERENCES `drawings` (`id`),
  CONSTRAINT `drawing_panels_ibfk_8` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=581 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `drawings`
--

DROP TABLE IF EXISTS `drawings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drawings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `drawing_number` varchar(50) DEFAULT NULL,
  `drawing_name` varchar(200) DEFAULT NULL,
  `drawing_type` varchar(100) DEFAULT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `uploaded_by` int NOT NULL,
  `uploaded_at` datetime DEFAULT NULL,
  `version` int DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `drawings_ibfk_5` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `drawings_ibfk_6` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `equipment`
--

DROP TABLE IF EXISTS `equipment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `equipment_code` varchar(50) NOT NULL,
  `name` varchar(200) NOT NULL,
  `equipment_type` enum('crane','jcb','rig','grabbing_rig','steel_bending_machine','steel_cutting_machine','water_tank','pump','other') NOT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `registration_number` varchar(100) DEFAULT NULL,
  `is_rental` tinyint(1) DEFAULT '0',
  `owner_vendor_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `equipment_code` (`equipment_code`),
  UNIQUE KEY `equipment_code_2` (`equipment_code`),
  UNIQUE KEY `equipment_code_3` (`equipment_code`),
  KEY `owner_vendor_id` (`owner_vendor_id`),
  CONSTRAINT `equipment_ibfk_1` FOREIGN KEY (`owner_vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `equipment_breakdowns`
--

DROP TABLE IF EXISTS `equipment_breakdowns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment_breakdowns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rental_id` int NOT NULL,
  `breakdown_date` date NOT NULL,
  `breakdown_time` time DEFAULT NULL,
  `resolution_date` date DEFAULT NULL,
  `resolution_time` time DEFAULT NULL,
  `breakdown_hours` decimal(5,2) DEFAULT NULL,
  `breakdown_reason` text,
  `deduction_amount` decimal(15,2) DEFAULT NULL,
  `reported_by` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `rental_id` (`rental_id`),
  KEY `reported_by` (`reported_by`),
  CONSTRAINT `equipment_breakdowns_ibfk_5` FOREIGN KEY (`rental_id`) REFERENCES `equipment_rentals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `equipment_breakdowns_ibfk_6` FOREIGN KEY (`reported_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `equipment_rentals`
--

DROP TABLE IF EXISTS `equipment_rentals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment_rentals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `equipment_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `rate_per_day` decimal(15,2) DEFAULT NULL,
  `rate_per_sq_meter` decimal(15,2) DEFAULT NULL,
  `total_days` int DEFAULT NULL,
  `total_amount` decimal(15,2) DEFAULT NULL,
  `breakdown_deduction_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `net_amount` decimal(15,2) DEFAULT NULL,
  `status` enum('active','completed','terminated') DEFAULT 'active',
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `equipment_id` (`equipment_id`),
  KEY `vendor_id` (`vendor_id`),
  CONSTRAINT `equipment_rentals_ibfk_7` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `equipment_rentals_ibfk_8` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `equipment_rentals_ibfk_9` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `executed_migrations`
--

DROP TABLE IF EXISTS `executed_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `executed_migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `executed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expense_approvals`
--

DROP TABLE IF EXISTS `expense_approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_approvals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expense_id` int NOT NULL,
  `approval_level` int NOT NULL,
  `approver_role` varchar(50) NOT NULL,
  `approver_id` int DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `comments` text,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `expense_id` (`expense_id`),
  KEY `approver_id` (`approver_id`),
  CONSTRAINT `expense_approvals_ibfk_5` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `expense_approvals_ibfk_6` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expense_number` varchar(50) NOT NULL,
  `project_id` int NOT NULL,
  `expense_type` enum('conveyance','loose_purchase','food','two_wheeler','other') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text,
  `expense_date` date NOT NULL,
  `bill_url` varchar(500) DEFAULT NULL,
  `selfie_url` varchar(500) DEFAULT NULL,
  `input_method` enum('auto','manual') DEFAULT 'manual',
  `bill_type` enum('kaccha_bill','pakka_bill','petrol_bill','ola_uber_screenshot','not_required') DEFAULT NULL,
  `status` enum('draft','pending_approval_1','pending_approval_2','pending_approval_3','approved','rejected') DEFAULT 'draft',
  `submitted_by` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `budget_head_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `expense_number` (`expense_number`),
  UNIQUE KEY `expense_number_2` (`expense_number`),
  UNIQUE KEY `expense_number_3` (`expense_number`),
  KEY `idx_expenses_status` (`status`),
  KEY `project_id` (`project_id`),
  KEY `submitted_by` (`submitted_by`),
  KEY `fk_expenses_budget_head` (`budget_head_id`),
  CONSTRAINT `expenses_ibfk_5` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `expenses_ibfk_6` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_expenses_budget_head` FOREIGN KEY (`budget_head_id`) REFERENCES `budget_heads` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `financial_transactions`
--

DROP TABLE IF EXISTS `financial_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `financial_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_number` varchar(50) NOT NULL,
  `transaction_date` date NOT NULL,
  `type` enum('payment','receipt','contra','journal') NOT NULL,
  `category` enum('vendor','client','site_expense','salary','advance','other') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `tds_amount` decimal(15,2) DEFAULT '0.00',
  `retention_amount` decimal(15,2) DEFAULT '0.00',
  `net_amount` decimal(15,2) NOT NULL,
  `project_id` int DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `client_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `payment_mode` enum('cash','cheque','neft','rtgs','upi') NOT NULL DEFAULT 'neft',
  `reference_number` varchar(100) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `bank_account_id` int DEFAULT NULL,
  `status` enum('draft','pending','cleared','cancelled') DEFAULT 'draft',
  `remarks` text,
  `attachment_url` varchar(255) DEFAULT NULL,
  `created_by` int NOT NULL,
  `approved_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_number` (`transaction_number`),
  KEY `fk_ft_project` (`project_id`),
  KEY `fk_ft_vendor` (`vendor_id`),
  KEY `fk_ft_client` (`client_id`),
  KEY `fk_ft_creator` (`created_by`),
  CONSTRAINT `fk_ft_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `fk_ft_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_ft_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `fk_ft_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `warehouse_id` int NOT NULL,
  `project_id` int DEFAULT NULL,
  `material_id` int NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `reserved_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `min_stock_level` decimal(10,2) DEFAULT NULL,
  `max_stock_level` decimal(10,2) DEFAULT NULL,
  `last_updated` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_warehouse_material` (`warehouse_id`,`material_id`),
  KEY `idx_inventory_warehouse` (`warehouse_id`),
  KEY `material_id` (`material_id`),
  KEY `fk_inv_project` (`project_id`),
  CONSTRAINT `fk_inv_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `inventory_ibfk_5` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `inventory_ibfk_6` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inventory_ledger`
--

DROP TABLE IF EXISTS `inventory_ledger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_ledger` (
  `id` int NOT NULL AUTO_INCREMENT,
  `material_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `transaction_type` enum('GRN','STN_IN','STN_OUT','CONSUMPTION','SRN','SRN_IN','SRN_OUT','ADJUSTMENT','OPENING') DEFAULT NULL,
  `transaction_id` int DEFAULT NULL,
  `transaction_number` varchar(50) DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `quantity_in` decimal(15,2) DEFAULT '0.00',
  `quantity_out` decimal(15,2) DEFAULT '0.00',
  `balance_quantity` decimal(15,2) NOT NULL,
  `unit` varchar(20) NOT NULL,
  `batch_number` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `rate` decimal(15,2) DEFAULT NULL,
  `value` decimal(15,2) DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `building_id` int DEFAULT NULL,
  `floor_id` int DEFAULT NULL,
  `zone_id` int DEFAULT NULL,
  `work_item_type_id` int DEFAULT NULL,
  `remarks` text,
  `created_at` datetime DEFAULT NULL,
  `wastage_quantity` decimal(15,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `material_id` (`material_id`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `transaction_id` (`transaction_id`),
  KEY `project_id` (`project_id`),
  KEY `building_id` (`building_id`),
  KEY `floor_id` (`floor_id`),
  KEY `zone_id` (`zone_id`),
  KEY `work_item_type_id` (`work_item_type_id`),
  CONSTRAINT `inventory_ledger_ibfk_10` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `inventory_ledger_ibfk_11` FOREIGN KEY (`transaction_id`) REFERENCES `store_transactions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `inventory_ledger_ibfk_12` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `inventory_ledger_ibfk_13` FOREIGN KEY (`building_id`) REFERENCES `project_buildings` (`id`),
  CONSTRAINT `inventory_ledger_ibfk_14` FOREIGN KEY (`floor_id`) REFERENCES `project_floors` (`id`),
  CONSTRAINT `inventory_ledger_ibfk_15` FOREIGN KEY (`zone_id`) REFERENCES `project_zones` (`id`),
  CONSTRAINT `inventory_ledger_ibfk_16` FOREIGN KEY (`work_item_type_id`) REFERENCES `work_item_types` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `inventory_ledger_ibfk_9` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int DEFAULT NULL,
  `client_id` int DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `enquiry_date` datetime DEFAULT NULL,
  `soil_report_url` varchar(500) DEFAULT NULL,
  `layout_url` varchar(500) DEFAULT NULL,
  `section_url` varchar(500) DEFAULT NULL,
  `status` enum('new','contacted','quoted','follow_up','converted','lost') DEFAULT 'new',
  `created_at` datetime DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `state_code` varchar(2) DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL,
  `remarks` text,
  PRIMARY KEY (`id`),
  KEY `idx_leads_project` (`project_id`),
  KEY `fk_leads_client` (`client_id`),
  CONSTRAINT `fk_leads_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `leads_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `manpower_reports`
--

DROP TABLE IF EXISTS `manpower_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manpower_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dpr_id` int NOT NULL,
  `worker_type` enum('steel_worker','concrete_worker','department_worker','electrician','welder') NOT NULL,
  `count` int NOT NULL,
  `hajri` enum('1','1.5','2') NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `dpr_id` (`dpr_id`),
  CONSTRAINT `manpower_reports_ibfk_1` FOREIGN KEY (`dpr_id`) REFERENCES `daily_progress_reports` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `material_requisition_items`
--

DROP TABLE IF EXISTS `material_requisition_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_requisition_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requisition_id` int NOT NULL,
  `material_id` int NOT NULL,
  `requested_quantity` decimal(10,2) NOT NULL,
  `issued_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `unit` varchar(20) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `boq_item_id` int DEFAULT NULL,
  `building_id` int DEFAULT NULL,
  `floor_id` int DEFAULT NULL,
  `zone_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `requisition_id` (`requisition_id`),
  KEY `material_id` (`material_id`),
  KEY `fk_mri_boq_item` (`boq_item_id`),
  KEY `fk_mri_building` (`building_id`),
  KEY `fk_mri_floor` (`floor_id`),
  KEY `fk_mri_zone` (`zone_id`),
  CONSTRAINT `fk_mri_boq_item` FOREIGN KEY (`boq_item_id`) REFERENCES `project_boq_items` (`id`),
  CONSTRAINT `fk_mri_building` FOREIGN KEY (`building_id`) REFERENCES `project_buildings` (`id`),
  CONSTRAINT `fk_mri_floor` FOREIGN KEY (`floor_id`) REFERENCES `project_floors` (`id`),
  CONSTRAINT `fk_mri_zone` FOREIGN KEY (`zone_id`) REFERENCES `project_zones` (`id`),
  CONSTRAINT `material_requisition_items_ibfk_5` FOREIGN KEY (`requisition_id`) REFERENCES `material_requisitions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `material_requisition_items_ibfk_6` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Line items for material requisitions';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `material_requisitions`
--

DROP TABLE IF EXISTS `material_requisitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_requisitions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requisition_number` varchar(50) NOT NULL,
  `project_id` int NOT NULL,
  `from_warehouse_id` int DEFAULT NULL,
  `requested_by` int NOT NULL,
  `requested_date` date NOT NULL,
  `required_date` date DEFAULT NULL,
  `status` enum('pending','approved','partially_issued','issued','rejected') DEFAULT 'pending',
  `approved_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `boq_id` int DEFAULT NULL,
  `purpose` text,
  `remarks` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `requisition_number` (`requisition_number`),
  UNIQUE KEY `requisition_number_2` (`requisition_number`),
  UNIQUE KEY `requisition_number_3` (`requisition_number`),
  KEY `project_id` (`project_id`),
  KEY `from_warehouse_id` (`from_warehouse_id`),
  KEY `requested_by` (`requested_by`),
  KEY `approved_by` (`approved_by`),
  KEY `fk_mr_boq` (`boq_id`),
  CONSTRAINT `fk_mr_boq` FOREIGN KEY (`boq_id`) REFERENCES `project_boqs` (`id`),
  CONSTRAINT `material_requisitions_ibfk_10` FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `material_requisitions_ibfk_11` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `material_requisitions_ibfk_12` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `material_requisitions_ibfk_9` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Material requisitions for projects';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `materials`
--

DROP TABLE IF EXISTS `materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `material_code` varchar(50) NOT NULL,
  `name` varchar(200) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `unit` text,
  `hsn_code` varchar(50) DEFAULT NULL,
  `gst_rate` decimal(5,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `budget_head_id` int DEFAULT NULL,
  `standard_rate` decimal(15,4) DEFAULT NULL,
  `uom` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `material_code` (`material_code`),
  UNIQUE KEY `material_code_2` (`material_code`),
  UNIQUE KEY `material_code_3` (`material_code`),
  KEY `fk_materials_budget_head` (`budget_head_id`),
  CONSTRAINT `fk_materials_budget_head` FOREIGN KEY (`budget_head_id`) REFERENCES `budget_heads` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=145 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text,
  `related_entity_type` varchar(50) DEFAULT NULL,
  `related_entity_id` int DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`,`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `panel_progress`
--

DROP TABLE IF EXISTS `panel_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `panel_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `panel_id` int NOT NULL,
  `progress_date` date NOT NULL,
  `progress_percentage` decimal(5,2) DEFAULT NULL,
  `status` enum('not_started','in_progress','completed') DEFAULT 'not_started',
  `work_stage` varchar(100) DEFAULT NULL,
  `remarks` text,
  `updated_by` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `panel_id` (`panel_id`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `panel_progress_ibfk_5` FOREIGN KEY (`panel_id`) REFERENCES `drawing_panels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `panel_progress_ibfk_6` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_allocations`
--

DROP TABLE IF EXISTS `payment_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_allocations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `financial_transaction_id` int NOT NULL,
  `purchase_order_id` int DEFAULT NULL,
  `work_order_id` int DEFAULT NULL,
  `expense_id` int DEFAULT NULL,
  `allocated_amount` decimal(15,2) NOT NULL,
  `tds_allocated` decimal(15,2) DEFAULT '0.00',
  `retention_allocated` decimal(15,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pa_ft` (`financial_transaction_id`),
  KEY `fk_pa_po` (`purchase_order_id`),
  KEY `fk_pa_wo` (`work_order_id`),
  KEY `fk_pa_exp` (`expense_id`),
  CONSTRAINT `fk_pa_exp` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`),
  CONSTRAINT `fk_pa_ft` FOREIGN KEY (`financial_transaction_id`) REFERENCES `financial_transactions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pa_po` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`),
  CONSTRAINT `fk_pa_wo` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `module` varchar(50) NOT NULL,
  `action` varchar(50) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `name_2` (`name`),
  UNIQUE KEY `name_3` (`name`),
  UNIQUE KEY `name_4` (`name`),
  UNIQUE KEY `name_5` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=519 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `po_terms_master`
--

DROP TABLE IF EXISTS `po_terms_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `po_terms_master` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `payment_terms` text,
  `delivery_terms` text,
  `quality_terms` text,
  `warranty_terms` text,
  `penalty_clause` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_boq_items`
--

DROP TABLE IF EXISTS `project_boq_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_boq_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `boq_id` int NOT NULL,
  `material_id` int NOT NULL,
  `work_item_type_id` int DEFAULT NULL,
  `building_id` int DEFAULT NULL,
  `floor_id` int DEFAULT NULL,
  `zone_id` int DEFAULT NULL,
  `quantity` decimal(15,2) NOT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `estimated_rate` decimal(15,2) DEFAULT '0.00',
  `estimated_amount` decimal(15,2) GENERATED ALWAYS AS ((`quantity` * `estimated_rate`)) STORED,
  `ordered_quantity` decimal(15,2) DEFAULT '0.00',
  `received_quantity` decimal(15,2) DEFAULT '0.00',
  `consumed_quantity` decimal(15,2) DEFAULT '0.00',
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `total_completed_work` decimal(15,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `boq_id` (`boq_id`),
  KEY `material_id` (`material_id`),
  KEY `work_item_type_id` (`work_item_type_id`),
  KEY `building_id` (`building_id`),
  KEY `floor_id` (`floor_id`),
  KEY `zone_id` (`zone_id`),
  CONSTRAINT `project_boq_items_ibfk_1` FOREIGN KEY (`boq_id`) REFERENCES `project_boqs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_boq_items_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`),
  CONSTRAINT `project_boq_items_ibfk_3` FOREIGN KEY (`work_item_type_id`) REFERENCES `work_item_types` (`id`),
  CONSTRAINT `project_boq_items_ibfk_4` FOREIGN KEY (`building_id`) REFERENCES `project_buildings` (`id`),
  CONSTRAINT `project_boq_items_ibfk_5` FOREIGN KEY (`floor_id`) REFERENCES `project_floors` (`id`),
  CONSTRAINT `project_boq_items_ibfk_6` FOREIGN KEY (`zone_id`) REFERENCES `project_zones` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_boqs`
--

DROP TABLE IF EXISTS `project_boqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_boqs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `version` int DEFAULT '1',
  `status` enum('draft','approved','revised','obsolete') DEFAULT 'draft',
  `total_estimated_amount` decimal(15,2) DEFAULT '0.00',
  `created_by` int NOT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `created_by` (`created_by`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `project_boqs_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `project_boqs_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `project_boqs_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_budgets`
--

DROP TABLE IF EXISTS `project_budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_budgets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `budget_head_id` int NOT NULL,
  `estimated_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `alert_threshold` decimal(5,2) DEFAULT '80.00',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_budgets_project_id_budget_head_id` (`project_id`,`budget_head_id`),
  KEY `budget_head_id` (`budget_head_id`),
  CONSTRAINT `project_budgets_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `project_budgets_ibfk_2` FOREIGN KEY (`budget_head_id`) REFERENCES `budget_heads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_buildings`
--

DROP TABLE IF EXISTS `project_buildings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_buildings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `building_code` varchar(50) DEFAULT NULL,
  `description` text,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `work_item_type_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_building_project` (`project_id`),
  KEY `project_buildings_work_item_type_id_foreign_idx` (`work_item_type_id`),
  CONSTRAINT `project_buildings_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `project_buildings_work_item_type_id_foreign_idx` FOREIGN KEY (`work_item_type_id`) REFERENCES `work_item_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_contacts`
--

DROP TABLE IF EXISTS `project_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_contacts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `contact_type` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `company_name` varchar(150) DEFAULT NULL,
  `labour_count` int DEFAULT NULL,
  `helper_count` int DEFAULT NULL,
  `operator_count` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `project_contacts_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_details`
--

DROP TABLE IF EXISTS `project_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `site_address` text,
  `site_area` decimal(10,2) DEFAULT NULL,
  `site_area_unit` enum('sqft','sqm','acre','hectare') DEFAULT 'sqft',
  `site_latitude` varchar(50) DEFAULT NULL,
  `site_longitude` varchar(50) DEFAULT NULL,
  `contract_value` decimal(15,2) DEFAULT NULL,
  `budget_amount` decimal(15,2) DEFAULT NULL,
  `payment_terms` text,
  `advance_percentage` decimal(5,2) DEFAULT NULL,
  `retention_percentage` decimal(5,2) DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `expected_end_date` datetime DEFAULT NULL,
  `actual_end_date` datetime DEFAULT NULL,
  `duration_days` int DEFAULT NULL,
  `completion_percentage` decimal(5,2) DEFAULT '0.00',
  `architect_name` varchar(200) DEFAULT NULL,
  `architect_contact` varchar(100) DEFAULT NULL,
  `consultant_name` varchar(200) DEFAULT NULL,
  `consultant_contact` varchar(100) DEFAULT NULL,
  `total_floors` int DEFAULT NULL,
  `basement_floors` int DEFAULT '0',
  `built_up_area` decimal(10,2) DEFAULT NULL,
  `carpet_area` decimal(10,2) DEFAULT NULL,
  `scope_of_work` text,
  `specifications` text,
  `special_requirements` text,
  `remarks` text,
  `cancellation_reason` text,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_id` (`project_id`),
  KEY `project_details_project_id` (`project_id`),
  KEY `project_details_start_date` (`start_date`),
  KEY `project_details_expected_end_date` (`expected_end_date`),
  CONSTRAINT `project_details_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_documents`
--

DROP TABLE IF EXISTS `project_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `document_type` enum('contract','drawing','boq','approval','certificate','quotation','work_order','other') NOT NULL,
  `document_name` varchar(200) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `description` text,
  `uploaded_by` int NOT NULL,
  `version` int DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `project_documents_project_id` (`project_id`),
  KEY `project_documents_document_type` (`document_type`),
  KEY `project_documents_is_active` (`is_active`),
  CONSTRAINT `project_documents_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `project_documents_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_floors`
--

DROP TABLE IF EXISTS `project_floors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_floors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `building_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `floor_number` int DEFAULT NULL,
  `floor_type` enum('basement','ground','parking','typical','terrace') DEFAULT 'typical',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_floor_building` (`building_id`),
  CONSTRAINT `fk_floor_building` FOREIGN KEY (`building_id`) REFERENCES `project_buildings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_milestones`
--

DROP TABLE IF EXISTS `project_milestones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_milestones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `milestone_name` varchar(200) NOT NULL,
  `milestone_type` enum('design','approval','mobilization','construction','inspection','completion','payment','other') NOT NULL,
  `planned_date` datetime DEFAULT NULL,
  `actual_date` datetime DEFAULT NULL,
  `status` enum('pending','in_progress','completed','delayed','cancelled') NOT NULL DEFAULT 'pending',
  `completion_percentage` decimal(5,2) DEFAULT '0.00',
  `description` text,
  `remarks` text,
  `created_by` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `project_milestones_project_id` (`project_id`),
  KEY `project_milestones_milestone_type` (`milestone_type`),
  KEY `project_milestones_status` (`status`),
  KEY `project_milestones_planned_date` (`planned_date`),
  CONSTRAINT `project_milestones_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `project_milestones_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_vendors`
--

DROP TABLE IF EXISTS `project_vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_vendors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `vendor_type` enum('steel_contractor','concrete_contractor','rig_vendor','crane_vendor','jcb_vendor') NOT NULL,
  `rate` decimal(15,2) DEFAULT NULL,
  `rate_unit` varchar(50) DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `status` enum('active','completed','terminated') DEFAULT 'active',
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `vendor_id` (`vendor_id`),
  CONSTRAINT `project_vendors_ibfk_5` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `project_vendors_ibfk_6` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_zones`
--

DROP TABLE IF EXISTS `project_zones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_zones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `floor_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `zone_type` enum('flat','office','shop','common_area','parking_slot','other') DEFAULT 'flat',
  `area_sqft` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `work_item_type_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_zone_floor` (`floor_id`),
  KEY `project_zones_work_item_type_id_foreign_idx` (`work_item_type_id`),
  CONSTRAINT `project_zones_ibfk_1` FOREIGN KEY (`floor_id`) REFERENCES `project_floors` (`id`),
  CONSTRAINT `project_zones_work_item_type_id_foreign_idx` FOREIGN KEY (`work_item_type_id`) REFERENCES `work_item_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_code` varchar(50) NOT NULL,
  `name` varchar(200) NOT NULL,
  `project_type` enum('residential','commercial','industrial','infrastructure','renovation','other') NOT NULL DEFAULT 'residential',
  `client_name` varchar(200) NOT NULL DEFAULT 'Unknown Client',
  `client_contact_person` varchar(100) DEFAULT NULL,
  `client_email` varchar(100) DEFAULT NULL,
  `client_phone` varchar(20) DEFAULT NULL,
  `client_address` text,
  `client_gst_number` varchar(15) DEFAULT NULL,
  `client_pan_number` varchar(10) DEFAULT NULL,
  `site_location` varchar(200) DEFAULT NULL,
  `site_address` text,
  `site_city` varchar(100) DEFAULT NULL,
  `site_state` varchar(100) DEFAULT NULL,
  `site_pincode` varchar(10) DEFAULT NULL,
  `site_area` decimal(10,2) DEFAULT NULL,
  `site_area_unit` enum('sqft','sqm','acre','hectare') DEFAULT 'sqft',
  `site_latitude` varchar(50) DEFAULT NULL,
  `site_longitude` varchar(50) DEFAULT NULL,
  `site_engineer_id` int DEFAULT NULL,
  `contract_value` decimal(15,2) DEFAULT NULL,
  `budget_amount` decimal(15,2) DEFAULT NULL,
  `payment_terms` text,
  `advance_percentage` decimal(5,2) DEFAULT NULL,
  `retention_percentage` decimal(5,2) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `expected_end_date` date DEFAULT NULL,
  `actual_end_date` date DEFAULT NULL,
  `duration_days` int DEFAULT NULL,
  `architect_name` varchar(200) DEFAULT NULL,
  `architect_contact` varchar(100) DEFAULT NULL,
  `consultant_name` varchar(200) DEFAULT NULL,
  `consultant_contact` varchar(100) DEFAULT NULL,
  `total_floors` int DEFAULT NULL,
  `basement_floors` int DEFAULT '0',
  `built_up_area` decimal(10,2) DEFAULT NULL,
  `carpet_area` decimal(10,2) DEFAULT NULL,
  `scope_of_work` text,
  `specifications` text,
  `special_requirements` text,
  `client_ho_address` text,
  `status` enum('lead','quotation','confirmed','design','mobilization','execution','completed','on_hold','cancelled') NOT NULL DEFAULT 'lead',
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `completion_percentage` decimal(5,2) DEFAULT '0.00',
  `contract_document_path` varchar(500) DEFAULT NULL,
  `drawing_folder_path` varchar(500) DEFAULT NULL,
  `boq_document_path` varchar(500) DEFAULT NULL,
  `remarks` text,
  `cancellation_reason` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` int NOT NULL,
  `company_id` int DEFAULT NULL,
  `client_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `client_gstin` varchar(20) DEFAULT NULL,
  `site_state_code` varchar(2) DEFAULT NULL,
  `rera_number` varchar(50) DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_code` (`project_code`),
  UNIQUE KEY `project_code_2` (`project_code`),
  UNIQUE KEY `project_code_3` (`project_code`),
  KEY `idx_projects_code` (`project_code`),
  KEY `idx_projects_status` (`status`),
  KEY `projects_project_code` (`project_code`),
  KEY `projects_status` (`status`),
  KEY `projects_company_id` (`company_id`),
  KEY `created_by` (`created_by`),
  KEY `fk_projects_client` (`client_id`),
  CONSTRAINT `fk_projects_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `projects_ibfk_5` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `projects_ibfk_6` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `purchase_order_items`
--

DROP TABLE IF EXISTS `purchase_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `po_id` int NOT NULL,
  `material_id` int DEFAULT NULL,
  `work_item_type_id` int DEFAULT NULL COMMENT 'Links to work_item_types master for material categorization',
  `description` text NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT '1.00',
  `unit` varchar(20) NOT NULL DEFAULT 'units',
  `unit_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `tax_percentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `boq_item_id` int DEFAULT NULL,
  `received_quantity` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `po_id` (`po_id`),
  KEY `material_id` (`material_id`),
  KEY `idx_po_items_work_type` (`work_item_type_id`),
  KEY `fk_poi_boq_item` (`boq_item_id`),
  CONSTRAINT `fk_poi_boq_item` FOREIGN KEY (`boq_item_id`) REFERENCES `project_boq_items` (`id`),
  CONSTRAINT `purchase_order_items_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_order_items_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `temp_number` varchar(50) NOT NULL,
  `po_number` varchar(50) DEFAULT NULL,
  `project_id` int NOT NULL,
  `warehouse_id` int DEFAULT NULL,
  `vendor_id` int NOT NULL,
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `gst_type` enum('intra_state','inter_state') DEFAULT NULL,
  `cgst_amount` decimal(15,2) DEFAULT '0.00',
  `sgst_amount` decimal(15,2) DEFAULT '0.00',
  `igst_amount` decimal(15,2) DEFAULT '0.00',
  `company_state_code` varchar(2) DEFAULT NULL,
  `vendor_state_code` varchar(2) DEFAULT NULL,
  `delivery_type` enum('direct_to_site','central_warehouse','mixed') DEFAULT 'central_warehouse',
  `status` enum('draft','pending_approval','approved','rejected') DEFAULT 'draft',
  `created_by` int NOT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `shipping_address` text,
  `payment_terms` text,
  `notes` text,
  `boq_id` int DEFAULT NULL,
  `annexure_id` int DEFAULT NULL,
  `billing_unit_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `temp_number` (`temp_number`),
  UNIQUE KEY `po_number` (`po_number`),
  KEY `project_id` (`project_id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `created_by` (`created_by`),
  KEY `approved_by` (`approved_by`),
  KEY `fk_po_boq` (`boq_id`),
  KEY `idx_po_annexure` (`annexure_id`),
  KEY `purchase_orders_billing_unit_id_foreign_idx` (`billing_unit_id`),
  CONSTRAINT `fk_po_boq` FOREIGN KEY (`boq_id`) REFERENCES `project_boqs` (`id`),
  CONSTRAINT `purchase_orders_billing_unit_id_foreign_idx` FOREIGN KEY (`billing_unit_id`) REFERENCES `company_branches` (`id`),
  CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `purchase_orders_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `purchase_orders_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `purchase_orders_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quotation_items`
--

DROP TABLE IF EXISTS `quotation_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotation_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quotation_id` int NOT NULL,
  `description` text,
  `quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `unit` varchar(20) NOT NULL,
  `rate` decimal(15,2) NOT NULL DEFAULT '0.00',
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime DEFAULT NULL,
  `item_type` varchar(50) NOT NULL DEFAULT 'material',
  `work_item_type_id` int DEFAULT NULL COMMENT 'Links to work_item_types master for consistent categorization',
  `reference_id` int DEFAULT NULL,
  `is_reference_only` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'If true, this item is Material Estimate for Reference only and is NOT included in quotation total',
  `parent_work_item_type_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_quotation_items_work_type` (`work_item_type_id`),
  KEY `quotation_id` (`quotation_id`),
  CONSTRAINT `quotation_items_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `quotation_items_ibfk_2` FOREIGN KEY (`work_item_type_id`) REFERENCES `work_item_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quotations`
--

DROP TABLE IF EXISTS `quotations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `version_number` int NOT NULL DEFAULT '1',
  `quotation_number` varchar(50) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `discount_percentage` decimal(5,2) DEFAULT NULL,
  `final_amount` decimal(15,2) NOT NULL,
  `payment_terms` text,
  `valid_until` datetime DEFAULT NULL,
  `status` enum('draft','sent','accepted','rejected','approved','accepted_by_party') DEFAULT 'draft',
  `pdf_url` varchar(500) DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `annexure_id` int DEFAULT NULL,
  `client_scope` text,
  `contractor_scope` text,
  `remarks` text,
  `project_id` int DEFAULT NULL,
  `terms_conditions` text,
  `gst_type` enum('intra_state','inter_state') DEFAULT NULL,
  `cgst_amount` decimal(15,2) DEFAULT '0.00',
  `sgst_amount` decimal(15,2) DEFAULT '0.00',
  `igst_amount` decimal(15,2) DEFAULT '0.00',
  `billing_unit_id` int DEFAULT NULL,
  `scope_matrix` json DEFAULT NULL,
  `quote_type` enum('with_material','labour_only') DEFAULT 'with_material',
  `material_scope` enum('full_supply','client_supply','partial') DEFAULT 'full_supply',
  PRIMARY KEY (`id`),
  UNIQUE KEY `quotation_number` (`quotation_number`),
  UNIQUE KEY `quotation_number_2` (`quotation_number`),
  UNIQUE KEY `quotation_number_3` (`quotation_number`),
  UNIQUE KEY `quotation_number_4` (`quotation_number`),
  KEY `idx_quotations_lead` (`lead_id`),
  KEY `created_by` (`created_by`),
  KEY `project_id` (`project_id`),
  KEY `quotations_billing_unit_id_foreign_idx` (`billing_unit_id`),
  KEY `fk_quotation_annexure` (`annexure_id`),
  CONSTRAINT `fk_quotation_annexure` FOREIGN KEY (`annexure_id`) REFERENCES `annexures` (`id`),
  CONSTRAINT `quotations_billing_unit_id_foreign_idx` FOREIGN KEY (`billing_unit_id`) REFERENCES `company_branches` (`id`),
  CONSTRAINT `quotations_ibfk_10` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `quotations_ibfk_7` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`),
  CONSTRAINT `quotations_ibfk_8` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `quotations_ibfk_9` FOREIGN KEY (`annexure_id`) REFERENCES `annexures` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text,
  `is_system_role` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `name_2` (`name`),
  UNIQUE KEY `name_3` (`name`),
  UNIQUE KEY `name_4` (`name`),
  UNIQUE KEY `name_5` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `states`
--

DROP TABLE IF EXISTS `states`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `states` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `state_code` varchar(2) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `state_code` (`state_code`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `store_transaction_items`
--

DROP TABLE IF EXISTS `store_transaction_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_transaction_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_id` int NOT NULL,
  `material_id` int DEFAULT NULL,
  `boq_item_id` int DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_price` decimal(15,2) DEFAULT NULL,
  `batch_number` varchar(50) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `wastage_quantity` decimal(10,2) DEFAULT '0.00',
  `work_item_type_id` int DEFAULT NULL,
  `ordered_quantity` decimal(10,2) DEFAULT '0.00',
  `accepted_quantity` decimal(10,2) DEFAULT '0.00',
  `rejected_quantity` decimal(10,2) DEFAULT '0.00',
  `excess_quantity` decimal(10,2) DEFAULT '0.00',
  `shortage_quantity` decimal(10,2) DEFAULT '0.00',
  `variance_type` enum('exact','excess','shortage','defective') DEFAULT 'exact',
  `rejection_reason` text,
  `item_status` varchar(50) DEFAULT 'Good',
  `po_item_id` int DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `work_done_quantity` decimal(15,2) DEFAULT '0.00',
  `issued_quantity` decimal(15,2) DEFAULT '0.00',
  `returned_quantity` decimal(15,2) DEFAULT '0.00',
  `drawing_panel_id` int DEFAULT NULL,
  `work_order_id` int DEFAULT NULL,
  `remarks` text,
  `log_progress` tinyint(1) NOT NULL DEFAULT '1',
  `quotation_item_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transaction_id` (`transaction_id`),
  KEY `material_id` (`material_id`),
  KEY `fk_sti_boq_item` (`boq_item_id`),
  KEY `fk_sti_work_item_type_id` (`work_item_type_id`),
  KEY `fk_sti_po_item` (`po_item_id`),
  KEY `fk_stit_drawing_panel` (`drawing_panel_id`),
  KEY `store_transaction_items_work_order_id_foreign_idx` (`work_order_id`),
  KEY `store_transaction_items_quotation_item_id_foreign_idx` (`quotation_item_id`),
  CONSTRAINT `fk_sti_boq_item` FOREIGN KEY (`boq_item_id`) REFERENCES `project_boq_items` (`id`),
  CONSTRAINT `fk_sti_po_item` FOREIGN KEY (`po_item_id`) REFERENCES `purchase_order_items` (`id`),
  CONSTRAINT `fk_sti_work_item_type_id` FOREIGN KEY (`work_item_type_id`) REFERENCES `work_item_types` (`id`),
  CONSTRAINT `fk_stit_drawing_panel` FOREIGN KEY (`drawing_panel_id`) REFERENCES `drawing_panels` (`id`),
  CONSTRAINT `store_transaction_items_ibfk_5` FOREIGN KEY (`transaction_id`) REFERENCES `store_transactions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `store_transaction_items_ibfk_6` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `store_transaction_items_quotation_item_id_foreign_idx` FOREIGN KEY (`quotation_item_id`) REFERENCES `quotation_items` (`id`),
  CONSTRAINT `store_transaction_items_work_order_id_foreign_idx` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `store_transactions`
--

DROP TABLE IF EXISTS `store_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_number` varchar(50) NOT NULL,
  `temp_number` varchar(50) DEFAULT NULL,
  `cgst_amount` decimal(15,2) DEFAULT '0.00',
  `sgst_amount` decimal(15,2) DEFAULT '0.00',
  `igst_amount` decimal(15,2) DEFAULT '0.00',
  `transaction_type` enum('GRN','STN','SRN','CONSUMPTION') NOT NULL,
  `source_type` enum('warehouse','project','vendor') DEFAULT 'warehouse',
  `destination_type` enum('warehouse','project','vendor') DEFAULT 'warehouse',
  `warehouse_id` int DEFAULT NULL,
  `from_project_id` int DEFAULT NULL,
  `to_warehouse_id` int DEFAULT NULL,
  `to_project_id` int DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `purchase_order_id` int DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `status` enum('draft','pending','approved','rejected') DEFAULT 'draft',
  `remarks` text,
  `created_by` int NOT NULL,
  `approved_by` int DEFAULT NULL,
  `truck_number` varchar(50) DEFAULT NULL,
  `driver_name` varchar(100) DEFAULT NULL,
  `driver_phone` varchar(20) DEFAULT NULL,
  `quality_check_status` enum('pending','passed','failed','partial') DEFAULT 'pending',
  `created_at` datetime DEFAULT NULL,
  `to_building_id` int DEFAULT NULL,
  `to_floor_id` int DEFAULT NULL,
  `to_zone_id` int DEFAULT NULL,
  `inspector_name` varchar(100) DEFAULT NULL,
  `inspection_date` date DEFAULT NULL,
  `challan_number` varchar(100) DEFAULT NULL,
  `supplier_invoice_number` varchar(100) DEFAULT NULL,
  `lorry_receipt_number` varchar(100) DEFAULT NULL,
  `eway_bill_number` varchar(100) DEFAULT NULL,
  `challan_image` varchar(255) DEFAULT NULL,
  `invoice_image` varchar(255) DEFAULT NULL,
  `goods_image` varchar(255) DEFAULT NULL,
  `receiver_image` varchar(255) DEFAULT NULL,
  `weather_condition` varchar(50) DEFAULT NULL,
  `work_hours` varchar(50) DEFAULT NULL,
  `progress_photos` json DEFAULT NULL,
  `temperature` decimal(5,2) DEFAULT NULL,
  `drawing_panel_id` int DEFAULT NULL,
  `actual_depth` decimal(10,2) DEFAULT NULL,
  `verticality_x` decimal(5,2) DEFAULT NULL,
  `verticality_y` decimal(5,2) DEFAULT NULL,
  `slurry_density` decimal(5,3) DEFAULT NULL,
  `slurry_viscosity` decimal(5,2) DEFAULT NULL,
  `slurry_sand_content` decimal(5,2) DEFAULT NULL,
  `cage_id_ref` varchar(100) DEFAULT NULL,
  `start_time` varchar(10) DEFAULT NULL,
  `end_time` varchar(10) DEFAULT NULL,
  `slump_flow` decimal(10,2) DEFAULT NULL,
  `tremie_pipe_count` int DEFAULT NULL,
  `theoretical_concrete_qty` decimal(10,2) DEFAULT NULL,
  `overbreak_percentage` decimal(10,2) DEFAULT NULL,
  `grabbing_start_time` varchar(10) DEFAULT NULL,
  `grabbing_end_time` varchar(10) DEFAULT NULL,
  `concrete_grade` varchar(50) DEFAULT NULL,
  `grabbing_depth` decimal(10,2) DEFAULT NULL,
  `grabbing_sqm` decimal(10,2) DEFAULT NULL,
  `concreting_depth` decimal(10,2) DEFAULT NULL,
  `concreting_sqm` decimal(10,2) DEFAULT NULL,
  `work_order_id` int DEFAULT NULL,
  `quotation_id` int DEFAULT NULL,
  `boq_id` int DEFAULT NULL,
  `manpower_data` json DEFAULT NULL,
  `machinery_data` json DEFAULT NULL,
  `rmc_logs` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_number` (`transaction_number`),
  UNIQUE KEY `transaction_number_2` (`transaction_number`),
  UNIQUE KEY `transaction_number_3` (`transaction_number`),
  KEY `idx_store_transactions_date` (`transaction_date`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `to_warehouse_id` (`to_warehouse_id`),
  KEY `project_id` (`project_id`),
  KEY `created_by` (`created_by`),
  KEY `approved_by` (`approved_by`),
  KEY `fk_stn_to_building` (`to_building_id`),
  KEY `fk_stn_to_floor` (`to_floor_id`),
  KEY `fk_stn_to_zone` (`to_zone_id`),
  KEY `idx_strans_work_order` (`work_order_id`),
  KEY `idx_strans_quotation` (`quotation_id`),
  KEY `idx_strans_boq` (`boq_id`),
  CONSTRAINT `fk_stn_to_building` FOREIGN KEY (`to_building_id`) REFERENCES `project_buildings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_stn_to_floor` FOREIGN KEY (`to_floor_id`) REFERENCES `project_floors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_stn_to_zone` FOREIGN KEY (`to_zone_id`) REFERENCES `project_zones` (`id`) ON DELETE SET NULL,
  CONSTRAINT `store_transactions_boq_id_foreign_idx` FOREIGN KEY (`boq_id`) REFERENCES `project_boqs` (`id`),
  CONSTRAINT `store_transactions_ibfk_11` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `store_transactions_ibfk_12` FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `store_transactions_ibfk_13` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `store_transactions_ibfk_14` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `store_transactions_ibfk_15` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `store_transactions_quotation_id_foreign_idx` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`),
  CONSTRAINT `store_transactions_work_order_id_foreign_idx` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `units` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `code` varchar(20) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `base_unit_id` int DEFAULT NULL,
  `conversion_factor` decimal(10,4) DEFAULT '1.0000',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `units_base_unit_id_foreign_idx` (`base_unit_id`),
  CONSTRAINT `units_base_unit_id_foreign_idx` FOREIGN KEY (`base_unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` int NOT NULL,
  `role_id` int NOT NULL,
  `assigned_at` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(50) NOT NULL,
  `username` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `company_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `location` varchar(100) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `username_2` (`username`),
  UNIQUE KEY `employee_id_2` (`employee_id`),
  UNIQUE KEY `username_3` (`username`),
  UNIQUE KEY `employee_id_3` (`employee_id`),
  UNIQUE KEY `username_4` (`username`),
  UNIQUE KEY `employee_id_4` (`employee_id`),
  UNIQUE KEY `employee_id_5` (`employee_id`),
  UNIQUE KEY `username_5` (`username`),
  UNIQUE KEY `username_6` (`username`),
  UNIQUE KEY `employee_id_6` (`employee_id`),
  UNIQUE KEY `username_7` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_employee_id` (`employee_id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vendor_contacts`
--

DROP TABLE IF EXISTS `vendor_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_contacts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `contact_name` varchar(255) NOT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `aadhar_number` varchar(12) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vendor_id` (`vendor_id`),
  CONSTRAINT `vendor_contacts_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vendor_types`
--

DROP TABLE IF EXISTS `vendor_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `name_2` (`name`),
  UNIQUE KEY `code_2` (`code`),
  UNIQUE KEY `name_3` (`name`),
  UNIQUE KEY `code_3` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vendors`
--

DROP TABLE IF EXISTS `vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `vendor_type` varchar(50) NOT NULL,
  `vendor_type_id` int DEFAULT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text,
  `state_code` varchar(2) DEFAULT NULL,
  `gst_number` varchar(50) DEFAULT NULL,
  `pan_number` varchar(50) DEFAULT NULL,
  `bank_details` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `account_number` varchar(50) DEFAULT NULL,
  `ifsc_code` varchar(20) DEFAULT NULL,
  `branch` varchar(100) DEFAULT NULL,
  `is_msme` tinyint(1) DEFAULT '0',
  `msme_number` varchar(100) DEFAULT NULL,
  `msme_category` varchar(50) DEFAULT NULL,
  `aadhaar_number` varchar(12) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_vendor_type` (`vendor_type_id`),
  CONSTRAINT `fk_vendor_type` FOREIGN KEY (`vendor_type_id`) REFERENCES `vendor_types` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `warehouse_access`
--

DROP TABLE IF EXISTS `warehouse_access`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouse_access` (
  `id` int NOT NULL AUTO_INCREMENT,
  `warehouse_id` int NOT NULL,
  `company_id` int NOT NULL,
  `can_view` tinyint(1) DEFAULT '1',
  `can_edit` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `warehouse_access_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `warehouse_access_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `warehouses`
--

DROP TABLE IF EXISTS `warehouses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `state_code` varchar(2) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `incharge_name` varchar(100) DEFAULT NULL,
  `incharge_phone` varchar(20) DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `is_common` tinyint(1) DEFAULT '0',
  `warehouse_manager_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `type` enum('central','site','regional','fabrication') DEFAULT 'central',
  `project_id` int DEFAULT NULL,
  `building_id` int DEFAULT NULL,
  `floor_id` int DEFAULT NULL,
  `gstin` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `code_2` (`code`),
  UNIQUE KEY `code_3` (`code`),
  KEY `company_id` (`company_id`),
  KEY `warehouse_manager_id` (`warehouse_manager_id`),
  KEY `fk_warehouse_building` (`building_id`),
  KEY `fk_warehouse_floor` (`floor_id`),
  CONSTRAINT `fk_warehouse_building` FOREIGN KEY (`building_id`) REFERENCES `project_buildings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_warehouse_floor` FOREIGN KEY (`floor_id`) REFERENCES `project_floors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `warehouses_ibfk_5` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `warehouses_ibfk_6` FOREIGN KEY (`warehouse_manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `work_item_types`
--

DROP TABLE IF EXISTS `work_item_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_item_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(512) DEFAULT NULL,
  `code` varchar(50) DEFAULT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `uom` varchar(20) DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_2` (`name`),
  KEY `work_item_types_parent_id_foreign_idx` (`parent_id`),
  CONSTRAINT `work_item_types_parent_id_foreign_idx` FOREIGN KEY (`parent_id`) REFERENCES `work_item_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `work_order_items`
--

DROP TABLE IF EXISTS `work_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `work_order_id` int NOT NULL,
  `item_type` varchar(100) NOT NULL,
  `parent_work_item_type_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `work_item_type_id` int DEFAULT NULL COMMENT 'Links to work_item_types master for consistent categorization',
  `category` enum('labour','material') DEFAULT 'labour',
  `description` varchar(200) DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(20) NOT NULL,
  `rate` decimal(15,2) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_work_order_items_work_type` (`work_item_type_id`),
  KEY `work_order_id` (`work_order_id`),
  KEY `fk_work_order_items_parent_type` (`parent_work_item_type_id`),
  CONSTRAINT `fk_work_order_items_parent_type` FOREIGN KEY (`parent_work_item_type_id`) REFERENCES `work_item_types` (`id`),
  CONSTRAINT `work_order_items_ibfk_1` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`),
  CONSTRAINT `work_order_items_ibfk_2` FOREIGN KEY (`work_item_type_id`) REFERENCES `work_item_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `work_orders`
--

DROP TABLE IF EXISTS `work_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `work_order_number` varchar(50) NOT NULL,
  `po_wo_document_url` varchar(500) DEFAULT NULL,
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `discount_percentage` decimal(5,2) DEFAULT NULL,
  `final_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `payment_terms` text,
  `status` enum('draft','approved','active','completed') DEFAULT 'draft',
  `created_at` datetime DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `client_scope` text,
  `contractor_scope` text,
  `terms_conditions` text,
  `remarks` text,
  `scope_matrix` json DEFAULT NULL,
  `quote_type` enum('with_material','labour_only') DEFAULT 'with_material',
  `quotation_id` int DEFAULT NULL,
  `boq_id` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `work_order_number` (`work_order_number`),
  UNIQUE KEY `work_order_number_2` (`work_order_number`),
  UNIQUE KEY `work_order_number_3` (`work_order_number`),
  KEY `idx_work_orders_project` (`project_id`),
  KEY `fk_work_orders_vendor` (`vendor_id`),
  KEY `work_orders_created_by_foreign_idx` (`created_by`),
  KEY `idx_wo_quotation` (`quotation_id`),
  KEY `idx_wo_boq` (`boq_id`),
  CONSTRAINT `fk_work_orders_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `work_orders_boq_id_foreign_idx` FOREIGN KEY (`boq_id`) REFERENCES `project_boqs` (`id`),
  CONSTRAINT `work_orders_created_by_foreign_idx` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `work_orders_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `work_orders_quotation_id_foreign_idx` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `work_template_items`
--

DROP TABLE IF EXISTS `work_template_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_template_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `template_id` int NOT NULL,
  `work_item_type_id` int NOT NULL,
  `item_type` enum('material','labour','contract') DEFAULT 'labour',
  `description` text,
  `unit` varchar(20) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `parent_work_item_type_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `template_id` (`template_id`),
  KEY `work_item_type_id` (`work_item_type_id`),
  CONSTRAINT `work_template_items_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `work_templates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `work_template_items_ibfk_2` FOREIGN KEY (`work_item_type_id`) REFERENCES `work_item_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `work_templates`
--

DROP TABLE IF EXISTS `work_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `primary_work_item_type_id` int DEFAULT NULL,
  `sub_work_item_type_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `fk_work_template_primary_type` (`primary_work_item_type_id`),
  KEY `fk_work_template_sub_type` (`sub_work_item_type_id`),
  CONSTRAINT `fk_work_template_primary_type` FOREIGN KEY (`primary_work_item_type_id`) REFERENCES `work_item_types` (`id`),
  CONSTRAINT `fk_work_template_sub_type` FOREIGN KEY (`sub_work_item_type_id`) REFERENCES `work_item_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `worker_categories`
--

DROP TABLE IF EXISTS `worker_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `worker_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-07 15:58:16
