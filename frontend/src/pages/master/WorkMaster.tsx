
import { useState, useEffect } from 'react'
import { Card, Table, Button, Input, Modal, Form, message, Tag, Tooltip, Select, Space, Row, Col, Divider, Tabs, Popconfirm, Radio } from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    LayoutOutlined,
    FileTextOutlined,
    UploadOutlined,
} from '@ant-design/icons'
import { workTemplateService } from '../../services/api/workTemplates'
import { workItemTypeService } from '../../services/api/workItemTypes'
import { unitService } from '../../services/api/units'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import CSVImportModal from '../../components/common/CSVImportModal'

const { TextArea } = Input

const WorkMaster = () => {
    const [activeTab, setActiveTab] = useState('templates')
    const [loading, setLoading] = useState(false)
    const [templates, setTemplates] = useState<any[]>([])
    const [workItemTypes, setWorkItemTypes] = useState<any[]>([])
    const [units, setUnits] = useState<any[]>([])
    const [searchText, setSearchText] = useState('')
    const [allWorkItemTypes, setAllWorkItemTypes] = useState<any[]>([]) // For legacy dropdowns
    const [templatePagination, setTemplatePagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    })
    const [typePagination, setTypePagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    })

    // Template Modal State
    const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<any>(null)
    const [templateForm] = Form.useForm()

    // Work Item Type Modal State (Used for both Tab and Inner Template Add)
    const [isTypeModalVisible, setIsTypeModalVisible] = useState(false)
    const [editingType, setEditingType] = useState<any>(null)
    const [typeForm] = Form.useForm()
    const [importModalVisible, setImportModalVisible] = useState(false)

    useEffect(() => {
        fetchDropdownData()
    }, [])

    useEffect(() => {
        fetchTemplates()
    }, [templatePagination.current, templatePagination.pageSize, searchText, activeTab])

    useEffect(() => {
        fetchWorkItemTypes()
    }, [typePagination.current, typePagination.pageSize, searchText, activeTab])

    const fetchDropdownData = async () => {
        try {
            const [typesRes, unitsRes] = await Promise.all([
                workItemTypeService.getWorkItemTypes({ limit: 1000 }),
                unitService.getUnits({ limit: 1000 })
            ])
            setAllWorkItemTypes(typesRes.data || [])
            setUnits(unitsRes.units || unitsRes.data || [])
        } catch (error) {
            console.error('Failed to fetch dropdown data', error)
        }
    }

    const fetchTemplates = async () => {
        if (activeTab !== 'templates') return
        setLoading(true)
        try {
            const res = await workTemplateService.getTemplates({
                page: templatePagination.current,
                limit: templatePagination.pageSize,
                search: searchText
            })
            setTemplates(res.templates || [])
            setTemplatePagination(prev => ({ ...prev, total: res.pagination?.total || 0 }))
        } catch (error) {
            message.error('Failed to fetch templates')
        } finally {
            setLoading(false)
        }
    }

    const fetchWorkItemTypes = async () => {
        if (activeTab !== 'items') return
        setLoading(true)
        try {
            const res = await workItemTypeService.getWorkItemTypes({
                page: typePagination.current,
                limit: typePagination.pageSize,
                search: searchText
            })
            setWorkItemTypes(res.data || [])
            setTypePagination(prev => ({ ...prev, total: res.pagination?.total || 0 }))
        } catch (error) {
            message.error('Failed to fetch work items')
        } finally {
            setLoading(false)
        }
    }

    // --- WORK ITEM TYPE HANDLERS ---
    const handleSaveType = async () => {
        try {
            const values = await typeForm.validateFields()
            const payload = { ...values }
            if (payload.category_level === 'primary') {
                payload.parent_id = null;
            }
            delete payload.category_level;

            if (editingType) {
                await workItemTypeService.updateWorkItemType(editingType.id, payload)
                message.success('Work item type updated')
            } else {
                await workItemTypeService.createWorkItemType(values)
                message.success('Work item type created')
            }
            setIsTypeModalVisible(false)
            setEditingType(null)
            typeForm.resetFields()
            fetchWorkItemTypes()
            fetchDropdownData() // Refresh dropdown list too
        } catch (error: any) {
            if (error?.errorFields && error.errorFields.length > 0) {
                message.error(error.errorFields[0].errors[0]);
                return;
            }
            message.error(error.response?.data?.message || 'Failed to save work item type')
        }
    }

    const handleToggleTypeStatus = async (record: any) => {
        try {
            await workItemTypeService.updateWorkItemType(record.id, {
                ...record,
                is_active: !record.is_active
            })
            message.success(record.is_active ? 'Item deactivated' : 'Item activated')
            fetchWorkItemTypes()
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
            fetchTemplates()
        } catch (error: any) {
            if (error?.errorFields && error.errorFields.length > 0) {
                message.error(error.errorFields[0].errors[0]);
                return;
            }
            message.error(error.response?.data?.message || 'Failed to save template')
        }
    }

    const handleToggleTemplateStatus = async (record: any) => {
        try {
            await workTemplateService.updateTemplate(record.id, {
                ...record,
                is_active: !record.is_active
            })
            message.success(record.is_active ? 'Template deactivated' : 'Template activated')
            fetchTemplates()
        } catch (error) {
            message.error('Operation failed')
        }
    }

    // --- COLUMNS ---
    const typeColumns = [
        { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a: any, b: any) => a.name.localeCompare(b.name) },
        { title: 'Code', dataIndex: 'code', key: 'code', render: (text: string) => text ? <Tag>{text}</Tag> : '-' },
        {
            title: 'Primary Work Type',
            dataIndex: 'parent_id',
            key: 'parent_id',
            width: '30%',
            render: (parentId: number) => {
                const parent = allWorkItemTypes.find(t => t.id === parentId);
                return parent ? (
                    <Tag color="blue" style={{ whiteSpace: 'normal', height: 'auto', padding: '4px 8px' }}>
                        {parent.name}
                    </Tag>
                ) : (
                    <span style={{ color: '#8c8c8c' }}>Primary Work Type</span>
                );
            }
        },
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
                            typeForm.setFieldsValue({
                                ...record,
                                category_level: record.parent_id ? 'sub' : 'primary'
                            })
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
                                    parent_work_item_type_id: it.parent_work_item_type_id || it.workItemType?.parent_id,
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



    return (
        <PageContainer>
            <PageHeader
                title="Work Master"
                subtitle="Manage standardized work items and multi-item templates for Quotations"
                icon={<LayoutOutlined />}
                extra={
                    <Space>
                        {activeTab === 'items' && (
                            <Button
                                icon={<UploadOutlined />}
                                onClick={() => setImportModalVisible(true)}
                            >
                                Import CSV
                            </Button>
                        )}
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
                                    typeForm.setFieldsValue({ category_level: 'primary' })
                                    setIsTypeModalVisible(true)
                                }
                            }}
                        >
                            {activeTab === 'templates' ? 'Add New Template' : 'Add New Work Item'}
                        </Button>
                    </Space>
                }
            />

            <Tabs
                activeKey={activeTab}
                onChange={(key) => {
                    setActiveTab(key)
                    setSearchText('') // Clear search when switching tabs
                }}
                items={[
                    {
                        key: 'templates',
                        label: <span><LayoutOutlined /> Work Templates</span>,
                        children: (
                            <Card style={{ marginTop: 16 }}>
                                <div style={{ marginBottom: 16 }}>
                                    <Input
                                        placeholder="Search templates..."
                                        prefix={<SearchOutlined />}
                                        value={searchText}
                                        onChange={e => {
                                            setSearchText(e.target.value)
                                            setTemplatePagination(prev => ({ ...prev, current: 1 }))
                                        }}
                                        style={{ width: 300 }}
                                    />
                                </div>
                                <Table
                                    columns={templateColumns}
                                    dataSource={templates}
                                    rowKey="id"
                                    loading={loading}
                                    pagination={templatePagination}
                                    onChange={(p) => setTemplatePagination(prev => ({
                                        ...prev,
                                        current: p.current || 1,
                                        pageSize: p.pageSize || 10
                                    }))}
                                />
                            </Card>
                        )
                    },
                    {
                        key: 'items',
                        label: <span><FileTextOutlined /> Standard Work Items</span>,
                        children: (
                            <Card style={{ marginTop: 16 }}>
                                <div style={{ marginBottom: 16 }}>
                                    <Input
                                        placeholder="Search work items..."
                                        prefix={<SearchOutlined />}
                                        value={searchText}
                                        onChange={e => {
                                            setSearchText(e.target.value)
                                            setTypePagination(prev => ({ ...prev, current: 1 }))
                                        }}
                                        style={{ width: 300 }}
                                    />
                                </div>
                                <Table
                                    columns={typeColumns}
                                    dataSource={workItemTypes}
                                    rowKey="id"
                                    loading={loading}
                                    pagination={typePagination}
                                    onChange={(p) => setTypePagination(prev => ({
                                        ...prev,
                                        current: p.current || 1,
                                        pageSize: p.pageSize || 10
                                    }))}
                                />
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
                                            <Col span={6}>
                                                <Form.Item {...restField} name={[name, 'parent_work_item_type_id']} rules={[{ required: true }]} label={<span style={{ fontSize: 12 }}>Main Work Type</span>}>
                                                    <Select placeholder="Category" showSearch optionFilterProp="children" onChange={() => {
                                                        const currentItems = templateForm.getFieldValue('items');
                                                        currentItems[name].work_item_type_id = undefined;
                                                        templateForm.setFieldsValue({ items: currentItems });
                                                    }}>
                                                        {allWorkItemTypes.filter(t => !t.parent_id).map(t => <Select.Option key={t.id} value={t.id}>{t.name} ({t.code || '-'})</Select.Option>)}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={6}>
                                                <Form.Item
                                                    noStyle
                                                    shouldUpdate={(prevValues, currentValues) => {
                                                        const p1 = prevValues.items && prevValues.items[name]?.parent_work_item_type_id;
                                                        const p2 = currentValues.items && currentValues.items[name]?.parent_work_item_type_id;
                                                        return p1 !== p2;
                                                    }}
                                                >
                                                    {({ getFieldValue }) => {
                                                        const parentId = getFieldValue(['items', name, 'parent_work_item_type_id']);
                                                        const filteredItems = parentId
                                                            ? allWorkItemTypes.filter((t: any) => t.parent_id === parentId || t.id === parentId)
                                                            : allWorkItemTypes.filter((t: any) => t.parent_id);

                                                        return (
                                                            <Form.Item {...restField} name={[name, 'work_item_type_id']} rules={[{ required: true }]} label={<span style={{ fontSize: 12 }}>Sub Work Type / Spec</span>}>
                                                                <Select placeholder="Specification" showSearch optionFilterProp="children" onChange={(val) => {
                                                                    const type = allWorkItemTypes.find(t => t.id === val);
                                                                    if (type) {
                                                                        const currentItems = templateForm.getFieldValue('items');
                                                                        currentItems[name].unit = type.uom;
                                                                        templateForm.setFieldsValue({ items: currentItems });
                                                                    }
                                                                }}
                                                                    popupRender={(menu) => (
                                                                        <>
                                                                            {menu}
                                                                            <Divider style={{ margin: '4px 0' }} />
                                                                            <Button type="text" icon={<PlusOutlined />} onClick={() => { typeForm.resetFields(); typeForm.setFieldsValue({ category_level: 'primary' }); setIsTypeModalVisible(true); }} block style={{ textAlign: 'left', color: '#14b8a6' }}>Add New Type</Button>
                                                                        </>
                                                                    )}>
                                                                    {filteredItems.map((t: any) => <Select.Option key={t.id} value={t.id}>{t.name} ({t.code || '-'})</Select.Option>)}
                                                                </Select>
                                                            </Form.Item>
                                                        );
                                                    }}
                                                </Form.Item>
                                            </Col>
                                            <Col span={5}>
                                                <Form.Item {...restField} name={[name, 'item_type']} initialValue="labour" label={<span style={{ fontSize: 12 }}>Category</span>}>
                                                    <Select><Select.Option value="labour">Labour</Select.Option><Select.Option value="contract">Contract</Select.Option><Select.Option value="material">Material</Select.Option></Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={4}>
                                                <Form.Item {...restField} name={[name, 'unit']} label={<span style={{ fontSize: 12 }}>Unit</span>}>
                                                    <Select placeholder="Unit" showSearch optionFilterProp="children">{units.map((u: any) => <Select.Option key={u.id} value={u.code}>{u.code}</Select.Option>)}</Select>
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

                    <Form.Item name="category_level" label="Item Level" initialValue="primary" rules={[{ required: true }]}>
                        <Radio.Group buttonStyle="solid">
                            <Radio.Button value="primary">Primary Work Type</Radio.Button>
                            <Radio.Button value="sub">Sub Work Type</Radio.Button>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.category_level !== currentValues.category_level}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('category_level') === 'sub' ? (
                                <Form.Item
                                    name="parent_id"
                                    label="Primary Work Type"
                                    rules={[{ required: true, message: 'Please select a primary work type' }]}
                                    extra={<span style={{ fontSize: 12, color: '#8c8c8c' }}>Required for Sub Work Types. Select the main class.</span>}
                                >
                                    <Select placeholder="Select Primary Work Type" showSearch optionFilterProp="children" allowClear>
                                        {allWorkItemTypes.filter(t => !t.parent_id && t.id !== editingType?.id).map((t: any) => (
                                            <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>

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

            {/* CSV IMPORT MODAL */}
            <CSVImportModal
                visible={importModalVisible}
                onCancel={() => setImportModalVisible(false)}
                onSuccess={() => { fetchWorkItemTypes(); fetchDropdownData(); }}
                title="Work Item Types"
                apiEndpoint="http://localhost:5000/api/work-item-types/import"
                columns={[
                    { title: 'Name', dataIndex: 'name', key: 'name', required: true },
                    { title: 'Code', dataIndex: 'code', key: 'code' },
                    { title: 'Primary Work Type', dataIndex: 'parent_category', key: 'parent_category' },
                    { title: 'UOM', dataIndex: 'uom', key: 'uom', required: true },
                    { title: 'Description', dataIndex: 'description', key: 'description' },
                ]}
                templateData={[
                    { name: 'Diaphragm Wall', code: 'DW', parent_category: '', uom: 'SQM', description: 'Primary Work Type (Leave Blank)' },
                    { name: 'Guide Wall', code: 'GW', parent_category: 'Diaphragm Wall', uom: 'RMT', description: 'Sub Work Type (Provide exact Name of Primary)' },
                    { name: 'D-Wall Excavation', code: 'DWE', parent_category: 'Diaphragm Wall', uom: 'SQM', description: 'Sub Work Type (Provide exact Name of Primary)' },
                ]}
            />
        </PageContainer>
    )
}

export default WorkMaster
