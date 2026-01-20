import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, DatePicker, InputNumber, Select, Typography, Table } from 'antd'
import { FileTextOutlined, ContactsOutlined, WalletOutlined, CalendarOutlined, PercentageOutlined, PlusOutlined, DeleteOutlined, TagOutlined } from '@ant-design/icons'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { quotationService } from '../../services/api/quotations'
import { leadService } from '../../services/api/leads'
import { clientService } from '../../services/api/clients'
import { unitService } from '../../services/api/units'
import { materialService } from '../../services/api/materials'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import { largeInputStyle, getLabelStyle, getPrimaryButtonStyle, getSecondaryButtonStyle, flexBetweenStyle, actionCardStyle, prefixIconStyle, twoColumnGridStyle } from '../../styles/styleUtils'

const { Option } = Select
const { Text } = Typography

interface QuotationItem {
  type: 'material' | 'custom'
  material_id?: number
  description: string
  quantity: number
  unit: string
  rate: number
  amount: number
}

const QuotationForm = () => {
  const [loading, setLoading] = useState(false)
  const [leads, setLeads] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [items, setItems] = useState<QuotationItem[]>([])
  const [clientInfo, setClientInfo] = useState<any>(null)
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const sourceId = searchParams.get('source_id')
  const leadIdParam = searchParams.get('lead_id')
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    fetchLeads()
    fetchUnits()
    fetchMaterials()
    if (id) {
      fetchQuotation(Number(id))
    } else if (sourceId) {
      fetchQuotation(Number(sourceId))
    } else if (leadIdParam) {
      form.setFieldsValue({ lead_id: Number(leadIdParam) })
      fetchClientFromLead(Number(leadIdParam))
    }
  }, [id, sourceId, leadIdParam])

  const fetchLeads = async () => {
    try {
      const response = await leadService.getLeads({ limit: 100 })
      setLeads(response.leads || [])
    } catch (error) {
      console.error('Failed to fetch leads')
    }
  }

  const fetchUnits = async () => {
    try {
      const response = await unitService.getUnits()
      const unitsData = Array.isArray(response) ? response : (response?.data || [])
      setUnits(unitsData)
    } catch (error) {
      console.error('Failed to fetch units', error)
      setUnits([])
    }
  }

  const fetchMaterials = async () => {
    try {
      const response = await materialService.getMaterials({ limit: 1000 })
      setMaterials(response.materials || [])
    } catch (error) {
      console.error('Failed to fetch materials')
    }
  }

  const fetchClientFromLead = async (leadId: number) => {
    try {
      const lead = leads.find(l => l.id === leadId)
      if (lead && lead.client_id) {
        const response = await clientService.getClient(lead.client_id)
        setClientInfo(response.client)
      } else {
        setClientInfo(null)
      }
    } catch (error) {
      console.error('Failed to fetch client info')
      setClientInfo(null)
    }
  }

  const onLeadChange = (leadId: number) => {
    fetchClientFromLead(leadId)
  }

  const fetchQuotation = async (quotationId: number) => {
    try {
      const response = await quotationService.getQuotation(quotationId)
      const quotation = response.quotation
      form.setFieldsValue({
        ...quotation,
        valid_till: quotation.valid_until ? dayjs(quotation.valid_until) : undefined,
      })
      if (quotation.items) {
        const loadedItems = quotation.items.map((item: any) => ({
          ...item,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          amount: Number(item.amount),
          material_id: item.material_id ? Number(item.material_id) : undefined
        }))
        setItems(loadedItems)
      }
    } catch (error: any) {
      messageApi.error(error.response?.data?.message || 'Failed to fetch quotation')
    }
  }

  const addItem = () => {
    setItems([...items, {
      type: 'material',
      description: '',
      quantity: 1,
      unit: 'nos',
      rate: 0,
      amount: 0,
    }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = Number(newItems[index].quantity) * Number(newItems[index].rate)
    }
    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  }

  useEffect(() => {
    const total = calculateTotal()
    form.setFieldsValue({ total_amount: total })
  }, [items, form])

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      if (items.length === 0) {
        messageApi.error('Please add at least one item to the quotation')
        setLoading(false)
        return
      }

      const total = calculateTotal()

      const data = {
        lead_id: values.lead_id,
        total_amount: total,
        items: items,
        discount_percentage: values.discount_percentage || 0,
        payment_terms: values.payment_terms,
        valid_until: values.valid_till ? values.valid_till.format('YYYY-MM-DD') : undefined,
      }

      if (id) {
        await quotationService.updateQuotation(Number(id), data)
        messageApi.success('Quotation updated successfully!')
      } else {
        await quotationService.createQuotation(data)
        messageApi.success('Quotation created successfully!')
      }
      navigate('/sales/quotations')
    } catch (error: any) {
      messageApi.error(error.response?.data?.message || 'Failed to save quotation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer maxWidth={1000}>
      {contextHolder}
      <PageHeader
        title={id ? 'Edit Quotation' : sourceId ? 'Create New Version' : 'Create New Quotation'}
        subtitle={id ? 'Update quotation details' : sourceId ? 'Create a new version based on an existing quotation' : 'Generate a new quotation for a lead'}
        icon={<FileTextOutlined />}
      />

      <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
        <SectionCard title="Lead Information" icon={<ContactsOutlined />}>
          <div style={twoColumnGridStyle}>
            <Form.Item
              label={<span style={getLabelStyle()}>Select Lead</span>}
              name="lead_id"
              rules={[{ required: true, message: 'Please select a lead!' }]}
            >
              <Select
                placeholder="Select lead"
                disabled={!!id || !!sourceId}
                size="large"
                style={{ width: '100%', ...largeInputStyle }}
                showSearch
                onChange={onLeadChange}
                filterOption={(input, option) =>
                  (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                }
              >
                {leads.map((lead) => (
                  <Option key={lead.id} value={lead.id}>
                    {lead.name} - {lead.company_name || 'N/A'}
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

            {id && (
              <Form.Item
                label={<span style={getLabelStyle()}>Status</span>}
                name="status"
                rules={[{ required: true, message: 'Please select a status!' }]}
              >
                <Select
                  placeholder="Select status"
                  size="large"
                  style={{ width: '100%', ...largeInputStyle }}
                >
                  <Option value="draft">📝 Draft</Option>
                  <Option value="sent">📤 Sent</Option>
                  <Option value="accepted">✅ Accepted</Option>
                  <Option value="rejected">❌ Rejected</Option>
                  <Option value="expired">⏰ Expired</Option>
                </Select>
              </Form.Item>
            )}
          </div>

          <InfoCard title="💡 Lead Selection">
            Select the lead for whom you're creating this quotation. Lead cannot be changed after creation.
          </InfoCard>
        </SectionCard>

        <SectionCard
          title="Quotation Items"
          icon={<TagOutlined />}
          extra={
            <Button
              type="dashed"
              onClick={addItem}
              icon={<PlusOutlined />}
            >
              Add Item
            </Button>
          }
        >
          <Table
            dataSource={items}
            pagination={false}
            rowKey={(record, index) => index?.toString() || '0'}
            columns={[
              {
                title: 'Type',
                dataIndex: 'type',
                width: 120,
                render: (text, record, index) => (
                  <Select
                    value={text || 'material'}
                    onChange={(value) => {
                      const newItems = [...items]
                      newItems[index] = {
                        ...newItems[index],
                        type: value,
                        description: '',
                        material_id: undefined,
                        unit: value === 'material' ? '' : newItems[index].unit
                      }
                      setItems(newItems)
                    }}
                    size="large"
                    style={{ width: '100%' }}
                  >
                    <Option value="material">Material</Option>
                    <Option value="custom">Custom</Option>
                  </Select>
                )
              },
              {
                title: 'Item / Description',
                dataIndex: 'description',
                render: (text, record, index) => (
                  record.type === 'custom' ? (
                    <Input
                      value={text}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Enter description"
                      size="large"
                    />
                  ) : (
                    <Select
                      showSearch
                      value={record.material_id}
                      placeholder="Select Material"
                      optionFilterProp="children"
                      onChange={(value, option: any) => {
                        const material = materials.find(m => m.id === value)
                        const newItems = [...items]
                        newItems[index] = {
                          ...newItems[index],
                          material_id: value,
                          description: material ? material.name : '',
                          unit: material ? material.unit : newItems[index].unit
                        }
                        setItems(newItems)
                      }}
                      style={{ width: '100%' }}
                      size="large"
                      filterOption={(input, option) =>
                        (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {materials.map((m) => (
                        <Option key={m.id} value={m.id}>
                          {m.name} ({m.material_code})
                        </Option>
                      ))}
                    </Select>
                  )
                )
              },
              {
                title: 'Quantity',
                dataIndex: 'quantity',
                width: 120,
                render: (text, record, index) => (
                  <InputNumber
                    value={text}
                    min={1}
                    onChange={(value) => updateItem(index, 'quantity', value)}
                    style={{ width: '100%' }}
                    size="large"
                  />
                )
              },
              {
                title: 'Unit',
                dataIndex: 'unit',
                width: 150,
                render: (text, record, index) => (
                  <Select
                    value={text}
                    onChange={(value) => updateItem(index, 'unit', value)}
                    placeholder="Select Unit"
                    size="large"
                    style={{ width: '100%' }}
                    showSearch
                    optionFilterProp="children"
                  >
                    {units.map((unit: any) => (
                      <Option key={unit.id} value={unit.name}>
                        {unit.name} ({unit.code})
                      </Option>
                    ))}
                  </Select>
                )
              },
              {
                title: 'Rate',
                dataIndex: 'rate',
                width: 150,
                render: (text, record, index) => (
                  <InputNumber
                    value={text}
                    min={0}
                    prefix="₹"
                    onChange={(value) => updateItem(index, 'rate', value)}
                    style={{ width: '100%' }}
                    size="large"
                  />
                )
              },
              {
                title: 'Amount',
                dataIndex: 'amount',
                width: 150,
                render: (text) => `₹ ${Number(text).toLocaleString('en-IN')}`
              },
              {
                title: 'Action',
                width: 80,
                render: (_, record, index) => (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeItem(index)}
                  />
                )
              }
            ]}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} align="right">
                    <Text strong>Sub Total</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong>₹ {calculateTotal().toLocaleString('en-IN')}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </SectionCard>

        <div style={twoColumnGridStyle}>
          <SectionCard title="Pricing Details" icon={<WalletOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Total Amount</span>}
              name="total_amount"
            >
              <InputNumber
                prefix="₹"
                style={{ width: '100%', ...largeInputStyle }}
                size="large"
                readOnly
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value!.replace(/\₹\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Discount (%)</span>}
              name="discount_percentage"
            >
              <InputNumber
                prefix={<PercentageOutlined style={prefixIconStyle} />}
                style={{ width: '100%', ...largeInputStyle }}
                size="large"
                min={0}
                max={100}
                placeholder="Enter discount percentage"
              />
            </Form.Item>
          </SectionCard>

          <SectionCard title="Terms & Validity" icon={<CalendarOutlined />}>
            <div style={twoColumnGridStyle}>
              <Form.Item
                label={<span style={getLabelStyle()}>Payment Terms</span>}
                name="payment_terms"
              >
                <Input
                  placeholder="e.g., 15 days, 30 days, Net 30"
                  size="large"
                  style={largeInputStyle}
                />
              </Form.Item>

              <Form.Item
                label={<span style={getLabelStyle()}>Valid Till</span>}
                name="valid_till"
              >
                <DatePicker
                  style={{ width: '100%', ...largeInputStyle }}
                  size="large"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </div>

            <InfoCard title="📅 Validity Note">
              Set an expiration date for this quotation. After this date, the quotation will be marked as expired.
            </InfoCard>
          </SectionCard>
        </div>

        <Card style={actionCardStyle}>
          <div style={flexBetweenStyle}>
            <Text style={{ color: '#666', fontSize: 14 }}>
              All fields marked with <span style={{ color: '#ff4d4f' }}>*</span> are required
            </Text>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                onClick={() => navigate('/sales/quotations')}
                size="large"
                style={getSecondaryButtonStyle()}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                style={getPrimaryButtonStyle()}
              >
                {sourceId ? 'Revise Quotation' : id ? 'Update Quotation' : 'Create Quotation'}
              </Button>
            </div>
          </div>
        </Card>
      </Form>
    </PageContainer>
  )
}

export default QuotationForm
