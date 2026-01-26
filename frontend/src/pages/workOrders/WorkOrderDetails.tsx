import { useState, useEffect } from 'react'
import { Card, Descriptions, Tag, Button, Space, message, Row, Col, Typography, Divider, Table } from 'antd'
import {
    ArrowLeftOutlined,
    EditOutlined,
    SafetyCertificateOutlined,
    ProjectOutlined,
    InfoCircleOutlined,
    DownloadOutlined,
    PrinterOutlined,
    WalletOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { workOrderService } from '../../services/api/workOrders'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import { theme } from '../../styles/theme'
import { getPrimaryButtonStyle, getSecondaryButtonStyle, flexBetweenStyle } from '../../styles/styleUtils'

const { Text, Title } = Typography

const WorkOrderDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [workOrder, setWorkOrder] = useState<any>(null)

    useEffect(() => {
        if (id) {
            fetchWorkOrder()
        }
    }, [id])

    const fetchWorkOrder = async () => {
        setLoading(true)
        try {
            const response = await workOrderService.getWorkOrder(Number(id))
            setWorkOrder(response.workOrder)
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch work order')
            navigate('/operations/work-orders')
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadPDF = async () => {
        try {
            const blob = await workOrderService.downloadPDF(Number(id));
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `WorkOrder_${workOrder?.work_order_number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            message.error("Failed to download PDF");
        }
    }

    const handlePrintPDF = async () => {
        try {
            const blob = await workOrderService.downloadPDF(Number(id));
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            message.error("Failed to open PDF for printing");
        }
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'default',
            approved: 'processing',
            active: 'cyan',
            completed: 'success',
            cancelled: 'error'
        }
        return colors[status] || 'default'
    }

    if (!workOrder) {
        return (
            <PageContainer>
                <Card loading={loading}>
                    <div style={{ padding: '50px', textAlign: 'center' }}>
                        <Text type="secondary">Loading work order details...</Text>
                    </div>
                </Card>
            </PageContainer>
        )
    }

    const itemColumns = [
        {
            title: 'Work Type',
            dataIndex: 'item_type',
            key: 'item_type',
            render: (text: string) => {
                const formatted = text ? text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Other';
                return <Tag color="blue">{formatted}</Tag>;
            }
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'right' as const,
            render: (qty: number, record: any) => `${qty} ${record.unit || ''}`
        },
        {
            title: 'Rate',
            dataIndex: 'rate',
            key: 'rate',
            align: 'right' as const,
            render: (rate: number) => `₹ ${Number(rate).toLocaleString('en-IN')}`
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right' as const,
            render: (amount: number) => <Text strong>₹ {Number(amount).toLocaleString('en-IN')}</Text>
        }
    ]

    return (
        <PageContainer maxWidth={1200}>
            <PageHeader
                title={`Work Order: ${workOrder.work_order_number}`}
                subtitle={`Created on ${dayjs(workOrder.created_at).format('DD MMM YYYY')}`}
                icon={<SafetyCertificateOutlined />}
                extra={[
                    <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate('/operations/work-orders')} style={getSecondaryButtonStyle()}>Back</Button>,
                    <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => navigate(`/operations/work-orders/${id}/edit`)} style={getPrimaryButtonStyle()}>Edit</Button>
                ]}
            />

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                    {/* Main Info */}
                    <SectionCard title="Project & Vendor Information" icon={<ProjectOutlined />}>
                        <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle">
                            <Descriptions.Item label={<Text type="secondary">Project</Text>}>
                                <b>{workOrder.project?.name}</b> <br />
                                <Text type="secondary" style={{ fontSize: '12px' }}>{workOrder.project?.project_code}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Client</Text>}>
                                <b>{workOrder.project?.client?.company_name || '-'}</b>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Vendor / Team</Text>}>
                                {workOrder.vendor ? (
                                    <Space direction="vertical" size={0}>
                                        <Text strong>{workOrder.vendor.name}</Text>
                                        <Tag color="purple">{workOrder.vendor.vendor_type}</Tag>
                                    </Space>
                                ) : (
                                    <Tag color="cyan">Internal Team</Tag>
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Status</Text>}>
                                <Tag color={getStatusColor(workOrder.status)}>{workOrder.status.toUpperCase()}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Payment Terms</Text>} span={2}>
                                {workOrder.payment_terms || '-'}
                            </Descriptions.Item>
                        </Descriptions>
                    </SectionCard>

                    {/* Items */}
                    <SectionCard title="Scope of Work" icon={<SafetyCertificateOutlined />} style={{ marginTop: '16px' }}>
                        <Table
                            dataSource={workOrder.items}
                            columns={itemColumns}
                            pagination={false}
                            rowKey="id"
                            summary={() => {
                                const total = workOrder.items?.reduce((sum: number, item: any) => sum + Number(item.amount), 0) || 0;
                                const final = Number(workOrder.final_amount) || total;

                                return (
                                    <>
                                        <Table.Summary.Row>
                                            <Table.Summary.Cell index={0} colSpan={4} align="right">
                                                <Text type="secondary">Sub Total</Text>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} align="right">
                                                <Text strong>₹ {total.toLocaleString('en-IN')}</Text>
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                        <Table.Summary.Row style={{ background: theme.colors.primary.light }}>
                                            <Table.Summary.Cell index={0} colSpan={4} align="right">
                                                <Text strong style={{ fontSize: '16px', color: theme.colors.primary.main }}>Final Amount</Text>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} align="right">
                                                <Text strong style={{ fontSize: '16px', color: theme.colors.primary.main }}>₹ {final.toLocaleString('en-IN')}</Text>
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    </>
                                )
                            }}
                        />
                    </SectionCard>

                </Col>

                <Col xs={24} lg={8}>
                    <InfoCard title="Order Stats" icon={<InfoCircleOutlined />}>
                        <div style={flexBetweenStyle}>
                            <Text type="secondary">Order ID:</Text>
                            <Text strong>#{workOrder.id}</Text>
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div style={{ textAlign: 'center' }}>
                            <Title level={4} style={{ color: theme.colors.primary.main, margin: 0 }}>
                                ₹{Number(workOrder.final_amount).toLocaleString('en-IN')}
                            </Title>
                            <Text type="secondary">Total Value</Text>
                        </div>
                    </InfoCard>

                    <Card title="Document Actions" style={{ marginTop: '16px' }} size="small">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Button icon={<DownloadOutlined />} onClick={handleDownloadPDF} block>
                                Download PDF
                            </Button>
                            <Button icon={<PrinterOutlined />} onClick={handlePrintPDF} block>
                                Print PDF
                            </Button>
                        </div>
                    </Card>

                    {workOrder.status === 'active' && (
                        <Card style={{ marginTop: '16px', background: '#e6f7ff', borderColor: '#91d5ff' }}>
                            <Space align="center">
                                <WalletOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                                <div>
                                    <Text strong style={{ color: '#1890ff' }}>Active Work Order</Text>
                                    <div style={{ fontSize: '12px' }}>Work is currently in progress.</div>
                                </div>
                            </Space>
                        </Card>
                    )}
                </Col>
            </Row>
        </PageContainer>
    )
}

export default WorkOrderDetails
