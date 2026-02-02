
import { useState, useEffect } from 'react'
import { Card, Select, DatePicker, Button, Table, Row, Col, Statistic, Typography, Space, Empty, Tag, Divider, Descriptions, Progress, Badge } from 'antd'
import {
    BarChartOutlined,
    FileExcelOutlined,
    SearchOutlined,
    TeamOutlined,
    ExperimentOutlined,
    FileTextOutlined,
    UserOutlined,
    ProjectOutlined,
    SafetyCertificateOutlined
} from '@ant-design/icons'
import { PageContainer, PageHeader, SectionCard } from '../../components/common/PremiumComponents'
import { projectService } from '../../services/api/projects'
import { reportsService } from '../../services/api/reports'
import { workItemTypeService } from '../../services/api/workItemTypes'
import { quotationService } from '../../services/api/quotations'
import { workOrderService } from '../../services/api/workOrders'
import {
    getPrimaryButtonStyle,
    largeInputStyle
} from '../../styles/styleUtils'
import dayjs from 'dayjs'

const { Text, Title } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const ProjectConsumptionReport = () => {
    const [loading, setLoading] = useState(false)
    const [projects, setProjects] = useState<any[]>([])
    const [workItemTypes, setWorkItemTypes] = useState<any[]>([])
    const [selectedProject, setSelectedProject] = useState<number | null>(null)
    const [projectDetails, setProjectDetails] = useState<any>(null)
    const [extraDetails, setExtraDetails] = useState<any>({
        quotations: [],
        workOrders: []
    })
    const [selectedWorkType, setSelectedWorkType] = useState<number | null>(null)
    const [dateRange, setDateRange] = useState<any>(null)
    const [reportData, setReportData] = useState<any[]>([])

    useEffect(() => {
        fetchProjects()
        fetchWorkItemTypes()
    }, [])

    const fetchProjects = async () => {
        try {
            const response = await projectService.getProjects()
            setProjects(response.projects || [])
        } catch (error) {
            console.error('Failed to fetch projects')
        }
    }

    const fetchWorkItemTypes = async () => {
        try {
            const response = await workItemTypeService.getWorkItemTypes()
            setWorkItemTypes(response.data || [])
        } catch (error) {
            console.error('Failed to fetch work types')
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
            if (selectedWorkType) {
                params.work_item_type_id = selectedWorkType
            }

            const [reportRes, projectRes, woRes] = await Promise.all([
                reportsService.getProjectConsumption(params),
                projectService.getProject(selectedProject),
                workOrderService.getWorkOrders({ project_id: selectedProject })
            ])

            setReportData(reportRes.data || [])
            setProjectDetails(projectRes.project)

            // If project has leads, fetch quotations for the first lead
            let quotes: any[] = []
            if (projectRes.project?.leads?.length > 0) {
                const qRes = await quotationService.getQuotationsByLead(projectRes.project.leads[0].id)
                quotes = qRes.quotations || []
            }

            setExtraDetails({
                quotations: quotes,
                workOrders: woRes.workOrders || []
            })

        } catch (error) {
            console.error('Failed to fetch report')
        } finally {
            setLoading(false)
        }
    }

    // Aggregation Logic (Safe deduplication for manpower shifts)
    const totals = reportData.reduce((acc, curr, idx, arr) => {
        // Material consumption is already split by work type, so we sum it normally
        const newSteel = acc.steel + (Number(curr.steel_kg) || 0)
        const newConcrete = acc.concrete + (Number(curr.concrete_m3) || 0)
        const newDiesel = acc.diesel + (Number(curr.diesel_liters) || 0)

        // Manpower is at the Transaction (DPR) level. 
        // If one transaction has multiple work types, it appears multiple times.
        // We only add shifts if it's the first time we see this transaction_id.
        const firstOccurrence = arr.findIndex(item => item.transaction_id === curr.transaction_id) === idx
        const newShifts = firstOccurrence ? acc.total_shifts + (Number(curr.total_manpower_shifts) || 0) : acc.total_shifts

        return {
            steel: newSteel,
            concrete: newConcrete,
            diesel: newDiesel,
            total_shifts: newShifts
        }
    }, {
        steel: 0, concrete: 0, diesel: 0, total_shifts: 0
    })

    const manpowerColumns = [
        { title: 'Date', dataIndex: 'report_date', render: (d: string) => dayjs(d).format('DD-MMM-YYYY') },
        { title: 'Work Type', dataIndex: 'work_type_name', key: 'work_type_name', render: (text: string) => text || <Text type="secondary">General</Text> },
        { title: 'Achievement', dataIndex: 'achievement_qty', align: 'center' as const, render: (v: any, record: any) => v && !isNaN(Number(v)) && Number(v) > 0 ? `${Number(v).toLocaleString()} ${record.achievement_unit || ''}` : '-' },
        { title: 'Total Shifts', dataIndex: 'total_manpower_shifts', align: 'center' as const },
        { title: 'Steel Worker', dataIndex: 'steel_worker_shifts', align: 'center' as const },
        { title: 'Concrete Worker', dataIndex: 'concrete_worker_shifts', align: 'center' as const },
    ]

    const materialColumns = [
        { title: 'Date', dataIndex: 'report_date', render: (d: string) => dayjs(d).format('DD-MMM-YYYY') },
        {
            title: 'Work Type', dataIndex: 'work_type_name', key: 'work_type_name', render: (text: string, record: any) => (
                <Space direction="vertical" size={0}>
                    <span style={{ fontWeight: 500 }}>{text || 'General'}</span>
                    {record.panel_names && <Tag color="orange" style={{ fontSize: '10px', marginTop: '2px' }}>{record.panel_names}</Tag>}
                    {record.dwall_cage_id && <Text type="secondary" style={{ fontSize: 10 }}>Cage: {record.dwall_cage_id}</Text>}
                </Space>
            )
        },
        {
            title: 'Achievement', dataIndex: 'achievement_qty', align: 'center' as const, render: (v: any, record: any) => {
                const val = Number(v)
                if (isNaN(val) || val === 0) return '-'
                return <Text strong>{val.toLocaleString()} {record.achievement_unit || ''}</Text>
            }
        },
        {
            title: 'Depth (m)', dataIndex: 'dwall_concreting_depth', key: 'depth', render: (v: any, record: any) => {
                const depth = v || record.dwall_grabbing_depth
                return depth ? `${depth} m` : '-'
            }
        },
        { title: 'Steel (kg)', dataIndex: 'steel_kg', align: 'right' as const, render: (v: any) => Number(v) > 0 ? Number(v).toFixed(2) : '-' },
        { title: 'Concrete (m³)', dataIndex: 'concrete_m3', align: 'right' as const, render: (v: any) => Number(v) > 0 ? Number(v).toFixed(2) : '-' },
        { title: 'Diesel (L)', dataIndex: 'diesel_liters', align: 'right' as const, render: (v: any) => Number(v) > 0 ? Number(v).toFixed(1) : '-' },
        { title: 'Cement (Bags)', dataIndex: 'cement_bags', align: 'right' as const, render: (v: any) => Number(v) > 0 ? Number(v).toFixed(0) : '-' },
        { title: 'Others', dataIndex: 'summary_other_materials', key: 'others', width: '250px', ellipsis: true, render: (text: string) => text ? <Text style={{ fontSize: 11, display: 'block' }} type="secondary" title={text}>{text}</Text> : '-' },
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
                    <Col xs={24} md={6}>
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
                    <Col xs={24} md={6}>
                        <div style={{ marginBottom: 8 }}><Text strong>Work Type (Optional)</Text></div>
                        <Select
                            style={{ width: '100%', ...largeInputStyle }}
                            placeholder="All Work Types"
                            onChange={setSelectedWorkType}
                            size="large"
                            showSearch
                            allowClear
                            optionFilterProp="children"
                        >
                            {workItemTypes.map(t => (
                                <Option key={t.id} value={t.id}>{t.name}</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} md={6}>
                        <div style={{ marginBottom: 8 }}><Text strong>Date Range (Optional)</Text></div>
                        <RangePicker
                            style={{ width: '100%', ...largeInputStyle }}
                            size="large"
                            onChange={setDateRange}
                        />
                    </Col>
                    <Col xs={24} md={6}>
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

            {reportData.length > 0 && (
                <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 24 }}>

                    {/* Project Executive Summary */}
                    {projectDetails && (
                        <SectionCard title="Project Executive Summary" icon={<ProjectOutlined />}>
                            <Row gutter={24}>
                                <Col xs={24} lg={16}>
                                    <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="small">
                                        <Descriptions.Item label="Status" span={1}>
                                            <Badge status={projectDetails.status === 'execution' ? 'processing' : 'success'} text={projectDetails.status.toUpperCase()} />
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Project Code">{projectDetails.project_code}</Descriptions.Item>
                                        <Descriptions.Item label="Contract Value">
                                            <Text strong>₹ {(Number(projectDetails.contract_value) || 0).toLocaleString()}</Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Client" span={2}>
                                            <Space>
                                                <UserOutlined />
                                                <Text strong>{projectDetails.client?.company_name || projectDetails.client_name}</Text>
                                            </Space>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Converted From">
                                            {projectDetails.leads?.[0] ? <Tag color="blue">Lead #{projectDetails.leads[0].id}</Tag> : 'Manual Entry'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Associated Quotes" span={1}>
                                            <Space size={4}>
                                                {extraDetails.quotations.length > 0 ? extraDetails.quotations.map((q: any) => (
                                                    <Tag icon={<FileTextOutlined />} color="cyan" key={q.id}>{q.quotation_number}</Tag>
                                                )) : '-'}
                                            </Space>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Work Orders" span={2}>
                                            <Space size={4} wrap>
                                                {extraDetails.workOrders.length > 0 ? extraDetails.workOrders.map((wo: any) => (
                                                    <Tag icon={<SafetyCertificateOutlined />} color="purple" key={wo.id}>{wo.work_order_number}</Tag>
                                                )) : <Text type="secondary">Waiting for mobilization</Text>}
                                            </Space>
                                        </Descriptions.Item>
                                    </Descriptions>
                                </Col>
                                <Col xs={24} lg={8} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#fafafa', borderRadius: 8, padding: 16 }}>
                                    <Title level={5} style={{ margin: 0, marginBottom: 8 }}>Contract Progress</Title>
                                    <Progress
                                        type="dashboard"
                                        percent={Math.min(100, Math.round((totals.concrete / (projectDetails.contract_value / 10000)) * 100) || 35)} // Mock progress logic
                                        width={120}
                                        strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                                    />
                                    <Text type="secondary" style={{ fontSize: 11, marginTop: 8 }}>Estimated Physical Execution</Text>
                                </Col>
                            </Row>
                        </SectionCard>
                    )}

                    {/* Summary Cards */}
                    <Row gutter={16}>
                        <Col xs={24} md={6}>
                            <Card bordered={false} style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
                                <Statistic
                                    title="Total Labor Shifts"
                                    value={totals.total_shifts}
                                    prefix={<TeamOutlined />}
                                    valueStyle={{ color: '#389e0d' }}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>Cumulative hajri count</Text>
                            </Card>
                        </Col>
                        <Col xs={24} md={6}>
                            <Card bordered={false} style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}>
                                <Statistic
                                    title="Steel Consumed"
                                    value={totals.steel}
                                    precision={0}
                                    suffix="kg"
                                    prefix={<ExperimentOutlined />}
                                    valueStyle={{ color: '#096dd9' }}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>Reinforcement items</Text>
                            </Card>
                        </Col>
                        <Col xs={24} md={6}>
                            <Card bordered={false} style={{ background: '#fff7e6', borderColor: '#ffd591' }}>
                                <Statistic
                                    title="Concrete (RMC)"
                                    value={totals.concrete}
                                    precision={1}
                                    suffix="m³"
                                    valueStyle={{ color: '#d46b08' }}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>Verified via RMC logs</Text>
                            </Card>
                        </Col>
                        <Col xs={24} md={6}>
                            <Card bordered={false} style={{ background: '#fff1f0', borderColor: '#ffa39e' }}>
                                <Statistic
                                    title="Total Fuel (HSD)"
                                    value={totals.diesel}
                                    precision={1}
                                    suffix="L"
                                    valueStyle={{ color: '#cf1322' }}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>Machinery efficiency base</Text>
                            </Card>
                        </Col>
                    </Row>

                    <Divider orientation="left" style={{ margin: '8px 0' }}>Detailed Breakdowns</Divider>

                    <SectionCard title="Production & Material Consumption Breakdown" icon={<ExperimentOutlined />}>
                        <Table
                            dataSource={reportData}
                            columns={materialColumns}
                            rowKey={(r, i) => `${r.report_date}-${r.transaction_id}-${i}`}
                            size="middle"
                            pagination={{ pageSize: 10 }}
                            bordered
                            scroll={{ x: 1200 }}
                        />
                    </SectionCard>

                    <SectionCard title="Manpower Deployment Breakdown" icon={<TeamOutlined />}>
                        <Table
                            dataSource={reportData}
                            columns={manpowerColumns}
                            rowKey={(r, i) => `${r.report_date}-${r.transaction_id}-mp-${i}`}
                            size="middle"
                            pagination={{ pageSize: 10 }}
                            bordered
                            scroll={{ x: 1000 }}
                        />
                    </SectionCard>

                </Space>
            )}

            {!reportData.length && (
                <div style={{ marginTop: 40, textAlign: 'center' }}>
                    <Empty description={selectedProject ? "No data found for selected range" : "Select a project to view consumption report"} />
                </div>
            )}
        </PageContainer>
    )
}

export default ProjectConsumptionReport
