# Client Entity Relationships - Complete Integration Map

## Overview
The **Client** is the central entity that connects all sales, project, and financial modules in the CRM. Here's how it links to every other entity.

---

## 🔗 Entity Relationship Diagram

```
                                    ┌─────────────┐
                                    │   CLIENT    │
                                    │  (Central)  │
                                    └──────┬──────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
              ┌──────────┐          ┌──────────┐          ┌──────────┐
              │   LEAD   │          │ PROJECT  │          │ INVOICE  │
              └────┬─────┘          └────┬─────┘          └────┬─────┘
                   │                     │                     │
                   │                     │                     │
                   ▼                     ▼                     ▼
              ┌──────────┐          ┌──────────┐          ┌──────────┐
              │QUOTATION │          │WORK ORDER│          │ PAYMENT  │
              └──────────┘          └────┬─────┘          └──────────┘
                                         │
                                         ▼
                                    ┌──────────┐
                                    │ EXPENSES │
                                    └──────────┘
```

---

## 📊 Detailed Relationships

### 1. **CLIENT → LEAD** (One-to-Many)

**Database Link:**
```sql
ALTER TABLE leads 
ADD COLUMN client_id INT NULL,
ADD CONSTRAINT fk_leads_client FOREIGN KEY (client_id) REFERENCES clients(id);
```

**Relationship:**
- A **Client** can have multiple **Leads** (ongoing inquiries)
- A **Lead** belongs to one **Client**

**Use Case:**
- When a client calls with a new project inquiry, you create a Lead linked to that existing Client
- You can see all inquiries (Leads) from a specific Client

**Example:**
```
Client: ABC Construction Ltd (CLT-2026-001)
  └─ Lead 1: Residential Building Project (Status: New)
  └─ Lead 2: Commercial Complex (Status: Quoted)
  └─ Lead 3: Highway Project (Status: Converted)
```

---

### 2. **CLIENT → PROJECT** (One-to-Many)

**Database Link:**
```sql
ALTER TABLE projects
ADD COLUMN client_id INT NULL,
ADD CONSTRAINT fk_projects_client FOREIGN KEY (client_id) REFERENCES clients(id);
```

**Relationship:**
- A **Client** can have multiple **Projects** (active and completed)
- A **Project** belongs to one **Client**

**Use Case:**
- Track all projects for a specific client
- View client's project history
- Calculate total revenue from a client

**Example:**
```
Client: ABC Construction Ltd (CLT-2026-001)
  └─ Project 1: Residential Tower (Status: Execution)
  └─ Project 2: Shopping Mall (Status: Completed)
  └─ Project 3: Office Building (Status: Design)
```

---

### 3. **CLIENT → QUOTATION** (Indirect via Lead)

**Database Link:**
```
Client → Lead → Quotation
```

**Relationship:**
- **Quotations** are linked to **Leads**
- **Leads** are linked to **Clients**
- Therefore, **Client** → **Lead** → **Quotation** (indirect)

**Use Case:**
- View all quotations sent to a client (across all leads)
- Track quotation acceptance rate per client

**Example:**
```
Client: ABC Construction Ltd (CLT-2026-001)
  └─ Lead 1: Residential Building
      └─ Quotation 1: Version 1 (Status: Sent)
      └─ Quotation 2: Version 2 (Status: Accepted)
  └─ Lead 2: Commercial Complex
      └─ Quotation 3: Version 1 (Status: Draft)
```

---

### 4. **CLIENT → WORK ORDER** (Indirect via Project)

**Database Link:**
```
Client → Project → Work Order
```

**Relationship:**
- **Work Orders** are linked to **Projects**
- **Projects** are linked to **Clients**
- Therefore, **Client** → **Project** → **Work Order** (indirect)

**Use Case:**
- View all work orders for a client's projects
- Track subcontractor work for specific clients

**Example:**
```
Client: ABC Construction Ltd (CLT-2026-001)
  └─ Project 1: Residential Tower
      └─ Work Order 1: Foundation Work (Vendor: XYZ Contractors)
      └─ Work Order 2: Plumbing (Internal Team)
  └─ Project 2: Shopping Mall
      └─ Work Order 3: Electrical Work (Vendor: ABC Electricals)
```

---

### 5. **CLIENT → INVOICE** (Direct - Future Module)

**Database Link (To be created):**
```sql
CREATE TABLE invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  client_id INT NOT NULL,
  project_id INT NOT NULL,
  ...
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

**Relationship:**
- A **Client** can have multiple **Invoices**
- An **Invoice** belongs to one **Client** and one **Project**

**Use Case:**
- Bill clients for completed work
- Track outstanding invoices per client
- Generate aging reports

**Example:**
```
Client: ABC Construction Ltd (CLT-2026-001)
  └─ Invoice 1: INV-2026-001 (Project: Residential Tower, Amount: ₹50,00,000, Status: Paid)
  └─ Invoice 2: INV-2026-015 (Project: Shopping Mall, Amount: ₹75,00,000, Status: Pending)
```

---

### 6. **CLIENT → PAYMENT** (Direct - Future Module)

**Database Link (To be created):**
```sql
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  payment_type ENUM('client_payment', 'vendor_payment'),
  client_id INT NULL,
  invoice_id INT NULL,
  ...
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);
```

**Relationship:**
- A **Client** can make multiple **Payments**
- A **Payment** belongs to one **Client** and can be allocated to multiple **Invoices**

**Use Case:**
- Track payments received from clients
- Allocate payments to invoices
- Monitor outstanding receivables

**Example:**
```
Client: ABC Construction Ltd (CLT-2026-001)
  └─ Payment 1: PAY-2026-001 (Amount: ₹25,00,000, Allocated to: Invoice 1)
  └─ Payment 2: PAY-2026-020 (Amount: ₹50,00,000, Allocated to: Invoice 2)
```

---

### 7. **CLIENT → EXPENSES** (Indirect via Project)

**Database Link:**
```
Client → Project → Expenses
```

**Relationship:**
- **Expenses** are linked to **Projects**
- **Projects** are linked to **Clients**
- Therefore, **Client** → **Project** → **Expenses** (indirect)

**Use Case:**
- Track all expenses incurred for a client's projects
- Calculate project profitability per client

**Example:**
```
Client: ABC Construction Ltd (CLT-2026-001)
  └─ Project 1: Residential Tower
      └─ Expense 1: Material Purchase (₹10,00,000)
      └─ Expense 2: Labor Cost (₹5,00,000)
```

---

## 🔄 Complete Data Flow

### **Standard Construction CRM Flow:**

```
1. LEAD GENERATION
   Client calls → Create/Link to Client → Create Lead

2. QUOTATION
   Lead qualified → Create Quotation → Send to Client

3. PROJECT CONVERSION
   Quotation accepted → Create Project (linked to Client)

4. EXECUTION
   Project active → Create Work Orders → Track Expenses

5. INVOICING
   Work completed → Create Invoice (linked to Client & Project)

6. PAYMENT
   Client pays → Record Payment → Allocate to Invoice
```

---

## 📋 Implementation Status

### ✅ Currently Implemented
1. **Client → Lead** (Database link added)
2. **Client → Project** (Database link added)
3. **Lead → Quotation** (Existing)
4. **Project → Work Order** (Existing)
5. **Project → Expenses** (Existing)

### 🔄 To Be Implemented (Next Phases)
1. **Client → Invoice** (Phase 2)
2. **Client → Payment** (Phase 3)
3. **Invoice → Payment Allocation** (Phase 3)

---

## 🎯 How to Use Client Links

### **Creating a Lead for an Existing Client:**
```typescript
// Frontend: LeadForm.tsx
<Form.Item label="Client" name="client_id">
  <Select>
    {clients.map(client => (
      <Option value={client.id}>{client.company_name}</Option>
    ))}
  </Select>
</Form.Item>
```

### **Creating a Project for a Client:**
```typescript
// Frontend: ProjectCreate.tsx
<Form.Item label="Client" name="client_id">
  <Select>
    {clients.map(client => (
      <Option value={client.id}>{client.company_name}</Option>
    ))}
  </Select>
</Form.Item>
```

### **Viewing Client's Projects:**
```typescript
// API Call
const response = await clientService.getClientProjects(clientId)
// Returns all projects for this client
```

### **Viewing Client's Invoices (Future):**
```typescript
// API Call (to be implemented)
const response = await clientService.getClientInvoices(clientId)
// Returns all invoices for this client
```

---

## 🔍 Query Examples

### **Get All Projects for a Client:**
```sql
SELECT * FROM projects 
WHERE client_id = 123;
```

### **Get All Leads for a Client:**
```sql
SELECT * FROM leads 
WHERE client_id = 123;
```

### **Get All Quotations for a Client (via Leads):**
```sql
SELECT q.* 
FROM quotations q
JOIN leads l ON q.lead_id = l.id
WHERE l.client_id = 123;
```

### **Get All Work Orders for a Client (via Projects):**
```sql
SELECT wo.* 
FROM work_orders wo
JOIN projects p ON wo.project_id = p.id
WHERE p.client_id = 123;
```

### **Get Total Revenue from a Client (Future - via Invoices):**
```sql
SELECT SUM(final_amount) as total_revenue
FROM invoices
WHERE client_id = 123 AND status = 'paid';
```

---

## 🎨 UI Integration Points

### **Client Details Page - Tabs:**
```
┌─────────────────────────────────────┐
│  Client: ABC Construction Ltd       │
├─────────────────────────────────────┤
│  [Basic Info] [Address] [Financial] │
├─────────────────────────────────────┤
│  Tabs:                              │
│  • Projects (5)                     │
│  • Leads (3)                        │
│  • Quotations (8)                   │
│  • Invoices (12) [Future]           │
│  • Payments (15) [Future]           │
└─────────────────────────────────────┘
```

---

## 📊 Reporting Capabilities

### **Client-Level Reports (Future):**
1. **Client Revenue Report** - Total revenue per client
2. **Client Profitability** - Revenue vs Costs per client
3. **Client Payment History** - All payments from a client
4. **Client Project Portfolio** - All projects (active + completed)
5. **Client Outstanding** - Pending invoices per client

---

## 🚀 Next Steps

### **Immediate (Update Lead & Project Forms):**
1. Add Client dropdown to LeadForm
2. Add Client dropdown to ProjectCreate
3. Update Lead model to include client_id
4. Update Project model to include client_id

### **Phase 2 (Invoicing):**
1. Create Invoice model with client_id
2. Link invoices to clients
3. Display invoices in Client Details page

### **Phase 3 (Payments):**
1. Create Payment model with client_id
2. Link payments to clients and invoices
3. Display payments in Client Details page

---

**The Client entity is now the central hub connecting all sales, project, and financial modules!** 🎉
