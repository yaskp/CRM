import { useState, useEffect } from 'react'
import { Table, Button, Input, Select, Tag, Space, message, Popconfirm } from 'antd'
import {
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    TeamOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { clientService } from '../../services/api/clients'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, getSecondaryButtonStyle } from '../../styles/styleUtils'
import type { ColumnsType } from 'antd/es/table'

const { Option } = Select

interface Client {
    id: number
    client_code: string
    company_name: string
    contact_person?: string
    email?: string
    phone?: string
    city?: string
    state?: string
    client_type: string
    status: string
    created_at: string
}

const ClientList = () => {
    const navigate = useNavigate()
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [typeFilter, setTypeFilter] = useState<string>('')
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    })

    useEffect(() => {
        fetchClients()
    }, [pagination.current, pagination.pageSize, search, statusFilter, typeFilter])

    const fetchClients = async () => {
        setLoading(true)
        try {
            const response = await clientService.getClients({
                search,
                status: statusFilter,
                client_type: typeFilter,
                page: pagination.current,
                limit: pagination.pageSize,
            })
            setClients(response.clients)
            setPagination({
                ...pagination,
                total: response.pagination.total,
            })
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch clients')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            await clientService.deleteClient(id)
            message.success('Client deleted successfully')
            fetchClients()
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to delete client')
        }
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            active: 'success',
            inactive: 'default',
            blocked: 'error',
        }
        return colors[status] || 'default'
    }

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            individual: 'blue',
            company: 'purple',
            government: 'orange',
        }
        return colors[type] || 'default'
    }

    const columns: ColumnsType<Client> = [
        {
            title: 'Client Code',
            dataIndex: 'client_code',
            key: 'client_code',
            width: 150,
            render: (code: string, record: Client) => (
                <Button
                    type="link"
                    onClick={() => navigate(`/sales/clients/${record.id}`)}
                    style={{ padding: 0, fontWeight: 600 }}
                >
                    {code}
                </Button>
            ),
        },
        {
            title: 'Company Name',
            dataIndex: 'company_name',
            key: 'company_name',
            width: 250,
        },
        {
            title: 'Contact Person',
            dataIndex: 'contact_person',
            key: 'contact_person',
            width: 180,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: 200,
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            width: 150,
        },
        {
            title: 'Location',
            key: 'location',
            width: 180,
            render: (_: any, record: Client) => (
                <span>{record.city ? `${record.city}, ${record.state || ''}` : 'N/A'}</span>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'client_type',
            key: 'client_type',
            width: 120,
            render: (type: string) => (
                <Tag color={getTypeColor(type)} style={{ fontWeight: 500 }}>
                    {type.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => (
                <Tag color={getStatusColor(status)} style={{ fontWeight: 500 }}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            fixed: 'right' as const,
            render: (_: any, record: Client) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/sales/clients/${record.id}`)}
                        style={{ padding: 0 }}
                    >
                        View
                    </Button>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/sales/clients/${record.id}/edit`)}
                        style={{ padding: 0 }}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete Client"
                        description="Are you sure you want to delete this client?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            style={{ padding: 0 }}
                        >
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    return (
        <PageContainer>
            <PageHeader
                title="Client Management"
                subtitle="Manage your clients and customer relationships"
                icon={<TeamOutlined />}
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/sales/clients/new')}
                        size="large"
                        style={getPrimaryButtonStyle()}
                    >
                        Add New Client
                    </Button>
                }
            />

            <div style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Input
                    placeholder="Search by name, code, email, phone..."
                    prefix={<SearchOutlined />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 300 }}
                    size="large"
                    allowClear
                />
                <Select
                    placeholder="Filter by Status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: 150 }}
                    size="large"
                    allowClear
                >
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                    <Option value="blocked">Blocked</Option>
                </Select>
                <Select
                    placeholder="Filter by Type"
                    value={typeFilter}
                    onChange={setTypeFilter}
                    style={{ width: 150 }}
                    size="large"
                    allowClear
                >
                    <Option value="individual">Individual</Option>
                    <Option value="company">Company</Option>
                    <Option value="government">Government</Option>
                </Select>
                <Button
                    onClick={fetchClients}
                    size="large"
                    style={getSecondaryButtonStyle()}
                >
                    Refresh
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={clients}
                rowKey="id"
                loading={loading}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} clients`,
                    onChange: (page, pageSize) => {
                        setPagination({ ...pagination, current: page, pageSize: pageSize || 10 })
                    },
                }}
                scroll={{ x: 1400 }}
            />
        </PageContainer>
    )
}

export default ClientList
