import { useState, useEffect } from 'react'
import { Table, Tag, Space, Button, Card, DatePicker, Select, Row, Col, Typography, Tooltip, Statistic } from 'antd'
import {
    HistoryOutlined,
    EyeOutlined,
    SearchOutlined,
    CheckCircleOutlined,
    SyncOutlined,
    CloseCircleOutlined,
    DashboardOutlined,
    TeamOutlined,
    RocketOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import { projectService } from '../../services/api/projects'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import dayjs from 'dayjs'
import { theme } from '../../styles/theme'

const { RangePicker } = DatePicker
const { Text } = Typography
const { Option } = Select

const DailyWorkLogList = () => {
    const [loading, setLoading] = useState(false)
    const [logs, setLogs] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
    const [filters, setFilters] = useState<any>({
        project_id: undefined,
        status: undefined,
        dateRange: null
    })

    const navigate = useNavigate()

    useEffect(() => {
        fetchMetadata()
        fetchLogs()
    }, [pagination.current, pagination.pageSize, filters])

    const fetchMetadata = async () => {
        try {
            const res = await projectService.getProjects({ limit: 100 })
            setProjects(res.projects || [])
        } catch (e) {
            console.error(e)
        }
    }

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const params: any = {
                type: 'CONSUMPTION',
                page: pagination.current,
                limit: pagination.pageSize,
                project_id: filters.project_id,
                status: filters.status
            }

            if (filters.dateRange) {
                params.start_date = filters.dateRange[0].format('YYYY-MM-DD')
                params.end_date = filters.dateRange[1].format('YYYY-MM-DD')
            }

            const res = await storeTransactionService.getTransactions(params)
            setLogs(res.transactions || [])
            setPagination(prev => ({ ...prev, total: res.pagination?.total || 0 }))
        } catch (error) {
            console.error('Failed to fetch work logs', error)
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        {
            title: 'Ref Number',
            dataIndex: 'transaction_number',
            key: 'transaction_number',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'Date',
            dataIndex: 'transaction_date',
            key: 'transaction_date',
            render: (date: string) => dayjs(date).format('DD MMM YYYY'),
        },
        {
            title: 'Project',
            dataIndex: ['project', 'name'],
            key: 'project',
            render: (name: string, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{name}</Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                        {[record.building?.name, record.floor?.name, record.zone?.name].filter(Boolean).join(' > ')}
                    </Text>
                </Space>
            )
        },
        {
            title: 'Work Type',
            key: 'work_type',
            render: (_: any, record: any) => {
                const workType = record.items?.[0]?.workItemType?.name || 'Multiple'
                return <Tag color="cyan">{workType}</Tag>
            }
        },
        {
            title: 'Efficiency',
            key: 'efficiency',
            align: 'center' as const,
            render: (_: any, record: any) => {
                // Calculate average efficiency for the log
                const efficiencyValues = record.items?.map((item: any) => {
                    const stdRate = item.material?.standard_rate
                    if (!stdRate || !item.work_done_quantity) return null
                    const actualRate = item.quantity / item.work_done_quantity
                    return (stdRate / actualRate) * 100
                }).filter((v: any) => v !== null)

                if (!efficiencyValues || efficiencyValues.length === 0) return '-'

                const avgEff = Math.round(efficiencyValues.reduce((a: number, b: number) => a + b, 0) / efficiencyValues.length)

                let color = 'success'
                if (avgEff < 70) color = 'error'
                else if (avgEff < 90) color = 'warning'

                return <Tag color={color}>{avgEff}%</Tag>
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const config: any = {
                    draft: { color: 'default', icon: <SyncOutlined spin />, label: 'Draft' },
                    pending: { color: 'processing', icon: <SyncOutlined spin />, label: 'Pending' },
                    approved: { color: 'success', icon: <CheckCircleOutlined />, label: 'Approved' },
                    rejected: { color: 'error', icon: <CloseCircleOutlined />, label: 'Rejected' },
                }
                const s = config[status] || config.draft
                return <Tag icon={s.icon} color={s.color}>{s.label.toUpperCase()}</Tag>
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any) => (
                <Space>
                    <Tooltip title="View Details">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/inventory/daily-work-log/${record.id}`)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ]

    // Summary stats
    const approvedCount = logs.filter(l => l.status === 'approved').length
    const avgEfficiency = Math.round(logs.reduce((sum, log) => {
        const efficiencyValues = log.items?.map((item: any) => {
            const stdRate = item.material?.standard_rate
            if (!stdRate || !item.work_done_quantity) return null
            const actualRate = item.quantity / item.work_done_quantity
            return (stdRate / actualRate) * 100
        }).filter((v: any) => v !== null)
        if (!efficiencyValues || efficiencyValues.length === 0) return sum + 100
        return sum + (efficiencyValues.reduce((a: number, b: number) => a + b, 0) / efficiencyValues.length)
    }, 0) / (logs.length || 1))

    return (
        <PageContainer maxWidth={1400}>
            <PageHeader
                title="Daily Work Log History"
                subtitle="Track and register daily progress, material consumption, and efficiency"
                icon={<HistoryOutlined />}
                extra={
                    <Button
                        type="primary"
                        icon={<RocketOutlined />}
                        onClick={() => navigate('/inventory/daily-work-log')}
                        style={{
                            background: theme.colors.primary.main,
                            height: '40px',
                            borderRadius: '8px',
                            fontWeight: 600
                        }}
                    >
                        New Work Log
                    </Button>
                }
            />

            {/* Quick Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card variant="borderless" className="premium-card">
                        <Statistic
                            title="Total Entries"
                            value={pagination.total}
                            prefix={<HistoryOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card variant="borderless" className="premium-card">
                        <Statistic
                            title="Approved"
                            value={approvedCount}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card variant="borderless" className="premium-card">
                        <Statistic
                            title="Avg. Efficiency"
                            value={avgEfficiency}
                            suffix="%"
                            valueStyle={{ color: avgEfficiency >= 90 ? '#cf1322' : '#3f8600' }}
                            prefix={<DashboardOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card variant="borderless" className="premium-card">
                        <Statistic
                            title="Manpower Reported"
                            value={logs.length * 8} // Dummy multiplier
                            prefix={<TeamOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Card className="premium-card" style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12} lg={6}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Project</Text>
                        <Select
                            placeholder="All Projects"
                            style={{ width: '100%' }}
                            allowClear
                            onChange={v => setFilters({ ...filters, project_id: v })}
                        >
                            {projects.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Date Range</Text>
                        <RangePicker
                            style={{ width: '100%' }}
                            onChange={v => setFilters({ ...filters, dateRange: v })}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Status</Text>
                        <Select
                            placeholder="All Status"
                            style={{ width: '100%' }}
                            allowClear
                            onChange={v => setFilters({ ...filters, status: v })}
                        >
                            <Option value="draft">Draft</Option>
                            <Option value="pending">Pending</Option>
                            <Option value="approved">Approved</Option>
                            <Option value="rejected">Rejected</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} lg={6} style={{ textAlign: 'right', marginTop: 24 }}>
                        <Button icon={<SearchOutlined />} onClick={fetchLogs} type="primary" style={{ width: '100%' }}>
                            Search Logs
                        </Button>
                    </Col>
                </Row>
            </Card>

            <Card className="premium-card" style={{ padding: 0 }}>
                <Table
                    columns={columns}
                    dataSource={logs}
                    loading={loading}
                    rowKey="id"
                    scroll={{ x: 1000 }}
                    pagination={{
                        ...pagination,
                        onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50']
                    }}
                />
            </Card>
        </PageContainer>
    )
}

export default DailyWorkLogList
