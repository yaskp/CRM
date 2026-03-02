import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spin, Typography, Card, Row, Col, Descriptions, Tag, Button, Space, Divider, message, Table } from 'antd'
import {
    ArrowLeftOutlined,
    DownloadOutlined,
    PrinterOutlined,
    FileTextOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons'
import { storeTransactionService } from '../../services/api/storeTransactions'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard } from '../../components/common/PremiumComponents'
import { theme } from '../../styles/theme'

const { Text, Title } = Typography

const CreditNotePrint = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)
    const [srn, setSrn] = useState<any>(null)

    useEffect(() => {
        if (id) fetchData()
    }, [id])

    const fetchData = async () => {
        try {
            const response = await storeTransactionService.getTransaction(Number(id))
            setSrn(response.transaction)
        } catch (error) {
            message.error('Failed to load credit note details')
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async () => {
        setDownloading(true)
        try {
            const blob = await storeTransactionService.downloadCreditNotePDF(Number(id))
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            const cn = srn?.creditNote
            link.setAttribute('download', `CreditNote_${cn?.credit_note_number || srn?.transaction_number}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch {
            message.error('Failed to download PDF. Please try again.')
        } finally {
            setDownloading(false)
        }
    }

    const handlePrint = async () => {
        setDownloading(true)
        try {
            const blob = await storeTransactionService.downloadCreditNotePDF(Number(id))
            const url = window.URL.createObjectURL(blob)
            window.open(url, '_blank')
        } catch {
            message.error('Failed to open PDF for printing.')
        } finally {
            setDownloading(false)
        }
    }

    if (loading) {
        return (
            <PageContainer>
                <div style={{ textAlign: 'center', padding: '100px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>
                        <Text type="secondary">Loading Credit Note...</Text>
                    </div>
                </div>
            </PageContainer>
        )
    }

    if (!srn || !srn.creditNote) {
        return (
            <PageContainer>
                <Card style={{ textAlign: 'center', padding: '40px' }}>
                    <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                    <Title level={4}>No Credit Note Found</Title>
                    <Text type="secondary">This SRN does not have an associated Credit Note (only vendor-return SRNs generate Credit Notes).</Text>
                    <div style={{ marginTop: 24 }}>
                        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Go Back</Button>
                    </div>
                </Card>
            </PageContainer>
        )
    }

    const cn = srn.creditNote
    const vendor = srn.vendor
    const project = srn.project || srn.source_project

    const statusConfig: Record<string, { color: string; icon: JSX.Element }> = {
        approved: { color: 'success', icon: <CheckCircleOutlined /> },
        draft: { color: 'warning', icon: <ClockCircleOutlined /> },
        cancelled: { color: 'error', icon: <ClockCircleOutlined /> },
    }
    const statusInfo = statusConfig[cn.status] || statusConfig.draft

    const itemColumns = [
        {
            title: '#',
            key: 'idx',
            width: 45,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: 'Material Description',
            key: 'material',
            render: (_: any, record: any) => (
                <div>
                    <Text strong>{record.material?.name || 'N/A'}</Text>
                    {record.material?.material_code && (
                        <div><Text type="secondary" style={{ fontSize: 11 }}>Code: {record.material.material_code}</Text></div>
                    )}
                </div>
            ),
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'qty',
            width: 80,
            align: 'right' as const,
            render: (val: any) => Number(val).toFixed(2),
        },
        {
            title: 'Unit',
            key: 'unit',
            width: 70,
            render: (_: any, record: any) => record.unit || record.material?.unit || '-',
        },
        {
            title: 'Rate',
            dataIndex: 'unit_price',
            key: 'rate',
            width: 110,
            align: 'right' as const,
            render: (val: any) => `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        },
        {
            title: 'Tax %',
            dataIndex: 'tax_percentage',
            key: 'tax',
            width: 70,
            align: 'right' as const,
            render: (val: any) => `${Number(val)}%`,
        },
        {
            title: 'Amount',
            dataIndex: 'total_amount',
            key: 'amount',
            width: 130,
            align: 'right' as const,
            render: (val: any) => (
                <Text strong>₹{Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
            ),
        },
    ]

    return (
        <PageContainer>
            <PageHeader
                title={`Credit Note: ${cn.credit_note_number}`}
                subtitle={`Against SRN ${srn.transaction_number} • Dated ${dayjs(cn.transaction_date).format('DD MMM YYYY')}`}
                icon={<FileTextOutlined />}
                extra={[
                    <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back</Button>,
                    <Button
                        key="print"
                        icon={<PrinterOutlined />}
                        onClick={handlePrint}
                        loading={downloading}
                    >
                        View / Print PDF
                    </Button>,
                    <Button
                        key="download"
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleDownload}
                        loading={downloading}
                        style={{ background: theme.colors.primary.main }}
                    >
                        Download PDF
                    </Button>,
                ]}
            />

            <Row gutter={[16, 16]}>
                {/* Left: Main Details */}
                <Col xs={24} lg={16}>
                    <SectionCard title="Credit Note Details" icon={<FileTextOutlined />}>
                        <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                            <Descriptions.Item label="Credit Note No.">
                                <Tag color="blue" style={{ fontSize: 13, padding: '2px 8px' }}>{cn.credit_note_number}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Tag icon={statusInfo.icon} color={statusInfo.color}>{cn.status?.toUpperCase()}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Date">
                                {dayjs(cn.transaction_date).format('DD MMM YYYY')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Reference SRN">
                                <Text strong>{srn.transaction_number}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Vendor / Payee" span={2}>
                                <Text strong>{vendor?.name || 'N/A'}</Text>
                                {vendor?.gst_number && (
                                    <div><Text type="secondary" style={{ fontSize: 11 }}>GSTIN: {vendor.gst_number}</Text></div>
                                )}
                            </Descriptions.Item>
                            {project && (
                                <Descriptions.Item label="Project" span={2}>
                                    {project.name} {project.project_code && <Text type="secondary">({project.project_code})</Text>}
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </SectionCard>

                    <SectionCard title="Return Items" icon={<FileTextOutlined />} style={{ marginTop: 16 }}>
                        <Table
                            dataSource={cn.items || []}
                            columns={itemColumns}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            bordered
                            summary={() => (
                                <Table.Summary>
                                    <Table.Summary.Row style={{ background: '#fafafa' }}>
                                        <Table.Summary.Cell index={0} colSpan={6} align="right">
                                            <Text type="secondary">Sub Total</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} align="right">
                                            <Text>₹{Number(cn.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} colSpan={6} align="right">
                                            <Text type="secondary">Tax Amount</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} align="right">
                                            <Text>₹{Number(cn.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                    <Table.Summary.Row style={{ background: '#e6f7ff' }}>
                                        <Table.Summary.Cell index={0} colSpan={6} align="right">
                                            <Text strong style={{ fontSize: 14, color: theme.colors.primary.main }}>
                                                Credit Note Value
                                            </Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} align="right">
                                            <Text strong style={{ fontSize: 14, color: theme.colors.primary.main }}>
                                                ₹{Number(cn.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </Text>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                </Table.Summary>
                            )}
                        />
                    </SectionCard>

                    {(cn.remarks || srn.remarks) && (
                        <SectionCard title="Remarks / Return Reason" icon={<FileTextOutlined />} style={{ marginTop: 16 }}>
                            <div style={{
                                background: '#f9fafb',
                                padding: '12px 16px',
                                borderRadius: 8,
                                border: '1px dashed #d9d9d9',
                                lineHeight: 1.7,
                                color: '#555'
                            }}>
                                {cn.remarks || srn.remarks}
                            </div>
                        </SectionCard>
                    )}
                </Col>

                {/* Right: Quick Actions & Summary */}
                <Col xs={24} lg={8}>
                    <Card
                        style={{
                            background: 'linear-gradient(135deg, #1890ff11, #1890ff22)',
                            borderColor: '#1890ff44',
                            borderRadius: 12
                        }}
                    >
                        <div style={{ textAlign: 'center', padding: '8px 0' }}>
                            <FileTextOutlined style={{ fontSize: 36, color: theme.colors.primary.main, marginBottom: 8 }} />
                            <Title level={4} style={{ margin: 0, color: theme.colors.primary.main }}>
                                ₹{Number(cn.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </Title>
                            <Text type="secondary">Credit Note Value</Text>
                            <Divider style={{ margin: '12px 0' }} />
                            <Tag color={statusInfo.color} icon={statusInfo.icon} style={{ fontSize: 13 }}>
                                {cn.status?.toUpperCase()}
                            </Tag>
                        </div>
                    </Card>

                    <Card title="Document Actions" style={{ marginTop: 16 }} size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Button
                                icon={<PrinterOutlined />}
                                onClick={handlePrint}
                                loading={downloading}
                                block
                                size="large"
                            >
                                View / Print PDF
                            </Button>
                            <Button
                                type="primary"
                                icon={<DownloadOutlined />}
                                onClick={handleDownload}
                                loading={downloading}
                                block
                                size="large"
                                style={{ background: theme.colors.primary.main }}
                            >
                                Download PDF
                            </Button>
                        </Space>
                    </Card>

                    <Card title="Summary" style={{ marginTop: 16 }} size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text type="secondary">Subtotal</Text>
                            <Text>₹{Number(cn.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text type="secondary">Tax</Text>
                            <Text>₹{Number(cn.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                        </div>
                        <Divider style={{ margin: '8px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong>Total</Text>
                            <Text strong style={{ color: theme.colors.primary.main }}>
                                ₹{Number(cn.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </Text>
                        </div>
                    </Card>
                </Col>
            </Row>
        </PageContainer>
    )
}

export default CreditNotePrint
