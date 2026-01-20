// Import all models
import User from './User'
import Company from './Company'
import Role from './Role'
import Permission from './Permission'
import Project from './Project'
import ProjectDetails from './ProjectDetails'
import ProjectContact from './ProjectContact'
import ProjectDocument from './ProjectDocument'
import ProjectMilestone from './ProjectMilestone'
import Lead from './Lead'
import Quotation from './Quotation'
import QuotationItem from './QuotationItem'
import WorkOrder from './WorkOrder'
import PurchaseOrder from './PurchaseOrder'
import WorkOrderItem from './WorkOrderItem'
import Material from './Material'
import Warehouse from './Warehouse'
import Inventory from './Inventory'
import Vendor from './Vendor'
import VendorType from './VendorType'
import ProjectVendor from './ProjectVendor'
import StoreTransaction from './StoreTransaction'
import StoreTransactionItem from './StoreTransactionItem'
import MaterialRequisition from './MaterialRequisition'
import MaterialRequisitionItem from './MaterialRequisitionItem'
import DailyProgressReport from './DailyProgressReport'
import ManpowerReport from './ManpowerReport'
import BarBendingSchedule from './BarBendingSchedule'
import Equipment from './Equipment'
import EquipmentRental from './EquipmentRental'
import EquipmentBreakdown from './EquipmentBreakdown'
import Expense from './Expense'
import ExpenseApproval from './ExpenseApproval'
import Drawing from './Drawing'
import DrawingPanel from './DrawingPanel'
import PanelProgress from './PanelProgress'
import Notification from './Notification'
import UserRole from './UserRole'
import RolePermission from './RolePermission'

// Define associations
User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' })
Company.hasMany(User, { foreignKey: 'company_id', as: 'users' })

Project.belongsTo(User, { foreignKey: 'created_by', as: 'creator' })
Project.belongsTo(Company, { foreignKey: 'company_id', as: 'company' })
Company.hasMany(Project, { foreignKey: 'company_id', as: 'projects' })

Lead.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
Project.hasMany(Lead, { foreignKey: 'project_id', as: 'leads' })

Quotation.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' })
Quotation.belongsTo(User, { foreignKey: 'created_by', as: 'creator' })
Lead.hasMany(Quotation, { foreignKey: 'lead_id', as: 'quotations' })

QuotationItem.belongsTo(Quotation, { foreignKey: 'quotation_id', as: 'quotation' })
Quotation.hasMany(QuotationItem, { foreignKey: 'quotation_id', as: 'items' })

WorkOrder.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
Project.hasMany(WorkOrder, { foreignKey: 'project_id', as: 'workOrders' })

WorkOrderItem.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' })
WorkOrder.hasMany(WorkOrderItem, { foreignKey: 'work_order_id', as: 'items' })

Warehouse.belongsTo(Company, { foreignKey: 'company_id', as: 'company' })
Warehouse.belongsTo(User, { foreignKey: 'warehouse_manager_id', as: 'manager' })
Company.hasMany(Warehouse, { foreignKey: 'company_id', as: 'warehouses' })

// Project Contacts
Project.hasMany(ProjectContact, { foreignKey: 'project_id', as: 'contacts' })
ProjectContact.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })

// Project Details
Project.hasOne(ProjectDetails, { foreignKey: 'project_id', as: 'details' })
ProjectDetails.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })

// Project Documents
Project.hasMany(ProjectDocument, { foreignKey: 'project_id', as: 'documents' })
ProjectDocument.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })

// Project Milestones
Project.hasMany(ProjectMilestone, { foreignKey: 'project_id', as: 'milestones' })
ProjectMilestone.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })

// Vendors
Project.belongsToMany(Vendor, { through: ProjectVendor, foreignKey: 'project_id', as: 'vendors' })
Vendor.belongsToMany(Project, { through: ProjectVendor, foreignKey: 'vendor_id', as: 'projects' })
ProjectVendor.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
ProjectVendor.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' })

// Inventory
Inventory.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' })
Inventory.belongsTo(Material, { foreignKey: 'material_id', as: 'material' })
Warehouse.hasMany(Inventory, { foreignKey: 'warehouse_id', as: 'inventory' })
Material.hasMany(Inventory, { foreignKey: 'material_id', as: 'inventory' })

// Store Transactions
StoreTransaction.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' })
StoreTransaction.belongsTo(Warehouse, { foreignKey: 'to_warehouse_id', as: 'toWarehouse' })
StoreTransaction.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
StoreTransaction.belongsTo(User, { foreignKey: 'created_by', as: 'creator' })
StoreTransaction.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' })
StoreTransaction.hasMany(StoreTransactionItem, { foreignKey: 'transaction_id', as: 'items' })
StoreTransactionItem.belongsTo(StoreTransaction, { foreignKey: 'transaction_id', as: 'transaction' })
StoreTransactionItem.belongsTo(Material, { foreignKey: 'material_id', as: 'material' })

// Material Requisitions
MaterialRequisition.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
MaterialRequisition.belongsTo(Warehouse, { foreignKey: 'from_warehouse_id', as: 'warehouse' })
MaterialRequisition.belongsTo(User, { foreignKey: 'requested_by', as: 'requester' })
MaterialRequisition.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' })
MaterialRequisition.hasMany(MaterialRequisitionItem, { foreignKey: 'requisition_id', as: 'items' })
MaterialRequisitionItem.belongsTo(MaterialRequisition, { foreignKey: 'requisition_id', as: 'requisition' })
MaterialRequisitionItem.belongsTo(Material, { foreignKey: 'material_id', as: 'material' })

// DPR
DailyProgressReport.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
DailyProgressReport.belongsTo(User, { foreignKey: 'created_by', as: 'creator' })
DailyProgressReport.hasMany(ManpowerReport, { foreignKey: 'dpr_id', as: 'manpower' })
ManpowerReport.belongsTo(DailyProgressReport, { foreignKey: 'dpr_id', as: 'dpr' })

// Bar Bending Schedule
BarBendingSchedule.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
BarBendingSchedule.belongsTo(User, { foreignKey: 'created_by', as: 'creator' })
Project.hasMany(BarBendingSchedule, { foreignKey: 'project_id', as: 'barBendingSchedules' })

// Equipment
Equipment.belongsTo(Vendor, { foreignKey: 'owner_vendor_id', as: 'ownerVendor' })
Equipment.hasMany(EquipmentRental, { foreignKey: 'equipment_id', as: 'rentals' })
EquipmentRental.belongsTo(Equipment, { foreignKey: 'equipment_id', as: 'equipment' })
EquipmentRental.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
EquipmentRental.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' })
EquipmentRental.hasMany(EquipmentBreakdown, { foreignKey: 'rental_id', as: 'breakdowns' })
EquipmentBreakdown.belongsTo(EquipmentRental, { foreignKey: 'rental_id', as: 'rental' })
EquipmentBreakdown.belongsTo(User, { foreignKey: 'reported_by', as: 'reporter' })

// Expenses
Expense.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
Expense.belongsTo(User, { foreignKey: 'submitted_by', as: 'submitter' })
Expense.hasMany(ExpenseApproval, { foreignKey: 'expense_id', as: 'approvals' })
ExpenseApproval.belongsTo(Expense, { foreignKey: 'expense_id', as: 'expense' })
ExpenseApproval.belongsTo(User, { foreignKey: 'approver_id', as: 'approver' })

// Drawings
Drawing.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
Drawing.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' })
Drawing.hasMany(DrawingPanel, { foreignKey: 'drawing_id', as: 'panels' })
DrawingPanel.belongsTo(Drawing, { foreignKey: 'drawing_id', as: 'drawing' })
DrawingPanel.belongsTo(User, { foreignKey: 'created_by', as: 'creator' })
DrawingPanel.hasMany(PanelProgress, { foreignKey: 'panel_id', as: 'progress' })
PanelProgress.belongsTo(DrawingPanel, { foreignKey: 'panel_id', as: 'panel' })
PanelProgress.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' })

// Notifications
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' })

// User-Role associations (Many-to-Many)
User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: 'user_id',
  as: 'roles'
})
Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: 'role_id',
  as: 'users'
})

// Role-Permission associations (Many-to-Many)
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'role_id',
  as: 'permissions'
})
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permission_id',
  as: 'roles'
})

import PurchaseOrderItem from './PurchaseOrderItem'

// ...

// Purchase Orders
PurchaseOrder.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
PurchaseOrder.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' })
PurchaseOrder.belongsTo(User, { foreignKey: 'created_by', as: 'creator' })
PurchaseOrder.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' })
PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'po_id', as: 'items' })
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'po_id', as: 'purchaseOrder' })
PurchaseOrderItem.belongsTo(Material, { foreignKey: 'material_id', as: 'material' })

Project.hasMany(PurchaseOrder, { foreignKey: 'project_id', as: 'purchaseOrders' })
Vendor.hasMany(PurchaseOrder, { foreignKey: 'vendor_id', as: 'purchaseOrders' })
User.hasMany(PurchaseOrder, { foreignKey: 'created_by', as: 'createdPurchaseOrders' })

export {
  User,
  Company,
  Role,
  Permission,
  Project,
  ProjectDetails,
  ProjectContact,
  ProjectDocument,
  ProjectMilestone,
  Lead,
  Quotation,
  WorkOrder,
  WorkOrderItem,
  Material,
  Warehouse,
  Inventory,
  Vendor,
  VendorType,
  ProjectVendor,
  StoreTransaction,
  StoreTransactionItem,
  MaterialRequisition,
  MaterialRequisitionItem,
  DailyProgressReport,
  ManpowerReport,
  BarBendingSchedule,
  Equipment,
  EquipmentRental,
  EquipmentBreakdown,
  Expense,
  ExpenseApproval,
  Drawing,
  DrawingPanel,
  PanelProgress,
  Notification,
  PurchaseOrder,
  PurchaseOrderItem,
  QuotationItem,
}

