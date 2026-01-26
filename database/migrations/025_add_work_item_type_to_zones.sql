ALTER TABLE project_zones
ADD COLUMN work_item_type_id INT NULL,
ADD CONSTRAINT fk_project_zones_work_item_type
FOREIGN KEY (work_item_type_id) REFERENCES work_item_types(id) ON DELETE SET NULL;
