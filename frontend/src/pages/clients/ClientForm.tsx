import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, InputNumber, Typography } from 'antd'
import {
    TeamOutlined,
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    BankOutlined,
    FileTextOutlined,
    WalletOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { clientService } from '../../services/api/clients'
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
    const [form] = Form.useForm()
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()

    useEffect(() => {
        if (id) {
            fetchClient()
        }
    }, [id])

    const fetchClient = async () => {
        try {
            const response = await clientService.getClient(Number(id))
            form.setFieldsValue(response.client)
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch client')
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
        <PageContainer>
            <PageHeader
                title={id ? 'Edit Client' : 'Add New Client'}
                subtitle={id ? 'Update client information' : 'Create a new client record'}
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
                }}
            >
                <div style={threeColumnGridStyle}>
                    {/* Column 1: Basic Information */}
                    <SectionCard title="Basic Information" icon={<UserOutlined />}>
                        <Form.Item
                            label={<span style={getLabelStyle()}>Company Name</span>}
                            name="company_name"
                            rules={[{ required: true, message: 'Please enter company name!' }]}
                        >
                            <Input
                                prefix={<TeamOutlined style={prefixIconStyle} />}
                                placeholder="Enter company name"
                                size="large"
                                style={largeInputStyle}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Contact Person</span>}
                            name="contact_person"
                        >
                            <Input
                                prefix={<UserOutlined style={prefixIconStyle} />}
                                placeholder="Enter contact person name"
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
                                placeholder="client@example.com"
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
                                placeholder="+91 98765 43210"
                                size="large"
                                style={largeInputStyle}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Client Type</span>}
                            name="client_type"
                        >
                            <Select size="large" style={largeInputStyle}>
                                <Option value="individual">Individual</Option>
                                <Option value="company">Company</Option>
                                <Option value="government">Government</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Status</span>}
                            name="status"
                        >
                            <Select size="large" style={largeInputStyle}>
                                <Option value="active">Active</Option>
                                <Option value="inactive">Inactive</Option>
                                <Option value="blocked">Blocked</Option>
                            </Select>
                        </Form.Item>
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
                            <Input
                                placeholder="Enter state"
                                size="large"
                                style={largeInputStyle}
                            />
                        </Form.Item>

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
                            label={<span style={getLabelStyle()}>GSTIN</span>}
                            name="gstin"
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
                                parser={value => value!.replace(/\₹\s?|(,*)/g, '')}
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
        </PageContainer>
    )
}

export default ClientForm
