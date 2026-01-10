import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, InputNumber, Space } from 'antd'
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { barBendingScheduleService } from '../../services/api/barBendingSchedule'
import { projectService } from '../../services/api/projects'

const { TextArea } = Input
const { Option } = Select

const BarBendingScheduleForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [projects, setProjects] = useState<any[]>([])
  const [panels, setPanels] = useState<any[]>([])

  useEffect(() => {
    fetchProjects()
    if (id) {
      fetchSchedule()
    }
  }, [id])

  const fetchProjects = async () => {
    try {
      const response = await projectService.getProjects({ limit: 100 })
      setProjects(response.projects || [])
    } catch (error) {
      message.error('Failed to fetch projects')
    }
  }

  const fetchSchedule = async () => {
    setLoading(true)
    try {
      const response = await barBendingScheduleService.getBarBendingSchedule(Number(id))
      const schedule = response.barBendingSchedule
      form.setFieldsValue({
        project_id: schedule.project_id,
        panel_number: schedule.panel_number,
        schedule_number: schedule.schedule_number,
        drawing_reference: schedule.drawing_reference,
        steel_quantity_kg: schedule.steel_quantity_kg,
        status: schedule.status,
      })
      if (schedule.project_id) {
        fetchPanels(schedule.project_id)
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch schedule')
    } finally {
      setLoading(false)
    }
  }

  const fetchPanels = async (projectId: number) => {
    try {
      const response = await barBendingScheduleService.getDrawingPanelsForProject(projectId)
      setPanels(response.panels || [])
    } catch (error) {
      console.error('Failed to fetch panels')
    }
  }

  const handleProjectChange = (projectId: number) => {
    form.setFieldsValue({ panel_number: undefined })
    fetchPanels(projectId)
  }

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      if (id) {
        await barBendingScheduleService.updateBarBendingSchedule(Number(id), values)
        message.success('Bar Bending Schedule updated successfully!')
      } else {
        await barBendingScheduleService.createBarBendingSchedule(values)
        message.success('Bar Bending Schedule created successfully!')
      }
      navigate('/operations/bar-bending')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save schedule')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="content-container">
      <Card
        title={id ? 'Edit Bar Bending Schedule' : 'Create Bar Bending Schedule'}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/operations/bar-bending')}>
            Back
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Project"
            name="project_id"
            rules={[{ required: true, message: 'Please select a project!' }]}
          >
            <Select
              placeholder="Select project"
              showSearch
              optionFilterProp="children"
              onChange={handleProjectChange}
              disabled={!!id}
            >
              {projects.map((project) => (
                <Option key={project.id} value={project.id}>
                  {project.project_code} - {project.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Panel Number"
            name="panel_number"
            tooltip="Select panel from drawing panels or enter manually"
          >
            <Select
              placeholder="Select panel or enter manually"
              showSearch
              allowClear
              optionFilterProp="children"
              mode={undefined}
            >
              {panels.map((panel) => (
                <Option key={panel.id} value={panel.panel_identifier}>
                  {panel.panel_identifier} {panel.drawing_code ? `(${panel.drawing_code})` : ''}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Schedule Number"
            name="schedule_number"
          >
            <Input placeholder="Enter schedule number" />
          </Form.Item>

          <Form.Item
            label="Drawing Reference"
            name="drawing_reference"
          >
            <Input placeholder="Enter drawing reference" />
          </Form.Item>

          <Form.Item
            label="Steel Quantity (Kg)"
            name="steel_quantity_kg"
            rules={[{ required: true, message: 'Please enter steel quantity!' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.01}
              placeholder="Enter steel quantity in Kg"
            />
          </Form.Item>

          {id && (
            <Form.Item
              label="Status"
              name="status"
            >
              <Select>
                <Option value="draft">Draft</Option>
                <Option value="approved">Approved</Option>
                <Option value="in_progress">In Progress</Option>
                <Option value="completed">Completed</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                {id ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => navigate('/operations/bar-bending')}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default BarBendingScheduleForm

