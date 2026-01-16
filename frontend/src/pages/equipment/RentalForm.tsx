import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, DatePicker, InputNumber, Row, Col, Space, Radio, Typography } from 'antd'
import {
  SaveOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
  ProjectOutlined,
  ShopOutlined,
  CalendarOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  ToolOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { equipmentService } from '../../services/api/equipment'
import { projectService } from '../../services/api/projects'
import { vendorService } from '../../services/api/vendors'
import { equipmentRentalSchema, EquipmentRentalFormData } from '../../utils/validationSchemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
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

const { Option } = Select
const { TextArea } = Input
const { Text } = Typography

const RentalForm = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [equipment, setEquipment] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [rateType, setRateType] = useState<'day' | 'sqm'>('day')

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<EquipmentRentalFormData>({
    resolver: zodResolver(equipmentRentalSchema),
    defaultValues: {
      start_date: dayjs().format('YYYY-MM-DD'),
    },
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [projectsRes, equipmentRes, vendorsRes] = await Promise.all([
        projectService.getProjects(),
        equipmentService.getEquipment(),
        vendorService.getVendors({ vendor_type: 'rig_vendor' }),
      ])
      setProjects(projectsRes.projects || [])
      setEquipment(equipmentRes.equipment || [])
      setVendors(vendorsRes.vendors || [])
    } catch (error) {
      message.error('Failed to fetch data')
    }
  }

  const onSubmit = async (data: EquipmentRentalFormData) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        rate_per_day: rateType === 'day' ? data.rate_per_day : undefined,
        rate_per_sq_meter: rateType === 'sqm' ? data.rate_per_sq_meter : undefined,
      }
      await equipmentService.createRental(payload)
      message.success('Rental created successfully!')
      navigate('/operations/equipment/rentals')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save rental')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer maxWidth={1000}>
      <PageHeader
        title="New Equipment Lease"
        subtitle="Formalize rental agreements for technical machinery and project assets"
        icon={<SafetyCertificateOutlined />}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={twoColumnGridStyle}>
          <SectionCard title="Deployment Context" icon={<ProjectOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Project Station</span>}
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
                    placeholder="Where will it be deployed?"
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
              label={<span style={getLabelStyle()}>Asset Selection</span>}
              validateStatus={errors.equipment_id ? 'error' : ''}
              help={errors.equipment_id?.message}
              required
            >
              <Controller
                name="equipment_id"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Which machine/tool?"
                    showSearch
                    optionFilterProp="children"
                    size="large"
                    style={largeInputStyle}
                    suffixIcon={<ToolOutlined />}
                  >
                    {equipment.map((eq) => (
                      <Option key={eq.id} value={eq.id}>
                        {eq.name} ({eq.equipment_code})
                      </Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Primary Vendor</span>}
              validateStatus={errors.vendor_id ? 'error' : ''}
              help={errors.vendor_id?.message}
              required
            >
              <Controller
                name="vendor_id"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Leasing company"
                    showSearch
                    optionFilterProp="children"
                    size="large"
                    style={largeInputStyle}
                    suffixIcon={<ShopOutlined />}
                  >
                    {vendors.map((vendor) => (
                      <Option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </SectionCard>

          <SectionCard title="Lease Terms & Rates" icon={<DollarOutlined />}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={<span style={getLabelStyle()}>Activation Date</span>}
                  validateStatus={errors.start_date ? 'error' : ''}
                  help={errors.start_date?.message}
                  required
                >
                  <Controller
                    name="start_date"
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
              <Col span={12}>
                <Form.Item label={<span style={getLabelStyle()}>Scheduled End</span>}>
                  <Controller
                    name="end_date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        {...field}
                        style={{ width: '100%', ...largeInputStyle }}
                        format="DD-MMM-YYYY"
                        size="large"
                        placeholder="Open Ended"
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : undefined)}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label={<span style={getLabelStyle()}>Billing Structure</span>} required>
              <Radio.Group
                value={rateType}
                onChange={(e) => {
                  setRateType(e.target.value)
                  setValue('rate_per_day', undefined)
                  setValue('rate_per_sq_meter', undefined)
                }}
                className="premium-radio-group"
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Card size="small" style={{ borderRadius: '8px', border: rateType === 'day' ? `1px solid ${theme.colors.primary.main}` : undefined }}>
                    <Radio value="day"><Text strong>Daily Retention Rate</Text></Radio>
                  </Card>
                  <Card size="small" style={{ borderRadius: '8px', border: rateType === 'sqm' ? `1px solid ${theme.colors.primary.main}` : undefined }}>
                    <Radio value="sqm"><Text strong>Production Rate (Per m²)</Text></Radio>
                  </Card>
                </Space>
              </Radio.Group>
            </Form.Item>

            <div style={{ marginTop: '16px' }}>
              {rateType === 'day' ? (
                <Form.Item
                  label={<span style={getLabelStyle()}>Daily Rate (₹)</span>}
                  validateStatus={errors.rate_per_day ? 'error' : ''}
                  help={errors.rate_per_day?.message}
                >
                  <Controller
                    name="rate_per_day"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        {...field}
                        style={{ width: '100%', ...largeInputStyle }}
                        placeholder="0.00"
                        min={0}
                        step={100}
                        size="large"
                        prefix={<DollarOutlined style={prefixIconStyle} />}
                      />
                    )}
                  />
                </Form.Item>
              ) : (
                <Form.Item
                  label={<span style={getLabelStyle()}>Rate Per m² (₹)</span>}
                  validateStatus={errors.rate_per_sq_meter ? 'error' : ''}
                  help={errors.rate_per_sq_meter?.message}
                >
                  <Controller
                    name="rate_per_sq_meter"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        {...field}
                        style={{ width: '100%', ...largeInputStyle }}
                        placeholder="0.00"
                        min={0}
                        step={10}
                        size="large"
                        prefix={<DollarOutlined style={prefixIconStyle} />}
                      />
                    )}
                  />
                </Form.Item>
              )}
            </div>
          </SectionCard>
        </div>

        <div style={{ marginTop: theme.spacing.lg }}>
          <SectionCard title="Additional Provisions" icon={<SettingOutlined />}>
            <InfoCard title="💡 Rental Logic">
              Actual billing is calculated based on working days minus any breakdown hours reported by site engineers.
            </InfoCard>
          </SectionCard>
        </div>

        <Card style={actionCardStyle}>
          <div style={flexBetweenStyle}>
            <Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: '8px' }} />
              Lease activation notifies warehouse and project audit teams.
            </Text>
            <Space size="middle">
              <Button
                onClick={() => navigate('/operations/equipment/rentals')}
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
                Activate Lease Agreement
              </Button>
            </Space>
          </div>
        </Card>
      </form>
    </PageContainer>
  )
}

export default RentalForm
