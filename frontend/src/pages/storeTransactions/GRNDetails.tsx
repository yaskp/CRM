import { useState, useEffect } from 'react'
import { Card, Descriptions, Tag, Button, Space, message, Row, Col, Typography, Table, App } from 'antd'
import {
    ArrowLeftOutlined,
    FileTextOutlined,
    InboxOutlined,
    UserOutlined,
    PrinterOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    BarcodeOutlined,
    CheckOutlined,
    CloseOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard } from '../../components/common/PremiumComponents'
import { theme } from '../../styles/theme'
import { getSecondaryButtonStyle } from '../../styles/styleUtils'

const { Text } = Typography

const API_FILE_BASE = ((import.meta as any).env?.VITE_API_URL || '').replace('/api', '') || 'http://localhost:5000'

const getFileUrl = (url?: string) => {
    if (!url) return undefined
    if (url.startsWith('http')) return url
    return `${API_FILE_BASE}${url}`
}

const GRNDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { modal } = App.useApp()
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [grn, setGrn] = useState<any>(null)

    useEffect(() => {
        if (id) {
            fetchGRN()
        }
    }, [id])

    const fetchGRN = async () => {
        setLoading(true)
        try {
            const response = await storeTransactionService.getTransaction(Number(id))
            setGrn(response.transaction)
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch GRN details')
            navigate('/inventory/grn')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async () => {
        modal.confirm({
            title: 'Confirm Goods Audit & Receipt',
            content: (
                <div style={{ marginTop: '16px' }}>
                    <Text>By approving this receipt, you confirm that:</Text>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                        <li>Goods physical quantity matches the "Accepted Qty" below.</li>
                        <li>Items have passed preliminary quality inspection.</li>
                        <li>Inventory stock levels will be incremented immediately.</li>
                    </ul>
                </div>
            ),
            okText: 'Approve & Update Inventory',
            cancelText: 'Cancel',
            okButtonProps: { style: { background: '#52c41a', borderColor: '#52c41a' }, loading: actionLoading },
            onOk: async () => {
                setActionLoading(true)
                try {
                    await storeTransactionService.approveTransaction(Number(id))
                    message.success('GRN approved and stock updated!')
                    fetchGRN()
                } catch (error: any) {
                    message.error(error.response?.data?.message || 'Failed to approve receipt')
                } finally {
                    setActionLoading(false)
                }
            }
        })
    }

    const handleReject = async () => {
        modal.confirm({
            title: 'Reject Receipt Request?',
            icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
            content: 'Are you sure you want to reject this goods receipt? No stock will be updated and the transaction will be marked as rejected.',
            okText: 'Reject Request',
            okType: 'danger',
            onOk: async () => {
                setActionLoading(true)
                try {
                    await storeTransactionService.rejectTransaction(Number(id))
                    message.success('GRN rejected')
                    fetchGRN()
                } catch (error: any) {
                    message.error(error.response?.data?.message || 'Failed to reject receipt')
                } finally {
                    setActionLoading(false)
                }
            }
        })
    }

    const getStatusColor = (status: string) => {
        const colors: any = {
            draft: 'default',
            pending: 'processing',
            approved: 'success',
            rejected: 'error',
        }
        return colors[status] || 'default'
    }

    if (!grn) {
        return (
            <PageContainer>
                <Card loading={loading}>
                    <div style={{ padding: '50px', textAlign: 'center' }}>
                        <Text type="secondary">Loading GRN details...</Text>
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
                    <Text strong>{material?.name || record?.material_name || 'Unknown Item'}</Text>
                    {material?.material_code && <div style={{ fontSize: '12px', color: theme.colors.neutral.gray500 }}>{material.material_code}</div>}
                </div>
            )
        },
        {
            title: 'Received Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'right' as const,
            render: (qty: number, record: any) => <Tag color="blue" style={{ border: 'none' }}>{qty} {record.unit || record.material?.unit || ''}</Tag>
        },
        {
            title: 'Unit Price',
            dataIndex: 'unit_price',
            key: 'price',
            align: 'right' as const,
            render: (price: number) => price ? `₹ ${Number(price).toLocaleString('en-IN')}` : '-'
        },
        {
            title: 'Batch / Expiry',
            key: 'batch',
            render: (_: any, record: any) => (
                <div style={{ fontSize: '12px' }}>
                    {record.batch_number && <div>Batch: {record.batch_number}</div>}
                    {record.expiry_date && <div>Exp: {dayjs(record.expiry_date).format('DD-MMM-YYYY')}</div>}
                    {!record.batch_number && !record.expiry_date && '-'}
                </div>
            )
        }
    ]

    return (
        <PageContainer maxWidth={1200}>
            <PageHeader
                title={`GRN: ${grn.transaction_number || 'Pending'}`}
                subtitle={`Receipt recorded on ${dayjs(grn.transaction_date).format('DD MMM YYYY')}`}
                icon={<FileTextOutlined />}
                extra={[
                    <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate('/inventory/grn')} style={getSecondaryButtonStyle()}>Back to List</Button>,
                    <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()} style={getSecondaryButtonStyle()}>Print Report</Button>,
                    (grn.status === 'draft' || grn.status === 'pending') && (
                        <Space key="actions">
                            <Button danger icon={<CloseOutlined />} onClick={handleReject}>Reject</Button>
                            <Button type="primary" style={{ background: '#52c41a', borderColor: '#52c41a' }} icon={<CheckOutlined />} onClick={handleApprove}>Approve & Update Stock</Button>
                        </Space>
                    )
                ]}
            />

            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <SectionCard title="Receipt Information" icon={<InboxOutlined />}>
                        <Descriptions
                            bordered
                            column={{ xs: 1, sm: 2, md: 3 }}
                            size="small"
                            labelStyle={{ background: '#fafafa', width: '150px', fontWeight: 600, color: theme.colors.neutral.gray700 }}
                            contentStyle={{ background: '#fff', color: theme.colors.neutral.gray800 }}
                        >
                            <Descriptions.Item label="System ID">
                                <Text strong>#{grn.id}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="System Status">
                                <Tag color={getStatusColor(grn.status)} style={{ fontWeight: 600, borderRadius: '4px' }}>
                                    {grn.status === 'draft' ? 'DRAFT' : grn.status === 'pending' ? 'PENDING APPROVAL' : grn.status?.toUpperCase()}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Recorded By">
                                <Space size={4}>
                                    <UserOutlined style={{ color: theme.colors.primary.main }} />
                                    <Text>{grn.creator?.name || 'System Administrator'}</Text>
                                </Space>
                            </Descriptions.Item>

                            <Descriptions.Item label="Received From">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: '10px', textTransform: 'uppercase' }}>{grn.source_type || 'Vendor'}</Text>
                                    <Text strong>{grn.vendor?.name || grn.source_project?.name || 'Manual Supplier'}</Text>
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Store Destination">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: '10px', textTransform: 'uppercase' }}>{grn.destination_type || 'Warehouse'}</Text>
                                    <Text strong>{grn.warehouse?.name || grn.to_project?.name || 'N/A'}</Text>
                                    {grn.warehouse?.code && <Text type="secondary" style={{ fontSize: '11px' }}>({grn.warehouse.code})</Text>}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Linked PO">
                                {grn.purchase_order ? (
                                    <Tag color="purple" style={{ cursor: 'pointer', margin: 0 }} onClick={() => navigate(`/purchase-orders/${grn.purchase_order_id}`)}>
                                        {grn.purchase_order.po_number || grn.purchase_order.temp_number}
                                    </Tag>
                                ) : <Text type="secondary">Direct / Ad-hoc Receipt</Text>}
                            </Descriptions.Item>

                            <Descriptions.Item label="Lorry / Vehicle">
                                <Space direction="vertical" size={0}>
                                    <Text strong>{grn.truck_number || '-'}</Text>
                                    {grn.lorry_receipt_number && <Text type="secondary" style={{ fontSize: '11px' }}>LR: {grn.lorry_receipt_number}</Text>}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="E-Way Bill">{grn.eway_bill_number || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Reference No.">{grn.reference_number || '-'}</Descriptions.Item>

                            <Descriptions.Item label="Remarks" span={3}>
                                {grn.remarks || <Text type="secondary" italic>No additional remarks provided.</Text>}
                            </Descriptions.Item>
                        </Descriptions>
                    </SectionCard>

                    {/* Status Alerts */}
                    {(grn.status === 'approved' || grn.status === 'rejected') && (
                        <div style={{
                            marginTop: '16px',
                            padding: '16px 24px',
                            background: grn.status === 'approved' ? '#f6ffed' : '#fff1f0',
                            border: `1px solid ${grn.status === 'approved' ? '#b7eb8f' : '#ffa39e'}`,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            {grn.status === 'approved' ? (
                                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '24px' }} />
                            ) : (
                                <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '24px' }} />
                            )}
                            <div>
                                <Text strong style={{ color: grn.status === 'approved' ? '#52c41a' : '#ff4d4f', fontSize: '16px' }}>
                                    {grn.status === 'approved' ? 'Inventory Successfully Updated' : 'Receipt Request Rejected'}
                                </Text>
                                <div style={{ fontSize: '13px', color: grn.status === 'approved' ? '#52c41a' : '#ff4d4f', opacity: 0.8 }}>
                                    {grn.status === 'approved'
                                        ? 'The items listed below have been added to the destination project/warehouse stock levels.'
                                        : 'This transaction was rejected and stock was not updated. Please check the remarks for details.'}
                                </div>
                            </div>
                        </div>
                    )}

                    <SectionCard title="Items Ledger" icon={<BarcodeOutlined />} style={{ marginTop: '16px' }}>
                        <Table
                            dataSource={grn.items}
                            columns={[
                                ...itemColumns,
                                {
                                    title: 'Status',
                                    dataIndex: 'item_status',
                                    key: 'status',
                                    width: 150,
                                    render: (status: string) => <Tag color={status === 'Good' ? 'green' : 'orange'}>{status || 'Good'}</Tag>
                                },
                                {
                                    title: 'Accepted Qty',
                                    dataIndex: 'accepted_quantity',
                                    key: 'accepted',
                                    width: 140,
                                    align: 'right' as const,
                                    render: (val: number) => <Text strong type="success">{Number(val).toFixed(2)}</Text>
                                },
                                {
                                    title: 'Rejected Qty',
                                    dataIndex: 'rejected_quantity',
                                    key: 'rejected',
                                    width: 140,
                                    align: 'right' as const,
                                    render: (val: number) => Number(val) > 0 ? <Text strong type="danger">{Number(val).toFixed(2)}</Text> : <Text type="secondary">0.00</Text>
                                }
                            ]}
                            pagination={false}
                            rowKey="id"
                            bordered
                            scroll={{ x: 1000 }}
                            size="middle"
                        />
                    </SectionCard>

                    <SectionCard title="Visual Proof & Uploaded Documents" icon={<BarcodeOutlined />} style={{ marginTop: '16px' }}>
                        <Row gutter={20}>
                            {[
                                { title: 'Delivery Challan', img: getFileUrl(grn.challan_image), icon: <FileTextOutlined /> },
                                { title: 'Supplier Invoice', img: getFileUrl(grn.invoice_image), icon: <FileTextOutlined /> },
                                { title: 'Goods Photo', img: getFileUrl(grn.goods_image), icon: <BarcodeOutlined /> },
                                { title: 'Receiver Confirmation', img: getFileUrl(grn.receiver_image), icon: <UserOutlined /> }
                            ].map((doc, i) => (
                                <Col xs={12} md={6} key={i}>
                                    <div style={{
                                        border: '1px solid #f0f0f0',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        background: '#fff',
                                        textAlign: 'center',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                    }}>
                                        {doc.img ? (
                                            <div style={{ position: 'relative' }}>
                                                <img
                                                    src={doc.img}
                                                    alt={doc.title}
                                                    style={{ width: '100%', height: '180px', objectFit: 'cover', cursor: 'pointer' }}
                                                    onClick={() => window.open(doc.img, '_blank')}
                                                />
                                                <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
                                                    <Tag color="blue" style={{ margin: 0 }}>View Full</Tag>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ padding: '40px 10px', color: '#d9d9d9', height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#fafafa' }}>
                                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{doc.icon}</div>
                                                <div style={{ fontSize: '12px', fontWeight: 500 }}>No Attachment</div>
                                            </div>
                                        )}
                                        <div style={{ padding: '12px', borderTop: '1px solid #f0f0f0' }}>
                                            <div style={{ fontSize: '11px', color: theme.colors.neutral.gray600, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{doc.title}</div>
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </SectionCard>
                </Col>
            </Row>
        </PageContainer>
    )
}

const GRNDetailsWrapper = () => (
    <App>
        <GRNDetails />
    </App>
)

export default GRNDetailsWrapper
