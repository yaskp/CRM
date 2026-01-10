import { useState, useEffect } from 'react'
import { Table, Card, Button, Tag, Space, Input, Select, DatePicker, message, Popconfirm, Modal, Image } from 'antd'
import { PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { expenseService } from '../../services/api/expenses'
import { projectService } from '../../services/api/projects'
import dayjs from 'dayjs'

const { Search } = Input

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
      pending_approval_1: 'Pending Approval 1',
      pending_approval_2: 'Pending Approval 2',
      pending_approval_3: 'Pending Approval 3',
      approved: 'Approved',
      rejected: 'Rejected',
    }
    return textMap[status] || status
  }

  const columns = [
    {
      title: 'Expense Number',
      dataIndex: 'expense_number',
      key: 'expense_number',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Date',
      dataIndex: 'expense_date',
      key: 'expense_date',
      render: (date: string) => dayjs(date).format('DD-MM-YYYY'),
    },
    {
      title: 'Project',
      dataIndex: ['project', 'name'],
      key: 'project',
    },
    {
      title: 'Type',
      dataIndex: 'expense_type',
      key: 'expense_type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          conveyance: 'Conveyance',
          loose_purchase: 'Loose Purchase',
          food: 'Food',
          two_wheeler: 'Two Wheeler',
          other: 'Other',
        }
        return typeMap[type] || type
      },
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Submitted By',
      dataIndex: ['submitter', 'name'],
      key: 'submitter',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              if (record.bill_url) {
                setPreviewImage(`http://localhost:5000${record.bill_url}`)
                setPreviewVisible(true)
              }
            }}
          >
            View Bill
          </Button>
          {record.status.includes('pending') && (
            <>
              <Popconfirm
                title="Approve this expense?"
                onConfirm={() => {
                  const level = parseInt(record.status.split('_')[2])
                  handleApprove(record.id, level)
                }}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" icon={<CheckOutlined />} style={{ color: '#52c41a' }}>
                  Approve
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Reject this expense?"
                onConfirm={() => handleReject(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" icon={<CloseOutlined />} danger>
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
    <>
      <Card
        title="Expense Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/finance/expenses/new')}
          >
            Create Expense
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space wrap>
            <Search
              placeholder="Search expenses"
              style={{ width: 250 }}
              onSearch={(value) => fetchExpenses({ search: value })}
            />
            <Select
              placeholder="Filter by Project"
              style={{ width: 200 }}
              allowClear
              onChange={(value) => fetchExpenses({ project_id: value })}
            >
              {projects.map((project) => (
                <Select.Option key={project.id} value={project.id}>
                  {project.name}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder="Filter by Status"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => fetchExpenses({ status: value })}
            >
              <Select.Option value="pending_approval_1">Pending Approval 1</Select.Option>
              <Select.Option value="pending_approval_2">Pending Approval 2</Select.Option>
              <Select.Option value="pending_approval_3">Pending Approval 3</Select.Option>
              <Select.Option value="approved">Approved</Select.Option>
              <Select.Option value="rejected">Rejected</Select.Option>
            </Select>
            <Select
              placeholder="Filter by Type"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => fetchExpenses({ expense_type: value })}
            >
              <Select.Option value="conveyance">Conveyance</Select.Option>
              <Select.Option value="loose_purchase">Loose Purchase</Select.Option>
              <Select.Option value="food">Food</Select.Option>
              <Select.Option value="two_wheeler">Two Wheeler</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Space>

          <Table
            columns={columns}
            dataSource={expenses}
            loading={loading}
            rowKey="id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} expenses`,
            }}
            onChange={(pagination) => fetchExpenses({ current: pagination.current, pageSize: pagination.pageSize })}
          />
        </Space>
      </Card>

      <Modal
        visible={previewVisible}
        title="Bill Preview"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        <Image src={previewImage} alt="Bill" style={{ width: '100%' }} />
      </Modal>
    </>
  )
}

export default ExpenseList

