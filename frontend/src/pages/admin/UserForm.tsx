import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, Checkbox, Typography, Row, Col } from 'antd'
import {
    UserOutlined,
    MailOutlined,
    TeamOutlined,
    LockOutlined,
    SafetyOutlined,
    PhoneOutlined,
    EnvironmentOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { userService } from '../../services/api/users'
import { roleService } from '../../services/api/roles'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import {
    largeInputStyle,
    getLabelStyle,
    getPrimaryButtonStyle,
    getSecondaryButtonStyle,
    flexBetweenStyle,
    actionCardStyle,
    prefixIconStyle
} from '../../styles/styleUtils'

const { Option } = Select
const { Text } = Typography

const UserForm = () => {
    const [loading, setLoading] = useState(false)
    const [roles, setRoles] = useState<any[]>([])
    const [form] = Form.useForm()
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = !!id

    useEffect(() => {
        fetchRoles()
        if (isEdit) {
            fetchUser()
        }
    }, [id])

    const fetchRoles = async () => {
        try {
            const response = await roleService.getRoles()
            setRoles(response.roles || [])
        } catch (error) {
            console.error('Failed to fetch roles')
        }
    }

    const fetchUser = async () => {
        try {
            const response = await userService.getUser(Number(id))
            const user = response.user
            form.setFieldsValue({
                ...user,
                role_ids: user.roles?.map((r: any) => r.id) || [],
            })
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch user')
        }
    }

    const onFinish = async (values: any) => {
        setLoading(true)
        try {
            if (isEdit) {
                await userService.updateUser(Number(id), values)
                message.success('User updated successfully')
            } else {
                await userService.createUser(values)
                message.success('User created successfully')
            }
            navigate('/admin/users')
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to save user')
        } finally {
            setLoading(false)
        }
    }

    return (
        <PageContainer maxWidth={1200}>
            <PageHeader
                title={isEdit ? 'Edit User' : 'Create New User'}
                subtitle={isEdit ? 'Update user information and permissions' : 'Add a new user to the system'}
                icon={<UserOutlined />}
                gradient="primary"
            />

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ is_active: true }}
            >
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        {/* Column 1: Basic Information */}
                        <SectionCard title="Basic Information" icon={<UserOutlined />}>
                            <Form.Item
                                label={<span style={getLabelStyle()}>Name</span>}
                                name="name"
                                rules={[{ required: true, message: 'Please enter name' }]}
                            >
                                <Input
                                    prefix={<UserOutlined style={prefixIconStyle} />}
                                    placeholder="Enter user name"
                                    size="large"
                                    style={largeInputStyle}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span style={getLabelStyle()}>Email</span>}
                                name="email"
                                rules={[
                                    { required: true, message: 'Please enter email' },
                                    { type: 'email', message: 'Please enter valid email' }
                                ]}
                            >
                                <Input
                                    prefix={<MailOutlined style={prefixIconStyle} />}
                                    placeholder="user@example.com"
                                    size="large"
                                    style={largeInputStyle}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span style={getLabelStyle()}>Mobile Number (User ID)</span>}
                                name="phone"
                                rules={[
                                    { required: true, message: 'Please enter mobile number' },
                                    { pattern: /^[0-9]{10,12}$/, message: 'Please enter a valid mobile number' }
                                ]}
                            >
                                <Input
                                    prefix={<PhoneOutlined style={prefixIconStyle} />}
                                    placeholder="Enter mobile number"
                                    size="large"
                                    style={largeInputStyle}
                                    onChange={(e) => {
                                        // Set employee_id (User ID) to mobile number
                                        form.setFieldsValue({ employee_id: e.target.value })
                                    }}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span style={getLabelStyle()}>Location / Site</span>}
                                name="location"
                            >
                                <Input
                                    prefix={<EnvironmentOutlined style={prefixIconStyle} />}
                                    placeholder="Enter location or site name"
                                    size="large"
                                    style={largeInputStyle}
                                />
                            </Form.Item>

                            <Form.Item name="employee_id" hidden>
                                <Input />
                            </Form.Item>

                            <Form.Item name="is_active" valuePropName="checked">
                                <Checkbox style={{ fontSize: 14, fontWeight: 500 }}>
                                    Active User
                                </Checkbox>
                            </Form.Item>
                        </SectionCard>
                    </Col>

                    <Col xs={24} lg={12}>
                        {/* Column 2: Security & Permissions */}
                        <SectionCard title="Security & Permissions" icon={<SafetyOutlined />}>
                            <Form.Item
                                label={<span style={getLabelStyle()}>Roles</span>}
                                name="role_ids"
                                rules={[{ required: true, message: 'Please select at least one role' }]}
                            >
                                <Select
                                    mode="multiple"
                                    placeholder="Select roles"
                                    size="large"
                                    style={largeInputStyle}
                                    suffixIcon={<TeamOutlined style={prefixIconStyle} />}
                                >
                                    {roles.map(role => (
                                        <Option key={role.id} value={role.id}>{role.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            {!isEdit && (
                                <Form.Item
                                    label={<span style={getLabelStyle()}>Password</span>}
                                    name="password"
                                    rules={[{ required: true, message: 'Please enter password' }]}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined style={prefixIconStyle} />}
                                        placeholder="Enter password"
                                        size="large"
                                        style={largeInputStyle}
                                    />
                                </Form.Item>
                            )}

                            <InfoCard title="🔒 Security Note" gradient="subtle">
                                {isEdit
                                    ? 'User password can be reset separately from the user list'
                                    : 'User will receive login credentials via email after account creation'
                                }
                            </InfoCard>
                        </SectionCard>
                    </Col>
                </Row>

                {/* Action Buttons */}
                <Card style={actionCardStyle}>
                    <div style={flexBetweenStyle}>
                        <Text style={{ color: '#666', fontSize: 14 }}>
                            All fields marked with <span style={{ color: '#ff4d4f' }}>*</span> are required
                        </Text>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Button
                                onClick={() => navigate('/admin/users')}
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
                                {isEdit ? 'Update' : 'Create'} User
                            </Button>
                        </div>
                    </div>
                </Card>
            </Form>
        </PageContainer>
    )
}

export default UserForm
