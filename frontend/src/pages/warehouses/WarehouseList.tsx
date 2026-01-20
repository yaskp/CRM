import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Space, message, Row, Col, Statistic, Typography } from 'antd'
import { PlusOutlined, EyeOutlined, HomeOutlined, CheckCircleOutlined, GlobalOutlined, BankOutlined, ShopOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { warehouseService } from '../../services/api/warehouses'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Text } = Typography

interface Warehouse {
  id: number
  name: string
  code: string
  address?: string
  is_common: boolean
  type: 'central' | 'site'
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

  const getStats = () => {
    const common = warehouses.filter(w => w.is_common).length
    const specific = warehouses.length - common
    return { total: warehouses.length, common, specific }
  }

  const stats = getStats()

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => <Text copyable strong>{code}</Text>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: 'Scope',
      dataIndex: 'is_common',
      key: 'is_common',
      width: 150,
      render: (isCommon: boolean) => (
        <Tag
          icon={isCommon ? <GlobalOutlined /> : <HomeOutlined />}
          color={isCommon ? 'blue' : 'green'}
          style={{ fontWeight: 500 }}
        >
          {isCommon ? 'Common' : 'Company Specific'}
        </Tag>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: string) => {
        const isSite = type === 'site'
        return (
          <Tag
            icon={isSite ? <ShopOutlined /> : <BankOutlined />}
            color={isSite ? 'orange' : 'purple'}
            style={{ fontWeight: 500, textTransform: 'capitalize' }}
          >
            {type || 'Central'}
          </Tag>
        )
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: Warehouse) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/master/warehouses/${record.id}`)}
          style={{ padding: 0 }}
        >
          View
        </Button>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Warehouse Master"
        subtitle="Manage warehouse locations and storage facilities"
        icon={<HomeOutlined />}
      />

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            style={{
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadows.base,
              border: `1px solid ${theme.colors.neutral.gray100}`,
            }}
          >
            <Statistic
              title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Total Warehouses</Text>}
              value={stats.total}
              prefix={<HomeOutlined style={{ color: theme.colors.primary.main }} />}
              valueStyle={{ color: theme.colors.primary.main, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            style={{
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadows.base,
              border: `1px solid ${theme.colors.neutral.gray100}`,
            }}
          >
            <Statistic
              title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Common</Text>}
              value={stats.common}
              prefix={<GlobalOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            style={{
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadows.base,
              border: `1px solid ${theme.colors.neutral.gray100}`,
            }}
          >
            <Statistic
              title={<Text style={{ fontSize: 14, color: theme.colors.neutral.gray600 }}>Company Specific</Text>}
              value={stats.specific}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Actions */}
      <Card
        style={{
          marginBottom: theme.spacing.lg,
          borderRadius: theme.borderRadius.md,
          boxShadow: theme.shadows.base,
          border: `1px solid ${theme.colors.neutral.gray100}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/master/warehouses/new')}
            size="large"
            style={getPrimaryButtonStyle(180)}
          >
            Create Warehouse
          </Button>
        </div>
      </Card>

      {/* Warehouses Table */}
      <Card
        style={{
          borderRadius: theme.borderRadius.md,
          boxShadow: theme.shadows.base,
          border: `1px solid ${theme.colors.neutral.gray100}`,
        }}
      >
        <Table
          columns={columns}
          dataSource={warehouses}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 800 }}
        />
      </Card>
    </PageContainer>
  )
}

export default WarehouseList
