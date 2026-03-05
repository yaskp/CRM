import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Checkbox, Row, Col, Typography, Space } from 'antd'
import { SafetyOutlined, KeyOutlined, TeamOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { roleService } from '../../services/api/roles'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import {
    largeInputStyle,
    getLabelStyle,
    getPrimaryButtonStyle,
    getSecondaryButtonStyle,
    actionCardStyle,
    prefixIconStyle
} from '../../styles/styleUtils'

const { Text } = Typography

const RoleForm = () => {
    const [loading, setLoading] = useState(false)
    const [permissions, setPermissions] = useState<any[]>([])
    const [form] = Form.useForm()
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = !!id

    useEffect(() => {
        fetchPermissions()
        if (isEdit) {
            fetchRole()
        }
    }, [id])

    const fetchPermissions = async () => {
        try {
            const response = await roleService.getPermissions()
            setPermissions(response.permissions || [])
        } catch (error) {
            console.error('Failed to fetch permissions')
        }
    }

    const fetchRole = async () => {
        try {
            const response = await roleService.getRole(Number(id))
            const role = response.role
            form.setFieldsValue({
                name: role.name,
                permissions: role.permissions?.map((p: any) => p.name) || [],
            })
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch role')
        }
    }

    const onFinish = async (values: any) => {
        setLoading(true)
        try {
            if (isEdit) {
                await roleService.updateRole(Number(id), values)
                message.success('Role updated successfully')
            } else {
                await roleService.createRole(values)
                message.success('Role created successfully')
            }
            navigate('/admin/roles')
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to save role')
        } finally {
            setLoading(false)
        }
    }

    return (
        <PageContainer maxWidth={1000}>
            <PageHeader
                title={isEdit ? 'Edit Role' : 'Create New Role'}
                subtitle={isEdit ? 'Update role information and permissions' : 'Define a new role with specific permissions'}
                icon={<SafetyOutlined />}
            />

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
            >
                <SectionCard title="Role Information" icon={<TeamOutlined />}>
                    <Form.Item
                        label={<span style={getLabelStyle()}>Role Name</span>}
                        name="name"
                        rules={[{ required: true, message: 'Please enter role name' }]}
                    >
                        <Input
                            prefix={<TeamOutlined style={prefixIconStyle} />}
                            placeholder="Enter role name (e.g., Project Manager)"
                            size="large"
                            style={largeInputStyle}
                        />
                    </Form.Item>

                    <InfoCard title="💡 Naming Tip">
                        Use clear, descriptive names that reflect the role's responsibilities (e.g., "Site Engineer", "Finance Manager")
                    </InfoCard>
                </SectionCard>

                <SectionCard title="Permissions" icon={<KeyOutlined />}>
                    <Form.Item
                        label={<span style={getLabelStyle()}>Select Permissions</span>}
                        name="permissions"
                        extra={<Text type="secondary" style={{ fontSize: 13 }}>Choose the permissions this role should have access to</Text>}
                    >
                        <Checkbox.Group style={{ width: '100%' }}>
                            <Row gutter={[16, 16]}>
                                {permissions.map(perm => (
                                    <Col xs={24} sm={12} md={8} key={perm.id || perm.name}>
                                        <Card
                                            size="small"
                                            hoverable
                                            style={{
                                                borderRadius: 8,
                                                border: '1px solid #e8e8e8',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            <Checkbox
                                                value={perm.name}
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 500
                                                }}
                                            >
                                                {perm.name}
                                            </Checkbox>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Checkbox.Group>
                    </Form.Item>

                    <InfoCard title="🔒 Security Note" gradient="subtle">
                        Carefully review permissions before assigning them. Users with this role will have access to all selected features.
                    </InfoCard>
                </SectionCard>

                {/* Action Buttons */}
                <Card style={actionCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                        <Text style={{ color: '#666', fontSize: 14 }}>
                            All fields marked with <span style={{ color: '#ff4d4f' }}>*</span> are required
                        </Text>
                        <Space wrap>
                            <Button
                                onClick={() => navigate('/admin/roles')}
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
                                {isEdit ? 'Update' : 'Create'} Role
                            </Button>
                        </Space>
                    </div>
                </Card>
            </Form>
        </PageContainer>
    )
}

export default RoleForm
