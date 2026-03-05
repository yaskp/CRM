ALTER TABLE work_templates
ADD COLUMN primary_work_item_type_id INT NULL,
ADD COLUMN sub_work_item_type_id INT NULL,
ADD CONSTRAINT fk_work_template_primary_type FOREIGN KEY (primary_work_item_type_id) REFERENCES work_item_types(id),
ADD CONSTRAINT fk_work_template_sub_type FOREIGN KEY (sub_work_item_type_id) REFERENCES work_item_types(id);
