import { useState, useEffect } from 'react'
import { Card, Descriptions, Tag, Button, Space, message, Row, Col, Typography, Divider, Table } from 'antd'
import {
    ArrowLeftOutlined,
    EditOutlined,
    FileDoneOutlined,
    ProjectOutlined,
    ShopOutlined,
    InfoCircleOutlined,
    PrinterOutlined,
    CheckCircleOutlined,
    BankOutlined,
    DownloadOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { purchaseOrderService } from '../../services/api/purchaseOrders'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import { theme } from '../../styles/theme'
import { getPrimaryButtonStyle, getSecondaryButtonStyle, flexBetweenStyle } from '../../styles/styleUtils'

const { Text, Title } = Typography

const PurchaseOrderDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [purchaseOrder, setPurchaseOrder] = useState<any>(null)

    useEffect(() => {
        if (id) {
            fetchPurchaseOrder()
        }
    }, [id])

    const fetchPurchaseOrder = async () => {
        setLoading(true)
        try {
            const response = await purchaseOrderService.getPurchaseOrder(Number(id))
            setPurchaseOrder(response.purchaseOrder)
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch purchase order')
            navigate('/procurement/purchase-orders')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async () => {
        try {
            setLoading(true)
            await purchaseOrderService.approvePurchaseOrder(Number(id))
            message.success('Purchase Order Approved Successfully')
            fetchPurchaseOrder()
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to approve purchase order')
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async () => {
        try {
            setLoading(true)
            await purchaseOrderService.rejectPurchaseOrder(Number(id))
            message.success('Purchase Order Rejected')
            fetchPurchaseOrder()
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to reject purchase order')
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadPDF = async () => {
        try {
            const blob = await purchaseOrderService.downloadPDF(Number(id));
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `PO_${purchaseOrder?.po_number || purchaseOrder?.temp_number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            message.error("Failed to download PDF");
        }
    }

    const handlePrintPDF = async () => {
        try {
            const blob = await purchaseOrderService.downloadPDF(Number(id));
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            message.error("Failed to open PDF for printing");
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

    if (!purchaseOrder) {
        return (
            <PageContainer>
                <Card loading={loading}>
                    <div style={{ padding: '50px', textAlign: 'center' }}>
                        <Text type="secondary">Loading purchase order details...</Text>
                    </div>
                </Card>
            </PageContainer>
        )
    }

    const itemColumns = [
        {
            title: 'Material',
            dataIndex: 'material',
            key: 'material',
            render: (material: any, record: any) => (
                <div>
                    <Text strong>{material?.name || record.description}</Text>
                    {material?.material_code && <div style={{ fontSize: '12px', color: theme.colors.neutral.gray500 }}>{material.material_code}</div>}
                </div>
            )
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'right' as const,
            render: (qty: number, record: any) => `${qty} ${record.unit || ''}`
        },
        {
            title: 'Unit Price',
            dataIndex: 'unit_price',
            key: 'unit_price',
            align: 'right' as const,
            render: (price: number) => `₹ ${Number(price).toLocaleString('en-IN')}`
        },
        {
            title: 'Tax',
            dataIndex: 'tax_percentage',
            key: 'tax',
            align: 'right' as const,
            render: (tax: number) => `${tax}%`
        },
        {
            title: 'Total',
            dataIndex: 'total_amount',
            key: 'total',
            align: 'right' as const,
            render: (amount: number) => <Text strong>₹ {Number(amount).toLocaleString('en-IN')}</Text>
        }
    ]

    return (
        <PageContainer maxWidth={1200}>
            <PageHeader
                title={`Purchase Order: ${purchaseOrder.po_number || 'Draft'}`}
                subtitle={`Created on ${dayjs(purchaseOrder.created_at).format('DD MMM YYYY')}`}
                icon={<FileDoneOutlined />}
                extra={[
                    <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate('/procurement/purchase-orders')} style={getSecondaryButtonStyle()}>Back</Button>,
                    purchaseOrder.status === 'draft' && (
                        <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => navigate(`/procurement/purchase-orders/${id}/edit`)} style={getPrimaryButtonStyle()}>Edit</Button>
                    )
                ].filter(Boolean)}
            />

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                    {/* Main Info */}
                    <SectionCard title="Project & Vendor Information" icon={<ProjectOutlined />}>
                        <Row gutter={[24, 24]}>
                            <Col xs={24} md={12}>
                                <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project</Text>
                                <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px', color: theme.colors.neutral.gray800 }}>
                                    {purchaseOrder.project?.name}
                                </div>
                                <div style={{ marginTop: 4 }}>
                                    <Tag color="cyan">{purchaseOrder.project?.project_code}</Tag>
                                </div>
                            </Col>
                            <Col xs={24} md={12}>
                                <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vendor</Text>
                                <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px', color: theme.colors.neutral.gray800 }}>
                                    {purchaseOrder.vendor?.name}
                                </div>
                                {purchaseOrder.vendor?.gstin && <div style={{ fontSize: 13, color: '#666' }}>GST: {purchaseOrder.vendor.gstin}</div>}
                            </Col>

                            <Divider style={{ margin: '12px 0' }} />

                            <Col xs={24} md={12}>
                                <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Delivery Location</Text>
                                <div style={{ marginTop: '4px', fontSize: '14px' }}>
                                    {purchaseOrder.shipping_address ? (
                                        <div style={{ whiteSpace: 'pre-wrap' }}>{purchaseOrder.shipping_address}</div>
                                    ) : (
                                        <Text type="secondary">Not specified</Text>
                                    )}
                                </div>
                                <div style={{ marginTop: 8 }}>
                                    <Tag icon={<BankOutlined />} color="purple">
                                        {purchaseOrder.warehouse?.name || 'Site Store'}
                                    </Tag>
                                </div>
                            </Col>
                            <Col xs={24} md={12}>
                                <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expect Delivery By</Text>
                                <div style={{ fontSize: '16px', fontWeight: 500, marginTop: '4px' }}>
                                    {purchaseOrder.expected_delivery_date ? dayjs(purchaseOrder.expected_delivery_date).format('DD MMM YYYY') : 'Imperial'}
                                </div>
                            </Col>
                        </Row>
                    </SectionCard>

                    {/* Items */}
                    <SectionCard title="Order Items" icon={<ShopOutlined />} style={{ marginTop: '16px' }}>
                        <Table
                            dataSource={purchaseOrder.items}
                            columns={itemColumns}
                            pagination={false}
                            rowKey="id"
                            summary={() => {
                                const subTotal = Number(purchaseOrder.total_amount) - (Number(purchaseOrder.cgst_amount) + Number(purchaseOrder.sgst_amount) + Number(purchaseOrder.igst_amount));

                                return (
                                    <>
                                        <Table.Summary.Row>
                                            <Table.Summary.Cell index={0} colSpan={4} align="right">
                                                <Text type="secondary">Sub Total</Text>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} align="right">
                                                <Text>₹ {subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                        {(purchaseOrder.cgst_amount > 0 || purchaseOrder.sgst_amount > 0 || purchaseOrder.igst_amount > 0) && (
                                            <Table.Summary.Row>
                                                <Table.Summary.Cell index={0} colSpan={4} align="right">
                                                    <Text type="secondary">Tax (GST)</Text>
                                                </Table.Summary.Cell>
                                                <Table.Summary.Cell index={1} align="right">
                                                    <Text>₹ {(Number(purchaseOrder.cgst_amount) + Number(purchaseOrder.sgst_amount) + Number(purchaseOrder.igst_amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                                                </Table.Summary.Cell>
                                            </Table.Summary.Row>
                                        )}
                                        <Table.Summary.Row style={{ background: theme.colors.primary.light }}>
                                            <Table.Summary.Cell index={0} colSpan={4} align="right">
                                                <Text strong style={{ fontSize: '16px', color: theme.colors.primary.main }}>Grand Total</Text>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} align="right">
                                                <Text strong style={{ fontSize: '16px', color: theme.colors.primary.main }}>₹ {Number(purchaseOrder.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    </>
                                )
                            }}
                        />
                    </SectionCard>

                    {/* Terms & Conditions */}
                    <SectionCard title="Terms & Conditions" icon={<FileDoneOutlined />} style={{ marginTop: '16px' }}>
                        <Descriptions column={1} size="small" bordered>
                            <Descriptions.Item label="Payment Terms">{purchaseOrder.annexure?.payment_terms || purchaseOrder.payment_terms || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Delivery Terms">{purchaseOrder.annexure?.delivery_terms || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Notes">{purchaseOrder.notes || '-'}</Descriptions.Item>
                        </Descriptions>
                    </SectionCard>

                </Col>

                <Col xs={24} lg={8}>
                    <InfoCard title="Internal Details" icon={<InfoCircleOutlined />}>
                        <div style={flexBetweenStyle}>
                            <Text type="secondary">Created By:</Text>
                            <Text>{purchaseOrder.creator?.name || 'Unknown'}</Text>
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div style={flexBetweenStyle}>
                            <Text type="secondary">Reference:</Text>
                            <Text copyable>{purchaseOrder.po_number || purchaseOrder.temp_number}</Text>
                        </div>
                        <div style={flexBetweenStyle}>
                            <Text type="secondary">Status:</Text>
                            <Tag color={getStatusColor(purchaseOrder.status)}>{purchaseOrder.status.toUpperCase()}</Tag>
                        </div>
                    </InfoCard>

                    <Card title="Document Actions" style={{ marginTop: '16px' }} size="small">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Button icon={<DownloadOutlined />} onClick={handleDownloadPDF} block>
                                Download PO PDF
                            </Button>
                            <Button icon={<PrinterOutlined />} onClick={handlePrintPDF} block>
                                Print PO
                            </Button>
                        </div>
                    </Card>

                    {(purchaseOrder.status === 'draft' || purchaseOrder.status === 'pending_approval') && (
                        <Card title="Approval Actions" style={{ marginTop: '16px', borderColor: theme.colors.primary.main }} headStyle={{ background: '#f0f5ff', color: theme.colors.primary.main }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <Button
                                    type="primary"
                                    icon={<CheckCircleOutlined />}
                                    onClick={handleApprove}
                                    loading={loading}
                                    block
                                    size="large"
                                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                                >
                                    Approve & Release PO
                                </Button>
                                <Button
                                    danger
                                    icon={<ArrowLeftOutlined />}
                                    onClick={handleReject}
                                    loading={loading}
                                    block
                                >
                                    Reject Request
                                </Button>
                            </div>
                        </Card>
                    )}

                    {purchaseOrder.status === 'approved' && (
                        <Card style={{ marginTop: '16px', background: '#f6ffed', borderColor: '#b7eb8f' }}>
                            <Space align="center">
                                <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                                <div>
                                    <Text strong style={{ color: '#52c41a' }}>PO Approved</Text>
                                    <div style={{ fontSize: '12px' }}>This order has been authorized.</div>
                                </div>
                            </Space>
                        </Card>
                    )}
                </Col>
            </Row>
        </PageContainer>
    )
}

export default PurchaseOrderDetails
