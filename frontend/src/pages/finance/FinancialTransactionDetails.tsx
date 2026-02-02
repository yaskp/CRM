import { useState, useEffect } from 'react'
import { Card, Tag, Button, Space, message, Row, Col, Typography, Divider, Table } from 'antd'
import {
    ArrowLeftOutlined,
    DollarCircleOutlined,
    ProjectOutlined,
    InfoCircleOutlined,
    BankOutlined,
    UserOutlined,
    TeamOutlined,
    CreditCardOutlined,
    CalendarOutlined,
    FileTextOutlined,
    TagOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { financeService } from '../../services/api/finance'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import { theme } from '../../styles/theme'
import { getSecondaryButtonStyle, flexBetweenStyle } from '../../styles/styleUtils'

const { Text, Title } = Typography

const FinancialTransactionDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [transaction, setTransaction] = useState<any>(null)

    useEffect(() => {
        if (id) {
            fetchTransaction()
        }
    }, [id])

    const fetchTransaction = async () => {
        setLoading(true)
        try {
            const response = await financeService.getTransaction(Number(id))
            setTransaction(response.transaction)
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch transaction details')
            navigate('/finance/transactions')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            cleared: 'success',
            pending: 'processing',
            bounced: 'error',
            cancelled: 'default'
        }
        return colors[status] || 'default'
    }

    const getTypeTag = (type: string) => {
        return type === 'payment'
            ? <Tag color="error">PAYMENT (OUT)</Tag>
            : <Tag color="success">RECEIPT (IN)</Tag>
    }

    if (!transaction) {
        return (
            <PageContainer>
                <Card loading={loading}>
                    <div style={{ padding: '50px', textAlign: 'center' }}>
                        <Text type="secondary">Loading transaction details...</Text>
                    </div>
                </Card>
            </PageContainer>
        )
    }

    const allocationColumns = [
        {
            title: 'Reference',
            key: 'ref',
            render: (_: any, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong>
                        {record.purchaseOrder?.po_number || record.workOrder?.id || 'N/A'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {record.purchaseOrder ? 'Purchase Order' : record.workOrder ? 'Work Order' : 'General'}
                    </Text>
                </Space>
            )
        },
        {
            title: 'Allocated Amount',
            dataIndex: 'allocated_amount',
            key: 'allocated_amount',
            align: 'right' as const,
            render: (amount: number) => `₹ ${Number(amount).toLocaleString('en-IN')}`
        },
        {
            title: 'TDS Deducted',
            dataIndex: 'tds_allocated',
            key: 'tds_allocated',
            align: 'right' as const,
            render: (amount: number) => `₹ ${Number(amount).toLocaleString('en-IN')}`
        },
        {
            title: 'Total Impact',
            key: 'total',
            align: 'right' as const,
            render: (_: any, record: any) => {
                const total = Number(record.allocated_amount) + Number(record.tds_allocated)
                return <Text strong>₹ {total.toLocaleString('en-IN')}</Text>
            }
        }
    ]

    return (
        <PageContainer maxWidth={1000}>
            <PageHeader
                title={`Transaction: ${transaction.transaction_number}`}
                subtitle={`Recorded on ${dayjs(transaction.created_at).format('DD MMM YYYY')}`}
                icon={<DollarCircleOutlined />}
                extra={[
                    <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate('/finance/transactions')} style={getSecondaryButtonStyle()}>Back to List</Button>
                ]}
            />

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={15}>
                    <SectionCard title="Transaction Information" icon={<InfoCircleOutlined />}>
                        <Row gutter={[24, 24]}>
                            <Col xs={24} sm={12}>
                                <Space direction="vertical" size={2}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Transaction Type</Text>
                                    {getTypeTag(transaction.type)}
                                </Space>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Space direction="vertical" size={2}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Category</Text>
                                    <Tag color="blue">{transaction.category?.replace(/_/g, ' ')?.toUpperCase()}</Tag>
                                </Space>
                            </Col>
                            <Col xs={24} sm={12}>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <CalendarOutlined style={{ color: theme.colors.primary.main, fontSize: 18, marginTop: 4 }} />
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Payment Date</Text>
                                        <Text strong>{dayjs(transaction.transaction_date).format('DD MMMM YYYY')}</Text>
                                    </div>
                                </div>
                            </Col>
                            <Col xs={24} sm={12}>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <ProjectOutlined style={{ color: theme.colors.primary.main, fontSize: 18, marginTop: 4 }} />
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Linked Project</Text>
                                        <Text strong>{transaction.project?.name || 'N/A'}</Text>
                                        <div style={{ fontSize: 11, color: theme.colors.neutral.gray500 }}>{transaction.project?.project_code}</div>
                                    </div>
                                </div>
                            </Col>

                            <Col xs={24}>
                                <Divider style={{ margin: '8px 0' }} />
                            </Col>

                            <Col xs={24} sm={12}>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <TeamOutlined style={{ color: '#fa8c16', fontSize: 18, marginTop: 4 }} />
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{transaction.category === 'client' ? 'Client' : 'Vendor / Party'}</Text>
                                        <Text strong>
                                            {transaction.vendor?.name || transaction.client?.company_name || 'N/A'}
                                        </Text>
                                    </div>
                                </div>
                            </Col>

                            <Col xs={24} sm={12}>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <BankOutlined style={{ color: '#1890ff', fontSize: 18, marginTop: 4 }} />
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Payment Method</Text>
                                        <Text strong>{transaction.payment_mode?.toUpperCase()} {transaction.reference_number && `- ${transaction.reference_number}`}</Text>
                                    </div>
                                </div>
                            </Col>

                            <Col xs={24}>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <FileTextOutlined style={{ color: theme.colors.neutral.gray600, fontSize: 18, marginTop: 4 }} />
                                    <div style={{ flex: 1 }}>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Remarks</Text>
                                        <div style={{
                                            padding: '8px 12px',
                                            background: '#f9fafb',
                                            borderRadius: 6,
                                            marginTop: 4,
                                            border: '1px solid #f0f0f0'
                                        }}>
                                            {transaction.remarks || <Text type="secondary" italic>No remarks added.</Text>}
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </SectionCard>

                    {transaction.allocations?.length > 0 && (
                        <SectionCard title="Payment Allocations" icon={<TagOutlined />} style={{ marginTop: 16 }}>
                            <Table
                                columns={allocationColumns}
                                dataSource={transaction.allocations}
                                pagination={false}
                                rowKey="id"
                                size="middle"
                            />
                        </SectionCard>
                    )}
                </Col>

                <Col xs={24} lg={9}>
                    <InfoCard title="Summary" icon={<CreditCardOutlined />}>
                        <div style={{ textAlign: 'center', padding: '12px 0' }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>NET AMOUNT PAID</Text>
                            <Title level={2} style={{ color: transaction.type === 'payment' ? '#f5222d' : '#52c41a', margin: 0 }}>
                                ₹{Number(transaction.net_amount).toLocaleString('en-IN')}
                            </Title>
                            <Tag color={getStatusColor(transaction.status)} style={{ marginTop: 8 }}>
                                {transaction.status?.toUpperCase()}
                            </Tag>
                        </div>

                        <Divider style={{ margin: '16px 0' }} />

                        <div style={flexBetweenStyle}>
                            <Text type="secondary">Gross Amount:</Text>
                            <Text strong>₹{Number(transaction.amount).toLocaleString('en-IN')}</Text>
                        </div>
                        <div style={{ ...flexBetweenStyle, marginTop: 8 }}>
                            <Text type="secondary">TDS Deducted (-):</Text>
                            <Text strong style={{ color: '#f5222d' }}>₹{Number(transaction.tds_amount).toLocaleString('en-IN')}</Text>
                        </div>
                        {transaction.retention_amount > 0 && (
                            <div style={{ ...flexBetweenStyle, marginTop: 8 }}>
                                <Text type="secondary">Retention (-):</Text>
                                <Text strong style={{ color: '#fa8c16' }}>₹{Number(transaction.retention_amount).toLocaleString('en-IN')}</Text>
                            </div>
                        )}

                        <Divider style={{ margin: '16px 0' }} />

                        <div style={flexBetweenStyle}>
                            <Text type="secondary">Recorded By:</Text>
                            <Space size={4}>
                                <UserOutlined style={{ fontSize: 12 }} />
                                <Text strong>VHSHRI Admin</Text>
                            </Space>
                        </div>
                    </InfoCard>

                    {transaction.attachment_url && (
                        <Card title="Receipt Attachment" size="small" style={{ marginTop: 16 }}>
                            <Button
                                type="primary"
                                ghost
                                icon={<FileTextOutlined />}
                                block
                                onClick={() => window.open(`http://localhost:5000${transaction.attachment_url}`, '_blank')}
                            >
                                View Attachment
                            </Button>
                        </Card>
                    )}
                </Col>
            </Row>
        </PageContainer>
    )
}

export default FinancialTransactionDetails
