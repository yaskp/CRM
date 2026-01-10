# 🚀 Quick Start & Testing Guide

## Quick Start (5 Minutes)

### 1. Start Backend
```powershell
cd backend
npm run dev
```
Backend should start on http://localhost:5000

### 2. Start Frontend
```powershell
cd frontend
npm run dev
```
Frontend should start on http://localhost:5173 (or similar)

### 3. Login
- URL: http://localhost:5173/login
- Email: `admin@crm.com`
- Password: `admin123`

## ✅ What's Working & Ready to Test

### Fully Functional Modules ✅

#### 1. Dashboard ✅
- Navigate to: `/`
- **Test**: View statistics, recent projects, recent expenses, quick actions

#### 2. Projects ✅
- List: `/sales/projects`
- Create: `/sales/projects/new`
- **Test**: Create project, view list, filter by status

#### 3. DPR (Daily Progress Report) ✅
- List: `/operations/dpr`
- Create: `/operations/dpr/new`
- **Test**: 
  - Create DPR with all fields
  - Add manpower entries with Hajri (1, 1.5, 2)
  - Enter material consumption
  - View DPR details

#### 4. Equipment Management ✅
- Master List: `/operations/equipment`
- Add Equipment: `/operations/equipment/new`
- Rentals: `/operations/equipment/rentals`
- Create Rental: `/operations/equipment/rentals/new`
- Report Breakdown: `/operations/equipment/rentals/:id/breakdown`
- **Test**:
  - Add equipment
  - Create rental
  - Report breakdown
  - Verify deduction calculation

#### 5. Expense Management ✅
- List: `/finance/expenses`
- Create: `/finance/expenses/new`
- **Test**:
  - Create expense with bill upload
  - Upload selfie
  - Submit for approval
  - Approve at different levels
  - View bill preview

#### 6. GRN (Good Receipt Note) ✅
- List: `/inventory/grn`
- Create: `/inventory/grn/new`
- **Test**:
  - Create GRN with multiple items
  - Add batch numbers & expiry dates
  - Approve GRN
  - Verify inventory updates

#### 7. Materials ✅
- List: `/master/materials`
- Create: `/master/materials/new`
- **Test**: Create material, search, filter

#### 8. Vendors ✅
- List: `/master/vendors`
- Create: `/master/vendors/new`
- **Test**: 
  - Create vendor with GST/PAN
  - Validate Indian phone numbers
  - Validate GST/PAN formats

## Test Scenarios (Step by Step)

### Scenario 1: Complete Project Workflow
1. ✅ Login → Dashboard
2. ✅ Create Project (`/sales/projects/new`)
3. ✅ Create DPR for project (`/operations/dpr/new`)
4. ✅ Create Expense for project (`/finance/expenses/new`)
5. ✅ View all in Dashboard

### Scenario 2: Equipment Rental Workflow
1. ✅ Add Equipment (`/operations/equipment/new`)
2. ✅ Create Rental (`/operations/equipment/rentals/new`)
3. ✅ Report Breakdown (from rental list → Report Breakdown)
4. ✅ Verify deductions calculated
5. ✅ Check net amount

### Scenario 3: Store Transaction Workflow
1. ✅ Create Material (`/master/materials/new`)
2. ✅ Create GRN (`/inventory/grn/new`)
3. ✅ Add items to GRN
4. ✅ Approve GRN
5. ✅ Verify inventory updated

### Scenario 4: Expense Approval Workflow
1. ✅ Create Expense (`/finance/expenses/new`)
2. ✅ Upload bill & selfie
3. ✅ Submit expense
4. ✅ View in expense list
5. ✅ Approve at Level 1
6. ✅ Approve at Level 2
7. ✅ Approve at Level 3
8. ✅ Verify final status = "approved"

## Validation Tests

### Form Validation ✅
- ✅ Required fields show errors
- ✅ Indian phone validation (10 digits, starts with 6-9)
- ✅ GST validation (15 characters, proper format)
- ✅ PAN validation (10 characters, proper format)
- ✅ Email validation
- ✅ Number validation (positive, decimal)
- ✅ Date validation

### File Upload ✅
- ✅ Bill upload (JPG, PNG, PDF)
- ✅ Selfie upload (JPG, PNG)
- ✅ File size limit (10MB)
- ✅ File preview in expense list

## UI/UX Tests

### Responsiveness ✅
- ✅ Desktop view works
- ✅ Tablet view works
- ✅ Mobile view works (check menu collapse)

### Navigation ✅
- ✅ Master menu works
- ✅ Breadcrumbs work
- ✅ Back buttons work
- ✅ Quick actions work

### Loading States ✅
- ✅ Loading indicators show
- ✅ Forms disable during submission
- ✅ Tables show loading state

### Error Handling ✅
- ✅ Error messages display
- ✅ Network errors handled
- ✅ Validation errors show clearly

## Performance Checks

- [ ] Page loads in < 2 seconds
- [ ] API responses in < 500ms
- [ ] Large lists paginate smoothly
- [ ] File uploads don't block UI
- [ ] Dashboard loads quickly

## Common Test Data

### Create Test Project
```
Name: Test Project Mumbai
Location: Mumbai
City: Mumbai
State: Maharashtra
Client: Test Client
Status: Active
```

### Create Test DPR
```
Project: [Select test project]
Date: Today
Site Location: Site A
Panel Number: P-001
Guide Wall: 10 m
Steel: 500 kg
Concrete: 2.5 m³
Manpower: Add Steel Worker (5 workers, Hajri: 1.5)
```

### Create Test Expense
```
Project: [Select test project]
Type: Conveyance
Amount: ₹500
Date: Today
Description: Ola ride to site
Bill Type: Ola/Uber Screenshot
Upload: [Upload screenshot]
Upload Selfie: [Take/upload selfie]
```

### Create Test GRN
```
Warehouse: [Select warehouse]
Date: Today
Items:
  - Material: Cement
    Quantity: 100
    Unit Price: ₹400
    Batch: BATCH001
  - Material: Steel
    Quantity: 500
    Unit Price: ₹50
```

## Expected Results

### ✅ All Forms Should:
- Validate inputs correctly
- Show clear error messages
- Submit successfully
- Redirect after success
- Handle errors gracefully

### ✅ All Lists Should:
- Display data correctly
- Paginate properly
- Filter correctly
- Search works
- Actions work

### ✅ All Details Pages Should:
- Show all information
- Display relationships
- Allow editing (where applicable)
- Print functionality works

## Known Limitations

1. **STN/SRN Pages**: Not created yet (can copy GRN pattern)
2. **Drawing Pages**: Not created yet
3. **Lead/Quotation Pages**: Basic structure, need completion
4. **Work Order Pages**: Basic structure, need completion

## Next Steps After Testing

1. **Fix any bugs** found during testing
2. **Complete remaining pages** (STN/SRN, Drawings, etc.)
3. **Add more test data** for comprehensive testing
4. **Performance optimization** if needed
5. **User training** materials

---

## 🎯 Testing Status

**Ready to Test:**
- ✅ Dashboard
- ✅ Projects
- ✅ DPR
- ✅ Equipment
- ✅ Expenses
- ✅ GRN
- ✅ Materials
- ✅ Vendors

**All Core Features Functional!** 🚀

