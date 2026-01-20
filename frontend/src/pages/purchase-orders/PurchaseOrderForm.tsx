import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, InputNumber, Divider, Row, Col, Typography, Space, DatePicker } from 'antd'
import {
    FileDoneOutlined,
    ProjectOutlined,
    ShopOutlined,
    PlusOutlined,
    DeleteOutlined,
    SaveOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { purchaseOrderService } from '../../services/api/purchaseOrders'
import { projectService } from '../../services/api/projects'
import { vendorService } from '../../services/api/vendors'
import { materialService } from '../../services/api/materials'
import { PageContainer, PageHeader, SectionCard } from '../../components/common/PremiumComponents'
import {
    getLabelStyle,
    getPrimaryButtonStyle,
    getSecondaryButtonStyle,
    largeInputStyle,
    twoColumnGridStyle,
    actionCardStyle,
    flexBetweenStyle
} from '../../styles/styleUtils'

const { Option } = Select
const { Text, Title } = Typography

const PurchaseOrderForm = () => {
    const [loading, setLoading] = useState(false)
    const [projects, setProjects] = useState<any[]>([])
    const [vendors, setVendors] = useState<any[]>([])
    const [materials, setMaterials] = useState<any[]>([])
    const [form] = Form.useForm()
    const navigate = useNavigate()

    // Watch for calculations
    const items = Form.useWatch('items', form) || []

    useEffect(() => {
        fetchMetadata()
    }, [])

    const fetchMetadata = async () => {
        try {
            const [projectsRes, vendorsRes, materialsRes] = await Promise.all([
                projectService.getProjects(),
                vendorService.getVendors(),
                materialService.getMaterials(),
            ])
            setProjects(projectsRes.projects || projectsRes || [])
            setVendors(vendorsRes.vendors || vendorsRes || [])
            setMaterials(materialsRes.materials || materialsRes || [])
        } catch (error) {
            console.error('Failed to fetch metadata', error)
            message.error('Failed to load required data')
        }
    }

    const calculateTotals = () => {
        let subtotal = 0
        let totalTax = 0
        let grandTotal = 0

        items.forEach((item: any) => {
            if (item) {
                const qty = item.quantity || 0
                const price = item.unit_price || 0
                const taxRate = item.tax_percentage || 0

                const lineAmount = qty * price
                const taxAmount = lineAmount * (taxRate / 100)

                subtotal += lineAmount
                totalTax += taxAmount
                grandTotal += (lineAmount + taxAmount)
            }
        })

        return { subtotal, totalTax, grandTotal }
    }

    const totals = calculateTotals()

    const onMaterialChange = (value: number, index: number) => {
        const material = materials.find(m => m.id === value)
        if (material) {
            const currentItems = form.getFieldValue('items')
            const updatedItems = [...currentItems]
            updatedItems[index] = {
                ...updatedItems[index],
                description: material.name,
                unit: material.unit,
                unit_price: 0, // Reset or fetch standard price if available
                quantity: 1
            }
            form.setFieldsValue({ items: updatedItems })
        }
    }

    const onFinish = async (values: any) => {
        setLoading(true)
        try {
            // Prepare items with calculated totals
            const processedItems = values.items.map((item: any) => {
                const qty = Number(item.quantity)
                const price = Number(item.unit_price)
                const taxRate = Number(item.tax_percentage || 0)
                const lineAmount = qty * price
                const taxAmount = lineAmount * (taxRate / 100)

                return {
                    ...item,
                    material_id: item.material_id,
                    quantity: qty,
                    unit_price: price,
                    tax_percentage: taxRate,
                    tax_amount: taxAmount,
                    total_amount: lineAmount + taxAmount
                }
            })

            await purchaseOrderService.createPurchaseOrder({
                project_id: values.project_id,
                vendor_id: values.vendor_id,
                total_amount: totals.grandTotal,
                items: processedItems
            })

            message.success('Purchase Order Request Created Successfully')
            navigate('/procurement/purchase-orders')
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to create PO request')
        } finally {
            setLoading(false)
        }
    }

    return (
        <PageContainer maxWidth={1200}>
            <PageHeader
                title="Create Purchase Order"
                subtitle="Draft a new purchase order with line items"
                icon={<FileDoneOutlined />}
            />

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
                initialValues={{ items: [{}] }} // Start with one empty row
            >
                <SectionCard title="PO Header Details" icon={<FileDoneOutlined />}>
                    <div style={twoColumnGridStyle}>
                        <Form.Item
                            label={<span style={getLabelStyle()}>Project</span>}
                            name="project_id"
                            rules={[{ required: true, message: 'Please select a project' }]}
                        >
                            <Select
                                placeholder="Select Project"
                                size="large"
                                style={largeInputStyle}
                                showSearch
                                optionFilterProp="children"
                                suffixIcon={<ProjectOutlined />}
                            >
                                {projects.map((p: any) => (
                                    <Option key={p.id} value={p.id}>{p.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Vendor</span>}
                            name="vendor_id"
                            rules={[{ required: true, message: 'Please select a vendor' }]}
                        >
                            <Select
                                placeholder="Select Vendor"
                                size="large"
                                style={largeInputStyle}
                                showSearch
                                optionFilterProp="children"
                                suffixIcon={<ShopOutlined />}
                            >
                                {vendors.map((v: any) => (
                                    <Option key={v.id} value={v.id}>{v.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>
                </SectionCard>

                <SectionCard title="Order Items" icon={<ShopOutlined />}>
                    <Form.List name="items">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }, index) => (
                                    <Card
                                        key={key}
                                        size="small"
                                        style={{ marginBottom: 16, background: '#f9f9f9', border: '1px solid #eee' }}
                                        bodyStyle={{ padding: '12px' }}
                                    >
                                        <Row gutter={16} align="middle">
                                            <Col span={1} style={{ textAlign: 'center' }}>
                                                <Text type="secondary">#{index + 1}</Text>
                                            </Col>

                                            <Col span={6}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'material_id']}
                                                    label="Material"
                                                    rules={[{ required: true, message: 'Required' }]}
                                                    style={{ marginBottom: 8 }}
                                                >
                                                    <Select
                                                        placeholder="Select Material"
                                                        onChange={(val) => onMaterialChange(val, index)}
                                                        showSearch
                                                        optionFilterProp="children"
                                                    >
                                                        {materials.map(m => (
                                                            <Option key={m.id} value={m.id}>{m.name} ({m.material_code})</Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'description']}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <Input placeholder="Description / Notes" />
                                                </Form.Item>
                                            </Col>

                                            <Col span={3}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'quantity']}
                                                    label="Qty"
                                                    rules={[{ required: true, message: 'Req' }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <InputNumber min={0.01} style={{ width: '100%' }} placeholder="Qty" />
                                                </Form.Item>
                                            </Col>

                                            <Col span={3}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'unit']}
                                                    label="Unit"
                                                    rules={[{ required: true, message: 'Req' }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <Input placeholder="Unit" />
                                                </Form.Item>
                                            </Col>

                                            <Col span={4}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'unit_price']}
                                                    label="Price"
                                                    rules={[{ required: true, message: 'Req' }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <InputNumber
                                                        min={0}
                                                        style={{ width: '100%' }}
                                                        prefix="₹"
                                                        placeholder="Rate"
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col span={3}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'tax_percentage']}
                                                    label="Tax %"
                                                    initialValue={0}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <InputNumber min={0} max={100} style={{ width: '100%' }} suffix="%" />
                                                </Form.Item>
                                            </Col>

                                            <Col span={3} style={{ textAlign: 'right' }}>
                                                <div style={{ padding: '30px 0 0 0' }}>
                                                    <Text strong>
                                                        {items[index] ?
                                                            '₹' + ((items[index].quantity || 0) * (items[index].unit_price || 0) * (1 + (items[index].tax_percentage || 0) / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                            : '₹0.00'
                                                        }
                                                    </Text>
                                                </div>
                                            </Col>

                                            <Col span={1} style={{ textAlign: 'right' }}>
                                                <div style={{ padding: '30px 0 0 0' }}>
                                                    <DeleteOutlined
                                                        onClick={() => remove(name)}
                                                        style={{ color: 'red', cursor: 'pointer', fontSize: '16px' }}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} size="large">
                                        Add Line Item
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>

                    <Divider />

                    <Row justify="end">
                        <Col span={8}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Subtotal:</Text>
                                <Text>₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Tax Total:</Text>
                                <Text>₹{totals.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                            </div>
                            <Divider style={{ margin: '12px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Title level={4}>Grand Total:</Title>
                                <Title level={4} type="success">₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Title>
                            </div>
                        </Col>
                    </Row>
                </SectionCard>

                <SectionCard title="Logistics & Terms" icon={<FileDoneOutlined />}>
                    <div style={twoColumnGridStyle}>
                        <Form.Item label="Expected Delivery Date" name="expected_delivery_date">
                            <DatePicker style={{ width: '100%' }} size="large" />
                        </Form.Item>
                        <Form.Item label="Payment Terms" name="payment_terms">
                            <Input placeholder="e.g. Net 30, 50% Advance" size="large" />
                        </Form.Item>
                    </div>
                    <Form.Item label="Shipping Address / Delivery Location" name="shipping_address">
                        <Input.TextArea rows={2} placeholder="Enter delivery address..." />
                    </Form.Item>
                    <Form.Item label="Notes / Terms & Conditions" name="notes">
                        <Input.TextArea rows={4} placeholder="Additional terms..." />
                    </Form.Item>
                </SectionCard>

                <Card style={actionCardStyle}>
                    <div style={flexBetweenStyle}>
                        <Button
                            size="large"
                            onClick={() => navigate('/procurement/purchase-orders')}
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
                            icon={<SaveOutlined />}
                        >
                            Create Purchase Order
                        </Button>
                    </div>
                </Card>
            </Form>
        </PageContainer>
    )
}

export default PurchaseOrderForm
