import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, DatePicker, InputNumber, Select, Typography } from 'antd'
import { FileTextOutlined, ContactsOutlined, DollarOutlined, CalendarOutlined, PercentageOutlined } from '@ant-design/icons'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { quotationService } from '../../services/api/quotations'
import { leadService } from '../../services/api/leads'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import { largeInputStyle, getLabelStyle, getPrimaryButtonStyle, getSecondaryButtonStyle, flexBetweenStyle, actionCardStyle, prefixIconStyle, twoColumnGridStyle } from '../../styles/styleUtils'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

const QuotationForm = () => {
  const [loading, setLoading] = useState(false)
  const [leads, setLeads] = useState<any[]>([])
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const sourceId = searchParams.get('source_id')

  useEffect(() => {
    fetchLeads()
    if (id) {
      fetchQuotation(Number(id))
    } else if (sourceId) {
      fetchQuotation(Number(sourceId))
    }
  }, [id, sourceId])

  const fetchLeads = async () => {
    try {
      const response = await leadService.getLeads({ limit: 100 })
      setLeads(response.leads || [])
    } catch (error) {
      console.error('Failed to fetch leads')
    }
  }

  const fetchQuotation = async (quotationId: number) => {
    try {
      const response = await quotationService.getQuotation(quotationId)
      const quotation = response.quotation
      form.setFieldsValue({
        ...quotation,
        valid_till: quotation.valid_until ? dayjs(quotation.valid_until) : undefined,
      })
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch quotation')
    }
  }

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      const data = {
        lead_id: values.lead_id,
        total_amount: values.total_amount || 0,
        discount_percentage: values.discount_percentage || 0,
        payment_terms: values.payment_terms,
        valid_until: values.valid_till ? values.valid_till.format('YYYY-MM-DD') : undefined,
      }

      if (id) {
        await quotationService.updateQuotation(Number(id), data)
        message.success('Quotation updated successfully!')
      } else {
        await quotationService.createQuotation(data)
        message.success('Quotation created successfully!')
      }
      navigate('/sales/quotations')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save quotation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer maxWidth={1000}>
      <PageHeader
        title={id ? 'Edit Quotation' : sourceId ? 'Create New Version' : 'Create New Quotation'}
        subtitle={id ? 'Update quotation details' : sourceId ? 'Create a new version based on an existing quotation' : 'Generate a new quotation for a lead'}
        icon={<FileTextOutlined />}
      />

      <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
        <div style={twoColumnGridStyle}>
          <SectionCard title="Lead Information" icon={<ContactsOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Select Lead</span>}
              name="lead_id"
              rules={[{ required: true, message: 'Please select a lead!' }]}
            >
              <Select
                placeholder="Select lead"
                disabled={!!id || !!sourceId}
                size="large"
                style={largeInputStyle}
                showSearch
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

            <InfoCard title="💡 Lead Selection">
              Select the lead for whom you're creating this quotation. Lead cannot be changed after creation.
            </InfoCard>
          </SectionCard>

          <SectionCard title="Pricing Details" icon={<DollarOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Total Amount</span>}
              name="total_amount"
              rules={[{ required: true, message: 'Please enter total amount!' }]}
            >
              <InputNumber
                prefix="₹"
                style={{ width: '100%', ...largeInputStyle }}
                size="large"
                min={0}
                placeholder="Enter total amount"
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
        </div>

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
                {id ? 'Update' : 'Create'} Quotation
              </Button>
            </div>
          </div>
        </Card>
      </Form>
    </PageContainer>
  )
}

export default QuotationForm
