import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Select, DatePicker, InputNumber, Table, Space, Row, Col, Typography, App } from 'antd'
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  SyncOutlined,
  HomeOutlined,
  SwapOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  BarcodeOutlined,
  ProjectOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { storeTransactionService, STNItem } from '../../services/api/storeTransactions'
import { materialService } from '../../services/api/materials'
import { warehouseService } from '../../services/api/warehouses'
import { projectService } from '../../services/api/projects'
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
  prefixIconStyle,
} from '../../styles/styleUtils'
import { theme } from '../../styles/theme'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { stnSchema, STNFormData } from '../../utils/validationSchemas'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

interface STNFormItem extends STNItem {
  id?: number
  material_name?: string
  tempKey: string
}

const STNForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)

  // Master data
  const [materials, setMaterials] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])

  const [items, setItems] = useState<STNFormItem[]>([])
  const [stockMap, setStockMap] = useState<Record<number, number>>({})
  const [stockLoading, setStockLoading] = useState(false)

  const { control, handleSubmit, setValue, watch } = useForm<STNFormData>({
    resolver: zodResolver(stnSchema),
    defaultValues: {
      transaction_date: dayjs().format('YYYY-MM-DD'),
      from_type: 'warehouse',
      to_type: 'warehouse',
      items: [],
    },
  })

  const fromType = watch('from_type')
  const toType = watch('to_type')
  const fromId = watch('from_id')
  const toId = watch('to_id')

  useEffect(() => {
    fetchMetadata()
    if (id) {
      fetchSTN()
    }
  }, [id])

  useEffect(() => {
    // Clear items when source changes to prevent invalid transfers
    if (items.length > 0 && !id) { // Only clear if not in 'edit' mode (loading initial data)
      setItems([])
      setValue('items', [])
    }

    if (fromId) {
      fetchSourceStock(fromType, fromId)
    } else {
      setStockMap({})
    }
  }, [fromType, fromId])

  const fetchSourceStock = async (type: string, id: number) => {
    setStockLoading(true)
    try {
      const params = type === 'project' ? { project_id: id } : { warehouse_id: id }
      const response = await inventoryService.getInventory({ ...params, limit: 1000 })

      const map: Record<number, number> = {}
      response.inventory?.forEach((inv: any) => {
        if (Number(inv.quantity) > 0) {
          map[inv.material_id] = Number(inv.quantity)
        }
      })
      setStockMap(map)
      return response.inventory || []
    } catch (error) {
      console.error('Failed to fetch stock', error)
      message.warning('Could not verify stock levels')
      return []
    } finally {
      setStockLoading(false)
    }
  }

  const loadSourceItems = async () => {
    if (!fromId) {
      message.warning('Please select a source first')
      return
    }
    const invItems = await fetchSourceStock(fromType, fromId)
    if (invItems.length === 0) {
      message.info('No stock found at selected source')
      return
    }

    const newItems = invItems.map((inv: any) => ({
      material_id: inv.material_id,
      material_name: inv.material?.name,
      quantity: Number(inv.quantity),
      unit: inv.material?.unit,
      tempKey: `inv-${inv.id}`
    }))
    setItems(newItems)
    setValue('items', newItems)
    message.success(`Loaded ${newItems.length} items from source`)
  }

  const fetchMetadata = async () => {
    try {
      const [matRes, whRes, projRes] = await Promise.all([
        materialService.getMaterials(),
        warehouseService.getWarehouses(),
        projectService.getProjects(),
      ])
      setMaterials(matRes.materials || [])
      setWarehouses(whRes.warehouses || [])
      setProjects(projRes.projects || [])
    } catch (error) {
      message.error('Failed to load metadata')
    }
  }

  const fetchSTN = async () => {
    setLoading(true)
    try {
      const response = await storeTransactionService.getTransaction(Number(id))
      const stn = response.transaction

      setValue('transaction_date', stn.transaction_date)
      setValue('remarks', stn.remarks)
      setValue('from_type', stn.from_type || 'warehouse')
      setValue('to_type', stn.to_type || 'warehouse')
      setValue('from_id', stn.from_id)
      setValue('to_id', stn.to_id)

      setItems(stn.items?.map((item: any) => ({
        material_id: item.material_id,
        material_name: item.material?.name,
        quantity: Number(item.quantity),
        batch_number: item.batch_number,
        tempKey: item.id.toString()
      })) || [])
      setValue('items', stn.items || [])

    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch STN')
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    const newItem: STNFormItem = {
      material_id: 0,
      quantity: 0,
      tempKey: `new-${Date.now()}-${Math.random()}`
    }
    setItems([...items, newItem])
  }

  const removeItem = (tempKey: string) => {
    const newItems = items.filter((item) => item.tempKey !== tempKey)
    setItems(newItems)
    setValue('items', newItems)
  }

  const updateItem = (tempKey: string, field: keyof STNFormItem, value: any) => {
    const newItems = items.map(item => {
      if (item.tempKey === tempKey) {
        const newItem = { ...item, [field]: value }
        if (field === 'material_id') {
          const material = materials.find(m => m.id === value)
          newItem.material_name = material?.name
        }
        return newItem
      }
      return item
    })
    setItems(newItems)
    setValue('items', newItems)
  }

  const onFinish = async (data: STNFormData) => {
    if (items.length === 0) {
      message.error('Please add at least one item')
      return
    }

    const invalidItems = items.filter(item => !item.material_id || item.quantity <= 0)
    if (invalidItems.length > 0) {
      message.error('Please fill all required fields for all items')
      return
    }

    if (data.from_type === data.to_type && data.from_id === data.to_id) {
      message.error('Source and Destination cannot be the same')
      return
    }

    // Stock Validation for Warehouse source
    if (fromType === 'warehouse' && Object.keys(stockMap).length > 0) {
      const errorsList: string[] = []
      items.forEach(item => {
        const available = stockMap[item.material_id] || 0
        if (item.quantity > available) {
          errorsList.push(`Insufficient stock for ${item.material_name || 'Item'}. Available: ${available}`)
        }
      })

      if (errorsList.length > 0) {
        message.error(errorsList[0])
        return
      }
    }

    setLoading(true)
    try {
      const payload = {
        ...data,
        items: items.map(item => ({
          material_id: item.material_id,
          quantity: item.quantity,
          batch_number: item.batch_number || undefined,
        })),
      }

      await storeTransactionService.createSTN(payload)
      message.success('Stock Transfer Note created successfully!')
      navigate('/inventory/stn')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save STN')
    } finally {
      setLoading(false)
    }
  }

  const itemColumns = [
    {
      title: 'Material / Product',
      key: 'material',
      width: '40%',
      render: (_: any, record: STNFormItem) => {
        const available = stockMap[record.material_id]

        let stockDisplay = null

        if (record.material_id > 0) {
          if (fromType === 'project') {
            stockDisplay = <span style={{ color: 'gray', fontStyle: 'italic' }}>Stock visibility unavailable for Project source</span>
          } else if (!fromId) {
            stockDisplay = <span style={{ color: 'orange' }}>Please select Source above to view stock</span>
          } else if (stockLoading) {
            stockDisplay = <span style={{ color: theme.colors.primary.main }}>Checking stock...</span>
          } else {
            const qty = available || 0
            const isLow = qty < (record.quantity || 0)
            stockDisplay = (
              <span style={{ color: isLow ? 'red' : 'green', fontWeight: 500 }}>
                Available Stock: {qty} {materials.find(m => m.id === record.material_id)?.unit || ''}
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
              onChange={(value) => updateItem(record.tempKey, 'material_id', value)}
              showSearch
              optionFilterProp="children"
              size="large"
              loading={stockLoading}
              popupRender={(menu) => (
                <>
                  {menu}
                  {fromId && Object.keys(stockMap).length === 0 && !stockLoading && (
                    <div style={{ padding: '8px', color: 'orange', textAlign: 'center' }}>
                      No available stock at source
                    </div>
                  )}
                </>
              )}
            >
              {materials
                .filter(m => {
                  // If source is selected, ONLY show materials with stock > 0
                  if (fromId && !stockLoading) {
                    return (stockMap[m.id] || 0) > 0
                  }
                  return true
                })
                .map((material) => {
                  const stock = stockMap[material.id]
                  return (
                    <Option key={material.id} value={material.id}>
                      {material.name} ({material.material_code})
                      {fromId && stock !== undefined ? ` - Avail: ${stock}` : ''}
                    </Option>
                  )
                })}
            </Select>
            {stockDisplay && (
              <div style={{ marginTop: 4, fontSize: '12px' }}>
                {stockDisplay}
              </div>
            )}
          </div>
        )
      },
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_: any, record: STNFormItem) => {
        const available = stockMap[record.material_id] || 0
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Transfer Qty"
              value={record.quantity}
              min={0}
              max={available} // Enforce max at input level
              step={0.01}
              status={available < record.quantity ? 'error' : ''}
              onChange={(value) => updateItem(record.tempKey, 'quantity', value || 0)}
              size="large"
            />
            {available > 0 && (
              <div style={{ textAlign: 'right', marginTop: 2 }}>
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, height: 'auto', fontSize: '11px' }}
                  onClick={() => updateItem(record.tempKey, 'quantity', available)}
                >
                  Max: {available}
                </Button>
              </div>
            )}
          </div>
        )
      },
    },
    {
      title: 'Batch Code',
      key: 'batch_number',
      width: '30%',
      render: (_: any, record: STNFormItem) => (
        <Input
          placeholder="Batch # (Optional)"
          value={record.batch_number}
          onChange={(e) => updateItem(record.tempKey, 'batch_number', e.target.value)}
          size="large"
          prefix={<BarcodeOutlined style={prefixIconStyle} />}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: any, record: STNFormItem) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.tempKey)}
          style={{ padding: 0 }}
        />
      ),
    },
  ]

  return (
    <PageContainer maxWidth={1100}>
      <PageHeader
        title={id ? 'Stock Transfer Details' : 'Create Stock Transfer (STN)'}
        subtitle={id ? `Reference: #STN-${id}` : 'Move materials securely between project sites or warehouses'}
        icon={<SyncOutlined />}
      />

      <form onSubmit={handleSubmit(onFinish)}>
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <SectionCard title="Transfer Route" icon={<SwapOutlined />}>

              {/* SOURCE */}
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>From (Source)</Text>
                <Space.Compact block>
                  <Controller
                    name="from_type"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} style={{ width: '130px' }} size="large" onChange={(val) => { field.onChange(val); setValue('from_id', 0); }}>
                        <Option value="warehouse"><HomeOutlined /> Warehouse</Option>
                        <Option value="project"><ProjectOutlined /> Project Site</Option>
                      </Select>
                    )}
                  />
                  <Controller
                    name="from_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        style={{ width: '100%' }}
                        size="large"
                        placeholder="Select Source..."
                        showSearch
                        optionFilterProp="children"
                        value={field.value || undefined}
                      >
                        {fromType === 'warehouse'
                          ? warehouses.map(w => <Option key={w.id} value={w.id}>{w.name} ({w.code})</Option>)
                          : projects.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)
                        }
                      </Select>
                    )}
                  />
                </Space.Compact>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
                <ArrowRightOutlined style={{ fontSize: '24px', color: theme.colors.primary.main }} />
              </div>

              {/* DESTINATION */}
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>To (Destination)</Text>
                <Space.Compact block>
                  <Controller
                    name="to_type"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} style={{ width: '130px' }} size="large" onChange={(val) => { field.onChange(val); setValue('to_id', 0); }}>
                        <Option value="warehouse"><HomeOutlined /> Warehouse</Option>
                        <Option value="project"><ProjectOutlined /> Project Site</Option>
                      </Select>
                    )}
                  />
                  <Controller
                    name="to_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        style={{ width: '100%' }}
                        size="large"
                        placeholder="Select Destination..."
                        showSearch
                        optionFilterProp="children"
                        value={field.value || undefined}
                      >
                        {toType === 'warehouse'
                          ? warehouses
                            .filter(w => !(fromType === 'warehouse' && w.id === fromId))
                            .map(w => <Option key={w.id} value={w.id}>{w.name} ({w.code})</Option>)
                          : projects
                            .filter(p => !(fromType === 'project' && p.id === fromId))
                            .map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)
                        }
                      </Select>
                    )}
                  />
                </Space.Compact>
              </div>

            </SectionCard>
          </Col>

          <Col xs={24} lg={12}>
            <SectionCard title="Logistics Details" icon={<FileTextOutlined />}>
              <Form.Item label={<span style={getLabelStyle()}>Transfer Date</span>} required>
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

              <Form.Item label={<span style={getLabelStyle()}>Remarks / Vehicle No.</span>}>
                <Controller
                  name="remarks"
                  control={control}
                  render={({ field }) => (
                    <TextArea {...field} rows={4} placeholder="Vehicle info, driver name, or transfer reason..." style={largeInputStyle} />
                  )}
                />
              </Form.Item>

              <InfoCard title="💡 Stock Movement">
                {fromType === 'warehouse' && toType === 'project' && 'This will ISSUE stock from Warehouse to Project.'}
                {fromType === 'project' && toType === 'warehouse' && 'This will RETURN stock from Project to Warehouse.'}
                {fromType === 'warehouse' && toType === 'warehouse' && 'This will TRANSFER stock between Warehouses.'}
                {fromType === 'project' && toType === 'project' && 'This will TRANSFER stock between Sites.'}
              </InfoCard>

              <div style={{ marginTop: 12 }}>
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  <InfoCircleOutlined /> <b>Note:</b> Transfers only move assets. P&L impact occurs upon Material Consumption.
                </Text>
              </div>
            </SectionCard>
          </Col>
        </Row>

        <div style={{ marginTop: theme.spacing.lg }}>
          <SectionCard
            title="Transfer Items"
            icon={<SyncOutlined />}
            extra={
              !id && (
                <Space>
                  <Button
                    type="primary"
                    ghost
                    icon={<SyncOutlined />}
                    onClick={loadSourceItems}
                    disabled={!fromId}
                  >
                    Auto-Fill All Stock Items
                  </Button>
                  <Button type="dashed" icon={<PlusOutlined />} onClick={addItem} style={{ borderRadius: '6px' }}>
                    Add Item Row
                  </Button>
                </Space>
              )
            }
          >
            <Table
              columns={itemColumns}
              dataSource={items}
              rowKey="tempKey"
              pagination={false}
              bordered
              scroll={{ x: 800 }}
              locale={{ emptyText: <div style={{ padding: '30px' }}><Text type="secondary">No materials listed for transfer. Click "Add Item Row" to begin.</Text></div> }}
            />
          </SectionCard>
        </div>

        <Card style={actionCardStyle}>
          <div style={{ ...flexBetweenStyle, flexWrap: 'wrap', gap: theme.spacing.md }}>
            <Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: '8px' }} />
              Ensure stock availability in source before submitting.
            </Text>
            {!id && (
              <Space size="middle" wrap>
                <Button onClick={() => navigate('/inventory/stn')} size="large" style={getSecondaryButtonStyle()}>
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
                  Create Transfer Note
                </Button>
              </Space>
            )}
          </div>
        </Card>
      </form>
    </PageContainer>
  )
}

export default STNForm
