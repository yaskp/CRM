import { useState, useEffect } from 'react'
import { Table, Button, Card, Input, Select, Space, message, Modal, Tag, Row, Col, Statistic, Typography } from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    InboxOutlined,
    FilterOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    AppstoreOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, largeInputStyle, prefixIconStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Search } = Input
const { Option } = Select
const { Text } = Typography

interface Material {
    id: number
    material_code: string
    name: string
    category: string
    unit: string
    description?: string
    hsn_code?: string
    gst_rate?: number
    is_active: boolean
    created_at: string
}

const MaterialList = () => {
    const [materials, setMaterials] = useState<Material[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        fetchMaterials()
    }, [searchText, categoryFilter])

    const fetchMaterials = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const params: any = {}
            if (searchText) params.search = searchText
            if (categoryFilter) params.category = categoryFilter

            const response = await axios.get('http://localhost:5000/api/materials', {
                headers: { Authorization: `Bearer ${token}` },
                params
            })
            setMaterials(response.data.materials || [])
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch materials')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        Modal.confirm({
            title: 'Delete Material',
            content: 'Are you sure you want to delete this material? This action cannot be undone.',
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const token = localStorage.getItem('token')
                    await axios.delete(`http://localhost:5000/api/materials/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    message.success('Material deleted successfully')
                    fetchMaterials()
                } catch (error: any) {
                    message.error(error.response?.data?.message || 'Failed to delete material')
                }
            },
        })
    }

    const getStats = () => {
        const active = materials.filter(m => m.is_active).length
        const categories = new Set(materials.map(m => m.category)).size
        return { total: materials.length, active, inactive: materials.length - active, categories }
    }

    const stats = getStats()

    const columns = [
        {
            title: 'Code',
            dataIndex: 'material_code',
            key: 'material_code',
            width: 120,
            fixed: 'left' as const,
            render: (code: string) => <Text copyable strong>{code}</Text>,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: 250,
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 150,
            render: (category: string) => <Tag color="blue">{category}</Tag>,
        },
        {
            title: 'Unit',
            dataIndex: 'unit',
            key: 'unit',
            width: 100,
        },
        {
            title: 'HSN Code',
            dataIndex: 'hsn_code',
            key: 'hsn_code',
            width: 120,
            render: (code: string) => code || '-',
        },
        {
            title: 'GST Rate',
            dataIndex: 'gst_rate',
            key: 'gst_rate',
            width: 100,
            render: (rate: number) => rate ? <Tag color="green">{rate}%</Tag> : '-',
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 100,
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
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right' as const,
            width: 150,
            render: (_: any, record: Material) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/master/materials/${record.id}`)}
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

    const categories = ['Cement', 'Steel', 'Sand', 'Aggregate', 'Bricks', 'Paint', 'Electrical', 'Plumbing', 'Hardware', 'Other']

    return (
        <PageContainer>
            <PageHeader
                title="Materials Master"
                subtitle="Manage construction materials and inventory items"
                icon={<InboxOutlined />}
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
                            title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Total Materials</Text>}
                            value={stats.total}
                            prefix={<InboxOutlined style={{ color: theme.colors.primary.main }} />}
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
                            title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Categories</Text>}
                            value={stats.categories}
                            prefix={<AppstoreOutlined style={{ color: '#1890ff' }} />}
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
                            placeholder="Search by name or code"
                            allowClear
                            style={{ width: 300 }}
                            prefix={<SearchOutlined style={prefixIconStyle} />}
                            size="large"
                            onSearch={setSearchText}
                        />
                        <Select
                            placeholder="Filter by Category"
                            style={{ width: 200, ...largeInputStyle }}
                            size="large"
                            allowClear
                            suffixIcon={<FilterOutlined style={prefixIconStyle} />}
                            onChange={(value) => setCategoryFilter(value || '')}
                        >
                            {categories.map(cat => (
                                <Option key={cat} value={cat}>{cat}</Option>
                            ))}
                        </Select>
                        <Button onClick={fetchMaterials} size="large">Refresh</Button>
                    </Space>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/master/materials/new')}
                        size="large"
                        style={getPrimaryButtonStyle(150)}
                    >
                        Add Material
                    </Button>
                </div>
            </Card>

            {/* Materials Table */}
            <Card
                style={{
                    borderRadius: theme.borderRadius.md,
                    boxShadow: theme.shadows.base,
                    border: `1px solid ${theme.colors.neutral.gray100}`,
                }}
            >
                <Table
                    columns={columns}
                    dataSource={materials}
                    loading={loading}
                    rowKey="id"
                    scroll={{ x: 1400 }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} materials`,
                    }}
                />
            </Card>
        </PageContainer>
    )
}

export default MaterialList
