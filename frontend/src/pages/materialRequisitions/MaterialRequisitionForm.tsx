import { useState, useEffect } from 'react'
import { Form, Input, Select, Button, Card, DatePicker, Table, InputNumber, message, Space, Modal } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { materialRequisitionService, MaterialRequisitionItem } from '../../services/api/materialRequisitions'
import { materialService } from '../../services/api/materials'
import { projectService } from '../../services/api/projects'
import { warehouseService } from '../../services/api/warehouses'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

interface Material {
    id: number
    name: string
    code: string
    unit: string
    category?: string
}

interface Project {
    id: number
    name: string
    code: string
}

const MaterialRequisitionForm = () => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [materials, setMaterials] = useState<Material[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [items, setItems] = useState<MaterialRequisitionItem[]>([])
    const [showAddItem, setShowAddItem] = useState(false)
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = !!id

    useEffect(() => {
        fetchMaterials()
        fetchProjects()
        if (isEdit) {
            fetchRequisition()
        }
    }, [id])

    const fetchMaterials = async () => {
        try {
            const response = await materialService.getMaterials()
            setMaterials(response.materials || [])
        } catch (error) {
            console.error('Failed to fetch materials:', error)
        }
    }

    const fetchProjects = async () => {
        try {
            const response = await projectService.getProjects()
            setProjects(response.projects || [])
        } catch (error) {
            console.error('Failed to fetch projects:', error)
        }
    }

    const fetchRequisition = async () => {
        try {
            const response = await materialRequisitionService.getRequisitionById(Number(id))
            const requisition = response.data

            form.setFieldsValue({
                project_id: requisition.project_id,
                required_date: dayjs(requisition.required_date),
                priority: requisition.priority,
                purpose: requisition.purpose,
                remarks: requisition.remarks,
            })

            setItems(requisition.items || [])
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch requisition')
        }
    }

    const handleAddItem = (values: any) => {
        const material = materials.find(m => m.id === values.material_id)
        if (!material) return

        const newItem: MaterialRequisitionItem = {
            material_id: values.material_id,
            requested_quantity: values.requested_quantity,
            unit: material.unit,
            estimated_rate: values.estimated_rate,
            estimated_amount: values.estimated_rate ? values.requested_quantity * values.estimated_rate : undefined,
            specification: values.specification,
            remarks: values.remarks,
            material: material,
        }

        setItems([...items, newItem])
        setShowAddItem(false)
        form.resetFields(['material_id', 'requested_quantity', 'estimated_rate', 'specification', 'item_remarks'])
    }

    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index)
        setItems(newItems)
    }

    const onFinish = async (values: any) => {
        if (items.length === 0) {
            message.error('Please add at least one material item')
            return
        }

        setLoading(true)
        try {
            const data = {
                project_id: values.project_id,
                required_date: values.required_date.format('YYYY-MM-DD'),
                priority: values.priority,
                purpose: values.purpose,
                remarks: values.remarks,
                items: items.map(item => ({
                    material_id: item.material_id,
                    requested_quantity: item.requested_quantity,
                    unit: item.unit,
                    estimated_rate: item.estimated_rate,
                    specification: item.specification,
                    remarks: item.remarks,
                })),
            }

            if (isEdit) {
                await materialRequisitionService.updateRequisition(Number(id), data)
                message.success('Requisition updated successfully')
            } else {
                await materialRequisitionService.createRequisition(data)
                message.success('Requisition created successfully')
            }

            navigate('/material-requisitions')
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to save requisition')
        } finally {
            setLoading(false)
        }
    }

    const itemColumns = [
        {
            title: 'Material',
            dataIndex: ['material', 'name'],
            key: 'material',
            width: 200,
        },
        {
            title: 'Code',
            dataIndex: ['material', 'code'],
            key: 'code',
            width: 100,
        },
        {
            title: 'Quantity',
            dataIndex: 'requested_quantity',
            key: 'quantity',
            width: 100,
        },
        {
            title: 'Unit',
            dataIndex: 'unit',
            key: 'unit',
            width: 80,
        },
        {
            title: 'Est. Rate',
            dataIndex: 'estimated_rate',
            key: 'rate',
            width: 100,
            render: (rate: number) => rate ? `₹${rate.toFixed(2)}` : '-',
        },
        {
            title: 'Est. Amount',
            dataIndex: 'estimated_amount',
            key: 'amount',
            width: 120,
            render: (amount: number) => amount ? `₹${amount.toFixed(2)}` : '-',
        },
        {
            title: 'Specification',
            dataIndex: 'specification',
            key: 'specification',
            width: 150,
            ellipsis: true,
        },
        {
            title: 'Action',
            key: 'action',
            width: 80,
            render: (_: any, __: any, index: number) => (
                <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveItem(index)}
                />
            ),
        },
    ]

    return (
        <div>
            <h2>{isEdit ? 'Edit' : 'Create'} Material Requisition</h2>

            <Card>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                        priority: 'medium',
                        required_date: dayjs().add(7, 'days'),
                    }}
                >
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Project"
                                name="project_id"
                                rules={[{ required: true, message: 'Please select project' }]}
                            >
                                <Select placeholder="Select project" showSearch optionFilterProp="children">
                                    {projects.map(project => (
                                        <Option key={project.id} value={project.id}>
                                            {project.name} ({project.project_code || project.code})
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="From Warehouse"
                                name="from_warehouse_id"
                                rules={[{ required: true, message: 'Please select warehouse' }]}
                            >
                                <Select placeholder="Select warehouse" showSearch optionFilterProp="children">
                                    {/* Warehouses will be loaded */}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Required Date"
                                name="required_date"
                            >
                                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ marginTop: '24px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3>Material Items</h3>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setShowAddItem(true)}
                            >
                                Add Material
                            </Button>
                        </div>

                        <Table
                            columns={itemColumns}
                            dataSource={items}
                            rowKey={(record, index) => `item-${index}`}
                            pagination={false}
                            scroll={{ x: 900 }}
                            locale={{ emptyText: 'No materials added yet' }}
                        />
                    </div>

                    <Form.Item style={{ marginTop: '24px' }}>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                {isEdit ? 'Update' : 'Create'} Requisition
                            </Button>
                            <Button onClick={() => navigate('/material-requisitions')}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

            {/* Add Material Modal */}
            <Modal
                title="Add Material"
                open={showAddItem}
                onCancel={() => setShowAddItem(false)}
                footer={null}
                width={600}
            >
                <Form layout="vertical" onFinish={handleAddItem}>
                    <Form.Item
                        label="Material"
                        name="material_id"
                        rules={[{ required: true, message: 'Please select material' }]}
                    >
                        <Select
                            placeholder="Select material"
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option: any) =>
                                option.children.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {materials.map(material => (
                                <Option key={material.id} value={material.id}>
                                    {material.name} ({material.code}) - {material.unit}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item
                            label="Quantity"
                            name="requested_quantity"
                            rules={[
                                { required: true, message: 'Please enter quantity' },
                                { type: 'number', min: 0.01, message: 'Quantity must be greater than 0' },
                            ]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                placeholder="Enter quantity"
                                min={0.01}
                                step={0.01}
                            />
                        </Form.Item>

                        <Form.Item label="Estimated Rate (₹)" name="estimated_rate">
                            <InputNumber
                                style={{ width: '100%' }}
                                placeholder="Enter rate"
                                min={0}
                                step={0.01}
                                prefix="₹"
                            />
                        </Form.Item>
                    </div>

                    <Form.Item label="Specification" name="specification">
                        <TextArea rows={2} placeholder="Material specifications (optional)" />
                    </Form.Item>

                    <Form.Item label="Remarks" name="item_remarks">
                        <TextArea rows={2} placeholder="Item remarks (optional)" />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                Add Material
                            </Button>
                            <Button onClick={() => setShowAddItem(false)}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default MaterialRequisitionForm
