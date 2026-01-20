import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, DatePicker, InputNumber, Table, Space, Row, Col, Typography, Radio } from 'antd'
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  BarcodeOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import { materialService } from '../../services/api/materials'
import { useForm } from 'react-hook-form'
import { warehouseService } from '../../services/api/warehouses'
import { projectService } from '../../services/api/projects'
import { vendorService } from '../../services/api/vendors'
import { purchaseOrderService } from '../../services/api/purchaseOrders'
import { grnSchema, GRNFormData } from '../../utils/validationSchemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller } from 'react-hook-form'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import {
  getPrimaryButtonStyle,
  getSecondaryButtonStyle,
  largeInputStyle,
  flexBetweenStyle,
  actionCardStyle,
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

  // Master Data
  const [materials, setMaterials] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [filteredPOs, setFilteredPOs] = useState<any[]>([])
  const [activeVendorIds, setActiveVendorIds] = useState<Set<number>>(new Set())

  const [items, setItems] = useState<GRNItem[]>([])

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<GRNFormData>({
    resolver: zodResolver(grnSchema),
    defaultValues: {
      transaction_date: dayjs().format('YYYY-MM-DD'),
      received_from_type: 'vendor',
      items: [],
    },
  })

  // Watch for source changes
  const receivedFromType = watch('received_from_type')
  const receivedFromId = watch('received_from_id')

  useEffect(() => {
    fetchMetadata()
    if (id) {
      fetchGRN()
    }
  }, [id])

  useEffect(() => {
    // Filter POs when source (vendor/project) changes
    if (receivedFromType === 'vendor' && receivedFromId) {
      const relatedPOs = purchaseOrders.filter(po =>
        Number(po.vendor_id) === Number(receivedFromId) &&
        (po.status === 'approved' || po.status === 'Approved')
      )
      setFilteredPOs(relatedPOs)
    } else {
      setFilteredPOs([])
    }
  }, [receivedFromType, receivedFromId, purchaseOrders])

  useEffect(() => {
    // Extract vendor IDs who have Approved POs
    if (purchaseOrders.length > 0) {
      const vIds = new Set(
        purchaseOrders
          .filter(po => po.status === 'approved' || po.status === 'Approved')
          .map(po => Number(po.vendor_id))
      )
      setActiveVendorIds(vIds)
    }
  }, [purchaseOrders])

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
      setPurchaseOrders(poRes.purchaseOrders || poRes || []) // Handle potential response variations
    } catch (error) {
      message.error('Failed to load metadata')
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
      setValue('received_from_type', grn.received_from_type || 'vendor')
      setValue('received_from_id', grn.received_from_id)
      setValue('reference_number', grn.reference_number)
      setValue('po_id', grn.po_id)

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

  const handlePOSelect = (poId: number) => {
    const po = purchaseOrders.find(p => p.id === poId)
    if (po && po.items) {
      // Auto-populate items from PO
      const poItems = po.items.map((item: any) => ({
        material_id: item.material_id,
        material_name: item.material?.name, // careful if material didn't populate
        quantity: Number(item.quantity), // Default to remaining? For now total
        unit_price: Number(item.unit_price)
      }))
      setItems(poItems)
      setValue('items', poItems)
      message.info('Items loaded from Purchase Order')
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
        // Ensure optional fields are sent
        destination_type: data.destination_type,
        destination_id: data.destination_id,
        received_from_type: data.received_from_type,
        received_from_id: data.received_from_id,
        reference_number: data.reference_number,
        po_id: data.po_id || undefined // Ensure null becomes undefined
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
          placeholder="Select"
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
          prefix={<DollarOutlined />}
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
            prefix={<BarcodeOutlined />}
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
      key: 'action',
      render: (_: any, record: any, index: number) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeItem(index)} />
      )
    }
  ]

  return (
    <PageContainer maxWidth={1200}>
      <PageHeader
        title={id ? 'View GRN Details' : 'New Goods Receipt Note (GRN)'}
        subtitle={id ? `Reference: #GRN-${id}` : 'Record material receipts against POs or transfers'}
        icon={<FileTextOutlined />}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Top Section: Header Info */}
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <SectionCard title="Receipt Source" icon={<UserOutlined />}>
              <Form.Item label="Received From Type">
                <Controller
                  name="received_from_type"
                  control={control}
                  render={({ field }) => (
                    <Radio.Group {...field} buttonStyle="solid">
                      <Radio.Button value="vendor">External Vendor</Radio.Button>
                      <Radio.Button value="project">Internal Project</Radio.Button>
                    </Radio.Group>
                  )}
                />
              </Form.Item>

              <Form.Item label={receivedFromType === 'vendor' ? "Select Vendor" : "Select Origin Project"}>
                <Controller
                  name="received_from_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      size="large"
                      style={largeInputStyle}
                      placeholder="Select source..."
                      showSearch
                      optionFilterProp="children"
                    >
                      {receivedFromType === 'vendor'
                        ? vendors.filter(v => activeVendorIds.has(v.id)).map(v => <Option key={v.id} value={v.id}>{v.name}</Option>)
                        : projects.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)
                      }
                    </Select>
                  )}
                />
              </Form.Item>

              {receivedFromType === 'vendor' && (
                <Form.Item label="Link Purchase Order (Optional)">
                  <Controller
                    name="po_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        size="large"
                        style={largeInputStyle}
                        placeholder="Select PO to populate items"
                        onChange={(val) => {
                          field.onChange(val)
                          handlePOSelect(val)
                        }}
                        allowClear
                      >
                        {filteredPOs.map((po: any) => (
                          <Option key={po.id} value={po.id}>{po.po_number || po.temp_number} - ₹{Number(po.total_amount).toLocaleString()}</Option>
                        ))}
                      </Select>
                    )}
                  />
                </Form.Item>
              )}
            </SectionCard>
          </Col>

          <Col xs={24} lg={12}>
            <SectionCard title="Receipt Details" icon={<InboxOutlined />}>
              <Form.Item label="Destination Type">
                <Radio.Group
                  value={watch('destination_type') || 'warehouse'}
                  onChange={(e) => {
                    setValue('destination_type', e.target.value)
                    setValue('destination_id', 0) // Reset ID
                  }}
                  buttonStyle="solid"
                >
                  <Radio.Button value="warehouse">Receive at Warehouse</Radio.Button>
                  <Radio.Button value="project">Direct to Project Site</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item label={watch('destination_type') === 'project' ? "Select Destination Project" : "Destination Warehouse"} required>
                <Controller
                  name="destination_id"
                  control={control}
                  rules={{ required: 'Destination is required' }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      placeholder={watch('destination_type') === 'project' ? "Select Project..." : "Select Warehouse..."}
                      size="large"
                      style={largeInputStyle}
                      showSearch
                      optionFilterProp="children"
                    >
                      {watch('destination_type') === 'project'
                        ? projects.map((p) => <Option key={p.id} value={p.id}>{p.name}</Option>)
                        : warehouses.map((wh) => <Option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</Option>)
                      }
                    </Select>
                  )}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Receipt Date" required>
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
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Ref No. (DC/Invoice)">
                    <Controller
                      name="reference_number"
                      control={control}
                      render={({ field }) => <Input {...field} size="large" placeholder="Invoice #" style={largeInputStyle} />}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Remarks">
                <Controller
                  name="remarks"
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      {...field}
                      rows={2}
                      placeholder="Vehicle no, unloading details..."
                    />
                  )}
                />
              </Form.Item>
            </SectionCard>
          </Col>
        </Row>

        <div style={{ marginTop: theme.spacing.lg }}>
          <SectionCard
            title="Received Items"
            icon={<BarcodeOutlined />}
            extra={
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addItem}
                style={{ borderRadius: '6px' }}
              >
                Add Item
              </Button>
            }
          >
            <Table
              columns={itemColumns}
              dataSource={items}
              rowKey={(_, index) => (index || 0).toString()}
              pagination={false}
              bordered
              scroll={{ x: 800 }}
              locale={{ emptyText: <div style={{ padding: '30px' }}><Text type="secondary">No items. Select a PO or add manually.</Text></div> }}
            />
          </SectionCard>
        </div>

        <Card style={actionCardStyle}>
          <div style={{ ...flexBetweenStyle, flexWrap: 'wrap', gap: theme.spacing.md }}>
            <Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: '8px' }} />
              Verifying physical integrity is mandatory before saving.
            </Text>
            <Space size="middle" wrap>
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
