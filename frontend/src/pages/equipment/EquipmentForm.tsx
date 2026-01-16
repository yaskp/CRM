import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, InputNumber, Row, Col, Space, Switch, Typography } from 'antd'
import {
  SaveOutlined,
  ArrowLeftOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  BarcodeOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { equipmentService } from '../../services/api/equipment'
import { vendorService } from '../../services/api/vendors'
import { equipmentSchema, EquipmentFormData } from '../../utils/validationSchemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
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
      if (id) {
        const response = await equipmentService.getEquipmentById(Number(id))
        const data = response.equipment

        // Reset form with fetched data
        // Explicitly set each field to ensure they are picked up, especially booleans and IDs
        setValue('equipment_code', data.equipment_code)
        setValue('name', data.name)
        setValue('equipment_type', data.equipment_type)
        setValue('manufacturer', data.manufacturer || '')
        setValue('model', data.model || '')
        setValue('registration_number', data.registration_number || '')
        setValue('is_rental', data.is_rental)
        if (data.is_rental && data.owner_vendor_id) {
          setValue('owner_vendor_id', data.owner_vendor_id)
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch equipment details')
      navigate('/operations/equipment')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: EquipmentFormData) => {
    setLoading(true)
    try {
      if (id) {
        await equipmentService.updateEquipment(Number(id), data)
        message.success('Equipment updated successfully!')
      } else {
        await equipmentService.createEquipment(data)
        message.success('Equipment created successfully!')
      }
      navigate('/operations/equipment')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save equipment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer maxWidth={1000}>
      <PageHeader
        title={id ? 'Edit Equipment' : 'Add New Equipment'}
        subtitle={id ? 'Modify equipment details and specifications' : 'Register new machinery into the project fleet'}
        icon={<SettingOutlined />}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard title="Basic Information" icon={<BarcodeOutlined />}>
          <div style={twoColumnGridStyle}>
            <Form.Item
              label={<span style={getLabelStyle()}>Equipment Code</span>}
              validateStatus={errors.equipment_code ? 'error' : ''}
              help={errors.equipment_code?.message}
              required
            >
              <Controller
                name="equipment_code"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="e.g., CRN-001"
                    size="large"
                    style={largeInputStyle}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Equipment Name</span>}
              validateStatus={errors.name ? 'error' : ''}
              help={errors.name?.message}
              required
            >
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="e.g., Liebherr LTM 1300"
                    size="large"
                    style={largeInputStyle}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Equipment Type</span>}
              validateStatus={errors.equipment_type ? 'error' : ''}
              help={errors.equipment_type?.message}
              required
            >
              <Controller
                name="equipment_type"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select equipment type"
                    size="large"
                    style={largeInputStyle}
                  >
                    <Option value="crane">🏗️ Crane</Option>
                    <Option value="jcb">🚜 JCB</Option>
                    <Option value="rig">⚙️ Rig</Option>
                    <Option value="grabbing_rig">🛠️ Grabbing Rig</Option>
                    <Option value="steel_bending_machine">🌀 Steel Bending Machine</Option>
                    <Option value="steel_cutting_machine">✂️ Steel Cutting Machine</Option>
                    <Option value="water_tank">💧 Water Tank</Option>
                    <Option value="pump">🚿 Pump</Option>
                    <Option value="other">📦 Other</Option>
                  </Select>
                )}
              />
            </Form.Item>

            <Form.Item label={<span style={getLabelStyle()}>Ownership Status</span>}>
              <Controller
                name="is_rental"
                control={control}
                render={({ field }) => (
                  <div style={{ marginTop: '8px' }}>
                    <Switch
                      checked={field.value}
                      onChange={field.onChange}
                      checkedChildren={<><ThunderboltOutlined /> Rental</>}
                      unCheckedChildren={<><CheckCircleOutlined /> Owned</>}
                    />
                  </div>
                )}
              />
            </Form.Item>
          </div>

          <InfoCard title="💡 Equipment Tracking">
            Each equipment piece must have a unique code for tracking maintenance, fuel, and location.
          </InfoCard>
        </SectionCard>

        <SectionCard title="Technical Specifications" icon={<SafetyCertificateOutlined />}>
          <div style={twoColumnGridStyle}>
            <Form.Item label={<span style={getLabelStyle()}>Manufacturer</span>}>
              <Controller
                name="manufacturer"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g., Caterpillar, Tata" size="large" style={largeInputStyle} />
                )}
              />
            </Form.Item>

            <Form.Item label={<span style={getLabelStyle()}>Model</span>}>
              <Controller
                name="model"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g., CAT 320D" size="large" style={largeInputStyle} />
                )}
              />
            </Form.Item>

            <Form.Item label={<span style={getLabelStyle()}>Registration/Serial Number</span>}>
              <Controller
                name="registration_number"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter unique number" size="large" style={largeInputStyle} />
                )}
              />
            </Form.Item>
          </div>

          {isRental && (
            <div style={{ marginTop: '16px', borderTop: `1px solid ${theme.colors.neutral.gray200}`, paddingTop: '16px' }}>
              <Form.Item
                label={<span style={getLabelStyle()}>Rental Source (Vendor)</span>}
              >
                <Controller
                  name="owner_vendor_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      placeholder="Select vendor providing this rental"
                      showSearch
                      optionFilterProp="children"
                      allowClear
                      size="large"
                      style={largeInputStyle}
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
            </div>
          )}
        </SectionCard>

        <Card style={actionCardStyle}>
          <div style={flexBetweenStyle}>
            <Text style={{ color: theme.colors.neutral.gray600 }}>
              <InfoCircleOutlined style={{ marginRight: '8px' }} />
              Fields marked with * are required for registration
            </Text>
            <Space size="middle">
              <Button
                onClick={() => navigate('/operations/equipment')}
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
                {id ? 'Update' : 'Confirm & Register'} Equipment
              </Button>
            </Space>
          </div>
        </Card>
      </form>
    </PageContainer>
  )
}

export default EquipmentForm
