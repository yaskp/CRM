import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, DatePicker, InputNumber, Table, Space, Row, Col, Typography } from 'antd'
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  RollbackOutlined,
  HomeOutlined,
  ProjectOutlined,
  CalendarOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  BarcodeOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { storeTransactionService, SRNItem } from '../../services/api/storeTransactions'
import { materialService } from '../../services/api/materials'
import { warehouseService } from '../../services/api/warehouses'
import { projectService } from '../../services/api/projects'
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

interface SRNFormItem extends SRNItem {
  id?: number
  material_name?: string
}

const SRNForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [materials, setMaterials] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [items, setItems] = useState<SRNFormItem[]>([])

  useEffect(() => {
    fetchMaterials()
    fetchWarehouses()
    fetchProjects()
    if (id) {
      fetchSRN()
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

  const fetchProjects = async () => {
    try {
      const response = await projectService.getProjects({ limit: 100 })
      setProjects(response.projects || [])
    } catch (error) {
      message.error('Failed to fetch projects')
    }
  }

  const fetchSRN = async () => {
    setLoading(true)
    try {
      const response = await storeTransactionService.getTransaction(Number(id))
      const srn = response.transaction
      form.setFieldsValue({
        warehouse_id: srn.warehouse_id,
        project_id: srn.project_id,
        transaction_date: dayjs(srn.transaction_date),
        remarks: srn.remarks,
      })
      setItems(srn.items?.map((item: any) => ({
        material_id: item.material_id,
        material_name: item.material?.name,
        quantity: Number(item.quantity),
      })) || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch SRN')
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

  const updateItem = (index: number, field: keyof SRNFormItem, value: any) => {
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

    setLoading(true)
    try {
      const payload = {
        warehouse_id: values.warehouse_id,
        project_id: values.project_id,
        transaction_date: values.transaction_date.format('YYYY-MM-DD'),
        remarks: values.remarks,
        items: items.map(item => ({
          material_id: item.material_id,
          quantity: item.quantity,
        })),
      }

      await storeTransactionService.createSRN(payload)
      message.success('SRN created successfully!')
      navigate('/inventory/srn')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save SRN')
    } finally {
      setLoading(false)
    }
  }

  const itemColumns = [
    {
      title: 'Material / Product',
      key: 'material',
      width: '60%',
      render: (_: any, record: SRNFormItem, index: number) => (
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
      width: '30%',
      render: (_: any, record: SRNFormItem, index: number) => (
        <InputNumber
          style={{ width: '100%' }}
          placeholder="Return Qty"
          value={record.quantity}
          min={0}
          step={0.01}
          onChange={(value) => updateItem(index, 'quantity', value || 0)}
          size="large"
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: any, record: SRNFormItem, index: number) => (
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
        title={id ? 'Stock Return Details' : 'Create Stock Return (SRN)'}
        subtitle={id ? `Reference: #SRN-${id}` : 'Record materials returned from project sites to the main warehouse'}
        icon={<RollbackOutlined />}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        disabled={!!id}
      >
        <div style={twoColumnGridStyle}>
          <SectionCard title="Return Information" icon={<RollbackOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Return From (Project)</span>}
              name="project_id"
              rules={[{ required: true, message: 'Please select project!' }]}
            >
              <Select
                placeholder="Which project is returning materials?"
                showSearch
                optionFilterProp="children"
                size="large"
                style={largeInputStyle}
                suffixIcon={<ProjectOutlined />}
              >
                {projects.map((project) => (
                  <Option key={project.id} value={project.id}>
                    {project.project_code} - {project.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Return To (Warehouse)</span>}
              name="warehouse_id"
              rules={[{ required: true, message: 'Please select warehouse!' }]}
            >
              <Select
                placeholder="Which warehouse is receiving materials?"
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

          <SectionCard title="Logistics & Timeline" icon={<FileTextOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Return Date</span>}
              name="transaction_date"
              rules={[{ required: true, message: 'Please select transaction date!' }]}
            >
              <DatePicker style={{ width: '100%', ...largeInputStyle }} format="DD-MMM-YYYY" size="large" />
            </Form.Item>

            <Form.Item label={<span style={getLabelStyle()}>Remarks / Reason</span>} name="remarks">
              <TextArea rows={4} placeholder="Excess material, damaged, or project completion..." style={largeInputStyle} />
            </Form.Item>

            <InfoCard title="💡 Stock Impact">
              Materials will be added back to inventory stock only after the return note is approved.
            </InfoCard>
          </SectionCard>
        </div>

        <div style={{ marginTop: theme.spacing.lg }}>
          <SectionCard
            title="Materials to Return"
            icon={<BarcodeOutlined />}
            extra={
              !id && (
                <Button type="dashed" icon={<PlusOutlined />} onClick={addItem} style={{ borderRadius: '6px' }}>
                  Add Material Row
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
              locale={{ emptyText: <div style={{ padding: '30px' }}><Text type="secondary">No materials listed for return. Click "Add Material Row" to begin.</Text></div> }}
            />
          </SectionCard>
        </div>

        <Card style={actionCardStyle}>
          <div style={flexBetweenStyle}>
            <Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: '8px' }} />
              Ensure physical materials are verified at the receiving store.
            </Text>
            {!id && (
              <Space size="middle">
                <Button onClick={() => navigate('/inventory/srn')} size="large" style={getSecondaryButtonStyle()}>
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
                  Create Return Note
                </Button>
              </Space>
            )}
          </div>
        </Card>
      </Form>
    </PageContainer>
  )
}

export default SRNForm
