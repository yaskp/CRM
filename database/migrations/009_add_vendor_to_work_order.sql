ALTER TABLE work_orders
ADD COLUMN vendor_id INT NULL,
ADD CONSTRAINT fk_work_orders_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;
