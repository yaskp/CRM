import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Switch, Typography } from 'antd'
import { HomeOutlined, NumberOutlined, EnvironmentOutlined, GlobalOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { warehouseService } from '../../services/api/warehouses'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import { largeInputStyle, getLabelStyle, getPrimaryButtonStyle, getSecondaryButtonStyle, flexBetweenStyle, actionCardStyle, prefixIconStyle, twoColumnGridStyle } from '../../styles/styleUtils'

const { Text } = Typography

const WarehouseForm = () => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  useEffect(() => {
    if (id) {
      fetchWarehouse()
    }
  }, [id])

  const fetchWarehouse = async () => {
    try {
      const response = await warehouseService.getWarehouse(Number(id))
      form.setFieldsValue(response.warehouse)
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch warehouse')
    }
  }

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      if (id) {
        await warehouseService.updateWarehouse(Number(id), values)
        message.success('Warehouse updated successfully!')
      } else {
        await warehouseService.createWarehouse(values)
        message.success('Warehouse created successfully!')
      }
      navigate('/master/warehouses')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save warehouse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer maxWidth={900}>
      <PageHeader
        title={id ? 'Edit Warehouse' : 'Create New Warehouse'}
        subtitle={id ? 'Update warehouse information' : 'Add a new warehouse location'}
        icon={<HomeOutlined />}
      />

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <SectionCard title="Warehouse Information" icon={<HomeOutlined />}>
          <div style={twoColumnGridStyle}>
            <Form.Item
              label={<span style={getLabelStyle()}>Warehouse Code</span>}
              name="code"
              rules={[{ required: true, message: 'Please enter warehouse code!' }]}
            >
              <Input
                prefix={<NumberOutlined style={prefixIconStyle} />}
                placeholder="Enter warehouse code (e.g., WH-001)"
                size="large"
                style={largeInputStyle}
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Warehouse Name</span>}
              name="name"
              rules={[{ required: true, message: 'Please enter warehouse name!' }]}
            >
              <Input
                prefix={<HomeOutlined style={prefixIconStyle} />}
                placeholder="Enter warehouse name"
                size="large"
                style={largeInputStyle}
              />
            </Form.Item>
          </div>

          <Form.Item
            label={<span style={getLabelStyle()}>Address</span>}
            name="address"
          >
            <Input
              prefix={<EnvironmentOutlined style={prefixIconStyle} />}
              placeholder="Enter warehouse address"
              size="large"
              style={largeInputStyle}
            />
          </Form.Item>

          <Form.Item
            label={<span style={getLabelStyle()}>Common Warehouse (VHPT & VHSHREE)</span>}
            name="is_common"
            valuePropName="checked"
          >
            <Switch
              checkedChildren={<><GlobalOutlined /> Common</>}
              unCheckedChildren="Company Specific"
            />
          </Form.Item>

          <InfoCard title="🏢 Warehouse Type">
            Enable "Common Warehouse" if this warehouse is shared between VHPT and VHSHREE companies. Otherwise, it will be company-specific.
          </InfoCard>
        </SectionCard>

        <Card style={actionCardStyle}>
          <div style={flexBetweenStyle}>
            <Text style={{ color: '#666', fontSize: 14 }}>
              All fields marked with <span style={{ color: '#ff4d4f' }}>*</span> are required
            </Text>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                onClick={() => navigate('/master/warehouses')}
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
                {id ? 'Update' : 'Create'} Warehouse
              </Button>
            </div>
          </div>
        </Card>
      </Form>
    </PageContainer>
  )
}

export default WarehouseForm
