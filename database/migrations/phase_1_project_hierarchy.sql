-- Phase 1: Project Hierarchy
-- Establish the physical structure sequence: Building -> Floor -> Zone

-- 1. Create project_buildings table
CREATE TABLE IF NOT EXISTS project_buildings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  building_code VARCHAR(50) NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_building_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 2. Create project_floors table
CREATE TABLE IF NOT EXISTS project_floors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  building_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  floor_number INT NULL,
  floor_type ENUM('basement', 'ground', 'parking', 'typical', 'terrace') DEFAULT 'typical',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_floor_building FOREIGN KEY (building_id) REFERENCES project_buildings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Create project_zones table
CREATE TABLE IF NOT EXISTS project_zones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  floor_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  zone_type ENUM('flat', 'office', 'shop', 'common_area', 'parking_slot', 'other') DEFAULT 'flat',
  area_sqft DECIMAL(10,2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_zone_floor FOREIGN KEY (floor_id) REFERENCES project_floors(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Update daily_progress_reports
ALTER TABLE daily_progress_reports ADD COLUMN building_id INT NULL AFTER project_id;
ALTER TABLE daily_progress_reports ADD COLUMN floor_id INT NULL AFTER building_id;
ALTER TABLE daily_progress_reports ADD COLUMN zone_id INT NULL AFTER floor_id;
ALTER TABLE daily_progress_reports ADD COLUMN work_completion_percentage DECIMAL(5,2) DEFAULT 0 AFTER zone_id;

-- 5. Add Constraints
ALTER TABLE daily_progress_reports ADD CONSTRAINT fk_dpr_building FOREIGN KEY (building_id) REFERENCES project_buildings(id) ON DELETE SET NULL;
ALTER TABLE daily_progress_reports ADD CONSTRAINT fk_dpr_floor FOREIGN KEY (floor_id) REFERENCES project_floors(id) ON DELETE SET NULL;
ALTER TABLE daily_progress_reports ADD CONSTRAINT fk_dpr_zone FOREIGN KEY (zone_id) REFERENCES project_zones(id) ON DELETE SET NULL;

-- 6. Update store_transactions
ALTER TABLE store_transactions ADD COLUMN to_building_id INT NULL;
ALTER TABLE store_transactions ADD COLUMN to_floor_id INT NULL;
ALTER TABLE store_transactions ADD COLUMN to_zone_id INT NULL;

ALTER TABLE store_transactions ADD CONSTRAINT fk_stn_to_building FOREIGN KEY (to_building_id) REFERENCES project_buildings(id) ON DELETE SET NULL;
ALTER TABLE store_transactions ADD CONSTRAINT fk_stn_to_floor FOREIGN KEY (to_floor_id) REFERENCES project_floors(id) ON DELETE SET NULL;
ALTER TABLE store_transactions ADD CONSTRAINT fk_stn_to_zone FOREIGN KEY (to_zone_id) REFERENCES project_zones(id) ON DELETE SET NULL;

-- 7. Update warehouses
ALTER TABLE warehouses ADD COLUMN building_id INT NULL;
ALTER TABLE warehouses ADD COLUMN floor_id INT NULL;

ALTER TABLE warehouses ADD CONSTRAINT fk_warehouse_building FOREIGN KEY (building_id) REFERENCES project_buildings(id) ON DELETE SET NULL;
ALTER TABLE warehouses ADD CONSTRAINT fk_warehouse_floor FOREIGN KEY (floor_id) REFERENCES project_floors(id) ON DELETE SET NULL;

-- 8. Indexes
CREATE INDEX idx_building_project ON project_buildings(project_id);
CREATE INDEX idx_floor_building ON project_floors(building_id);
CREATE INDEX idx_zone_floor ON project_zones(floor_id);
CREATE INDEX idx_dpr_location ON daily_progress_reports(building_id, floor_id, zone_id);
