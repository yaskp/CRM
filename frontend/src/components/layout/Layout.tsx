import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button } from 'antd'
import {
  DashboardOutlined,
  ProjectOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  DollarOutlined,
  TeamOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'
import './Layout.css'

const { Header, Sider, Content } = AntLayout

const Layout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: 'Projects',
    },
    {
      key: '/leads',
      icon: <DollarOutlined />,
      label: 'Leads',
    },
    {
      key: '/materials',
      icon: <ShoppingOutlined />,
      label: 'Materials',
    },
    {
      key: '/warehouses',
      icon: <ShoppingOutlined />,
      label: 'Warehouses',
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: 'Reports',
    },
    {
      key: '/expenses',
      icon: <DollarOutlined />,
      label: 'Expenses',
    },
    {
      key: '/vendors',
      icon: <TeamOutlined />,
      label: 'Vendors',
    },
  ]

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout()
      navigate('/login')
    } else if (key === 'profile') {
      navigate('/profile')
    } else {
      navigate(key)
    }
  }

  return (
    <AntLayout className="app-layout">
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{
          minHeight: '100vh',
        }}
      >
        <div className="logo">CRM</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header className="app-header">
          <div style={{ flex: 1 }} />
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: handleMenuClick,
            }}
            placement="bottomRight"
          >
            <Button type="text" style={{ color: 'white' }}>
              <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
              {user?.name}
            </Button>
          </Dropdown>
        </Header>
        <Content className="app-content">
          <div style={{ background: '#fff', padding: 24, minHeight: '100%' }}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout

