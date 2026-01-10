# Next Session - Quick Start Guide

## 🚀 Start Here

### Step 1: Fix Backend Associations (15 min)

Open `backend/src/models/index.ts` and add:

```typescript
// Import new models
import ProjectDetails from './ProjectDetails'
import ProjectContact from './ProjectContact'
import ProjectDocument from './ProjectDocument'
import ProjectMilestone from './ProjectMilestone'

// Add associations (after existing ones)

// Project associations
Project.hasOne(ProjectDetails, { foreignKey: 'project_id', as: 'details' })
ProjectDetails.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })

Project.hasMany(ProjectContact, { foreignKey: 'project_id', as: 'contacts' })
ProjectContact.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })

Project.hasMany(ProjectDocument, { foreignKey: 'project_id', as: 'documents' })
ProjectDocument.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })

Project.hasMany(ProjectMilestone, { foreignKey: 'project_id', as: 'milestones' })
ProjectMilestone.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })

// Fix User-Role association (many-to-many)
User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id', as: 'roles' })
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id', as: 'users' })

// Export new models
export {
  // ... existing exports
  ProjectDetails,
  ProjectContact,
  ProjectDocument,
  ProjectMilestone,
}
```

**Then restart backend server!**

---

### Step 2: Create Database Migration (30 min)

Create `database/migrations/006_normalize_projects.sql`:

```sql
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
```

Run it:
```bash
cd D:\CRM\database\migrations
node run-normalize-projects.js
```

---

### Step 3: Add Sample Data (15 min)

Add to `backend/src/database/seed.ts`:

```typescript
// Sample materials
const materials = await Material.bulkCreate([
  { code: 'CEM-OPC-53', name: 'OPC 53 Grade Cement', category: 'Cement', unit: 'Bag', hsn_code: '25231000', gst_rate: 28, is_active: true },
  { code: 'STL-TMT-500', name: 'TMT Steel 500D', category: 'Steel', unit: 'KG', hsn_code: '72142000', gst_rate: 18, is_active: true },
  { code: 'SND-M-SAND', name: 'M-Sand', category: 'Sand', unit: 'Ton', hsn_code: '25051000', gst_rate: 5, is_active: true },
  { code: 'AGG-20MM', name: '20mm Aggregate', category: 'Aggregate', unit: 'Ton', hsn_code: '25171000', gst_rate: 5, is_active: true },
  { code: 'DSL-HSD', name: 'High Speed Diesel', category: 'Diesel', unit: 'Ltr', hsn_code: '27101900', gst_rate: 18, is_active: true },
])

// Sample project with details
const project = await Project.create({
  project_code: 'PRJ-2026-001',
  name: 'Mumbai Metro Station Foundation',
  project_type: 'infrastructure',
  site_location: 'Andheri East',
  site_city: 'Mumbai',
  site_state: 'Maharashtra',
  site_pincode: '400069',
  status: 'execution',
  priority: 'high',
  created_by: adminUser.id,
  company_id: vhptCompany.id,
  is_active: true,
})

await ProjectDetails.create({
  project_id: project.id,
  client_name: 'Mumbai Metro Rail Corporation',
  client_contact_person: 'Mr. Sharma',
  client_email: 'sharma@mmrc.gov.in',
  client_phone: '+91-9876543210',
  client_gst_number: '27AAAAA0000A1Z5',
  contract_value: 5000000,
  budget_amount: 4800000,
  start_date: new Date('2026-01-01'),
  expected_end_date: new Date('2026-06-30'),
  duration_days: 180,
  total_floors: 0,
  basement_floors: 3,
  scope_of_work: 'Diaphragm wall construction for metro station foundation',
})
```

---

### Step 4: Test Everything (10 min)

```bash
# Test Projects API
curl http://localhost:5000/api/projects

# Test Materials API
curl http://localhost:5000/api/materials

# Test Material Requisitions API
curl http://localhost:5000/api/material-requisitions
```

All should return 200 OK!

---

## 🎯 Session Goals

By end of next session:
- ✅ All APIs working
- ✅ Project module fully functional
- ✅ Material Requisition tested end-to-end
- ✅ RBAC re-enabled
- ✅ Sample data loaded

**Estimated Time**: 4-5 hours

---

## 📞 If Stuck

1. Check `docs/SESSION_SUMMARY_2026-01-10.md`
2. Check `docs/PROJECT_MODULE_DESIGN.md`
3. Review model files in `backend/src/models/`

**Good luck!** 🚀
