import { useState, useEffect } from 'react'
import { Table, Button, Space, message, Popconfirm, Card, Modal, Form, Input, Select, Tag, Divider, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, MinusCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { annexureService, Annexure } from '../../services/api/annexures'
import { getPrimaryButtonStyle, getSecondaryButtonStyle, largeInputStyle } from '../../styles/styleUtils'

const { TextArea } = Input

const AnnexureList = () => {
    const [annexures, setAnnexures] = useState<Annexure[]>([])
    const [loading, setLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [form] = Form.useForm()
    const typeValue = Form.useWatch('type', form)

    // Default categories with new naming convention
    const [categories, setCategories] = useState([
        { label: 'Terms & Conditions', value: 'general_terms' },
        { label: 'Purchase Order Terms', value: 'purchase_order' },
        { label: 'Payment Terms', value: 'payment_terms' },
        { label: 'Client Scope', value: 'client_scope' },
        { label: 'VHSHRI Scope', value: 'contractor_scope' }
    ])

    const [newCategoryName, setNewCategoryName] = useState('')

    const addCategory = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
        e.preventDefault()
        if (!newCategoryName) return

        // rudimentary check to see if value exists
        const value = newCategoryName.toLowerCase().replace(/\s+/g, '_')
        if (!categories.some(c => c.value === value)) {
            setCategories([...categories, { label: newCategoryName, value }])
        }
        setNewCategoryName('')
    }

    useEffect(() => {
        fetchAnnexures()
    }, [])

    const fetchAnnexures = async () => {
        setLoading(true)
        try {
            const response = await annexureService.getAnnexures()
            setAnnexures(response.annexures || [])
        } catch (error) {
            message.error('Failed to fetch annexures')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            await annexureService.deleteAnnexure(id)
            message.success('Annexure deleted successfully')
            fetchAnnexures()
        } catch (error) {
            message.error('Failed to delete annexure')
        }
    }

    const handleEdit = (record: Annexure) => {
        setEditingId(record.id)
        form.setFieldsValue(record)
        setModalVisible(true)
    }

    const handleAdd = () => {
        setEditingId(null)
        form.resetFields()
        // Initialize with default state
        form.setFieldsValue({ type: 'general_terms', clauses: [''] })
        setModalVisible(true)
    }

    const handleSubmit = async (values: any) => {
        try {
            // Filter out empty clauses
            const cleanClauses = (values.clauses || []).filter((c: string) => c && c.trim() !== '')
            const payload = { ...values, clauses: cleanClauses }

            if (editingId) {
                await annexureService.updateAnnexure(editingId, payload)
                message.success('Annexure updated successfully')
            } else {
                await annexureService.createAnnexure(payload)
                message.success('Annexure created successfully')
            }
            setModalVisible(false)
            fetchAnnexures()
        } catch (error) {
            message.error('Failed to save annexure')
        }
    }

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: '20%',
            render: (text: string, record: any) => {
                const categoryMap: any = {
                    'contractor_scope': 'VHSHRI Scope',
                    'client_scope': 'Client Scope',
                    'payment_terms': 'Payment Terms',
                    'general_terms': 'Terms & Conditions',
                    'purchase_order': 'Purchase Order Terms'
                };
                // Use backend provided category_name if available, else fallback to map, else capitalize raw
                const displayType = record.category_name || categoryMap[record.type] || record.type.toUpperCase().replace('_', ' ');

                return (
                    <Space direction="vertical" size={0}>
                        <span style={{ fontWeight: 600 }}>{text}</span>
                        <Tag color={record.type === 'purchase_order' ? 'purple' : 'blue'} style={{ fontSize: 10 }}>
                            {displayType}
                        </Tag>
                    </Space>
                )
            }
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: '25%',
        },
        {
            title: 'Summary',
            key: 'summary',
            render: (_: any, record: Annexure) => {
                if (record.type === 'purchase_order') {
                    return (
                        <div style={{ fontSize: 12, color: '#666' }}>
                            {record.payment_terms && <div>• Payment: {record.payment_terms.substring(0, 30)}...</div>}
                            {record.delivery_terms && <div>• Delivery: {record.delivery_terms.substring(0, 30)}...</div>}
                        </div>
                    )
                }
                return (
                    <ul style={{ paddingLeft: 20, margin: 0, fontSize: 12 }}>
                        {(record.clauses || []).slice(0, 2).map((c, i) => (
                            <li key={i}>{c.substring(0, 50)}...</li>
                        ))}
                    </ul>
                )
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_: any, record: Annexure) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        style={{ color: '#1890ff' }}
                    />
                    <Popconfirm
                        title="Delete this annexure?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ]

    return (
        <PageContainer>
            <PageHeader
                title="Annexure Master"
                subtitle="Centralized management of terms, conditions, and scopes for Quotations and POs"
                icon={<FileTextOutlined />}
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                        style={getPrimaryButtonStyle()}
                    >
                        Add New Annexure
                    </Button>
                }
            />

            <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Table
                    columns={columns}
                    dataSource={annexures}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={editingId ? "Edit Annexure" : "New Annexure"}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={() => form.submit()}
                width={typeValue === 'purchase_order' ? 900 : 800}
                okText="Save"
                cancelText="Cancel"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Row gutter={16}>
                        <Col span={16}>
                            <Form.Item
                                name="name"
                                label="Annexure Name"
                                rules={[{ required: true, message: 'Please enter a name' }]}
                            >
                                <Input placeholder="e.g. Standard PO Terms 2024" size="large" style={largeInputStyle} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="type"
                                label="Category"
                                rules={[{ required: true }]}
                            >
                                <Select
                                    size="large"
                                    style={largeInputStyle}
                                    dropdownRender={(menu) => (
                                        <>
                                            {menu}
                                            <Divider style={{ margin: '8px 0' }} />
                                            <Space style={{ padding: '0 8px 4px' }}>
                                                <Input
                                                    placeholder="New Category Name"
                                                    value={newCategoryName}
                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                    onKeyDown={(e) => e.stopPropagation()}
                                                />
                                                <Button type="text" icon={<PlusOutlined />} onClick={addCategory}>
                                                    Add
                                                </Button>
                                            </Space>
                                        </>
                                    )}
                                >
                                    {categories.map(cat => (
                                        <Select.Option key={cat.value} value={cat.value}>{cat.label}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="description" label="Description">
                        <TextArea rows={1} placeholder="Internal reference description..." />
                    </Form.Item>

                    <Divider />

                    {typeValue === 'purchase_order' ? (
                        <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '8px', border: '1px solid #eee' }}>
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <Form.Item name="payment_terms" label="Payment Terms">
                                        <TextArea rows={3} placeholder="e.g. 50% advance, 50% on delivery" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="delivery_terms" label="Delivery Terms">
                                        <TextArea rows={3} placeholder="e.g. F.O.R Site, loading by vendor" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="quality_terms" label="Quality & Inspection">
                                        <TextArea rows={3} placeholder="e.g. Pre-dispatch inspection required" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="warranty_terms" label="Warranty / Guarantee">
                                        <TextArea rows={3} placeholder="e.g. 12 months manufacturer warranty" />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name="penalty_clause" label="Penalty / LD Clause">
                                        <TextArea rows={2} placeholder="e.g. 0.5% per week delay max 5%" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>
                    ) : (
                        <Form.List name="clauses">
                            {(fields, { add, remove }) => (
                                <>
                                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <strong>Clauses / Terms</strong>
                                        <Tag icon={<InfoCircleOutlined />}>Will be shown as list item</Tag>
                                    </div>
                                    {fields.map((field, index) => (
                                        <div key={field.key} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 8 }}>
                                            <span style={{ marginRight: 8, paddingTop: 6, color: '#999' }}>{index + 1}.</span>
                                            <Form.Item
                                                {...field}
                                                style={{ flex: 1, marginBottom: 0 }}
                                                rules={[{ required: true, message: 'Please enter term' }]}
                                            >
                                                <TextArea autoSize={{ minRows: 1, maxRows: 6 }} placeholder="Enter term/condition..." />
                                            </Form.Item>
                                            <Button
                                                type="text"
                                                danger
                                                icon={<MinusCircleOutlined />}
                                                onClick={() => remove(field.name)}
                                                style={{ marginLeft: 8 }}
                                            />
                                        </div>
                                    ))}
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginTop: 8 }}>
                                        Add Clause
                                    </Button>
                                </>
                            )}
                        </Form.List>
                    )}
                </Form>
            </Modal>
        </PageContainer>
    )
}

export default AnnexureList
