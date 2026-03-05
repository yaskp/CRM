import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Typography, message, Spin, Row, Col, Statistic, Tag, Space, Select, Empty, Button } from 'antd'
import {
    AuditOutlined,
    CheckCircleOutlined,
    HistoryOutlined,
    SafetyCertificateOutlined
} from '@ant-design/icons'
import { quotationService } from '../../services/api/quotations'
import { drawingService } from '../../services/api/drawings'
import { useAuth } from '../../context/AuthContext'
import { theme } from '../../styles/theme'

const { Text, Title } = Typography
const { Option } = Select

interface ProjectQuotationBOQProps {
    projectId: number
}

const ProjectQuotationBOQ = ({ projectId }: ProjectQuotationBOQProps) => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const isAdmin = user?.roles?.some(r => ['admin', 'super_admin'].includes(r.toLowerCase())) ?? false

    const [quotations, setQuotations] = useState<any[]>([])
    const [selectedQuotation, setSelectedQuotation] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [designQtys, setDesignQtys] = useState({
        excavation: 0,
        concrete: 0,
        reinforcement: 0,
        stopEnd: 0,
        guideWall: 0,
        totalAnchors: 0,      // sum of all anchor layers across all panels
        anchorLayerSummary: [] as { layer: number; anchors: number; length: number }[]
    })

    useEffect(() => {
        fetchInitialData()
    }, [projectId])

    const fetchInitialData = async () => {
        setLoading(true)
        try {
            // 1. Fetch Quotations
            const qRes = await quotationService.getQuotations({ project_id: projectId, limit: 100 })
            const quots = qRes.quotations || []
            setQuotations(quots)

            // Auto-select approved or latest
            const approved = quots.find((q: any) => q.status === 'approved' || q.status === 'accepted')
            if (approved) {
                fetchFullQuotation(approved.id)
            } else if (quots.length > 0) {
                fetchFullQuotation(quots[0].id)
            }

            // 2. Fetch Drawings & Panels for Design Quantities
            const dRes = await drawingService.getDrawings({ project_id: projectId })
            const drawings = dRes.drawings || []

            let totalL = 0
            let totalExcavation = 0
            let totalConcrete = 0
            let totalReinf = 0
            let totalStopEnd = 0
            let totalAnchors = 0
            const layerAccumulator: Record<number, { anchors: number; length: number }> = {}

            for (const drawing of drawings) {
                const pRes = await drawingService.getPanels(drawing.id)
                const panels = pRes.panels || []
                panels.forEach((p: any) => {
                    let dims: any = {}
                    try {
                        dims = typeof p.coordinates_json === 'string'
                            ? JSON.parse(p.coordinates_json)
                            : (p.coordinates_json || {})
                    } catch (e) { dims = {} }

                    const l = Number(p.length || dims.length || 0)
                    const d = Number(p.design_depth || p.depth || dims.depth || dims.height || 0)
                    const w = Number(p.width || dims.width || 0)
                    const reinf = Number(p.reinforcement_ton || 0)

                    totalL += l
                    totalExcavation += l * d
                    totalConcrete += l * w * d
                    totalReinf += reinf
                    totalStopEnd += l * d

                    // Accumulate anchor layers
                    const anchorLayers: any[] = p.anchor_layers || []
                    anchorLayers.forEach((layer: any, idx: number) => {
                        const layerNum = idx + 1
                        const nAnchors = Number(layer.no_of_anchors || 0)
                        const aLen = Number(layer.anchor_length || 0)
                        totalAnchors += nAnchors
                        if (!layerAccumulator[layerNum]) layerAccumulator[layerNum] = { anchors: 0, length: 0 }
                        layerAccumulator[layerNum].anchors += nAnchors
                        layerAccumulator[layerNum].length = Math.max(layerAccumulator[layerNum].length, aLen)
                    })
                    // Also count legacy flat anchor fields
                    if (anchorLayers.length === 0 && Number(p.no_of_anchors) > 0) {
                        totalAnchors += Number(p.no_of_anchors)
                        if (!layerAccumulator[1]) layerAccumulator[1] = { anchors: 0, length: 0 }
                        layerAccumulator[1].anchors += Number(p.no_of_anchors)
                        layerAccumulator[1].length = Math.max(layerAccumulator[1].length, Number(p.anchor_length || 0))
                    }
                })
            }

            const anchorLayerSummary = Object.entries(layerAccumulator)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([layer, data]) => ({ layer: Number(layer), ...data }))

            setDesignQtys({
                excavation: totalExcavation,
                concrete: totalConcrete,
                reinforcement: totalReinf,
                stopEnd: totalStopEnd,
                guideWall: totalL,
                totalAnchors,
                anchorLayerSummary,
            })

        } catch (error) {
            message.error('Failed to fetch BOQ data')
        } finally {
            setLoading(false)
        }
    }

    const fetchFullQuotation = async (id: number) => {
        try {
            const res = await quotationService.getQuotation(id)
            setSelectedQuotation(res.quotation)
        } catch (error) {
            message.error('Failed to fetch quotation details')
        }
    }

    const getDesignQtyForCode = (code: string) => {
        switch (code) {
            case 'DW-10': return designQtys.guideWall
            case 'DW-20': return designQtys.excavation
            case 'DW-22': return designQtys.reinforcement
            case 'DW-23': return designQtys.concrete
            case 'DW-24': return designQtys.stopEnd
            default: return 0
        }
    }

    const boqColumns = [
        {
            title: 'Code',
            dataIndex: 'code',
            key: 'code',
            width: 100,
            render: (text: string) => <Tag color="orange">{text || 'N/A'}</Tag>
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            flex: 1
        },
        {
            title: 'Unit',
            dataIndex: 'unit',
            key: 'unit',
            width: 80
        },
        {
            title: 'Design Qty',
            key: 'design_qty',
            width: 120,
            render: (_: any, record: any) => {
                const qty = getDesignQtyForCode(record.code)
                return qty > 0 ? <Text strong>{qty.toFixed(2)}</Text> : '-'
            }
        },
        {
            title: 'Approved Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 120,
            render: (val: any) => Number(val).toFixed(2)
        },
        {
            title: 'Rate',
            dataIndex: 'rate',
            key: 'rate',
            width: 120,
            render: (val: any) => `₹${Number(val).toLocaleString()}`
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            width: 150,
            render: (val: any) => <Text strong>₹{Number(val).toLocaleString()}</Text>
        }
    ]

    // Map quotation items to professional codes if they match descriptions
    const processedItems = selectedQuotation?.items?.map((item: any) => {
        let code = ''
        const desc = item.description.toLowerCase()

        // A. Prelims
        if (desc.includes('mobilization')) code = 'DW-01'
        else if (desc.includes('survey') || desc.includes('setting out')) code = 'DW-02'
        else if (desc.includes('platform')) code = 'DW-03'

        // B. Guide Wall
        else if (desc.includes('guide wall construction')) code = 'DW-10'
        else if (desc.includes('guide wall excavation')) code = 'DW-11'
        else if (desc.includes('guide wall concrete')) code = 'DW-12'
        else if (desc.includes('guide wall reinforcement')) code = 'DW-13'
        else if (desc.includes('guide wall')) code = 'DW-10' // Default for guide wall

        // C. Panels
        else if (desc.includes('panel excavation') || desc.includes('grabbing')) code = 'DW-20'
        else if (desc.includes('bentonite') || desc.includes('polymer')) code = 'DW-21'
        else if (desc.includes('reinforcement') || desc.includes('cage') || desc.includes('steel')) code = 'DW-22'
        else if (desc.includes('concrete') || desc.includes('tremie') || desc.includes('pouring')) code = 'DW-23'
        else if (desc.includes('stop end')) code = 'DW-24'
        else if (desc.includes('water stopper') || desc.includes('pvc')) code = 'DW-25'

        // D. Anchors
        else if (desc.includes('ground anchor') && desc.includes('testing')) code = 'DW-31'
        else if (desc.includes('anchor') && desc.includes('testing')) code = 'DW-31'
        else if (desc.includes('anchor')) code = 'DW-30'

        return { ...item, code }
    }) || []

    return (
        <Card
            title={
                <Row gutter={[16, 16]} align="middle" justify="space-between">
                    <Col xs={24} md={10}>
                        <Space>
                            <AuditOutlined style={{ color: theme.colors.primary.main }} />
                            <Title level={4} style={{ margin: 0 }}>Bill of Quantities (BoQ)</Title>
                        </Space>
                    </Col>
                    <Col xs={24} md={14} style={{ textAlign: window.innerWidth < 768 ? 'left' : 'right' }}>
                        <Space wrap>
                            {quotations.length > 0 && (
                                <Select
                                    value={selectedQuotation?.id}
                                    onChange={(val) => fetchFullQuotation(val)}
                                    style={{ width: window.innerWidth < 576 ? '100%' : 250 }}
                                    placeholder="Select Quotation Version"
                                >
                                    {quotations.map(q => (
                                        <Option key={q.id} value={q.id}>
                                            {q.quotation_number} ({q.status})
                                        </Option>
                                    ))}
                                </Select>
                            )}
                            {selectedQuotation && (
                                <Button
                                    type="primary"
                                    icon={<SafetyCertificateOutlined />}
                                    onClick={() => navigate(`/operations/work-orders/new?quotation_id=${selectedQuotation.id}`)}
                                >
                                    Create Work Order
                                </Button>
                            )}
                        </Space>
                    </Col>
                </Row>
            }
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>
            ) : !selectedQuotation ? (
                <Empty description="No approved quotation found for this project" />
            ) : (
                <>
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} md={6}>
                            <Statistic title="Quotation Total" value={selectedQuotation.total_amount} prefix="₹" precision={2} />
                        </Col>
                        <Col xs={24} md={6}>
                            <Statistic title="Final Inclusive" value={selectedQuotation.final_amount} prefix="₹" precision={2} valueStyle={{ color: '#3f8600' }} />
                        </Col>
                        <Col xs={24} md={6}>
                            <Statistic title="Status" value={selectedQuotation.status.toUpperCase()} valueStyle={{ fontSize: 16 }} prefix={<CheckCircleOutlined />} />
                        </Col>
                        <Col xs={24} md={6}>
                            <Statistic title="Version" value={selectedQuotation.version_number} prefix={<HistoryOutlined />} />
                        </Col>
                    </Row>

                    {/* Anchor Layers Summary (from panel data) */}
                    {designQtys.anchorLayerSummary.length > 0 && (
                        <Card
                            size="small"
                            title={
                                <Space>
                                    <span>🔩 Anchor Layers — Design Quantities</span>
                                    {isAdmin && (
                                        <Tag color="orange" style={{ fontSize: 11 }}>Admin: Edit anchors via Panel List View</Tag>
                                    )}
                                </Space>
                            }
                            style={{ marginBottom: 20, background: '#f6f8fc', border: '1px solid #e2e8f0' }}
                        >
                            <Row gutter={[12, 8]}>
                                {designQtys.anchorLayerSummary.map(ls => (
                                    <Col key={ls.layer} xs={12} sm={8} md={6}>
                                        <Card size="small" style={{ textAlign: 'center', background: '#fff' }}>
                                            <Text strong style={{ color: '#4a6fa5' }}>Layer {ls.layer}</Text><br />
                                            <Text style={{ fontSize: 12 }}>{ls.anchors} anchors</Text><br />
                                            {ls.length > 0 && <Text type="secondary" style={{ fontSize: 11 }}>Max length: {ls.length}m</Text>}
                                        </Card>
                                    </Col>
                                ))}
                                <Col xs={12} sm={8} md={6}>
                                    <Card size="small" style={{ textAlign: 'center', background: '#fff3cd' }}>
                                        <Text strong style={{ color: '#856404' }}>Total Anchors</Text><br />
                                        <Text style={{ fontSize: 18, fontWeight: 700, color: '#856404' }}>{designQtys.totalAnchors}</Text>
                                    </Card>
                                </Col>
                            </Row>
                        </Card>
                    )}

                    <Title level={5} style={{ marginBottom: 16 }}>Detailed Breakdown</Title>
                    <Table
                        columns={boqColumns}
                        dataSource={processedItems}
                        rowKey="id"
                        pagination={false}
                        bordered
                        scroll={{ x: 1000 }}
                        summary={(pageData) => {
                            let totalAmount = 0
                            pageData.forEach(({ amount }) => {
                                totalAmount += Number(amount)
                            })
                            return (
                                <Table.Summary fixed>
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} colSpan={6}>
                                            <Text strong>Sub-Total</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1}>
                                            <Text strong>₹{totalAmount.toLocaleString()}</Text>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                </Table.Summary>
                            )
                        }}
                    />
                </>
            )}
        </Card>
    )
}

export default ProjectQuotationBOQ
