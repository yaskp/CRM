import { useState, useEffect } from 'react'
import { Form, Button, Card, App, Select, Input, InputNumber, Space, Table, Typography, Divider, Checkbox } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  SafetyCertificateOutlined,
  ProjectOutlined,
  WalletOutlined,
  InfoCircleOutlined,
  TagOutlined,
  PercentageOutlined,
  FileTextOutlined,
  PrinterOutlined
} from '@ant-design/icons'
import { FileUpload } from '../../components/common/FileUpload'
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom'
import { workOrderService } from '../../services/api/workOrders'
import { quotationService } from '../../services/api/quotations'
import { workItemTypeService } from '../../services/api/workItemTypes'
import { projectService } from '../../services/api/projects'
import { vendorService } from '../../services/api/vendors'
import { clientService } from '../../services/api/clients'
import { annexureService } from '../../services/api/annexures'
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
  work_item_type_id?: number
  description?: string
  quantity: number
  unit: string
  rate: number
  amount: number
}

const WorkOrderForm = () => {
  const { message: msg } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [items, setItems] = useState<WorkOrderItem[]>([])
  const [workItemTypes, setWorkItemTypes] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [annexures, setAnnexures] = useState<any[]>([])
  const [clientInfo, setClientInfo] = useState<any>(null)
  const [scopeMatrix, setScopeMatrix] = useState<any[]>([])
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { id } = useParams<{ id: string }>()
  const quotationId = searchParams.get('quotation_id')

  useEffect(() => {
    fetchProjects()
    fetchWorkItemTypes()
    fetchVendors()
    fetchAnnexures()
    if (id) {
      fetchWorkOrder()
    } else if (quotationId) {
      fetchQuotationDetails(Number(quotationId))
    } else if (location.state?.project_id) {
      form.setFieldsValue({ project_id: location.state.project_id })
      fetchClientFromProject(location.state.project_id)
      fetchLatestQuotationForProject(location.state.project_id)
    }
  }, [id, location.state])

  const fetchLatestQuotationForProject = async (projectId: number) => {
    try {
      const qRes = await quotationService.getQuotations({ project_id: projectId, limit: 10 })
      const quotations = qRes.quotations || []
      const active = quotations.find((q: any) => ['accepted', 'accepted_by_party', 'approved'].includes(q.status))
        || quotations[0]

      if (active) {
        fetchQuotationDetails(active.id)
      }
    } catch (error) {
      console.error('Failed to fetch latest quotation for project')
    }
  }

  const fetchQuotationDetails = async (qId: number) => {
    try {
      const response = await quotationService.getQuotation(qId)
      const q = response.quotation

      if (q) {
        const projId = q.lead?.project_id || q.project_id
        if (projId) {
          form.setFieldsValue({ project_id: projId })
          fetchClientFromProject(projId)
        }

        form.setFieldsValue({
          payment_terms: q.payment_terms,
          discount_percentage: q.discount_percentage,
          remarks: q.remarks
        })

        if (q.items && q.items.length > 0) {
          const woItems = q.items.map((item: any) => ({
            work_item_type_id: item.work_item_type_id,
            item_type: item.item_type || 'Other',
            category: item.item_type === 'material' ? 'material' : 'labour',
            description: item.description,
            quantity: Number(item.quantity),
            unit: item.unit,
            rate: Number(item.rate),
            amount: Number(item.amount)
          }))
          setItems(woItems)

          msg.success(`Loaded ${woItems.length} items from quotation`)
        }

        if (q.client_scope || q.contractor_scope || q.terms_conditions || q.annexure) {
          form.setFieldsValue({
            terms_conditions: q.terms_conditions || (q.annexure?.clauses?.join('\n') || '')
          })
        }

        // Load scope_matrix from quotation if available
        if (q.scope_matrix && Array.isArray(q.scope_matrix)) {
          setScopeMatrix(q.scope_matrix.map((it: any, idx: number) => ({ ...it, key: it.key || Date.now() + idx })))
        }
      }
    } catch (error) {
      msg.error('Failed to load quotation details')
    }
  }

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
      const response = await vendorService.getVendors({})
      setVendors(response.vendors || [])
    } catch (error) {
      console.error('Failed to fetch vendors')
    }
  }

  const fetchAnnexures = async () => {
    try {
      const response = await annexureService.getAnnexures()
      setAnnexures(response.annexures || [])
    } catch (error) {
      console.error('Failed to fetch annexures')
    }
  }

  const applyTemplate = (id: number, field: string) => {
    const found = annexures.find(a => a.id === id);
    if (found && found.clauses && found.clauses.length > 0) {
      const numberedClauses = found.clauses.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n');
      form.setFieldsValue({ [field]: numberedClauses });
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

      const parsedItems = (wo.items || []).map((item: any) => ({
        ...item,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        amount: Number(item.amount)
      }))
      setItems(parsedItems)

      // Load scope_matrix
      if (wo.scope_matrix && Array.isArray(wo.scope_matrix)) {
        setScopeMatrix(wo.scope_matrix.map((it: any, idx: number) => ({ ...it, key: it.key || Date.now() + idx })))
      }
    } catch (error: any) {
      msg.error(error.response?.data?.message || 'Failed to fetch work order')
    }
  }

  const addItem = () => {
    setItems([...items, {
      work_item_type_id: workItemTypes[0]?.id,
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
      newItems[index].amount = Number(newItems[index].quantity || 0) * Number(newItems[index].rate || 0)
    }
    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  }

  const onFinish = async (values: any) => {
    if (items.length === 0) {
      msg.error('Please add at least one work order item')
      return
    }

    setLoading(true)
    try {
      const discount = values.discount_percentage || 0

      const data = {
        project_id: values.project_id,
        vendor_id: values.vendor_id || null,
        work_order_date: new Date().toISOString(),
        items: items.map(item => ({
          work_item_type_id: item.work_item_type_id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || 'LS',
          rate: item.rate,
        })),
        discount_percentage: discount,
        payment_terms: values.payment_terms,
        scope_matrix: scopeMatrix,
        terms_conditions: values.terms_conditions,
        po_wo_document_url: values.po_wo_document_url,
        status: values.status,
      }

      if (id) {
        await workOrderService.updateWorkOrder(Number(id), data)
        msg.success('Work order updated successfully!')
      } else {
        await workOrderService.createWorkOrder(data)
        msg.success('Work order created successfully!')
      }
      navigate('/operations/work-orders')
    } catch (error: any) {
      msg.error(error.response?.data?.message || 'Failed to save work order')
    } finally {
      setLoading(false)
    }
  }

  const itemColumns: ColumnsType<WorkOrderItem & { index: number }> = [
    {
      title: 'Work Type',
      dataIndex: 'work_item_type_id',
      width: '20%',
      render: (value, _, index) => (
        <Select
          value={value}
          onChange={(val) => updateItem(index, 'work_item_type_id', val)}
          style={{ width: '100%' }}
          size="large"
          showSearch
          optionFilterProp="children"
          placeholder="Select work type"
        >
          {workItemTypes.map((type) => (
            <Option key={type.id} value={type.id}>
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
          controls={false}
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
          controls={false}
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

                  {(() => {
                    const keyContact = clientInfo.contacts?.find((c: any) => c.is_primary)
                      || clientInfo.contacts?.[0]

                    const contactName = keyContact?.contact_name || clientInfo.contact_person
                    const contactPhone = keyContact?.phone || clientInfo.phone
                    const contactEmail = keyContact?.email || clientInfo.email

                    return (
                      <>
                        {contactName && <Text type="secondary">Contact: {contactName}</Text>}
                        {contactPhone && <Text type="secondary">Phone: {contactPhone}</Text>}
                        {contactEmail && <Text type="secondary">Email: {contactEmail}</Text>}
                      </>
                    )
                  })()}
                </div>
              </InfoCard>
            )}

            <Form.Item
              label={<span style={getLabelStyle()}>Subcontractor / Vendor (Optional)</span>}
              name="vendor_id"
              extra="Associate this work order with a specific vendor to track subcontracted costs."
            >
              <Select
                placeholder="Select subcontractor/vendor if applicable"
                size="large"
                style={largeInputStyle}
                showSearch
                allowClear
                optionFilterProp="children"
              >
                {vendors.map((vendor) => (
                  <Option key={vendor.id} value={vendor.id}>
                    {vendor.name} - {vendor.vendor_type}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </SectionCard>

          <SectionCard title="Financial Controls" icon={<WalletOutlined />}>
            <Form.Item label={<span style={getLabelStyle()}>Contract Discount (%)</span>} name="discount_percentage">
              <InputNumber
                style={{ width: '100%', ...largeInputStyle }}
                min={0}
                max={100}
                controls={false}
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
          >
            <Table
              columns={itemColumns}
              dataSource={items.map((item, index) => ({ ...item, index, key: index }))}
              pagination={false}
              bordered
              locale={{ emptyText: <div style={{ padding: '30px' }}><Text type="secondary">No work items defined. Click "Add Work Item" to start.</Text></div> }}
              summary={() => (
                <Table.Summary>
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
            <Button
              type="dashed"
              onClick={addItem}
              block
              icon={<PlusOutlined />}
              style={{ marginTop: 16 }}
            >
              Add Work Item
            </Button>
          </SectionCard>
        </div>

        <div style={{ marginTop: theme.spacing.lg }}>
          <SectionCard title="Terms & Conditions" icon={<FileTextOutlined />}>
            {/* SCOPE MATRIX - Read-only, loaded from Quotation */}
            {scopeMatrix.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text strong>Scope Matrix</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>(loaded from quotation — read-only)</Text>
                </div>
                <Table
                  dataSource={scopeMatrix}
                  pagination={false}
                  size="small"
                  bordered
                  rowKey="key"
                  columns={[
                    {
                      title: 'Description of Item',
                      dataIndex: 'description',
                      render: (text: string, record: any) => (
                        <span style={{ fontWeight: record.is_category ? 'bold' : 'normal', fontSize: record.is_category ? 15 : 14 }}>
                          {text}
                        </span>
                      )
                    },
                    {
                      title: 'Client',
                      key: 'client_scope',
                      width: 80,
                      align: 'center' as const,
                      render: (_: any, record: any) => !record.is_category && (
                        <Checkbox checked={record.client_scope} disabled />
                      )
                    },
                    {
                      title: 'VHSHRI',
                      key: 'contractor_scope',
                      width: 80,
                      align: 'center' as const,
                      render: (_: any, record: any) => !record.is_category && (
                        <Checkbox checked={record.contractor_scope} disabled />
                      )
                    },
                    {
                      title: 'Remarks',
                      dataIndex: 'remarks',
                      width: 200,
                      render: (text: string, record: any) => !record.is_category && (
                        <Text type="secondary">{text}</Text>
                      )
                    },
                  ]}
                />
              </div>
            )}

            <Divider />

            <div style={twoColumnGridStyle}>
              <Form.Item label={<span style={getLabelStyle()}>Terms & Conditions</span>}>
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'flex-end' }}>
                  <Select placeholder="Select from Master" style={{ width: 200 }} onChange={(val) => applyTemplate(val, 'terms_conditions')} allowClear>
                    {annexures.filter(a => a.type === 'general_terms' || a.type === 'terms_conditions' || a.name.includes('Terms')).map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
                  </Select>
                </div>
                <Form.Item name="terms_conditions" noStyle>
                  <TextArea rows={6} placeholder="Standard terms..." style={largeInputStyle} />
                </Form.Item>
              </Form.Item>

              <Form.Item label={<span style={getLabelStyle()}>Payment Schedule & Terms</span>}>
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'flex-end' }}>
                  <Select placeholder="Select from Master" style={{ width: 200 }} onChange={(val) => applyTemplate(val, 'payment_terms')} allowClear>
                    {annexures.filter(a => a.type === 'payment_terms').map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
                  </Select>
                </div>
                <Form.Item name="payment_terms" noStyle>
                  <TextArea rows={6} placeholder="Payment schedule..." style={largeInputStyle} />
                </Form.Item>
              </Form.Item>
            </div>

            <Form.Item label={<span style={getLabelStyle()}>Signed Work Order (PDF/Image)</span>} name="po_wo_document_url">
              <FileUpload folder="work_orders" placeholder="Upload Signed Copy" />
            </Form.Item>

            <Form.Item label={<span style={getLabelStyle()}>Remarks / Notes</span>} name="remarks">
              <TextArea rows={4} placeholder="Additional notes or special instructions..." style={largeInputStyle} />
            </Form.Item>
          </SectionCard>
        </div>

        <Card style={actionCardStyle}>
          <div style={flexBetweenStyle}>
            <Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: '8px' }} />
              Authorized work orders trigger procurement and financial tracking.
            </Text>
            <Space size="middle">
              {id && (
                <Button
                  icon={<PrinterOutlined />}
                  onClick={() => window.open(`/operations/work-orders/${id}/print`, '_blank')}
                  size="large"
                  style={getSecondaryButtonStyle()}
                >
                  Print Order
                </Button>
              )}
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
