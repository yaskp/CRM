import { useState, useEffect } from 'react'
import { Menu } from 'antd'
import type { MenuProps } from 'antd'
import {
  DashboardOutlined,
  DatabaseOutlined,
  WalletOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  ToolOutlined,
  BankOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  ContainerOutlined,
  ShopOutlined,
  NumberOutlined,
  LayoutOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

type MenuItem = Required<MenuProps>['items'][number]

// Helper function to check if user has permission
const hasPermission = (user: any, requiredPermissions: string[]): boolean => {
  if (!user) return false
  if (user.roles?.includes('Admin')) return true // Admin has access to everything
  if (requiredPermissions.length === 0) return true
  return requiredPermissions.some(perm => user.permissions?.includes(perm))
}

// Menu item permission mapping
const menuPermissions: Record<string, string[]> = {
  // Dashboard - everyone can access
  '/': [],

  // Master Data
  '/master/materials': ['materials.read'],
  '/master/warehouses': ['warehouses.read'],
  '/master/vendors': ['vendors.read'],
  '/master/equipment': ['equipment.read'],
  '/master/work-templates': ['master.work_templates'],
  '/master/units': ['master.units'],
  '/master/branches': ['master.branches'],
  '/master/annexures': ['master.annexures'],

  // Sales & CRM
  '/sales/leads': ['leads.read'],
  '/sales/quotations': ['quotations.read'],
  '/sales/clients': ['clients.read'],
  '/sales/projects': ['projects.read'],

  // Procurement
  '/procurement/requisitions': ['requisitions.read'],
  '/procurement/purchase-orders': ['purchase_orders.read'],
  '/procurement/vendors': ['vendors.read'],

  // Inventory
  '/inventory/grn': ['inventory.grn'],
  '/inventory/stn': ['inventory.stn'],
  '/inventory/srn': ['inventory.srn'],
  '/inventory/stock': ['inventory.stock'],
  '/inventory/dashboard': ['inventory.stock'],
  '/inventory/daily-work-log': ['dpr.read'],
  '/inventory/consumption/new': ['dpr.create'],
  '/inventory/adjustment/new': ['inventory.adjustment'],

  // Operations
  '/operations/work-orders': ['work_orders.read'],
  '/operations/dpr': ['dpr.read'],
  '/operations/bar-bending': ['bar_bending.read'],
  '/operations/equipment/rentals': ['equipment.read'],

  // Finance
  '/finance/expenses': ['expenses.read'],
  '/finance/transactions': ['finance.transactions'],
  '/finance/project-consumption': ['finance.reports'],
  '/finance/vendor-aging': ['finance.reports'],
  '/finance/approvals': ['requisitions.approve', 'expenses.approve', 'purchase_orders.approve'],

  // Documents
  '/drawings': ['drawings.read'],

  // Reports
  '/reports/project': ['projects.read'],
  '/reports/procurement-status': ['purchase_orders.read'],

  // Administration
  '/admin/users': ['admin.users'],
  '/admin/roles': ['admin.roles'],
  '/admin/settings': ['admin.settings'],
}

const MasterMenu = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { mode } = useTheme()

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  // Dashboard
  const dashboardMenu: MenuItem = {
    key: '/',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  }

  // Helper to filter menu children by permissions
  const filterMenuItems = (items: any[]): any[] => {
    return items.filter(item => {
      const requiredPermissions = menuPermissions[item.key] || []
      return hasPermission(user, requiredPermissions)
    })
  }

  // Master Data
  const masterDataChildren = filterMenuItems([
    {
      key: '/master/materials',
      icon: <ContainerOutlined />,
      label: 'Material Master',
    },
    {
      key: '/master/warehouses',
      icon: <ShopOutlined />,
      label: 'Warehouse Master',
    },
    {
      key: '/master/equipment',
      icon: <ToolOutlined />,
      label: 'Equipment Master',
    },
    {
      key: 'work-master-group',
      icon: <LayoutOutlined />,
      label: 'Work Master',
      children: filterMenuItems([
        {
          key: '/master/work-templates',
          label: 'Work Templates',
        }
      ])
    },
    {
      key: '/master/units',
      icon: <NumberOutlined />,
      label: 'Unit Master',
    },
    {
      key: '/master/branches',
      icon: <BankOutlined />,
      label: 'Billing Units',
    },
    {
      key: '/master/annexures',
      icon: <FileTextOutlined />,
      label: 'Annexure Master',
    },
  ])

  const masterDataMenu: MenuItem | null = masterDataChildren.length > 0 ? {
    key: 'master',
    icon: <DatabaseOutlined />,
    label: 'Master Data',
    children: masterDataChildren,
  } : null

  // Sales & CRM
  const salesChildren = filterMenuItems([
    {
      key: '/sales/leads',
      label: 'Lead Management',
    },
    {
      key: '/sales/clients',
      label: 'Client Management',
    },
    {
      key: '/sales/quotations',
      label: 'Quotation Management',
    },
    {
      key: '/sales/projects',
      label: 'Project Management',
    },
  ])

  const salesMenu: MenuItem | null = salesChildren.length > 0 ? {
    key: 'sales',
    icon: <WalletOutlined />,
    label: 'Sales & CRM',
    children: salesChildren,
  } : null

  // Procurement
  const procurementChildren = filterMenuItems([
    {
      key: '/procurement/requisitions',
      label: 'Material Requisition',
    },
    {
      key: '/procurement/purchase-orders',
      label: 'Purchase Orders',
    },
    {
      key: '/master/vendors',
      label: 'Vendor Management',
    },
  ])

  const procurementMenu: MenuItem | null = procurementChildren.length > 0 ? {
    key: 'procurement',
    icon: <ShoppingCartOutlined />,
    label: 'Procurement',
    children: procurementChildren,
  } : null

  // Inventory Management
  const inventoryChildren = filterMenuItems([
    {
      key: '/inventory/dashboard',
      label: 'Inventory Dashboard',
    },
    {
      key: '/inventory/grn',
      label: 'GRN (Good Receipt)',
    },
    {
      key: '/inventory/stn',
      label: 'STN (Transfer Note)',
    },
    {
      key: '/inventory/srn',
      label: 'SRN (Requisition)',
    },
    {
      key: '/inventory/stock',
      label: 'Stock Report',
    },
    {
      key: '/inventory/adjustment/new',
      label: 'Stock Adjustment',
    },
  ])

  const inventoryMenu: MenuItem | null = inventoryChildren.length > 0 ? {
    key: 'inventory',
    icon: <ShoppingOutlined />,
    label: 'Inventory',
    children: inventoryChildren,
  } : null

  // Operations
  const operationsChildren = filterMenuItems([
    {
      key: '/operations/work-orders',
      label: 'Work Orders',
    },
    {
      key: '/operations/dpr',
      label: 'Daily Progress Report',
    },
    {
      key: '/operations/bar-bending',
      label: 'Bar Bending Schedule',
    },

    {
      key: '/operations/equipment/rentals',
      label: 'Equipment Rentals',
    },
  ])

  const operationsMenu: MenuItem | null = operationsChildren.length > 0 ? {
    key: 'operations',
    icon: <ToolOutlined />,
    label: 'Operations',
    children: operationsChildren,
  } : null

  // Finance
  const financeChildren = filterMenuItems([
    {
      key: '/finance/expenses',
      label: 'Expense Management',
    },
    {
      key: '/finance/transactions',
      label: 'Payments & Receipts',
    },
    {
      key: '/finance/project-consumption',
      label: 'Project Consumption',
    },
    {
      key: '/finance/vendor-aging',
      label: 'Vendor Aging Report',
    },
  ])

  const financeMenu: MenuItem | null = financeChildren.length > 0 ? {
    key: 'finance',
    icon: <BankOutlined />,
    label: 'Finance',
    children: financeChildren,
  } : null

  // Documents
  const documentsChildren = filterMenuItems([
    {
      key: '/drawings',
      label: 'Drawing Management',
    },
  ])

  const documentsMenu: MenuItem | null = documentsChildren.length > 0 ? {
    key: 'documents',
    icon: <FileTextOutlined />,
    label: 'Documents',
    children: documentsChildren,
  } : null

  // Reports
  const reportsChildren = filterMenuItems([
    {
      key: '/reports/project',
      label: 'Project Reports',
    },
    {
      key: '/reports/procurement-status',
      label: 'Procurement Status',
    },
  ])

  const reportsMenu: MenuItem | null = reportsChildren.length > 0 ? {
    key: 'reports',
    icon: <BarChartOutlined />,
    label: 'Reports & Analytics',
    children: reportsChildren,
  } : null

  // Administration - only for Admin
  const adminChildren = filterMenuItems([
    {
      key: '/admin/users',
      label: 'User Management',
    },
    {
      key: '/admin/roles',
      label: 'Role Management',
    },
    {
      key: '/admin/settings',
      label: 'System Settings',
    },
  ])

  const adminMenu: MenuItem | null = adminChildren.length > 0 ? {
    key: 'administration',
    icon: <SettingOutlined />,
    label: 'Administration',
    children: adminChildren,
  } : null

  // Build menu items array, filtering out null items
  // Order follows construction workflow: Pre-Sales → Procurement → Execution → Finance → Admin
  const allMenuItems: (MenuItem | null)[] = [
    dashboardMenu,
    salesMenu,           // Pre-Sales: Lead → Client → Quotation → Project
    procurementMenu,     // Procurement: Requisition → PO → Vendors
    inventoryMenu,       // Warehouse: GRN → STN → SRN
    operationsMenu,      // Site Execution: Work Orders → DPR → BBS
    financeMenu,         // Financial: Expenses → Consumption
    documentsMenu,       // Documentation: Drawings
    reportsMenu,         // Analytics: Reports
    masterDataMenu,      // Reference Data: Materials, Warehouses, Equipment, etc.
    adminMenu,           // System Settings: Users, Roles, Settings
  ]

  const menuItems = allMenuItems.filter((item): item is MenuItem => item !== null)

  // Get selected keys based on current path
  const getSelectedKeys = () => {
    const path = location.pathname
    if (path === '/') return ['/']

    // For nested routes, select parent menu
    if (path.startsWith('/master')) return ['master']
    if (path.startsWith('/sales')) return ['sales']
    if (path.startsWith('/procurement')) return ['procurement']
    if (path.startsWith('/inventory')) return ['inventory']
    if (path.startsWith('/operations')) return ['operations']
    if (path.startsWith('/finance')) return ['finance']
    if (path.startsWith('/documents')) return ['documents']
    if (path.startsWith('/reports')) return ['reports']
    if (path.startsWith('/admin')) return ['administration']

    return [path]
  }

  const getOpenKeys = () => {
    const path = location.pathname
    if (path.startsWith('/master')) return ['master']
    if (path.startsWith('/sales')) return ['sales']
    if (path.startsWith('/procurement')) return ['procurement']
    if (path.startsWith('/inventory')) return ['inventory']
    if (path.startsWith('/operations')) return ['operations']
    if (path.startsWith('/finance')) return ['finance']
    if (path.startsWith('/drawings')) return ['documents']
    if (path.startsWith('/documents')) return ['documents']
    if (path.startsWith('/reports')) return ['reports']
    if (path.startsWith('/admin')) return ['administration']
    return []
  }



  const rootSubmenuKeys = ['master', 'sales', 'procurement', 'inventory', 'operations', 'finance', 'documents', 'reports', 'administration']

  const [openKeys, setOpenKeys] = useState<string[]>(getOpenKeys())

  useEffect(() => {
    setOpenKeys(getOpenKeys())
  }, [location.pathname])

  const onOpenChange: MenuProps['onOpenChange'] = (keys) => {
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1)
    if (latestOpenKey && rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
      setOpenKeys(keys)
    } else {
      setOpenKeys(latestOpenKey ? [latestOpenKey] : [])
    }
  }

  return (
    <Menu
      theme={mode}
      mode="inline"
      selectedKeys={getSelectedKeys()}
      openKeys={openKeys}
      onOpenChange={onOpenChange}
      items={menuItems}
      onClick={handleMenuClick}
      style={{ borderRight: 0 }}
    />
  )
}

export default MasterMenu

