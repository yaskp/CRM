// Import all models
import User from './User'
import Company from './Company'
import Role from './Role'
import Permission from './Permission'
import Project from './Project'
import Lead from './Lead'
import Quotation from './Quotation'
import WorkOrder from './WorkOrder'
import WorkOrderItem from './WorkOrderItem'
import Material from './Material'
import Warehouse from './Warehouse'

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

WorkOrder.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
Project.hasMany(WorkOrder, { foreignKey: 'project_id', as: 'workOrders' })

WorkOrderItem.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' })
WorkOrder.hasMany(WorkOrderItem, { foreignKey: 'work_order_id', as: 'items' })

Warehouse.belongsTo(Company, { foreignKey: 'company_id', as: 'company' })
Warehouse.belongsTo(User, { foreignKey: 'warehouse_manager_id', as: 'manager' })
Company.hasMany(Warehouse, { foreignKey: 'company_id', as: 'warehouses' })

// User-Role associations (Many-to-Many)
User.belongsToMany(Role, { through: 'user_roles', foreignKey: 'user_id', as: 'roles' })
Role.belongsToMany(User, { through: 'user_roles', foreignKey: 'role_id', as: 'users' })

// Role-Permission associations (Many-to-Many)
Role.belongsToMany(Permission, { through: 'role_permissions', foreignKey: 'role_id', as: 'permissions' })
Permission.belongsToMany(Role, { through: 'role_permissions', foreignKey: 'permission_id', as: 'roles' })

export {
  User,
  Company,
  Role,
  Permission,
  Project,
  Lead,
  Quotation,
  WorkOrder,
  WorkOrderItem,
  Material,
  Warehouse,
}

