import { useState, useEffect } from 'react'
import { Table, Button, Card, Input, Space, message, Modal, Tag, Row, Col, Statistic, Typography } from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    UserOutlined,
    TeamOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { userService } from '../../services/api/users'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, largeInputStyle, prefixIconStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Search } = Input
const { Text } = Typography

const UserList = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        fetchUsers()
    }, [searchText])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const params: any = {}
            if (searchText) params.search = searchText
            const response = await userService.getUsers(params)
            setUsers(response.users || [])
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch users')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'Delete User',
            content: 'Are you sure you want to delete this user?',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                try {
                    await userService.deleteUser(id)
                    message.success('User deleted successfully')
                    fetchUsers()
                } catch (error: any) {
                    message.error(error.response?.data?.message || 'Failed to delete user')
                }
            },
        })
    }

    const getStats = () => {
        const activeUsers = users.filter((u: any) => u.is_active).length
        const inactiveUsers = users.length - activeUsers
        return { total: users.length, active: activeUsers, inactive: inactiveUsers }
    }

    const stats = getStats()

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: 200,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            ellipsis: true,
        },
        {
            title: 'Employee ID',
            dataIndex: 'employee_id',
            key: 'employee_id',
            width: 150,
        },
        {
            title: 'Roles',
            dataIndex: 'roles',
            key: 'roles',
            width: 250,
            render: (roles: any[]) => (
                <>
                    {roles && roles.map(role => (
                        <Tag key={role.id} color="blue" style={{ fontWeight: 500 }}>
                            {role.name}
                        </Tag>
                    ))}
                </>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 120,
            render: (isActive: boolean) => (
                <Tag
                    icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    color={isActive ? 'success' : 'error'}
                    style={{ fontWeight: 500 }}
                >
                    {isActive ? 'Active' : 'Inactive'}
                </Tag>
            ),
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
                        onClick={() => navigate(`/admin/users/${record.id}`)}
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
                title="User Management"
                subtitle="Manage system users and their permissions"
                icon={<TeamOutlined />}
            />

            {/* Statistics Cards */}
            <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
                <Col xs={24} sm={8}>
                    <Card
                        hoverable
                        style={{
                            borderRadius: theme.borderRadius.md,
                            boxShadow: theme.shadows.base,
                            border: `1px solid ${theme.colors.neutral.gray100}`,
                        }}
                    >
                        <Statistic
                            title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Total Users</Text>}
                            value={stats.total}
                            prefix={<UserOutlined style={{ color: theme.colors.primary.main }} />}
                            valueStyle={{ color: theme.colors.primary.main, fontWeight: 600 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card
                        hoverable
                        style={{
                            borderRadius: theme.borderRadius.md,
                            boxShadow: theme.shadows.base,
                            border: `1px solid ${theme.colors.neutral.gray100}`,
                        }}
                    >
                        <Statistic
                            title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Active Users</Text>}
                            value={stats.active}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#52c41a', fontWeight: 600 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card
                        hoverable
                        style={{
                            borderRadius: theme.borderRadius.md,
                            boxShadow: theme.shadows.base,
                            border: `1px solid ${theme.colors.neutral.gray100}`,
                        }}
                    >
                        <Statistic
                            title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Inactive Users</Text>}
                            value={stats.inactive}
                            prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                            valueStyle={{ color: '#ff4d4f', fontWeight: 600 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Search and Actions */}
            <Card
                style={{
                    marginBottom: theme.spacing.lg,
                    borderRadius: theme.borderRadius.md,
                    boxShadow: theme.shadows.base,
                    border: `1px solid ${theme.colors.neutral.gray100}`,
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <Search
                        placeholder="Search by name or email"
                        allowClear
                        onSearch={setSearchText}
                        style={{ width: 300 }}
                        prefix={<SearchOutlined style={prefixIconStyle} />}
                        size="large"
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/admin/users/new')}
                        size="large"
                        style={getPrimaryButtonStyle(130)}
                    >
                        Add User
                    </Button>
                </div>
            </Card>

            {/* Users Table */}
            <Card
                style={{
                    borderRadius: theme.borderRadius.md,
                    boxShadow: theme.shadows.base,
                    border: `1px solid ${theme.colors.neutral.gray100}`,
                }}
            >
                <Table
                    columns={columns}
                    dataSource={users}
                    loading={loading}
                    rowKey="id"
                    scroll={{ x: 1000 }}
                />
            </Card>
        </PageContainer>
    )
}

export default UserList
