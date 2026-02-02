import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, App, Select, DatePicker, InputNumber, Table, Space, Row, Col, Typography, Divider } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import { materialService } from '../../services/api/materials'
import { warehouseService } from '../../services/api/warehouses'
import { projectService } from '../../services/api/projects'
import { vendorService } from '../../services/api/vendors'
import { purchaseOrderService } from '../../services/api/purchaseOrders'
import { srnSchema, SRNFormData } from '../../utils/validationSchemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import dayjs from 'dayjs'
import { PageContainer } from '../../components/common/PremiumComponents'
import { flexBetweenStyle } from '../../styles/styleUtils'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

interface SRNItem {
  material_id: number
  material_name?: string
  quantity: number
  batch_number?: string
  remarks?: string
  unit?: string
}

const SRNInternalForm = () => {
  const { message } = App.useApp()
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [materials, setMaterials] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [items, setItems] = useState<SRNItem[]>([])

  const { control, handleSubmit, setValue, watch } = useForm<SRNFormData>({
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

  useEffect(() => {
    fetchMetadata()
    if (id) {
      fetchSRN()
    }
  }, [id])

  const fetchMetadata = async () => {
    try {
      const [matRes, whRes, projRes, vendRes, poRes] = await Promise.all([
        materialService.getMaterials(),
        warehouseService.getWarehouses(),
        projectService.getProjects(),
        vendorService.getVendors(),
        purchaseOrderService.getPurchaseOrders(),
      ])
      setMaterials(matRes.materials || [])
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
        material_id: item.material_id,
        material_name: item.material?.name,
        quantity: Number(item.quantity),
        batch_number: item.batch_number,
        remarks: item.remarks,
        unit: item.unit || (Array.isArray(item.material?.unit) ? item.material.unit[0] : item.material?.unit),
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
    const newItem: SRNItem = { material_id: 0, quantity: 1 }
    setItems([...items, newItem])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, changes: Partial<SRNItem>) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], ...changes }
    setItems(newItems)
    setValue('items', newItems)
  }

  const onFinalSubmit = async (data: SRNFormData) => {
    setLoading(true)
    try {
      await storeTransactionService.createSRN(data as any)
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
          placeholder="Select material"
          value={record.material_id || undefined}
          onChange={(value) => {
            const material = materials.find(m => m.id === value)
            updateItem(index, { material_id: value, material_name: material?.name, unit: Array.isArray(material?.unit) ? material.unit[0] : material?.unit })
          }}
          showSearch
          optionFilterProp="children"
        >
          {materials.map((m) => <Option key={m.id} value={m.id}>{m.name}</Option>)}
        </Select>
      ),
    },
    {
      title: 'Quantity',
      key: 'quantity',
      width: 120,
      render: (_: any, record: SRNItem, index: number) => (
        <InputNumber
          style={{ width: '100%' }}
          value={record.quantity}
          min={0.01}
          onChange={(val) => updateItem(index, { quantity: val || 0 })}
          addonAfter={record.unit}
        />
      ),
    },
    {
      title: 'Condition / Batch',
      key: 'batch',
      width: 200,
      render: (_: any, record: SRNItem, index: number) => (
        <Input
          placeholder="Condition or Batch"
          value={record.batch_number}
          onChange={(e) => updateItem(index, { batch_number: e.target.value })}
        />
      ),
    },
    {
      title: 'Line Remarks',
      key: 'remarks',
      render: (_: any, record: SRNItem, index: number) => (
        <Input
          placeholder="Why are we returning this?"
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
        <div style={flexBetweenStyle}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {id ? 'Modify Store Requisition Note' : 'Create Site Return Note (SRN)'}
          </Typography.Title>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inventory/srn')}>Back</Button>
            <Button type="primary" onClick={handleSubmit(onFinalSubmit)}>Submit SRN</Button>
          </Space>
        </div>

        <Divider />

        <Row gutter={24}>
          <Col span={12}>
            <Card title="Source (From)" size="small" type="inner">
              <Row gutter={16}>
                <Col span={12}>
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
                <Col span={12}>
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

          <Col span={12}>
            <Card title="Destination (To)" size="small" type="inner">
              <Row gutter={16}>
                <Col span={12}>
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
                <Col span={12}>
                  <Form.Item label="To Location" required>
                    <Controller
                      name="destination_id"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} style={{ width: '100%' }} placeholder="Select Destination">
                          {destType === 'warehouse'
                            ? warehouses.map(w => <Option key={w.id} value={w.id}>{w.name}</Option>)
                            : vendors.map(v => <Option key={v.id} value={v.id}>{v.name}</Option>)
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
          <Col span={8}>
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
            <Col span={8}>
              <Form.Item label="Link to PO">
                <Controller
                  name="purchase_order_id"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} style={{ width: '100%' }} placeholder="Select PO" allowClear>
                      {purchaseOrders.map(po => <Option key={po.id} value={po.id}>{po.po_number || po.temp_number}</Option>)}
                    </Select>
                  )}
                />
              </Form.Item>
            </Col>
          )}
          <Col span={destType === 'vendor' ? 8 : 16}>
            <Form.Item label="General Remarks">
              <Controller name="remarks" control={control} render={({ field }) => <TextArea {...field} rows={1} />} />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ marginTop: 24 }}>
          <Text strong>Return Items</Text>
          <Table
            columns={itemColumns}
            dataSource={items}
            rowKey={(_, i) => String(i)}
            pagination={false}
            size="small"
            style={{ marginTop: 8 }}
          />
          <Button type="dashed" block icon={<PlusOutlined />} onClick={addItem} style={{ marginTop: 16 }}>
            Add Item to Return
          </Button>
        </div>
      </Card>
    </PageContainer>
  )
}

const SRNForm = () => (
  <App>
    <SRNInternalForm />
  </App>
)

export default SRNForm
