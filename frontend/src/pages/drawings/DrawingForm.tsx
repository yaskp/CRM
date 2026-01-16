import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Upload, Select, Space, Row, Col, Typography } from 'antd'
import {
  UploadOutlined,
  ArrowLeftOutlined,
  FilePptOutlined,
  ProjectOutlined,
  FileImageOutlined,
  CloudUploadOutlined,
  InboxOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  SaveOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { drawingService } from '../../services/api/drawings'
import { projectService } from '../../services/api/projects'
import type { UploadFile } from 'antd/es/upload/interface'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import {
  getPrimaryButtonStyle,
  getSecondaryButtonStyle,
  largeInputStyle,
  getLabelStyle,
  flexBetweenStyle,
  actionCardStyle,
  prefixIconStyle,
  twoColumnGridStyle
} from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Option } = Select
const { Dragger } = Upload
const { Text } = Typography

const DrawingForm = () => {
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [form] = Form.useForm()
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await projectService.getProjects({ limit: 100 })
      setProjects(response.projects || [])
    } catch (error) {
      console.error('Failed to fetch projects')
    }
  }

  const handleUploadProps = {
    beforeUpload: (file: File) => {
      const isPDF = file.type === 'application/pdf'
      const isImage = file.type.startsWith('image/')
      if (!isPDF && !isImage) {
        message.error('You can only upload PDF or image files!')
        return false
      }
      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        message.error('File must be smaller than 10MB!')
        return false
      }
      setFileList([file as UploadFile])
      return false // Prevent auto upload
    },
    onRemove: () => {
      setFileList([])
    },
  }

  const onFinish = async (values: any) => {
    if (fileList.length === 0) {
      message.error('Please upload a drawing file')
      return
    }

    setLoading(true)
    try {
      const file = fileList[0] as any
      await drawingService.uploadDrawing(
        {
          project_id: values.project_id,
          drawing_type: values.drawing_type,
          description: values.description,
        },
        file.originFileObj || file
      )
      message.success('Drawing uploaded successfully!')
      navigate('/drawings')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to upload drawing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer maxWidth={1000}>
      <PageHeader
        title="Upload Structural Drawing"
        subtitle="Securely store and share technical blueprints with project teams and sites"
        icon={<FilePptOutlined />}
      />

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div style={twoColumnGridStyle}>
          <SectionCard title="Categorization" icon={<FileTextOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Select Project</span>}
              name="project_id"
              rules={[{ required: true, message: 'Please select a project!' }]}
            >
              <Select
                placeholder="Which project is this for?"
                size="large"
                style={largeInputStyle}
                showSearch
                optionFilterProp="children"
                suffixIcon={<ProjectOutlined />}
              >
                {projects.map((project) => (
                  <Option key={project.id} value={project.id}>
                    {project.project_code} - {project.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Drawing Category</span>}
              name="drawing_type"
              rules={[{ required: true, message: 'Please select drawing type!' }]}
            >
              <Select
                placeholder="What type of drawing is this?"
                size="large"
                style={largeInputStyle}
                suffixIcon={<FileImageOutlined />}
              >
                <Option value="layout">🗺️ Site Layout</Option>
                <Option value="section">📐 Sectional View</Option>
                <Option value="detail">🔎 Technical Detail</Option>
                <Option value="as_built">🏗️ As-Built Drawing</Option>
                <Option value="other">📑 Other Documents</Option>
              </Select>
            </Form.Item>

            <Form.Item label={<span style={getLabelStyle()}>Revision Remarks</span>} name="description">
              <Input.TextArea rows={4} placeholder="Major changes or description for this revision..." style={largeInputStyle} />
            </Form.Item>
          </SectionCard>

          <SectionCard title="File Repository" icon={<CloudUploadOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Drawing File (PDF or Image)</span>}
              required
            >
              <Dragger
                {...handleUploadProps}
                fileList={fileList}
                maxCount={1}
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ padding: '20px', background: '#fff' }}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ color: theme.colors.primary.main }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: '16px', fontWeight: '500' }}>Click or drag blueprint to this area</p>
                <p className="ant-upload-hint">
                  Supports PDF, JPEG, or PNG. Max file size: 10MB.
                </p>
              </Dragger>
            </Form.Item>

            <InfoCard title="🔒 Secure Storage" style={{ marginTop: '20px' }}>
              All uploaded drawings are encrypted and versioned. Project members will receive notification upon upload.
            </InfoCard>
          </SectionCard>
        </div>

        <Card style={actionCardStyle}>
          <div style={flexBetweenStyle}>
            <Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: '8px' }} />
              Ensure the drawing code is clearly visible in the uploaded file.
            </Text>
            <Space size="middle">
              <Button
                onClick={() => navigate('/drawings')}
                size="large"
                style={getSecondaryButtonStyle()}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<CloudUploadOutlined />}
                size="large"
                style={getPrimaryButtonStyle()}
              >
                Verify & Upload Drawing
              </Button>
            </Space>
          </div>
        </Card>
      </Form>
    </PageContainer>
  )
}

export default DrawingForm
