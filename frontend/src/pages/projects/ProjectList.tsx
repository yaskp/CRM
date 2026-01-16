import { useState, useEffect } from 'react'
import { Table, Button, Input, Select, Space, Tag, message, Card, Typography, Row, Col, Statistic } from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ProjectOutlined,
  EyeOutlined,
  FilterOutlined,
  AppstoreOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../../services/api/projects'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import {
  getPrimaryButtonStyle,
  getSecondaryButtonStyle,
  largeInputStyle,
  prefixIconStyle
} from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Search } = Input
const { Option } = Select
const { Text } = Typography

interface Project {
  id: number
  project_code: string
  name: string
  location?: string
  status: string
  created_at: string
}

const ProjectList = () => {
  const [projects, setProjects] = useState<Project[]>([])
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

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const response = await projectService.getProjects(filters)
      setProjects(response.projects)
      setPagination(response.pagination)
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [filters])

  const handleStatusChange = (status: string) => {
    setFilters({ ...filters, status, page: 1 })
  }

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value, page: 1 })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      lead: 'blue',
      quotation: 'orange',
      confirmed: 'green',
      design: 'purple',
      mobilization: 'cyan',
      execution: 'geekblue',
      completed: 'success',
      on_hold: 'default',
    }
    return colors[status] || 'default'
  }

  const getStatusCounts = () => {
    const counts: Record<string, number> = {}
    projects.forEach(project => {
      counts[project.status] = (counts[project.status] || 0) + 1
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  const columns = [
    {
      title: 'Project Code',
      dataIndex: 'project_code',
      key: 'project_code',
      width: 150,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} style={{ fontWeight: 500 }}>
          {status.toUpperCase().replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (date: string) => new Date(date).toLocaleDateString('en-GB'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: Project) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/sales/projects/${record.id}`)
          }}
          style={{ padding: 0 }}
        >
          View
        </Button>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        subtitle="Manage and track all construction projects"
        icon={<ProjectOutlined />}
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
              title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Total Projects</Text>}
              value={pagination.total}
              prefix={<AppstoreOutlined style={{ color: theme.colors.primary.main }} />}
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
              title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Active Projects</Text>}
              value={statusCounts['execution'] || 0}
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
              title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Completed</Text>}
              value={statusCounts['completed'] || 0}
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
              title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>On Hold</Text>}
              value={statusCounts['on_hold'] || 0}
              valueStyle={{ color: '#faad14', fontWeight: 600 }}
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
              placeholder="Search projects..."
              allowClear
              onSearch={handleSearch}
              style={{ width: 300 }}
              prefix={<SearchOutlined style={prefixIconStyle} />}
              size="large"
            />
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: 200, ...largeInputStyle }}
              onChange={handleStatusChange}
              size="large"
              suffixIcon={<FilterOutlined style={prefixIconStyle} />}
            >
              <Option value="lead">🔵 Lead</Option>
              <Option value="quotation">🟠 Quotation</Option>
              <Option value="confirmed">🟢 Confirmed</Option>
              <Option value="design">🟣 Design</Option>
              <Option value="mobilization">🔷 Mobilization</Option>
              <Option value="execution">⚡ Execution</Option>
              <Option value="completed">✅ Completed</Option>
              <Option value="on_hold">⏸️ On Hold</Option>
            </Select>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/sales/projects/new')}
            size="large"
            style={getPrimaryButtonStyle(150)}
          >
            New Project
          </Button>
        </div>
      </Card>

      {/* Projects Table */}
      <Card
        style={{
          borderRadius: theme.borderRadius.md,
          boxShadow: theme.shadows.base,
          border: `1px solid ${theme.colors.neutral.gray100}`,
        }}
      >
        <Table
          columns={columns}
          dataSource={projects}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} projects`,
            onChange: (page, pageSize) => {
              setFilters({ ...filters, page, limit: pageSize })
            },
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/sales/projects/${record.id}`),
            style: { cursor: 'pointer' }
          })}
          scroll={{ x: 1000 }}
        />
      </Card>
    </PageContainer>
  )
}

export default ProjectList
