import { useState, useEffect } from 'react'
import { Table, Button, Space, message, Popconfirm, Card, Modal, Form, Input, Select, Tag, Divider, Row, Col, Checkbox, Switch, Typography } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, MinusCircleOutlined, InfoCircleOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { annexureService, Annexure } from '../../services/api/annexures'
import { getPrimaryButtonStyle, largeInputStyle } from '../../styles/styleUtils'

const { TextArea } = Input
const { Text } = Typography

import CSVImportModal from '../../components/common/CSVImportModal'

const AnnexureList = () => {
    const [annexures, setAnnexures] = useState<Annexure[]>([])
    const [loading, setLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [importModalVisible, setImportModalVisible] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [form] = Form.useForm()
    const [typeValue, setTypeValue] = useState('general_terms')
    const [searchText, setSearchText] = useState('')
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    })

    // Default categories with new naming convention
    const [categories, setCategories] = useState([
        { label: 'Terms & Conditions', value: 'general_terms' },
        { label: 'Purchase Order Terms', value: 'purchase_order' },
        { label: 'Payment Terms', value: 'payment_terms' },
        { label: 'Client Scope', value: 'client_scope' },
        { label: 'VHSHRI Scope', value: 'contractor_scope' },
        { label: 'Scope Matrix', value: 'scope_matrix' }
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
    }, [pagination.current, pagination.pageSize, searchText])

    const fetchAnnexures = async () => {
        setLoading(true)
        try {
            const response = await annexureService.getAnnexures({
                page: pagination.current,
                limit: pagination.pageSize,
                search: searchText
            })
            setAnnexures(response.annexures || [])
            setPagination(prev => ({
                ...prev,
                total: response.pagination?.total || 0
            }))
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
        setTypeValue(record.type) // Explicitly set state
        setModalVisible(true)
    }

    const handleAdd = () => {
        setEditingId(null)
        form.resetFields()
        // Initialize with default state
        const defaultType = 'general_terms'
        form.setFieldsValue({
            type: defaultType,
            clauses: [''],
            scope_matrix: [
                { description: 'Administration', is_category: true, client_scope: false, contractor_scope: false },
                { description: 'Labour & Staff accommodation', is_category: false, client_scope: true, contractor_scope: false }
            ]
        })
        setTypeValue(defaultType)
        setModalVisible(true)
    }

    useEffect(() => {
        // Fallback: if we just opened modal, sync state with form
        if (modalVisible) {
            const currentType = form.getFieldValue('type')
            if (currentType && currentType !== typeValue) {
                setTypeValue(currentType)
            }
        }
    }, [modalVisible])

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
                    'purchase_order': 'Purchase Order Terms',
                    'scope_matrix': 'Scope Matrix'
                };
                const displayType = record.category_name || categoryMap[record.type] || (record.type ? record.type.toUpperCase().replace('_', ' ') : 'UNKNOWN');

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
                if (record.type === 'scope_matrix') {
                    return (
                        <div style={{ fontSize: 12, color: '#666' }}>
                            {(record.scope_matrix || [])
                                .slice(0, 3)
                                .map((it: any, i: number) => (
                                    <div key={i}>• {it.is_category ? <strong>{it.description}</strong> : it.description}</div>
                                ))}
                        </div>
                    )
                }
                return (
                    <ul style={{ paddingLeft: 20, margin: 0, fontSize: 12 }}>
                        {(Array.isArray(record.clauses) ? record.clauses : [])
                            .slice(0, 2)
                            .map((c: string, i: number) => (
                                <li key={i}>{(c && typeof c === 'string') ? c.substring(0, 50) : ''}...</li>
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
                    <Space>
                        <Button icon={<FileTextOutlined />} onClick={() => setImportModalVisible(true)}>
                            Import CSV
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                            style={getPrimaryButtonStyle()}
                        >
                            Add New Annexure
                        </Button>
                    </Space>
                }
            />

            <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: 16 }}>
                    <Input.Search
                        placeholder="Search annexures..."
                        onSearch={value => {
                            setSearchText(value)
                            setPagination(prev => ({ ...prev, current: 1 }))
                        }}
                        onChange={e => {
                            if (!e.target.value) {
                                setSearchText('')
                                setPagination(prev => ({ ...prev, current: 1 }))
                            }
                        }}
                        style={{ width: 300 }}
                        allowClear
                    />
                </div>
                <Table
                    columns={columns}
                    dataSource={annexures}
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    onChange={(newPagination) => setPagination(prev => ({
                        ...prev,
                        current: newPagination.current || 1,
                        pageSize: newPagination.pageSize || 10
                    }))}
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
                    onValuesChange={(changed) => {
                        if (changed.type) setTypeValue(changed.type)
                    }}
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
                                    popupRender={(menu) => (
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

                    {typeValue === 'purchase_order' && (
                        <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '8px', border: '1px solid #eee', marginBottom: 24 }}>
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
                    )}

                    {typeValue === 'scope_matrix' ? (
                        <Form.List name="scope_matrix">
                            {(fields, { add, remove, move }) => (
                                <div style={{ maxHeight: 500, overflowY: 'auto', paddingRight: 8 }}>
                                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Space>
                                            <Text strong>Scope Matrix Items</Text>
                                            <Button
                                                size="small"
                                                onClick={() => {
                                                    const current = form.getFieldValue('scope_matrix') || [];
                                                    const standardDefaults = [
                                                        { description: 'Administration & Safety', is_category: true },
                                                        { description: 'Site setup and security', is_category: false, client_scope: true, contractor_scope: false },
                                                        { description: 'Temporary Electricity / Water', is_category: false, client_scope: true, contractor_scope: false },
                                                        { description: 'Site Work (RCC, Masonry)', is_category: true },
                                                        { description: 'Scaffolding & Formwork', is_category: false, client_scope: false, contractor_scope: true },
                                                        { description: 'Finishing Work', is_category: true },
                                                        { description: 'Debris Removal', is_category: false, client_scope: false, contractor_scope: true }
                                                    ];
                                                    form.setFieldsValue({ scope_matrix: [...current, ...standardDefaults] });
                                                }}
                                            >
                                                Load Standard Matrix
                                            </Button>
                                        </Space>
                                        <Button type="primary" size="small" onClick={() => add({ is_category: false, client_scope: false, contractor_scope: true })} icon={<PlusOutlined />}>
                                            Add Item
                                        </Button>
                                    </div>
                                    <Table
                                        dataSource={fields}
                                        rowKey={(field) => field.key}
                                        pagination={false}
                                        size="small"
                                        bordered
                                        columns={[
                                            {
                                                title: 'Category?',
                                                key: 'is_category',
                                                width: 80,
                                                align: 'center',
                                                render: (_, field) => (
                                                    <Form.Item
                                                        {...field}
                                                        name={[field.name, 'is_category']}
                                                        valuePropName="checked"
                                                        noStyle
                                                    >
                                                        <Switch size="small" />
                                                    </Form.Item>
                                                )
                                            },
                                            {
                                                title: 'Description',
                                                key: 'description',
                                                render: (_, field) => (
                                                    <Form.Item
                                                        {...field}
                                                        name={[field.name, 'description']}
                                                        rules={[{ required: true }]}
                                                        noStyle
                                                    >
                                                        <Input placeholder="Description or Header name" variant="borderless" />
                                                    </Form.Item>
                                                )
                                            },
                                            {
                                                title: 'Client',
                                                key: 'client_scope',
                                                width: 60,
                                                align: 'center',
                                                render: (_, field) => (
                                                    <Form.Item
                                                        {...field}
                                                        name={[field.name, 'client_scope']}
                                                        valuePropName="checked"
                                                        noStyle
                                                    >
                                                        <Checkbox />
                                                    </Form.Item>
                                                )
                                            },
                                            {
                                                title: 'VH Shri',
                                                key: 'contractor_scope',
                                                width: 60,
                                                align: 'center',
                                                render: (_, field) => (
                                                    <Form.Item
                                                        {...field}
                                                        name={[field.name, 'contractor_scope']}
                                                        valuePropName="checked"
                                                        noStyle
                                                    >
                                                        <Checkbox />
                                                    </Form.Item>
                                                )
                                            },
                                            {
                                                title: 'Actions',
                                                width: 120,
                                                align: 'center',
                                                render: (_, field, index) => (
                                                    <Space size="small">
                                                        <Button
                                                            type="text"
                                                            icon={<ArrowUpOutlined />}
                                                            disabled={index === 0}
                                                            onClick={() => move(index, index - 1)}
                                                            size="small"
                                                        />
                                                        <Button
                                                            type="text"
                                                            icon={<ArrowDownOutlined />}
                                                            disabled={index === fields.length - 1}
                                                            onClick={() => move(index, index + 1)}
                                                            size="small"
                                                        />
                                                        <Button
                                                            type="text"
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            onClick={() => remove(field.name)}
                                                            size="small"
                                                        />
                                                    </Space>
                                                )
                                            }
                                        ]}
                                    />
                                    <Button type="dashed" onClick={() => add({ is_category: true })} block icon={<PlusOutlined />} style={{ marginTop: 8 }}>
                                        Add Category Header
                                    </Button>
                                </div>
                            )}
                        </Form.List>
                    ) : (
                        <Form.List name="clauses">
                            {(fields, { add, remove }) => (
                                <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
                                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <strong>Clauses / Terms</strong>
                                        <Tag icon={<InfoCircleOutlined />}>Will be shown as list item</Tag>
                                    </div>
                                    {fields.map((field, index) => (
                                        <div key={field.key} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 8 }}>
                                            <span style={{ marginRight: 8, paddingTop: 6, color: '#999' }}>{index + 1}.</span>
                                            <Form.Item
                                                key={field.key}
                                                name={field.name}
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
                                </div>
                            )}
                        </Form.List>
                    )}
                </Form>
            </Modal>

            <CSVImportModal
                visible={importModalVisible}
                onCancel={() => setImportModalVisible(false)}
                onSuccess={() => fetchAnnexures()}
                title="Annexures"
                apiEndpoint="http://localhost:5000/api/annexures/import"
                columns={[
                    { title: 'Name', dataIndex: 'name', key: 'name', required: true },
                    { title: 'Type', dataIndex: 'type', key: 'type', required: true },
                    { title: 'Description', dataIndex: 'description', key: 'description' },
                    { title: 'Clauses', dataIndex: 'clauses', key: 'clauses' },
                ]}
                templateData={[
                    { name: 'Standard Terms', type: 'general_terms', description: 'Standard sales terms', clauses: 'Clause 1\nClause 2' },
                    { name: 'Payment Terms 1', type: 'payment_terms', description: 'Immediate payment', clauses: '100% Advance' },
                ]}
            />
        </PageContainer>
    )
}

export default AnnexureList
