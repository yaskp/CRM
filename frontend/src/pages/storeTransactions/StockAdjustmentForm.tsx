import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, DatePicker, InputNumber, Table, Space, Row, Col, Typography, Divider } from 'antd'
import {
    SafetyCertificateOutlined,
    PlusOutlined,
    DeleteOutlined,
    ExceptionOutlined,
    HomeOutlined,
    FileTextOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import { materialService } from '../../services/api/materials'
import { warehouseService } from '../../services/api/warehouses'
import { inventoryService } from '../../services/api/inventory'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard } from '../../components/common/PremiumComponents'
import {
    getPrimaryButtonStyle,
    getSecondaryButtonStyle,
    largeInputStyle,
    getLabelStyle,
    flexBetweenStyle,
    actionCardStyle,
} from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

const StockAdjustmentForm = () => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [materials, setMaterials] = useState<any[]>([])
    const [warehouses, setWarehouses] = useState<any[]>([])
    const [items, setItems] = useState<any[]>([])
    const [stockMap, setStockMap] = useState<Record<number, number>>({})

    const navigate = useNavigate()

    useEffect(() => {
        fetchMetadata()
    }, [])

    const fetchMetadata = async () => {
        try {
            const [matRes, whRes] = await Promise.all([
                materialService.getMaterials(),
                warehouseService.getWarehouses(),
            ])
            setMaterials(matRes.materials || [])
            setWarehouses(whRes.warehouses || [])
        } catch (error) {
            message.error('Failed to load metadata')
        }
    }

    const fetchStock = async (warehouseId: number) => {
        try {
            const res = await inventoryService.getInventory({ warehouse_id: warehouseId, limit: 1000 })
            const map: Record<number, number> = {}
            res.inventory?.forEach((inv: any) => {
                map[inv.material_id] = Number(inv.quantity)
            })
            setStockMap(map)
        } catch (e) {
            console.error(e)
        }
    }

    const addItem = () => {
        setItems([...items, { material_id: undefined, adjusted_quantity: 0, adjustment_type: 'shortage' }])
    }

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items]
        newItems[index][field] = value
        setItems(newItems)
    }

    const onFinish = async (values: any) => {
        if (items.length === 0) {
            message.error('Please add at least one material to adjust')
            return
        }

        setLoading(true)
        try {
            // In a real system, we might have a dedicated adjustment API
            // Here we might reuse StoreTransaction or a new endpoint if available
            // For now, let's assume we use a generic adjustment endpoint
            // payload structure...
            message.info('Stock Adjustment logic would go here...')
            navigate('/inventory/stock')
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to save adjustment')
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        {
            title: 'Material',
            dataIndex: 'material_id',
            render: (val: any, _: any, index: number) => (
                <Select
                    placeholder="Select material"
                    style={{ width: '100%' }}
                    showSearch
                    optionFilterProp="children"
                    value={val}
                    onChange={v => updateItem(index, 'material_id', v)}
                >
                    {materials.map(m => (
                        <Option key={m.id} value={m.id}>{m.name} ({m.material_code})</Option>
                    ))}
                </Select>
            )
        },
        {
            title: 'Current Stock',
            render: (_: any, record: any) => (
                <Text>{record.material_id ? (stockMap[record.material_id] || 0) : '-'}</Text>
            )
        },
        {
            title: 'Adjustment Type',
            dataIndex: 'adjustment_type',
            width: 150,
            render: (val: any, _: any, index: number) => (
                <Select value={val} onChange={v => updateItem(index, 'adjustment_type', v)} style={{ width: '100%' }}>
                    <Option value="excess">Excess (+)</Option>
                    <Option value="shortage">Shortage (-)</Option>
                    <Option value="damage">Damage (-)</Option>
                </Select>
            )
        },
        {
            title: 'Adjust Qty',
            dataIndex: 'adjusted_quantity',
            width: 150,
            render: (val: any, _: any, index: number) => (
                <InputNumber
                    min={0.01}
                    style={{ width: '100%' }}
                    value={val}
                    onChange={v => updateItem(index, 'adjusted_quantity', v)}
                />
            )
        },
        {
            title: '',
            width: 50,
            render: (_: any, __: any, index: number) => (
                <Button danger icon={<DeleteOutlined />} onClick={() => removeItem(index)} type="link" />
            )
        }
    ]

    return (
        <PageContainer maxWidth={1000}>
            <PageHeader
                title="Stock Adjustment / Physical Audit"
                subtitle="Correct inventory levels based on physical stock verification"
                icon={<ExceptionOutlined />}
            />

            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ transaction_date: dayjs() }}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={14}>
                        <SectionCard title="Warehouse Selection" icon={<HomeOutlined />}>
                            <Form.Item
                                label={<span style={getLabelStyle()}>Warehouse / Yard</span>}
                                name="warehouse_id"
                                rules={[{ required: true, message: 'Warehouse is required' }]}
                            >
                                <Select
                                    placeholder="Select Store"
                                    size="large"
                                    onChange={v => fetchStock(v)}
                                >
                                    {warehouses.map(w => <Option key={w.id} value={w.id}>{w.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </SectionCard>
                    </Col>
                    <Col xs={24} lg={10}>
                        <SectionCard title="Verification Date" icon={<FileTextOutlined />}>
                            <Form.Item
                                label={<span style={getLabelStyle()}>Audit Date</span>}
                                name="transaction_date"
                                rules={[{ required: true }]}
                            >
                                <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                            </Form.Item>
                        </SectionCard>
                    </Col>
                </Row>

                <SectionCard
                    title="Adjustment Items"
                    icon={<SafetyCertificateOutlined />}
                    extra={<Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>Add Line</Button>}
                >
                    <Table
                        dataSource={items}
                        columns={columns}
                        pagination={false}
                        rowKey={(_, i) => i}
                        scroll={{ x: 800 }}
                        locale={{ emptyText: 'No items selected for adjustment' }}
                    />
                </SectionCard>

                <SectionCard title="Reason for Adjustment" icon={<InfoCircleOutlined />}>
                    <Form.Item name="remarks" rules={[{ required: true, message: 'Reason is required for audit trail' }]}>
                        <TextArea rows={3} placeholder="Explain why physical stock differs from system stock (e.g. Broken during handling, Theft, Unrecorded usage)..." />
                    </Form.Item>
                </SectionCard>

                <div style={actionCardStyle}>
                    <div style={{ ...flexBetweenStyle, flexWrap: 'wrap', gap: 12 }}>
                        <Text type="secondary">Adjustment will be logged in the Inventory Ledger for audit.</Text>
                        <Space>
                            <Button onClick={() => navigate('/inventory/stock')}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={loading} style={getPrimaryButtonStyle()}>Post Adjustment</Button>
                        </Space>
                    </div>
                </div>
            </Form>
        </PageContainer>
    )
}

export default StockAdjustmentForm
