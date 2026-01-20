import { useState, useEffect } from 'react'
import { Menu } from 'antd'
import type { MenuProps } from 'antd'
import {
  DashboardOutlined,
  DatabaseOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  ToolOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  ContainerOutlined,
  ShopOutlined,
  TeamOutlined,
  NumberOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

type MenuItem = Required<MenuProps>['items'][number]

// Helper function to check if user has permission
const hasPermission = (userRoles: string[], requiredRoles: string[]): boolean => {
  if (requiredRoles.length === 0) return true
  if (userRoles.includes('Admin')) return true // Admin has access to everything
  return requiredRoles.some(role => userRoles.includes(role))
}

// Menu item permission mapping
const menuPermissions: Record<string, string[]> = {
  // Dashboard - everyone can access
  '/': [],

  // Master Data
  '/master/materials': ['Admin', 'Store Manager'],
  '/master/warehouses': ['Admin', 'Store Manager'],
  '/master/vendors': ['Admin', 'Operation Manager', 'Store Manager'],
  '/master/equipment': ['Admin', 'Operation Manager'],
  '/master/work-item-types': ['Admin', 'Operation Manager'],
  '/master/units': ['Admin', 'Operation Manager', 'Store Manager'],
  '/master/users': ['Admin'],
  '/master/roles': ['Admin'],

  // Sales & CRM
  '/sales/leads': ['Admin', 'Site Engineer', 'Operation Manager'],
  '/sales/quotations': ['Admin', 'Operation Manager'],
  '/sales/projects': ['Admin', 'Site Engineer', 'Operation Manager', 'Store Manager', 'Head/Accounts'],

  // Procurement
  '/procurement/requisitions': ['Admin', 'Site Engineer', 'Store Manager'],
  '/procurement/purchase-orders': ['Admin', 'Operation Manager', 'Store Manager', 'Project Manager', 'Site Engineer'],
  '/procurement/vendors': ['Admin', 'Operation Manager'],

  // Inventory
  '/inventory/grn': ['Admin', 'Store Manager'],

  // Operations
  '/operations/work-orders': ['Admin', 'Operation Manager'],
  '/operations/dpr': ['Admin', 'Site Engineer', 'Operation Manager'],
  '/operations/bar-bending': ['Admin', 'Site Engineer', 'Operation Manager'],
  '/operations/equipment': ['Admin', 'Operation Manager'],
  '/inventory/stn': ['Admin', 'Store Manager'],
  '/inventory/srn': ['Admin', 'Store Manager'],
  '/inventory/stock': ['Admin', 'Store Manager', 'Operation Manager', 'Site Engineer', 'Head/Accounts'],

  // Finance
  '/finance/expenses': ['Admin', 'Site Engineer', 'Operation Manager', 'Head/Accounts'],
  '/finance/project-consumption': ['Admin', 'Operation Manager', 'Head/Accounts'],
  '/finance/approvals': ['Admin', 'Store Manager', 'Operation Manager', 'Head/Accounts'],

  // Documents
  '/drawings': ['Admin', 'Site Engineer', 'Operation Manager'],

  // Reports
  '/reports/project': ['Admin', 'Operation Manager', 'Head/Accounts'],

  // Administration
  '/admin': ['Admin'],
}

const MasterMenu = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const userRoles = user?.roles || []

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
      const requiredRoles = menuPermissions[item.key] || []
      return hasPermission(userRoles, requiredRoles)
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
      key: '/master/vendors',
      icon: <TeamOutlined />,
      label: 'Vendor Master',
    },
    {
      key: '/master/equipment',
      icon: <ToolOutlined />,
      label: 'Equipment Master',
    },
    {
      key: '/master/work-item-types',
      icon: <FileTextOutlined />,
      label: 'Work Item Types',
    },
    {
      key: '/master/units',
      icon: <NumberOutlined />,
      label: 'Unit Master',
    },
    {
      key: '/master/users',
      icon: <UserOutlined />,
      label: 'User Management',
    },
    {
      key: '/master/roles',
      icon: <SettingOutlined />,
      label: 'Role Management',
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
    icon: <DollarOutlined />,
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
      key: '/procurement/vendors',
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
      label: 'Daily Progress / Hajri',
    },
    {
      key: '/operations/bar-bending',
      label: 'Bar Bending Schedule',
    },
    {
      key: '/operations/equipment',
      label: 'Equipment Master',
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
      key: '/finance/project-consumption',
      label: 'Project Consumption',
    },
  ])

  const financeMenu: MenuItem | null = financeChildren.length > 0 ? {
    key: 'finance',
    icon: <DollarCircleOutlined />,
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
  const allMenuItems: (MenuItem | null)[] = [
    dashboardMenu,
    masterDataMenu,
    salesMenu,
    procurementMenu,
    inventoryMenu,
    operationsMenu,
    financeMenu,
    documentsMenu,
    reportsMenu,
    adminMenu,
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
      theme="dark"
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

