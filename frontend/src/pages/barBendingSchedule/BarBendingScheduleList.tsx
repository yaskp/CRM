import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Select, Space, message, Row, Col, Statistic, Typography } from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  DeploymentUnitOutlined,
  ProjectOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  BlockOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { barBendingScheduleService } from '../../services/api/barBendingSchedule'
import { projectService } from '../../services/api/projects'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, largeInputStyle, prefixIconStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Option } = Select
const { Text } = Typography

interface BarBendingSchedule {
  id: number
  project_id: number
  panel_number?: string
  schedule_number?: string
  drawing_reference?: string
  steel_quantity_kg?: number
  status: string
  created_at: string
}

const BarBendingScheduleList = () => {
  const [schedules, setSchedules] = useState<BarBendingSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [filters, setFilters] = useState({
    project_id: undefined as number | undefined,
    status: '',
    page: 1,
    limit: 10,
  })
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
    fetchSchedules()
  }, [filters.project_id, filters.status])

  const fetchProjects = async () => {
    try {
      const response = await projectService.getProjects({ limit: 100 })
      setProjects(response.projects || [])
    } catch (error) {
      console.error('Failed to fetch projects')
    }
  }

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const response = await barBendingScheduleService.getBarBendingSchedules(filters)
      setSchedules(response.barBendingSchedules || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch bar bending schedules')
    } finally {
      setLoading(false)
    }
  }

  const getStats = () => {
    const totalCount = schedules.length
    const totalSteel = schedules.reduce((sum, s) => sum + (Number(s.steel_quantity_kg) || 0), 0)
    const pendingCount = schedules.filter(s => s.status === 'draft' || s.status === 'in_progress').length
    return { totalCount, totalSteel, pendingCount }
  }

  const stats = getStats()

  const getStatusColor = (status: string) => {
    if (!status || typeof status !== 'string') return 'default'
    const colors: Record<string, string> = {
      draft: 'default',
      approved: 'blue',
      in_progress: 'processing',
      completed: 'success',
    }
    return colors[status] || 'default'
  }

  const columns = [
    {
      title: 'Schedule #',
      dataIndex: 'schedule_number',
      key: 'schedule_number',
      width: 180,
      render: (text: string) => <Text strong style={{ color: theme.colors.primary.main }}>{text || 'N/A'}</Text>,
    },
    {
      title: 'Project Information',
      key: 'project_info',
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.project?.name || 'N/A'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.project?.project_code}</Text>
        </Space>
      ),
    },
    {
      title: 'Panel Number',
      dataIndex: 'panel_number',
      key: 'panel_number',
      width: 140,
      render: (text: string) => <Tag color="purple">#{text || 'N/A'}</Tag>
    },
    {
      title: 'Steel Qty',
      dataIndex: 'steel_quantity_kg',
      key: 'steel_quantity_kg',
      align: 'right' as const,
      render: (qty: number) => (
        <Space size="small">
          <Text strong>{qty ? qty.toLocaleString('en-IN') : '0'}</Text>
          <Text type="secondary">Kg</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: string) => {
        if (!status || typeof status !== 'string') return <Tag>N/A</Tag>
        return (
          <Tag color={getStatusColor(status)} style={{ padding: '0 8px', borderRadius: '4px' }}>
            {status.replace('_', ' ').toUpperCase()}
          </Tag>
        )
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: BarBendingSchedule) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/operations/bar-bending/${record.id}`)}
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
        title="Bar Bending Schedule (BBS)"
        subtitle="Manage structural steel reinforcement details, panel-wise cuts, and quantities"
        icon={<DeploymentUnitOutlined />}
      />

      <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Work Schedules"
              value={stats.totalCount}
              prefix={<BlockOutlined style={{ color: theme.colors.primary.main }} />}
              valueStyle={{ color: theme.colors.primary.main }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Active / Pending"
              value={stats.pendingCount}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Estimated Steel"
              value={stats.totalSteel}
              suffix="kg"
              prefix={<BarChartOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: theme.spacing.lg, borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <Space size="middle" wrap>
            <Select
              placeholder="Select Project"
              allowClear
              size="large"
              style={{ width: 300, ...largeInputStyle }}
              showSearch
              optionFilterProp="children"
              onChange={(value) => setFilters({ ...filters, project_id: value })}
              suffixIcon={<ProjectOutlined style={prefixIconStyle} />}
            >
              {projects.map((project) => (
                <Option key={project.id} value={project.id}>
                  {project.project_code} - {project.name}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="All Statuses"
              allowClear
              size="large"
              style={{ width: 220, ...largeInputStyle }}
              onChange={(value) => setFilters({ ...filters, status: value || '' })}
              suffixIcon={<FilterOutlined style={prefixIconStyle} />}
            >
              <Option value="draft">⏳ Draft Schedules</Option>
              <Option value="approved">✅ Approved</Option>
              <Option value="in_progress">🏗️ In Progress</Option>
              <Option value="completed">🏆 Completed</Option>
            </Select>
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/operations/bar-bending/new')}
            size="large"
            style={getPrimaryButtonStyle(200)}
          >
            Create BBS Entry
          </Button>
        </div>
      </Card>

      <Card style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
        <Table
          columns={columns}
          dataSource={schedules}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} BBS Entries`
          }}
        />
      </Card>
    </PageContainer>
  )
}

export default BarBendingScheduleList
