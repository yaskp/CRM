import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Upload, Select, Space } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { drawingService } from '../../services/api/drawings'
import { projectService } from '../../services/api/projects'
import type { UploadFile } from 'antd/es/upload/interface'

const { Option } = Select

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

  const handleUpload = {
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
    <div className="content-container">
      <Card title="Upload Drawing">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Project"
            name="project_id"
            rules={[{ required: true, message: 'Please select a project!' }]}
          >
            <Select placeholder="Select project">
              {projects.map((project) => (
                <Option key={project.id} value={project.id}>
                  {project.project_code} - {project.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Drawing Type"
            name="drawing_type"
            rules={[{ required: true, message: 'Please select drawing type!' }]}
          >
            <Select placeholder="Select drawing type">
              <Option value="layout">Layout</Option>
              <Option value="section">Section</Option>
              <Option value="detail">Detail</Option>
              <Option value="as_built">As-Built</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Drawing File"
            rules={[{ required: true, message: 'Please upload a drawing file!' }]}
          >
            <Upload
              {...handleUpload}
              fileList={fileList}
              maxCount={1}
              accept=".pdf,.jpg,.jpeg,.png"
            >
              <Button icon={<UploadOutlined />}>Select File (PDF/Image)</Button>
            </Upload>
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={4} placeholder="Enter description" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Upload
              </Button>
              <Button onClick={() => navigate('/drawings')}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default DrawingForm

