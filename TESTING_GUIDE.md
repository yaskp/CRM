# 🧪 Testing Guide - Construction CRM System

## Prerequisites

1. **Database Setup**
   ```bash
   mysql -u root -p
   CREATE DATABASE crm_construction;
   USE crm_construction;
   SOURCE database/schema.sql;
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create .env file with:
   # DB_HOST=localhost
   # DB_PORT=3306
   # DB_NAME=crm_construction
   # DB_USER=root
   # DB_PASSWORD=YOUR_PASSWORD
   # JWT_SECRET=your-secret-key-min-32-chars
   # JWT_EXPIRES_IN=7d
   # PORT=5000
   # NODE_ENV=development
   npm run seed  # Seed default data
   npm run dev   # Start backend
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev   # Start frontend (usually http://localhost:5173)
   ```

## Test Scenarios

### 1. Authentication ✅
**Test Cases:**
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Access protected route without token (should redirect)
- [ ] Logout clears token

**Expected:**
- Registration creates user in database
- Login returns JWT token
- Token stored in localStorage
- Protected routes require authentication

### 2. Project Management ✅
**Test Cases:**
- [ ] Create new project
- [ ] View project list
- [ ] Filter projects by status
- [ ] Search projects
- [ ] View project details
- [ ] Update project status

**Expected:**
- Project code auto-generated
- All fields validated
- Project appears in list after creation

### 3. DPR Module ✅
**Test Cases:**
- [ ] Create new DPR
- [ ] Add manpower entries with Hajri
- [ ] Enter material consumption
- [ ] View DPR details
- [ ] Filter DPRs by project/date
- [ ] Edit existing DPR

**Expected:**
- All DPR fields saved correctly
- Manpower entries saved with correct Hajri values
- Date validation works
- Unique constraint prevents duplicate DPRs

### 4. Equipment Management ✅
**Test Cases:**
- [ ] Add equipment to master
- [ ] Create equipment rental
- [ ] Report equipment breakdown
- [ ] Verify deduction calculation
- [ ] View rental list
- [ ] Check net amount after deductions

**Expected:**
- Rental amounts calculated correctly
- Breakdown hours calculated correctly
- Deductions subtracted from total
- Net amount updated automatically

### 5. Expense Management ✅
**Test Cases:**
- [ ] Create expense with bill upload
- [ ] Create expense with selfie
- [ ] Submit expense for approval
- [ ] Approve at level 1 (Store Manager)
- [ ] Approve at level 2 (Operation Manager)
- [ ] Approve at level 3 (Head/Accounts)
- [ ] Reject expense
- [ ] View bill in preview modal

**Expected:**
- Files uploaded successfully
- Files saved in uploads/expenses folder
- 3-level approval workflow functions
- Status updates correctly at each level
- Rejection works properly

### 6. Store Transactions - GRN ✅
**Test Cases:**
- [ ] Create GRN with items
- [ ] Add multiple materials
- [ ] Enter batch numbers and expiry dates
- [ ] Submit GRN for approval
- [ ] Approve GRN (should update inventory)
- [ ] Verify inventory updated after approval
- [ ] Reject GRN

**Expected:**
- GRN number auto-generated
- Inventory increases after approval
- Inventory not updated if rejected
- Items saved correctly

### 7. Material & Vendor Management ✅
**Test Cases:**
- [ ] Create material
- [ ] Create vendor with GST/PAN
- [ ] Validate Indian phone numbers
- [ ] Validate GST numbers
- [ ] Validate PAN numbers
- [ ] Search materials/vendors

**Expected:**
- Validation works for Indian formats
- Invalid formats show error messages
- Search functionality works

### 8. Dashboard ✅
**Test Cases:**
- [ ] Dashboard loads with statistics
- [ ] Statistics are accurate
- [ ] Recent projects table shows data
- [ ] Recent expenses table shows data
- [ ] Quick actions navigate correctly

**Expected:**
- All statistics calculated correctly
- Tables show recent data
- Navigation works from quick actions

## Integration Tests

### Test Workflow 1: Complete Project Cycle
1. Create Project
2. Create DPR for project
3. Create Expense for project
4. Create GRN for project warehouse
5. Verify all linked correctly

### Test Workflow 2: Equipment Rental Cycle
1. Add Equipment
2. Create Rental
3. Report Breakdown
4. Verify Deductions
5. Complete Rental

### Test Workflow 3: Expense Approval Cycle
1. Create Expense
2. Upload Bill & Selfie
3. Approve at Level 1
4. Approve at Level 2
5. Approve at Level 3
6. Verify Final Status

## Performance Tests

- [ ] Page load times < 2 seconds
- [ ] API response times < 500ms
- [ ] Large lists paginate correctly
- [ ] File uploads handle large files (up to 10MB)
- [ ] Dashboard loads with 100+ projects

## Mobile Responsiveness Tests

- [ ] Forms work on mobile
- [ ] Tables scroll horizontally on mobile
- [ ] Menu collapses on mobile
- [ ] Buttons are touch-friendly
- [ ] File upload works on mobile

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (Chrome, Safari)

## Error Handling Tests

- [ ] Network errors show user-friendly messages
- [ ] Validation errors display correctly
- [ ] 401 errors redirect to login
- [ ] 404 errors show proper message
- [ ] 500 errors show generic error

## Security Tests

- [ ] JWT tokens expire correctly
- [ ] RBAC permissions enforced
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] File upload restrictions work
- [ ] CORS configured correctly

## Test Data

### Default Login
- Email: `admin@crm.com`
- Password: `admin123`

### Sample Projects
- Create projects with different statuses
- Create projects for different companies

### Sample Materials
- Create various material types
- Create materials with different units

### Sample Vendors
- Create vendors of each type
- Test with valid/invalid GST/PAN

## Common Issues & Solutions

### Issue: "Cannot find module" errors
**Solution**: Run `npm install` in both frontend and backend

### Issue: Database connection failed
**Solution**: Check .env file, verify MySQL is running, check credentials

### Issue: File uploads not working
**Solution**: Check uploads folder exists, check file permissions

### Issue: CORS errors
**Solution**: Verify backend CORS config allows frontend URL

### Issue: JWT token expired
**Solution**: Check token expiration time, re-login if needed

## Test Checklist

- [ ] All modules functional
- [ ] All forms validate correctly
- [ ] All API endpoints work
- [ ] File uploads work
- [ ] Approval workflows function
- [ ] Calculations are accurate
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security measures work

---

**Ready for Testing!** 🚀

