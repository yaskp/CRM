import { useState, useEffect } from 'react'
import { Row, Col, Card, Tag, Descriptions, Table, Typography, Space, Button, Image, Divider, Statistic, List, message as antdMessage } from 'antd'
import {
    CloudOutlined,
    TeamOutlined,
    CameraOutlined,
    FileTextOutlined,
    EnvironmentOutlined,
    DashboardOutlined,
    PrinterOutlined,
    CheckCircleOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { projectContactService } from '../../services/api/projectContacts'
import dayjs from 'dayjs'
import DprPrintTemplate from '../dpr/DprPrintTemplate'

const { Text, Paragraph } = Typography

const DailyWorkLogDetails = () => {
    const { id } = useParams<{ id: string }>()
    const [, setLoading] = useState(false)
    const [log, setLog] = useState<any>(null)
    const [projectContacts, setProjectContacts] = useState<any[]>([])
    const navigate = useNavigate()

    useEffect(() => {
        if (id) fetchLogDetails()
    }, [id])

    const fetchLogDetails = async () => {
        setLoading(true)
        try {
            const res = await storeTransactionService.getTransaction(Number(id))
            setLog(res.transaction)
            if (res.transaction?.project_id) {
                fetchProjectContacts(res.transaction.project_id)
            }
        } catch (error) {
            console.error('Failed to fetch log details', error)
            antdMessage.error('Failed to load log details')
        } finally {
            setLoading(false)
        }
    }

    const fetchProjectContacts = async (projectId: number) => {
        try {
            const res = await projectContactService.getProjectContacts(projectId)
            setProjectContacts(res.contacts || [])
        } catch (error) {
            console.error('Failed to fetch project contacts', error)
        }
    }

    const handleApprove = async () => {
        try {
            await storeTransactionService.approveTransaction(Number(id))
            antdMessage.success('Daily Work Log approved!')
            fetchLogDetails()
        } catch (error: any) {
            antdMessage.error(error.response?.data?.message || 'Approval failed')
        }
    }

    const handleReject = async () => {
        try {
            await storeTransactionService.rejectTransaction(Number(id), 'Rejected by admin')
            antdMessage.success('Daily Work Log rejected')
            fetchLogDetails()
        } catch (error: any) {
            antdMessage.error(error.response?.data?.message || 'Rejection failed')
        }
    }

    if (!log) return null

    const manpowerList = log.manpowerLogs && log.manpowerLogs.length > 0
        ? log.manpowerLogs
        : (log.manpower_data ? JSON.parse(log.manpower_data) : [])
    const photoList = log.progress_photos ? JSON.parse(log.progress_photos) : []

    const materialColumns = [
        {
            title: 'Item / Material',
            key: 'item',
            render: (_: any, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.quotationItem?.description || record.material?.name || record.material_name}</Text>
                    {record.quotation_item_id && <Tag color="gold">Quotation Item</Tag>}
                    {record.material?.material_code && <Text type="secondary" style={{ fontSize: '10px' }}>{record.material.material_code}</Text>}
                </Space>
            )
        },
        ...((log.items || []).some((i: any) => i.issued_quantity > 0) ? [{
            title: 'Issued',
            dataIndex: 'issued_quantity',
            align: 'right' as const,
        }] : []),
        ...((log.items || []).some((i: any) => !!i.drawing_panel_id) ? [{
            title: 'Panel',
            key: 'panel',
            render: (_: any, record: any) => {
                const panel = log.drawingPanel || (log.panelWorkLogs || []).find((p: any) => p.id === record.drawing_panel_id || p.drawing_panel_id === record.drawing_panel_id)
                return panel?.panel_identifier || panel?.pile_identifier || record.drawing_panel_id || '-'
            }
        }] : []),
        {
            title: 'Consumed',
            dataIndex: 'quantity',
            align: 'right' as const,
            render: (val: any) => <Text strong color="blue">{val}</Text>
        },
        ...((log.items || []).some((i: any) => i.returned_quantity > 0) ? [{
            title: 'Returned',
            dataIndex: 'returned_quantity',
            align: 'right' as const,
        }] : []),
        ...((log.items || []).some((i: any) => i.wastage_quantity > 0 || i.wastage > 0) ? [{
            title: 'Wastage',
            dataIndex: 'wastage_quantity',
            align: 'right' as const,
        }] : []),
        {
            title: 'Work Done',
            key: 'work_done',
            align: 'right' as const,
            render: (_: any, record: any) => (
                <Space direction="vertical" align="end" size={0}>
                    <Space>
                        <Text strong>{record.work_done_quantity || 0}</Text>
                        <Text type="secondary">{record.unit || record.material?.uom}</Text>
                    </Space>
                    {!record.log_progress && <Tag color="default" style={{ fontSize: '10px' }}>No Progress Log</Tag>}
                </Space>
            )
        },
        {
            title: 'Remarks',
            dataIndex: 'remarks',
            ellipsis: true,
            render: (val: string) => val || '-'
        },
        {
            title: 'Efficiency',
            key: 'efficiency',
            align: 'center' as const,
            render: (_: any, record: any) => {
                const stdRate = record.material?.standard_rate
                if (!stdRate || !record.work_done_quantity) return '-'
                const actualRate = record.quantity / record.work_done_quantity
                const eff = Math.round((stdRate / actualRate) * 100)

                let color = 'success'
                if (eff < 70) color = 'error'
                else if (eff < 90) color = 'warning'
                return <Tag color={color}>{eff}%</Tag>
            }
        }
    ]

    const machineryList = log.machineryBreakdownLogs && log.machineryBreakdownLogs.length > 0
        ? log.machineryBreakdownLogs
        : (log.machinery_data ? JSON.parse(log.machinery_data) : [])

    const rmcList = log.rmcLogs && log.rmcLogs.length > 0
        ? log.rmcLogs
        : (log.rmc_logs ? JSON.parse(log.rmc_logs) : [])

    return (
        <div>
            <style>{`
                @media print {
                    .dpr-no-print { display: none !important; }
                    .dpr-only-print { display: block !important; }
                    @page { margin: 0; }
                    body { margin: 0; padding: 0; }
                }
                .dpr-only-print { display: none; }
            `}</style>

            <div className="dpr-only-print">
                <DprPrintTemplate
                    data={log}
                    project={log.project}
                    items={log.items || []}
                    manpower={manpowerList}
                    machinery={machineryList}
                    rmcLogs={rmcList}
                    selectedPanels={log.panelWorkLogs || log.pileWorkLogs || []}
                />
            </div>

            <div className="dpr-no-print">
                <PageContainer maxWidth={1400}>
                    <PageHeader
                        title={`Daily Work Log: ${log.transaction_number}`}
                        subtitle={`Reported on ${dayjs(log.transaction_date).format('DD MMMM YYYY')}`}
                        icon={<FileTextOutlined />}
                        onBack={() => navigate('/inventory/daily-work-log/history')}
                        extra={[
                            <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()}>Print</Button>,
                            log.status === 'pending' && (
                                <Space key="actions">
                                    <Button danger onClick={handleReject}>Reject</Button>
                                    <Button type="primary" onClick={handleApprove}>Approve & Log Progress</Button>
                                </Space>
                            )
                        ]}
                    />

                    <Row gutter={[24, 24]}>
                        {/* Left Side: Details & Materials */}
                        <Col xs={24} lg={16}>
                            <Card title={<><EnvironmentOutlined /> Location & Assignment</>} className="premium-card">
                                <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                                    <Descriptions.Item label="Project">{log.project?.name}</Descriptions.Item>
                                    <Descriptions.Item label="Store">{log.warehouse?.name}</Descriptions.Item>
                                    <Descriptions.Item label="Building">{log.building?.name || 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Floor">{log.floor?.name || 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Zone">{log.zone?.name || 'N/A'}</Descriptions.Item>
                                    {log.quotation && (
                                        <Descriptions.Item label="Quotation" span={2}>
                                            <Tag color="gold">{log.quotation.quotation_number}</Tag> {log.quotation.description}
                                        </Descriptions.Item>
                                    )}
                                    <Descriptions.Item label="Status">
                                        <Tag color={log.status === 'approved' ? 'success' : 'processing'}>
                                            {log.status.toUpperCase()}
                                        </Tag>
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>

                            {log.items && log.items.length > 0 && (
                                <Card
                                    title={<><Divider type="vertical" /> Materials & Achievement</>}
                                    className="premium-card"
                                    style={{ marginTop: 24 }}
                                >
                                    <Table
                                        dataSource={log.items}
                                        columns={materialColumns}
                                        pagination={false}
                                        rowKey="id"
                                        bordered
                                        scroll={{ x: 800 }}
                                    />
                                </Card>
                            )}

                            {log.panelWorkLogs && log.panelWorkLogs.length > 0 && (
                                <Card title={<><CheckCircleOutlined /> Structural Progress (Panel Execution QC)</>} className="premium-card" style={{ marginTop: 24 }}>
                                    <Table
                                        dataSource={log.panelWorkLogs}
                                        size="small"
                                        pagination={false}
                                        bordered
                                        rowKey="id"
                                        scroll={{ x: 1000 }}
                                        columns={[
                                            { title: 'Panel', dataIndex: 'panel_identifier', fixed: 'left', width: 100 },
                                            { title: 'Grab Depth', dataIndex: 'grabbing_depth', render: (v) => `${v || 0}m` },
                                            { title: 'Grab SQM', dataIndex: 'grabbing_sqm', render: (v) => `${v || 0} m²` },
                                            { title: 'Conc. Qty', render: (_, r: any) => <b>{r.actual_concrete_qty || 0}/{r.theoretical_concrete_qty || 0} cum</b> },
                                            { title: 'Conc. Grade', dataIndex: 'concrete_grade' },
                                            { title: 'Cage ID', dataIndex: 'cage_id_ref' },
                                        ]}
                                    />
                                </Card>
                            )}

                            {log.pileWorkLogs && log.pileWorkLogs.length > 0 && (
                                <Card title={<><CheckCircleOutlined /> Structural Progress (Pile Execution QC)</>} className="premium-card" style={{ marginTop: 24 }}>
                                    <Table
                                        dataSource={log.pileWorkLogs}
                                        size="small"
                                        pagination={false}
                                        bordered
                                        rowKey="id"
                                        scroll={{ x: 1000 }}
                                        columns={[
                                            { title: 'Pile No', dataIndex: 'pile_identifier', fixed: 'left', width: 100 },
                                            { title: 'Depth', dataIndex: 'achieved_depth', render: (v) => `${v || 0}m` },
                                            { title: 'Rock Socket', dataIndex: 'rock_socket_length', render: (v) => `${v || 0}m` },
                                            { title: 'Conc. Poured', dataIndex: 'actual_concrete_qty', render: (v) => <b>{v || 0} cum</b> },
                                            { title: 'Steel (MT)', dataIndex: 'steel_installed' },
                                            { title: 'Rig ID', dataIndex: 'rig_id' },
                                        ]}
                                    />
                                </Card>
                            )}

                            <Card
                                title={<><FileTextOutlined /> Remarks & Site Observations</>}
                                className="premium-card"
                                style={{ marginTop: 24 }}
                            >
                                <Paragraph style={{ fontSize: '16px', fontStyle: 'italic' }}>
                                    {log.remarks || 'No specific remarks recorded for this day.'}
                                </Paragraph>
                            </Card>
                        </Col>

                        {/* Right Side: Site Conditions, Manpower, Photos */}
                        <Col xs={24} lg={8}>
                            {/* Efficiency & Summary */}
                            <Card className="premium-card" style={{ background: 'linear-gradient(135deg, #134e4a 0%, #0d9488 100%)', color: 'white' }}>
                                <Statistic
                                    title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Daily Efficiency</span>}
                                    value={95} // Temporary mock
                                    suffix="%"
                                    valueStyle={{ color: 'white', fontWeight: 'bold' }}
                                    prefix={<DashboardOutlined />}
                                />
                                <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text style={{ color: 'white' }}>Reporter:</Text>
                                        <Text strong style={{ color: 'white' }}>{log.creator?.name}</Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text style={{ color: 'white' }}>Created At:</Text>
                                        <Text strong style={{ color: 'white' }}>{dayjs(log.created_at).format('hh:mm A')}</Text>
                                    </div>
                                </Space>
                            </Card>

                            {/* Site Conditions */}
                            <Card title={<><CloudOutlined /> Site Conditions</>} className="premium-card" style={{ marginTop: 24 }}>
                                <Descriptions column={1} size="small">
                                    <Descriptions.Item label="Weather">
                                        <Tag color="blue">{log.weather_condition || 'N/A'}</Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Temperature">{log.temperature ? `${log.temperature}°C` : 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Work Hours">{log.work_hours || 'N/A'}</Descriptions.Item>
                                </Descriptions>
                            </Card>

                            {/* Project Team */}
                            <Card title={<><TeamOutlined /> Project Team</>} className="premium-card" style={{ marginTop: 24 }}>
                                <List
                                    dataSource={projectContacts}
                                    renderItem={(member: any) => (
                                        <List.Item style={{ padding: '12px 0' }}>
                                            <div style={{ width: '100%' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: member.contact_type === 'labour_contractor' ? '8px' : '0' }}>
                                                    <div style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        background: ['client_contact', 'decision_maker', 'accounts'].includes(member.contact_type) ? '#fee2e2' :
                                                            member.contact_type === 'labour_contractor' ? '#f0fdf4' : '#e0f2fe',
                                                        color: ['client_contact', 'decision_maker', 'accounts'].includes(member.contact_type) ? '#991b1b' :
                                                            member.contact_type === 'labour_contractor' ? '#166534' : '#0369a1',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 'bold',
                                                        fontSize: '12px'
                                                    }}>
                                                        {member.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>{member.name}</div>
                                                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                                            {member.contact_type === 'labour_contractor' ? (member.company_name || 'Labour Contractor') : (member.contact_type?.replace('_', ' ') || member.designation || 'Site Staff')}
                                                        </div>
                                                    </div>
                                                </div>

                                                {member.contact_type === 'labour_contractor' && (
                                                    <div style={{
                                                        marginLeft: '44px',
                                                        padding: '8px',
                                                        background: '#f8fafc',
                                                        borderRadius: '6px',
                                                        border: '1px dashed #cbd5e1',
                                                        display: 'grid',
                                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                                        textAlign: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <div>
                                                            <div style={{ fontSize: '9px', color: '#94a3b8' }}>Labors</div>
                                                            <div style={{ fontWeight: 700, fontSize: '12px' }}>{member.labour_count || 0}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '9px', color: '#94a3b8' }}>Helpers</div>
                                                            <div style={{ fontWeight: 700, fontSize: '12px' }}>{member.helper_count || 0}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '9px', color: '#94a3b8' }}>Operators</div>
                                                            <div style={{ fontWeight: 700, fontSize: '12px' }}>{member.operator_count || 0}</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </List.Item>
                                    )}
                                    locale={{ emptyText: 'No project team data' }}
                                />
                            </Card>

                            {/* Manpower Usage (Historical categories) */}
                            <Card title={<><TeamOutlined /> Manpower Usage</>} className="premium-card" style={{ marginTop: 24 }}>
                                <List
                                    dataSource={manpowerList}
                                    renderItem={(item: any) => (
                                        <List.Item style={{ padding: '8px 0' }}>
                                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                                <Text strong>{item.worker_type}</Text>
                                                <Text>{item.count} Workers</Text>
                                            </Space>
                                        </List.Item>
                                    )}
                                    locale={{ emptyText: 'No manpower data' }}
                                />
                            </Card>

                            {/* Photos */}
                            <Card title={<><CameraOutlined /> Work Progress Photos</>} className="premium-card" style={{ marginTop: 24 }}>
                                <Row gutter={[8, 8]}>
                                    {photoList.length > 0 ? photoList.map((url: string, idx: number) => (
                                        <Col span={12} key={idx}>
                                            <Image
                                                src={url}
                                                style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                                            />
                                        </Col>
                                    )) : <Text type="secondary">No photos uploaded</Text>}
                                </Row>
                            </Card>
                        </Col>
                    </Row>
                </PageContainer>
            </div>
        </div>
    )
}

export default DailyWorkLogDetails
