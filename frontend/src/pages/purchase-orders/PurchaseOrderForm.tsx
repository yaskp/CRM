import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, InputNumber, Divider, Row, Col, Typography, Space, DatePicker, Checkbox, Tag } from 'antd'
import {
    FileDoneOutlined,
    ProjectOutlined,
    ShopOutlined,
    PlusOutlined,
    DeleteOutlined,
    SaveOutlined,
    BankOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { purchaseOrderService } from '../../services/api/purchaseOrders'
import { materialRequisitionService } from '../../services/api/materialRequisitions'
import { projectService } from '../../services/api/projects'
import { vendorService } from '../../services/api/vendors'
import { materialService } from '../../services/api/materials'
import { warehouseService } from '../../services/api/warehouses'
import { annexureService, Annexure } from '../../services/api/annexures'
import { boqService, BOQItem } from '../../services/api/boqs'
import { masterService } from '../../services/api/master'
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
import { detectGSTType, calculateGSTBreakup, getStateNameFromCode, getStateCodeFromGST, GSTType } from '../../utils/gstUtils'
import dayjs from 'dayjs'
import { InfoCard } from '../../components/common/PremiumComponents'

const { Option } = Select
const { Text, Title } = Typography

const PurchaseOrderForm = () => {
    const { id } = useParams()
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const mrId = queryParams.get('mr_id')

    const isEditMode = !!id
    const [loading, setLoading] = useState(false)
    const [projects, setProjects] = useState<any[]>([])
    const [vendors, setVendors] = useState<any[]>([])
    const [materials, setMaterials] = useState<any[]>([])
    const [warehouses, setWarehouses] = useState<any[]>([])
    const [annexures, setAnnexures] = useState<Annexure[]>([])
    const [boqItems, setBoqItems] = useState<BOQItem[]>([])
    const [showBoqOnly, setShowBoqOnly] = useState(true) // Default to true
    const [branches, setBranches] = useState<any[]>([])
    const [form] = Form.useForm()
    const navigate = useNavigate()

    // Watch for calculations and filtering
    const items = Form.useWatch('items', form) || []
    const selectedProjectId = Form.useWatch('project_id', form)
    const selectedVendorId = Form.useWatch('vendor_id', form)
    const selectedWarehouseId = Form.useWatch('warehouse_id', form)
    const selectedDeliveryType = Form.useWatch('delivery_type', form)
    const selectedBillingUnitId = Form.useWatch('billing_unit_id', form)

    const [gstType, setGstType] = useState<GSTType>('intra_state')
    const [shippingLocation, setShippingLocation] = useState({ code: '', name: '' })

    useEffect(() => {
        fetchMetadata()
    }, [])

    useEffect(() => {
        if (id) {
            fetchPurchaseOrder(Number(id))
        } else if (mrId && projects.length > 0) {
            fetchFromRequisition(Number(mrId))
        }
    }, [id, mrId, projects])

    const fetchFromRequisition = async (mId: number) => {
        setLoading(true)
        try {
            const res = await materialRequisitionService.getRequisitionById(mId)
            const mr = res.data || res.requisition
            if (mr) {
                form.setFieldsValue({
                    project_id: mr.project_id,
                    items: mr.items.map((item: any) => ({
                        material_id: item.material_id,
                        description: item.material?.name,
                        quantity: item.approved_quantity || item.requested_quantity,
                        unit: item.unit,
                        unit_price: item.estimated_rate || 0,
                        tax_percentage: 0
                    }))
                })
                message.success('Imported items from Material Requisition')
            }
        } catch (e) {
            console.error('Failed to fetch MR', e)
        } finally {
            setLoading(false)
        }
    }

    const fetchMetadata = async () => {
        try {
            const results = await Promise.allSettled([
                projectService.getProjects(),
                vendorService.getVendors(),
                materialService.getMaterials(),
                warehouseService.getWarehouses(),
                annexureService.getAnnexures(),
                masterService.getBranches()
            ])

            const [projectsRes, vendorsRes, materialsRes, warehousesRes, termsRes, branchesRes] = results

            // Helper to safely get value or default
            const getValue = (res: PromiseSettledResult<any>, key: string, fallback: any = []) => {
                if (res.status === 'fulfilled') {
                    return res.value[key] || res.value || fallback
                }
                console.error(`Failed to fetch ${key}:`, res.status === 'rejected' ? res.reason : 'Unknown error')
                return fallback
            }

            setProjects(getValue(projectsRes, 'projects'))
            setVendors(getValue(vendorsRes, 'vendors'))
            setMaterials(getValue(materialsRes, 'materials'))
            setWarehouses(getValue(warehousesRes, 'warehouses'))

            // Annexures needs special filtering
            const allTerms = getValue(termsRes, 'annexures')
            setAnnexures(Array.isArray(allTerms) ? allTerms.filter((a: any) => a.type === 'purchase_order') : [])

            setBranches(getValue(branchesRes, 'branches'))

        } catch (error) {
            console.error('Failed to fetch metadata', error)
            message.error('Failed to load required data')
        }
    }

    const fetchPurchaseOrder = async (poId: number) => {
        setLoading(true)
        try {
            const res = await purchaseOrderService.getPurchaseOrder(poId)
            const po = res.purchaseOrder

            // Populate Form
            form.setFieldsValue({
                project_id: po.project_id,
                vendor_id: po.vendor_id,
                warehouse_id: po.warehouse_id,
                delivery_type: po.delivery_type,
                expected_delivery_date: po.expected_delivery_date ? dayjs(po.expected_delivery_date) : undefined,
                payment_terms: po.payment_terms ? (po.payment_terms.includes(',') ? po.payment_terms.split(', ') : [po.payment_terms]) : [],
                annexure_id: po.annexure_id,
                shipping_address: po.shipping_address,
                notes: po.notes,
                items: po.items.map((item: any) => ({
                    ...item,
                    material_id: item.material_id,
                    boq_item_id: item.boq_item_id, // Ensure this maps correctly if name differs
                    description: item.description,
                    quantity: item.quantity,
                    unit: item.unit,
                    unit_price: item.unit_price,
                    tax_percentage: item.tax_percentage
                }))
            })

            // Trigger side effects manually if needed (like GST type)
            // GST Effect will run automatically due to form watch
        } catch (error) {
            console.error('Failed to fetch PO', error)
            message.error('Failed to load Purchase Order')
            navigate('/procurement/purchase-orders')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (selectedVendorId && (selectedDeliveryType || selectedWarehouseId || selectedProjectId || selectedBillingUnitId)) {
            const vendor = vendors.find(v => v.id === selectedVendorId)
            const warehouse = warehouses.find(w => w.id === selectedWarehouseId)
            const project = projects.find(p => p.id === selectedProjectId)
            const billingBranch = branches.find(b => b.id === selectedBillingUnitId)

            if (vendor) {
                // 1. Determine Vendor State Code (Prioritize GSTIN)
                const vendorStateCode = getStateCodeFromGST(vendor.gst_number) || vendor.state_code || ''

                // 2. Determine Delivery State Code (Prioritize GSTIN if Warehouse)
                let deliveryStateCode = ''

                if (selectedDeliveryType === 'direct_to_site') {
                    // For projects, we rely on site_state_code (unless we have a specific project_gstin field)
                    deliveryStateCode = project?.site_state_code || ''
                } else if (warehouse) {
                    deliveryStateCode = getStateCodeFromGST(warehouse?.gstin) || warehouse?.state_code || ''
                }

                // Fallback 1: If delivery location is unknown, use Billing Unit (Branch) location
                if (!deliveryStateCode && billingBranch) {
                    deliveryStateCode = getStateCodeFromGST(billingBranch?.gstin) || billingBranch?.state_code || ''
                }

                // Fallback 2: Project site_state_code (legacy check)
                if (!deliveryStateCode && project?.site_state_code) {
                    deliveryStateCode = project.site_state_code
                }

                const name = getStateNameFromCode(deliveryStateCode)
                setShippingLocation({ code: deliveryStateCode, name: name || (deliveryStateCode ? `State Code ${deliveryStateCode}` : '') })

                const type = detectGSTType(vendorStateCode, deliveryStateCode)
                setGstType(type)
            }
        }
    }, [selectedProjectId, selectedVendorId, selectedWarehouseId, selectedDeliveryType, selectedBillingUnitId, projects, vendors, warehouses, branches])

    useEffect(() => {
        if (selectedProjectId) {
            fetchProjectBOQ(selectedProjectId)
        }
    }, [selectedProjectId])

    const fetchProjectBOQ = async (projectId: number) => {
        try {
            const res = await boqService.getProjectBOQs(projectId)
            if (res.boqs && res.boqs.length > 0) {
                const approved = res.boqs.find((b: any) => b.status === 'approved')
                if (approved) {
                    const details = await boqService.getBOQDetails(approved.id)
                    setBoqItems(details.boq.items || [])
                } else {
                    setBoqItems([])
                }
            }
        } catch (error) {
            console.error('Failed to fetch BOQ', error)
        }
    }

    useEffect(() => {
        // Only auto-fill address if NOT in edit mode (or if address is empty)
        // If in edit mode, we trust the fetched PO address unless user changes warehouse
        if (selectedWarehouseId && !isEditMode) {
            const warehouse = warehouses.find(w => w.id === selectedWarehouseId)
            if (warehouse) {
                let address = warehouse.address || ''

                // If warehouse doesn't have specific address but is linked to a project, try project site address
                if (!address && warehouse.project_id) {
                    const project = projects.find(p => p.id === warehouse.project_id)
                    if (project) {
                        const parts = [
                            project.location,
                            project.city,
                            project.state,
                            project.site_pincode ? `Pin: ${project.site_pincode}` : ''
                        ].filter(Boolean)
                        address = parts.join(', ')
                    }
                }

                if (address) {
                    form.setFieldsValue({
                        shipping_address: address
                    })
                }
            }
        }
    }, [selectedWarehouseId, warehouses, projects, form, isEditMode])

    const calculateTotals = () => {
        let subtotal = 0
        let totalCGST = 0
        let totalSGST = 0
        let totalIGST = 0
        let grandTotal = 0

        items.forEach((item: any) => {
            if (item) {
                const qty = item.quantity || 0
                const price = item.unit_price || 0
                const taxRate = item.tax_percentage || 0

                const baseAmount = qty * price
                const breakup = calculateGSTBreakup(baseAmount, taxRate, gstType)

                subtotal += baseAmount
                totalCGST += breakup.cgst_amount
                totalSGST += breakup.sgst_amount
                totalIGST += breakup.igst_amount
                grandTotal += breakup.grand_total
            }
        })

        return { subtotal, totalCGST, totalSGST, totalIGST, grandTotal }
    }

    const totals = calculateTotals()

    const onMaterialChange = (value: number, index: number) => {
        const material = materials.find(m => m.id === value)
        if (material) {
            const currentItems = form.getFieldValue('items')
            const updatedItems = [...currentItems]

            const unitOptions = Array.isArray(material.unit) ? material.unit : [material.unit];
            // If multiple units, force selection (don't pre-fill). If single, pre-fill.
            const defaultUnit = unitOptions.length === 1 ? unitOptions[0] : undefined;

            updatedItems[index] = {
                ...updatedItems[index],
                description: material.name,
                unit: defaultUnit,
                unit_price: Number(material.standard_rate) || 0,
                tax_percentage: Number(material.gst_rate) || 0,
                quantity: 1
            }
            form.setFieldsValue({ items: updatedItems })
        }
    }

    const onBoqItemChange = (value: number | undefined, index: number) => {
        const currentItems = form.getFieldValue('items')
        const updatedItems = [...currentItems]

        if (value) {
            const boqItem = boqItems.find(b => b.id === value)
            if (boqItem) {
                // Calculate remaining quantity
                const remaining = Number(boqItem.quantity) - Number(boqItem.ordered_quantity || 0)

                updatedItems[index] = {
                    ...updatedItems[index],
                    quantity: remaining > 0 ? remaining : 0,
                    unit_price: Number(boqItem.estimated_rate) || updatedItems[index].unit_price
                }
                message.info(`Auto-filled quantity from BOQ: ${remaining} ${boqItem.unit || ''}`)
            }
        } else {
            // Cleared - Reset to allow manual entry (or default)
            updatedItems[index] = {
                ...updatedItems[index],
                quantity: 1, // Reset to default 1
                unit_price: 0 // Reset price
            }
        }
        form.setFieldsValue({ items: updatedItems })
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

            const payload = {
                project_id: values.project_id,
                vendor_id: values.vendor_id,
                warehouse_id: values.warehouse_id,
                billing_unit_id: values.billing_unit_id,
                delivery_type: values.delivery_type,
                gst_type: gstType,
                total_amount: totals.grandTotal,
                items: processedItems,
                expected_delivery_date: values.expected_delivery_date ? values.expected_delivery_date.format('YYYY-MM-DD') : undefined,
                payment_terms: Array.isArray(values.payment_terms) ? values.payment_terms.join(', ') : values.payment_terms,
                annexure_id: values.annexure_id,
                shipping_address: values.shipping_address,
                notes: values.notes
            }

            if (isEditMode) {
                await purchaseOrderService.updatePurchaseOrder(Number(id), payload)
                message.success('Purchase Order Updated Successfully')
            } else {
                await purchaseOrderService.createPurchaseOrder(payload)
                message.success('Purchase Order Created Successfully')
            }

            navigate('/procurement/purchase-orders')
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to save PO')
        } finally {
            setLoading(false)
        }
    }

    return (
        <PageContainer maxWidth={1200}>
            <PageHeader
                title={isEditMode ? "Edit Purchase Order" : "Create Purchase Order"}
                subtitle={isEditMode ? "Modify existing purchase order details" : "Draft a new purchase order with line items"}
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
                            label={
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <span style={getLabelStyle()}>Billing Unit (Buyer Branch)</span>
                                    {selectedBillingUnitId && (
                                        <Tag color="geekblue">
                                            {branches.find(b => b.id === selectedBillingUnitId)?.state_code} - {branches.find(b => b.id === selectedBillingUnitId)?.gstin}
                                        </Tag>
                                    )}
                                </div>
                            }
                            name="billing_unit_id"
                            rules={[{ required: true, message: 'Select billing unit' }]}
                        >
                            <Select
                                placeholder="Select Branch"
                                size="large"
                                style={largeInputStyle}
                                suffixIcon={<BankOutlined />}
                            >
                                {branches.map((b: any) => (
                                    <Option key={b.id} value={b.id}>
                                        {b.branch_name} ({b.state_code}) - {b.gstin}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

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
                                    <Option key={p.id} value={p.id}>{p.name} ({p.project_code})</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>

                    <div style={twoColumnGridStyle}>
                        <Form.Item
                            label={
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <span style={getLabelStyle()}>Supplier / Vendor</span>
                                    {selectedVendorId && (
                                        <Tag color="blue">
                                            GST: {vendors.find(v => v.id === selectedVendorId)?.gst_number || 'N/A'}
                                        </Tag>
                                    )}
                                </div>
                            }
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

                    <div style={{ background: '#f0f5ff', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <InfoCard title="GST Calculation Logic" style={{ margin: 0, border: 'none', background: 'transparent' }}>
                            <Text>
                                Based on Vendor {vendors.find(v => v.id === selectedVendorId)?.state || ''} ({vendors.find(v => v.id === selectedVendorId)?.state_code || '--'})
                                and Delivery Location {shippingLocation.name ? `${shippingLocation.name} (${shippingLocation.code})` : '(Unknown)'},
                                Tax Mode: <b style={{ marginLeft: 8, color: '#1890ff' }}>
                                    {gstType === 'intra_state' ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
                                </b>
                            </Text>
                        </InfoCard>
                    </div>

                    <div style={twoColumnGridStyle}>
                        <Form.Item
                            label={<span style={getLabelStyle()}>Delivery Type</span>}
                            name="delivery_type"
                            rules={[{ required: true, message: 'Select delivery type' }]}
                            initialValue="central_warehouse"
                        >
                            <Select size="large" style={largeInputStyle}>
                                <Option value="central_warehouse">To Central Warehouse</Option>
                                <Option value="direct_to_site">Direct to Project Site</Option>
                                <Option value="mixed">Mixed / Other</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label={
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <span style={getLabelStyle()}>Ship At (Warehouse/Site)</span>
                                    {selectedWarehouseId && (
                                        <Tag color="orange">
                                            {warehouses.find(w => w.id === selectedWarehouseId)?.name}
                                        </Tag>
                                    )}
                                </div>
                            }
                            name="warehouse_id"
                            rules={[{ required: !selectedDeliveryType || selectedDeliveryType === 'central_warehouse', message: 'Please select a delivery warehouse' }]}
                        >
                            <Select
                                placeholder="Select Warehouse"
                                size="large"
                                style={largeInputStyle}
                                showSearch
                                optionFilterProp="children"
                                suffixIcon={<BankOutlined />}
                            >
                                {warehouses
                                    .filter(w => w.type === 'central' || w.project_id === selectedProjectId)
                                    .map((w: any) => (
                                        <Option key={w.id} value={w.id}>
                                            <Space>
                                                {w.type === 'site' ? <ShopOutlined style={{ color: '#fa8c16' }} /> : <BankOutlined style={{ color: '#722ed1' }} />}
                                                {w.name} ({w.code})
                                            </Space>
                                        </Option>
                                    ))}
                            </Select>
                        </Form.Item>
                    </div>

                    {/* Floor/Pour Selection for Direct to Site */}
                    {selectedDeliveryType === 'direct_to_site' && (
                        <div style={{ marginBottom: 24, padding: 16, background: '#fafafa', borderRadius: 8, border: '1px dashed #d9d9d9' }}>
                            <Text strong style={{ display: 'block', marginBottom: 12 }}>Detailed Delivery Location (Optional)</Text>
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item name="building_id" label="Building / Block">
                                        <Select placeholder="Select Building" allowClear>
                                            {/* We would need to fetch buildings for project. Placeholder for UI. */}
                                            <Option value={1}>Block A</Option>
                                            <Option value={2}>Block B</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="floor_id" label="Floor / Level">
                                        <Select placeholder="Select Floor" allowClear>
                                            <Option value={1}>Ground Floor</Option>
                                            <Option value={2}>1st Floor</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="zone_id" label="Zone / Pour / Flat">
                                        <Input placeholder="e.g. Slab 1, Flat 101" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>
                    )}
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
                                                    label={
                                                        <Space>
                                                            <span>Material</span>
                                                            {selectedProjectId && (
                                                                <Checkbox
                                                                    checked={showBoqOnly}
                                                                    onChange={(e) => setShowBoqOnly(e.target.checked)}
                                                                    style={{ fontSize: 12 }}
                                                                >
                                                                    Show Project Items Only
                                                                </Checkbox>
                                                            )}
                                                        </Space>
                                                    }
                                                    rules={[{ required: true, message: 'Required' }]}
                                                    style={{ marginBottom: 8 }}
                                                >
                                                    <Select
                                                        placeholder="Select Material"
                                                        onChange={(val) => onMaterialChange(val, index)}
                                                        showSearch
                                                        optionFilterProp="children"
                                                    >
                                                        {(showBoqOnly && selectedProjectId && boqItems.length > 0
                                                            ? materials.filter(m => boqItems.some(bi => bi.material_id === m.id))
                                                            : materials
                                                        ).map(m => (
                                                            <Option key={m.id} value={m.id}>
                                                                {m.name} ({m.material_code})
                                                                {showBoqOnly && boqItems.find(bi => bi.material_id === m.id) && (
                                                                    <Tag color="blue" style={{ marginLeft: 8 }}>BOQ</Tag>
                                                                )}
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'boq_item_id']}
                                                    label={<span style={{ fontSize: 12 }}>Link to BOQ Entry</span>}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <Select
                                                        placeholder="Optional: Link to BOQ"
                                                        size="small"
                                                        allowClear
                                                        onChange={(val) => onBoqItemChange(val, index)}
                                                    >
                                                        {boqItems
                                                            .filter(bi => bi.material_id === items[index]?.material_id)
                                                            .map(bi => (
                                                                <Option key={bi.id} value={bi.id}>
                                                                    {bi.workItemType?.name} | Max: {bi.quantity - bi.ordered_quantity} {bi.unit}
                                                                </Option>
                                                            ))}
                                                    </Select>
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'description']}
                                                    style={{ marginBottom: 0, marginTop: 8 }}
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
                                                    {(() => {
                                                        const currentMaterialId = items[index]?.material_id;
                                                        const material = materials.find(m => m.id === currentMaterialId);
                                                        // Check if material unit is array or string
                                                        const unitOptions = Array.isArray(material?.unit) ? material.unit : (material?.unit ? [material.unit] : []);

                                                        if (unitOptions.length > 1) {
                                                            return (
                                                                <Select placeholder="Select Unit">
                                                                    {unitOptions.map((u: string) => (
                                                                        <Option key={u} value={u}>{u}</Option>
                                                                    ))}
                                                                </Select>
                                                            );
                                                        }
                                                        return <Input placeholder="Unit" />; // Fallback to input if single or no units finding
                                                    })()}
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
                            {gstType === 'intra_state' ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text type="secondary">CGST Total:</Text>
                                        <Text>₹{totals.totalCGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text type="secondary">SGST Total:</Text>
                                        <Text>₹{totals.totalSGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text type="secondary">IGST Total:</Text>
                                    <Text>₹{totals.totalIGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                                </div>
                            )}
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
                            <Select
                                placeholder="Select or Type Payment Terms"
                                size="large"
                                mode="tags" // Allows custom input
                                options={[
                                    { value: 'Net 30', label: 'Net 30 Days' },
                                    { value: 'Net 45', label: 'Net 45 Days' },
                                    { value: 'Net 60', label: 'Net 60 Days' },
                                    { value: '100% Advance', label: '100% Advance' },
                                    { value: '50% Adv, 50% Delivery', label: '50% Adv, 50% Delivery' },
                                    { value: 'Cash on Delivery', label: 'Cash on Delivery' },
                                ]}
                            />
                        </Form.Item>

                        <Form.Item label="Terms & Conditions Master" name="annexure_id">
                            <Select
                                placeholder="Select T&C Template"
                                size="large"
                                onChange={(id) => {
                                    const term = annexures.find(t => t.id === id)
                                    if (term) {
                                        form.setFieldsValue({
                                            payment_terms: term.payment_terms ? [term.payment_terms] : [],
                                            notes: `${term.quality_terms || ''}\n${term.delivery_terms || ''}\n${term.penalty_clause || ''}`
                                        })
                                    }
                                }}
                            >
                                {annexures.map(t => (
                                    <Option key={t.id} value={t.id}>{t.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item label="Reference Quotation (Sales)" name="sales_quotation_id">
                            <Select placeholder="Link to Client Quote (Optional)" allowClear size="large">
                                {/* Placeholder: Fetch Sales Quotes if project selected */}
                                <Option value={1}>QT-2026/001 (Accepted)</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item label="Vendor Quote Ref" name="vendor_quote_ref">
                            <Input placeholder="e.g. Q-99 from Supplier" size="large" />
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
                            {isEditMode ? "Update Purchase Order" : "Create Purchase Order"}
                        </Button>
                    </div>
                </Card>
            </Form>
        </PageContainer >
    )
}

export default PurchaseOrderForm
