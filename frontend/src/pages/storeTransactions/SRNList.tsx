import { useState, useEffect } from 'react'
import { Table, Card, Button, Tag, Space, Input, message, Popconfirm, Typography } from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  RollbackOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import dayjs from 'dayjs'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, largeInputStyle } from '../../styles/styleUtils'
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
      title: 'Source (From)',
      key: 'source',
      render: (_: any, record: any) => {
        const locName = record.source_type === 'project' ? record.fromProject?.name : record.warehouse?.name
        return <Space direction="vertical" size={0}><Tag color="blue">{record.source_type.toUpperCase()}</Tag><Text strong>{locName || 'N/A'}</Text></Space>
      }
    },
    {
      title: 'Destination (To)',
      key: 'destination',
      render: (_: any, record: any) => {
        const locName = record.destination_type === 'warehouse' ? record.toWarehouse?.name : record.vendor?.name
        return <Space direction="vertical" size={0}><Tag color="orange">{record.destination_type.toUpperCase()}</Tag><Text strong>{locName || 'N/A'}</Text></Space>
      }
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
        return <Tag color={colorMap[status]}>{status.toUpperCase()}</Tag>
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/inventory/srn/${record.id}`)}>View</Button>
          {(record.status === 'draft' || record.status === 'pending') && (
            <>
              <Popconfirm title="Approve this return?" onConfirm={() => handleApprove(record.id)} okText="Approve">
                <Button type="link" icon={<CheckOutlined />} style={{ color: '#52c41a' }}>Approve</Button>
              </Popconfirm>
              <Popconfirm title="Reject this return?" onConfirm={() => handleReject(record.id)}>
                <Button type="link" icon={<CloseOutlined />} danger>Reject</Button>
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
        title="Site Return Notes (SRN)"
        subtitle="Manage material returns from project sites to warehouse or vendors"
        icon={<RollbackOutlined />}
      />

      <Card style={{ marginBottom: theme.spacing.lg, borderRadius: theme.borderRadius.md }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size="middle">
            <Search
              placeholder="Search by SRN number..."
              style={{ width: 300, ...largeInputStyle }}
              onSearch={(value) => fetchTransactions({ search: value })}
            />
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

      <Card style={{ borderRadius: theme.borderRadius.md }}>
        <Table
          columns={columns}
          dataSource={transactions}
          loading={loading}
          rowKey="id"
          pagination={pagination}
          onChange={(pagination) => fetchTransactions({ current: pagination.current, pageSize: pagination.pageSize })}
        />
      </Card>
    </PageContainer>
  )
}

export default SRNList
