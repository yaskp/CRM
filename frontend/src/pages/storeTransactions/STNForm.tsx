import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, App, Select, DatePicker, InputNumber, Table, Space, Row, Col, Typography } from 'antd'
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
import { stnSchema, STNFormData } from '../../utils/validationSchemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import dayjs from 'dayjs'
import { PageContainer } from '../../components/common/PremiumComponents'
import { flexBetweenStyle } from '../../styles/styleUtils'

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

  const [materials, setMaterials] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [items, setItems] = useState<STNItem[]>([])

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

  useEffect(() => {
    fetchMetadata()
    if (id) {
      fetchSTN()
    }
  }, [id])

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
      width: 150,
      render: (_: any, record: STNItem, index: number) => (
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
        <div style={flexBetweenStyle}>
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
          <Col span={12}>
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

          <Col span={12}>
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
                  <Form.Item label="Destination Unit" required>
                    <Controller
                      name="to_id"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} style={{ width: '100%' }} placeholder="Select Destination">
                          {toType === 'warehouse'
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
        </Row>

        <Row gutter={24} style={{ marginTop: 16 }}>
          <Col span={12}>
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
          <Col span={12}>
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
