import { useState, useEffect } from 'react'
import { Descriptions, Tag, Button, Table, Space, message, Row, Col, Typography, Image, List } from 'antd'
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
import { projectContactService } from '../../services/api/projectContacts'
import { getPrimaryButtonStyle, getSecondaryButtonStyle } from '../../styles/styleUtils'

const { Text, Paragraph } = Typography

const DPRDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState<any>(null)
  const [projectContacts, setProjectContacts] = useState<any[]>([])

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
      if (response.transaction?.project_id) {
        fetchProjectContacts(response.transaction.project_id)
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch report details')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectContacts = async (projectId: number) => {
    try {
      const res = await projectContactService.getProjectContacts(projectId)
      setProjectContacts(res.contacts || [])
    } catch (error) {
      console.error('Failed to fetch project contacts', error)
    }
  }

  if (!log) return null

  const safeParse = (data: any, fallback: any = []) => {
    if (!data) return fallback
    try {
      return typeof data === 'string' ? JSON.parse(data) : data
    } catch (e) {
      console.error('Failed to parse JSON:', e)
      return fallback
    }
  }

  const manpowerList = log.manpowerLogs && log.manpowerLogs.length > 0
    ? log.manpowerLogs
    : safeParse(log.manpower_data)
  const photoList = safeParse(log.progress_photos)

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
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <SectionCard title="Project & Location Overview" icon={<EnvironmentOutlined />}>
              <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="Project" span={2}><b>{log.project?.name}</b></Descriptions.Item>

                {log.drawingPanel ? (
                  <>
                    <Descriptions.Item label="Drawing">{log.drawingPanel.drawing?.drawing_number || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Panel"><b>{log.drawingPanel.panel_identifier}</b></Descriptions.Item>
                    <Descriptions.Item label="Dimensions" span={2}>
                      {(() => {
                        try {
                          const dims = JSON.parse(log.drawingPanel.coordinates_json || '{}')
                          const length = Number(log.drawingPanel.length || dims.length || 0)
                          const depth = Number(log.drawingPanel.design_depth || log.drawingPanel.depth || dims.depth || dims.height || 0)
                          const width = Number(log.drawingPanel.width || dims.width || 0)
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
          <Col xs={24} lg={8}>
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

        {/* 2. Achievements & Consumption (Only if items exist) */}
        {log.items && log.items.length > 0 && (
          <SectionCard title="Activities & Consumption" icon={<FileTextOutlined />}>
            <Table
              dataSource={log.items}
              columns={materialColumns}
              pagination={false}
              rowKey="id"
              bordered
              size="middle"
              scroll={{ x: 800 }}
            />
          </SectionCard>
        )}

        {/* 2B. Structural Progress (Execution QC) - Dynamic by Panel/Pile logs */}
        {(log.panelWorkLogs && log.panelWorkLogs.length > 0) && (
          <SectionCard title="Structural Progress (Panel Execution QC)" icon={<CheckCircleOutlined />}>
            <Table
              dataSource={log.panelWorkLogs}
              size="small"
              pagination={false}
              bordered
              rowKey="id"
              scroll={{ x: 1200 }}
              columns={[
                { title: 'Panel', dataIndex: 'panel_identifier', fixed: 'left', width: 100 },
                { title: 'Grab Depth', dataIndex: 'grabbing_depth', render: (v) => `${v || 0}m` },
                { title: 'Grab SQM', dataIndex: 'grabbing_sqm', render: (v) => `${v || 0} m²` },
                { title: 'Grab Time', render: (_, r: any) => <Text style={{ fontSize: 11 }}>{r.grabbing_start_time}-{r.grabbing_end_time}</Text> },
                { title: 'Conc. Time', render: (_, r: any) => <Text style={{ fontSize: 11 }}>{r.concrete_start_time}-{r.concrete_end_time}</Text> },
                { title: 'Grade', dataIndex: 'concrete_grade' },
                { title: 'Theoretical', dataIndex: 'theoretical_concrete_qty', render: (v) => `${v || 0} cum` },
                { title: 'Actual', dataIndex: 'actual_concrete_qty', render: (v) => <Text strong color="#0d9488">{v || 0} cum</Text> },
                { title: 'Cage ID', dataIndex: 'cage_id_ref' },
              ]}
            />
          </SectionCard>
        )}

        {(log.pileWorkLogs && log.pileWorkLogs.length > 0) && (
          <SectionCard title="Structural Progress (Pile Execution QC)" icon={<CheckCircleOutlined />}>
            <Table
              dataSource={log.pileWorkLogs}
              size="small"
              pagination={false}
              bordered
              rowKey="id"
              scroll={{ x: 1000 }}
              columns={[
                { title: 'Pile No', dataIndex: 'pile_identifier', fixed: 'left', width: 100 },
                { title: 'Achieved Depth', dataIndex: 'achieved_depth', render: (v) => `${v || 0}m` },
                { title: 'Rock Socket', dataIndex: 'rock_socket_length', render: (v) => `${v || 0}m` },
                { title: 'Work Time', render: (_, r: any) => <Text style={{ fontSize: 11 }}>{r.start_time}-{r.end_time}</Text> },
                { title: 'Conc. Poured', dataIndex: 'actual_concrete_qty', render: (v) => `${v || 0} cum` },
                { title: 'Grade', dataIndex: 'concrete_grade' },
                { title: 'Steel (MT)', dataIndex: 'steel_installed' },
                { title: 'Rig ID', dataIndex: 'rig_id' },
                { title: 'Slump', dataIndex: 'slump_test' },
              ]}
            />
          </SectionCard>
        )}

        {/* 2C. RMC Delivery Details (Only if logs exist) */}
        {log.rmcLogs && log.rmcLogs.length > 0 && (
          <SectionCard title="RMC Delivery Details" icon={<DashboardOutlined />}>
            <Table
              dataSource={log.rmcLogs || []}
              size="small"
              pagination={false}
              rowKey="id"
              bordered
              scroll={{ x: 'max-content' }}
              columns={[
                { title: 'Truck No', dataIndex: 'vehicle_no' },
                { title: 'Quantity', dataIndex: 'quantity', align: 'right', render: (v) => <b>{v} cum</b> },
                { title: 'Slump', dataIndex: 'slump', align: 'right' },
                { title: 'In-Out Time', render: (_, r: any) => <Text style={{ fontSize: 11 }}>{r.in_time || '-'} to {r.out_time || '-'}</Text> }
              ]}
            />
          </SectionCard>
        )}

        {/* 3. Manpower & Site Conditions */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <SectionCard title="Manpower Deployment (Labor Hajri)" icon={<TeamOutlined />}>
              <Table
                dataSource={manpowerList}
                size="small"
                pagination={false}
                rowKey={(r: any) => r.id || r.tempId || r.worker_type || Math.random()}
                scroll={{ x: 'max-content' }}
                columns={[
                  { title: 'Category', dataIndex: 'worker_type' },
                  { title: 'Count', dataIndex: 'count', align: 'center' },
                  { title: 'Hajri', dataIndex: 'hajri', align: 'center' },
                  { title: 'Mandays', align: 'right', render: (_, r: any) => (Number(r.count || 0) * Number(r.hajri || 0)).toFixed(1) }
                ]}
              />
            </SectionCard>
          </Col>
          <Col xs={24} lg={12}>
            <SectionCard title="Allocated Project Team (Current Site Management)" icon={<TeamOutlined />}>
              <List
                dataSource={projectContacts}
                size="small"
                renderItem={(member: any) => (
                  <List.Item style={{ padding: '8px 0' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: ['client_contact', 'decision_maker', 'accounts'].includes(member.contact_type) ? '#fee2e2' :
                            member.contact_type === 'labour_contractor' ? '#f0fdf4' : '#e0f2fe',
                          color: ['client_contact', 'decision_maker', 'accounts'].includes(member.contact_type) ? '#991b1b' :
                            member.contact_type === 'labour_contractor' ? '#166534' : '#0369a1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '11px'
                        }}>
                          {member.name?.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '12px' }}>{member.name}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>
                            {member.contact_type === 'labour_contractor' ? (member.company_name || 'Labour Contractor') : (member.contact_type?.replace('_', ' ') || member.designation)}
                          </div>
                        </div>
                        {member.contact_type === 'labour_contractor' && (
                          <Tag color="green" style={{ margin: 0, fontSize: '10px' }}>
                            L:{member.labour_count} H:{member.helper_count} O:{member.operator_count}
                          </Tag>
                        )}
                      </div>
                    </div>
                  </List.Item>
                )}
                locale={{ emptyText: 'No team data' }}
              />
            </SectionCard>
          </Col>
        </Row>

        {/* Machinery Breakdowns */}
        {(log.machinery_breakdowns || log.machineryBreakdownLogs?.length > 0) && (
          <SectionCard title="Machinery & Equipment Status" icon={<DashboardOutlined />}>
            <Table
              dataSource={log.machineryBreakdownLogs && log.machineryBreakdownLogs.length > 0
                ? log.machineryBreakdownLogs
                : safeParse(log.machinery_data, log.machinery_breakdowns || [])}
              size="small"
              pagination={false}
              bordered
              columns={[
                { title: 'Equipment', dataIndex: 'equipment_name' },
                { title: 'Type', dataIndex: 'equipment_type', render: (val: string) => <Tag>{val?.toUpperCase()}</Tag> },
                { title: 'Reg. No', dataIndex: 'registration_number' },
                { title: 'Start', dataIndex: 'breakdown_start' },
                { title: 'End', dataIndex: 'breakdown_end' },
                { title: 'Hours', dataIndex: 'breakdown_hours', align: 'right' },
                { title: 'Reason', dataIndex: 'breakdown_reason' },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (status: string) => (
                    <Tag color={status === 'resolved' ? 'success' : 'warning'}>{status?.toUpperCase()}</Tag>
                  )
                }
              ]}
            />
          </SectionCard>
        )}

        {/* Site Conditions */}
        <SectionCard title="Site Conditions" icon={<CloudOutlined />}>
          <Descriptions column={{ xs: 1, sm: 3 }} size="small" bordered>
            <Descriptions.Item label="Weather">{log.weather_condition || 'Clear'}</Descriptions.Item>
            <Descriptions.Item label="Work Hours">{log.work_hours || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Temperature">{log.temperature ? `${log.temperature}°C` : 'N/A'}</Descriptions.Item>
          </Descriptions>
        </SectionCard>

        {/* 4. Photos */}
        <SectionCard title="Site Progress Photos" icon={<CameraOutlined />}>
          <Row gutter={[12, 12]}>
            {photoList.length > 0 ? photoList.map((photo: any, idx: number) => {
              if (!photo) return null
              const photoUrl = typeof photo === 'string' ? photo : (photo.url || photo.response?.url)
              if (!photoUrl) return null
              const fullUrl = photoUrl?.startsWith('http') ? photoUrl : `http://localhost:5000/${photoUrl}`
              return (
                <Col xs={24} sm={12} md={8} lg={6} key={idx}>
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
    </PageContainer >
  )
}

export default DPRDetails
