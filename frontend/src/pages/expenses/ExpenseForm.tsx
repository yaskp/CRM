import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, DatePicker, InputNumber, Row, Col, Space, Upload, Radio } from 'antd'
import { SaveOutlined, ArrowLeftOutlined, UploadOutlined, CameraOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { expenseService } from '../../services/api/expenses'
import { projectService } from '../../services/api/projects'
import { expenseSchema, ExpenseFormData } from '../../utils/validationSchemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import type { UploadFile } from 'antd/es/upload/interface'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

const ExpenseForm = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [billFile, setBillFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [expenseType, setExpenseType] = useState<string>('conveyance')

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expense_date: dayjs().format('YYYY-MM-DD'),
      input_method: 'manual',
      expense_type: 'conveyance',
    },
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await projectService.getProjects()
      setProjects(response.projects || [])
    } catch (error) {
      message.error('Failed to fetch projects')
    }
  }

  const getBillTypeOptions = (expenseType: string) => {
    switch (expenseType) {
      case 'conveyance':
        return [
          { value: 'ola_uber_screenshot', label: 'Ola/Uber Screenshot' },
          { value: 'not_required', label: 'Not Required' },
        ]
      case 'loose_purchase':
        return [
          { value: 'kaccha_bill', label: 'Kaccha Bill' },
          { value: 'pakka_bill', label: 'Pakka Bill' },
          { value: 'not_required', label: 'Not Required' },
        ]
      case 'food':
        return [
          { value: 'kaccha_bill', label: 'Kaccha Bill' },
          { value: 'pakka_bill', label: 'Pakka Bill' },
        ]
      case 'two_wheeler':
        return [
          { value: 'petrol_bill', label: 'Petrol Bill' },
        ]
      default:
        return [
          { value: 'kaccha_bill', label: 'Kaccha Bill' },
          { value: 'pakka_bill', label: 'Pakka Bill' },
          { value: 'not_required', label: 'Not Required' },
        ]
    }
  }

  const onSubmit = async (data: ExpenseFormData) => {
    setLoading(true)
    try {
      await expenseService.createExpense(data, billFile || undefined, selfieFile || undefined)
      message.success('Expense submitted successfully!')
      navigate('/finance/expenses')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to submit expense')
    } finally {
      setLoading(false)
    }
  }

  const handleBillUpload = (file: File) => {
    setBillFile(file)
    return false // Prevent auto upload
  }

  const handleSelfieUpload = (file: File) => {
    setSelfieFile(file)
    return false // Prevent auto upload
  }

  return (
    <Card
      title="Create Expense"
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/finance/expenses')}>
          Back
        </Button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Project"
              validateStatus={errors.project_id ? 'error' : ''}
              help={errors.project_id?.message}
              required
            >
              <Controller
                name="project_id"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Project"
                    showSearch
                    optionFilterProp="children"
                  >
                    {projects.map((project) => (
                      <Option key={project.id} value={project.id}>
                        {project.name} ({project.project_code})
                      </Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Expense Type"
              validateStatus={errors.expense_type ? 'error' : ''}
              help={errors.expense_type?.message}
              required
            >
              <Controller
                name="expense_type"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Expense Type"
                    onChange={(value) => {
                      field.onChange(value)
                      setExpenseType(value)
                      setValue('bill_type', undefined)
                    }}
                  >
                    <Option value="conveyance">Conveyance</Option>
                    <Option value="loose_purchase">Loose Purchase</Option>
                    <Option value="food">Food</Option>
                    <Option value="two_wheeler">Two Wheeler Expense</Option>
                    <Option value="other">Other Expense</Option>
                  </Select>
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Amount (₹)"
              validateStatus={errors.amount ? 'error' : ''}
              help={errors.amount?.message}
              required
            >
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    style={{ width: '100%' }}
                    placeholder="Enter amount"
                    min={0}
                    step={0.01}
                    formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/₹\s?|(,*)/g, '')}
                    value={field.value}
                    onChange={(value) => field.onChange(value || 0)}
                  />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Expense Date"
              validateStatus={errors.expense_date ? 'error' : ''}
              help={errors.expense_date?.message}
              required
            >
              <Controller
                name="expense_date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                  />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item
              label="Description"
              validateStatus={errors.description ? 'error' : ''}
              help={errors.description?.message}
              required
            >
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextArea {...field} rows={3} placeholder="Enter expense description" />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item label="Bill Type">
              <Controller
                name="bill_type"
                control={control}
                render={({ field }) => (
                  <Radio.Group {...field}>
                    {getBillTypeOptions(expenseType).map((option) => (
                      <Radio key={option.value} value={option.value}>
                        {option.label}
                      </Radio>
                    ))}
                  </Radio.Group>
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Upload Bill">
              <Upload
                beforeUpload={handleBillUpload}
                maxCount={1}
                accept="image/*,.pdf"
              >
                <Button icon={<UploadOutlined />}>Upload Bill</Button>
              </Upload>
              {billFile && (
                <div style={{ marginTop: 8, color: '#52c41a' }}>
                  {billFile.name}
                </div>
              )}
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Upload Selfie">
              <Upload
                beforeUpload={handleSelfieUpload}
                maxCount={1}
                accept="image/*"
                capture="user"
              >
                <Button icon={<CameraOutlined />}>Take/Upload Selfie</Button>
              </Upload>
              {selfieFile && (
                <div style={{ marginTop: 8, color: '#52c41a' }}>
                  {selfieFile.name}
                </div>
              )}
            </Form.Item>
          </Col>
        </Row>

        <Space style={{ marginTop: 24, width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={() => navigate('/finance/expenses')}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
            Submit Expense
          </Button>
        </Space>
      </form>
    </Card>
  )
}

export default ExpenseForm

