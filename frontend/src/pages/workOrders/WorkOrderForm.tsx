import { useState, useEffect } from 'react'
import { Form, Button, Card, message, Select, Input, InputNumber, Space, Table } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { workOrderService } from '../../services/api/workOrders'
import { projectService } from '../../services/api/projects'
import type { ColumnsType } from 'antd/es/table'

const { Option } = Select
const { TextArea } = Input

interface WorkOrderItem {
  item_type: string
  description?: string
  quantity: number
  unit: string
  rate: number
  amount: number
}

const WorkOrderForm = () => {
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [items, setItems] = useState<WorkOrderItem[]>([])
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  useEffect(() => {
    fetchProjects()
    if (id) {
      fetchWorkOrder()
    }
  }, [id])

  const fetchProjects = async () => {
    try {
      const response = await projectService.getProjects({ limit: 100 })
      setProjects(response.projects || [])
    } catch (error) {
      console.error('Failed to fetch projects')
    }
  }

  const fetchWorkOrder = async () => {
    try {
      const response = await workOrderService.getWorkOrder(Number(id))
      const wo = response.work_order
      form.setFieldsValue(wo)
      setItems(wo.items || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch work order')
    }
  }

  const addItem = () => {
    setItems([...items, {
      item_type: 'guide_wall',
      quantity: 0,
      unit: 'meter',
      rate: 0,
      amount: 0,
    }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof WorkOrderItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate
    }
    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0)
  }

  const onFinish = async (values: any) => {
    if (items.length === 0) {
      message.error('Please add at least one work order item')
      return
    }

    setLoading(true)
    try {
      const total = calculateTotal()
      const discount = values.discount_percentage || 0
      const finalAmount = total - (total * discount) / 100

      const data = {
        project_id: values.project_id,
        items: items.map(item => ({
          item_type: item.item_type,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
        })),
        discount_percentage: discount,
        payment_terms: values.payment_terms,
      }
      
      if (id) {
        await workOrderService.updateWorkOrder(Number(id), data)
        message.success('Work order updated successfully!')
      } else {
        await workOrderService.createWorkOrder(data)
        message.success('Work order created successfully!')
      }
      navigate('/operations/work-orders')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save work order')
    } finally {
      setLoading(false)
    }
  }

  const itemColumns: ColumnsType<WorkOrderItem & { index: number }> = [
    {
      title: 'Item Type',
      dataIndex: 'item_type',
      render: (value, record, index) => (
        <Select
          value={value}
          onChange={(val) => updateItem(index, 'item_type', val)}
          style={{ width: '100%' }}
        >
          <Option value="guide_wall">Guide Wall</Option>
          <Option value="grabbing">Grabbing</Option>
          <Option value="stop_end">Stop End</Option>
          <Option value="rubber_stop">Rubber Stop</Option>
          <Option value="steel_fabrication">Steel Fabrication</Option>
          <Option value="anchor">Anchor</Option>
          <Option value="anchor_sleeve">Anchor Sleeve</Option>
        </Select>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      render: (value, record, index) => (
        <Input
          value={value}
          onChange={(e) => updateItem(index, 'description', e.target.value)}
          placeholder="Description"
        />
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      render: (value, record, index) => (
        <InputNumber
          value={value}
          onChange={(val) => updateItem(index, 'quantity', val || 0)}
          min={0}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      render: (value, record, index) => (
        <Input
          value={value}
          onChange={(e) => updateItem(index, 'unit', e.target.value)}
          placeholder="Unit"
        />
      ),
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      render: (value, record, index) => (
        <InputNumber
          value={value}
          onChange={(val) => updateItem(index, 'rate', val || 0)}
          min={0}
          prefix="₹"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      render: (amount: number) => `₹${amount?.toLocaleString('en-IN') || 0}`,
    },
    {
      title: 'Action',
      render: (_: any, record: any, index: number) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(index)}
        />
      ),
    },
  ]

  return (
    <div className="content-container">
      <Card title={id ? 'Edit Work Order' : 'Create Work Order'}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Project"
            name="project_id"
            rules={[{ required: true, message: 'Please select a project!' }]}
          >
            <Select placeholder="Select project" disabled={!!id}>
              {projects.map((project) => (
                <Option key={project.id} value={project.id}>
                  {project.project_code} - {project.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Card
            title="Work Order Items"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={addItem}>
                Add Item
              </Button>
            }
            style={{ marginBottom: 16 }}
          >
            <Table
              columns={itemColumns}
              dataSource={items.map((item, index) => ({ ...item, index, key: index }))}
              pagination={false}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5}>
                      <strong>Total</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <strong>₹{calculateTotal().toLocaleString('en-IN')}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} />
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>

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

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {id ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => navigate('/operations/work-orders')}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default WorkOrderForm

