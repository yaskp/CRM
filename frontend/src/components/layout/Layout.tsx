import { Outlet, useNavigate } from 'react-router-dom'
import { Layout as AntLayout, Avatar, Dropdown, Button, Badge } from 'antd'
import {
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'
import MasterMenu from './MasterMenu'
import './Layout.css'

const { Header, Sider, Content } = AntLayout

const Layout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <UserOutlined />,
      label: 'Settings',
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
    } else if (key === 'settings') {
      navigate('/admin/settings')
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
        <div className="logo">
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>Construction CRM</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>India's Best ERP</div>
        </div>
        <MasterMenu />
      </Sider>
      <AntLayout>
        <Header className="app-header">
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Construction CRM</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={0} showZero={false}>
              <Button 
                type="text" 
                icon={<BellOutlined />} 
                style={{ color: 'white' }}
                onClick={() => navigate('/notifications')}
              />
            </Badge>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleMenuClick,
              }}
              placement="bottomRight"
            >
              <Button type="text" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} size="small" />
                <span>{user?.name}</span>
              </Button>
            </Dropdown>
          </div>
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

