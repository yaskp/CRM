import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, Input, Button, Card, Row, Col, Space, InputNumber, Table, DatePicker, Select, Typography, App, Tabs, Checkbox } from 'antd'
import { PlusOutlined, DeleteOutlined, SaveOutlined, ArrowLeftOutlined, CalculatorOutlined, UserOutlined, CalendarOutlined, ToolOutlined, ShoppingCartOutlined, LayoutOutlined } from '@ant-design/icons'
import { quotationService } from '../../services/api/quotations'
import { leadService } from '../../services/api/leads'
import { annexureService } from '../../services/api/annexures'
import { materialService } from '../../services/api/materials'
import { unitService } from '../../services/api/units'
import { workTemplateService } from '../../services/api/workTemplates'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select

import { workItemTypeService } from '../../services/api/workItemTypes'
import { masterService } from '../../services/api/master'
import { calculateGSTBreakup, GSTType, detectGSTType } from '../../utils/gstUtils'

const QuotationForm = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { message } = App.useApp()
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [leads, setLeads] = useState<any[]>([])
    const [branches, setBranches] = useState<any[]>([])
    const [annexures, setAnnexures] = useState<any[]>([])
    const [materials, setMaterials] = useState<any[]>([])
    const [units, setUnits] = useState<any[]>([])
    const [templates, setTemplates] = useState<any[]>([])
    const [items, setItems] = useState<any[]>([{
        key: Date.now(),
        item_type: 'material',
        description: '',
        quantity: 1,
        unit: 'Nos',
        rate: 0,
        reference_id: null
    }])
    const [totals, setTotals] = useState({ subtotal: 0, discount: 0, final: 0, gst: 0, grandTotal: 0 })
    const [selectedLead, setSelectedLead] = useState<any>(null)
    const [workItemTypes, setWorkItemTypes] = useState<any[]>([])
    const [gstType, setGstType] = useState<GSTType>('intra_state')
    const [scopeMatrix, setScopeMatrix] = useState<any[]>([])

    const [selectedScopeTemplate, setSelectedScopeTemplate] = useState<number | undefined>(undefined)
    const [selectedPaymentTemplate, setSelectedPaymentTemplate] = useState<number | undefined>(undefined)
    const [selectedTermsTemplate, setSelectedTermsTemplate] = useState<number | undefined>(undefined)

    const isEdit = !!id

    // Get lead_id from URL query params (when coming from Lead page)
    const searchParams = new URLSearchParams(window.location.search)
    const leadIdFromUrl = searchParams.get('lead_id')

    useEffect(() => {
        (async () => {
            const initialData = await fetchInitialData()
            if (isEdit && initialData) {
                await fetchQuotation(initialData.annexures)
            }
        })()
    }, [id])

    const fetchInitialData = async () => {
        try {
            const [leadsRes, annexRes, matsRes, unitsRes, workTypesRes, branchRes, templatesRes] = await Promise.all([
                leadService.getLeads({ limit: 100 }),
                annexureService.getAnnexures(),
                materialService.getMaterials({ limit: 500 }),
                unitService.getUnits({ limit: 1000 }),
                workItemTypeService.getWorkItemTypes({ limit: 1000 }),
                masterService.getBranches(),
                workTemplateService.getTemplates()
            ])

            setWorkItemTypes(workTypesRes.data || [])
            setBranches(branchRes.branches || [])

            // Filter leads that don't have quotations yet (status: new, contacted, qualified)
            // Or show all if editing
            const allLeads = leadsRes.leads || []
            const filteredLeads = isEdit ? allLeads : allLeads.filter((lead: any) =>
                !lead.status || ['new', 'contacted', 'qualified'].includes(lead.status)
            )

            setLeads(filteredLeads)
            const annexuresList = annexRes.annexures || []
            setAnnexures(annexuresList)
            setMaterials(matsRes.materials || [])
            setUnits(unitsRes.units || [])
            setTemplates(templatesRes.templates || [])

            // Auto-populate lead if coming from Lead page
            if (leadIdFromUrl && !isEdit) {
                const selectedLead = allLeads.find((l: any) => l.id === Number(leadIdFromUrl))
                if (selectedLead) {
                    form.setFieldsValue({ lead_id: selectedLead.id })
                    setSelectedLead(selectedLead)
                }
            }

            return { annexures: annexuresList }
        } catch (error) {
            console.error('Failed to fetch initial data:', error)
            return null
        }
    }

    const fetchQuotation = async (availableAnnexures: any[] = []) => {
        setLoading(true)
        try {
            const res = await quotationService.getQuotation(Number(id))
            const quote = res.quotation

            form.setFieldsValue({
                lead_id: quote.lead_id,
                billing_unit_id: quote.billing_unit_id,
                valid_until: quote.valid_until ? dayjs(quote.valid_until) : null,
                discount_percentage: quote.discount_percentage || 0,
                payment_terms: quote.payment_terms,
                annexure_id: quote.annexure_id,
                client_scope: quote.client_scope,
                contractor_scope: quote.contractor_scope,
                terms_conditions: quote.terms_conditions || ''
            })

            // Set Selected Templates
            if (quote.annexure_id) {
                setSelectedScopeTemplate(quote.annexure_id)
            }

            // Attempt to reverse-match text to template for Dropdowns
            // This is "best effort" - if the text was modified, it won't match, which is fine.
            if (quote.payment_terms && availableAnnexures.length > 0) {
                const matched = availableAnnexures.find(a => {
                    const text = getClausesText(a)
                    return text && text.trim() === quote.payment_terms.trim()
                })
                if (matched) setSelectedPaymentTemplate(matched.id)
            }

            if (quote.terms_conditions && availableAnnexures.length > 0) {
                const matched = availableAnnexures.find(a => {
                    const text = getClausesText(a)
                    return text && text.trim() === quote.terms_conditions.trim()
                })
                if (matched) setSelectedTermsTemplate(matched.id)
            }

            if (quote.scope_matrix && Array.isArray(quote.scope_matrix)) {
                setScopeMatrix(quote.scope_matrix.map((it: any, idx: number) => ({
                    ...it,
                    key: it.key || it.id || Date.now() + idx
                })))
            } else if (availableAnnexures.length > 0 && quote.annexure_id) {
                // Fallback: If scope_matrix is missing in DB but we have ID, try to load from generic template?
                // No, only load from template if user explicitly selected it.
                // But older quotes might have annexure_id but no scope_matrix JSON.
                // We could consider auto-loading here if we wanted to be helpful, strictly for migrating old data?
                // Let's stick to DB data to avoid overwriting edits.
            }

            if (quote.items && quote.items.length > 0) {
                const mappedItems = quote.items.map((it: any) => ({
                    ...it,
                    key: it.id || Math.random()
                }))
                setItems(mappedItems)

                // Auto-detect GST for existing quote
                let detectedGst: GSTType = 'intra_state'
                const clientGstin = quote.lead?.client?.gstin
                const billingUnit = branches.find(b => b.id === quote.billing_unit_id) || branches[0]

                if (clientGstin) {
                    detectedGst = detectGSTType(billingUnit?.state_code || '27', clientGstin.substring(0, 2))
                }
                setGstType(detectedGst)
                form.setFieldsValue({ gst_type: detectedGst })
                calculateTotals(mappedItems, quote.discount_percentage || 0, detectedGst)
            }
        } catch (error) {
            message.error('Failed to fetch quotation details')
        } finally {
            setLoading(false)
        }
    }

    const calculateTotals = (currentItems: any[], discountPercent: number, currentGstType: GSTType = gstType) => {
        let subtotal = 0
        let totalCGST = 0
        let totalSGST = 0
        let totalIGST = 0
        let grandTotal = 0

        const afterDiscountRatio = (100 - discountPercent) / 100

        currentItems.forEach(it => {
            const lineSubtotal = (it.quantity * it.rate || 0) * afterDiscountRatio
            const breakup = calculateGSTBreakup(lineSubtotal, 0, currentGstType) // Set GST rate to 0% as requested

            subtotal += (it.quantity * it.rate || 0)
            totalCGST += breakup.cgst_amount
            totalSGST += breakup.sgst_amount
            totalIGST += breakup.igst_amount
            grandTotal += breakup.grand_total
        })

        setTotals({
            subtotal,
            discount: (subtotal * discountPercent) / 100,
            final: subtotal - ((subtotal * discountPercent) / 100),
            gst: totalCGST + totalSGST + totalIGST,
            grandTotal,
            cgst: totalCGST,
            sgst: totalSGST,
            igst: totalIGST
        } as any)
    }

    const handleItemChange = (key: any, field: string, value: any) => {
        const newItems = items.map(it => {
            if (it.key === key) {
                const updated = { ...it, [field]: value }

                if (field === 'reference_id' && updated.item_type === 'material') {
                    const material = materials.find(m => m.id === value)
                    if (material) {
                        updated.description = material.name
                        // Convert unit to string if it's an array
                        updated.unit = Array.isArray(material.unit) ? material.unit[0] : material.unit
                        updated.rate = material.standard_rate || 0
                    }
                }

                updated.amount = updated.quantity * updated.rate
                return updated
            }
            return it
        })
        setItems(newItems)
        calculateTotals(newItems, form.getFieldValue('discount_percentage') || 0)
    }

    const addItem = (type: string) => {
        const newItem = {
            key: Date.now(),
            item_type: type,
            description: '',
            quantity: 1,
            unit: type === 'material' ? 'Nos' : (type === 'labour' ? 'Sqm' : 'LS'),
            rate: 0,
            reference_id: null
        }
        setItems([...items, newItem])
    }

    const addScopeRow = (isCategory = false) => {
        setScopeMatrix([...scopeMatrix, {
            key: Date.now(),
            description: '',
            client_scope: false,
            contractor_scope: !isCategory,
            remarks: '',
            is_category: isCategory
        }])
    }

    const removeScopeRow = (key: any) => {
        setScopeMatrix(scopeMatrix.filter(it => it.key !== key))
    }

    const handleScopeChange = (key: any, field: string, value: any) => {
        setScopeMatrix(scopeMatrix.map(it =>
            it.key === key ? { ...it, [field]: value } : it
        ))
    }

    const removeItem = (key: any) => {
        if (items.length === 1) return
        const newItems = items.filter(it => it.key !== key)
        setItems(newItems)
        calculateTotals(newItems, form.getFieldValue('discount_percentage') || 0)
    }

    const getClausesText = (annex: any) => {
        // If specific scope text exists (client_scope, contractor_scope, etc), prioritize that?
        // Actually, the API structure seems to put the text in 'clauses' array generally.

        let terms = '';
        if (annex.clauses) {
            try {
                const parsed = typeof annex.clauses === 'string' ? JSON.parse(annex.clauses) : annex.clauses;
                if (Array.isArray(parsed)) {
                    terms = parsed.join('\n');
                } else if (typeof parsed === 'string') {
                    terms = parsed;
                }
            } catch (e) {
                // If parse fails, it might be a raw string
                terms = annex.clauses;
            }
        }

        // If no clauses found, fall back to description if useful
        if (!terms && annex.description && annex.description !== annex.name) {
            terms = annex.description;
        }

        return terms;
    }

    // const handleAnnexureChange ... (moved to individual scope loads)

    const onFinish = async (values: any) => {
        setLoading(true)
        try {
            const payload = {
                ...values,
                valid_until: values.valid_until ? values.valid_until.format('YYYY-MM-DD') : null,
                items: items.map(({ description, quantity, unit, rate, amount, item_type, reference_id, work_item_type_id }) => ({
                    description,
                    quantity,
                    unit: (Array.isArray(unit) ? unit[0] : unit) || 'LS',
                    rate,
                    amount,
                    item_type,
                    reference_id,
                    work_item_type_id
                })),
                scope_matrix: scopeMatrix,
                total_amount: totals.subtotal,
                final_amount: totals.final,
                gst_type: gstType,
                cgst_amount: (totals as any).cgst || 0,
                sgst_amount: (totals as any).sgst || 0,
                igst_amount: (totals as any).igst || 0,
            }

            if (isEdit) {
                await quotationService.updateQuotation(Number(id), payload)
                message.success('Quotation updated successfully')
            } else {
                await quotationService.createQuotation(payload)
                message.success('Quotation created successfully')
            }
            navigate('/sales/quotations')
        } catch (error: any) {
            console.error(error);
            message.error(error.response?.data?.message || 'Failed to save quotation');
        } finally {
            setLoading(false)
        }
    }

    const materialItems = items.filter(it => it.item_type === 'material')
    const labourItems = items.filter(it => it.item_type === 'labour')
    const contractItems = items.filter(it => it.item_type === 'contract')

    const getItemColumns = (itemType: string) => [
        {
            title: 'Work Type',
            key: 'work_item_type_id',
            width: 280,
            render: (_: any, record: any) => (
                <Select
                    showSearch
                    placeholder="Select Type"
                    value={record.work_item_type_id}
                    onChange={v => handleItemChange(record.key, 'work_item_type_id', v)}
                    style={{ width: '100%', height: 'auto' }}
                    variant="borderless"
                    popupMatchSelectWidth={false}
                    optionFilterProp="label"
                >
                    {workItemTypes.map(t => (
                        <Option key={t.id} value={t.id} label={t.name}>
                            <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', padding: '4px 0' }}>
                                {t.name}
                            </div>
                        </Option>
                    ))}
                </Select>
            )
        },
        ...(itemType === 'material' ? [{
            title: 'Material',
            key: 'material',
            width: 250,
            render: (_: any, record: any) => (
                <Select
                    showSearch
                    placeholder="Select Material"
                    value={record.reference_id}
                    onChange={v => handleItemChange(record.key, 'reference_id', v)}
                    style={{ width: '100%' }}
                    optionFilterProp="children"
                >
                    {materials.map(m => (
                        <Option key={m.id} value={m.id}>
                            {m.name} ({m.material_code})
                        </Option>
                    ))}
                </Select>
            )
        }] : []),
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (text: string, record: any) => (
                <Input.TextArea
                    placeholder={itemType === 'material' ? 'Auto-filled from material' : 'Enter work description'}
                    value={text}
                    onChange={e => handleItemChange(record.key, 'description', e.target.value)}
                    autoSize={{ minRows: 1, maxRows: 6 }}
                    variant="borderless"
                    style={{ padding: '4px 8px', whiteSpace: 'normal', wordBreak: 'break-word' }}
                />
            )
        },
        {
            title: 'Unit',
            dataIndex: 'unit',
            key: 'unit',
            width: 100,
            render: (text: string, record: any) => (
                <Select
                    value={text}
                    onChange={v => handleItemChange(record.key, 'unit', v)}
                    variant="borderless"
                    style={{ width: '100%' }}
                    showSearch
                    optionFilterProp="children"
                >
                    {units.map(unit => (
                        <Option key={unit.id} value={unit.code}>
                            {unit.code}
                        </Option>
                    ))}
                </Select>
            )
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 100,
            render: (val: number, record: any) => (
                <InputNumber
                    min={0.01}
                    value={val}
                    onChange={v => handleItemChange(record.key, 'quantity', v)}
                    variant="borderless"
                    style={{ width: '100%' }}
                />
            )
        },
        {
            title: 'Rate',
            dataIndex: 'rate',
            key: 'rate',
            width: 150,
            render: (val: number, record: any) => (
                <InputNumber
                    min={0}
                    precision={2}
                    value={val}
                    onChange={v => handleItemChange(record.key, 'rate', v)}
                    variant="borderless"
                    prefix="₹"
                    style={{ width: '100%' }}
                />
            )
        },
        {
            title: 'Amount',
            key: 'amount',
            width: 150,
            align: 'right' as const,
            render: (_: any, record: any) => (
                <Text strong style={{ color: '#1890ff' }}>₹{(record.quantity * record.rate || 0).toLocaleString('en-IN')}</Text>
            )
        },
        {
            title: '',
            key: 'action',
            width: 50,
            render: (_: any, record: any) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeItem(record.key)}
                />
            )
        }
    ]

    return (
        <div style={{ padding: '0 24px 40px', maxWidth: 1400, margin: '0 auto' }}>
            {/* HEADER WITH LEAD INFO */}
            <Card
                variant="borderless"
                style={{
                    marginBottom: 24,
                    background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                    borderRadius: 12,
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)'
                }}
            >
                <style>{`
                    .ant-select-selection-item {
                        white-space: normal !important;
                        word-break: break-word !important;
                        line-height: 1.4 !important;
                        padding-top: 4px !important;
                        padding-bottom: 4px !important;
                        display: flex !important;
                        align-items: center !important;
                    }
                    .ant-select-single.ant-select-show-arrow .ant-select-selection-item {
                        padding-right: 18px !important;
                    }
                    .ant-table-cell {
                        vertical-align: top !important;
                    }
                `}</style>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space direction="vertical" size={0}>
                        <Space>
                            <Button
                                icon={<ArrowLeftOutlined />}
                                type="text"
                                onClick={() => navigate(-1)}
                                style={{ color: 'white' }}
                            />
                            <Title level={3} style={{ margin: 0, color: 'white' }}>
                                {isEdit ? 'Update Quotation' : 'Create New Quotation'}
                            </Title>
                        </Space>
                        {selectedLead && (
                            <div style={{ marginLeft: 36, marginTop: 8 }}>
                                <Space>
                                    <UserOutlined style={{ color: 'rgba(255,255,255,0.9)' }} />
                                    <Text style={{ color: 'white', fontSize: 16 }}>
                                        For: <Text strong style={{ color: 'white' }}>{selectedLead.name}</Text>
                                        {selectedLead.company_name && (
                                            <Text style={{ color: 'rgba(255,255,255,0.8)' }}> - {selectedLead.company_name}</Text>
                                        )}
                                    </Text>
                                </Space>
                            </div>
                        )}
                        {!selectedLead && !isEdit && (
                            <Text style={{ marginLeft: 36, color: 'rgba(255,255,255,0.9)' }}>
                                Professional price estimate with detailed scope breakdown
                            </Text>
                        )}
                    </Space>

                </div>
            </Card>

            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ discount_percentage: 0 }}>
                {/* TOP SECTION - Basic Details */}
                <Card
                    variant="borderless"
                    style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: 12 }}
                >
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item
                                name="lead_id"
                                label="Client / Lead"
                                rules={[{ required: true, message: 'Please select a lead' }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Search Leads (showing leads without quotations)..."
                                    suffixIcon={<UserOutlined />}
                                    size="large"
                                    optionFilterProp="label"
                                    optionLabelProp="label"
                                    onChange={(value) => {
                                        const lead = leads.find(l => l.id === value)
                                        setSelectedLead(lead)

                                        // Auto-detect GST
                                        let detectedGst: GSTType = 'intra_state'
                                        const currentBranchId = form.getFieldValue('billing_unit_id')
                                        const branch = branches.find(b => b.id === currentBranchId) || branches[0]

                                        if (lead?.client?.gstin) {
                                            const clientState = lead.client.gstin.substring(0, 2)
                                            detectedGst = detectGSTType(branch?.state_code || '27', clientState)
                                            message.info(`GST auto-detected as ${detectedGst === 'intra_state' ? 'Intra-State (Local)' : 'Inter-State (Outside)'} based on GSTIN ${lead.client.gstin}`)
                                        }
                                        else if (lead?.state_code || lead?.client?.state) {
                                            // PRIORITIZE: Lead's direct state code (from new StateSelect) -> Client's State -> Manual State Map
                                            // Assuming lead.state_code is now available from backend
                                            const destinationCode = lead.state_code || '27'
                                            detectedGst = detectGSTType(branch?.state_code || '27', destinationCode)
                                            message.info(`GST auto-detected based on location: ${lead.city || ''}, ${lead.state || ''}`)
                                        }

                                        setGstType(detectedGst)
                                        form.setFieldsValue({ gst_type: detectedGst })
                                        calculateTotals(items, form.getFieldValue('discount_percentage') || 0, detectedGst)
                                    }}
                                    disabled={!!leadIdFromUrl && !isEdit}
                                >
                                    {leads.map(lead => (
                                        <Option
                                            key={lead.id}
                                            value={lead.id}
                                            label={`${lead.name}${lead.company_name ? ' - ' + lead.company_name : ''}`}
                                        >
                                            <div>
                                                <Text strong>{lead.name}</Text>
                                                {lead.company_name && <div><Text type="secondary" style={{ fontSize: 12 }}>{lead.company_name}</Text></div>}
                                            </div>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="billing_unit_id"
                                label="Billing From (VHSHRI Unit)"
                            >
                                <Select
                                    size="large"
                                    showSearch
                                    optionFilterProp="children"
                                    placeholder="Select Branch/Unit"
                                    onChange={(val) => {
                                        const branch = branches.find(b => b.id === val)
                                        if (selectedLead?.client?.gstin && branch) {
                                            const detected = detectGSTType(branch.state_code, selectedLead.client.gstin.substring(0, 2))
                                            setGstType(detected)
                                            form.setFieldsValue({ gst_type: detected })
                                            calculateTotals(items, form.getFieldValue('discount_percentage'), detected)
                                        }
                                    }}
                                >
                                    {branches.map(b => (
                                        <Option key={b.id} value={b.id}>
                                            {b.branch_name} ({b.state_code}) - GST: {b.gstin}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="valid_until" label="Valid Until">
                                <DatePicker
                                    style={{ width: '100%' }}
                                    size="large"
                                    suffixIcon={<CalendarOutlined />}
                                />
                            </Form.Item>
                        </Col>
                        {/* GST Treatment Hidden as per user request */}
                    </Row>

                </Card>

                {/* WORK TEMPLATE SELECTOR - Prominent at top */}
                <Card
                    style={{ marginBottom: 24, borderRadius: 12, border: '1px dashed #14b8a6', background: '#f0fdfa' }}
                    styles={{ body: { padding: '12px 24px' } }}
                >
                    <Space size="large">
                        <Text strong><LayoutOutlined style={{ color: '#0d9488' }} /> Select Work Template:</Text>
                        <Select
                            showSearch
                            optionFilterProp="children"
                            placeholder="Select Work Template (e.g. D-Wall, Grabbing)"
                            style={{ width: 350 }}
                            size="large"
                            onChange={(templateId) => {
                                const template = templates.find(t => t.id === templateId);
                                if (template && template.items) {
                                    const templateItems = template.items.map((it: any) => ({
                                        key: Math.random(),
                                        description: it.description || it.workItemType?.name || 'Item',
                                        quantity: 1,
                                        unit: it.unit || it.workItemType?.uom || 'Nos',
                                        rate: 0,
                                        item_type: it.item_type || 'labour',
                                        work_item_type_id: it.work_item_type_id
                                    }));

                                    // Append template items to existing items
                                    const filteredItems = items.filter(it => it.description || it.work_item_type_id);
                                    setItems([...filteredItems, ...templateItems]);
                                    message.success(`Loaded ${templateItems.length} items from ${template.name}`);
                                }
                            }}
                        >
                            {templates.map(t => (
                                <Option key={t.id} value={t.id}>{t.name}</Option>
                            ))}
                        </Select>
                        <Text type="secondary" style={{ fontSize: 13 }}>Quickly load pre-defined work items and scope.</Text>
                    </Space>
                </Card>

                {/* LABOUR / CONTRACT WORK SECTION - Now before Materials */}
                <Card
                    variant="borderless"
                    style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: 12 }}
                    title={
                        <Space>
                            <ToolOutlined style={{ color: '#52c41a' }} />
                            <Text strong>Labour & Contract Work</Text>
                        </Space>
                    }
                >
                    <Tabs
                        defaultActiveKey="labour"
                        items={[
                            {
                                key: 'labour',
                                label: 'Labour Work',
                                children: (
                                    <>
                                        <Table
                                            columns={getItemColumns('labour')}
                                            dataSource={labourItems}
                                            pagination={false}
                                            rowKey="key"
                                            size="small"
                                            scroll={{ x: 'max-content' }}
                                        />
                                        <Button
                                            type="dashed"
                                            block
                                            icon={<PlusOutlined />}
                                            onClick={() => addItem('labour')}
                                            style={{ marginTop: 16, height: 40 }}
                                        >
                                            Add Extra Labour Row
                                        </Button>
                                    </>
                                )
                            },
                            {
                                key: 'contract',
                                label: 'Contract Work',
                                children: (
                                    <>
                                        <Table
                                            columns={getItemColumns('contract')}
                                            dataSource={contractItems}
                                            pagination={false}
                                            rowKey="key"
                                            size="small"
                                            scroll={{ x: 'max-content' }}
                                        />
                                        <Button
                                            type="dashed"
                                            block
                                            icon={<PlusOutlined />}
                                            onClick={() => addItem('contract')}
                                            style={{ marginTop: 16, height: 40 }}
                                        >
                                            Add Extra Contract Row
                                        </Button>
                                    </>
                                )
                            }
                        ]}
                    />
                </Card>

                {/* MATERIAL COST SECTION - Now after Work sections */}
                <Card
                    variant="borderless"
                    style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: 12 }}
                    title={
                        <Space>
                            <ShoppingCartOutlined style={{ color: '#1890ff' }} />
                            <Text strong>Material Cost (Estimate for Reference)</Text>
                        </Space>
                    }
                >
                    <Table
                        columns={getItemColumns('material')}
                        dataSource={materialItems}
                        pagination={false}
                        rowKey="key"
                        size="small"
                        scroll={{ x: 'max-content' }}
                    />
                    <Button
                        type="dashed"
                        block
                        icon={<PlusOutlined />}
                        onClick={() => addItem('material')}
                        style={{ marginTop: 16, height: 40 }}
                    >
                        Add Extra Material Row
                    </Button>
                    {materialItems.length > 0 && (
                        <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 8, textAlign: 'right' }}>
                            <Text strong style={{ fontSize: 15 }}>
                                Total Material Cost: ₹{materialItems.reduce((acc, it) => acc + (it.quantity * it.rate || 0), 0).toLocaleString('en-IN')}
                            </Text>
                        </div>
                    )}
                </Card>

                {/* SCOPE SECTIONS */}
                <Card
                    variant="borderless"
                    style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: 12 }}
                    title={<Text strong>Scope Matrix (Work Responsibilities)</Text>}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                        <Text type="secondary">Define who is responsible for what (Client vs VHSHRI)</Text>
                        <Space>
                            <Select
                                placeholder="Select Template"
                                style={{ width: 600 }}
                                popupMatchSelectWidth={false}
                                value={selectedScopeTemplate}
                                onChange={(val) => {
                                    setSelectedScopeTemplate(val)
                                    form.setFieldsValue({ annexure_id: val })
                                    const annex = annexures.find(a => a.id === val);
                                    if (annex) {
                                        if (annex.scope_matrix && Array.isArray(annex.scope_matrix)) {
                                            setScopeMatrix(annex.scope_matrix.map((it: any, idx: number) => ({
                                                ...it,
                                                key: Date.now() + idx
                                            })))
                                        } else if (annex.clauses) {
                                            // Fallback from old clauses
                                            setScopeMatrix(annex.clauses.map((c: string, idx: number) => ({
                                                key: Date.now() + idx,
                                                description: c,
                                                client_scope: annex.type === 'client_scope',
                                                contractor_scope: annex.type === 'contractor_scope',
                                                remarks: ''
                                            })))
                                        }
                                    }
                                }}
                                showSearch
                                optionFilterProp="children"
                            >
                                {annexures.filter(a => ['scope_matrix', 'client_scope', 'contractor_scope'].includes(a.type)).map(a => (
                                    <Option key={a.id} value={a.id}>{a.name} ({a.category_name})</Option>
                                ))}
                            </Select>
                            <Button icon={<PlusOutlined />} onClick={() => addScopeRow(false)}>Add Item</Button>
                            <Button icon={<PlusOutlined />} onClick={() => addScopeRow(true)}>Add Header</Button>
                        </Space>
                    </div>

                    <Table
                        dataSource={scopeMatrix}
                        pagination={false}
                        size="small"
                        bordered
                        columns={[
                            {
                                title: 'Description of Item',
                                dataIndex: 'description',
                                render: (text: string, record: any) => (
                                    <Input.TextArea
                                        autoSize={{ minRows: 1 }}
                                        value={text}
                                        onChange={e => handleScopeChange(record.key, 'description', e.target.value)}
                                        variant="borderless"
                                        placeholder={record.is_category ? "Category Header (e.g. Administration)" : "Enter scope item description"}
                                        style={{
                                            fontWeight: record.is_category ? 'bold' : 'normal',
                                            fontSize: record.is_category ? '15px' : '14px'
                                        }}
                                    />
                                )
                            },
                            {
                                title: 'Client',
                                key: 'client_scope',
                                width: 80,
                                align: 'center',
                                render: (_: any, record: any) => !record.is_category && (
                                    <Checkbox
                                        checked={record.client_scope}
                                        onChange={e => handleScopeChange(record.key, 'client_scope', e.target.checked)}
                                    />
                                )
                            },
                            {
                                title: 'VHSHRI',
                                key: 'contractor_scope',
                                width: 80,
                                align: 'center',
                                render: (_: any, record: any) => !record.is_category && (
                                    <Checkbox
                                        checked={record.contractor_scope}
                                        onChange={e => handleScopeChange(record.key, 'contractor_scope', e.target.checked)}
                                    />
                                )
                            },
                            {
                                title: 'Remarks',
                                dataIndex: 'remarks',
                                width: 200,
                                render: (text: string, record: any) => !record.is_category && (
                                    <Input
                                        value={text}
                                        onChange={e => handleScopeChange(record.key, 'remarks', e.target.value)}
                                        variant="borderless"
                                        placeholder="Optional remarks"
                                    />
                                )
                            },
                            {
                                title: '',
                                width: 50,
                                render: (_: any, record: any) => (
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeScopeRow(record.key)}
                                    />
                                )
                            }
                        ]}
                    />
                </Card>

                <Card
                    variant="borderless"
                    style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: 12 }}
                >
                    <Row gutter={24}>
                        <Col span={24}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text strong>Payment Terms</Text>
                                <Select
                                    placeholder="Load Template"
                                    style={{ width: 500 }}
                                    popupMatchSelectWidth={false}
                                    size="small"
                                    value={selectedPaymentTemplate}
                                    onChange={(val) => {
                                        setSelectedPaymentTemplate(val)
                                        const annex = annexures.find(a => a.id === val);
                                        if (annex) {
                                            const text = getClausesText(annex);
                                            form.setFieldsValue({ payment_terms: text })
                                        }
                                    }}
                                >
                                    {annexures.filter(a => a.type === 'payment_terms' || a.id === 1).map(a => (
                                        <Option key={a.id} value={a.id}>{a.title || a.name} {a.category_name ? `(${a.category_name})` : ''}</Option>
                                    ))}
                                </Select>
                            </div>
                            <Form.Item name="payment_terms">
                                <Input.TextArea rows={3} placeholder="Standard payment schedule..." />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text strong>Terms & Conditions</Text>
                                <Select
                                    placeholder="Load Template"
                                    style={{ width: 500 }}
                                    popupMatchSelectWidth={false}
                                    size="small"
                                    value={selectedTermsTemplate}
                                    onChange={(val) => {
                                        setSelectedTermsTemplate(val)
                                        const annex = annexures.find(a => a.id === val);
                                        if (annex) {
                                            const text = getClausesText(annex);
                                            form.setFieldsValue({ terms_conditions: text })
                                        }
                                    }}
                                >
                                    {annexures.filter(a => a.type === 'general_terms' || a.id === 1).map(a => (
                                        <Option key={a.id} value={a.id}>{a.title || a.name} {a.category_name ? `(${a.category_name})` : ''}</Option>
                                    ))}
                                </Select>
                            </div>
                            <Form.Item name="terms_conditions">
                                <Input.TextArea rows={4} placeholder="Standard terms and conditions..." />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                {/* FINANCIAL SUMMARY - Bottom */}
                <Card
                    variant="borderless"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: 12, background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', color: 'white' }}
                >
                    <Row gutter={24} align="middle">
                        <Col span={18}>
                            <Title level={4} style={{ color: 'white', marginBottom: 24 }}>
                                <CalculatorOutlined /> Financial Summary
                            </Title>

                            <Row gutter={24}>
                                <Col span={6}>
                                    <div style={{ marginBottom: 8 }}>
                                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Subtotal</Text>
                                        <div><Text strong style={{ color: 'white', fontSize: 16 }}>₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></div>
                                    </div>
                                </Col>
                                <Col span={4}>
                                    <Form.Item name="discount_percentage" label={<Text style={{ color: 'white', fontSize: 12 }}>Discount (%)</Text>} style={{ marginBottom: 0 }}>
                                        <InputNumber
                                            min={0}
                                            max={100}
                                            style={{ width: '100%' }}
                                            onChange={v => calculateTotals(items, v || 0)}
                                            precision={2}
                                        />
                                    </Form.Item>
                                    {totals.discount > 0 && (
                                        <Text style={{ color: '#ffd666', fontSize: 12 }}>- ₹{totals.discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                    )}
                                </Col>
                                <Col span={14}>
                                    <div style={{ marginBottom: 8, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 16 }}>
                                        <Text style={{ color: 'white', fontWeight: 600, fontSize: 12 }}>Final Quotation Value</Text>
                                        <div><Text strong style={{ color: '#fff', fontSize: 32 }}>₹{totals.final.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></div>
                                        <Text style={{ color: '#ffd666', fontSize: 13, fontWeight: 500 }}>* GST Extra as applicable</Text>
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={6} style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: 24 }}>
                            <div style={{ opacity: 0.8 }}>
                                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>Terms:</Text>
                                <div style={{ fontSize: 18, color: 'white', fontWeight: 600 }}>GST EXTRA</div>
                            </div>
                        </Col>
                    </Row>
                </Card>
                {/* Floating Footer Action Bar */}
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 200, // Matching sidebar width
                    right: 0,
                    padding: '16px 24px',
                    background: 'white',
                    borderTop: '1px solid #e8e8e8',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
                    zIndex: 1000
                }}>
                    <Space size="large">
                        <div style={{ marginRight: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>Total Quotation Value</Text>
                            <Text strong style={{ fontSize: 22, color: '#0d9488' }}>
                                ₹{totals.final.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 10 }}>* GST EXTRA</Text>
                        </div>
                        <Button size="large" onClick={() => navigate('/sales/quotations')}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            icon={<SaveOutlined />}
                            onClick={() => {
                                // Simple confirmation check
                                if (!totals.grandTotal) {
                                    message.warning('Total amount is zero. Please add items.')
                                    return
                                }
                                form.submit()
                            }}
                            loading={loading}
                            style={{ background: '#0d9488', borderColor: '#0d9488', width: 200 }}
                        >
                            {isEdit ? 'Update Quotation' : 'Create Quotation'}
                        </Button>
                    </Space>
                </div>
            </Form>

            {/* Spacer for fixed footer */}
            <div style={{ height: 60 }} />
        </div>
    )
}

export default QuotationForm
