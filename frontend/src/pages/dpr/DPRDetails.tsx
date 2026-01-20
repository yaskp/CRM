import { useState, useEffect } from 'react'
import { Card, Descriptions, Tag, Button, Table, Space, message, Row, Col, Statistic, Typography, Divider } from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  PrinterOutlined,
  DashboardOutlined,
  ProjectOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  BarChartOutlined,
  CloudOutlined,
  TeamOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  DeploymentUnitOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { dprService } from '../../services/api/dpr'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import { theme } from '../../styles/theme'
import { getPrimaryButtonStyle, getSecondaryButtonStyle, flexBetweenStyle } from '../../styles/styleUtils'

const { Text } = Typography

const DPRDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dpr, setDpr] = useState<any>(null)

  useEffect(() => {
    if (id) {
      fetchDPR()
    }
  }, [id])

  const fetchDPR = async () => {
    setLoading(true)
    try {
      const response = await dprService.getDPR(Number(id))
      setDpr(response.dpr)
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch DPR')
    } finally {
      setLoading(false)
    }
  }

  if (!dpr) {
    return (
      <PageContainer>
        <Card loading={loading}>
          <div style={{ padding: '50px', textAlign: 'center' }}>
            <Text type="secondary">Loading report data...</Text>
          </div>
        </Card>
      </PageContainer>
    )
  }

  const manpowerColumns = [
    {
      title: 'Worker Category',
      dataIndex: 'worker_type',
      key: 'worker_type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          steel_worker: '🏗️ Steel Worker',
          concrete_worker: '🏗️ Concrete Worker',
          department_worker: '🏢 Dept. Worker',
          electrician: '⚡ Electrician',
          welder: '🔥 Welder',
        }
        return <Text strong>{typeMap[type] || type}</Text>
      },
    },
    {
      title: 'Head Count',
      dataIndex: 'count',
      key: 'count',
      align: 'center' as const,
      render: (count: number) => <Text strong style={{ fontSize: '16px' }}>{count}</Text>
    },
    {
      title: 'Shift / Hajri',
      dataIndex: 'hajri',
      key: 'hajri',
      align: 'center' as const,
      render: (hajri: string) => (
        <Tag color={hajri === '1' ? 'blue' : 'orange'} style={{ borderRadius: '4px', fontWeight: 'bold' }}>
          {hajri} Shift
        </Tag>
      ),
    },
  ]

  return (
    <PageContainer maxWidth={1200}>
      <PageHeader
        title={`DPR Report: #${id}`}
        subtitle={`Summary for ${dayjs(dpr.report_date).format('DD MMMM YYYY')}`}
        icon={<DashboardOutlined />}
        extra={[
          <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate('/operations/dpr')} style={getSecondaryButtonStyle()}>Back</Button>,
          <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()} style={getSecondaryButtonStyle()}>Print</Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => navigate(`/operations/dpr/${id}/edit`)} style={getPrimaryButtonStyle()}>Edit Report</Button>
        ]}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <SectionCard title="Project & Site Overview" icon={<ProjectOutlined />}>
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label={<Text type="secondary"><ProjectOutlined /> Project</Text>}>
                <b>{dpr.project?.name}</b> <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>{dpr.project?.project_code}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text type="secondary"><CalendarOutlined /> Report Date</Text>}>
                <b>{dayjs(dpr.report_date).format('DD-MMM-YYYY')}</b>
              </Descriptions.Item>
              <Descriptions.Item label={<Text type="secondary"><EnvironmentOutlined /> Site / Area</Text>}>
                <b>{dpr.site_location || '-'}</b>
              </Descriptions.Item>
              <Descriptions.Item label={<Text type="secondary"><DeploymentUnitOutlined /> Panel #</Text>}>
                <Tag color="purple">#{dpr.panel_number || 'N/A'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<Text type="secondary"><CloudOutlined /> Weather</Text>}>
                {dpr.weather_conditions || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={<Text type="secondary"><TeamOutlined /> Reported By</Text>}>
                <Tag style={{ border: 'none' }}>{dpr.creator?.name}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </SectionCard>

          <SectionCard title="Manpower Details" icon={<TeamOutlined />} style={{ marginTop: '16px' }}>
            <Table
              columns={manpowerColumns}
              dataSource={dpr.manpower}
              rowKey="id"
              pagination={false}
              bordered
              size="middle"
              locale={{ emptyText: 'No manpower recorded' }}
            />
          </SectionCard>

          {dpr.remarks && (
            <SectionCard title="Site Observations" icon={<FileTextOutlined />} style={{ marginTop: '16px' }}>
              <div style={{ padding: '8px', minHeight: '80px', background: theme.colors.neutral.gray50, borderRadius: '8px', border: `1px solid ${theme.colors.neutral.gray200}` }}>
                <Text>{dpr.remarks}</Text>
              </div>
            </SectionCard>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <SectionCard title="Key Performance Metrcs" icon={<BarChartOutlined />}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Card bordered={false} style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%)', borderRadius: '12px' }}>
                <Statistic
                  title={<Text type="secondary">Guide Wall Run</Text>}
                  value={dpr.guide_wall_running_meter || 0}
                  suffix="m"
                  precision={2}
                  valueStyle={{ color: theme.colors.primary.main, fontWeight: 'bold' }}
                />
              </Card>

              <Card bordered={false} style={{ background: 'linear-gradient(135deg, #fffcf0 0%, #fffbe6 100%)', borderRadius: '12px' }}>
                <Statistic
                  title={<Text type="secondary">Steel Consumption</Text>}
                  value={dpr.steel_quantity_kg || 0}
                  suffix="kg"
                  precision={2}
                  valueStyle={{ color: '#faad14', fontWeight: 'bold' }}
                />
              </Card>

              <Card bordered={false} style={{ background: 'linear-gradient(135deg, #f0fff4 0%, #e6ffed 100%)', borderRadius: '12px' }}>
                <Statistic
                  title={<Text type="secondary">Concrete Volume</Text>}
                  value={dpr.concrete_quantity_cubic_meter || 0}
                  suffix="m³"
                  precision={2}
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                />
              </Card>

              <Card bordered={false} style={{ background: theme.colors.neutral.gray50, borderRadius: '12px' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title={<Text type="secondary" style={{ fontSize: '11px' }}>Polymer Bags</Text>}
                      value={dpr.polymer_consumption_bags || 0}
                      valueStyle={{ fontSize: '18px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={<Text type="secondary" style={{ fontSize: '11px' }}>Diesel (L)</Text>}
                      value={dpr.diesel_consumption_liters || 0}
                      precision={1}
                      valueStyle={{ fontSize: '18px' }}
                    />
                  </Col>
                </Row>
              </Card>
            </Space>
          </SectionCard>

          <InfoCard title="Report Status" style={{ marginTop: '16px' }}>
            <div style={flexBetweenStyle}>
              <Text type="secondary">Submission ID:</Text>
              <Text strong>#DPR-{dpr.id}</Text>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={flexBetweenStyle}>
              <Text type="secondary">Generated At:</Text>
              <Text>{dayjs(dpr.createdAt).format('DD-MMM HH:mm')}</Text>
            </div>
            <div style={{ marginTop: '16px', fontSize: '12px', color: theme.colors.neutral.gray500 }}>
              <InfoCircleOutlined /> This is an automated site report. Physical verification and store audit may apply.
            </div>
          </InfoCard>
        </Col>
      </Row>
    </PageContainer>
  )
}

export default DPRDetails
