import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, DatePicker, InputNumber, Table, Space, Row, Col, Typography, Divider, Tag } from 'antd'
import {
    SaveOutlined,
    PlusOutlined,
    DeleteOutlined,
    AuditOutlined,
    HomeOutlined,
    BlockOutlined,
    FileTextOutlined,
    InfoCircleOutlined,
    ProjectOutlined,
    DeploymentUnitOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import { materialService } from '../../services/api/materials'
import { warehouseService } from '../../services/api/warehouses'
import { projectService } from '../../services/api/projects'
import { projectHierarchyService } from '../../services/api/projectHierarchy'
import { inventoryService } from '../../services/api/inventory'
import { workItemTypeService } from '../../services/api/workItemTypes'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import {
    getPrimaryButtonStyle,
    getSecondaryButtonStyle,
    largeInputStyle,
    getLabelStyle,
    flexBetweenStyle,
    actionCardStyle,
    twoColumnGridStyle,
    threeColumnGridStyle
} from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { TextArea } = Input
const { Option } = Select
const { Text, Title } = Typography

const ConsumptionForm = () => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [materials, setMaterials] = useState<any[]>([])
    const [warehouses, setWarehouses] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [buildings, setBuildings] = useState<any[]>([])
    const [floors, setFloors] = useState<any[]>([])
    const [zones, setZones] = useState<any[]>([])
    const [workItemTypes, setWorkItemTypes] = useState<any[]>([])
    const [items, setItems] = useState<any[]>([])
    const [stockMap, setStockMap] = useState<Record<number, number>>({})

    const navigate = useNavigate()
    const { id } = useParams()

    useEffect(() => {
        fetchMetadata()
    }, [])

    const fetchMetadata = async () => {
        try {
            const [matRes, whRes, projRes, witRes] = await Promise.all([
                materialService.getMaterials(),
                warehouseService.getWarehouses(),
                projectService.getProjects(),
                workItemTypeService.getWorkItemTypes({ is_active: true })
            ])
            setMaterials(matRes.materials || [])
            // Filter for site warehouses usually, but showing all for flexibility
            setWarehouses(whRes.warehouses || [])
            setProjects(projRes.projects || [])
            setWorkItemTypes(witRes.data || [])
        } catch (error) {
            message.error('Failed to load metadata')
        }
    }

    const handleProjectChange = async (projectId: number) => {
        try {
            const res = await projectHierarchyService.getBuildings(projectId)
            setBuildings(res.data || [])
            setFloors([])
            setZones([])
            form.setFieldsValue({ building_id: undefined, floor_id: undefined, zone_id: undefined })
        } catch (e) {
            console.error(e)
        }
    }

    const handleBuildingChange = async (buildingId: number) => {
        try {
            const res = await projectHierarchyService.getFloors(buildingId)
            setFloors(res.data || [])
            setZones([])
            form.setFieldsValue({ floor_id: undefined, zone_id: undefined })
        } catch (e) {
            console.error(e)
        }
    }

    const handleFloorChange = async (floorId: number) => {
        try {
            const res = await projectHierarchyService.getZones(floorId)
            setZones(res.data || [])
            form.setFieldsValue({ zone_id: undefined })
        } catch (e) {
            console.error(e)
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
        setItems([...items, { material_id: undefined, quantity: 0, wastage: 0, work_done_quantity: 0 }])
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
            message.error('Please add at least one material item')
            return
        }

        setLoading(true)
        try {
            const payload = {
                transaction_type: 'CONSUMPTION',
                transaction_date: values.transaction_date.format('YYYY-MM-DD'),
                warehouse_id: values.warehouse_id,
                project_id: values.project_id,
                to_building_id: values.building_id,
                to_floor_id: values.floor_id,
                to_zone_id: values.zone_id,
                remarks: values.remarks,
                items: items.map(it => ({
                    material_id: it.material_id,
                    quantity: it.quantity,
                    wastage_quantity: it.wastage,
                    work_done_quantity: it.work_done_quantity,
                    work_item_type_id: values.work_item_type_id
                }))
            }

            await storeTransactionService.createConsumption(payload)
            message.success('Material Issue/Consumption recorded successfully')
            navigate('/inventory/consumption')
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to save consumption')
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        {
            title: 'Material',
            dataIndex: 'material_id',
            render: (val: any, _: any, index: number) => (
                <div>
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
                    {val && (
                        <div style={{ marginTop: 4, fontSize: 11, color: (stockMap[val] || 0) > 0 ? 'green' : 'red' }}>
                            Stock Available: {stockMap[val] || 0}
                        </div>
                    )}
                </div>
            )
        },
        {
            title: 'Consumed Qty',
            dataIndex: 'quantity',
            width: 130,
            render: (val: any, _: any, index: number) => (
                <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    value={val}
                    onChange={v => updateItem(index, 'quantity', v)}
                    placeholder="Material qty"
                />
            )
        },
        {
            title: 'Work Done',
            dataIndex: 'work_done_quantity',
            width: 130,
            render: (val: any, record: any, index: number) => {
                const material = materials.find(m => m.id === record.material_id);
                return (
                    <div>
                        <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            value={val}
                            onChange={v => updateItem(index, 'work_done_quantity', v)}
                            placeholder="Work qty"
                        />
                        {material?.uom && (
                            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                                {material.uom}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            title: 'Wastage Qty',
            dataIndex: 'wastage',
            width: 120,
            render: (val: any, _: any, index: number) => (
                <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    value={val}
                    onChange={v => updateItem(index, 'wastage', v)}
                    placeholder="Wastage"
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
        <PageContainer maxWidth={1100}>
            <PageHeader
                title="Material Issue Note (MIN)"
                subtitle="Issue materials from site store to specific project activity"
                icon={<AuditOutlined />}
            />

            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ transaction_date: dayjs() }}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={14}>
                        <SectionCard title="Source Store" icon={<HomeOutlined />}>
                            <Form.Item
                                label={<span style={getLabelStyle()}>Issuing From (Site Store)</span>}
                                name="warehouse_id"
                                rules={[{ required: true, message: 'Source warehouse is required' }]}
                            >
                                <Select
                                    placeholder="Select Store"
                                    size="large"
                                    onChange={v => fetchStock(v)}
                                >
                                    {warehouses.map(w => <Option key={w.id} value={w.id}>{w.name}</Option>)}
                                </Select>
                            </Form.Item>
                            <InfoCard title="Stock Visibility">
                                Stock levels are fetched in real-time for the selected warehouse to prevent over-issuing.
                            </InfoCard>
                        </SectionCard>
                    </Col>
                    <Col xs={24} lg={10}>
                        <SectionCard title="Issue Date" icon={<FileTextOutlined />}>
                            <Form.Item
                                label={<span style={getLabelStyle()}>Date of Consumption</span>}
                                name="transaction_date"
                                rules={[{ required: true }]}
                            >
                                <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                            </Form.Item>
                        </SectionCard>
                    </Col>
                </Row>

                <SectionCard title="Destination & Activity" icon={<ProjectOutlined />}>
                    <div style={threeColumnGridStyle}>
                        <Form.Item
                            label={<span style={getLabelStyle()}>Project</span>}
                            name="project_id"
                            rules={[{ required: true }]}
                        >
                            <Select placeholder="Select Project" onChange={handleProjectChange}>
                                {projects.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item label={<span style={getLabelStyle()}>Building</span>} name="building_id">
                            <Select placeholder="Select Building" allowClear onChange={handleBuildingChange}>
                                {buildings.map(b => <Option key={b.id} value={b.id}>{b.name}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item label={<span style={getLabelStyle()}>Floor</span>} name="floor_id">
                            <Select placeholder="Select Floor" allowClear onChange={handleFloorChange}>
                                {floors.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                            </Select>
                        </Form.Item>
                    </div>
                    <div style={twoColumnGridStyle}>
                        <Form.Item label={<span style={getLabelStyle()}>Zone/Flat (Optional)</span>} name="zone_id">
                            <Select placeholder="Select Zone" allowClear>
                                {zones.map(z => <Option key={z.id} value={z.id}>{z.name}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            label={<span style={getLabelStyle()}>Work Activity</span>}
                            name="work_item_type_id"
                        >
                            <Select placeholder="Select Work Type" showSearch optionFilterProp="children">
                                {workItemTypes.map(wit => <Option key={wit.id} value={wit.id}>{wit.name}</Option>)}
                            </Select>
                        </Form.Item>
                    </div>
                </SectionCard>

                <SectionCard
                    title="Materials for Consumption"
                    icon={<BlockOutlined />}
                    extra={<Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>Add Material</Button>}
                >
                    <Table
                        dataSource={items}
                        columns={columns}
                        pagination={false}
                        rowKey={(_, i) => i}
                        scroll={{ x: 800 }}
                        locale={{ emptyText: 'No materials added for consumption' }}
                    />
                </SectionCard>

                <SectionCard title="Remarks" icon={<InfoCircleOutlined />}>
                    <Form.Item name="remarks">
                        <TextArea rows={3} placeholder="Enter any specific notes regarding this consumption..." />
                    </Form.Item>
                </SectionCard>

                <div style={actionCardStyle}>
                    <div style={{ ...flexBetweenStyle, flexWrap: 'wrap', gap: 12 }}>
                        <Text type="secondary">This transaction will permanently deduct stock from the site store.</Text>
                        <Space>
                            <Button onClick={() => navigate('/inventory/consumption')}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={loading} style={getPrimaryButtonStyle()}>Save Issue Note</Button>
                        </Space>
                    </div>
                </div>
            </Form>
        </PageContainer>
    )
}



export default ConsumptionForm
