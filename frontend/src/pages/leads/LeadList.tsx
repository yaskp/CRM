import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Input, Select, Space, message, Row, Col, Statistic, Typography } from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  ContactsOutlined,
  FilterOutlined,
  PhoneOutlined,
  MailOutlined,
  UserAddOutlined,
  ProjectOutlined,
  FileTextOutlined,
  EditOutlined,
  LinkOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { leadService } from '../../services/api/leads'
import { quotationService } from '../../services/api/quotations'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, largeInputStyle, prefixIconStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Search } = Input
const { Option } = Select
const { Text } = Typography

interface Lead {
  id: number
  name: string
  company_name?: string
  phone?: string
  email?: string
  address?: string
  enquiry_date: string
  source?: string
  soil_report_url?: string
  layout_url?: string
  section_url?: string
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

  const getStatusCounts = () => {
    const counts: Record<string, number> = {}
    leads.forEach(lead => {
      counts[lead.status] = (counts[lead.status] || 0) + 1
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  const columns = [
    {
      title: 'Lead Title / Contact',
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: 'Company',
      dataIndex: 'company_name',
      key: 'company_name',
      ellipsis: true,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (phone: string) => phone ? (
        <span><PhoneOutlined style={{ marginRight: 4, color: theme.colors.neutral.gray400 }} />{phone}</span>
      ) : '-',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
      render: (email: string) => email ? (
        <span><MailOutlined style={{ marginRight: 4, color: theme.colors.neutral.gray400 }} />{email}</span>
      ) : '-',
    },
    {
      title: 'Enquiry Date',
      dataIndex: 'enquiry_date',
      key: 'enquiry_date',
      width: 130,
      render: (date: string) => new Date(date).toLocaleDateString('en-GB'),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (source: string) => source ? source.charAt(0).toUpperCase() + source.slice(1) : '-',
    },
    {
      title: 'Docs',
      key: 'docs',
      width: 120,
      render: (_: any, record: Lead) => (
        <Space>
          {record.soil_report_url && (
            <a href={record.soil_report_url} target="_blank" rel="noopener noreferrer" title="Soil Report">
              <FileTextOutlined style={{ color: theme.colors.primary.main, fontSize: '16px' }} />
            </a>
          )}
          {record.layout_url && (
            <a href={record.layout_url} target="_blank" rel="noopener noreferrer" title="Layout Plan">
              <ProjectOutlined style={{ color: theme.colors.secondary.main, fontSize: '16px' }} />
            </a>
          )}
          {record.section_url && (
            <a href={record.section_url} target="_blank" rel="noopener noreferrer" title="Section Drawing">
              <ContactsOutlined style={{ color: theme.colors.success.main, fontSize: '16px' }} />
            </a>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} style={{ fontWeight: 500 }}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: Lead) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/sales/leads/${record.id}`)
            }}
            style={{ padding: 0 }}
          >
            View
          </Button>

          {record.status !== 'converted' && record.status !== 'lost' && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/sales/leads/${record.id}/edit`)
                }}
                style={{ padding: 0 }}
              >
                Edit
              </Button>
              <Button
                type="link"
                icon={<FileTextOutlined />}
                onClick={async (e) => {
                  e.stopPropagation()
                  if (record.status === 'quoted') {
                    try {
                      const hide = message.loading('Preparing revision...', 0)
                      // 1. Get quotations for this lead
                      const res = await quotationService.getQuotationsByLead(record.id)
                      const quotes = res.quotations || []

                      if (quotes.length > 0) {
                        // 2. Sort to find latest version
                        const latest = quotes.sort((a: any, b: any) => b.version_number - a.version_number)[0]
                        // 3. Call the revise API
                        const revRes = await quotationService.reviseQuotation(latest.id)
                        hide()
                        message.success(`Creating Revision v${revRes.quotation.version_number}`)
                        // 4. Navigate to edit the new revision
                        navigate(`/sales/quotations/${revRes.quotation.id}/edit`)
                        return
                      }
                      hide()
                    } catch (error) {
                      message.error('Failed to create revision')
                    }
                  }
                  // Fallback to standard new quote
                  navigate(`/sales/quotations/new?lead_id=${record.id}`)
                }}
                disabled={record.status === 'converted' || record.status === 'lost'}
                style={{ padding: 0 }}
              >
                {record.status === 'quoted' ? 'Revise' : 'Quote'}
              </Button>
              <Button
                type="link"
                icon={<ProjectOutlined />}
                onClick={async (e) => {
                  e.stopPropagation();

                  try {
                    const res = await quotationService.getQuotationsByLead(record.id)
                    const quotes = res.quotations || []

                    if (quotes.length > 0) {
                      // Navigate to the latest quotation to finish conversion
                      const latest = quotes.sort((a: any, b: any) => b.version_number - a.version_number)[0]
                      navigate(`/sales/quotations/${latest.id}`)
                    } else {
                      message.warning('Please create a quotation first to convert this lead to a project.')
                      navigate(`/sales/quotations/new?lead_id=${record.id}`)
                    }
                  } catch (error) {
                    message.error('Failed to process conversion')
                  }
                }}
                disabled={record.status === 'converted' || record.status === 'lost'}
                style={{ padding: 0 }}
              >
                Convert
              </Button>
            </>
          )}

          {record.status === 'converted' && (
            <Button
              type="link"
              icon={<LinkOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                // Navigate to the linked project if we have the ID, otherwise Lead detail
                if ((record as any).project_id) {
                  navigate(`/sales/projects/${(record as any).project_id}`)
                } else {
                  navigate(`/sales/leads/${record.id}`)
                }
              }}
              style={{ padding: 0, color: theme.colors.success.main }}
            >
              Project
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Lead Management"
        subtitle="Track and manage all sales leads"
        icon={<ContactsOutlined />}
      />

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
        <Col xs={24} sm={12} md={6}>
          <Card
            hoverable
            style={{
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadows.base,
              border: `1px solid ${theme.colors.neutral.gray100}`,
            }}
          >
            <Statistic
              title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Total Leads</Text>}
              value={pagination.total}
              prefix={<ContactsOutlined style={{ color: theme.colors.primary.main }} />}
              valueStyle={{ color: theme.colors.primary.main, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            hoverable
            style={{
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadows.base,
              border: `1px solid ${theme.colors.neutral.gray100}`,
            }}
          >
            <Statistic
              title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>New Leads</Text>}
              value={statusCounts['new'] || 0}
              valueStyle={{ color: '#1890ff', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            hoverable
            style={{
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadows.base,
              border: `1px solid ${theme.colors.neutral.gray100}`,
            }}
          >
            <Statistic
              title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Qualified</Text>}
              value={statusCounts['qualified'] || 0}
              valueStyle={{ color: '#52c41a', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            hoverable
            style={{
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadows.base,
              border: `1px solid ${theme.colors.neutral.gray100}`,
            }}
          >
            <Statistic
              title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Converted</Text>}
              value={statusCounts['converted'] || 0}
              valueStyle={{ color: '#52c41a', fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card
        style={{
          marginBottom: theme.spacing.lg,
          borderRadius: theme.borderRadius.md,
          boxShadow: theme.shadows.base,
          border: `1px solid ${theme.colors.neutral.gray100}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <Space wrap>
            <Search
              placeholder="Search leads..."
              allowClear
              style={{ width: 300 }}
              prefix={<SearchOutlined style={prefixIconStyle} />}
              size="large"
              onSearch={(value) => {
                setFilters({ ...filters, search: value, page: 1 })
                fetchLeads()
              }}
            />
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: 200, ...largeInputStyle }}
              size="large"
              suffixIcon={<FilterOutlined style={prefixIconStyle} />}
              onChange={(value) => setFilters({ ...filters, status: value || '', page: 1 })}
            >
              <Option value="new">🆕 New</Option>
              <Option value="contacted">📞 Contacted</Option>
              <Option value="qualified">✅ Qualified</Option>
              <Option value="converted">🎉 Converted</Option>
              <Option value="lost">❌ Lost</Option>
            </Select>
          </Space>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => navigate('/sales/leads/new')}
            size="large"
            style={getPrimaryButtonStyle(150)}
          >
            Create Lead
          </Button>
        </div>
      </Card>

      {/* Leads Table */}
      <Card
        style={{
          borderRadius: theme.borderRadius.md,
          boxShadow: theme.shadows.base,
          border: `1px solid ${theme.colors.neutral.gray100}`,
        }}
      >
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
          onRow={(record) => ({
            onClick: () => navigate(`/sales/leads/${record.id}`),
            style: { cursor: 'pointer' }
          })}
          scroll={{ x: 1000 }}
        />
      </Card>
    </PageContainer>
  )
}

export default LeadList
