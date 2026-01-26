import { useState, useEffect } from 'react'
import { Tag, Button, Row, Col, Typography, Table, message, Space, Descriptions, Card } from 'antd'
import {
    ArrowLeftOutlined,
    InboxOutlined,
    PrinterOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    BarcodeOutlined,
    SwapOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard } from '../../components/common/PremiumComponents'
import { theme } from '../../styles/theme'
import { getSecondaryButtonStyle } from '../../styles/styleUtils'

const { Text } = Typography

const STNDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [stn, setStn] = useState<any>(null)

    useEffect(() => {
        if (id) {
            fetchSTN()
        }
    }, [id])

    const fetchSTN = async () => {
        setLoading(true)
        try {
            const response = await storeTransactionService.getTransaction(Number(id))
            setStn(response.transaction)
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch STN details')
            navigate('/inventory/stn')
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

    if (!stn) {
        return (
            <PageContainer>
                <Card loading={loading}>
                    <div style={{ padding: '50px', textAlign: 'center' }}>
                        <Text type="secondary">Loading STN details...</Text>
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
            title: 'Transferred Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'right' as const,
            render: (qty: number, record: any) => <Tag color="blue">{qty} {record.unit || ''}</Tag>
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
        <PageContainer maxWidth={1150}>
            <PageHeader
                title={`STN: ${stn.transaction_number || 'Pending'}`}
                subtitle={`Transaction Date: ${dayjs(stn.transaction_date).format('DD MMM YYYY')}`}
                icon={<SwapOutlined />}
                extra={[
                    <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate('/inventory/stn')} style={getSecondaryButtonStyle()}>Back</Button>,
                    <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()} style={getSecondaryButtonStyle()}>Print</Button>
                ]}
            />

            <Row gutter={[16, 16]}>
                <Col span={24}>
                    {/* Main Info */}
                    <SectionCard title="Transfer Route" icon={<InboxOutlined />}>
                        <Descriptions bordered column={{ xs: 1, sm: 3 }} size="middle">
                            <Descriptions.Item label={<Text type="secondary">Source (From)</Text>}>
                                <div>
                                    <Tag color="orange" style={{ marginBottom: '4px' }}>{stn.source_type?.toUpperCase() || 'WAREHOUSE'}</Tag>
                                    <div>{stn.warehouse?.name || stn.source_project?.name || '-'}</div>
                                    {(stn.warehouse?.code || stn.source_project?.project_code) && (
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            ({stn.warehouse?.code || stn.source_project?.project_code})
                                        </Text>
                                    )}
                                </div>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Destination (To)</Text>}>
                                <div>
                                    <Tag color="blue" style={{ marginBottom: '4px' }}>{stn.destination_type?.toUpperCase() || 'WAREHOUSE'}</Tag>
                                    <div>{stn.toWarehouse?.name || stn.destination_project?.name || '-'}</div>
                                    {(stn.toWarehouse?.code || stn.destination_project?.project_code) && (
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            ({stn.toWarehouse?.code || stn.destination_project?.project_code})
                                        </Text>
                                    )}
                                </div>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Status</Text>}>
                                <Tag color={getStatusColor(stn.status)} style={{ fontSize: '14px', padding: '4px 12px' }}>
                                    {stn.status.toUpperCase()}
                                </Tag>
                            </Descriptions.Item>

                            <Descriptions.Item label={<Text type="secondary">Created By</Text>}>
                                {stn.creator?.name || 'Unknown'}
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Approver</Text>}>
                                {stn.approver?.name || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">System ID</Text>}>
                                #{stn.id}
                            </Descriptions.Item>

                            <Descriptions.Item label={<Text type="secondary">Reference / Vehicle No.</Text>}>
                                {stn.reference_number || stn.remarks?.substring(0, 30) || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Remarks</Text>} span={2}>
                                {stn.remarks || '-'}
                            </Descriptions.Item>
                        </Descriptions>

                        {stn.status === 'rejected' && (
                            <div style={{ marginTop: '16px', padding: '12px', background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: '8px' }}>
                                <Space align="center">
                                    <CloseCircleOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />
                                    <Text strong style={{ color: '#ff4d4f' }}>Transfer Rejected - Stock transfer has been cancelled.</Text>
                                </Space>
                            </div>
                        )}

                        {stn.status === 'approved' && (
                            <div style={{ marginTop: '16px', padding: '12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '8px' }}>
                                <Space align="center">
                                    <CheckCircleOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
                                    <Text strong style={{ color: '#52c41a' }}>Transfer Approved - Stock moved to destination inventory.</Text>
                                </Space>
                            </div>
                        )}
                    </SectionCard>

                    {/* Items */}
                    <SectionCard title="Transferred Items" icon={<BarcodeOutlined />} style={{ marginTop: '16px' }}>
                        <Table
                            dataSource={stn.items}
                            columns={itemColumns}
                            pagination={false}
                            rowKey="id"
                            scroll={{ x: 600 }}
                            bordered
                        />
                    </SectionCard>
                </Col>
            </Row>
        </PageContainer>
    )
}

export default STNDetails
