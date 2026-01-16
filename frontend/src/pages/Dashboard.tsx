import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Space, Button, Typography } from 'antd'
import {
  ProjectOutlined,
  DollarOutlined,
  DashboardOutlined,
  PlusOutlined,
  EyeOutlined,
  RocketOutlined,
  FileTextOutlined,
  InboxOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../services/api/projects'
import { expenseService } from '../services/api/expenses'
import { dprService } from '../services/api/dpr'
import { PageContainer, PageHeader } from '../components/common/PremiumComponents'
import { getPrimaryButtonStyle, getSecondaryButtonStyle } from '../styles/styleUtils'
import { theme } from '../styles/theme'

const { Text, Title } = Typography

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalExpenses: 0,
    pendingExpenses: 0,
    totalDPRs: 0,
    recentProjects: [] as any[],
    recentExpenses: [] as any[],
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const results = await Promise.allSettled([
        projectService.getProjects({ limit: 100 }),
        expenseService.getExpenses({ limit: 10 }),
        dprService.getDPRs({ limit: 10 }),
      ])

      const projectsRes = results[0].status === 'fulfilled' ? (results[0] as any).value : { projects: [] }
      const expensesRes = results[1].status === 'fulfilled' ? (results[1] as any).value : { expenses: [] }
      const dprsRes = results[2].status === 'fulfilled' ? (results[2] as any).value : { dprs: [] }

      const projects = projectsRes.projects || []
      const expenses = expensesRes.expenses || []
      const dprs = dprsRes.dprs || []

      setStats({
        totalProjects: projects.length,
        activeProjects: projects.filter((p: any) => p.status === 'active' || p.status === 'execution').length,
        totalExpenses: expenses.length,
        pendingExpenses: expenses.filter((e: any) =>
          e.status && typeof e.status === 'string' && e.status.includes('pending')
        ).length,
        totalDPRs: dprs.length,
        recentProjects: projects.slice(0, 5),
        recentExpenses: expenses.slice(0, 5),
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data', error)
    } finally {
      setLoading(false)
    }
  }

  const projectColumns = [
    {
      title: 'Project Code',
      dataIndex: 'project_code',
      key: 'project_code',
      width: 150,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => {
        if (!status || typeof status !== 'string') {
          return <Tag>N/A</Tag>
        }
        const colorMap: Record<string, string> = {
          planning: 'default',
          active: 'processing',
          execution: 'processing',
          on_hold: 'warning',
          completed: 'success',
          cancelled: 'error',
        }
        return <Tag color={colorMap[status] || 'default'} style={{ fontWeight: 500 }}>
          {status.toUpperCase().replace('_', ' ')}
        </Tag>
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/sales/projects/${record.id}`)}
          style={{ padding: 0 }}
        >
          View
        </Button>
      ),
    },
  ]

  const expenseColumns = [
    {
      title: 'Expense Number',
      dataIndex: 'expense_number',
      key: 'expense_number',
      width: 150,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (amount: number) => (
        <Text strong style={{ color: theme.colors.primary.main }}>
          ₹{amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => {
        if (!status || typeof status !== 'string') {
          return <Tag>N/A</Tag>
        }
        const colorMap: Record<string, string> = {
          pending_approval_1: 'processing',
          pending_approval_2: 'processing',
          pending_approval_3: 'processing',
          approved: 'success',
          rejected: 'error',
        }
        return <Tag color={colorMap[status] || 'default'} style={{ fontWeight: 500 }}>
          {status.replace(/_/g, ' ').toUpperCase()}
        </Tag>
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: () => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate('/finance/expenses')}
          style={{ padding: 0 }}
        >
          View
        </Button>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening with your projects"
        icon={<DashboardOutlined />}
      />

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadows.base,
              border: `1px solid ${theme.colors.neutral.gray100}`,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>Total Projects</Text>}
              value={stats.totalProjects}
              prefix={<ProjectOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadows.base,
              border: `1px solid ${theme.colors.neutral.gray100}`,
              background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
            }}
          >
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>Active Projects</Text>}
              value={stats.activeProjects}
              prefix={<CheckCircleOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadows.base,
              border: `1px solid ${theme.colors.neutral.gray100}`,
              background: 'linear-gradient(135deg, #faad14 0%, #ffd666 100%)',
            }}
          >
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>Total Expenses</Text>}
              value={stats.totalExpenses}
              prefix={<DollarOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadows.base,
              border: `1px solid ${theme.colors.neutral.gray100}`,
              background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
            }}
          >
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>Pending Approvals</Text>}
              value={stats.pendingExpenses}
              prefix={<ClockCircleOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Data Tables */}
      <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ProjectOutlined style={{ fontSize: 20, color: theme.colors.primary.main }} />
                <Text strong style={{ fontSize: 16 }}>Recent Projects</Text>
              </div>
            }
            extra={
              <Button
                type="link"
                onClick={() => navigate('/sales/projects')}
                icon={<EyeOutlined />}
              >
                View All
              </Button>
            }
            style={{
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadows.base,
              border: `1px solid ${theme.colors.neutral.gray100}`,
            }}
          >
            <Table
              columns={projectColumns}
              dataSource={stats.recentProjects}
              rowKey="id"
              pagination={false}
              loading={loading}
              size="small"
              scroll={{ x: 600 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarOutlined style={{ fontSize: 20, color: theme.colors.primary.main }} />
                <Text strong style={{ fontSize: 16 }}>Recent Expenses</Text>
              </div>
            }
            extra={
              <Button
                type="link"
                onClick={() => navigate('/finance/expenses')}
                icon={<EyeOutlined />}
              >
                View All
              </Button>
            }
            style={{
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadows.base,
              border: `1px solid ${theme.colors.neutral.gray100}`,
            }}
          >
            <Table
              columns={expenseColumns}
              dataSource={stats.recentExpenses}
              rowKey="id"
              pagination={false}
              loading={loading}
              size="small"
              scroll={{ x: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RocketOutlined style={{ fontSize: 20, color: theme.colors.primary.main }} />
            <Text strong style={{ fontSize: 16 }}>Quick Actions</Text>
          </div>
        }
        style={{
          borderRadius: theme.borderRadius.md,
          boxShadow: theme.shadows.base,
          border: `1px solid ${theme.colors.neutral.gray100}`,
        }}
      >
        <Space wrap size="middle">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/sales/projects/new')}
            size="large"
            style={getPrimaryButtonStyle(180)}
          >
            Create Project
          </Button>
          <Button
            icon={<DollarOutlined />}
            onClick={() => navigate('/finance/expenses/new')}
            size="large"
            style={getSecondaryButtonStyle(180)}
          >
            Create Expense
          </Button>
          <Button
            icon={<FileTextOutlined />}
            onClick={() => navigate('/operations/dpr/new')}
            size="large"
            style={getSecondaryButtonStyle(150)}
          >
            Create DPR
          </Button>
          <Button
            icon={<InboxOutlined />}
            onClick={() => navigate('/inventory/grn/new')}
            size="large"
            style={getSecondaryButtonStyle(150)}
          >
            Create GRN
          </Button>
          <Button
            icon={<ToolOutlined />}
            onClick={() => navigate('/operations/equipment/rentals/new')}
            size="large"
            style={getSecondaryButtonStyle(220)}
          >
            Create Equipment Rental
          </Button>
        </Space>
      </Card>
    </PageContainer>
  )
}

export default Dashboard
