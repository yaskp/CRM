import { useState, useEffect } from 'react'
import { Table, Button, Card, Tag, Input, Select, Space, message, Modal, InputNumber, Row, Col, Statistic, Typography } from 'antd'
import {
    PlusOutlined,
    EyeOutlined,
    EditOutlined,
    CheckOutlined,
    CloseOutlined,
    ContainerOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    FilterOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { materialRequisitionService, MaterialRequisition } from '../../services/api/materialRequisitions'
import dayjs from 'dayjs'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, largeInputStyle, prefixIconStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Option } = Select
const { Text } = Typography

import { useAuth } from '../../context/AuthContext'

const MaterialRequisitionList = () => {
    const { user } = useAuth()
    const [requisitions, setRequisitions] = useState<MaterialRequisition[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [total, setTotal] = useState(0)
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        project_id: '',
    })
    const navigate = useNavigate()

    useEffect(() => {
        fetchRequisitions(currentPage, pageSize)
    }, [filters, currentPage, pageSize])

    const fetchRequisitions = async (page = currentPage, limit = pageSize) => {
        setLoading(true)
        try {
            const params: any = { ...filters, page, limit }
            if (params.project_id) params.project_id = Number(params.project_id)
            const response = await materialRequisitionService.getRequisitions(params)
            setRequisitions(response.requisitions || [])
            setTotal(response.pagination?.total || 0)
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch requisitions')
        } finally {
            setLoading(false)
        }
    }

    const getStats = () => {
        const total = requisitions.length
        const pending = requisitions.filter(r => r.status === 'pending').length
        const approved = requisitions.filter(r => r.status === 'approved' || r.status === 'partially_approved').length
        const rejected = requisitions.filter(r => r.status === 'rejected').length
        return { total, pending, approved, rejected }
    }

    const stats = getStats()

    const [approvalModalVisible, setApprovalModalVisible] = useState(false)
    const [selectedRequisition, setSelectedRequisition] = useState<MaterialRequisition | null>(null)
    const [approvalItems, setApprovalItems] = useState<any[]>([])

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

    const openApprovalModal = (record: MaterialRequisition) => {
        setSelectedRequisition(record)
        const items = record.items?.map(item => ({
            id: item.id,
            material_id: item.material_id || item.material?.id,
            material: item.material,
            requested_quantity: item.requested_quantity,
            issued_quantity: item.requested_quantity,
            unit: item.unit
        })) || []
        setApprovalItems(items)
        setApprovalModalVisible(true)
    }

    const handleApprovalSubmit = async () => {
        if (!selectedRequisition) return

        try {
            await materialRequisitionService.approveRequisition(selectedRequisition.id, {
                action: 'approve',
                items: approvalItems.map(item => ({
                    id: item.id,
                    material_id: item.material_id,
                    issued_quantity: Number(item.issued_quantity)
                }))
            })
            message.success('Requisition approved and stock issued successfully')
            setApprovalModalVisible(false)
            fetchRequisitions()
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to approve requisition')
        }
    }

    const handleApprovalQuantityChange = (id: number, value: number) => {
        setApprovalItems(prev => prev.map(item =>
            item.id === id ? { ...item, issued_quantity: value } : item
        ))
    }

    const handleReject = async (id: number) => {
        Modal.confirm({
            title: 'Reject Requisition',
            icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
            content: (
                <div style={{ marginTop: '16px' }}>
                    <p>Are you sure you want to reject this requisition?</p>
                    <Input.TextArea
                        id="rejection_reason"
                        placeholder="Please provide a reason for rejection..."
                        rows={3}
                        style={{ marginTop: '8px' }}
                    />
                </div>
            ),
            okText: 'Reject',
            okType: 'danger',
            cancelText: 'Back',
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
            width: 160,
            render: (text: string) => <Text strong style={{ color: theme.colors.primary.main }}>{text}</Text>,
        },
        {
            title: 'Project',
            dataIndex: ['project', 'name'],
            key: 'project',
            width: 220,
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'Requested By',
            dataIndex: ['requester', 'name'],
            key: 'requester',
            width: 150,
        },
        {
            title: 'Required Date',
            dataIndex: 'required_date',
            key: 'required_date',
            width: 140,
            render: (date: string) => dayjs(date).format('DD-MMM-YYYY'),
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            width: 120,
            render: (priority: string) => (
                <Tag color={getPriorityColor(priority)} style={{ borderRadius: '4px' }}>
                    {priority ? priority.toUpperCase() : 'N/A'}
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 180,
            render: (status: string) => (
                <Tag color={getStatusColor(status)} style={{ padding: '0 8px', borderRadius: '4px' }}>
                    {status.replace('_', ' ').toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Items',
            dataIndex: 'items',
            key: 'items',
            width: 80,
            align: 'center' as const,
            render: (items: any[]) => <Tag>{items?.length || 0}</Tag>,
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right' as const,
            width: 240,
            render: (_: any, record: MaterialRequisition) => (
                <Space size="small">
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/procurement/requisitions/${record.id}`)}
                        style={{ padding: 0 }}
                    >
                        View
                    </Button>
                    {(record.status === 'draft' || record.status === 'pending') && (
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/procurement/requisitions/${record.id}/edit`)}
                            style={{ padding: 0 }}
                        >
                            Edit
                        </Button>
                    )}
                    {record.status === 'pending' && user?.roles?.some(role => ['Admin', 'Store Manager'].includes(role)) && (
                        <>
                            <Button
                                type="link"
                                icon={<CheckOutlined />}
                                onClick={() => openApprovalModal(record)}
                                style={{ color: '#52c41a', padding: 0 }}
                            >
                                Approve
                            </Button>
                            <Button
                                type="link"
                                icon={<CloseOutlined />}
                                onClick={() => handleReject(record.id)}
                                danger
                                style={{ padding: 0 }}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                </Space>
            ),
        },
    ]

    return (
        <PageContainer>
            <PageHeader
                title="Material Requisitions"
                subtitle="Manage site requirements and inventory allocations"
                icon={<ContainerOutlined />}
            />

            <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
                <Col xs={24} sm={6}>
                    <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
                        <Statistic
                            title="Total MRs"
                            value={stats.total}
                            prefix={<ContainerOutlined style={{ color: theme.colors.primary.main }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
                        <Statistic
                            title="Pending"
                            value={stats.pending}
                            prefix={<ClockCircleOutlined style={{ color: theme.colors.secondary.main }} />}
                            valueStyle={{ color: theme.colors.secondary.main }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
                        <Statistic
                            title="Approved"
                            value={stats.approved}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
                        <Statistic
                            title="Rejected"
                            value={stats.rejected}
                            prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card style={{ marginBottom: theme.spacing.lg, borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <Space size="middle" wrap>
                        <Select
                            placeholder="All Statuses"
                            style={{ width: 180, ...largeInputStyle }}
                            size="large"
                            allowClear
                            onChange={(value) => {
                                setFilters({ ...filters, status: value || '' })
                                setCurrentPage(1)
                            }}
                            suffixIcon={<FilterOutlined style={prefixIconStyle} />}
                        >
                            <Option value="draft">📁 Draft</Option>
                            <Option value="pending">⏳ Pending</Option>
                            <Option value="approved">✅ Approved</Option>
                            <Option value="partially_approved">🌗 Partially Approved</Option>
                            <Option value="rejected">❌ Rejected</Option>
                            <Option value="cancelled">🚫 Cancelled</Option>
                        </Select>

                        <Select
                            placeholder="Priority"
                            style={{ width: 150, ...largeInputStyle }}
                            size="large"
                            allowClear
                            onChange={(value) => {
                                setFilters({ ...filters, priority: value || '' })
                                setCurrentPage(1)
                            }}
                        >
                            <Option value="low">🔹 Low</Option>
                            <Option value="medium">🔸 Medium</Option>
                            <Option value="high">🔴 High</Option>
                            <Option value="urgent">⚡ Urgent</Option>
                        </Select>

                        <Button onClick={() => fetchRequisitions(1)} size="large">Refresh</Button>
                    </Space>

                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/procurement/requisitions/new')}
                        size="large"
                        style={getPrimaryButtonStyle(200)}
                    >
                        New Requisition
                    </Button>
                </div>
            </Card>

            <Card style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
                <Table
                    columns={columns}
                    dataSource={requisitions}
                    loading={loading}
                    rowKey="id"
                    scroll={{ x: 1300 }}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: total,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} requisitions`,
                        onChange: (page, size) => {
                            setCurrentPage(page)
                            setPageSize(size)
                        }
                    }}
                />
            </Card>

            <Modal
                title={<Text strong style={{ fontSize: '18px' }}><CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} /> Approve & Issue Material</Text>}
                open={approvalModalVisible}
                onCancel={() => setApprovalModalVisible(false)}
                onOk={handleApprovalSubmit}
                width={850}
                okText="Approve & Issue"
                cancelText="Cancel"
                okButtonProps={{ style: getPrimaryButtonStyle(160), size: 'large' }}
                cancelButtonProps={{ size: 'large' }}
            >
                <div style={{ padding: '16px 0' }}>
                    <Row gutter={24} style={{ marginBottom: '16px' }}>
                        <Col span={12}>
                            <Text type="secondary">Project</Text>
                            <div style={{ fontSize: '16px', fontWeight: 600 }}>{selectedRequisition?.project?.name}</div>
                        </Col>
                        <Col span={12}>
                            <Text type="secondary">Requester</Text>
                            <div style={{ fontSize: '16px', fontWeight: 600 }}>{selectedRequisition?.requester?.name}</div>
                        </Col>
                    </Row>

                    <Table
                        dataSource={approvalItems}
                        rowKey="id"
                        pagination={false}
                        bordered
                        columns={[
                            {
                                title: 'Material',
                                dataIndex: ['material', 'name'],
                                key: 'material',
                                render: (text) => <Text strong>{text}</Text>
                            },
                            {
                                title: 'Requested',
                                dataIndex: 'requested_quantity',
                                key: 'requested',
                                width: 140,
                                render: (qty, record) => <Tag color="blue">{qty} {record.unit}</Tag>
                            },
                            {
                                title: 'Issue Quantity',
                                dataIndex: 'issued_quantity',
                                key: 'issued',
                                width: 180,
                                render: (value, record) => (
                                    <InputNumber
                                        min={0}
                                        max={record.requested_quantity}
                                        value={value}
                                        onChange={(val) => handleApprovalQuantityChange(record.id, Number(val))}
                                        style={{ width: '100%' }}
                                        size="large"
                                    />
                                )
                            }
                        ]}
                    />
                </div>
            </Modal>
        </PageContainer>
    )
}

export default MaterialRequisitionList
