import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, DatePicker, InputNumber, Select } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { quotationService } from '../../services/api/quotations'
import { leadService } from '../../services/api/leads'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

const QuotationForm = () => {
  const [loading, setLoading] = useState(false)
  const [leads, setLeads] = useState<any[]>([])
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  useEffect(() => {
    fetchLeads()
    if (id) {
      fetchQuotation()
    }
  }, [id])

  const fetchLeads = async () => {
    try {
      const response = await leadService.getLeads({ limit: 100 })
      setLeads(response.leads || [])
    } catch (error) {
      console.error('Failed to fetch leads')
    }
  }

  const fetchQuotation = async () => {
    try {
      const response = await quotationService.getQuotation(Number(id))
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
    <div className="content-container">
      <Card title={id ? 'Edit Quotation' : 'Create Quotation'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Lead"
            name="lead_id"
            rules={[{ required: true, message: 'Please select a lead!' }]}
          >
            <Select placeholder="Select lead" disabled={!!id}>
              {leads.map((lead) => (
                <Option key={lead.id} value={lead.id}>
                  {lead.name} - {lead.company_name || 'N/A'}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Total Amount"
            name="total_amount"
            rules={[{ required: true, message: 'Please enter total amount!' }]}
          >
            <InputNumber
              prefix="₹"
              style={{ width: '100%' }}
              min={0}
              placeholder="Enter total amount"
            />
          </Form.Item>

          <Form.Item label="Discount (%)" name="discount_percentage">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              placeholder="Enter discount percentage"
            />
          </Form.Item>

          <Form.Item label="Payment Terms" name="payment_terms">
            <Input placeholder="e.g., 15 days, 30 days" />
          </Form.Item>

          <Form.Item label="Valid Till" name="valid_till">
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {id ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => navigate('/sales/quotations')}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default QuotationForm

