import { useState } from 'react'
import { Form, Input, Button, Card, message, DatePicker, InputNumber, Typography } from 'antd'
import {
  ProjectOutlined,
  EnvironmentOutlined,
  BankOutlined,
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../../services/api/projects'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import {
  largeInputStyle,
  getLabelStyle,
  getPrimaryButtonStyle,
  getSecondaryButtonStyle,
  threeColumnGridStyle,
  flexBetweenStyle,
  actionCardStyle,
  prefixIconStyle
} from '../../styles/styleUtils'

const { TextArea } = Input
const { Text } = Typography

const ProjectCreate = () => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      const formattedValues = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
      }
      await projectService.createProject(formattedValues)
      message.success('Project created successfully!')
      navigate('/sales/projects')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Create New Project"
        subtitle="Fill in the details below to create a new construction project"
        icon={<ProjectOutlined />}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        {/* Three Column Layout */}
        <div style={threeColumnGridStyle}>

          {/* Column 1: Basic Information */}
          <SectionCard title="Basic Information" icon={<EnvironmentOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Project Name</span>}
              name="name"
              rules={[{ required: true, message: 'Please enter project name!' }]}
            >
              <Input
                prefix={<ProjectOutlined style={prefixIconStyle} />}
                placeholder="Enter project name"
                size="large"
                style={largeInputStyle}
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Location</span>}
              name="location"
            >
              <Input
                prefix={<EnvironmentOutlined style={prefixIconStyle} />}
                placeholder="Enter location"
                size="large"
                style={largeInputStyle}
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>City</span>}
              name="city"
            >
              <Input
                placeholder="Enter city"
                size="large"
                style={largeInputStyle}
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>State</span>}
              name="state"
            >
              <Input
                placeholder="Enter state"
                size="large"
                style={largeInputStyle}
              />
            </Form.Item>
          </SectionCard>

          {/* Column 2: Client & Compliance */}
          <SectionCard title="Client & Compliance" icon={<BankOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Client HO Address</span>}
              name="client_ho_address"
            >
              <TextArea
                rows={4}
                placeholder="Enter client head office address"
                style={largeInputStyle}
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Client GSTIN</span>}
              name="client_gstin"
              rules={[{
                pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                message: 'Invalid GSTIN Format'
              }]}
            >
              <Input
                prefix={<FileTextOutlined style={prefixIconStyle} />}
                placeholder="27AABCU9603R1ZM"
                size="large"
                style={largeInputStyle}
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>RERA Number</span>}
              name="rera_number"
            >
              <Input
                prefix={<FileTextOutlined style={prefixIconStyle} />}
                placeholder="Enter RERA registration no."
                size="large"
                style={largeInputStyle}
              />
            </Form.Item>
          </SectionCard>

          {/* Column 3: Project Details */}
          <SectionCard title="Project Details" icon={<CalendarOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Start Date</span>}
              name="start_date"
            >
              <DatePicker
                style={{ width: '100%', ...largeInputStyle }}
                size="large"
                placeholder="Select start date"
                format="DD/MM/YYYY"
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Estimated End Date</span>}
              name="end_date"
            >
              <DatePicker
                style={{ width: '100%', ...largeInputStyle }}
                size="large"
                placeholder="Select end date"
                format="DD/MM/YYYY"
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Contract Value</span>}
              name="contract_value"
            >
              <InputNumber
                prefix={<DollarOutlined style={prefixIconStyle} />}
                style={{ width: '100%', ...largeInputStyle }}
                size="large"
                placeholder="0.00"
                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value!.replace(/\₹\s?|(,*)/g, '')}
              />
            </Form.Item>

            <InfoCard title="💡 Quick Tip">
              Ensure all compliance documents are ready before project creation
            </InfoCard>
          </SectionCard>
        </div>

        {/* Action Buttons */}
        <Card style={actionCardStyle}>
          <div style={flexBetweenStyle}>
            <Text style={{ color: '#666', fontSize: 14 }}>
              All fields marked with <span style={{ color: '#ff4d4f' }}>*</span> are required
            </Text>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                onClick={() => navigate('/sales/projects')}
                size="large"
                style={getSecondaryButtonStyle()}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                style={getPrimaryButtonStyle()}
              >
                Create Project
              </Button>
            </div>
          </div>
        </Card>
      </Form>
    </PageContainer>
  )
}

export default ProjectCreate
