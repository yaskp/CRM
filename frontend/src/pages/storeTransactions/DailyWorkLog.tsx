import { useState, useEffect } from 'react'
import { Form, Input, Button, Select, DatePicker, InputNumber, Table, Space, Row, Col, Typography, Upload, Card, Tag, Divider, Alert, Statistic, message as antdMessage } from 'antd'
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
    CameraOutlined,
    CloudOutlined,
    TeamOutlined,
    CheckCircleOutlined,
    WarningOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
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
    threeColumnGridStyle
} from '../../styles/styleUtils'
import { theme } from '../../styles/theme'
import type { UploadFile } from 'antd/es/upload/interface'

const { TextArea } = Input
const { Option } = Select
const { Text, Title } = Typography

interface MaterialItem {
    material_id?: number
    material_name?: string
    issued_quantity: number
    quantity: number
    returned_quantity: number
    wastage: number
    work_done_quantity: number
    unit?: string
}

interface ManpowerItem {
    worker_type: string
    count: number
    hajri: number
}

const DailyWorkLog = () => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [materials, setMaterials] = useState<any[]>([])
    const [warehouses, setWarehouses] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [buildings, setBuildings] = useState<any[]>([])
    const [floors, setFloors] = useState<any[]>([])
    const [zones, setZones] = useState<any[]>([])
    const [workItemTypes, setWorkItemTypes] = useState<any[]>([])
    const [items, setItems] = useState<MaterialItem[]>([])
    const [manpower, setManpower] = useState<ManpowerItem[]>([])
    const [stockMap, setStockMap] = useState<Record<number, number>>({})
    const [photoList, setPhotoList] = useState<UploadFile[]>([])
    const [selectedWorkType, setSelectedWorkType] = useState<any>(null)

    const navigate = useNavigate()

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
            setWarehouses(whRes.warehouses || [])
            setProjects(projRes.projects || [])
            setWorkItemTypes(witRes.data || [])
        } catch (error) {
            antdMessage.error('Failed to load metadata')
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

    const handleWorkTypeChange = (workTypeId: number) => {
        const workType = workItemTypes.find(w => w.id === workTypeId)
        setSelectedWorkType(workType)
    }

    const addItem = () => {
        setItems([...items, {
            material_id: undefined,
            issued_quantity: 0,
            quantity: 0,
            returned_quantity: 0,
            wastage: 0,
            work_done_quantity: 0
        }])
    }

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }

        // Auto-calculate consumed quantity
        if (field === 'issued_quantity' || field === 'returned_quantity' || field === 'wastage') {
            const item = newItems[index]
            const consumed = (item.issued_quantity || 0) - (item.returned_quantity || 0) - (item.wastage || 0)
            newItems[index].quantity = Math.max(0, consumed)
        }

        // Get material info
        if (field === 'material_id') {
            const material = materials.find(m => m.id === value)
            newItems[index].material_name = material?.name
            newItems[index].unit = material?.uom
        }

        setItems(newItems)
    }

    const addManpower = () => {
        setManpower([...manpower, { worker_type: '', count: 0, hajri: 0 }])
    }

    const removeManpower = (index: number) => {
        setManpower(manpower.filter((_, i) => i !== index))
    }

    const updateManpower = (index: number, field: string, value: any) => {
        const newManpower = [...manpower]
        newManpower[index] = { ...newManpower[index], [field]: value }
        setManpower(newManpower)
    }

    const calculateSummary = () => {
        const totalMaterialCost = items.reduce((sum, item) => {
            const material = materials.find(m => m.id === item.material_id)
            return sum + ((material?.rate || 0) * (item.quantity || 0))
        }, 0)

        const totalLabor = manpower.reduce((sum, mp) => sum + (mp.hajri || 0), 0)
        const totalWorkDone = items.reduce((sum, item) => sum + (item.work_done_quantity || 0), 0)

        const efficiency = items.length > 0 ? items.map(item => {
            const material = materials.find(m => m.id === item.material_id)
            if (!material?.standard_rate || !item.work_done_quantity) return 100
            const actualRate = item.quantity / item.work_done_quantity
            return (material.standard_rate / actualRate) * 100
        }).reduce((a, b) => a + b, 0) / items.length : 100

        return {
            totalMaterialCost,
            totalLabor,
            totalCost: totalMaterialCost + totalLabor,
            totalWorkDone,
            efficiency: Math.round(efficiency)
        }
    }

    const onFinish = async (values: any) => {
        if (items.length === 0) {
            antdMessage.error('Please add at least one material item')
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
                weather_condition: values.weather_condition,
                temperature: values.temperature,
                work_hours: values.work_hours,
                remarks: values.remarks,
                manpower_data: JSON.stringify(manpower),
                progress_photos: JSON.stringify(photoList.map(f => f.url || f.response?.url)),
                items: items.map(it => ({
                    material_id: it.material_id,
                    issued_quantity: it.issued_quantity,
                    quantity: it.quantity,
                    returned_quantity: it.returned_quantity,
                    wastage_quantity: it.wastage,
                    work_done_quantity: it.work_done_quantity,
                    work_item_type_id: values.work_item_type_id,
                    unit: it.unit
                }))
            }

            await storeTransactionService.createConsumption(payload)
            antdMessage.success('Daily Work Log submitted successfully!')
            navigate('/inventory/consumption')
        } catch (error: any) {
            antdMessage.error(error.response?.data?.message || 'Failed to save work log')
        } finally {
            setLoading(false)
        }
    }

    const summary = calculateSummary()

    const materialColumns = [
        {
            title: 'Material',
            dataIndex: 'material_id',
            width: '20%',
            render: (val: any, _: any, index: number) => (
                <Select
                    placeholder="Select material"
                    style={{ width: '100%' }}
                    showSearch
                    optionFilterProp="children"
                    value={val}
                    onChange={v => updateItem(index, 'material_id', v)}
                    size="small"
                >
                    {materials.map(m => (
                        <Option key={m.id} value={m.id}>{m.name}</Option>
                    ))}
                </Select>
            )
        },
        {
            title: 'Issued',
            dataIndex: 'issued_quantity',
            width: '12%',
            render: (val: any, _: any, index: number) => (
                <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    value={val}
                    onChange={v => updateItem(index, 'issued_quantity', v)}
                    placeholder="0"
                    size="small"
                />
            )
        },
        {
            title: 'Consumed',
            dataIndex: 'quantity',
            width: '12%',
            render: (val: any) => (
                <Tag color="blue">{val || 0}</Tag>
            )
        },
        {
            title: 'Returned',
            dataIndex: 'returned_quantity',
            width: '12%',
            render: (val: any, _: any, index: number) => (
                <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    value={val}
                    onChange={v => updateItem(index, 'returned_quantity', v)}
                    placeholder="0"
                    size="small"
                />
            )
        },
        {
            title: 'Wastage',
            dataIndex: 'wastage',
            width: '12%',
            render: (val: any, _: any, index: number) => (
                <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    value={val}
                    onChange={v => updateItem(index, 'wastage', v)}
                    placeholder="0"
                    size="small"
                />
            )
        },
        {
            title: 'Work Done',
            dataIndex: 'work_done_quantity',
            width: '15%',
            render: (val: any, record: any, index: number) => (
                <Space.Compact style={{ width: '100%' }}>
                    <InputNumber
                        min={0}
                        style={{ width: '70%' }}
                        value={val}
                        onChange={v => updateItem(index, 'work_done_quantity', v)}
                        placeholder="0"
                        size="small"
                    />
                    <Input
                        style={{ width: '30%' }}
                        value={record.unit || selectedWorkType?.uom || ''}
                        disabled
                        size="small"
                    />
                </Space.Compact>
            )
        },
        {
            title: '',
            width: '7%',
            render: (_: any, __: any, index: number) => (
                <Button danger icon={<DeleteOutlined />} onClick={() => removeItem(index)} type="link" size="small" />
            )
        }
    ]

    const manpowerColumns = [
        {
            title: 'Worker Type',
            dataIndex: 'worker_type',
            render: (val: any, _: any, index: number) => (
                <Select
                    placeholder="Select type"
                    style={{ width: '100%' }}
                    value={val}
                    onChange={v => updateManpower(index, 'worker_type', v)}
                    size="small"
                >
                    <Option value="Mason">Mason</Option>
                    <Option value="Helper">Helper</Option>
                    <Option value="Carpenter">Carpenter</Option>
                    <Option value="Electrician">Electrician</Option>
                    <Option value="Plumber">Plumber</Option>
                    <Option value="Supervisor">Supervisor</Option>
                    <Option value="Labor">General Labor</Option>
                </Select>
            )
        },
        {
            title: 'Head Count',
            dataIndex: 'count',
            width: '30%',
            render: (val: any, _: any, index: number) => (
                <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    value={val}
                    onChange={v => updateManpower(index, 'count', v)}
                    size="small"
                />
            )
        },
        {
            title: 'Hajri (₹)',
            dataIndex: 'hajri',
            width: '30%',
            render: (val: any, _: any, index: number) => (
                <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    value={val}
                    onChange={v => updateManpower(index, 'hajri', v)}
                    prefix="₹"
                    size="small"
                />
            )
        },
        {
            title: '',
            width: '10%',
            render: (_: any, __: any, index: number) => (
                <Button danger icon={<DeleteOutlined />} onClick={() => removeManpower(index)} type="link" size="small" />
            )
        }
    ]

    return (
        <PageContainer maxWidth={1400}>
            <PageHeader
                title="📋 Daily Work Log"
                subtitle="Unified progress tracking, material consumption, and manpower logging"
                icon={<AuditOutlined />}
            />

            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ transaction_date: dayjs() }}>
                <Row gutter={[24, 24]}>
                    {/* Left Column */}
                    <Col xs={24} lg={16}>
                        {/* Location & Work */}
                        <SectionCard title="📍 Location & Work Details" icon={<ProjectOutlined />}>
                            <div style={threeColumnGridStyle}>
                                <Form.Item
                                    label={<span style={getLabelStyle()}>Date</span>}
                                    name="transaction_date"
                                    rules={[{ required: true }]}
                                >
                                    <DatePicker style={{ width: '100%' }} size="large" format="DD-MMM-YYYY" />
                                </Form.Item>

                                <Form.Item
                                    label={<span style={getLabelStyle()}>Site Store</span>}
                                    name="warehouse_id"
                                    rules={[{ required: true }]}
                                >
                                    <Select
                                        placeholder="Select store"
                                        size="large"
                                        onChange={fetchStock}
                                    >
                                        {warehouses.map(w => <Option key={w.id} value={w.id}>{w.name}</Option>)}
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    label={<span style={getLabelStyle()}>Project</span>}
                                    name="project_id"
                                    rules={[{ required: true }]}
                                >
                                    <Select placeholder="Select project" onChange={handleProjectChange} size="large">
                                        {projects.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                                    </Select>
                                </Form.Item>
                            </div>

                            <div style={threeColumnGridStyle}>
                                <Form.Item label={<span style={getLabelStyle()}>Building</span>} name="building_id">
                                    <Select placeholder="Select building" allowClear onChange={handleBuildingChange} size="large">
                                        {buildings.map(b => <Option key={b.id} value={b.id}>{b.name}</Option>)}
                                    </Select>
                                </Form.Item>

                                <Form.Item label={<span style={getLabelStyle()}>Floor</span>} name="floor_id">
                                    <Select placeholder="Select floor" allowClear onChange={handleFloorChange} size="large">
                                        {floors.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                                    </Select>
                                </Form.Item>

                                <Form.Item label={<span style={getLabelStyle()}>Zone</span>} name="zone_id">
                                    <Select placeholder="Select zone" allowClear size="large">
                                        {zones.map(z => <Option key={z.id} value={z.id}>{z.name}</Option>)}
                                    </Select>
                                </Form.Item>
                            </div>

                            <Form.Item
                                label={<span style={getLabelStyle()}>Work Type</span>}
                                name="work_item_type_id"
                                rules={[{ required: true }]}
                            >
                                <Select
                                    placeholder="Select work type"
                                    showSearch
                                    optionFilterProp="children"
                                    size="large"
                                    onChange={handleWorkTypeChange}
                                >
                                    {workItemTypes.map(wit => <Option key={wit.id} value={wit.id}>{wit.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </SectionCard>

                        {/* Materials */}
                        <SectionCard
                            title="📦 Material Reconciliation"
                            icon={<BlockOutlined />}
                            extra={<Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>Add Material</Button>}
                            style={{ marginTop: 16 }}
                        >
                            <Alert
                                message="Material Tracking Formula"
                                description="Consumed = Issued - Returned - Wastage (Auto-calculated)"
                                type="info"
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                            <Table
                                dataSource={items}
                                columns={materialColumns}
                                pagination={false}
                                rowKey={(_, i) => i?.toString() || '0'}
                                size="small"
                                bordered
                                scroll={{ x: 1000 }}
                                locale={{ emptyText: 'No materials added. Click "Add Material" to begin.' }}
                            />
                        </SectionCard>

                        {/* Manpower */}
                        <SectionCard
                            title="👷 Manpower Deployment"
                            icon={<TeamOutlined />}
                            extra={<Button type="dashed" icon={<PlusOutlined />} onClick={addManpower}>Add Worker</Button>}
                            style={{ marginTop: 16 }}
                        >
                            <Table
                                dataSource={manpower}
                                columns={manpowerColumns}
                                pagination={false}
                                rowKey={(_, i) => i?.toString() || '0'}
                                size="small"
                                bordered
                                scroll={{ x: 600 }}
                                locale={{ emptyText: 'No manpower logged. Click "Add Worker" to begin.' }}
                            />
                        </SectionCard>
                    </Col>

                    {/* Right Column */}
                    <Col xs={24} lg={8}>
                        {/* Summary Card */}
                        <Card
                            title={<><CheckCircleOutlined /> Today's Summary</>}
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                marginBottom: 16
                            }}
                            headStyle={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.2)' }}
                        >
                            <Row gutter={[16, 16]}>
                                <Col xs={12} sm={12}>
                                    <Statistic
                                        title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Work Done</span>}
                                        value={summary.totalWorkDone}
                                        suffix={selectedWorkType?.uom || 'units'}
                                        valueStyle={{ color: 'white' }}
                                    />
                                </Col>
                                <Col xs={12} sm={12}>
                                    <Statistic
                                        title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Efficiency</span>}
                                        value={summary.efficiency}
                                        suffix="%"
                                        valueStyle={{ color: summary.efficiency >= 90 ? '#52c41a' : summary.efficiency >= 70 ? '#faad14' : '#ff4d4f' }}
                                        prefix={summary.efficiency >= 90 ? <CheckCircleOutlined /> : <WarningOutlined />}
                                    />
                                </Col>
                            </Row>
                            <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '16px 0' }} />
                            <Row gutter={[16, 16]}>
                                <Col xs={12} sm={12}>
                                    <Statistic
                                        title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Materials</span>}
                                        value={summary.totalMaterialCost}
                                        prefix="₹"
                                        valueStyle={{ color: 'white', fontSize: 18 }}
                                    />
                                </Col>
                                <Col xs={12} sm={12}>
                                    <Statistic
                                        title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Labor</span>}
                                        value={summary.totalLabor}
                                        prefix="₹"
                                        valueStyle={{ color: 'white', fontSize: 18 }}
                                    />
                                </Col>
                            </Row>
                            <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '16px 0' }} />
                            <Statistic
                                title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>Total Daily Cost</span>}
                                value={summary.totalCost}
                                prefix="₹"
                                valueStyle={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}
                            />
                        </Card>

                        {/* Site Conditions */}
                        <SectionCard title="🌤️ Site Conditions" icon={<CloudOutlined />}>
                            <Form.Item label={<span style={getLabelStyle()}>Weather</span>} name="weather_condition">
                                <Select placeholder="Select weather" size="large">
                                    <Option value="Clear">☀️ Clear/Sunny</Option>
                                    <Option value="Cloudy">☁️ Cloudy</Option>
                                    <Option value="Rainy">🌧️ Rainy</Option>
                                    <Option value="Windy">💨 Windy</Option>
                                    <Option value="Hot">🔥 Very Hot</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item label={<span style={getLabelStyle()}>Temperature (°C)</span>} name="temperature">
                                <InputNumber style={{ width: '100%' }} min={0} max={50} size="large" />
                            </Form.Item>

                            <Form.Item label={<span style={getLabelStyle()}>Work Hours</span>} name="work_hours">
                                <Input placeholder="e.g., 8:00 AM - 5:00 PM" size="large" />
                            </Form.Item>
                        </SectionCard>

                        {/* Photos */}
                        <SectionCard title="📷 Progress Photos" icon={<CameraOutlined />} style={{ marginTop: 16 }}>
                            <Upload
                                listType="picture-card"
                                fileList={photoList}
                                onChange={({ fileList }) => setPhotoList(fileList)}
                                beforeUpload={() => false}
                                maxCount={5}
                            >
                                {photoList.length < 5 && (
                                    <div>
                                        <PlusOutlined />
                                        <div style={{ marginTop: 8 }}>Upload</div>
                                    </div>
                                )}
                            </Upload>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Upload up to 5 photos of today's work progress
                            </Text>
                        </SectionCard>

                        {/* Remarks */}
                        <SectionCard title="📝 Site Remarks" icon={<FileTextOutlined />} style={{ marginTop: 16 }}>
                            <Form.Item name="remarks">
                                <TextArea rows={4} placeholder="Any delays, issues, or important notes..." />
                            </Form.Item>
                        </SectionCard>
                    </Col>
                </Row>

                {/* Submit */}
                <Card style={actionCardStyle}>
                    <div style={{ ...flexBetweenStyle, flexWrap: 'wrap', gap: 12 }}>
                        <Text type="secondary">
                            <InfoCircleOutlined style={{ marginRight: '8px' }} />
                            This will update inventory, BOQ progress, and project dashboard automatically.
                        </Text>
                        <Space size="middle">
                            <Button onClick={() => navigate('/inventory/consumption')} size="large" style={getSecondaryButtonStyle()}>
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
                                Submit Work Log
                            </Button>
                        </Space>
                    </div>
                </Card>
            </Form>
        </PageContainer>
    )
}

export default DailyWorkLog
