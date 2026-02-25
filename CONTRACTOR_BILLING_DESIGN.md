# Contractor Billing - Work Measurement & Payment Control System

**Date**: February 4, 2026  
**Priority**: 🚨 **CRITICAL** - Prevents overpayment to contractors

---

## 🎯 **BUSINESS REQUIREMENT**

### **Problem Statement:**
Contractors should be paid **ONLY for actual work completed**, verified against:
1. **BOQ (Bill of Quantities)** - Approved work scope
2. **DPR (Daily Progress Reports)** - Actual work done
3. **Work Orders** - Contracted rates and terms

### **Example Scenario:**
```
BOQ Approved Work: 1000 sqm D-Wall
Contractor Claims:  1100 sqm (10% more!)
System Should:      ❌ REJECT or FLAG for approval
                    ✅ Allow payment ONLY for 1000 sqm
                    ⚠️  Alert if work exceeds BOQ
```

---

## 📋 **SYSTEM DESIGN**

### **1. Work Measurement Hierarchy**

```
Project BOQ (Master)
    ↓
Work Order (Contractor Assignment)
    ↓
Daily Progress Reports (DPR)
    ↓
Contractor Bill (Payment Request)
    ↓
Payment (Final Settlement)
```

### **2. Data Flow & Validation**

#### **Step 1: BOQ Definition** (Already exists ✅)
```
Project: ABC D-Wall Construction
BOQ Item: D-Wall Grabbing
Quantity: 1000 sqm
Rate: ₹500/sqm
Total Value: ₹5,00,000
```

#### **Step 2: Work Order Creation** (Already exists ✅)
```
Contractor: XYZ Contractors
Work Item: D-Wall Grabbing
Contracted Quantity: 1000 sqm
Rate: ₹450/sqm (subcontractor rate)
Total Contract Value: ₹4,50,000
```

#### **Step 3: DPR Tracking** (Already exists ✅)
```
Day 1: 50 sqm
Day 2: 75 sqm
Day 3: 60 sqm
...
Total Completed: 985 sqm (cumulative)
```

#### **Step 4: Contractor Bill Entry** ❌ **MISSING - TO BE BUILT**
```
Contractor submits bill for: 1100 sqm

System Validation:
1. ✅ Check Work Order: Max allowed = 1000 sqm
2. ✅ Check DPR Records: Actual done = 985 sqm
3. ❌ REJECT: Bill quantity (1100) > Work Order (1000)
4. ⚠️  ALERT: Bill quantity (1100) > DPR Actual (985)

Allowed Bill Amount:
- Option A: Pay for DPR Actual = 985 sqm × ₹450 = ₹4,43,250
- Option B: Pay for Work Order Max = 1000 sqm × ₹450 = ₹4,50,000
- Option C: Require approval for excess (1100 sqm)
```

---

## 🔧 **TECHNICAL IMPLEMENTATION**

### **Database Schema - Contractor Bill**

```sql
CREATE TABLE contractor_bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    bill_date DATE NOT NULL,
    
    -- References
    project_id INT NOT NULL,
    work_order_id INT NOT NULL,
    vendor_id INT NOT NULL,  -- Contractor
    
    -- Bill Details
    bill_period_from DATE,
    bill_period_to DATE,
    
    -- Amounts
    gross_amount DECIMAL(15,2),
    tds_amount DECIMAL(15,2),
    retention_amount DECIMAL(15,2),
    net_amount DECIMAL(15,2),
    
    -- Status
    status ENUM('draft', 'submitted', 'verified', 'approved', 'rejected', 'paid'),
    
    -- Verification
    verified_by INT,
    verified_at DATETIME,
    approved_by INT,
    approved_at DATETIME,
    
    -- Remarks
    remarks TEXT,
    rejection_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

CREATE TABLE contractor_bill_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_id INT NOT NULL,
    
    -- Work Reference
    work_item_type_id INT,
    description VARCHAR(500),
    
    -- Quantities
    boq_quantity DECIMAL(15,3),          -- From BOQ
    work_order_quantity DECIMAL(15,3),   -- From Work Order
    previous_billed_quantity DECIMAL(15,3), -- Previously billed
    dpr_actual_quantity DECIMAL(15,3),   -- From DPR records
    current_bill_quantity DECIMAL(15,3), -- This bill
    cumulative_billed DECIMAL(15,3),     -- Total billed so far
    
    -- Rates & Amounts
    unit VARCHAR(50),
    rate DECIMAL(15,2),
    amount DECIMAL(15,2),
    
    -- Validation Flags
    exceeds_work_order BOOLEAN DEFAULT FALSE,
    exceeds_dpr_actual BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT FALSE,
    
    -- Approval
    approved_quantity DECIMAL(15,3),
    approval_remarks TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (bill_id) REFERENCES contractor_bills(id) ON DELETE CASCADE,
    FOREIGN KEY (work_item_type_id) REFERENCES work_item_types(id)
);
```

---

## 🔒 **VALIDATION RULES**

### **Rule 1: Work Order Limit** (HARD STOP)
```javascript
if (currentBillQuantity + previousBilledQuantity > workOrderQuantity) {
    throw new Error(
        `Cannot bill ${currentBillQuantity} ${unit}. ` +
        `Work Order limit: ${workOrderQuantity} ${unit}. ` +
        `Already billed: ${previousBilledQuantity} ${unit}. ` +
        `Remaining: ${workOrderQuantity - previousBilledQuantity} ${unit}`
    );
}
```

### **Rule 2: DPR Actual Verification** (WARNING + APPROVAL)
```javascript
if (currentBillQuantity > dprActualQuantity) {
    item.exceeds_dpr_actual = true;
    item.requires_approval = true;
    
    alert(
        `⚠️ Bill quantity (${currentBillQuantity}) exceeds DPR actual (${dprActualQuantity}). ` +
        `Requires manager approval.`
    );
}
```

### **Rule 3: BOQ Limit** (ALERT)
```javascript
if (cumulative_billed > boqQuantity) {
    alert(
        `⚠️ Total billed (${cumulative_billed}) exceeds BOQ (${boqQuantity}). ` +
        `This may indicate scope change or variation.`
    );
}
```

### **Rule 4: Rate Verification**
```javascript
if (billRate !== workOrderRate) {
    alert(
        `⚠️ Bill rate (₹${billRate}) differs from Work Order rate (₹${workOrderRate}). ` +
        `Requires approval.`
    );
}
```

---

## 📊 **BILL VERIFICATION WORKFLOW**

### **Step 1: Contractor Submits Bill**
```
Status: draft → submitted
Action: System auto-calculates and validates
```

### **Step 2: Site Engineer Verification**
```
Checks:
✅ Work actually completed (cross-check with DPR)
✅ Quality acceptable
✅ Quantities correct
✅ Rates as per Work Order

Actions:
- Verify quantities against DPR
- Adjust if needed
- Add remarks
- Mark as 'verified' or 'rejected'
```

### **Step 3: Project Manager Approval**
```
Checks:
✅ Verified by Site Engineer
✅ Within Work Order limits
✅ Budget available
✅ No pending quality issues

Actions:
- Approve or reject
- If approved → Status: 'approved'
- If rejected → Status: 'rejected' (with reason)
```

### **Step 4: Accounts Processing**
```
Calculations:
1. Gross Amount = Σ(Quantity × Rate)
2. TDS @ 1% or 2% (as per Section 194C)
3. Retention @ 5% or 10% (as per contract)
4. Net Amount = Gross - TDS - Retention

Actions:
- Generate payment voucher
- Process payment
- Update status to 'paid'
```

---

## 🎨 **UI/UX DESIGN**

### **Contractor Bill Entry Form**

```
┌─────────────────────────────────────────────────────────────┐
│  Contractor Bill Entry                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Bill Number: CB/2026/001                  Date: 04-Feb-2026│
│  Contractor: XYZ Contractors                                │
│  Work Order: WO/2026/ABC/001                                │
│  Period: 01-Jan-2026 to 31-Jan-2026                        │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Work Items                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Item: D-Wall Grabbing                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ BOQ Quantity:        1000.00 sqm                      │  │
│  │ Work Order Qty:      1000.00 sqm                      │  │
│  │ DPR Actual:           985.00 sqm  ✅                  │  │
│  │ Previously Billed:    800.00 sqm                      │  │
│  │ Remaining:            200.00 sqm                      │  │
│  │                                                        │  │
│  │ Current Bill Qty: [_185.00_] sqm  ✅ Valid           │  │
│  │ Rate: ₹450.00/sqm                                     │  │
│  │ Amount: ₹83,250.00                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [+ Add Item]                                               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Summary                                                     │
├─────────────────────────────────────────────────────────────┤
│  Gross Amount:        ₹83,250.00                            │
│  TDS @ 2%:           -₹1,665.00                             │
│  Retention @ 10%:    -₹8,325.00                             │
│  ───────────────────────────────                            │
│  Net Payable:         ₹73,260.00                            │
│                                                              │
│  [Save Draft]  [Submit for Verification]                   │
└─────────────────────────────────────────────────────────────┘
```

### **Validation Alerts**

#### **❌ Error: Exceeds Work Order**
```
┌─────────────────────────────────────────┐
│  ❌ Validation Error                    │
├─────────────────────────────────────────┤
│  Current bill quantity (250 sqm)        │
│  exceeds remaining work order           │
│  quantity (200 sqm).                    │
│                                         │
│  Work Order: 1000 sqm                   │
│  Previously Billed: 800 sqm             │
│  Remaining: 200 sqm                     │
│  Your Entry: 250 sqm ❌                 │
│                                         │
│  Please adjust quantity.                │
│  [OK]                                   │
└─────────────────────────────────────────┘
```

#### **⚠️ Warning: Exceeds DPR Actual**
```
┌─────────────────────────────────────────┐
│  ⚠️  Approval Required                  │
├─────────────────────────────────────────┤
│  Bill quantity (185 sqm) is close to    │
│  DPR actual (185 sqm) but exceeds       │
│  some individual panel measurements.    │
│                                         │
│  This bill will require manager         │
│  approval before payment.               │
│                                         │
│  [Continue]  [Adjust Quantity]          │
└─────────────────────────────────────────┘
```

---

## 📈 **REPORTS REQUIRED**

### **1. Work vs Bill Reconciliation Report**
```
Project: ABC D-Wall Construction
Period: Jan 2026

┌─────────────┬─────────┬──────────┬──────────┬──────────┬────────┐
│ Work Item   │ BOQ Qty │ WO Qty   │ DPR Done │ Billed   │ Status │
├─────────────┼─────────┼──────────┼──────────┼──────────┼────────┤
│ Grabbing    │ 1000    │ 1000     │ 985      │ 985      │ ✅ OK  │
│ Concreting  │ 1000    │ 1000     │ 950      │ 900      │ ✅ OK  │
│ Cage Lower  │ 1000    │ 1000     │ 1000     │ 1050     │ ⚠️ Over│
└─────────────┴─────────┴──────────┴──────────┴──────────┴────────┘
```

### **2. Contractor Payment Summary**
```
Contractor: XYZ Contractors
Period: Jan 2026

Total Billed:     ₹4,43,250
TDS Deducted:     ₹8,865
Retention Held:   ₹44,325
Net Paid:         ₹3,90,060
Outstanding:      ₹0
```

### **3. Overbilling Alert Report**
```
⚠️ Potential Overbilling Cases

┌──────────────┬──────────┬──────────┬──────────┬────────────┐
│ Contractor   │ Work Item│ WO Qty   │ Billed   │ Excess     │
├──────────────┼──────────┼──────────┼──────────┼────────────┤
│ ABC Cont.    │ Grabbing │ 1000     │ 1050     │ 50 (5%)    │
│ XYZ Cont.    │ Concrete │ 500      │ 525      │ 25 (5%)    │
└──────────────┴──────────┴──────────┴──────────┴────────────┘
```

---

## 🔐 **SECURITY & AUDIT**

### **Audit Trail:**
```sql
CREATE TABLE contractor_bill_audit (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_id INT NOT NULL,
    action VARCHAR(50),  -- created, modified, verified, approved, rejected, paid
    field_changed VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_by INT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT
);
```

### **Access Control:**
- **Contractor**: Can create and submit bills
- **Site Engineer**: Can verify bills
- **Project Manager**: Can approve bills
- **Accounts**: Can process payment
- **Admin**: Full access

---

## ✅ **IMPLEMENTATION CHECKLIST**

### **Phase 1: Database & Backend** (Week 1-2)
- [ ] Create contractor_bills table
- [ ] Create contractor_bill_items table
- [ ] Create contractor_bill_audit table
- [ ] Build API endpoints (CRUD)
- [ ] Implement validation logic
- [ ] Build DPR aggregation queries
- [ ] Build Work Order tracking queries

### **Phase 2: Frontend** (Week 3-4)
- [ ] Contractor Bill List page
- [ ] Contractor Bill Entry form
- [ ] Work Order selection with auto-fill
- [ ] Real-time validation
- [ ] DPR vs Bill comparison view
- [ ] Approval workflow UI
- [ ] Payment processing UI

### **Phase 3: Reports** (Week 5)
- [ ] Work vs Bill Reconciliation Report
- [ ] Contractor Payment Summary
- [ ] Overbilling Alert Report
- [ ] TDS Report
- [ ] Retention Money Report

### **Phase 4: Integration** (Week 6)
- [ ] Link with DPR module
- [ ] Link with Work Order module
- [ ] Link with BOQ module
- [ ] Link with Payment module
- [ ] Email notifications
- [ ] SMS alerts for approvals

---

## 💡 **BUSINESS RULES SUMMARY**

1. ✅ **Cannot bill more than Work Order quantity** (HARD STOP)
2. ⚠️ **Warning if bill > DPR actual** (Requires approval)
3. ⚠️ **Alert if cumulative > BOQ** (Scope change indicator)
4. ✅ **TDS auto-calculated** (1% or 2% as per contract)
5. ✅ **Retention auto-calculated** (5% or 10% as per contract)
6. ✅ **Multi-level approval** (Site Engineer → PM → Accounts)
7. ✅ **Audit trail** for all changes
8. ✅ **Payment only after approval**

---

**Priority**: 🚨 **CRITICAL**  
**Estimated Effort**: 6 weeks  
**Dependencies**: DPR, Work Order, BOQ modules (all exist ✅)

**Next Step**: Start with database schema and backend API implementation?
