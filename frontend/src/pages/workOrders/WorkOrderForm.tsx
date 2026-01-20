import { useState, useEffect } from 'react'
import { Form, Button, Card, message, Select, Input, InputNumber, Space, Table, Typography } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  SafetyCertificateOutlined,
  ProjectOutlined,
  WalletOutlined,
  InfoCircleOutlined,
  TagOutlined,
  PercentageOutlined
} from '@ant-design/icons'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { workOrderService } from '../../services/api/workOrders'
import { workItemTypeService } from '../../services/api/workItemTypes'
import { projectService } from '../../services/api/projects'
import { vendorService } from '../../services/api/vendors'
import { clientService } from '../../services/api/clients'
import type { ColumnsType } from 'antd/es/table'
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

const { Option } = Select
const { TextArea } = Input
const { Text } = Typography

interface WorkOrderItem {
  item_type: string
  description?: string
  quantity: number
  unit: string
  rate: number
  amount: number
}

const WorkOrderForm = () => {
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [items, setItems] = useState<WorkOrderItem[]>([])
  const [workItemTypes, setWorkItemTypes] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [isSubcontract, setIsSubcontract] = useState(false)
  const [clientInfo, setClientInfo] = useState<any>(null)
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()

  useEffect(() => {
    fetchProjects()
    fetchWorkItemTypes()
    fetchVendors()
    if (id) {
      fetchWorkOrder()
    } else if (location.state?.project_id) {
      form.setFieldsValue({ project_id: location.state.project_id })
      fetchClientFromProject(location.state.project_id)
    }
  }, [id, location.state])

  const fetchWorkItemTypes = async () => {
    try {
      const response = await workItemTypeService.getWorkItemTypes()
      setWorkItemTypes(response.data || [])
    } catch (error) {
      console.error('Failed to fetch work item types')
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await projectService.getProjects({ limit: 100 })
      setProjects(response.projects || [])
    } catch (error) {
      console.error('Failed to fetch projects')
    }
  }

  const fetchVendors = async () => {
    try {
      const response = await vendorService.getVendors({ limit: 100 })
      setVendors(response.vendors || [])
    } catch (error) {
      console.error('Failed to fetch vendors')
    }
  }

  const fetchClientFromProject = async (projectId: number) => {
    try {
      const project = projects.find(p => p.id === projectId)
      if (project && project.client_id) {
        const response = await clientService.getClient(project.client_id)
        setClientInfo(response.client)
      } else {
        setClientInfo(null)
      }
    } catch (error) {
      console.error('Failed to fetch client info')
      setClientInfo(null)
    }
  }

  const onProjectChange = (projectId: number) => {
    fetchClientFromProject(projectId)
  }

  const fetchWorkOrder = async () => {
    try {
      const response = await workOrderService.getWorkOrder(Number(id))
      const wo = response.workOrder
      form.setFieldsValue(wo)
      setItems(wo.items || [])
      if (wo.vendor_id) {
        setIsSubcontract(true)
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch work order')
    }
  }

  const addItem = () => {
    setItems([...items, {
      item_type: 'guide_wall',
      quantity: 0,
      unit: 'meter',
      rate: 0,
      amount: 0,
    }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof WorkOrderItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate
    }
    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0)
  }

  const onFinish = async (values: any) => {
    if (items.length === 0) {
      message.error('Please add at least one work order item')
      return
    }

    setLoading(true)
    try {
      const discount = values.discount_percentage || 0

      const data = {
        project_id: values.project_id,
        vendor_id: isSubcontract ? values.vendor_id : null,
        work_order_date: new Date().toISOString(),
        items: items.map(item => ({
          item_type: item.item_type,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
        })),
        discount_percentage: discount,
        payment_terms: values.payment_terms,
        status: values.status,
      }

      if (id) {
        await workOrderService.updateWorkOrder(Number(id), data)
        message.success('Work order updated successfully!')
      } else {
        await workOrderService.createWorkOrder(data)
        message.success('Work order created successfully!')
      }
      navigate('/operations/work-orders')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save work order')
    } finally {
      setLoading(false)
    }
  }

  const itemColumns: ColumnsType<WorkOrderItem & { index: number }> = [
    {
      title: 'Work Type',
      dataIndex: 'item_type',
      width: '20%',
      render: (value, _, index) => (
        <Select
          value={value}
          onChange={(val) => updateItem(index, 'item_type', val)}
          style={{ width: '100%' }}
          size="large"
          showSearch
          optionFilterProp="children"
          placeholder="Select work type"
        >
          {workItemTypes.map((type) => (
            <Option key={type.id} value={type.name}>
              {type.name}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      width: '25%',
      render: (value, _, index) => (
        <Input
          value={value}
          onChange={(e) => updateItem(index, 'description', e.target.value)}
          placeholder="Detailed specs"
          size="large"
        />
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      width: '12%',
      render: (value, _, index) => (
        <InputNumber
          value={value}
          onChange={(val) => updateItem(index, 'quantity', val || 0)}
          min={0}
          style={{ width: '100%' }}
          size="large"
          placeholder="0"
        />
      ),
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      width: '10%',
      render: (value, _, index) => (
        <Input
          value={value}
          onChange={(e) => updateItem(index, 'unit', e.target.value)}
          placeholder="UoM"
          size="large"
        />
      ),
    },
    {
      title: 'Rate (₹)',
      dataIndex: 'rate',
      width: '15%',
      render: (value, _, index) => (
        <InputNumber
          value={value}
          onChange={(val) => updateItem(index, 'rate', val || 0)}
          min={0}
          prefix="₹"
          style={{ width: '100%' }}
          size="large"
          placeholder="0.00"
        />
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      width: '15%',
      align: 'right' as const,
      render: (amount: number) => <Text strong>₹{amount?.toLocaleString('en-IN') || 0}</Text>,
    },
    {
      title: '',
      width: 50,
      render: (_1: any, _2: any, index: number) => (
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
        title={id ? 'Edit Work Order' : 'Create Work Order'}
        subtitle={id ? `Reference: WO#${id}` : 'Issue a new contract or service order for a specific project task'}
        icon={<SafetyCertificateOutlined />}
      />

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="status" hidden>
          <Input />
        </Form.Item>
        <div style={twoColumnGridStyle}>
          <SectionCard title="Order Authorization" icon={<ProjectOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Assigned Project</span>}
              name="project_id"
              rules={[{ required: true, message: 'Please select a project!' }]}
            >
              <Select
                placeholder="Select project"
                disabled={!!id}
                size="large"
                style={largeInputStyle}
                showSearch
                onChange={onProjectChange}
                optionFilterProp="children"
              >
                {projects.map((project) => (
                  <Option key={project.id} value={project.id}>
                    {project.project_code} - {project.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {clientInfo && (
              <InfoCard title="💼 Client Information">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text strong style={{ fontSize: 16 }}>{clientInfo.company_name}</Text>
                  <Text type="secondary">Client Code: {clientInfo.client_code}</Text>
                  {clientInfo.contact_person && <Text type="secondary">Contact: {clientInfo.contact_person}</Text>}
                  {clientInfo.phone && <Text type="secondary">Phone: {clientInfo.phone}</Text>}
                </div>
              </InfoCard>
            )}

            <Form.Item label={<span style={getLabelStyle()}>Work Order Type</span>}>
              <Select
                value={isSubcontract ? 'subcontract' : 'internal'}
                onChange={(val) => {
                  setIsSubcontract(val === 'subcontract')
                  if (val === 'internal') {
                    form.setFieldsValue({ vendor_id: undefined })
                  }
                }}
                size="large"
                style={largeInputStyle}
              >
                <Option value="internal">Internal Team</Option>
                <Option value="subcontract">Subcontractor/Vendor</Option>
              </Select>
            </Form.Item>

            {isSubcontract && (
              <Form.Item
                label={<span style={getLabelStyle()}>Subcontractor/Vendor</span>}
                name="vendor_id"
                rules={[{ required: true, message: 'Please select a vendor!' }]}
              >
                <Select
                  placeholder="Select vendor"
                  size="large"
                  style={largeInputStyle}
                  showSearch
                  optionFilterProp="children"
                >
                  {vendors.map((vendor) => (
                    <Option key={vendor.id} value={vendor.id}>
                      {vendor.name} - {vendor.vendor_type}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            <Form.Item label={<span style={getLabelStyle()}>Payment Schedule & Terms</span>} name="payment_terms">
              <TextArea rows={3} placeholder="e.g., 50% advance, 50% on completion..." style={largeInputStyle} />
            </Form.Item>
          </SectionCard>

          <SectionCard title="Financial Controls" icon={<WalletOutlined />}>
            <Form.Item label={<span style={getLabelStyle()}>Contract Discount (%)</span>} name="discount_percentage">
              <InputNumber
                style={{ width: '100%', ...largeInputStyle }}
                min={0}
                max={100}
                size="large"
                placeholder="0"
                prefix={<PercentageOutlined style={prefixIconStyle} />}
              />
            </Form.Item>

            <InfoCard title="💡 Calculation Note">
              Total order value is auto-calculated based on item rates and adjusted with any applicable discount.
            </InfoCard>
          </SectionCard>
        </div>

        <div style={{ marginTop: theme.spacing.lg }}>
          <SectionCard
            title="Scope of Work & Items"
            icon={<TagOutlined />}
            extra={
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addItem}
                style={{ borderRadius: '6px' }}
              >
                Add Work Item
              </Button>
            }
          >
            <Table
              columns={itemColumns}
              dataSource={items.map((item, index) => ({ ...item, index, key: index }))}
              pagination={false}
              bordered
              locale={{ emptyText: <div style={{ padding: '30px' }}><Text type="secondary">No work items defined. Click "Add Work Item" to start.</Text></div> }}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ backgroundColor: theme.colors.neutral.gray50 }}>
                    <Table.Summary.Cell index={0} colSpan={5}>
                      <Text strong>Sub-Total Consumption Value</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong style={{ fontSize: '18px', color: theme.colors.primary.main }}>
                        ₹{calculateTotal().toLocaleString('en-IN')}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} />
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </SectionCard>
        </div>

        <Card style={actionCardStyle}>
          <div style={flexBetweenStyle}>
            <Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: '8px' }} />
              Authorized work orders trigger procurement and financial tracking.
            </Text>
            <Space size="middle">
              <Button
                onClick={() => navigate('/operations/work-orders')}
                size="large"
                style={getSecondaryButtonStyle()}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  form.setFieldsValue({ status: 'draft' })
                  form.submit()
                }}
                size="large"
                style={{ ...getSecondaryButtonStyle(), borderColor: theme.colors.primary.main, color: theme.colors.primary.main }}
              >
                Save as Draft
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  form.setFieldsValue({ status: 'active' })
                  form.submit()
                }}
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
                style={getPrimaryButtonStyle()}
              >
                {id ? 'Update & Authorize' : 'Authorize & Issue Order'}
              </Button>
            </Space>
          </div>
        </Card>
      </Form>
    </PageContainer>
  )
}

export default WorkOrderForm
