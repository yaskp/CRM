import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Input, Select, Space, message, Row, Col, Statistic, Typography, Modal, Form } from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  CopyOutlined,
  EditOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { quotationService } from '../../services/api/quotations'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, largeInputStyle, prefixIconStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

import { useAuth } from '../../context/AuthContext'


const { Search } = Input
const { Option } = Select
const { Text } = Typography

interface Quotation {
  id: number
  quotation_number: string
  lead_id: number
  version_number: number
  total_amount: number
  discount_percentage: number
  final_amount: number
  status: string
  valid_until?: string
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

  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [form] = Form.useForm()
  const { user } = useAuth()
  const isAdmin = user?.roles?.includes('Admin')

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

  const handleStatusClick = (record: Quotation) => {
    setEditingQuotation(record)
    form.setFieldsValue({ status: record.status })
    setStatusModalVisible(true)
  }

  const handleStatusUpdate = async () => {
    try {
      const values = await form.validateFields()
      setUpdatingStatus(true)
      await quotationService.updateQuotation(editingQuotation!.id, { status: values.status })
      message.success('Status updated successfully')
      setStatusModalVisible(false)
      fetchQuotations()
    } catch (error: any) {
      if (error?.errorFields && error.errorFields.length > 0) {
        message.error(error.errorFields[0].errors[0]);
        return;
      }
      message.error(error.response?.data?.message || 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default',
      sent: 'blue',
      accepted_by_party: 'green',
      approved: 'cyan',
      rejected: 'red',
      expired: 'orange',
      superseded: 'warning',
    }
    return colors[status] || 'default'
  }

  const getStatusCounts = () => {
    const counts: Record<string, number> = {}
    quotations.forEach(q => {
      counts[q.status] = (counts[q.status] || 0) + 1
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  const columns = [
    {
      title: 'Quotation Code',
      dataIndex: 'quotation_number',
      key: 'quotation_number',
      width: 150,
      render: (code: string, record: Quotation) => (
        <Text
          strong
          style={{ cursor: 'pointer', color: theme.colors.primary.main }}
          onClick={() => navigate(`/sales/quotations/${record.id}`)}
        >
          {code}
        </Text>
      ),
    },
    {
      title: 'Version',
      dataIndex: 'version_number',
      key: 'version_number',
      width: 100,
      sorter: (a: Quotation, b: Quotation) => a.version_number - b.version_number,
    },
    {
      title: 'Lead',
      dataIndex: 'lead',
      key: 'lead',
      width: 200,
      render: (lead: any) => (
        <div>
          <Text strong style={{ display: 'block' }}>{lead?.name || 'N/A'}</Text>
          {lead?.company_name && <Text type="secondary" style={{ fontSize: 12 }}>{lead.company_name}</Text>}
        </div>
      ),
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 140,
      render: (amount: number) => (
        <Text style={{ color: theme.colors.neutral.gray600 }}>
          ₹{Number(amount)?.toLocaleString('en-IN') || 0}
        </Text>
      ),
    },
    {
      title: 'Final Amount',
      dataIndex: 'final_amount',
      key: 'final_amount',
      width: 140,
      render: (amount: number) => (
        <Text strong style={{ color: theme.colors.primary.main, fontSize: 15 }}>
          ₹{Number(amount)?.toLocaleString('en-IN') || 0}
        </Text>
      ),
    },
    {
      title: 'Valid Until',
      dataIndex: 'valid_until',
      key: 'valid_until',
      width: 130,
      render: (date: string) => date ? new Date(date).toLocaleDateString('en-GB') : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string, record: Quotation) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag color={getStatusColor(status)} style={{ fontWeight: 500, marginRight: 0 }}>
            {status === 'accepted_by_party' ? 'ACCEPTED BY PARTY' : status === 'approved' ? 'APPROVED (INT)' : status === 'superseded' ? 'SUPERSEDED' : status.toUpperCase()}
          </Tag>
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              handleStatusClick(record)
            }}
          />
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Quotation) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/sales/quotations/${record.id}`)
            }}
            style={{ padding: 0 }}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/sales/quotations/${record.id}/edit`)
            }}
            disabled={record.status === 'superseded'}
            style={{ padding: 0 }}
          >
            Edit
          </Button>
          <Button
            type="link"
            icon={<CopyOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/sales/quotations/new?source_id=${record.id}`)
            }}
            disabled={record.status === 'superseded'}
            style={{ padding: 0 }}
          >
            Revise
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              handleDownload(record.id, record.quotation_number)
            }}
            style={{ padding: 0 }}
          >
            PDF
          </Button>
        </Space>
      ),
    },
  ]

  const handleDownload = async (id: number, number: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/quotations/${id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Quotation-${number}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      message.error('Failed to download PDF')
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Quotation Management"
        subtitle="Manage and track all sales quotations"
        icon={<FileTextOutlined />}
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
              title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Total Quotations</Text>}
              value={quotations.length}
              prefix={<FileTextOutlined style={{ color: theme.colors.primary.main }} />}
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
              title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Accepted</Text>}
              value={(statusCounts['accepted_by_party'] || 0) + (statusCounts['accepted'] || 0)}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
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
              title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Pending</Text>}
              value={statusCounts['sent'] || 0}
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
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
              title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Rejected</Text>}
              value={statusCounts['rejected'] || 0}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f', fontWeight: 600 }}
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
              placeholder="Search quotations..."
              allowClear
              style={{ width: 300 }}
              prefix={<SearchOutlined style={prefixIconStyle} />}
              size="large"
              onSearch={(value) => {
                setFilters({ ...filters, search: value, page: 1 })
                fetchQuotations()
              }}
            />
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: 200, ...largeInputStyle }}
              size="large"
              suffixIcon={<FilterOutlined style={prefixIconStyle} />}
              onChange={(value) => setFilters({ ...filters, status: value || '' })}
            >
              <Option value="draft">📝 Draft</Option>
              <Option value="sent">📤 Sent</Option>
              <Option value="accepted_by_party">✅ Accepted by Party</Option>
              <Option value="approved">🛡️ Approved (Internal)</Option>
              <Option value="rejected">❌ Rejected</Option>
              <Option value="expired">⏰ Expired</Option>
            </Select>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/sales/quotations/new')}
            size="large"
            style={getPrimaryButtonStyle(180)}
          >
            Create Quotation
          </Button>
        </div>
      </Card>

      {/* Quotations Table */}
      <Card
        style={{
          borderRadius: theme.borderRadius.md,
          boxShadow: theme.shadows.base,
          border: `1px solid ${theme.colors.neutral.gray100}`,
        }}
      >
        <Table
          columns={columns}
          dataSource={quotations}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          onRow={undefined}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title="Update Quotation Status"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        onOk={handleStatusUpdate}
        confirmLoading={updatingStatus}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select size="large">
              <Option value="draft">📝 Draft</Option>
              <Option value="sent">📤 Sent</Option>
              <Option value="accepted_by_party">✅ Accepted by Party</Option>
              <Option value="rejected">❌ Rejected</Option>
              {isAdmin && <Option value="approved">🛡️ Approved (Internal)</Option>}
              <Option value="expired">⏰ Expired</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default QuotationList
