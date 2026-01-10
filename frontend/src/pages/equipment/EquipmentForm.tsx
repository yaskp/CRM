import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, InputNumber, Row, Col, Space, Switch } from 'antd'
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { equipmentService } from '../../services/api/equipment'
import { vendorService } from '../../services/api/vendors'
import { equipmentSchema, EquipmentFormData } from '../../utils/validationSchemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'

const { Option } = Select
const { TextArea } = Input

const EquipmentForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState<any[]>([])

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      is_rental: false,
    },
  })

  const isRental = watch('is_rental')

  useEffect(() => {
    fetchVendors()
    if (id) {
      fetchEquipment()
    }
  }, [id])

  const fetchVendors = async () => {
    try {
      const response = await vendorService.getVendors()
      setVendors(response.vendors || [])
    } catch (error) {
      console.error('Failed to fetch vendors')
    }
  }

  const fetchEquipment = async () => {
    setLoading(true)
    try {
      // Equipment service getEquipment would need to support getting by ID
      // For now, this is a placeholder
      message.info('Edit functionality will be available soon')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch equipment')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: EquipmentFormData) => {
    setLoading(true)
    try {
      await equipmentService.createEquipment(data)
      message.success('Equipment created successfully!')
      navigate('/operations/equipment')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save equipment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      title={id ? 'Edit Equipment' : 'Add Equipment'}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/operations/equipment')}>
          Back
        </Button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Equipment Code"
              validateStatus={errors.equipment_code ? 'error' : ''}
              help={errors.equipment_code?.message}
              required
            >
              <Controller
                name="equipment_code"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter equipment code" />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Equipment Name"
              validateStatus={errors.name ? 'error' : ''}
              help={errors.name?.message}
              required
            >
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter equipment name" />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Equipment Type"
              validateStatus={errors.equipment_type ? 'error' : ''}
              help={errors.equipment_type?.message}
              required
            >
              <Controller
                name="equipment_type"
                control={control}
                render={({ field }) => (
                  <Select {...field} placeholder="Select equipment type">
                    <Option value="crane">Crane</Option>
                    <Option value="jcb">JCB</Option>
                    <Option value="rig">Rig</Option>
                    <Option value="grabbing_rig">Grabbing Rig</Option>
                    <Option value="steel_bending_machine">Steel Bending Machine</Option>
                    <Option value="steel_cutting_machine">Steel Cutting Machine</Option>
                    <Option value="water_tank">Water Tank</Option>
                    <Option value="pump">Pump</Option>
                    <Option value="other">Other</Option>
                  </Select>
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Is Rental Equipment">
              <Controller
                name="is_rental"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    checkedChildren="Rental"
                    unCheckedChildren="Owned"
                  />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Manufacturer">
              <Controller
                name="manufacturer"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter manufacturer" />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Model">
              <Controller
                name="model"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter model" />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Registration Number">
              <Controller
                name="registration_number"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter registration number" />
                )}
              />
            </Form.Item>
          </Col>

          {isRental && (
            <Col xs={24} md={12}>
              <Form.Item label="Owner Vendor">
                <Controller
                  name="owner_vendor_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      placeholder="Select owner vendor"
                      showSearch
                      optionFilterProp="children"
                      allowClear
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
          )}
        </Row>

        <Space style={{ marginTop: 24, width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={() => navigate('/operations/equipment')}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
            {id ? 'Update' : 'Create'} Equipment
          </Button>
        </Space>
      </form>
    </Card>
  )
}

export default EquipmentForm

