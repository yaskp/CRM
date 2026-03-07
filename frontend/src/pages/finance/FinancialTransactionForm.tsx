import { useState, useEffect } from 'react'
import { Form, Button, Card, App, Select, Input, InputNumber, Space, Typography, Divider, Row, Col, DatePicker, Radio, Tag } from 'antd'
import {
    DeleteOutlined,
    SaveOutlined,
    WalletOutlined,
    BankOutlined,
    InfoCircleOutlined,
    SafetyCertificateOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { financeService } from '../../services/api/finance'
import { projectService } from '../../services/api/projects'
import { vendorService } from '../../services/api/vendors'
import { clientService } from '../../services/api/clients'
import { purchaseOrderService } from '../../services/api/purchaseOrders'
import { workOrderService } from '../../services/api/workOrders'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import {
    getPrimaryButtonStyle,
    getSecondaryButtonStyle,
    largeInputStyle,
    actionCardStyle,
    flexBetweenStyle
} from '../../styles/styleUtils'
import { theme } from '../../styles/theme'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input
const { Text } = Typography

const FinancialTransactionForm = () => {
    const [loading, setLoading] = useState(false)
    const [projects, setProjects] = useState<any[]>([])
    const [vendors, setVendors] = useState<any[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [outstandingItems, setOutstandingItems] = useState<any[]>([])
    const [selectedAllocations, setSelectedAllocations] = useState<any[]>([])
    const [form] = Form.useForm()
    const navigate = useNavigate()
    const location = useLocation()
    const { message } = App.useApp()

    // Form State
    const [type, setType] = useState('payment')
    const [category, setCategory] = useState('vendor')

    useEffect(() => {
        fetchProjects()
        fetchVendors()
        fetchClients()
    }, [])

    // Handle URL Params for auto-population
    useEffect(() => {
        const query = new URLSearchParams(location.search)
        const vendorId = query.get('vendor_id')
        const projectId = query.get('project_id')
        const categoryParam = query.get('category')

        if (vendorId) {
            form.setFieldsValue({ vendor_id: Number(vendorId) })
            fetchOutstanding(Number(vendorId))
        }
        if (projectId) {
            form.setFieldsValue({ project_id: Number(projectId) })
        }
        if (categoryParam) {
            setCategory(categoryParam)
        }
    }, [location.search, vendors, projects]) // Wait for masters if needed, though they are async

    const fetchProjects = async () => {
        try {
            const response = await projectService.getProjects()
            setProjects(response.projects || [])
        } catch (error) {
            console.error('Failed to fetch projects')
        }
    }

    const fetchVendors = async () => {
        try {
            const response = await vendorService.getVendors()
            setVendors(response.vendors || [])
        } catch (error) {
            console.error('Failed to fetch vendors')
        }
    }

    const fetchClients = async () => {
        try {
            const response = await clientService.getClients()
            setClients(response.clients || [])
        } catch (error) {
            console.error('Failed to fetch clients')
        }
    }

    const fetchOutstanding = async (vendorId?: number, projectId?: number) => {
        const vId = vendorId || form.getFieldValue('vendor_id')
        const pId = projectId || form.getFieldValue('project_id')

        if (!vId) return

        setLoading(true)
        try {
            // Build filter params for POs (filter by vendor AND project, status=approved)
            const poParams: any = { vendor_id: vId, status: 'approved' }
            if (pId) {
                poParams.project_id = pId
            }

            // Build filter params for WOs (filter by project only, as they represent project-wide work/sections)
            // User feedback: WOs are project-associated, not vendor-associated in this workflow.
            const woParams: any = {}
            if (pId) {
                woParams.project_id = pId
            }

            const pos = await purchaseOrderService.getPurchaseOrders(poParams)
            const wos = await workOrderService.getWorkOrders(woParams)

            const combined = [
                ...(pos.purchaseOrders || []).map((p: any) => ({ ...p, type: 'PO', ref: p.po_number, balance: p.total_amount })),
                ...(wos.workOrders || []).map((w: any) => ({ ...w, type: 'WO', ref: w.work_order_number || `WO#${w.id}`, balance: w.final_amount || w.total_amount }))
            ]
            setOutstandingItems(combined)
        } catch (error) {
            message.error('Failed to fetch outstanding liabilities')
        } finally {
            setLoading(false)
        }
    }

    const handleAllocation = (item: any) => {
        const exists = selectedAllocations.find(a => a.id === item.id && a.type === item.type)
        if (exists) return

        setSelectedAllocations([...selectedAllocations, {
            ...item,
            allocated_amount: item.balance,
            tds_allocated: 0,
            retention_allocated: 0
        }])
    }

    const updateAllocation = (index: number, field: string, value: any) => {
        const newAlloc = [...selectedAllocations]
        newAlloc[index][field] = value
        setSelectedAllocations(newAlloc)

        // Update main form amount
        const totalNet = newAlloc.reduce((sum, a) => sum + (Number(a.allocated_amount) || 0), 0)
        const totalTds = newAlloc.reduce((sum, a) => sum + (Number(a.tds_allocated) || 0), 0)
        const totalRet = newAlloc.reduce((sum, a) => sum + (Number(a.retention_allocated) || 0), 0)

        // Over-payment Guard
        newAlloc.forEach(a => {
            const totalSettledVal = (Number(a.allocated_amount) || 0) + (Number(a.tds_allocated) || 0) + (Number(a.retention_allocated) || 0)
            if (totalSettledVal > Number(a.balance)) {
                message.warning(`Allocation for ${a.ref} exceeds remaining balance (₹${a.balance.toLocaleString()})`)
            }
        })

        form.setFieldsValue({
            amount: totalNet + totalTds + totalRet,
            net_amount: totalNet,
            tds_amount: totalTds,
            retention_amount: totalRet
        })
    }

    const onFinish = async (values: any) => {
        setLoading(true)
        try {
            const data = {
                ...values,
                transaction_date: values.transaction_date.format('YYYY-MM-DD'),
                type,
                category,
                allocations: selectedAllocations.map(a => ({
                    purchase_order_id: a.type === 'PO' ? a.id : null,
                    work_order_id: a.type === 'WO' ? a.id : null,
                    allocated_amount: a.allocated_amount,
                    tds_allocated: a.tds_allocated,
                    retention_allocated: a.retention_allocated
                }))
            }

            await financeService.createTransaction(data)
            message.success('Transaction recorded successfully!')
            navigate('/finance/transactions')
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to save transaction')
        } finally {
            setLoading(false)
        }
    }

    return (
        <PageContainer maxWidth={1100}>
            <PageHeader
                title="Record Financial Transaction"
                subtitle="Manage payments to vendors, receipts from clients, or general project expenses."
                icon={<WalletOutlined />}
            />

            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ transaction_date: dayjs(), payment_mode: 'neft' }}>
                <Row gutter={24}>
                    <Col xs={24} lg={14}>
                        <SectionCard title="Basic Details" icon={<SafetyCertificateOutlined />}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Transaction Type">
                                        <Radio.Group value={type} onChange={e => setType(e.target.value)} buttonStyle="solid">
                                            <Radio.Button value="payment">Payment (Money Out)</Radio.Button>
                                            <Radio.Button value="receipt">Receipt (Money In)</Radio.Button>
                                        </Radio.Group>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Category">
                                        <Select value={category} onChange={setCategory} size="large" style={largeInputStyle}>
                                            <Option value="vendor">Vendor / Subcontractor</Option>
                                            <Option value="client">Client / Revenue</Option>
                                            <Option value="site_expense">Site Expense (Petty Cash)</Option>
                                            <Option value="salary">Salary / Wages</Option>
                                            <Option value="advance">Employee Advance</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Date" name="transaction_date" rules={[{ required: true }]}>
                                        <DatePicker size="large" style={{ width: '100%', ...largeInputStyle }} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Project" name="project_id" rules={[{ required: true }]}>
                                        <Select
                                            placeholder="Select Project"
                                            size="large"
                                            style={largeInputStyle}
                                            showSearch
                                            optionFilterProp="children"
                                            onChange={(projectId) => {
                                                // Refetch outstanding items when project changes
                                                const vendorId = form.getFieldValue('vendor_id')
                                                if (vendorId && category === 'vendor') {
                                                    fetchOutstanding(vendorId, projectId)
                                                }
                                            }}
                                        >
                                            {projects.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            {category === 'vendor' && (
                                <Form.Item label="Vendor" name="vendor_id" rules={[{ required: true }]}>
                                    <Select
                                        placeholder="Select Vendor"
                                        size="large"
                                        style={largeInputStyle}
                                        showSearch
                                        optionFilterProp="children"
                                        onChange={(vendorId) => {
                                            const projectId = form.getFieldValue('project_id')
                                            fetchOutstanding(vendorId, projectId)
                                        }}
                                    >
                                        {vendors.map(v => <Option key={v.id} value={v.id}>{v.name}</Option>)}
                                    </Select>
                                </Form.Item>
                            )}

                            {category === 'client' && (
                                <Form.Item label="Client" name="client_id" rules={[{ required: true }]}>
                                    <Select placeholder="Select Client" size="large" style={largeInputStyle} showSearch optionFilterProp="children">
                                        {clients.map(c => <Option key={c.id} value={c.id}>{c.company_name}</Option>)}
                                    </Select>
                                </Form.Item>
                            )}

                            <Divider />

                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item label="Gross Amount" name="amount">
                                        <InputNumber
                                            prefix="₹"
                                            size="large"
                                            style={{ width: '100%', ...largeInputStyle }}
                                            onChange={(val) => {
                                                const tds = form.getFieldValue('tds_amount') || 0
                                                const ret = form.getFieldValue('retention_amount') || 0
                                                form.setFieldsValue({ net_amount: (Number(val) || 0) - tds - ret })
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item label="TDS Deducted" name="tds_amount">
                                        <InputNumber
                                            prefix="₹"
                                            size="large"
                                            style={{ width: '100%', ...largeInputStyle }}
                                            onChange={(val) => {
                                                const gross = form.getFieldValue('amount') || 0
                                                const ret = form.getFieldValue('retention_amount') || 0
                                                form.setFieldsValue({ net_amount: gross - (Number(val) || 0) - ret })
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item label="Net Paid" name="net_amount" rules={[{ required: true }]}>
                                        <InputNumber
                                            prefix="₹"
                                            size="large"
                                            style={{ width: '100%', backgroundColor: '#f6ffed', color: '#389e0d', ...largeInputStyle }}
                                            onChange={(val) => {
                                                const tds = form.getFieldValue('tds_amount') || 0
                                                const ret = form.getFieldValue('retention_amount') || 0
                                                form.setFieldsValue({ amount: (Number(val) || 0) + tds + ret })
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </SectionCard>

                        <SectionCard title="Payment Mode" icon={<BankOutlined />}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Mode" name="payment_mode">
                                        <Select size="large" style={largeInputStyle}>
                                            <Option value="cash">Cash</Option>
                                            <Option value="cheque">Cheque</Option>
                                            <Option value="neft">NEFT/RTGS</Option>
                                            <Option value="upi">UPI</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Ref # (UTR/Cheque)" name="reference_number">
                                        <Input placeholder="Enter reference number" size="large" style={largeInputStyle} />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item label="Remarks" name="remarks">
                                <TextArea rows={3} placeholder="Add any notes about this transaction..." style={largeInputStyle} />
                            </Form.Item>
                        </SectionCard>
                    </Col>

                    <Col xs={24} lg={10}>
                        {category === 'vendor' && (
                            <>
                                <SectionCard title="Pending Liabilities" icon={<InfoCircleOutlined />}>
                                    {outstandingItems.length === 0 ? <Text type="secondary">No pending POs/WOs found.</Text> : (
                                        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                            {outstandingItems.map(item => (
                                                <Card key={`${item.type}-${item.id}`} size="small" hoverable style={{ marginBottom: 8 }} onClick={() => handleAllocation(item)}>
                                                    <div style={flexBetweenStyle}>
                                                        <Space direction="vertical" size={0}>
                                                            <Text strong>{item.ref}</Text>
                                                            <Tag>{item.type}</Tag>
                                                        </Space>
                                                        <Text strong style={{ color: theme.colors.primary.main }}>₹{item.balance.toLocaleString()}</Text>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </SectionCard>

                                <SectionCard title="Payment Allocation" icon={<WalletOutlined />}>
                                    {selectedAllocations.length === 0 ? <Text type="secondary">Select pending items to allocate payment.</Text> : (
                                        <div>
                                            {selectedAllocations.map((a, index) => (
                                                <div key={`${a.type}-${a.id}`} style={{ marginBottom: 16, padding: 8, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                                                    <div style={flexBetweenStyle}>
                                                        <Text strong>{a.ref}</Text>
                                                        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => setSelectedAllocations(selectedAllocations.filter((_, i) => i !== index))} />
                                                    </div>
                                                    <Row gutter={8} style={{ marginTop: 8 }}>
                                                        <Col span={8}>
                                                            <Text style={{ fontSize: 11 }}>Pay Amount</Text>
                                                            <InputNumber
                                                                value={a.allocated_amount}
                                                                onChange={(val) => updateAllocation(index, 'allocated_amount', val)}
                                                                style={{ width: '100%' }}
                                                                prefix="₹"
                                                            />
                                                        </Col>
                                                        <Col span={8}>
                                                            <Text style={{ fontSize: 11 }}>TDS Deducted</Text>
                                                            <InputNumber
                                                                value={a.tds_allocated}
                                                                onChange={(val) => updateAllocation(index, 'tds_allocated', val)}
                                                                style={{ width: '100%' }}
                                                                prefix="₹"
                                                            />
                                                        </Col>
                                                        <Col span={8}>
                                                            <Text style={{ fontSize: 11 }} type="secondary">Remaining</Text>
                                                            <div style={{ fontSize: 12, fontWeight: 500, color: (Number(a.balance) - Number(a.allocated_amount || 0) - Number(a.tds_allocated || 0)) < 0 ? '#f5222d' : '#8c8c8c' }}>
                                                                ₹{(Number(a.balance) - Number(a.allocated_amount || 0) - Number(a.tds_allocated || 0)).toLocaleString()}
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </SectionCard>
                            </>
                        )}

                        <InfoCard title="💡 Financial Tip">
                            Allocating payments to specific POs/WOs helps track contract utilization and outstanding vendor balances automatically.
                        </InfoCard>
                    </Col>
                </Row>

                <Card style={actionCardStyle}>
                    <div style={flexBetweenStyle}>
                        <Text type="secondary">
                            <InfoCircleOutlined style={{ marginRight: '8px' }} />
                            Authorized transactions will reflect in project P&L immediately.
                        </Text>
                        <Space size="middle">
                            <Button onClick={() => navigate('/finance/transactions')} size="large" style={getSecondaryButtonStyle()}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                icon={<SaveOutlined />}
                                size="large"
                                style={getPrimaryButtonStyle()}
                            >
                                Record Transaction
                            </Button>
                        </Space>
                    </div>
                </Card>
            </Form>
        </PageContainer>
    )
}

export default FinancialTransactionForm
