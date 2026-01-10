import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Select, Space, message, Input } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { barBendingScheduleService } from '../../services/api/barBendingSchedule'
import { projectService } from '../../services/api/projects'

const { Search } = Input
const { Option } = Select

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
      title: 'Schedule Number',
      dataIndex: 'schedule_number',
      key: 'schedule_number',
    },
    {
      title: 'Project',
      dataIndex: ['project', 'name'],
      key: 'project',
      render: (project: any) => project?.name || '-',
    },
    {
      title: 'Panel Number',
      dataIndex: 'panel_number',
      key: 'panel_number',
    },
    {
      title: 'Steel Quantity (Kg)',
      dataIndex: 'steel_quantity_kg',
      key: 'steel_quantity_kg',
      render: (qty: number) => qty ? `${qty.toLocaleString('en-IN')} Kg` : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        if (!status || typeof status !== 'string') return <Tag>N/A</Tag>
        return <Tag color={getStatusColor(status)}>{status.replace('_', ' ').toUpperCase()}</Tag>
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: BarBendingSchedule) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/operations/bar-bending/${record.id}`)}
        >
          View
        </Button>
      ),
    },
  ]

  return (
    <div className="content-container">
      <Card
        title="Bar Bending Schedule"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/operations/bar-bending/new')}
          >
            Create Schedule
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space wrap>
            <Select
              placeholder="Filter by project"
              allowClear
              style={{ width: 300 }}
              onChange={(value) => setFilters({ ...filters, project_id: value })}
            >
              {projects.map((project) => (
                <Option key={project.id} value={project.id}>
                  {project.project_code} - {project.name}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: 200 }}
              onChange={(value) => setFilters({ ...filters, status: value || '' })}
            >
              <Option value="draft">Draft</Option>
              <Option value="approved">Approved</Option>
              <Option value="in_progress">In Progress</Option>
              <Option value="completed">Completed</Option>
            </Select>
          </Space>

          <Table
            columns={columns}
            dataSource={schedules}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Space>
      </Card>
    </div>
  )
}

export default BarBendingScheduleList

