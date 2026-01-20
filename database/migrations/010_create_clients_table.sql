-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_code VARCHAR(50) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  gstin VARCHAR(20),
  pan VARCHAR(10),
  payment_terms VARCHAR(200),
  credit_limit DECIMAL(15,2) DEFAULT 0,
  client_type ENUM('individual', 'company', 'government') DEFAULT 'company',
  status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_client_code (client_code),
  INDEX idx_company_name (company_name),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add client_id to leads table
ALTER TABLE leads 
ADD COLUMN client_id INT NULL AFTER project_id,
ADD CONSTRAINT fk_leads_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Add client_id to projects table  
ALTER TABLE projects
ADD COLUMN client_id INT NULL AFTER company_id,
ADD CONSTRAINT fk_projects_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
