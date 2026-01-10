import { useState, useEffect } from 'react'
import { Table, Card, Button, Tag, Space, Input, Select, message, Popconfirm } from 'antd'
import { PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import dayjs from 'dayjs'

const { Search } = Input

const STNList = () => {
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const navigate = useNavigate()

  const fetchTransactions = async (params?: any) => {
    setLoading(true)
    try {
      const response = await storeTransactionService.getTransactions({
        type: 'STN',
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
      message.error(error.response?.data?.message || 'Failed to fetch STN transactions')
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
      message.success('STN approved successfully')
      fetchTransactions()
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to approve STN')
    }
  }

  const handleReject = async (id: number) => {
    try {
      await storeTransactionService.rejectTransaction(id)
      message.success('STN rejected')
      fetchTransactions()
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to reject STN')
    }
  }

  const columns = [
    {
      title: 'Transaction Number',
      dataIndex: 'transaction_number',
      key: 'transaction_number',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Date',
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      render: (date: string) => dayjs(date).format('DD-MM-YYYY'),
    },
    {
      title: 'From Warehouse',
      dataIndex: ['warehouse', 'name'],
      key: 'from_warehouse',
    },
    {
      title: 'To Warehouse',
      dataIndex: ['toWarehouse', 'name'],
      key: 'to_warehouse',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          draft: 'default',
          approved: 'success',
          rejected: 'error',
        }
        return <Tag color={colorMap[status] || 'default'}>{status?.toUpperCase() || 'N/A'}</Tag>
      },
    },
    {
      title: 'Created By',
      dataIndex: ['creator', 'name'],
      key: 'creator',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/inventory/stn/${record.id}`)}
          >
            View
          </Button>
          {record.status === 'draft' && (
            <>
              <Popconfirm
                title="Approve this STN?"
                onConfirm={() => handleApprove(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" icon={<CheckOutlined />} style={{ color: '#52c41a' }}>
                  Approve
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Reject this STN?"
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
    <div className="content-container">
      <Card
        title="STN (Store Transfer Note) Transactions"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/inventory/stn/new')}
          >
            Create STN
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space>
            <Search
              placeholder="Search by transaction number"
              style={{ width: 250 }}
              onSearch={(value) => fetchTransactions({ search: value })}
              allowClear
            />
            <Select
              placeholder="Filter by status"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => fetchTransactions({ status: value || undefined })}
            >
              <Select.Option value="draft">Draft</Select.Option>
              <Select.Option value="approved">Approved</Select.Option>
              <Select.Option value="rejected">Rejected</Select.Option>
            </Select>
          </Space>

          <Table
            columns={columns}
            dataSource={transactions}
            loading={loading}
            rowKey="id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} transactions`,
            }}
            onChange={(pagination) => fetchTransactions({ current: pagination.current, pageSize: pagination.pageSize })}
          />
        </Space>
      </Card>
    </div>
  )
}

export default STNList

