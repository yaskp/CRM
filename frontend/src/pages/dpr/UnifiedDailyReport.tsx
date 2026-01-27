import { useState, useEffect } from 'react'
import { Form, Input, Button, Select, DatePicker, InputNumber, Table, Space, Row, Col, Typography, Upload, Card, Tag, Statistic, Switch, message as antdMessage, Modal } from 'antd'
import {
    SaveOutlined,
    PlusOutlined,
    DeleteOutlined,
    ProjectOutlined,
    CameraOutlined,
    TeamOutlined,
    DashboardOutlined,
    BlockOutlined,
    ExpandOutlined,
    CompressOutlined,
    InfoCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import { materialService } from '../../services/api/materials'
import { warehouseService } from '../../services/api/warehouses'
import { projectService } from '../../services/api/projects'
import { projectHierarchyService } from '../../services/api/projectHierarchy'
import { inventoryService } from '../../services/api/inventory'
import { boqService } from '../../services/api/boqs'
import { workItemTypeService } from '../../services/api/workItemTypes'
import api from '../../services/api/auth'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard } from '../../components/common/PremiumComponents'
import {
    getPrimaryButtonStyle,
    getLabelStyle,
    flexBetweenStyle,
    actionCardStyle,
} from '../../styles/styleUtils'
import { theme } from '../../styles/theme'
import type { UploadFile } from 'antd/es/upload/interface'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

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

const UnifiedDailyReport = () => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [detailedMode, setDetailedMode] = useState(false)
    const [materials, setMaterials] = useState<any[]>([])
    const [filteredMaterials, setFilteredMaterials] = useState<any[]>([])
    const [boqItems, setBoqItems] = useState<any[]>([])
    const [warehouses, setWarehouses] = useState<any[]>([])
    const [projectWarehouses, setProjectWarehouses] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [structureType, setStructureType] = useState<'building' | 'panel' | 'both' | null>(null)
    const [buildings, setBuildings] = useState<any[]>([])
    const [floors, setFloors] = useState<any[]>([])
    const [zones, setZones] = useState<any[]>([])
    const [drawings, setDrawings] = useState<any[]>([])
    const [panels, setPanels] = useState<any[]>([])
    const [workItemTypes, setWorkItemTypes] = useState<any[]>([])
    const [workerCategories, setWorkerCategories] = useState<any[]>([])
    const [items, setItems] = useState<MaterialItem[]>([])
    const [manpower, setManpower] = useState<ManpowerItem[]>([])
    const [stockMap, setStockMap] = useState<Record<number, number>>({})
    const [photoList, setPhotoList] = useState<UploadFile[]>([])
    const [selectedWorkType, setSelectedWorkType] = useState<any>(null)
    const [selectedPanel, setSelectedPanel] = useState<any>(null)

    const navigate = useNavigate()

    useEffect(() => {
        fetchMetadata()
    }, [])

    const fetchMetadata = async () => {
        try {
            const [matRes, whRes, projRes, witRes, workerRes] = await Promise.all([
                materialService.getMaterials(),
                warehouseService.getWarehouses(),
                projectService.getProjects(),
                workItemTypeService.getWorkItemTypes(),
                storeTransactionService.getWorkerCategories()
            ])
            setMaterials(matRes.materials || [])
            setFilteredMaterials(matRes.materials || [])
            setWarehouses(whRes.warehouses || [])
            setProjects(projRes.projects || [])
            setWorkItemTypes(witRes.data || [])
            setWorkerCategories(workerRes.categories || [])
        } catch (error) {
            antdMessage.error('Failed to load metadata')
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
            console.error('Failed to fetch stock', e)
        }
    }

    const fetchBOQData = async (projectId: number) => {
        try {
            const res = await boqService.getProjectBOQs(projectId)
            if (res.boqs?.length > 0) {
                const active = res.boqs.find((b: any) => b.status === 'approved') || res.boqs[0]
                const details = await boqService.getBOQDetails(active.id)
                const items = details.boq?.items || []
                setBoqItems(items)

                // Set initial filtered list to all materials in this project's BOQ
                const uniqueMats = Array.from(new Set(items.map((i: any) => i.material_id)))
                setFilteredMaterials(materials.filter(m => uniqueMats.includes(m.id)))
            } else {
                setBoqItems([])
                // If no BOQ, show only materials currently in Stock (Site Store)
                const stockedIds = Object.keys(stockMap).map(Number)
                if (stockedIds.length > 0) {
                    setFilteredMaterials(materials.filter(m => stockedIds.includes(m.id)))
                } else {
                    setFilteredMaterials([]) // No BOQ and No Stock = No materials allowed
                }
            }
        } catch (e) {
            console.error('Failed to fetch BOQ data', e)
            setBoqItems([])
            setFilteredMaterials([])
        }
    }

    const handleProjectChange = async (projectId: number) => {
        try {
            // Filter warehouses for this project
            const projectSites = warehouses.filter(w => w.project_id === projectId || w.warehouse_type === 'central')
            setProjectWarehouses(projectSites)

            // Fetch buildings and drawings in parallel
            const [buildingsRes, drawingsRes] = await Promise.all([
                projectHierarchyService.getBuildings(projectId),
                api.get(`/drawings?project_id=${projectId}&limit=100`)
            ])

            const buildings = buildingsRes.buildings || []
            const drawings = drawingsRes.data?.drawings || []

            setBuildings(buildings)
            setDrawings(drawings)
            setFloors([])
            setZones([])
            setPanels([])
            form.setFieldsValue({ building_id: undefined, floor_id: undefined, zone_id: undefined, drawing_id: undefined, drawing_panel_id: undefined })

            // Auto-detect structure type
            if (buildings.length > 0 && drawings.length > 0) {
                setStructureType('both')
            } else if (buildings.length > 0) {
                setStructureType('building')
            } else if (drawings.length > 0) {
                setStructureType('panel')
            } else {
                setStructureType(null)
            }

            // Load Project BOQ for material filtering
            fetchBOQData(projectId)
        } catch (e) {
            console.error(e)
        }
    }

    const fetchPanels = async (drawingId: number) => {
        try {
            const res = await api.get(`/drawings/${drawingId}/panels`)
            setPanels(res.data.panels || [])
            setSelectedPanel(null)
            form.setFieldsValue({ drawing_panel_id: undefined })
        } catch (e) {
            console.error('Failed to fetch panels', e)
        }
    }

    const handlePanelChange = (panelId: number) => {
        const panel = panels.find(p => p.id === panelId)
        setSelectedPanel(panel)
    }

    const handleBuildingChange = async (buildingId: number) => {
        try {
            const res = await projectHierarchyService.getFloors(buildingId)
            setFloors(res.floors || [])
            setZones([])
            form.setFieldsValue({ floor_id: undefined, zone_id: undefined })
        } catch (e) {
            console.error(e)
        }
    }

    const handleFloorChange = async (floorId: number) => {
        try {
            const res = await projectHierarchyService.getZones(floorId)
            setZones(res.zones || [])
            form.setFieldsValue({ zone_id: undefined })
        } catch (e) {
            console.error(e)
        }
    }

    const handleWorkTypeChange = async (workTypeId: number) => {
        const workType = workItemTypes.find(w => w.id === workTypeId)
        setSelectedWorkType(workType)

        if (!workType) return

        // 1. FILTER MATERIALS: Only show materials linked to this Work Type in the Project BOQ
        const relatedMaterials = boqItems
            .filter((bi: any) => bi.work_item_type_id === workTypeId)
            .map((bi: any) => bi.material)
            .filter(Boolean)

        if (relatedMaterials.length > 0) {
            setFilteredMaterials(relatedMaterials)
        } else {
            // Fallback: Show materials from the Project's general BOQ list (never the master list)
            const uniqueProjectMatIds = Array.from(new Set(boqItems.map((i: any) => i.material_id)))
            setFilteredMaterials(materials.filter(m => uniqueProjectMatIds.includes(m.id)))
        }

        // 2. PROFESSIONAL SMART MAPPING:
        // Linking 'Work Type' (Task) to 'Physical Structure' (Location)
        const typeName = workType.name.toLowerCase()
        const bMatch = buildings.find(b =>
            b.name.toLowerCase().includes(typeName) ||
            typeName.includes(b.name.toLowerCase())
        )

        if (bMatch) {
            form.setFieldsValue({ building_id: bMatch.id })
            await handleBuildingChange(bMatch.id)
        }
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

        if (detailedMode && (field === 'issued_quantity' || field === 'returned_quantity' || field === 'wastage')) {
            const it = newItems[index]
            const consumed = (it.issued_quantity || 0) - (it.returned_quantity || 0) - (it.wastage || 0)
            newItems[index].quantity = Math.max(0, consumed)
        }

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
            antdMessage.error('Please add at least one work activity or material')
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
                drawing_panel_id: values.drawing_panel_id,
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

            const submitReport = async () => {
                setLoading(true)
                try {
                    await storeTransactionService.createConsumption(payload)
                    antdMessage.success('Daily Site Report submitted successfully!')
                    navigate('/operations/dpr')
                } catch (error: any) {
                    antdMessage.error(error.response?.data?.message || 'Failed to submit report')
                    setLoading(false)
                }
            }

            // Validation: Check if work done exceeds panel area
            if (selectedPanel && values.drawing_panel_id) {
                let dims = { length: 0, width: 0, depth: 0 }
                try {
                    dims = typeof selectedPanel.coordinates_json === 'string' ? JSON.parse(selectedPanel.coordinates_json) : (selectedPanel.coordinates_json || {})
                } catch (e) { }

                const totalArea = Number(dims.length || 0) * Number(dims.depth || 0)

                // Determine the max work done reported in this session (e.g. max of Concrete or Excavation)
                const currentSessionWork = Math.max(...items.map(i => Number(i.work_done_quantity || 0)))

                // Calculate previous work
                let previousWork = 0
                if (selectedPanel.consumptions && Array.isArray(selectedPanel.consumptions)) {
                    // We need to sum up previous CONSUMPTION transactions
                    selectedPanel.consumptions.forEach((c: any) => {
                        if (c.items && Array.isArray(c.items)) {
                            previousWork += Math.max(...c.items.map((i: any) => Number(i.work_done_quantity || 0)))
                        }
                    })
                }

                if (totalArea > 0 && (previousWork + currentSessionWork) > totalArea) {
                    Modal.confirm({
                        title: 'Work Done Exceeds Panel Area',
                        content: (
                            <div>
                                <p>You are reporting <b>{currentSessionWork} m²</b> of work.</p>
                                <p>Previous Cumulative: <b>{previousWork} m²</b></p>
                                <p>Total (New + Previous): <b>{(previousWork + currentSessionWork).toFixed(2)} m²</b></p>
                                <p style={{ color: 'red' }}>Total Panel Area: <b>{totalArea.toFixed(2)} m²</b></p>
                                <br />
                                <p>Do you still want to proceed?</p>
                            </div>
                        ),
                        okText: 'Yes, Submit Anyway',
                        cancelText: 'Cancel & Review',
                        onOk: submitReport,
                        onCancel: () => setLoading(false)
                    })
                    return; // Stop here, wait for modal
                }
            }

            // If valid or no panel selected
            await submitReport()

        } catch (error: any) {
            antdMessage.error(error.response?.data?.message || 'Failed to submit report')
            setLoading(false)
        }
    }

    const summary = calculateSummary()

    const materialColumns = [
        {
            title: 'Activity/Material',
            dataIndex: 'material_id',
            width: '30%',
            render: (val: any, _: any, index: number) => (
                <Select
                    placeholder="Select item"
                    style={{ width: '100%' }}
                    showSearch
                    optionFilterProp="children"
                    value={val}
                    onChange={v => updateItem(index, 'material_id', v)}
                    size="small"
                >
                    {filteredMaterials.map(m => (
                        <Option key={m.id} value={m.id}>{m.name}</Option>
                    ))}
                </Select>
            )
        },
        ...(detailedMode ? [
            {
                title: 'Issued',
                dataIndex: 'issued_quantity',
                width: '12%',
                render: (val: any, _: any, index: number) => (
                    <InputNumber min={0} style={{ width: '100%' }} value={val} onChange={v => updateItem(index, 'issued_quantity', v)} size="small" />
                )
            },
            {
                title: 'Returned',
                dataIndex: 'returned_quantity',
                width: '12%',
                render: (val: any, _: any, index: number) => (
                    <InputNumber min={0} style={{ width: '100%' }} value={val} onChange={v => updateItem(index, 'returned_quantity', v)} size="small" />
                )
            }
        ] : []),
        {
            title: 'Consumed',
            dataIndex: 'quantity',
            width: detailedMode ? '12%' : '20%',
            render: (val: any, record: any, index: number) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {detailedMode ? <Tag color="blue">{val || 0}</Tag> :
                        <Space.Compact style={{ width: '100%' }}>
                            <InputNumber min={0} style={{ width: '70%' }} value={val} onChange={v => updateItem(index, 'quantity', v)} size="small" />
                            <Input style={{ width: '30%' }} value={record.unit || ''} disabled size="small" />
                        </Space.Compact>
                    }
                    {stockMap[record.material_id!] !== undefined && (
                        <div style={{ fontSize: '10px', marginTop: '2px', color: (stockMap[record.material_id!] || 0) < val ? '#ef4444' : '#64748b' }}>
                            Bal: {stockMap[record.material_id!] || 0}
                        </div>
                    )}
                </div>
            )
        },
        {
            title: 'Wastage',
            dataIndex: 'wastage',
            width: '12%',
            render: (val: any, _: any, index: number) => (
                <InputNumber min={0} style={{ width: '100%' }} value={val} onChange={v => updateItem(index, 'wastage', v)} size="small" />
            )
        },
        {
            title: 'Achievement',
            dataIndex: 'work_done_quantity',
            width: '20%',
            render: (val: any, record: any, index: number) => (
                <Space.Compact style={{ width: '100%' }}>
                    <InputNumber min={0} style={{ width: '70%' }} value={val} onChange={v => updateItem(index, 'work_done_quantity', v)} size="small" />
                    <Input style={{ width: '30%' }} value={selectedWorkType?.uom || record.unit || 'm'} disabled size="small" />
                </Space.Compact>
            )
        },
        {
            title: '',
            width: '5%',
            render: (_: any, __: any, index: number) => (
                <Button danger icon={<DeleteOutlined />} onClick={() => removeItem(index)} type="link" size="small" />
            )
        }
    ]

    return (
        <PageContainer maxWidth={1105}>
            <PageHeader
                title="🚀 Daily Progress Report"
                subtitle="One unified form for site progress, materials, & manpower"
                icon={<DashboardOutlined />}
            />

            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ transaction_date: dayjs() }}>
                {/* 1. Basic Site Details */}
                <SectionCard title="Basic Site Details" icon={<ProjectOutlined />}>
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item label={<span style={getLabelStyle()}>Project Selection</span>} name="project_id" rules={[{ required: true }]}>
                                <Select placeholder="Select project" onChange={handleProjectChange} size="large">
                                    {projects.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label={<span style={getLabelStyle()}>Site Store</span>} name="warehouse_id" rules={[{ required: true }]}>
                                <Select
                                    placeholder={projectWarehouses.length === 0 ? "Select project first" : "Select store"}
                                    size="large"
                                    onChange={fetchStock}
                                    disabled={projectWarehouses.length === 0}
                                >
                                    {projectWarehouses.map(w => <Option key={w.id} value={w.id}>{w.name} {w.warehouse_type === 'central' ? '(Central)' : '(Site)'}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item label={<span style={getLabelStyle()}>Reporting Date</span>} name="transaction_date" rules={[{ required: true }]}>
                                <DatePicker style={{ width: '100%' }} size="large" format="DD-MMM-YYYY" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label={<span style={getLabelStyle()}>Primary Work Type</span>} name="work_item_type_id" rules={[{ required: true }]}>
                                <Select placeholder="Select work type" size="large" onChange={handleWorkTypeChange}>
                                    {workItemTypes.map(wit => <Option key={wit.id} value={wit.id}>{wit.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                </SectionCard>

                {/* 1B. Physical Structure - Auto-detected */}
                {structureType && (
                    <SectionCard
                        title={structureType === 'building' ? 'Building Structure' : structureType === 'panel' ? 'Drawing Panels (D-Wall)' : 'Physical Structure'}
                        icon={<BlockOutlined />}
                    >
                        {structureType === 'both' && (
                            <div style={{ padding: '8px 12px', background: '#fef3c7', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                                💡 This project has both Building hierarchy and Drawing Panels. Select the appropriate structure for this work.
                            </div>
                        )}

                        {(structureType === 'building' || structureType === 'both') && (
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item label={<span style={getLabelStyle()}>Building</span>} name="building_id">
                                        <Select placeholder="Bldg" allowClear onChange={handleBuildingChange} size="large">
                                            {buildings.map(b => <Option key={b.id} value={b.id}>{b.name}</Option>)}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item label={<span style={getLabelStyle()}>Floor</span>} name="floor_id">
                                        <Select placeholder="Floor" allowClear onChange={handleFloorChange} size="large">
                                            {floors.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item label={<span style={getLabelStyle()}>Zone</span>} name="zone_id">
                                        <Select placeholder="Zone" allowClear size="large">
                                            {zones.map(z => <Option key={z.id} value={z.id}>{z.name}</Option>)}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                        )}

                        {(structureType === 'panel' || structureType === 'both') && (
                            <Row gutter={16} style={{ marginTop: structureType === 'both' ? '16px' : '0' }}>
                                <Col span={12}>
                                    <Form.Item label={<span style={getLabelStyle()}>Drawing</span>} name="drawing_id">
                                        <Select
                                            placeholder="Select drawing"
                                            allowClear
                                            size="large"
                                            onChange={(val) => {
                                                if (val) fetchPanels(val)
                                                else setPanels([])
                                                form.setFieldsValue({ drawing_panel_id: undefined })
                                            }}
                                        >
                                            {drawings.map(d => <Option key={d.id} value={d.id}>{d.drawing_name || d.drawing_number}</Option>)}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label={<span style={getLabelStyle()}>Panel</span>} name="drawing_panel_id">
                                        <Select placeholder="Select panel" allowClear size="large" onChange={handlePanelChange}>
                                            {panels.map(p => <Option key={p.id} value={p.id}>{p.panel_identifier}</Option>)}
                                        </Select>

                                        {selectedPanel && (
                                            <div style={{ marginTop: 8, padding: '12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                                {(() => {
                                                    let dims = { length: 0, width: 0, depth: 0, height: 0 }
                                                    try {
                                                        dims = JSON.parse(selectedPanel.coordinates_json || '{}')
                                                    } catch (e) { }

                                                    const length = Number(dims.length || 0)
                                                    const depth = Number(dims.depth || dims.height || 0)
                                                    const width = Number(dims.width || 0)

                                                    // Area (Face) = Length * Depth
                                                    const areaSqm = length * depth
                                                    const areaSqft = areaSqm * 10.764
                                                    const volCum = areaSqm * width

                                                    // Calculate Previous Progress
                                                    let totalDone = 0
                                                    if (selectedPanel.consumptions && Array.isArray(selectedPanel.consumptions)) {
                                                        selectedPanel.consumptions.forEach((c: any) => {
                                                            if (c.items && Array.isArray(c.items)) {
                                                                // Find the 'work done' item. Usually the first item or max work_done?
                                                                // We sum up the MAX work_done recorded in that transaction (assuming one main work item per transaction)
                                                                // Or sum all work_done quantities if they are additive.
                                                                // For D-Wall, usually we look at the Concrete or Excavation Quantity.
                                                                // Let's sum up 'work_done_quantity' of visible items.
                                                                const txMaxWork = Math.max(...c.items.map((i: any) => Number(i.work_done_quantity || 0)))
                                                                totalDone += txMaxWork
                                                            }
                                                        })
                                                    }

                                                    const percentDone = areaSqm > 0 ? (totalDone / areaSqm) * 100 : 0

                                                    return (
                                                        <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                                <Typography.Text type="secondary">Dimensions:</Typography.Text>
                                                                <Typography.Text strong>L: {length}m | D: {depth}m | W: {width}m</Typography.Text>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: 4 }}>
                                                                <Typography.Text type="secondary">Total Area:</Typography.Text>
                                                                <Typography.Text strong style={{ color: theme.colors.primary.main }}>
                                                                    {areaSqm.toFixed(2)} m² ({areaSqft.toFixed(2)} sqft)
                                                                </Typography.Text>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: 2 }}>
                                                                <Typography.Text type="secondary">Completed:</Typography.Text>
                                                                <Typography.Text strong style={{ color: percentDone >= 100 ? '#10b981' : '#f59e0b' }}>
                                                                    {totalDone.toFixed(2)} m² ({Math.min(percentDone, 100).toFixed(0)}%)
                                                                </Typography.Text>
                                                            </div>
                                                            <div style={{ marginTop: 6, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                                                <div style={{
                                                                    width: `${Math.min(percentDone, 100)}%`,
                                                                    height: '100%',
                                                                    background: percentDone >= 100 ? '#10b981' : theme.colors.primary.main,
                                                                    transition: 'width 0.3s ease'
                                                                }} />
                                                            </div>

                                                            {volCum > 0 && (
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: 4 }}>
                                                                    <Typography.Text type="secondary">Est. Volume:</Typography.Text>
                                                                    <Typography.Text>{volCum.toFixed(2)} m³</Typography.Text>
                                                                </div>
                                                            )}
                                                            <div style={{ marginTop: 8, fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                                                                * Recorded work done is cumulative.
                                                            </div>
                                                        </Space>
                                                    )
                                                })()}
                                            </div>
                                        )}
                                    </Form.Item>
                                </Col>
                            </Row>
                        )}
                    </SectionCard>
                )}

                {/* 2. Progress & Materials */}
                <SectionCard
                    title="Progress & Materials Achievement"
                    icon={<BlockOutlined />}
                    extra={
                        <Space>
                            <span style={{ fontSize: '13px', color: '#64748b' }}>Store mode:</span>
                            <Switch
                                size="small"
                                checked={detailedMode}
                                onChange={setDetailedMode}
                                checkedChildren={<ExpandOutlined />}
                                unCheckedChildren={<CompressOutlined />}
                            />
                        </Space>
                    }
                >
                    <Table
                        dataSource={items}
                        columns={materialColumns}
                        pagination={false}
                        rowKey={(_, i) => i?.toString() || '0'}
                        size="small"
                        bordered
                        style={{ marginTop: 8 }}
                        locale={{ emptyText: 'Record materials and work progress below.' }}
                        footer={() => (
                            <Button
                                type="dashed"
                                icon={<PlusOutlined />}
                                onClick={addItem}
                                block
                                style={{ height: '40px' }}
                            >
                                Add Material / Activity
                            </Button>
                        )}
                    />
                </SectionCard>

                {/* 3. Manpower & Labor Log (Hajri) */}
                <SectionCard
                    title="Manpower Deployment (Labor Hajri)"
                    icon={<TeamOutlined />}
                >
                    <Table
                        dataSource={manpower}
                        columns={[
                            {
                                title: 'Worker Category',
                                dataIndex: 'worker_type',
                                width: '40%',
                                render: (val, _, idx) => (
                                    <Select
                                        mode="tags"
                                        placeholder="Pick category or type NEW category here..."
                                        size="middle"
                                        value={val ? (Array.isArray(val) ? val : [val]) : []}
                                        onChange={v => updateManpower(idx, 'worker_type', v[v.length - 1])}
                                        style={{ width: '100%' }}
                                        tokenSeparators={[',']}
                                    >
                                        {workerCategories.map(cat => (
                                            <Option key={cat.id} value={cat.name}>{cat.name}</Option>
                                        ))}
                                        {/* Standard Defaults if list is empty */}
                                        {workerCategories.length === 0 && (
                                            <>
                                                <Option value="Steel Worker">Steel Worker</Option>
                                                <Option value="Mason">Mason</Option>
                                                <Option value="Helper">Helper</Option>
                                            </>
                                        )}
                                    </Select>
                                )
                            },
                            {
                                title: 'Strength (Headcount)',
                                dataIndex: 'count',
                                align: 'center',
                                render: (val, _, idx) => (
                                    <InputNumber
                                        min={0}
                                        placeholder="0"
                                        value={val}
                                        onChange={v => updateManpower(idx, 'count', v || 0)}
                                    />
                                )
                            },
                            {
                                title: 'Attendance (Hajri)',
                                dataIndex: 'hajri',
                                align: 'center',
                                render: (val, _, idx) => (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <InputNumber
                                            min={0}
                                            step={0.5}
                                            placeholder="1.0"
                                            value={val}
                                            onChange={v => updateManpower(idx, 'hajri', v || 0)}
                                        />
                                        <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Shifts/Days</span>
                                    </div>
                                )
                            },
                            {
                                title: 'Total Mandays',
                                key: 'total',
                                align: 'right',
                                render: (_, record) => (
                                    <Text strong style={{ color: theme.colors.primary.main }}>
                                        {(Number(record.count || 0) * Number(record.hajri || 0)).toFixed(1)}
                                    </Text>
                                )
                            },
                            {
                                title: '',
                                width: '50px',
                                render: (_, __, idx) => (
                                    <Button danger icon={<DeleteOutlined />} type="text" onClick={() => removeManpower(idx)} />
                                )
                            }
                        ]}
                        pagination={false}
                        rowKey={(_, i) => i?.toString() || '0'}
                        size="middle"
                        bordered
                        footer={() => (
                            <Button
                                type="dashed"
                                icon={<PlusOutlined />}
                                onClick={addManpower}
                                block
                                style={{ height: '40px', marginTop: '8px' }}
                            >
                                Add Worker Category
                            </Button>
                        )}
                    />
                </SectionCard>

                {/* 4. Site Conditions & Photos */}
                <SectionCard title="Site Conditions & Pictures" icon={<CameraOutlined />}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Weather" name="weather_condition">
                                <Select placeholder="Weather" size="large">
                                    <Option value="Clear">☀️ Clear</Option>
                                    <Option value="Rainy">🌧️ Rainy</Option>
                                    <Option value="Hot">🔥 Hot</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Work Hours" name="work_hours">
                                <Input placeholder="e.g. 8-6" size="large" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="Upload Progress Photos">
                        <Upload listType="picture-card" fileList={photoList} onChange={({ fileList }) => setPhotoList(fileList)} beforeUpload={() => false}>
                            {photoList.length < 5 && <div><PlusOutlined /><div style={{ marginTop: 8 }}>Capture</div></div>}
                        </Upload>
                    </Form.Item>
                    <Form.Item label="Detailed Site Remarks" name="remarks">
                        <TextArea rows={3} placeholder="Any delays, safety issues, or milestones..." />
                    </Form.Item>
                </SectionCard>

                {/* 5. Live Summary Footer */}
                <Card style={{ background: theme.gradients.primary, color: 'white', marginBottom: 24, borderRadius: 12 }}>
                    <Row gutter={24} align="middle">
                        <Col span={8}>
                            <Statistic title={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Achievement</span>} value={summary.totalWorkDone} suffix={selectedWorkType?.uom || 'm'} valueStyle={{ color: 'white' }} />
                        </Col>
                        <Col span={8}>
                            <Statistic title={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Efficiency</span>} value={summary.efficiency} suffix="%" valueStyle={{ color: summary.efficiency >= 90 ? '#52c41a' : '#faad14' }} />
                        </Col>
                        <Col span={8}>
                            <Statistic title={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Daily Cost</span>} value={summary.totalCost} prefix="₹" valueStyle={{ color: 'white' }} />
                        </Col>
                    </Row>
                </Card>

                {/* Submit Container */}
                <Card style={actionCardStyle}>
                    <div style={flexBetweenStyle}>
                        <Text type="secondary"><InfoCircleOutlined /> Auto-updates Inventory & BOQ Progress on submission.</Text>
                        <Space>
                            <Button onClick={() => navigate(-1)} size="large">Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} size="large" style={getPrimaryButtonStyle()}>Submit Site Report</Button>
                        </Space>
                    </div>
                </Card>
            </Form>
        </PageContainer>
    )
}

export default UnifiedDailyReport
