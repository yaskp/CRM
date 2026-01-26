
import { useState, useEffect } from 'react'
import { Card, Table, Button, Input, Modal, Form, message, Tag, Tooltip, Select, Space, Row, Col, Divider } from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    LayoutOutlined
} from '@ant-design/icons'
import { workTemplateService } from '../../services/api/workTemplates'
import { workItemTypeService } from '../../services/api/workItemTypes'
import { unitService } from '../../services/api/units'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
const WorkTemplateList = () => {
    const [loading, setLoading] = useState(false)
    const [templates, setTemplates] = useState<any[]>([])
    const [workItemTypes, setWorkItemTypes] = useState<any[]>([])
    const [units, setUnits] = useState<any[]>([])
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<any>(null)
    const [searchText, setSearchText] = useState('')
    const [form] = Form.useForm()
    const [itemTypeForm] = Form.useForm()
    const [isItemTypeModalVisible, setIsItemTypeModalVisible] = useState(false)

    useEffect(() => {
        fetchTemplates()
        fetchWorkItemTypes()
        fetchUnits()
    }, [])

    const fetchTemplates = async () => {
        setLoading(true)
        try {
            const response = await workTemplateService.getTemplates()
            setTemplates(response.templates || [])
        } catch (error) {
            message.error('Failed to fetch templates')
        } finally {
            setLoading(false)
        }
    }

    const fetchWorkItemTypes = async () => {
        try {
            const response = await workItemTypeService.getWorkItemTypes()
            setWorkItemTypes(response.data || [])
        } catch (error) {
            console.error('Failed to fetch work item types')
        }
    }

    const fetchUnits = async () => {
        try {
            const response = await unitService.getUnits()
            setUnits(response.units || response.data || [])
        } catch (error) {
            console.error('Failed to fetch units')
        }
    }

    const handleEdit = (record: any) => {
        setEditingTemplate(record)
        form.setFieldsValue({
            ...record,
            items: record.items?.map((it: any) => ({
                work_item_type_id: it.work_item_type_id,
                item_type: it.item_type,
                description: it.description,
                unit: it.unit
            }))
        })
        setIsModalVisible(true)
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            if (editingTemplate) {
                await workTemplateService.updateTemplate(editingTemplate.id, values)
                message.success('Template updated successfully')
            } else {
                await workTemplateService.createTemplate(values)
                message.success('Template created successfully')
            }
            setIsModalVisible(false)
            fetchTemplates()
        } catch (error) {
            // Validation failed
        }
    }

    const handleCreateWorkItemType = async () => {
        try {
            const values = await itemTypeForm.validateFields()
            const res = await workItemTypeService.createWorkItemType(values)
            if (res.success) {
                message.success('New work type created')
                await fetchWorkItemTypes()
                setIsItemTypeModalVisible(false)
                itemTypeForm.resetFields()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const columns = [
        {
            title: 'Template Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a: any, b: any) => a.name.localeCompare(b.name),
        },
        {
            title: 'Items',
            dataIndex: 'items',
            key: 'items',
            render: (items: any[]) => <Tag color="blue">{items?.length || 0} Items</Tag>
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (active: boolean) => active ? <Tag color="success">Active</Tag> : <Tag color="error">Inactive</Tag>
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_: any, record: any) => (
                <Space>
                    <Tooltip title="Edit">
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ]

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchText.toLowerCase())
    )

    return (
        <PageContainer>
            <PageHeader
                title="Work Templates"
                subtitle="Define standard sets of work items (e.g. D-Wall, Column) to quickly populate quotations"
                icon={<LayoutOutlined />}
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                        setEditingTemplate(null)
                        form.resetFields()
                        setIsModalVisible(true)
                    }}>
                        Add New Template
                    </Button>
                }
            />

            <Card style={{ marginTop: 24 }}>
                <div style={{ marginBottom: 16 }}>
                    <Input
                        placeholder="Search templates..."
                        prefix={<SearchOutlined />}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                    />
                </div>
                <Table
                    columns={columns}
                    dataSource={filteredTemplates}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={editingTemplate ? 'Edit Work Template' : 'Create Work Template'}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                width={800}
                centered
            >
                <Form form={form} layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label="Template Name"
                                rules={[{ required: true, message: 'Please enter name' }]}
                            >
                                <Input placeholder="e.g. D-Wall Template" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="description" label="Description">
                                <Input placeholder="Brief purpose of this template" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left">Template Items</Divider>

                    <Form.List name="items">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} style={{ background: '#fafafa', padding: 12, borderRadius: 8, marginBottom: 12, border: '1px solid #f0f0f0' }}>
                                        <Row gutter={12}>
                                            <Col span={9}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'work_item_type_id']}
                                                    rules={[{ required: true, message: 'Select type' }]}
                                                    label={<span style={{ fontSize: 12 }}>Work Type</span>}
                                                >
                                                    <Select
                                                        placeholder="Select Work Type"
                                                        showSearch
                                                        optionFilterProp="children"
                                                        onChange={(val) => {
                                                            const type = workItemTypes.find(t => t.id === val);
                                                            if (type) {
                                                                const currentItems = form.getFieldValue('items');
                                                                currentItems[name].unit = type.uom;
                                                                form.setFieldsValue({ items: currentItems });
                                                            }
                                                        }}
                                                        dropdownRender={(menu) => (
                                                            <>
                                                                {menu}
                                                                <Divider style={{ margin: '8px 0' }} />
                                                                <Space style={{ padding: '0 8px 4px' }}>
                                                                    <Button
                                                                        type="text"
                                                                        icon={<PlusOutlined />}
                                                                        onClick={() => setIsItemTypeModalVisible(true)}
                                                                        style={{ color: '#14b8a6' }}
                                                                    >
                                                                        New Type
                                                                    </Button>
                                                                </Space>
                                                            </>
                                                        )}
                                                    >
                                                        {workItemTypes.map(t => (
                                                            <Select.Option key={t.id} value={t.id}>{t.name} ({t.code})</Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={6}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'item_type']}
                                                    rules={[{ required: true }]}
                                                    initialValue="labour"
                                                    label={<span style={{ fontSize: 12 }}>Category</span>}
                                                >
                                                    <Select>
                                                        <Select.Option value="labour">Labour</Select.Option>
                                                        <Select.Option value="contract">Contract</Select.Option>
                                                        <Select.Option value="material">Material</Select.Option>
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={6}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'unit']}
                                                    label={<span style={{ fontSize: 12 }}>Unit</span>}
                                                >
                                                    <Select placeholder="Unit" showSearch>
                                                        {units.map((u: any) => (
                                                            <Select.Option key={u.id} value={u.code}>{u.code}</Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={3} style={{ textAlign: 'right', paddingTop: 32 }}>
                                                <DeleteOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                                            </Col>
                                        </Row>
                                        <Row gutter={12}>
                                            <Col span={24}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'description']}
                                                    style={{ marginBottom: 0 }}
                                                    label={<span style={{ fontSize: 12 }}>Item Description / Specification</span>}
                                                >
                                                    <Input placeholder="Enter specific details for this item in this template" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </div>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Add Item to Template
                                </Button>
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal>

            {/* SUB-MODAL FOR NEW WORK ITEM TYPE */}
            <Modal
                title="Create New Work Item Type"
                open={isItemTypeModalVisible}
                onOk={handleCreateWorkItemType}
                onCancel={() => setIsItemTypeModalVisible(false)}
                zIndex={1100} // Ensure it shows above Template modal
            >
                <Form form={itemTypeForm} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{ required: true, message: 'Please enter name' }]}
                    >
                        <Input placeholder="e.g. Guide Wall" />
                    </Form.Item>
                    <Form.Item
                        name="code"
                        label="Code (Optional)"
                    >
                        <Input placeholder="e.g. GW" />
                    </Form.Item>
                    <Form.Item
                        name="uom"
                        label="UOM"
                        rules={[{ required: true, message: 'Please select UOM' }]}
                    >
                        <Select placeholder="Select UOM" showSearch optionFilterProp="children">
                            {units.map((unit: any) => (
                                <Select.Option key={unit.id} value={unit.code}>
                                    {unit.name} ({unit.code})
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </PageContainer>
    )
}

export default WorkTemplateList
