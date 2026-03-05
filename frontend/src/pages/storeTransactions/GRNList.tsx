import { useState, useEffect } from 'react'
import { Table, Card, Button, Tag, Space, Input, Select, message, Popconfirm, Row, Col, Statistic, Typography } from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import dayjs from 'dayjs'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, largeInputStyle, prefixIconStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Search } = Input
const { Text } = Typography

const GRNList = () => {
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const navigate = useNavigate()

  const fetchTransactions = async (params?: any) => {
    setLoading(true)
    try {
      const response = await storeTransactionService.getTransactions({
        type: 'GRN',
        ...params,
        page: params?.current || pagination.current,
        limit: params?.pageSize || pagination.pageSize,
      })
      setTransactions(response.transactions || [])
      setPagination({
        current: response.pagination?.page || 1,
        pageSize: response.pagination?.limit || 10,
        total: response.pagination?.total || 0,
      })
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch GRN transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleApprove = async (id: number) => {
    try {
      await storeTransactionService.approveTransaction(id)
      message.success('GRN approved successfully')
      fetchTransactions()
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to approve GRN')
    }
  }

  const handleReject = async (id: number) => {
    try {
      await storeTransactionService.rejectTransaction(id)
      message.success('GRN rejected')
      fetchTransactions()
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to reject GRN')
    }
  }

  const getStats = () => {
    const total = transactions.length
    const pending = transactions.filter(t => t.status === 'draft').length
    const approved = transactions.filter(t => t.status === 'approved').length
    return { total, pending, approved }
  }

  const stats = getStats()

  const columns = [
    {
      title: 'Trans. Number',
      dataIndex: 'transaction_number',
      key: 'transaction_number',
      width: 180,
      render: (text: string) => <Text strong style={{ color: theme.colors.primary.main }}>{text}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      width: 140,
      render: (date: string) => dayjs(date).format('DD-MMM-YYYY'),
    },
    {
      title: 'Warehouse',
      dataIndex: ['warehouse', 'name'],
      key: 'warehouse',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          draft: 'default',
          pending: 'processing',
          approved: 'success',
          rejected: 'error',
        }
        const labelMap: Record<string, string> = {
          draft: 'DRAFT',
          pending: 'PENDING APPROVAL',
          approved: 'APPROVED',
          rejected: 'REJECTED',
        }
        return (
          <Tag color={colorMap[status]} style={{ padding: '0 8px', borderRadius: '4px' }}>
            {labelMap[status] || status.toUpperCase()}
          </Tag>
        )
      },
    },
    {
      title: 'Received By',
      dataIndex: ['creator', 'name'],
      key: 'creator',
      width: 150,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/inventory/grn/${record.id}`)}
            style={{ padding: 0 }}
          >
            View
          </Button>
          {(record.status === 'draft' || record.status === 'pending') && (
            <>
              <Popconfirm
                title="Approve this receipt?"
                onConfirm={() => handleApprove(record.id)}
                okText="Approve"
                cancelText="No"
                okButtonProps={{ style: { backgroundColor: '#52c41a', borderColor: '#52c41a' } }}
              >
                <Button type="link" icon={<CheckOutlined />} style={{ color: '#52c41a', padding: 0 }}>
                  Approve
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Reject this receipt?"
                onConfirm={() => handleReject(record.id)}
                okText="Reject"
                cancelText="No"
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
        title="Good Receipt Notes (GRN)"
        subtitle="Manage incoming materials and inventory updates"
        icon={<FileTextOutlined />}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: theme.spacing.lg }}>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Total GRNs"
              value={stats.total}
              prefix={<InboxOutlined style={{ color: theme.colors.primary.main }} />}
              valueStyle={{ color: theme.colors.primary.main }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Pending Approval"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Approved Receipt"
              value={stats.approved}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: theme.spacing.lg, borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={10} lg={8}>
            <Search
              placeholder="Search by GRN number..."
              style={{ width: '100%', ...largeInputStyle }}
              size="large"
              onSearch={(value) => fetchTransactions({ search: value })}
              prefix={<SearchOutlined style={prefixIconStyle} />}
            />
          </Col>
          <Col xs={24} sm={8} lg={6}>
            <Select
              placeholder="All Statuses"
              style={{ width: '100%', ...largeInputStyle }}
              size="large"
              allowClear
              onChange={(value) => fetchTransactions({ status: value })}
              suffixIcon={<FilterOutlined style={prefixIconStyle} />}
            >
              <Select.Option value="draft">📁 Draft</Select.Option>
              <Select.Option value="pending">⏳ Pending Approval</Select.Option>
              <Select.Option value="approved">✅ Approved</Select.Option>
              <Select.Option value="rejected">❌ Rejected</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={6} lg={4}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/inventory/grn/new')}
              size="large"
              style={{ ...getPrimaryButtonStyle(), width: '100%' }}
            >
              Create GRN
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
        <Table
          columns={columns}
          dataSource={transactions}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} transactions`,
          }}
          onChange={(pagination) => fetchTransactions({ current: pagination.current, pageSize: pagination.pageSize })}
        />
      </Card>
    </PageContainer>
  )
}

export default GRNList
