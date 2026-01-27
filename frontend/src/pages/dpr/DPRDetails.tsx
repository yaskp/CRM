import { useState, useEffect } from 'react'
import { Descriptions, Tag, Button, Table, Space, message, Row, Col, Typography, Image } from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  PrinterOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  CloudOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CameraOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, getSecondaryButtonStyle, flexBetweenStyle } from '../../styles/styleUtils'

const { Text, Paragraph } = Typography

const DPRDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState<any>(null)

  useEffect(() => {
    if (id) {
      fetchLogDetails()
    }
  }, [id])

  const fetchLogDetails = async () => {
    setLoading(true)
    try {
      const response = await storeTransactionService.getTransaction(Number(id))
      setLog(response.transaction)
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch report details')
    } finally {
      setLoading(false)
    }
  }

  if (!log) return null

  const manpowerList = log.manpower_data ? JSON.parse(log.manpower_data) : []
  const photoList = log.progress_photos ? JSON.parse(log.progress_photos) : []

  const materialColumns = [
    {
      title: 'Activity / Material',
      key: 'item',
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.material?.name}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.material?.material_code}</Text>
        </Space>
      )
    },
    {
      title: 'Consumed',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (val: any, record: any) => <Text strong>{val} {record.unit || record.material?.uom}</Text>
    },
    {
      title: 'Work Achievement',
      dataIndex: 'work_done_quantity',
      key: 'work_done',
      align: 'right' as const,
      render: (val: any) => <Text strong style={{ color: '#0d9488' }}>{val || 0} {log.items?.[0]?.unit || 'm'}</Text>
    },
    {
      title: 'Wastage',
      dataIndex: 'wastage_quantity',
      key: 'wastage',
      align: 'right' as const,
    },
    {
      title: 'Efficiency',
      key: 'efficiency',
      align: 'center' as const,
      render: (_: any, record: any) => {
        const stdRate = record.material?.standard_rate
        if (!stdRate || !record.work_done_quantity) return '-'
        const actualRate = record.quantity / record.work_done_quantity
        const eff = Math.round((stdRate / actualRate) * 100)
        let color = 'success'
        if (eff < 70) color = 'error'
        else if (eff < 90) color = 'warning'
        return <Tag color={color}>{eff}%</Tag>
      }
    }
  ]

  const handleApprove = async () => {
    try {
      setLoading(true)
      await storeTransactionService.approveTransaction(Number(id))
      message.success('Report approved successfully. Inventory and BOQ progress have been updated.')
      fetchLogDetails()
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Approval failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePDFAction = (mode: 'inline' | 'download' = 'download') => {
    const token = localStorage.getItem('token')
    const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api'
    const suffix = mode === 'inline' ? '&mode=inline' : ''
    window.open(`${apiUrl}/store/${id}/pdf?token=${token}${suffix}`, '_blank')
  }

  return (
    <PageContainer maxWidth={1105}>
      <PageHeader
        title={`Daily Progress Report: ${log.transaction_number}`}
        subtitle={`Site achievements for ${dayjs(log.transaction_date).format('DD MMMM YYYY')}`}
        icon={<DashboardOutlined />}
        extra={[
          <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate('/operations/dpr')} style={getSecondaryButtonStyle()}>Back</Button>,
          log.status === 'draft' && <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => navigate(`/operations/dpr/${id}/edit`)} style={getPrimaryButtonStyle()}>Edit</Button>,
        ].filter(Boolean)}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 1. Header Row: Overview + Actions */}
        <Row gutter={24}>
          <Col span={16}>
            <SectionCard title="Project & Location Overview" icon={<EnvironmentOutlined />}>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Project" span={2}><b>{log.project?.name}</b></Descriptions.Item>

                {log.drawingPanel ? (
                  <>
                    <Descriptions.Item label="Drawing">{log.drawingPanel.drawing?.drawing_number || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Panel"><b>{log.drawingPanel.panel_identifier}</b></Descriptions.Item>
                    <Descriptions.Item label="Dimensions" span={2}>
                      {(() => {
                        try {
                          const dims = JSON.parse(log.drawingPanel.coordinates_json || '{}')
                          const length = Number(dims.length || 0)
                          const depth = Number(dims.depth || dims.height || 0)
                          const width = Number(dims.width || 0)
                          const areaSqm = length * depth
                          const areaSqft = areaSqm * 10.764

                          return (
                            <Space direction="vertical" size={0}>
                              <Text>L: {length}m | D: {depth}m | W: {width}m</Text>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Area: {areaSqm.toFixed(2)} m² ({areaSqft.toFixed(2)} sqft)
                              </Text>
                            </Space>
                          )
                        } catch (e) {
                          return 'N/A'
                        }
                      })()}
                    </Descriptions.Item>
                  </>
                ) : (
                  <>
                    <Descriptions.Item label="Building">{log.toBuilding?.name || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Floor">{log.toFloor?.name || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Zone">{log.toZone?.name || 'N/A'}</Descriptions.Item>
                  </>
                )}

                <Descriptions.Item label="Reporting Date">{dayjs(log.transaction_date).format('DD-MMM-YYYY')}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={log.status === 'approved' ? 'success' : 'processing'}>{log.status.toUpperCase()}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </SectionCard>
          </Col>
          <Col span={8}>
            <SectionCard title="Report Actions" icon={<FileTextOutlined />}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Button
                  block
                  icon={<PrinterOutlined />}
                  onClick={() => handlePDFAction('inline')}
                  style={getSecondaryButtonStyle()}
                >
                  Print Pro Report
                </Button>
                <Button
                  block
                  icon={<FileTextOutlined />}
                  onClick={() => handlePDFAction('download')}
                  style={getPrimaryButtonStyle()}
                >
                  Download Pro PDF
                </Button>

                {log.status !== 'approved' && (
                  <Button
                    block
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={handleApprove}
                    loading={loading}
                    style={{ background: '#059669', borderColor: '#059669', color: '#fff', height: '40px', marginTop: '8px' }}
                  >
                    Approve & Sync Report
                  </Button>
                )}
              </Space>
            </SectionCard>
          </Col>
        </Row>

        {/* 2. Achievements & Consumption */}
        <SectionCard title="Activities & Consumption" icon={<FileTextOutlined />}>
          <Table
            dataSource={log.items}
            columns={materialColumns}
            pagination={false}
            rowKey="id"
            bordered
            size="middle"
          />
        </SectionCard>

        {/* 3. Manpower & Site Conditions */}
        <Row gutter={24}>
          <Col span={12}>
            <SectionCard title="Manpower Deployment (Labor Hajri)" icon={<TeamOutlined />}>
              <Table
                dataSource={manpowerList}
                size="small"
                pagination={false}
                rowKey={(r: any) => r.worker_type || Math.random()}
                columns={[
                  { title: 'Category', dataIndex: 'worker_type' },
                  { title: 'Count', dataIndex: 'count', align: 'center' },
                  { title: 'Hajri', dataIndex: 'hajri', align: 'center' },
                  { title: 'Mandays', align: 'right', render: (_, r: any) => (Number(r.count || 0) * Number(r.hajri || 0)).toFixed(1) }
                ]}
              />
            </SectionCard>
          </Col>
          <Col span={12}>
            <SectionCard title="Site Conditions" icon={<CloudOutlined />}>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Weather">{log.weather_condition || 'Clear'}</Descriptions.Item>
                <Descriptions.Item label="Work Hours">{log.work_hours || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Temperature">{log.temperature ? `${log.temperature}°C` : 'N/A'}</Descriptions.Item>
              </Descriptions>
            </SectionCard>
          </Col>
        </Row>

        {/* 4. Photos */}
        <SectionCard title="Site Progress Photos" icon={<CameraOutlined />}>
          <Row gutter={[12, 12]}>
            {photoList.length > 0 ? photoList.map((photo: any, idx: number) => {
              if (!photo) return null
              const photoUrl = typeof photo === 'string' ? photo : (photo.url || photo.response?.url)
              if (!photoUrl) return null
              const fullUrl = photoUrl?.startsWith('http') ? photoUrl : `http://localhost:5000/${photoUrl}`
              return (
                <Col span={6} key={idx}>
                  <Image
                    src={fullUrl}
                    style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    fallback="https://via.placeholder.com/300x200?text=Site+Photo"
                  />
                </Col>
              )
            }) : <Text type="secondary">No photos recorded for this report.</Text>}
          </Row>
        </SectionCard>

        {/* 5. Remarks */}
        <SectionCard title="Engineer's Site Remarks" icon={<Paragraph />}>
          <div style={{ fontSize: '15px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9', color: '#334155' }}>
            {log.remarks || 'Construction proceeding as per layout. All safety protocols followed.'}
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  )
}

export default DPRDetails
