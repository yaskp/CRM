# Implementation Plan: Financial Management Modules

## Overview
Implementing 4 critical financial modules to match industry standards (Procore, Buildertrend, Salesforce Construction Cloud).

---

## Module 1: Client/Customer Management

### Database Schema
```sql
CREATE TABLE clients (
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
  credit_limit DECIMAL(15,2),
  client_type ENUM('individual', 'company', 'government') DEFAULT 'company',
  status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Link leads to clients
ALTER TABLE leads ADD COLUMN client_id INT NULL;
ALTER TABLE leads ADD CONSTRAINT fk_leads_client FOREIGN KEY (client_id) REFERENCES clients(id);

-- Link projects to clients
ALTER TABLE projects ADD COLUMN client_id INT NULL;
ALTER TABLE projects ADD CONSTRAINT fk_projects_client FOREIGN KEY (client_id) REFERENCES clients(id);
```

### API Endpoints
- `POST /clients` - Create client
- `GET /clients` - List clients (with pagination, search, filters)
- `GET /clients/:id` - Get client details
- `PUT /clients/:id` - Update client
- `DELETE /clients/:id` - Delete client
- `GET /clients/:id/projects` - Get client's projects
- `GET /clients/:id/invoices` - Get client's invoices

### Frontend Pages
- Client List (with search, filters)
- Client Form (Create/Edit)
- Client Details (with projects, invoices, payments)

---

## Module 2: Client Invoicing

### Database Schema
```sql
CREATE TABLE invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  client_id INT NOT NULL,
  project_id INT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  total_amount DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  final_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  balance_amount DECIMAL(15,2) NOT NULL,
  status ENUM('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
  payment_terms TEXT,
  notes TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE invoice_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50),
  rate DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  tax_percentage DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);
```

### API Endpoints
- `POST /invoices` - Create invoice
- `GET /invoices` - List invoices
- `GET /invoices/:id` - Get invoice details
- `PUT /invoices/:id` - Update invoice
- `DELETE /invoices/:id` - Delete invoice
- `GET /invoices/:id/pdf` - Download invoice PDF
- `POST /invoices/:id/send` - Send invoice to client
- `PUT /invoices/:id/status` - Update invoice status

### Frontend Pages
- Invoice List (with filters: status, client, project, date range)
- Invoice Form (Create/Edit with line items)
- Invoice Details (with payment history)
- Invoice PDF Preview

---

## Module 3: Payment Tracking

### Database Schema
```sql
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  payment_type ENUM('client_payment', 'vendor_payment') NOT NULL,
  client_id INT NULL,
  vendor_id INT NULL,
  invoice_id INT NULL,
  project_id INT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_mode ENUM('cash', 'cheque', 'bank_transfer', 'upi', 'card') NOT NULL,
  reference_number VARCHAR(100),
  bank_name VARCHAR(100),
  notes TEXT,
  status ENUM('pending', 'cleared', 'bounced', 'cancelled') DEFAULT 'cleared',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Payment allocation to invoices
CREATE TABLE payment_allocations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payment_id INT NOT NULL,
  invoice_id INT NOT NULL,
  allocated_amount DECIMAL(15,2) NOT NULL,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);
```

### API Endpoints
- `POST /payments` - Record payment
- `GET /payments` - List payments
- `GET /payments/:id` - Get payment details
- `PUT /payments/:id` - Update payment
- `DELETE /payments/:id` - Delete payment
- `GET /payments/receivables` - Get accounts receivable summary
- `GET /payments/payables` - Get accounts payable summary

### Frontend Pages
- Payment List (Client payments, Vendor payments)
- Payment Form (Record payment with invoice allocation)
- Receivables Dashboard (Outstanding invoices, aging report)
- Payables Dashboard (Outstanding vendor bills)

---

## Module 4: Budget Management

### Database Schema
```sql
CREATE TABLE project_budgets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  budget_type ENUM('material', 'labor', 'equipment', 'subcontractor', 'overhead', 'other') NOT NULL,
  category VARCHAR(100),
  budgeted_amount DECIMAL(15,2) NOT NULL,
  actual_amount DECIMAL(15,2) DEFAULT 0,
  committed_amount DECIMAL(15,2) DEFAULT 0,
  variance DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Budget tracking/revisions
CREATE TABLE budget_revisions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_budget_id INT NOT NULL,
  previous_amount DECIMAL(15,2) NOT NULL,
  revised_amount DECIMAL(15,2) NOT NULL,
  reason TEXT,
  revised_by INT NOT NULL,
  revised_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_budget_id) REFERENCES project_budgets(id),
  FOREIGN KEY (revised_by) REFERENCES users(id)
);
```

### API Endpoints
- `POST /projects/:id/budgets` - Create budget
- `GET /projects/:id/budgets` - Get project budgets
- `PUT /projects/:id/budgets/:budgetId` - Update budget
- `DELETE /projects/:id/budgets/:budgetId` - Delete budget
- `GET /projects/:id/budget-summary` - Get budget vs actual summary
- `POST /projects/:id/budgets/:budgetId/revise` - Create budget revision

### Frontend Pages
- Project Budget Form (Set budgets by category)
- Budget vs Actual Report (with variance analysis)
- Budget Revision History
- Cost Control Dashboard (across all projects)

---

## Implementation Phases

### Phase 1: Client Management (Week 1)
1. Database migration
2. Backend models and controllers
3. Frontend pages (List, Form, Details)
4. Link to existing Leads and Projects

### Phase 2: Invoicing (Week 2)
1. Database migration
2. Backend models and controllers
3. Invoice PDF generation
4. Frontend pages (List, Form, PDF preview)
5. Email integration (send invoice)

### Phase 3: Payment Tracking (Week 3)
1. Database migration
2. Backend models and controllers
3. Payment allocation logic
4. Frontend pages (Payment form, Receivables, Payables)
5. Aging report

### Phase 4: Budget Management (Week 4)
1. Database migration
2. Backend models and controllers
3. Budget calculation logic (actual from expenses, POs)
4. Frontend pages (Budget form, Reports)
5. Variance alerts

---

## Integration Points

### Existing Modules to Update:
1. **Leads**: Add client selection (convert lead → create client)
2. **Projects**: Add client selection, budget tab
3. **Work Orders**: Link to budget tracking
4. **Expenses**: Link to budget tracking
5. **Purchase Orders**: Link to budget (committed costs)
6. **Dashboard**: Add financial KPIs (Revenue, Outstanding, Budget variance)

---

## Industry Standard Features

### Procore-style:
- ✅ Client management separate from projects
- ✅ Progress billing (invoice based on % completion)
- ✅ Payment application tracking
- ✅ Budget forecasting

### Buildertrend-style:
- ✅ Client portal (view invoices, make payments)
- ✅ Automated payment reminders
- ✅ Budget templates
- ✅ Cost code integration

### Salesforce-style:
- ✅ Account (Client) hierarchy
- ✅ Opportunity → Quote → Invoice flow
- ✅ Payment terms automation
- ✅ Revenue recognition

---

## Success Metrics

After implementation:
- ✅ Track all client information centrally
- ✅ Generate professional invoices with GST
- ✅ Track payment status and aging
- ✅ Monitor project budgets vs actuals
- ✅ Forecast cash flow
- ✅ Reduce payment collection time
- ✅ Prevent budget overruns

---

**Estimated Timeline**: 4 weeks
**Complexity**: High
**Impact**: Critical for business operations

Ready to start implementation?
