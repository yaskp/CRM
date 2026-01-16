import { useState, useEffect } from 'react'
import { Table, Card, Button, Tag, Space, Input, Select, message, Row, Col, Statistic, Typography } from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  SearchOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ContainerOutlined,
  FilterOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { equipmentService } from '../../services/api/equipment'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, largeInputStyle, prefixIconStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Search } = Input
const { Text } = Typography

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

  const getStats = () => {
    const total = equipment.length
    const owned = equipment.filter(e => !e.is_rental).length
    const rental = equipment.filter(e => e.is_rental).length
    return { total, owned, rental }
  }

  const stats = getStats()

  const columns = [
    {
      title: 'Equipment Code',
      dataIndex: 'equipment_code',
      key: 'equipment_code',
      width: 150,
      render: (text: string) => <Text strong style={{ color: theme.colors.primary.main }}>{text}</Text>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
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
        return <Tag color="blue">{typeMap[type] || type}</Tag>
      },
    },
    {
      title: 'Registration No.',
      dataIndex: 'registration_number',
      key: 'registration_number',
      render: (text: string) => text ? <Text>{text}</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: 'Manufacturer / Model',
      key: 'make_model',
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          <Text>{record.manufacturer || '-'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.model}</Text>
        </Space>
      ),
    },
    {
      title: 'Owner',
      key: 'owner',
      render: (_: any, record: any) => {
        if (!record.is_rental) {
          return <Tag color="green" icon={<CheckCircleOutlined />}>Owned</Tag>
        }
        return (
          <Space direction="vertical" size={0}>
            <Tag color="orange" icon={<ThunderboltOutlined />}>Rental</Tag>
            {record.ownerVendor && <Text type="secondary" style={{ fontSize: '12px' }}>{record.ownerVendor.name}</Text>}
          </Space>
        )
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/operations/equipment/${record.id}/edit`)}
          />
        </Space>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Equipment Master"
        subtitle="Manage and track all construction machinery and equipment"
        icon={<SettingOutlined />}
      />

      <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}
          >
            <Statistic
              title="Total Equipment"
              value={stats.total}
              prefix={<ContainerOutlined style={{ color: theme.colors.primary.main }} />}
              valueStyle={{ color: theme.colors.primary.main, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}
          >
            <Statistic
              title="Owned"
              value={stats.owned}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}
          >
            <Statistic
              title="Rental"
              value={stats.rental}
              prefix={<ThunderboltOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{
          marginBottom: theme.spacing.lg,
          borderRadius: theme.borderRadius.md,
          boxShadow: theme.shadows.base
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <Space size="middle" wrap>
            <Search
              placeholder="Search equipment..."
              style={{ width: 300, ...largeInputStyle }}
              size="large"
              onSearch={(value) => fetchEquipment({ search: value })}
              prefix={<SearchOutlined style={prefixIconStyle} />}
            />
            <Select
              placeholder="Filter by Type"
              style={{ width: 220, ...largeInputStyle }}
              size="large"
              allowClear
              onChange={(value) => fetchEquipment({ equipment_type: value })}
              suffixIcon={<FilterOutlined style={prefixIconStyle} />}
            >
              <Select.Option value="crane">🏗️ Crane</Select.Option>
              <Select.Option value="jcb">🚜 JCB</Select.Option>
              <Select.Option value="rig">⚙️ Rig</Select.Option>
              <Select.Option value="grabbing_rig">🛠️ Grabbing Rig</Select.Option>
              <Select.Option value="steel_bending_machine">🌀 Steel Bending Machine</Select.Option>
              <Select.Option value="steel_cutting_machine">✂️ Steel Cutting Machine</Select.Option>
              <Select.Option value="water_tank">💧 Water Tank</Select.Option>
              <Select.Option value="pump">🚿 Pump</Select.Option>
              <Select.Option value="other">📦 Other</Select.Option>
            </Select>
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/operations/equipment/new')}
            size="large"
            style={getPrimaryButtonStyle(200)}
          >
            Add Equipment
          </Button>
        </div>
      </Card>

      <Card style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
        <Table
          columns={columns}
          dataSource={equipment}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} equipment items`,
          }}
          onChange={(pagination) => fetchEquipment({ current: pagination.current, pageSize: pagination.pageSize })}
        />
      </Card>
    </PageContainer>
  )
}

export default EquipmentList
