import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, DatePicker, InputNumber, Table, Space, Row, Col, Typography } from 'antd'
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
  HomeOutlined,
  CalendarOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  BarcodeOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import { materialService } from '../../services/api/materials'
import { useForm } from 'react-hook-form'
import { warehouseService } from '../../services/api/warehouses'
import { grnSchema, GRNFormData } from '../../utils/validationSchemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller } from 'react-hook-form'
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
      width: '30%',
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
      width: '15%',
      render: (_: any, record: GRNItem, index: number) => (
        <InputNumber
          style={{ width: '100%' }}
          placeholder="Qty"
          value={record.quantity}
          min={0}
          step={0.01}
          onChange={(value) => updateItem(index, 'quantity', value || 0)}
          size="large"
        />
      ),
    },
    {
      title: 'Rate (₹)',
      key: 'unit_price',
      width: '15%',
      render: (_: any, record: GRNItem, index: number) => (
        <InputNumber
          style={{ width: '100%' }}
          placeholder="Price"
          value={record.unit_price}
          min={0}
          step={0.01}
          onChange={(value) => updateItem(index, 'unit_price', value || undefined)}
          size="large"
          prefix={<DollarOutlined style={{ color: theme.colors.neutral.gray400 }} />}
        />
      ),
    },
    {
      title: 'Batch / Expiry',
      key: 'batch_expiry',
      render: (_: any, record: GRNItem, index: number) => (
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Input
            placeholder="Batch #"
            value={record.batch_number}
            onChange={(e) => updateItem(index, 'batch_number', e.target.value)}
            size="middle"
            prefix={<BarcodeOutlined style={{ color: theme.colors.neutral.gray400 }} />}
          />
          <DatePicker
            style={{ width: '100%' }}
            placeholder="Expiry"
            value={record.expiry_date ? dayjs(record.expiry_date) : null}
            onChange={(date) => updateItem(index, 'expiry_date', date ? date.format('YYYY-MM-DD') : undefined)}
            size="middle"
          />
        </Space>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: any, record: GRNItem, index: number) => (
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
    <PageContainer maxWidth={1200}>
      <PageHeader
        title={id ? 'View GRN Details' : 'Create New GRN'}
        subtitle={id ? `Reference: #GRN-${id}` : 'Record material receipts from vendors or other projects'}
        icon={<FileTextOutlined />}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={twoColumnGridStyle}>
          <SectionCard title="Receipt Information" icon={<InboxOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Destination Warehouse</span>}
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
                    placeholder="Where is material being received?"
                    showSearch
                    optionFilterProp="children"
                    size="large"
                    style={largeInputStyle}
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

            <Form.Item
              label={<span style={getLabelStyle()}>Receipt Date</span>}
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
                    style={{ width: '100%', ...largeInputStyle }}
                    format="DD-MMM-YYYY"
                    size="large"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                  />
                )}
              />
            </Form.Item>
          </SectionCard>

          <SectionCard title="Additional Notes" icon={<FileTextOutlined />}>
            <Form.Item label={<span style={getLabelStyle()}>Receipt Remarks</span>}>
              <Controller
                name="remarks"
                control={control}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    rows={4}
                    placeholder="Enter delivery note details, vehicle number, or other info..."
                    style={largeInputStyle}
                  />
                )}
              />
            </Form.Item>
            <InfoCard title="💡 Stock Update">
              Once approved, the quantity will be immediately added to the selected warehouse stock.
            </InfoCard>
          </SectionCard>
        </div>

        <div style={{ marginTop: theme.spacing.lg }}>
          <SectionCard
            title="Material Items"
            icon={<BarcodeOutlined />}
            extra={
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addItem}
                style={{ borderRadius: '6px' }}
              >
                Add Material Row
              </Button>
            }
          >
            <Table
              columns={itemColumns}
              dataSource={items}
              rowKey={(_, index) => index.toString()}
              pagination={false}
              bordered
              locale={{ emptyText: <div style={{ padding: '30px' }}><Text type="secondary">No items added. Click "Add Material Row" to continue.</Text></div> }}
            />
            {errors.items && (
              <div style={{ color: theme.colors.error.main, marginTop: 8 }}>{errors.items.message}</div>
            )}
          </SectionCard>
        </div>

        <Card style={actionCardStyle}>
          <div style={flexBetweenStyle}>
            <Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: '8px' }} />
              Make sure to verify physical quantity before submitting.
            </Text>
            <Space size="middle">
              <Button
                onClick={() => navigate('/inventory/grn')}
                size="large"
                style={getSecondaryButtonStyle()}
              >
                Cancel
              </Button>
              {!id && (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large"
                  style={getPrimaryButtonStyle()}
                >
                  Create & Save GRN
                </Button>
              )}
            </Space>
          </div>
        </Card>
      </form>
    </PageContainer>
  )
}

export default GRNForm
