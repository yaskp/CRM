import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, DatePicker, InputNumber, Table, Space, Row, Col } from 'antd'
import { SaveOutlined, PlusOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import { materialService } from '../../services/api/materials'
import { useForm } from 'react-hook-form'
import { warehouseService } from '../../services/api/warehouses'
import { grnSchema, GRNFormData } from '../../utils/validationSchemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller } from 'react-hook-form'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

interface GRNItem {
  id?: number
  material_id: number
  material_name?: string
  quantity: number
  unit_price?: number
  batch_number?: string
  expiry_date?: string
}

const GRNForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [items, setItems] = useState<GRNItem[]>([])

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<GRNFormData>({
    resolver: zodResolver(grnSchema),
    defaultValues: {
      transaction_date: dayjs().format('YYYY-MM-DD'),
      items: [],
    },
  })

  const warehouseId = watch('warehouse_id')

  useEffect(() => {
    fetchMaterials()
    fetchWarehouses()
    if (id) {
      fetchGRN()
    }
  }, [id])

  const fetchMaterials = async () => {
    try {
      const response = await materialService.getMaterials()
      setMaterials(response.materials || [])
    } catch (error) {
      message.error('Failed to fetch materials')
    }
  }

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseService.getWarehouses()
      setWarehouses(response.warehouses || [])
    } catch (error) {
      message.error('Failed to fetch warehouses')
    }
  }

  const fetchGRN = async () => {
    setLoading(true)
    try {
      const response = await storeTransactionService.getTransaction(Number(id))
      const grn = response.transaction
      setValue('warehouse_id', grn.warehouse_id)
      setValue('transaction_date', grn.transaction_date)
      setValue('remarks', grn.remarks)
      setItems(grn.items?.map((item: any) => ({
        material_id: item.material_id,
        material_name: item.material?.name,
        quantity: Number(item.quantity),
        unit_price: item.unit_price ? Number(item.unit_price) : undefined,
        batch_number: item.batch_number,
        expiry_date: item.expiry_date,
      })) || [])
      setValue('items', grn.items || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch GRN')
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    const newItem: GRNItem = {
      material_id: 0,
      quantity: 0,
    }
    setItems([...items, newItem])
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
    setValue('items', newItems)
  }

  const updateItem = (index: number, field: keyof GRNItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
    setValue('items', newItems)
  }

  const onSubmit = async (data: GRNFormData) => {
    if (items.length === 0) {
      message.error('Please add at least one item')
      return
    }

    const invalidItems = items.filter(item => !item.material_id || item.quantity <= 0)
    if (invalidItems.length > 0) {
      message.error('Please fill all required fields for all items')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...data,
        items: items.map(item => ({
          material_id: item.material_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          batch_number: item.batch_number || undefined,
          expiry_date: item.expiry_date || undefined,
        })),
      }

      if (id) {
        message.error('Editing GRN is not allowed. Please create a new one.')
        return
      } else {
        await storeTransactionService.createGRN(payload)
        message.success('GRN created successfully!')
        navigate('/inventory/grn')
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save GRN')
    } finally {
      setLoading(false)
    }
  }

  const itemColumns = [
    {
      title: 'Material',
      key: 'material',
      render: (_: any, record: GRNItem, index: number) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Select Material"
          value={record.material_id || undefined}
          onChange={(value) => {
            const material = materials.find(m => m.id === value)
            updateItem(index, 'material_id', value)
            updateItem(index, 'material_name', material?.name)
          }}
          showSearch
          optionFilterProp="children"
        >
          {materials.map((material) => (
            <Option key={material.id} value={material.id}>
              {material.name} ({material.material_code})
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_: any, record: GRNItem, index: number) => (
        <InputNumber
          style={{ width: '100%' }}
          placeholder="Quantity"
          value={record.quantity}
          min={0}
          step={0.01}
          onChange={(value) => updateItem(index, 'quantity', value || 0)}
        />
      ),
    },
    {
      title: 'Unit Price (₹)',
      key: 'unit_price',
      render: (_: any, record: GRNItem, index: number) => (
        <InputNumber
          style={{ width: '100%' }}
          placeholder="Unit Price"
          value={record.unit_price}
          min={0}
          step={0.01}
          onChange={(value) => updateItem(index, 'unit_price', value || undefined)}
        />
      ),
    },
    {
      title: 'Batch Number',
      key: 'batch_number',
      render: (_: any, record: GRNItem, index: number) => (
        <Input
          placeholder="Batch Number"
          value={record.batch_number}
          onChange={(e) => updateItem(index, 'batch_number', e.target.value)}
        />
      ),
    },
    {
      title: 'Expiry Date',
      key: 'expiry_date',
      render: (_: any, record: GRNItem, index: number) => (
        <DatePicker
          style={{ width: '100%' }}
          placeholder="Expiry Date"
          value={record.expiry_date ? dayjs(record.expiry_date) : null}
          onChange={(date) => updateItem(index, 'expiry_date', date ? date.format('YYYY-MM-DD') : undefined)}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: GRNItem, index: number) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(index)}
        >
          Remove
        </Button>
      ),
    },
  ]

  return (
    <Card
      title={id ? 'Edit GRN' : 'Create GRN'}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inventory/grn')}>
          Back
        </Button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Warehouse"
              validateStatus={errors.warehouse_id ? 'error' : ''}
              help={errors.warehouse_id?.message}
              required
            >
              <Controller
                name="warehouse_id"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Warehouse"
                    showSearch
                    optionFilterProp="children"
                  >
                    {warehouses.map((wh) => (
                      <Option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code})
                      </Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Transaction Date"
              validateStatus={errors.transaction_date ? 'error' : ''}
              help={errors.transaction_date?.message}
              required
            >
              <Controller
                name="transaction_date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                  />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item label="Remarks">
              <Controller
                name="remarks"
                control={control}
                render={({ field }) => (
                  <TextArea {...field} rows={3} placeholder="Enter remarks (optional)" />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Card
          title="Items"
          extra={
            <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>
              Add Item
            </Button>
          }
          style={{ marginTop: 16 }}
        >
          <Table
            columns={itemColumns}
            dataSource={items}
            rowKey={(_, index) => index.toString()}
            pagination={false}
            locale={{ emptyText: 'No items added. Click "Add Item" to add materials.' }}
          />
          {errors.items && (
            <div style={{ color: '#ff4d4f', marginTop: 8 }}>{errors.items.message}</div>
          )}
        </Card>

        <Space style={{ marginTop: 24, width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={() => navigate('/inventory/grn')}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
            {id ? 'Update' : 'Create'} GRN
          </Button>
        </Space>
      </form>
    </Card>
  )
}

export default GRNForm

