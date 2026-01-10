import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Input, Select, Space, message } from 'antd'
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { leadService } from '../../services/api/leads'

const { Search } = Input
const { Option } = Select

interface Lead {
  id: number
  name: string
  company_name?: string
  phone?: string
  email?: string
  enquiry_date: string
  source?: string
  status: string
  created_at: string
}

const LeadList = () => {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 10,
  })
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  })
  const navigate = useNavigate()

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const response = await leadService.getLeads(filters)
      setLeads(response.leads || [])
      setPagination(response.pagination || { total: 0, page: 1, limit: 10, pages: 0 })
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch leads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [filters.status, filters.page])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'blue',
      contacted: 'cyan',
      qualified: 'green',
      converted: 'success',
      lost: 'red',
    }
    return colors[status] || 'default'
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Company',
      dataIndex: 'company_name',
      key: 'company_name',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Enquiry Date',
      dataIndex: 'enquiry_date',
      key: 'enquiry_date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
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
      render: (_: any, record: Lead) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/sales/leads/${record.id}`)}
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
        title="Lead Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/sales/leads/new')}
          >
            Create Lead
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space wrap>
            <Search
              placeholder="Search leads..."
              allowClear
              style={{ width: 300 }}
              onSearch={(value) => {
                setFilters({ ...filters, search: value, page: 1 })
                fetchLeads()
              }}
            />
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: 200 }}
              onChange={(value) => setFilters({ ...filters, status: value || '', page: 1 })}
            >
              <Option value="new">New</Option>
              <Option value="contacted">Contacted</Option>
              <Option value="qualified">Qualified</Option>
              <Option value="converted">Converted</Option>
              <Option value="lost">Lost</Option>
            </Select>
          </Space>

          <Table
            columns={columns}
            dataSource={leads}
            loading={loading}
            rowKey="id"
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} leads`,
              onChange: (page, pageSize) => {
                setFilters({ ...filters, page, limit: pageSize || 10 })
              },
            }}
          />
        </Space>
      </Card>
    </div>
  )
}

export default LeadList

