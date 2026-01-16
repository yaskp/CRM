import { useState, useEffect } from 'react'
import { Card, Table, Tag, Input, Select, Button, Space, message, Row, Col, Statistic, Typography, Tooltip } from 'antd'
import {
    SearchOutlined,
    ReloadOutlined,
    ExportOutlined,
    InboxOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    FilterOutlined,
    BarcodeOutlined,
    HomeOutlined
} from '@ant-design/icons'
import axios from 'axios'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, getSecondaryButtonStyle, largeInputStyle, prefixIconStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Search } = Input
const { Option } = Select
const { Text } = Typography

const StockReport = () => {
    const [inventory, setInventory] = useState([])
    const [loading, setLoading] = useState(false)
    const [warehouses, setWarehouses] = useState<any[]>([])
    const [stats, setStats] = useState({
        totalItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0
    })
    const [filters, setFilters] = useState({
        search: '',
        warehouse_id: '',
        low_stock: false
    })

    useEffect(() => {
        fetchWarehouses()
        fetchInventory()
    }, [filters])

    const fetchWarehouses = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get('http://localhost:5000/api/warehouses', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setWarehouses(response.data.warehouses || [])
        } catch (error) {
            console.error('Failed to fetch warehouses')
        }
    }

    const fetchInventory = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get('http://localhost:5000/api/inventory', {
                headers: { Authorization: `Bearer ${token}` },
                params: filters
            })
            const items = response.data.inventory || []
            setInventory(items)

            // Calculate stats
            setStats({
                totalItems: items.length,
                lowStockItems: items.filter((i: any) => i.quantity > 0 && i.quantity <= (i.min_stock_level || 0)).length,
                outOfStockItems: items.filter((i: any) => i.quantity <= 0).length
            })
        } catch (error: any) {
            message.error('Failed to fetch stock report')
        } finally {
            setLoading(false)
        }
    }

    const handleExport = () => {
        message.info('Export started... PDF/Excel generation in progress.')
    }

    const columns = [
        {
            title: 'Material Details',
            key: 'material',
            render: (_: any, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ color: theme.colors.primary.main }}>{record.material?.name}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}><BarcodeOutlined /> {record.material?.material_code}</Text>
                </Space>
            ),
        },
        {
            title: 'Warehouse',
            dataIndex: ['warehouse', 'name'],
            key: 'warehouse_name',
            render: (text: string) => <Tag icon={<HomeOutlined />}>{text}</Tag>
        },
        {
            title: 'Category',
            dataIndex: ['material', 'category'],
            key: 'category',
            render: (cat: string) => cat ? <Tag color="blue">{cat}</Tag> : '-',
        },
        {
            title: 'Current Stock',
            key: 'inventory',
            align: 'right' as const,
            render: (_: any, record: any) => {
                const qty = Number(record.quantity)
                const min = Number(record.min_stock_level || 0)
                const isLow = qty > 0 && qty <= min
                const isOut = qty <= 0

                return (
                    <div style={{ textAlign: 'right' }}>
                        <Text strong style={{ fontSize: '16px', color: isOut ? theme.colors.error.main : isLow ? '#faad14' : theme.colors.success.main }}>
                            {qty.toLocaleString()}
                        </Text>
                        <Text type="secondary" style={{ marginLeft: '4px' }}>{record.material?.unit}</Text>
                        {isLow && <div style={{ fontSize: '10px', color: '#faad14' }}>Min: {min}</div>}
                    </div>
                )
            }
        },
        {
            title: 'Status',
            key: 'status',
            width: 150,
            render: (_: any, record: any) => {
                const qty = Number(record.quantity)
                const min = Number(record.min_stock_level || 0)
                if (qty <= 0) return <Tag color="error">OUT OF STOCK</Tag>
                if (qty <= min) return <Tag color="warning">LOW STOCK</Tag>
                return <Tag color="success">OPTIMAL</Tag>
            }
        }
    ]

    return (
        <PageContainer>
            <PageHeader
                title="Live Inventory Stock"
                subtitle="Real-time material availability across all project warehouses and sites"
                icon={<InboxOutlined />}
            />

            <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
                <Col xs={24} sm={8}>
                    <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
                        <Statistic
                            title="Unique Items"
                            value={stats.totalItems}
                            prefix={<InboxOutlined style={{ color: theme.colors.primary.main }} />}
                            valueStyle={{ color: theme.colors.primary.main }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
                        <Statistic
                            title="Low Stock Alerts"
                            value={stats.lowStockItems}
                            prefix={<WarningOutlined style={{ color: '#faad14' }} />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
                        <Statistic
                            title="Critical/Out of Stock"
                            value={stats.outOfStockItems}
                            prefix={<WarningOutlined style={{ color: theme.colors.error.main }} />}
                            valueStyle={{ color: theme.colors.error.main }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card style={{ marginBottom: theme.spacing.lg, borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <Space size="middle" wrap>
                        <Search
                            placeholder="Search code or material..."
                            allowClear
                            size="large"
                            onSearch={(value) => setFilters({ ...filters, search: value })}
                            style={{ width: 280, ...largeInputStyle }}
                            prefix={<SearchOutlined style={prefixIconStyle} />}
                        />
                        <Select
                            placeholder="All Warehouses"
                            allowClear
                            size="large"
                            style={{ width: 220, ...largeInputStyle }}
                            onChange={(value) => setFilters({ ...filters, warehouse_id: value })}
                            suffixIcon={<HomeOutlined style={prefixIconStyle} />}
                        >
                            {warehouses.map(w => (
                                <Option key={w.id} value={w.id}>{w.name}</Option>
                            ))}
                        </Select>
                        <Select
                            placeholder="Stock Status"
                            allowClear
                            size="large"
                            style={{ width: 180, ...largeInputStyle }}
                            onChange={(value) => setFilters({ ...filters, low_stock: value === 'low' })}
                            suffixIcon={<FilterOutlined style={prefixIconStyle} />}
                        >
                            <Option value="all">🌐 All Stock</Option>
                            <Option value="low">⚠️ Low Stock</Option>
                        </Select>
                    </Space>
                    <Space>
                        <Tooltip title="Refresh Data">
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={fetchInventory}
                                size="large"
                                style={getSecondaryButtonStyle()}
                            />
                        </Tooltip>
                        <Button
                            icon={<ExportOutlined />}
                            onClick={handleExport}
                            size="large"
                            style={getPrimaryButtonStyle()}
                        >
                            Export Report
                        </Button>
                    </Space>
                </div>
            </Card>

            <Card style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
                <Table
                    columns={columns}
                    dataSource={inventory}
                    loading={loading}
                    rowKey="id"
                    scroll={{ x: 1000 }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Showing ${total} items in stock`
                    }}
                />
            </Card>
        </PageContainer>
    )
}

export default StockReport
