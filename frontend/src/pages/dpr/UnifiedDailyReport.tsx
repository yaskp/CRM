import { useState, useEffect } from 'react'
import { Form, Input, Button, Select, DatePicker, InputNumber, Table, Space, Row, Col, Typography, Upload, Card, Tag, Statistic, message as antdMessage, Modal, TimePicker, Divider, Tabs, Switch } from 'antd'
import {
    SaveOutlined,
    PlusOutlined,
    ProjectOutlined,
    CameraOutlined,
    TeamOutlined,
    DashboardOutlined,
    BlockOutlined,
    InfoCircleOutlined,
    AuditOutlined,
    DeleteOutlined,
    ClockCircleOutlined,
    PrinterOutlined,
    ExpandOutlined,
    CompressOutlined,
    CheckCircleOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import DprPrintTemplate from './DprPrintTemplate'
import { storeTransactionService } from '../../services/api/storeTransactions'
import { materialService } from '../../services/api/materials'
import { warehouseService } from '../../services/api/warehouses'
import { projectService } from '../../services/api/projects'
import { projectHierarchyService } from '../../services/api/projectHierarchy'
import { inventoryService } from '../../services/api/inventory'
import { equipmentService } from '../../services/api/equipment'
import { quotationService } from '../../services/api/quotations'
import { projectContactService } from '../../services/api/projectContacts'
import api from '../../services/api/auth'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard } from '../../components/common/PremiumComponents'
import {
    getPrimaryButtonStyle,
    getSecondaryButtonStyle,
    getLabelStyle,
    flexBetweenStyle,
    actionCardStyle,
} from '../../styles/styleUtils'
import { theme } from '../../styles/theme'
import type { UploadFile } from 'antd/es/upload/interface'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography
const { useWatch } = Form;

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
    log_progress?: boolean
    remarks?: string
    quotation_item_id?: number
}

interface ManpowerItem {
    tempId?: string
    worker_type?: string  // For workers
    user_id?: number      // For staff
    staff_name?: string   // For staff
    staff_role?: string   // For staff
    count: number
    hajri: number
    is_staff?: boolean
}

interface MachineryItem {
    tempId?: string
    equipment_id?: number
    equipment_name?: string
    equipment_type?: string
    registration_number?: string
    breakdown_start?: string
    breakdown_end?: string
    breakdown_hours?: number
    breakdown_reason?: string
    breakdown_description?: string
    action_taken?: string
    status?: string // pending, repaired, replaced
    count?: number
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

interface PanelWorkLog {
    tempId?: string
    drawing_panel_id?: number
    panel_identifier?: string
    grabbing_depth?: number
    grabbing_sqm?: number
    grabbing_start_time?: string
    grabbing_end_time?: string
    concrete_start_time?: string
    concrete_end_time?: string
    concrete_grade?: string
    theoretical_concrete_qty?: number
    actual_concrete_qty?: number
    cage_id_ref?: string
}

interface PileWorkLog {
    tempId?: string
    drawing_panel_id?: number
    pile_identifier?: string
    achieved_depth?: number
    rock_socket_length?: number
    start_time?: string
    end_time?: string
    concrete_poured?: number
    steel_installed?: number
    rig_id?: number
    slump_test?: number
    cube_test_id?: string
    concrete_grade?: string
}

const calcBreakdownHours = (start?: string, end?: string) => {
    if (!start || !end) return 0
    try {
        const [h1, m1] = start.split(':').map(Number)
        const [h2, m2] = end.split(':').map(Number)
        if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0
        const d1 = new Date(2000, 1, 1, h1, m1)
        let d2 = new Date(2000, 1, 1, h2, m2)
        if (d2 < d1) d2 = new Date(2000, 1, 2, h2, m2) // cross midnight
        const diff = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60)
        return isFinite(diff) ? Number(diff.toFixed(1)) : 0
    } catch (e) {
        return 0
    }
}

const calculatePanelProgress = (panel: any, excludeTxId?: number) => {
    let dims: any = { length: 0, width: 0, depth: 0, height: 0 }
    if (panel.coordinates_json) {
        try { dims = typeof panel.coordinates_json === 'string' ? JSON.parse(panel.coordinates_json) : panel.coordinates_json } catch (e) { }
    }

    const length = Number(panel.length || dims.length || 0)
    const depth = Number(panel.design_depth || panel.depth || dims.depth || dims.height || 0)
    let areaSqm = Number(panel.grabbing_qty) || (length * depth)
    if (!isFinite(areaSqm)) areaSqm = 0

    let totalDone = 0
    const txIdsCounted = new Set<number>()

    // 1. Check normalized Panel Work Logs (D-Wall Grabbing SQM)
    if (panel.structuralLogs && Array.isArray(panel.structuralLogs)) {
        panel.structuralLogs.forEach((l: any) => {
            if (l.transaction?.status !== 'rejected' && (!excludeTxId || Number(l.transaction_id) !== Number(excludeTxId))) {
                const val = Number(l.grabbing_sqm || 0)
                if (isFinite(val)) totalDone += val
                if (l.transaction_id) txIdsCounted.add(l.transaction_id)
            }
        })
    }

    // 2. Check normalized Pile Work Logs (Pile Depth)
    if (panel.pileLogs && Array.isArray(panel.pileLogs)) {
        panel.pileLogs.forEach((l: any) => {
            if (l.transaction?.status !== 'rejected' && (!excludeTxId || Number(l.transaction_id) !== Number(excludeTxId))) {
                const val = Number(l.achieved_depth || 0)
                if (isFinite(val)) totalDone += val
                if (l.transaction_id) txIdsCounted.add(l.transaction_id)
            }
        })
    }

    // 3. Check legacy/generic progress in items (StoreTransactionItems)
    if (panel.consumptions && Array.isArray(panel.consumptions)) {
        panel.consumptions.forEach((c: any) => {
            if (!txIdsCounted.has(c.id) && c.items && Array.isArray(c.items) && c.items.length > 0 && (!excludeTxId || Number(c.id) !== Number(excludeTxId))) {
                const workDone = c.items
                    .filter((i: any) => i.drawing_panel_id === panel.id)
                    .map((i: any) => Number(i.work_done_quantity || 0))
                    .filter(isFinite)
                const maxInTx = workDone.length > 0 ? Math.max(0, ...workDone) : 0
                totalDone += maxInTx
            }
        })
    }

    const percentDone = areaSqm > 0 ? (totalDone / areaSqm) * 100 : 0
    return {
        areaSqm: Number(areaSqm.toFixed(2)),
        totalDone: Number(Math.max(0, totalDone).toFixed(2)),
        percentDone: Number(Math.max(0, Math.min(100, percentDone)).toFixed(1)),
        remaining: Number(Math.max(0, areaSqm - totalDone).toFixed(2)),
        length,
        depth
    }
}

const UnifiedDailyReport = () => {
    const { id } = useParams()
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [isDraft, setIsDraft] = useState(false)
    const [detailedMode, setDetailedMode] = useState(false)
    const [showMaterialSection, setShowMaterialSection] = useState(false)
    const [materials, setMaterials] = useState<any[]>([])

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
    const [quotations, setQuotations] = useState<any[]>([])
    const [quotationItems, setQuotationItems] = useState<any[]>([])
    const [projectContacts, setProjectContacts] = useState<any[]>([])
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
    const [workerCategories, setWorkerCategories] = useState<any[]>([])
    const [items, setItems] = useState<MaterialItem[]>([])
    const [manpower, setManpower] = useState<ManpowerItem[]>([])
    const [machinery, setMachinery] = useState<MachineryItem[]>([])
    const [stockMap, setStockMap] = useState<Record<number, number>>({})
    const [photoList, setPhotoList] = useState<UploadFile[]>([])
    const [rmcLogs, setRmcLogs] = useState<RmcItem[]>([])
    const [panelWorkLogs, setPanelWorkLogs] = useState<PanelWorkLog[]>([])
    const [pileWorkLogs, setPileWorkLogs] = useState<PileWorkLog[]>([])
    const [equipmentList, setEquipmentList] = useState<any[]>([])

    const navigate = useNavigate()

    useEffect(() => {
        const init = async () => {
            const metadata = await fetchMetadata()
            if (id) {
                fetchReportDetails(Number(id), metadata)
            }
        }
        init()
    }, [id])

    // Reactive filtering for warehouses
    const currentProjectId = useWatch('project_id', form)
    useEffect(() => {
        if (warehouses.length > 0 && currentProjectId) {
            const projectSites = warehouses.filter((w: any) => w.project_id === currentProjectId || w.warehouse_type === 'central')
            setProjectWarehouses(projectSites)
        }
    }, [warehouses, currentProjectId])

    const fetchReportDetails = async (reportId: number, metadata?: any) => {
        setLoading(true)
        try {
            const res = await storeTransactionService.getTransaction(reportId)
            const log = res.transaction
            if (log) {
                // Initialize form with basic data
                if (log.primary_work_item_type_id) {
                    // Parent work type tracking removed
                }
                form.setFieldsValue({
                    project_id: log.project_id,
                    warehouse_id: log.warehouse_id,
                    transaction_date: dayjs(log.transaction_date),
                    weather_condition: log.weather_condition,
                    work_hours: log.work_hours,
                    temperature: log.temperature,
                    remarks: log.remarks,
                    building_id: log.to_building_id,
                    floor_id: log.to_floor_id,
                    zone_id: log.to_zone_id,
                    drawing_id: log.drawing_panel?.drawing_id,
                    drawing_panel_id: log.drawing_panel_id ? [log.drawing_panel_id] : [],
                    quotation_id: log.quotation_id,
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

                // Load dependent data using metadata or current state
                const currentWarehouses = metadata?.warehouses || warehouses
                const currentWorkerCats = metadata?.workerCategories || workerCategories
                const currentEquipList = metadata?.equipmentList || equipmentList

                if (currentWorkerCats.length > 0) setWorkerCategories(currentWorkerCats)
                if (currentEquipList.length > 0) setEquipmentList(currentEquipList)

                if (log.project_id) {
                    const sites = currentWarehouses.filter((w: any) => w.project_id === log.project_id || w.warehouse_type === 'central')
                    setProjectWarehouses(sites)

                    const [buildingsRes, drawingsRes, contactsRes] = await Promise.all([
                        projectHierarchyService.getBuildings(log.project_id),
                        api.get(`/drawings?project_id=${log.project_id}&limit=100`),
                        projectContactService.getProjectContacts(log.project_id)
                    ])
                    setBuildings(buildingsRes.buildings || [])
                    setDrawings(drawingsRes.data?.drawings || [])
                    setProjectContacts(contactsRes.contacts || [])

                    // Fetch quotations for the project
                    try {
                        const quotRes = await quotationService.getQuotations({ project_id: log.project_id })
                        setQuotations(quotRes.quotations || [])
                        if (log.quotation_id) {
                            const res = await quotationService.getQuotation(log.quotation_id)
                            setQuotationItems(res.quotation?.items || [])
                        }
                    } catch (e) {
                        console.error('Failed to fetch quotations', e)
                    }

                    // Auto-detect structure type
                    const projectBuildings = buildingsRes.buildings || []
                    const projectDrawings = drawingsRes.data?.drawings || []
                    if (projectBuildings.length > 0 && projectDrawings.length > 0) {
                        setStructureType('both')
                    } else if (projectBuildings.length > 0) {
                        setStructureType('building')
                    } else if (projectDrawings.length > 0) {
                        setStructureType('panel')
                    } else {
                        setStructureType(null)
                    }
                }

                if (log.to_building_id) {
                    const res = await projectHierarchyService.getFloors(log.to_building_id)
                    setFloors(res.floors || [])
                }
                if (log.to_floor_id) {
                    const res = await projectHierarchyService.getZones(log.to_floor_id)
                    setZones(res.zones || [])
                }

                // Collect all unique panel IDs from the log
                const uniquePanelIds = new Set<number>()
                if (log.drawing_panel_id) uniquePanelIds.add(log.drawing_panel_id)
                log.panelWorkLogs?.forEach((p: any) => p.drawing_panel_id && uniquePanelIds.add(p.drawing_panel_id))
                log.pileWorkLogs?.forEach((p: any) => p.drawing_panel_id && uniquePanelIds.add(p.drawing_panel_id))
                log.items?.forEach((it: any) => it.drawing_panel_id && uniquePanelIds.add(it.drawing_panel_id))
                log.rmcLogs?.forEach((r: any) => r.drawing_panel_id && uniquePanelIds.add(r.drawing_panel_id))

                // Fetch all panels related to these IDs, regardless of their original drawing
                if (uniquePanelIds.size > 0) {
                    const panelDetailsPromises = Array.from(uniquePanelIds).map(panelId =>
                        api.get(`/drawings/panels/${panelId}`)
                    );
                    const panelDetailsResponses = await Promise.all(panelDetailsPromises);
                    const allPanelsFromLogs = panelDetailsResponses.map(res => res.data.panel).filter(Boolean);
                    setPanels(allPanelsFromLogs); // Set all panels found in logs
                    setSelectedPanels(allPanelsFromLogs);
                    form.setFieldsValue({ drawing_panel_id: Array.from(uniquePanelIds) });
                } else if (log.drawing_panel?.drawing_id) {
                    // Fallback to fetching panels for the primary drawing if no specific panels in logs
                    const panelRes = await api.get(`/drawings/${log.drawing_panel.drawing_id}/panels`)
                    const allPanels = panelRes.data.panels || []
                    setPanels(allPanels)
                    setSelectedPanels([])
                    form.setFieldsValue({ drawing_panel_id: [] })
                }


                // Initialize items from the report
                if (log.items && log.items.length > 0) {
                    setItems(log.items.map((it: any) => ({
                        tempId: `item-${it.id}`,
                        material_id: it.material_id,
                        quotation_item_id: it.quotation_item_id,
                        quantity: Number(it.quantity),
                        issued_quantity: Number(it.issued_quantity || 0),
                        returned_quantity: Number(it.returned_quantity || 0),
                        wastage: Number(it.wastage_quantity || 0),
                        work_done_quantity: Number(it.work_done_quantity || 0),
                        drawing_panel_id: it.drawing_panel_id,
                        work_item_type_id: it.work_item_type_id,
                        remarks: it.remarks,
                        log_progress: it.log_progress !== false,
                        unit: it.unit || it.material?.uom
                    })))
                    setShowMaterialSection(true)
                } else {
                    setItems([])
                    setShowMaterialSection(false)
                }

                // Load from normalized associations preferrably, fall back to legacy JSON strings if needed
                setManpower(
                    (log.manpowerLogs && log.manpowerLogs.length > 0)
                        ? log.manpowerLogs.map((m: any) => ({ ...m, tempId: `loaded-man-${Math.random()}` }))
                        : (() => {
                            if (!log.manpower_data) return []
                            if (typeof log.manpower_data === 'string') {
                                try {
                                    return log.manpower_data.trim() ? JSON.parse(log.manpower_data).map((m: any) => ({ ...m, tempId: `loaded-man-${Math.random()}` })) : []
                                } catch (e) { return [] }
                            }
                            if (Array.isArray(log.manpower_data)) {
                                return log.manpower_data.map((m: any) => ({ ...m, tempId: `loaded-man-${Math.random()}` }))
                            }
                            return []
                        })()
                )

                if (log.machineryBreakdownLogs && log.machineryBreakdownLogs.length > 0) {
                    setMachinery(log.machineryBreakdownLogs.map((m: any) => ({ ...m, tempId: `loaded-mach-${Math.random()}` })))
                } else if (log.machinery_data) {
                    if (typeof log.machinery_data === 'string' && log.machinery_data.trim()) {
                        try {
                            setMachinery(JSON.parse(log.machinery_data).map((m: any) => ({ ...m, tempId: `loaded-mach-${Math.random()}` })))
                        } catch (e) {
                            setMachinery([])
                        }
                    } else if (Array.isArray(log.machinery_data)) {
                        setMachinery(log.machinery_data.map((m: any) => ({ ...m, tempId: `loaded-mach-${Math.random()}` })))
                    } else {
                        setMachinery([])
                    }
                } else {
                    setMachinery([])
                }

                setRmcLogs(log.rmcLogs?.map((it: any) => ({ ...it, tempId: `loaded-rmc-${Math.random()}` })) || [])

                // Load Panel and Pile Logs
                if (log.panelWorkLogs && log.panelWorkLogs.length > 0) {
                    setPanelWorkLogs(log.panelWorkLogs.map((p: any) => ({
                        ...p,
                        tempId: `loaded-p-${p.id}`,
                        grabbing_start_time: p.grabbing_start_time || undefined,
                        grabbing_end_time: p.grabbing_end_time || undefined,
                        concrete_start_time: p.concrete_start_time || undefined,
                        concrete_end_time: p.concrete_end_time || undefined
                    })))
                } else {
                    setPanelWorkLogs([])
                }

                if (log.pileWorkLogs && log.pileWorkLogs.length > 0) {
                    setPileWorkLogs(log.pileWorkLogs.map((p: any) => ({
                        ...p,
                        tempId: `loaded-pile-${p.id}`,
                        start_time: p.start_time || undefined,
                        end_time: p.end_time || undefined
                    })))
                } else {
                    setPileWorkLogs([])
                }

                setIsDraft(log.status === 'draft')

                if (log.progress_photos) {
                    if (typeof log.progress_photos === 'string' && log.progress_photos.trim()) {
                        try {
                            const photos = JSON.parse(log.progress_photos)
                            if (Array.isArray(photos)) {
                                setPhotoList(photos.map((url: string, i: number) => ({
                                    uid: `-${i}`,
                                    name: `photo-${i}`,
                                    status: 'done',
                                    url: url.startsWith('http') ? url : `http://localhost:5000/${url}`
                                })))
                            }
                        } catch (e) {
                            console.error('Failed to parse progress photos', e)
                        }
                    } else if (Array.isArray(log.progress_photos)) {
                        setPhotoList(log.progress_photos.map((url: string, i: number) => ({
                            uid: `-${i}`,
                            name: `photo-${i}`,
                            status: 'done',
                            url: url.startsWith('http') ? url : `http://localhost:5000/${url}`
                        })))
                    }
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
            const [matRes, whRes, projRes, workerRes, equipRes] = await Promise.all([
                materialService.getMaterials({ limit: 999 }),
                warehouseService.getWarehouses({ limit: 999 }),
                projectService.getProjects({ limit: 999 }),
                storeTransactionService.getWorkerCategories(), // Assuming this is the correct service for worker categories
                equipmentService.getEquipment({ limit: 1000 })
            ])
            const mats = matRes.materials || []
            const whs = whRes.warehouses || []
            const projs = projRes.projects || []
            const workerCats = workerRes.categories || [] // Renamed to avoid conflict with 'workers' state
            const equips = equipRes.equipment || []

            setMaterials(mats)
            setWarehouses(whs)
            setProjects(projs)
            setWorkerCategories(workerCats)
            setEquipmentList(equips)

            // Fetch metadata and return for immediate use in fetchReportDetails
            return { materials: mats, warehouses: whs, projects: projs, workerCategories: workerCats, equipmentList: equips }
        } catch (error) {
            console.error('Failed to fetch metadata:', error)
            antdMessage.error('Failed to load metadata')
            return {}
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



    const handleProjectChange = async (projectId: number) => {
        try {
            // Filter warehouses for this project
            const projectSites = warehouses.filter(w => w.project_id === projectId || w.warehouse_type === 'central')
            setProjectWarehouses(projectSites)

            // Fetch buildings, drawings, and contacts in parallel
            const [buildingsRes, drawingsRes, contactsRes] = await Promise.all([
                projectHierarchyService.getBuildings(projectId),
                api.get(`/drawings?project_id=${projectId}&limit=100`),
                projectContactService.getProjectContacts(projectId)
            ])

            const buildings = buildingsRes.buildings || []
            const drawings = drawingsRes.data?.drawings || []
            setProjectContacts(contactsRes.contacts || [])

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


            // Fetch quotations for the project
            try {
                const quotRes = await quotationService.getQuotations({ project_id: projectId })
                setQuotations(quotRes.quotations || [])
            } catch (e) {
                console.error('Failed to fetch quotations', e)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleQuotationChange = async (quotationId: number | undefined) => {
        if (quotationId) {
            try {
                const res = await quotationService.getQuotation(quotationId)
                setQuotationItems(res.quotation?.items || [])
            } catch (e) {
                console.error('Failed to fetch quotation details', e)
                setQuotationItems([])
            }
        } else {
            setQuotationItems([])
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
            const drawing = drawings.find(d => d.id === form.getFieldValue('drawing_id'))
            const isPileDrawing = drawing?.drawing_type === 'Pile Layout'

            if (isPileDrawing) {
                const newPileLogs = selected.map(panel => {
                    const existing = pileWorkLogs.find(l => l.drawing_panel_id === panel.id)
                    return existing || {
                        tempId: `pile-${panel.id}-${Date.now()}`,
                        drawing_panel_id: panel.id,
                        pile_identifier: panel.panel_identifier,
                        achieved_depth: 0,
                        concrete_grade: panel.concrete_grade || 'M30',
                        concrete_poured: 0
                    }
                })
                setPileWorkLogs(newPileLogs)
                setPanelWorkLogs([])
            } else {
                const newPanelLogs = selected.map(panel => {
                    const existing = panelWorkLogs.find(l => l.drawing_panel_id === panel.id)
                    if (existing) return existing

                    return {
                        tempId: `panel-${panel.id}-${Date.now()}`,
                        drawing_panel_id: panel.id,
                        panel_identifier: panel.panel_identifier,
                        grabbing_depth: 0,
                        grabbing_sqm: 0,
                        grabbing_start_time: undefined,
                        grabbing_end_time: undefined,
                        concrete_start_time: undefined,
                        concrete_end_time: undefined,
                        concrete_grade: undefined,
                        theoretical_concrete_qty: Number(panel.concrete_design_qty) || Number(panel.theoretical_concrete_volume) || undefined,
                        cage_id_ref: undefined
                    }
                })
                setPanelWorkLogs(newPanelLogs)
                setPileWorkLogs([])
            }

            // Also update form values based on the first selected panel if it's new
            const currentPrimary = selected[0]
            if (currentPrimary) {
                form.setFieldsValue({
                    theoretical_concrete_qty: Number(currentPrimary.concrete_design_qty) || Number(currentPrimary.theoretical_concrete_volume) || undefined
                })
            }
        } else {
            setPanelWorkLogs([])
            setPileWorkLogs([])
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

    const addItem = () => {
        const defaultPanelId = (selectedPanels.length > 0 ? selectedPanels[0]?.id : undefined) || (form.getFieldValue('drawing_panel_id')?.[0])
        setItems([...items, {
            tempId: `item-${Date.now()}`,
            material_id: undefined,
            quotation_item_id: undefined,
            issued_quantity: 0,
            quantity: 0,
            returned_quantity: 0,
            wastage: 0,
            work_done_quantity: 0,
            drawing_panel_id: defaultPanelId,
            work_item_type_id: undefined,
            log_progress: true,
            remarks: ''
        }])
    }

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const updateItem = (index: number, fieldOrFields: string | Record<string, any>, value?: any) => {
        setItems(prevItems => {
            const newItems = [...prevItems]
            const updates = typeof fieldOrFields === 'string' ? { [fieldOrFields]: value } : fieldOrFields
            const updatedItem = { ...newItems[index], ...updates }

            // Handle side effects (consumed calculation)
            if (detailedMode) {
                const consumed = (updatedItem.issued_quantity || 0) - (updatedItem.returned_quantity || 0) - (updatedItem.wastage || 0)
                updatedItem.quantity = Math.max(0, consumed)
            }

            // Sync names/units when IDs change
            if (updates.material_id) {
                const material = materials.find(m => m.id === updates.material_id)
                updatedItem.material_name = material?.name
                updatedItem.unit = material?.uom || material?.unit
            } else if (updates.quotation_item_id) {
                const qItem = quotationItems.find(qi => qi.id === updates.quotation_item_id)
                updatedItem.material_name = qItem?.description
                updatedItem.unit = qItem?.unit
            }

            newItems[index] = updatedItem
            return newItems
        })
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



    const addManpower = (isStaff = false) => {
        setManpower([...manpower, { tempId: `man-${Date.now()}-${Math.random()}`, worker_type: '', count: 0, hajri: 0, is_staff: isStaff }])
    }

    const removeManpower = (index: number) => {
        setManpower(manpower.filter((_, i) => i !== index))
    }

    const updateManpower = (index: number, fieldOrFields: string | Record<string, any>, value?: any) => {
        setManpower(prev => {
            const next = [...prev]
            const updates = typeof fieldOrFields === 'string' ? { [fieldOrFields]: value } : fieldOrFields
            next[index] = { ...next[index], ...updates }
            return next
        })
    }

    const addMachinery = () => {
        setMachinery([...machinery, { tempId: `mach-${Date.now()}`, count: 0, hours: 0 }])
    }

    const updateMachineryFields = (index: number, fields: any) => {
        setMachinery(prev => {
            const next = [...prev]
            next[index] = { ...next[index], ...fields }
            return next
        })
    }

    const removeMachinery = (index: number) => {
        setMachinery(machinery.filter((_, i) => i !== index))
    }

    const addRmcLog = () => {
        const defaultPanelId = (selectedPanels.length > 0 ? selectedPanels[0]?.id : undefined) || (form.getFieldValue('drawing_panel_id')?.[0])
        setRmcLogs([...rmcLogs, { tempId: `rmc-${Date.now()}`, vehicle_no: '', quantity: 0, drawing_panel_id: defaultPanelId }])
    }

    const removeRmcLog = (index: number) => {
        setRmcLogs(rmcLogs.filter((_, i) => i !== index))
    }

    const updateRmcLog = (index: number, fieldOrFields: string | Record<string, any>, value?: any) => {
        setRmcLogs(prev => {
            const next = [...prev]
            const updates = typeof fieldOrFields === 'string' ? { [fieldOrFields]: value } : fieldOrFields
            next[index] = { ...next[index], ...updates }
            return next
        })
    }

    // Panel Work Log Functions
    const addPanelWorkLog = () => {
        setPanelWorkLogs([...panelWorkLogs, {
            tempId: `panel-${Date.now()}`,
            drawing_panel_id: undefined,
            panel_identifier: '',
            grabbing_depth: 0,
            grabbing_sqm: 0
        }])
    }

    const removePanelWorkLog = (index: number) => {
        const removedLog = panelWorkLogs[index]
        const newLogs = panelWorkLogs.filter((_, i) => i !== index)
        setPanelWorkLogs(newLogs)

        // Also remove from selectedPanels and form multi-select
        if (removedLog.drawing_panel_id) {
            const newSelectedPanels = selectedPanels.filter(p => p.id !== removedLog.drawing_panel_id)
            setSelectedPanels(newSelectedPanels)

            // Update form field
            const newPanelIds = newSelectedPanels.map(p => p.id)
            form.setFieldsValue({ drawing_panel_id: newPanelIds })
        }
    }

    const updatePanelWorkLog = (index: number, fieldOrFields: string | Record<string, any>, value?: any) => {
        setPanelWorkLogs(prev => {
            const next = [...prev]
            const updates = typeof fieldOrFields === 'string' ? { [fieldOrFields]: value } : fieldOrFields
            const log = { ...next[index], ...updates }

            // Auto-calculate grabbing_sqm when panel or depth changes
            if (updates.drawing_panel_id || updates.grabbing_depth) {
                if (log.drawing_panel_id && log.grabbing_depth) {
                    const panel = panels.find(p => p.id === log.drawing_panel_id)
                    if (panel) {
                        let dims: any = { length: 0 }
                        try {
                            dims = typeof panel.coordinates_json === 'string'
                                ? JSON.parse(panel.coordinates_json)
                                : (panel.coordinates_json || {})
                        } catch (e) { }
                        const length = Number(panel.length || dims.length || 0)
                        const panelDepth = Number(panel.design_depth || panel.depth || (dims as any).depth || (dims as any).height || 0)

                        if (Number(log.grabbing_depth) === panelDepth && panel.grabbing_qty) {
                            log.grabbing_sqm = Number(panel.grabbing_qty)
                        } else {
                            log.grabbing_sqm = length * Number(log.grabbing_depth)
                        }
                    }
                }

                // Auto-set grabbing depth from panel depth when panel is selected
                if (updates.drawing_panel_id) {
                    const panel = panels.find(p => p.id === updates.drawing_panel_id)
                    if (panel) {
                        let dims: any = { depth: 0, height: 0, length: 0 }
                        try {
                            dims = typeof panel.coordinates_json === 'string'
                                ? JSON.parse(panel.coordinates_json)
                                : (panel.coordinates_json || {})
                        } catch (e) { }
                        const panelDepth = Number(panel.design_depth || panel.depth || dims.depth || dims.height || 0)
                        if (panelDepth > 0) {
                            log.grabbing_depth = panelDepth
                            // Recalculate SQM
                            const length = Number(panel.length || dims.length || 0)
                            log.grabbing_sqm = Number(panel.grabbing_qty) || (length * panelDepth)
                        }
                        log.panel_identifier = panel.panel_identifier
                        log.theoretical_concrete_qty = Number(panel.concrete_design_qty || 0)
                    }
                }
            }

            next[index] = log
            return next
        })
    }

    // Pile Work Log Functions
    const addPileWorkLog = () => {
        setPileWorkLogs([...pileWorkLogs, {
            tempId: `pile-${Date.now()}`,
            drawing_panel_id: undefined,
            pile_identifier: '',
            achieved_depth: 0,
            concrete_grade: 'M30'
        }])
    }

    const removePileWorkLog = (index: number) => {
        const removedLog = pileWorkLogs[index]
        const newLogs = pileWorkLogs.filter((_, i) => i !== index)
        setPileWorkLogs(newLogs)

        if (removedLog.drawing_panel_id) {
            const newSelectedPanels = selectedPanels.filter(p => p.id !== removedLog.drawing_panel_id)
            setSelectedPanels(newSelectedPanels)
            const newPanelIds = newSelectedPanels.map(p => p.id)
            form.setFieldsValue({ drawing_panel_id: newPanelIds })
        }
    }

    const updatePileWorkLog = (index: number, fieldOrFields: string | Record<string, any>, value?: any) => {
        setPileWorkLogs(prev => {
            const next = [...prev]
            const updates = typeof fieldOrFields === 'string' ? { [fieldOrFields]: value } : fieldOrFields
            const log = { ...next[index], ...updates }

            if (updates.drawing_panel_id) {
                const panel = panels.find(p => p.id === updates.drawing_panel_id)
                if (panel) {
                    log.pile_identifier = panel.panel_identifier
                    log.achieved_depth = Number(panel.design_depth || 0)
                    log.concrete_grade = panel.concrete_grade || 'M30'
                    log.concrete_poured = Number(panel.concrete_design_qty || 0)
                }
            }
            next[index] = log
            return next
        })
    }

    const calculateSummary = () => {
        // Achievement is now calculated from normalized execution logs
        const totalWorkDone = panelWorkLogs.reduce((sum, p) => {
            const v = Number(p.grabbing_sqm)
            return sum + (isFinite(v) ? v : 0)
        }, 0) + pileWorkLogs.reduce((sum, p) => {
            const v = Number(p.achieved_depth)
            return sum + (isFinite(v) ? v : 0)
        }, 0)

        // Count RMC Logs as part of material achievement
        const totalMaterialQty = rmcLogs.reduce((sum, log) => {
            const v = Number(log.quantity)
            return sum + (isFinite(v) ? v : 0)
        }, 0)

        const totalLabor = manpower.reduce((sum, mp) => {
            const v = Number(mp.hajri) || Number(mp.count)
            return sum + (isFinite(v) ? v : 0)
        }, 0)

        return {
            totalMaterialCost: totalMaterialQty, // Quantity as cost for now
            totalLabor,
            totalCost: totalMaterialQty + totalLabor,
            totalWorkDone: Number(totalWorkDone.toFixed(2)),
            efficiency: 100 // Default to 100
        }
    }

    const onFinish = async (values: any) => {
        // Validation: Ensure EACH selected panel has progress/work data logged
        if (selectedPanels.length > 0 && !isDraft) {
            const panelsMissingData = selectedPanels.filter(sp => {
                const inPanelLogs = panelWorkLogs.some(l => l.drawing_panel_id === sp.id && (Number(l.grabbing_sqm) > 0 || Number(l.actual_concrete_qty) > 0));
                const inPileLogs = pileWorkLogs.some(l => l.drawing_panel_id === sp.id && (Number(l.achieved_depth) > 0 || Number(l.concrete_poured) > 0));
                const inItems = items.some(it => it.drawing_panel_id === sp.id && Number(it.work_done_quantity) > 0);
                return !inPanelLogs && !inPileLogs && !inItems;
            });

            if (panelsMissingData.length > 0) {
                antdMessage.error(`Please enter work progress or achievements for: ${panelsMissingData.map(p => p.panel_identifier).join(', ')}`);
                return;
            }
        }

        // Validation 3: Material rows must have identification if present
        if (showMaterialSection && items.length > 0) {
            const invalidItems = items.filter(it => !it.material_id && !it.quotation_item_id);
            if (invalidItems.length > 0) {
                antdMessage.error('Some rows in "Progress & Materials Achievement" table are missing Material/Description selection.');
                return;
            }
        }

        // "Progress & Materials Achievement" is no longer mandatory as execute data is captured in panels/piles

        const payload = {
            transaction_type: 'CONSUMPTION',
            status: isDraft ? 'draft' : 'pending',
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
            rmc_logs: rmcLogs.map(l => ({
                ...l,
                in_time: l.in_time && dayjs(l.in_time, 'HH:mm').isValid() ? (l.in_time.includes('T') ? dayjs(l.in_time).format('HH:mm') : l.in_time) : l.in_time,
                start_time: l.start_time && dayjs(l.start_time, 'HH:mm').isValid() ? (l.start_time.includes('T') ? dayjs(l.start_time).format('HH:mm') : l.start_time) : l.start_time,
                out_time: l.out_time && dayjs(l.out_time, 'HH:mm').isValid() ? (l.out_time.includes('T') ? dayjs(l.out_time).format('HH:mm') : l.out_time) : l.out_time
            })),
            // Machinery Breakdowns (Normalized Array)
            machinery_breakdowns: machinery.map(m => ({
                equipment_id: m.equipment_id,
                equipment_name: m.equipment_name,
                equipment_type: m.equipment_type,
                registration_number: m.registration_number,
                breakdown_start: m.breakdown_start && dayjs(m.breakdown_start, 'HH:mm').isValid() ? (m.breakdown_start.includes('T') ? dayjs(m.breakdown_start).format('HH:mm') : m.breakdown_start) : m.breakdown_start,
                breakdown_end: m.breakdown_end && dayjs(m.breakdown_end, 'HH:mm').isValid() ? (m.breakdown_end.includes('T') ? dayjs(m.breakdown_end).format('HH:mm') : m.breakdown_end) : m.breakdown_end,
                breakdown_hours: m.breakdown_hours,
                breakdown_reason: m.breakdown_reason,
                breakdown_description: m.breakdown_description,
                action_taken: m.action_taken,
                status: m.status || 'pending'
            })),
            // D-Wall Panel Work Logs (Panel-wise)
            panel_work_logs: panelWorkLogs.map(l => ({
                ...l,
                grabbing_start_time: l.grabbing_start_time && dayjs(l.grabbing_start_time, 'HH:mm').isValid() ? (l.grabbing_start_time.includes('T') ? dayjs(l.grabbing_start_time).format('HH:mm') : l.grabbing_start_time) : l.grabbing_start_time,
                grabbing_end_time: l.grabbing_end_time && dayjs(l.grabbing_end_time, 'HH:mm').isValid() ? (l.grabbing_end_time.includes('T') ? dayjs(l.grabbing_end_time).format('HH:mm') : l.grabbing_end_time) : l.grabbing_end_time,
                concrete_start_time: l.concrete_start_time && dayjs(l.concrete_start_time, 'HH:mm').isValid() ? (l.concrete_start_time.includes('T') ? dayjs(l.concrete_start_time).format('HH:mm') : l.concrete_start_time) : l.concrete_start_time,
                concrete_end_time: l.concrete_end_time && dayjs(l.concrete_end_time, 'HH:mm').isValid() ? (l.concrete_end_time.includes('T') ? dayjs(l.concrete_end_time).format('HH:mm') : l.concrete_end_time) : l.concrete_end_time
            })),
            pile_work_logs: pileWorkLogs.map(l => ({
                ...l,
                start_time: l.start_time && dayjs(l.start_time, 'HH:mm').isValid() ? (l.start_time.includes('T') ? dayjs(l.start_time).format('HH:mm') : l.start_time) : l.start_time,
                end_time: l.end_time && dayjs(l.end_time, 'HH:mm').isValid() ? (l.end_time.includes('T') ? dayjs(l.end_time).format('HH:mm') : l.end_time) : l.end_time
            })),
            drawing_panel_id: (selectedPanels.length > 0 ? selectedPanels[0]?.id : undefined) || (values.drawing_panel_id?.[0]),
            quotation_id: values.quotation_id,
            items: showMaterialSection ? items.map(it => ({
                material_id: it.material_id,
                quotation_item_id: it.quotation_item_id,
                quantity: it.quantity,
                issued_quantity: it.issued_quantity,
                returned_quantity: it.returned_quantity,
                wastage_quantity: it.wastage,
                work_done_quantity: it.work_done_quantity,
                drawing_panel_id: it.drawing_panel_id,
                work_item_type_id: it.work_item_type_id,
                remarks: it.remarks,
                log_progress: it.log_progress ?? true
            })) : []
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
            navigate('/operations/dpr')
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
            title: 'Activity / Material',
            dataIndex: 'material_id', // Reusing material_id for selection
            width: '35%',
            render: (_: any, record: any, index: number) => {
                const combinedOptions = [
                    ...quotationItems.map(qi => ({
                        value: `quot-${qi.id}`,
                        label: `[Quotation] ${qi.description}`,
                        isQuotation: true,
                        item: qi
                    })),
                    ...materials.map(m => ({
                        value: `mat-${m.id}`,
                        label: `[Stock] ${m.name}`,
                        isQuotation: false,
                        item: m
                    }))
                ]

                // Derive the current value for display
                let currentVal = undefined
                if (record.quotation_item_id) currentVal = `quot-${record.quotation_item_id}`
                else if (record.material_id) currentVal = `mat-${record.material_id}`

                return (
                    <Select
                        placeholder="Select description or material"
                        style={{ width: '100%' }}
                        showSearch
                        optionFilterProp="label"
                        value={currentVal}
                        onChange={(_, option: any) => {
                            if (option.isQuotation) {
                                updateItem(index, {
                                    quotation_item_id: option.item.id,
                                    material_id: undefined,
                                    material_name: option.item.description,
                                    unit: option.item.unit,
                                    work_item_type_id: option.item.work_item_type_id
                                })
                            } else {
                                updateItem(index, {
                                    material_id: option.item.id,
                                    quotation_item_id: undefined,
                                    material_name: option.item.name,
                                    unit: option.item.uom || option.item.unit,
                                    work_item_type_id: undefined
                                })
                            }
                        }}
                        size="small"
                        options={combinedOptions}
                    />
                )
            }
        },
        ...((structureType === 'panel' || structureType === 'both') ? [{
            title: 'Panel',
            dataIndex: 'drawing_panel_id',
            width: '12%',
            render: (val: any, _: any, index: number) => (
                <Select
                    placeholder="Panel"
                    style={{ width: '100%' }}
                    value={val}
                    onChange={v => updateItem(index, 'drawing_panel_id', v)}
                    size="small"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                >
                    {(selectedPanels.length > 0 ? selectedPanels : panels).map((p: any) => (
                        <Option key={p.id} value={p.id}>{p.panel_identifier}</Option>
                    ))}
                </Select>
            )
        }] : []),
        {
            title: 'Consumed Qty',
            dataIndex: 'quantity',
            width: detailedMode ? '10%' : '15%',
            render: (val: any, record: any, index: number) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Space.Compact style={{ width: '100%' }}>
                        <InputNumber min={0} precision={3} step={0.001} style={{ width: '65%' }} value={val} onChange={v => updateItem(index, 'quantity', v)} size="small" />
                        <Input style={{ width: '35%' }} value={record.unit || ''} disabled size="small" />
                    </Space.Compact>
                    {record.material_id && stockMap[record.material_id] !== undefined && (
                        <div style={{ fontSize: '10px', marginTop: '2px', color: (stockMap[record.material_id] || 0) < val ? '#ef4444' : '#64748b' }}>
                            Bal: {stockMap[record.material_id] || 0}
                        </div>
                    )}
                </div>
            )
        },
        {
            title: 'Log Progress?',
            dataIndex: 'log_progress',
            width: '10%',
            align: 'center' as const,
            render: (val: any, _: any, index: number) => (
                <Switch
                    size="small"
                    checked={val ?? true}
                    onChange={v => updateItem(index, 'log_progress', v)}
                />
            )
        },
        {
            title: 'Remarks / Notes',
            dataIndex: 'remarks',
            width: '20%',
            render: (val: any, _: any, index: number) => (
                <Input
                    placeholder="Entry remarks..."
                    value={val}
                    onChange={e => updateItem(index, 'remarks', e.target.value)}
                    size="small"
                />
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
                <InputNumber min={0} precision={3} step={0.001} value={val} onChange={v => updateRmcLog(index, 'quantity', v)} size="small" />
            )
        },
        {
            title: 'Slump',
            dataIndex: 'slump',
            render: (val: any, _: any, index: number) => (
                <InputNumber min={0} precision={1} step={0.5} value={val} onChange={v => updateRmcLog(index, 'slump', v)} size="small" />
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

    const panelWorkColumns = [
        {
            title: 'Panel',
            dataIndex: 'drawing_panel_id',
            width: '12%',
            render: (val: any, _: any, index: number) => (
                <Select
                    value={val}
                    onChange={v => updatePanelWorkLog(index, 'drawing_panel_id', v)}
                    size="small"
                    style={{ width: '100%' }}
                    placeholder="Select panel"
                >
                    {panels.map(p => <Option key={p.id} value={p.id}>{p.panel_identifier}</Option>)}
                </Select>
            )
        },
        {
            title: 'Grab Depth (m)',
            dataIndex: 'grabbing_depth',
            width: '10%',
            render: (val: any, _: any, index: number) => (
                <InputNumber
                    min={0}
                    precision={3}
                    step={0.001}
                    value={val}
                    onChange={v => updatePanelWorkLog(index, 'grabbing_depth', v)}
                    size="small"
                    style={{ width: '100%', backgroundColor: '#f5f5f5' }}
                    placeholder="Auto"
                    disabled
                />
            )
        },
        {
            title: 'Grab SQM',
            dataIndex: 'grabbing_sqm',
            width: '10%',
            render: (val: any, _: any, index: number) => (
                <InputNumber
                    value={val}
                    onChange={v => updatePanelWorkLog(index, 'grabbing_sqm', v)}
                    precision={3}
                    size="small"
                    style={{ width: '100%', backgroundColor: '#f5f5f5' }}
                    disabled
                />
            )
        },
        {
            title: 'Grabbing Start Time',
            dataIndex: 'grabbing_start_time',
            width: '10%',
            render: (val: any, _: any, index: number) => (
                <TimePicker
                    format="HH:mm"
                    value={val ? dayjs(val, 'HH:mm') : null}
                    onChange={(_, timeStr) => updatePanelWorkLog(index, 'grabbing_start_time', Array.isArray(timeStr) ? timeStr[0] : timeStr)}
                    size="small"
                    style={{ width: '100%' }}
                />
            )
        },
        {
            title: 'Grabbing End Time',
            dataIndex: 'grabbing_end_time',
            width: '10%',
            render: (val: any, _: any, index: number) => (
                <TimePicker
                    format="HH:mm"
                    value={val ? dayjs(val, 'HH:mm') : null}
                    onChange={(_, timeStr) => updatePanelWorkLog(index, 'grabbing_end_time', Array.isArray(timeStr) ? timeStr[0] : timeStr)}
                    size="small"
                    style={{ width: '100%' }}
                />
            )
        },
        {
            title: 'Concrete Start Time',
            dataIndex: 'concrete_start_time',
            width: '10%',
            render: (val: any, _: any, index: number) => (
                <TimePicker
                    format="HH:mm"
                    value={val ? dayjs(val, 'HH:mm') : null}
                    onChange={(_, timeStr) => updatePanelWorkLog(index, 'concrete_start_time', Array.isArray(timeStr) ? timeStr[0] : timeStr)}
                    size="small"
                    style={{ width: '100%' }}
                />
            )
        },
        {
            title: 'Concrete End Time',
            dataIndex: 'concrete_end_time',
            width: '10%',
            render: (val: any, _: any, index: number) => (
                <TimePicker
                    format="HH:mm"
                    value={val ? dayjs(val, 'HH:mm') : null}
                    onChange={(_, timeStr) => updatePanelWorkLog(index, 'concrete_end_time', Array.isArray(timeStr) ? timeStr[0] : timeStr)}
                    size="small"
                    style={{ width: '100%' }}
                />
            )
        },
        {
            title: 'Grade',
            dataIndex: 'concrete_grade',
            width: '8%',
            render: (val: any, _: any, index: number) => (
                <Select
                    value={val}
                    onChange={v => updatePanelWorkLog(index, 'concrete_grade', v)}
                    size="small"
                    style={{ width: '100%' }}
                    placeholder="M25"
                    showSearch
                    optionFilterProp="label"
                    options={[
                        { value: 'M20', label: 'M20' },
                        { value: 'M25', label: 'M25' },
                        { value: 'M30', label: 'M30' },
                        { value: 'M35', label: 'M35' },
                        { value: 'M40', label: 'M40' },
                        { value: 'M45', label: 'M45' },
                        { value: 'M50', label: 'M50' },
                    ]}
                />
            )
        },
        {
            title: 'Concrete Qty (Theoretical)',
            dataIndex: 'theoretical_concrete_qty',
            width: '8%',
            render: (val: any, _: any, index: number) => (
                <InputNumber
                    min={0}
                    precision={3}
                    value={val}
                    onChange={v => updatePanelWorkLog(index, 'theoretical_concrete_qty', v)}
                    size="small"
                    style={{ width: '100%', background: '#f5f5f5' }}
                    placeholder="Auto-design"
                    disabled
                />
            )
        },
        {
            title: 'Actual Concrete Qty (Site)',
            dataIndex: 'actual_concrete_qty',
            width: '9%',
            render: (val: any, _: any, index: number) => (
                <InputNumber
                    min={0}
                    precision={3}
                    step={0.001}
                    value={val}
                    onChange={v => updatePanelWorkLog(index, 'actual_concrete_qty', v)}
                    size="small"
                    style={{ width: '100%', background: '#f6ffed', borderColor: '#52c41a' }}
                    placeholder="Enter actual"
                />
            )
        },
        {
            title: 'Cage ID',
            dataIndex: 'cage_id_ref',
            width: '10%',
            render: (val: any, _: any, index: number) => (
                <Input
                    value={val}
                    onChange={e => updatePanelWorkLog(index, 'cage_id_ref', e.target.value)}
                    size="small"
                    placeholder="CAGE-001"
                />
            )
        },
        {
            title: '',
            width: '5%',
            render: (_: any, __: any, index: number) => (
                <Button danger icon={<DeleteOutlined />} onClick={() => removePanelWorkLog(index)} type="link" size="small" />
            )
        }
    ]

    const pileWorkColumns = [
        {
            title: 'Pile No',
            dataIndex: 'drawing_panel_id',
            width: '12%',
            render: (val: any, _: any, index: number) => (
                <Select
                    value={val}
                    onChange={v => updatePileWorkLog(index, 'drawing_panel_id', v)}
                    size="small"
                    style={{ width: '100%' }}
                    placeholder="Select pile"
                >
                    {panels.map(p => <Option key={p.id} value={p.id}>{p.panel_identifier}</Option>)}
                </Select>
            )
        },
        {
            title: 'Achieved Depth (m)',
            dataIndex: 'achieved_depth',
            width: '12%',
            render: (val: any, _: any, index: number) => (
                <InputNumber
                    min={0}
                    precision={3}
                    step={0.001}
                    value={val}
                    onChange={v => updatePileWorkLog(index, 'achieved_depth', v)}
                    size="small"
                    style={{ width: '100%', backgroundColor: '#f5f5f5' }}
                    placeholder="28.000"
                    disabled
                />
            )
        },
        {
            title: 'Rock Socket (m)',
            dataIndex: 'rock_socket_length',
            width: '10%',
            render: (val: any, _: any, index: number) => (
                <InputNumber
                    min={0}
                    precision={3}
                    step={0.001}
                    value={val}
                    onChange={v => updatePileWorkLog(index, 'rock_socket_length', v)}
                    size="small"
                    style={{ width: '100%' }}
                    placeholder="1.500"
                />
            )
        },
        {
            title: 'Start Time',
            dataIndex: 'start_time',
            width: '10%',
            render: (val: any, _: any, index: number) => (
                <TimePicker
                    format="HH:mm"
                    value={val ? dayjs(val, 'HH:mm') : null}
                    onChange={(_, timeStr) => updatePileWorkLog(index, 'start_time', Array.isArray(timeStr) ? timeStr[0] : timeStr)}
                    size="small"
                    style={{ width: '100%' }}
                />
            )
        },
        {
            title: 'End Time',
            dataIndex: 'end_time',
            width: '10%',
            render: (val: any, _: any, index: number) => (
                <TimePicker
                    format="HH:mm"
                    value={val ? dayjs(val, 'HH:mm') : null}
                    onChange={(_, timeStr) => updatePileWorkLog(index, 'end_time', Array.isArray(timeStr) ? timeStr[0] : timeStr)}
                    size="small"
                    style={{ width: '100%' }}
                />
            )
        },
        {
            title: 'Concrete Qty (Theoretical)',
            dataIndex: 'concrete_poured',
            width: '10%',
            render: (val: any, _: any, index: number) => (
                <InputNumber
                    min={0}
                    precision={3}
                    value={val}
                    onChange={v => updatePileWorkLog(index, 'concrete_poured', v)}
                    size="small"
                    style={{ width: '100%', background: '#f5f5f5' }}
                    placeholder="Auto"
                    disabled
                />
            )
        },
        {
            title: 'Actual Concrete Qty (Site)',
            dataIndex: 'actual_concrete_qty',
            width: '10%',
            render: (val: any, _: any, index: number) => (
                <InputNumber
                    min={0}
                    precision={3}
                    step={0.001}
                    value={val}
                    onChange={v => updatePileWorkLog(index, 'actual_concrete_qty', v)}
                    size="small"
                    style={{ width: '100%', background: '#f6ffed', borderColor: '#52c41a' }}
                    placeholder="Enter actual"
                />
            )
        },
        {
            title: 'Steel (kg)',
            dataIndex: 'steel_installed',
            width: '10%',
            render: (val: any, _: any, index: number) => (
                <InputNumber
                    min={0}
                    precision={3}
                    step={0.001}
                    value={val}
                    onChange={v => updatePileWorkLog(index, 'steel_installed', v)}
                    size="small"
                    style={{ width: '100%' }}
                    placeholder="1200.000"
                />
            )
        },
        {
            title: 'Grade',
            dataIndex: 'concrete_grade',
            width: '8%',
            render: (val: any, _: any, index: number) => (
                <Select
                    value={val}
                    onChange={v => updatePileWorkLog(index, 'concrete_grade', v)}
                    size="small"
                    style={{ width: '100%' }}
                    placeholder="M30"
                    showSearch
                    optionFilterProp="label"
                    options={[
                        { value: 'M20', label: 'M20' },
                        { value: 'M25', label: 'M25' },
                        { value: 'M30', label: 'M30' },
                        { value: 'M35', label: 'M35' },
                        { value: 'M40', label: 'M40' },
                        { value: 'M45', label: 'M45' },
                        { value: 'M50', label: 'M50' },
                    ]}
                />
            )
        },
        {
            title: '',
            width: '5%',
            render: (_: any, __: any, index: number) => (
                <Button danger icon={<DeleteOutlined />} onClick={() => removePileWorkLog(index)} type="link" size="small" />
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
                                        <Select
                                            placeholder="Select project"
                                            onChange={handleProjectChange}
                                            size="large"
                                            showSearch
                                            optionFilterProp="label"
                                        >
                                            {projects.map(p => (
                                                <Option key={p.id} value={p.id} label={`${p.project_code} - ${p.name}`}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: 600 }}>{p.project_code}</span>
                                                        <span style={{ fontSize: '12px', color: '#64748b', marginLeft: 8 }}>{p.name}</span>
                                                    </div>
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label={<span style={getLabelStyle()}>Quotation Selection (Optional)</span>} name="quotation_id">
                                        <Select
                                            placeholder="Select quotation"
                                            onChange={handleQuotationChange}
                                            size="large"
                                            showSearch
                                            allowClear
                                            optionFilterProp="children"
                                        >
                                            {quotations.map(q => (
                                                <Option key={q.id} value={q.id}>
                                                    {q.quotation_number} - {q.description?.substring(0, 30)}...
                                                </Option>
                                            ))}
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
                                            showSearch
                                            optionFilterProp="children"
                                        >
                                            {projectWarehouses.map(w => <Option key={w.id} value={w.id}>{w.name} {w.warehouse_type === 'central' ? '(Central)' : '(Site)'}</Option>)}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label={<span style={getLabelStyle()}>Reporting Date</span>} name="transaction_date" rules={[{ required: true }]}>
                                        <DatePicker style={{ width: '100%' }} size="large" format="DD-MMM-YYYY" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label={<span style={getLabelStyle()}>Log Materials & Achievement?</span>}>
                                        <div style={{ display: 'flex', alignItems: 'center', height: '40px' }}>
                                            <Switch
                                                checked={showMaterialSection}
                                                onChange={setShowMaterialSection}
                                                checkedChildren="YES"
                                                unCheckedChildren="NO"
                                            />
                                            <span style={{ marginLeft: 12, color: showMaterialSection ? theme.colors.primary.main : '#64748b', fontWeight: showMaterialSection ? 600 : 400 }}>
                                                {showMaterialSection ? 'Materials Section Enabled' : 'Materials Section Hidden'}
                                            </span>
                                        </div>
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
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} sm={12} md={8}>
                                            <Form.Item label={<span style={getLabelStyle()}>Building</span>} name="building_id">
                                                <Select placeholder="Bldg" allowClear onChange={handleBuildingChange} size="large" showSearch optionFilterProp="children">
                                                    {buildings.map(b => <Option key={b.id} value={b.id}>{b.name}</Option>)}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12} md={8}>
                                            <Form.Item label={<span style={getLabelStyle()}>Floor</span>} name="floor_id">
                                                <Select placeholder="Floor" allowClear onChange={handleFloorChange} size="large" showSearch optionFilterProp="children">
                                                    {floors.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12} md={8}>
                                            <Form.Item label={<span style={getLabelStyle()}>Zone</span>} name="zone_id">
                                                <Select placeholder="Zone" allowClear size="large" showSearch optionFilterProp="children">
                                                    {zones.map(z => <Option key={z.id} value={z.id}>{z.name}</Option>)}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                )}

                                {(structureType === 'panel' || structureType === 'both') && (
                                    <>
                                        <Row gutter={[16, 16]} style={{ marginTop: structureType === 'both' ? '16px' : '0' }}>
                                            <Col xs={24} md={selectedPanels.length > 0 ? 6 : 12}>
                                                <Form.Item label={<span style={getLabelStyle()}>Drawing</span>} name="drawing_id">
                                                    <Select
                                                        placeholder="Select drawing"
                                                        allowClear
                                                        size="large"
                                                        showSearch
                                                        optionFilterProp="children"
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
                                            <Col xs={24} md={selectedPanels.length > 0 ? 18 : 12}>
                                                <Form.Item label={<span style={getLabelStyle()}>Panel(s)</span>} name="drawing_panel_id">
                                                    <Select
                                                        mode="multiple"
                                                        placeholder="Select panel(s)"
                                                        allowClear
                                                        size="large"
                                                        onChange={handlePanelChange}
                                                        style={{ width: '100%' }}
                                                        options={panels.map(p => {
                                                            const { areaSqm, percentDone, remaining } = calculatePanelProgress(p, id ? Number(id) : undefined)
                                                            const isCompleted = percentDone >= 100
                                                            const isAlreadySelected = (form.getFieldValue('drawing_panel_id') || []).includes(p.id)

                                                            let label = p.panel_identifier
                                                            if (isCompleted) label += ' (COMPLETED)'
                                                            else if (percentDone > 0) label += ` (${percentDone.toFixed(0)}% Done, ${remaining.toFixed(1)}m² left)`
                                                            else label += ` (${areaSqm.toFixed(1)}m²)`

                                                            return {
                                                                label: label,
                                                                value: p.id,
                                                                disabled: isCompleted && !isAlreadySelected
                                                            }
                                                        })}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        {selectedPanels.length > 0 && (
                                            <Row gutter={16} style={{ marginTop: 12 }}>
                                                <Col span={24}>
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
                                                                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Panel Identifiers</Text>
                                                                    <Text strong>{selectedPanels.map(p => p.panel_identifier).join(', ')}</Text>
                                                                </div>
                                                                {selectedPanels.length > 1 && (
                                                                    <>
                                                                        <Divider type="vertical" style={{ height: '32px' }} />
                                                                        <div>
                                                                            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Total Length</Text>
                                                                            <Text strong style={{ color: '#0369a1' }}>
                                                                                {selectedPanels.reduce((sum, p) => {
                                                                                    let d: any = {};
                                                                                    try { d = typeof p.coordinates_json === 'string' ? JSON.parse(p.coordinates_json) : (p.coordinates_json || {}) } catch (e) { }
                                                                                    return sum + Number(p.length || d.length || 0)
                                                                                }, 0).toFixed(2)} m
                                                                            </Text>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </Space>
                                                    </div>

                                                    <Row gutter={[12, 12]}>
                                                        {selectedPanels.map(panel => {
                                                            const { areaSqm, totalDone, percentDone, length, depth } = calculatePanelProgress(panel)
                                                            const areaSqft = areaSqm * 10.764

                                                            // Width is needed for volume
                                                            let dims = { width: 0 }
                                                            try { dims = JSON.parse(panel.coordinates_json || '{}') } catch (e) { }
                                                            const width = Number(panel.width || dims.width || 0)
                                                            const volCum = Number(panel.concrete_design_qty) || (areaSqm * width)
                                                            const isPile = drawings.find(d => d.id === form.getFieldValue('drawing_id'))?.drawing_type === 'Pile Layout'

                                                            return (
                                                                <Col xs={24} sm={12} md={8} lg={6} key={panel.id}>
                                                                    <div style={{
                                                                        padding: '12px',
                                                                        background: isPile ? '#f0fdf4' : '#f8fafc',
                                                                        borderRadius: 8,
                                                                        border: `1px solid ${isPile ? '#bbf7d0' : '#e2e8f0'}`,
                                                                        height: '100%'
                                                                    }}>
                                                                        <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                                                <Typography.Text strong>{panel.panel_identifier}</Typography.Text>
                                                                                <Typography.Text type="secondary" style={{ fontSize: '11px' }}>
                                                                                    {isPile ? `Dia: ${length}mm` : `L: ${length}m | D: ${depth}m`}
                                                                                </Typography.Text>
                                                                            </div>

                                                                            {isPile ? (
                                                                                <>
                                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: 4 }}>
                                                                                        <Typography.Text type="secondary">Design Depth:</Typography.Text>
                                                                                        <Typography.Text strong>{depth} m</Typography.Text>
                                                                                    </div>
                                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: 2 }}>
                                                                                        <Typography.Text type="secondary">Concrete:</Typography.Text>
                                                                                        <Typography.Text strong style={{ color: '#16a34a' }}>{volCum.toFixed(2)} m³</Typography.Text>
                                                                                    </div>
                                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: 2 }}>
                                                                                        <Typography.Text type="secondary">Steel:</Typography.Text>
                                                                                        <Typography.Text strong>{panel.reinforcement_ton ? `${panel.reinforcement_ton} ton` : 'N/A'}</Typography.Text>
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: 4 }}>
                                                                                        <Typography.Text type="secondary">Area:</Typography.Text>
                                                                                        <Typography.Text strong style={{ color: theme.colors.primary.main }}>
                                                                                            {areaSqm.toFixed(2)} m² ({areaSqft.toFixed(2)} sqft)
                                                                                        </Typography.Text>
                                                                                    </div>
                                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: 2 }}>
                                                                                        <Typography.Text type="secondary">Comp:</Typography.Text>
                                                                                        <Typography.Text strong style={{ color: percentDone >= 100 ? '#10b981' : '#f59e0b' }}>
                                                                                            {totalDone.toFixed(2)} m² ({Math.min(percentDone, 100).toFixed(0)}%)
                                                                                        </Typography.Text>
                                                                                    </div>
                                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: 2 }}>
                                                                                        <Typography.Text type="secondary">Est Vol:</Typography.Text>
                                                                                        <Typography.Text strong>
                                                                                            {volCum.toFixed(2)} m³
                                                                                        </Typography.Text>
                                                                                    </div>
                                                                                </>
                                                                            )}

                                                                            {!isPile && (
                                                                                <div style={{ marginTop: 6, height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                                                                                    <div style={{
                                                                                        width: `${Math.min(percentDone, 100)}%`,
                                                                                        height: '100%',
                                                                                        background: percentDone >= 100 ? '#10b981' : theme.colors.primary.main,
                                                                                        transition: 'width 0.3s ease'
                                                                                    }} />
                                                                                </div>
                                                                            )}
                                                                        </Space>
                                                                    </div>
                                                                </Col>
                                                            )
                                                        })}
                                                    </Row>
                                                </Col>
                                            </Row>
                                        )}
                                    </>
                                )}
                            </SectionCard>
                        )}

                        {/* 1C. Structural Progress (Specialized Logs) */}
                        {(selectedPanels.length > 0 || panelWorkLogs.length > 0 || pileWorkLogs.length > 0) && (
                            <SectionCard
                                title="Structural Progress (Execution QC)"
                                icon={<AuditOutlined />}
                            >
                                <Tabs defaultActiveKey={selectedPanels.length > 0 && drawings.find(d => d.id === form.getFieldValue('drawing_id'))?.drawing_type === 'Pile Layout' ? 'piles' : 'dwall'}>
                                    <Tabs.TabPane
                                        tab={<span><BlockOutlined /> D-Wall Panels</span>}
                                        key="dwall"
                                    >
                                        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#eff6ff', borderRadius: 8, fontSize: '13px' }}>
                                            💡 <strong>D-Wall Execution Details.</strong> Auto-populated from selected panels.
                                        </div>
                                        <Table
                                            dataSource={panelWorkLogs}
                                            columns={panelWorkColumns}
                                            pagination={false}
                                            rowKey="tempId"
                                            size="small"
                                            bordered
                                            scroll={{ x: 1200 }}
                                            locale={{ emptyText: 'Select panels above to auto-populate panel work logs.' }}
                                        />
                                        <Button
                                            type="dashed"
                                            icon={<PlusOutlined />}
                                            onClick={addPanelWorkLog}
                                            style={{ marginTop: 12, width: '100%' }}
                                        >
                                            Add Extra Panel
                                        </Button>
                                    </Tabs.TabPane>
                                    <Tabs.TabPane
                                        tab={<span><ProjectOutlined /> Pile Work</span>}
                                        key="piles"
                                    >
                                        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, fontSize: '13px' }}>
                                            🏗️ <strong>Pile Physical Execution.</strong> Enter achieved depth, concrete volume, and steel for individual piles.
                                        </div>
                                        <Table
                                            dataSource={pileWorkLogs}
                                            columns={pileWorkColumns}
                                            pagination={false}
                                            rowKey="tempId"
                                            size="small"
                                            bordered
                                            scroll={{ x: 1200 }}
                                            locale={{ emptyText: 'Select piles above to auto-populate pile logs.' }}
                                        />
                                        <Button
                                            type="dashed"
                                            icon={<PlusOutlined />}
                                            onClick={addPileWorkLog}
                                            style={{ marginTop: 12, width: '100%' }}
                                        >
                                            Add Extra Pile
                                        </Button>
                                    </Tabs.TabPane>
                                </Tabs>
                            </SectionCard>
                        )}

                        {/* 1D. Progress & Materials Achievement */}
                        {showMaterialSection && (
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
                                    scroll={{ x: 'max-content' }}
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
                        )}

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
                                scroll={{ x: 'max-content' }}
                            />
                            <div style={{ marginTop: 16, padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
                                <div style={{ marginBottom: 8 }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Total RMC Delivered</Text>
                                </div>
                                <Statistic
                                    value={(() => {
                                        const total = rmcLogs.reduce((sum, log) => {
                                            const v = Number(log.quantity)
                                            return sum + (isFinite(v) ? v : 0)
                                        }, 0)
                                        return total.toFixed(2)
                                    })()}
                                    suffix="cum"
                                    valueStyle={{ fontSize: '20px', fontWeight: 600, color: theme.colors.primary.main }}
                                />
                            </div>
                        </SectionCard>



                        {/* 3. Resources Deployment (Staff Display / Manpower / Machinery) */}
                        <SectionCard title="Allocated Site Team (Assigned in Project)" icon={<TeamOutlined />}>
                            <div style={{ padding: '4px 0' }}>
                                {projectContacts.length > 0 ? (
                                    <Row gutter={[12, 12]}>
                                        {projectContacts.map((member, idx) => (
                                            <Col key={idx} xs={24} sm={12} md={8} lg={6}>
                                                <div style={{
                                                    padding: '12px',
                                                    background: '#f8fafc',
                                                    borderRadius: '10px',
                                                    border: '1px solid #e2e8f0',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '8px'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            background: ['client_contact', 'decision_maker', 'accounts'].includes(member.contact_type) ? '#fee2e2' :
                                                                member.contact_type === 'labour_contractor' ? '#f0fdf4' : '#e0f2fe',
                                                            color: ['client_contact', 'decision_maker', 'accounts'].includes(member.contact_type) ? '#991b1b' :
                                                                member.contact_type === 'labour_contractor' ? '#166534' : '#0369a1',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 'bold',
                                                            fontSize: '12px'
                                                        }}>
                                                            {member.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>{member.name}</div>
                                                            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 500 }}>
                                                                {member.contact_type === 'labour_contractor' ? (member.company_name || 'Labour Contractor') : (member.contact_type?.replace('_', ' ') || member.designation || 'Site Staff')}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {member.contact_type === 'labour_contractor' && (
                                                        <div style={{
                                                            marginTop: '4px',
                                                            padding: '8px',
                                                            background: '#fff',
                                                            borderRadius: '6px',
                                                            border: '1px dashed #cbd5e1',
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(3, 1fr)',
                                                            textAlign: 'center',
                                                            gap: '4px'
                                                        }}>
                                                            <div>
                                                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Labors</div>
                                                                <div style={{ fontWeight: 700, fontSize: '12px', color: theme.colors.primary.main }}>{member.labour_count || 0}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Helpers</div>
                                                                <div style={{ fontWeight: 700, fontSize: '12px', color: theme.colors.primary.main }}>{member.helper_count || 0}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Operators</div>
                                                                <div style={{ fontWeight: 700, fontSize: '12px', color: theme.colors.primary.main }}>{member.operator_count || 0}</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                        <TeamOutlined style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }} />
                                        No staff assigned to this project yet. Update the "Team" tab in Project Details.
                                    </div>
                                )}
                            </div>
                        </SectionCard>

                        <SectionCard title="Machinery Breakdown Log" icon={<DashboardOutlined />}>
                            {machinery.map((item, idx) => (
                                <div key={item.tempId} style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: 8, padding: 16, marginBottom: 16, position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: -10, left: 16, background: '#fff', padding: '0 8px', color: '#ef4444', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</span>
                                        Select Equipment
                                    </div>
                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeMachinery(idx)} style={{ position: 'absolute', top: 8, right: 8 }} />

                                    <Row gutter={[12, 12]} style={{ marginTop: 8 }}>
                                        <Col xs={24} sm={8}>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 4 }}>Equipment *</div>
                                            <Select
                                                placeholder="Select equipment"
                                                value={item.equipment_id}
                                                onChange={v => {
                                                    const selectedEquip = equipmentList.find(e => e.id === v);
                                                    if (selectedEquip) {
                                                        const updateFields = {
                                                            equipment_id: v,
                                                            equipment_name: selectedEquip.name,
                                                            equipment_type: selectedEquip.equipment_type,
                                                            registration_number: selectedEquip.registration_number
                                                        };
                                                        updateMachineryFields(idx, updateFields);
                                                    }
                                                }}
                                                showSearch
                                                optionFilterProp="children"
                                                style={{ width: '100%' }}
                                                size="middle"
                                                status={!item.equipment_id ? 'error' : ''}
                                            >
                                                {equipmentList.map(equip => (
                                                    <Option key={equip.id} value={equip.id}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span>{equip.name} <span style={{ color: '#94a3b8', fontSize: '11px' }}>({equip.registration_number})</span></span>
                                                        </div>
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 4 }}>Breakdown Reason</div>
                                            <Input
                                                placeholder="e.g. Mechanical Failure"
                                                value={item.breakdown_reason || ''}
                                                onChange={e => updateMachineryFields(idx, { breakdown_reason: e.target.value })}
                                                size="middle"
                                            />
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 4 }}>Resolution Status</div>
                                            <Select
                                                value={item.status || 'pending'}
                                                onChange={v => updateMachineryFields(idx, { status: v })}
                                                style={{ width: '100%' }}
                                                size="middle"
                                            >
                                                <Option value="pending"><span style={{ color: '#f59e0b' }}>⚠️ Pending Repair</span></Option>
                                                <Option value="repaired"><span style={{ color: '#22c55e' }}>✅ Repaired on Site</span></Option>
                                                <Option value="replaced"><span style={{ color: '#3b82f6' }}>🔄 Machine Replaced</span></Option>
                                            </Select>
                                        </Col>
                                    </Row>

                                    <Row gutter={[12, 12]} style={{ marginTop: 10 }}>
                                        <Col xs={24} sm={8}>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 4 }}>Breakdown Start Time</div>
                                            <TimePicker
                                                format="HH:mm"
                                                value={item.breakdown_start ? dayjs(item.breakdown_start, 'HH:mm') : undefined}
                                                onChange={(_, timeStr) => {
                                                    const t = Array.isArray(timeStr) ? timeStr[0] : timeStr;
                                                    const hrs = calcBreakdownHours(t, item.breakdown_end);
                                                    updateMachineryFields(idx, { breakdown_start: t, breakdown_hours: hrs, hours: hrs });
                                                }}
                                                style={{ width: '100%' }}
                                                size="middle"
                                                placeholder="Start time"
                                            />
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 4 }}>Breakdown End Time</div>
                                            <TimePicker
                                                format="HH:mm"
                                                value={item.breakdown_end ? dayjs(item.breakdown_end, 'HH:mm') : undefined}
                                                onChange={(_, timeStr) => {
                                                    const t = Array.isArray(timeStr) ? timeStr[0] : timeStr;
                                                    const hrs = calcBreakdownHours(item.breakdown_start, t);
                                                    updateMachineryFields(idx, { breakdown_end: t, breakdown_hours: hrs, hours: hrs });
                                                }}
                                                style={{ width: '100%' }}
                                                size="middle"
                                                placeholder="End time"
                                            />
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 4 }}>Breakdown Duration</div>
                                            {(() => {
                                                const liveHrs = calcBreakdownHours(item.breakdown_start, item.breakdown_end);
                                                const hasTime = !!(item.breakdown_start && item.breakdown_end);
                                                return (
                                                    <div style={{
                                                        height: 32, borderRadius: 6,
                                                        border: `1px solid ${liveHrs > 0 ? '#fecaca' : '#e2e8f0'}`,
                                                        background: liveHrs > 0 ? '#fef2f2' : '#f8fafc',
                                                        display: 'flex', alignItems: 'center', paddingLeft: 12, gap: 6,
                                                        fontWeight: 700,
                                                        color: liveHrs > 0 ? '#ef4444' : '#94a3b8',
                                                        fontSize: '15px'
                                                    }}>
                                                        {liveHrs > 0 ? `⏱ ${liveHrs} hrs` : hasTime ? '⚠️ Check times' : '—'}
                                                        {liveHrs > 0 && <span style={{ fontSize: '10px', fontWeight: 400, color: '#94a3b8' }}>auto</span>}
                                                    </div>
                                                )
                                            })()}
                                        </Col>
                                    </Row>

                                    <Row gutter={[12, 12]} style={{ marginTop: 10 }}>
                                        <Col xs={24} sm={12}>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 4 }}>Breakdown Description</div>
                                            <Input
                                                placeholder="Describe the issue in detail..."
                                                value={item.breakdown_description || ''}
                                                onChange={e => updateMachineryFields(idx, { breakdown_description: e.target.value })}
                                                size="middle"
                                            />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 4 }}>Action Taken</div>
                                            <Input
                                                placeholder="Action taken to resolve..."
                                                value={item.action_taken || ''}
                                                onChange={e => updateMachineryFields(idx, { action_taken: e.target.value })}
                                                size="middle"
                                            />
                                        </Col>
                                    </Row>
                                </div>
                            ))}

                            {machinery.length > 0 && (
                                <div style={{
                                    background: 'linear-gradient(90deg, #fef2f2, #fff5f5)',
                                    border: '1px solid #fecaca', borderRadius: 8,
                                    padding: '10px 16px', marginTop: 4,
                                    display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center'
                                }}>
                                    <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '13px' }}>📊 Breakdown Summary:</span>
                                    {Array.from(new Set(machinery.map(m => m.equipment_type).filter(Boolean))).map(type => {
                                        const typeStr = type as string;
                                        const total = machinery.filter(m => m.equipment_type === typeStr).reduce((s, m) => s + (Number(m.breakdown_hours) || 0), 0)
                                        return total > 0 ? (
                                            <Tag key={typeStr} color="red" style={{ fontSize: '12px' }}>
                                                {typeStr.replace(/_/g, ' ')}: {total.toFixed(1)} hrs
                                            </Tag>
                                        ) : null
                                    })}
                                    <div style={{ marginLeft: 'auto', fontWeight: 600, color: '#ef4444' }}>
                                        Total: {machinery.reduce((s, m) => s + (Number(m.breakdown_hours) || 0), 0).toFixed(1)} hrs
                                    </div>
                                </div>
                            )}

                            <Button
                                type="dashed"
                                danger
                                icon={<PlusOutlined />}
                                onClick={addMachinery}
                                block
                                style={{ height: '40px', marginTop: 16 }}
                            >
                                Record Machine Breakdown
                            </Button>
                        </SectionCard>


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
                                                precision={0}
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
                                                precision={2}
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
                                scroll={{ x: 'max-content' }}
                                footer={() => <Button type="dashed" block onClick={() => addManpower(false)} icon={<PlusOutlined />}>Add Labor Category</Button>}
                            />
                        </SectionCard>

                        {/* 4. Site Conditions & Photos */}
                        <SectionCard title="Site Conditions & Pictures" icon={<CameraOutlined />}>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Weather" name="weather_condition">
                                        <Select placeholder="Weather" size="large">
                                            <Option value="Clear">☀️ Clear</Option>
                                            <Option value="Rainy">🌧️ Rainy</Option>
                                            <Option value="Hot">🔥 Hot</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
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
                            <Row gutter={[16, 16]} align="middle">
                                <Col xs={24} sm={8}>
                                    <Statistic title={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Achievement</span>} value={summary.totalWorkDone} suffix={structureType === 'panel' ? 'sqm' : 'm'} valueStyle={{ color: 'white' }} />
                                </Col>
                                <Col xs={24} sm={8}>
                                    <Statistic title={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Efficiency</span>} value={summary.efficiency} suffix="%" valueStyle={{ color: summary.efficiency >= 90 ? '#52c41a' : '#faad14' }} />
                                </Col>
                                <Col xs={24} sm={8}>
                                    <Statistic title={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Daily Cost</span>} value={summary.totalCost} prefix="₹" valueStyle={{ color: 'white' }} />
                                </Col>
                            </Row>
                        </Card>

                        {/* Submit Container */}
                        <Card style={actionCardStyle}>
                            <div style={{ ...flexBetweenStyle, flexWrap: 'wrap', gap: 12 }}>
                                <Text type="secondary"><InfoCircleOutlined /> Auto-updates Inventory & BOQ Progress on submission.</Text>
                                <Space wrap>
                                    <Button onClick={() => navigate(-1)} size="large">Cancel</Button>
                                    <Button
                                        onClick={() => {
                                            setIsDraft(true);
                                            form.submit();
                                        }}
                                        loading={loading}
                                        icon={<SaveOutlined />}
                                        size="large"
                                        style={{ ...getSecondaryButtonStyle(), borderColor: theme.colors.primary.main, color: theme.colors.primary.main }}
                                    >
                                        Save as Draft
                                    </Button>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading}
                                        icon={<CheckCircleOutlined />}
                                        size="large"
                                        style={getPrimaryButtonStyle()}
                                        onClick={() => setIsDraft(false)}
                                    >
                                        Submit Site Report
                                    </Button>
                                </Space>
                            </div>
                        </Card>
                    </Form>
                </PageContainer>
            </div>
        </div >
    )
}

export default UnifiedDailyReport
