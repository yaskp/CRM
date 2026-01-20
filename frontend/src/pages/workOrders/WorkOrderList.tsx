import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Select, Space, message, Row, Col, Statistic, Typography, Modal, Form } from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  EditOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { workOrderService } from '../../services/api/workOrders'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, largeInputStyle, prefixIconStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Option } = Select
const { Text } = Typography

interface WorkOrder {
  id: number
  work_order_number: string
  project_id: number
  total_amount: number
  final_amount: number
  status: string
  created_at: string
}

const WorkOrderList = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ status: '', page: 1, limit: 10 })
  const navigate = useNavigate()

  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [form] = Form.useForm()

  const fetchWorkOrders = async () => {
    setLoading(true)
    try {
      const response = await workOrderService.getWorkOrders(filters)
      setWorkOrders(response.workOrders || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch work orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkOrders()
  }, [filters.status])

  const handleStatusClick = (record: WorkOrder) => {
    setEditingWorkOrder(record)
    form.setFieldsValue({ status: record.status })
    setStatusModalVisible(true)
  }

  const handleStatusUpdate = async () => {
    try {
      const values = await form.validateFields()
      setUpdatingStatus(true)
      await workOrderService.updateWorkOrder(editingWorkOrder!.id, { status: values.status })
      message.success('Status updated successfully')
      setStatusModalVisible(false)
      fetchWorkOrders()
    } catch (error: any) {
      if (error?.errorFields) return // Validation failed
      message.error(error.response?.data?.message || 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getStats = () => {
    const totalCount = workOrders.length
    const activeCount = workOrders.filter(w => w.status === 'active').length
    const totalValue = workOrders.reduce((sum, w) => sum + (w.final_amount || 0), 0)
    return { totalCount, activeCount, totalValue }
  }

  const stats = getStats()

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default',
      approved: 'processing',
      active: 'cyan',
      completed: 'success',
      cancelled: 'error'
    }
    return colors[status] || 'default'
  }

  const columns = [
    {
      title: 'Work Order #',
      dataIndex: 'work_order_number',
      key: 'work_order_number',
      width: 180,
      render: (text: string, record: WorkOrder) => (
        <Text
          strong
          style={{ color: theme.colors.primary.main, cursor: 'pointer' }}
          onClick={() => navigate(`/operations/work-orders/${record.id}`)}
        >
          {text}
        </Text>
      ),
    },
    {
      title: 'Total Order Value',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => (
        <Text strong>₹{amount?.toLocaleString('en-IN') || 0}</Text>
      ),
    },
    {
      title: 'Final Amount (Incl Tax)',
      dataIndex: 'final_amount',
      key: 'final_amount',
      render: (amount: number) => (
        <Text strong style={{ color: theme.colors.success.main }}>₹{amount?.toLocaleString('en-IN') || 0}</Text>
      ),
    },
    {
      title: 'Current Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: string, record: WorkOrder) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag color={getStatusColor(status)} style={{ padding: '0 8px', borderRadius: '4px', marginRight: 0 }}>
            {status.toUpperCase()}
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
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: WorkOrder) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/operations/work-orders/${record.id}`)}
          style={{ padding: 0 }}
        >
          View Details
        </Button>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Work Order Management"
        subtitle="Issue and track task-based work orders for contractors and vendors"
        icon={<SafetyCertificateOutlined />}
      />

      <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Total Orders"
              value={stats.totalCount}
              prefix={<FileTextOutlined style={{ color: theme.colors.primary.main }} />}
              valueStyle={{ color: theme.colors.primary.main }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Active Work"
              value={stats.activeCount}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Total Order Value"
              value={stats.totalValue}
              prefix="₹"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: theme.spacing.lg, borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <Space size="middle" wrap>
            <Select
              placeholder="Filter by Progress"
              allowClear
              size="large"
              style={{ width: 220, ...largeInputStyle }}
              onChange={(value) => setFilters({ ...filters, status: value || '' })}
              suffixIcon={<FilterOutlined style={prefixIconStyle} />}
            >
              <Option value="draft">⏳ Draft Orders</Option>
              <Option value="approved">✅ Approved</Option>
              <Option value="active">🚀 Active Execution</Option>
              <Option value="completed">🏆 Completed</Option>
            </Select>
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/operations/work-orders/new')}
            size="large"
            style={getPrimaryButtonStyle(200)}
          >
            Issue New Work Order
          </Button>
        </div>
      </Card>

      <Card style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
        <Table
          columns={columns}
          dataSource={workOrders}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} Work Orders`
          }}
        />
      </Card>

      <Modal
        title="Update Work Order Status"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        onOk={handleStatusUpdate}
        confirmLoading={updatingStatus}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select size="large">
              <Option value="draft">⏳ Draft</Option>
              <Option value="approved">✅ Approved</Option>
              <Option value="active">🚀 Active</Option>
              <Option value="completed">🏆 Completed</Option>
              <Option value="cancelled">❌ Cancelled</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default WorkOrderList
