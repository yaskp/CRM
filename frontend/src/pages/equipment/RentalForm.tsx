import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, DatePicker, InputNumber, Row, Col, Space, Radio } from 'antd'
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { equipmentService } from '../../services/api/equipment'
import { projectService } from '../../services/api/projects'
import { vendorService } from '../../services/api/vendors'
import { equipmentRentalSchema, EquipmentRentalFormData } from '../../utils/validationSchemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

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
    <Card
      title="Create Equipment Rental"
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/operations/equipment/rentals')}>
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
              label="Equipment"
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
                    placeholder="Select Equipment"
                    showSearch
                    optionFilterProp="children"
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
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Vendor"
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
                    placeholder="Select Vendor"
                    showSearch
                    optionFilterProp="children"
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
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Start Date"
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
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                  />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="End Date">
              <Controller
                name="end_date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : undefined)}
                  />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item label="Rate Type" required>
              <Radio.Group
                value={rateType}
                onChange={(e) => {
                  setRateType(e.target.value)
                  setValue('rate_per_day', undefined)
                  setValue('rate_per_sq_meter', undefined)
                }}
              >
                <Radio value="day">Rate Per Day</Radio>
                <Radio value="sqm">Rate Per Square Meter</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>

          {rateType === 'day' && (
            <Col xs={24} md={12}>
              <Form.Item
                label="Rate Per Day (₹)"
                validateStatus={errors.rate_per_day ? 'error' : ''}
                help={errors.rate_per_day?.message}
              >
                <Controller
                  name="rate_per_day"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      style={{ width: '100%' }}
                      placeholder="Enter rate per day"
                      min={0}
                      step={100}
                      value={field.value}
                      onChange={(value) => field.onChange(value || undefined)}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          )}

          {rateType === 'sqm' && (
            <Col xs={24} md={12}>
              <Form.Item
                label="Rate Per Square Meter (₹)"
                validateStatus={errors.rate_per_sq_meter ? 'error' : ''}
                help={errors.rate_per_sq_meter?.message}
              >
                <Controller
                  name="rate_per_sq_meter"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      style={{ width: '100%' }}
                      placeholder="Enter rate per sq meter"
                      min={0}
                      step={10}
                      value={field.value}
                      onChange={(value) => field.onChange(value || undefined)}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          )}
        </Row>

        <Space style={{ marginTop: 24, width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={() => navigate('/operations/equipment/rentals')}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
            Create Rental
          </Button>
        </Space>
      </form>
    </Card>
  )
}

export default RentalForm

