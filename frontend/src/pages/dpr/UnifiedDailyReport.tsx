import { useState, useEffect } from 'react'
import { Form, Input, Button, Select, DatePicker, InputNumber, Table, Space, Row, Col, Typography, Upload, Card, Tag, Statistic, Switch, message as antdMessage, Modal, TimePicker, Divider, AutoComplete } from 'antd'
import {
    SaveOutlined,
    PlusOutlined,
    ProjectOutlined,
    CameraOutlined,
    TeamOutlined,
    DashboardOutlined,
    BlockOutlined,
    ExpandOutlined,
    CompressOutlined,
    InfoCircleOutlined,
    AuditOutlined,
    DeleteOutlined,
    ClockCircleOutlined,
    PrinterOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import DprPrintTemplate from './DprPrintTemplate'
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
    tempId?: string
    material_id?: number
    material_name?: string
    issued_quantity: number
    quantity: number
    returned_quantity: number
    wastage: number
    work_done_quantity: number
    unit?: string
    drawing_panel_id?: number
    work_item_type_id?: number
}

interface ManpowerItem {
    tempId?: string
    worker_type: string
    count: number
    hajri: number
    is_staff?: boolean
}

interface MachineryItem {
    tempId?: string
    name: string
    count: number
    hours?: number
}

interface RmcItem {
    tempId?: string
    vehicle_no: string
    quantity: number
    slump?: number
    in_time?: string
    start_time?: string
    out_time?: string
    remarks?: string
    drawing_panel_id?: number
}

const UnifiedDailyReport = () => {
    const { id } = useParams()
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
    const [selectedPanels, setSelectedPanels] = useState<any[]>([])
    const [newWorkerCategory, setNewWorkerCategory] = useState('')

    const addWorkerCategory = async () => {
        if (!newWorkerCategory.trim()) return
        try {
            const res = await storeTransactionService.createWorkerCategory(newWorkerCategory)
            setWorkerCategories([...workerCategories, res.category])
            setNewWorkerCategory('')
            antdMessage.success('Category added!')
        } catch (e) {
            console.error(e)
            antdMessage.error('Failed to add category')
        }
    }
    const [workItemTypes, setWorkItemTypes] = useState<any[]>([])
    const [workerCategories, setWorkerCategories] = useState<any[]>([])
    const [items, setItems] = useState<MaterialItem[]>([])
    const [manpower, setManpower] = useState<ManpowerItem[]>([])
    const [machinery, setMachinery] = useState<MachineryItem[]>([])
    const [stockMap, setStockMap] = useState<Record<number, number>>({})
    const [photoList, setPhotoList] = useState<UploadFile[]>([])
    const [selectedWorkType, setSelectedWorkType] = useState<any>(null)
    const [rmcLogs, setRmcLogs] = useState<RmcItem[]>([])

    const navigate = useNavigate()

    useEffect(() => {
        fetchMetadata()
        if (id) {
            fetchReportDetails(Number(id))
        }
    }, [id])

    const fetchReportDetails = async (reportId: number) => {
        setLoading(true)
        try {
            const res = await storeTransactionService.getTransaction(reportId)
            const log = res.transaction
            if (log) {
                // Initialize form with basic data
                form.setFieldsValue({
                    project_id: log.project_id,
                    warehouse_id: log.warehouse_id,
                    transaction_date: dayjs(log.transaction_date),
                    work_item_type_id: log.items?.[0]?.work_item_type_id,
                    weather_condition: log.weather_condition,
                    work_hours: log.work_hours,
                    temperature: log.temperature,
                    remarks: log.remarks,
                    building_id: log.to_building_id,
                    floor_id: log.to_floor_id,
                    zone_id: log.to_zone_id,
                    drawing_id: log.drawing_panel?.drawing_id,
                    drawing_panel_id: log.drawing_panel_id ? [log.drawing_panel_id] : [],
                    actual_depth: log.actual_depth,
                    verticality_x: log.verticality_x,
                    verticality_y: log.verticality_y,
                    slurry_density: log.slurry_density,
                    slurry_viscosity: log.slurry_viscosity,
                    slurry_sand_content: log.slurry_sand_content,
                    cage_id_ref: log.cage_id_ref,
                    start_time: log.start_time ? dayjs(log.start_time, 'HH:mm') : undefined,
                    end_time: log.end_time ? dayjs(log.end_time, 'HH:mm') : undefined,
                    slump_flow: log.slump_flow,
                    tremie_pipe_count: log.tremie_pipe_count,
                    theoretical_concrete_qty: log.theoretical_concrete_qty,
                    grabbing_start_time: log.grabbing_start_time ? dayjs(log.grabbing_start_time, 'HH:mm') : undefined,
                    grabbing_end_time: log.grabbing_end_time ? dayjs(log.grabbing_end_time, 'HH:mm') : undefined,
                    concrete_grade: log.concrete_grade,
                    grabbing_depth: log.grabbing_depth,
                    grabbing_sqm: log.grabbing_sqm,
                    concreting_depth: log.concreting_depth,
                    concreting_sqm: log.concreting_sqm
                })

                // Load dependent data
                if (log.project_id) {
                    const sites = warehouses.filter(w => w.project_id === log.project_id || w.warehouse_type === 'central')
                    setProjectWarehouses(sites)
                    fetchBOQData(log.project_id)

                    const [buildingsRes, drawingsRes] = await Promise.all([
                        projectHierarchyService.getBuildings(log.project_id),
                        api.get(`/drawings?project_id=${log.project_id}&limit=100`)
                    ])
                    setBuildings(buildingsRes.buildings || [])
                    setDrawings(drawingsRes.data?.drawings || [])
                }

                if (log.to_building_id) {
                    const res = await projectHierarchyService.getFloors(log.to_building_id)
                    setFloors(res.floors || [])
                }
                if (log.to_floor_id) {
                    const res = await projectHierarchyService.getZones(log.to_floor_id)
                    setZones(res.zones || [])
                }
                if (log.drawing_panel?.drawing_id) {
                    const panelRes = await api.get(`/drawings/${log.drawing_panel.drawing_id}/panels`)
                    const allPanels = panelRes.data.panels || []
                    setPanels(allPanels)

                    // If multiple panels are stored (currently we store one in transaction, 
                    // but we might want to recover others from items later)
                    const pId = log.drawing_panel_id
                    const panel = allPanels.find((p: any) => p.id === pId)
                    if (panel) {
                        setSelectedPanels([panel])
                    }
                }

                setItems(log.items?.map((it: any) => ({
                    tempId: `loaded-item-${Math.random()}`,
                    material_id: it.material_id,
                    issued_quantity: it.issued_quantity,
                    quantity: it.quantity,
                    returned_quantity: it.returned_quantity,
                    wastage: it.wastage_quantity,
                    work_done_quantity: it.work_done_quantity,
                    unit: it.unit,
                    drawing_panel_id: it.drawing_panel_id,
                    work_item_type_id: it.work_item_type_id
                })) || [])

                setManpower(log.manpower_data ? JSON.parse(log.manpower_data).map((m: any) => ({ ...m, tempId: `loaded-man-${Math.random()}` })) : [])
                setMachinery(log.machinery_data ? JSON.parse(log.machinery_data).map((m: any) => ({ ...m, tempId: `loaded-mach-${Math.random()}` })) : [])
                setRmcLogs(log.rmcLogs?.map((it: any) => ({ ...it, tempId: `loaded-rmc-${Math.random()}` })) || [])

                if (log.progress_photos) {
                    const photos = JSON.parse(log.progress_photos)
                    setPhotoList(photos.map((url: string, i: number) => ({
                        uid: `-${i}`,
                        name: `photo-${i}`,
                        status: 'done',
                        url: url.startsWith('http') ? url : `http://localhost:5000/${url}`
                    })))
                }
            }
        } catch (e) {
            console.error('Failed to fetch report details', e)
            antdMessage.error('Failed to load report for editing')
        } finally {
            setLoading(false)
        }
    }

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
            form.setFieldsValue({
                building_id: undefined,
                floor_id: undefined,
                zone_id: undefined,
                drawing_id: undefined,
                drawing_panel_id: []
            })

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
            setSelectedPanels([])
            form.setFieldsValue({ drawing_panel_id: [] })
        } catch (e) {
            console.error('Failed to fetch panels', e)
        }
    }

    const handlePanelChange = (panelIds: any) => {
        const ids = Array.isArray(panelIds) ? panelIds : []
        const selected = panels.filter(p => ids.includes(p.id))
        setSelectedPanels(selected)

        if (selected.length > 0) {
            // Default to first selected panel if no complex logic needed
            const currentPrimary = selected[0]
            if (currentPrimary && currentPrimary.theoretical_concrete_volume) {
                // Setting other fields is fine, just don't set 'drawing_panel_id' manually here
                form.setFieldsValue({ theoretical_concrete_qty: currentPrimary.theoretical_concrete_volume })
            }
        }
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

    const handleValuesChange = (changedValues: any, allValues: any) => {
        if (changedValues.grabbing_depth !== undefined || changedValues.concreting_depth !== undefined || changedValues.drawing_panel_id) {
            // Calculate total length from all selected panels
            const currentPanelIds = allValues.drawing_panel_id || []
            const selected = panels.filter(p => currentPanelIds.includes(p.id))

            let totalLength = 0
            selected.forEach(p => {
                let dims = { length: 0 }
                try {
                    dims = typeof p.coordinates_json === 'string' ? JSON.parse(p.coordinates_json) : (p.coordinates_json || {})
                } catch (e) { }
                totalLength += Number(dims.length || 0)
            })

            if (totalLength > 0) {
                const updates: any = {}
                if (allValues.grabbing_depth !== undefined && allValues.grabbing_depth !== null) {
                    updates.grabbing_sqm = Number((totalLength * allValues.grabbing_depth).toFixed(2))
                }
                if (allValues.concreting_depth !== undefined && allValues.concreting_depth !== null) {
                    updates.concreting_sqm = Number((totalLength * allValues.concreting_depth).toFixed(2))
                }
                form.setFieldsValue(updates)
            }
        }
    }

    const addItem = () => {
        const defaultPanelId = (selectedPanels.length > 0 ? selectedPanels[0]?.id : undefined) || (form.getFieldValue('drawing_panel_id')?.[0])
        setItems([...items, {
            tempId: `item-${Date.now()}`,
            material_id: undefined,
            issued_quantity: 0,
            quantity: 0,
            returned_quantity: 0,
            wastage: 0,
            work_done_quantity: 0,
            drawing_panel_id: defaultPanelId,
            work_item_type_id: form.getFieldValue('work_item_type_id')
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

    const addManpower = (isStaff = false) => {
        setManpower([...manpower, { tempId: `man-${Date.now()}-${Math.random()}`, worker_type: '', count: 0, hajri: 0, is_staff: isStaff }])
    }

    const removeManpower = (index: number) => {
        setManpower(manpower.filter((_, i) => i !== index))
    }

    const updateManpower = (index: number, field: string, value: any) => {
        const newManpower = [...manpower]
        newManpower[index] = { ...newManpower[index], [field]: value }
        setManpower(newManpower)
    }

    const addMachinery = () => {
        setMachinery([...machinery, { tempId: `mach-${Date.now()}`, name: '', count: 0, hours: 0 }])
    }

    const removeMachinery = (index: number) => {
        setMachinery(machinery.filter((_, i) => i !== index))
    }

    const updateMachinery = (index: number, field: string, value: any) => {
        const newMachinery = [...machinery]
        newMachinery[index] = { ...newMachinery[index], [field]: value }
        setMachinery(newMachinery)
    }

    const addRmcLog = () => {
        const defaultPanelId = (selectedPanels.length > 0 ? selectedPanels[0]?.id : undefined) || (form.getFieldValue('drawing_panel_id')?.[0])
        setRmcLogs([...rmcLogs, { tempId: `rmc-${Date.now()}`, vehicle_no: '', quantity: 0, drawing_panel_id: defaultPanelId }])
    }

    const removeRmcLog = (index: number) => {
        setRmcLogs(rmcLogs.filter((_, i) => i !== index))
    }

    const updateRmcLog = (index: number, field: string, value: any) => {
        const newLogs = [...rmcLogs]
        newLogs[index] = { ...newLogs[index], [field]: value }
        setRmcLogs(newLogs)
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
            rmc_logs: rmcLogs,
            // D-Wall Tech Fields
            actual_depth: values.actual_depth,
            verticality_x: values.verticality_x,
            verticality_y: values.verticality_y,
            slurry_density: values.slurry_density,
            slurry_viscosity: values.slurry_viscosity,
            slurry_sand_content: values.slurry_sand_content,
            cage_id_ref: values.cage_id_ref,
            start_time: values.start_time ? values.start_time.format('HH:mm') : undefined,
            end_time: values.end_time ? values.end_time.format('HH:mm') : undefined,
            slump_flow: values.slump_flow,
            tremie_pipe_count: values.tremie_pipe_count,
            theoretical_concrete_qty: values.theoretical_concrete_qty,
            grabbing_start_time: values.grabbing_start_time ? values.grabbing_start_time.format('HH:mm') : undefined,
            grabbing_end_time: values.grabbing_end_time ? values.grabbing_end_time.format('HH:mm') : undefined,
            concrete_grade: values.concrete_grade,
            grabbing_depth: values.grabbing_depth,
            grabbing_sqm: values.grabbing_sqm,
            concreting_depth: values.concreting_depth,
            concreting_sqm: values.concreting_sqm,
            machinery_data: JSON.stringify(machinery),
            drawing_panel_id: (selectedPanels.length > 0 ? selectedPanels[0]?.id : undefined) || (values.drawing_panel_id?.[0]),
            items: items.map(it => ({
                material_id: it.material_id,
                issued_quantity: it.issued_quantity,
                quantity: it.quantity,
                returned_quantity: it.returned_quantity,
                wastage_quantity: it.wastage,
                work_done_quantity: it.work_done_quantity,
                work_item_type_id: it.work_item_type_id,
                drawing_panel_id: it.drawing_panel_id,
                unit: it.unit
            }))
        }

        // 1. D-Wall Design Area Variance Check (10% Tolerance)
        const primId = (selectedPanels.length > 0 ? selectedPanels[0]?.id : undefined) || (values.drawing_panel_id?.[0])
        const panel = panels.find(p => p.id === primId)
        if (panel) {
            let dims = { length: 0, depth: 0 }
            try {
                dims = typeof panel.coordinates_json === 'string' ? JSON.parse(panel.coordinates_json) : (panel.coordinates_json || {})
            } catch (e) { }

            const designArea = Number(dims.length || 0) * Number(dims.depth || panel.depth || 0)
            const reportedArea = values.grabbing_sqm || 0

            if (designArea > 0 && reportedArea > designArea * 1.1) {
                const varPct = (((reportedArea - designArea) / designArea) * 100).toFixed(1)
                Modal.confirm({
                    title: 'High Area Variation!',
                    icon: <InfoCircleOutlined style={{ color: '#faad14' }} />,
                    content: `The reported area (${reportedArea} SQM) is ${varPct}% more than the Design area (${designArea.toFixed(2)} SQM). Standard practice allows ±10%. Do you want to submit this variance?`,
                    okText: 'Yes, Submit',
                    cancelText: 'Review',
                    onOk: () => performSubmission(payload)
                })
                return
            }
        }

        // 2. Cumulative Progress Check
        if (panel && values.drawing_panel_id) {
            let dims = { length: 0, depth: 0 }
            try {
                dims = typeof panel.coordinates_json === 'string' ? JSON.parse(panel.coordinates_json) : (panel.coordinates_json || {})
            } catch (e) { }
            const totalArea = Number(dims.length || 0) * Number(dims.depth || 0)

            const currentSessionWork = Math.max(...items.map(i => Number(i.work_done_quantity || 0)))
            let previousWork = 0
            if (panel.consumptions && Array.isArray(panel.consumptions)) {
                panel.consumptions.forEach((c: any) => {
                    if (c.items && Array.isArray(c.items)) {
                        previousWork += Math.max(...c.items.map((i: any) => Number(i.work_done_quantity || 0)))
                    }
                })
            }

            if (totalArea > 0 && (previousWork + currentSessionWork) > totalArea) {
                Modal.confirm({
                    title: 'Work Done Exceeds Panel Area',
                    content: `Cumulative progress (${(previousWork + currentSessionWork).toFixed(2)} m²) exceeds total panel area (${totalArea.toFixed(2)} m²). Proceed anyway?`,
                    onOk: () => performSubmission(payload)
                })
                return
            }
        }

        performSubmission(payload)
    }

    const performSubmission = async (payload: any) => {
        setLoading(true)
        try {
            if (id) {
                await storeTransactionService.updateTransaction(Number(id), payload)
                antdMessage.success('Daily Site Report updated!')
            } else {
                await storeTransactionService.createConsumption(payload)
                antdMessage.success('Daily Site Report submitted!')
            }
            navigate('/dpr/list')
        } catch (error: any) {
            console.error(error)
            antdMessage.error(error.response?.data?.message || 'Failed to submit report')
        } finally {
            setLoading(false)
        }
    }

    const summary = calculateSummary()

    const materialColumns = [
        {
            title: 'Activity',
            dataIndex: 'work_item_type_id',
            width: '15%',
            render: (val: any, _: any, index: number) => (
                <Select
                    placeholder="Work Type"
                    style={{ width: '100%' }}
                    value={val}
                    onChange={v => updateItem(index, 'work_item_type_id', v)}
                    size="small"
                >
                    {workItemTypes.map(w => (
                        <Option key={w.id} value={w.id}>{w.name}</Option>
                    ))}
                </Select>
            )
        },
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
        ...((structureType === 'panel' || structureType === 'both') ? [{
            title: 'Panel',
            dataIndex: 'drawing_panel_id',
            width: '15%',
            render: (val: any, _: any, index: number) => (
                <Select
                    placeholder="Panel"
                    style={{ width: '100%' }}
                    value={val}
                    onChange={v => updateItem(index, 'drawing_panel_id', v)}
                    size="small"
                    allowClear
                >
                    {(selectedPanels.length > 0 ? selectedPanels : panels).map((p: any) => (
                        <Option key={p.id} value={p.id}>{p.panel_identifier}</Option>
                    ))}
                </Select>
            )
        }] : []),
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

    const rmcColumns = [
        {
            title: 'Vehicle No',
            dataIndex: 'vehicle_no',
            render: (val: any, _: any, index: number) => (
                <Input placeholder="MH01..." value={val} onChange={e => updateRmcLog(index, 'vehicle_no', e.target.value)} size="small" />
            )
        },
        ...(selectedPanels.length > 0 ? [{
            title: 'Panel',
            dataIndex: 'drawing_panel_id',
            width: '20%',
            render: (val: any, _: any, index: number) => (
                <Select
                    placeholder="Panel"
                    style={{ width: '100%' }}
                    value={val}
                    onChange={v => updateRmcLog(index, 'drawing_panel_id', v)}
                    size="small"
                >
                    {selectedPanels.map((p: any) => (
                        <Option key={p.id} value={p.id}>{p.panel_identifier}</Option>
                    ))}
                </Select>
            )
        }] : []),
        {
            title: 'Qty (cum)',
            dataIndex: 'quantity',
            render: (val: any, _: any, index: number) => (
                <InputNumber min={0} value={val} onChange={v => updateRmcLog(index, 'quantity', v)} size="small" />
            )
        },
        {
            title: 'Slump',
            dataIndex: 'slump',
            render: (val: any, _: any, index: number) => (
                <InputNumber min={0} value={val} onChange={v => updateRmcLog(index, 'slump', v)} size="small" />
            )
        },
        {
            title: 'In Time',
            dataIndex: 'in_time',
            render: (val: any, _: any, index: number) => (
                <TimePicker
                    format="HH:mm"
                    value={val ? dayjs(val, 'HH:mm') : null}
                    onChange={(_, timeStr) => updateRmcLog(index, 'in_time', Array.isArray(timeStr) ? timeStr[0] : timeStr)}
                    size="small"
                />
            )
        },
        {
            title: 'Start',
            dataIndex: 'start_time',
            render: (val: any, _: any, index: number) => (
                <TimePicker
                    format="HH:mm"
                    value={val ? dayjs(val, 'HH:mm') : null}
                    onChange={(_, timeStr) => updateRmcLog(index, 'start_time', Array.isArray(timeStr) ? timeStr[0] : timeStr)}
                    size="small"
                />
            )
        },
        {
            title: 'Out',
            dataIndex: 'out_time',
            render: (val: any, _: any, index: number) => (
                <TimePicker
                    format="HH:mm"
                    value={val ? dayjs(val, 'HH:mm') : null}
                    onChange={(_, timeStr) => updateRmcLog(index, 'out_time', Array.isArray(timeStr) ? timeStr[0] : timeStr)}
                    size="small"
                />
            )
        },
        {
            title: '',
            width: '5%',
            render: (_: any, __: any, index: number) => (
                <Button danger icon={<DeleteOutlined />} onClick={() => removeRmcLog(index)} type="link" size="small" />
            )
        }
    ]

    const handlePrint = () => {
        window.print()
    }

    const currentProject = projects.find(p => p.id === form.getFieldValue('project_id'))
    const formData = form.getFieldsValue(true)

    return (
        <div>
            <style>{`
                @media print {
                    .dpr-no-print { display: none !important; }
                    .dpr-only-print { display: block !important; }
                    @page { margin: 0; }
                    body { margin: 0; padding: 0; }
                }
                .dpr-only-print { display: none; }
            `}</style>

            <div className="dpr-only-print">
                <DprPrintTemplate
                    data={formData}
                    project={currentProject}
                    items={items}
                    manpower={manpower}
                    machinery={machinery}
                    rmcLogs={rmcLogs}
                    selectedPanels={selectedPanels}
                />
            </div>

            <div className="dpr-no-print">
                <PageContainer maxWidth={1105}>
                    <PageHeader
                        title="🚀 Daily Progress Report"
                        subtitle="One unified form for site progress, materials, & manpower"
                        icon={<DashboardOutlined />}
                        extra={[
                            <Button
                                key="print"
                                type="default"
                                icon={<PrinterOutlined />}
                                onClick={handlePrint}
                            >
                                Print / PDF
                            </Button>
                        ]}
                    />

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        onValuesChange={handleValuesChange}
                        initialValues={{ transaction_date: dayjs(), drawing_panel_id: [] }}
                    >
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
                                                        if (val) {
                                                            fetchPanels(val)
                                                        } else {
                                                            setPanels([])
                                                            setSelectedPanels([])
                                                            form.setFieldsValue({ drawing_panel_id: [] })
                                                        }
                                                    }}
                                                >
                                                    {drawings.map(d => <Option key={d.id} value={d.id}>{d.drawing_name || d.drawing_number}</Option>)}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label={<span style={getLabelStyle()}>Panel(s)</span>} name="drawing_panel_id">
                                                <Select
                                                    mode="multiple"
                                                    placeholder="Select panel(s)"
                                                    allowClear
                                                    size="large"
                                                    onChange={handlePanelChange}
                                                    style={{ width: '100%' }}
                                                    options={panels.map(p => ({ label: p.panel_identifier, value: p.id }))}
                                                />
                                            </Form.Item>

                                            {selectedPanels.length > 0 && (
                                                <div style={{ marginTop: 12 }}>
                                                    <div style={{
                                                        padding: '12px 16px',
                                                        background: selectedPanels.length > 1 ? '#f0f9ff' : '#f8fafc',
                                                        borderRadius: 12,
                                                        border: `1px solid ${selectedPanels.length > 1 ? '#bae6fd' : '#e2e8f0'}`,
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                                        marginBottom: 12
                                                    }}>
                                                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Typography.Text strong style={{ color: selectedPanels.length > 1 ? '#0369a1' : '#475569' }}>
                                                                    {selectedPanels.length > 1 ? '🚀 Multiple Panels Combined' : '📍 Panel Selected'}
                                                                </Typography.Text>
                                                                <Tag color={selectedPanels.length > 1 ? 'blue' : 'default'} style={{ margin: 0 }}>
                                                                    {selectedPanels.length} Panel{selectedPanels.length > 1 ? 's' : ''}
                                                                </Tag>
                                                            </div>

                                                            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                                                                <div>
                                                                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Primary Identification</Text>
                                                                    <Text strong>{selectedPanels[0]?.panel_identifier}</Text>
                                                                </div>
                                                                {selectedPanels.length > 1 && (
                                                                    <>
                                                                        <Divider type="vertical" style={{ height: '32px' }} />
                                                                        <div>
                                                                            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Total Length</Text>
                                                                            <Text strong style={{ color: '#0369a1' }}>
                                                                                {selectedPanels.reduce((sum, p) => {
                                                                                    let d = { length: 0 };
                                                                                    try { d = typeof p.coordinates_json === 'string' ? JSON.parse(p.coordinates_json) : (p.coordinates_json || {}) } catch (e) { }
                                                                                    return sum + Number(d.length || 0)
                                                                                }, 0).toFixed(2)} m
                                                                            </Text>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </Space>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedPanels.map(panel => {
                                                let dims = { length: 0, width: 0, depth: 0, height: 0 }
                                                try {
                                                    dims = JSON.parse(panel.coordinates_json || '{}')
                                                } catch (e) { }

                                                const length = Number(dims.length || 0)
                                                const depth = Number(dims.depth || dims.height || 0)
                                                const width = Number(dims.width || 0)

                                                const areaSqm = length * depth
                                                const areaSqft = areaSqm * 10.764
                                                const volCum = areaSqm * width

                                                let totalDone = 0
                                                if (panel.consumptions && Array.isArray(panel.consumptions)) {
                                                    panel.consumptions.forEach((c: any) => {
                                                        if (c.items && Array.isArray(c.items)) {
                                                            const txMaxWork = Math.max(...c.items.map((i: any) => Number(i.work_done_quantity || 0)))
                                                            totalDone += txMaxWork
                                                        }
                                                    })
                                                }

                                                const percentDone = areaSqm > 0 ? (totalDone / areaSqm) * 100 : 0

                                                return (
                                                    <div key={panel.id} style={{ marginBottom: 8, padding: '12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                                        <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                                <Typography.Text strong>{panel.panel_identifier}</Typography.Text>
                                                                <Typography.Text type="secondary">L: {length}m | D: {depth}m | W: {width}m</Typography.Text>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: 4 }}>
                                                                <Typography.Text type="secondary">Area:</Typography.Text>
                                                                <Typography.Text strong style={{ color: theme.colors.primary.main }}>
                                                                    {areaSqm.toFixed(2)} m² ({areaSqft.toFixed(2)} sqft)
                                                                </Typography.Text>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: 2 }}>
                                                                <Typography.Text type="secondary">Comp:</Typography.Text>
                                                                <Typography.Text strong style={{ color: percentDone >= 100 ? '#10b981' : '#f59e0b' }}>
                                                                    {totalDone.toFixed(2)} m² ({Math.min(percentDone, 100).toFixed(0)}%)
                                                                </Typography.Text>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: 2 }}>
                                                                <Typography.Text type="secondary">Est Vol:</Typography.Text>
                                                                <Typography.Text strong>
                                                                    {volCum.toFixed(2)} m³
                                                                </Typography.Text>
                                                            </div>
                                                            <div style={{ marginTop: 6, height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                                                                <div style={{
                                                                    width: `${Math.min(percentDone, 100)}%`,
                                                                    height: '100%',
                                                                    background: percentDone >= 100 ? '#10b981' : theme.colors.primary.main,
                                                                    transition: 'width 0.3s ease'
                                                                }} />
                                                            </div>
                                                        </Space>
                                                    </div>
                                                )
                                            })}
                                        </Col>
                                    </Row>
                                )}
                            </SectionCard>
                        )}

                        {/* 1C. D-Wall Specialized Logs (Appears if at least one Panel is selected) */}
                        {selectedPanels.length > 0 && (
                            <>
                                <SectionCard title="D-Wall Technical Logs (QC)" icon={<AuditOutlined />}>
                                    <Row gutter={16}>
                                        <Col span={6}>
                                            <Form.Item label="Grabbing Depth (m)" name="grabbing_depth">
                                                <InputNumber style={{ width: '100%' }} placeholder="0.00" size="large" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label="Grabbing (SQM)" name="grabbing_sqm">
                                                <InputNumber style={{ width: '100%' }} disabled size="large" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label="Grabbing Start" name="grabbing_start_time">
                                                <TimePicker format="HH:mm" style={{ width: '100%' }} size="large" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label="Grabbing End" name="grabbing_end_time">
                                                <TimePicker format="HH:mm" style={{ width: '100%' }} size="large" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col span={6}>
                                            <Form.Item label="Concreting Depth (m)" name="concreting_depth">
                                                <InputNumber style={{ width: '100%' }} placeholder="0.00" size="large" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label="Concreting (SQM)" name="concreting_sqm">
                                                <InputNumber style={{ width: '100%' }} disabled size="large" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label="Concrete Start" name="start_time">
                                                <TimePicker format="HH:mm" style={{ width: '100%' }} size="large" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item label="Concrete End" name="end_time">
                                                <TimePicker format="HH:mm" style={{ width: '100%' }} size="large" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col span={8}>
                                            <Form.Item label="Concrete Grade" name="concrete_grade">
                                                <AutoComplete
                                                    placeholder="Select or Type Grade"
                                                    size="large"
                                                    options={[
                                                        { value: 'M20' },
                                                        { value: 'M25' },
                                                        { value: 'M30' },
                                                        { value: 'M35' },
                                                        { value: 'M40' },
                                                        { value: 'M50' },
                                                    ]}
                                                    filterOption={(inputValue, option) =>
                                                        option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                                    }
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item label="Theoretical Qty (cum)" name="theoretical_concrete_qty">
                                                <InputNumber style={{ width: '100%' }} size="large" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item label="Cage ID" name="cage_id_ref">
                                                <Input placeholder="CAGE-001" size="large" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Divider dashed style={{ margin: '12px 0' }} />
                                    <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>Quality & Slurry Parameters</Typography.Text>
                                    <Row gutter={16}>
                                        <Col span={4}>
                                            <Form.Item label="Vert X (%)" name="verticality_x">
                                                <InputNumber style={{ width: '100%' }} placeholder="< 0.5" size="large" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            <Form.Item label="Vert Y (%)" name="verticality_y">
                                                <InputNumber style={{ width: '100%' }} placeholder="< 0.5" size="large" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            <Form.Item label="Slurry Dens" name="slurry_density">
                                                <InputNumber style={{ width: '100%' }} placeholder="1.05" size="large" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            <Form.Item label="Sand %" name="slurry_sand_content">
                                                <InputNumber style={{ width: '100%' }} placeholder="< 3" size="large" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            <Form.Item label="Viscosity" name="slurry_viscosity">
                                                <InputNumber style={{ width: '100%' }} placeholder="32" size="large" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            <Form.Item label="Slump (mm)" name="slump_flow">
                                                <InputNumber style={{ width: '100%' }} placeholder="200" size="large" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </SectionCard>

                                <SectionCard
                                    title="RMC Delivery Details (Vehicle Log)"
                                    icon={<ClockCircleOutlined />}
                                    extra={<Button type="dashed" icon={<PlusOutlined />} onClick={addRmcLog}>Add Vehicle</Button>}
                                >
                                    <Table
                                        dataSource={rmcLogs}
                                        columns={rmcColumns}
                                        pagination={false}
                                        rowKey="tempId"
                                        size="small"
                                        bordered
                                    />
                                    <div style={{ marginTop: 16, display: 'flex', gap: 24 }}>
                                        <Form.Item label="Theoretical Qty (cum)" name="theoretical_concrete_qty" style={{ flex: 1 }}>
                                            <InputNumber style={{ width: '100%' }} size="large" />
                                        </Form.Item>
                                        <Form.Item label="Tremie Pipes" name="tremie_pipe_count" style={{ flex: 1 }}>
                                            <InputNumber style={{ width: '100%' }} size="large" />
                                        </Form.Item>
                                    </div>
                                </SectionCard>
                            </>
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
                                rowKey="tempId"
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

                        {/* 3. Resources Deployment (Staff/Manpower/Machinery) */}
                        <Row gutter={16}>
                            <Col span={12}>
                                <SectionCard title="Staff Deployment" icon={<TeamOutlined />}>
                                    <Table
                                        dataSource={manpower.filter(m => m.is_staff)}
                                        columns={[
                                            {
                                                title: 'Designation / Name',
                                                dataIndex: 'worker_type',
                                                render: (val, _, idx) => (
                                                    <Input
                                                        placeholder="PM, Site Engineer..."
                                                        value={val}
                                                        onChange={e => {
                                                            const realIdx = manpower.findIndex(m => m === manpower.filter(x => x.is_staff)[idx]);
                                                            updateManpower(realIdx, 'worker_type', e.target.value);
                                                        }}
                                                    />
                                                )
                                            },
                                            {
                                                title: 'Count',
                                                dataIndex: 'count',
                                                width: '100px',
                                                render: (val, _, idx) => (
                                                    <InputNumber
                                                        min={0}
                                                        value={val}
                                                        onChange={v => {
                                                            const realIdx = manpower.findIndex(m => m === manpower.filter(x => x.is_staff)[idx]);
                                                            updateManpower(realIdx, 'count', v);
                                                        }}
                                                    />
                                                )
                                            },
                                            {
                                                title: '',
                                                width: '40px',
                                                render: (_, __, idx) => (
                                                    <Button
                                                        danger
                                                        type="link"
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => {
                                                            const realIdx = manpower.findIndex(m => m === manpower.filter(x => x.is_staff)[idx]);
                                                            removeManpower(realIdx);
                                                        }}
                                                    />
                                                )
                                            }
                                        ]}
                                        rowKey="tempId"
                                        size="small"
                                        bordered
                                        footer={() => <Button type="dashed" block onClick={() => addManpower(true)} icon={<PlusOutlined />}>Add Staff</Button>}
                                    />
                                </SectionCard>
                            </Col>
                            <Col span={12}>
                                <SectionCard title="Machinery Deployment" icon={<DashboardOutlined />}>
                                    <Table
                                        dataSource={machinery}
                                        columns={[
                                            {
                                                title: 'Machine Name',
                                                dataIndex: 'name',
                                                render: (val, _, idx) => (
                                                    <Input
                                                        placeholder="Crane, Excavator..."
                                                        value={val}
                                                        onChange={e => updateMachinery(idx, 'name', e.target.value)}
                                                    />
                                                )
                                            },
                                            {
                                                title: 'Quantity',
                                                dataIndex: 'count',
                                                width: '100px',
                                                render: (val, _, idx) => (
                                                    <InputNumber min={0} value={val} onChange={v => updateMachinery(idx, 'count', v)} />
                                                )
                                            },
                                            {
                                                title: 'Hrs',
                                                dataIndex: 'hours',
                                                width: '100px',
                                                render: (val, _, idx) => (
                                                    <InputNumber min={0} value={val} onChange={v => updateMachinery(idx, 'hours', v)} />
                                                )
                                            },
                                            {
                                                title: '',
                                                width: '40px',
                                                render: (_, __, idx) => (
                                                    <Button danger type="link" icon={<DeleteOutlined />} onClick={() => removeMachinery(idx)} />
                                                )
                                            }
                                        ]}
                                        rowKey="tempId"
                                        size="small"
                                        bordered
                                        footer={() => <Button type="dashed" block onClick={addMachinery} icon={<PlusOutlined />}>Add Machine</Button>}
                                    />
                                </SectionCard>
                            </Col>
                        </Row>

                        <SectionCard
                            title="Manpower Deployment (Labor Hajri)"
                            icon={<TeamOutlined />}
                        >
                            <Table
                                dataSource={manpower.filter(m => !m.is_staff)}
                                columns={[
                                    {
                                        title: 'Worker Category',
                                        dataIndex: 'worker_type',
                                        width: '40%',
                                        render: (val, _, idx) => (
                                            <Select
                                                mode="tags"
                                                placeholder="Pick category..."
                                                size="middle"
                                                value={val ? [val] : []}
                                                onChange={v => {
                                                    const realIdx = manpower.findIndex(m => m === manpower.filter(x => !x.is_staff)[idx]);
                                                    updateManpower(realIdx, 'worker_type', v[v.length - 1]);
                                                }}
                                                style={{ width: '100%' }}
                                                popupRender={menu => (
                                                    <>
                                                        {menu}
                                                        <Divider style={{ margin: '8px 0' }} />
                                                        <Space style={{ padding: '0 8px 4px' }}>
                                                            <Input
                                                                placeholder="New Category"
                                                                value={newWorkerCategory}
                                                                onChange={e => setNewWorkerCategory(e.target.value)}
                                                                onKeyDown={e => e.stopPropagation()}
                                                            />
                                                            <Button type="text" icon={<PlusOutlined />} onClick={addWorkerCategory}>
                                                                Add
                                                            </Button>
                                                        </Space>
                                                    </>
                                                )}
                                            >
                                                {workerCategories.map(c => (
                                                    <Option key={c.id} value={c.name}>{c.name}</Option>
                                                ))}
                                            </Select>
                                        )
                                    },
                                    {
                                        title: 'Count (Strength)',
                                        dataIndex: 'count',
                                        render: (val, _, idx) => (
                                            <InputNumber
                                                min={0}
                                                style={{ width: '100%' }}
                                                value={val}
                                                onChange={v => {
                                                    const realIdx = manpower.findIndex(m => m === manpower.filter(x => !x.is_staff)[idx]);
                                                    updateManpower(realIdx, 'count', v);
                                                }}
                                            />
                                        )
                                    },
                                    {
                                        title: 'Shift/Hajri',
                                        dataIndex: 'hajri',
                                        render: (val, _, idx) => (
                                            <InputNumber
                                                min={0}
                                                step={0.5}
                                                style={{ width: '100%' }}
                                                value={val}
                                                onChange={v => {
                                                    const realIdx = manpower.findIndex(m => m === manpower.filter(x => !x.is_staff)[idx]);
                                                    updateManpower(realIdx, 'hajri', v);
                                                }}
                                            />
                                        )
                                    },
                                    {
                                        title: '',
                                        width: '5%',
                                        render: (_, __, idx) => (
                                            <Button
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => {
                                                    const realIdx = manpower.findIndex(m => m === manpower.filter(x => !x.is_staff)[idx]);
                                                    removeManpower(realIdx);
                                                }}
                                                type="link"
                                            />
                                        )
                                    }
                                ]}
                                pagination={false}
                                rowKey="tempId"
                                size="small"
                                bordered
                                footer={() => <Button type="dashed" block onClick={() => addManpower(false)} icon={<PlusOutlined />}>Add Labor Category</Button>}
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
            </div>
        </div>
    )
}

export default UnifiedDailyReport
