import { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Input, Select, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { vendorService } from '../../services/api/vendors'

const { Search } = Input
const { Option } = Select

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
            setVendors(response.data)
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

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a: any, b: any) => a.name.localeCompare(b.name),
        },
        {
            title: 'Type',
            dataIndex: 'vendor_type',
            key: 'vendor_type',
            render: (type: string) => (
                <Tag color={vendorTypeColors[type]}>
                    {vendorTypeLabels[type]}
                </Tag>
            ),
        },
        {
            title: 'Contact Person',
            dataIndex: 'contact_person',
            key: 'contact_person',
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (is_active: boolean) => (
                <Tag color={is_active ? 'success' : 'error'}>
                    {is_active ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/masters/vendors/${record.id}/edit`)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Are you sure you want to delete this vendor?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="link" danger icon={<DeleteOutlined />}>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    return (
        <div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Vendors</h2>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/masters/vendors/create')}
                >
                    Add Vendor
                </Button>
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
                <Search
                    placeholder="Search by name, contact, or phone"
                    allowClear
                    style={{ width: 300 }}
                    onSearch={(value) => setFilters({ ...filters, search: value })}
                    prefix={<SearchOutlined />}
                />
                <Select
                    placeholder="Filter by type"
                    style={{ width: 200 }}
                    allowClear
                    onChange={(value) => setFilters({ ...filters, vendor_type: value || '' })}
                >
                    <Option value="steel_contractor">Steel Contractor</Option>
                    <Option value="concrete_contractor">Concrete Contractor</Option>
                    <Option value="rig_vendor">Rig Vendor</Option>
                    <Option value="crane_vendor">Crane Vendor</Option>
                    <Option value="jcb_vendor">JCB Vendor</Option>
                    <Option value="other">Other</Option>
                </Select>
                <Select
                    placeholder="Filter by status"
                    style={{ width: 150 }}
                    defaultValue={true}
                    onChange={(value) => setFilters({ ...filters, is_active: value })}
                >
                    <Option value={true}>Active</Option>
                    <Option value={false}>Inactive</Option>
                </Select>
            </div>

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
            />
        </div>
    )
}

export default VendorList
