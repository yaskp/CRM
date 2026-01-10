import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Space, message } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { warehouseService } from '../../services/api/warehouses'

interface Warehouse {
  id: number
  name: string
  code: string
  location?: string
  is_common: boolean
}

const WarehouseList = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const fetchWarehouses = async () => {
    setLoading(true)
    try {
      const response = await warehouseService.getWarehouses()
      setWarehouses(response.warehouses || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch warehouses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Type',
      dataIndex: 'is_common',
      key: 'is_common',
      render: (isCommon: boolean) => (
        <Tag color={isCommon ? 'blue' : 'green'}>
          {isCommon ? 'Common' : 'Company Specific'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Warehouse) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/master/warehouses/${record.id}`)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="content-container">
      <Card
        title="Warehouse Master"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/master/warehouses/new')}
          >
            Create Warehouse
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={warehouses}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>
    </div>
  )
}

export default WarehouseList

