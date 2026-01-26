import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, message, Spin, Row, Col, Typography, Divider, Modal, Select, Tabs, Empty, Space } from 'antd'
import {
  ArrowLeftOutlined,
  ProjectOutlined,
  EnvironmentOutlined,
  BankOutlined,
  CalendarOutlined,
  UserOutlined,
  InfoCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  DownloadOutlined,
  ApartmentOutlined,
  HistoryOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { projectService } from '../../services/api/projects'
import { PageContainer, PageHeader, SectionCard } from '../../components/common/PremiumComponents'
import { getSecondaryButtonStyle, getPrimaryButtonStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'
import ProjectStructure from './ProjectStructure'
import ProjectPanels from './ProjectPanels'
import ProjectBOQManager from './ProjectBOQ'
import ProjectInventory from './ProjectInventory'

const { Text, Title } = Typography

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [structureView, setStructureView] = useState<'buildings' | 'panels'>('panels')

  useEffect(() => {
    if (id) {
      fetchProject()
    }
  }, [id])

  const fetchProject = async () => {
    setLoading(true)
    try {
      const response = await projectService.getProject(Number(id))
      setProject(response.project)
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch project')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!newStatus) return
    setUpdatingStatus(true)
    try {
      await projectService.updateProjectStatus(Number(id), newStatus)
      message.success('Project status updated successfully')
      setProject({ ...project, status: newStatus })
      setStatusModalVisible(false)
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      lead: 'blue',
      quotation: 'orange',
      confirmed: 'green',
      design: 'purple',
      mobilization: 'cyan',
      execution: 'geekblue',
      completed: 'success',
      on_hold: 'default',
    }
    return colors[status] || 'default'
  }

  const statusOptions = [
    { value: 'lead', label: 'LEAD' },
    { value: 'quotation', label: 'QUOTATION' },
    { value: 'confirmed', label: 'CONFIRMED' },
    { value: 'design', label: 'DESIGN' },
    { value: 'mobilization', label: 'MOBILIZATION' },
    { value: 'execution', label: 'EXECUTION' },
    { value: 'completed', label: 'COMPLETED' },
    { value: 'on_hold', label: 'ON HOLD' },
    { value: 'cancelled', label: 'CANCELLED' },
  ]

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text style={{ color: theme.colors.neutral.gray600 }}>Loading project details...</Text>
          </div>
        </div>
      </PageContainer>
    )
  }

  if (!project) {
    return (
      <PageContainer>
        <Card style={{ textAlign: 'center', padding: 50 }}>
          <InfoCircleOutlined style={{ fontSize: 48, color: theme.colors.neutral.gray400 }} />
          <Title level={4} style={{ marginTop: 16 }}>Project not found</Title>
          <Button
            type="primary"
            onClick={() => navigate('/sales/projects')}
            style={{ marginTop: 16, ...getPrimaryButtonStyle() }}
          >
            Back to Projects
          </Button>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div style={{ marginBottom: theme.spacing.lg }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/sales/projects')}
          size="large"
          style={getSecondaryButtonStyle()}
        >
          Back to Projects
        </Button>
      </div>

      <PageHeader
        title={project.name}
        subtitle={`Project Code: ${project.project_code}`}
        icon={<ProjectOutlined />}
      />

      <Tabs
        defaultActiveKey="overview"
        type="card"
        size="large"
        items={[
          {
            key: 'overview',
            label: (
              <span>
                <InfoCircleOutlined />
                Overview
              </span>
            ),
            children: (
              <>
                {/* Status and Quick Info */}
                <Card
                  style={{
                    marginBottom: theme.spacing.lg,
                    borderRadius: theme.borderRadius.md,
                    boxShadow: theme.shadows.base,
                    border: `1px solid ${theme.colors.neutral.gray100}`,
                  }}
                >
                  <Row gutter={[24, 24]} align="middle">
                    <Col xs={24} sm={12} md={6}>
                      <div>
                        <Text style={{ fontSize: 12, color: theme.colors.neutral.gray600, display: 'block' }}>
                          Status
                        </Text>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                          <Tag
                            color={getStatusColor(project.status)}
                            style={{
                              fontSize: 14,
                              padding: '4px 12px',
                              fontWeight: 600,
                              margin: 0
                            }}
                          >
                            {project.status.toUpperCase().replace('_', ' ')}
                          </Tag>
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => {
                              setNewStatus(project.status)
                              setStatusModalVisible(true)
                            }}
                          />
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <div>
                        <Text style={{ fontSize: 12, color: theme.colors.neutral.gray600, display: 'block' }}>
                          Location
                        </Text>
                        <Text strong style={{ fontSize: 16, marginTop: 8, display: 'block' }}>
                          {project.city || 'N/A'}, {project.state || 'N/A'}
                        </Text>
                      </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <div>
                        <Text style={{ fontSize: 12, color: theme.colors.neutral.gray600, display: 'block' }}>
                          Created By
                        </Text>
                        <Text strong style={{ fontSize: 16, marginTop: 8, display: 'block' }}>
                          {project.creator?.name || 'N/A'}
                        </Text>
                      </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <div>
                        <Text style={{ fontSize: 12, color: theme.colors.neutral.gray600, display: 'block' }}>
                          Created On
                        </Text>
                        <Text strong style={{ fontSize: 16, marginTop: 8, display: 'block' }}>
                          {new Date(project.created_at).toLocaleDateString('en-GB')}
                        </Text>
                      </div>
                    </Col>
                  </Row>
                </Card>

                {/* Detailed Information */}
                <Row gutter={24}>
                  <Col xs={24} lg={12}>
                    <SectionCard title="Basic Information" icon={<EnvironmentOutlined />}>
                      <Descriptions column={1} bordered size="middle">
                        <Descriptions.Item label={<Text strong>Project Code</Text>}>
                          <Text copyable>{project.project_code}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label={<Text strong>Project Name</Text>}>
                          {project.name}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Text strong>Location</Text>}>
                          {project.location || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Text strong>City</Text>}>
                          {project.city || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Text strong>State</Text>}>
                          {project.state || 'N/A'}
                        </Descriptions.Item>
                      </Descriptions>
                    </SectionCard>
                  </Col>


                  <Col xs={24} lg={12}>
                    <SectionCard title="Client & Compliance" icon={<BankOutlined />}>
                      <Descriptions column={1} bordered size="middle">
                        {project.client ? (
                          <>
                            <Descriptions.Item label={<Text strong>Client Name</Text>}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text strong style={{ fontSize: 15 }}>{project.client.company_name}</Text>
                                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                  <Text type="secondary" style={{ fontSize: 12 }}>{project.client.client_code}</Text>
                                  {project.client.group && (
                                    <Tag color="geekblue" style={{ margin: 0, fontSize: 11, lineHeight: '20px' }}>
                                      🏢 {project.client.group.group_name}
                                    </Tag>
                                  )}
                                </div>
                              </div>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text strong>Contact Person</Text>}>
                              {project.client.contacts && project.client.contacts.length > 0 ? (
                                (() => {
                                  const primary = project.client.contacts.find((c: any) => c.is_primary) || project.client.contacts[0]
                                  return (
                                    <div>
                                      <Text strong>{primary.contact_name}</Text>
                                      <div style={{ fontSize: 13, color: theme.colors.neutral.gray600 }}>
                                        {primary.email && <div>✉ {primary.email}</div>}
                                        {primary.phone && <div>☎ {primary.phone}</div>}
                                      </div>
                                      {project.client.contacts.length > 1 && (
                                        <Tag style={{ marginTop: 4 }}>+ {project.client.contacts.length - 1} others</Tag>
                                      )}
                                    </div>
                                  )
                                })()
                              ) : 'No contacts linked'}
                            </Descriptions.Item>
                          </>
                        ) : (
                          <Descriptions.Item label={<Text strong>Client</Text>}>
                            <Text type="secondary" italic>No Client Linked</Text>
                          </Descriptions.Item>
                        )}

                        <Descriptions.Item label={<Text strong>Client HO Address</Text>}>
                          {project.client_ho_address || project.client?.address || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Text strong>Client GSTIN</Text>}>
                          {(project.client_gstin || project.client?.gstin) ? (
                            <Text copyable>{project.client_gstin || project.client?.gstin}</Text>
                          ) : 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Text strong>RERA Number</Text>}>
                          {project.rera_number ? (
                            <Text copyable>{project.rera_number}</Text>
                          ) : 'N/A'}
                        </Descriptions.Item>
                      </Descriptions>
                    </SectionCard>
                  </Col>

                  <Col xs={24} lg={12}>
                    <SectionCard title="Project Timeline" icon={<CalendarOutlined />}>
                      <Descriptions column={1} bordered size="middle">
                        <Descriptions.Item label={<Text strong>Start Date</Text>}>
                          {project.start_date ? new Date(project.start_date).toLocaleDateString('en-GB') : 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Text strong>End Date</Text>}>
                          {project.end_date ? new Date(project.end_date).toLocaleDateString('en-GB') : 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Text strong>Contract Value</Text>}>
                          {project.contract_value ? (
                            <Text strong style={{ color: theme.colors.primary.main, fontSize: 16 }}>
                              ₹ {Number(project.contract_value).toLocaleString('en-IN')}
                            </Text>
                          ) : 'N/A'}
                        </Descriptions.Item>
                      </Descriptions>
                    </SectionCard>
                  </Col>

                  <Col xs={24} lg={12}>
                    <SectionCard title="System Information" icon={<UserOutlined />}>
                      <Descriptions column={1} bordered size="middle">
                        <Descriptions.Item label={<Text strong>Created By</Text>}>
                          {project.creator?.name || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Text strong>Created At</Text>}>
                          {new Date(project.created_at).toLocaleString('en-GB')}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Text strong>Last Updated</Text>}>
                          {new Date(project.updated_at).toLocaleString('en-GB')}
                        </Descriptions.Item>
                      </Descriptions>
                    </SectionCard>
                  </Col>

                  <Col xs={24} lg={12}>
                    <SectionCard title="Documents" icon={<FileTextOutlined />}>
                      <Title level={5} style={{ fontSize: 14, marginBottom: 12, color: theme.colors.neutral.gray600 }}>Lead Phase Documents</Title>
                      {project.leads?.length > 0 ? (
                        project.leads.map((lead: any) => (
                          <div key={lead.id} style={{ marginBottom: 16 }}>
                            {[
                              { file: lead.soil_report_url, name: 'Soil Report' },
                              { file: lead.layout_url, name: 'Layout Plan' },
                              { file: lead.section_url, name: 'Section Drawing' }
                            ].map((doc, idx) => doc.file ? (
                              <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px',
                                marginBottom: 8,
                                border: `1px solid ${theme.colors.neutral.gray200}`,
                                borderRadius: theme.borderRadius.sm,
                                background: theme.colors.neutral.gray50
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <FileTextOutlined style={{ fontSize: 20, color: theme.colors.primary.main }} />
                                  <div>
                                    <Text strong style={{ display: 'block' }}>{doc.name}</Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      Lead #{lead.id} • {new Date(lead.created_at).toLocaleDateString()}
                                    </Text>
                                  </div>
                                </div>
                                <Button
                                  type="link"
                                  href={`http://localhost:5000${doc.file}`}
                                  target="_blank"
                                  icon={<DownloadOutlined />}
                                />
                              </div>
                            ) : null)}
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '0 0 16px 0' }}>
                          <Text type="secondary">No linked leads found.</Text>
                        </div>
                      )}

                      <Divider style={{ margin: '12px 0' }} />

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Title level={5} style={{ fontSize: 14, margin: 0, color: theme.colors.neutral.gray600 }}>Project Phase Documents</Title>
                        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => message.info('Upload functionality coming soon')}>Upload</Button>
                      </div>

                      {project.documents?.length > 0 ? (
                        project.documents.map((doc: any) => (
                          <div key={doc.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px',
                            marginBottom: 8,
                            border: `1px solid ${theme.colors.neutral.gray200}`,
                            borderRadius: theme.borderRadius.sm,
                            background: theme.colors.neutral.gray50
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <FileTextOutlined style={{ fontSize: 20, color: theme.colors.primary.main }} />
                              <div>
                                <Text strong style={{ display: 'block' }}>{doc.document_name}</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {doc.document_type.toUpperCase()} • {new Date(doc.created_at).toLocaleDateString()}
                                </Text>
                              </div>
                            </div>
                            <Button
                              type="link"
                              href={`http://localhost:5000${doc.file_path}`}
                              target="_blank"
                              icon={<DownloadOutlined />}
                            />
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '8px 0' }}>
                          <Text type="secondary">No project documents found.</Text>
                        </div>
                      )}
                    </SectionCard>
                  </Col>
                </Row>

                {/* Action Buttons */}
                <Card
                  style={{
                    marginTop: theme.spacing.lg,
                    borderRadius: theme.borderRadius.md,
                    boxShadow: theme.shadows.md,
                    border: `1px solid ${theme.colors.neutral.gray100}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <Button
                      icon={<EditOutlined />}
                      size="large"
                      style={getPrimaryButtonStyle()}
                      onClick={() => navigate(`/sales/projects/${id}/edit`)}
                    >
                      Edit Project
                    </Button>
                  </div>
                </Card>
              </>
            )
          },
          {
            key: 'structure',
            label: (
              <span>
                <ApartmentOutlined />
                Physical Structure
              </span>
            ),
            children: (
              <>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                  <Space.Compact size="large">
                    <Button
                      type={structureView === 'panels' ? 'primary' : 'default'}
                      onClick={() => setStructureView('panels')}
                      icon={<ApartmentOutlined />}
                      style={{ width: 160 }}
                    >
                      D-Wall Panels
                    </Button>
                    <Button
                      type={structureView === 'buildings' ? 'primary' : 'default'}
                      onClick={() => setStructureView('buildings')}
                      icon={<BankOutlined />}
                      style={{ width: 160 }}
                    >
                      Buildings
                    </Button>
                  </Space.Compact>
                </div>

                {structureView === 'panels' ? (
                  <ProjectPanels projectId={Number(id)} />
                ) : (
                  <ProjectStructure
                    projectId={Number(id)}
                    initialHierarchy={project.buildings || []}
                    onUpdate={fetchProject}
                  />
                )}
              </>
            )
          },
          {
            key: 'boq',
            label: (
              <span>
                <FileTextOutlined />
                BOQ & Budget
              </span>
            ),
            children: (
              <ProjectBOQManager projectId={Number(id)} />
            )
          },
          {
            key: 'inventory',
            label: (
              <span>
                <HistoryOutlined />
                Inventory & Store
              </span>
            ),
            children: (
              <ProjectInventory projectId={Number(id)} />
            )
          },
          {
            key: 'team',
            label: (
              <span>
                <TeamOutlined />
                Team & Vendors
              </span>
            ),
            children: (
              <Card>
                <Empty description="Project team assignment coming soon" />
              </Card>
            )
          }
        ]}
      />

      {/* Status Update Modal */}
      <Modal
        title="Update Project Status"
        open={statusModalVisible}
        onOk={handleStatusUpdate}
        onCancel={() => setStatusModalVisible(false)}
        confirmLoading={updatingStatus}
      >
        <div style={{ padding: '8px 0' }}>
          <Text style={{ display: 'block', marginBottom: 8 }}>Select the new status for this project:</Text>
          <Select
            style={{ width: '100%' }}
            value={newStatus}
            onChange={setNewStatus}
            options={statusOptions}
            size="large"
          />
        </div>
      </Modal>
    </PageContainer>
  )
}

export default ProjectDetails
