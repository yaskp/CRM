import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Select, Space, message } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { workOrderService } from '../../services/api/workOrders'

const { Option } = Select

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

  const fetchWorkOrders = async () => {
    setLoading(true)
    try {
      const response = await workOrderService.getWorkOrders(filters)
      setWorkOrders(response.work_orders || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch work orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkOrders()
  }, [filters.status])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default',
      approved: 'blue',
      active: 'green',
      completed: 'success',
    }
    return colors[status] || 'default'
  }

  const columns = [
    {
      title: 'Work Order Number',
      dataIndex: 'work_order_number',
      key: 'work_order_number',
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
      render: (_: any, record: WorkOrder) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/operations/work-orders/${record.id}`)}
        >
          View
        </Button>
      ),
    },
  ]

  return (
    <div className="content-container">
      <Card
        title="Work Order Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/operations/work-orders/new')}
          >
            Create Work Order
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 200 }}
            onChange={(value) => setFilters({ ...filters, status: value || '' })}
          >
            <Option value="draft">Draft</Option>
            <Option value="approved">Approved</Option>
            <Option value="active">Active</Option>
            <Option value="completed">Completed</Option>
          </Select>

          <Table
            columns={columns}
            dataSource={workOrders}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Space>
      </Card>
    </div>
  )
}

export default WorkOrderList

