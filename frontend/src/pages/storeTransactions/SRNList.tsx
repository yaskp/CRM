import { useState, useEffect } from 'react'
import { Table, Card, Button, Tag, Space, Input, Select, message, Popconfirm, Row, Col, Statistic, Typography } from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  RollbackOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  InboxOutlined,
  ProjectOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import dayjs from 'dayjs'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, largeInputStyle, prefixIconStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Search } = Input
const { Text } = Typography

const SRNList = () => {
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const navigate = useNavigate()

  const fetchTransactions = async (params?: any) => {
    setLoading(true)
    try {
      const response = await storeTransactionService.getTransactions({
        type: 'SRN',
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
      message.error(error.response?.data?.message || 'Failed to fetch SRN transactions')
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
      message.success('SRN approved successfully')
      fetchTransactions()
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to approve SRN')
    }
  }

  const handleReject = async (id: number) => {
    try {
      await storeTransactionService.rejectTransaction(id)
      message.success('SRN rejected')
      fetchTransactions()
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to reject SRN')
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
      title: 'Project',
      dataIndex: ['project', 'name'],
      key: 'project',
      render: (project: any) => project ? <Tag icon={<ProjectOutlined />}>{project}</Tag> : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: string) => {
        if (!status || typeof status !== 'string') {
          return <Tag>N/A</Tag>
        }
        const colorMap: Record<string, string> = {
          draft: 'processing',
          approved: 'success',
          rejected: 'error',
        }
        return (
          <Tag color={colorMap[status]} style={{ padding: '0 8px', borderRadius: '4px' }}>
            {status.toUpperCase()}
          </Tag>
        )
      },
    },
    {
      title: 'Returned By',
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
            onClick={() => navigate(`/inventory/srn/${record.id}`)}
            style={{ padding: 0 }}
          >
            View
          </Button>
          {record.status === 'draft' && (
            <>
              <Popconfirm
                title="Approve this return?"
                onConfirm={() => handleApprove(record.id)}
                okText="Approve"
                cancelText="No"
              >
                <Button type="link" icon={<CheckOutlined />} style={{ color: '#52c41a', padding: 0 }}>
                  Approve
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Reject this return?"
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
        title="Stock Return Notes (SRN)"
        subtitle="Manage material returns from project sites back to the main inventory"
        icon={<RollbackOutlined />}
      />

      <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Total Returns"
              value={stats.total}
              prefix={<RollbackOutlined style={{ color: theme.colors.primary.main }} />}
              valueStyle={{ color: theme.colors.primary.main }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Awaiting Approval"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Approved Returns"
              value={stats.approved}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: theme.spacing.lg, borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <Space size="middle" wrap>
            <Search
              placeholder="Search by SRN number..."
              style={{ width: 300, ...largeInputStyle }}
              size="large"
              onSearch={(value) => fetchTransactions({ search: value })}
              prefix={<SearchOutlined style={prefixIconStyle} />}
              allowClear
            />
            <Select
              placeholder="All Statuses"
              style={{ width: 180, ...largeInputStyle }}
              size="large"
              allowClear
              onChange={(value) => fetchTransactions({ status: value || undefined })}
              suffixIcon={<FilterOutlined style={prefixIconStyle} />}
            >
              <Select.Option value="draft">⏳ Draft/Pending</Select.Option>
              <Select.Option value="approved">✅ Approved</Select.Option>
              <Select.Option value="rejected">❌ Rejected</Select.Option>
            </Select>
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/inventory/srn/new')}
            size="large"
            style={getPrimaryButtonStyle(180)}
          >
            Create New SRN
          </Button>
        </div>
      </Card>

      <Card style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
        <Table
          columns={columns}
          dataSource={transactions}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
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

export default SRNList
