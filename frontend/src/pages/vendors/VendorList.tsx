import { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Input, Select, message, Popconfirm, Row, Col, Statistic, Typography, Card } from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ShopOutlined,
    FilterOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    PhoneOutlined,
    MailOutlined,
    EyeOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { vendorService } from '../../services/api/vendors'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, largeInputStyle, prefixIconStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Search } = Input
const { Option } = Select
const { Text } = Typography

const VendorList = () => {
    const [vendors, setVendors] = useState([])
    const [loading, setLoading] = useState(false)
    const [filters, setFilters] = useState({
        vendor_type: '',
        is_active: true,
        search: '',
    })
    const navigate = useNavigate()

    useEffect(() => {
        fetchVendors()
    }, [filters])

    const fetchVendors = async () => {
        setLoading(true)
        try {
            const response = await vendorService.getVendors(filters)
            setVendors(response.vendors || [])
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch vendors')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            await vendorService.deleteVendor(id)
            message.success('Vendor deleted successfully')
            fetchVendors()
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to delete vendor')
        }
    }

    const vendorTypeColors: Record<string, string> = {
        steel_contractor: 'blue',
        concrete_contractor: 'green',
        rig_vendor: 'orange',
        crane_vendor: 'purple',
        jcb_vendor: 'cyan',
        other: 'default',
    }

    const vendorTypeLabels: Record<string, string> = {
        steel_contractor: 'Steel Contractor',
        concrete_contractor: 'Concrete Contractor',
        rig_vendor: 'Rig Vendor',
        crane_vendor: 'Crane Vendor',
        jcb_vendor: 'JCB Vendor',
        other: 'Other',
    }

    const getStats = () => {
        const active = vendors.filter((v: any) => v.is_active).length
        const types = new Set(vendors.map((v: any) => v.vendor_type)).size
        return { total: vendors.length, active, inactive: vendors.length - active, types }
    }

    const stats = getStats()

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a: any, b: any) => a.name.localeCompare(b.name),
            render: (name: string) => <Text strong>{name}</Text>,
        },
        {
            title: 'Type',
            dataIndex: 'vendor_type',
            key: 'vendor_type',
            width: 180,
            render: (type: string) => (
                <Tag color={vendorTypeColors[type] || 'blue'} style={{ fontWeight: 500 }}>
                    {vendorTypeLabels[type] || type}
                </Tag>
            ),
        },
        {
            title: 'Contact Person',
            dataIndex: 'contact_person',
            key: 'contact_person',
            ellipsis: true,
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            width: 140,
            render: (phone: string) => phone ? (
                <span><PhoneOutlined style={{ marginRight: 4, color: theme.colors.neutral.gray400 }} />{phone}</span>
            ) : '-',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            ellipsis: true,
            render: (email: string) => email ? (
                <span><MailOutlined style={{ marginRight: 4, color: theme.colors.neutral.gray400 }} />{email}</span>
            ) : '-',
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 100,
            render: (is_active: boolean) => (
                <Tag
                    icon={is_active ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    color={is_active ? 'success' : 'error'}
                    style={{ fontWeight: 500 }}
                >
                    {is_active ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            fixed: 'right' as const,
            render: (_: any, record: any) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/master/vendors/${record.id}`)}
                        style={{ padding: 0 }}
                    >
                        View
                    </Button>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/master/vendors/${record.id}`)}
                        style={{ padding: 0 }}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Are you sure you want to delete this vendor?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="link" danger icon={<DeleteOutlined />} style={{ padding: 0 }}>
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
                title="Vendor Management"
                subtitle="Manage vendors and contractors"
                icon={<ShopOutlined />}
            />

            {/* Statistics Cards */}
            <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
                <Col xs={24} sm={12} md={6}>
                    <Card
                        hoverable
                        style={{
                            borderRadius: theme.borderRadius.md,
                            boxShadow: theme.shadows.base,
                            border: `1px solid ${theme.colors.neutral.gray100}`,
                        }}
                    >
                        <Statistic
                            title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Total Vendors</Text>}
                            value={stats.total}
                            prefix={<ShopOutlined style={{ color: theme.colors.primary.main }} />}
                            valueStyle={{ color: theme.colors.primary.main, fontWeight: 600 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card
                        hoverable
                        style={{
                            borderRadius: theme.borderRadius.md,
                            boxShadow: theme.shadows.base,
                            border: `1px solid ${theme.colors.neutral.gray100}`,
                        }}
                    >
                        <Statistic
                            title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Active</Text>}
                            value={stats.active}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#52c41a', fontWeight: 600 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card
                        hoverable
                        style={{
                            borderRadius: theme.borderRadius.md,
                            boxShadow: theme.shadows.base,
                            border: `1px solid ${theme.colors.neutral.gray100}`,
                        }}
                    >
                        <Statistic
                            title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Inactive</Text>}
                            value={stats.inactive}
                            prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                            valueStyle={{ color: '#ff4d4f', fontWeight: 600 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card
                        hoverable
                        style={{
                            borderRadius: theme.borderRadius.md,
                            boxShadow: theme.shadows.base,
                            border: `1px solid ${theme.colors.neutral.gray100}`,
                        }}
                    >
                        <Statistic
                            title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Vendor Types</Text>}
                            value={stats.types}
                            valueStyle={{ color: '#1890ff', fontWeight: 600 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filters and Actions */}
            <Card
                style={{
                    marginBottom: theme.spacing.lg,
                    borderRadius: theme.borderRadius.md,
                    boxShadow: theme.shadows.base,
                    border: `1px solid ${theme.colors.neutral.gray100}`,
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <Space wrap>
                        <Search
                            placeholder="Search by name, contact, or phone"
                            allowClear
                            style={{ width: 300 }}
                            prefix={<SearchOutlined style={prefixIconStyle} />}
                            size="large"
                            onSearch={(value) => setFilters({ ...filters, search: value })}
                        />
                        <Select
                            placeholder="Filter by type"
                            style={{ width: 200, ...largeInputStyle }}
                            size="large"
                            allowClear
                            suffixIcon={<FilterOutlined style={prefixIconStyle} />}
                            onChange={(value) => setFilters({ ...filters, vendor_type: value || '' })}
                        >
                            <Option value="steel_contractor">🔩 Steel Contractor</Option>
                            <Option value="concrete_contractor">🏗️ Concrete Contractor</Option>
                            <Option value="rig_vendor">⚙️ Rig Vendor</Option>
                            <Option value="crane_vendor">🏗️ Crane Vendor</Option>
                            <Option value="jcb_vendor">🚜 JCB Vendor</Option>
                            <Option value="other">📦 Other</Option>
                        </Select>
                        <Select
                            placeholder="Filter by status"
                            style={{ width: 150, ...largeInputStyle }}
                            size="large"
                            defaultValue={true}
                            onChange={(value) => setFilters({ ...filters, is_active: value })}
                        >
                            <Option value={true}>✅ Active</Option>
                            <Option value={false}>❌ Inactive</Option>
                        </Select>
                    </Space>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/master/vendors/new')}
                        size="large"
                        style={getPrimaryButtonStyle(140)}
                    >
                        Add Vendor
                    </Button>
                </div>
            </Card>

            {/* Vendors Table */}
            <Card
                style={{
                    borderRadius: theme.borderRadius.md,
                    boxShadow: theme.shadows.base,
                    border: `1px solid ${theme.colors.neutral.gray100}`,
                }}
            >
                <Table
                    columns={columns}
                    dataSource={vendors}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} vendors`,
                    }}
                    scroll={{ x: 1000 }}
                />
            </Card>
        </PageContainer>
    )
}

export default VendorList
