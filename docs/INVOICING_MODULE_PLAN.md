# Client Invoicing Module - Implementation Plan

## Overview
Implement complete client invoicing system matching industry standards (Procore, Buildertrend, Salesforce).

---

## 📋 **DATABASE SCHEMA**

### **1. Invoices Table**
```sql
CREATE TABLE invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  client_id INT NOT NULL,
  project_id INT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  balance_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  
  -- Tax Details
  tax_type ENUM('GST', 'IGST', 'CGST_SGST', 'NONE') DEFAULT 'GST',
  tax_rate DECIMAL(5,2) DEFAULT 0,
  cgst_rate DECIMAL(5,2) DEFAULT 0,
  sgst_rate DECIMAL(5,2) DEFAULT 0,
  igst_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Status & Details
  status ENUM('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled') DEFAULT 'draft',
  payment_terms VARCHAR(200),
  notes TEXT,
  terms_conditions TEXT,
  
  -- Metadata
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  
  INDEX idx_client (client_id),
  INDEX idx_project (project_id),
  INDEX idx_status (status),
  INDEX idx_invoice_date (invoice_date)
);
```

### **2. Invoice Items Table**
```sql
CREATE TABLE invoice_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  
  -- Item Details
  item_type ENUM('work_order', 'material', 'labor', 'equipment', 'custom') DEFAULT 'custom',
  work_order_id INT NULL,
  description TEXT NOT NULL,
  
  -- Quantity & Pricing
  quantity DECIMAL(15,3) NOT NULL,
  unit VARCHAR(50),
  rate DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  
  -- Tax
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
  
  INDEX idx_invoice (invoice_id)
);
```

---

## 🔧 **BACKEND IMPLEMENTATION**

### **1. Model: Invoice.ts**
```typescript
interface InvoiceAttributes {
  id: number
  invoice_number: string
  client_id: number
  project_id: number
  invoice_date: Date
  due_date: Date
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  paid_amount: number
  balance_amount: number
  tax_type: 'GST' | 'IGST' | 'CGST_SGST' | 'NONE'
  tax_rate: number
  cgst_rate: number
  sgst_rate: number
  igst_rate: number
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'
  payment_terms?: string
  notes?: string
  terms_conditions?: string
  created_by: number
  created_at: Date
  updated_at: Date
}

// Associations
Invoice.belongsTo(Client)
Invoice.belongsTo(Project)
Invoice.hasMany(InvoiceItem)
```

### **2. Controller: invoice.controller.ts**
```typescript
// Auto-generate invoice number: INV-2026-001
const generateInvoiceNumber = async (): Promise<string>

// CRUD Operations
export const createInvoice = async (req, res)
export const getInvoices = async (req, res)  // with pagination, search, filters
export const getInvoice = async (req, res)
export const updateInvoice = async (req, res)
export const deleteInvoice = async (req, res)

// Special Operations
export const sendInvoice = async (req, res)  // Send via email
export const generatePDF = async (req, res)  // Generate PDF
export const recordPayment = async (req, res)  // Record payment against invoice
export const getClientInvoices = async (req, res)  // Get all invoices for a client
export const getProjectInvoices = async (req, res)  // Get all invoices for a project
```

### **3. Routes: invoice.routes.ts**
```typescript
POST   /api/invoices              - Create invoice
GET    /api/invoices              - List invoices (with filters)
GET    /api/invoices/:id          - Get invoice details
PUT    /api/invoices/:id          - Update invoice
DELETE /api/invoices/:id          - Delete invoice
POST   /api/invoices/:id/send     - Send invoice via email
GET    /api/invoices/:id/pdf      - Generate PDF
POST   /api/invoices/:id/payment  - Record payment
GET    /api/clients/:id/invoices  - Get client invoices
GET    /api/projects/:id/invoices - Get project invoices
```

---

## 🎨 **FRONTEND IMPLEMENTATION**

### **1. Service: invoices.ts**
```typescript
export const invoiceService = {
  getInvoices: (params) => api.get('/invoices', { params }),
  getInvoice: (id) => api.get(`/invoices/${id}`),
  createInvoice: (data) => api.post('/invoices', data),
  updateInvoice: (id, data) => api.put(`/invoices/${id}`, data),
  deleteInvoice: (id) => api.delete(`/invoices/${id}`),
  sendInvoice: (id) => api.post(`/invoices/${id}/send`),
  generatePDF: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
  recordPayment: (id, data) => api.post(`/invoices/${id}/payment`, data),
  getClientInvoices: (clientId) => api.get(`/clients/${clientId}/invoices`),
  getProjectInvoices: (projectId) => api.get(`/projects/${projectId}/invoices`),
}
```

### **2. Pages**

#### **InvoiceList.tsx**
- Table with all invoices
- Search by invoice number, client name
- Filters: Status, Date range, Client, Project
- Pagination
- Actions: View, Edit, Send, Download PDF, Delete
- Status badges with colors
- Amount display

#### **InvoiceForm.tsx**
- Three-column premium layout
- Section 1: Client & Project Selection
  - Client dropdown (required)
  - Project dropdown (filtered by client)
  - Invoice date, Due date
  - Payment terms
- Section 2: Invoice Items
  - Add/Remove items
  - Item type (Work Order, Material, Labor, Equipment, Custom)
  - Description, Quantity, Unit, Rate
  - Auto-calculate amount
- Section 3: Tax & Totals
  - Tax type selection (GST/IGST/CGST+SGST)
  - Tax rate
  - Discount
  - Auto-calculate totals
  - Notes, Terms & Conditions

#### **InvoiceDetails.tsx**
- View invoice details
- Client & Project info
- Invoice items table
- Tax breakdown
- Payment history
- Actions: Edit, Send, Download PDF, Record Payment, Delete
- Status timeline

#### **InvoicePDF.tsx** (PDF Template)
- Professional invoice template
- Company logo & details
- Client details
- Invoice items table
- Tax breakdown
- Payment terms
- Bank details

---

## 🔄 **FEATURES**

### **Core Features:**
1. ✅ Auto-generated invoice numbers (INV-2026-001)
2. ✅ Link to Client & Project
3. ✅ Multiple invoice items
4. ✅ Tax calculation (GST/IGST/CGST+SGST)
5. ✅ Discount support
6. ✅ Auto-calculate totals
7. ✅ Status management (Draft → Sent → Paid)
8. ✅ Payment tracking
9. ✅ PDF generation
10. ✅ Email sending

### **Advanced Features:**
1. ✅ Link work orders to invoice items
2. ✅ Payment allocation
3. ✅ Overdue detection
4. ✅ Aging reports
5. ✅ Client-wise invoice history
6. ✅ Project-wise invoice history

---

## 📊 **WORKFLOW**

```
1. Create Invoice
   ├─ Select Client
   ├─ Select Project
   ├─ Add Invoice Items
   ├─ Calculate Tax & Total
   └─ Save as Draft

2. Review & Send
   ├─ Review invoice
   ├─ Generate PDF
   ├─ Send via Email
   └─ Status: Draft → Sent

3. Receive Payment
   ├─ Record payment
   ├─ Allocate to invoice
   ├─ Update balance
   └─ Status: Sent → Paid/Partial

4. Track
   ├─ View outstanding invoices
   ├─ View overdue invoices
   ├─ Generate aging reports
   └─ Follow up with clients
```

---

## 🎯 **INTEGRATION POINTS**

### **1. Client Module**
- Client details on invoice
- Client-wise invoice history
- Outstanding balance per client

### **2. Project Module**
- Project details on invoice
- Project-wise invoice history
- Project revenue tracking

### **3. Work Order Module**
- Link work orders to invoice items
- Track billed vs unbilled work orders

### **4. Payment Module (Future)**
- Payment allocation
- Receipt generation
- Payment history

---

## 📋 **IMPLEMENTATION STEPS**

### **Phase 1: Backend (Week 1)**
1. ✅ Create database migration
2. ✅ Create Invoice model
3. ✅ Create InvoiceItem model
4. ✅ Create invoice controller
5. ✅ Create invoice routes
6. ✅ Test API endpoints

### **Phase 2: Frontend (Week 1-2)**
1. ✅ Create invoice service
2. ✅ Create InvoiceList page
3. ✅ Create InvoiceForm page
4. ✅ Create InvoiceDetails page
5. ✅ Add routes
6. ✅ Add menu item

### **Phase 3: PDF & Email (Week 2)**
1. ✅ Create PDF template
2. ✅ Implement PDF generation
3. ✅ Implement email sending
4. ✅ Test PDF & email

### **Phase 4: Testing & Polish (Week 2)**
1. ✅ Test all CRUD operations
2. ✅ Test tax calculations
3. ✅ Test payment recording
4. ✅ UI/UX polish

---

## 🎉 **EXPECTED OUTCOME**

After implementation:
- ✅ Complete invoicing system
- ✅ Professional PDF invoices
- ✅ Email integration
- ✅ Payment tracking
- ✅ 60% feature parity with Procore/Buildertrend

**Ready to start implementation!** 🚀

---

**Estimated Time**: 2 weeks
**Priority**: 🔴 CRITICAL
**Status**: Ready to implement
