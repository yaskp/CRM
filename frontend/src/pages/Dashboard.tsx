import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Space, Button } from 'antd'
import {
  ProjectOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../services/api/projects'
import { expenseService } from '../services/api/expenses'
import { dprService } from '../services/api/dpr'

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
      const [projectsRes, expensesRes, dprsRes] = await Promise.all([
        projectService.getProjects({ limit: 100 }),
        expenseService.getExpenses({ limit: 10 }),
        dprService.getDPRs({ limit: 10 }),
      ])

      const projects = projectsRes.projects || []
      const expenses = expensesRes.expenses || []
      const dprs = dprsRes.dprs || []

      setStats({
        totalProjects: projects.length,
        activeProjects: projects.filter((p: any) => p.status === 'active').length,
        totalExpenses: expenses.length,
        pendingExpenses: expenses.filter((e: any) => 
          e.status && typeof e.status === 'string' && e.status.includes('pending')
        ).length,
        totalDPRs: dprs.length,
        recentProjects: projects.slice(0, 5),
        recentExpenses: expenses.slice(0, 5),
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const projectColumns = [
    {
      title: 'Project Code',
      dataIndex: 'project_code',
      key: 'project_code',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        if (!status || typeof status !== 'string') {
          return <Tag>N/A</Tag>
        }
        const colorMap: Record<string, string> = {
          planning: 'default',
          active: 'processing',
          on_hold: 'warning',
          completed: 'success',
          cancelled: 'error',
        }
        return <Tag color={colorMap[status] || 'default'}>{status.toUpperCase()}</Tag>
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button type="link" onClick={() => navigate(`/sales/projects/${record.id}`)}>
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
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
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
        return <Tag color={colorMap[status] || 'default'}>{status.replace(/_/g, ' ').toUpperCase()}</Tag>
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Button type="link" onClick={() => navigate('/finance/expenses')}>
          View
        </Button>
      ),
    },
  ]

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Projects"
              value={stats.totalProjects}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Projects"
              value={stats.activeProjects}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Expenses"
              value={stats.totalExpenses}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Approvals"
              value={stats.pendingExpenses}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card
            title="Recent Projects"
            extra={
              <Button type="link" onClick={() => navigate('/sales/projects')}>
                View All
              </Button>
            }
          >
            <Table
              columns={projectColumns}
              dataSource={stats.recentProjects}
              rowKey="id"
              pagination={false}
              loading={loading}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Recent Expenses"
            extra={
              <Button type="link" onClick={() => navigate('/finance/expenses')}>
                View All
              </Button>
            }
          >
            <Table
              columns={expenseColumns}
              dataSource={stats.recentExpenses}
              rowKey="id"
              pagination={false}
              loading={loading}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            title="Quick Actions"
          >
            <Space wrap>
              <Button type="primary" onClick={() => navigate('/sales/projects/new')}>
                Create Project
              </Button>
              <Button onClick={() => navigate('/finance/expenses/new')}>
                Create Expense
              </Button>
              <Button onClick={() => navigate('/operations/dpr/new')}>
                Create DPR
              </Button>
              <Button onClick={() => navigate('/inventory/grn/new')}>
                Create GRN
              </Button>
              <Button onClick={() => navigate('/operations/equipment/rentals/new')}>
                Create Equipment Rental
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
