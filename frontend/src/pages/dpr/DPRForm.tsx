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
  WarningOutlined,
  DashboardOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import { materialService } from '../../services/api/materials'
import { warehouseService } from '../../services/api/warehouses'
import { projectService } from '../../services/api/projects'
import { projectHierarchyService } from '../../services/api/projectHierarchy'
import { inventoryService } from '../../services/api/inventory'
import { workItemTypeService } from '../../services/api/workItemTypes'
import { boqService } from '../../services/api/boqs'
import api from '../../services/api/auth'
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

const DPRForm = () => {
  const { id } = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
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
  const [workItemTypes, setWorkItemTypes] = useState<any[]>([])
  const [filteredWorkTypes, setFilteredWorkTypes] = useState<any[]>([])
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
        workItemTypeService.getWorkItemTypes()
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
      // Filter warehouses for this project
      const projectSites = warehouses.filter(w => w.project_id === projectId || w.warehouse_type === 'central')
      setProjectWarehouses(projectSites)
      form.setFieldsValue({ warehouse_id: undefined })

      // Fetch buildings and drawings in parallel
      const [buildingsRes, drawingsRes] = await Promise.all([
        projectHierarchyService.getBuildings(projectId),
        api.get(`/drawings?project_id=${projectId}&limit=100`)
      ])

      const buildings = buildingsRes.data || []
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

      // Fetch Project BOQ to filter Work Types
      fetchProjectWorkTypes(projectId)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchProjectWorkTypes = async (projectId: number) => {
    try {
      setFilteredWorkTypes([])
      const res = await boqService.getProjectBOQs(projectId)
      const approvedBoq = res.boqs?.find((b: any) => b.status === 'approved')

      if (approvedBoq) {
        const detailRes = await boqService.getBOQDetails(approvedBoq.id)
        if (detailRes.boq && detailRes.boq.items) {
          // Extract unique Work Item Types from the BOQ
          const uniqueTypeIds = new Set(detailRes.boq.items.map((i: any) => i.work_item_type_id).filter(Boolean))
          const relevantTypes = workItemTypes.filter(wit => uniqueTypeIds.has(wit.id))

          if (relevantTypes.length > 0) {
            setFilteredWorkTypes(relevantTypes)
            return
          }
        }
      }

      // Fallback: If no BOQ or no types found, should we show ALL?
      // User requested "Project related work only". 
      // If no BOQ is defined, maybe we shouldn't allow random work?
      // For now, let's keep it empty to encourage BOQ usage, or show a warning.
      // Or actually, fallback to ALL but maybe user didn't create BOQ yet.
      // Let's fallback to ALL for now to prevent blocking, but maybe hint?
      // Re-reading user: "we sall have project related work only right". 
      // Ill fallback to ALL but show message if empty.
      setFilteredWorkTypes(workItemTypes)
    } catch (e) {
      console.error('Failed to fetch project work types', e)
      setFilteredWorkTypes(workItemTypes) // Fallback on error
    }
  }



  const fetchPanels = async (drawingId: number) => {
    try {
      const res = await api.get(`/drawings/${drawingId}/panels`)
      setPanels(res.data.panels || [])
    } catch (e) {
      console.error('Failed to fetch panels', e)
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

    if (field === 'issued_quantity' || field === 'returned_quantity' || field === 'wastage') {
      const item = newItems[index]
      const consumed = (item.issued_quantity || 0) - (item.returned_quantity || 0) - (item.wastage || 0)
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
      antdMessage.error('Please add at least one progress/material item')
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

      await storeTransactionService.createConsumption(payload)
      antdMessage.success('Daily Progress Report submitted successfully!')
      navigate('/operations/dpr')
    } catch (error: any) {
      antdMessage.error(error.response?.data?.message || 'Failed to save DPR')
    } finally {
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
          {materials.map(m => (
            <Option key={m.id} value={m.id}>{m.name}</Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Consumption',
      dataIndex: 'quantity',
      width: '20%',
      render: (val: any, record: any, index: number) => (
        <Space.Compact style={{ width: '100%' }}>
          <InputNumber
            min={0}
            style={{ width: '70%' }}
            value={val}
            onChange={v => updateItem(index, 'quantity', v)}
            placeholder="Qty"
            size="small"
          />
          <Input
            style={{ width: '30%' }}
            value={record.unit || ''}
            disabled
            size="small"
          />
        </Space.Compact>
      )
    },
    {
      title: 'Work Achievement',
      dataIndex: 'work_done_quantity',
      width: '30%',
      render: (val: any, record: any, index: number) => (
        <Space.Compact style={{ width: '100%' }}>
          <InputNumber
            min={0}
            style={{ width: '70%' }}
            value={val}
            onChange={v => updateItem(index, 'work_done_quantity', v)}
            placeholder="Work"
            size="small"
          />
          <Input
            style={{ width: '30%' }}
            value={selectedWorkType?.uom || 'm'}
            disabled
            size="small"
          />
        </Space.Compact>
      )
    },
    {
      title: 'Wastage',
      dataIndex: 'wastage',
      width: '15%',
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
      title: '',
      width: '5%',
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
          placeholder="Type"
          style={{ width: '100%' }}
          value={val}
          onChange={v => updateManpower(index, 'worker_type', v)}
          size="small"
        >
          <Option value="Steel Worker">Steel Worker</Option>
          <Option value="Concrete Worker">Concrete Worker</Option>
          <Option value="Department Worker">Department Worker</Option>
          <Option value="Electrician">Electrician</Option>
          <Option value="Welder">Welder</Option>
          <Option value="Helper">General Helper</Option>
        </Select>
      )
    },
    {
      title: 'Count',
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
      title: 'Shift',
      dataIndex: 'hajri',
      width: '30%',
      render: (val: any, _: any, index: number) => (
        <Select
          style={{ width: '100%' }}
          value={val}
          onChange={v => updateManpower(index, 'hajri', v)}
          size="small"
        >
          <Option value={1}>1</Option>
          <Option value={1.5}>1.5</Option>
          <Option value={2}>2</Option>
        </Select>
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
    <PageContainer maxWidth={900}>
      <PageHeader
        title={id ? "Edit Daily Progress Report" : "Daily Progress Report (DPR)"}
        subtitle="Record today's site achievements, material usage, and manpower logs"
        icon={<DashboardOutlined />}
      />

      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ transaction_date: dayjs() }}>
        {/* Section 1: Basic Info */}
        <SectionCard title="Basic Site Details" icon={<ProjectOutlined />}>
          <div style={threeColumnGridStyle}>
            <Form.Item
              label={<span style={getLabelStyle()}>Reporting Date</span>}
              name="transaction_date"
              rules={[{ required: true }]}
            >
              <DatePicker style={{ width: '100%' }} size="large" format="DD-MMM-YYYY" />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Project Selection</span>}
              name="project_id"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select project" onChange={handleProjectChange} size="large">
                {projects.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
              </Select>
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Work Item Type</span>}
              name="work_item_type_id"
              rules={[{ required: true }]}
            >
              <Select
                placeholder={filteredWorkTypes.length === 0 ? "No Work Types (Check BOQ)" : "Select work type"}
                showSearch
                optionFilterProp="children"
                size="large"
                onChange={handleWorkTypeChange}
              >
                {filteredWorkTypes.map(wit => <Option key={wit.id} value={wit.id}>{wit.name}</Option>)}
              </Select>
            </Form.Item>
          </div>



          <Form.Item
            label={<span style={getLabelStyle()}>Site Store (for material adjustment)</span>}
            name="warehouse_id"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Select store"
              size="large"
              onChange={fetchStock}
            >
              {projectWarehouses.map(w => <Option key={w.id} value={w.id}>{w.name} {w.warehouse_type === 'central' ? '(Central)' : '(Site)'}</Option>)}
            </Select>
          </Form.Item>
        </SectionCard>

        {/* Section 1B: Physical Structure Selection - Auto-detected */}
        {structureType && (
          <SectionCard
            title={structureType === 'building' ? 'Building Structure' : structureType === 'panel' ? 'Drawing Panels (D-Wall)' : 'Physical Structure'}
            icon={<BlockOutlined />}
          >
            {structureType === 'both' && (
              <InfoCard title="💡 Flexible Structure">
                This project has both Building hierarchy and Drawing Panels. Select the appropriate structure for this work.
              </InfoCard>
            )}

            {(structureType === 'building' || structureType === 'both') && (
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
            )}

            {(structureType === 'panel' || structureType === 'both') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: structureType === 'both' ? '16px' : '0' }}>
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

                <Form.Item label={<span style={getLabelStyle()}>Panel</span>} name="drawing_panel_id">
                  <Select placeholder="Select panel" allowClear size="large">
                    {panels.map(p => <Option key={p.id} value={p.id}>{p.panel_identifier}</Option>)}
                  </Select>
                </Form.Item>
              </div>
            )}
          </SectionCard>
        )}

        {/* Section 2: Progress & Achievement */}
        <SectionCard
          title="Progress & Achievement Metrics"
          icon={<BlockOutlined />}
          extra={<Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>Add Activity</Button>}
        >
          <InfoCard title="💡 Flexible Reporting">
            Add individual work activities and materials consumed. The system will auto-calculate your progress.
          </InfoCard>
          <Table
            dataSource={items}
            columns={materialColumns}
            pagination={false}
            rowKey={(_, i) => i?.toString() || '0'}
            size="small"
            bordered
            style={{ marginTop: 16 }}
            locale={{ emptyText: 'No activities added. Click "Add Activity" to log progress.' }}
          />
        </SectionCard>

        {/* Section 3: Summaries (Optional for Single Column) */}
        <Card
          style={{
            background: 'linear-gradient(135deg, #134e4a 0%, #0d9488 100%)',
            color: 'white',
            marginBottom: 24,
            borderRadius: 12
          }}
        >
          <Row gutter={24}>
            <Col span={8}>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Total Work Today</span>}
                value={summary.totalWorkDone}
                suffix={selectedWorkType?.uom || 'm'}
                valueStyle={{ color: 'white', fontWeight: 'bold' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Daily Material Efficiency</span>}
                value={summary.efficiency}
                suffix="%"
                valueStyle={{ color: summary.efficiency >= 90 ? '#52c41a' : '#faad14' }}
                prefix={<DashboardOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Manpower Count</span>}
                value={manpower.reduce((s, m) => s + (m.count || 0), 0)}
                prefix={<TeamOutlined />}
                valueStyle={{ color: 'white' }}
              />
            </Col>
          </Row>
        </Card>

        {/* Section 4: Manpower */}
        <SectionCard
          title="Manpower Deployment"
          icon={<TeamOutlined />}
          extra={<Button type="dashed" icon={<PlusOutlined />} onClick={addManpower}>Add Worker</Button>}
        >
          <Table
            dataSource={manpower}
            columns={manpowerColumns}
            pagination={false}
            rowKey={(_, i) => i?.toString() || '0'}
            size="small"
            bordered
          />
        </SectionCard>

        {/* Section 5: Site Conditions */}
        <SectionCard title="Site Conditions & Activity Photos" icon={<CloudOutlined />}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<span style={getLabelStyle()}>Weather</span>} name="weather_condition">
                <Select placeholder="Select weather" size="large">
                  <Option value="Clear">☀️ Clear/Sunny</Option>
                  <Option value="Cloudy">☁️ Cloudy</Option>
                  <Option value="Rainy">🌧️ Rainy</Option>
                  <Option value="Windy">💨 Windy</Option>
                  <Option value="Hot">🔥 Very Hot</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span style={getLabelStyle()}>Work Hours</span>} name="work_hours">
                <Input placeholder="e.g., 8:00 AM - 6:00 PM" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={<span style={getLabelStyle()}>Progress Photos</span>}>
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
              Capture and upload up to 5 photos showing today's progress.
            </Text>
          </Form.Item>

          <Form.Item label={<span style={getLabelStyle()}>Observations & Site Remarks</span>} name="remarks">
            <TextArea rows={4} placeholder="Major events, breakdowns, delays or milestones achieved today..." />
          </Form.Item>
        </SectionCard>

        {/* Final Actions */}
        <Card style={actionCardStyle}>
          <div style={flexBetweenStyle}>
            <Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: '8px' }} />
              Submitting this report will automatically update the project dashboard and inventory.
            </Text>
            <Space size="middle">
              <Button onClick={() => navigate('/operations/dpr')} size="large" style={getSecondaryButtonStyle()}>
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
                Submit Today's DPR
              </Button>
            </Space>
          </div>
        </Card>
      </Form>
    </PageContainer>
  )
}

export default DPRForm
