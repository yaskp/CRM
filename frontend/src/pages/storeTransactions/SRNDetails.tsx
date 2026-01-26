import { useState, useEffect } from 'react'
import { Card, Descriptions, Tag, Button, Row, Col, Typography, Divider, Table, message, Space } from 'antd'
import {
    ArrowLeftOutlined,
    RollbackOutlined,
    InfoCircleOutlined,
    PrinterOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    BarcodeOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import { theme } from '../../styles/theme'
import { getSecondaryButtonStyle, flexBetweenStyle } from '../../styles/styleUtils'

const { Text } = Typography

const SRNDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [srn, setSrn] = useState<any>(null)

    useEffect(() => {
        if (id) {
            fetchSRN()
        }
    }, [id])

    const fetchSRN = async () => {
        setLoading(true)
        try {
            const response = await storeTransactionService.getTransaction(Number(id))
            setSrn(response.transaction)
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch SRN details')
            navigate('/inventory/srn')
        } finally {
            setLoading(false)
        }
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

    if (!srn) {
        return (
            <PageContainer>
                <Card loading={loading}>
                    <div style={{ padding: '50px', textAlign: 'center' }}>
                        <Text type="secondary">Loading SRN details...</Text>
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
            title: 'Returned Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'right' as const,
            render: (qty: number, record: any) => <Tag color="orange">{qty} {record.unit || ''}</Tag>
        },
        {
            title: 'Remarks',
            dataIndex: 'remarks',
            key: 'remarks',
            render: (info: string) => info || '-'
        }
    ]

    // Determine Source and Destination Display Names
    let sourceName = 'Unknown'
    let destName = 'Unknown'
    let sourceType = 'Unknown'
    let destType = 'Unknown'

    // Logic inferred from SRNForm/Backend
    if (srn.from_project_id || srn.project_id) {
        // Site Return (Project -> Warehouse)
        sourceType = 'Project Site'
        sourceName = (srn.project || srn.fromProject)?.name

        destType = 'Warehouse'
        destName = (srn.warehouse || srn.toWarehouse)?.name
    } else if (srn.vendor_id && srn.warehouse_id) {
        // Purchase Return (Warehouse -> Vendor)
        sourceType = 'Warehouse'
        sourceName = srn.warehouse?.name

        destType = 'Vendor'
        destName = srn.vendor?.name
    }

    return (
        <PageContainer maxWidth={1150}>
            <PageHeader
                title={`SRN: ${srn.transaction_number || 'Pending'}`}
                subtitle={`Transaction Date: ${dayjs(srn.transaction_date).format('DD MMM YYYY')}`}
                icon={<RollbackOutlined />}
                extra={[
                    <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate('/inventory/srn')} style={getSecondaryButtonStyle()}>Back</Button>,
                    <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()} style={getSecondaryButtonStyle()}>Print</Button>
                ]}
            />

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                    {/* Main Info */}
                    <SectionCard title="Return Information" icon={<RollbackOutlined />}>
                        <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle">
                            <Descriptions.Item label={<Text type="secondary">Returned From ({sourceType})</Text>}>
                                <b>{sourceName}</b>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Returned To ({destType})</Text>}>
                                <b>{destName}</b>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Status</Text>}>
                                <Tag color={getStatusColor(srn.status)}>{srn.status.toUpperCase()}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Reference No.</Text>}>
                                {srn.reference_number || '-'}
                            </Descriptions.Item>
                            {(srn.purchase_order || srn.purchase_order_id) && (
                                <Descriptions.Item label={<Text type="secondary">Linked PO</Text>} span={2}>
                                    <Tag color="purple">{srn.purchase_order?.po_number || '#' + srn.purchase_order_id}</Tag>
                                </Descriptions.Item>
                            )}
                            <Descriptions.Item label={<Text type="secondary">Remarks</Text>} span={2}>
                                {srn.remarks || '-'}
                            </Descriptions.Item>
                        </Descriptions>
                    </SectionCard>

                    {/* Items */}
                    <SectionCard title="Returned Items" icon={<BarcodeOutlined />} style={{ marginTop: '16px' }}>
                        <Table
                            dataSource={srn.items}
                            columns={itemColumns}
                            pagination={false}
                            rowKey="id"
                            scroll={{ x: 600 }}
                        />
                    </SectionCard>

                </Col>

                <Col xs={24} lg={8}>
                    <InfoCard title="Transaction Details" icon={<InfoCircleOutlined />}>
                        <div style={flexBetweenStyle}>
                            <Text type="secondary">Created By:</Text>
                            <Text>{srn.creator?.name || 'Unknown'}</Text>
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div style={flexBetweenStyle}>
                            <Text type="secondary">Approver:</Text>
                            <Text>{srn.approver?.name || '-'}</Text>
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div style={flexBetweenStyle}>
                            <Text type="secondary">System ID:</Text>
                            <Text>#{srn.id}</Text>
                        </div>
                    </InfoCard>

                    {srn.status === 'rejected' && (
                        <Card style={{ marginTop: '16px', background: '#fff1f0', borderColor: '#ffa39e' }}>
                            <Space align="center">
                                <CloseCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
                                <div>
                                    <Text strong style={{ color: '#ff4d4f' }}>Return Rejected</Text>
                                    <div style={{ fontSize: '12px' }}>Stock return cancelled.</div>
                                </div>
                            </Space>
                        </Card>
                    )}

                    {srn.status === 'approved' && (
                        <Card style={{ marginTop: '16px', background: '#f6ffed', borderColor: '#b7eb8f' }}>
                            <Space align="center">
                                <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                                <div>
                                    <Text strong style={{ color: '#52c41a' }}>Return Approved</Text>
                                    <div style={{ fontSize: '12px' }}>Inventory has been updated.</div>
                                </div>
                            </Space>
                        </Card>
                    )}
                </Col>
            </Row>
        </PageContainer>
    )
}

export default SRNDetails
