import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, InputNumber, Typography, Divider, Modal, Switch } from 'antd'
import {
    TeamOutlined,
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    BankOutlined,
    FileTextOutlined,
    PlusOutlined,
    DeleteOutlined,
    ApartmentOutlined,
    IdcardOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
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
    prefixIconStyle,
} from '../../styles/styleUtils'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

const ClientForm = () => {
    const [loading, setLoading] = useState(false)
    const [clientGroups, setClientGroups] = useState<any[]>([])
    const [groupModalVisible, setGroupModalVisible] = useState(false)
    const [groupForm] = Form.useForm()
    const [form] = Form.useForm()
    const isGstRegistered = Form.useWatch('is_gst_registered', form)
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()

    useEffect(() => {
        fetchClientGroups()
        if (id) {
            fetchClient()
        }
    }, [id])

    const fetchClientGroups = async () => {
        try {
            const response = await clientService.getClientGroups()
            setClientGroups(response.groups || [])
        } catch (error: any) {
            console.error('Failed to fetch client groups:', error)
        }
    }

    const fetchClient = async () => {
        try {
            const response = await clientService.getClient(Number(id))
            const client = response.client
            form.setFieldsValue({
                ...client,
                contacts: client.contacts || []
            })
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch client')
        }
    }

    const handleAddNewGroup = () => {
        setGroupModalVisible(true)
        groupForm.resetFields()
    }

    const handleCreateGroup = async (values: any) => {
        try {
            const response = await clientService.createClientGroup(values)
            message.success('Client group created successfully!')
            setGroupModalVisible(false)
            groupForm.resetFields()

            // Refresh groups list
            await fetchClientGroups()

            // Auto-select the newly created group
            if (response.group && response.group.id) {
                form.setFieldsValue({ client_group_id: response.group.id })
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to create client group')
        }
    }

    const onFinish = async (values: any) => {
        setLoading(true)
        try {
            if (id) {
                await clientService.updateClient(Number(id), values)
                message.success('Client updated successfully!')
            } else {
                await clientService.createClient(values)
                message.success('Client created successfully!')
            }
            navigate('/sales/clients')
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to save client')
        } finally {
            setLoading(false)
        }
    }

    return (
        <PageContainer maxWidth={1600}>
            <PageHeader
                title={id ? 'Edit Client' : 'Add New Client'}
                subtitle={id ? 'Update client information and contact persons' : 'Create a new client record with multiple contacts'}
                icon={<TeamOutlined />}
            />

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
                initialValues={{
                    client_type: 'company',
                    status: 'active',
                    is_gst_registered: true,
                    contacts: []
                }}
            >
                <div style={threeColumnGridStyle}>
                    {/* Column 1: Basic Information */}
                    <SectionCard title="Basic Information" icon={<UserOutlined />}>
                        <Form.Item
                            label={<span style={getLabelStyle()}>Parent Company / Group</span>}
                            name="client_group_id"
                            tooltip="Select the parent company if this client belongs to a larger group (e.g., Rajhans Group, Adani Group)"
                        >
                            <Select
                                placeholder="Select parent company (Optional)"
                                size="large"
                                style={largeInputStyle}
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                filterOption={(input, option) => {
                                    const label = option?.label
                                    return typeof label === 'string' && label.toLowerCase().includes(input.toLowerCase())
                                }}
                                suffixIcon={<ApartmentOutlined style={prefixIconStyle} />}
                                popupRender={(menu) => (
                                    <>
                                        {menu}
                                        <Divider style={{ margin: '8px 0' }} />
                                        <Button
                                            type="link"
                                            icon={<PlusOutlined />}
                                            onClick={handleAddNewGroup}
                                            style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                color: '#1890ff',
                                                fontWeight: 500,
                                            }}
                                        >
                                            ➕ Add New Client Group
                                        </Button>
                                    </>
                                )}
                            >
                                {clientGroups.map((group: any) => {
                                    const typeEmojiMap: Record<string, string> = {
                                        corporate: '🏢',
                                        sme: '🏭',
                                        government: '🏛️',
                                        individual: '👤',
                                        retail: '🏪'
                                    }
                                    const typeEmoji = typeEmojiMap[group.group_type] || '🏢'

                                    const typeLabelMap: Record<string, string> = {
                                        corporate: 'Corporate',
                                        sme: 'SME',
                                        government: 'Government',
                                        individual: 'Individual',
                                        retail: 'Retail'
                                    }
                                    const typeLabel = typeLabelMap[group.group_type] || 'Corporate'

                                    return (
                                        <Option
                                            key={group.id}
                                            value={group.id}
                                            label={`${group.group_name} (${typeLabel})`}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>
                                                    {typeEmoji} {group.group_name}
                                                </span>
                                                <span style={{
                                                    fontSize: 12,
                                                    color: '#999',
                                                    marginLeft: 8,
                                                    padding: '2px 8px',
                                                    backgroundColor: '#f0f0f0',
                                                    borderRadius: 4
                                                }}>
                                                    {typeLabel}
                                                </span>
                                            </div>
                                        </Option>
                                    )
                                })}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Site / Company Name</span>}
                            name="company_name"
                            rules={[{ required: true, message: 'Please enter company/site name!' }]}
                            tooltip="Enter the specific site or company name (e.g., 'Rajhans - Surat Site', 'Rajhans - Mumbai Office')"
                        >
                            <Input
                                prefix={<TeamOutlined style={prefixIconStyle} />}
                                placeholder="e.g., Rajhans - Surat Site"
                                size="large"
                                style={largeInputStyle}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Client Type</span>}
                            name="client_type"
                        >
                            <Select size="large" style={largeInputStyle}>
                                <Option value="individual">👤 Individual</Option>
                                <Option value="company">🏢 Company</Option>
                                <Option value="government">🏛️ Government</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Status</span>}
                            name="status"
                        >
                            <Select size="large" style={largeInputStyle}>
                                <Option value="active">✅ Active</Option>
                                <Option value="inactive">⏸️ Inactive</Option>
                                <Option value="blocked">🚫 Blocked</Option>
                            </Select>
                        </Form.Item>

                        <InfoCard title="💡 About Client Groups">
                            Client Groups represent parent companies (like Rajhans, Adani). Each client under a group represents a specific site or location.
                        </InfoCard>
                    </SectionCard>

                    {/* Column 2: Address Information */}
                    <SectionCard title="Address Information" icon={<EnvironmentOutlined />}>
                        <Form.Item
                            label={<span style={getLabelStyle()}>Address</span>}
                            name="address"
                        >
                            <TextArea
                                rows={4}
                                placeholder="Enter complete address"
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
                            <StateSelect
                                onChange={(val, code) => {
                                    form.setFieldsValue({ state: val, state_code: code })
                                }}
                            />
                        </Form.Item>
                        <Form.Item name="state_code" hidden /> {/* Hidden field to store state code */}

                        <Form.Item
                            label={<span style={getLabelStyle()}>Pincode</span>}
                            name="pincode"
                        >
                            <Input
                                placeholder="Enter pincode"
                                size="large"
                                style={largeInputStyle}
                                maxLength={6}
                            />
                        </Form.Item>
                    </SectionCard>

                    {/* Column 3: Financial & Tax Information */}
                    <SectionCard title="Financial & Tax Information" icon={<BankOutlined />}>
                        <Form.Item
                            label={<span style={getLabelStyle()}>Is GST Registered?</span>}
                            name="is_gst_registered"
                            valuePropName="checked"
                        >
                            <Switch
                                checkedChildren="Yes"
                                unCheckedChildren="No"
                                onChange={(checked) => {
                                    if (!checked) {
                                        form.setFieldsValue({ gstin: undefined })
                                    }
                                }}
                            />
                        </Form.Item>

                        {isGstRegistered && (
                            <Form.Item
                                label={<span style={getLabelStyle()}>GSTIN</span>}
                                name="gstin"
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
                                />
                            </Form.Item>
                        )}

                        <Form.Item
                            label={<span style={getLabelStyle()}>PAN</span>}
                            name="pan"
                            rules={[{
                                pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                                message: 'Invalid PAN Format'
                            }]}
                        >
                            <Input
                                prefix={<FileTextOutlined style={prefixIconStyle} />}
                                placeholder="ABCDE1234F"
                                size="large"
                                style={largeInputStyle}
                                maxLength={10}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Credit Limit (₹)</span>}
                            name="credit_limit"
                        >
                            <InputNumber
                                prefix="₹"
                                style={{ width: '100%', ...largeInputStyle }}
                                size="large"
                                placeholder="0.00"
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value!.replace(/\₹\s?|(,*)/g, '') as any}
                                min={0}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Payment Terms</span>}
                            name="payment_terms"
                        >
                            <TextArea
                                rows={3}
                                placeholder="e.g., Net 30 days, 50% advance..."
                                style={largeInputStyle}
                            />
                        </Form.Item>

                        <InfoCard title="💡 Quick Tip">
                            Ensure GSTIN and PAN are accurate for invoice generation and tax compliance
                        </InfoCard>
                    </SectionCard>
                </div>

                {/* Contact Persons Section - Full Width */}
                <Card
                    style={{
                        marginTop: 24,
                        borderRadius: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        border: '1px solid #e8e8e8'
                    }}
                >
                    <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                            <IdcardOutlined style={{ marginRight: 8 }} />
                            Contact Persons
                        </Text>
                        <Text style={{ display: 'block', marginTop: 4, color: '#666', fontSize: 14 }}>
                            Add multiple contact persons for this client (e.g., Site Manager, Accounts Head, Decision Maker)
                        </Text>
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    <Form.List name="contacts">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }, index) => (
                                    <Card
                                        key={key}
                                        size="small"
                                        title={`Contact Person ${index + 1}`}
                                        extra={
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => remove(name)}
                                            >
                                                Remove
                                            </Button>
                                        }
                                        style={{
                                            marginBottom: 16,
                                            backgroundColor: '#fafafa',
                                            border: '1px solid #d9d9d9'
                                        }}
                                    >
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                                            <Form.Item
                                                {...restField}
                                                label={<span style={getLabelStyle()}>Contact Name</span>}
                                                name={[name, 'contact_name']}
                                                rules={[{ required: true, message: 'Contact name is required' }]}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Input
                                                    prefix={<UserOutlined style={prefixIconStyle} />}
                                                    placeholder="Enter contact person name"
                                                    size="large"
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                {...restField}
                                                label={<span style={getLabelStyle()}>Designation</span>}
                                                name={[name, 'designation']}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Input
                                                    prefix={<IdcardOutlined style={prefixIconStyle} />}
                                                    placeholder="e.g., Site Manager, CEO"
                                                    size="large"
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                {...restField}
                                                label={<span style={getLabelStyle()}>Email</span>}
                                                name={[name, 'email']}
                                                rules={[{ type: 'email', message: 'Invalid email format' }]}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Input
                                                    prefix={<MailOutlined style={prefixIconStyle} />}
                                                    placeholder="contact@example.com"
                                                    size="large"
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                {...restField}
                                                label={<span style={getLabelStyle()}>Phone</span>}
                                                name={[name, 'phone']}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Input
                                                    prefix={<PhoneOutlined style={prefixIconStyle} />}
                                                    placeholder="+91 98765 43210"
                                                    size="large"
                                                />
                                            </Form.Item>
                                        </div>
                                    </Card>
                                ))}

                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<PlusOutlined />}
                                    size="large"
                                    style={{
                                        height: 56,
                                        borderRadius: 8,
                                        borderWidth: 2,
                                        borderStyle: 'dashed',
                                        fontSize: 16
                                    }}
                                >
                                    Add Contact Person
                                </Button>
                            </>
                        )}
                    </Form.List>
                </Card>

                {/* Action Buttons */}
                <Card style={actionCardStyle}>
                    <div style={flexBetweenStyle}>
                        <Text style={{ color: '#666', fontSize: 14 }}>
                            All fields marked with <span style={{ color: '#ff4d4f' }}>*</span> are required
                        </Text>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Button
                                onClick={() => navigate('/sales/clients')}
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
                                {id ? 'Update Client' : 'Create Client'}
                            </Button>
                        </div>
                    </div>
                </Card>
            </Form>

            {/* Add New Client Group Modal */}
            <Modal
                title={
                    <span style={{ fontSize: 18, fontWeight: 600 }}>
                        <ApartmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        Add New Client Group
                    </span>
                }
                open={groupModalVisible}
                onCancel={() => {
                    setGroupModalVisible(false)
                    groupForm.resetFields()
                }}
                footer={null}
                width={550}
            >
                <Form
                    form={groupForm}
                    layout="vertical"
                    onFinish={handleCreateGroup}
                    style={{ marginTop: 16 }}
                >
                    <Form.Item
                        label={<span style={getLabelStyle()}>Group Type</span>}
                        name="group_type"
                        rules={[{ required: true, message: 'Please select group type!' }]}
                        tooltip="Select the category that best describes this company"
                    >
                        <Select
                            placeholder="Select group type"
                            size="large"
                            style={largeInputStyle}
                        >
                            <Option value="corporate">🏢 Corporate - Large companies</Option>
                            <Option value="sme">🏭 SME - Small & Medium Enterprises</Option>
                            <Option value="government">🏛️ Government - Government organizations</Option>
                            <Option value="individual">👤 Individual - Individual clients</Option>
                            <Option value="retail">🏪 Retail - Retail customers</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label={<span style={getLabelStyle()}>Company Name</span>}
                        name="group_name"
                        rules={[{ required: true, message: 'Please enter company name!' }]}
                        tooltip="Enter the parent company or organization name (e.g., 'Rajhans Infrastructure', 'Adani Group')"
                    >
                        <Input
                            prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                            placeholder="e.g., Rajhans Infrastructure, Adani Group"
                            size="large"
                            style={largeInputStyle}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={getLabelStyle()}>Description</span>}
                        name="description"
                        tooltip="Add any additional details about this company group"
                    >
                        <TextArea
                            rows={3}
                            placeholder="e.g., Large infrastructure and construction company based in Gujarat"
                            style={largeInputStyle}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <Button
                                onClick={() => {
                                    setGroupModalVisible(false)
                                    groupForm.resetFields()
                                }}
                                size="large"
                                style={getSecondaryButtonStyle()}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                style={getPrimaryButtonStyle()}
                            >
                                Create Group
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </PageContainer>
    )
}

export default ClientForm
