# Complete Menu Structure & Design System Application Plan

## 📋 Menu Structure (Based on Routes)

### 1. **Dashboard** 
- [ ] Dashboard (/)

### 2. **Sales & CRM**
- [x] Lead List (/sales/leads) - ✅ Form Updated
- [x] Lead Form (/sales/leads/new, /sales/leads/:id) - ✅ Updated
- [ ] Quotation List (/sales/quotations)
- [ ] Quotation Form (/sales/quotations/new, /sales/quotations/:id)
- [x] Project List (/sales/projects) - ✅ Updated
- [x] Project Create (/sales/projects/new) - ✅ Updated
- [x] Project Details (/sales/projects/:id) - ✅ Updated

### 3. **Master Data**
- [ ] Material List (/master/materials)
- [ ] Material Form (/master/materials/new, /master/materials/:id)
- [ ] Warehouse List (/master/warehouses)
- [ ] Warehouse Form (/master/warehouses/new, /master/warehouses/:id)
- [ ] Vendor List (/master/vendors)
- [ ] Vendor Form (/master/vendors/new, /master/vendors/:id)
- [ ] Equipment List (/master/equipment)
- [ ] Equipment Form (/master/equipment/new, /master/equipment/:id)
- [x] User List (/master/users) - ✅ Updated
- [x] User Form (/master/users/new, /master/users/:id) - ✅ Updated
- [ ] Role List (/master/roles)
- [ ] Role Form (/master/roles/new, /master/roles/:id)

### 4. **Procurement**
- [ ] Material Requisition List (/procurement/requisitions)
- [ ] Material Requisition Form (/procurement/requisitions/new)
- [ ] Vendor List (/procurement/vendors) - Same as master

### 5. **Inventory**
- [ ] GRN List (/inventory/grn)
- [ ] GRN Form (/inventory/grn/new, /inventory/grn/:id)
- [ ] STN List (/inventory/stn)
- [ ] STN Form (/inventory/stn/new, /inventory/stn/:id)
- [ ] SRN List (/inventory/srn)
- [ ] SRN Form (/inventory/srn/new, /inventory/srn/:id)
- [ ] Stock Report (/inventory/stock)

### 6. **Operations**
- [ ] DPR List (/operations/dpr)
- [ ] DPR Form (/operations/dpr/new, /operations/dpr/:id/edit)
- [ ] DPR Details (/operations/dpr/:id)
- [ ] Work Order List (/operations/work-orders)
- [ ] Work Order Form (/operations/work-orders/new, /operations/work-orders/:id)
- [ ] Bar Bending Schedule List (/operations/bar-bending)
- [ ] Bar Bending Schedule Form (/operations/bar-bending/new, /operations/bar-bending/:id)
- [ ] Equipment List (/operations/equipment) - Same as master
- [ ] Equipment Form (/operations/equipment/new) - Same as master
- [ ] Equipment Rentals (/operations/equipment/rentals)
- [ ] Rental Form (/operations/equipment/rentals/new)
- [ ] Breakdown Form (/operations/equipment/rentals/:rentalId/breakdown)

### 7. **Finance**
- [ ] Expense List (/finance/expenses)
- [ ] Expense Form (/finance/expenses/new)

### 8. **Drawings**
- [ ] Drawing List (/drawings)
- [ ] Drawing Form (/drawings/new, /drawings/:id)

### 9. **Administration**
- [x] User List (/admin/users) - ✅ Updated
- [x] User Form (/admin/users/new, /admin/users/:id) - ✅ Updated
- [ ] Role List (/admin/roles)
- [ ] Role Form (/admin/roles/new, /admin/roles/:id)
- [ ] Settings (/admin/settings)

### 10. **Authentication**
- [ ] Login (/login)
- [ ] Register (/register)

## 📊 Summary

- **Total Pages**: 46
- **Already Updated**: 6 (13%)
- **Remaining**: 40 (87%)

## 🎯 Update Priority

### **Phase 1: Core Pages** (High Priority)
1. Dashboard
2. Login
3. Lead List
4. Role List & Form

### **Phase 2: Master Data** (High Priority)
5. Material List & Form
6. Vendor List & Form
7. Warehouse List & Form
8. Equipment List & Form

### **Phase 3: Operations** (Medium Priority)
9. DPR List, Form & Details
10. Work Order List & Form
11. Equipment Rentals & Forms

### **Phase 4: Inventory** (Medium Priority)
12. GRN List & Form
13. STN List & Form
14. SRN List & Form
15. Stock Report

### **Phase 5: Sales & Finance** (Medium Priority)
16. Quotation List & Form
17. Expense List & Form

### **Phase 6: Others** (Lower Priority)
18. Drawing List & Form
19. Bar Bending Schedule List & Form
20. Material Requisition List & Form
21. Settings
22. Register

---

**Next Action**: Start with Phase 1 - Core Pages
