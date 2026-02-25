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
import { theme } from '../../styles/theme'

const { Text, Title } = Typography
const { Option } = Select

interface ProjectQuotationBOQProps {
    projectId: number
}

const ProjectQuotationBOQ = ({ projectId }: ProjectQuotationBOQProps) => {
    const navigate = useNavigate()
    const [quotations, setQuotations] = useState<any[]>([])
    const [selectedQuotation, setSelectedQuotation] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [designQtys, setDesignQtys] = useState({
        excavation: 0,
        concrete: 0,
        reinforcement: 0,
        stopEnd: 0,
        guideWall: 0
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
            let totalExcavation = 0 // L × D (SQM)
            let totalConcrete = 0   // L × W × D (CUM) — width in metres
            let totalReinf = 0
            let totalStopEnd = 0    // same as excavation SQM

            for (const drawing of drawings) {
                const pRes = await drawingService.getPanels(drawing.id)
                const panels = pRes.panels || []
                panels.forEach((p: any) => {
                    // Parse coordinates_json
                    let dims: any = {}
                    try {
                        dims = typeof p.coordinates_json === 'string'
                            ? JSON.parse(p.coordinates_json)
                            : (p.coordinates_json || {})
                    } catch (e) { dims = {} }

                    // Priority: Top-level DB column > coordinates_json
                    // Length in metres
                    const l = Number(p.length || dims.length || 0)
                    // Depth (vertical excavation depth) in metres
                    const d = Number(p.design_depth || p.depth || dims.depth || dims.height || 0)
                    // Width (wall thickness) in metres — stored as metres (e.g. 0.85 for 850mm)
                    const w = Number(p.width || dims.width || 0)
                    // Reinforcement in tonnes
                    const reinf = Number(p.reinforcement_ton || 0)

                    totalL += l
                    totalExcavation += l * d              // SQM
                    totalConcrete += l * w * d            // CUM (w already in metres)
                    totalReinf += reinf
                    totalStopEnd += l * d
                })
            }

            setDesignQtys({
                excavation: totalExcavation,
                concrete: totalConcrete,
                reinforcement: totalReinf,
                stopEnd: totalStopEnd,
                guideWall: totalL
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                        <AuditOutlined style={{ color: theme.colors.primary.main }} />
                        <Title level={4} style={{ margin: 0 }}>Bill of Quantities (BoQ)</Title>
                    </Space>
                    <Space>
                        {quotations.length > 0 && (
                            <Select
                                value={selectedQuotation?.id}
                                onChange={(val) => fetchFullQuotation(val)}
                                style={{ width: 250 }}
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
                </div>
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

                    <Title level={5} style={{ marginBottom: 16 }}>Detailed Breakdown</Title>
                    <Table
                        columns={boqColumns}
                        dataSource={processedItems}
                        rowKey="id"
                        pagination={false}
                        bordered
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
