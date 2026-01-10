import { useState, useEffect } from 'react'
import { Card, Table, Button, Select, Space, message } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { drawingService } from '../../services/api/drawings'
import { projectService } from '../../services/api/projects'

const { Option } = Select

interface Drawing {
  id: number
  drawing_code: string
  project_id: number
  drawing_type: string
  file_url: string
  uploaded_at: string
}

const DrawingList = () => {
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [filters, setFilters] = useState({ project_id: undefined })
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
    fetchDrawings()
  }, [filters.project_id])

  const fetchProjects = async () => {
    try {
      const response = await projectService.getProjects({ limit: 100 })
      setProjects(response.projects || [])
    } catch (error) {
      console.error('Failed to fetch projects')
    }
  }

  const fetchDrawings = async () => {
    setLoading(true)
    try {
      const response = await drawingService.getDrawings(filters)
      setDrawings(response.drawings || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch drawings')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Drawing Code',
      dataIndex: 'drawing_code',
      key: 'drawing_code',
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
      render: (project: any) => project?.name || '-',
    },
    {
      title: 'Type',
      dataIndex: 'drawing_type',
      key: 'drawing_type',
    },
    {
      title: 'Uploaded At',
      dataIndex: 'uploaded_at',
      key: 'uploaded_at',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Drawing) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/drawings/${record.id}`)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="content-container">
      <Card
        title="Drawing Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/drawings/new')}
          >
            Upload Drawing
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
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

          <Table
            columns={columns}
            dataSource={drawings}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Space>
      </Card>
    </div>
  )
}

export default DrawingList

