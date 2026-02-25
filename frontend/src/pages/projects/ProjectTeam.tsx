import { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Typography, Modal, Form, Input, Select, App, Card, Row, Col, Divider, Popconfirm } from 'antd'
import {
    PlusOutlined,
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    ShopOutlined,
    DeleteOutlined,
    EditOutlined,
    TeamOutlined
} from '@ant-design/icons'
import { projectContactService, ProjectContact } from '../../services/api/projectContacts'
import { vendorService } from '../../services/api/vendors'

const { Text } = Typography
const { Option } = Select

interface ProjectTeamProps {
    projectId: number
}

const ProjectTeam = ({ projectId }: ProjectTeamProps) => {
    const { message } = App.useApp()
    const [contacts, setContacts] = useState<ProjectContact[]>([])
    const [vendors, setVendors] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [editingContact, setEditingContact] = useState<ProjectContact | null>(null)
    const [form] = Form.useForm()

    useEffect(() => {
        fetchData()
    }, [projectId])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [contRes, vendRes] = await Promise.all([
                projectContactService.getProjectContacts(projectId),
                vendorService.getVendors(), // In a real app, maybe filter by project vendors
            ])
            setContacts(contRes.contacts || [])
            // Filter vendors that are linked to this project if possible, 
            // or just show all for now if ProjetVendor API is missing.
            // For now, let's just focus on Contacts as requested.
            setVendors(vendRes.vendors || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddContact = () => {
        setEditingContact(null)
        form.resetFields()
        setModalVisible(true)
    }

    const handleEditContact = (contact: ProjectContact) => {
        setEditingContact(contact)
        form.setFieldsValue(contact)
        setModalVisible(true)
    }

    const handleDeleteContact = async (id: number) => {
        try {
            await projectContactService.deleteProjectContact(id)
            message.success('Contact removed')
            fetchData()
        } catch (error) {
            message.error('Failed to remove contact')
        }
    }

    const onFinish = async (values: any) => {
        try {
            if (editingContact) {
                await projectContactService.updateProjectContact(editingContact.id!, values)
                message.success('Contact updated')
            } else {
                await projectContactService.createProjectContact(projectId, values)
                message.success('Contact added')
            }
            setModalVisible(false)
            fetchData()
        } catch (error) {
            message.error('Failed to save contact')
        }
    }

    const contactColumns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: ProjectContact) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{text}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.designation}</Text>
                </Space>
            )
        },
        {
            title: 'Type',
            dataIndex: 'contact_type',
            key: 'contact_type',
            render: (type: string) => {
                const colors: any = { site: 'blue', office: 'orange', decision_maker: 'purple', accounts: 'green' }
                return <Tag color={colors[type]}>{type.replace('_', ' ').toUpperCase()}</Tag>
            }
        },
        {
            title: 'Contact Details',
            key: 'contact',
            render: (_: any, record: ProjectContact) => (
                <Space direction="vertical" size={0}>
                    {record.phone && <Text style={{ fontSize: 13 }}><PhoneOutlined /> {record.phone}</Text>}
                    {record.email && <Text style={{ fontSize: 13 }}><MailOutlined /> {record.email}</Text>}
                </Space>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_: any, record: ProjectContact) => (
                <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEditContact(record)} />
                    <Popconfirm title="Remove this contact?" onConfirm={() => handleDeleteContact(record.id!)}>
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ]

    return (
        <div style={{ padding: '0 0' }}>
            <Row gutter={[24, 24]}>
                <Col span={16}>
                    <Card
                        title={<Space><TeamOutlined /> Project Contacts</Space>}
                        extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAddContact}>Add Contact</Button>}
                        styles={{ body: { padding: 0 } }}
                    >
                        <Table
                            dataSource={contacts}
                            columns={contactColumns}
                            pagination={false}
                            loading={loading}
                            rowKey="id"
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card title={<Space><ShopOutlined /> Key Vendors</Space>}>
                        <Text type="secondary">List of approved vendors for this project.</Text>
                        <Divider />
                        {/* Simple list for now */}
                        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                            {vendors.slice(0, 5).map(v => (
                                <div key={v.id} style={{ marginBottom: 12, padding: 8, background: '#f9f9f9', borderRadius: 8 }}>
                                    <Text strong style={{ display: 'block' }}>{v.name}</Text>
                                    <Tag color="blue">{v.vendor_type?.replace('_', ' ')}</Tag>
                                </div>
                            ))}
                            <Button type="link" block>View All Project Vendors</Button>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Modal
                title={editingContact ? 'Edit Contact' : 'Add Project Contact'}
                open={modalVisible}
                onOk={() => form.submit()}
                onCancel={() => setModalVisible(false)}
                destroyOnHidden
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                        <Input prefix={<UserOutlined />} placeholder="e.g. Rajesh Kumar" />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="contact_type" label="Contact Type" rules={[{ required: true }]}>
                                <Select placeholder="Select Type">
                                    <Option value="site">Site Personnel</Option>
                                    <Option value="office">Office / Admin</Option>
                                    <Option value="decision_maker">Decision Maker</Option>
                                    <Option value="accounts">Accounts / Billing</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="designation" label="Designation">
                                <Input placeholder="e.g. Project Manager" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="phone" label="Phone Number">
                                <Input prefix={<PhoneOutlined />} placeholder="10 digit mobile" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="email" label="Email Address">
                                <Input prefix={<MailOutlined />} placeholder="email@example.com" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    )
}

export default ProjectTeam
