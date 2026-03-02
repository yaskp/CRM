import { useState, useEffect } from 'react'
import { Card, Table, Typography, Space, message, Row, Col, Empty, Tag, Tooltip } from 'antd'
import { ApartmentOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { drawingService } from '../../services/api/drawings'
import { theme } from '../../styles/theme'

const { Text, Title } = Typography

interface ProjectAnchorsProps {
    projectId: number
}

const ProjectAnchors = ({ projectId }: ProjectAnchorsProps) => {
    const [drawings, setDrawings] = useState<any[]>([])
    const [selectedDrawing, setSelectedDrawing] = useState<any>(null)
    const [anchorData, setAnchorData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchDrawings()
    }, [projectId])

    useEffect(() => {
        if (selectedDrawing) {
            fetchAnchors(selectedDrawing.id)
        } else if (drawings.length > 0) {
            setSelectedDrawing(drawings[0])
        }
    }, [selectedDrawing, drawings])

    const fetchDrawings = async () => {
        setLoading(true)
        try {
            // Fetch drawings related to D-Wall or where anchors might exist
            const res = await drawingService.getDrawings({ project_id: projectId, drawing_type: 'D-Wall Layout' })
            // Usually anchors are in "D-Wall Layout" or similar
            const relevantDrawings = res.drawings || []
            setDrawings(relevantDrawings)
            if (relevantDrawings.length > 0) {
                setSelectedDrawing(relevantDrawings[0])
            }
        } catch (error) {
            message.error('Failed to fetch drawings')
        } finally {
            setLoading(false)
        }
    }

    const fetchAnchors = async (drawingId: number) => {
        setLoading(true)
        try {
            const res = await drawingService.getPanels(drawingId)
            const panels = res.panels || []

            // Flatten anchor layers into a list of rows
            const rows: any[] = []
            panels.forEach((panel: any) => {
                const layers = panel.anchors || []
                if (layers.length > 0) {
                    layers.forEach((layer: any, index: number) => {
                        rows.push({
                            key: `${panel.id}-${index}`,
                            panel_id: panel.panel_identifier,
                            layer_no: index + 1,
                            no_of_anchors: layer.no_of_anchors,
                            anchor_length: layer.anchor_length,
                            anchor_capacity: layer.anchor_capacity,
                            panel_type: panel.panel_type
                        })
                    })
                } else if (panel.no_of_anchors > 0) {
                    // Fallback for older data structure or single layer
                    rows.push({
                        key: `${panel.id}-single`,
                        panel_id: panel.panel_identifier,
                        layer_no: 1,
                        no_of_anchors: panel.no_of_anchors,
                        anchor_length: panel.anchor_length,
                        anchor_capacity: panel.anchor_capacity,
                        panel_type: panel.panel_type
                    })
                }
            })
            setAnchorData(rows)
        } catch (error) {
            message.error('Failed to fetch anchor details')
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        {
            title: 'Panel ID',
            dataIndex: 'panel_id',
            key: 'panel_id',
            render: (text: string, record: any, index: number) => {
                const obj = {
                    children: (
                        <Space direction="vertical" size={0}>
                            <Text strong>{text}</Text>
                            <Text type="secondary" style={{ fontSize: 10 }}>{record.panel_type}</Text>
                        </Space>
                    ),
                    props: {} as any,
                };

                // Grouping logic for rowSpan
                const firstIndex = anchorData.findIndex(item => item.panel_id === text);
                if (index === firstIndex) {
                    obj.props.rowSpan = anchorData.filter(item => item.panel_id === text).length;
                } else {
                    obj.props.rowSpan = 0;
                }

                return obj;
            },
            sorter: (a: any, b: any) => a.panel_id.localeCompare(b.panel_id)
        },
        {
            title: 'Layer',
            dataIndex: 'layer_no',
            key: 'layer_no',
            render: (val: number) => <Tag color="orange" style={{ borderRadius: 12 }}>Layer {val}</Tag>,
            sorter: (a: any, b: any) => a.layer_no - b.layer_no
        },
        {
            title: 'No. of Anchors',
            dataIndex: 'no_of_anchors',
            key: 'no_of_anchors',
            render: (val: any) => <Text strong>{val || '-'}</Text>,
            sorter: (a: any, b: any) => (a.no_of_anchors || 0) - (b.no_of_anchors || 0)
        },
        {
            title: 'Length (m)',
            dataIndex: 'anchor_length',
            key: 'anchor_length',
            render: (val: any) => val ? `${val} m` : '-',
            sorter: (a: any, b: any) => (a.anchor_length || 0) - (b.anchor_length || 0)
        },
        {
            title: 'Capacity (kN)',
            dataIndex: 'anchor_capacity',
            key: 'anchor_capacity',
            render: (val: any) => val ? `${val} kN` : <Text type="secondary">-</Text>,
            sorter: (a: any, b: any) => (a.anchor_capacity || 0) - (b.anchor_capacity || 0)
        },
        {
            title: 'Total Running Length',
            key: 'total_len',
            render: (_: any, record: any) => {
                const total = (Number(record.no_of_anchors || 0) * Number(record.anchor_length || 0)).toFixed(1)
                return <Text strong style={{ color: theme.colors.primary.main }}>{total} m</Text>
            }
        }
    ]

    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} lg={6}>
                <Card
                    title={<Space><ApartmentOutlined /> Select Layout</Space>}
                    bodyStyle={{ padding: 0 }}
                >
                    {drawings.length > 0 ? (
                        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            {drawings.map(d => (
                                <div
                                    key={d.id}
                                    onClick={() => setSelectedDrawing(d)}
                                    style={{
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        borderBottom: `1px solid ${theme.colors.neutral.gray100}`,
                                        background: selectedDrawing?.id === d.id ? theme.colors.primary.light + '10' : 'transparent',
                                        borderLeft: selectedDrawing?.id === d.id ? `4px solid ${theme.colors.primary.main}` : 'none'
                                    }}
                                >
                                    <Text strong style={{ display: 'block' }}>{d.drawing_name}</Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>{d.drawing_number}</Text>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Empty description="No drawings found" style={{ padding: '24px' }} />
                    )}
                </Card>
            </Col>

            <Col xs={24} lg={18}>
                <Card
                    title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space>
                                <Title level={4} style={{ margin: 0 }}>Anchor Details Breakdown</Title>
                                <Tooltip title="This view shows a row for every anchor layer across all panels in the selected layout.">
                                    <InfoCircleOutlined style={{ color: theme.colors.primary.main }} />
                                </Tooltip>
                            </Space>
                        </div>
                    }
                >
                    <Table
                        dataSource={anchorData}
                        columns={columns}
                        loading={loading}
                        pagination={{ pageSize: 20 }}
                        summary={pageData => {
                            let totalAnchors = 0;
                            let totalLength = 0;
                            pageData.forEach(({ no_of_anchors, anchor_length }) => {
                                totalAnchors += Number(no_of_anchors || 0);
                                totalLength += (Number(no_of_anchors || 0) * Number(anchor_length || 0));
                            });

                            return (
                                <Table.Summary fixed>
                                    <Table.Summary.Row style={{ background: '#fafafa' }}>
                                        <Table.Summary.Cell index={0} colSpan={2}><Text strong>Page Total</Text></Table.Summary.Cell>
                                        <Table.Summary.Cell index={1}><Text strong>{totalAnchors}</Text></Table.Summary.Cell>
                                        <Table.Summary.Cell index={2}></Table.Summary.Cell>
                                        <Table.Summary.Cell index={3}></Table.Summary.Cell>
                                        <Table.Summary.Cell index={4}><Text strong style={{ color: theme.colors.primary.main }}>{totalLength.toFixed(1)} m</Text></Table.Summary.Cell>
                                    </Table.Summary.Row>
                                </Table.Summary>
                            );
                        }}
                    />
                </Card>
            </Col>
        </Row>
    )
}

export default ProjectAnchors
