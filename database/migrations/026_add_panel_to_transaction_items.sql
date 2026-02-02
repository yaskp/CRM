ALTER TABLE store_transaction_items ADD COLUMN drawing_panel_id INT NULL;
ALTER TABLE store_transaction_items ADD CONSTRAINT fk_stit_drawing_panel FOREIGN KEY (drawing_panel_id) REFERENCES drawing_panels(id);
