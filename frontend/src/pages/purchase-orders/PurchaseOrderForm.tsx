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
import { workOrderService } from '../../services/api/workOrders'
import { quotationService } from '../../services/api/quotations'
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
import { detectGSTType, calculateGSTBreakup, getStateNameFromCode, getStateCodeFromGST, GSTType, INDIA_STATE_CODES } from '../../utils/gstUtils'
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
    const [paymentTermsTemplates, setPaymentTermsTemplates] = useState<Annexure[]>([])
    const [clientQuotations, setClientQuotations] = useState<any[]>([])
    const [workOrderProjectIds, setWorkOrderProjectIds] = useState<Set<number>>(new Set())
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
    const procurementFor = Form.useWatch('procurement_for', form)
    const [lastPopulatedProjectId, setLastPopulatedProjectId] = useState<number | null>(null)

    const [gstType, setGstType] = useState<GSTType>('intra_state')
    const [shippingLocation, setShippingLocation] = useState({ code: '', name: '' })

    // Address sub-fields
    const shippingStateCode = Form.useWatch('shipping_state', form)

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
                projectService.getProjects({ limit: 1000 }),
                vendorService.getVendors({ limit: 1000 }),
                materialService.getMaterials({ limit: 5000 }),
                warehouseService.getWarehouses({ limit: 1000 }),
                annexureService.getAnnexures({ limit: 1000 }),
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

            // Annexures needs special filtering — T&C includes purchase_order, general_terms and terms_conditions types
            const allTerms = getValue(termsRes, 'annexures')
            setAnnexures(Array.isArray(allTerms) ? allTerms.filter((a: any) =>
                ['purchase_order', 'general_terms', 'terms_conditions'].includes(a.type) ||
                a.name.toLowerCase().includes('terms') ||
                a.name.toLowerCase().includes('condition')
            ) : [])
            setPaymentTermsTemplates(Array.isArray(allTerms) ? allTerms.filter((a: any) => a.type === 'payment_terms') : [])

            setBranches(getValue(branchesRes, 'branches'))

            // Fetch Work Orders to filter projects
            try {
                const woRes = await workOrderService.getWorkOrders()
                const wos = woRes.workOrders || []
                const validProjectIds = new Set(wos.map((wo: any) => wo.project_id))
                setWorkOrderProjectIds(validProjectIds as Set<number>)
            } catch (e) {
                console.error('Failed to fetch Work Orders for filtering projects', e)
            }

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
                // Parse address if possible, else put all in street
                shipping_street: po.shipping_address, // Default full text
                // shipping_address: po.shipping_address, // We don't bind this directly anymore
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

            // Try to extract state from the address if it matches known patterns or if we can infer it? 
            // Better to rely on the side-effect logic to set state, OR if we saved it structured...
            // Since we didn't save structured, we rely on user re-selecting or auto-detection.
            // For now, let's leave state empty or auto-derived.


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
        if (selectedVendorId && (selectedDeliveryType || selectedWarehouseId || selectedProjectId || selectedBillingUnitId || shippingStateCode)) {
            const vendor = vendors.find(v => v.id === selectedVendorId)
            const warehouse = warehouses.find(w => w.id === selectedWarehouseId)
            const project = projects.find(p => p.id === selectedProjectId)
            const billingBranch = branches.find(b => b.id === selectedBillingUnitId)

            if (vendor) {
                // 1. Determine Vendor State Code (Prioritize GSTIN)
                const vendorStateCode = getStateCodeFromGST(vendor.gst_number) || vendor.state_code || ''

                // 2. Determine Delivery State Code (Prioritize Manual Selection -> GSTIN if Warehouse -> Project)
                let deliveryStateCode = ''

                if (shippingStateCode) {
                    deliveryStateCode = shippingStateCode
                } else if (selectedDeliveryType === 'direct_to_site') {
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

                // If we have a derived code but form state is empty, maybe sync form state?
                // Only if NOT currently editing manual fields to avoiding loops.
                // For now, let's just use the code for calc.

                const name = getStateNameFromCode(deliveryStateCode)
                setShippingLocation({ code: deliveryStateCode, name: name || (deliveryStateCode ? `State Code ${deliveryStateCode}` : '') })

                const type = detectGSTType(vendorStateCode, deliveryStateCode)
                setGstType(type)
            }
        }
    }, [selectedProjectId, selectedVendorId, selectedWarehouseId, selectedDeliveryType, selectedBillingUnitId, projects, vendors, warehouses, branches, shippingStateCode])

    useEffect(() => {
        if (selectedProjectId && procurementFor === 'project') {
            if (selectedProjectId !== lastPopulatedProjectId && !isEditMode) {
                handleProjectAutoPopulate(selectedProjectId)
            }
            fetchProjectBOQ(selectedProjectId)
            fetchClientQuotations(selectedProjectId)
        } else if (selectedProjectId) {
            fetchProjectBOQ(selectedProjectId)
            fetchClientQuotations(selectedProjectId)
        } else {
            setBoqItems([])
            setClientQuotations([])
            setLastPopulatedProjectId(null)
        }
    }, [selectedProjectId, procurementFor])

    const fetchClientQuotations = async (projectId: number) => {
        try {
            const res = await quotationService.getQuotations()
            const allQuotes = res.quotations || []

            // Filter quotes:
            // 1. Must belong to the selected project (directly or via Lead)
            // 2. Must be in a "Final" state (Approved, Accepted, etc.)
            // 3. MUST NOT be Superseded, Draft, or Rejected
            const validStatuses = ['approved', 'accepted', 'accepted_by_party']

            const filtered = allQuotes.filter((q: any) => {
                const belongsToProject = q.project_id === projectId || q.lead?.project_id === projectId
                const isFinalStatus = validStatuses.includes(q.status)

                return belongsToProject && isFinalStatus
            })

            // Sort by ID descending to show latest first
            filtered.sort((a: any, b: any) => b.id - a.id)

            setClientQuotations(filtered)
        } catch (e) {
            console.error('Failed to fetch client quotations', e)
        }
    }

    const handleProjectAutoPopulate = async (projectId: number) => {
        try {
            setLoading(true)
            const res = await boqService.getProjectBOQs(projectId)
            if (res.boqs && res.boqs.length > 0) {
                const approved = res.boqs.find((b: any) => b.status === 'approved')
                if (approved) {
                    const details = await boqService.getBOQDetails(approved.id)
                    const items = details.boq.items || []
                    setBoqItems(items)

                    if (items.length > 0) {
                        const formItems = items.map((bi: any) => ({
                            material_id: bi.material_id,
                            boq_item_id: bi.id,
                            description: bi.material?.name || bi.remarks,
                            quantity: Number(bi.quantity) - Number(bi.ordered_quantity || 0),
                            unit: bi.unit,
                            unit_price: Number(bi.estimated_rate) || 0,
                            tax_percentage: Number(bi.material?.gst_rate) || 0
                        })).filter((item: { quantity: number }) => item.quantity > 0)

                        if (formItems.length > 0) {
                            form.setFieldsValue({ items: formItems })
                            setLastPopulatedProjectId(projectId)
                            message.success(`Auto-populated ${formItems.length} items from Project BOQ`)
                        }
                    }
                } else {
                    setBoqItems([])
                    message.info('No approved BOQ found for this project to auto-populate items.')
                }
            }
        } catch (error) {
            console.error('Failed to auto-populate items', error)
            message.error('Failed to load project items')
        } finally {
            setLoading(false)
        }
    }

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

    // Derived: filter warehouses based on delivery type
    const filteredWarehouses = (() => {
        if (selectedDeliveryType === 'direct_to_site') {
            // Only site warehouses, prefer those linked to the selected project
            const siteWarehouses = warehouses.filter(w => w.type === 'site')
            if (selectedProjectId) {
                const projectSite = siteWarehouses.filter(w => w.project_id === selectedProjectId)
                return projectSite.length > 0 ? projectSite : siteWarehouses
            }
            return siteWarehouses
        } else if (selectedDeliveryType === 'central_warehouse') {
            return warehouses.filter(w => w.type === 'central' || w.type === 'regional')
        }
        return warehouses // 'mixed' or fallback
    })()

    useEffect(() => {
        if (isEditMode) return // Don't overwrite in edit mode

        const project = projects.find(p => p.id === selectedProjectId)
        const warehouse = warehouses.find(w => w.id === selectedWarehouseId)

        if (selectedDeliveryType === 'direct_to_site') {
            // Prefer the site warehouse linked to this project (seeded from project, has pincode)
            const linkedWarehouse = warehouse ||
                warehouses.find(w => w.type === 'site' && w.project_id === selectedProjectId)

            form.setFieldsValue({
                shipping_street: linkedWarehouse?.address || project?.site_address || project?.site_location || '',
                shipping_city: linkedWarehouse?.city || project?.site_city || '',
                shipping_state: linkedWarehouse?.state_code || getStateCodeFromGST(linkedWarehouse?.gstin) || project?.site_state_code || '',
                shipping_pincode: linkedWarehouse?.pincode || project?.site_pincode || ''
            })

        } else if (selectedDeliveryType === 'central_warehouse' && warehouse) {
            const linkedProject = warehouse.project_id ? projects.find(p => p.id === warehouse.project_id) : undefined
            const address = warehouse.address || linkedProject?.site_address || linkedProject?.site_location || ''

            if (address) {
                form.setFieldsValue({
                    shipping_street: address,
                    shipping_city: warehouse.city || linkedProject?.site_city || '',
                    shipping_state: warehouse.state_code || getStateCodeFromGST(warehouse.gstin) || linkedProject?.site_state_code || '',
                    shipping_pincode: warehouse.pincode || linkedProject?.site_pincode || ''
                })
            }
        }
    }, [selectedProjectId, selectedWarehouseId, selectedDeliveryType, projects, warehouses, form, isEditMode])
    const calculateTotals = () => {
        let subtotal = 0
        let totalCGST = 0
        let totalSGST = 0
        let totalIGST = 0
        let grandTotal = 0

        items.forEach((item: { quantity?: number; unit_price?: number; tax_percentage?: number }) => {
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

            // Concatenate Address
            const street = values.shipping_street || ''
            const city = values.shipping_city || ''
            const stateCode = values.shipping_state || ''
            const pincode = values.shipping_pincode || ''
            const stateName = getStateNameFromCode(stateCode)

            const fullAddress = [street, city, stateName, pincode ? `ZIP: ${pincode}` : ''].filter(Boolean).join(', ')

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
                shipping_address: fullAddress,
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
                            label={<span style={getLabelStyle()}>Procurement For</span>}
                            name="procurement_for"
                            initialValue="project"
                            rules={[{ required: true, message: 'Please select procurement type' }]}
                        >
                            <Select
                                size="large"
                                style={largeInputStyle}
                                onChange={(val) => {
                                    if (val === 'general') {
                                        form.setFieldsValue({ project_id: undefined })
                                    }
                                }}
                            >
                                <Option value="project">Project Procurement (Link to BOQ/Quote)</Option>
                                <Option value="general">General / Stock / Safe Side</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Project</span>}
                            name="project_id"
                            rules={[{ required: procurementFor === 'project', message: 'Please select a project' }]}
                        >
                            <Select
                                placeholder="Select Project (with Work Order)"
                                size="large"
                                style={largeInputStyle}
                                showSearch
                                optionFilterProp="children"
                                suffixIcon={<ProjectOutlined />}
                                allowClear={procurementFor === 'general'}
                            >
                                {projects
                                    .filter(p => !procurementFor || procurementFor === 'general' || workOrderProjectIds.has(p.id))
                                    .map((p: any) => (
                                        <Option key={p.id} value={p.id}>{p.name} ({p.project_code})</Option>
                                    ))}
                            </Select>
                        </Form.Item>
                    </div>

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
                                showSearch
                                optionFilterProp="children"
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
                            <Select
                                size="large"
                                style={largeInputStyle}
                                showSearch
                                optionFilterProp="children"
                            >
                                <Option value="central_warehouse">To Central Warehouse</Option>
                                <Option value="direct_to_site">Direct to Project Site</Option>
                                <Option value="mixed">Mixed / Other</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label={
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <span style={getLabelStyle()}>
                                        {selectedDeliveryType === 'direct_to_site' ? 'Ship At (Project Site)' :
                                            selectedDeliveryType === 'central_warehouse' ? 'Ship At (Central Warehouse)' :
                                                'Ship At (Warehouse / Site)'}
                                    </span>
                                    {selectedWarehouseId && (
                                        <Tag color={selectedDeliveryType === 'direct_to_site' ? 'orange' : 'purple'}>
                                            {warehouses.find(w => w.id === selectedWarehouseId)?.name}
                                        </Tag>
                                    )}
                                </div>
                            }
                            name="warehouse_id"
                            rules={[{ required: selectedDeliveryType !== 'mixed', message: 'Please select a delivery location' }]}
                        >
                            <Select
                                placeholder={
                                    selectedDeliveryType === 'direct_to_site' ? 'Select Project Site...' :
                                        selectedDeliveryType === 'central_warehouse' ? 'Select Central Warehouse...' :
                                            'Select Warehouse or Site...'
                                }
                                size="large"
                                style={largeInputStyle}
                                showSearch
                                optionFilterProp="children"
                                suffixIcon={selectedDeliveryType === 'direct_to_site' ? <ShopOutlined /> : <BankOutlined />}
                                notFoundContent={
                                    <Text type="secondary">
                                        {selectedDeliveryType === 'direct_to_site' ? 'No site warehouses found for this project' :
                                            selectedDeliveryType === 'central_warehouse' ? 'No central warehouses available' :
                                                'No warehouses found'}
                                    </Text>
                                }
                            >
                                {filteredWarehouses.map((w: any) => (
                                    <Option key={w.id} value={w.id}>
                                        <Space>
                                            {w.type === 'site' ? <ShopOutlined style={{ color: '#fa8c16' }} /> : <BankOutlined style={{ color: '#722ed1' }} />}
                                            {w.name} ({w.code})
                                            {w.type === 'site' && w.project_id === selectedProjectId && (
                                                <Tag color="orange" style={{ marginLeft: 4, fontSize: 10 }}>This Project</Tag>
                                            )}
                                        </Space>
                                    </Option>
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
                                        styles={{ body: { padding: '12px' } }}
                                    >
                                        <div style={{ overflowX: 'auto' }}>
                                            <Row gutter={16} align="middle" style={{ minWidth: 800 }}>
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
                                                                {selectedProjectId && procurementFor === 'project' && (
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
                                                            optionFilterProp="label"
                                                            filterOption={(input, option: any) =>
                                                                (option?.label || '').toLowerCase().includes(input.toLowerCase())
                                                            }
                                                        >
                                                            {(showBoqOnly && selectedProjectId && procurementFor === 'project' && boqItems.length > 0
                                                                ? materials.filter(m => boqItems.some(bi => bi.material_id === m.id))
                                                                : materials
                                                            ).map(m => (
                                                                <Option key={m.id} value={m.id} label={`${m.name} ${m.material_code}`}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <span>{m.name} ({m.material_code})</span>
                                                                        {procurementFor === 'project' && boqItems.find(bi => bi.material_id === m.id) && (
                                                                            <Tag color="blue" style={{ marginLeft: 8 }}>BOQ</Tag>
                                                                        )}
                                                                    </div>
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
                                                        <InputNumber min={0.01} controls={false} style={{ width: '100%' }} placeholder="Qty" />
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
                                                            controls={false}
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
                                                        <InputNumber min={0} max={100} controls={false} style={{ width: '100%' }} suffix="%" />
                                                    </Form.Item>
                                                </Col>

                                                <Col span={3} style={{ textAlign: 'right' }}>
                                                    <div style={{ padding: '30px 0 0 0' }}>
                                                        {items[index] ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                                                <Text strong>
                                                                    {'₹' + ((items[index].quantity || 0) * (items[index].unit_price || 0) * (1 + (items[index].tax_percentage || 0) / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </Text>
                                                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                                                    {(() => {
                                                                        const base = (items[index].quantity || 0) * (items[index].unit_price || 0)
                                                                        const tax = base * (items[index].tax_percentage || 0) / 100
                                                                        if (gstType === 'intra_state') {
                                                                            return `CGST: ₹${(tax / 2).toFixed(2)} | SGST: ₹${(tax / 2).toFixed(2)}`
                                                                        } else {
                                                                            return `IGST: ₹${tax.toFixed(2)}`
                                                                        }
                                                                    })()}
                                                                </Text>
                                                            </div>
                                                        ) : (
                                                            <Text strong>₹0.00</Text>
                                                        )}
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
                                        </div>
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
                        <Col xs={24} sm={12} md={8}>
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
                            >
                                {paymentTermsTemplates.map(t => (
                                    <Option key={t.id} value={t.name}>{t.name}</Option>
                                ))}
                                <Option value="Net 30">Net 30 Days</Option>
                                <Option value="Net 45">Net 45 Days</Option>
                                <Option value="100% Advance">100% Advance</Option>
                            </Select>
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
                                {clientQuotations.map((q: any) => (
                                    <Option key={q.id} value={q.id}>{q.quotation_number} (v{q.version_number}) - ₹{Number(q.final_amount).toLocaleString()}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item label="Vendor Quote Ref" name="vendor_quote_ref">
                            <Input placeholder="e.g. Q-99 from Supplier" size="large" />
                        </Form.Item>
                    </div>

                    <div style={{ marginTop: '16px', padding: '16px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                        <Text strong style={{ display: 'block', marginBottom: '12px' }}>Shipping / Delivery Address Details</Text>
                        <Form.Item label="Address Line / Street" name="shipping_street" rules={[{ required: true, message: 'Street Address is required' }]}>
                            <Input.TextArea rows={2} placeholder="Building, Street, Area..." />
                        </Form.Item>
                        <div style={twoColumnGridStyle}>
                            <Form.Item label="City / District" name="shipping_city">
                                <Input placeholder="City" size="large" />
                            </Form.Item>
                            <Form.Item label="State" name="shipping_state" rules={[{ required: true, message: 'State is required for GST' }]}>
                                <Select placeholder="Select State" showSearch optionFilterProp="children" size="large">
                                    {Object.entries(INDIA_STATE_CODES).map(([code, name]) => (
                                        <Option key={code} value={code}>{name} ({code})</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item label="Pincode" name="shipping_pincode">
                                <Input placeholder="000000" maxLength={6} size="large" />
                            </Form.Item>
                        </div>
                    </div>

                    <Form.Item label="Notes / Terms & Conditions" name="notes">
                        <Input.TextArea rows={4} placeholder="Additional terms..." />
                    </Form.Item>
                </SectionCard>

                <Card style={actionCardStyle}>
                    <div style={{ ...flexBetweenStyle, flexWrap: 'wrap', gap: 12 }}>
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
