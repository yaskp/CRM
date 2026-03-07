import { useState, useEffect } from 'react'
import { Card, Tag, Button, Space, message, Row, Col, Typography, Divider, Table } from 'antd'
import {
    ArrowLeftOutlined,
    SafetyCertificateOutlined,
    ProjectOutlined,
    InfoCircleOutlined,
    DownloadOutlined,
    PrinterOutlined,
    WalletOutlined,
    BankOutlined,
    UserOutlined,
    TeamOutlined,
    CreditCardOutlined,
    HistoryOutlined,
    FileDoneOutlined,
    CloudUploadOutlined
} from '@ant-design/icons'
import { Upload } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { workOrderService } from '../../services/api/workOrders'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import { theme } from '../../styles/theme'
import { getSecondaryButtonStyle, flexBetweenStyle } from '../../styles/styleUtils'

const { Text, Title } = Typography

const WorkOrderDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [workOrder, setWorkOrder] = useState<any>(null)
    const [uploadLoading, setUploadLoading] = useState(false)

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

    const handleUploadSignedCopy = async (file: File) => {
        setUploadLoading(true)
        try {
            const response = await workOrderService.uploadSignedCopy(Number(id), file)
            if (response.success) {
                message.success('Signed work order uploaded and archived successfully')
                fetchWorkOrder() // Refresh data
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to upload signed work order')
        } finally {
            setUploadLoading(false)
        }
        return false // Prevent auto upload
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
            title: 'Main Work Type',
            dataIndex: ['parentWorkItemType', 'name'],
            key: 'parent_work_type',
            render: (name: string, record: any) => name || record.item_type || 'Other'
        },
        {
            title: 'Sub-Work Type',
            dataIndex: ['workItemType', 'name'],
            key: 'sub_work_type',
            render: (name: string) => <Tag color="blue">{name}</Tag>
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (text: string) => <Text type="secondary" style={{ fontSize: 13 }}>{text}</Text>
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
                extra={
                    <Space wrap>
                        <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate('/operations/work-orders')} style={getSecondaryButtonStyle()}>Back</Button>
                    </Space>
                }
            />

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                    {/* Main Info */}
                    <SectionCard title="Project & Vendor Information" icon={<ProjectOutlined />}>
                        <div style={{ padding: '8px 4px' }}>
                            <Row gutter={[32, 24]}>
                                <Col xs={24} sm={12}>
                                    <div style={{ display: 'flex', gap: 16 }}>
                                        <div style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 12,
                                            background: '#f0f7ff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <ProjectOutlined style={{ fontSize: 20, color: theme.colors.primary.main }} />
                                        </div>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>Project</Text>
                                            <Text strong style={{ fontSize: 15 }}>{workOrder.project?.name || 'N/A'}</Text>
                                            <div style={{ fontSize: 12, color: theme.colors.neutral.gray600 }}>{workOrder.project?.project_code}</div>
                                        </div>
                                    </div>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <div style={{ display: 'flex', gap: 16 }}>
                                        <div style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 12,
                                            background: '#fff7e6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <BankOutlined style={{ fontSize: 20, color: '#fa8c16' }} />
                                        </div>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>Client</Text>
                                            <Text strong style={{ fontSize: 15 }}>{workOrder.project?.client?.company_name || 'N/A'}</Text>
                                            {workOrder.project?.client?.client_code && (
                                                <div style={{ fontSize: 12, color: theme.colors.neutral.gray600 }}>{workOrder.project?.client?.client_code}</div>
                                            )}
                                        </div>
                                    </div>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <div style={{ display: 'flex', gap: 16 }}>
                                        <div style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 12,
                                            background: '#f3f0ff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {workOrder.vendor ? <TeamOutlined style={{ fontSize: 20, color: '#722ed1' }} /> : <UserOutlined style={{ fontSize: 20, color: '#722ed1' }} />}
                                        </div>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>Contractor / Team</Text>
                                            {workOrder.vendor ? (
                                                <Space direction="vertical" size={2}>
                                                    <Text strong style={{ fontSize: 15 }}>{workOrder.vendor.name}</Text>
                                                    <Tag color="purple" style={{ margin: 0, fontSize: 11 }}>{workOrder.vendor.vendor_type?.toUpperCase() || 'VENDOR'}</Tag>
                                                </Space>
                                            ) : (
                                                <Tag color="teal" style={{ marginTop: 4, background: '#e6fffb', color: '#08979c', borderColor: '#87e8de' }}>VH SHRI Enterprise (Internal)</Tag>
                                            )}
                                        </div>
                                    </div>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <div style={{ display: 'flex', gap: 16 }}>
                                        <div style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 12,
                                            background: '#f6ffed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <HistoryOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                                        </div>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>Order Status</Text>
                                            <Tag color={getStatusColor(workOrder.status)} style={{ fontWeight: 600, marginTop: 4 }}>
                                                {workOrder.status?.toUpperCase()}
                                            </Tag>
                                        </div>
                                    </div>
                                </Col>

                                <Col xs={24}>
                                    <Divider style={{ margin: '8px 0' }} />
                                    <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                                        <div style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 12,
                                            background: '#f0f5ff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <CreditCardOutlined style={{ fontSize: 20, color: '#2f54eb' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Payment Terms</Text>
                                            <div style={{
                                                background: '#f9fafb',
                                                padding: '12px 16px',
                                                borderRadius: 8,
                                                border: '1px dashed #d9d9d9',
                                                fontSize: 14,
                                                color: theme.colors.neutral.gray800,
                                                lineHeight: '1.6'
                                            }}>
                                                {workOrder.payment_terms || 'No payment terms specified.'}
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </SectionCard>

                    {/* Items */}
                    <SectionCard title="Scope of Work" icon={<SafetyCertificateOutlined />} style={{ marginTop: '16px' }}>
                        <Table
                            dataSource={workOrder.items}
                            columns={itemColumns}
                            pagination={false}
                            rowKey="id"
                            scroll={{ x: 'max-content' }}
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
                        <div style={{ padding: '4px 0 8px', fontSize: 12, color: '#666', borderLeft: '3px solid #1890ff', paddingLeft: 8, marginBottom: 12, background: '#f0f8ff', borderRadius: 4 }}>
                            📋 This Work Order is printed on <strong>client letterhead</strong>. Send to client for approval and signature, then upload the signed copy.
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Button icon={<DownloadOutlined />} onClick={handleDownloadPDF} block>
                                Download for Client (PDF)
                            </Button>
                            <Button icon={<PrinterOutlined />} onClick={handlePrintPDF} block>
                                Print on Client Letterhead
                            </Button>

                            <Divider style={{ margin: '8px 0' }} />

                            {workOrder.po_wo_document_url ? (
                                <div style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: '#f6ffed',
                                    border: '1px solid #b7eb8f',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FileDoneOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                                        <Text strong>Signed Copy Uploaded</Text>
                                    </div>
                                    <Button
                                        type="primary"
                                        size="small"
                                        style={{ background: '#52c41a', borderColor: '#52c41a' }}
                                        onClick={() => window.open(`http://localhost:5000${workOrder.po_wo_document_url}`, '_blank')}
                                        block
                                    >
                                        View Signed Copy
                                    </Button>
                                    <Upload
                                        showUploadList={false}
                                        beforeUpload={(file) => handleUploadSignedCopy(file)}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                    >
                                        <Button size="small" type="link" loading={uploadLoading} block>
                                            Replace File
                                        </Button>
                                    </Upload>
                                </div>
                            ) : (
                                <Upload
                                    showUploadList={false}
                                    beforeUpload={(file) => handleUploadSignedCopy(file)}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                >
                                    <Button
                                        icon={<CloudUploadOutlined />}
                                        type="primary"
                                        ghost
                                        loading={uploadLoading}
                                        block
                                        style={{ height: 'auto', padding: '12px' }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <Text strong style={{ color: 'inherit' }}>Upload Signed Copy</Text>
                                            <Text type="secondary" style={{ fontSize: '11px' }}>PDF, JPG or PNG (Max 10MB)</Text>
                                        </div>
                                    </Button>
                                </Upload>
                            )}
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
