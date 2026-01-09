import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, message, Spin } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { projectService } from '../../services/api/projects'

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchProject()
    }
  }, [id])

  const fetchProject = async () => {
    setLoading(true)
    try {
      const response = await projectService.getProject(Number(id))
      setProject(response.project)
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch project')
    } finally {
      setLoading(false)
    }
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

  if (loading) {
    return (
      <div className="content-container" style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="content-container">
        <Card>Project not found</Card>
      </div>
    )
  }

  return (
    <div className="content-container">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/projects')}
        style={{ marginBottom: 16 }}
      >
        Back to Projects
      </Button>

      <Card title="Project Details">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Project Code">
            {project.project_code}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusColor(project.status)}>
              {project.status.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Name" span={2}>
            {project.name}
          </Descriptions.Item>
          <Descriptions.Item label="Location">
            {project.location || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="City">
            {project.city || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="State">
            {project.state || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Client HO Address" span={2}>
            {project.client_ho_address || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {new Date(project.created_at).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Created By">
            {project.creator?.name || 'N/A'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}

export default ProjectDetails

