import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, App, Select, DatePicker, InputNumber, Table, Space, Row, Col, Typography, Divider } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import { warehouseService } from '../../services/api/warehouses'
import { projectService } from '../../services/api/projects'
import { vendorService } from '../../services/api/vendors'
import { purchaseOrderService } from '../../services/api/purchaseOrders'
import { inventoryService } from '../../services/api/inventory'
import { srnSchema, SRNFormData } from '../../utils/validationSchemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import dayjs from 'dayjs'
import { PageContainer } from '../../components/common/PremiumComponents'
import { flexBetweenStyle } from '../../styles/styleUtils'
import { calculateGSTBreakup } from '../../utils/gstUtils'

const { TextArea } = Input
const { Option } = Select
const { Text, Title } = Typography

interface SRNItem {
  key?: string | number
  material_id: number
  material_name?: string
  quantity: number
  batch_number?: string
  unit_price?: number
  tax_percentage?: number
  remarks?: string
  unit?: string
  available_stock?: number
  defective_stock?: number
  stock_type: 'Good' | 'Defective'
  total_amount?: number
}

const parseUnit = (unit: any) => {
  if (!unit) return 'Nos'
  if (Array.isArray(unit)) return unit[0]
  if (typeof unit === 'string' && unit.startsWith('[')) {
    try {
      const parsed = JSON.parse(unit)
      return Array.isArray(parsed) ? parsed[0] : unit
    } catch (e) {
      return unit
    }
  }
  return unit
}

const SRNInternalForm = () => {
  const { message } = App.useApp()
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [availableMaterials, setAvailableMaterials] = useState<any[]>([])
  const [fetchingMaterials, setFetchingMaterials] = useState(false)
  const [fetchingVendors, setFetchingVendors] = useState(false)
  const [siteVendors, setSiteVendors] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [items, setItems] = useState<SRNItem[]>([])

  const [totals, setTotals] = useState({
    subtotal: 0,
    tax: 0,
    total: 0
  })

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<SRNFormData>({
    resolver: zodResolver(srnSchema),
    defaultValues: {
      transaction_date: dayjs().format('YYYY-MM-DD'),
      source_type: 'project',
      destination_type: 'warehouse',
      items: [],
    },
  })

  const sourceType = watch('source_type')
  const destType = watch('destination_type')
  const sourceId = watch('source_id')
  const destId = watch('destination_id')
  const poId = watch('purchase_order_id')

  useEffect(() => {
    fetchMetadata()
    if (id) {
      fetchSRN()
    }
  }, [id])

  useEffect(() => {
    if (sourceId) {
      fetchAvailableMaterials(sourceId, sourceType)
      fetchSiteVendors(sourceId, sourceType)
    } else {
      setAvailableMaterials([])
      setSiteVendors([])
    }
  }, [sourceId, sourceType])

  const fetchSiteVendors = async (sId: number, sType: string) => {
    setFetchingVendors(true)
    try {
      const params: any = { limit: 1000 }
      if (sType === 'project') params.project_id = sId
      else params.warehouse_id = sId

      const response = await purchaseOrderService.getPurchaseOrders(params)
      const uniqueVendors: any[] = []
      const vendorIds = new Set()

      response.purchaseOrders?.forEach((po: any) => {
        if (po.vendor && !vendorIds.has(po.vendor_id)) {
          vendorIds.add(po.vendor_id)
          uniqueVendors.push({
            id: po.vendor_id,
            name: po.vendor.name
          })
        }
      })
      setSiteVendors(uniqueVendors)
    } catch (error) {
      console.error('Failed to fetch site vendors', error)
    } finally {
      setFetchingVendors(false)
    }
  }

  useEffect(() => {
    if (sourceType === 'warehouse' && destType === 'warehouse' && sourceId === destId) {
      setValue('destination_id', undefined as any)
    }
  }, [sourceId, sourceType, destType])

  useEffect(() => {
    if (poId) {
      applyPORates(poId)
    }
  }, [poId])

  const applyPORates = async (pId: number) => {
    try {
      const res = await purchaseOrderService.getPurchaseOrder(pId)
      const po = res.purchaseOrder || res
      if (!po || !po.items) return

      const updatedItems = items.map(item => {
        const poItem = po.items.find((pi: any) => pi.material_id === item.material_id)
        if (poItem) {
          return {
            ...item,
            unit_price: Number(poItem.unit_price || 0),
            tax_percentage: Number(poItem.tax_percentage || poItem.tax || 0)
          }
        }
        return item
      })
      setItems(updatedItems)
      setValue('items', updatedItems as any)
      message.success(`Rates and Taxes updated from PO: ${po.po_number || po.temp_number}`)
    } catch (error) {
      console.error('Failed to fetch PO details', error)
    }
  }

  useEffect(() => {
    calculateSummary()
  }, [items])

  const calculateSummary = () => {
    let subtotal = 0
    let tax = 0
    let total = 0

    items.forEach(item => {
      if (item.quantity > 0 && item.unit_price) {
        const base = item.quantity * item.unit_price
        const breakup = calculateGSTBreakup(base, item.tax_percentage || 0, 'intra_state')
        subtotal += base
        tax += breakup.total_gst
        total += breakup.grand_total
      }
    })

    setTotals({ subtotal, tax, total })
  }

  const fetchAvailableMaterials = async (sId: number, sType: string) => {
    setFetchingMaterials(true)
    try {
      const params: any = { limit: 1000 }
      if (sType === 'warehouse') params.warehouse_id = sId
      else params.project_id = sId

      const response = await inventoryService.getInventory(params)
      const filtered = (response.inventory || []).filter((inv: any) => inv.quantity > 0)
      setAvailableMaterials(filtered)

      if (!id && filtered.length > 0) {
        const initialItems = filtered.map((inv: any, idx: number) => ({
          key: `inv-${inv.id || idx}`,
          material_id: inv.material_id,
          material_name: inv.material?.name,
          quantity: 0,
          available_stock: Number(inv.quantity),
          defective_stock: Number(inv.defective_quantity || 0),
          stock_type: 'Good',
          unit: parseUnit(inv.material?.unit),
          unit_price: Number(inv.material?.standard_rate || 0),
          tax_percentage: Number(inv.material?.gst_rate || 0)
        }))
        setItems(initialItems)
        setValue('items', initialItems as any)
      }
    } catch (error) {
      console.error('Failed to fetch inventory', error)
      message.error('Failed to load stock for selected source')
    } finally {
      setFetchingMaterials(false)
    }
  }

  const fetchMetadata = async () => {
    try {
      const [whRes, projRes, vendRes, poRes] = await Promise.all([
        warehouseService.getWarehouses({ limit: 500 }),
        projectService.getProjects({ limit: 500 }),
        vendorService.getVendors({ limit: 500 }),
        purchaseOrderService.getPurchaseOrders({ limit: 500 }),
      ])
      setWarehouses(whRes.warehouses || [])
      setProjects(projRes.projects || [])
      setVendors(vendRes.vendors || [])
      setPurchaseOrders(poRes.purchaseOrders || [])
    } catch (error) {
      message.error('Failed to load metadata')
    }
  }

  const fetchSRN = async () => {
    setLoading(true)
    try {
      const response = await storeTransactionService.getTransaction(Number(id))
      const srn = response.transaction

      setValue('source_type', srn.source_type)
      setValue('source_id', srn.warehouse_id || srn.from_project_id)
      setValue('destination_type', srn.destination_type)
      setValue('destination_id', srn.to_warehouse_id || srn.vendor_id)
      setValue('transaction_date', srn.transaction_date)
      setValue('remarks', srn.remarks)
      setValue('purchase_order_id', srn.purchase_order_id)

      const fetchedItems = srn.items?.map((item: any) => ({
        key: `srn-item-${item.id}`,
        material_id: item.material_id,
        material_name: item.material?.name,
        quantity: Number(item.quantity),
        available_stock: Number(item.available_stock || 0),
        defective_stock: Number(item.defective_stock || 0),
        stock_type: item.item_status === 'Defective' ? 'Defective' : 'Good',
        batch_number: item.batch_number,
        remarks: item.remarks,
        unit: item.unit || (Array.isArray(item.material?.unit) ? item.material.unit[0] : item.material?.unit),
        unit_price: Number(item.unit_price || item.material?.standard_rate || 0),
        tax_percentage: Number(item.tax_percentage || item.material?.gst_rate || 0)
      })) || []
      setItems(fetchedItems)
      setValue('items', fetchedItems)
    } catch (error: any) {
      message.error('Failed to fetch SRN')
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    const newItem: SRNItem = { key: `new-${Date.now()}`, material_id: 0, quantity: 1, stock_type: 'Good' }
    setItems([...items, newItem])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const onError = (errors: any) => {
    console.error('SRN Form Errors:', errors)
    const errorMessages = Object.values(errors)
      .map((err: any) => err.message)
      .filter(msg => typeof msg === 'string')

    if (errorMessages.length > 0) {
      message.error(`Please fix: ${errorMessages[0]}`)
    } else {
      message.error('Please check all required fields.')
    }
  }

  const updateItem = (index: number, changes: Partial<SRNItem>) => {
    setItems(prev => {
      const newItems = [...prev]
      newItems[index] = { ...newItems[index], ...changes }
      // Update form value as well
      setValue('items', newItems as any)
      return newItems
    })
  }

  const onFinalSubmit = async (data: SRNFormData) => {
    setLoading(true)
    try {
      const filteredItems = items.filter(item => item.quantity > 0).map(item => ({
        ...item,
        item_status: item.stock_type,
        total_amount: (item.quantity * (item.unit_price || 0)) * (1 + (item.tax_percentage || 0) / 100)
      }))

      if (filteredItems.length === 0) {
        message.warning('Please enter return quantity for at least one item.')
        setLoading(false)
        return
      }

      const payload = {
        ...data,
        items: filteredItems,
        total_amount: totals.total,
        tax_amount: totals.tax,
        subtotal: totals.subtotal
      }

      // Final validation check for stock limits
      for (const item of filteredItems) {
        const available = item.item_status === 'Defective' ? item.defective_stock : item.available_stock
        if (item.quantity > (available || 0)) {
          message.error(`Quantity for ${item.material_name} exceeds available ${item.item_status} stock.`)
          setLoading(false)
          return
        }
      }

      await storeTransactionService.createSRN(payload as any)
      message.success('Site Return Note (SRN) created!')
      navigate('/inventory/srn')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save SRN')
    } finally {
      setLoading(false)
    }
  }

  const itemColumns = [
    {
      title: 'Material',
      key: 'material',
      render: (_: any, record: SRNItem, index: number) => (
        <Select
          style={{ width: '100%' }}
          placeholder={sourceId ? "Select material" : "Select source first"}
          value={record.material_id || undefined}
          onChange={(value) => {
            const invItem = availableMaterials.find(m => m.material_id === value)
            const mat = invItem?.material
            updateItem(index, {
              material_id: value,
              material_name: mat?.name,
              available_stock: Number(invItem?.quantity || 0),
              defective_stock: Number(invItem?.defective_quantity || 0),
              unit: parseUnit(mat?.unit),
              unit_price: Number(mat?.standard_rate || 0),
              tax_percentage: Number(mat?.gst_rate || 0),
              stock_type: 'Good' // Default to Good when material is selected
            })
          }}
          loading={fetchingMaterials}
          disabled={!sourceId}
          showSearch
          optionFilterProp="children"
        >
          {availableMaterials.map((m) => (
            <Option key={m.material_id} value={m.material_id}>
              {m.material?.name} (Good: {m.quantity} | Def: {m.defective_quantity || 0})
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Stock Type',
      dataIndex: 'stock_type',
      key: 'stock_type',
      width: 120,
      render: (val: string, _record: SRNItem, index: number) => (
        <Select
          style={{ width: '100%' }}
          value={val}
          onChange={(newVal) => updateItem(index, { stock_type: newVal as 'Good' | 'Defective' })}
        >
          <Option value="Good">Good</Option>
          <Option value="Defective">Defective</Option>
        </Select>
      )
    },
    {
      title: 'Available',
      key: 'available',
      width: 120,
      render: (_: any, record: SRNItem) => {
        const qty = record.stock_type === 'Good' ? record.available_stock : record.defective_stock
        return (
          <Text strong style={{ color: record.stock_type === 'Defective' ? '#ff4d4f' : '#666' }}>
            {qty || 0} {record.unit}
          </Text>
        )
      }
    },
    {
      title: 'Return Qty',
      key: 'quantity',
      width: 180,
      render: (_: any, record: SRNItem, index: number) => (
        <Space.Compact style={{ width: '100%' }}>
          <InputNumber
            style={{ width: '100%' }}
            value={record.quantity}
            min={0}
            max={record.stock_type === 'Good' ? record.available_stock : record.defective_stock}
            onChange={(val) => updateItem(index, { quantity: Number(val || 0) })}
            placeholder="Qty"
          />
          {record.unit && <Button disabled style={{ backgroundColor: '#f5f5f5', color: '#888' }}>{record.unit}</Button>}
        </Space.Compact>
      ),
    },
    ...(destType === 'vendor' ? [
      {
        title: 'Rate',
        key: 'unit_price',
        width: 110,
        render: (_: any, record: any, index: number) => (
          <InputNumber
            style={{ width: '100%' }}
            value={record.unit_price}
            min={0}
            onChange={(val) => updateItem(index, { unit_price: val || 0 })}
            prefix="₹"
          />
        )
      },
      {
        title: 'Tax %',
        key: 'tax',
        width: 100,
        render: (_: any, record: any, index: number) => (
          <Select
            style={{ width: '100%' }}
            value={record.tax_percentage}
            onChange={(val) => updateItem(index, { tax_percentage: val })}
          >
            {[0, 5, 12, 18, 28].map(t => <Option key={t} value={t}>{t}%</Option>)}
          </Select>
        )
      },
      {
        title: 'Total',
        key: 'total',
        width: 120,
        render: (_: any, record: any) => {
          const base = (record.quantity || 0) * (record.unit_price || 0)
          const total = base * (1 + (record.tax_percentage || 0) / 100)
          return <Text strong>₹{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        }
      }
    ] : []),
    {
      title: 'Remarks',
      key: 'remarks',
      render: (_: any, record: SRNItem, index: number) => (
        <Input
          placeholder="Reason"
          value={record.remarks}
          onChange={(e) => updateItem(index, { remarks: e.target.value })}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_: any, __: any, index: number) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeItem(index)} />
      )
    }
  ]

  return (
    <PageContainer maxWidth={1100}>
      <Card loading={loading} style={{ borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Title level={4} style={{ margin: 0 }}>
            {id ? 'Modify Site Return Note' : 'Create Site Return Note (SRN)'}
          </Title>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inventory/srn')}>Back</Button>
          </Space>
        </div>

        <Divider />

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Card title="Source (From Site/Store)" size="small" type="inner">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Type">
                    <Controller
                      name="source_type"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} style={{ width: '100%' }}>
                          <Option value="project">Project / Site</Option>
                          <Option value="warehouse">Warehouse</Option>
                        </Select>
                      )}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="From Location" required>
                    <Controller
                      name="source_id"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} style={{ width: '100%' }} placeholder="Select Source">
                          {sourceType === 'project'
                            ? projects.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)
                            : warehouses.map(w => <Option key={w.id} value={w.id}>{w.name}</Option>)
                          }
                        </Select>
                      )}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Destination (To Warehouse/Vendor)" size="small" type="inner">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Type">
                    <Controller
                      name="destination_type"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} style={{ width: '100%' }}>
                          <Option value="warehouse">Warehouse</Option>
                          <Option value="vendor">Vendor (Return)</Option>
                        </Select>
                      )}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="To Location"
                    required
                    validateStatus={errors.destination_id ? 'error' : ''}
                    help={errors.destination_id?.message as string}
                  >
                    <Controller
                      name="destination_id"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} style={{ width: '100%' }} placeholder="Select Destination" loading={fetchingVendors}>
                          {destType === 'warehouse'
                            ? warehouses
                              .filter(w => !(sourceType === 'warehouse' && sourceId === w.id))
                              .map(w => <Option key={w.id} value={w.id}>{w.name}</Option>)
                            : (siteVendors.length > 0 ? siteVendors : (sourceId ? [] : vendors)).map(v => (
                              <Option key={v.id} value={v.id}>{v.name}</Option>
                            ))
                          }
                        </Select>
                      )}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Row gutter={24} style={{ marginTop: 16 }}>
          <Col xs={24} sm={8}>
            <Form.Item label="Return Date" required>
              <Controller
                name="transaction_date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    style={{ width: '100%' }}
                    value={field.value ? dayjs(field.value) : null}
                    onChange={d => field.onChange(d?.format('YYYY-MM-DD'))}
                  />
                )}
              />
            </Form.Item>
          </Col>
          {destType === 'vendor' && (
            <Col xs={24} sm={8}>
              <Form.Item label="Link to PO">
                <Controller
                  name="purchase_order_id"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} style={{ width: '100%' }} placeholder="Select PO" allowClear>
                      {purchaseOrders
                        .filter(po => !destId || po.vendor_id === destId)
                        .map(po => <Option key={po.id} value={po.id}>{po.po_number || po.temp_number} (₹{po.total_amount})</Option>)}
                    </Select>
                  )}
                />
              </Form.Item>
            </Col>
          )}
        </Row>

        <div style={{ marginTop: 24 }}>
          <Text strong>Return Items</Text>
          <Table
            columns={itemColumns}
            dataSource={items}
            rowKey="key"
            pagination={false}
            scroll={{ x: 'max-content' }}
            size="small"
            style={{ marginTop: 8 }}
          />
          <Button type="dashed" block icon={<PlusOutlined />} onClick={addItem} style={{ marginTop: 16 }}>
            Add Item to Return
          </Button>

          <Row gutter={24} style={{ marginTop: 24, padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Col xs={24} md={14}>
              <Title level={5}>Return Notes / Reason</Title>
              <Controller
                name="remarks"
                control={control}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    rows={6}
                    placeholder="Add any specific notes for this return. These notes will be permanently linked to the inventory transaction and the Credit Note for audit purposes."
                  />
                )}
              />
            </Col>

            <Col xs={24} md={10}>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <Card size="small" style={{ background: '#fafafa', border: 'none' }}>
                  {destType === 'vendor' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={flexBetweenStyle}>
                        <Text type="secondary">Subtotal:</Text>
                        <Text strong>₹{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                      </div>
                      <div style={flexBetweenStyle}>
                        <Text type="secondary">Tax Amount:</Text>
                        <Text strong>₹{totals.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                      </div>
                      <Divider style={{ margin: '8px 0' }} />
                      <div style={flexBetweenStyle}>
                        <Text type="secondary" style={{ fontSize: '16px' }}>Estimated Credit:</Text>
                        <Text strong style={{ fontSize: '20px', color: '#1890ff' }}>₹{totals.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                      <Text type="secondary">Internal stock transfer - No financial credit generated.</Text>
                    </div>
                  )}
                </Card>

                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                  <Space size="large">
                    <Button size="large" onClick={() => navigate('/inventory/srn')}>Discard</Button>
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleSubmit(onFinalSubmit, onError)}
                      loading={loading}
                      style={{ paddingLeft: '40px', paddingRight: '40px', fontWeight: 'bold' }}
                    >
                      {id ? 'Update SRN' : 'Submit Return Note'}
                    </Button>
                  </Space>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Card >
    </PageContainer >
  )
}

const SRNForm = () => (
  <App>
    <SRNInternalForm />
  </App>
)

export default SRNForm
