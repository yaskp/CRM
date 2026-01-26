import { Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Layout as AntLayout, Avatar, Dropdown, Button, Badge } from 'antd'
import {
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
  SunOutlined,
  MoonOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import MasterMenu from './MasterMenu'
import './Layout.css'

const { Header, Sider, Content } = AntLayout

const Layout = () => {
  const { user, logout } = useAuth()
  const { mode, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [collapsed, setCollapsed] = useState(false)
  const isDark = mode === 'dark'

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
    <AntLayout className={`app-layout ${isDark ? 'dark-mode' : ''}`}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        width={260}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        trigger={null}
        style={{
          minHeight: '100vh',
          background: isDark ? '#111827' : '#ffffff',
          boxShadow: isDark ? '2px 0 8px rgba(0,0,0,0.2)' : '2px 0 8px rgba(0,0,0,0.05)',
          borderRight: isDark ? '1px solid #374151' : '1px solid #f0f0f0'
        }}
        className="premium-sider"
      >
        <div className="logo" style={{
          padding: '16px',
          textAlign: 'center',
          borderBottom: isDark ? '1px solid #374151' : '1px solid #f0f0f0',
          background: isDark ? '#111827' : '#ffffff'
        }}>
          <img
            src={isDark ? "/assets/logo_dark.png" : "/assets/logo.png"}
            alt="VH SHRI ENTERPRISE"
            style={{ maxWidth: '100%', height: 'auto', maxHeight: '60px' }}
          />
        </div>
        <MasterMenu />
      </Sider>
      <AntLayout>
        <Header className="app-header" style={{
          background: isDark ? '#1f2937' : '#fff',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 64,
          zIndex: 1,
          borderBottom: isDark ? '1px solid #374151' : '1px solid #e5e7eb'
        }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
                color: isDark ? '#e5e7eb' : '#334155'
              }}
            />
            {/* Breadcrumb or Page Title can go here */}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Button
              type="text"
              icon={isDark ? <SunOutlined style={{ color: '#fbbf24' }} /> : <MoonOutlined style={{ color: '#64748b' }} />}
              onClick={toggleTheme}
              style={{ width: 40, height: 40, borderRadius: '50%' }}
            />
            <Badge count={0} showZero={false} dot>
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: '18px', color: isDark ? '#9ca3af' : '#64748b' }} />}
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
              <Button type="text" style={{
                padding: '4px 12px',
                height: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: isDark ? '#374151' : '#f1f5f9',
                borderRadius: '30px',
                border: 'none'
              }}>
                <Avatar icon={<UserOutlined />} size="small" style={{ backgroundColor: '#0d9488' }} />
                <span style={{ fontWeight: 600, color: isDark ? '#e5e7eb' : '#334155' }}>{user?.name}</span>
              </Button>
            </Dropdown>
          </div>
        </Header>
        <Content className="app-content" style={{ background: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }}>
          <div style={{ position: 'relative', minHeight: '100%' }}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout

