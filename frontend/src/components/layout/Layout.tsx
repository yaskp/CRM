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
        width={260}
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
          boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
        }}
        className="premium-sider"
      >
        <div className="logo" style={{ padding: '24px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', background: 'linear-gradient(45deg, #60a5fa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.5px' }}>Construction CRM</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: 4, letterSpacing: '1px', textTransform: 'uppercase' }}>Enterprise Edition</div>
        </div>
        <MasterMenu />
      </Sider>
      <AntLayout>
        <Header className="app-header" style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64, zIndex: 1 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Breadcrumb or Page Title can go here */}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Badge count={0} showZero={false} dot>
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: '18px', color: '#64748b' }} />}
                style={{ width: 40, height: 40, borderRadius: '50%' }}
                onClick={() => navigate('/notifications')}
              />
            </Badge>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleMenuClick,
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button type="text" style={{ padding: '4px 12px', height: 'auto', display: 'flex', alignItems: 'center', gap: 10, background: '#f1f5f9', borderRadius: '30px', border: 'none' }}>
                <Avatar icon={<UserOutlined />} size="small" style={{ backgroundColor: '#3b82f6' }} />
                <span style={{ fontWeight: 600, color: '#334155' }}>{user?.name}</span>
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

