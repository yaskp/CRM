import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, App, Select, DatePicker, InputNumber, Table, Space, Row, Col, Typography } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import { warehouseService } from '../../services/api/warehouses'
import { projectService } from '../../services/api/projects'
import { inventoryService } from '../../services/api/inventory'
import { stnSchema, STNFormData } from '../../utils/validationSchemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import dayjs from 'dayjs'
import { PageContainer } from '../../components/common/PremiumComponents'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

interface STNItem {
  material_id: number
  material_name?: string
  quantity: number
  batch_number?: string
  unit?: string
}

const STNInternalForm = () => {
  const { message } = App.useApp()
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [availableMaterials, setAvailableMaterials] = useState<any[]>([])
  const [fetchingMaterials, setFetchingMaterials] = useState(false)
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [items, setItems] = useState<STNItem[]>([])

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<STNFormData>({
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

  useEffect(() => {
    // Clear destination if it matches the source (even across types like Project vs Site Store)
    const currentToId = watch('to_id')
    if (currentToId) {
      if (fromType === toType && fromId === currentToId) {
        setValue('to_id', undefined as any)
      } else if (fromType === 'project' && toType === 'warehouse') {
        const wh = warehouses.find(w => w.id === currentToId)
        if (wh && wh.project_id === fromId) setValue('to_id', undefined as any)
      } else if (fromType === 'warehouse' && toType === 'project') {
        const wh = warehouses.find(w => w.id === fromId)
        if (wh && wh.project_id === currentToId) setValue('to_id', undefined as any)
      }
    }
  }, [fromId, fromType, toType])

  useEffect(() => {
    fetchMetadata()
    if (id) {
      fetchSTN()
    }
  }, [id])

  useEffect(() => {
    if (fromId) {
      fetchAvailableMaterials(fromId, fromType)
    } else {
      setAvailableMaterials([])
    }
  }, [fromId, fromType])

  const fetchAvailableMaterials = async (fId: number, fType: string) => {
    setFetchingMaterials(true)
    try {
      const params: any = { limit: 1000 }
      if (fType === 'warehouse') params.warehouse_id = fId
      else params.project_id = fId

      const response = await inventoryService.getInventory(params)
      // Map inventory items to match material selection structure if needed, or just use as is
      // Assuming inventory item has .material and .quantity
      const filtered = (response.inventory || []).filter((inv: any) => inv.quantity > 0)
      setAvailableMaterials(filtered)

      // Auto-populate for new transactions
      if (!id && filtered.length > 0) {
        const initialItems = filtered.map((inv: any) => {
          const mat = inv.material
          return {
            material_id: inv.material_id || mat?.id,
            material_name: mat?.name,
            quantity: Number(inv.quantity),
            unit: Array.isArray(mat?.unit) ? mat.unit[0] : (mat?.unit || 'Nos')
          }
        })
        setItems(initialItems)
        setValue('items', initialItems)
      }
    } catch (error) {
      console.error('Failed to fetch available materials', error)
      message.error('Could not load stock for this source')
    } finally {
      setFetchingMaterials(false)
    }
  }

  const fetchMetadata = async () => {
    try {
      const [whRes, projRes] = await Promise.all([
        warehouseService.getWarehouses({ limit: 500 }),
        projectService.getProjects({ limit: 500 }),
      ])
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

      setValue('from_type', stn.source_type)
      setValue('from_id', stn.warehouse_id || stn.from_project_id)
      setValue('to_type', stn.destination_type)
      setValue('to_id', stn.to_warehouse_id || stn.to_project_id)
      setValue('transaction_date', stn.transaction_date)
      setValue('remarks', stn.remarks)

      const fetchedItems = stn.items?.map((item: any) => ({
        material_id: item.material_id,
        material_name: item.material?.name,
        quantity: Number(item.quantity),
        batch_number: item.batch_number,
        unit: item.unit || (Array.isArray(item.material?.unit) ? item.material.unit[0] : item.material?.unit),
      })) || []
      setItems(fetchedItems)
      setValue('items', fetchedItems)
    } catch (error: any) {
      message.error('Failed to fetch STN')
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    const newItem: STNItem = { material_id: 0, quantity: 1 }
    setItems([...items, newItem])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, changes: Partial<STNItem>) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], ...changes }
    setItems(newItems)
    setValue('items', newItems)
  }

  const onFinalSubmit = async (data: STNFormData) => {
    setLoading(true)
    try {
      await storeTransactionService.createSTN(data as any)
      message.success('Store Transfer Note created!')
      navigate('/inventory/stn')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save STN')
    } finally {
      setLoading(false)
    }
  }

  const itemColumns = [
    {
      title: 'Material',
      key: 'material',
      render: (_: any, record: STNItem, index: number) => (
        <Select
          style={{ width: '100%' }}
          placeholder={fromId ? "Select material" : "Select source first"}
          value={record.material_id || undefined}
          onChange={(value) => {
            const invItem = availableMaterials.find(m => (m.material_id || m.material?.id) === value)
            const mat = invItem?.material
            updateItem(index, {
              material_id: value,
              material_name: mat?.name,
              unit: Array.isArray(mat?.unit) ? mat.unit[0] : mat?.unit
            })
          }}
          loading={fetchingMaterials}
          disabled={!fromId}
          showSearch
          optionFilterProp="children"
        >
          {availableMaterials.map((m) => (
            <Option key={m.material_id || m.material?.id} value={m.material_id || m.material?.id}>
              {m.material?.name} (Stock: {m.quantity} {m.material?.unit})
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Quantity',
      key: 'quantity',
      width: 150,
      render: (_: any, record: STNItem, index: number) => (
        <InputNumber
          style={{ width: '100%' }}
          value={record.quantity}
          min={0.01}
          max={availableMaterials.find(m => (m.material_id || m.material?.id) === record.material_id)?.quantity}
          onChange={(val) => updateItem(index, { quantity: val || 0 })}
          addonAfter={record.unit}
        />
      ),
    },
    {
      title: 'Batch #',
      key: 'batch',
      width: 150,
      render: (_: any, record: STNItem, index: number) => (
        <Input
          placeholder="Batch Ref"
          value={record.batch_number}
          onChange={(e) => updateItem(index, { batch_number: e.target.value })}
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
    <PageContainer maxWidth={1000}>
      <Card loading={loading} style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {id ? 'Modify Store Transfer Note' : 'Create Store Transfer Note'}
          </Typography.Title>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inventory/stn')}>Back</Button>
            <Button type="primary" onClick={handleSubmit(onFinalSubmit)}>Submit STN</Button>
          </Space>
        </div>

        <Divider />

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Card title="Source (From)" size="small" type="inner">
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="Type">
                    <Controller
                      name="from_type"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} style={{ width: '100%' }}>
                          <Option value="warehouse">Warehouse</Option>
                          <Option value="project">Project / Site</Option>
                        </Select>
                      )}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="Source Unit" required>
                    <Controller
                      name="from_id"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} style={{ width: '100%' }} placeholder="Select Source">
                          {fromType === 'warehouse'
                            ? warehouses.map(w => <Option key={w.id} value={w.id}>{w.name}</Option>)
                            : projects.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)
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
            <Card title="Destination (To)" size="small" type="inner">
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="Type">
                    <Controller
                      name="to_type"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} style={{ width: '100%' }}>
                          <Option value="warehouse">Warehouse</Option>
                          <Option value="project">Project / Site</Option>
                        </Select>
                      )}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="Destination Unit"
                    required
                    validateStatus={errors.to_id ? 'error' : ''}
                    help={errors.to_id?.message as string}
                  >
                    <Controller
                      name="to_id"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} style={{ width: '100%' }} placeholder="Select Destination">
                          {toType === 'warehouse'
                            ? warehouses
                              .filter(w => !((fromType === 'warehouse' && fromId === w.id) || (fromType === 'project' && fromId === w.project_id)))
                              .map(w => <Option key={w.id} value={w.id}>{w.name}</Option>)
                            : projects
                              .filter(p => {
                                const fromWh = fromType === 'warehouse' ? warehouses.find(w => w.id === fromId) : null
                                return !((fromType === 'project' && fromId === p.id) || (fromWh && fromWh.project_id === p.id))
                              })
                              .map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)
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
          <Col xs={24} md={12}>
            <Form.Item label="Transfer Date" required>
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
          <Col xs={24} md={12}>
            <Form.Item label="Remarks">
              <Controller name="remarks" control={control} render={({ field }) => <TextArea {...field} rows={2} />} />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ marginTop: 24 }}>
          <Text strong>Transfer Items</Text>
          <Table
            columns={itemColumns}
            dataSource={items}
            rowKey={(_, i) => String(i)}
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
            style={{ marginTop: 8 }}
          />
          <Button type="dashed" block icon={<PlusOutlined />} onClick={addItem} style={{ marginTop: 16 }}>
            Add Material
          </Button>
        </div>
      </Card>
    </PageContainer>
  )
}

import { Divider } from 'antd'

const STNForm = () => (
  <App>
    <STNInternalForm />
  </App>
)

export default STNForm
