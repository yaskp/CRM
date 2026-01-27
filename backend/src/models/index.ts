// Import all models
import User from './User'
import Company from './Company'
import CompanyBranch from './CompanyBranch'
import Role from './Role'
import Permission from './Permission'
import Project from './Project'
import ProjectDetails from './ProjectDetails'
import ProjectContact from './ProjectContact'
import ProjectDocument from './ProjectDocument'
import ProjectMilestone from './ProjectMilestone'
import ProjectBuilding from './ProjectBuilding'
import ProjectFloor from './ProjectFloor'
import ProjectZone from './ProjectZone'
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
import Client from './Client'
import ClientGroup from './ClientGroup'
import ClientContact from './ClientContact'
import Annexure from './Annexure'
import WorkItemType from './WorkItemType'
import ProjectBOQ from './ProjectBOQ'
import ProjectBOQItem from './ProjectBOQItem'
import InventoryLedger from './InventoryLedger'
import State from './State'
import BudgetHead from './BudgetHead'
import ProjectBudget from './ProjectBudget'
import WorkerCategory from './WorkerCategory'
import WorkTemplate from './WorkTemplate'
import WorkTemplateItem from './WorkTemplateItem'

// Define associations
InventoryLedger.belongsTo(Material, { foreignKey: 'material_id', as: 'material' })
InventoryLedger.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' })
InventoryLedger.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
InventoryLedger.belongsTo(StoreTransaction, { foreignKey: 'transaction_id', as: 'transaction' })
InventoryLedger.belongsTo(WorkItemType, { foreignKey: 'work_item_type_id', as: 'workItemType' })

User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' })
Company.hasMany(User, { foreignKey: 'company_id', as: 'users' })

Project.belongsTo(User, { foreignKey: 'created_by', as: 'creator' })
Project.belongsTo(Company, { foreignKey: 'company_id', as: 'company' })
Company.hasMany(Project, { foreignKey: 'company_id', as: 'projects' })

Lead.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
Project.hasMany(Lead, { foreignKey: 'project_id', as: 'leads' })

Project.hasMany(ProjectBuilding, { foreignKey: 'project_id', as: 'buildings' })
ProjectBuilding.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
ProjectBuilding.hasMany(ProjectFloor, { foreignKey: 'building_id', as: 'floors' })
ProjectFloor.belongsTo(ProjectBuilding, { foreignKey: 'building_id', as: 'building' })
ProjectFloor.hasMany(ProjectZone, { foreignKey: 'floor_id', as: 'zones' })
ProjectZone.belongsTo(ProjectFloor, { foreignKey: 'floor_id', as: 'floor' })

ProjectBuilding.belongsTo(WorkItemType, { foreignKey: 'work_item_type_id', as: 'workItemType' })
ProjectZone.belongsTo(WorkItemType, { foreignKey: 'work_item_type_id', as: 'workItemType' })

// Project BOQ
Project.hasMany(ProjectBOQ, { foreignKey: 'project_id', as: 'boqs' })
ProjectBOQ.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
ProjectBOQ.belongsTo(User, { foreignKey: 'created_by', as: 'creator' })
ProjectBOQ.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' })
ProjectBOQ.hasMany(ProjectBOQItem, { foreignKey: 'boq_id', as: 'items' })
ProjectBOQItem.belongsTo(ProjectBOQ, { foreignKey: 'boq_id', as: 'boq' })
ProjectBOQItem.belongsTo(Material, { foreignKey: 'material_id', as: 'material' })
ProjectBOQItem.belongsTo(WorkItemType, { foreignKey: 'work_item_type_id', as: 'workItemType' })
ProjectBOQItem.belongsTo(ProjectBuilding, { foreignKey: 'building_id', as: 'building' })
ProjectBOQItem.belongsTo(ProjectFloor, { foreignKey: 'floor_id', as: 'floor' })
ProjectBOQItem.belongsTo(ProjectZone, { foreignKey: 'zone_id', as: 'zone' })

Lead.belongsTo(Client, { foreignKey: 'client_id', as: 'client' })
Client.hasMany(Lead, { foreignKey: 'client_id', as: 'leads' })

Quotation.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' })
Quotation.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
Project.hasMany(Quotation, { foreignKey: 'project_id', as: 'quotations' })
Quotation.belongsTo(User, { foreignKey: 'created_by', as: 'creator' })
Quotation.belongsTo(Annexure, { foreignKey: 'annexure_id', as: 'annexure' })
Lead.hasMany(Quotation, { foreignKey: 'lead_id', as: 'quotations' })

QuotationItem.belongsTo(Quotation, { foreignKey: 'quotation_id', as: 'quotation' })
Quotation.hasMany(QuotationItem, { foreignKey: 'quotation_id', as: 'items' })

WorkOrder.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
Project.hasMany(WorkOrder, { foreignKey: 'project_id', as: 'workOrders' })

WorkOrderItem.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' })
WorkOrder.hasMany(WorkOrderItem, { foreignKey: 'work_order_id', as: 'items' })

Warehouse.belongsTo(Company, { foreignKey: 'company_id', as: 'company' })
Warehouse.belongsTo(User, { foreignKey: 'warehouse_manager_id', as: 'manager' })
Warehouse.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
Company.hasMany(Warehouse, { foreignKey: 'company_id', as: 'warehouses' })
Project.hasMany(Warehouse, { foreignKey: 'project_id', as: 'siteWarehouses' })

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
StoreTransactionItem.belongsTo(PurchaseOrderItem, { foreignKey: 'po_item_id', as: 'poItem' })
StoreTransactionItem.belongsTo(WorkItemType, { foreignKey: 'work_item_type_id', as: 'workItemType' })
StoreTransaction.belongsTo(ProjectBuilding, { foreignKey: 'to_building_id', as: 'toBuilding' })
StoreTransaction.belongsTo(ProjectFloor, { foreignKey: 'to_floor_id', as: 'toFloor' })
StoreTransaction.belongsTo(ProjectZone, { foreignKey: 'to_zone_id', as: 'toZone' })
StoreTransaction.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id', as: 'purchase_order' })
StoreTransaction.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' })
StoreTransaction.belongsTo(Project, { foreignKey: 'from_project_id', as: 'source_project' })
StoreTransaction.belongsTo(Project, { foreignKey: 'to_project_id', as: 'destination_project' })
StoreTransaction.belongsTo(DrawingPanel, { foreignKey: 'drawing_panel_id', as: 'drawingPanel' })

// Material Requisitions
MaterialRequisition.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
MaterialRequisition.belongsTo(Warehouse, { foreignKey: 'from_warehouse_id', as: 'warehouse' })
MaterialRequisition.belongsTo(User, { foreignKey: 'requested_by', as: 'requester' })
MaterialRequisition.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' })
MaterialRequisition.hasMany(MaterialRequisitionItem, { foreignKey: 'requisition_id', as: 'items' })
MaterialRequisitionItem.belongsTo(MaterialRequisition, { foreignKey: 'requisition_id', as: 'requisition' })
MaterialRequisitionItem.belongsTo(Material, { foreignKey: 'material_id', as: 'material' })
MaterialRequisitionItem.belongsTo(ProjectBOQItem, { foreignKey: 'boq_item_id', as: 'boqItem' })

// DPR
DailyProgressReport.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
DailyProgressReport.belongsTo(User, { foreignKey: 'created_by', as: 'creator' })
DailyProgressReport.hasMany(ManpowerReport, { foreignKey: 'dpr_id', as: 'manpower' })
ManpowerReport.belongsTo(DailyProgressReport, { foreignKey: 'dpr_id', as: 'dpr' })
DailyProgressReport.belongsTo(ProjectBuilding, { foreignKey: 'building_id', as: 'building' })
DailyProgressReport.belongsTo(ProjectFloor, { foreignKey: 'floor_id', as: 'floor' })
DailyProgressReport.belongsTo(ProjectZone, { foreignKey: 'zone_id', as: 'zone' })
DailyProgressReport.belongsTo(WorkItemType, { foreignKey: 'work_item_type_id', as: 'workItemType' })
DailyProgressReport.belongsTo(DrawingPanel, { foreignKey: 'drawing_panel_id', as: 'panel' })
DrawingPanel.hasMany(DailyProgressReport, { foreignKey: 'drawing_panel_id', as: 'dprRecords' })

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
DrawingPanel.hasMany(StoreTransaction, { foreignKey: 'drawing_panel_id', as: 'consumptions' })
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
PurchaseOrder.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' })
PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'po_id', as: 'items' })
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'po_id', as: 'purchaseOrder' })
PurchaseOrderItem.belongsTo(Material, { foreignKey: 'material_id', as: 'material' })
PurchaseOrderItem.belongsTo(ProjectBOQItem, { foreignKey: 'boq_item_id', as: 'boqItem' })
PurchaseOrder.belongsTo(Annexure, { foreignKey: 'annexure_id', as: 'annexure' })
Annexure.hasMany(PurchaseOrder, { foreignKey: 'annexure_id', as: 'purchaseOrders' })

Project.hasMany(PurchaseOrder, { foreignKey: 'project_id', as: 'purchaseOrders' })
Vendor.hasMany(PurchaseOrder, { foreignKey: 'vendor_id', as: 'purchaseOrders' })
User.hasMany(PurchaseOrder, { foreignKey: 'created_by', as: 'createdPurchaseOrders' })
Warehouse.hasMany(PurchaseOrder, { foreignKey: 'warehouse_id', as: 'purchaseOrders' })

// Client Groups and Clients
Client.belongsTo(ClientGroup, { foreignKey: 'client_group_id', as: 'group' })
ClientGroup.hasMany(Client, { foreignKey: 'client_group_id', as: 'clients' })

Client.hasMany(ClientContact, { foreignKey: 'client_id', as: 'contacts' })
ClientContact.belongsTo(Client, { foreignKey: 'client_id', as: 'client' })

Project.belongsTo(Client, { foreignKey: 'client_id', as: 'client' })
Client.hasMany(Project, { foreignKey: 'client_id', as: 'projects' })


// Budgeting
BudgetHead.hasMany(BudgetHead, { foreignKey: 'parent_id', as: 'children' })
BudgetHead.belongsTo(BudgetHead, { foreignKey: 'parent_id', as: 'parent' })

Project.hasMany(ProjectBudget, { foreignKey: 'project_id', as: 'budgets' })
ProjectBudget.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })

BudgetHead.hasMany(ProjectBudget, { foreignKey: 'budget_head_id', as: 'projectBudgets' })
ProjectBudget.belongsTo(BudgetHead, { foreignKey: 'budget_head_id', as: 'head' })

Material.belongsTo(BudgetHead, { foreignKey: 'budget_head_id', as: 'budgetHead' })
BudgetHead.hasMany(Material, { foreignKey: 'budget_head_id', as: 'materials' })

Expense.belongsTo(BudgetHead, { foreignKey: 'budget_head_id', as: 'budgetHead' })
BudgetHead.hasMany(Expense, { foreignKey: 'budget_head_id', as: 'expenses' })

// Work Templates
WorkTemplate.hasMany(WorkTemplateItem, { foreignKey: 'template_id', as: 'items' })
WorkTemplateItem.belongsTo(WorkTemplate, { foreignKey: 'template_id', as: 'template' })
WorkTemplateItem.belongsTo(WorkItemType, { foreignKey: 'work_item_type_id', as: 'workItemType' })
WorkItemType.hasMany(WorkTemplateItem, { foreignKey: 'work_item_type_id', as: 'templateItems' })

export {
  User,
  Company,
  CompanyBranch,
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
  Client,
  ClientGroup,
  ClientContact,
  Annexure,
  ProjectBuilding,
  ProjectFloor,
  ProjectZone,
  WorkItemType,
  ProjectBOQ,
  ProjectBOQItem,
  InventoryLedger,
  State,
  BudgetHead,
  ProjectBudget,
  WorkerCategory,
  WorkTemplate,
  WorkTemplateItem
}

