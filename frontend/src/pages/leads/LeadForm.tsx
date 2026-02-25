import { useState, useEffect, useRef } from 'react'
import { Form, Input, Button, Card, message, DatePicker, Select, Typography } from 'antd'
import {
  ContactsOutlined,
  PhoneOutlined,
  MailOutlined,
  FileTextOutlined,
  ProjectOutlined,
  UserOutlined,
  BankOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { leadService } from '../../services/api/leads'
import { projectService } from '../../services/api/projects'
import { clientService } from '../../services/api/clients'
import StateSelect from '../../components/common/StateSelect'
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
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

import { FileUpload } from '../../components/common/FileUpload'

const LeadForm = () => {
  // ... (keep component implementation same until the render part)

  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [clientGroups, setClientGroups] = useState<any[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(undefined)
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const clientSearchTimeout = useRef<NodeJS.Timeout>()
  const projectSearchTimeout = useRef<NodeJS.Timeout>()

  useEffect(() => {
    fetchClientGroups()
    fetchProjects()
    fetchClients()
    if (id) {
      fetchLead()
    }
  }, [id])

  const fetchClientGroups = async () => {
    try {
      const response = await clientService.getClientGroups()
      setClientGroups(response.groups || [])
    } catch (error) {
      console.error("Failed to fetch client groups", error)
    }
  }

  const fetchProjects = async (search = '') => {
    try {
      const response = await projectService.getProjects({
        search,
        limit: 50
      })
      setProjects(response.projects || [])
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const fetchClients = async (search = '', groupId = selectedGroupId) => {
    try {
      const params: any = { limit: 50, search }
      if (groupId) params.client_group_id = groupId

      const response = await clientService.getClients(params)
      setClients(response.clients || [])
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const handleClientSearch = (value: string) => {
    if (clientSearchTimeout.current) clearTimeout(clientSearchTimeout.current)
    clientSearchTimeout.current = setTimeout(() => {
      fetchClients(value, selectedGroupId)
    }, 500)
  }

  const handleProjectSearch = (value: string) => {
    if (projectSearchTimeout.current) clearTimeout(projectSearchTimeout.current)
    projectSearchTimeout.current = setTimeout(() => {
      fetchProjects(value)
    }, 500)
  }

  const handleGroupChange = (value: number) => {
    setSelectedGroupId(value)
    if (clientSearchTimeout.current) clearTimeout(clientSearchTimeout.current)
    form.setFieldsValue({ client_id: undefined })
    fetchClients('', value)
  }

  const fetchLead = async () => {
    try {
      const response = await leadService.getLead(Number(id))
      const lead = response.lead

      form.setFieldsValue({
        ...lead,
        enquiry_date: lead.enquiry_date ? dayjs(lead.enquiry_date) : undefined,
      })

      if (lead.client) {
        if (lead.client.client_group_id) {
          setSelectedGroupId(lead.client.client_group_id)
          form.setFieldsValue({ client_group_id: lead.client.client_group_id })
        }
        setClients(prev => {
          if (!prev.find(c => c.id === lead.client.id)) {
            return [lead.client, ...prev]
          }
          return prev
        })
      }

      if (lead.project) {
        setProjects(prev => {
          if (!prev.find(p => p.id === lead.project.id)) {
            return [lead.project, ...prev]
          }
          return prev
        })
      }

    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch lead')
    }
  }

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      const data = {
        ...values,
        enquiry_date: values.enquiry_date ? values.enquiry_date.format('YYYY-MM-DD') : undefined,
      }

      if (id) {
        await leadService.updateLead(Number(id), data)
        message.success('Lead updated successfully!')
      } else {
        await leadService.createLead(data)
        message.success('Lead created successfully!')
      }
      navigate('/sales/leads')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save lead')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer maxWidth={1400}>
      <PageHeader
        title={id ? 'Edit Lead' : 'Create New Lead'}
        subtitle={id ? 'Update lead information and status' : 'Add a new sales lead to the system'}
        icon={<ContactsOutlined />}
        gradient="primary"
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <div style={threeColumnGridStyle}>
          {/* Column 1: Contact Information */}
          <SectionCard title="Contact Information" icon={<UserOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Lead Title / Contact Name</span>}
              name="name"
              rules={[{ required: true, message: 'Please enter lead title or name!' }]}
            >
              <Input
                prefix={<UserOutlined style={prefixIconStyle} />}
                placeholder="e.g. Acme Warehouse Project / John Doe"
                size="large"
                style={largeInputStyle}
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Company Name</span>}
              name="company_name"
            >
              <Input
                prefix={<BankOutlined style={prefixIconStyle} />}
                placeholder="Enter company name"
                size="large"
                style={largeInputStyle}
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Phone</span>}
              name="phone"
            >
              <Input
                prefix={<PhoneOutlined style={prefixIconStyle} />}
                placeholder="Enter phone number"
                size="large"
                style={largeInputStyle}
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Email</span>}
              name="email"
              rules={[{ type: 'email', message: 'Please enter a valid email!' }]}
            >
              <Input
                prefix={<MailOutlined style={prefixIconStyle} />}
                placeholder="user@example.com"
                size="large"
                style={largeInputStyle}
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Address</span>}
              name="address"
            >
              <TextArea
                rows={3}
                placeholder="Enter address"
                style={largeInputStyle}
              />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Form.Item
                label={<span style={getLabelStyle()}>City</span>}
                name="city"
              >
                <Input placeholder="Enter city" size="large" style={largeInputStyle} />
              </Form.Item>

              <Form.Item
                label={<span style={getLabelStyle()}>State</span>}
                name="state"
              >
                <StateSelect
                  onChange={(val, code) => {
                    form.setFieldsValue({ state: val, state_code: code })
                  }}
                />
              </Form.Item>
              <Form.Item name="state_code" hidden>
                <Input />
              </Form.Item>
            </div>
          </SectionCard>

          {/* Column 2: Lead Details */}
          <SectionCard title="Lead Details" icon={<ProjectOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Client Group (Optional)</span>}
              name="client_group_id"
            >
              <Select
                placeholder="Select client group"
                onChange={(value) => handleGroupChange(value)}
                size="large"
                style={largeInputStyle}
                allowClear
              >
                {clientGroups.map(group => (
                  <Option key={group.id} value={group.id}>
                    {group.group_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Client (Optional)</span>}
              name="client_id"
              tooltip="Select an existing client. Type to search."
            >
              <Select
                placeholder="Select existing client"
                showSearch
                filterOption={false}
                onSearch={handleClientSearch}
                size="large"
                style={largeInputStyle}
                allowClear
              >
                {clients.map(client => (
                  <Option key={client.id} value={client.id}>
                    {client.company_name} ({client.client_code})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Project</span>}
              name="project_id"
              tooltip="Select project. Type to search."
            >
              <Select
                placeholder="Select project (Optional)"
                showSearch
                filterOption={false}
                onSearch={handleProjectSearch}
                size="large"
                style={largeInputStyle}
                allowClear
              >
                {projects.map(project => (
                  <Option key={project.id} value={project.id}>
                    {project.name} ({project.project_code})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Enquiry Date</span>}
              name="enquiry_date"
              rules={[{ required: true, message: 'Please select enquiry date!' }]}
            >
              <DatePicker
                style={{ width: '100%', ...largeInputStyle }}
                format="DD/MM/YYYY"
                size="large"
                placeholder="Select enquiry date"
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Source</span>}
              name="source"
            >
              <Select
                placeholder="Select source"
                size="large"
                style={largeInputStyle}
              >
                <Option value="website">🌐 Website</Option>
                <Option value="referral">👥 Referral</Option>
                <Option value="cold_call">📞 Cold Call</Option>
                <Option value="email">📧 Email</Option>
                <Option value="other">📋 Other</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Soil Report</span>}
              name="soil_report_url"
            >
              <FileUpload folder="leads/soil_reports" placeholder="Upload Soil Report" />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Layout Plan</span>}
              name="layout_url"
            >
              <FileUpload folder="leads/layouts" placeholder="Upload Layout Plan" />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Section Drawing</span>}
              name="section_url"
            >
              <FileUpload folder="leads/sections" placeholder="Upload Section Drawing" />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Status</span>}
              name="status"
              initialValue="new"
            >
              <Select
                placeholder="Select status"
                size="large"
                style={largeInputStyle}
              >
                <Option value="new">🆕 New</Option>
                <Option value="contacted">📞 Contacted</Option>
                <Option value="quoted">💰 Quoted</Option>
                <Option value="follow_up">🔄 Follow Up</Option>
                <Option value="converted">🎉 Converted</Option>
                <Option value="lost">❌ Lost</Option>
              </Select>
            </Form.Item>

            <InfoCard title="💡 Quick Tip">
              Update lead status regularly to track progress through the sales pipeline
            </InfoCard>
          </SectionCard>

          {/* Column 3: Additional Information */}
          <SectionCard title="Additional Information" icon={<FileTextOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Remarks</span>}
              name="remarks"
            >
              <TextArea
                rows={10}
                placeholder="Enter any additional notes or remarks about this lead..."
                style={largeInputStyle}
              />
            </Form.Item>

            <InfoCard title="📝 Note" gradient="subtle">
              Use the remarks section to track important conversations, requirements, or follow-up actions
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
                onClick={() => navigate('/sales/leads')}
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
                {id ? 'Update' : 'Create'} Lead
              </Button>
            </div>
          </div>
        </Card>
      </Form>
    </PageContainer>
  )
}

export default LeadForm
