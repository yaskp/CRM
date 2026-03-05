import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, DatePicker, InputNumber, Typography, Select, Spin, Row, Col, Space } from 'antd'
import {
    ProjectOutlined,
    EnvironmentOutlined,
    BankOutlined,
    CalendarOutlined,
    FileTextOutlined,
    EditOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
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
    actionCardStyle,
    prefixIconStyle
} from '../../styles/styleUtils'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Text } = Typography

const ProjectEdit = () => {
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [leads, setLeads] = useState<any[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [clientGroups, setClientGroups] = useState<any[]>([])
    const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(undefined)
    const [selectedLeadId, setSelectedLeadId] = useState<number | undefined>(undefined)
    const [projectData, setProjectData] = useState<any>(null)
    const [form] = Form.useForm()
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()

    useEffect(() => {
        fetchInitialData()
    }, [id])

    useEffect(() => {
        fetchClients(selectedGroupId)
    }, [selectedGroupId])

    const fetchInitialData = async () => {
        setFetching(true)
        try {
            if (!id) return;

            const [projectRes, leadsRes, clientsRes, groupsRes] = await Promise.all([
                projectService.getProject(Number(id)),
                leadService.getLeads({ project_id: 'null', limit: 100 }), // Unassigned leads
                clientService.getClients({ limit: 100 }),
                clientService.getClientGroups()
            ])

            const project = projectRes.project;

            // If project has a linked lead that is already assigned, fetch it specifically because the unassigned list won't have it
            let linkedLead = null;
            if (project.lead_id) {
                try {
                    const lRes = await leadService.getLead(project.lead_id);
                    linkedLead = lRes.lead;
                } catch (e) { console.error("Could not fetch linked lead", e) }
            }

            setLeads(linkedLead ? [linkedLead, ...leadsRes.leads] : leadsRes.leads)
            setClients(clientsRes.clients || [])
            setClientGroups(groupsRes.groups || [])

            // Set local state for locking
            setSelectedLeadId(project.lead_id)

            // Store project data for effect-based population
            setProjectData(project)

            // If project has client, fetch client details to get group
            if (project.client_id) {
                try {
                    const cRes = await clientService.getClient(project.client_id);
                    if (cRes.client && cRes.client.client_group_id) {
                        setSelectedGroupId(cRes.client.client_group_id);
                        await fetchClients(cRes.client.client_group_id);
                    }
                } catch (e) { console.error("Could not fetch client details for group", e) }
            }

        } catch (error: any) {
            console.error('Failed to fetch data:', error)
            message.error(error.response?.data?.message || 'Failed to load project details')
        } finally {
            setFetching(false)
        }
    }

    // Effect to populate form once fetching is complete and project data is available
    useEffect(() => {
        if (!fetching && projectData) {
            form.setFieldsValue({
                ...projectData,
                start_date: projectData.start_date ? dayjs(projectData.start_date) : null,
                end_date: (projectData.expected_end_date || projectData.end_date) ? dayjs(projectData.expected_end_date || projectData.end_date) : null,
                client_ho_address: projectData.client_ho_address || projectData.client?.address,
                site_location: projectData.site_location || projectData.location,
                site_city: projectData.site_city || projectData.city,
                site_state: projectData.site_state || projectData.state,
                site_state_code: projectData.site_state_code || projectData.site_state_code,
            })
        }
    }, [fetching, projectData, form])

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

    const handleGroupChange = (groupId: number) => {
        setSelectedGroupId(groupId)
        form.setFieldsValue({ client_id: undefined })
    }

    const onLeadChange = async (leadId: number) => {
        setSelectedLeadId(leadId) // Update lock state on change
        const selectedLead = leads.find(l => l.id === leadId)
        if (selectedLead) {
            // Check if we need to fetch more details (like quotations/client)
            let fullLead = selectedLead;
            try {
                // Fetch full lead details to ensure we have latest quotes/client info
                const response = await leadService.getLead(leadId);
                if (response.lead) fullLead = response.lead;
            } catch (e) { console.warn("Failed to fetch full lead details", e); }

            const updates: any = {
                name: form.getFieldValue('name') || (fullLead.name ? `${fullLead.name} (Project)` : undefined),
                company_name: form.getFieldValue('company_name') || fullLead.company_name,
                client_ho_address: form.getFieldValue('client_ho_address') || fullLead.address,
                site_location: form.getFieldValue('site_location') || fullLead.address,
                site_city: form.getFieldValue('site_city') || fullLead.city,
                site_state: form.getFieldValue('site_state') || fullLead.state,
                client_id: fullLead.client_id || undefined,
                client_contact_person: fullLead.name,
                client_email: fullLead.email,
                client_phone: fullLead.phone
            };

            // If lead has an approved/accepted quotation, pre-fill contract value
            if (fullLead.quotations && fullLead.quotations.length > 0) {
                const winningQuote = fullLead.quotations.find((q: any) =>
                    ['approved', 'accepted_by_party'].includes(q.status)
                );

                if (winningQuote) {
                    updates.contract_value = winningQuote.final_amount;
                }
            }

            form.setFieldsValue(updates)
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
            await projectService.updateProject(Number(id), formattedValues)
            message.success('Project updated successfully!')
            navigate(`/sales/projects/${id}`)
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to update project')
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return <PageContainer><Spin size="large" style={{ display: 'block', margin: '100px auto' }} /></PageContainer>
    }

    return (
        <PageContainer>
            <PageHeader
                title="Edit Project"
                subtitle={`Editing project details`}
                icon={<ProjectOutlined />}
            />

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
            >
                <Row gutter={[16, 16]}>
                    {/* Column 1: Basic Information */}
                    <Col xs={24} lg={8}>
                        <SectionCard title="Basic Information" icon={<EnvironmentOutlined />}>
                            <Form.Item
                                label={<span style={getLabelStyle()}>Client</span>}
                                tooltip="Select the client for this project"
                            >
                                <Row gutter={[8, 8]}>
                                    <Col xs={24} sm={10}>
                                        <Select
                                            placeholder="Filter by Group"
                                            style={{ width: '100%' }}
                                            allowClear
                                            onChange={handleGroupChange}
                                            value={selectedGroupId}
                                        >
                                            {clientGroups.map(group => (
                                                <Select.Option key={group.id} value={group.id}>{group.group_name}</Select.Option>
                                            ))}
                                        </Select>
                                    </Col>
                                    <Col xs={24} sm={14}>
                                        <Form.Item name="client_id" noStyle>
                                            <Select
                                                placeholder="Select client"
                                                size="large"
                                                allowClear
                                                showSearch
                                                optionFilterProp="children"
                                                style={{ ...largeInputStyle, width: '100%' }}
                                            >
                                                {clients.map(client => (
                                                    <Select.Option key={client.id} value={client.id}>
                                                        {client.company_name} ({client.client_code})
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    {form.getFieldValue('client_id') && (
                                        <Col xs={24}>
                                            <Button
                                                icon={<EditOutlined />}
                                                onClick={() => navigate(`/sales/clients/${form.getFieldValue('client_id')}/edit`)}
                                                title="Edit Client Details"
                                                block
                                            >
                                                Edit Client Details
                                            </Button>
                                        </Col>
                                    )}
                                </Row>
                            </Form.Item>

                            {/* Read-Only Quotation Info if available */}
                            {(() => {
                                const lead = leads.find(l => l.id === selectedLeadId);
                                // Check for approved quote
                                const approvedQuote = lead?.quotations?.find((q: any) =>
                                    ['approved', 'accepted_by_party'].includes(q.status)
                                );

                                if (approvedQuote) {
                                    return (
                                        <Form.Item label={<span style={getLabelStyle()}>Source Quotation</span>}>
                                            <Input
                                                prefix={<FileTextOutlined style={prefixIconStyle} />}
                                                value={`${approvedQuote.quotation_number} • ₹ ${Number(approvedQuote.final_amount).toLocaleString()}`}
                                                disabled
                                                style={{ ...largeInputStyle, color: '#555', cursor: 'default', backgroundColor: '#f5f5f5' }}
                                            />
                                        </Form.Item>
                                    )
                                }
                                return null;
                            })()}

                            <Form.Item
                                label={<span style={getLabelStyle()}>Linked Lead</span>}
                                name="lead_id"
                                tooltip="Source Lead for this project"
                            >
                                <Select
                                    placeholder="Select a lead to convert"
                                    size="large"
                                    allowClear
                                    onChange={onLeadChange}
                                    disabled={!!selectedLeadId} // Lock if assigned
                                    style={largeInputStyle}
                                    options={leads.map(lead => ({
                                        label: `${lead.name} (${lead.company_name || 'No Company'})`,
                                        value: lead.id
                                    }))}
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
                    </Col>

                    {/* Column 2: Client & Compliance */}
                    <Col xs={24} lg={8}>
                        <SectionCard title="Client & Compliance" icon={<BankOutlined />}>
                            <Form.Item
                                label={<span style={getLabelStyle()}>Client HO Address</span>}
                                name="client_ho_address"
                            >
                                <TextArea
                                    rows={2}
                                    placeholder="Enter client head office address"
                                    style={largeInputStyle}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span style={getLabelStyle()}>Contact Person Name</span>}
                                name="client_contact_person"
                            >
                                <Input
                                    placeholder="Enter contact person name"
                                    size="large"
                                    style={largeInputStyle}
                                />
                            </Form.Item>

                            <Row gutter={[12, 12]}>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label={<span style={getLabelStyle()}>Contact Email</span>}
                                        name="client_email"
                                    >
                                        <Input
                                            placeholder="Enter email"
                                            size="large"
                                            style={largeInputStyle}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label={<span style={getLabelStyle()}>Contact Phone</span>}
                                        name="client_phone"
                                    >
                                        <Input
                                            placeholder="Enter phone"
                                            size="large"
                                            style={largeInputStyle}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

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
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase();
                                        if (val.length >= 2) {
                                            const code = val.substring(0, 2);
                                            form.setFieldsValue({ site_state_code: code });
                                        }
                                    }}
                                />
                            </Form.Item>

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
                    </Col>

                    {/* Column 3: Project Details */}
                    <Col xs={24} lg={8}>
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
                                help={!!selectedLeadId ? "Synced from Quotation (Read-only)" : undefined}
                            >
                                <InputNumber
                                    prefix="₹"
                                    style={{ width: '100%', ...largeInputStyle }}
                                    size="large"
                                    placeholder="0.00"
                                    disabled={!!selectedLeadId}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value!.replace(/\₹\s?|(,*)/g, '')}
                                />
                            </Form.Item>

                            <InfoCard title="💡 Quick Tip">
                                Updating project details here will reflect across all linked modules.
                            </InfoCard>
                        </SectionCard>
                    </Col>
                </Row>

                {/* Action Buttons */}
                <Card style={actionCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                        <Text style={{ color: '#666', fontSize: 14 }}>
                            All fields marked with <span style={{ color: '#ff4d4f' }}>*</span> are required
                        </Text>
                        <Space size="middle" wrap>
                            <Button
                                onClick={() => navigate(`/sales/projects/${id}`)}
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
                                Update Project
                            </Button>
                        </Space>
                    </div>
                </Card>
            </Form>
        </PageContainer>
    )
}

export default ProjectEdit
