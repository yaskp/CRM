import { useState, useEffect } from 'react'
import { Card, Row, Col, Select, Button, Table, Typography, Statistic, Progress, Modal, InputNumber, message } from 'antd'
import { DollarOutlined, EditOutlined, FundOutlined, RiseOutlined } from '@ant-design/icons'
import { PageContainer, PageHeader, SectionCard } from '../../components/common/PremiumComponents'
import { projectService } from '../../services/api/projects'
import { budgetService, BudgetAnalysis, BudgetHead } from '../../services/api/budgets'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { getPrimaryButtonStyle } from '../../styles/styleUtils'

const { Text } = Typography
const { Option } = Select

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

const BudgetDashboard = () => {
    const [projects, setProjects] = useState<any[]>([])
    const [selectedProject, setSelectedProject] = useState<number | null>(null)
    const [analysis, setAnalysis] = useState<BudgetAnalysis[]>([])
    const [heads, setHeads] = useState<BudgetHead[]>([])
    const [loading, setLoading] = useState(false)
    const [editModalVisible, setEditModalVisible] = useState(false)
    const [editValues, setEditValues] = useState<Record<number, number>>({})

    useEffect(() => {
        fetchProjects()
        fetchMetadata()
    }, [])

    useEffect(() => {
        if (selectedProject) {
            fetchAnalysis(selectedProject)
        }
    }, [selectedProject])

    const fetchProjects = async () => {
        try {
            const res = await projectService.getProjects()
            setProjects(res.projects || res || [])
            if (res.projects?.length > 0) {
                setSelectedProject(res.projects[0].id)
            }
        } catch (error) {
            console.error('Failed to fetch projects', error)
        }
    }

    const fetchMetadata = async () => {
        try {
            const res = await budgetService.getBudgetHeads()
            setHeads(res.heads || [])
        } catch (error) {
            console.error('Failed to fetch budget heads', error)
        }
    }

    const fetchAnalysis = async (projectId: number) => {
        setLoading(true)
        try {
            const res = await budgetService.getBudgetAnalysis(projectId)
            setAnalysis(res.analysis || [])
        } catch (error) {
            message.error('Failed to load budget analysis')
        } finally {
            setLoading(false)
        }
    }

    const handleEditBudget = async () => {
        if (!selectedProject) return

        const currentValues: Record<number, number> = {}
        heads.forEach(h => {
            const existing = analysis.find(a => a.head?.id === h.id)
            currentValues[h.id] = existing ? existing.estimated_amount : 0
        })

        setEditValues(currentValues)
        setEditModalVisible(true)
    }

    const saveBudget = async () => {
        if (!selectedProject) return
        try {
            const payload = Object.keys(editValues).map(headId => ({
                budget_head_id: Number(headId),
                estimated_amount: editValues[Number(headId)]
            }))

            await budgetService.updateProjectBudget(selectedProject, payload)
            message.success('Budget updated successfully')
            setEditModalVisible(false)
            fetchAnalysis(selectedProject)
        } catch (error) {
            message.error('Failed to update budget')
        }
    }

    const totalEstimated = analysis.reduce((sum, item) => sum + item.estimated_amount, 0)
    const totalSpent = analysis.reduce((sum, item) => sum + item.spent_amount, 0)
    const totalVariance = totalEstimated - totalSpent
    const totalUtilization = totalEstimated > 0 ? (totalSpent / totalEstimated) * 100 : 0

    const columns = [
        {
            title: 'Budget Head',
            dataIndex: ['head', 'name'],
            key: 'head',
        },
        {
            title: 'Estimated Budget',
            dataIndex: 'estimated_amount',
            key: 'estimated',
            render: (val: number) => `₹${val.toLocaleString()}`
        },
        {
            title: 'Actual Spent',
            dataIndex: 'spent_amount',
            key: 'spent',
            render: (val: number) => `₹${val.toLocaleString()}`
        },
        {
            title: 'Variance',
            dataIndex: 'variance',
            key: 'variance',
            render: (val: number) => (
                <Text type={val < 0 ? 'danger' : 'success'}>
                    ₹{val.toLocaleString()}
                </Text>
            )
        },
        {
            title: 'Utilization',
            key: 'utilization',
            render: (_: any, record: BudgetAnalysis) => (
                <div style={{ width: 150 }}>
                    <Progress
                        percent={Math.round(record.utilization)}
                        size="small"
                        status={record.utilization > 100 ? 'exception' : 'active'}
                        strokeColor={record.utilization > 90 ? '#ff4d4f' : '#1890ff'}
                    />
                </div>
            )
        }
    ]

    return (
        <PageContainer maxWidth={1400}>
            <PageHeader
                title="Project Budget Dashboard"
                subtitle="Track estimates vs actuals and monitor project costs"
                icon={<FundOutlined />}
                extra={
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <Select
                            style={{ width: 300 }}
                            value={selectedProject}
                            onChange={setSelectedProject}
                            placeholder="Select Project"
                            size="large"
                        >
                            {projects.map((p: any) => (
                                <Option key={p.id} value={p.id}>{p.name}</Option>
                            ))}
                        </Select>
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={handleEditBudget}
                            size="large"
                            style={getPrimaryButtonStyle()}
                        >
                            Edit Budget
                        </Button>
                    </div>
                }
            />

            <Row gutter={[24, 24]}>
                <Col span={6}>
                    <Card variant="borderless" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Statistic
                            title="Total Estimated Budget"
                            value={totalEstimated}
                            precision={0}
                            prefix={<DollarOutlined />}
                            suffix="INR"
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card variant="borderless" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Statistic
                            title="Total Actual Spent"
                            value={totalSpent}
                            precision={0}
                            prefix={<DollarOutlined />}
                            suffix="INR"
                            valueStyle={{ color: '#fa8c16' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card variant="borderless" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Statistic
                            title="Variance / Remaining"
                            value={totalVariance}
                            precision={0}
                            prefix={<RiseOutlined />}
                            suffix="INR"
                            valueStyle={{ color: totalVariance < 0 ? '#cf1322' : '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card variant="borderless" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Statistic title="Overall Utilization" value={totalUtilization} precision={1} suffix="%" />
                        <Progress percent={Math.round(totalUtilization)} status="active" showInfo={false} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                <Col span={14}>
                    <SectionCard title="Budget vs Actuals by Head">
                        <div style={{ height: 400 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={analysis}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="head.name" />
                                    <YAxis tickFormatter={(val) => `₹${val / 1000}k`} />
                                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                                    <Legend />
                                    <Bar dataKey="estimated_amount" name="Budget" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="spent_amount" name="Actuals" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </SectionCard>
                </Col>
                <Col span={10}>
                    <SectionCard title="Spend Distribution">
                        <div style={{ height: 400 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analysis.filter(a => a.spent_amount > 0)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="spent_amount"
                                        nameKey="head.name"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {analysis.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </SectionCard>
                </Col>
            </Row>

            <SectionCard title="Detailed Cost Analysis" style={{ marginTop: 24 }}>
                <Table
                    dataSource={analysis}
                    columns={columns}
                    rowKey={(record) => record.head.id}
                    pagination={false}
                    loading={loading}
                />
            </SectionCard>

            <Modal
                title="Edit Project Budget"
                open={editModalVisible}
                onOk={saveBudget}
                onCancel={() => setEditModalVisible(false)}
                width={700}
                okText="Save Estimates"
            >
                <Table
                    dataSource={heads}
                    rowKey="id"
                    pagination={false}
                    scroll={{ y: 400 }}
                    columns={[
                        { title: 'Budget Head', dataIndex: 'name' },
                        { title: 'Code', dataIndex: 'code', width: 100 },
                        {
                            title: 'Estimated Amount (₹)',
                            key: 'amount',
                            width: 250,
                            render: (_, record) => (
                                <InputNumber
                                    style={{ width: '100%' }}
                                    value={editValues[record.id]}
                                    onChange={(val) => setEditValues(prev => ({ ...prev, [record.id]: val || 0 }))}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
                                />
                            )
                        }
                    ]}
                />
            </Modal>
        </PageContainer>
    )
}

export default BudgetDashboard
