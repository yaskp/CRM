
import { useState, useEffect } from 'react'
import { Card, Table, Button, Input, Modal, Form, message, Tag, Tooltip, Select, Space, Row, Col, Divider, Tabs, Popconfirm } from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    LayoutOutlined,
    FileTextOutlined,
} from '@ant-design/icons'
import { workTemplateService } from '../../services/api/workTemplates'
import { workItemTypeService } from '../../services/api/workItemTypes'
import { unitService } from '../../services/api/units'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'

const { TextArea } = Input

const WorkMaster = () => {
    const [activeTab, setActiveTab] = useState('templates')
    const [loading, setLoading] = useState(false)
    const [templates, setTemplates] = useState<any[]>([])
    const [workItemTypes, setWorkItemTypes] = useState<any[]>([])
    const [units, setUnits] = useState<any[]>([])
    const [searchText, setSearchText] = useState('')

    // Template Modal State
    const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<any>(null)
    const [templateForm] = Form.useForm()

    // Work Item Type Modal State (Used for both Tab and Inner Template Add)
    const [isTypeModalVisible, setIsTypeModalVisible] = useState(false)
    const [editingType, setEditingType] = useState<any>(null)
    const [typeForm] = Form.useForm()

    useEffect(() => {
        fetchMetadata()
    }, [])

    const fetchMetadata = async () => {
        setLoading(true)
        try {
            const [tempRes, typesRes, unitsRes] = await Promise.all([
                workTemplateService.getTemplates(),
                workItemTypeService.getWorkItemTypes(),
                unitService.getUnits()
            ])
            setTemplates(tempRes.templates || [])
            setWorkItemTypes(typesRes.data || [])
            setUnits(unitsRes.units || unitsRes.data || [])
        } catch (error) {
            message.error('Failed to fetch data')
        } finally {
            setLoading(false)
        }
    }

    // --- WORK ITEM TYPE HANDLERS ---
    const handleSaveType = async () => {
        try {
            const values = await typeForm.validateFields()
            if (editingType) {
                await workItemTypeService.updateWorkItemType(editingType.id, values)
                message.success('Work item type updated')
            } else {
                await workItemTypeService.createWorkItemType(values)
                message.success('Work item type created')
            }
            setIsTypeModalVisible(false)
            setEditingType(null)
            typeForm.resetFields()
            fetchMetadata()
        } catch (error) {
            console.error(error)
        }
    }

    const handleToggleTypeStatus = async (record: any) => {
        try {
            await workItemTypeService.updateWorkItemType(record.id, {
                ...record,
                is_active: !record.is_active
            })
            message.success(record.is_active ? 'Item deactivated' : 'Item activated')
            fetchMetadata()
        } catch (error) {
            message.error('Operation failed')
        }
    }

    // --- TEMPLATE HANDLERS ---
    const handleSaveTemplate = async () => {
        try {
            const values = await templateForm.validateFields()
            const payload = {
                ...values,
                items: values.items?.map((it: any) => ({
                    ...it,
                    unit: it.unit || 'LS'
                }))
            }

            if (editingTemplate) {
                await workTemplateService.updateTemplate(editingTemplate.id, payload)
                message.success('Template updated')
            } else {
                await workTemplateService.createTemplate(payload)
                message.success('Template created')
            }
            setIsTemplateModalVisible(false)
            setEditingTemplate(null)
            templateForm.resetFields()
            fetchMetadata()
        } catch (error) {
            console.error(error)
        }
    }

    const handleToggleTemplateStatus = async (record: any) => {
        try {
            await workTemplateService.updateTemplate(record.id, {
                ...record,
                is_active: !record.is_active
            })
            message.success(record.is_active ? 'Template deactivated' : 'Template activated')
            fetchMetadata()
        } catch (error) {
            message.error('Operation failed')
        }
    }

    // --- COLUMNS ---
    const typeColumns = [
        { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a: any, b: any) => a.name.localeCompare(b.name) },
        { title: 'Code', dataIndex: 'code', key: 'code', render: (text: string) => text ? <Tag>{text}</Tag> : '-' },
        { title: 'UOM', dataIndex: 'uom', key: 'uom' },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (active: boolean) => active ? <Tag color="success">Active</Tag> : <Tag color="error">Inactive</Tag>
        },
        { title: 'Description', dataIndex: 'description', key: 'description' },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_: any, record: any) => (
                <Space>
                    <Tooltip title="Edit">
                        <Button icon={<EditOutlined />} onClick={() => {
                            setEditingType(record)
                            typeForm.setFieldsValue(record)
                            setIsTypeModalVisible(true)
                        }} />
                    </Tooltip>
                    <Tooltip title={record.is_active ? "Deactivate" : "Activate"}>
                        <Popconfirm title={record.is_active ? "Deactivate this type?" : "Activate this type?"} onConfirm={() => handleToggleTypeStatus(record)}>
                            <Button icon={record.is_active ? <DeleteOutlined /> : <PlusOutlined />} danger={record.is_active} style={!record.is_active ? { color: 'green', borderColor: 'green' } : {}} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            )
        }
    ]

    const templateColumns = [
        { title: 'Template Name', dataIndex: 'name', key: 'name', sorter: (a: any, b: any) => a.name.localeCompare(b.name) },
        { title: 'Items', dataIndex: 'items', key: 'items', render: (items: any[]) => <Tag color="blue">{items?.length || 0} Items</Tag> },
        { title: 'Status', dataIndex: 'is_active', key: 'is_active', render: (active: boolean) => active ? <Tag color="success">Active</Tag> : <Tag color="error">Inactive</Tag> },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_: any, record: any) => (
                <Space>
                    <Tooltip title="Edit Template">
                        <Button icon={<EditOutlined />} onClick={() => {
                            setEditingTemplate(record)
                            templateForm.setFieldsValue({
                                ...record,
                                items: record.items?.map((it: any) => ({
                                    work_item_type_id: it.work_item_type_id,
                                    item_type: it.item_type,
                                    description: it.description,
                                    unit: it.unit
                                }))
                            })
                            setIsTemplateModalVisible(true)
                        }} />
                    </Tooltip>
                    <Tooltip title={record.is_active ? "Deactivate" : "Activate"}>
                        <Popconfirm title={record.is_active ? "Deactivate template?" : "Activate template?"} onConfirm={() => handleToggleTemplateStatus(record)}>
                            <Button icon={record.is_active ? <DeleteOutlined /> : <PlusOutlined />} danger={record.is_active} style={!record.is_active ? { color: 'green', borderColor: 'green' } : {}} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            )
        }
    ]

    const filteredTypes = workItemTypes.filter(t => t.name.toLowerCase().includes(searchText.toLowerCase()) || (t.code?.toLowerCase().includes(searchText.toLowerCase())))
    const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(searchText.toLowerCase()))

    return (
        <PageContainer>
            <PageHeader
                title="Work Master"
                subtitle="Manage standardized work items and multi-item templates for Quotations"
                icon={<LayoutOutlined />}
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            if (activeTab === 'templates') {
                                setEditingTemplate(null)
                                templateForm.resetFields()
                                setIsTemplateModalVisible(true)
                            } else {
                                setEditingType(null)
                                typeForm.resetFields()
                                setIsTypeModalVisible(true)
                            }
                        }}
                    >
                        {activeTab === 'templates' ? 'Add New Template' : 'Add New Work Item'}
                    </Button>
                }
            />

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    {
                        key: 'templates',
                        label: <span><LayoutOutlined /> Work Templates</span>,
                        children: (
                            <Card style={{ marginTop: 16 }}>
                                <div style={{ marginBottom: 16 }}>
                                    <Input placeholder="Search templates..." prefix={<SearchOutlined />} onChange={e => setSearchText(e.target.value)} style={{ width: 300 }} />
                                </div>
                                <Table columns={templateColumns} dataSource={filteredTemplates} rowKey="id" loading={loading} />
                            </Card>
                        )
                    },
                    {
                        key: 'items',
                        label: <span><FileTextOutlined /> Standard Work Items</span>,
                        children: (
                            <Card style={{ marginTop: 16 }}>
                                <div style={{ marginBottom: 16 }}>
                                    <Input placeholder="Search work items..." prefix={<SearchOutlined />} onChange={e => setSearchText(e.target.value)} style={{ width: 300 }} />
                                </div>
                                <Table columns={typeColumns} dataSource={filteredTypes} rowKey="id" loading={loading} />
                            </Card>
                        )
                    }
                ]}
            />

            {/* TEMPLATE MODAL */}
            <Modal
                title={editingTemplate ? 'Edit Work Template' : 'Create Work Template'}
                open={isTemplateModalVisible}
                onOk={handleSaveTemplate}
                onCancel={() => setIsTemplateModalVisible(false)}
                width={900}
                centered
            >
                <Form form={templateForm} layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="name" label="Template Name" rules={[{ required: true }]}><Input placeholder="e.g. D-Wall Package" /></Form.Item></Col>
                        <Col span={12}>
                            <Form.Item name="is_active" label="Status" initialValue={true}>
                                <Select options={[{ label: 'Active', value: true }, { label: 'Inactive', value: false }]} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}><Form.Item name="description" label="Description"><Input placeholder="Brief purpose" /></Form.Item></Col>
                    </Row>
                    <Divider orientation="left">Template Components</Divider>
                    <Form.List name="items">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} style={{ background: '#fafafa', padding: 12, borderRadius: 8, marginBottom: 12, border: '1px solid #f0f0f0' }}>
                                        <Row gutter={12}>
                                            <Col span={9}>
                                                <Form.Item {...restField} name={[name, 'work_item_type_id']} rules={[{ required: true }]} label={<span style={{ fontSize: 12 }}>Work Type</span>}>
                                                    <Select placeholder="Select Type" showSearch optionFilterProp="children" onChange={(val) => {
                                                        const type = workItemTypes.find(t => t.id === val);
                                                        if (type) {
                                                            const currentItems = templateForm.getFieldValue('items');
                                                            currentItems[name].unit = type.uom;
                                                            currentItems[name].description = type.description || '';
                                                            templateForm.setFieldsValue({ items: currentItems });
                                                        }
                                                    }}
                                                        dropdownRender={(menu) => (
                                                            <>
                                                                {menu}
                                                                <Divider style={{ margin: '4px 0' }} />
                                                                <Button type="text" icon={<PlusOutlined />} onClick={() => setIsTypeModalVisible(true)} block style={{ textAlign: 'left', color: '#14b8a6' }}>Add New Type</Button>
                                                            </>
                                                        )}>
                                                        {workItemTypes.map(t => <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>)}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={6}>
                                                <Form.Item {...restField} name={[name, 'item_type']} initialValue="labour" label={<span style={{ fontSize: 12 }}>Category</span>}>
                                                    <Select><Select.Option value="labour">Labour</Select.Option><Select.Option value="contract">Contract</Select.Option><Select.Option value="material">Material</Select.Option></Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={6}>
                                                <Form.Item {...restField} name={[name, 'unit']} label={<span style={{ fontSize: 12 }}>Unit</span>}>
                                                    <Select placeholder="Unit" showSearch optionFilterProp="children">{units.map((u: any) => <Select.Option key={u.id} value={u.code}>{u.name} ({u.code})</Select.Option>)}</Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={3} style={{ textAlign: 'right', paddingTop: 32 }}><DeleteOutlined onClick={() => remove(name)} style={{ color: 'red' }} /></Col>
                                        </Row>
                                        <Row gutter={12}>
                                            <Col span={24}><Form.Item {...restField} name={[name, 'description']} label={<span style={{ fontSize: 12 }}>Custom Description / Spec for this Template</span>} style={{ marginBottom: 0 }}><Input placeholder="Specific details for this template" /></Form.Item></Col>
                                        </Row>
                                    </div>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Work Component</Button>
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal>

            {/* WORK ITEM TYPE MODAL */}
            <Modal
                title={editingType ? 'Edit Work Item' : 'New Standard Work Item'}
                open={isTypeModalVisible}
                onOk={handleSaveType}
                onCancel={() => { setIsTypeModalVisible(false); setEditingType(null); }}
                zIndex={1200}
            >
                <Form form={typeForm} layout="vertical">
                    <Form.Item name="name" label="Item Name" rules={[{ required: true }]}><Input placeholder="e.g. Diaphragm Wall Exc." /></Form.Item>
                    <Form.Item name="code" label="Code (Optional)"><Input placeholder="e.g. DWE" /></Form.Item>
                    <Form.Item name="uom" label="Default UOM" rules={[{ required: true }]}>
                        <Select placeholder="Select UOM" showSearch optionFilterProp="children">{units.map((u: any) => <Select.Option key={u.id} value={u.code}>{u.name} ({u.code})</Select.Option>)}</Select>
                    </Form.Item>
                    <Form.Item name="is_active" label="Status" initialValue={true}>
                        <Select options={[{ label: 'Active', value: true }, { label: 'Inactive', value: false }]} />
                    </Form.Item>
                    <Form.Item name="description" label="General Description"><TextArea rows={3} /></Form.Item>
                </Form>
            </Modal>
        </PageContainer>
    )
}

export default WorkMaster
