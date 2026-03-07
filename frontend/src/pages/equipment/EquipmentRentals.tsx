import { useState, useEffect } from 'react'
import { Table, Card, Button, Tag, Space, Input, Select, message, Row, Col, Statistic, Typography, Tooltip } from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  ToolOutlined,
  CalendarOutlined,
  ProjectOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  ShopOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { equipmentService } from '../../services/api/equipment'
import dayjs from 'dayjs'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, largeInputStyle, prefixIconStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Search } = Input
const { Text } = Typography

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

  const getStats = () => {
    const activeCount = rentals.filter(r => r.status === 'active').length
    const totalDeductions = rentals.reduce((sum, r) => sum + (Number(r.breakdown_deduction_amount) || 0), 0)
    const netValue = rentals.reduce((sum, r) => sum + (Number(r.net_amount) || 0), 0)
    return { activeCount, totalDeductions, netValue }
  }

  const stats = getStats()

  const columns = [
    {
      title: 'Lease Information',
      key: 'lease_info',
      width: 250,
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: theme.colors.primary.main }}>{record.equipment?.name}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <ProjectOutlined /> {record.project?.name} ({record.project?.project_code})
          </Text>
        </Space>
      ),
    },
    {
      title: 'Procurement',
      key: 'vendor_info',
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong><ShopOutlined /> {record.vendor?.name}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>EQ: {record.equipment?.equipment_code}</Text>
        </Space>
      ),
    },
    {
      title: 'Lease Tenure',
      key: 'tenure',
      width: 180,
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '13px' }}><CalendarOutlined /> {dayjs(record.start_date).format('DD-MMM-YY')} → {record.end_date ? dayjs(record.end_date).format('DD-MMM-YY') : 'Open'}</Text>
          {record.status === 'active' && <Text type="success" style={{ fontSize: '11px' }}>Active Renewal</Text>}
        </Space>
      ),
    },
    {
      title: 'Financials',
      key: 'financials',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <div style={{ textAlign: 'right' }}>
          <Text strong style={{ display: 'block' }}>₹{record.total_amount?.toLocaleString('en-IN')}</Text>
          {record.breakdown_deduction_amount > 0 && (
            <Tooltip title="Breakdown Deductions">
              <Text type="danger" style={{ fontSize: '11px' }}>- ₹{record.breakdown_deduction_amount?.toLocaleString('en-IN')}</Text>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: 'Net Amount',
      dataIndex: 'net_amount',
      key: 'net_amount',
      width: 150,
      align: 'right' as const,
      render: (amount: number) => (
        <Text strong style={{ color: theme.colors.success.main, fontSize: '15px' }}>
          ₹{amount?.toLocaleString('en-IN')}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          active: 'processing',
          completed: 'success',
          terminated: 'error',
        }
        return <Tag color={colorMap[status]} style={{ borderRadius: '4px', fontWeight: 'bold' }}>{status.toUpperCase()}</Tag>
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/operations/equipment/rentals/${record.id}`)}
            style={{ padding: 0 }}
          >
            Details
          </Button>
          <Button
            type="link"
            icon={<ToolOutlined />}
            onClick={() => navigate(`/operations/equipment/rentals/${record.id}/breakdown`)}
            danger
            style={{ padding: 0 }}
          >
            Breakdown
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Equipment Rentals & Leases"
        subtitle="Track third-party equipment deployments, rental costs, and breakdown deductions across project sites"
        icon={<SafetyCertificateOutlined />}
      />

      <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Active Leases"
              value={stats.activeCount}
              prefix={<ClockCircleOutlined style={{ color: theme.colors.primary.main }} />}
              valueStyle={{ color: theme.colors.primary.main }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Breakdown Deductions"
              value={stats.totalDeductions}
              prefix={<WarningOutlined style={{ color: '#cf1322' }} />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Total Net Payload"
              value={stats.netValue}
              prefix="₹"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: theme.spacing.lg, borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <Space size="middle" wrap>
            <Search
              placeholder="Search by equipment or project..."
              style={{ width: 280, ...largeInputStyle }}
              size="large"
              onSearch={(value) => fetchRentals({ search: value })}
              prefix={<SearchOutlined style={prefixIconStyle} />}
              allowClear
            />
            <Select
              placeholder="All Rental Statuses"
              style={{ width: 200, ...largeInputStyle }}
              size="large"
              allowClear
              onChange={(value) => fetchRentals({ status: value })}
              suffixIcon={<FilterOutlined style={prefixIconStyle} />}
            >
              <Select.Option value="active">🟢 Active Leases</Select.Option>
              <Select.Option value="completed">🔵 Completed</Select.Option>
              <Select.Option value="terminated">🔴 Terminated</Select.Option>
            </Select>
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/operations/equipment/rentals/new')}
            size="large"
            style={getPrimaryButtonStyle(200)}
          >
            New Lease Agreement
          </Button>
        </div>
      </Card>

      <Card style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
        <Table
          columns={columns}
          dataSource={rentals}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} equipment rentals`,
          }}
          onChange={(pagination) => fetchRentals({ current: pagination.current, pageSize: pagination.pageSize })}
        />
      </Card>
    </PageContainer>
  )
}

export default EquipmentRentals
