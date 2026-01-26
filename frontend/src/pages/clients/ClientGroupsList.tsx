import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag, Card, Typography } from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ApartmentOutlined,
    TeamOutlined,
} from '@ant-design/icons'
import { clientService } from '../../services/api/clients'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import {
    largeInputStyle,
    getLabelStyle,
    getPrimaryButtonStyle,
    getSecondaryButtonStyle,
} from '../../styles/styleUtils'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

const ClientGroupsList = () => {
    const [groups, setGroups] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [editingGroup, setEditingGroup] = useState<any>(null)
    const [form] = Form.useForm()

    useEffect(() => {
        fetchGroups()
    }, [])

    const fetchGroups = async () => {
        setLoading(true)
        try {
            const response = await clientService.getClientGroups()
            setGroups(response.groups || [])
        } catch (error: any) {
            message.error('Failed to fetch client groups')
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = () => {
        setEditingGroup(null)
        form.resetFields()
        setModalVisible(true)
    }

    const handleEdit = (group: any) => {
        setEditingGroup(group)
        form.setFieldsValue(group)
        setModalVisible(true)
    }

    const handleDelete = async (id: number) => {
        Modal.confirm({
            title: 'Delete Client Group',
            content: 'Are you sure you want to delete this client group? This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await clientService.deleteClientGroup(id)
                    message.success('Client group deleted successfully')
                    fetchGroups()
                } catch (error: any) {
                    message.error(error.response?.data?.message || 'Failed to delete client group')
                }
            },
        })
    }

    const handleSubmit = async (values: any) => {
        setLoading(true)
        try {
            if (editingGroup) {
                await clientService.updateClientGroup(editingGroup.id, values)
                message.success('Client group updated successfully')
            } else {
                await clientService.createClientGroup(values)
                message.success('Client group created successfully')
            }
            setModalVisible(false)
            form.resetFields()
            fetchGroups()
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to save client group')
        } finally {
            setLoading(false)
        }
    }

    const getTypeTag = (type: string) => {
        const config: Record<string, { color: string; emoji: string; label: string }> = {
            corporate: { color: 'blue', emoji: '🏢', label: 'Corporate' },
            sme: { color: 'green', emoji: '🏭', label: 'SME' },
            government: { color: 'purple', emoji: '🏛️', label: 'Government' },
            individual: { color: 'orange', emoji: '👤', label: 'Individual' },
            retail: { color: 'cyan', emoji: '🏪', label: 'Retail' },
        }
        const { color, emoji, label } = config[type] || config.corporate
        return (
            <Tag color={color} style={{ fontSize: 14, padding: '4px 12px' }}>
                {emoji} {label}
            </Tag>
        )
    }

    const columns = [
        {
            title: 'Company Name',
            dataIndex: 'group_name',
            key: 'group_name',
            render: (text: string) => (
                <Text strong style={{ fontSize: 16 }}>
                    <TeamOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    {text}
                </Text>
            ),
        },
        {
            title: 'Group Type',
            dataIndex: 'group_type',
            key: 'group_type',
            render: (type: string) => getTypeTag(type),
            filters: [
                { text: '🏢 Corporate', value: 'corporate' },
                { text: '🏭 SME', value: 'sme' },
                { text: '🏛️ Government', value: 'government' },
                { text: '👤 Individual', value: 'individual' },
                { text: '🏪 Retail', value: 'retail' },
            ],
            onFilter: (value: any, record: any) => record.group_type === value,
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_: any, record: any) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                    >
                        Delete
                    </Button>
                </Space>
            ),
        },
    ]

    return (
        <PageContainer>
            <PageHeader
                title="Client Groups Management"
                subtitle="Manage parent companies and organization groups"
                icon={<ApartmentOutlined />}
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                        size="large"
                        style={getPrimaryButtonStyle()}
                    >
                        Add Client Group
                    </Button>
                }
            />

            <Card
                style={{
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
            >
                <Table
                    columns={columns}
                    dataSource={groups}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} groups`,
                    }}
                />
            </Card>

            <Modal
                title={
                    <span style={{ fontSize: 20, fontWeight: 600 }}>
                        <ApartmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        {editingGroup ? 'Edit Client Group' : 'Add New Client Group'}
                    </span>
                }
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false)
                    form.resetFields()
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    style={{ marginTop: 24 }}
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
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button
                                onClick={() => {
                                    setModalVisible(false)
                                    form.resetFields()
                                }}
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
                                {editingGroup ? 'Update Group' : 'Create Group'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </PageContainer>
    )
}

export default ClientGroupsList
