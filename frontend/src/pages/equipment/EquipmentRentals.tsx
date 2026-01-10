import { useState, useEffect } from 'react'
import { Table, Card, Button, Tag, Space, Input, Select, DatePicker, message, Popconfirm } from 'antd'
import { PlusOutlined, EyeOutlined, ToolOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { equipmentService } from '../../services/api/equipment'
import { projectService } from '../../services/api/projects'
import dayjs from 'dayjs'

const { Search } = Input

const EquipmentRentals = () => {
  const [loading, setLoading] = useState(false)
  const [rentals, setRentals] = useState<any[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    fetchRentals()
  }, [])

  const fetchRentals = async (params?: any) => {
    setLoading(true)
    try {
      const response = await equipmentService.getRentals({
        ...params,
        page: params?.current || pagination.current,
        limit: params?.pageSize || pagination.pageSize,
      })
      setRentals(response.rentals || [])
      setPagination({
        current: response.pagination?.page || 1,
        pageSize: response.pagination?.limit || 10,
        total: response.pagination?.total || 0,
      })
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch rentals')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Project',
      dataIndex: ['project', 'name'],
      key: 'project',
      render: (text: string, record: any) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.project?.project_code}</div>
        </div>
      ),
    },
    {
      title: 'Equipment',
      dataIndex: ['equipment', 'name'],
      key: 'equipment',
      render: (text: string, record: any) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.equipment?.equipment_code}</div>
        </div>
      ),
    },
    {
      title: 'Vendor',
      dataIndex: ['vendor', 'name'],
      key: 'vendor',
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date: string) => dayjs(date).format('DD-MM-YYYY'),
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date: string) => date ? dayjs(date).format('DD-MM-YYYY') : '-',
    },
    {
      title: 'Total Amount (₹)',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => amount ? `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-',
    },
    {
      title: 'Deductions (₹)',
      dataIndex: 'breakdown_deduction_amount',
      key: 'deductions',
      render: (amount: number) => amount ? `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-',
    },
    {
      title: 'Net Amount (₹)',
      dataIndex: 'net_amount',
      key: 'net_amount',
      render: (amount: number) => (
        <strong>
          {amount ? `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
        </strong>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          active: 'processing',
          completed: 'success',
          terminated: 'error',
        }
        return <Tag color={colorMap[status]}>{status.toUpperCase()}</Tag>
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/operations/equipment/rentals/${record.id}`)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<ToolOutlined />}
            onClick={() => navigate(`/operations/equipment/rentals/${record.id}/breakdown`)}
          >
            Report Breakdown
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="Equipment Rentals"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/operations/equipment/rentals/new')}
        >
          Create Rental
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Space>
          <Search
            placeholder="Search rentals"
            style={{ width: 250 }}
            onSearch={(value) => fetchRentals({ search: value })}
          />
          <Select
            placeholder="Filter by Status"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => fetchRentals({ status: value })}
          >
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="completed">Completed</Select.Option>
            <Select.Option value="terminated">Terminated</Select.Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={rentals}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} rentals`,
          }}
          onChange={(pagination) => fetchRentals({ current: pagination.current, pageSize: pagination.pageSize })}
        />
      </Space>
    </Card>
  )
}

export default EquipmentRentals

