import { useState, useEffect } from 'react'
import { Card, Table, Tag, Input, Select, Button, Space, message, Row, Col, Statistic, Typography, Tooltip, Badge } from 'antd'
import {
    SearchOutlined,
    ReloadOutlined,
    InboxOutlined,
    HistoryOutlined,
    ShoppingOutlined,
    BarChartOutlined,
    FilterOutlined,
    AlertOutlined
} from '@ant-design/icons'
import { PageContainer, PageHeader, SectionCard } from '../../components/common/PremiumComponents'
import { inventoryService } from '../../services/api/inventory'
import { warehouseService } from '../../services/api/warehouses'
import { projectService } from '../../services/api/projects'
import { theme } from '../../styles/theme'
import { getPrimaryButtonStyle, largeInputStyle, prefixIconStyle } from '../../styles/styleUtils'

const { Search } = Input
const { Option } = Select
const { Text, Title } = Typography

const StockReport = () => {
    const [loading, setLoading] = useState(false)
    const [statement, setStatement] = useState<any[]>([])
    const [warehouses, setWarehouses] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [filters, setFilters] = useState<any>({
        search: '',
        warehouse_id: undefined,
        project_id: undefined
    })

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [whRes, prRes] = await Promise.all([
                    warehouseService.getWarehouses(),
                    projectService.getProjects()
                ])
                setWarehouses(whRes.warehouses || [])
                setProjects(prRes.projects || [])
            } catch (error) {
                console.error('Failed to fetch initial data')
            }
        }
        fetchInitialData()
    }, [])

    useEffect(() => {
        if (filters.warehouse_id || filters.project_id) {
            fetchStatement()
        } else {
            setStatement([])
        }
    }, [filters])

    const fetchStatement = async () => {
        setLoading(true)
        try {
            const res = await inventoryService.getStockStatement(filters)
            setStatement(res.statement || [])
        } catch (error) {
            message.error('Failed to fetch stock statement')
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        {
            title: 'Material Name',
            key: 'material',
            fixed: 'left' as const,
            width: 250,
            render: (_: any, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ color: theme.colors.primary.main }}>{record.material_name}</Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{record.material_code}</Text>
                    <Tag style={{ fontSize: '10px', marginTop: '4px' }}>{record.category || 'General'}</Tag>
                </Space>
            )
        },
        {
            title: <Tooltip title="Total Quantity ever ordered via POs (Approved/Pending)">PO QTY</Tooltip>,
            dataIndex: 'po_qty',
            key: 'po_qty',
            width: 120,
            align: 'right' as const,
            render: (val: number, record: any) => <Text strong>{Number(val).toLocaleString()} {record.unit}</Text>
        },
        {
            title: <Tooltip title="Total Quantity received and approved at site (GRN)">RECVD QTY</Tooltip>,
            dataIndex: 'received_qty',
            key: 'received_qty',
            width: 130,
            align: 'right' as const,
            render: (val: number) => <Text strong type="success">{Number(val).toLocaleString()}</Text>
        },
        {
            title: <Tooltip title="Total inward transfers from other sites (STN In)">TRANS. IN</Tooltip>,
            dataIndex: 'transfer_in',
            key: 'transfer_in',
            width: 130,
            align: 'right' as const,
            render: (val: number) => Number(val) > 0 ? <Text strong style={{ color: '#faad14' }}>{Number(val).toLocaleString()}</Text> : <Text type="secondary">0</Text>
        },
        {
            title: <Tooltip title="Total Quantity consumed/issued at site (Approved Consumption)">USED QTY</Tooltip>,
            dataIndex: 'used_qty',
            key: 'used_qty',
            width: 130,
            align: 'right' as const,
            render: (val: number) => Number(val) > 0 ? <Text strong type="danger">{Number(val).toLocaleString()}</Text> : <Text type="secondary">0</Text>
        },
        {
            title: <Tooltip title="Total outward transfers to other sites (STN Out)">TRANS. OUT</Tooltip>,
            dataIndex: 'transfer_out',
            key: 'transfer_out',
            width: 140,
            align: 'right' as const,
            render: (val: number) => Number(val) > 0 ? <Text strong type="danger" style={{ opacity: 0.7 }}>{Number(val).toLocaleString()}</Text> : <Text type="secondary">0</Text>
        },
        {
            title: <Tooltip title="Final Balance (Recvd + Trans In - Used - Trans Out)">BALANCE</Tooltip>,
            dataIndex: 'balance_qty',
            key: 'balance_qty',
            width: 160,
            align: 'right' as const,
            fixed: 'right' as const,
            render: (val: number, record: any) => (
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: Number(val) <= 0 ? theme.colors.error.main : theme.colors.success.main,
                        background: Number(val) <= 0 ? '#fff1f0' : '#f6ffed',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'inline-block'
                    }}>
                        {Number(val).toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 400 }}>{record.unit}</span>
                    </div>
                </div>
            )
        }
    ]

    const stats = {
        totalMaterials: statement.length,
        totalStockValue: statement.reduce((acc, curr) => acc + Number(curr.balance_qty), 0),
        lowStockCount: statement.filter(s => Number(s.balance_qty) < 100).length
    }

    return (
        <PageContainer>
            <PageHeader
                title="Consolidated Stock Report"
                subtitle="Complete audit trail of material orders, receipts, usage and current balance"
                icon={<BarChartOutlined />}
            />

            <Card style={{ marginBottom: theme.spacing.lg, borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} md={8}>
                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Select Target Site/Warehouse</Text>
                        <Select
                            placeholder="Select Site (Project) or Warehouse"
                            style={{ width: '100%', ...largeInputStyle }}
                            size="large"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            onChange={(value) => {
                                if (!value) {
                                    setFilters({ ...filters, warehouse_id: undefined, project_id: undefined })
                                } else if (value.startsWith('wh_')) {
                                    setFilters({ ...filters, warehouse_id: Number(value.substring(3)), project_id: undefined })
                                } else if (value.startsWith('pr_')) {
                                    setFilters({ ...filters, project_id: Number(value.substring(3)), warehouse_id: undefined })
                                }
                            }}
                        >
                            <Select.OptGroup label="Warehouses (Stores)">
                                {warehouses.filter(w => !w.project_id).map(w => (
                                    <Option key={w.id} value={`wh_${w.id}`}>{w.name} ({w.code})</Option>
                                ))}
                            </Select.OptGroup>
                            <Select.OptGroup label="Projects (Sites)">
                                {projects.map(p => (
                                    <Option key={p.id} value={`pr_${p.id}`}>{p.name}</Option>
                                ))}
                            </Select.OptGroup>
                        </Select>
                    </Col>
                    <Col xs={24} md={10}>
                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Quick Search</Text>
                        <Search
                            placeholder="Filter by material name or code..."
                            allowClear
                            size="large"
                            onSearch={(val: string) => setFilters({ ...filters, search: val })}
                            style={{ width: '100%', ...largeInputStyle }}
                            prefix={<SearchOutlined style={prefixIconStyle} />}
                        />
                    </Col>
                    <Col xs={24} md={6}>
                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            size="large"
                            onClick={fetchStatement}
                            loading={loading}
                            style={getPrimaryButtonStyle('100%')}
                        >
                            Refresh Report
                        </Button>
                    </Col>
                </Row>
            </Card>

            {!filters.warehouse_id && !filters.project_id ? (
                <Card style={{ textAlign: 'center', padding: '100px 0', border: '1px dashed #d9d9d9', borderRadius: '12px' }}>
                    <div style={{ fontSize: '48px', color: '#d9d9d9' }}><FilterOutlined /></div>
                    <Title level={4} style={{ color: '#8c8c8c', marginTop: '16px' }}>Please select a Project or Warehouse to view the stock statement</Title>
                    <Text type="secondary">Select a filter above to begin material reconciliation.</Text>
                </Card>
            ) : (
                <>
                    <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
                        <Col xs={24} sm={8}>
                            <Card style={{ borderRadius: '8px' }}>
                                <Statistic
                                    title="Active Materials"
                                    value={stats.totalMaterials}
                                    prefix={<InboxOutlined style={{ color: theme.colors.primary.main }} />}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card style={{ borderRadius: '8px' }}>
                                <Statistic
                                    title="Total Stock Volume"
                                    value={stats.totalStockValue}
                                    prefix={<Badge count={stats.lowStockCount > 0 ? "!" : null} offset={[5, 0]}><HistoryOutlined style={{ color: theme.colors.success.main }} /></Badge>}
                                    precision={2}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card style={{ borderRadius: '8px' }}>
                                <Statistic
                                    title="Low Stock Warning"
                                    value={stats.lowStockCount}
                                    prefix={<AlertOutlined style={{ color: theme.colors.error.main }} />}
                                    valueStyle={{ color: theme.colors.error.main }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <SectionCard title="Detailed Stock Statement" icon={<ShoppingOutlined />}>
                        <Table
                            columns={columns}
                            dataSource={statement}
                            loading={loading}
                            rowKey="material_id"
                            scroll={{ x: 1200 }}
                            bordered
                            pagination={{
                                pageSize: 15,
                                showTotal: (total) => <Text strong>Total {total} Materials</Text>
                            }}
                            summary={(pageData) => {
                                let totalPo = 0;
                                let totalRec = 0;
                                let totalIn = 0;
                                let totalUsed = 0;
                                let totalOut = 0;
                                let totalBal = 0;

                                pageData.forEach(({ po_qty, received_qty, used_qty, transfer_in, transfer_out, balance_qty }) => {
                                    totalPo += Number(po_qty);
                                    totalRec += Number(received_qty);
                                    totalIn += Number(transfer_in);
                                    totalUsed += Number(used_qty);
                                    totalOut += Number(transfer_out);
                                    totalBal += Number(balance_qty);
                                });

                                return (
                                    <Table.Summary fixed>
                                        <Table.Summary.Row style={{ background: '#fafafa' }}>
                                            <Table.Summary.Cell index={0}><Text strong>TOTALS</Text></Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} align="right"><Text strong>{totalPo.toLocaleString()}</Text></Table.Summary.Cell>
                                            <Table.Summary.Cell index={2} align="right"><Text strong type="success">{totalRec.toLocaleString()}</Text></Table.Summary.Cell>
                                            <Table.Summary.Cell index={3} align="right"><Text strong style={{ color: '#faad14' }}>{totalIn.toLocaleString()}</Text></Table.Summary.Cell>
                                            <Table.Summary.Cell index={4} align="right"><Text strong type="danger">{totalUsed.toLocaleString()}</Text></Table.Summary.Cell>
                                            <Table.Summary.Cell index={5} align="right"><Text strong type="danger" style={{ opacity: 0.7 }}>{totalOut.toLocaleString()}</Text></Table.Summary.Cell>
                                            <Table.Summary.Cell index={6} align="right"><Text strong style={{ fontSize: '16px' }}>{totalBal.toLocaleString()}</Text></Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    </Table.Summary>
                                );
                            }}
                        />
                    </SectionCard>
                </>
            )}
        </PageContainer>
    )
}

export default StockReport
