import { useState, useEffect } from 'react'
import { Table, Card, Button, Tag, Space, Input, Select, DatePicker, message, Popconfirm, Modal, Image, Row, Col, Statistic, Typography, Tooltip, Avatar } from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
  CalendarOutlined,
  ProjectOutlined,
  SolutionOutlined,
  SearchOutlined,
  FilterOutlined,
  CameraOutlined,
  UserOutlined,
  FileProtectOutlined,
  AuditOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { expenseService } from '../../services/api/expenses'
import { projectService } from '../../services/api/projects'
import dayjs from 'dayjs'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, getSecondaryButtonStyle, largeInputStyle, prefixIconStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Search } = Input
const { Text } = Typography

const ExpenseList = () => {
  const [loading, setLoading] = useState(false)
  const [expenses, setExpenses] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
    fetchExpenses()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await projectService.getProjects()
      setProjects(response.projects || [])
    } catch (error) {
      console.error('Failed to fetch projects')
    }
  }

  const fetchExpenses = async (params?: any) => {
    setLoading(true)
    try {
      const response = await expenseService.getExpenses({
        ...params,
        page: params?.current || pagination.current,
        limit: params?.pageSize || pagination.pageSize,
      })
      setExpenses(response.expenses || [])
      setPagination({
        current: response.pagination?.page || 1,
        pageSize: response.pagination?.limit || 10,
        total: response.pagination?.total || 0,
      })
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch expenses')
    } finally {
      setLoading(false)
    }
  }

  const getStats = () => {
    const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    const pendingCount = expenses.filter(e => e.status.includes('pending')).length
    const approvedCount = expenses.filter(e => e.status === 'approved').length
    return { totalAmount, pendingCount, approvedCount }
  }

  const stats = getStats()

  const handleApprove = async (id: number, level: number) => {
    try {
      await expenseService.approveExpense(id, level)
      message.success(`Expense approved at level ${level}`)
      fetchExpenses()
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to approve expense')
    }
  }

  const handleReject = async (id: number) => {
    try {
      await expenseService.rejectExpense(id, 'Rejected by approver')
      message.success('Expense rejected')
      fetchExpenses()
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to reject expense')
    }
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      draft: 'default',
      pending_approval_1: 'processing',
      pending_approval_2: 'processing',
      pending_approval_3: 'processing',
      approved: 'success',
      rejected: 'error',
    }
    return colorMap[status] || 'default'
  }

  const getStatusText = (status: string) => {
    const textMap: Record<string, string> = {
      draft: 'Draft',
      pending_approval_1: 'Pending 1',
      pending_approval_2: 'Pending 2',
      pending_approval_3: 'Pending 3',
      approved: 'Approved',
      rejected: 'Rejected',
    }
    return textMap[status] || status
  }

  const columns = [
    {
      title: 'Expense ID',
      dataIndex: 'expense_number',
      key: 'expense_number',
      width: 140,
      render: (text: string) => <Text strong style={{ color: theme.colors.primary.main }}>{text}</Text>,
    },
    {
      title: 'Submission Header',
      key: 'header',
      width: 280,
      render: (_: any, record: any) => (
        <Space size="middle">
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: theme.colors.primary.main }} />
          <Space direction="vertical" size={0}>
            <Text strong>{record.submitter?.name}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}><CalendarOutlined /> {dayjs(record.expense_date).format('DD MMM YYYY')}</Text>
          </Space>
        </Space>
      )
    },
    {
      title: 'Project Station',
      dataIndex: ['project', 'name'],
      key: 'project',
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text || 'General Office'}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>{record.project?.project_code || 'N/A'}</Text>
        </Space>
      )
    },
    {
      title: 'Category',
      dataIndex: 'expense_type',
      key: 'expense_type',
      width: 160,
      render: (type: string) => {
        const typeEmoji: Record<string, string> = {
          conveyance: '🚕 Conveyance',
          loose_purchase: '📦 Loose Purchase',
          food: '🍱 Food/Meals',
          two_wheeler: '🏍️ 2-Wheeler',
          other: '📑 Other',
        }
        return <Tag color="blue" bordered={false}>{typeEmoji[type] || type}</Tag>
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      width: 150,
      render: (amount: number) => (
        <Text strong style={{ fontSize: '15px' }}>
          ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: 'Workflow Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} style={{ borderRadius: '4px', padding: '0 8px' }}>
          {getStatusText(status).toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="middle">
          <Tooltip title="View Receipt">
            <Button
              type="link"
              icon={<CameraOutlined />}
              onClick={() => {
                if (record.bill_url) {
                  setPreviewImage(`http://localhost:5000${record.bill_url}`)
                  setPreviewVisible(true)
                } else {
                  message.info('No receipt attached')
                }
              }}
              style={{ padding: 0 }}
            />
          </Tooltip>
          {record.status.includes('pending') && (
            <>
              <Popconfirm
                title="Verify and Approve?"
                onConfirm={() => {
                  const level = parseInt(record.status.split('_')[2])
                  handleApprove(record.id, level)
                }}
              >
                <Button type="link" icon={<CheckOutlined />} style={{ color: theme.colors.success.main, padding: 0 }}>
                  Approve
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Reject this submission?"
                onConfirm={() => handleReject(record.id)}
              >
                <Button type="link" icon={<CloseOutlined />} danger style={{ padding: 0 }}>
                  Reject
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Expense Reimbursements"
        subtitle="Manage site expenses, loose purchases, and employee conveyance claims"
        icon={<AuditOutlined />}
      />

      <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Total Claims Volume"
              value={stats.totalAmount}
              prefix={<DollarOutlined style={{ color: theme.colors.primary.main }} />}
              valueStyle={{ color: theme.colors.primary.main }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Awaiting Approval"
              value={stats.pendingCount}
              prefix={<SolutionOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Audit Cleared"
              value={stats.approvedCount}
              prefix={<FileProtectOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: theme.spacing.lg, borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <Space size="middle" wrap>
            <Search
              placeholder="Voucher # or Staff Name"
              style={{ width: 280, ...largeInputStyle }}
              size="large"
              onSearch={(value) => fetchExpenses({ search: value })}
              prefix={<SearchOutlined style={prefixIconStyle} />}
              allowClear
            />
            <Select
              placeholder="By Project"
              style={{ width: 220, ...largeInputStyle }}
              size="large"
              allowClear
              onChange={(value) => fetchExpenses({ project_id: value })}
              suffixIcon={<FilterOutlined style={prefixIconStyle} />}
            >
              {projects.map((project) => (
                <Select.Option key={project.id} value={project.id}>
                  {project.name}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder="Category"
              style={{ width: 180, ...largeInputStyle }}
              size="large"
              allowClear
              onChange={(value) => fetchExpenses({ expense_type: value })}
            >
              <Select.Option value="conveyance">🚕 Conveyance</Select.Option>
              <Select.Option value="loose_purchase">📦 Loose Purchase</Select.Option>
              <Select.Option value="food">🍱 Food</Select.Option>
              <Select.Option value="two_wheeler">🏍️ 2-Wheeler</Select.Option>
              <Select.Option value="other">📑 Other</Select.Option>
            </Select>
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/finance/expenses/new')}
            size="large"
            style={getPrimaryButtonStyle(200)}
          >
            Log Site Expense
          </Button>
        </div>
      </Card>

      <Card style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
        <Table
          columns={columns}
          dataSource={expenses}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1300 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} expense vouchers`,
          }}
          onChange={(pagination) => fetchExpenses({ current: pagination.current, pageSize: pagination.pageSize })}
        />
      </Card>

      <Modal
        open={previewVisible}
        title={<Space><CameraOutlined /> Receipt Proof</Space>}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        centered
      >
        <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
          <Image src={previewImage} alt="Expense Receipt" style={{ maxWidth: '100%', borderRadius: '4px' }} />
        </div>
      </Modal>
    </PageContainer>
  )
}

export default ExpenseList
