import { useState, useEffect } from 'react'
import { Table, Button, Space, message, Tag, Card, Typography, Row, Col, Empty, Progress, Statistic, Tooltip } from 'antd'
import { FileTextOutlined, SyncOutlined, InfoCircleOutlined, PieChartOutlined, BarChartOutlined, CarryOutOutlined } from '@ant-design/icons'
import { boqService, BOQ, BOQItem } from '../../services/api/boqs'
import { theme } from '../../styles/theme'

const { Text, Title } = Typography

interface ProjectBOQProps {
    projectId: number
}

const ProjectBOQManager = ({ projectId }: ProjectBOQProps) => {
    const [loading, setLoading] = useState(false)
    const [selectedBOQ, setSelectedBOQ] = useState<BOQ | null>(null)

    useEffect(() => {
        fetchBOQs()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId])

    const fetchBOQs = async (autoInitialize = true) => {
        setLoading(true)
        try {
            const res = await boqService.getProjectBOQs(projectId)

            if (res.boqs && res.boqs.length > 0) {
                const active = res.boqs.find((b: any) => b.status === 'approved') || res.boqs[0]
                fetchBOQDetails(active.id)
            } else if (autoInitialize) {
                // If no BOQs exist, try an automatic sync to show data immediately
                console.log('No BOQ found, attempting auto-initialization from quotation...')
                await handleSync(false)
            } else {
                setSelectedBOQ(null)
            }
        } catch (error: any) {
            console.error('fetchBOQs Error:', error)
            message.error(error.response?.data?.message || 'Failed to fetch Bill of Quantities (BOQ)')
        } finally {
            setLoading(false)
        }
    }

    const fetchBOQDetails = async (id: number) => {
        try {
            const res = await boqService.getBOQDetails(id)
            setSelectedBOQ(res.boq)
        } catch (error) {
            message.error('Failed to fetch Bill of Quantities (BOQ) details')
        }
    }

    const handleSync = async (showSuccess: any = true) => {
        // Handle click event if triggered from button
        const shouldShowSuccess = typeof showSuccess === 'boolean' ? showSuccess : true;

        setLoading(true)
        try {
            await boqService.syncFromQuotation(projectId)
            if (shouldShowSuccess) message.success('Bill of Quantities (BOQ) successfully initialised from Quotation')
            await fetchBOQs(false)
        } catch (error: any) {
            if (shouldShowSuccess || error.response?.status !== 404) {
                message.error(error.response?.data?.message || 'Sync failed')
            }
        } finally {
            setLoading(false)
        }
    }

    const itemColumns = [
        {
            title: 'No.',
            key: 'ref',
            width: 50,
            render: (_: any, __: any, index: number) => <Text type="secondary">{index + 1}</Text>
        },
        {
            title: 'Material Name',
            key: 'material',
            render: (_: any, record: BOQItem) => (
                <div style={{ minWidth: 200 }}>
                    <Text strong style={{ display: 'block' }}>{record.material?.name}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>Code: {record.material?.material_code}</Text>
                </div>
            )
        },
        {
            title: 'Work Type',
            key: 'workType',
            render: (_: any, record: BOQItem) => (
                record.workItemType ? (
                    <Tag color="geekblue" style={{ border: 'none' }}>
                        {record.workItemType.name}
                        {record.workItemType.uom ? ` (${record.workItemType.uom})` : ''}
                    </Tag>
                ) : <Text type="secondary">-</Text>
            )
        },
        {
            title: 'Project Area',
            key: 'location',
            render: (_: any, record: BOQItem) => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {record.building?.building_name || 'Project-Wide'}
                    {record.floor ? ` / ${record.floor.floor_name}` : ''}
                </Text>
            )
        },
        {
            title: 'Execution Status (Budget vs Consumed)',
            key: 'progress',
            width: 380,
            render: (_: any, record: BOQItem) => {
                const consumedPercent = Math.min(100, (Number(record.consumed_quantity) / Number(record.quantity)) * 100);
                const orderedPercent = Math.min(100, (Number(record.ordered_quantity) / Number(record.quantity)) * 100);

                // Extract color string from theme object if needed
                const errorColor = typeof theme.colors.error === 'string' ? theme.colors.error : theme.colors.error.main;
                const primaryColor = typeof theme.colors.primary === 'string' ? theme.colors.primary : theme.colors.primary.main;

                return (
                    <div style={{ padding: '4px 12px 4px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ fontSize: 12 }}>
                                {record.consumed_quantity} <Text type="secondary" style={{ fontSize: 12 }}>/ {record.quantity} {record.unit}</Text>
                            </Text>
                            <Text strong style={{ fontSize: 12, color: consumedPercent > 90 ? errorColor : primaryColor }}>
                                {Math.round(consumedPercent)}% Used
                            </Text>
                        </div>
                        <Tooltip title={`Budget: ${record.quantity} | Ordered: ${record.ordered_quantity} | Consumed: ${record.consumed_quantity}`}>
                            <Progress
                                percent={consumedPercent}
                                success={{ percent: orderedPercent }}
                                size="small"
                                strokeColor={consumedPercent > 100 ? errorColor : '#52c41a'}
                                trailColor="#f0f0f0"
                                showInfo={false}
                            />
                        </Tooltip>
                    </div>
                );
            }
        },
        {
            title: 'Estimated Rate',
            dataIndex: 'estimated_rate',
            key: 'rate',
            align: 'right' as const,
            render: (r: number) => `₹${Number(r).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        },
        {
            title: 'Amount',
            dataIndex: 'estimated_amount',
            key: 'amount',
            align: 'right' as const,
            render: (a: number) => <Text strong style={{ color: typeof theme.colors.primary === 'string' ? theme.colors.primary : theme.colors.primary.main }}>₹{Number(a).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
        }
    ]

    const calculateTotal = (type: 'ordered' | 'consumed') => {
        if (!selectedBOQ || !selectedBOQ.items) return 0;
        return selectedBOQ.items.reduce((acc, curr) => {
            const qty = type === 'ordered' ? Number(curr.ordered_quantity) : Number(curr.consumed_quantity);
            return acc + (qty * Number(curr.estimated_rate));
        }, 0);
    }

    return (
        <div style={{ padding: '0' }}>
            {selectedBOQ ? (
                <>
                    {/* FINANCIAL SUMMARY ROW */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} sm={12} lg={6}>
                            <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: '#fff', borderTop: '4px solid #1890ff' }}>
                                <Statistic
                                    title={<Text type="secondary" style={{ fontSize: 13 }}><PieChartOutlined /> Contracted Budget</Text>}
                                    value={Number(selectedBOQ.total_estimated_amount)}
                                    precision={2}
                                    prefix="₹"
                                    valueStyle={{ color: '#1890ff', fontWeight: 600, fontSize: 22 }}
                                />
                                <div style={{ marginTop: 4 }}><Text type="secondary" style={{ fontSize: 11 }}>Fixed from accepted Quotation</Text></div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: '#fff', borderTop: '4px solid #722ed1' }}>
                                <Statistic
                                    title={<Text type="secondary" style={{ fontSize: 13 }}><CarryOutOutlined /> Procurement Value</Text>}
                                    value={calculateTotal('ordered')}
                                    precision={2}
                                    prefix="₹"
                                    valueStyle={{ color: '#722ed1', fontWeight: 600, fontSize: 22 }}
                                />
                                <Progress percent={Math.round((calculateTotal('ordered') / (Number(selectedBOQ.total_estimated_amount) || 1)) * 100)} size="small" strokeColor="#722ed1" showInfo={false} style={{ marginTop: 8 }} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: '#fff', borderTop: '4px solid #fa8c16' }}>
                                <Statistic
                                    title={<Text type="secondary" style={{ fontSize: 13 }}><BarChartOutlined /> Actual Consumption</Text>}
                                    value={calculateTotal('consumed')}
                                    precision={2}
                                    prefix="₹"
                                    valueStyle={{ color: '#fa8c16', fontWeight: 600, fontSize: 22 }}
                                />
                                <Progress percent={Math.round((calculateTotal('consumed') / (Number(selectedBOQ.total_estimated_amount) || 1)) * 100)} size="small" strokeColor="#fa8c16" showInfo={false} style={{ marginTop: 8 }} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: '#fff', borderTop: `4px solid ${typeof theme.colors.success === 'string' ? theme.colors.success : theme.colors.success.main}` }}>
                                <Statistic
                                    title={<Text type="secondary" style={{ fontSize: 13 }}><InfoCircleOutlined /> Remaining Funds</Text>}
                                    value={Number(selectedBOQ.total_estimated_amount) - calculateTotal('consumed')}
                                    precision={2}
                                    prefix="₹"
                                    valueStyle={{ color: typeof theme.colors.success === 'string' ? theme.colors.success : theme.colors.success.main, fontWeight: 600, fontSize: 22 }}
                                />
                                <div style={{ marginTop: 4 }}><Text type="secondary" style={{ fontSize: 11 }}>Unutilized project budget</Text></div>
                            </Card>
                        </Col>
                    </Row>

                    {/* MAIN BOQ TABLE */}
                    <Card
                        variant="borderless"
                        style={{ borderRadius: 8, boxShadow: '0 1px 10px rgba(0,0,0,0.05)' }}
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Space size="middle">
                                    <div style={{ background: '#f0faff', padding: '10px', borderRadius: '8px' }}>
                                        <FileTextOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                                    </div>
                                    <div>
                                        <Text strong style={{ fontSize: 16, display: 'block' }}>Bill of Quantities (BOQ)</Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Status: <Tag color="green" style={{ border: 'none', background: '#f6ffed' }}>APPROVED & ACTIVE</Tag></Text>
                                    </div>
                                </Space>
                                <Button
                                    icon={<SyncOutlined />}
                                    onClick={handleSync}
                                    loading={loading}
                                    type="text"
                                    style={{ color: typeof theme.colors.primary === 'string' ? theme.colors.primary : theme.colors.primary.main }}
                                >
                                    Re-Sync from Quotation
                                </Button>
                            </div>
                        }
                    >
                        <Table
                            dataSource={selectedBOQ.items || []}
                            columns={itemColumns}
                            rowKey="id"
                            size="middle"
                            pagination={{ pageSize: 12, hideOnSinglePage: true }}
                            className="premium-boq-table"
                        />
                    </Card>
                </>
            ) : (
                <Card variant="borderless" style={{ textAlign: 'center', padding: '120px 0', borderRadius: 12, background: '#fafafa' }}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        styles={{ image: { height: 100 } }}
                        description={
                            <div style={{ maxWidth: 450, margin: '0 auto' }}>
                                <Title level={4} style={{ color: '#262626' }}>Bill of Quantities (BOQ) Required</Title>
                                <Text type="secondary" style={{ fontSize: 14 }}>
                                    This project does not have an active Bill of Quantities (BOQ). Standard industry flow requires initializing materials from the master Quotation to begin tracking.
                                </Text>
                                <div style={{ marginTop: 32 }}>
                                    <Button type="primary" size="large" icon={<SyncOutlined />} onClick={handleSync} loading={loading} style={{ height: 48, padding: '0 32px', borderRadius: 24, fontWeight: 600 }}>
                                        Initialize BOQ from Quotation
                                    </Button>
                                </div>
                            </div>
                        }
                    />
                </Card>
            )}

            <style>{`
                .premium-boq-table .ant-table-thead > tr > th {
                    background: #fbfbfb;
                    font-weight: 600;
                    color: #595959;
                    font-size: 13px;
                }
                .premium-boq-table .ant-table-row:hover > td {
                    background: #fcfcfc !important;
                }
                .premium-boq-table .ant-progress-bg {
                    height: 8px !important;
                }
                .premium-boq-table .ant-progress-inner {
                    background-color: #f0f0f0;
                }
            `}</style>
        </div>
    )
}

export default ProjectBOQManager
