-- Create project_details table
CREATE TABLE IF NOT EXISTS project_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL UNIQUE,
  
  -- Client info
  client_name VARCHAR(200) NOT NULL,
  client_contact_person VARCHAR(100),
  client_email VARCHAR(100),
  client_phone VARCHAR(20),
  client_address TEXT,
  client_gst_number VARCHAR(15),
  client_pan_number VARCHAR(10),
  
  -- Site details
  site_address TEXT,
  site_area DECIMAL(10, 2),
  site_area_unit ENUM('sqft', 'sqm', 'acre', 'hectare') DEFAULT 'sqft',
  site_latitude VARCHAR(50),
  site_longitude VARCHAR(50),
  
  -- Financial
  contract_value DECIMAL(15, 2),
  budget_amount DECIMAL(15, 2),
  payment_terms TEXT,
  advance_percentage DECIMAL(5, 2),
  retention_percentage DECIMAL(5, 2),
  
  -- Timeline
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  duration_days INT,
  completion_percentage DECIMAL(5, 2) DEFAULT 0,
  
  -- Design
  architect_name VARCHAR(200),
  architect_contact VARCHAR(100),
  consultant_name VARCHAR(200),
  consultant_contact VARCHAR(100),
  total_floors INT,
  basement_floors INT DEFAULT 0,
  built_up_area DECIMAL(10, 2),
  carpet_area DECIMAL(10, 2),
  
  -- Scope
  scope_of_work TEXT,
  specifications TEXT,
  special_requirements TEXT,
  remarks TEXT,
  cancellation_reason TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id),
  INDEX idx_client_name (client_name),
  INDEX idx_start_date (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create project_contacts table
CREATE TABLE IF NOT EXISTS project_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  contact_type ENUM('site', 'office', 'decision_maker', 'accounts', 'technical', 'other') NOT NULL,
  name VARCHAR(100) NOT NULL,
  designation VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id),
  INDEX idx_contact_type (contact_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create project_documents table
CREATE TABLE IF NOT EXISTS project_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  document_type ENUM('contract', 'drawing', 'boq', 'approval', 'certificate', 'quotation', 'work_order', 'other') NOT NULL,
  document_name VARCHAR(200) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  file_size BIGINT,
  description TEXT,
  uploaded_by INT NOT NULL,
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_project_id (project_id),
  INDEX idx_document_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create project_milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  milestone_name VARCHAR(200) NOT NULL,
  milestone_type ENUM('design', 'approval', 'mobilization', 'construction', 'inspection', 'completion', 'payment', 'other') NOT NULL,
  planned_date DATE,
  actual_date DATE,
  status ENUM('pending', 'in_progress', 'completed', 'delayed', 'cancelled') DEFAULT 'pending',
  completion_percentage DECIMAL(5, 2) DEFAULT 0,
  description TEXT,
  remarks TEXT,
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_project_id (project_id),
  INDEX idx_milestone_type (milestone_type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
