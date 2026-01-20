
import { useState, useEffect } from 'react'
import { Card, Table, Button, Input, Modal, Form, message, Popconfirm, Tag, Tooltip, Select, InputNumber } from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ContainerOutlined
} from '@ant-design/icons'
import { unitService } from '../../services/api/units'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { theme } from '../../styles/theme'

const UnitList = () => {
    const [loading, setLoading] = useState(false)
    const [units, setUnits] = useState<any[]>([])
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [editingUnit, setEditingUnit] = useState<any>(null)
    const [searchText, setSearchText] = useState('')
    const [form] = Form.useForm()

    useEffect(() => {
        fetchUnits()
    }, [])

    const fetchUnits = async () => {
        setLoading(true)
        try {
            const response = await unitService.getUnits()
            setUnits(response.data || [])
        } catch (error) {
            message.error('Failed to fetch units')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (record: any) => {
        setEditingUnit(record)
        form.setFieldsValue(record)
        setIsModalVisible(true)
    }

    const handleDelete = async (id: number) => {
        try {
            await unitService.deleteUnit(id)
            message.success('Unit deleted')
            fetchUnits()
        } catch (error) {
            message.error('Failed to delete unit')
        }
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            if (editingUnit) {
                await unitService.updateUnit(editingUnit.id, values)
                message.success('Updated successfully')
            } else {
                await unitService.createUnit(values)
                message.success('Created successfully')
            }
            setIsModalVisible(false)
            fetchUnits()
        } catch (error) {
            // Validation failed
        }
    }

    const getBaseUnitName = (baseId: number) => {
        const base = units.find(u => u.id === baseId)
        return base ? `${base.name} (${base.code})` : '-'
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
            render: (text: string) => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'Relation (Base Unit)',
            dataIndex: 'base_unit_id',
            key: 'base_unit_id',
            render: (baseId: number) => getBaseUnitName(baseId)
        },
        {
            title: 'Conversion Factor',
            dataIndex: 'conversion_factor',
            key: 'conversion_factor',
            render: (val: number, record: any) => (
                val && record.base_unit_id ? `1 ${record.code} = ${val} ${units.find(u => u.id === record.base_unit_id)?.code || ''}` : '-'
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
                    <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record.id)}>
                        <Tooltip title="Delete">
                            <Button icon={<DeleteOutlined />} danger />
                        </Tooltip>
                    </Popconfirm>
                </>
            ),
        },
    ]

    const filteredUnits = units.filter(u =>
        u.name.toLowerCase().includes(searchText.toLowerCase()) ||
        u.code.toLowerCase().includes(searchText.toLowerCase())
    )

    return (
        <PageContainer>
            <PageHeader
                title="Unit Master"
                subtitle="Manage units of measurement for materials and services"
                icon={<ContainerOutlined />}
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                        setEditingUnit(null)
                        form.resetFields()
                        setIsModalVisible(true)
                    }}>
                        Add New Unit
                    </Button>
                }
            />

            <Card style={{ marginTop: 24 }}>
                <div style={{ marginBottom: 16 }}>
                    <Input
                        placeholder="Search units..."
                        prefix={<SearchOutlined />}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                    />
                </div>
                <Table
                    columns={columns}
                    dataSource={filteredUnits}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 15 }}
                />
            </Card>

            <Modal
                title={editingUnit ? 'Edit Unit' : 'Create Unit'}
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
                        <Input placeholder="e.g. Kilogram" />
                    </Form.Item>
                    <Form.Item
                        name="code"
                        label="Code"
                        rules={[{ required: true, message: 'Please enter code' }]}
                    >
                        <Input placeholder="e.g. KG" />
                    </Form.Item>
                    <Form.Item
                        name="base_unit_id"
                        label="Base Unit (Optional)"
                        tooltip="Select the standard unit this unit is derived from (e.g. Metric Ton -> Kilogram)"
                    >
                        <Select placeholder="Select base unit" allowClear>
                            {units
                                .filter(u => u.id !== editingUnit?.id) // Prevent selecting self
                                .map(u => (
                                    <Select.Option key={u.id} value={u.id}>
                                        {u.name} ({u.code})
                                    </Select.Option>
                                ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="conversion_factor"
                        label="Conversion Factor"
                        tooltip="How many Base Units are in 1 of this unit? (e.g. 1 MT = 1000 KG, so Factor is 1000)"
                    >
                        <InputNumber style={{ width: '100%' }} step={0.0001} min={0} />
                    </Form.Item>
                </Form>
            </Modal>
        </PageContainer>
    )
}

export default UnitList
