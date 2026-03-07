import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, InputNumber, Space, Row, Col, Typography } from 'antd'
import {
  SaveOutlined,
  DeploymentUnitOutlined,
  ProjectOutlined,
  FileTextOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  BlockOutlined,
  TagOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { barBendingScheduleService } from '../../services/api/barBendingSchedule'
import { projectService } from '../../services/api/projects'
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
const { Text } = Typography

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
    <PageContainer maxWidth={1000}>
      <PageHeader
        title={id ? 'Edit BBS Record' : 'Create Bar Bending Schedule'}
        subtitle={id ? `Updating Schedule: ${form.getFieldValue('schedule_number') || id}` : 'Define reinforcement details and steel requirements for project panels'}
        icon={<DeploymentUnitOutlined />}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <div style={twoColumnGridStyle}>
          <SectionCard title="Reference & Location" icon={<BlockOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Assigned Project</span>}
              name="project_id"
              rules={[{ required: true, message: 'Please select a project!' }]}
            >
              <Select
                placeholder="Select project"
                showSearch
                optionFilterProp="children"
                onChange={handleProjectChange}
                disabled={!!id}
                size="large"
                style={largeInputStyle}
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
              label={<span style={getLabelStyle()}>Panel Selection</span>}
              name="panel_number"
              tooltip="Select from pre-defined drawing panels or type a new identifier"
            >
              <Select
                placeholder="Panel Number"
                showSearch
                allowClear
                size="large"
                style={largeInputStyle}
                suffixIcon={<TagOutlined />}
              >
                {panels.map((panel) => (
                  <Option key={panel.id} value={panel.panel_identifier}>
                    {panel.panel_identifier} {panel.drawing_code ? `(${panel.drawing_code})` : ''}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </SectionCard>

          <SectionCard title="Scheduling Details" icon={<FileTextOutlined />}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={<span style={getLabelStyle()}>Schedule Number</span>}
                  name="schedule_number"
                >
                  <Input placeholder="e.g., BBS-001" size="large" style={largeInputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span style={getLabelStyle()}>Drawing Ref.</span>}
                  name="drawing_reference"
                >
                  <Input placeholder="e.g., DWG/STR/01" size="large" style={largeInputStyle} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label={<span style={getLabelStyle()}>Steel Quantity (Kg)</span>}
              name="steel_quantity_kg"
              rules={[{ required: true, message: 'Please enter steel quantity!' }]}
            >
              <InputNumber
                style={{ width: '100%', ...largeInputStyle }}
                min={0}
                step={0.01}
                size="large"
                placeholder="0.00"
                prefix={<BarChartOutlined style={prefixIconStyle} />}
              />
            </Form.Item>

            <InfoCard title="💡 Smart Tip">
              Accurate BBS entries directly impact material requisition planning and reduce site waste.
            </InfoCard>
          </SectionCard>
        </div>

        {id && (
          <div style={{ marginTop: theme.spacing.lg }}>
            <SectionCard title="Lifecycle Management" icon={<DeploymentUnitOutlined />}>
              <Form.Item
                label={<span style={getLabelStyle()}>Work Status</span>}
                name="status"
              >
                <Select size="large" style={largeInputStyle}>
                  <Option value="draft">⏳ Draft / Preparation</Option>
                  <Option value="approved">✅ Approved for Production</Option>
                  <Option value="in_progress">🏗️ Cutting & Bending</Option>
                  <Option value="completed">🏆 Fabrication Completed</Option>
                </Select>
              </Form.Item>
            </SectionCard>
          </div>
        )}

        <Card style={actionCardStyle}>
          <div style={flexBetweenStyle}>
            <Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: '8px' }} />
              Once approved, steel weights are locked for requisition tracking.
            </Text>
            <Space size="middle">
              <Button
                onClick={() => navigate('/operations/bar-bending')}
                size="large"
                style={getSecondaryButtonStyle()}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
                style={getPrimaryButtonStyle()}
              >
                {id ? 'Update BBS' : 'Save Schedule'}
              </Button>
            </Space>
          </div>
        </Card>
      </Form>
    </PageContainer>
  )
}

export default BarBendingScheduleForm
