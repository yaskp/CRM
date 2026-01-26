import { useState, useEffect } from 'react'
import { Select, Button, Table, Row, Col, Typography, Space, Empty, Tag, Card } from 'antd'
import {
    PieChartOutlined,
    FileExcelOutlined,
    SearchOutlined,
    CarryOutOutlined,
    StockOutlined
} from '@ant-design/icons'
import { PageContainer, PageHeader, SectionCard } from '../../components/common/PremiumComponents'
import { projectService } from '../../services/api/projects'
import { reportsService } from '../../services/api/reports'
import {
    getPrimaryButtonStyle,
    largeInputStyle
} from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Text } = Typography
const { Option } = Select

const ProcurementStatusReport = () => {
    const [loading, setLoading] = useState(false)
    const [projects, setProjects] = useState<any[]>([])
    const [selectedProject, setSelectedProject] = useState<number | null>(null)
    const [reportData, setReportData] = useState<any[]>([])

    useEffect(() => {
        fetchProjects()
    }, [])

    const fetchProjects = async () => {
        try {
            const response = await projectService.getProjects()
            setProjects(response.projects || [])
        } catch (error) {
            console.error('Failed to fetch projects')
        }
    }

    const fetchReport = async () => {
        if (!selectedProject) return

        setLoading(true)
        try {
            const response = await reportsService.getProcurementStatus({ project_id: selectedProject })
            setReportData(response.data || [])
        } catch (error) {
            console.error('Failed to fetch report')
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        {
            title: 'Material / Product',
            dataIndex: 'material_name',
            key: 'material',
            fixed: 'left' as const,
            width: 200,
            render: (text: string, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{text}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{record.material_code}</Text>
                </Space>
            )
        },
        {
            title: 'Unit',
            dataIndex: 'unit',
            key: 'unit',
            width: 80,
        },
        {
            title: 'Requisitioned (MR)',
            dataIndex: 'mr_qty',
            key: 'mr',
            align: 'right' as const,
            render: (val: any) => <Text strong style={{ color: theme.colors.primary.main }}>{val || 0}</Text>
        },
        {
            title: 'Ordered (PO)',
            dataIndex: 'po_qty',
            key: 'po',
            align: 'right' as const,
            render: (val: any) => <Text strong style={{ color: '#fa8c16' }}>{val || 0}</Text>
        },
        {
            title: 'Received (GRN)',
            dataIndex: 'grn_qty',
            key: 'grn',
            align: 'right' as const,
            render: (val: any) => <Text strong style={{ color: '#52c41a' }}>{val || 0}</Text>
        },
        {
            title: 'Transfer to Site (STN)',
            dataIndex: 'stn_qty',
            key: 'stn',
            align: 'right' as const,
        },
        {
            title: 'Consumed (MIN)',
            dataIndex: 'min_qty',
            key: 'min',
            align: 'right' as const,
            render: (val: any) => <Text strong style={{ color: theme.colors.error.main }}>{val || 0}</Text>
        },
        {
            title: 'Site Balance',
            key: 'balance',
            align: 'right' as const,
            render: (_: any, record: any) => {
                const balance = (Number(record.stn_qty) || 0) - (Number(record.min_qty) || 0)
                return <Tag color={balance > 0 ? 'green' : 'red'}>{balance.toFixed(2)}</Tag>
            }
        },
        {
            title: 'Status',
            key: 'status',
            render: (_: any, record: any) => {
                const mr = Number(record.mr_qty) || 0
                const grn = Number(record.grn_qty) || 0
                if (grn >= mr && mr > 0) return <Tag color="success">Fulfilled</Tag>
                if (grn > 0) return <Tag color="warning">In Progress</Tag>
                return <Tag color="default">Pending</Tag>
            }
        }
    ]

    return (
        <PageContainer>
            <PageHeader
                title="Material Procurement Status (MPSR)"
                subtitle="Track material journey from requisition to consumption."
                icon={<PieChartOutlined />}
                extra={[
                    <Button key="export" icon={<FileExcelOutlined />}>Export Report</Button>
                ]}
            />

            <SectionCard title="Filter Criteria" icon={<SearchOutlined />}>
                <Row gutter={16} align="middle">
                    <Col xs={24} md={16}>
                        <Select
                            style={{ width: '100%', ...largeInputStyle }}
                            placeholder="Select Project to Analyze..."
                            onChange={setSelectedProject}
                            size="large"
                            showSearch
                            optionFilterProp="children"
                        >
                            {projects.map(p => (
                                <Option key={p.id} value={p.id}>{p.name} ({p.project_code})</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} md={8}>
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            onClick={fetchReport}
                            size="large"
                            disabled={!selectedProject}
                            loading={loading}
                            style={{ ...getPrimaryButtonStyle(), width: '100%' }}
                        >
                            Load Status
                        </Button>
                    </Col>
                </Row>
            </SectionCard>

            {reportData.length > 0 ? (
                <div style={{ marginTop: 24 }}>
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                        <Col span={6}>
                            <Card size="small" title="Requisitions">
                                <Statistic value={reportData.length} suffix="Materials" />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card size="small" title="PO Issued">
                                <Statistic value={reportData.filter(d => Number(d.po_qty) > 0).length} suffix="Items" />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card size="small" title="Received">
                                <Statistic value={reportData.filter(d => Number(d.grn_qty) > 0).length} suffix="Items" />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card size="small" title="Avg Consumption">
                                <Statistic value={15.4} suffix="%" prefix={<StockOutlined />} />
                            </Card>
                        </Col>
                    </Row>

                    <SectionCard title="Detailed Material Flow" icon={<CarryOutOutlined />}>
                        <Table
                            dataSource={reportData}
                            columns={columns}
                            rowKey="material_id"
                            scroll={{ x: 1200 }}
                            pagination={{ pageSize: 10 }}
                            bordered
                        />
                    </SectionCard>
                </div>
            ) : (
                <div style={{ marginTop: 60, textAlign: 'center' }}>
                    <Empty description="Select a project and click 'Load Status' to see the procurement lifecycle" />
                </div>
            )}
        </PageContainer>
    )
}

const Statistic = ({ title, value, prefix, suffix }: any) => (
    <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <div style={{ fontSize: 13, color: theme.colors.neutral.gray500, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.primary.main }}>
            {prefix} {value} <small style={{ fontSize: 14, fontWeight: 400 }}>{suffix}</small>
        </div>
    </div>
)

export default ProcurementStatusReport
