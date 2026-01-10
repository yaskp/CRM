import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Input, Select, Space, message } from 'antd'
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { quotationService } from '../../services/api/quotations'

const { Search } = Input
const { Option } = Select

interface Quotation {
  id: number
  quotation_code: string
  lead_id: number
  version: number
  total_amount: number
  discount_amount: number
  final_amount: number
  status: string
  valid_till?: string
  created_at: string
}

const QuotationList = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 10,
  })
  const navigate = useNavigate()

  const fetchQuotations = async () => {
    setLoading(true)
    try {
      const response = await quotationService.getQuotations(filters)
      setQuotations(response.quotations || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch quotations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotations()
  }, [filters.status])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default',
      sent: 'blue',
      accepted: 'green',
      rejected: 'red',
      expired: 'orange',
    }
    return colors[status] || 'default'
  }

  const columns = [
    {
      title: 'Quotation Code',
      dataIndex: 'quotation_code',
      key: 'quotation_code',
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => `₹${amount?.toLocaleString('en-IN') || 0}`,
    },
    {
      title: 'Final Amount',
      dataIndex: 'final_amount',
      key: 'final_amount',
      render: (amount: number) => `₹${amount?.toLocaleString('en-IN') || 0}`,
    },
    {
      title: 'Valid Till',
      dataIndex: 'valid_till',
      key: 'valid_till',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Quotation) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/sales/quotations/${record.id}`)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="content-container">
      <Card
        title="Quotation Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/sales/quotations/new')}
          >
            Create Quotation
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space wrap>
            <Search
              placeholder="Search quotations..."
              allowClear
              style={{ width: 300 }}
              onSearch={(value) => {
                setFilters({ ...filters, search: value, page: 1 })
                fetchQuotations()
              }}
            />
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: 200 }}
              onChange={(value) => setFilters({ ...filters, status: value || '' })}
            >
              <Option value="draft">Draft</Option>
              <Option value="sent">Sent</Option>
              <Option value="accepted">Accepted</Option>
              <Option value="rejected">Rejected</Option>
              <Option value="expired">Expired</Option>
            </Select>
          </Space>

          <Table
            columns={columns}
            dataSource={quotations}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Space>
      </Card>
    </div>
  )
}

export default QuotationList

