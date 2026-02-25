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
    AppstoreOutlined,
    UploadOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, largeInputStyle, prefixIconStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'
import CSVImportModal from '../../components/common/CSVImportModal'

const { Search } = Input
const { Option } = Select
const { Text } = Typography

interface Material {
    id: number
    material_code: string
    name: string
    category: string
    unit: string | string[]
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
    const [importModalVisible, setImportModalVisible] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [total, setTotal] = useState(0)
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, categories: 0 })
    const navigate = useNavigate()

    useEffect(() => {
        fetchMaterials(currentPage, pageSize)
    }, [searchText, categoryFilter, currentPage, pageSize])

    const fetchMaterials = async (page = currentPage, limit = pageSize) => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const params: any = {
                page,
                limit
            }
            if (searchText) params.search = searchText
            if (categoryFilter) params.category = categoryFilter

            const response = await axios.get('http://localhost:5000/api/materials', {
                headers: { Authorization: `Bearer ${token}` },
                params
            })
            setMaterials(response.data.materials || [])
            setTotal(response.data.pagination?.total || 0)
            if (response.data.stats) {
                setStats(response.data.stats)
            }
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

    // Stats are now fetched from backend directly!

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
            width: 150,
            render: (unit: string | string[]) => {
                const units = Array.isArray(unit) ? unit : (unit ? [unit] : []);
                return (
                    <Space size={[0, 4]} wrap>
                        {units.map((u, i) => (
                            <Tag key={i} color="purple">{u}</Tag>
                        ))}
                    </Space>
                );
            }
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
            title: 'Std. Rate',
            dataIndex: 'standard_rate',
            key: 'standard_rate',
            width: 120,
            render: (rate: number) => rate ? `₹${Number(rate).toLocaleString()}` : '-',
        },
        {
            title: 'Base UOM',
            dataIndex: 'uom',
            key: 'uom',
            width: 100,
            render: (uom: string) => uom || '-',
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

    const importColumns = [
        { title: 'Material Code', dataIndex: 'material_code', key: 'material_code', required: true },
        { title: 'Name', dataIndex: 'name', key: 'name', required: true },
        { title: 'Category', dataIndex: 'category', key: 'category' },
        { title: 'Allowed Units', dataIndex: 'unit', key: 'unit', required: true, tooltip: 'Comma separated list if multiple (e.g. "Bag, MT")' },
        { title: 'Base UOM', dataIndex: 'uom', key: 'uom', required: true, tooltip: 'Primary unit for tracking inventory' },
        { title: 'HSN Code', dataIndex: 'hsn_code', key: 'hsn_code' },
        { title: 'GST Rate', dataIndex: 'gst_rate', key: 'gst_rate' },
        { title: 'Standard Rate', dataIndex: 'standard_rate', key: 'standard_rate' },
    ]

    const templateData = [
        {
            material_code: 'MAT001',
            name: 'OPC 53 Grade Cement',
            category: 'Cement',
            unit: 'Bag, MT',
            uom: 'Bag',
            hsn_code: '2523',
            gst_rate: '28',
            standard_rate: '450'
        },
        {
            material_code: 'MAT002',
            name: 'TMT Steel 12mm',
            category: 'Steel',
            unit: 'MT, KG',
            uom: 'MT',
            hsn_code: '7214',
            gst_rate: '18',
            standard_rate: '65000'
        }
    ]

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
                            onChange={(value) => {
                                setCategoryFilter(value || '')
                                setCurrentPage(1)
                            }}
                        >
                            {categories.map(cat => (
                                <Option key={cat} value={cat}>{cat}</Option>
                            ))}
                        </Select>
                        <Button onClick={() => fetchMaterials(1)} size="large">Refresh</Button>
                    </Space>
                    <Space>
                        <Button
                            icon={<UploadOutlined />}
                            onClick={() => setImportModalVisible(true)}
                            size="large"
                        >
                            Import CSV
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => navigate('/master/materials/new')}
                            size="large"
                            style={getPrimaryButtonStyle(150)}
                        >
                            Add Material
                        </Button>
                    </Space>
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
                        current: currentPage,
                        pageSize: pageSize,
                        total: total,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} materials`,
                        onChange: (page, size) => {
                            setCurrentPage(page)
                            setPageSize(size)
                        }
                    }}
                />
            </Card>

            <CSVImportModal
                visible={importModalVisible}
                onCancel={() => setImportModalVisible(false)}
                onSuccess={() => {
                    fetchMaterials()
                }}
                title="Materials"
                apiEndpoint="http://localhost:5000/api/materials/import"
                columns={importColumns}
                templateData={templateData}
            />
        </PageContainer>
    )
}

export default MaterialList
