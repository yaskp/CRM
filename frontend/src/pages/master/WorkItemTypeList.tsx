import { useState, useEffect } from 'react'
import { Card, Table, Button, Input, Modal, Form, message, Popconfirm, Tag, Tooltip, Select, Space, Typography } from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ContainerOutlined,
    UploadOutlined
} from '@ant-design/icons'
import { workItemTypeService } from '../../services/api/workItemTypes'
import { unitService } from '../../services/api/units'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { theme } from '../../styles/theme'
import CSVImportModal from '../../components/common/CSVImportModal'

const { TextArea } = Input
const { Text } = Typography


const WorkItemTypeList = () => {
    const [loading, setLoading] = useState(false)
    const [types, setTypes] = useState<any[]>([])
    const [units, setUnits] = useState<any[]>([])
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [importModalVisible, setImportModalVisible] = useState(false)
    const [editingType, setEditingType] = useState<any>(null)
    const [searchText, setSearchText] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [total, setTotal] = useState(0)
    const [form] = Form.useForm()

    useEffect(() => {
        fetchTypes(currentPage, pageSize)
        fetchUnits()
    }, [currentPage, pageSize, searchText])

    const fetchUnits = async () => {
        try {
            const response = await unitService.getUnits({ limit: 100 })
            setUnits(response.units || response.data || [])
        } catch (error) {
            console.error("Failed to fetch units", error)
        }
    }

    const fetchTypes = async (page = currentPage, limit = pageSize) => {
        setLoading(true)
        try {
            const response = await workItemTypeService.getWorkItemTypes({ search: searchText, page, limit })
            setTypes(response.data || [])
            setTotal(response.pagination?.total || 0)
        } catch (error) {
            message.error('Failed to fetch work item types')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (record: any) => {
        setEditingType(record)
        form.setFieldsValue(record)
        setIsModalVisible(true)
    }

    const toggleStatus = async (record: any) => {
        try {
            await workItemTypeService.updateWorkItemType(record.id, {
                ...record,
                is_active: !record.is_active
            })
            message.success(record.is_active ? 'Deactivated' : 'Activated')
            fetchTypes()
        } catch (error) {
            message.error('Operation failed')
        }
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            if (editingType) {
                await workItemTypeService.updateWorkItemType(editingType.id, values)
                message.success('Updated successfully')
            } else {
                await workItemTypeService.createWorkItemType(values)
                message.success('Created successfully')
            }
            setIsModalVisible(false)
            fetchTypes()
        } catch (error: any) {
            if (error?.errorFields && error.errorFields.length > 0) {
                message.error(error.errorFields[0].errors[0]);
                return;
            }
            message.error(error.response?.data?.message || 'Operation failed')
        }
    }

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a: any, b: any) => a.name.localeCompare(b.name),
        },
        {
            title: 'Code',
            dataIndex: 'code',
            key: 'code',
            render: (text: string) => text ? <Tag>{text}</Tag> : '-'
        },
        {
            title: 'Sub-Category Of',
            dataIndex: 'parent_id',
            key: 'parent_id',
            render: (parentId: number) => {
                const parent = types.find(t => t.id === parentId);
                return parent ? <Tag color="blue">{parent.name}</Tag> : <Text type="secondary">Primary Category</Text>
            }
        },
        {
            title: 'UOM',
            dataIndex: 'uom',
            key: 'uom',
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (active: boolean) => (
                <Tag color={active ? 'green' : 'red'}>
                    {active ? 'Active' : 'Inactive'}
                </Tag>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_: any, record: any) => (
                <>
                    <Tooltip title="Edit">
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                            style={{ marginRight: 8, color: theme.colors.primary.main, borderColor: theme.colors.primary.main }}
                        />
                    </Tooltip>
                    <Tooltip title={record.is_active ? "Deactivate" : "Activate"}>
                        <Popconfirm
                            title={record.is_active ? "Deactivate this item?" : "Activate this item?"}
                            onConfirm={() => toggleStatus(record)}
                        >
                            <Button
                                icon={record.is_active ? <DeleteOutlined /> : <PlusOutlined />}
                                danger={record.is_active}
                                style={!record.is_active ? { color: 'green', borderColor: 'green' } : {}}
                            />
                        </Popconfirm>
                    </Tooltip>
                </>
            ),
        },
    ]

    const importColumns = [
        { title: 'Name', dataIndex: 'name', key: 'name', required: true },
        { title: 'Code', dataIndex: 'code', key: 'code' },
        { title: 'Parent Category ID', dataIndex: 'parent_id', key: 'parent_id' },
        { title: 'UOM', dataIndex: 'uom', key: 'uom', required: true },
        { title: 'Description', dataIndex: 'description', key: 'description' },
    ]

    const templateData = [
        { name: 'Diaphragm Wall', code: 'DW', parent_id: '', uom: 'SQM', description: 'Main category' },
        { name: 'Guide Wall', code: 'GW', parent_id: '1', uom: 'RMT', description: 'Construction of guide wall' },
        { name: 'D-Wall Excavation', code: 'DWE', parent_id: '1', uom: 'SQM', description: 'Excavation of diaphragm wall panels' },
    ]

    return (
        <PageContainer>
            <PageHeader
                title="Work Item Types"
                subtitle="Manage standardized work items for Work Orders"
                icon={<ContainerOutlined />}
                extra={
                    <Space>
                        <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>
                            Import CSV
                        </Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                            setEditingType(null)
                            form.resetFields()
                            setIsModalVisible(true)
                        }}>
                            Add New Type
                        </Button>
                    </Space>
                }
            />

            <Card style={{ marginTop: 24 }}>
                <div style={{ marginBottom: 16 }}>
                    <Input
                        placeholder="Search types..."
                        prefix={<SearchOutlined />}
                        onChange={e => {
                            setSearchText(e.target.value)
                            setCurrentPage(1)
                        }}
                        style={{ width: 300 }}
                    />
                </div>
                <Table
                    columns={columns}
                    dataSource={types}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: total,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} Work Item Types`,
                        onChange: (page, size) => {
                            setCurrentPage(page)
                            setPageSize(size)
                        }
                    }}
                />
            </Card>

            <Modal
                title={editingType ? 'Edit Work Item Type' : 'Create Work Item Type'}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{ required: true, message: 'Please enter name' }]}
                    >
                        <Input placeholder="e.g. Guide Wall" />
                    </Form.Item>
                    <Form.Item name="parent_id" label="Parent Category (Optional)">
                        <Select placeholder="Select Parent Category if sub-type" showSearch optionFilterProp="children" allowClear>
                            {types.filter(t => !t.parent_id).map((t: any) => (
                                <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
                            ))}
                        </Select>
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
                            {Array.isArray(units) ? units.map((unit: any) => (
                                <Select.Option key={unit.id} value={unit.code}>
                                    {unit.name} ({unit.code})
                                </Select.Option>
                            )) : null}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <TextArea rows={3} />
                    </Form.Item>
                    <Form.Item
                        name="is_active"
                        label="Status"
                        initialValue={true}
                    >
                        <Select options={[{ label: 'Active', value: true }, { label: 'Inactive', value: false }]} />
                    </Form.Item>
                </Form>
            </Modal>

            <CSVImportModal
                visible={importModalVisible}
                onCancel={() => setImportModalVisible(false)}
                onSuccess={() => fetchTypes()}
                title="Work Item Types"
                apiEndpoint="http://localhost:5000/api/work-item-types/import"
                columns={importColumns}
                templateData={templateData}
            />
        </PageContainer>
    )
}

export default WorkItemTypeList
