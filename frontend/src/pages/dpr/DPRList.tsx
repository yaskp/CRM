import { useState, useEffect } from 'react'
import { Table, Card, Button, Tag, Space, Input, Select, DatePicker, Row, Col, Statistic, Typography, Tooltip } from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DashboardOutlined,
  CalendarOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import { projectService } from '../../services/api/projects'
import dayjs from 'dayjs'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, largeInputStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Search } = Input
const { RangePicker } = DatePicker
const { Text } = Typography
const { Option } = Select

const DPRList = () => {
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState<any>({
    project_id: undefined,
    status: undefined,
    dateRange: null
  })

  const navigate = useNavigate()

  useEffect(() => {
    fetchMetadata()
    fetchLogs()
  }, [pagination.current, pagination.pageSize, filters])

  const fetchMetadata = async () => {
    try {
      const res = await projectService.getProjects({ limit: 100 })
      setProjects(res.projects || [])
    } catch (e) {
      console.error(e)
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params: any = {
        type: 'CONSUMPTION',
        page: pagination.current,
        limit: pagination.pageSize,
        project_id: filters.project_id,
        status: filters.status
      }

      if (filters.dateRange) {
        params.start_date = filters.dateRange[0].format('YYYY-MM-DD')
        params.end_date = filters.dateRange[1].format('YYYY-MM-DD')
      }

      const res = await storeTransactionService.getTransactions(params)
      setLogs(res.transactions || [])
      setPagination(prev => ({ ...prev, total: res.pagination?.total || 0 }))
    } catch (error) {
      console.error('Failed to fetch work logs', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Report Date',
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      width: 140,
      render: (date: string) => (
        <Space size="small">
          <CalendarOutlined style={{ color: theme.colors.primary.main }} />
          <Text strong>{dayjs(date).format('DD-MMM-YYYY')}</Text>
        </Space>
      ),
      sorter: (a: any, b: any) => dayjs(a.transaction_date).unix() - dayjs(b.transaction_date).unix(),
    },
    {
      title: 'Project & Location',
      key: 'project_site',
      width: 300,
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.project?.name}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            <EnvironmentOutlined /> {[record.building?.name, record.floor?.name, record.zone?.name].filter(Boolean).join(' > ')}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Work Type & Panel',
      key: 'work_type_panel',
      width: 200,
      render: (_: any, record: any) => {
        const workType = record.items?.[0]?.workItemType?.name || 'Multiple'
        const panel = record.drawingPanel?.panel_identifier
        return (
          <Space direction="vertical" size={2}>
            <Tag color="cyan">{workType}</Tag>
            {panel && <Tag color="orange" style={{ fontSize: '10px' }}>PANEL: {panel}</Tag>}
            {(!panel && record.items?.some((it: any) => it.drawing_panel_id)) && <Tag color="orange" style={{ fontSize: '10px' }}>Multiple Panels</Tag>}
          </Space>
        )
      }
    },
    {
      title: 'Achievements',
      key: 'achievements',
      render: (_: any, record: any) => {
        const totalWork = record.items?.reduce((s: number, i: any) => s + (Number(i.work_done_quantity) || 0), 0)
        const uom = record.items?.[0]?.unit || 'units'
        return (
          <Tooltip title="Total work achievement today">
            <Tag color="green" style={{ borderRadius: '4px' }}><b>Progress:</b> {totalWork} {uom}</Tag>
          </Tooltip>
        )
      }
    },
    {
      title: 'Efficiency',
      key: 'efficiency',
      align: 'center' as const,
      render: (_: any, record: any) => {
        const efficiencyValues = record.items?.map((item: any) => {
          const stdRate = item.material?.standard_rate
          if (!stdRate || !item.work_done_quantity) return null
          const actualRate = item.quantity / item.work_done_quantity
          return (stdRate / actualRate) * 100
        }).filter((v: any) => v !== null)

        if (!efficiencyValues || efficiencyValues.length === 0) return '-'
        const avgEff = Math.round(efficiencyValues.reduce((a: number, b: number) => a + b, 0) / efficiencyValues.length)
        let color = 'success'
        if (avgEff < 70) color = 'error'
        else if (avgEff < 90) color = 'warning'
        return <Tag color={color}>{avgEff}%</Tag>
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: any = {
          draft: { color: 'default', icon: <SyncOutlined />, label: 'Draft' },
          pending: { color: 'processing', icon: <SyncOutlined spin />, label: 'Pending' },
          approved: { color: 'success', icon: <CheckCircleOutlined />, label: 'Approved' },
          rejected: { color: 'error', icon: <CloseCircleOutlined />, label: 'Rejected' },
        }
        const s = config[status] || config.draft
        return <Tag icon={s.icon} color={s.color}>{s.label.toUpperCase()}</Tag>
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/operations/dpr/${record.id}`)}
            style={{ padding: 0 }}
          >
            View
          </Button>
          {record.status === 'draft' && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => navigate(`/operations/dpr/${record.id}/edit`)}
              style={{ padding: 0 }}
            >
              Edit
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const stats = {
    total: pagination.total,
    approved: logs.filter(l => l.status === 'approved').length,
    manpower: logs.length * 8 // Mock
  }

  return (
    <PageContainer>
      <PageHeader
        title="Daily Progress Report (DPR)"
        subtitle="Track site productivity, material consumption, and project progress"
        icon={<DashboardOutlined />}
      />

      <Row gutter={16} style={{ marginBottom: theme.spacing.lg }}>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Total Submissions"
              value={stats.total}
              prefix={<FileTextOutlined style={{ color: theme.colors.primary.main }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Approved Progress"
              value={stats.approved}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.sm }}>
            <Statistic
              title="Manpower Reported"
              value={stats.manpower}
              prefix={<TeamOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: theme.spacing.lg, borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} lg={6}>
            <Search
              placeholder="Search by location..."
              style={{ width: '100%', ...largeInputStyle }}
              size="large"
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Select
              placeholder="All Projects"
              style={{ width: '100%', ...largeInputStyle }}
              size="large"
              allowClear
              onChange={v => setFilters({ ...filters, project_id: v })}
            >
              {projects.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <RangePicker
              size="large"
              style={{ ...largeInputStyle, width: '100%' }}
              onChange={v => setFilters({ ...filters, dateRange: v })}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/operations/dpr/new')}
              size="large"
              style={{ ...getPrimaryButtonStyle(), width: '100%' }}
            >
              New Daily Report
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: theme.borderRadius.md, boxShadow: theme.shadows.base }}>
        <Table
          columns={columns}
          dataSource={logs}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
            showSizeChanger: true,
          }}
        />
      </Card>
    </PageContainer>
  )
}

export default DPRList
