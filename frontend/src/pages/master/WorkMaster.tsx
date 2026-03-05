
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
                workItemTypeService.getWorkItemTypes({ limit: 1000, is_active: true }), // Only active items in dropdowns
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

    const handleDeleteType = async (record: any) => {
        try {
            const result = await workItemTypeService.deleteWorkItemType(record.id)
            message.success(result.message || 'Deleted successfully')
            fetchWorkItemTypes()
            fetchDropdownData()
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to delete')
        }
    }

    // --- TEMPLATE HANDLERS ---
    const handleSaveTemplate = async () => {
        try {
            const values = await templateForm.validateFields()
            const payload = {
                ...values,
                items: values.items?.map((it: any) => ({
                    work_item_type_id: it.work_item_type_id,        // Primary type stored here
                    parent_work_item_type_id: null,                  // No sub-type in template
                    item_type: it.item_type || 'labour',
                    description: it.description,
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
        {
            title: 'Name', dataIndex: 'name', key: 'name',
            ellipsis: { showTitle: false },
            sorter: (a: any, b: any) => a.name.localeCompare(b.name),
            render: (text: string) => <Tooltip title={text}><span>{text}</span></Tooltip>
        },
        {
            title: 'Code', dataIndex: 'code', key: 'code',
            render: (text: string) => text ? <Tooltip title={text}><Tag>{text}</Tag></Tooltip> : '-'
        },
        {
            title: 'Primary Work Type',
            dataIndex: 'parent_id',
            key: 'parent_id',
            width: '30%',
            ellipsis: { showTitle: false },
            render: (parentId: number) => {
                const parent = allWorkItemTypes.find(t => t.id === parentId);
                return parent ? (
                    <Tooltip title={parent.name}>
                        <Tag color="blue" style={{ whiteSpace: 'normal', height: 'auto', padding: '4px 8px' }}>
                            {parent.name}
                        </Tag>
                    </Tooltip>
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
        {
            title: 'Description', dataIndex: 'description', key: 'description',
            ellipsis: { showTitle: false },
            render: (text: string) => <Tooltip title={text || '-'}><span style={{ display: 'block', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text || '-'}</span></Tooltip>
        },
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
                    <Tooltip title="Delete permanently">
                        <Popconfirm
                            title="Delete Work Item Type?"
                            description={
                                <span>
                                    This will <strong>permanently delete</strong> this item.
                                    {!record.parent_id && <><br /><span style={{ color: '#f5222d' }}>⚠ All sub-types will also be deleted.</span></>}
                                </span>
                            }
                            onConfirm={() => handleDeleteType(record)}
                            okText="Delete"
                            okButtonProps={{ danger: true }}
                            cancelText="Cancel"
                        >
                            <Button icon={<DeleteOutlined />} danger />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            )
        }
    ]

    const templateColumns = [
        {
            title: 'Template Name', dataIndex: 'name', key: 'name',
            ellipsis: { showTitle: false },
            sorter: (a: any, b: any) => a.name.localeCompare(b.name),
            render: (text: string) => <Tooltip title={text}><span>{text}</span></Tooltip>
        },
        {
            title: 'Description', dataIndex: 'description', key: 'description',
            ellipsis: { showTitle: false },
            render: (text: string) => text
                ? <Tooltip title={text}><span style={{ display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span></Tooltip>
                : <span style={{ color: '#ccc' }}>-</span>
        },
        {
            title: 'Work Type',
            key: 'work_type',
            width: '25%',
            render: (_: any, record: any) => {
                // Show unique primary work types used across all items in this template
                const primaryTypeIds = [...new Set((record.items || []).map((it: any) => it.work_item_type_id).filter(Boolean))];
                const primaryTypes = primaryTypeIds.map(id => allWorkItemTypes.find((t: any) => t.id === id)).filter(Boolean);
                if (primaryTypes.length === 0) return <span style={{ color: '#aaa' }}>-</span>;
                const tooltipText = primaryTypes.map((t: any) => t.name).join(', ');
                return (
                    <Tooltip title={tooltipText}>
                        <Space size={4} wrap>
                            {primaryTypes.slice(0, 2).map((t: any) => (
                                <Tag key={t.id} color="blue" style={{ marginBottom: 2 }}>{t.name}</Tag>
                            ))}
                            {primaryTypes.length > 2 && <Tag color="default">+{primaryTypes.length - 2} more</Tag>}
                        </Space>
                    </Tooltip>
                );
            }
        },
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
                                    work_item_type_id: it.work_item_type_id,  // Primary type ID
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
                    <Space wrap>
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
                            style={{ width: window.innerWidth < 576 ? '100%' : 'auto' }}
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
                                        style={{ width: window.innerWidth < 576 ? '100%' : 300 }}
                                    />
                                </div>
                                <Table
                                    columns={templateColumns}
                                    dataSource={templates}
                                    rowKey="id"
                                    loading={loading}
                                    scroll={{ x: 800, y: 'calc(100vh - 380px)' }}
                                    pagination={{
                                        ...templatePagination,
                                        showSizeChanger: true,
                                        pageSizeOptions: ['10', '20', '50', '100'],
                                        showTotal: (total, range) => <b>Total Rows: {total} | Rows: {range[0]} - {range[1]}</b>
                                    }}
                                    onChange={(p) => setTemplatePagination(prev => ({
                                        ...prev,
                                        current: p.current || 1,
                                        pageSize: p.pageSize || 10
                                    }))}
                                    style={{ border: '1px solid #f0f0f0', borderRadius: 8 }}
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
                                        style={{ width: window.innerWidth < 576 ? '100%' : 300 }}
                                    />
                                </div>
                                <Table
                                    columns={typeColumns}
                                    dataSource={workItemTypes}
                                    rowKey="id"
                                    loading={loading}
                                    scroll={{ x: 1000, y: 'calc(100vh - 380px)' }}
                                    pagination={{
                                        ...typePagination,
                                        showSizeChanger: true,
                                        pageSizeOptions: ['10', '20', '50', '100'],
                                        showTotal: (total, range) => <b>Total Rows: {total} | Rows: {range[0]} - {range[1]}</b>
                                    }}
                                    onChange={(p) => setTypePagination(prev => ({
                                        ...prev,
                                        current: p.current || 1,
                                        pageSize: p.pageSize || 10
                                    }))}
                                    style={{ border: '1px solid #f0f0f0', borderRadius: 8 }}
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
                style={{ top: 20, maxWidth: '98vw' }}
                centered
            >
                <Form form={templateForm} layout="vertical">
                    <Row gutter={16}>
                        <Col xs={24} md={12}><Form.Item name="name" label="Template Name" rules={[{ required: true }]}><Input placeholder="e.g. D-Wall Package" /></Form.Item></Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="is_active" label="Status" initialValue={true}>
                                <Select options={[{ label: 'Active', value: true }, { label: 'Inactive', value: false }]} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col xs={24}><Form.Item name="description" label="Description"><Input placeholder="Brief purpose of this template" /></Form.Item></Col>
                    </Row>
                    <Divider orientation="left">Template Components</Divider>
                    <div style={{ marginBottom: 8, padding: '6px 12px', background: '#f0f9ff', borderRadius: 6, fontSize: 12, color: '#0369a1' }}>
                        💡 Add the <strong>main work activities</strong> this template covers (Primary types only). Engineers will select the specific sub-type (e.g. wall thickness) when recording DPRs or creating quotations.
                    </div>
                    <Form.List name="items">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} style={{ background: '#fafafa', padding: 12, borderRadius: 8, marginBottom: 12, border: '1px solid #e8e8e8' }}>
                                        <Row gutter={[12, 12]} align="middle">
                                            <Col xs={24} md={8}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'work_item_type_id']}
                                                    rules={[{ required: true, message: 'Select work type' }]}
                                                    label={<span style={{ fontSize: 12, fontWeight: 500 }}>Main Work Type</span>}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <Select
                                                        placeholder="Select primary work type"
                                                        showSearch
                                                        optionFilterProp="label"
                                                        onChange={(val) => {
                                                            const type = allWorkItemTypes.find(t => t.id === val);
                                                            if (type) {
                                                                const currentItems = templateForm.getFieldValue('items');
                                                                if (type.uom) currentItems[name].unit = type.uom;
                                                                // Auto-populate description from master work item
                                                                if (!currentItems[name].description) {
                                                                    currentItems[name].description = type.description || type.name;
                                                                }
                                                                templateForm.setFieldsValue({ items: currentItems });
                                                            }
                                                        }}
                                                        popupRender={(menu) => (
                                                            <>
                                                                {menu}
                                                                <Divider style={{ margin: '4px 0' }} />
                                                                <Button type="text" icon={<PlusOutlined />} onClick={() => { typeForm.resetFields(); typeForm.setFieldsValue({ category_level: 'primary' }); setIsTypeModalVisible(true); }} block style={{ textAlign: 'left', color: '#14b8a6' }}>
                                                                    Add New Primary Type
                                                                </Button>
                                                            </>
                                                        )}
                                                    >
                                                        {allWorkItemTypes.filter(t => !t.parent_id).map(t => (
                                                            <Select.Option key={t.id} value={t.id} label={`${t.name} ${t.code || ''}`}>
                                                                <span>{t.name}</span>
                                                                {t.code && <span style={{ fontSize: 11, color: '#999', marginLeft: 6 }}>({t.code})</span>}
                                                            </Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={4}>
                                                <Form.Item {...restField} name={[name, 'item_type']} initialValue="labour" label={<span style={{ fontSize: 12 }}>Category</span>} style={{ marginBottom: 0 }}>
                                                    <Select>
                                                        <Select.Option value="labour">Labour</Select.Option>
                                                        <Select.Option value="contract">Contract</Select.Option>
                                                        <Select.Option value="material">Material</Select.Option>
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col xs={20} md={3}>
                                                <Form.Item {...restField} name={[name, 'unit']} label={<span style={{ fontSize: 12 }}>Unit</span>} style={{ marginBottom: 0 }}>
                                                    <Select placeholder="Unit" showSearch optionFilterProp="children">
                                                        {units.map((u: any) => <Select.Option key={u.id} value={u.code}>{u.code}</Select.Option>)}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col xs={4} md={1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: 28 }}>
                                                <Tooltip title="Remove">
                                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                                </Tooltip>
                                            </Col>
                                        </Row>
                                        <Row gutter={12} style={{ marginTop: 10 }}>
                                            <Col span={24}>
                                                <Form.Item {...restField} name={[name, 'description']} label={<span style={{ fontSize: 12 }}>Description / Scope Note <span style={{ color: '#aaa', fontWeight: 400 }}>(auto-filled, editable)</span></span>} style={{ marginBottom: 0 }}>
                                                    <Input placeholder="e.g. Excavation of diaphragm wall panels by Grab method" />
                                                </Form.Item>
                                            </Col>
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
