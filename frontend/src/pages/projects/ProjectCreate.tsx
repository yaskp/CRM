import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, DatePicker, InputNumber, Typography, Select, Switch } from 'antd'
import {
  ProjectOutlined,
  EnvironmentOutlined,
  BankOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { projectService } from '../../services/api/projects'
import { leadService } from '../../services/api/leads'
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

const { TextArea } = Input
const { Text } = Typography

const ProjectCreate = () => {
  const [loading, setLoading] = useState(false)
  const [leads, setLeads] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [clientGroups, setClientGroups] = useState<any[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(undefined)
  const [form] = Form.useForm()
  const isGstRegistered = Form.useWatch('is_gst_registered', form)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    fetchLeads()
    fetchClients()
    fetchClientGroups()
  }, [])

  useEffect(() => {
    fetchClients(selectedGroupId)
  }, [selectedGroupId])

  useEffect(() => {
    if (location.state) {
      const { name, location: loc, city, state, lead_id } = location.state
      form.setFieldsValue({
        name: name ? `${name} (Project)` : undefined,
        client_ho_address: loc,
        site_location: loc,
        site_city: city,
        site_state: state,
        lead_id: lead_id
      })
    }
  }, [location.state, form])

  const fetchLeads = async () => {
    try {
      // Fetch only unassigned leads
      const response = await leadService.getLeads({ project_id: 'null', limit: 100 })
      if (response.success) {
        setLeads(response.leads)
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    }
  }

  const fetchClients = async (groupId?: number) => {
    try {
      const params: any = { limit: 100 }
      if (groupId) params.client_group_id = groupId
      const response = await clientService.getClients(params)
      setClients(response.clients || [])
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const fetchClientGroups = async () => {
    try {
      const response = await clientService.getClientGroups()
      setClientGroups(response.groups || [])
    } catch (error) {
      console.error('Failed to fetch client groups:', error)
    }
  }

  const handleGroupChange = (groupId: number) => {
    setSelectedGroupId(groupId)
    form.setFieldsValue({ client_id: undefined })
  }

  const onLeadChange = (leadId: number) => {
    const selectedLead = leads.find(l => l.id === leadId)
    if (selectedLead) {
      form.setFieldsValue({
        name: selectedLead.name ? `${selectedLead.name} (Project)` : undefined,
        company_name: selectedLead.company_name,
        client_ho_address: selectedLead.address,
        site_location: selectedLead.address,
        site_city: selectedLead.city,
        site_state: selectedLead.state,
      })
    }
  }

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
      // Navigate to the newly created project or list? List is safer, or maybe details if we had ID.
      // Ideally we should get the ID back and go to details to create Work Order.
      // But verify createProject returns project object. It does.
      // navigate('/sales/projects') // Current
      // Let's stick to list for now as per current code, user can find it. 
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
        initialValues={{
          is_gst_registered: true
        }}
      >
        {/* Three Column Layout */}
        <div style={threeColumnGridStyle}>

          {/* Column 1: Basic Information */}
          <SectionCard title="Basic Information" icon={<EnvironmentOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Client</span>}
              name="client_id"
              tooltip="Select the client for this project"
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <Select
                  placeholder="Filter by Group"
                  style={{ width: '180px' }}
                  allowClear
                  onChange={handleGroupChange}
                  value={selectedGroupId}
                >
                  {clientGroups.map(group => (
                    <Select.Option key={group.id} value={group.id}>{group.group_name}</Select.Option>
                  ))}
                </Select>
                <Select
                  placeholder="Select client"
                  size="large"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  style={{ ...largeInputStyle, flex: 1 }}
                >
                  {clients.map(client => (
                    <Select.Option key={client.id} value={client.id}>
                      {client.company_name} ({client.client_code})
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Link Lead (Optional)</span>}
              name="lead_id"
              tooltip="Select a sales lead to pre-fill project details"
            >
              <Select
                placeholder="Select a lead to convert"
                size="large"
                allowClear
                onChange={onLeadChange}
                style={largeInputStyle}
                options={leads.map(lead => ({
                  label: `${lead.name} (${lead.company_name || 'No Company'})`,
                  value: lead.id
                }))}
              // If the lead from location.state isn't in the list (e.g. pagination limit), we might need to handle that, 
              // but usually it will be 'new' and thus in the 'null' list.
              />
            </Form.Item>

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
              name="site_location"
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
              name="site_city"
            >
              <Input
                placeholder="Enter city"
                size="large"
                style={largeInputStyle}
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>State</span>}
              name="site_state"
            >
              <StateSelect
                onChange={(val) => {
                  form.setFieldsValue({ site_state: val })
                }}
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
              label={<span style={getLabelStyle()}>Is Client GST Registered?</span>}
              name="is_gst_registered"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Yes"
                unCheckedChildren="No"
                onChange={(checked) => {
                  if (!checked) {
                    form.setFieldsValue({ client_gstin: undefined })
                  }
                }}
              />
            </Form.Item>

            {isGstRegistered && (
              <Form.Item
                label={<span style={getLabelStyle()}>Client GSTIN</span>}
                name="client_gstin"
                rules={[
                  { required: true, message: 'GSTIN is required for registered clients' },
                  {
                    pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                    message: 'Invalid GSTIN Format'
                  }
                ]}
              >
                <Input
                  prefix={<FileTextOutlined style={prefixIconStyle} />}
                  placeholder="27AABCU9603R1ZM"
                  size="large"
                  style={largeInputStyle}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    if (val.length >= 2) {
                      const code = val.substring(0, 2);
                      form.setFieldsValue({ site_state_code: code });
                    }
                  }}
                />
              </Form.Item>
            )}

            <Form.Item
              label={<span style={getLabelStyle()}>Site State Code</span>}
              name="site_state_code"
              rules={[{ required: true, message: 'Please select site state code' }]}
              tooltip="State where the construction site is located (used for GST calculation)"
            >
              <StateSelect
                onChange={(_, code) => {
                  form.setFieldsValue({ site_state_code: code })
                }}
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
                prefix="₹"
                style={{ width: '100%', ...largeInputStyle }}
                size="large"
                placeholder="0.00"
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
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
