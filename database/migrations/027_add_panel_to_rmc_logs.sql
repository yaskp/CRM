ALTER TABLE dpr_rmc_logs ADD COLUMN drawing_panel_id INT NULL;
ALTER TABLE dpr_rmc_logs ADD CONSTRAINT fk_rmclog_drawing_panel FOREIGN KEY (drawing_panel_id) REFERENCES drawing_panels(id);
