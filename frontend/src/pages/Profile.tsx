import React from 'react'
import { Typography, Row, Col, Avatar, Button, Space, Tag } from 'antd'
import {
    UserOutlined,
    MailOutlined,
    IdcardOutlined,
    TeamOutlined,
    SafetyCertificateOutlined,
    EditOutlined,
    LogoutOutlined,
} from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'
import {
    PageContainer,
    PageHeader,
    SectionCard,
    InfoCard,
} from '../components/common/PremiumComponents'

const { Title, Text } = Typography

const Profile: React.FC = () => {
    const { user, logout } = useAuth()

    if (!user) {
        return <div>Loading user profile...</div>
    }

    const getRoleColor = (role: string) => {
        switch (role.toUpperCase()) {
            case 'ADMIN':
                return 'magenta'
            case 'MANAGER':
                return 'geekblue'
            case 'STAFF':
                return 'cyan'
            default:
                return 'default'
        }
    }

    return (
        <PageContainer>
            <PageHeader
                title="My Profile"
                subtitle="Manage your account settings and preferences"
                icon={<UserOutlined />}
                extra={
                    <Button
                        type="primary"
                        danger
                        icon={<LogoutOutlined />}
                        onClick={logout}
                    >
                        Sign Out
                    </Button>
                }
            />

            <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                    <SectionCard title="Identity" icon={<UserOutlined />}>
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <Avatar
                                size={120}
                                icon={<UserOutlined />}
                                style={{
                                    backgroundColor: '#1890ff',
                                    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)',
                                }}
                            />
                            <Title level={3} style={{ marginTop: 16, marginBottom: 4 }}>
                                {user.name}
                            </Title>
                            <Tag color="blue">{user.roles[0] || 'User'}</Tag>
                        </div>

                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Button block icon={<EditOutlined />}>
                                Edit Profile
                            </Button>
                            <Button block>Change Password</Button>
                        </Space>
                    </SectionCard>
                </Col>

                <Col xs={24} md={16}>
                    <SectionCard title="Contact Information" icon={<IdcardOutlined />}>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12}>
                                <InfoCard
                                    title="Full Name"
                                    icon={<UserOutlined />}
                                    gradient="subtle"
                                >
                                    <Text strong>{user.name}</Text>
                                </InfoCard>
                            </Col>

                            <Col xs={24} sm={12}>
                                <InfoCard
                                    title="Email Address"
                                    icon={<MailOutlined />}
                                    gradient="subtle"
                                >
                                    <Text copyable>{user.email}</Text>
                                </InfoCard>
                            </Col>

                            <Col xs={24} sm={12}>
                                <InfoCard
                                    title="Employee ID"
                                    icon={<IdcardOutlined />}
                                    gradient="subtle"
                                >
                                    <Text copyable>{user.employee_id}</Text>
                                </InfoCard>
                            </Col>

                            <Col xs={24} sm={12}>
                                <InfoCard
                                    title="Account Status"
                                    icon={<SafetyCertificateOutlined />}
                                    gradient="subtle"
                                >
                                    <Tag color="success">Active</Tag>
                                </InfoCard>
                            </Col>
                        </Row>
                    </SectionCard>

                    <SectionCard title="Roles & Permissions" icon={<TeamOutlined />}>
                        <div style={{ marginBottom: 16 }}>
                            <Text type="secondary">
                                Your account has been assigned the following roles, granting access to specific features within the system.
                            </Text>
                        </div>
                        <Space wrap>
                            {user.roles.map((role) => (
                                <Tag
                                    key={role}
                                    color={getRoleColor(role)}
                                    style={{ padding: '4px 12px', fontSize: '14px' }}
                                >
                                    {role.toUpperCase()}
                                </Tag>
                            ))}
                        </Space>
                    </SectionCard>
                </Col>
            </Row>
        </PageContainer>
    )
}

export default Profile
