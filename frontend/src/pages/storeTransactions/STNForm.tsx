import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, DatePicker, InputNumber, Table, Space, Row, Col, Typography } from 'antd'
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SyncOutlined,
  HomeOutlined,
  SwapOutlined,
  CalendarOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  BarcodeOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { storeTransactionService, STNItem } from '../../services/api/storeTransactions'
import { materialService } from '../../services/api/materials'
import { warehouseService } from '../../services/api/warehouses'
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
  twoColumnGridStyle
} from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

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
      message.error('Source and Destination Warehouses must be different')
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
      title: 'Material / Product',
      key: 'material',
      width: '40%',
      render: (_: any, record: STNFormItem, index: number) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Select Material"
          value={record.material_id || undefined}
          onChange={(value) => updateItem(index, 'material_id', value)}
          showSearch
          optionFilterProp="children"
          size="large"
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
      width: '20%',
      render: (_: any, record: STNFormItem, index: number) => (
        <InputNumber
          style={{ width: '100%' }}
          placeholder="Transfer Qty"
          value={record.quantity}
          min={0}
          step={0.01}
          onChange={(value) => updateItem(index, 'quantity', value || 0)}
          size="large"
        />
      ),
    },
    {
      title: 'Batch Code',
      key: 'batch_number',
      width: '30%',
      render: (_: any, record: STNFormItem, index: number) => (
        <Input
          placeholder="Batch # (Optional)"
          value={record.batch_number}
          onChange={(e) => updateItem(index, 'batch_number', e.target.value)}
          size="large"
          prefix={<BarcodeOutlined style={prefixIconStyle} />}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: any, record: STNFormItem, index: number) => (
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
        title={id ? 'Stock Transfer Details' : 'Create Stock Transfer (STN)'}
        subtitle={id ? `Reference: #STN-${id}` : 'Move materials securely between project sites or warehouses'}
        icon={<SyncOutlined />}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        disabled={!!id}
      >
        <div style={twoColumnGridStyle}>
          <SectionCard title="Transfer Route" icon={<SwapOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Source Warehouse</span>}
              name="warehouse_id"
              rules={[{ required: true, message: 'Please select from warehouse!' }]}
            >
              <Select
                placeholder="From where?"
                showSearch
                optionFilterProp="children"
                size="large"
                style={largeInputStyle}
                suffixIcon={<HomeOutlined />}
              >
                {warehouses.map((wh) => (
                  <Option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '-10px 0 10px 0' }}>
              <Tag color="blue" style={{ borderRadius: '50%', padding: '8px' }}><SwapOutlined style={{ transform: 'rotate(90deg)', fontSize: '18px' }} /></Tag>
            </div>

            <Form.Item
              label={<span style={getLabelStyle()}>Destination Warehouse</span>}
              name="to_warehouse_id"
              rules={[{ required: true, message: 'Please select to warehouse!' }]}
            >
              <Select
                placeholder="To where?"
                showSearch
                optionFilterProp="children"
                size="large"
                style={largeInputStyle}
                suffixIcon={<HomeOutlined />}
              >
                {warehouses.map((wh) => (
                  <Option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </SectionCard>

          <SectionCard title="Transfer Logistics" icon={<FileTextOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Transfer Date</span>}
              name="transaction_date"
              rules={[{ required: true, message: 'Please select transaction date!' }]}
            >
              <DatePicker style={{ width: '100%', ...largeInputStyle }} format="DD-MMM-YYYY" size="large" />
            </Form.Item>

            <Form.Item label={<span style={getLabelStyle()}>Logistics Remarks</span>} name="remarks">
              <TextArea rows={4} placeholder="Vehicle info, driver name, or transfer reason..." style={largeInputStyle} />
            </Form.Item>

            <InfoCard title="💡 Stock Impact">
              Stock will be deducted from source and added to destination only after approval.
            </InfoCard>
          </SectionCard>
        </div>

        <div style={{ marginTop: theme.spacing.lg }}>
          <SectionCard
            title="Transfer Items"
            icon={<SyncOutlined />}
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
              rowKey={(_, index) => index.toString()}
              pagination={false}
              bordered
              locale={{ emptyText: <div style={{ padding: '30px' }}><Text type="secondary">No materials listed for transfer. Click "Add Item Row" to begin.</Text></div> }}
            />
          </SectionCard>
        </div>

        <Card style={actionCardStyle}>
          <div style={flexBetweenStyle}>
            <Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: '8px' }} />
              Ensure stock availability in source warehouse before submitting.
            </Text>
            {!id && (
              <Space size="middle">
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
      </Form>
    </PageContainer>
  )
}

export default STNForm
