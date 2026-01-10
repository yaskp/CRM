import { useState, useEffect } from 'react'
import { Table, Card, Button, Tag, Space, Input, Select, message } from 'antd'
import { PlusOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { equipmentService } from '../../services/api/equipment'

const { Search } = Input

const EquipmentList = () => {
  const [loading, setLoading] = useState(false)
  const [equipment, setEquipment] = useState<any[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    fetchEquipment()
  }, [])

  const fetchEquipment = async (params?: any) => {
    setLoading(true)
    try {
      const response = await equipmentService.getEquipment({
        ...params,
        page: params?.current || pagination.current,
        limit: params?.pageSize || pagination.pageSize,
      })
      setEquipment(response.equipment || [])
      setPagination({
        current: response.pagination?.page || 1,
        pageSize: response.pagination?.limit || 10,
        total: response.pagination?.total || 0,
      })
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch equipment')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Equipment Code',
      dataIndex: 'equipment_code',
      key: 'equipment_code',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'equipment_type',
      key: 'equipment_type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          crane: 'Crane',
          jcb: 'JCB',
          rig: 'Rig',
          grabbing_rig: 'Grabbing Rig',
          steel_bending_machine: 'Steel Bending Machine',
          steel_cutting_machine: 'Steel Cutting Machine',
          water_tank: 'Water Tank',
          pump: 'Pump',
          other: 'Other',
        }
        return typeMap[type] || type
      },
    },
    {
      title: 'Manufacturer',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: 'Rental',
      dataIndex: 'is_rental',
      key: 'is_rental',
      render: (isRental: boolean) => (
        <Tag color={isRental ? 'orange' : 'green'}>
          {isRental ? 'Rental' : 'Owned'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/operations/equipment/${record.id}`)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/operations/equipment/${record.id}/edit`)}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="Equipment Master"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/operations/equipment/new')}
        >
          Add Equipment
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Space>
          <Search
            placeholder="Search equipment"
            style={{ width: 250 }}
            onSearch={(value) => fetchEquipment({ search: value })}
          />
          <Select
            placeholder="Filter by Type"
            style={{ width: 200 }}
            allowClear
            onChange={(value) => fetchEquipment({ equipment_type: value })}
          >
            <Select.Option value="crane">Crane</Select.Option>
            <Select.Option value="jcb">JCB</Select.Option>
            <Select.Option value="rig">Rig</Select.Option>
            <Select.Option value="grabbing_rig">Grabbing Rig</Select.Option>
            <Select.Option value="steel_bending_machine">Steel Bending Machine</Select.Option>
            <Select.Option value="steel_cutting_machine">Steel Cutting Machine</Select.Option>
            <Select.Option value="water_tank">Water Tank</Select.Option>
            <Select.Option value="pump">Pump</Select.Option>
            <Select.Option value="other">Other</Select.Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={equipment}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} equipment`,
          }}
          onChange={(pagination) => fetchEquipment({ current: pagination.current, pageSize: pagination.pageSize })}
        />
      </Space>
    </Card>
  )
}

export default EquipmentList

