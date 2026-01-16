import { useState, useEffect } from 'react'
import { Table, Button, Card, Space, message, Modal, Row, Col, Statistic, Typography, Tag } from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SafetyOutlined,
    TeamOutlined,
    KeyOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { roleService } from '../../services/api/roles'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Text } = Typography

const RoleList = () => {
    const [roles, setRoles] = useState([])
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        fetchRoles()
    }, [])

    const fetchRoles = async () => {
        setLoading(true)
        try {
            const response = await roleService.getRoles()
            setRoles(response.roles || [])
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch roles')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'Delete Role',
            content: 'Are you sure you want to delete this role? This action cannot be undone.',
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await roleService.deleteRole(id)
                    message.success('Role deleted successfully')
                    fetchRoles()
                } catch (error: any) {
                    message.error(error.response?.data?.message || 'Failed to delete role')
                }
            },
        })
    }

    const columns = [
        {
            title: 'Role Name',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (name: string) => (
                <Text strong style={{ fontSize: 14 }}>{name}</Text>
            ),
        },
        {
            title: 'Permissions',
            dataIndex: 'permissions',
            key: 'permissions',
            ellipsis: true,
            render: (permissions: any[]) => {
                if (!permissions || permissions.length === 0) return <Text type="secondary">No permissions</Text>
                return (
                    <Space wrap size="small">
                        {permissions.slice(0, 3).map((p, idx) => (
                            <Tag key={idx} color="blue" style={{ fontWeight: 500 }}>
                                {p.name}
                            </Tag>
                        ))}
                        {permissions.length > 3 && (
                            <Tag>+{permissions.length - 3} more</Tag>
                        )}
                    </Space>
                )
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 180,
            fixed: 'right' as const,
            render: (_: any, record: any) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/admin/roles/${record.id}`)}
                        style={{ padding: 0 }}
                    >
                        Edit
                    </Button>
                    <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                        style={{ padding: 0 }}
                    >
                        Delete
                    </Button>
                </Space>
            ),
        },
    ]

    return (
        <PageContainer>
            <PageHeader
                title="Role Management"
                subtitle="Manage user roles and permissions"
                icon={<SafetyOutlined />}
            />

            {/* Statistics Cards */}
            <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
                <Col xs={24} sm={12} md={8}>
                    <Card
                        hoverable
                        style={{
                            borderRadius: theme.borderRadius.md,
                            boxShadow: theme.shadows.base,
                            border: `1px solid ${theme.colors.neutral.gray100}`,
                        }}
                    >
                        <Statistic
                            title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Total Roles</Text>}
                            value={roles.length}
                            prefix={<TeamOutlined style={{ color: theme.colors.primary.main }} />}
                            valueStyle={{ color: theme.colors.primary.main, fontWeight: 600 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card
                        hoverable
                        style={{
                            borderRadius: theme.borderRadius.md,
                            boxShadow: theme.shadows.base,
                            border: `1px solid ${theme.colors.neutral.gray100}`,
                        }}
                    >
                        <Statistic
                            title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>System Roles</Text>}
                            value={roles.filter((r: any) => r.is_system).length}
                            prefix={<KeyOutlined style={{ color: '#1890ff' }} />}
                            valueStyle={{ color: '#1890ff', fontWeight: 600 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card
                        hoverable
                        style={{
                            borderRadius: theme.borderRadius.md,
                            boxShadow: theme.shadows.base,
                            border: `1px solid ${theme.colors.neutral.gray100}`,
                        }}
                    >
                        <Statistic
                            title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Custom Roles</Text>}
                            value={roles.filter((r: any) => !r.is_system).length}
                            prefix={<SafetyOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#52c41a', fontWeight: 600 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Actions */}
            <Card
                style={{
                    marginBottom: theme.spacing.lg,
                    borderRadius: theme.borderRadius.md,
                    boxShadow: theme.shadows.base,
                    border: `1px solid ${theme.colors.neutral.gray100}`,
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/admin/roles/new')}
                        size="large"
                        style={getPrimaryButtonStyle(130)}
                    >
                        Add Role
                    </Button>
                </div>
            </Card>

            {/* Roles Table */}
            <Card
                style={{
                    borderRadius: theme.borderRadius.md,
                    boxShadow: theme.shadows.base,
                    border: `1px solid ${theme.colors.neutral.gray100}`,
                }}
            >
                <Table
                    columns={columns}
                    dataSource={roles}
                    loading={loading}
                    rowKey="id"
                    scroll={{ x: 800 }}
                />
            </Card>
        </PageContainer>
    )
}

export default RoleList
