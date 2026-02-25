import { useState, useEffect } from 'react'
import { Form, Input, Select, Button, Card, message, Switch, Typography, Modal, Divider } from 'antd'
import {
    ShopOutlined,
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    EnvironmentOutlined,
    BankOutlined,
    SafetyOutlined,
    IdcardOutlined,
    PlusOutlined,
    DeleteOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { vendorService } from '../../services/api/vendors'
import StateSelect from '../../components/common/StateSelect'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import { largeInputStyle, getLabelStyle, getPrimaryButtonStyle, getSecondaryButtonStyle, flexBetweenStyle, actionCardStyle, prefixIconStyle, twoColumnGridStyle } from '../../styles/styleUtils'

const { Option } = Select
const { TextArea } = Input
const { Text } = Typography

const VendorForm = () => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [gstApplicable, setGstApplicable] = useState(false)
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = !!id

    useEffect(() => {
        if (isEdit) {
            fetchVendor()
        }
    }, [id])

    const fetchVendor = async () => {
        try {
            const response = await vendorService.getVendorById(Number(id))
            const vendorData = response.vendor
            // Ensure state and city are correctly set (handling nulls)
            form.setFieldsValue({
                ...vendorData,
                state: vendorData.state || undefined,
                city: vendorData.city || undefined,
                state_code: vendorData.state_code || undefined,
                contacts: vendorData.contacts || [],
                is_msme: !!vendorData.is_msme,
                msme_number: vendorData.msme_number || undefined,
                msme_category: vendorData.msme_category || undefined
            })
            setGstApplicable(!!vendorData.gst_number)

            // Force update for StateSelect if needed (though form.setFieldsValue should handle it)
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch vendor')
        }
    }

    const onFinish = async (values: any) => {
        Modal.confirm({
            title: isEdit ? 'Confirm Update' : 'Confirm Creation',
            content: `Are you sure you want to ${isEdit ? 'update' : 'create'} this vendor?`,
            okText: 'Yes, Proceed',
            cancelText: 'Cancel',
            onOk: async () => {
                setLoading(true)
                try {
                    const payload = {
                        ...values,
                        gst_number: gstApplicable ? values.gst_number : null
                    }

                    if (isEdit) {
                        await vendorService.updateVendor(Number(id), payload)
                        message.success('Vendor updated successfully')
                    } else {
                        await vendorService.createVendor(payload)
                        message.success('Vendor created successfully')
                    }
                    navigate('/master/vendors')
                } catch (error: any) {
                    message.error(error.response?.data?.message || 'Failed to save vendor')
                } finally {
                    setLoading(false)
                }
            }
        })
    }

    const vendorTypes = [
        { value: 'steel_contractor', label: '🔩 Steel Contractor' },
        { value: 'concrete_contractor', label: '🏗️ Concrete Contractor' },
        { value: 'rig_vendor', label: '⚙️ Rig Vendor' },
        { value: 'crane_vendor', label: '🏗️ Crane Vendor' },
        { value: 'jcb_vendor', label: '🚜 JCB Vendor' },
        { value: 'other', label: '📦 Other' },
    ]

    return (
        <PageContainer maxWidth={1200}>
            <PageHeader
                title={isEdit ? 'Edit Vendor' : 'Add New Vendor'}
                subtitle={isEdit ? 'Update vendor information' : 'Register a new vendor or contractor'}
                icon={<ShopOutlined />}
            />

            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ is_active: true }}>
                <div style={twoColumnGridStyle}>
                    <SectionCard title="Basic Information" icon={<ShopOutlined />}>
                        <Form.Item
                            label={<span style={getLabelStyle()}>Vendor Name</span>}
                            name="name"
                            rules={[{ required: true, message: 'Please enter vendor name' }]}
                        >
                            <Input
                                prefix={<ShopOutlined style={prefixIconStyle} />}
                                placeholder="Enter vendor/company name"
                                size="large"
                                style={largeInputStyle}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Vendor Type</span>}
                            name="vendor_type"
                            rules={[{ required: true, message: 'Please select vendor type' }]}
                        >
                            <Select
                                placeholder="Select vendor type"
                                size="large"
                                style={largeInputStyle}
                            >
                                {vendorTypes.map(type => (
                                    <Option key={type.value} value={type.value}>{type.label}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Status</span>}
                            name="is_active"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                        </Form.Item>

                        <InfoCard title="💡 Vendor Type">
                            Select the primary service or material this vendor provides.
                        </InfoCard>
                    </SectionCard>

                    <SectionCard title="Address Details" icon={<EnvironmentOutlined />}>
                        <Form.Item
                            label={<span style={getLabelStyle()}>Address</span>}
                            name="address"
                        >
                            <TextArea
                                rows={3}
                                placeholder="Enter complete address"
                                style={largeInputStyle}
                            />
                        </Form.Item>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 16 }}>
                            <Form.Item
                                label={<span style={getLabelStyle()}>City</span>}
                                name="city"
                                style={{ marginBottom: 0 }}
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
                                style={{ marginBottom: 0 }}
                            >
                                <StateSelect
                                    onChange={(val, code) => {
                                        form.setFieldsValue({ state: val, state_code: code })
                                    }}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span style={getLabelStyle()}>PIN Code</span>}
                                name="pincode"
                                rules={[
                                    { pattern: /^[0-9]{6}$/, message: 'Please enter valid 6-digit PIN code' }
                                ]}
                                style={{ marginBottom: 0 }}
                            >
                                <Input
                                    placeholder="Enter 6-digit PIN code"
                                    size="large"
                                    style={largeInputStyle}
                                    maxLength={6}
                                />
                            </Form.Item>
                        </div>
                        <Form.Item name="state_code" hidden />
                    </SectionCard>
                </div>

                <SectionCard title="Tax & Compliance" icon={<BankOutlined />}>
                    <div style={twoColumnGridStyle}>
                        <Form.Item
                            label={<span style={getLabelStyle()}>GST Registered?</span>}
                        >
                            <Switch
                                checked={gstApplicable}
                                onChange={setGstApplicable}
                                checkedChildren="Yes"
                                unCheckedChildren="No"
                            />
                        </Form.Item>

                        {gstApplicable && (
                            <Form.Item
                                label={<span style={getLabelStyle()}>GST Number</span>}
                                name="gst_number"
                                rules={[
                                    { required: true, message: 'GST Number is required' },
                                    { pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: 'Invalid GST format' }
                                ]}
                            >
                                <Input
                                    prefix={<SafetyOutlined style={prefixIconStyle} />}
                                    placeholder="e.g., 27AAAAA0000A1Z5"
                                    size="large"
                                    style={{ textTransform: 'uppercase', ...largeInputStyle }}
                                    maxLength={15}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase();
                                        if (val.length >= 2) {
                                            const code = val.substring(0, 2);
                                            form.setFieldsValue({ state_code: code });
                                        }
                                    }}
                                />
                            </Form.Item>
                        )}

                        <Form.Item
                            label={<span style={getLabelStyle()}>PAN Number</span>}
                            name="pan_number"
                            rules={[
                                { pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Invalid PAN format' }
                            ]}
                        >
                            <Input
                                prefix={<BankOutlined style={prefixIconStyle} />}
                                placeholder="e.g., AAAAA0000A"
                                size="large"
                                style={{ textTransform: 'uppercase', ...largeInputStyle }}
                                maxLength={10}
                            />
                        </Form.Item>
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Form.Item
                            name="is_msme"
                            valuePropName="checked"
                            noStyle
                        >
                            <Switch checkedChildren="Yes" unCheckedChildren="No" />
                        </Form.Item>
                        <Text strong>Is MSME Registered?</Text>
                    </div>

                    <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.is_msme !== currentValues.is_msme}>
                        {({ getFieldValue }) =>
                            getFieldValue('is_msme') ? (
                                <div style={twoColumnGridStyle}>
                                    <Form.Item
                                        label={<span style={getLabelStyle()}>MSME Number</span>}
                                        name="msme_number"
                                        rules={[{ required: true, message: 'Please enter MSME number' }]}
                                    >
                                        <Input
                                            prefix={<SafetyOutlined style={prefixIconStyle} />}
                                            placeholder="Enter MSME/Udyam number"
                                            size="large"
                                            style={largeInputStyle}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label={<span style={getLabelStyle()}>MSME Category</span>}
                                        name="msme_category"
                                        rules={[{ required: true, message: 'Please select MSME category' }]}
                                    >
                                        <Select
                                            placeholder="Select category"
                                            size="large"
                                            style={largeInputStyle}
                                        >
                                            <Option value="Micro">Micro</Option>
                                            <Option value="Small">Small</Option>
                                            <Option value="Medium">Medium</Option>
                                        </Select>
                                    </Form.Item>
                                </div>
                            ) : null
                        }
                    </Form.Item>

                    <InfoCard title="📋 Tax & MSME Information">
                        GST format: 2 digits + 5 letters + 4 digits + 1 letter + 1 digit/letter + Z + 1 digit/letter (15 chars)
                        <br />
                        PAN format: 5 letters + 4 digits + 1 letter (10 chars)
                    </InfoCard>
                </SectionCard>

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
                            Add multiple contact persons for this vendor (e.g., Site Manager, Accounts Head, Decision Maker)
                        </Text>
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    <Form.List name="contacts">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map((field, index) => (
                                    <Card
                                        key={field.key}
                                        size="small"
                                        title={`Contact Person ${index + 1}`}
                                        extra={
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => remove(field.name)}
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
                                                {...field}
                                                label={<span style={getLabelStyle()}>Contact Name</span>}
                                                name={[field.name, 'contact_name']}
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
                                                {...field}
                                                label={<span style={getLabelStyle()}>Designation</span>}
                                                name={[field.name, 'designation']}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Input
                                                    prefix={<IdcardOutlined style={prefixIconStyle} />}
                                                    placeholder="e.g., Site Manager, CEO"
                                                    size="large"
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                {...field}
                                                label={<span style={getLabelStyle()}>Email</span>}
                                                name={[field.name, 'email']}
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
                                                {...field}
                                                label={<span style={getLabelStyle()}>Phone</span>}
                                                name={[field.name, 'phone']}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Input
                                                    prefix={<PhoneOutlined style={prefixIconStyle} />}
                                                    placeholder="+91 98765 43210"
                                                    size="large"
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                {...field}
                                                label={<span style={getLabelStyle()}>Aadhar Number (Optional)</span>}
                                                name={[field.name, 'aadhar_number']}
                                                rules={[
                                                    { pattern: /^[0-9]{12}$/, message: 'Must be exactly 12 digits' }
                                                ]}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Input
                                                    prefix={<IdcardOutlined style={prefixIconStyle} />}
                                                    placeholder="XXXX XXXX XXXX"
                                                    size="large"
                                                    maxLength={12}
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

                <SectionCard title="Banking Details" icon={<BankOutlined />}>
                    <div style={twoColumnGridStyle}>
                        <Form.Item
                            label={<span style={getLabelStyle()}>Bank Name</span>}
                            name="bank_name"
                        >
                            <Input
                                placeholder="Enter bank name"
                                size="large"
                                style={largeInputStyle}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Account Number</span>}
                            name="account_number"
                        >
                            <Input
                                placeholder="Enter account number"
                                size="large"
                                style={largeInputStyle}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>IFSC Code</span>}
                            name="ifsc_code"
                            rules={[
                                { pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: 'Invalid IFSC format' }
                            ]}
                        >
                            <Input
                                placeholder="e.g., SBIN0001234"
                                size="large"
                                style={{ textTransform: 'uppercase', ...largeInputStyle }}
                                maxLength={11}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Branch</span>}
                            name="branch"
                        >
                            <Input
                                placeholder="Enter branch name"
                                size="large"
                                style={largeInputStyle}
                            />
                        </Form.Item>
                    </div>
                </SectionCard>

                <Card style={actionCardStyle}>
                    <div style={flexBetweenStyle}>
                        <Text style={{ color: '#666', fontSize: 14 }}>
                            All fields marked with <span style={{ color: '#ff4d4f' }}>*</span> are required
                        </Text>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Button
                                onClick={() => navigate('/master/vendors')}
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
                                {isEdit ? 'Update' : 'Create'} Vendor
                            </Button>
                        </div>
                    </div>
                </Card>
            </Form>
        </PageContainer>
    )
}

export default VendorForm
