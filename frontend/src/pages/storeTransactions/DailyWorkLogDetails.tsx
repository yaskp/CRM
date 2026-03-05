import { useState, useEffect } from 'react'
import { Row, Col, Card, Tag, Descriptions, Table, Typography, Space, Button, Image, Divider, Statistic, List, message as antdMessage } from 'antd'
import {
    CloudOutlined,
    TeamOutlined,
    CameraOutlined,
    FileTextOutlined,
    EnvironmentOutlined,
    DashboardOutlined,
    PrinterOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import dayjs from 'dayjs'

const { Text, Paragraph } = Typography

const DailyWorkLogDetails = () => {
    const { id } = useParams<{ id: string }>()
    const [loading, setLoading] = useState(false)
    const [log, setLog] = useState<any>(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (id) fetchLogDetails()
    }, [id])

    const fetchLogDetails = async () => {
        setLoading(true)
        try {
            const res = await storeTransactionService.getTransaction(Number(id))
            setLog(res.transaction)
        } catch (error) {
            console.error('Failed to fetch log details', error)
            antdMessage.error('Failed to load log details')
        } finally {
            setLoading(false)
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

    const manpowerList = log.manpower_data ? JSON.parse(log.manpower_data) : []
    const photoList = log.progress_photos ? JSON.parse(log.progress_photos) : []

    const materialColumns = [
        {
            title: 'Material',
            key: 'material',
            render: (_: any, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.material?.name}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{record.material?.material_code}</Text>
                </Space>
            )
        },
        {
            title: 'Issued',
            dataIndex: 'issued_quantity',
            align: 'right' as const,
        },
        {
            title: 'Consumed',
            dataIndex: 'quantity',
            align: 'right' as const,
            render: (val: any) => <Text strong color="blue">{val}</Text>
        },
        {
            title: 'Returned',
            dataIndex: 'returned_quantity',
            align: 'right' as const,
        },
        {
            title: 'Wastage',
            dataIndex: 'wastage_quantity',
            align: 'right' as const,
        },
        {
            title: 'Work Done',
            key: 'work_done',
            align: 'right' as const,
            render: (_: any, record: any) => (
                <Space>
                    <Text strong>{record.work_done_quantity}</Text>
                    <Text type="secondary">{record.unit || record.material?.uom}</Text>
                </Space>
            )
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

    return (
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
                            <Descriptions.Item label="Status">
                                <Tag color={log.status === 'approved' ? 'success' : 'processing'}>
                                    {log.status.toUpperCase()}
                                </Tag>
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

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

                    {/* Manpower */}
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
    )
}

export default DailyWorkLogDetails
