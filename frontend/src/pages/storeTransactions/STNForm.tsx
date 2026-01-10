import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, DatePicker, InputNumber, Table, Space } from 'antd'
import { SaveOutlined, PlusOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { storeTransactionService, STNItem } from '../../services/api/storeTransactions'
import { materialService } from '../../services/api/materials'
import { warehouseService } from '../../services/api/warehouses'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

interface STNFormItem extends STNItem {
  id?: number
  material_name?: string
}

const STNForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [materials, setMaterials] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [items, setItems] = useState<STNFormItem[]>([])

  useEffect(() => {
    fetchMaterials()
    fetchWarehouses()
    if (id) {
      fetchSTN()
    } else {
      form.setFieldsValue({
        transaction_date: dayjs(),
      })
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

  const fetchSTN = async () => {
    setLoading(true)
    try {
      const response = await storeTransactionService.getTransaction(Number(id))
      const stn = response.transaction
      form.setFieldsValue({
        warehouse_id: stn.warehouse_id,
        to_warehouse_id: stn.to_warehouse_id,
        transaction_date: dayjs(stn.transaction_date),
        remarks: stn.remarks,
      })
      setItems(stn.items?.map((item: any) => ({
        material_id: item.material_id,
        material_name: item.material?.name,
        quantity: Number(item.quantity),
        batch_number: item.batch_number,
      })) || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch STN')
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    setItems([...items, { material_id: 0, quantity: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof STNFormItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'material_id') {
      const material = materials.find(m => m.id === value)
      newItems[index].material_name = material?.name
    }
    setItems(newItems)
  }

  const onFinish = async (values: any) => {
    if (items.length === 0) {
      message.error('Please add at least one item')
      return
    }

    const invalidItems = items.filter(item => !item.material_id || item.quantity <= 0)
    if (invalidItems.length > 0) {
      message.error('Please fill all required fields for all items')
      return
    }

    if (values.warehouse_id === values.to_warehouse_id) {
      message.error('From Warehouse and To Warehouse must be different')
      return
    }

    setLoading(true)
    try {
      const payload = {
        warehouse_id: values.warehouse_id,
        to_warehouse_id: values.to_warehouse_id,
        transaction_date: values.transaction_date.format('YYYY-MM-DD'),
        remarks: values.remarks,
        items: items.map(item => ({
          material_id: item.material_id,
          quantity: item.quantity,
          batch_number: item.batch_number || undefined,
        })),
      }

      await storeTransactionService.createSTN(payload)
      message.success('STN created successfully!')
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
      render: (_: any, record: STNFormItem, index: number) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Select Material"
          value={record.material_id || undefined}
          onChange={(value) => updateItem(index, 'material_id', value)}
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
      render: (_: any, record: STNFormItem, index: number) => (
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
      title: 'Batch Number',
      key: 'batch_number',
      render: (_: any, record: STNFormItem, index: number) => (
        <Input
          placeholder="Batch Number (Optional)"
          value={record.batch_number}
          onChange={(e) => updateItem(index, 'batch_number', e.target.value)}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: STNFormItem, index: number) => (
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
    <div className="content-container">
      <Card
        title={id ? 'View STN' : 'Create STN (Store Transfer Note)'}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inventory/stn')}>
            Back
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={!!id}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Form.Item
              label="From Warehouse"
              name="warehouse_id"
              rules={[{ required: true, message: 'Please select from warehouse!' }]}
            >
              <Select placeholder="Select From Warehouse" showSearch optionFilterProp="children">
                {warehouses.map((wh) => (
                  <Option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="To Warehouse"
              name="to_warehouse_id"
              rules={[{ required: true, message: 'Please select to warehouse!' }]}
            >
              <Select placeholder="Select To Warehouse" showSearch optionFilterProp="children">
                {warehouses.map((wh) => (
                  <Option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Transaction Date"
              name="transaction_date"
              rules={[{ required: true, message: 'Please select transaction date!' }]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>

            <Form.Item label="Remarks" name="remarks">
              <TextArea rows={3} placeholder="Enter remarks (optional)" />
            </Form.Item>

            <Card
              title="Transfer Items"
              extra={
                !id && (
                  <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>
                    Add Item
                  </Button>
                )
              }
            >
              <Table
                columns={itemColumns}
                dataSource={items}
                rowKey={(_, index) => index.toString()}
                pagination={false}
                locale={{ emptyText: 'No items added. Click "Add Item" to add materials.' }}
              />
            </Card>

            {!id && (
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => navigate('/inventory/stn')}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  Create STN
                </Button>
              </Space>
            )}
          </Space>
        </Form>
      </Card>
    </div>
  )
}

export default STNForm

