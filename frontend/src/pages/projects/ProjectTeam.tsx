import { useState, useEffect } from 'react'
import {
    Table, Button, Space, Tag, Typography, Modal, Form, Input, Select,
    App, Card, Row, Col, Divider, Popconfirm, Avatar, Tooltip, Statistic, Badge
} from 'antd'
import {
    PlusOutlined, UserOutlined, PhoneOutlined, MailOutlined,
    DeleteOutlined, EditOutlined, TeamOutlined,
    SolutionOutlined, ToolOutlined,
    UserSwitchOutlined, ContainerOutlined
} from '@ant-design/icons'
import { projectContactService, ProjectContact } from '../../services/api/projectContacts'
import { userService } from '../../services/api/users'

const { Text, Title } = Typography
const { Option } = Select
const { TextArea } = Input

interface ProjectTeamProps {
    projectId: number
}

// Role definitions for internal staff
const STAFF_ROLES = [
    { value: 'project_manager', label: 'Project Manager', color: 'purple', icon: '👔' },
    { value: 'site_engineer', label: 'Site Engineer', color: 'blue', icon: '👷' },
    { value: 'supervisor', label: 'Supervisor', color: 'cyan', icon: '📋' },
    { value: 'safety_officer', label: 'Safety Officer', color: 'orange', icon: '🦺' },
    { value: 'surveyor', label: 'Surveyor/QC', color: 'green', icon: '📏' },
]

const CONTRACTOR_CATEGORIES = [
    { value: 'excavation', label: 'Excavation / Earthwork' },
    { value: 'rebar', label: 'Rebar / Cage Works' },
    { value: 'concreting', label: 'Concreting' },
    { value: 'piling', label: 'Piling' },
    { value: 'shuttering', label: 'Shuttering / Formwork' },
    { value: 'general', label: 'General Labour' },
    { value: 'other', label: 'Other' },
]

const CLIENT_ROLES = [
    { value: 'client_contact', label: 'Client Representative' },
    { value: 'decision_maker', label: 'Decision Maker' },
    { value: 'accounts', label: 'Accounts / Billing' },
]

const roleColorMap: Record<string, string> = {
    project_manager: 'purple',
    site_engineer: 'blue',
    supervisor: 'cyan',
    safety_officer: 'orange',
    surveyor: 'green',
    labour_contractor: 'volcano',
    client_contact: 'geekblue',
    decision_maker: 'magenta',
    accounts: 'lime',
}

type ModalMode = 'staff' | 'contractor' | 'client'

const ProjectTeam = ({ projectId }: ProjectTeamProps) => {
    const { message } = App.useApp()
    const [contacts, setContacts] = useState<ProjectContact[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Modal state
    const [modalMode, setModalMode] = useState<ModalMode>('staff')
    const [modalVisible, setModalVisible] = useState(false)
    const [editingContact, setEditingContact] = useState<ProjectContact | null>(null)

    const [staffForm] = Form.useForm()
    const [contractorForm] = Form.useForm()
    const [clientForm] = Form.useForm()

    useEffect(() => {
        fetchData()
    }, [projectId])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [contRes, userRes] = await Promise.all([
                projectContactService.getProjectContacts(projectId),
                userService.getUsers({ limit: 100 })
            ])
            setContacts(contRes.contacts || [])
            setUsers(userRes.users || [])
        } catch (error) {
            console.error(error)
            message.error('Failed to load team data')
        } finally {
            setLoading(false)
        }
    }

    const openModal = (mode: ModalMode, contact?: ProjectContact) => {
        setModalMode(mode)
        setEditingContact(contact || null)

        // Reset all forms first
        staffForm.resetFields()
        contractorForm.resetFields()
        clientForm.resetFields()

        if (contact) {
            if (mode === 'staff') staffForm.setFieldsValue(contact)
            if (mode === 'contractor') contractorForm.setFieldsValue(contact)
            if (mode === 'client') clientForm.setFieldsValue(contact)
        }
        setModalVisible(true)
    }

    const handleDelete = async (id: number) => {
        try {
            await projectContactService.deleteProjectContact(id)
            message.success('Removed successfully')
            fetchData()
        } catch {
            message.error('Failed to remove')
        }
    }

    const handleSave = async (values: any) => {
        try {
            if (editingContact) {
                await projectContactService.updateProjectContact(editingContact.id!, values)
                message.success('Updated successfully')
            } else {
                await projectContactService.createProjectContact(projectId, values)
                message.success('Added successfully')
            }
            setModalVisible(false)
            fetchData()
        } catch {
            message.error('Failed to save')
        }
    }

    const onStaffFinish = (values: any) => {
        // Find the user name from users list
        const user = users.find(u => u.id === values.user_id)
        handleSave({ ...values, name: user?.name || values.name })
    }

    // Derived lists
    const staffList = contacts.filter(c =>
        ['project_manager', 'site_engineer', 'supervisor', 'safety_officer', 'surveyor'].includes(c.contact_type)
    )
    const contractorList = contacts.filter(c => c.contact_type === 'labour_contractor')
    const clientList = contacts.filter(c =>
        ['client_contact', 'decision_maker', 'accounts'].includes(c.contact_type)
    )

    // Summary stats for contractors
    const totalLabour = contractorList.reduce((s, c) => s + (Number(c.labour_count) || 0), 0)
    const totalHelpers = contractorList.reduce((s, c) => s + (Number(c.helper_count) || 0), 0)
    const totalOperators = contractorList.reduce((s, c) => s + (Number(c.operator_count) || 0), 0)

    // ─── Staff Table Columns ───────────────────────────────────────────────────
    const staffColumns = [
        {
            title: 'Name',
            key: 'name',
            render: (_: any, r: ProjectContact) => {
                const user = users.find(u => u.id === r.user_id)
                return (
                    <Space>
                        <Avatar
                            size={36}
                            style={{ background: '#1677ff' }}
                        >
                            {(r.name || user?.name || '?')[0]?.toUpperCase()}
                        </Avatar>
                        <Space direction="vertical" size={0}>
                            <Text strong>{r.name || user?.name}</Text>
                            {user?.employee_id && <Text type="secondary" style={{ fontSize: 11 }}>ID: {user.employee_id}</Text>}
                        </Space>
                    </Space>
                )
            }
        },
        {
            title: 'Role',
            dataIndex: 'contact_type',
            key: 'role',
            render: (type: string) => {
                const role = STAFF_ROLES.find(r => r.value === type)
                return <Tag color={roleColorMap[type]}>{role?.label || type}</Tag>
            }
        },
        {
            title: 'Contact',
            key: 'contact',
            render: (_: any, r: ProjectContact) => (
                <Space direction="vertical" size={0}>
                    {r.phone && <Text style={{ fontSize: 12 }}><PhoneOutlined /> {r.phone}</Text>}
                    {r.email && <Text style={{ fontSize: 12 }}><MailOutlined /> {r.email}</Text>}
                </Space>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 80,
            render: (_: any, r: ProjectContact) => (
                <Space size={2}>
                    <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openModal('staff', r)} />
                    <Popconfirm title="Remove from project?" onConfirm={() => handleDelete(r.id!)}>
                        <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ]

    // ─── Contractor Table Columns ───────────────────────────────────────────────
    const contractorColumns = [
        {
            title: 'Contractor Details',
            key: 'contractor',
            render: (_: any, r: ProjectContact) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{r.name}</Text>
                    {r.company_name && <Text type="secondary" style={{ fontSize: 12 }}>{r.company_name}</Text>}
                    {r.phone && <Text style={{ fontSize: 12 }}><PhoneOutlined /> {r.phone}</Text>}
                </Space>
            )
        },
        {
            title: 'Category',
            dataIndex: 'designation',
            key: 'category',
            render: (cat: string) => {
                const c = CONTRACTOR_CATEGORIES.find(x => x.value === cat)
                return cat ? <Tag color="volcano">{c?.label || cat}</Tag> : '-'
            }
        },
        {
            title: 'Manpower',
            key: 'manpower',
            render: (_: any, r: ProjectContact) => (
                <Space size={8}>
                    {r.labour_count ? <Tooltip title="Labourers"><Badge count={r.labour_count} color="#1677ff" overflowCount={999} showZero /></Tooltip> : null}
                    {r.helper_count ? <Tooltip title="Helpers"><Badge count={r.helper_count} color="#52c41a" overflowCount={999} showZero /></Tooltip> : null}
                    {r.operator_count ? <Tooltip title="Operators"><Badge count={r.operator_count} color="#fa8c16" overflowCount={999} showZero /></Tooltip> : null}
                    {!r.labour_count && !r.helper_count && !r.operator_count && <Text type="secondary">-</Text>}
                </Space>
            )
        },
        {
            title: 'Notes',
            dataIndex: 'notes',
            key: 'notes',
            render: (n: string) => n ? <Text type="secondary" style={{ fontSize: 12 }}>{n}</Text> : '-'
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 80,
            render: (_: any, r: ProjectContact) => (
                <Space size={2}>
                    <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openModal('contractor', r)} />
                    <Popconfirm title="Remove contractor?" onConfirm={() => handleDelete(r.id!)}>
                        <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ]

    // ─── Client Contact Columns ─────────────────────────────────────────────────
    const clientColumns = [
        {
            title: 'Name',
            key: 'name',
            render: (_: any, r: ProjectContact) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{r.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{r.designation}</Text>
                </Space>
            )
        },
        {
            title: 'Role',
            dataIndex: 'contact_type',
            key: 'role',
            render: (type: string) => {
                const role = CLIENT_ROLES.find(r => r.value === type)
                return <Tag color={roleColorMap[type]}>{role?.label || type}</Tag>
            }
        },
        {
            title: 'Contact',
            key: 'contact',
            render: (_: any, r: ProjectContact) => (
                <Space direction="vertical" size={0}>
                    {r.phone && <Text style={{ fontSize: 12 }}><PhoneOutlined /> {r.phone}</Text>}
                    {r.email && <Text style={{ fontSize: 12 }}><MailOutlined /> {r.email}</Text>}
                </Space>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 80,
            render: (_: any, r: ProjectContact) => (
                <Space size={2}>
                    <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openModal('client', r)} />
                    <Popconfirm title="Remove contact?" onConfirm={() => handleDelete(r.id!)}>
                        <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ]

    const activeForm =
        modalMode === 'staff' ? staffForm :
            modalMode === 'contractor' ? contractorForm :
                clientForm

    return (
        <div>
            {/* ─── Summary Banner ──────────────────────────────────────────── */}
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', color: '#fff', height: '100%' }}>
                        <Statistic
                            title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>Site Staff</Text>}
                            value={staffList.length}
                            suffix="assigned"
                            valueStyle={{ color: '#fff', fontSize: 20 }}
                            prefix={<TeamOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', border: 'none', height: '100%' }}>
                        <Statistic
                            title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>Labour Contractors</Text>}
                            value={contractorList.length}
                            suffix="firms"
                            valueStyle={{ color: '#fff', fontSize: 20 }}
                            prefix={<ToolOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: 'none', height: '100%' }}>
                        <Statistic
                            title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>Total Labourers</Text>}
                            value={totalLabour + totalHelpers + totalOperators}
                            suffix="workers"
                            valueStyle={{ color: '#fff', fontSize: 20 }}
                            prefix={<ToolOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', border: 'none', height: '100%' }}>
                        <Statistic
                            title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>Client Contacts</Text>}
                            value={clientList.length}
                            suffix="contacts"
                            valueStyle={{ color: '#fff', fontSize: 20 }}
                            prefix={<SolutionOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* ─── Section 1: Internal Site Team ───────────────────────────── */}
            <Card
                style={{ marginBottom: 20 }}
                title={
                    <Row gutter={[8, 8]} align="middle" justify="space-between" style={{ width: '100%' }}>
                        <Col>
                            <Space>
                                <UserSwitchOutlined style={{ color: '#1677ff' }} />
                                <Title level={5} style={{ margin: 0 }}>Internal Site Team</Title>
                                <Tag color="blue">{staffList.length} assigned</Tag>
                            </Space>
                        </Col>
                        <Col>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('staff')}>
                                Assign Staff
                            </Button>
                        </Col>
                    </Row>
                }
                styles={{ body: { padding: 0 } }}
            >
                <Table
                    dataSource={staffList}
                    columns={staffColumns}
                    pagination={false}
                    loading={loading}
                    scroll={{ x: 800 }}
                    rowKey="id"
                    locale={{ emptyText: 'No staff assigned yet. Click "Assign Staff" to add.' }}
                    size="middle"
                />
            </Card>

            {/* ─── Section 2: Labour Contractors ───────────────────────────── */}
            <Card
                style={{ marginBottom: 20 }}
                title={
                    <Row gutter={[8, 8]} align="middle" justify="space-between" style={{ width: '100%' }}>
                        <Col>
                            <Space>
                                <ToolOutlined style={{ color: '#fa8c16' }} />
                                <Title level={5} style={{ margin: 0 }}>Labour Contractors</Title>
                                <Tag color="volcano">{contractorList.length} contractors</Tag>
                            </Space>
                        </Col>
                        <Col>
                            <Button icon={<PlusOutlined />} onClick={() => openModal('contractor')} style={{ background: '#fa8c16', color: '#fff', border: 'none' }}>
                                Add Labour Contractor
                            </Button>
                        </Col>
                    </Row>
                }
                styles={{ body: { padding: 0 } }}
            >
                {contractorList.length > 0 && (
                    <div style={{ padding: '10px 16px', background: '#fff7e6', borderBottom: '1px solid #ffd591', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                        <Text style={{ fontSize: 12 }}>
                            <Text strong style={{ color: '#1677ff' }}>{totalLabour}</Text> Labourers
                        </Text>
                        <Text style={{ fontSize: 12 }}>
                            <Text strong style={{ color: '#52c41a' }}>{totalHelpers}</Text> Helpers
                        </Text>
                        <Text style={{ fontSize: 12 }}>
                            <Text strong style={{ color: '#fa8c16' }}>{totalOperators}</Text> Operators
                        </Text>
                        <Text style={{ fontSize: 12, color: '#888' }}>
                            Total workforce: <Text strong>{totalLabour + totalHelpers + totalOperators}</Text>
                        </Text>
                    </div>
                )}
                <Table
                    dataSource={contractorList}
                    columns={contractorColumns}
                    pagination={false}
                    loading={loading}
                    scroll={{ x: 800 }}
                    rowKey="id"
                    locale={{ emptyText: 'No contractors added. Click "Add Labour Contractor" to add.' }}
                    size="middle"
                />
            </Card>

            {/* ─── Section 3: Client Contacts ───────────────────────────────── */}
            <Card
                title={
                    <Row gutter={[8, 8]} align="middle" justify="space-between" style={{ width: '100%' }}>
                        <Col>
                            <Space>
                                <ContainerOutlined style={{ color: '#722ed1' }} />
                                <Title level={5} style={{ margin: 0 }}>Client & Office Contacts</Title>
                                <Tag color="purple">{clientList.length} contacts</Tag>
                            </Space>
                        </Col>
                        <Col>
                            <Button icon={<PlusOutlined />} onClick={() => openModal('client')}>
                                Add Contact
                            </Button>
                        </Col>
                    </Row>
                }
                styles={{ body: { padding: 0 } }}
            >
                <Table
                    dataSource={clientList}
                    columns={clientColumns}
                    pagination={false}
                    loading={loading}
                    scroll={{ x: 800 }}
                    rowKey="id"
                    locale={{ emptyText: 'No client contacts added.' }}
                    size="middle"
                />
            </Card>

            {/* ─── Unified Modal ────────────────────────────────────────────── */}
            <Modal
                title={
                    <Space>
                        {modalMode === 'staff' && <><UserSwitchOutlined style={{ color: '#1677ff' }} /> {editingContact ? 'Edit' : 'Assign'} Site Staff</>}
                        {modalMode === 'contractor' && <><ToolOutlined style={{ color: '#fa8c16' }} /> {editingContact ? 'Edit' : 'Add'} Labour Contractor</>}
                        {modalMode === 'client' && <><SolutionOutlined style={{ color: '#722ed1' }} /> {editingContact ? 'Edit' : 'Add'} Client Contact</>}
                    </Space>
                }
                open={modalVisible}
                onOk={() => activeForm.submit()}
                onCancel={() => setModalVisible(false)}
                width={560}
                destroyOnHidden
            >
                {/* ── Staff Form ── */}
                {modalMode === 'staff' && (
                    <Form form={staffForm} layout="vertical" onFinish={onStaffFinish}>
                        <Form.Item
                            name="user_id"
                            label="Select Employee from User Base"
                            rules={[{ required: !editingContact, message: 'Select an employee' }]}
                        >
                            <Select
                                showSearch
                                placeholder="Search employee by name / ID"
                                optionFilterProp="label"
                                options={users.map(u => ({
                                    value: u.id,
                                    label: `${u.name}${u.employee_id ? ` (${u.employee_id})` : ''}`,
                                }))}
                            />
                        </Form.Item>

                        {editingContact && (
                            <Form.Item name="name" label="Name">
                                <Input prefix={<UserOutlined />} />
                            </Form.Item>
                        )}

                        <Form.Item name="contact_type" label="Site Role / Designation" rules={[{ required: true }]}>
                            <Select placeholder="Select role on site">
                                {STAFF_ROLES.map(r => (
                                    <Option key={r.value} value={r.value}>{r.icon} {r.label}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item name="phone" label="Phone Number">
                                    <Input prefix={<PhoneOutlined />} placeholder="Mobile" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item name="email" label="Email">
                                    <Input prefix={<MailOutlined />} placeholder="Work email" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="notes" label="Notes (optional)">
                            <TextArea rows={2} placeholder="Any specific responsibilities or instructions..." />
                        </Form.Item>
                    </Form>
                )}

                {/* ── Contractor Form ── */}
                {modalMode === 'contractor' && (
                    <Form form={contractorForm} layout="vertical" onFinish={handleSave}
                        initialValues={{ contact_type: 'labour_contractor' }}>
                        <Form.Item name="contact_type" hidden initialValue="labour_contractor">
                            <Input />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item name="name" label="Contractor Name" rules={[{ required: true }]}>
                                    <Input prefix={<UserOutlined />} placeholder="Person name" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item name="company_name" label="Company / Firm Name">
                                    <Input placeholder="Firm or contractor company" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item name="phone" label="Phone / Mobile" rules={[{ required: true }]}>
                                    <Input prefix={<PhoneOutlined />} placeholder="10-digit mobile" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item name="designation" label="Work Category">
                                    <Select placeholder="Type of work">
                                        {CONTRACTOR_CATEGORIES.map(c => (
                                            <Option key={c.value} value={c.value}>{c.label}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider orientation="left" style={{ fontSize: 13, color: '#888' }}>👷 Manpower Provided</Divider>

                        <Row gutter={16}>
                            <Col xs={8}>
                                <Form.Item name="labour_count" label="Labourers">
                                    <Input type="number" min={0} placeholder="0" addonAfter="nos" />
                                </Form.Item>
                            </Col>
                            <Col xs={8}>
                                <Form.Item name="helper_count" label="Helpers">
                                    <Input type="number" min={0} placeholder="0" addonAfter="nos" />
                                </Form.Item>
                            </Col>
                            <Col xs={8}>
                                <Form.Item name="operator_count" label="Operators">
                                    <Input type="number" min={0} placeholder="0" addonAfter="nos" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="notes" label="Additional Notes">
                            <TextArea rows={2} placeholder="Scope of work, payment terms, etc." />
                        </Form.Item>
                    </Form>
                )}

                {/* ── Client Contact Form ── */}
                {modalMode === 'client' && (
                    <Form form={clientForm} layout="vertical" onFinish={handleSave}>
                        <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                            <Input prefix={<UserOutlined />} placeholder="Contact person name" />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item name="contact_type" label="Role / Type" rules={[{ required: true }]}>
                                    <Select placeholder="Select role">
                                        {CLIENT_ROLES.map(r => (
                                            <Option key={r.value} value={r.value}>{r.label}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item name="designation" label="Designation">
                                    <Input placeholder="e.g. Project Director" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item name="phone" label="Phone">
                                    <Input prefix={<PhoneOutlined />} placeholder="Mobile number" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item name="email" label="Email">
                                    <Input prefix={<MailOutlined />} placeholder="email@company.com" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="notes" label="Notes">
                            <TextArea rows={2} placeholder="Any relevant notes..." />
                        </Form.Item>
                    </Form>
                )}
            </Modal>
        </div>
    )
}

export default ProjectTeam
