import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, DatePicker, InputNumber, Table, Space, Radio, Typography, Row, Col } from 'antd'
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  RollbackOutlined,
  ShopOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  BarcodeOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { storeTransactionService, SRNItem } from '../../services/api/storeTransactions'
import { materialService } from '../../services/api/materials'
import { warehouseService } from '../../services/api/warehouses'
import { projectService } from '../../services/api/projects'
import { vendorService } from '../../services/api/vendors'
import { purchaseOrderService } from '../../services/api/purchaseOrders'
import { inventoryService } from '../../services/api/inventory'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import {
  getPrimaryButtonStyle,
  getSecondaryButtonStyle,
  largeInputStyle,
  getLabelStyle,
  flexBetweenStyle,
  actionCardStyle,
} from '../../styles/styleUtils'
import { theme } from '../../styles/theme'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { srnSchema, SRNFormData } from '../../utils/validationSchemas'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

interface SRNFormItem extends SRNItem {
  id?: number
  material_name?: string
  remarks?: string
}

const SRNForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  // Master Data
  const [materials, setMaterials] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])

  const [items, setItems] = useState<SRNFormItem[]>([])
  const [stockMap, setStockMap] = useState<Record<number, number>>({})
  const [stockLoading, setStockLoading] = useState(false)

  // Form Setup
  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<SRNFormData>({
    resolver: zodResolver(srnSchema),
    defaultValues: {
      transaction_date: dayjs().format('YYYY-MM-DD'),
      source_type: 'project',
      destination_type: 'warehouse',
      items: [],
    },
  })

  // Watch fields
  const sourceType = watch('source_type') || 'project'
  const destType = watch('destination_type') || 'warehouse'
  const sourceId = watch('source_id')
  const destId = watch('destination_id')
  const vendorId = destType === 'vendor' ? destId : undefined

  useEffect(() => {
    fetchMetadata()
    if (id) {
      fetchSRN()
    }
  }, [id])

  // Filtered Data
  const [poMaterials, setPoMaterials] = useState<any[]>([])
  const [filteredVendors, setFilteredVendors] = useState<any[]>([])
  const selectedPOId = watch('purchase_order_id')

  // Filter Vendors based on selected Project (if Purchase Return)
  useEffect(() => {
    if (destType === 'vendor' && sourceType === 'project' && sourceId) {
      fetchProjectVendors(Number(sourceId))
    } else {
      setFilteredVendors([])
    }
  }, [destType, sourceType, sourceId])

  const fetchProjectVendors = async (pId: number) => {
    try {
      const response = await purchaseOrderService.getPurchaseOrders({
        project_id: pId,
        status: 'approved'
      })
      const pos = response.purchaseOrders || []
      // Extract unique vendors
      const vendorIds = new Set(pos.map((p: any) => p.vendor_id))
      const filtered = vendors.filter(v => vendorIds.has(v.id))
      setFilteredVendors(filtered)

      if (filtered.length === 0) {
        message.info('No approved purchase orders found for this project.')
      }
    } catch (e) {
      console.error('Failed to filter vendors', e)
    }
  }

  // PO Fetching when Vendor changes
  useEffect(() => {
    if (vendorId) {
      fetchVendorPOs(Number(vendorId))
    } else {
      setPurchaseOrders([])
    }
  }, [vendorId])

  const fetchVendorPOs = async (vId: number) => {
    try {
      const response = await purchaseOrderService.getPurchaseOrders({
        vendor_id: vId,
        project_id: sourceType === 'project' ? Number(sourceId) : undefined,
        status: 'approved'
      })
      setPurchaseOrders(response.purchaseOrders || [])
    } catch (error) {
      console.error('Failed to fetch POs', error)
    }
  }

  useEffect(() => {
    if (selectedPOId) {
      const po = purchaseOrders.find(p => p.id === Number(selectedPOId))
      if (po && po.items) {
        // Create a set of allowed material IDs
        const allowedIds = new Set(po.items.map((i: any) => i.material_id))

        // Filter the main materials list
        const filtered = materials.filter(m => allowedIds.has(m.id))
        setPoMaterials(filtered)

        // AUTO-POPULATE ITEMS (if table is empty)
        if (!id && items.length === 0) {
          const mappedItems = po.items.map((pi: any) => ({
            material_id: pi.material_id,
            material_name: pi.material?.name,
            quantity: Number(pi.quantity),
            remarks: ''
          }))
          setItems(mappedItems)
          setValue('items', mappedItems)
          message.success(`Imported ${mappedItems.length} items from PO`)
        } else if (items.length > 0) {
          // Filter existing items to ensure they belong to this PO
          const validItems = items.filter((item: any) => allowedIds.has(item.material_id))
          if (validItems.length !== items.length) {
            setItems(validItems)
            setValue('items', validItems)
            message.warning('Filtered items to match the selected Purchase Order')
          }
        }
      }
    } else {
      setPoMaterials(materials) // Reset to all materials
    }
  }, [selectedPOId, purchaseOrders, materials, id])

  // Initial Material Sync
  useEffect(() => {
    if (!selectedPOId && materials.length > 0) {
      setPoMaterials(materials)
    }
  }, [materials, selectedPOId])

  // Stock Fetching (Project or Warehouse)
  useEffect(() => {
    if (sourceId && (sourceType === 'warehouse' || sourceType === 'project')) {
      fetchSourceStock(sourceType, Number(sourceId))
    } else {
      setStockMap({})
    }
  }, [sourceType, sourceId])

  const fetchSourceStock = async (type: 'warehouse' | 'project', id: number) => {
    setStockLoading(true)
    try {
      const params = type === 'warehouse'
        ? { warehouse_id: id, limit: 1000 }
        : { project_id: id, limit: 1000 }

      const response = await inventoryService.getInventory(params)
      const map: Record<number, number> = {}
      response.inventory?.forEach((inv: any) => {
        map[inv.material_id] = Number(inv.quantity)
      })
      setStockMap(map)
    } catch (error) {
      console.error('Failed to fetch stock', error)
      message.warning('Could not verify stock levels')
      setStockMap({})
    } finally {
      setStockLoading(false)
    }
  }

  const fetchMetadata = async () => {
    try {
      const [matRes, whRes, projRes, vendRes] = await Promise.all([
        materialService.getMaterials(),
        warehouseService.getWarehouses(),
        projectService.getProjects({ limit: 100 }),
        vendorService.getVendors(),
      ])
      setMaterials(matRes.materials || [])
      setWarehouses(whRes.warehouses || [])
      setProjects(projRes.projects || [])
      setVendors(vendRes.vendors || [])
    } catch (error) {
      message.error('Failed to load metadata')
    }
  }

  const fetchSRN = async () => {
    setLoading(true)
    try {
      const response = await storeTransactionService.getTransaction(Number(id))
      const srn = response.transaction

      setValue('transaction_date', srn.transaction_date)
      setValue('remarks', srn.remarks)

      // Map backwards from DB fields to Form fields
      // If project_id exists -> Site Return
      // If vendor_id exists -> Vendor Return
      if (srn.from_project_id || srn.project_id) {
        setValue('source_type', 'project')
        setValue('source_id', srn.from_project_id || srn.project_id)
        setValue('destination_type', 'warehouse')
        setValue('destination_id', srn.warehouse_id || srn.to_warehouse_id)
      } else if (srn.vendor_id) {
        setValue('source_type', 'warehouse')
        setValue('source_id', srn.warehouse_id)
        setValue('destination_type', 'vendor')
        setValue('destination_id', srn.vendor_id)
        setValue('purchase_order_id', srn.purchase_order_id)
      }

      setItems(srn.items?.map((item: any) => ({
        material_id: item.material_id,
        material_name: item.material?.name,
        quantity: Number(item.quantity),
      })) || [])
      setValue('items', srn.items || [])

    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch SRN')
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    const newItem = { material_id: 0, quantity: 0 }
    setItems([...items, newItem])
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
    setValue('items', newItems)
  }

  const updateItem = (index: number, field: keyof SRNFormItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'material_id') {
      const material = materials.find(m => m.id === value)
      newItems[index].material_name = material?.name
    }
    setItems(newItems)
    setValue('items', newItems)
  }

  const onFinish = async (data: SRNFormData) => {
    if (items.length === 0) {
      message.error('Please add at least one item')
      return
    }

    const invalidItems = items.filter(item => !item.material_id || item.quantity <= 0)
    if (invalidItems.length > 0) {
      message.error('Please fill all required fields for all items')
      return
    }

    // Stock Check for both Project and Warehouse sources
    if (Object.keys(stockMap).length > 0) {
      const hasErrors = items.some(item => {
        const available = stockMap[item.material_id] || 0
        if (item.quantity > available) {
          const loc = sourceType === 'project' ? 'Site' : 'Warehouse'
          message.error(`Insufficient stock for ${item.material_name}. Available at ${loc}: ${available}`)
          return true
        }
        return false
      })
      if (hasErrors) return
    }

    setLoading(true)
    try {
      const payload = {
        ...data,
        items: items.map(item => ({
          material_id: item.material_id,
          quantity: item.quantity,
          batch_number: item.batch_number || undefined,
          remarks: item.remarks
        })),
      }

      await storeTransactionService.createSRN(payload)
      message.success('Stock Return Note created successfully!')
      navigate('/inventory/srn')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save SRN')
    } finally {
      setLoading(false)
    }
  }

  // --- UI CONSTANTS ---
  const isVendorReturn = destType === 'vendor'
  const isSiteReturn = sourceType === 'project'

  const itemColumns = [
    {
      title: 'Material / Product',
      key: 'material',
      width: '45%',
      render: (_: any, record: SRNFormItem, index: number) => {
        const available = stockMap[record.material_id]
        let stockDisplay = null

        if (record.material_id > 0) {
          if (stockLoading) {
            stockDisplay = <span style={{ color: theme.colors.primary.main }}>Checking stock...</span>
          } else {
            const qty = available || 0
            const isLow = qty < (record.quantity || 0)
            const label = sourceType === 'project' ? 'Available at Site' : 'Available at Warehouse'

            stockDisplay = (
              <span style={{ color: isLow ? 'red' : 'green' }}>
                {label}: {qty}
              </span>
            )
          }
        }

        return (
          <div>
            <Select
              style={{ width: '100%' }}
              placeholder="Select Material"
              value={record.material_id || undefined}
              onChange={(value) => updateItem(index, 'material_id', value)}
              showSearch
              optionFilterProp="children"
              size="large"
            >
              {poMaterials.map((material) => (
                <Option key={material.id} value={material.id}>
                  {material.name} ({material.material_code})
                </Option>
              ))}
            </Select>
            {stockDisplay && (
              <div style={{ marginTop: 4, fontSize: '12px' }}>{stockDisplay}</div>
            )}
          </div>
        )
      },
    },
    {
      title: 'Return Qty',
      key: 'quantity',
      width: '20%',
      render: (_: any, record: SRNFormItem, index: number) => {
        const available = stockMap[record.material_id] || 0
        return (
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Qty"
            value={record.quantity}
            min={0}
            max={available}
            step={0.01}
            status={record.quantity > available ? 'error' : ''}
            onChange={(value) => updateItem(index, 'quantity', value || 0)}
            size="large"
          />
        )
      },
    },
    {
      title: 'Remarks',
      key: 'remarks',
      width: '30%',
      render: (_: any, record: SRNFormItem, index: number) => (
        <Input
          placeholder="Reason (e.g. Damaged, Excess)"
          value={record.remarks}
          onChange={(e) => updateItem(index, 'remarks', e.target.value)}
        />
      )
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: any, record: SRNFormItem, index: number) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(index)}
          style={{ padding: 0 }}
        />
      ),
    },
  ]

  return (
    <PageContainer maxWidth={1100}>
      <PageHeader
        title={id ? 'Stock Return Details' : 'Create Stock Return (SRN)'}
        subtitle={id ? `Reference: #SRN-${id}` : 'Process Site Returns or Vendor Purchase Returns'}
        icon={<RollbackOutlined />}
      />

      <form onSubmit={handleSubmit(onFinish)}>
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <SectionCard title="Return Type" icon={<RollbackOutlined />}>
              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Return Mode</Text>
                <Radio.Group
                  value={destType === 'vendor' ? 'vendor' : 'site'}
                  onChange={(e) => {
                    const mode = e.target.value
                    if (mode === 'site') {
                      setValue('source_type', 'project')
                      setValue('destination_type', 'warehouse')
                    } else {
                      // Default to Warehouse -> Vendor
                      setValue('source_type', 'warehouse')
                      setValue('destination_type', 'vendor')
                    }
                    // Reset IDs
                    setValue('source_id', 0)
                    setValue('destination_id', 0)
                    setValue('purchase_order_id', null)
                  }}
                  buttonStyle="solid"
                  size="large"
                >
                  <Radio.Button value="site"><RollbackOutlined /> Site Return</Radio.Button>
                  <Radio.Button value="vendor"><ShopOutlined /> Purchase Return</Radio.Button>
                </Radio.Group>
              </div>

              {/* Vendor Return Source Selector */}
              {destType === 'vendor' && (
                <div style={{ marginBottom: 20, padding: 16, background: '#fff1f0', borderRadius: 8, border: '1px solid #ffa39e' }}>
                  <Text strong style={{ display: 'block', marginBottom: 8, color: '#cf1322' }}>Where are items located?</Text>
                  <Radio.Group
                    value={sourceType}
                    onChange={(e) => {
                      setValue('source_type', e.target.value)
                      setValue('source_id', 0)
                      setStockMap({})
                    }}
                  >
                    <Radio.Button value="warehouse">In Warehouse</Radio.Button>
                    <Radio.Button value="project">At Project Site</Radio.Button>
                  </Radio.Group>
                </div>
              )}

              {/* DYNAMIC SOURCE/DEST DISPLAY */}
              <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={10}>
                    <Text type="secondary" style={{ fontSize: 12 }}>FROM {sourceType?.toUpperCase()}</Text>
                    <Controller
                      name="source_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          placeholder={sourceType === 'project' ? "Select Project Site" : "Select Warehouse"}
                          showSearch
                          optionFilterProp="children"
                          style={{ width: '100%', marginTop: 4 }}
                          size="large"
                          value={field.value || undefined}
                        >
                          {sourceType === 'project'
                            ? projects.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)
                            : warehouses.map(w => <Option key={w.id} value={w.id}>{w.name}</Option>)
                          }
                        </Select>
                      )}
                    />
                  </Col>

                  <Col xs={24} sm={4} style={{ textAlign: 'center' }}>
                    <ArrowRightOutlined style={{ fontSize: 20, color: '#999' }} />
                  </Col>

                  <Col xs={24} sm={10}>
                    <Text type="secondary" style={{ fontSize: 12 }}>TO {destType?.toUpperCase()}</Text>
                    <Controller
                      name="destination_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          placeholder={destType === 'vendor' ? "Select Vendor" : "Select Warehouse"}
                          showSearch
                          optionFilterProp="children"
                          style={{ width: '100%', marginTop: 4 }}
                          size="large"
                          value={field.value || undefined}
                          onChange={(val) => {
                            field.onChange(val)
                            if (destType === 'vendor') {
                              // Automatically fetch POs via effect
                              setValue('purchase_order_id', null)
                            }
                          }}
                        >
                          {destType === 'vendor'
                            ? (filteredVendors.length > 0 ? filteredVendors : vendors).map(v => <Option key={v.id} value={v.id}>{v.name}</Option>)
                            : warehouses.map(w => <Option key={w.id} value={w.id}>{w.name}</Option>)
                          }
                        </Select>
                      )}
                    />
                  </Col>
                </Row>
              </div>

              {/* EXTRA FIELDS FOR VENDOR RETURN */}
              {isVendorReturn && (
                <div style={{ marginTop: 16 }}>
                  <Form.Item label={<span style={getLabelStyle()}>Link to Purchase Order (Optional)</span>}>
                    <Controller
                      name="purchase_order_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          placeholder="Select approved PO..."
                          style={largeInputStyle}
                          allowClear
                          value={field.value || undefined}
                        >
                          {purchaseOrders.map((po: any) => (
                            <Option key={po.id} value={po.id}>
                              {po.po_number || po.temp_number} - {dayjs(po.created_at).format('DD MMM')}
                            </Option>
                          ))}
                        </Select>
                      )}
                    />
                  </Form.Item>
                </div>
              )}
            </SectionCard>
          </Col>

          <Col xs={24} lg={12}>
            <SectionCard title="Logistics" icon={<FileTextOutlined />}>
              <Form.Item label={<span style={getLabelStyle()}>Return Date</span>} required>
                <Controller
                  name="transaction_date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      style={{ width: '100%', ...largeInputStyle }}
                      format="DD-MMM-YYYY"
                      size="large"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item label={<span style={getLabelStyle()}>Global Remarks</span>}>
                <Controller
                  name="remarks"
                  control={control}
                  render={({ field }) => (
                    <TextArea {...field} rows={4} placeholder="Reason for return, vehicle details, ref numbers..." style={largeInputStyle} />
                  )}
                />
              </Form.Item>

              <InfoCard title="💡 Transaction Impact">
                {isVendorReturn
                  ? `Stock will be DEDUCTED from ${sourceType === 'project' ? 'Project Site' : 'Warehouse'} and linked to Vendor history.`
                  : "Stock will be ADDED to Warehouse inventory upon return from site."}
              </InfoCard>
            </SectionCard>
          </Col>
        </Row>

        <div style={{ marginTop: theme.spacing.lg }}>
          <SectionCard
            title="Items to Return"
            icon={<BarcodeOutlined />}
            extra={
              !id && (
                <Button type="dashed" icon={<PlusOutlined />} onClick={addItem} style={{ borderRadius: '6px' }}>
                  Add Item Row
                </Button>
              )
            }
          >
            <Table
              columns={itemColumns}
              dataSource={items}
              rowKey={(_, index) => (index || 0).toString()}
              pagination={false}
              bordered
              scroll={{ x: 800 }}
              locale={{ emptyText: <div style={{ padding: '30px' }}><Text type="secondary">No items listed. Click "Add Item Row".</Text></div> }}
            />
          </SectionCard>
        </div>

        <Card style={actionCardStyle}>
          <div style={{ ...flexBetweenStyle, flexWrap: 'wrap', gap: theme.spacing.md }}>
            <Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: '8px' }} />
              {isVendorReturn ? "Check physical stock before returning." : "Verify items physically received at warehouse."}
            </Text>
            {!id && (
              <Space size="middle" wrap>
                <Button onClick={() => navigate('/inventory/srn')} size="large" style={getSecondaryButtonStyle()}>
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
                  Create Return Note
                </Button>
              </Space>
            )}
          </div>
        </Card>
      </form>
    </PageContainer>
  )
}

export default SRNForm
