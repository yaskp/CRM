import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, DatePicker, Select } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { leadService } from '../../services/api/leads'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

const LeadForm = () => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  useEffect(() => {
    if (id) {
      fetchLead()
    }
  }, [id])

  const fetchLead = async () => {
    try {
      const response = await leadService.getLead(Number(id))
      const lead = response.lead
      form.setFieldsValue({
        ...lead,
        enquiry_date: lead.enquiry_date ? dayjs(lead.enquiry_date) : undefined,
      })
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch lead')
    }
  }

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      const data = {
        ...values,
        enquiry_date: values.enquiry_date ? values.enquiry_date.format('YYYY-MM-DD') : undefined,
      }
      
      if (id) {
        await leadService.updateLead(Number(id), data)
        message.success('Lead updated successfully!')
      } else {
        await leadService.createLead(data)
        message.success('Lead created successfully!')
      }
      navigate('/sales/leads')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save lead')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="content-container">
      <Card title={id ? 'Edit Lead' : 'Create Lead'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter lead name!' }]}
          >
            <Input placeholder="Enter lead name" />
          </Form.Item>

          <Form.Item label="Company Name" name="company_name">
            <Input placeholder="Enter company name" />
          </Form.Item>

          <Form.Item label="Phone" name="phone">
            <Input placeholder="Enter phone number" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[{ type: 'email', message: 'Please enter a valid email!' }]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>

          <Form.Item label="Address" name="address">
            <TextArea rows={3} placeholder="Enter address" />
          </Form.Item>

          <Form.Item
            label="Enquiry Date"
            name="enquiry_date"
            rules={[{ required: true, message: 'Please select enquiry date!' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item label="Source" name="source">
            <Select placeholder="Select source">
              <Option value="website">Website</Option>
              <Option value="referral">Referral</Option>
              <Option value="cold_call">Cold Call</Option>
              <Option value="email">Email</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Status" name="status">
            <Select placeholder="Select status" defaultValue="new">
              <Option value="new">New</Option>
              <Option value="contacted">Contacted</Option>
              <Option value="qualified">Qualified</Option>
              <Option value="converted">Converted</Option>
              <Option value="lost">Lost</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Remarks" name="remarks">
            <TextArea rows={4} placeholder="Enter remarks" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {id ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => navigate('/sales/leads')}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default LeadForm

