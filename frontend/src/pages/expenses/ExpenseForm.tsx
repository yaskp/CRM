import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, DatePicker, InputNumber, Row, Col, Space, Upload, Radio, Typography, Divider } from 'antd'
import {
  SaveOutlined,
  ArrowLeftOutlined,
  UploadOutlined,
  CameraOutlined,
  ProjectOutlined,
  DollarOutlined,
  CalendarOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  AuditOutlined,
  CameraFilled,
  PictureOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { expenseService } from '../../services/api/expenses'
import { projectService } from '../../services/api/projects'
import { expenseSchema, ExpenseFormData } from '../../utils/validationSchemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import type { UploadFile } from 'antd/es/upload/interface'
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
          { value: 'ola_uber_screenshot', label: '📱 Ola/Uber Screenshot' },
          { value: 'not_required', label: '❌ Not Required' },
        ]
      case 'loose_purchase':
        return [
          { value: 'kaccha_bill', label: '📄 Estim. Bill' },
          { value: 'pakka_bill', label: '🧾 GST Bill' },
          { value: 'not_required', label: '❌ Not Required' },
        ]
      case 'food':
        return [
          { value: 'kaccha_bill', label: '📄 Shop Receipt' },
          { value: 'pakka_bill', label: '🧾 Restaurant Invoice' },
        ]
      case 'two_wheeler':
        return [
          { value: 'petrol_bill', label: '⛽ Fuel Receipt' },
        ]
      default:
        return [
          { value: 'kaccha_bill', label: '📄 Estim. Bill' },
          { value: 'pakka_bill', label: '🧾 GST Bill' },
          { value: 'not_required', label: '❌ Not Required' },
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
    <PageContainer maxWidth={1000}>
      <PageHeader
        title="Submit Expense Voucher"
        subtitle="Record field expenses, loose purchases or conveyance for reimbursement processing"
        icon={<AuditOutlined />}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={twoColumnGridStyle}>
          <SectionCard title="Basic Information" icon={<FileTextOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Associated Project</span>}
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
                    placeholder="Where was this spent?"
                    showSearch
                    optionFilterProp="children"
                    size="large"
                    style={largeInputStyle}
                    suffixIcon={<ProjectOutlined />}
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

            <Form.Item
              label={<span style={getLabelStyle()}>Expense Category</span>}
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
                    placeholder="Select Type"
                    size="large"
                    style={largeInputStyle}
                    onChange={(value) => {
                      field.onChange(value)
                      setExpenseType(value)
                      setValue('bill_type', undefined)
                    }}
                  >
                    <Option value="conveyance">🚕 Site Conveyance</Option>
                    <Option value="loose_purchase">📦 Loose Local Purchase</Option>
                    <Option value="food">🍱 Meals / Staff Welfare</Option>
                    <Option value="two_wheeler">🏍️ 2-Wheeler Fuel/Maint</Option>
                    <Option value="other">📑 Other Site Expense</Option>
                  </Select>
                )}
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Voucher Date</span>}
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

          <SectionCard title="Value & Verification" icon={<DollarOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Transaction Amount (₹)</span>}
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
                    style={{ width: '100%', ...largeInputStyle }}
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                    size="large"
                    formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/₹\s?|(,*)/g, '')}
                    value={field.value}
                    onChange={(value) => field.onChange(value || 0)}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Voucher Description</span>}
              validateStatus={errors.description ? 'error' : ''}
              help={errors.description?.message}
              required
            >
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextArea {...field} rows={3} placeholder="Purpose and details of the expense..." style={largeInputStyle} />
                )}
              />
            </Form.Item>

            <InfoCard title="💡 Compliance Rule">
              Expenses above ₹2000 mandatory require a Pakka (GST) bill for full reimbursement.
            </InfoCard>
          </SectionCard>
        </div>

        <div style={{ marginTop: theme.spacing.lg }}>
          <SectionCard title="Proof of Expense" icon={<CameraFilled />}>
            <div style={{ marginBottom: '20px' }}>
              <Text type="secondary" style={getLabelStyle()}>Verification Level</Text>
              <div style={{ marginTop: '8px' }}>
                <Controller
                  name="bill_type"
                  control={control}
                  render={({ field }) => (
                    <Radio.Group {...field} buttonStyle="solid">
                      {getBillTypeOptions(expenseType).map((option) => (
                        <Radio.Button key={option.value} value={option.value} style={{ marginRight: '8px', borderRadius: '4px' }}>
                          {option.label}
                        </Radio.Button>
                      ))}
                    </Radio.Group>
                  )}
                />
              </div>
            </div>

            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Card bordered style={{ borderStyle: 'dashed', borderRadius: '8px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Upload
                      beforeUpload={handleBillUpload}
                      maxCount={1}
                      accept="image/*,.pdf"
                      showUploadList={false}
                    >
                      <Button size="large" icon={billFile ? <CheckCircleOutlined style={{ color: theme.colors.success.main }} /> : <PictureOutlined />} style={{ minWidth: '180px' }}>
                        {billFile ? 'Bill Attached' : 'Attach Bill/Receipt'}
                      </Button>
                    </Upload>
                    <div style={{ marginTop: '8px' }}>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {billFile ? <b>{billFile.name}</b> : 'Please scan your receipt or voucher'}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card bordered style={{ borderStyle: 'dashed', borderRadius: '8px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Upload
                      beforeUpload={handleSelfieUpload}
                      maxCount={1}
                      accept="image/*"
                      capture="user"
                      showUploadList={false}
                    >
                      <Button size="large" icon={selfieFile ? <CheckCircleOutlined style={{ color: theme.colors.success.main }} /> : <CameraOutlined />} style={{ minWidth: '180px' }}>
                        {selfieFile ? 'Selfie Verification OK' : 'Take Site Selfie'}
                      </Button>
                    </Upload>
                    <div style={{ marginTop: '8px' }}>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {selfieFile ? <b>{selfieFile.name}</b> : 'Mandatory for site level verification'}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </SectionCard>
        </div>

        <Card style={actionCardStyle}>
          <div style={flexBetweenStyle}>
            <Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: '8px' }} />
              Submitting false claims may lead to disciplinary action.
            </Text>
            <Space size="middle">
              <Button
                onClick={() => navigate('/finance/expenses')}
                size="large"
                style={getSecondaryButtonStyle()}
              >
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
                Submit Claim for Audit
              </Button>
            </Space>
          </div>
        </Card>
      </form>
    </PageContainer>
  )
}

export default ExpenseForm
