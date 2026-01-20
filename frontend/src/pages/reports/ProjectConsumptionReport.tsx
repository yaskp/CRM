
import { useState, useEffect } from 'react'
import { Card, Select, DatePicker, Button, Table, Row, Col, Statistic, Typography, Space, Empty } from 'antd'
import {
    BarChartOutlined,
    FileExcelOutlined,
    SearchOutlined,
    TeamOutlined,
    ExperimentOutlined
} from '@ant-design/icons'
import { PageContainer, PageHeader, SectionCard } from '../../components/common/PremiumComponents'
import { projectService } from '../../services/api/projects'
import { reportsService } from '../../services/api/reports'
import {
    getPrimaryButtonStyle,
    largeInputStyle
} from '../../styles/styleUtils'
import dayjs from 'dayjs'

const { Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const ProjectConsumptionReport = () => {
    const [loading, setLoading] = useState(false)
    const [projects, setProjects] = useState<any[]>([])
    const [selectedProject, setSelectedProject] = useState<number | null>(null)
    const [dateRange, setDateRange] = useState<any>(null)
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
            const params: any = { project_id: selectedProject }
            if (dateRange) {
                params.start_date = dateRange[0].format('YYYY-MM-DD')
                params.end_date = dateRange[1].format('YYYY-MM-DD')
            }

            const response = await reportsService.getProjectConsumption(params)
            setReportData(response.data || [])
        } catch (error) {
            console.error('Failed to fetch report')
        } finally {
            setLoading(false)
        }
    }

    // Aggregation Logic
    const totals = reportData.reduce((acc, curr) => ({
        steel: acc.steel + (Number(curr.steel_kg) || 0),
        concrete: acc.concrete + (Number(curr.concrete_m3) || 0),
        diesel: acc.diesel + (Number(curr.diesel_liters) || 0),
        steel_worker: acc.steel_worker + (Number(curr.steel_worker_shifts) || 0),
        concrete_worker: acc.concrete_worker + (Number(curr.concrete_worker_shifts) || 0),
        dept_worker: acc.dept_worker + (Number(curr.dept_worker_shifts) || 0),
        skilled_worker: acc.skilled_worker + (Number(curr.electrician_shifts) || 0) + (Number(curr.welder_shifts) || 0),
    }), {
        steel: 0, concrete: 0, diesel: 0,
        steel_worker: 0, concrete_worker: 0, dept_worker: 0, skilled_worker: 0
    })

    const manpowerColumns = [
        { title: 'Date', dataIndex: 'report_date', render: (d: string) => dayjs(d).format('DD-MMM-YYYY') },
        { title: 'Steel Worker (Shifts)', dataIndex: 'steel_worker_shifts', align: 'center' as const },
        { title: 'Concrete Worker (Shifts)', dataIndex: 'concrete_worker_shifts', align: 'center' as const },
        { title: 'Dept. Worker (Shifts)', dataIndex: 'dept_worker_shifts', align: 'center' as const },
        { title: 'Skilled (Elec/Weld)', render: (r: any) => (Number(r.electrician_shifts) || 0) + (Number(r.welder_shifts) || 0), align: 'center' as const },
    ]

    const materialColumns = [
        { title: 'Date', dataIndex: 'report_date', render: (d: string) => dayjs(d).format('DD-MMM-YYYY') },
        { title: 'Steel (kg)', dataIndex: 'steel_kg', align: 'right' as const, render: (v: any) => Number(v).toFixed(2) },
        { title: 'Concrete (m³)', dataIndex: 'concrete_m3', align: 'right' as const, render: (v: any) => Number(v).toFixed(2) },
        { title: 'Diesel (L)', dataIndex: 'diesel_liters', align: 'right' as const, render: (v: any) => Number(v).toFixed(1) },
    ]

    return (
        <PageContainer>
            <PageHeader
                title="Project Consumption Report"
                subtitle="Finance-ready analysis of manpower and material consumption derived from site DPRs."
                icon={<BarChartOutlined />}
                extra={
                    <Button icon={<FileExcelOutlined />}>Export to Excel</Button>
                }
            />

            <SectionCard title="Report Filters" icon={<SearchOutlined />}>
                <Row gutter={16} align="middle">
                    <Col xs={24} md={8}>
                        <div style={{ marginBottom: 8 }}><Text strong>Select Project</Text></div>
                        <Select
                            style={{ width: '100%', ...largeInputStyle }}
                            placeholder="Choose Project..."
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
                        <div style={{ marginBottom: 8 }}><Text strong>Date Range (Optional)</Text></div>
                        <RangePicker
                            style={{ width: '100%', ...largeInputStyle }}
                            size="large"
                            onChange={setDateRange}
                        />
                    </Col>
                    <Col xs={24} md={8}>
                        <div style={{ marginBottom: 8 }}>&nbsp;</div>
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            onClick={fetchReport}
                            size="large"
                            disabled={!selectedProject}
                            loading={loading}
                            style={{ ...getPrimaryButtonStyle(), width: '100%' }}
                        >
                            Generate Report
                        </Button>
                    </Col>
                </Row>
            </SectionCard>

            {reportData.length > 0 ? (
                <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 24 }}>

                    {/* Summary Cards */}
                    <Row gutter={16}>
                        <Col xs={24} md={8}>
                            <Card bordered={false} style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
                                <Statistic
                                    title="Total Manpower Shifts"
                                    value={totals.steel_worker + totals.concrete_worker + totals.dept_worker + totals.skilled_worker}
                                    prefix={<TeamOutlined />}
                                    valueStyle={{ color: '#389e0d' }}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>Used for Labor Cost Calculation</Text>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card bordered={false} style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}>
                                <Statistic
                                    title="Total Steel Consumption"
                                    value={totals.steel}
                                    precision={2}
                                    suffix="kg"
                                    prefix={<ExperimentOutlined />}
                                    valueStyle={{ color: '#096dd9' }}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>Derived from Daily Usage</Text>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card bordered={false} style={{ background: '#fff7e6', borderColor: '#ffd591' }}>
                                <Statistic
                                    title="Total Diesel"
                                    value={totals.diesel}
                                    precision={2}
                                    suffix="L"
                                    valueStyle={{ color: '#d46b08' }}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>For Machinery Costing</Text>
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={24}>
                        <Col xs={24} lg={12}>
                            <SectionCard title="Manpower Breakdown (Shifts)" icon={<TeamOutlined />}>
                                <Table
                                    dataSource={reportData}
                                    columns={manpowerColumns}
                                    rowKey="report_date"
                                    size="small"
                                    pagination={{ pageSize: 5 }}
                                />
                            </SectionCard>
                        </Col>
                        <Col xs={24} lg={12}>
                            <SectionCard title="Material Breakdown" icon={<ExperimentOutlined />}>
                                <Table
                                    dataSource={reportData}
                                    columns={materialColumns}
                                    rowKey="report_date"
                                    size="small"
                                    pagination={{ pageSize: 5 }}
                                />
                            </SectionCard>
                        </Col>
                    </Row>

                </Space>
            ) : (
                <div style={{ marginTop: 40, textAlign: 'center' }}>
                    <Empty description={selectedProject ? "No data found for selected range" : "Select a project to view consumption report"} />
                </div>
            )}
        </PageContainer>
    )
}

export default ProjectConsumptionReport
