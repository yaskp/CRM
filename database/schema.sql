-- Construction CRM Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS crm_construction;
USE crm_construction;

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  company_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT
);

-- Role Permissions (Many-to-Many)
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- User Roles (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  location VARCHAR(200),
  city VARCHAR(100),
  state VARCHAR(100),
  client_ho_address TEXT,
  status ENUM('lead', 'quotation', 'confirmed', 'design', 'mobilization', 'execution', 'completed', 'on_hold') DEFAULT 'lead',
  created_by INT NOT NULL,
  company_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Project Contacts table
CREATE TABLE IF NOT EXISTS project_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  contact_type ENUM('site', 'office', 'decision_maker', 'accounts') NOT NULL,
  name VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  designation VARCHAR(100),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  source VARCHAR(100),
  enquiry_date DATE,
  soil_report_url VARCHAR(500),
  layout_url VARCHAR(500),
  section_url VARCHAR(500),
  status ENUM('new', 'quoted', 'follow_up', 'converted', 'lost') DEFAULT 'new',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  version_number INT NOT NULL DEFAULT 1,
  quotation_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  discount_percentage DECIMAL(5,2),
  final_amount DECIMAL(15,2) NOT NULL,
  payment_terms TEXT,
  valid_until DATE,
  status ENUM('draft', 'sent', 'accepted', 'rejected') DEFAULT 'draft',
  pdf_url VARCHAR(500),
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Work Orders table
CREATE TABLE IF NOT EXISTS work_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  work_order_number VARCHAR(50) UNIQUE NOT NULL,
  po_wo_document_url VARCHAR(500),
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount_percentage DECIMAL(5,2),
  final_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  payment_terms VARCHAR(200),
  status ENUM('draft', 'approved', 'active', 'completed') DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Work Order Items table
CREATE TABLE IF NOT EXISTS work_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  work_order_id INT NOT NULL,
  item_type ENUM('guide_wall', 'grabbing', 'stop_end', 'rubber_stop', 'steel_fabrication', 'anchor', 'anchor_sleeve') NOT NULL,
  description VARCHAR(200),
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  rate DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  vendor_type ENUM('steel_contractor', 'concrete_contractor', 'rig_vendor', 'crane_vendor', 'jcb_vendor', 'other') NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  gst_number VARCHAR(50),
  pan_number VARCHAR(50),
  bank_details TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Project Vendors table
CREATE TABLE IF NOT EXISTS project_vendors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  vendor_id INT NOT NULL,
  vendor_type ENUM('steel_contractor', 'concrete_contractor', 'rig_vendor', 'crane_vendor', 'jcb_vendor') NOT NULL,
  rate DECIMAL(15,2),
  rate_unit VARCHAR(50),
  start_date DATE,
  end_date DATE,
  status ENUM('active', 'completed', 'terminated') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  material_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  unit VARCHAR(20) NOT NULL,
  hsn_code VARCHAR(50),
  gst_rate DECIMAL(5,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  address TEXT,
  company_id INT,
  is_common BOOLEAN DEFAULT FALSE,
  warehouse_manager_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (warehouse_manager_id) REFERENCES users(id)
);

-- Warehouse Access table
CREATE TABLE IF NOT EXISTS warehouse_access (
  id INT AUTO_INCREMENT PRIMARY KEY,
  warehouse_id INT NOT NULL,
  company_id INT NOT NULL,
  can_view BOOLEAN DEFAULT TRUE,
  can_edit BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  warehouse_id INT NOT NULL,
  material_id INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  reserved_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_stock_level DECIMAL(10,2),
  max_stock_level DECIMAL(10,2),
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_warehouse_material (warehouse_id, material_id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

-- Store Transactions table
CREATE TABLE IF NOT EXISTS store_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  transaction_type ENUM('GRN', 'STN', 'SRN', 'CONSUMPTION') NOT NULL,
  warehouse_id INT NOT NULL,
  to_warehouse_id INT,
  project_id INT,
  transaction_date DATE NOT NULL,
  status ENUM('draft', 'approved', 'rejected') DEFAULT 'draft',
  remarks TEXT,
  created_by INT NOT NULL,
  approved_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Store Transaction Items table
CREATE TABLE IF NOT EXISTS store_transaction_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id INT NOT NULL,
  material_id INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(15,2),
  batch_number VARCHAR(50),
  expiry_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES store_transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id)
);

-- Material Requisitions table
CREATE TABLE IF NOT EXISTS material_requisitions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requisition_number VARCHAR(50) UNIQUE NOT NULL,
  project_id INT NOT NULL,
  from_warehouse_id INT NOT NULL,
  requested_by INT NOT NULL,
  requested_date DATE NOT NULL,
  required_date DATE,
  status ENUM('pending', 'approved', 'partially_issued', 'issued', 'rejected') DEFAULT 'pending',
  approved_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Material Requisition Items table
CREATE TABLE IF NOT EXISTS material_requisition_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requisition_id INT NOT NULL,
  material_id INT NOT NULL,
  requested_quantity DECIMAL(10,2) NOT NULL,
  issued_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requisition_id) REFERENCES material_requisitions(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id)
);

-- Daily Progress Reports table
CREATE TABLE IF NOT EXISTS daily_progress_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  report_date DATE NOT NULL,
  site_location VARCHAR(200),
  panel_number VARCHAR(50),
  guide_wall_running_meter DECIMAL(10,2),
  steel_quantity_kg DECIMAL(10,2),
  concrete_quantity_cubic_meter DECIMAL(10,2),
  polymer_consumption_bags INT,
  diesel_consumption_liters DECIMAL(10,2),
  weather_conditions VARCHAR(100),
  remarks TEXT,
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_project_date_panel (project_id, report_date, panel_number),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Manpower Reports table
CREATE TABLE IF NOT EXISTS manpower_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dpr_id INT NOT NULL,
  worker_type ENUM('steel_worker', 'concrete_worker', 'department_worker', 'electrician', 'welder') NOT NULL,
  count INT NOT NULL,
  hajri ENUM('1', '1.5', '2') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dpr_id) REFERENCES daily_progress_reports(id) ON DELETE CASCADE
);

-- Bar Bending Schedules table
CREATE TABLE IF NOT EXISTS bar_bending_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  panel_number VARCHAR(50),
  schedule_number VARCHAR(50),
  drawing_reference VARCHAR(100),
  steel_quantity_kg DECIMAL(10,2),
  status ENUM('draft', 'approved', 'in_progress', 'completed') DEFAULT 'draft',
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipment_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  equipment_type ENUM('crane', 'jcb', 'rig', 'grabbing_rig', 'steel_bending_machine', 'steel_cutting_machine', 'water_tank', 'pump', 'other') NOT NULL,
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  registration_number VARCHAR(100),
  is_rental BOOLEAN DEFAULT FALSE,
  owner_vendor_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_vendor_id) REFERENCES vendors(id)
);

-- Equipment Rentals table
CREATE TABLE IF NOT EXISTS equipment_rentals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  equipment_id INT NOT NULL,
  vendor_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  rate_per_day DECIMAL(15,2),
  rate_per_sq_meter DECIMAL(15,2),
  total_days INT,
  total_amount DECIMAL(15,2),
  breakdown_deduction_amount DECIMAL(15,2) DEFAULT 0,
  net_amount DECIMAL(15,2),
  status ENUM('active', 'completed', 'terminated') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

-- Equipment Breakdowns table
CREATE TABLE IF NOT EXISTS equipment_breakdowns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rental_id INT NOT NULL,
  breakdown_date DATE NOT NULL,
  breakdown_time TIME,
  resolution_date DATE,
  resolution_time TIME,
  breakdown_hours DECIMAL(5,2),
  breakdown_reason TEXT,
  deduction_amount DECIMAL(15,2),
  reported_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rental_id) REFERENCES equipment_rentals(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_by) REFERENCES users(id)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expense_number VARCHAR(50) UNIQUE NOT NULL,
  project_id INT NOT NULL,
  expense_type ENUM('conveyance', 'loose_purchase', 'food', 'two_wheeler', 'other') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL,
  bill_url VARCHAR(500),
  selfie_url VARCHAR(500),
  input_method ENUM('auto', 'manual') DEFAULT 'manual',
  bill_type ENUM('kaccha_bill', 'pakka_bill', 'petrol_bill', 'ola_uber_screenshot', 'not_required'),
  status ENUM('draft', 'pending_approval_1', 'pending_approval_2', 'pending_approval_3', 'approved', 'rejected') DEFAULT 'draft',
  submitted_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (submitted_by) REFERENCES users(id)
);

-- Expense Approvals table
CREATE TABLE IF NOT EXISTS expense_approvals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expense_id INT NOT NULL,
  approval_level INT NOT NULL,
  approver_role VARCHAR(50) NOT NULL,
  approver_id INT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  comments TEXT,
  approved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- Drawings table
CREATE TABLE IF NOT EXISTS drawings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  drawing_number VARCHAR(50),
  drawing_name VARCHAR(200),
  drawing_type VARCHAR(100),
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  file_size BIGINT,
  uploaded_by INT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Drawing Panels table
CREATE TABLE IF NOT EXISTS drawing_panels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  drawing_id INT NOT NULL,
  panel_identifier VARCHAR(50) NOT NULL,
  coordinates_json JSON,
  panel_type VARCHAR(50),
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (drawing_id) REFERENCES drawings(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Panel Progress table
CREATE TABLE IF NOT EXISTS panel_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  panel_id INT NOT NULL,
  progress_date DATE NOT NULL,
  progress_percentage DECIMAL(5,2),
  status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
  work_stage VARCHAR(100),
  remarks TEXT,
  updated_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (panel_id) REFERENCES drawing_panels(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  related_entity_type VARCHAR(50),
  related_entity_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_projects_code ON projects(project_code);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_leads_project ON leads(project_id);
CREATE INDEX idx_quotations_lead ON quotations(lead_id);
CREATE INDEX idx_work_orders_project ON work_orders(project_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX idx_store_transactions_date ON store_transactions(transaction_date);
CREATE INDEX idx_dpr_project_date ON daily_progress_reports(project_id, report_date);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

