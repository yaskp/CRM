import { useState, useEffect } from 'react'
import { Row, Col, Statistic, Table, Tag, Space, Typography, Select, List, Progress } from 'antd'
import {
    InboxOutlined,
    SwapOutlined,
    AlertOutlined,
    StockOutlined,
    ArrowUpOutlined,
    HistoryOutlined
} from '@ant-design/icons'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import { inventoryService } from '../../services/api/inventory'
import { warehouseService } from '../../services/api/warehouses'
import { theme } from '../../styles/theme'

const { Text } = Typography
const { Option } = Select

const InventoryDashboard = () => {
    const [loading, setLoading] = useState(false)
    const [inventory, setInventory] = useState<any[]>([])
    const [warehouses, setWarehouses] = useState<any[]>([])
    const [selectedWarehouse, setSelectedWarehouse] = useState<number | 'all'>('all')

    useEffect(() => {
        fetchData()
    }, [selectedWarehouse])

    const fetchData = async () => {
        setLoading(true)
        try {
            const params: any = { limit: 100 } // Fetch more items for dashboard
            if (selectedWarehouse !== 'all') {
                params.warehouse_id = selectedWarehouse
            }
            const [invRes, whRes] = await Promise.all([
                inventoryService.getInventory(params),
                warehouseService.getWarehouses()
            ])
            setInventory(invRes.inventory || [])
            setWarehouses(whRes.warehouses || [])
        } catch (error) {
            console.error('Failed to fetch inventory data', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredInventory = selectedWarehouse === 'all'
        ? inventory
        : inventory.filter(item => item.warehouse_id === selectedWarehouse)

    // Aggregated data
    const totalStockItems = filteredInventory.length
    const lowStockItems = filteredInventory.filter(item => item.quantity < 50) // Dummy threshold

    const columns = [
        {
            title: 'Material',
            dataIndex: 'material',
            key: 'material',
            render: (material: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{material?.name}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{material?.material_code}</Text>
                </Space>
            )
        },
        {
            title: 'Warehouse',
            dataIndex: 'warehouse',
            key: 'warehouse',
            render: (wh: any) => <Tag color="blue">{wh?.name}</Tag>
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'right' as const,
            render: (qty: number, record: any) => (
                <Text strong style={{ color: qty < 50 ? theme.colors.error.main : 'inherit' }}>
                    {qty} {record.material?.unit}
                </Text>
            )
        },
        {
            title: 'Status',
            key: 'status',
            render: (_: any, record: any) => (
                record.quantity < 50 ? <Tag color="error">Low Stock</Tag> : <Tag color="success">In Stock</Tag>
            )
        }
    ]

    return (
        <PageContainer>
            <PageHeader
                title="Inventory Tracking Dashboard"
                subtitle="Consolidated view of stock levels and store movements"
                icon={<StockOutlined />}
                extra={[
                    <Select
                        key="wh-filter"
                        style={{ width: 200 }}
                        placeholder="Filter by Warehouse"
                        value={selectedWarehouse}
                        onChange={setSelectedWarehouse}
                    >
                        <Option value="all">All Warehouses</Option>
                        {warehouses.map(wh => (
                            <Option key={wh.id} value={wh.id}>{wh.name}</Option>
                        ))}
                    </Select>
                ]}
            />

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <InfoCard style={{ textAlign: 'center' }}>
                        <Statistic
                            title="Total Unique Items"
                            value={totalStockItems}
                            prefix={<InboxOutlined />}
                        />
                    </InfoCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <InfoCard style={{ textAlign: 'center' }}>
                        <Statistic
                            title="Low Stock Alerts"
                            value={lowStockItems.length}
                            valueStyle={{ color: '#cf1322' }}
                            prefix={<AlertOutlined />}
                        />
                    </InfoCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <InfoCard style={{ textAlign: 'center' }}>
                        <Statistic
                            title="Stock In Value"
                            value={450000}
                            prefix="₹"
                        />
                    </InfoCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <InfoCard style={{ textAlign: 'center' }}>
                        <Statistic
                            title="Avg Turnover"
                            value={12.5}
                            suffix="%"
                            prefix={<ArrowUpOutlined />}
                        />
                    </InfoCard>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                <Col xs={24} lg={16}>
                    <SectionCard title="Current Stock Levels" icon={<StockOutlined />}>
                        <Table
                            dataSource={filteredInventory}
                            columns={columns}
                            loading={loading}
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                        />
                    </SectionCard>
                </Col>
                <Col xs={24} lg={8}>
                    <SectionCard title="Stock by Category" icon={<HistoryOutlined />}>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <Text>Steel Reinforcement</Text>
                                <Text strong>65%</Text>
                            </div>
                            <Progress percent={65} status="active" strokeColor={theme.colors.primary.main} />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <Text>Concrete Materials</Text>
                                <Text strong>42%</Text>
                            </div>
                            <Progress percent={42} status="active" strokeColor="#52c41a" />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <Text>General Hardware</Text>
                                <Text strong>18%</Text>
                            </div>
                            <Progress percent={18} status="exception" />
                        </div>
                    </SectionCard>

                    <SectionCard title="Recent Movements" icon={<SwapOutlined />} style={{ marginTop: '16px' }}>
                        <List
                            itemLayout="horizontal"
                            dataSource={[
                                { type: 'GRN', no: 'GRN/2026/001', date: '2 hours ago', qty: '+500 kg' },
                                { type: 'STN', no: 'STN/2026/012', date: '5 hours ago', qty: '-200 kg' },
                                { type: 'SRN', no: 'SRN/2026/005', date: 'Yesterday', qty: '+50 kg' },
                            ]}
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<Tag color={item.type === 'GRN' ? 'green' : 'blue'}>{item.type}</Tag>}
                                        title={<Text strong>{item.no}</Text>}
                                        description={item.date}
                                    />
                                    <div style={{ textAlign: 'right' }}>
                                        <Text strong style={{ color: item.qty.startsWith('+') ? '#52c41a' : '#f5222d' }}>
                                            {item.qty}
                                        </Text>
                                    </div>
                                </List.Item>
                            )}
                        />
                    </SectionCard>
                </Col>
            </Row>
        </PageContainer>
    )
}

export default InventoryDashboard
