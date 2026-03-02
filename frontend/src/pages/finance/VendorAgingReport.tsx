import { useState, useEffect } from 'react'
import { Card, Table, Typography, Space, Tag, Input, Row, Col, Statistic, Button } from 'antd'
import {
    ClockCircleOutlined,
    SearchOutlined,
    ReloadOutlined,
    DollarCircleOutlined,
    UserOutlined
} from '@ant-design/icons'
import { financeService } from '../../services/api/finance'
import { PageContainer, PageHeader, SectionCard } from '../../components/common/PremiumComponents'
import { theme } from '../../styles/theme'
import { largeInputStyle } from '../../styles/styleUtils'
import { useNavigate } from 'react-router-dom'

const { Text, Title } = Typography

const VendorAgingReport = () => {
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState<any[]>([])
    const [searchText, setSearchText] = useState('')
    const navigate = useNavigate()

    const fetchReport = async () => {
        setLoading(true)
        try {
            const res = await financeService.getVendorAgingReport()
            setReport(res.report || [])
        } catch (error) {
            console.error('Failed to fetch report', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReport()
    }, [])

    const filteredReport = report.filter(v =>
        v.name.toLowerCase().includes(searchText.toLowerCase()) ||
        v.code.toLowerCase().includes(searchText.toLowerCase())
    )

    const totalOutstanding = report.reduce((sum, v) => sum + v.total_outstanding, 0)

    const columns = [
        {
            title: 'Vendor Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{text}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.code}</Text>
                </Space>
            )
        },
        {
            title: 'Amount',
            dataIndex: 'total_outstanding',
            key: 'total_outstanding',
            align: 'right' as const,
            render: (val: number) => (
                <Title level={5} style={{ margin: 0, color: theme.colors.error.main }}>
                    ₹{val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Title>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_: any, record: any) => (
                <Button
                    type="primary"
                    icon={<DollarCircleOutlined />}
                    onClick={() => navigate(`/finance/transactions/new?vendorId=${record.id}&category=vendor`)}
                >
                    Pay Vendor
                </Button>
            )
        }
    ]

    const expandedRowRender = (vendor: any) => {
        const orderColumns = [
            { title: 'Date', dataIndex: 'date', key: 'date', render: (d: string) => new Date(d).toLocaleDateString() },
            { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color={t === 'PO' ? 'blue' : 'orange'}>{t}</Tag> },
            {
                title: 'Number', dataIndex: 'number', key: 'number', render: (n: string, r: any) => (
                    <Text strong style={{ color: theme.colors.primary.main, cursor: 'pointer' }} onClick={() => navigate(r.type === 'PO' ? `/procurement/purchase-orders/${r.id}` : `/operations/work-orders/${r.id}`)}>
                        {n}
                    </Text>
                )
            },
            { title: 'Project', dataIndex: 'project', key: 'project' },
            {
                title: 'Days',
                dataIndex: 'days',
                key: 'days',
                render: (days: number) => (
                    <Tag color={days > 90 ? 'red' : days > 60 ? 'orange' : days > 30 ? 'gold' : 'green'}>
                        {days} Days
                    </Tag>
                )
            },
            { title: 'Total', dataIndex: 'total', key: 'total', align: 'right' as const, render: (v: number) => `₹${v.toLocaleString()}` },
            { title: 'Paid', dataIndex: 'paid', key: 'paid', align: 'right' as const, render: (v: number) => `₹${v.toLocaleString()}` },
            { title: 'Balance', dataIndex: 'balance', key: 'balance', align: 'right' as const, render: (v: number) => <Text strong type="danger">₹{v.toLocaleString()}</Text> },
        ]

        return (
            <Table
                columns={orderColumns}
                dataSource={vendor.orders}
                pagination={false}
                size="small"
                rowKey={(r) => `${r.type}-${r.id}`}
            />
        )
    }

    return (
        <PageContainer>
            <PageHeader
                title="Vendor Aging Report"
                subtitle="Track outstanding liabilities and aging of accounts payable."
                icon={<ClockCircleOutlined />}
                extra={
                    <Space>
                        <Input
                            placeholder="Search vendors..."
                            prefix={<SearchOutlined />}
                            style={{ width: 250, ...largeInputStyle }}
                            onChange={e => setSearchText(e.target.value)}
                        />
                        <Button icon={<ReloadOutlined />} onClick={fetchReport} loading={loading}>Refresh</Button>
                    </Space>
                }
            />

            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}>
                    <Card variant="borderless" style={{ boxShadow: theme.shadows.sm }}>
                        <Statistic
                            title="Total Outstanding"
                            value={totalOutstanding}
                            precision={2}
                            prefix="₹"
                            valueStyle={{ color: theme.colors.error.main, fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card variant="borderless" style={{ boxShadow: theme.shadows.sm }}>
                        <Statistic
                            title="Total Vendors"
                            value={report.length}
                            prefix={<UserOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card variant="borderless" style={{ boxShadow: theme.shadows.sm }}>
                        <Statistic
                            title="Avg. Aging"
                            value={report.reduce((sum, v) => sum + (v.orders[0]?.days || 0), 0) / (report.length || 1)}
                            precision={0}
                            suffix=" Days"
                            prefix={<ClockCircleOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <SectionCard title="Outstanding Liabilities by Vendor">
                <Table
                    columns={columns}
                    dataSource={filteredReport}
                    loading={loading}
                    rowKey="id"
                    expandable={{
                        expandedRowRender,
                        defaultExpandAllRows: false,
                    }}
                    pagination={{ pageSize: 15 }}
                />
            </SectionCard>
        </PageContainer>
    )
}

export default VendorAgingReport
