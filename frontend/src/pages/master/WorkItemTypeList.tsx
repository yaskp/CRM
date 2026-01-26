
import { useState, useEffect } from 'react'
import { Card, Table, Button, Input, Modal, Form, message, Popconfirm, Tag, Tooltip, Select } from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ContainerOutlined
} from '@ant-design/icons'
import { workItemTypeService } from '../../services/api/workItemTypes'
import { unitService } from '../../services/api/units'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { theme } from '../../styles/theme'

const { TextArea } = Input

const WorkItemTypeList = () => {
    const [loading, setLoading] = useState(false)
    const [types, setTypes] = useState<any[]>([])
    const [units, setUnits] = useState<any[]>([])
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [editingType, setEditingType] = useState<any>(null)
    const [searchText, setSearchText] = useState('')
    const [form] = Form.useForm()

    useEffect(() => {
        fetchTypes()
        fetchUnits()
    }, [])

    const fetchUnits = async () => {
        try {
            const response = await unitService.getUnits()
            // Assuming simplified response or standard response
            setUnits(response.units || response.data || [])
        } catch (error) {
            console.error("Failed to fetch units", error)
        }
    }

    const fetchTypes = async () => {
        setLoading(true)
        try {
            const response = await workItemTypeService.getWorkItemTypes()
            setTypes(response.data || [])
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
        } catch (error) {
            // Validation failed
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

    const filteredTypes = types.filter(t =>
        t.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (t.code && t.code.toLowerCase().includes(searchText.toLowerCase()))
    )

    return (
        <PageContainer>
            <PageHeader
                title="Work Item Types"
                subtitle="Manage standardized work items for Work Orders"
                icon={<ContainerOutlined />}
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                        setEditingType(null)
                        form.resetFields()
                        setIsModalVisible(true)
                    }}>
                        Add New Type
                    </Button>
                }
            />

            <Card style={{ marginTop: 24 }}>
                <div style={{ marginBottom: 16 }}>
                    <Input
                        placeholder="Search types..."
                        prefix={<SearchOutlined />}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                    />
                </div>
                <Table
                    columns={columns}
                    dataSource={filteredTypes}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
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
                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <TextArea rows={3} />
                    </Form.Item>
                    <Form.Item
                        name="is_active"
                        label="Status"
                        valuePropName="checked"
                        initialValue={true}
                    >
                        <Select options={[{ label: 'Active', value: true }, { label: 'Inactive', value: false }]} />
                    </Form.Item>
                </Form>
            </Modal>
        </PageContainer>
    )
}

export default WorkItemTypeList
