import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Space, message, Row, Col, Statistic, Typography } from 'antd'
import {
    PlusOutlined,
    FileTextOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    FileDoneOutlined,
    EyeOutlined,
    EditOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { purchaseOrderService, PurchaseOrder } from '../../services/api/purchaseOrders'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Text } = Typography

const PurchaseOrderList = () => {
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        fetchPurchaseOrders()
    }, [])

    const fetchPurchaseOrders = async () => {
        setLoading(true)
        try {
            const response = await purchaseOrderService.getPurchaseOrders()
            setPurchaseOrders(response.purchaseOrders || [])
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch purchase orders')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (id: number) => {
        try {
            await purchaseOrderService.approvePurchaseOrder(id)
            message.success('Purchase Order Approved')
            fetchPurchaseOrders()
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to approve PO')
        }
    }

    const handleReject = async (id: number) => {
        try {
            await purchaseOrderService.rejectPurchaseOrder(id)
            message.success('Purchase Order Rejected')
            fetchPurchaseOrders()
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to reject PO')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'green'
            case 'rejected': return 'red'
            case 'draft': return 'orange'
            default: return 'default'
        }
    }

    const columns = [
        {
            title: 'PO Number',
            key: 'po_number',
            width: 180,
            render: (record: PurchaseOrder) => (
                <div>
                    {record.po_number ? (
                        <Tag color="geekblue" style={{ fontSize: 13, padding: '4px 8px' }}>
                            {record.po_number}
                        </Tag>
                    ) : (
                        <Tag style={{ fontSize: 12 }}>Pending Approval</Tag>
                    )}
                    <div style={{ marginTop: 4, fontSize: 11, color: '#888' }}>
                        Temp Ref: {record.temp_number}
                    </div>
                </div>
            ),
        },
        {
            title: 'Project',
            dataIndex: ['project', 'name'],
            key: 'project',
            width: 200,
        },
        {
            title: 'Vendor',
            dataIndex: ['vendor', 'name'],
            key: 'vendor',
            width: 200,
        },
        {
            title: 'Amount',
            dataIndex: 'total_amount',
            key: 'total_amount',
            width: 150,
            render: (amount: number) => (
                <Text strong>₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: string) => (
                <Tag color={getStatusColor(status)} style={{ textTransform: 'uppercase' }}>
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Created By',
            dataIndex: ['creator', 'name'],
            key: 'creator',
            width: 150,
        },
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right' as const,
            width: 200,
            render: (_: any, record: PurchaseOrder) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/procurement/purchase-orders/${record.id}`)}
                        style={{ padding: 0 }}
                    >
                        View
                    </Button>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/procurement/purchase-orders/${record.id}/edit`)}
                        style={{ padding: 0 }}
                    >
                        Edit
                    </Button>
                    {record.status === 'draft' && (
                        <>
                            <Button
                                type="primary"
                                size="small"
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleApprove(record.id)}
                                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                            >
                                Approve
                            </Button>
                            <Button
                                danger
                                size="small"
                                icon={<CloseCircleOutlined />}
                                onClick={() => handleReject(record.id)}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                </Space>
            ),
        },
    ]

    const statusCounts = purchaseOrders.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    return (
        <PageContainer>
            <PageHeader
                title="Purchase Orders"
                subtitle="Manage procurement and approvals"
                icon={<FileDoneOutlined />}
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/procurement/purchase-orders/new')}
                        size="large"
                        style={getPrimaryButtonStyle()}
                    >
                        Create PO Request
                    </Button>
                }
            />

            <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
                <Col span={6}>
                    <Card bordered={false} style={{ boxShadow: theme.shadows.sm }}>
                        <Statistic
                            title="Total Requests"
                            value={purchaseOrders.length}
                            prefix={<FileTextOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false} style={{ boxShadow: theme.shadows.sm }}>
                        <Statistic
                            title="Approved"
                            value={statusCounts['approved'] || 0}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false} style={{ boxShadow: theme.shadows.sm }}>
                        <Statistic
                            title="Pending Approval"
                            value={statusCounts['draft'] || 0}
                            valueStyle={{ color: '#faad14' }}
                            prefix={<ClockCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false} style={{ boxShadow: theme.shadows.sm }}>
                        <Statistic
                            title="Rejected"
                            value={statusCounts['rejected'] || 0}
                            valueStyle={{ color: '#cf1322' }}
                            prefix={<CloseCircleOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Card
                style={{
                    borderRadius: theme.borderRadius.md,
                    boxShadow: theme.shadows.base,
                    border: `1px solid ${theme.colors.neutral.gray100}`,
                }}
                bodyStyle={{ padding: 0 }}
            >
                <Table
                    columns={columns}
                    dataSource={purchaseOrders}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </PageContainer>
    )
}

export default PurchaseOrderList
