import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Switch, Space } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { warehouseService } from '../../services/api/warehouses'

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
    <div className="content-container">
      <Card title={id ? 'Edit Warehouse' : 'Create Warehouse'}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Warehouse Code"
            name="code"
            rules={[{ required: true, message: 'Please enter warehouse code!' }]}
          >
            <Input placeholder="Enter warehouse code" />
          </Form.Item>

          <Form.Item
            label="Warehouse Name"
            name="name"
            rules={[{ required: true, message: 'Please enter warehouse name!' }]}
          >
            <Input placeholder="Enter warehouse name" />
          </Form.Item>

          <Form.Item label="Location" name="location">
            <Input placeholder="Enter location" />
          </Form.Item>

          <Form.Item
            label="Common Warehouse (VHPT & VHSHREE)"
            name="is_common"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {id ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => navigate('/master/warehouses')}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default WarehouseForm

