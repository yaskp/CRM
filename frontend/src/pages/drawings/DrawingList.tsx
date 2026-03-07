import { useState, useEffect } from 'react'
import { Card, Table, Button, Select, Space, message, Row, Col, Statistic, Typography, Tag } from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  FilePptOutlined, // Using PPT as a proxy for 'drawing/blueprint'
  ProjectOutlined,
  CloudUploadOutlined,
  FileImageOutlined,
  CalendarOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { drawingService } from '../../services/api/drawings'
import { projectService } from '../../services/api/projects'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, largeInputStyle, prefixIconStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'
import dayjs from 'dayjs'

const { Option } = Select
const { Text } = Typography

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

  const getStats = () => {
    const totalCount = drawings.length
    const latestUpload = drawings.length > 0 ? dayjs(drawings[0].uploaded_at).format('DD-MMM') : 'N/A'
    const uniqueProjects = new Set(drawings.map(d => d.project_id)).size
    return { totalCount, latestUpload, uniqueProjects }
  }

  const stats = getStats()

  const columns = [
    {
      title: 'Drawing Code',
      dataIndex: 'drawing_code',
      key: 'drawing_code',
      width: 180,
      render: (text: string) => <Text strong style={{ color: theme.colors.primary.main }}>{text || 'N/A'}</Text>,
    },
    {
      title: 'Project Assignment',
      key: 'project_info',
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.project?.name || 'N/A'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.project?.project_code}</Text>
        </Space>
      ),
    },
    {
      title: 'Type / Purpose',
      dataIndex: 'drawing_type',
      key: 'drawing_type',
      render: (type: string) => (
        <Tag color="geekblue" icon={<FileImageOutlined />} style={{ borderRadius: '4px' }}>
          {type?.toUpperCase() || 'GENERAL'}
        </Tag>
      ),
    },
    {
      title: 'Upload Statistics',
      dataIndex: 'uploaded_at',
      key: 'uploaded_at',
      width: 200,
      render: (date: string) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '13px' }}><CalendarOutlined /> {date ? dayjs(date).format('DD-MMM-YYYY') : '-'}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>{date ? dayjs(date).format('HH:mm A') : ''}</Text>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Drawing) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/drawings/${record.id}`)}
          style={{ padding: 0 }}
        >
          Open Details
        </Button>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Drawing Inventory"
        subtitle="Centralized repository for project blueprints, structural designs, and technical site drawings"
        icon={<FilePptOutlined />}
      />

      <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Total Blueprints"
              value={stats.totalCount}
              prefix={<FileTextOutlined style={{ color: theme.colors.primary.main }} />}
              valueStyle={{ color: theme.colors.primary.main }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Active Project Files"
              value={stats.uniqueProjects}
              prefix={<ProjectOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Latest Revision"
              value={stats.latestUpload}
              prefix={<CloudUploadOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: theme.spacing.lg, borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <Space size="middle" wrap>
            <Select
              placeholder="Filter by Project"
              allowClear
              size="large"
              style={{ width: 350, ...largeInputStyle }}
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
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/drawings/new')}
            size="large"
            style={getPrimaryButtonStyle(220)}
          >
            Upload New Drawing
          </Button>
        </div>
      </Card>

      <Card style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
        <Table
          columns={columns}
          dataSource={drawings}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} Drawing Revisions`
          }}
        />
      </Card>
    </PageContainer>
  )
}

export default DrawingList
