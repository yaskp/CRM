# Master Menu Structure - ERP/CRM Style

## Main Navigation Menu

### 1. 🏠 Dashboard
- Overview Dashboard
- Project Dashboard
- Financial Dashboard
- Operations Dashboard
- Custom Dashboards

### 2. 📋 Master Data
#### 2.1 Company & Organization
- Companies (VHPT, VHSHREE)
- Branches/Units
- Departments
- Designations

#### 2.2 Material Master
- Material Master List
- Material Categories
- Units of Measurement
- HSN Codes
- Material Groups

#### 2.3 Warehouse Master
- Warehouse List
- Warehouse Types
- Warehouse Access Control
- Warehouse Managers

#### 2.4 Equipment Master
- Equipment List
- Equipment Types
- Equipment Categories
- Equipment Specifications

#### 2.5 Vendor Master
- Vendor List
- Vendor Types
- Vendor Categories
- Vendor Performance

#### 2.6 User & Role Master
- User Management
- Role Management
- Permission Management
- User Roles Assignment

#### 2.7 Project Master
- Project Templates
- Work Item Master
- Item Rates Master

### 3. 💼 Sales & CRM
#### 3.1 Lead Management
- Lead List
- Lead Details
- Lead Status Tracking
- Lead Conversion

#### 3.2 Quotation Management
- Quotation List
- Create Quotation
- Quotation Versions
- Quotation Approval
- Send Quotation

#### 3.3 Project Management
- Project List
- Create Project
- Project Details
- Project Timeline
- Project Status
- Project Contacts

### 4. 📝 Procurement
#### 4.1 Material Requisition
- Requisition List
- Create Requisition
- Requisition Approval
- Requisition Issue

#### 4.2 Purchase Orders
- PO List
- Create PO
- PO Approval
- PO Tracking

#### 4.3 Vendor Management
- Vendor List
- Vendor Registration
- Vendor Performance
- Vendor Payments

### 5. 📦 Inventory Management
#### 5.1 Warehouse Operations
- Warehouse List
- Stock Overview
- Stock Movements
- Stock Valuation

#### 5.2 Store Transactions
- GRN (Good Receipt Note)
  - GRN List
  - Create GRN
  - GRN Approval
  - GRN Print
- STN (Store Transfer Note)
  - STN List
  - Create STN
  - STN Approval
  - Inter-warehouse Transfer
- SRN (Store Requisition Note)
  - SRN List
  - Create SRN
  - SRN Approval
  - Material Issue

#### 5.3 Inventory Reports
- Stock Report
- Stock Movement Report
- Low Stock Alert
- Stock Valuation Report
- Material Consumption Report

### 6. 🏗️ Operations
#### 6.1 Work Orders
- Work Order List
- Create Work Order
- Work Order Details
- Work Order Items
- Work Order Status

#### 6.2 Daily Progress Report (DPR)
- DPR List
- Create DPR
- DPR Details
- DPR Approval
- DPR History

#### 6.3 Manpower Management
- Manpower Report
- Attendance Tracking
- Worker Count by Type
- Hajri System (1, 1.5, 2)

#### 6.4 Bar Bending Schedule
- BBS List
- Create BBS
- BBS Approval
- Steel Quantity Tracking

#### 6.5 Equipment Management
- Equipment List
- Equipment Rental
- Rental Tracking
- Breakdown Reporting
- Breakdown Deductions
- Equipment Utilization

#### 6.6 Material Consumption
- Consumption Entry
- Consumption Report
- Material vs Budget

### 7. 💰 Finance
#### 7.1 Expense Management
- Expense List
- Create Expense
- Expense Categories
- Expense Approval (3-level)
- Expense Reports

#### 7.2 Invoicing
- Invoice List
- Create Invoice
- Invoice Approval
- Payment Tracking

#### 7.3 Payments
- Payment Vouchers
- Vendor Payments
- Payment Reports

#### 7.4 Financial Reports
- Project Financial Summary
- Expense Report
- Profit & Loss
- Budget vs Actual

### 8. 📄 Documents
#### 8.1 Drawing Management
- Drawing List
- Upload Drawing
- Drawing Viewer
- Panel Marking
- Panel Progress Tracking
- Drawing Versions

#### 8.2 Document Management
- Document Library
- Contract Documents
- PO/WO Documents
- Project Documents

#### 8.3 Photo Gallery
- Project Photos
- Site Photos
- Progress Photos

### 9. 📊 Reports & Analytics
#### 9.1 Project Reports
- Project Status Report
- Project Progress Report
- Project Financial Report
- Project Timeline Report

#### 9.2 Material Reports
- Material Consumption Report
- Material Requisition Report
- Stock Report
- Material Cost Report

#### 9.3 Operations Reports
- DPR Summary Report
- Manpower Report
- Equipment Utilization Report
- Equipment Breakdown Report

#### 9.4 Financial Reports
- Expense Report
- Project Cost Report
- Vendor Payment Report
- Profitability Report

#### 9.5 Custom Reports
- Report Builder
- Scheduled Reports
- Report Export (Excel/PDF)

### 10. ⚙️ Administration
#### 10.1 User Management
- User List
- Create User
- User Roles
- User Permissions
- User Activity

#### 10.2 Role Management
- Role List
- Create Role
- Role Permissions
- Role Assignment

#### 10.3 System Settings
- Company Settings
- Warehouse Settings
- Email Settings
- SMS Settings
- Notification Settings
- System Configuration

#### 10.4 Audit & Logs
- Audit Log
- User Activity Log
- System Log
- Error Log

#### 10.5 Data Management
- Data Backup
- Data Export
- Data Import
- Data Cleanup

## Menu Access Control

Each menu item will have:
- **Permission Check**: Based on user role
- **Visibility**: Show/hide based on permissions
- **Action Permissions**: Create, Read, Update, Delete, Approve
- **Data Filtering**: Company-wise, Warehouse-wise, Project-wise

## Responsive Menu Structure

### Desktop View:
- Left sidebar with collapsible menu groups
- Top navigation bar with quick actions
- Breadcrumb navigation

### Mobile View:
- Bottom navigation bar (main modules)
- Hamburger menu for sub-modules
- Swipe gestures for navigation

