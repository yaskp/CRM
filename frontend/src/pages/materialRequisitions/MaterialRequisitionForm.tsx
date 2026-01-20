import { useState, useEffect } from 'react'
import { Form, Input, Select, Button, Card, DatePicker, Table, InputNumber, message, Space, Modal, Typography, Tag } from 'antd'
import {
    PlusOutlined,
    DeleteOutlined,
    ContainerOutlined,
    ProjectOutlined,
    CalendarOutlined,
    InfoCircleOutlined,
    InboxOutlined,
    DollarOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { materialRequisitionService, MaterialRequisitionItem } from '../../services/api/materialRequisitions'
import { materialService } from '../../services/api/materials'
import { projectService } from '../../services/api/projects'
import { warehouseService } from '../../services/api/warehouses'
import { unitService } from '../../services/api/units'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import {
    getPrimaryButtonStyle,
    getSecondaryButtonStyle,
    largeInputStyle,
    getLabelStyle,
    flexBetweenStyle,
    actionCardStyle,
    prefixIconStyle,
    twoColumnGridStyle
} from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Option } = Select
const { TextArea } = Input
const { Text, Title } = Typography

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
    code?: string
    project_code?: string
}

interface Warehouse {
    id: number
    name: string
    code: string
}

const MaterialRequisitionForm = () => {
    const [form] = Form.useForm()
    const [modalForm] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [materials, setMaterials] = useState<Material[]>([])
    const [units, setUnits] = useState<any[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])
    const [items, setItems] = useState<MaterialRequisitionItem[]>([])
    const [showAddItem, setShowAddItem] = useState(false)
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = !!id

    useEffect(() => {
        fetchMaterials()
        fetchUnits()
        fetchProjects()
        fetchWarehouses()
        if (isEdit) {
            fetchRequisition()
        }
    }, [id])

    const fetchUnits = async () => {
        try {
            const response = await unitService.getUnits()
            setUnits(response.data || [])
        } catch (error) {
            console.error('Failed to fetch units:', error)
        }
    }

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

    const fetchWarehouses = async () => {
        try {
            const response = await warehouseService.getWarehouses()
            setWarehouses(response.warehouses || [])
        } catch (error) {
            console.error('Failed to fetch warehouses:', error)
        }
    }

    const fetchRequisition = async () => {
        try {
            const response = await materialRequisitionService.getRequisitionById(Number(id))
            const requisition = response.data

            form.setFieldsValue({
                project_id: requisition.project_id,
                from_warehouse_id: requisition.from_warehouse_id,
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
            unit: values.unit,
            estimated_rate: values.estimated_rate,
            estimated_amount: values.estimated_rate ? values.requested_quantity * values.estimated_rate : undefined,
            specification: values.specification,
            remarks: values.item_remarks, // Fixed: was values.remarks but form field is item_remarks
            material: material,
        }

        setItems([...items, newItem])
        setShowAddItem(false)
        // Reset only item fields
        modalForm.resetFields()
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
                from_warehouse_id: values.from_warehouse_id,
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

            navigate('/procurement/requisitions')
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
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'Code',
            dataIndex: ['material', 'code'],
            key: 'code',
            width: 120,
            render: (code: string) => <Tag>{code}</Tag>,
        },
        {
            title: 'Quantity',
            dataIndex: 'requested_quantity',
            key: 'quantity',
            width: 150,
            render: (qty: number, record: any) => <Text strong>{qty} {record.unit}</Text>,
        },
        {
            title: 'Est. Amount',
            dataIndex: 'estimated_amount',
            key: 'amount',
            width: 150,
            render: (amount: number) => amount ? (
                <Text strong style={{ color: theme.colors.primary.main }}>₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
            ) : '-',
        },
        {
            title: 'Spec/Remarks',
            key: 'details',
            render: (_: any, record: any) => (
                <div style={{ fontSize: '12px', color: theme.colors.neutral.gray600 }}>
                    {record.specification && <div>Spec: {record.specification}</div>}
                    {record.remarks && <div>Note: {record.remarks}</div>}
                </div>
            ),
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
                    style={{ padding: 0 }}
                />
            ),
        },
    ]

    return (
        <PageContainer maxWidth={1100}>
            <PageHeader
                title={isEdit ? 'Edit Material Requisition' : 'Create Material Requisition'}
                subtitle={isEdit ? 'Modify the details of an existing requisition' : 'Raise a new request for construction materials for a specific project'}
                icon={<ContainerOutlined />}
            />

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                    priority: 'medium',
                    required_date: dayjs().add(7, 'days'),
                }}
            >
                <div style={twoColumnGridStyle}>
                    <SectionCard title="Basic Details" icon={<ProjectOutlined />}>
                        <Form.Item
                            label={<span style={getLabelStyle()}>Project / Site</span>}
                            name="project_id"
                            rules={[{ required: true, message: 'Please select project' }]}
                        >
                            <Select
                                placeholder="Select project"
                                showSearch
                                optionFilterProp="children"
                                size="large"
                                style={largeInputStyle}
                            >
                                {projects.map(project => (
                                    <Option key={project.id} value={project.id}>
                                        {project.name} ({project.project_code || project.code})
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>From Warehouse / Source</span>}
                            name="from_warehouse_id"
                            rules={[{ required: true, message: 'Please select warehouse' }]}
                        >
                            <Select
                                placeholder="Select warehouse"
                                showSearch
                                optionFilterProp="children"
                                size="large"
                                style={largeInputStyle}
                            >
                                {warehouses.map(warehouse => (
                                    <Option key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name} ({warehouse.code})
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <InfoCard title="💡 Selection Tip">
                            Materials will be checked for availability in the selected source warehouse upon approval.
                        </InfoCard>
                    </SectionCard>

                    <SectionCard title="Planning & Priority" icon={<CalendarOutlined />}>
                        <Form.Item
                            label={<span style={getLabelStyle()}>Required By Date</span>}
                            name="required_date"
                            rules={[{ required: true, message: 'Required date is needed' }]}
                        >
                            <DatePicker style={{ width: '100%', ...largeInputStyle }} format="DD-MMM-YYYY" size="large" />
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Priority Level</span>}
                            name="priority"
                            rules={[{ required: true, message: 'Please select priority' }]}
                        >
                            <Select size="large" style={largeInputStyle}>
                                <Option value="low">🔵 Low</Option>
                                <Option value="medium">🟡 Medium</Option>
                                <Option value="high">🟠 High</Option>
                                <Option value="urgent">🔴 Urgent</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item label={<span style={getLabelStyle()}>Purpose / Remarks</span>} name="purpose">
                            <TextArea rows={2} placeholder="Explain why these materials are needed..." style={largeInputStyle} />
                        </Form.Item>
                    </SectionCard>
                </div>

                <div style={{ marginTop: theme.spacing.lg }}>
                    <SectionCard
                        title="Requested Materials"
                        icon={<InboxOutlined />}
                        extra={
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setShowAddItem(true)}
                                style={getPrimaryButtonStyle(180)}
                            >
                                Add Material
                            </Button>
                        }
                    >
                        <Table
                            columns={itemColumns}
                            dataSource={items}
                            rowKey={(_, index) => `item-${index}`}
                            pagination={false}
                            scroll={{ x: 900 }}
                            locale={{ emptyText: <div style={{ padding: '40px 0' }}><Text type="secondary">No materials added yet. Click 'Add Material' to start.</Text></div> }}
                            bordered
                            summary={pageData => {
                                let total = 0;
                                pageData.forEach(({ estimated_amount }) => {
                                    if (estimated_amount) total += estimated_amount;
                                });

                                return (
                                    <Table.Summary.Row style={{ backgroundColor: theme.colors.neutral.gray50 }}>
                                        <Table.Summary.Cell index={0} colSpan={3}><Text strong>Total Estimated Requisition Amount</Text></Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} colSpan={3}>
                                            <Text strong style={{ fontSize: '16px', color: theme.colors.primary.main }}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                );
                            }}
                        />
                    </SectionCard>
                </div>

                <Card style={actionCardStyle}>
                    <div style={flexBetweenStyle}>
                        <Text style={{ color: theme.colors.neutral.gray600 }}>
                            <InfoCircleOutlined style={{ marginRight: '8px' }} />
                            Requisition will be sent to the store manager for approval.
                        </Text>
                        <Space size="middle">
                            <Button
                                onClick={() => navigate('/procurement/requisitions')}
                                size="large"
                                style={getSecondaryButtonStyle()}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                size="large"
                                style={getPrimaryButtonStyle()}
                            >
                                {isEdit ? 'Update' : 'Send'} Requisition
                            </Button>
                        </Space>
                    </div>
                </Card>
            </Form>

            {/* Add Material Modal */}
            <Modal
                title={<Title level={4}><PlusOutlined style={{ marginRight: '8px', color: theme.colors.primary.main }} /> Add Material to Requisition</Title>}
                open={showAddItem}
                onCancel={() => setShowAddItem(false)}
                footer={null}
                width={650}
                centered
            >
                <Form form={modalForm} layout="vertical" onFinish={handleAddItem} style={{ marginTop: '16px' }}>
                    <Form.Item
                        label={<span style={getLabelStyle()}>Material / Product</span>}
                        name="material_id"
                        rules={[{ required: true, message: 'Please select material' }]}
                    >
                        <Select
                            placeholder="Search and select material"
                            showSearch
                            optionFilterProp="children"
                            size="large"
                            style={largeInputStyle}
                            onChange={(value) => {
                                const material = materials.find(m => m.id === value)
                                if (material) {
                                    modalForm.setFieldsValue({ unit: material.unit })
                                }
                            }}
                        >
                            {materials.map(material => (
                                <Option key={material.id} value={material.id}>
                                    {material.name} ({material.code})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <div style={twoColumnGridStyle}>
                        <Form.Item
                            label={<span style={getLabelStyle()}>Quantity Required</span>}
                            name="requested_quantity"
                            rules={[
                                { required: true, message: 'Please enter quantity' },
                                { type: 'number', min: 0.01, message: 'Quantity must be greater than 0' },
                            ]}
                        >
                            <InputNumber
                                style={{ width: '100%', ...largeInputStyle }}
                                size="large"
                                placeholder="0.00"
                                min={0.01}
                                step={0.01}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Unit</span>}
                            name="unit"
                            rules={[{ required: true, message: 'Please select unit' }]}
                        >
                            <Select
                                placeholder="Select unit"
                                showSearch
                                optionFilterProp="children"
                                size="large"
                                style={largeInputStyle}
                            >
                                {units.map(unit => (
                                    <Option key={unit.id} value={unit.code}>
                                        {unit.name} ({unit.code})
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item label={<span style={getLabelStyle()}>Est. Rate (₹)</span>} name="estimated_rate">
                        <InputNumber
                            style={{ width: '100%', ...largeInputStyle }}
                            size="large"
                            placeholder="Market rate"
                            min={0}
                            step={0.01}
                            prefix={<DollarOutlined style={prefixIconStyle} />}
                        />
                    </Form.Item>

                    <Form.Item label={<span style={getLabelStyle()}>Specification</span>} name="specification">
                        <TextArea rows={2} placeholder="Dimensions, grade, or specific details..." style={largeInputStyle} />
                    </Form.Item>

                    <Form.Item label={<span style={getLabelStyle()}>Item Note</span>} name="item_remarks">
                        <TextArea rows={2} placeholder="Any additional notes for this item..." style={largeInputStyle} />
                    </Form.Item>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', gap: '12px' }}>
                        <Button onClick={() => setShowAddItem(false)} size="large">Cancel</Button>
                        <Button type="primary" htmlType="submit" size="large" style={getPrimaryButtonStyle()}>
                            Add to List
                        </Button>
                    </div>
                </Form>
            </Modal>
        </PageContainer>
    )
}

export default MaterialRequisitionForm
