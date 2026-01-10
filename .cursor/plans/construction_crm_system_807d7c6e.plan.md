---
name: Construction CRM System - Detailed Implementation Plan
overview: Build a comprehensive construction CRM system with React frontend, Node.js backend, and MySQL database. Includes project management, material/warehouse management, DPR, expense reporting, work orders, flexible role-based permissions, and drawing progress tracking. Responsive design for mobile and web. Comparison with standard Indian CRMs included.
todos:
  - id: setup-project
    content: Initialize React frontend and Node.js backend projects with TypeScript, set up folder structure, install dependencies
    status: completed
  - id: setup-database
    content: Design and create MySQL database schema with all tables (users, roles, projects, materials, warehouses, etc.)
    status: completed
  - id: auth-system
    content: Implement JWT-based authentication with login, register, and token refresh endpoints
    status: completed
    dependencies:
      - setup-project
      - setup-database
  - id: rbac-system
    content: Build flexible role-based permission system with role assignment and permission checking middleware
    status: completed
    dependencies:
      - auth-system
  - id: project-module
    content: "Create project management module: project creation form, unique code generation, project listing, project details page"
    status: completed
    dependencies:
      - rbac-system
  - id: lead-quotation
    content: Implement lead and quotation management with multiple quotation versions per lead
    status: completed
    dependencies:
      - project-module
  - id: work-order
    content: Build work order creation with items (Guide wall, Grabbing, etc.), rate calculation, discount, payment terms
    status: completed
    dependencies:
      - project-module
  - id: vendor-management
    content: Create vendor management system with project-vendor assignments (Steel contractor, Concrete contractor, Rig/Crane/JCB vendors)
    status: completed
    dependencies:
      - project-module
  - id: material-warehouse
    content: Implement material master, warehouse management (Surat, Bangalore, Jaipur, Site), and warehouse access control
    status: completed
    dependencies:
      - rbac-system
  - id: store-transactions
    content: "Build store transaction system: GRN (Good Receipt Note), STN (Store Transfer Note), SRN (Store Requisition Note) following VHPT format"
    status: completed
    dependencies:
      - material-warehouse
  - id: material-requisition
    content: Create material requisition system with approval workflow and consumption tracking
    status: completed
    dependencies:
      - store-transactions
  - id: dpr-module
    content: Implement Daily Progress Report (DPR) with date, site, panel number, worker counts, material consumption, progress metrics
    status: completed
    dependencies:
      - project-module
      - material-warehouse
  - id: manpower-reporting
    content: Build manpower reporting system with Steel/Concrete/Department worker counts, Hajri options (1, 1.5, 2)
    status: completed
    dependencies:
      - dpr-module
  - id: equipment-management
    content: Create equipment rental tracking (Crane, JCB, Rig) with breakdown reporting and deduction calculations
    status: completed
    dependencies:
      - project-module
  - id: expense-module
    content: Build expense reporting system with categories (Conveyance, Loose purchase, Food, Two-wheeler, Other), bill upload, selfie capture
    status: completed
    dependencies:
      - rbac-system
  - id: approval-workflow
    content: Implement multi-level approval workflow for expenses (Store Manager → Operation Manager → Head/Accounts)
    status: completed
    dependencies:
      - expense-module
  - id: drawing-upload
    content: Create drawing upload functionality with file storage, drawing list, and basic viewing interface
    status: completed
    dependencies:
      - project-module
  - id: ui-responsive
    content: Ensure all pages are mobile-responsive with touch-friendly interfaces, responsive tables, and mobile-optimized forms
    status: completed
    dependencies:
      - project-module
      - dpr-module
      - expense-module
  - id: api-integration
    content: Connect all frontend components to backend APIs, handle errors, implement loading states
    status: completed
    dependencies:
      - ui-responsive
  - id: testing-polish
    content: Final testing, bug fixes, UI polish, and deployment preparation
    status: completed
    dependencies:
      - api-integration
---

# Construction CRM System - Detailed Implementation Plan

## Executive Summary

This plan outlines the development of a comprehensive Construction CRM system tailored for Indian construction companies, specifically designed for diaphragm wall construction projects. The system will handle the complete project lifecycle from lead generation to project completion, with specialized features for material management, warehouse operations, daily progress reporting, and expense management.**Timeline**: 10 days**Tech Stack**: React + Node.js + MySQL**Target**: Production-ready responsive web application---

## Architecture Overview

### Tech Stack Details

**Frontend:**

- React 18+ with TypeScript
- React Router v6 for navigation
- UI Framework: Ant Design (recommended for construction industry UI) or Material-UI
- State Management: React Context API + useReducer (or Zustand for complex state)
- Form Handling: React Hook Form + Zod validation
- File Upload: react-dropzone
- Charts: Recharts or Chart.js
- Date Handling: date-fns
- HTTP Client: Axios
- PWA Support: Workbox

**Backend:**

- Node.js 18+ with Express.js
- TypeScript for type safety
- ORM: Sequelize or TypeORM (Sequelize recommended for MySQL)
- Authentication: JWT (jsonwebtoken)
- File Upload: Multer
- Validation: Joi or express-validator
- Image Processing: Sharp (for drawing processing)
- PDF Generation: pdfkit or puppeteer
- Email: Nodemailer (for notifications)

**Database:**

- MySQL 8.0+
- Connection Pooling
- Transactions support
- Indexes for performance

**Infrastructure:**

- File Storage: Local filesystem (can migrate to AWS S3/Azure Blob later)
- Environment: dotenv for configuration
- Logging: Winston
- Error Handling: Custom error middleware

---

## Detailed Database Schema

### Core Tables with Field Details

#### 1. users

```sql
- id (INT, PK, AUTO_INCREMENT)
- employee_id (VARCHAR(50), UNIQUE)
- name (VARCHAR(100), NOT NULL)
- email (VARCHAR(100), UNIQUE, NOT NULL)
- phone (VARCHAR(20))
- password_hash (VARCHAR(255), NOT NULL)
- company_id (INT, FK to companies) -- For VHPT vs VHSHREE separation
- is_active (BOOLEAN, DEFAULT true)
- last_login (DATETIME)
- created_at (DATETIME)
- updated_at (DATETIME)
```



#### 2. companies

```sql
- id (INT, PK)
- name (VARCHAR(100)) -- VHPT, VHSHREE
- code (VARCHAR(20), UNIQUE)
- created_at (DATETIME)
```



#### 3. roles

```sql
- id (INT, PK)
- name (VARCHAR(50), UNIQUE) -- Site Engineer, Store Manager, etc.
- description (TEXT)
- is_system_role (BOOLEAN) -- Cannot be deleted
- created_at (DATETIME)
```



#### 4. permissions

```sql
- id (INT, PK)
- name (VARCHAR(100), UNIQUE) -- e.g., "projects.create", "expenses.approve"
- module (VARCHAR(50)) -- projects, materials, expenses, etc.
- action (VARCHAR(50)) -- create, read, update, delete, approve
- description (TEXT)
```



#### 5. role_permissions (Many-to-Many)

```sql
- role_id (INT, FK)
- permission_id (INT, FK)
- PRIMARY KEY (role_id, permission_id)
```



#### 6. user_roles (Many-to-Many)

```sql
- user_id (INT, FK)
- role_id (INT, FK)
- assigned_at (DATETIME)
- PRIMARY KEY (user_id, role_id)
```



#### 7. projects

```sql
- id (INT, PK)
- project_code (VARCHAR(50), UNIQUE) -- Auto-generated unique code
- name (VARCHAR(200), NOT NULL)
- location (VARCHAR(200))
- city (VARCHAR(100))
- state (VARCHAR(100))
- client_ho_address (TEXT)
- status (ENUM: 'lead', 'quotation', 'confirmed', 'design', 'mobilization', 'execution', 'completed', 'on_hold')
- created_by (INT, FK to users)
- company_id (INT, FK)
- created_at (DATETIME)
- updated_at (DATETIME)
```



#### 8. project_contacts

```sql
- id (INT, PK)
- project_id (INT, FK)
- contact_type (ENUM: 'site', 'office', 'decision_maker', 'accounts')
- name (VARCHAR(100))
- phone (VARCHAR(20))
- email (VARCHAR(100))
- designation (VARCHAR(100))
```



#### 9. leads

```sql
- id (INT, PK)
- project_id (INT, FK)
- source (VARCHAR(100))
- enquiry_date (DATE)
- soil_report_url (VARCHAR(500))
- layout_url (VARCHAR(500))
- section_url (VARCHAR(500))
- status (ENUM: 'new', 'quoted', 'follow_up', 'converted', 'lost')
- created_at (DATETIME)
```



#### 10. quotations

```sql
- id (INT, PK)
- lead_id (INT, FK)
- version_number (INT) -- Multiple versions per lead
- quotation_number (VARCHAR(50), UNIQUE)
- total_amount (DECIMAL(15,2))
- discount_percentage (DECIMAL(5,2))
- final_amount (DECIMAL(15,2))
- payment_terms (TEXT) -- e.g., "15 days"
- valid_until (DATE)
- status (ENUM: 'draft', 'sent', 'accepted', 'rejected')
- pdf_url (VARCHAR(500))
- created_by (INT, FK)
- created_at (DATETIME)
```



#### 11. work_orders

```sql
- id (INT, PK)
- project_id (INT, FK)
- work_order_number (VARCHAR(50), UNIQUE)
- po_wo_document_url (VARCHAR(500)) -- Uploaded PO/WO from client
- total_amount (DECIMAL(15,2))
- discount_percentage (DECIMAL(5,2))
- final_amount (DECIMAL(15,2))
- payment_terms (VARCHAR(200))
- status (ENUM: 'draft', 'approved', 'active', 'completed')
- created_at (DATETIME)
```



#### 12. work_order_items

```sql
- id (INT, PK)
- work_order_id (INT, FK)
- item_type (ENUM: 'guide_wall', 'grabbing', 'stop_end', 'rubber_stop', 'steel_fabrication', 'anchor', 'anchor_sleeve')
- description (VARCHAR(200))
- quantity (DECIMAL(10,2))
- unit (VARCHAR(20)) -- meter, sq_meter, kg, qty
- rate (DECIMAL(15,2))
- amount (DECIMAL(15,2)) -- Calculated: quantity * rate
- created_at (DATETIME)
```



#### 13. vendors

```sql
- id (INT, PK)
- name (VARCHAR(200), NOT NULL)
- vendor_type (ENUM: 'steel_contractor', 'concrete_contractor', 'rig_vendor', 'crane_vendor', 'jcb_vendor', 'other')
- contact_person (VARCHAR(100))
- phone (VARCHAR(20))
- email (VARCHAR(100))
- address (TEXT)
- gst_number (VARCHAR(50))
- pan_number (VARCHAR(50))
- bank_details (TEXT)
- is_active (BOOLEAN)
- created_at (DATETIME)
```



#### 14. project_vendors

```sql
- id (INT, PK)
- project_id (INT, FK)
- vendor_id (INT, FK)
- vendor_type (ENUM: 'steel_contractor', 'concrete_contractor', 'rig_vendor', 'crane_vendor', 'jcb_vendor')
- rate (DECIMAL(15,2)) -- Rate per kg, per cubic meter, per day, etc.
- rate_unit (VARCHAR(50)) -- per_kg, per_cubic_meter, per_day, per_sq_meter
- start_date (DATE)
- end_date (DATE)
- status (ENUM: 'active', 'completed', 'terminated')
- created_at (DATETIME)
```



#### 15. materials

```sql
- id (INT, PK)
- material_code (VARCHAR(50), UNIQUE)
- name (VARCHAR(200), NOT NULL)
- category (VARCHAR(100)) -- Polymer, Diesel, Cement, Steel, etc.
- unit (VARCHAR(20)) -- kg, liter, bag, meter, etc.
- hsn_code (VARCHAR(50))
- gst_rate (DECIMAL(5,2))
- is_active (BOOLEAN)
- created_at (DATETIME)
```



#### 16. warehouses

```sql
- id (INT, PK)
- name (VARCHAR(100)) -- Surat, Bangalore, Jaipur, Site
- code (VARCHAR(20), UNIQUE)
- address (TEXT)
- company_id (INT, FK) -- NULL for common warehouse
- is_common (BOOLEAN) -- Common between VHPT and VHSHREE
- warehouse_manager_id (INT, FK to users)
- created_at (DATETIME)
```



#### 17. warehouse_access

```sql
- id (INT, PK)
- warehouse_id (INT, FK)
- company_id (INT, FK)
- can_view (BOOLEAN)
- can_edit (BOOLEAN)
- created_at (DATETIME)
```



#### 18. inventory

```sql
- id (INT, PK)
- warehouse_id (INT, FK)
- material_id (INT, FK)
- quantity (DECIMAL(10,2))
- reserved_quantity (DECIMAL(10,2)) -- For pending requisitions
- min_stock_level (DECIMAL(10,2))
- max_stock_level (DECIMAL(10,2))
- last_updated (DATETIME)
- UNIQUE KEY (warehouse_id, material_id)
```



#### 19. store_transactions

```sql
- id (INT, PK)
- transaction_number (VARCHAR(50), UNIQUE) -- GRN-001, STN-001, SRN-001
- transaction_type (ENUM: 'GRN', 'STN', 'SRN', 'CONSUMPTION')
- warehouse_id (INT, FK)
- to_warehouse_id (INT, FK) -- For STN
- project_id (INT, FK) -- For SRN and consumption
- transaction_date (DATE)
- status (ENUM: 'draft', 'approved', 'rejected')
- remarks (TEXT)
- created_by (INT, FK)
- approved_by (INT, FK)
- created_at (DATETIME)
```



#### 20. store_transaction_items

```sql
- id (INT, PK)
- transaction_id (INT, FK)
- material_id (INT, FK)
- quantity (DECIMAL(10,2))
- unit_price (DECIMAL(15,2)) -- For GRN
- batch_number (VARCHAR(50))
- expiry_date (DATE) -- If applicable
- created_at (DATETIME)
```



#### 21. material_requisitions

```sql
- id (INT, PK)
- requisition_number (VARCHAR(50), UNIQUE)
- project_id (INT, FK)
- from_warehouse_id (INT, FK)
- requested_by (INT, FK)
- requested_date (DATE)
- required_date (DATE)
- status (ENUM: 'pending', 'approved', 'partially_issued', 'issued', 'rejected')
- approved_by (INT, FK)
- created_at (DATETIME)
```



#### 22. material_requisition_items

```sql
- id (INT, PK)
- requisition_id (INT, FK)
- material_id (INT, FK)
- requested_quantity (DECIMAL(10,2))
- issued_quantity (DECIMAL(10,2))
- unit (VARCHAR(20))
- created_at (DATETIME)
```



#### 23. daily_progress_reports

```sql
- id (INT, PK)
- project_id (INT, FK)
- report_date (DATE)
- site_location (VARCHAR(200))
- panel_number (VARCHAR(50))
- guide_wall_running_meter (DECIMAL(10,2))
- steel_quantity_kg (DECIMAL(10,2))
- concrete_quantity_cubic_meter (DECIMAL(10,2))
- polymer_consumption_bags (INT)
- diesel_consumption_liters (DECIMAL(10,2))
- weather_conditions (VARCHAR(100))
- remarks (TEXT)
- created_by (INT, FK)
- created_at (DATETIME)
- UNIQUE KEY (project_id, report_date, panel_number)
```



#### 24. manpower_reports

```sql
- id (INT, PK)
- dpr_id (INT, FK)
- worker_type (ENUM: 'steel_worker', 'concrete_worker', 'department_worker', 'electrician', 'welder')
- count (INT)
- hajri (ENUM: '1', '1.5', '2')) -- Full day, 1.5 day, 2 days
- created_at (DATETIME)
```



#### 25. bar_bending_schedules

```sql
- id (INT, PK)
- project_id (INT, FK)
- panel_number (VARCHAR(50))
- schedule_number (VARCHAR(50))
- drawing_reference (VARCHAR(100))
- steel_quantity_kg (DECIMAL(10,2))
- status (ENUM: 'draft', 'approved', 'in_progress', 'completed')
- created_by (INT, FK)
- created_at (DATETIME)
```



#### 26. equipment

```sql
- id (INT, PK)
- equipment_code (VARCHAR(50), UNIQUE)
- name (VARCHAR(200)) -- Crane, JCB, Rig, Grabbing Rig, etc.
- equipment_type (ENUM: 'crane', 'jcb', 'rig', 'grabbing_rig', 'steel_bending_machine', 'steel_cutting_machine', 'water_tank', 'pump', 'other')
- manufacturer (VARCHAR(100))
- model (VARCHAR(100))
- registration_number (VARCHAR(100))
- is_rental (BOOLEAN)
- owner_vendor_id (INT, FK) -- If rental
- created_at (DATETIME)
```



#### 27. equipment_rentals

```sql
- id (INT, PK)
- project_id (INT, FK)
- equipment_id (INT, FK)
- vendor_id (INT, FK)
- start_date (DATE)
- end_date (DATE)
- rate_per_day (DECIMAL(15,2))
- rate_per_sq_meter (DECIMAL(15,2)) -- For rig
- total_days (INT)
- total_amount (DECIMAL(15,2))
- breakdown_deduction_amount (DECIMAL(15,2))
- net_amount (DECIMAL(15,2))
- status (ENUM: 'active', 'completed', 'terminated')
- created_at (DATETIME)
```



#### 28. equipment_breakdowns

```sql
- id (INT, PK)
- rental_id (INT, FK)
- breakdown_date (DATE)
- breakdown_time (TIME)
- resolution_date (DATE)
- resolution_time (TIME)
- breakdown_hours (DECIMAL(5,2))
- breakdown_reason (TEXT)
- deduction_amount (DECIMAL(15,2))
- reported_by (INT, FK)
- created_at (DATETIME)
```



#### 29. expenses

```sql
- id (INT, PK)
- expense_number (VARCHAR(50), UNIQUE)
- project_id (INT, FK)
- expense_type (ENUM: 'conveyance', 'loose_purchase', 'food', 'two_wheeler', 'other')
- amount (DECIMAL(15,2))
- description (TEXT)
- expense_date (DATE)
- bill_url (VARCHAR(500)) -- Uploaded bill
- selfie_url (VARCHAR(500)) -- Selfie at submission
- input_method (ENUM: 'auto', 'manual') -- Auto for Ola/Uber
- bill_type (ENUM: 'kaccha_bill', 'pakka_bill', 'petrol_bill', 'ola_uber_screenshot', 'not_required')
- status (ENUM: 'draft', 'pending_approval_1', 'pending_approval_2', 'pending_approval_3', 'approved', 'rejected')
- submitted_by (INT, FK)
- created_at (DATETIME)
```



#### 30. expense_approvals

```sql
- id (INT, PK)
- expense_id (INT, FK)
- approval_level (INT) -- 1, 2, or 3
- approver_role (VARCHAR(50)) -- store_manager, operation_manager, head_accounts
- approver_id (INT, FK)
- status (ENUM: 'pending', 'approved', 'rejected')
- comments (TEXT)
- approved_at (DATETIME)
- created_at (DATETIME)
```



#### 31. drawings

```sql
- id (INT, PK)
- project_id (INT, FK)
- drawing_number (VARCHAR(50))
- drawing_name (VARCHAR(200))
- drawing_type (VARCHAR(100)) -- Layout, Section, Design, etc.
- file_url (VARCHAR(500))
- file_type (VARCHAR(50)) -- pdf, dwg, jpg, png
- file_size (BIGINT)
- uploaded_by (INT, FK)
- uploaded_at (DATETIME)
- version (INT, DEFAULT 1)
- is_active (BOOLEAN)
```



#### 32. drawing_panels

```sql
- id (INT, PK)
- drawing_id (INT, FK)
- panel_identifier (VARCHAR(50)) -- User-defined panel name/number
- coordinates_json (JSON) -- Store polygon/rectangle coordinates
- panel_type (VARCHAR(50)) -- wall_panel, section, etc.
- created_by (INT, FK)
- created_at (DATETIME)
```



#### 33. panel_progress

```sql
- id (INT, PK)
- panel_id (INT, FK)
- progress_date (DATE)
- progress_percentage (DECIMAL(5,2)) -- 0 to 100
- status (ENUM: 'not_started', 'in_progress', 'completed')
- work_stage (VARCHAR(100)) -- guide_wall, grabbing, concreting, anchoring, etc.
- remarks (TEXT)
- updated_by (INT, FK)
- created_at (DATETIME)
- updated_at (DATETIME)
```



#### 34. notifications

```sql
- id (INT, PK)
- user_id (INT, FK)
- type (VARCHAR(50)) -- expense_approval, material_requisition, etc.
- title (VARCHAR(200))
- message (TEXT)
- related_entity_type (VARCHAR(50)) -- expense, requisition, etc.
- related_entity_id (INT)
- is_read (BOOLEAN, DEFAULT false)
- created_at (DATETIME)
```

---

## Detailed Module Implementation

### Phase 1: Foundation (Days 1-2)

#### Day 1: Project Setup & Database

**Morning:**

1. Initialize Git repository
2. Create project structure:
   ```javascript
            crm-system/
            ├── frontend/
            │   ├── package.json
            │   ├── tsconfig.json
            │   ├── vite.config.ts (or create-react-app)
            │   └── src/
            ├── backend/
            │   ├── package.json
            │   ├── tsconfig.json
            │   └── src/
            └── database/
                └── migrations/
   ```




3. Install frontend dependencies:

- React, React DOM, React Router
- TypeScript
- Ant Design (or Material-UI)
- Axios
- React Hook Form, Zod
- date-fns
- Recharts

**Afternoon:**

4. Install backend dependencies:

- Express, TypeScript
- Sequelize (or TypeORM)
- mysql2
- jsonwebtoken, bcrypt
- Multer
- Joi/express-validator
- dotenv
- Winston

5. Set up MySQL database
6. Create database connection configuration
7. Set up Sequelize models structure

#### Day 2: Authentication & RBAC

**Morning:**

1. Create users, roles, permissions tables
2. Implement user registration endpoint
3. Implement login endpoint with JWT
4. Create JWT middleware for route protection
5. Implement password hashing with bcrypt

**Afternoon:**

6. Build flexible RBAC system:

- Permission checking middleware
- Role assignment functionality
- Permission-based route guards

7. Create default roles and permissions seed data
8. Implement user profile endpoints
9. Set up frontend authentication context
10. Create login/register pages

---

### Phase 2: Core Project Management (Days 3-4)

#### Day 3: Project & Lead Management

**Morning:**

1. Create projects table and model
2. Implement project creation API:

- Unique project code generation (e.g., PRJ-2024-001)
- Project form validation
- Location and client details storage

3. Create project listing API with filters
4. Create project details API

**Afternoon:**

5. Implement lead management:

- Lead creation with enquiry documents
- Lead status tracking
- Lead to project conversion

6. Create frontend project creation form (multi-step)
7. Create project listing page with search/filter
8. Create project details page

#### Day 4: Quotation & Work Order

**Morning:**

1. Implement quotation management:

- Multiple quotation versions per lead
- Quotation PDF generation
- Quotation status tracking

2. Create quotation listing and details pages
3. Implement work order creation:

- Work order items with calculations
- Discount and payment terms
- PO/WO document upload

**Afternoon:**

4. Create work order items management
5. Implement vendor assignment to projects
6. Create vendor management module
7. Build work order listing and details pages
8. Implement project status workflow

---

### Phase 3: Material & Warehouse Management (Days 5-6)

#### Day 5: Material Master & Warehouse Setup

**Morning:**

1. Create materials master table
2. Implement material CRUD operations
3. Create warehouse management:

- Warehouse creation (Surat, Bangalore, Jaipur, Site)
- Company-specific warehouse access
- Common warehouse setup

4. Implement warehouse access control logic

**Afternoon:**

5. Create inventory tracking system
6. Implement material master frontend
7. Create warehouse management UI
8. Build inventory dashboard

#### Day 6: Store Transactions

**Morning:**

1. Implement GRN (Good Receipt Note):

- GRN number generation
- Material receipt entry
- Inventory update on GRN approval

2. Implement STN (Store Transfer Note):

- Inter-warehouse transfers
- Inventory updates for both warehouses

3. Implement SRN (Store Requisition Note):

- Material requisition from warehouse
- Approval workflow

**Afternoon:**

4. Implement consumption tracking
5. Create store transaction listing pages
6. Build GRN/STN/SRN forms
7. Implement transaction approval workflow
8. Create material requisition module

---

### Phase 4: Operations & Reporting (Days 7-8)

#### Day 7: DPR & Manpower Reporting

**Morning:**

1. Implement Daily Progress Report (DPR):

- DPR creation with date, site, panel
- Material consumption entry
- Progress metrics (guide wall, etc.)

2. Create DPR listing and details pages
3. Implement manpower reporting:

- Worker type and count
- Hajri system (1, 1.5, 2)
- Link to DPR

**Afternoon:**

4. Create bar bending schedule module
5. Implement material in/out reporting
6. Build DPR dashboard with charts
7. Create manpower report forms

#### Day 8: Equipment Management

**Morning:**

1. Implement equipment master
2. Create equipment rental tracking:

- Rental start/end dates
- Rate calculation (per day, per sq meter)
- Rental amount calculation

3. Implement breakdown reporting:

- Breakdown entry
- Hours calculation
- Deduction amount calculation
- Net amount after deductions

**Afternoon:**

4. Create equipment management UI
5. Build rental tracking dashboard
6. Implement breakdown reporting forms
7. Create equipment utilization reports

---

### Phase 5: Expense & Approval Workflow (Day 9)

#### Day 9: Expense Management

**Morning:**

1. Implement expense creation:

- Expense categories
- Bill upload (kaccha/pakka/petrol)
- Selfie capture
- Auto-detection for Ola/Uber

2. Create expense listing and details
3. Implement multi-level approval workflow:

- Level 1: Store Manager
- Level 2: Operation Manager
- Level 3: Head/Accounts

4. Create approval notification system

**Afternoon:**

5. Build expense submission form (mobile-optimized)
6. Create approval dashboard for managers
7. Implement expense status tracking
8. Create expense reports and analytics
9. Test approval workflow end-to-end

---

### Phase 6: Drawing Management & Polish (Day 10)

#### Day 10: Drawing Upload & Final Polish

**Morning:**

1. Implement drawing upload:

- File upload handling (PDF, DWG, images)
- Drawing metadata storage
- Drawing versioning

2. Create drawing listing page
3. Implement basic drawing viewer
4. Set up panel marking infrastructure (basic)

**Afternoon:**

5. Final UI/UX polish:

- Responsive design testing
- Mobile optimization
- Loading states
- Error handling

6. Integration testing
7. Bug fixes
8. Performance optimization
9. Documentation preparation

---

## Detailed API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Projects (`/api/projects`)

- `GET /api/projects` - List all projects (with filters)
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/contacts` - Get project contacts
- `POST /api/projects/:id/contacts` - Add project contact
- `PUT /api/projects/:id/status` - Update project status

### Leads (`/api/leads`)

- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `GET /api/leads/:id` - Get lead details
- `PUT /api/leads/:id` - Update lead
- `POST /api/leads/:id/convert` - Convert lead to project

### Quotations (`/api/quotations`)

- `GET /api/quotations` - List quotations
- `POST /api/quotations` - Create quotation
- `GET /api/quotations/:id` - Get quotation details
- `PUT /api/quotations/:id` - Update quotation
- `POST /api/quotations/:id/generate-pdf` - Generate PDF
- `GET /api/quotations/lead/:leadId` - Get quotations for a lead

### Work Orders (`/api/work-orders`)

- `GET /api/work-orders` - List work orders
- `POST /api/work-orders` - Create work order
- `GET /api/work-orders/:id` - Get work order details
- `PUT /api/work-orders/:id` - Update work order
- `GET /api/work-orders/:id/items` - Get work order items
- `POST /api/work-orders/:id/items` - Add work order item
- `PUT /api/work-orders/:id/items/:itemId` - Update item
- `DELETE /api/work-orders/:id/items/:itemId` - Delete item

### Materials (`/api/materials`)

- `GET /api/materials` - List materials
- `POST /api/materials` - Create material
- `GET /api/materials/:id` - Get material details
- `PUT /api/materials/:id` - Update material
- `DELETE /api/materials/:id` - Delete material

### Warehouses (`/api/warehouses`)

- `GET /api/warehouses` - List warehouses (filtered by company)
- `POST /api/warehouses` - Create warehouse
- `GET /api/warehouses/:id` - Get warehouse details
- `GET /api/warehouses/:id/inventory` - Get warehouse inventory
- `POST /api/warehouses/:id/access` - Grant warehouse access

### Store Transactions (`/api/store`)

- `GET /api/store/transactions` - List transactions
- `POST /api/store/grn` - Create GRN
- `POST /api/store/stn` - Create STN
- `POST /api/store/srn` - Create SRN
- `GET /api/store/transactions/:id` - Get transaction details
- `PUT /api/store/transactions/:id/approve` - Approve transaction
- `PUT /api/store/transactions/:id/reject` - Reject transaction

### Material Requisitions (`/api/requisitions`)

- `GET /api/requisitions` - List requisitions
- `POST /api/requisitions` - Create requisition
- `GET /api/requisitions/:id` - Get requisition details
- `PUT /api/requisitions/:id/approve` - Approve requisition
- `PUT /api/requisitions/:id/issue` - Issue materials

### DPR (`/api/reports/dpr`)

- `GET /api/reports/dpr` - List DPRs
- `POST /api/reports/dpr` - Create DPR
- `GET /api/reports/dpr/:id` - Get DPR details
- `PUT /api/reports/dpr/:id` - Update DPR
- `GET /api/reports/dpr/project/:projectId` - Get DPRs for project

### Manpower (`/api/reports/manpower`)

- `POST /api/reports/manpower` - Create manpower report
- `GET /api/reports/manpower/dpr/:dprId` - Get manpower for DPR

### Equipment (`/api/equipment`)

- `GET /api/equipment` - List equipment
- `POST /api/equipment` - Create equipment
- `GET /api/equipment/:id` - Get equipment details
- `POST /api/equipment/rentals` - Create rental
- `GET /api/equipment/rentals` - List rentals
- `POST /api/equipment/breakdowns` - Report breakdown
- `GET /api/equipment/rentals/:id/breakdowns` - Get breakdowns for rental

### Expenses (`/api/expenses`)

- `GET /api/expenses` - List expenses (filtered by user/role)
- `POST /api/expenses` - Create expense
- `GET /api/expenses/:id` - Get expense details
- `PUT /api/expenses/:id/approve` - Approve expense (by level)
- `PUT /api/expenses/:id/reject` - Reject expense
- `GET /api/expenses/pending-approvals` - Get pending approvals for approver

### Drawings (`/api/drawings`)

- `GET /api/drawings` - List drawings
- `POST /api/drawings` - Upload drawing
- `GET /api/drawings/:id` - Get drawing details
- `GET /api/drawings/:id/file` - Download drawing file
- `POST /api/drawings/:id/panels` - Mark panel on drawing
- `GET /api/drawings/:id/panels` - Get panels for drawing
- `PUT /api/drawings/panels/:panelId/progress` - Update panel progress

### Vendors (`/api/vendors`)

- `GET /api/vendors` - List vendors
- `POST /api/vendors` - Create vendor
- `GET /api/vendors/:id` - Get vendor details
- `PUT /api/vendors/:id` - Update vendor
- `POST /api/vendors/:id/assign-project` - Assign vendor to project

### Notifications (`/api/notifications`)

- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `GET /api/notifications/unread-count` - Get unread count

---

## Comparison with Standard Indian Construction CRMs

### Market Leaders Analysis

#### 1. Zoho CRM (General CRM, Customized for Construction)

**Pricing**: ₹1,300 - ₹3,200/user/month**Features:**

- ✅ Lead management with pipelines
- ✅ Quotation management
- ✅ Custom dashboards
- ✅ Inventory management (basic)
- ✅ Mobile app
- ✅ Email integration
- ✅ Sales automation
- ❌ Construction-specific workflows (limited)
- ❌ DPR tracking (not available)
- ❌ Material requisition workflow (not available)
- ❌ Equipment rental tracking (not available)
- ❌ Drawing progress tracking (not available)
- ❌ Multi-warehouse management (limited)
- ❌ Expense approval workflow (basic)

**Our Advantage:**

- Construction-specific features (DPR, equipment tracking, drawing progress)
- Custom workflows matching exact business process
- Multi-warehouse with company separation
- Detailed material and equipment management

#### 2. Procore (Construction-focused)

**Pricing**: $12,000 - $36,000+ annually (custom pricing)**Features:**

- ✅ Project management
- ✅ Document management
- ✅ Quality and safety compliance
- ✅ Financial management
- ✅ Preconstruction management
- ✅ Bid management
- ✅ Drawing management (basic)
- ❌ Lead management (limited)
- ❌ Quotation management (not primary focus)
- ❌ Material requisition workflow (different approach)
- ❌ Expense approval workflow (different structure)
- ❌ Drawing progress tracking on drawings (not available)
- ❌ Equipment rental tracking with breakdowns (limited)
- ❌ Indian construction-specific features (Hajri, etc.)

**Our Advantage:**

- Lower cost (one-time development vs. annual subscription)
- Tailored to Indian construction practices
- Custom workflows matching exact requirements
- Drawing progress tracking feature
- Equipment breakdown deduction calculations

#### 3. Buildertrend (Construction Management)

**Pricing**: $99 - $399/month (base pricing)**Features:**

- ✅ Project scheduling
- ✅ Document management
- ✅ Change orders
- ✅ Customer portal
- ✅ Financial management
- ✅ To-do lists
- ❌ Lead management (limited)
- ❌ Quotation management (not primary)
- ❌ Material warehouse management (limited)
- ❌ DPR tracking (not available)
- ❌ Equipment rental tracking (not available)
- ❌ Drawing progress tracking (not available)
- ❌ Multi-warehouse with company separation (not available)

**Our Advantage:**

- Complete lead-to-completion workflow
- Material and warehouse management
- DPR and manpower reporting
- Equipment rental with breakdown tracking
- Drawing progress visualization

#### 4. Makanify (Real Estate CRM - India)

**Pricing**: Affordable per user/month**Features:**

- ✅ Lead capture from portals
- ✅ Project and unit tracking
- ✅ Payment tracking
- ✅ Document automation
- ✅ Communication tools
- ❌ Construction project management (not focus)
- ❌ Material management (not available)
- ❌ Warehouse management (not available)
- ❌ DPR tracking (not available)
- ❌ Equipment management (not available)
- ❌ Drawing management (not available)

**Our Advantage:**

- Construction-specific features
- Material and equipment management
- Warehouse operations
- DPR and progress tracking

#### 5. Sell.Do (Real Estate CRM - India)

**Pricing**: Custom pricing**Features:**

- ✅ Marketing automation
- ✅ Inventory management (real estate units)
- ✅ Customer segmentation
- ✅ Sales performance tracking
- ✅ Lead management
- ❌ Construction workflows (not focus)
- ❌ Material management (not available)
- ❌ Warehouse operations (not available)
- ❌ DPR tracking (not available)
- ❌ Equipment tracking (not available)

**Our Advantage:**

- Construction project lifecycle management
- Material and warehouse operations
- Equipment rental and breakdown tracking
- DPR and manpower reporting

---

## Feature Comparison Matrix

| Feature | Our CRM | Zoho CRM | Procore | Buildertrend | Makanify | Sell.Do ||---------|---------|----------|---------|--------------|----------|---------|| **Lead Management** | ✅ | ✅ | ⚠️ Limited | ⚠️ Limited | ✅ | ✅ || **Quotation Management** | ✅ Multi-version | ✅ | ⚠️ Basic | ❌ | ⚠️ Basic | ⚠️ Basic || **Project Creation** | ✅ Custom workflow | ✅ | ✅ | ✅ | ✅ | ✅ || **Work Order Management** | ✅ Detailed items | ⚠️ Basic | ✅ | ✅ | ❌ | ❌ || **Material Master** | ✅ | ⚠️ Basic inventory | ⚠️ Limited | ❌ | ❌ | ❌ || **Multi-Warehouse** | ✅ With company separation | ⚠️ Basic | ⚠️ Limited | ❌ | ❌ | ❌ || **Store Transactions (GRN/STN/SRN)** | ✅ VHPT format | ❌ | ⚠️ Different format | ❌ | ❌ | ❌ || **Material Requisition** | ✅ With approval | ⚠️ Basic | ⚠️ Different | ❌ | ❌ | ❌ || **Daily Progress Report (DPR)** | ✅ | ❌ | ⚠️ Different format | ❌ | ❌ | ❌ || **Manpower Reporting** | ✅ With Hajri system | ❌ | ⚠️ Different | ⚠️ Basic | ❌ | ❌ || **Bar Bending Schedule** | ✅ | ❌ | ⚠️ Limited | ❌ | ❌ | ❌ || **Equipment Rental Tracking** | ✅ | ❌ | ⚠️ Limited | ❌ | ❌ | ❌ || **Equipment Breakdown** | ✅ With deductions | ❌ | ⚠️ Limited | ❌ | ❌ | ❌ || **Expense Management** | ✅ Multi-level approval | ⚠️ Basic | ✅ | ⚠️ Basic | ⚠️ Basic | ⚠️ Basic || **Expense Categories (Indian)** | ✅ (Kaccha/Pakka bills) | ⚠️ Generic | ⚠️ Generic | ⚠️ Generic | ⚠️ Generic | ⚠️ Generic || **Drawing Upload** | ✅ | ⚠️ Basic | ✅ | ✅ | ❌ | ❌ || **Drawing Progress Tracking** | ✅ On drawings | ❌ | ❌ | ❌ | ❌ | ❌ || **Vendor Management** | ✅ Project-specific | ⚠️ Basic | ✅ | ⚠️ Basic | ⚠️ Basic | ⚠️ Basic || **Mobile Responsive** | ✅ PWA-ready | ✅ App | ✅ App | ✅ App | ✅ | ✅ || **Role-Based Access** | ✅ Flexible | ✅ | ✅ | ✅ | ✅ | ✅ || **Company Separation** | ✅ (VHPT/VHSHREE) | ⚠️ Multi-tenant | ✅ | ⚠️ Limited | ⚠️ Limited | ⚠️ Limited || **Indian Construction Practices** | ✅ | ❌ | ❌ | ❌ | ⚠️ Real estate focus | ⚠️ Real estate focus || **Cost** | One-time development | ₹1,300-3,200/user/mo | $12K-36K+/year | $99-399/mo | Affordable | Custom |**Legend:**

- ✅ = Full feature support
- ⚠️ = Partial or different implementation
- ❌ = Not available

---

## Missing Features Analysis

### Features We Have That Others Don't:

1. **Drawing Progress Tracking** - Unique feature to track progress directly on drawings
2. **Equipment Breakdown Deductions** - Automatic calculation of rental deductions
3. **Hajri System** - Indian construction-specific manpower tracking
4. **Multi-warehouse with Company Separation** - VHPT vs VHSHREE warehouse isolation
5. **VHPT Format Store Transactions** - Following specific company format
6. **Kaccha/Pakka Bill System** - Indian expense bill categorization
7. **Construction-specific DPR** - Tailored for diaphragm wall construction

### Features in Standard CRMs We Should Consider Adding:

#### High Priority (Consider for Phase 2):

1. **Email Integration**

- Send quotations via email
- Email notifications for approvals
- Lead capture from email
- **Implementation**: Nodemailer + email templates

2. **SMS Notifications**

- Approval notifications via SMS
- DPR submission reminders
- **Implementation**: Twilio or Indian SMS gateway (MSG91, TextLocal)

3. **PDF Generation**

- Automated quotation PDFs
- Work order PDFs
- DPR reports in PDF
- **Implementation**: pdfkit or puppeteer

4. **Dashboard Analytics**

- Project progress charts
- Material consumption trends
- Expense analytics
- Equipment utilization
- **Implementation**: Recharts/Chart.js

5. **Document Version Control**

- Drawing version history
- Quotation version tracking
- **Implementation**: File versioning system

#### Medium Priority (Future Enhancements):

6. **Gantt Chart for Project Timeline**

- Visual project schedule
- **Implementation**: React Gantt libraries

7. **Barcode/QR Code Scanning**

- Material tracking with barcodes
- Equipment identification
- **Implementation**: react-qr-reader, quaggaJS

8. **Geolocation Tracking**

- Site location tracking
- Attendance with GPS
- **Implementation**: Browser Geolocation API

9. **Photo Gallery for Projects**

- Site photos
- Progress photos
- **Implementation**: Image upload + gallery view

10. **Chat/Messaging System**

    - Internal communication
    - Project discussions
    - **Implementation**: Socket.io or third-party chat API

11. **Calendar Integration**

    - Project milestones
    - Equipment rental schedules
    - **Implementation**: FullCalendar or similar

12. **Export to Excel**

    - DPR export
    - Material reports
    - Expense reports
    - **Implementation**: exceljs or xlsx

13. **Advanced Search & Filters**

    - Global search across modules
    - Advanced filtering options
    - **Implementation**: Full-text search or Elasticsearch

14. **Audit Log**

    - Track all changes
    - User activity log
    - **Implementation**: Audit log table

15. **Backup & Recovery**

    - Automated database backups
    - Data export functionality
    - **Implementation**: MySQL dump scripts + cloud storage

#### Low Priority (Nice to Have):

16. **Mobile Native App**

    - iOS and Android apps
    - Offline capability
    - Push notifications
    - **Implementation**: React Native or Flutter

17. **AI/ML Features**

    - Lead scoring
    - Material demand forecasting
    - Anomaly detection in expenses
    - **Implementation**: TensorFlow.js or cloud ML APIs

18. **Integration with Accounting Software**

    - Tally integration
    - QuickBooks integration
    - **Implementation**: API integrations

19. **Weather Integration**

    - Weather data for DPR
    - Impact on project timeline
    - **Implementation**: Weather API

20. **Quality & Safety Module**

    - Quality checklists
    - Safety incident reporting
    - **Implementation**: New module with forms

---

## Implementation Recommendations

### Must-Have for Initial Release (10 Days):

1. ✅ All core modules as planned
2. ✅ Basic PDF generation for quotations
3. ✅ Email notifications for approvals
4. ✅ Basic dashboard with key metrics
5. ✅ Export to Excel for reports

### Should Add in Phase 2 (Post-Launch):

1. SMS notifications
2. Advanced analytics dashboard
3. Document version control
4. Photo gallery
5. Barcode scanning for materials

### Future Enhancements:

1. Mobile native apps
2. AI/ML features
3. Third-party integrations
4. Advanced reporting and BI

---

## Risk Mitigation

### Technical Risks:

1. **Drawing Progress Tracking Complexity**

- **Risk**: Complex implementation
- **Mitigation**: Start with basic panel marking, enhance later
- **Fallback**: Manual progress entry with drawing reference

2. **Performance with Large Data**

- **Risk**: Slow queries with many projects/materials
- **Mitigation**: Proper indexing, pagination, query optimization
- **Fallback**: Database optimization, caching

3. **File Storage**

- **Risk**: Large drawing files, storage limits
- **Mitigation**: File compression, cloud storage option
- **Fallback**: External storage service (AWS S3)

### Business Risks:

1. **User Adoption**

- **Risk**: Users find system complex
- **Mitigation**: Intuitive UI, training materials, responsive support

2. **Feature Gaps**

- **Risk**: Missing critical features
- **Mitigation**: Detailed requirements, user feedback loop

---

## Success Metrics

### Technical Metrics:

- Page load time < 2 seconds
- API response time < 500ms
- 99% uptime
- Mobile responsiveness score > 90

### Business Metrics:

- User adoption rate > 80%
- Data entry time reduction > 50%
- Approval time reduction > 60%
- Report generation time < 5 seconds

---