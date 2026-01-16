import { useState, useEffect } from 'react'
import { Table, Card, Button, Tag, Space, Input, Select, DatePicker, message, Row, Col, Statistic, Typography } from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DashboardOutlined,
  ProjectOutlined,
  CalendarOutlined,
  SearchOutlined,
  FilterOutlined,
  FileTextOutlined,
  BarChartOutlined,
  EnvironmentOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { dprService } from '../../services/api/dpr'
import { projectService } from '../../services/api/projects'
import dayjs from 'dayjs'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, largeInputStyle, prefixIconStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Search } = Input
const { RangePicker } = DatePicker
const { Text } = Typography

const DPRList = () => {
  const [loading, setLoading] = useState(false)
  const [dprs, setDprs] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
    fetchDPRs()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await projectService.getProjects()
      setProjects(response.projects || [])
    } catch (error) {
      console.error('Failed to fetch projects')
    }
  }

  const fetchDPRs = async (params?: any) => {
    setLoading(true)
    try {
      const response = await dprService.getDPRs({
        ...params,
        page: params?.current || pagination.current,
        limit: params?.pageSize || pagination.pageSize,
      })
      setDprs(response.dprs || [])
      setPagination({
        current: response.pagination?.page || 1,
        pageSize: response.pagination?.limit || 10,
        total: response.pagination?.total || 0,
      })
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch DPRs')
    } finally {
      setLoading(false)
    }
  }

  const getStats = () => {
    const total = dprs.length
    const latestDate = dprs.length > 0 ? dayjs(dprs[0].report_date).format('DD-MMM') : 'N/A'
    const totalSteel = dprs.reduce((acc, curr) => acc + (Number(curr.steel_quantity_kg) || 0), 0)
    return { total, latestDate, totalSteel }
  }

  const stats = getStats()

  const columns = [
    {
      title: 'Report Date',
      dataIndex: 'report_date',
      key: 'report_date',
      width: 150,
      render: (date: string) => (
        <Space size="small">
          <CalendarOutlined style={{ color: theme.colors.primary.main }} />
          <Text strong>{dayjs(date).format('DD-MMM-YYYY')}</Text>
        </Space>
      ),
      sorter: (a: any, b: any) => dayjs(a.report_date).unix() - dayjs(b.report_date).unix(),
    },
    {
      title: 'Project & Site',
      key: 'project_site',
      width: 250,
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.project?.name}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <EnvironmentOutlined /> {record.site_location || 'N/A'} - {record.panel_number || 'No Panel'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Quantities',
      key: 'quantities',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Tooltip title="Steel (kg)">
            <Tag color="orange" style={{ borderRadius: '4px' }}><b>Fe:</b> {record.steel_quantity_kg || 0} kg</Tag>
          </Tooltip>
          <Tooltip title="Concrete (m³)">
            <Tag color="cyan" style={{ borderRadius: '4px' }}><b>Co:</b> {record.concrete_quantity_cubic_meter || 0} m³</Tag>
          </Tooltip>
          <Tooltip title="Guide Wall (m)">
            <Tag color="blue" style={{ borderRadius: '4px' }}><b>GW:</b> {record.guide_wall_running_meter || 0} m</Tag>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Reporter',
      dataIndex: ['creator', 'name'],
      key: 'creator',
      width: 150,
      render: (text: string) => <Tag style={{ border: 'none', background: theme.colors.neutral.gray50 }}>{text}</Tag>
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
            onClick={() => navigate(`/operations/dpr/${record.id}`)}
            style={{ padding: 0 }}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/operations/dpr/${record.id}/edit`)}
            style={{ padding: 0 }}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Daily Progress Reports (DPR)"
        subtitle="Track site-level productivity, material consumption, and project milestones daily"
        icon={<DashboardOutlined />}
      />

      <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Total Reports"
              value={pagination.total}
              prefix={<FileTextOutlined style={{ color: theme.colors.primary.main }} />}
              valueStyle={{ color: theme.colors.primary.main }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Latest Entry"
              value={stats.latestDate}
              prefix={<CalendarOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Total Steel Used"
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
            <Search
              placeholder="Search by location or panel..."
              style={{ width: 280, ...largeInputStyle }}
              size="large"
              onSearch={(value) => fetchDPRs({ search: value })}
              prefix={<SearchOutlined style={prefixIconStyle} />}
              allowClear
            />
            <Select
              placeholder="Filter by Project"
              style={{ width: 220, ...largeInputStyle }}
              size="large"
              allowClear
              showSearch
              optionFilterProp="children"
              onChange={(value) => fetchDPRs({ project_id: value })}
              suffixIcon={<ProjectOutlined style={prefixIconStyle} />}
            >
              {projects.map((project) => (
                <Select.Option key={project.id} value={project.id}>
                  {project.name}
                </Select.Option>
              ))}
            </Select>
            <RangePicker
              size="large"
              style={{ ...largeInputStyle, width: 280 }}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  fetchDPRs({
                    start_date: dates[0].format('YYYY-MM-DD'),
                    end_date: dates[1].format('YYYY-MM-DD'),
                  })
                } else {
                  fetchDPRs()
                }
              }}
            />
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/operations/dpr/new')}
            size="large"
            style={getPrimaryButtonStyle(180)}
          >
            Create New DPR
          </Button>
        </div>
      </Card>

      <Card style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
        <Table
          columns={columns}
          dataSource={dprs}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} DPR entries`,
          }}
          onChange={(pagination) => fetchDPRs({ current: pagination.current, pageSize: pagination.pageSize })}
        />
      </Card>
    </PageContainer>
  )
}

export default DPRList
import { Tooltip } from 'antd'
