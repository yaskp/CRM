import { useState, useEffect } from 'react'
import { Table, Button, Card, Tag, Input, Select, DatePicker, Space, message, Modal } from 'antd'
import { PlusOutlined, EyeOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { materialRequisitionService, MaterialRequisition } from '../../services/api/materialRequisitions'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Search } = Input
const { Option } = Select

const MaterialRequisitionList = () => {
    const [requisitions, setRequisitions] = useState<MaterialRequisition[]>([])
    const [loading, setLoading] = useState(false)
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        project_id: '',
    })
    const navigate = useNavigate()

    useEffect(() => {
        fetchRequisitions()
    }, [filters])

    const fetchRequisitions = async () => {
        setLoading(true)
        try {
            const response = await materialRequisitionService.getRequisitions(filters)
            setRequisitions(response.requisitions || response.data || [])
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch requisitions')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        const colors: any = {
            draft: 'default',
            pending: 'processing',
            approved: 'success',
            partially_approved: 'warning',
            rejected: 'error',
            cancelled: 'default',
        }
        return colors[status] || 'default'
    }

    const getPriorityColor = (priority: string) => {
        const colors: any = {
            low: 'blue',
            medium: 'cyan',
            high: 'orange',
            urgent: 'red',
        }
        return colors[priority] || 'default'
    }

    const handleApprove = async (id: number) => {
        Modal.confirm({
            title: 'Approve Requisition',
            content: 'Are you sure you want to approve this requisition?',
            onOk: async () => {
                try {
                    await materialRequisitionService.approveRequisition(id, { action: 'approve' })
                    message.success('Requisition approved successfully')
                    fetchRequisitions()
                } catch (error: any) {
                    message.error(error.response?.data?.message || 'Failed to approve requisition')
                }
            },
        })
    }

    const handleReject = async (id: number) => {
        Modal.confirm({
            title: 'Reject Requisition',
            content: (
                <div>
                    <p>Are you sure you want to reject this requisition?</p>
                    <Input.TextArea
                        id="rejection_reason"
                        placeholder="Enter rejection reason"
                        rows={3}
                    />
                </div>
            ),
            onOk: async () => {
                const reason = (document.getElementById('rejection_reason') as HTMLTextAreaElement)?.value
                try {
                    await materialRequisitionService.approveRequisition(id, {
                        action: 'reject',
                        rejection_reason: reason,
                    })
                    message.success('Requisition rejected')
                    fetchRequisitions()
                } catch (error: any) {
                    message.error(error.response?.data?.message || 'Failed to reject requisition')
                }
            },
        })
    }

    const columns = [
        {
            title: 'Requisition No.',
            dataIndex: 'requisition_number',
            key: 'requisition_number',
            fixed: 'left' as const,
            width: 150,
        },
        {
            title: 'Project',
            dataIndex: ['project', 'name'],
            key: 'project',
            width: 200,
        },
        {
            title: 'Requested By',
            dataIndex: ['requester', 'name'],
            key: 'requester',
            width: 150,
        },
        {
            title: 'Requisition Date',
            dataIndex: 'requisition_date',
            key: 'requisition_date',
            width: 130,
            render: (date: string) => dayjs(date).format('DD-MMM-YYYY'),
        },
        {
            title: 'Required Date',
            dataIndex: 'required_date',
            key: 'required_date',
            width: 130,
            render: (date: string) => dayjs(date).format('DD-MMM-YYYY'),
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            width: 100,
            render: (priority: string) => (
                <Tag color={getPriorityColor(priority)}>{priority.toUpperCase()}</Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>
                    {status.replace('_', ' ').toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Items',
            dataIndex: 'items',
            key: 'items',
            width: 80,
            render: (items: any[]) => items?.length || 0,
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right' as const,
            width: 200,
            render: (_: any, record: MaterialRequisition) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/material-requisitions/${record.id}`)}
                    >
                        View
                    </Button>
                    {record.status === 'draft' || record.status === 'pending' ? (
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/material-requisitions/${record.id}/edit`)}
                        >
                            Edit
                        </Button>
                    ) : null}
                    {record.status === 'pending' ? (
                        <>
                            <Button
                                type="link"
                                icon={<CheckOutlined />}
                                onClick={() => handleApprove(record.id)}
                                style={{ color: '#52c41a' }}
                            >
                                Approve
                            </Button>
                            <Button
                                type="link"
                                icon={<CloseOutlined />}
                                onClick={() => handleReject(record.id)}
                                danger
                            >
                                Reject
                            </Button>
                        </>
                    ) : null}
                </Space>
            ),
        },
    ]

    return (
        <div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Material Requisitions</h2>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/material-requisitions/create')}
                >
                    Create Requisition
                </Button>
            </div>

            <Card>
                <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical">
                    <Space wrap>
                        <Select
                            placeholder="Filter by Status"
                            style={{ width: 200 }}
                            allowClear
                            onChange={(value) => setFilters({ ...filters, status: value || '' })}
                        >
                            <Option value="draft">Draft</Option>
                            <Option value="pending">Pending</Option>
                            <Option value="approved">Approved</Option>
                            <Option value="partially_approved">Partially Approved</Option>
                            <Option value="rejected">Rejected</Option>
                            <Option value="cancelled">Cancelled</Option>
                        </Select>

                        <Select
                            placeholder="Filter by Priority"
                            style={{ width: 150 }}
                            allowClear
                            onChange={(value) => setFilters({ ...filters, priority: value || '' })}
                        >
                            <Option value="low">Low</Option>
                            <Option value="medium">Medium</Option>
                            <Option value="high">High</Option>
                            <Option value="urgent">Urgent</Option>
                        </Select>

                        <Button onClick={fetchRequisitions}>Refresh</Button>
                    </Space>
                </Space>

                <Table
                    columns={columns}
                    dataSource={requisitions}
                    loading={loading}
                    rowKey="id"
                    scroll={{ x: 1300 }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} requisitions`,
                    }}
                />
            </Card>
        </div>
    )
}

export default MaterialRequisitionList
