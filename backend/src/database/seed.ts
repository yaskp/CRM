import dotenv from 'dotenv'
dotenv.config()

import { sequelize } from './connection'
import '../models/index' // Import all models to set up associations
import Company from '../models/Company'
import Role from '../models/Role'
import Permission from '../models/Permission'
import User from '../models/User'
import { Op } from 'sequelize'

const seedDatabase = async () => {
  try {
    await sequelize.authenticate()
    console.log('Database connection established for seeding')

    // Create Companies
    const [vhptCompany, vhshreeCompany] = await Company.bulkCreate(
      [
        { name: 'VHPT', code: 'VHPT' },
        { name: 'VHSHREE', code: 'VHSHREE' },
      ],
      { ignoreDuplicates: true }
    )
    console.log('Companies created')

    // Create Permissions
    const permissions = [
      // Projects
      { name: 'projects.create', module: 'projects', action: 'create', description: 'Create projects' },
      { name: 'projects.read', module: 'projects', action: 'read', description: 'View projects' },
      { name: 'projects.update', module: 'projects', action: 'update', description: 'Update projects' },
      { name: 'projects.delete', module: 'projects', action: 'delete', description: 'Delete projects' },
      
      // Leads
      { name: 'leads.create', module: 'leads', action: 'create', description: 'Create leads' },
      { name: 'leads.read', module: 'leads', action: 'read', description: 'View leads' },
      { name: 'leads.update', module: 'leads', action: 'update', description: 'Update leads' },
      
      // Quotations
      { name: 'quotations.create', module: 'quotations', action: 'create', description: 'Create quotations' },
      { name: 'quotations.read', module: 'quotations', action: 'read', description: 'View quotations' },
      { name: 'quotations.update', module: 'quotations', action: 'update', description: 'Update quotations' },
      
      // Materials
      { name: 'materials.create', module: 'materials', action: 'create', description: 'Create materials' },
      { name: 'materials.read', module: 'materials', action: 'read', description: 'View materials' },
      { name: 'materials.update', module: 'materials', action: 'update', description: 'Update materials' },
      
      // Warehouses
      { name: 'warehouses.create', module: 'warehouses', action: 'create', description: 'Create warehouses' },
      { name: 'warehouses.read', module: 'warehouses', action: 'read', description: 'View warehouses' },
      { name: 'warehouses.update', module: 'warehouses', action: 'update', description: 'Update warehouses' },
      
      // Store Transactions
      { name: 'store.create', module: 'store', action: 'create', description: 'Create store transactions' },
      { name: 'store.read', module: 'store', action: 'read', description: 'View store transactions' },
      { name: 'store.approve', module: 'store', action: 'approve', description: 'Approve store transactions' },
      
      // DPR
      { name: 'dpr.create', module: 'dpr', action: 'create', description: 'Create DPR' },
      { name: 'dpr.read', module: 'dpr', action: 'read', description: 'View DPR' },
      { name: 'dpr.update', module: 'dpr', action: 'update', description: 'Update DPR' },
      
      // Expenses
      { name: 'expenses.create', module: 'expenses', action: 'create', description: 'Create expenses' },
      { name: 'expenses.read', module: 'expenses', action: 'read', description: 'View expenses' },
      { name: 'expenses.approve', module: 'expenses', action: 'approve', description: 'Approve expenses' },
      
      // Equipment
      { name: 'equipment.create', module: 'equipment', action: 'create', description: 'Create equipment' },
      { name: 'equipment.read', module: 'equipment', action: 'read', description: 'View equipment' },
      { name: 'equipment.update', module: 'equipment', action: 'update', description: 'Update equipment' },
    ]

    await Permission.bulkCreate(permissions, { ignoreDuplicates: true })
    console.log('Permissions created')

    // Create Roles
    const [adminRole, siteEngineerRole, storeManagerRole, operationManagerRole, headAccountsRole] = await Role.bulkCreate(
      [
        { name: 'Admin', description: 'System Administrator', is_system_role: true },
        { name: 'Site Engineer', description: 'Site Engineer', is_system_role: true },
        { name: 'Store Manager', description: 'Store Manager', is_system_role: true },
        { name: 'Operation Manager', description: 'Operation Manager', is_system_role: true },
        { name: 'Head/Accounts', description: 'Head/Accounts', is_system_role: true },
      ],
      { ignoreDuplicates: true }
    )
    console.log('Roles created')

    // Reload roles to get their IDs
    const roles = await Role.findAll()
    const adminRoleReloaded = roles.find(r => r.name === 'Admin')
    const siteEngineerRoleReloaded = roles.find(r => r.name === 'Site Engineer')
    const storeManagerRoleReloaded = roles.find(r => r.name === 'Store Manager')
    const operationManagerRoleReloaded = roles.find(r => r.name === 'Operation Manager')
    const headAccountsRoleReloaded = roles.find(r => r.name === 'Head/Accounts')

    // Assign permissions to roles
    const allPermissions = await Permission.findAll()
    const permissionMap = new Map(allPermissions.map((p) => [p.name, p]))

    // Admin gets all permissions
    if (adminRoleReloaded && allPermissions.length > 0) {
      await adminRoleReloaded.setPermissions(allPermissions)
    }

    // Site Engineer permissions
    if (siteEngineerRoleReloaded) {
      const siteEngineerPerms = [
        'projects.read',
        'leads.create',
        'leads.read',
        'dpr.create',
        'dpr.read',
        'dpr.update',
        'expenses.create',
        'expenses.read',
        'materials.read',
        'warehouses.read',
      ].map((name) => permissionMap.get(name)).filter(Boolean) as Permission[]
      if (siteEngineerPerms.length > 0) {
        await siteEngineerRoleReloaded.setPermissions(siteEngineerPerms)
      }
    }

    // Store Manager permissions
    if (storeManagerRoleReloaded) {
      const storeManagerPerms = [
        'materials.create',
        'materials.read',
        'materials.update',
        'warehouses.create',
        'warehouses.read',
        'warehouses.update',
        'store.create',
        'store.read',
        'store.approve',
        'expenses.approve',
        'projects.read',
      ].map((name) => permissionMap.get(name)).filter(Boolean) as Permission[]
      if (storeManagerPerms.length > 0) {
        await storeManagerRoleReloaded.setPermissions(storeManagerPerms)
      }
    }

    // Operation Manager permissions
    if (operationManagerRoleReloaded) {
      const operationManagerPerms = [
        'projects.read',
        'projects.update',
        'leads.read',
        'quotations.read',
        'dpr.read',
        'expenses.approve',
        'equipment.read',
        'equipment.update',
        'materials.read',
        'warehouses.read',
      ].map((name) => permissionMap.get(name)).filter(Boolean) as Permission[]
      if (operationManagerPerms.length > 0) {
        await operationManagerRoleReloaded.setPermissions(operationManagerPerms)
      }
    }

    // Head/Accounts permissions
    if (headAccountsRoleReloaded) {
      const headAccountsPerms = [
        'projects.read',
        'leads.read',
        'quotations.read',
        'expenses.read',
        'expenses.approve',
        'dpr.read',
        'equipment.read',
        'materials.read',
        'warehouses.read',
      ].map((name) => permissionMap.get(name)).filter(Boolean) as Permission[]
      if (headAccountsPerms.length > 0) {
        await headAccountsRoleReloaded.setPermissions(headAccountsPerms)
      }
    }

    console.log('Permissions assigned to roles')

    // Reload company to get ID
    const companiesReloaded = await Company.findAll()
    const vhptCompanyReloaded = companiesReloaded.find(c => c.code === 'VHPT')

    // Create default admin user
    const adminUser = await User.findOne({ where: { email: 'admin@crm.com' } })
    if (!adminUser && adminRoleReloaded && vhptCompanyReloaded) {
      const newAdmin = await User.create({
        employee_id: 'ADMIN001',
        name: 'System Administrator',
        email: 'admin@crm.com',
        password_hash: 'admin123', // Will be hashed by hook
        company_id: vhptCompanyReloaded.id,
        is_active: true,
      })
      await newAdmin.setRoles([adminRoleReloaded])
      console.log('Admin user created: admin@crm.com / admin123')
    }

    console.log('Database seeding completed successfully')
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  }
}

// Run seed
seedDatabase()
  .then(() => {
    console.log('Seeding completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seeding failed:', error)
    process.exit(1)
  })

export default seedDatabase

