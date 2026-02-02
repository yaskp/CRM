import { Card, Typography, Tooltip, Empty, Space, Divider } from 'antd'
import {
    CheckCircleFilled,
    StopFilled,
    ThunderboltFilled,
    FormatPainterFilled,
    SafetyCertificateFilled,
    InfoCircleOutlined
} from '@ant-design/icons'
import { theme } from '../../styles/theme'

const { Text, Title } = Typography

interface DrawingVisualizerProps {
    panels: any[]
    loading: boolean
}

const DrawingVisualizer = ({ panels, loading }: DrawingVisualizerProps) => {

    const getStatusInfo = (panel: any) => {
        const dprs = panel.dprRecords || []
        const consumptions = panel.consumptions || []

        // 1. Check for Red (QC Issues) - Priority 1
        const qcIssues: string[] = []
        const allLogs = [...consumptions, ...dprs]

        allLogs.forEach(log => {
            if (Number(log.verticality_x) > 0.5) qcIssues.push(`Verticality X: ${log.verticality_x}%`)
            if (Number(log.verticality_y) > 0.5) qcIssues.push(`Verticality Y: ${log.verticality_y}%`)
            if (Number(log.slurry_sand_content) > 3) qcIssues.push(`Sand Content: ${log.slurry_sand_content}%`)
        })

        if (qcIssues.length > 0) {
            return {
                status: 'QC Issue',
                color: '#ef4444', // Red
                icon: <StopFilled />,
                description: qcIssues.join(', ')
            }
        }

        // 2. Check for Green (Concreted)
        const hasConcrete = consumptions.some((c: any) =>
            (c.rmcLogs && c.rmcLogs.length > 0)
        ) || allLogs.some((d: any) => Number(d.concrete_quantity_cubic_meter) > 0)

        if (hasConcrete) {
            return {
                status: 'Concreted',
                color: '#22c55e', // Green
                icon: <CheckCircleFilled />,
                description: 'Concreting Complete'
            }
        }

        // 3. Check for Blue (Rebar Lowered)
        const hasRebar = allLogs.some((l: any) => l.cage_id_ref)
        if (hasRebar) {
            return {
                status: 'Rebar Lowered',
                color: '#3b82f6', // Blue
                icon: <SafetyCertificateFilled />,
                description: 'Cage Lowering Complete'
            }
        }

        // 4. Check for Yellow (Excavating)
        const hasExcavation = allLogs.some((l: any) => Number(l.actual_depth) > 0)
        if (hasExcavation) {
            const maxDepth = Math.max(...allLogs.map(l => Number(l.actual_depth || 0)))
            return {
                status: 'Excavating',
                color: '#eab308', // Yellow
                icon: <ThunderboltFilled />,
                description: `Excavation depth: ${maxDepth}m`
            }
        }

        return {
            status: 'Not Started',
            color: '#94a3b8', // Grey
            icon: <FormatPainterFilled />,
            description: 'Ready to mobilize'
        }
    }

    if (loading) return <div>Loading Layout...</div>
    if (!panels || panels.length === 0) return <Empty description="No panels identified for this drawing" />

    const legend = [
        { label: 'Not Started', color: '#94a3b8', icon: <FormatPainterFilled /> },
        { label: 'Excavating', color: '#eab308', icon: <ThunderboltFilled /> },
        { label: 'Rebar Lowered', color: '#3b82f6', icon: <SafetyCertificateFilled /> },
        { label: 'Concreted', color: '#22c55e', icon: <CheckCircleFilled /> },
        { label: 'QC Issue', color: '#ef4444', icon: <StopFilled /> }
    ]

    return (
        <Card bodyStyle={{ padding: '24px' }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={5} style={{ margin: 0 }}>Visual Traffic-Light Status Board (Panel Wise)</Title>
                <Space split={<Divider type="vertical" />}>
                    {legend.map(item => (
                        <Space key={item.label} size={4}>
                            <span style={{ color: item.color }}>{item.icon}</span>
                            <Text style={{ fontSize: 12 }}>{item.label}</Text>
                        </Space>
                    ))}
                </Space>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: '16px',
                padding: '8px'
            }}>
                {panels.map(panel => {
                    const info = getStatusInfo(panel)
                    return (
                        <Tooltip key={panel.id} title={
                            <div>
                                <Text strong style={{ color: '#fff' }}>Panel {panel.panel_identifier}</Text>
                                <br />
                                <Text style={{ color: '#fff', fontSize: 12 }}>{info.status}: {info.description}</Text>
                            </div>
                        }>
                            <div
                                style={{
                                    height: '80px',
                                    borderRadius: '8px',
                                    background: info.color + '15',
                                    border: `2px solid ${info.color}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)'
                                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.1)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    color: info.color,
                                    fontSize: 10
                                }}>
                                    {info.icon}
                                </div>
                                <Text strong style={{ color: info.color, fontSize: 16 }}>{panel.panel_identifier}</Text>
                                <Text type="secondary" style={{ fontSize: 9 }}>{panel.panel_type}</Text>
                            </div>
                        </Tooltip>
                    )
                })}
            </div>

            <div style={{ marginTop: 32, background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Space>
                    <InfoCircleOutlined style={{ color: theme.colors.primary.main }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Digital twin status is automatically updated based on the latest Daily Progress Reports (DPR).
                        Green indicates concreting is complete. Red indicates a technical non-conformance (QC Issue).
                    </Text>
                </Space>
            </div>
        </Card>
    )
}

export default DrawingVisualizer
