import { useState, useEffect } from 'react'
import { Table, Button, Card, Input, Select, Space, message, Modal, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const { Search } = Input
const { Option } = Select

interface Material {
    id: number
    code: string
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
            setMaterials(response.data.data || [])
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch materials')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        Modal.confirm({
            title: 'Delete Material',
            content: 'Are you sure you want to delete this material?',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
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

    const columns = [
        {
            title: 'Code',
            dataIndex: 'code',
            key: 'code',
            width: 120,
            fixed: 'left' as const,
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
        },
        {
            title: 'GST Rate',
            dataIndex: 'gst_rate',
            key: 'gst_rate',
            width: 100,
            render: (rate: number) => rate ? `${rate}%` : '-',
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 100,
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'green' : 'red'}>
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
                        onClick={() => navigate(`/masters/materials/${record.id}/edit`)}
                    >
                        Edit
                    </Button>
                    <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                    >
                        Delete
                    </Button>
                </Space>
            ),
        },
    ]

    const categories = ['Cement', 'Steel', 'Sand', 'Aggregate', 'Bricks', 'Paint', 'Electrical', 'Plumbing', 'Hardware', 'Other']

    return (
        <div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Materials Master</h2>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/masters/materials/create')}
                >
                    Add Material
                </Button>
            </div>

            <Card>
                <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical">
                    <Space wrap>
                        <Search
                            placeholder="Search by name or code"
                            allowClear
                            enterButton={<SearchOutlined />}
                            style={{ width: 300 }}
                            onSearch={setSearchText}
                        />

                        <Select
                            placeholder="Filter by Category"
                            style={{ width: 200 }}
                            allowClear
                            onChange={(value) => setCategoryFilter(value || '')}
                        >
                            {categories.map(cat => (
                                <Option key={cat} value={cat}>{cat}</Option>
                            ))}
                        </Select>

                        <Button onClick={fetchMaterials}>Refresh</Button>
                    </Space>
                </Space>

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
        </div>
    )
}

export default MaterialList
