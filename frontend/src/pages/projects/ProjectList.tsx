import { useState, useEffect } from 'react'
import { Table, Button, Input, Select, Space, Tag, message } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../../services/api/projects'

const { Search } = Input
const { Option } = Select

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

  const columns = [
    {
      title: 'Project Code',
      dataIndex: 'project_code',
      key: 'project_code',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
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
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Project) => (
        <Space>
          <Button
            type="link"
            onClick={() => navigate(`/projects/${record.id}`)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="content-container">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <Space>
          <Search
            placeholder="Search projects..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 200 }}
            onChange={handleStatusChange}
          >
            <Option value="lead">Lead</Option>
            <Option value="quotation">Quotation</Option>
            <Option value="confirmed">Confirmed</Option>
            <Option value="design">Design</Option>
            <Option value="mobilization">Mobilization</Option>
            <Option value="execution">Execution</Option>
            <Option value="completed">Completed</Option>
            <Option value="on_hold">On Hold</Option>
          </Select>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/projects/new')}
        >
          New Project
        </Button>
      </div>

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
      />
    </div>
  )
}

export default ProjectList

