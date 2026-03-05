
import { useState, useEffect } from 'react'
import { Table, Card, Statistic, Row, Col, Typography, Empty, Tag, Button } from 'antd'
import { StockOutlined, HistoryOutlined, ShoppingOutlined } from '@ant-design/icons'
import { inventoryService } from '../../services/api/inventory'
import { storeTransactionService } from '../../services/api/storeTransactions'
import { useNavigate } from 'react-router-dom'

const { Text } = Typography

const ProjectInventory = ({ projectId }: { projectId: number }) => {
    const [loading, setLoading] = useState(false)
    const [inventory, setInventory] = useState<any[]>([])
    const navigate = useNavigate()

    useEffect(() => {
        if (projectId) {
            fetchData()
        }
    }, [projectId])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [invRes] = await Promise.all([
                inventoryService.getInventory({ project_id: projectId }),
                storeTransactionService.getTransactions({ limit: 5 })
            ])
            setInventory(invRes.inventory || [])
        } catch (error) {
            console.error('Failed to fetch project inventory', error)
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        {
            title: 'Material',
            dataIndex: 'material',
            key: 'material',
            render: (material: any) => (
                <div>
                    <Text strong>{material?.name}</Text>
                    <div style={{ fontSize: 12, color: '#888' }}>{material?.material_code}</div>
                </div>
            )
        },
        {
            title: 'Stock in Hand',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (qty: number, record: any) => (
                <Text strong style={{ color: qty < 10 ? '#cf1322' : 'inherit' }}>
                    {qty} {record.material?.unit}
                </Text>
            )
        },
        {
            title: 'Status',
            key: 'status',
            render: (_: any, record: any) => (
                record.quantity <= 0 ? <Tag color="red">Out of Stock</Tag> : <Tag color="green">Available</Tag>
            )
        }
    ]

    return (
        <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={8}>
                    <Card size="small">
                        <Statistic
                            title="Total Items on Site"
                            value={inventory.length}
                            prefix={<StockOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card size="small">
                        <Statistic
                            title="Low Stock Alerts"
                            value={inventory.filter(i => i.quantity < 10).length}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Button type="primary" icon={<ShoppingOutlined />} onClick={() => navigate('/procurement/purchase-orders/new')} block={window.innerWidth < 576}>
                        Order Material
                    </Button>
                </Col>
            </Row>

            <Card title={<><StockOutlined /> Current Site Inventory</>} style={{ marginBottom: 16 }}>
                {inventory.length > 0 ? (
                    <Table
                        dataSource={inventory}
                        columns={columns}
                        rowKey="id"
                        pagination={{ pageSize: 5 }}
                        loading={loading}
                        scroll={{ x: 'max-content' }}
                    />
                ) : (
                    <Empty description="No material stock found at this site" />
                )}
            </Card>

            <Card title={<><HistoryOutlined /> Recent Movements</>}>
                <Empty description="Transaction history filtered by project coming soon" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </Card>
        </div>
    )
}

export default ProjectInventory
