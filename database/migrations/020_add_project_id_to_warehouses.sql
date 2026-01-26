ALTER TABLE warehouses
ADD COLUMN project_id INT NULL REFERENCES projects(id);
