import { useState, useEffect } from 'react'
import { Card, Descriptions, Tag, Button, Space, message, Row, Col, Typography, Divider } from 'antd'
import {
    ArrowLeftOutlined,
    EditOutlined,
    ProjectOutlined,
    PhoneOutlined,
    MailOutlined,
    EnvironmentOutlined,
    FileTextOutlined,
    UserOutlined,
    GlobalOutlined,
    InfoCircleOutlined,
    DownloadOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { leadService } from '../../services/api/leads'
import { quotationService } from '../../services/api/quotations'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import { theme } from '../../styles/theme'
import { getPrimaryButtonStyle, getSecondaryButtonStyle, flexBetweenStyle } from '../../styles/styleUtils'

const { Text } = Typography

const LeadDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [lead, setLead] = useState<any>(null)

    useEffect(() => {
        if (id) {
            fetchLead()
        }
    }, [id])

    const fetchLead = async () => {
        setLoading(true)
        try {
            const response = await leadService.getLead(Number(id))
            setLead(response.lead)
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch lead')
            navigate('/sales/leads')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            new: 'blue',
            contacted: 'cyan',
            qualified: 'green',
            converted: 'success',
            lost: 'red',
        }
        return colors[status] || 'default'
    }

    if (!lead) {
        return (
            <PageContainer>
                <Card loading={loading}>
                    <div style={{ padding: '50px', textAlign: 'center' }}>
                        <Text type="secondary">Loading lead details...</Text>
                    </div>
                </Card>
            </PageContainer>
        )
    }

    return (
        <PageContainer maxWidth={1200}>
            <PageHeader
                title={`Lead: ${lead.name}`}
                subtitle={`Enquiry Date: ${dayjs(lead.enquiry_date).format('DD MMMM YYYY')}`}
                icon={<UserOutlined />}
                extra={(
                    <Space wrap>
                        <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate('/sales/leads')} style={getSecondaryButtonStyle()}>Back</Button>
                        <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => navigate(`/sales/leads/${id}/edit`)} style={getPrimaryButtonStyle()}>Edit Lead</Button>
                    </Space>
                )}
            />

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                    {/* Main Info */}
                    <SectionCard title="Basic Information" icon={<InfoCircleOutlined />}>
                        <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle">
                            <Descriptions.Item label={<Text type="secondary">Name</Text>}>
                                <b>{lead.name}</b>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Company</Text>}>
                                {lead.client ? (
                                    <Space direction="vertical" size={0}>
                                        <Text strong>{lead.client.company_name}</Text>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>{lead.client.client_code}</Text>
                                    </Space>
                                ) : (
                                    <b>{lead.company_name || '-'}</b>
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Email</Text>}>
                                {lead.email ? (
                                    <a href={`mailto:${lead.email}`}><MailOutlined /> {lead.email}</a>
                                ) : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Phone</Text>}>
                                {lead.phone ? (
                                    <a href={`tel:${lead.phone}`}><PhoneOutlined /> {lead.phone}</a>
                                ) : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Address</Text>} span={2}>
                                <EnvironmentOutlined /> {lead.address || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Source</Text>}>
                                <Tag color="geekblue">{lead.source ? lead.source.toUpperCase() : 'UNKNOWN'}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Status</Text>}>
                                <Tag color={getStatusColor(lead.status)}>{lead.status.toUpperCase()}</Tag>
                            </Descriptions.Item>
                        </Descriptions>
                    </SectionCard>

                    {/* Project Info */}
                    <SectionCard title="Project Details" icon={<ProjectOutlined />} style={{ marginTop: '16px' }}>
                        {lead.project ? (
                            <Descriptions bordered column={1} size="small">
                                <Descriptions.Item label="Project Name">
                                    <Space>
                                        <Text strong>{lead.project.name}</Text>
                                        <Tag>{lead.project.project_code}</Tag>
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="Location">
                                    {lead.project.location || '-'}
                                </Descriptions.Item>
                            </Descriptions>
                        ) : (
                            <Text type="secondary">No project linked to this lead yet.</Text>
                        )}
                    </SectionCard>

                    {/* Docs */}
                    <SectionCard title="Documents" icon={<FileTextOutlined />} style={{ marginTop: '16px' }}>
                        <Space wrap size="large">
                            {lead.soil_report_url ? (
                                <Button icon={<DownloadOutlined />} href={lead.soil_report_url} target="_blank">Soil Report</Button>
                            ) : <Text type="secondary" disabled><MinusIcon /> Soil Report (N/A)</Text>}

                            {lead.layout_url ? (
                                <Button icon={<DownloadOutlined />} href={lead.layout_url} target="_blank">Layout Plan</Button>
                            ) : <Text type="secondary" disabled><MinusIcon /> Layout Plan (N/A)</Text>}

                            {lead.section_url ? (
                                <Button icon={<DownloadOutlined />} href={lead.section_url} target="_blank">Section Drawing</Button>
                            ) : <Text type="secondary" disabled><MinusIcon /> Section Drawing (N/A)</Text>}
                        </Space>
                    </SectionCard>

                    {lead.remarks && (
                        <SectionCard title="Remarks" icon={<FileTextOutlined />} style={{ marginTop: '16px' }}>
                            <div style={{ padding: '12px', background: theme.colors.neutral.gray50, borderRadius: '8px', border: `1px solid ${theme.colors.neutral.gray200}` }}>
                                <Text style={{ whiteSpace: 'pre-wrap' }}>{lead.remarks}</Text>
                            </div>
                        </SectionCard>
                    )}

                </Col>

                <Col xs={24} lg={8}>
                    <InfoCard title="Lead Stats" icon={<GlobalOutlined />}>
                        <div style={flexBetweenStyle}>
                            <Text type="secondary">Created At:</Text>
                            <Text>{dayjs(lead.created_at).format('DD MMM YYYY HH:mm')}</Text>
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div style={flexBetweenStyle}>
                            <Text type="secondary">Lead ID:</Text>
                            <Text strong>#{lead.id}</Text>
                        </div>
                    </InfoCard>

                    {lead.status !== 'converted' ? (
                        <Button
                            block
                            type="primary"
                            style={{ marginTop: '16px', height: '40px' }}
                            onClick={async () => {
                                if (lead.status === 'quoted') {
                                    try {
                                        const hide = message.loading('Preparing revision...', 0)
                                        const res = await quotationService.getQuotationsByLead(lead.id)
                                        const quotes = res.quotations || []
                                        if (quotes.length > 0) {
                                            const latest = quotes.sort((a: any, b: any) => b.version_number - a.version_number)[0]
                                            const revRes = await quotationService.reviseQuotation(latest.id)
                                            hide()
                                            message.success(`Creating Revision v${revRes.quotation.version_number}`)
                                            navigate(`/sales/quotations/${revRes.quotation.id}/edit`)
                                            return
                                        }
                                        hide()
                                    } catch (error) {
                                        message.error('Failed to create revision')
                                    }
                                }
                                navigate(`/sales/quotations/new?lead_id=${lead.id}`)
                            }}
                            icon={<FileTextOutlined />}
                            loading={loading}
                        >
                            {lead.status === 'quoted' ? 'Revise Quotation' : 'Generate Quotation'}
                        </Button>
                    ) : (
                        <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
                            <Text type="secondary" style={{ fontSize: '13px' }}>
                                <InfoCircleOutlined /> Lead is converted. Manage new quotes or revisions through the linked <b>Project</b>.
                            </Text>
                        </div>
                    )}

                    {lead.status !== 'converted' && lead.status !== 'lost' && (
                        <Button
                            block
                            style={{ marginTop: '12px', height: '40px', borderColor: theme.colors.success.main, color: theme.colors.success.main }}
                            onClick={async () => {
                                try {
                                    setLoading(true)
                                    const res = await quotationService.getQuotationsByLead(lead.id)
                                    const quotes = res.quotations || []

                                    if (quotes.length > 0) {
                                        const latest = quotes.sort((a: any, b: any) => b.version_number - a.version_number)[0]
                                        navigate(`/sales/quotations/${latest.id}`)
                                    } else {
                                        message.warning('Please create a quotation first to convert this lead.')
                                        navigate(`/sales/quotations/new?lead_id=${lead.id}`)
                                    }
                                } catch (error) {
                                    message.error('Failed to process conversion')
                                } finally {
                                    setLoading(false)
                                }
                            }}
                            icon={<ProjectOutlined />}
                            loading={loading}
                        >
                            Convert to Project
                        </Button>
                    )}
                </Col>
            </Row>
        </PageContainer>
    )
}

const MinusIcon = () => <span style={{ marginRight: 8 }}>-</span>

export default LeadDetails
